const STORAGE_KEY = "life-restart-30-miniprogram";

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultState() {
  return {
    startDate: today(),
    checks: {},
    courses: {},
    group: {
      name: "一组",
      role: "组员",
      members: "",
      leaderboard: "",
      review: "",
    },
  };
}

function getState() {
  const base = defaultState();
  const stored = wx.getStorageSync(STORAGE_KEY);
  if (!stored || typeof stored !== "object") {
    return base;
  }
  return {
    ...base,
    ...stored,
    startDate: stored.startDate || base.startDate,
    checks: stored.checks || {},
    courses: stored.courses || {},
    group: {
      ...base.group,
      ...(stored.group || {}),
    },
  };
}

function setState(next) {
  wx.setStorageSync(STORAGE_KEY, next);
  return next;
}

function patchState(patcher) {
  const current = getState();
  const next = typeof patcher === "function" ? patcher(current) : { ...current, ...patcher };
  return setState(next);
}

function updateCheck(day, patch) {
  return patchState((state) => ({
    ...state,
    checks: {
      ...state.checks,
      [day]: {
        ...(state.checks[day] || {}),
        ...patch,
      },
    },
  }));
}

function resetState() {
  wx.removeStorageSync(STORAGE_KEY);
  return defaultState();
}

function calculateScore(state, coreCourses, programDays) {
  const completedDays = programDays.filter((day) => state.checks[day.day] && state.checks[day.day].completed).length;
  const completedCourses = coreCourses.filter((course) => state.courses[course.id]).length;
  const groupFullDays = programDays.filter((day) => state.checks[day.day] && state.checks[day.day].groupFullAttendance).length;
  const makeupDays = programDays.filter((day) => state.checks[day.day] && state.checks[day.day].makeup).length;
  const dailyScore = completedDays * 10;
  const courseScore = completedCourses * 20;
  const groupScore = groupFullDays * 30;
  return {
    completedDays,
    completedCourses,
    groupFullDays,
    makeupDays,
    dailyScore,
    courseScore,
    groupScore,
    totalScore: dailyScore + courseScore + groupScore,
  };
}

module.exports = {
  today,
  getState,
  setState,
  patchState,
  updateCheck,
  resetState,
  calculateScore,
};
