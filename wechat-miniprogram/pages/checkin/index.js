const { checkinModes } = require("../../utils/data");
const { getState, updateCheck } = require("../../utils/store");

function buildMessage(mode, values, day) {
  const lines = [
    mode.identity.replace("{days}", day),
    "",
    `【${mode.title}】`,
    `提交时间：${mode.deadline}`,
    "",
  ];
  mode.prompts.forEach((prompt, index) => {
    lines.push(`${index + 1}. ${prompt[1]}`);
    lines.push(values[prompt[0]] || "（待填写）");
    lines.push("");
  });
  lines.push(mode.closing);
  return lines.join("\n").trim();
}

function buildModeViews(activeModeId) {
  return checkinModes.map((mode) => ({
    ...mode,
    active: mode.id === activeModeId,
  }));
}

Page({
  data: {
    day: 1,
    modes: buildModeViews(checkinModes[0].id),
    activeModeId: checkinModes[0].id,
    activeMode: checkinModes[0],
    prompts: [],
    values: {},
    generatedText: "",
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = getState();
    const day = Number(wx.getStorageSync("life-restart-active-day")) || 1;
    const check = state.checks[day] || {};
    const activeMode = checkinModes.find((mode) => mode.id === this.data.activeModeId) || checkinModes[0];
    const values = (check.checkinTemplates && check.checkinTemplates[activeMode.id]) || {};
    const prompts = activeMode.prompts.map((prompt) => ({
      key: prompt[0],
      label: prompt[1],
      helper: prompt[2],
      value: values[prompt[0]] || "",
    }));
    this.setData({
      day,
      modes: buildModeViews(this.data.activeModeId),
      activeMode,
      values,
      prompts,
      generatedText: buildMessage(activeMode, values, day),
    });
  },

  switchMode(event) {
    this.setData({ activeModeId: event.currentTarget.dataset.id });
    this.refresh();
  },

  updateField(event) {
    const key = event.currentTarget.dataset.key;
    const values = {
      ...this.data.values,
      [key]: event.detail.value,
    };
    const state = getState();
    const check = state.checks[this.data.day] || {};
    updateCheck(this.data.day, {
      checkinTemplates: {
        ...(check.checkinTemplates || {}),
        [this.data.activeMode.id]: values,
      },
    });
    this.refresh();
  },

  copyText() {
    wx.setClipboardData({
      data: this.data.generatedText,
      success: () => wx.showToast({ title: "已复制", icon: "success" }),
    });
  },

  backHome() {
    wx.navigateBack({ delta: 1 });
  },
});
