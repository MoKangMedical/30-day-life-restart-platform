const { systems, programDays, coreCourses, sleepScoreItems, sleepHomeworkPrompts, kitchenAuditItems } = require("../../utils/data");
const { getState, patchState, updateCheck, calculateScore, today } = require("../../utils/store");

const msPerDay = 24 * 60 * 60 * 1000;

const dailySparkCards = [
  {
    title: "先动身体，再处理事情",
    body: "今天不要先证明自己很努力，先让身体回到可执行状态。",
    action: "站起来喝水，做 10 次深呼吸，再开始第一个任务。",
  },
  {
    title: "只赢一个小回合",
    body: "系统不是靠一天翻盘，而是靠每天拿回一个小回合。",
    action: "从任务列表里选最小的一项，完成后再写复盘。",
  },
  {
    title: "真实记录就是进步",
    body: "没做到也要记录。失联才会让系统断线。",
    action: "把今天最真实的一句话写进输出区，不修饰。",
  },
  {
    title: "不要平均用力",
    body: "今天的注意力只需要保护一个关键动作。",
    action: "写下今天最重要的一件事，并给它安排开始时间。",
  },
  {
    title: "让环境替你坚持",
    body: "自律不是硬扛，而是降低下一步行动的摩擦。",
    action: "把会干扰你的一个入口移远，至少 30 分钟。",
  },
  {
    title: "把焦虑翻译成动作",
    body: "焦虑通常不是问题本身，而是问题没有被拆小。",
    action: "把一个焦虑改写成：地点、时间、动作、完成标准。",
  },
  {
    title: "今天只做可复盘的事",
    body: "可复盘的行动，才会进入你的个人运行系统。",
    action: "完成后写一句：发生了什么，下一次怎么调整。",
  },
];

const rewardMilestones = [
  { day: 1, title: "启动徽章" },
  { day: 3, title: "不断线徽章" },
  { day: 7, title: "第一周徽章" },
  { day: 14, title: "节律徽章" },
  { day: 21, title: "升级徽章" },
  { day: 30, title: "重启徽章" },
];

function dayFromStart(startDate) {
  const [startYear, startMonth, startDay] = String(startDate || today()).split("-").map(Number);
  const [nowYear, nowMonth, nowDay] = today().split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, startDay).getTime();
  const now = new Date(nowYear, nowMonth - 1, nowDay).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(now)) {
    return 1;
  }
  return Math.min(30, Math.max(1, Math.floor((now - start) / msPerDay) + 1));
}

function buildDayCells(activeDay) {
  return programDays.map((day) => ({
    ...day,
    active: day.day === activeDay,
  }));
}

function buildTaskRows(todayProgram, check) {
  const tasks = todayProgram && todayProgram.tasks ? todayProgram.tasks : [];
  return tasks.map((task) => ({
    name: task,
    done: Boolean(check.tasks && check.tasks[task]),
  }));
}

function calculateStreak(checks) {
  let streak = 0;
  for (let day = 1; day <= 30; day += 1) {
    if (checks[day] && checks[day].completed) {
      streak += 1;
    } else if (streak > 0) {
      break;
    }
  }
  return streak;
}

function getDailySpark(activeDay, offset) {
  return dailySparkCards[(activeDay + offset - 1) % dailySparkCards.length];
}

function getNextReward(streak) {
  return rewardMilestones.find((reward) => reward.day > streak) || rewardMilestones[rewardMilestones.length - 1];
}

function buildEngagement(activeDay, todayProgram, check, taskDoneCount, state) {
  const taskTotal = todayProgram.tasks.length;
  const taskPercent = taskTotal ? Math.round((taskDoneCount / taskTotal) * 100) : 0;
  const streak = calculateStreak(state.checks || {});
  const nextReward = getNextReward(streak);
  const nextProgram = programDays[Math.min(activeDay, 29)] || programDays[29];
  const activeSystem = systems.find((system) => system.id === todayProgram.systemId) || systems[0];
  const sparkOffset = Number(check.sparkOffset || 0);
  const spark = getDailySpark(activeDay, sparkOffset);
  const sparkOpened = Boolean(check.sparkOpened);

  return {
    systemName: activeSystem.name,
    headline: check.completed ? "今天已经点亮，保持记录不断线" : `今天先完成 ${Math.max(taskTotal - taskDoneCount, 0) || 1} 个可检查动作`,
    body: check.completed ? "完成不是结束，写下真实复盘，明天会更容易进入状态。" : `${todayProgram.title}：先小后大，先发生再优化。`,
    taskPercent,
    streak,
    nextRewardTitle: nextReward.title,
    nextRewardLeft: Math.max(nextReward.day - streak, 0),
    ritualSteps: [
      {
        key: "ritualStarted",
        order: "01",
        title: "开启今日",
        body: "先进入训练状态",
        active: Boolean(check.ritualStarted),
        disabled: false,
      },
      {
        key: "sparkOpened",
        order: "02",
        title: "打开锦囊",
        body: "领取一个小动作",
        active: sparkOpened,
        disabled: false,
      },
      {
        key: "rewardClaimed",
        order: "03",
        title: "领取徽章",
        body: check.completed ? "完成后收束当天" : "完成打卡后解锁",
        active: Boolean(check.rewardClaimed),
        disabled: !check.completed,
      },
    ],
    sparkTitle: sparkOpened ? spark.title : "今日锦囊未打开",
    sparkBody: sparkOpened ? spark.body : "每天给自己一个微动作，打开后再开始写作业。",
    sparkAction: sparkOpened ? spark.action : "打开后显示今天的具体行动。",
    sparkButton: sparkOpened ? "换一张" : "打开",
    rewards: rewardMilestones.map((reward) => ({
      ...reward,
      earned: reward.day <= streak,
    })),
    tomorrow: {
      day: nextProgram.day,
      title: nextProgram.title,
      lesson: nextProgram.lesson,
    },
  };
}

