const { programDays, coreCourses } = require("../../utils/data");
const { getState, patchState, updateCheck, calculateScore, today } = require("../../utils/store");

Page({
  data: {
    day: 1,
    check: {},
    score: {},
    group: {},
    message: "",
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = getState();
    const day = Number(wx.getStorageSync("life-restart-active-day")) || 1;
    const check = state.checks[day] || {};
    const score = calculateScore(state, coreCourses, programDays);
    const group = state.group || { name: "一组", role: "组员" };
    const message = [
      `【第 ${day} 天小组统计】`,
      `日期：${today()}`,
      `小组：${group.name || "一组"}｜角色：${group.role || "组员"}`,
      "",
      `个人打卡：${check.completed ? "已完成，个人 +10" : "未完成，可先真实记录"}`,
      `小组满勤：${check.groupFullAttendance ? "是，+30" : "否"}`,
      `补打卡使用：${score.makeupDays}/3`,
      "",
      `个人积分：${score.dailyScore + score.courseScore}`,
      `小组加分：${score.groupScore}`,
      `当前总分：${score.totalScore}`,
      "",
      "明日提醒：22:00 前完成真实、简洁、可持续的打卡；没做到也要记录。",
    ].join("\n");
    this.setData({ day, check, score, group, message });
  },

  toggleGroupFull() {
    updateCheck(this.data.day, { groupFullAttendance: !this.data.check.groupFullAttendance });
    this.refresh();
  },

  toggleMakeup() {
    if (!this.data.check.makeup && this.data.score.makeupDays >= 3) {
      wx.showToast({ title: "补打卡最多 3 次", icon: "none" });
      return;
    }
    updateCheck(this.data.day, { makeup: !this.data.check.makeup });
    this.refresh();
  },

  updateGroup(event) {
    const key = event.currentTarget.dataset.key;
    const value = event.detail.value;
    patchState((state) => ({
      ...state,
      group: {
        ...(state.group || {}),
        [key]: value,
      },
    }));
    this.refresh();
  },

  copyMessage() {
    wx.setClipboardData({
      data: this.data.message,
      success: () => wx.showToast({ title: "已复制", icon: "success" }),
    });
  },
});