function calculateSleepScore(check) {
  const scores = check.sleepScores || {};
  return sleepScoreItems.reduce((sum, item) => sum + Number(scores[item.key] || 0), 0);
}

function sleepFeedback(total) {
  if (total >= 85) return "系统稳定：今晚保留现有结构，只做轻微优化。";
  if (total >= 60) return "基本可用：优先修正最低分项，不要一次改太多。";
  return "先救底盘：今晚只做一个最小动作。";
}

function buildSleepRows(check) {
  const scores = check.sleepScores || {};
  return sleepScoreItems.map((item) => ({
    ...item,
    value: Number(scores[item.key] || 0),
    options: [
      { label: "0分", value: 0, active: Number(scores[item.key] || 0) === 0 },
      { label: "一半", value: item.half, active: Number(scores[item.key] || 0) === item.half },
      { label: "满分", value: item.max, active: Number(scores[item.key] || 0) === item.max },
    ],
  }));
}

function buildKitchenRows(check) {
  const audit = check.kitchenAudit || {};
  return kitchenAuditItems.map((item) => ({
    ...item,
    done: Boolean(audit[item.key]),
  }));
}

function buildSleepHomeworkRows(check) {
  const homework = check.sleepHomework || {};
  return sleepHomeworkPrompts.map((item) => ({
    ...item,
    value: homework[item.key] || "",
  }));
}

Page({
  data: {
    activeDay: 1,
    programDays: buildDayCells(1),
    todayProgram: programDays[0],
    check: {},
    startDate: today(),
    score: {},
    taskDoneCount: 0,
    engagement: buildEngagement(1, programDays[0], {}, 0, { checks: {} }),
    sleepTotal: 0,
    sleepFeedback: sleepFeedback(0),
    sleepRows: buildSleepRows({}),
    sleepHomeworkRows: buildSleepHomeworkRows({}),
    kitchenRows: buildKitchenRows({}),
    kitchenDoneCount: 0,
    kitchenPlan: {},
    navItems: [
      { title: "打卡模式", body: "生成每日群发文案", url: "/pages/checkin/index", tab: true },
      { title: "八大系统", body: "查看个人运行系统", url: "/pages/systems/index", tab: true },
      { title: "体系课程", body: "理论课与语音概要", url: "/pages/courses/index", tab: true },
      { title: "小组场域", body: "积分、补卡与组长统计", url: "/pages/group/index", tab: true },
      { title: "平台说明", body: "使用边界、隐私与健康说明", url: "/pages/about/index", tab: false },
    ],
    taskRows: buildTaskRows(programDays[0], {}),
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = getState();
    const activeDay = dayFromStart(state.startDate);
    const todayProgram = programDays[activeDay - 1] || programDays[0];
    const check = state.checks[activeDay] || {};
    const taskDoneCount = todayProgram.tasks.filter((task) => check.tasks && check.tasks[task]).length;
    wx.setStorageSync("life-restart-active-day", activeDay);
    this.setData({
      activeDay,
      startDate: state.startDate,
      programDays: buildDayCells(activeDay),
      todayProgram,
      check,
      taskDoneCount,
      engagement: buildEngagement(activeDay, todayProgram, check, taskDoneCount, state),
      taskRows: buildTaskRows(todayProgram, check),
      sleepTotal: calculateSleepScore(check),
      sleepFeedback: sleepFeedback(calculateSleepScore(check)),
      sleepRows: buildSleepRows(check),
      sleepHomeworkRows: buildSleepHomeworkRows(check),
      kitchenRows: buildKitchenRows(check),
      kitchenDoneCount: buildKitchenRows(check).filter((item) => item.done).length,
      kitchenPlan: check.kitchenPlan || {},
      score: calculateScore(state, coreCourses, programDays),
    });
  },

  selectDay(event) {
    const activeDay = Number(event.currentTarget.dataset.day);
    const state = getState();
    const todayProgram = programDays[activeDay - 1] || programDays[0];
    const check = state.checks[activeDay] || {};
    const taskDoneCount = todayProgram.tasks.filter((task) => check.tasks && check.tasks[task]).length;
    wx.setStorageSync("life-restart-active-day", activeDay);
    this.setData({
      activeDay,
      programDays: buildDayCells(activeDay),
      todayProgram,
      check,
      taskDoneCount,
      engagement: buildEngagement(activeDay, todayProgram, check, taskDoneCount, state),
      taskRows: buildTaskRows(todayProgram, check),
      sleepTotal: calculateSleepScore(check),
      sleepFeedback: sleepFeedback(calculateSleepScore(check)),
      sleepRows: buildSleepRows(check),
      sleepHomeworkRows: buildSleepHomeworkRows(check),
      kitchenRows: buildKitchenRows(check),
      kitchenDoneCount: buildKitchenRows(check).filter((item) => item.done).length,
      kitchenPlan: check.kitchenPlan || {},
    });
  },

  changeStartDate(event) {
    patchState((state) => ({
      ...state,
      startDate: event.detail.value || today(),
    }));
    this.refresh();
  },

  setMetric(event) {
    const key = event.currentTarget.dataset.key;
    updateCheck(this.data.activeDay, { [key]: event.detail.value });
    this.refresh();
  },

  toggleTask(event) {
    const task = event.currentTarget.dataset.task;
    const currentTasks = this.data.check.tasks || {};
    updateCheck(this.data.activeDay, {
      tasks: {
        ...currentTasks,
        [task]: !currentTasks[task],
      },
    });
    this.refresh();
  },

  updateText(event) {
    const key = event.currentTarget.dataset.key;
    updateCheck(this.data.activeDay, { [key]: event.detail.value });
    this.refresh();
  },

  updateIntention(event) {
    updateCheck(this.data.activeDay, { intention: event.detail.value });
    this.refresh();
  },

  tapRitualStep(event) {
    const key = event.currentTarget.dataset.key;
    const disabled = event.currentTarget.dataset.disabled === true || event.currentTarget.dataset.disabled === "true";
    if (disabled) {
      wx.showToast({ title: "完成打卡后领取", icon: "none" });
      return;
    }
    if (key === "sparkOpened") {
      updateCheck(this.data.activeDay, {
        sparkOpened: true,
        sparkOffset: Number(this.data.check.sparkOffset || 0),
      });
    } else {
      updateCheck(this.data.activeDay, { [key]: true });
    }
    this.refresh();
  },

  changeSpark() {
    updateCheck(this.data.activeDay, {
      sparkOpened: true,
      sparkOffset: Number(this.data.check.sparkOffset || 0) + 1,
    });
    this.refresh();
  },

  setSleepScore(event) {
    const key = event.currentTarget.dataset.key;
    const value = Number(event.currentTarget.dataset.value || 0);
    updateCheck(this.data.activeDay, {
      sleepScores: {
        ...(this.data.check.sleepScores || {}),
        [key]: value,
      },
    });
    this.refresh();
  },

  updateSleepHomework(event) {
    const key = event.currentTarget.dataset.key;
    updateCheck(this.data.activeDay, {
      sleepHomework: {
        ...(this.data.check.sleepHomework || {}),
        [key]: event.detail.value,
      },
    });
    this.refresh();
  },

  toggleKitchenAudit(event) {
    const key = event.currentTarget.dataset.key;
    updateCheck(this.data.activeDay, {
      kitchenAudit: {
        ...(this.data.check.kitchenAudit || {}),
        [key]: !(this.data.check.kitchenAudit && this.data.check.kitchenAudit[key]),
      },
    });
    this.refresh();
  },

  updateKitchenPlan(event) {
    const key = event.currentTarget.dataset.key;
    updateCheck(this.data.activeDay, {
      kitchenPlan: {
        ...(this.data.check.kitchenPlan || {}),
        [key]: event.detail.value,
      },
    });
    this.refresh();
  },

  completeDay() {
    const allTasks = {};
    this.data.todayProgram.tasks.forEach((task) => {
      allTasks[task] = true;
    });
    updateCheck(this.data.activeDay, {
      tasks: {
        ...(this.data.check.tasks || {}),
        ...allTasks,
      },
      completed: true,
      completedAt: new Date().toISOString(),
    });
    wx.showToast({ title: "今日已完成", icon: "success" });
    this.refresh();
  },

  go(event) {
    const url = event.currentTarget.dataset.url;
    const isTab = event.currentTarget.dataset.tab === true || event.currentTarget.dataset.tab === "true";
    if (isTab) {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  },
});
