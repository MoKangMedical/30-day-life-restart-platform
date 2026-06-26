import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Copy,
  Flame,
  Gift,
  Headphones,
  LineChart,
  MessageCircle,
  MonitorPlay,
  Moon,
  NotebookPen,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Target,
  TimerReset,
  Utensils,
  WalletCards,
} from "lucide-react";
import {
  commitments,
  checkinModes,
  courseTheory,
  coreCourses,
  dailyRules,
  kitchenSystem,
  nutrition,
  programDays,
  sleepScoreModel,
  systems,
  zenCourses,
} from "./data.js";
import {
  academyDelivery,
  academyMethod,
  academyPhases,
  academyStats,
  bookCourseTracks,
  lessonContentDetails,
  systemCourseCatalog,
} from "./systemCourses.js";

const STORAGE_KEY = "life-restart-30-platform-v1";
const msPerDay = 24 * 60 * 60 * 1000;

function assetPath(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

const iconMap = {
  Activity,
  CalendarDays,
  Target,
  RefreshCw,
  Brain,
  MessageCircle,
  WalletCards,
  Sparkles,
};

const viewLabels = [
  { id: "dashboard", label: "今天要做" },
  { id: "nutrition", label: "睡眠饮食" },
  { id: "courses", label: "系统课程" },
  { id: "learning", label: "学习路径" },
  { id: "group", label: "群内打卡" },
  { id: "systems", label: "八大系统" },
  { id: "theory", label: "为什么练" },
];

function getLocalDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dateFromIso(iso) {
  return new Date(`${iso}T00:00:00`);
}

function addDays(iso, amount) {
  const date = dateFromIso(iso);
  date.setDate(date.getDate() + amount);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  return Math.floor((dateFromIso(end) - dateFromIso(start)) / msPerDay);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function contentId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDefaultState() {
  const today = getLocalDate();
  return {
    startDate: today,
    checks: {},
    courses: {},
    courseWork: {},
    engagement: {},
    pledgeAccepted: false,
    group: {
      name: "一组",
      role: "组员",
      members: "",
      leaderboard: "",
      review: "",
    },
  };
}

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
  { day: 1, title: "启动徽章", body: "你已经让系统开始运转。" },
  { day: 3, title: "不断线徽章", body: "连续三天后，行动开始有惯性。" },
  { day: 7, title: "第一周徽章", body: "第一轮复盘会让改变变得清楚。" },
  { day: 14, title: "节律徽章", body: "两周后，节律开始替代临时意志。" },
  { day: 21, title: "升级徽章", body: "学习和复盘正在变成能力。" },
  { day: 30, title: "重启徽章", body: "你完成了一轮个人运行系统重建。" },
];

const promoVideoScenes = [
  {
    title: "打开后先知道今天做什么",
    body: "首页给出下一步动作，不要求用户先理解完整体系。",
  },
  {
    title: "每天完成打卡与复盘",
    body: "从承诺、任务、输出到睡眠饮食评分，形成可记录闭环。",
  },
  {
    title: "课程和书籍变成行动",
    body: "8 个系统、32 节课、24 节书籍转化课，都对应具体作业。",
  },
];

const systemOrbitPositions = [
  [50, 13],
  [76, 22],
  [84, 48],
  [76, 78],
  [50, 87],
  [24, 78],
  [16, 48],
  [24, 22],
];

const systemMapLayers = [
  {
    label: "底盘稳定层",
    systems: "身心能量 · 节律秩序",
    body: "先把身体、睡眠、作息和执行环境稳定下来，让改变有承载力。",
  },
  {
    label: "行动闭环层",
    systems: "目标行动 · 反馈进化",
    body: "把模糊愿望拆成当天动作，再用复盘修正判断和下一步。",
  },
  {
    label: "认知外化层",
    systems: "认知学习 · 沟通关系",
    body: "把知识变成模型，把模型变成表达、协作和真实影响力。",
  },
  {
    label: "长期方向层",
    systems: "价值资源 · 身份意义",
    body: "用价值排序和身份承诺决定做什么、不做什么，以及为什么持续做。",
  },
];

const academyBoutiqueTracks = [
  {
    label: "Core Studio",
    title: "系统核心课",
    body: "每个系统 4 节理论课，按问题、模型、案例、作业组织，适合从零建立方法论。",
    metric: "8 个系统 · 32 节课",
    target: "lesson-workbench",
  },
  {
    label: "Book Lab",
    title: "书籍转化课",
    body: "把热门书籍中的模型转成课程作业，不做读书摘抄，只保留可执行训练。",
    metric: "24 节精读转化",
    target: "book-course-library",
  },
  {
    label: "Daily Lab",
    title: "日课实验室",
    body: "每天用打卡、锦囊、徽章和群发作业完成一次小实验，让学习进入真实生活。",
    metric: "30 天训练闭环",
    target: "course-action-plan",
  },
];

const brandVisualGuidelines = {
  palette: [
    ["Midnight Blue", "#102936", "主视觉、按钮、深色仪式区"],
    ["Institute Navy", "#17324f", "标题、导航、课程重点"],
    ["Sage Green", "#4f8065", "成长、完成、正向反馈"],
    ["Champagne", "#efe2c8", "高端点缀、徽章、关键行动"],
    ["Porcelain", "#fbfcfa", "页面底色、留白区域"],
  ],
  principles: [
    ["一屏一个主行动", "首屏只强化今日要做什么，其余信息向下展开。"],
    ["系统感大于装饰感", "视觉资产优先表达八大系统、路径、闭环，而不是堆叠卡片。"],
    ["深色用于仪式感", "只有重启舱、研究院、关键定义区使用深色，避免全站压抑。"],
    ["浅色用于长期使用", "打卡、课程、输入、复盘保持安静清晰，适合每天打开。"],
  ],
  components: [
    ["Reset Cabin", "深色主视觉、今日指令、阶段卡、闭环进度。"],
    ["System Orbit", "八大系统图谱、中心核心、四层解释、当前系统定义。"],
    ["Institute Shelf", "精品课程陈列、研究院路径、系统课和书籍课入口。"],
    ["Ritual Flow", "开启、锦囊、徽章、明日预告形成连续体验。"],
  ],
};

const promoVideoScript = [
  "欢迎来到 30 天重建人生体系。",
  "这个平台不是让你收藏更多知识，而是每天告诉你下一步该做什么。",
  "你会从今日行动台开始：确认承诺、开启今天、完成最小任务、写下输出和复盘。",
  "如果身体状态不稳，可以进入睡眠饮食评分，找到明天最值得优化的一步。",
  "如果想系统学习，可以进入 8 个个人运行系统课程：身心、节律、目标、反馈、学习、关系、价值和身份。",
  "每节课都有讲义、案例、误区、步骤和作业；热门书籍也会被转化成可以执行的训练。",
  "小组打卡、积分、补卡和群发文案，会帮助你保持不断线。",
  "30 天后，你留下的不是一堆打卡记录，而是一套能继续运行的人生系统。",
].join("\n");

function useStoredState() {
  const [state, setState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return createDefaultState();
      return { ...createDefaultState(), ...JSON.parse(stored) };
    } catch {
      return createDefaultState();
    }
  });

  const updateState = (producer) => {
    setState((current) => {
      const next = typeof producer === "function" ? producer(current) : producer;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return [state, updateState];
}

function calculateStreak(checks) {
  let streak = 0;
  for (let day = 1; day <= 30; day += 1) {
    if (checks[day]?.completed) streak += 1;
    else if (streak > 0) break;
  }
  return streak;
}

function calculateScore(state) {
  const completedDays = programDays.filter((day) => state.checks[day.day]?.completed).length;
  const completedCourses = coreCourses.filter((course) => state.courses[course.id]).length;
  const groupFullDays = programDays.filter((day) => state.checks[day.day]?.groupFullAttendance).length;
  const makeupDays = programDays.filter((day) => state.checks[day.day]?.makeup).length;
  const dailyScore = completedDays * 10;
  const courseScore = completedCourses * 20;
  const groupScore = groupFullDays * 30;

  return {
    completedDays,
    completedCourses,
    dailyScore,
    courseScore,
    groupFullDays,
    groupScore,
    makeupDays,
    totalScore: dailyScore + courseScore + groupScore,
  };
}

function calculateSystemCourseProgress(courseWork = {}) {
  const totalLessons = systemCourseCatalog.reduce((sum, course) => sum + course.lessons.length, 0);
  const completedLessons = systemCourseCatalog.reduce((sum, course) => {
    const completed = courseWork[course.id]?.completedLessons ?? {};
    return sum + course.lessons.filter((_, index) => completed[index]).length;
  }, 0);
  const totalBookCourses = Object.values(bookCourseTracks).reduce((sum, courses) => sum + courses.length, 0);
  const completedBookCourses = Object.entries(bookCourseTracks).reduce((sum, [courseId, courses]) => {
    const completed = courseWork[courseId]?.completedBooks ?? {};
    return sum + courses.filter((course) => completed[course.courseTitle]).length;
  }, 0);

  return {
    totalLessons,
    completedLessons,
    totalBookCourses,
    completedBookCourses,
    percent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
  };
}

function getDailySpark(activeDay, offset = 0) {
  return dailySparkCards[(activeDay + offset - 1) % dailySparkCards.length];
}

function getNextReward(streak) {
  return rewardMilestones.find((reward) => reward.day > streak) ?? rewardMilestones[rewardMilestones.length - 1];
}

function getEarnedRewards(streak) {
  return rewardMilestones.filter((reward) => reward.day <= streak);
}

function buildCheckinMessage(mode, values = {}, activeDay) {
  const identity = mode.identity.replace("{days}", activeDay);
  const lines = [
    identity,
    "",
    `【${mode.title}】`,
    `提交时间：${mode.deadline}`,
    "",
    ...mode.prompts.flatMap((prompt, index) => [
      `${index + 1}. ${prompt.label}`,
      values[prompt.key] || "（待填写）",
      "",
    ]),
    mode.closing,
  ];

  return lines.join("\n").trim();
}

function scrollToId(id, shouldFocus = false) {
  window.requestAnimationFrame(() => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    if (shouldFocus && typeof element.focus === "function") {
      window.setTimeout(() => element.focus(), 260);
    }
  });
}

function getDailyNextAction({ pledgeAccepted, check, taskDoneCount, taskTotal }) {
  if (!pledgeAccepted) {
    return {
      label: "先确认承诺",
      body: "给这 30 天一个边界，系统才会开始记录你的真实训练。",
      action: "确认承诺",
      kind: "pledge",
    };
  }
  if (!check.ritualStarted) {
    return {
      label: "开启今日",
      body: "先进入训练状态，再处理课程、任务和复盘。",
      action: "开始",
      kind: "ritual",
    };
  }
  if (!check.intention?.trim()) {
    return {
      label: "写下今日保护动作",
      body: "只保护一个动作，避免一打开平台就被所有模块分散。",
      action: "去填写",
      kind: "intention",
    };
  }
  if (taskDoneCount < taskTotal) {
    return {
      label: "完成最小任务",
      body: `今天还有 ${taskTotal - taskDoneCount} 个动作未勾选，先让行动发生。`,
      action: "去打卡",
      kind: "tasks",
    };
  }
  if (!check.output?.trim() || !check.reflection?.trim()) {
    return {
      label: "写下输出和复盘",
      body: "真实记录会把今天变成明天可优化的系统反馈。",
      action: "去复盘",
      kind: "reflection",
    };
  }
  if (!check.completed) {
    return {
      label: "收束今天",
      body: "任务和复盘已经就绪，点亮今天，保持连续性。",
      action: "完成打卡",
      kind: "complete",
    };
  }
  return {
    label: "记录睡眠饮食",
    body: "今天已经完成主线，继续给身体底盘打分，明天更容易调整。",
    action: "去评分",
    kind: "nutrition",
  };
}

function App() {
  const [state, setState] = useStoredState();
  const today = getLocalDate();
  const todayDay = clamp(daysBetween(state.startDate, today) + 1, 1, 30);
  const [activeDay, setActiveDay] = useState(todayDay);
  const [activeSystemId, setActiveSystemId] = useState(programDays[todayDay - 1].systemId);
  const [activeCourseId, setActiveCourseId] = useState(systemCourseCatalog[0].id);
  const [activeView, setActiveView] = useState("dashboard");
  const [pendingScroll, setPendingScroll] = useState(null);

  const activeProgram = programDays[activeDay - 1];
  const activeSystem = systems.find((system) => system.id === activeSystemId) ?? systems[0];
  const activeDaySystem = systems.find((system) => system.id === activeProgram.systemId) ?? activeSystem;
  const check = state.checks[activeDay] ?? {};
  const score = calculateScore(state);
  const systemCourseProgress = calculateSystemCourseProgress(state.courseWork);
  const averageEnergy = useMemo(() => {
    const values = Object.values(state.checks)
      .map((item) => Number(item.energy))
      .filter(Boolean);
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [state.checks]);
  const streak = calculateStreak(state.checks);

  const updateCheck = (day, patch) => {
    setState((current) => ({
      ...current,
      checks: {
        ...current.checks,
        [day]: {
          ...(current.checks[day] ?? {}),
          ...patch,
        },
      },
    }));
  };

  const updateCourseWork = (courseId, producer) => {
    setState((current) => {
      const currentWork = current.courseWork?.[courseId] ?? {};
      const nextWork = typeof producer === "function" ? producer(currentWork) : { ...currentWork, ...producer };
      return {
        ...current,
        courseWork: {
          ...(current.courseWork ?? {}),
          [courseId]: nextWork,
        },
      };
    });
  };

  const updateCheckinTemplate = (modeId, key, value) => {
    updateCheck(activeDay, {
      checkinTemplates: {
        ...(check.checkinTemplates ?? {}),
        [modeId]: {
          ...(check.checkinTemplates?.[modeId] ?? {}),
          [key]: value,
        },
      },
    });
  };

  const toggleTask = (task) => {
    const currentTasks = check.tasks ?? {};
    updateCheck(activeDay, {
      tasks: {
        ...currentTasks,
        [task]: !currentTasks[task],
      },
    });
  };

  const completeActiveDay = () => {
    const allTasks = Object.fromEntries(activeProgram.tasks.map((task) => [task, true]));
    updateCheck(activeDay, {
      tasks: { ...(check.tasks ?? {}), ...allTasks },
      completed: true,
      completedAt: new Date().toISOString(),
    });
  };

  const navigateToView = (viewId, scrollId = "") => {
    setActiveView(viewId);
    setPendingScroll(scrollId ? { id: scrollId, viewId } : null);
  };

  const completeAndShowNext = () => {
    completeActiveDay();
    navigateToView("dashboard", "today-action-panel");
  };

  const selectDay = (day) => {
    setActiveDay(day.day);
    setActiveSystemId(day.systemId);
  };

  const openDay = (day, targetView = "dashboard") => {
    selectDay(day);
    navigateToView(targetView, targetView === "dashboard" ? "today-checkin" : "");
  };

  const openSystem = (systemId, targetView = "systems", scrollId = "system-detail-panel") => {
    setActiveSystemId(systemId);
    setActiveCourseId(systemId);
    navigateToView(targetView, scrollId);
  };

  const toggleCourse = (courseId) => {
    setState((current) => ({
      ...current,
      courses: {
        ...current.courses,
        [courseId]: !current.courses[courseId],
      },
    }));
  };

  const resetData = () => {
    const confirmed = window.confirm("确定清空本地打卡和学习记录吗？材料与平台内容不会删除。");
    if (!confirmed) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setState(createDefaultState());
    setActiveDay(1);
    setActiveSystemId(programDays[0].systemId);
  };

  const taskDoneCount = activeProgram.tasks.filter((task) => check.tasks?.[task]).length;
  const activeDayDate = addDays(state.startDate, activeDay - 1);
  const nextProgram = programDays[Math.min(activeDay, 29)];
  const taskTotal = activeProgram.tasks.length;

  const togglePledge = () => {
    setState((current) => ({ ...current, pledgeAccepted: !current.pledgeAccepted }));
  };

  const handleNextAction = (action) => {
    if (action.kind === "pledge") {
      setState((current) => ({ ...current, pledgeAccepted: true }));
      return;
    }
    if (action.kind === "ritual") {
      updateCheck(activeDay, { ritualStarted: true });
      scrollToId("daily-ritual");
      return;
    }
    if (action.kind === "intention") {
      scrollToId("daily-intention", true);
      return;
    }
    if (action.kind === "tasks") {
      scrollToId("today-checkin");
      return;
    }
    if (action.kind === "reflection") {
      scrollToId("today-output", true);
      return;
    }
    if (action.kind === "complete") {
      completeAndShowNext();
      return;
    }
    navigateToView("nutrition", "sleep-score");
  };

  useEffect(() => {
    if (pendingScroll?.id) {
      scrollToId(pendingScroll.id);
      return;
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [activeView, pendingScroll]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">30</div>
          <div>
            <p>人生重启平台</p>
            <strong>30天重建人生体系</strong>
          </div>
        </div>

        <div className="start-date">
          <label htmlFor="startDate">开始日期</label>
          <input
            id="startDate"
            type="date"
            value={state.startDate}
            onChange={(event) => {
              const startDate = event.target.value || getLocalDate();
              const nextDay = clamp(daysBetween(startDate, today) + 1, 1, 30);
              setState((current) => ({ ...current, startDate }));
              setActiveDay(nextDay);
              setActiveSystemId(programDays[nextDay - 1].systemId);
            }}
          />
        </div>

        <nav className="view-nav" aria-label="平台模块">
          {viewLabels.map((view) => (
            <button
              key={view.id}
              className={activeView === view.id ? "nav-pill active" : "nav-pill"}
              onClick={() => navigateToView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </nav>

        <div className="system-nav">
          <p className="side-label">八个个人运行系统</p>
          {systems.map((system) => {
            const Icon = iconMap[system.icon];
            return (
              <button
                key={system.id}
                className={activeSystemId === system.id ? "system-link active" : "system-link"}
                onClick={() => openSystem(system.id)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{system.name}</span>
              </button>
            );
          })}
        </div>

        <button className="reset-button" onClick={resetData}>
          <RotateCcw size={16} />
          清空本地记录
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="overline">从今天开始，为更好的自己坚持 30 天</span>
            <h1>30天重建人生体系</h1>
          </div>
          <div className="top-actions">
            <button
              className={state.pledgeAccepted ? "pledge-button accepted" : "pledge-button"}
              onClick={togglePledge}
            >
              <ShieldCheck size={18} />
              {state.pledgeAccepted ? "承诺已确认" : "确认承诺"}
            </button>
            <button className="primary-action" onClick={completeAndShowNext}>
              <Save size={18} />
              完成今日打卡
            </button>
          </div>
        </header>

        {activeView === "dashboard" && (
          <UserPathPanel
            activeDay={activeDay}
            todayDay={todayDay}
            activeProgram={activeProgram}
            activeSystem={activeDaySystem}
            check={check}
            pledgeAccepted={state.pledgeAccepted}
            taskDoneCount={taskDoneCount}
            taskTotal={taskTotal}
            streak={streak}
            onNextAction={handleNextAction}
            navigateToView={navigateToView}
          />
        )}

        {activeView === "dashboard" && (
          <PromoVideoPanel
            navigateToView={navigateToView}
          />
        )}

        {activeView === "dashboard" && (
          <DailyEngagementPanel
            activeDay={activeDay}
            todayDay={todayDay}
            activeProgram={activeProgram}
            nextProgram={nextProgram}
            activeSystem={activeDaySystem}
            check={check}
            taskDoneCount={taskDoneCount}
            streak={streak}
            updateCheck={updateCheck}
          />
        )}

        {activeView === "dashboard" && (
          <ProgressStats
            score={score}
            todayDay={todayDay}
            streak={streak}
            averageEnergy={averageEnergy}
            systemCourseProgress={systemCourseProgress}
            navigateToView={navigateToView}
          />
        )}

        {activeView === "dashboard" && (
          <div className="dashboard-grid">
            <section className="panel progress-panel" id="day-progress-panel">
              <SectionTitle icon={CalendarDays} title="30天进度" action={`当前：第 ${activeDay} 天`} />
              <div className="day-grid">
                {programDays.map((day) => (
                  <button
                    key={day.day}
                    className={[
                      "day-cell",
                      day.day === activeDay ? "active" : "",
                      state.checks[day.day]?.completed ? "done" : "",
                      day.day === todayDay ? "today" : "",
                    ].join(" ")}
                    onClick={() => openDay(day)}
                    title={`${day.day}. ${day.title}`}
                  >
                    <span>{day.day}</span>
                  </button>
                ))}
              </div>
              <div className="phase-strip">
                <span>启动</span>
                <span>身心稳定</span>
                <span>秩序建立</span>
                <span>认知升级</span>
                <span>身份成形</span>
                <span>整合</span>
              </div>
            </section>

            <section className="panel today-panel" id="today-checkin">
              <SectionTitle icon={ClipboardCheck} title="今日打卡" action={activeDayDate} />
              <div className="day-heading">
                <div>
                  <span className="phase-label">{activeProgram.phase}</span>
                  <h2>
                    Day {activeProgram.day} · {activeProgram.title}
                  </h2>
                </div>
                <strong>{taskDoneCount}/{activeProgram.tasks.length}</strong>
              </div>
              <p className="lesson">{activeProgram.lesson}</p>

              <div className="state-sliders">
                <StateSlider
                  label="精力"
                  value={check.energy ?? 3}
                  onChange={(value) => updateCheck(activeDay, { energy: value })}
                />
                <StateSlider
                  label="情绪"
                  value={check.mood ?? 3}
                  onChange={(value) => updateCheck(activeDay, { mood: value })}
                />
                <StateSlider
                  label="注意力"
                  value={check.focus ?? 3}
                  onChange={(value) => updateCheck(activeDay, { focus: value })}
                />
              </div>

              <div className="task-list">
                {activeProgram.tasks.map((task) => (
                  <button
                    key={task}
                    className={check.tasks?.[task] ? "task-row done" : "task-row"}
                    onClick={() => toggleTask(task)}
                  >
                    {check.tasks?.[task] ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                    <span>{task}</span>
                  </button>
                ))}
              </div>

              <label className="note-field">
                今日输出：{activeProgram.output}
                <textarea
                  id="today-output"
                  value={check.output ?? ""}
                  onChange={(event) => updateCheck(activeDay, { output: event.target.value })}
                  placeholder="写下今天的真实输出，不需要完美。"
                />
              </label>
              <label className="note-field">
                复盘问题：{activeProgram.prompt}
                <textarea
                  id="today-reflection"
                  value={check.reflection ?? ""}
                  onChange={(event) => updateCheck(activeDay, { reflection: event.target.value })}
                  placeholder="用几句话回答今天的问题。"
                />
              </label>
            </section>

            <CheckinModesPanel
              activeDay={activeDay}
              check={check}
              updateCheckinTemplate={updateCheckinTemplate}
            />

            <LearningMechanism
              state={state}
              toggleCourse={toggleCourse}
              updateCheck={updateCheck}
              activeDay={activeDay}
              check={check}
            />

            <CommitmentPanel state={state} setState={setState} />
          </div>
        )}

        {activeView === "theory" && <TheoryView />}

        {activeView === "courses" && (
          <SystemCoursesView
            activeCourseId={activeCourseId}
            setActiveCourseId={setActiveCourseId}
            setActiveSystemId={setActiveSystemId}
            courseWork={state.courseWork}
            updateCourseWork={updateCourseWork}
          />
        )}

        {activeView === "learning" && (
          <div className="wide-grid">
            <LearningMechanism
              state={state}
              toggleCourse={toggleCourse}
              updateCheck={updateCheck}
              activeDay={activeDay}
              check={check}
              large
            />
            <section className="panel lesson-map">
              <SectionTitle icon={NotebookPen} title="30天学习路径" action="输入 · 输出 · 应用 · 复盘" />
              <div className="lesson-table">
                {programDays.map((day) => {
                  const system = systems.find((item) => item.id === day.systemId);
                  return (
                    <button
                      key={day.day}
                      className={day.day === activeDay ? "lesson-row active" : "lesson-row"}
                      onClick={() => {
                        openDay(day);
                      }}
                    >
                      <span>Day {day.day}</span>
                      <strong>{day.title}</strong>
                      <em>{system?.name}</em>
                      {state.checks[day.day]?.completed ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeView === "group" && (
          <GroupFieldView
            state={state}
            setState={setState}
            activeDay={activeDay}
            activeDayDate={activeDayDate}
            check={check}
            updateCheck={updateCheck}
            score={score}
          />
        )}

        {activeView === "systems" && (
          <div className="systems-layout system-map-layout">
            <section className="panel systems-table system-orbit-panel">
              <SectionTitle icon={LineChart} title="八大个人运行系统图谱" action="从状态到身份" />
              <div className="system-orbit-map">
                <div className="orbit-label orbit-label-top">身份锚点</div>
                <div className="orbit-label orbit-label-right">行动闭环</div>
                <div className="orbit-label orbit-label-bottom">底盘恢复</div>
                <div className="orbit-label orbit-label-left">价值排序</div>
                <div className="system-orbit-core">
                  <span>OPERATING SYSTEM</span>
                  <strong>8</strong>
                  <p>围绕每日行动闭环，重建能量、节奏、目标、反馈、学习、关系、价值和身份。</p>
                </div>
                {systems.map((system, index) => {
                  const Icon = iconMap[system.icon];
                  const [x, y] = systemOrbitPositions[index] ?? [50, 50];
                  return (
                    <button
                      key={system.id}
                      className={system.id === activeSystemId ? "system-orbit-node active" : "system-orbit-node"}
                      style={{ "--x": `${x}%`, "--y": `${y}%` }}
                      onClick={() => {
                        setActiveSystemId(system.id);
                        setActiveCourseId(system.id);
                        scrollToId("system-detail-panel");
                      }}
                    >
                      <Icon size={19} />
                      <span>{system.order.replace("系统", "")}</span>
                      <strong>{system.name}</strong>
                    </button>
                  );
                })}
              </div>
              <div className="architecture-note">
                <strong>架构已平台化</strong>
                <p>原始理念已经转化为可学习、可打卡、可复盘的八大系统，不再只停留在一张说明图。</p>
              </div>
              <div className="system-layer-grid">
                {systemMapLayers.map((layer) => (
                  <article key={layer.label}>
                    <span>{layer.label}</span>
                    <strong>{layer.systems}</strong>
                    <p>{layer.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel system-detail premium-system-detail" id="system-detail-panel">
              <SectionTitle icon={Compass} title="当前系统定义" action={activeSystem.order} />
              <SystemDetail
                system={activeSystem}
                onOpenCourse={() => openSystem(activeSystem.id, "courses", "system-course-detail")}
                onOpenDaily={() => navigateToView("dashboard", "today-action-panel")}
              />
            </section>
          </div>
        )}

        {activeView === "nutrition" && (
          <div className="wide-grid">
            <CheckinModesPanel
              activeDay={activeDay}
              check={check}
              updateCheckinTemplate={updateCheckinTemplate}
            />

            <SleepScorePanel
              activeDay={activeDay}
              check={check}
              updateCheck={updateCheck}
            />

            <section className="panel practice-panel">
              <SectionTitle icon={Sunrise} title="曾国藩日课修炼结构" action="每日 discipline" />
              <div className="rules-grid">
                {dailyRules.map((rule, index) => (
                  <div className="rule-line" key={rule}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{rule}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel nutrition-panel">
              <SectionTitle icon={Utensils} title="身心能量饮食机制" action="早餐启动 · 晚餐收束" />
              <p className="quote-line">{nutrition.principle}</p>
              <div className="breakfast-table">
                <span>常见错误</span>
                <span>短期后果</span>
                <span>长期后果</span>
                {nutrition.breakfastMistakes.flatMap((row) =>
                  row.map((cell, index) => <p key={`${row[0]}-${index}`}>{cell}</p>),
                )}
              </div>
              <div className="dinner-grid">
                {nutrition.dinnerPlate.map(([title, detail]) => (
                  <div key={title} className="dinner-item">
                    <strong>{title}</strong>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
              <figure className="material-strip">
                <img src={assetPath("/materials/dinner-guide.png")} alt="晚餐参考组合材料" />
                <figcaption>晚餐组合来自材料：蛋白、纤维、少量碳水。</figcaption>
              </figure>
            </section>

            <KitchenSystemPanel
              activeDay={activeDay}
              check={check}
              updateCheck={updateCheck}
            />

            <section className="panel zen-panel">
              <SectionTitle icon={Moon} title="喝饭禅学习机制" action="从体验到精进" />
              <div className="zen-list">
                {zenCourses.map((course) => (
                  <article key={course.title} className="zen-item">
                    <span>{course.stage}</span>
                    <h3>{course.title}</h3>
                    <em>{course.time}</em>
                    <p>{course.body}</p>
                  </article>
                ))}
              </div>
              <figure className="material-strip">
                <img src={assetPath("/materials/zen-courses.png")} alt="香海禅寺喝饭禅系列课程介绍材料" />
                <figcaption>课程机制用于设计平台中的体验课、核心课和进阶练习。</figcaption>
              </figure>
            </section>
          </div>
        )}

        {activeView !== "dashboard" && (
          <ProgressStats
            score={score}
            todayDay={todayDay}
            streak={streak}
            averageEnergy={averageEnergy}
            systemCourseProgress={systemCourseProgress}
            navigateToView={navigateToView}
            compact
          />
        )}
      </main>
    </div>
  );
}

function DailyEngagementPanel({
  activeDay,
  todayDay,
  activeProgram,
  nextProgram,
  activeSystem,
  check,
  taskDoneCount,
  streak,
  updateCheck,
}) {
  const taskTotal = activeProgram.tasks.length;
  const taskPercent = taskTotal ? Math.round((taskDoneCount / taskTotal) * 100) : 0;
  const sparkOffset = check.sparkOffset ?? 0;
  const todaySpark = getDailySpark(activeDay, sparkOffset);
  const nextReward = getNextReward(streak);
  const earnedRewards = getEarnedRewards(streak);
  const remainingTasks = Math.max(taskTotal - taskDoneCount, 0);
  const isToday = activeDay === todayDay;
  const rewardClaimed = Boolean(check.rewardClaimed);
  const ritualSteps = [
    {
      key: "ritualStarted",
      label: "开启今日",
      body: "先进入训练状态",
      active: Boolean(check.ritualStarted),
      onClick: () => updateCheck(activeDay, { ritualStarted: true }),
    },
    {
      key: "sparkOpened",
      label: "打开锦囊",
      body: "领取一个小动作",
      active: Boolean(check.sparkOpened),
      onClick: () => updateCheck(activeDay, { sparkOpened: true }),
    },
    {
      key: "rewardClaimed",
      label: "领取徽章",
      body: check.completed ? "完成后收束当天" : "完成打卡后解锁",
      active: rewardClaimed,
      disabled: !check.completed,
      onClick: () => updateCheck(activeDay, { rewardClaimed: true }),
    },
  ];

  return (
    <section className="panel daily-engagement-panel ritual-flow-panel" id="daily-ritual">
      <SectionTitle
        icon={Sparkles}
        title="今日开启仪式"
        action={isToday ? "今天打开就先做这一步" : `正在查看 Day ${activeDay}`}
      />

      <div className="engagement-hero">
        <div>
          <span>Daily Reset Ritual · {activeSystem.name}</span>
          <h2>{check.completed ? "今天已经点亮，保持记录不断线" : `今天先完成 ${remainingTasks || 1} 个可检查动作`}</h2>
          <p>
            {check.completed
              ? "完成不是结束，写下真实复盘，明天会更容易进入状态。"
              : `${activeProgram.title}：先小后大，先发生再优化。`}
          </p>
        </div>
        <div className="engagement-ring" aria-label={`今日任务进度 ${taskPercent}%`}>
          <strong>{taskPercent}%</strong>
          <span>任务进度</span>
        </div>
      </div>

      <div className="ritual-flow-grid">
        {ritualSteps.map((step, index) => (
          <button
            key={step.key}
            className={step.active ? "ritual-step active" : "ritual-step"}
            disabled={step.disabled}
            onClick={step.onClick}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{step.label}</strong>
              <em>{step.body}</em>
            </div>
          </button>
        ))}
      </div>

      <div className="ritual-support-grid">
        <label className="intention-field ritual-intention">
          今天打开平台，我要保护的一个动作
          <input
            id="daily-intention"
            value={check.intention ?? ""}
            onChange={(event) => updateCheck(activeDay, { intention: event.target.value })}
            placeholder="例：今晚 22:00 前完成真实打卡，不失联。"
          />
        </label>

        <div className={check.sparkOpened ? "daily-spark-card open" : "daily-spark-card"}>
          <div className="spark-card-head">
            <div>
              <Gift size={18} />
              <strong>{check.sparkOpened ? todaySpark.title : "今日锦囊未打开"}</strong>
            </div>
            <button
              onClick={() =>
                updateCheck(activeDay, {
                  sparkOpened: true,
                  sparkOffset: sparkOffset + 1,
                })
              }
            >
              {check.sparkOpened ? "换一张" : "打开"}
            </button>
          </div>
          <p>{check.sparkOpened ? todaySpark.body : "每天给自己一个微动作，打开后再开始写作业。"}</p>
          <em>{check.sparkOpened ? todaySpark.action : "打开后显示今天的具体行动。"}</em>
        </div>

        <div className="reward-row ritual-reward-row">
          <div className="reward-summary">
            <Flame size={18} />
            <div>
              <strong>连续 {streak} 天</strong>
              <p>
                下一枚：{nextReward.title} · 还差 {Math.max(nextReward.day - streak, 0)} 天
              </p>
            </div>
          </div>
          <div className="reward-badges">
            {rewardMilestones.map((reward) => {
              const earned = earnedRewards.some((item) => item.day === reward.day);
              return (
                <span key={reward.day} className={earned ? "reward-badge earned" : "reward-badge"}>
                  <Award size={14} />
                  {reward.day}天
                </span>
              );
            })}
          </div>
        </div>

        <div className="tomorrow-preview ritual-tomorrow-preview">
          <span>明日预告</span>
          <strong>
            Day {nextProgram.day} · {nextProgram.title}
          </strong>
          <p>{nextProgram.lesson}</p>
        </div>
      </div>
    </section>
  );
}

function UserPathPanel({
  activeDay,
  todayDay,
  activeProgram,
  activeSystem,
  check,
  pledgeAccepted,
  taskDoneCount,
  taskTotal,
  streak,
  onNextAction,
  navigateToView,
}) {
  const nextAction = getDailyNextAction({ pledgeAccepted, check, taskDoneCount, taskTotal });
  const completionSignals = [
    pledgeAccepted,
    Boolean(check.ritualStarted),
    Boolean(check.intention?.trim()),
    taskDoneCount >= taskTotal,
    Boolean(check.output?.trim() && check.reflection?.trim()),
    Boolean(check.completed),
  ];
  const completionPercent = Math.round((completionSignals.filter(Boolean).length / completionSignals.length) * 100);
  const cabinMeta = [
    { label: "当前系统", value: activeSystem.name },
    { label: "训练日", value: activeDay === todayDay ? "今日" : `Day ${activeDay}` },
    { label: "连续打开", value: `${streak} 天` },
  ];
  const userStepCards = [
    {
      title: "先安顿今天",
      body: check.intention?.trim() || "写一个今天最想保护的动作。",
      status: check.intention?.trim() ? "已设定" : "待填写",
      done: Boolean(check.intention?.trim()),
    },
    {
      title: "再完成动作",
      body: `${taskDoneCount}/${taskTotal} 个打卡动作已完成。`,
      status: taskDoneCount >= taskTotal ? "已完成" : "进行中",
      done: taskDoneCount >= taskTotal,
    },
    {
      title: "最后做复盘",
      body: check.completed ? "今天已点亮，可以进入睡眠饮食评分。" : "写输出和复盘后收束当天。",
      status: check.completed ? "已点亮" : "未收束",
      done: Boolean(check.completed),
    },
  ];

  return (
    <section className="panel user-path-panel restart-cabin" id="today-action-panel" aria-label="今日重启舱">
      <div className="cabin-atmosphere" aria-hidden="true" />
      <div className="cabin-main">
        <span className="cabin-eyebrow">NEWLIFE30 · RESET CABIN</span>
        <h2>
          Day {activeDay}
          <em>{activeProgram.title}</em>
        </h2>
        <p>
          不再把改变做成一张待办表。今天只进入一个高质量闭环：
          开启、执行、复盘、评分，让系统替你守住下一步。
        </p>
        <div className="cabin-meta-row">
          {cabinMeta.map((item) => (
            <span key={item.label}>
              <small>{item.label}</small>
              {item.value}
            </span>
          ))}
        </div>
      </div>

      <div className="cabin-command-card">
        <div className="command-head">
          <span>下一步指令</span>
          <strong>{completionPercent}%</strong>
        </div>
        <h3>{nextAction.label}</h3>
        <p>{nextAction.body}</p>
        <button onClick={() => onNextAction(nextAction)}>
          {nextAction.action}
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="cabin-stage-grid">
        {userStepCards.map((item, index) => (
          <article key={item.title} className={item.done ? "cabin-stage-card done" : "cabin-stage-card"}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <em>{item.status}</em>
          </article>
        ))}
      </div>

      <div className="cabin-progress-panel">
        <div>
          <span>今日闭环进度</span>
          <strong>{completionPercent}%</strong>
        </div>
        <div className="path-progress-track" aria-hidden="true">
          <i style={{ width: `${completionPercent}%` }} />
        </div>
        <p>闭环完成后，进入睡眠饮食评分，找到明天最值得优化的一步。</p>
      </div>

      <div className="path-shortcuts cabin-shortcuts" aria-label="快速入口">
        <button onClick={() => scrollToId("today-checkin")}>今日打卡</button>
        <button onClick={() => navigateToView("nutrition", "sleep-score")}>睡眠饮食</button>
        <button onClick={() => navigateToView("courses", "system-course-detail")}>继续上课</button>
      </div>
    </section>
  );
}

function PromoVideoPanel({ navigateToView }) {
  const [copied, setCopied] = useState(false);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(promoVideoScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="panel promo-video-panel" aria-label="平台介绍视频">
      <div className="promo-video-copy">
        <span>60 秒了解平台</span>
        <h2>先看清系统，再开始今天</h2>
        <p>
          用一支简短介绍片，让新用户进入平台后马上知道：今天做什么、课程在哪里、
          打卡如何完成，以及 30 天结束后会留下什么。
        </p>
        <div className="promo-video-actions">
          <button onClick={copyScript}>
            <Copy size={16} />
            {copied ? "脚本已复制" : "复制视频脚本"}
          </button>
          <button onClick={() => navigateToView("courses", "system-course-detail")}>
            <BookOpen size={16} />
            查看课程体系
          </button>
        </div>
      </div>

      <div className="promo-video-stage">
        <div className="promo-video-frame">
          <MonitorPlay size={34} />
          <strong>平台介绍视频</strong>
          <span>HeyGen 授权恢复后可直接生成并嵌入</span>
        </div>
        <div className="promo-scene-list">
          {promoVideoScenes.map((scene, index) => (
            <article key={scene.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{scene.title}</strong>
              <p>{scene.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const lessonSelfCheckItems = [
  ["problem", "我能说清本节课解决的问题"],
  ["model", "我能用自己的话复述核心模型"],
  ["action", "我已经写下一个可执行动作"],
];

function buildLessonBlueprint(course, lessonIndex) {
  const [title, body] = course.lessons[lessonIndex];
  const practice = course.practices[lessonIndex] ?? course.outcome;
  const detail = lessonContentDetails[course.id]?.[lessonIndex] ?? {};
  return {
    objective: `把「${title}」从概念转成今天可使用的判断模型。`,
    model: [
      `识别旧模式：我在「${course.name}」里最常卡住的场景是什么。`,
      `建立新规则：用本节课模型解释这个场景，而不是只靠情绪判断。`,
      `完成小动作：${practice}`,
    ],
    lecture: detail.lecture ?? [body],
    case: detail.case ?? `把「${title}」放进今天真实生活里的一个场景，观察它如何影响你的选择。`,
    steps: detail.steps ?? ["写下旧模式", "写下新规则", "完成一个动作", "晚上复盘反馈"],
    mistake: detail.mistake ?? "常见误区是只理解概念，没有把概念转成一个今天能执行的动作。",
    assignment: detail.assignment ?? practice,
    prompts: [
      `我过去在「${title}」上最常见的旧反应是什么？`,
      "如果只做一个最小行动，今天具体做什么、什么时候做？",
      "明天用什么证据判断这个行动是否真的发生？",
    ],
    body,
    practice,
  };
}

function buildCourseShareText(course, lessonIndex, work) {
  const [title] = course.lessons[lessonIndex];
  const lessonNotes = work.lessonNotes?.[lessonIndex] || "（待填写）";
  const lessonPractice = work.lessonPractice?.[lessonIndex] || "（待填写）";
  const confidence = work.lessonConfidence?.[lessonIndex] || 3;

  return [
    `【${course.name}｜${title}】`,
    "",
    `1. 今天理解的核心模型：`,
    lessonNotes,
    "",
    `2. 今天要执行的最小动作：`,
    lessonPractice,
    "",
    `3. 自评分：${confidence}/5`,
    "",
    "要求：具体、可检查、明天能复盘。",
  ].join("\n");
}

function SystemCoursesView({ activeCourseId, setActiveCourseId, setActiveSystemId, courseWork = {}, updateCourseWork }) {
  const activeCourse = systemCourseCatalog.find((course) => course.id === activeCourseId) ?? systemCourseCatalog[0];
  const bookCourses = bookCourseTracks[activeCourse.id] ?? [];
  const activeWork = courseWork[activeCourse.id] ?? {};
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeBookTitle, setActiveBookTitle] = useState("");
  const [pendingCourseScroll, setPendingCourseScroll] = useState("");
  const [copiedCourseText, setCopiedCourseText] = useState(false);
  const activeLesson = buildLessonBlueprint(activeCourse, activeLessonIndex);
  const completedLessons = activeCourse.lessons.filter((_, index) => activeWork.completedLessons?.[index]).length;
  const completedBookCourses = bookCourses.filter((course) => activeWork.completedBooks?.[course.courseTitle]).length;
  const lessonProgress = Math.round((completedLessons / activeCourse.lessons.length) * 100);
  const lessonLibrary = systemCourseCatalog.flatMap((course, systemIndex) =>
    course.lessons.map(([title, body], lessonIndex) => ({
      number: systemIndex * 4 + lessonIndex + 1,
      systemId: course.id,
      systemName: course.name,
      order: course.order,
      title,
      body,
      practice: course.practices[lessonIndex] ?? course.outcome,
    })),
  );
  const totalBookCourses = Object.values(bookCourseTracks).reduce((sum, courses) => sum + courses.length, 0);
  const generatedCourseText = buildCourseShareText(activeCourse, activeLessonIndex, activeWork);

  useEffect(() => {
    setActiveSystemId(activeCourseId);
  }, [activeCourseId]);

  useEffect(() => {
    if (!pendingCourseScroll) return;
    scrollToId(pendingCourseScroll);
    setPendingCourseScroll("");
  }, [activeCourse.id, activeLessonIndex, activeBookTitle, pendingCourseScroll]);

  const selectCourse = (courseId, lessonIndex = 0, scrollId = "system-course-detail", bookTitle = "") => {
    setActiveCourseId(courseId);
    setActiveSystemId(courseId);
    setActiveLessonIndex(lessonIndex);
    setActiveBookTitle(bookTitle);
    setPendingCourseScroll(scrollId);
  };

  const patchActiveWork = (producer) => updateCourseWork(activeCourse.id, producer);

  const updateLessonMap = (field, lessonIndex, value) => {
    patchActiveWork((work) => ({
      ...work,
      [field]: {
        ...(work[field] ?? {}),
        [lessonIndex]: value,
      },
    }));
  };

  const toggleLessonComplete = (lessonIndex) => {
    patchActiveWork((work) => ({
      ...work,
      completedLessons: {
        ...(work.completedLessons ?? {}),
        [lessonIndex]: !work.completedLessons?.[lessonIndex],
      },
    }));
  };

  const toggleLessonCheck = (lessonIndex, key) => {
    patchActiveWork((work) => ({
      ...work,
      lessonChecks: {
        ...(work.lessonChecks ?? {}),
        [lessonIndex]: {
          ...(work.lessonChecks?.[lessonIndex] ?? {}),
          [key]: !work.lessonChecks?.[lessonIndex]?.[key],
        },
      },
    }));
  };

  const toggleBookCourse = (courseTitle) => {
    patchActiveWork((work) => ({
      ...work,
      completedBooks: {
        ...(work.completedBooks ?? {}),
        [courseTitle]: !work.completedBooks?.[courseTitle],
      },
    }));
  };

  const updateBookAssignment = (courseTitle, value) => {
    patchActiveWork((work) => ({
      ...work,
      bookAssignments: {
        ...(work.bookAssignments ?? {}),
        [courseTitle]: value,
      },
    }));
  };

  const copyCourseText = async () => {
    try {
      await navigator.clipboard.writeText(generatedCourseText);
      setCopiedCourseText(true);
      window.setTimeout(() => setCopiedCourseText(false), 1600);
    } catch {
      setCopiedCourseText(false);
    }
  };

  return (
    <div className="academy-layout">
      <section className="panel academy-hero-panel">
        <div className="academy-hero-copy">
          <span>NEWLIFE30 INSTITUTE</span>
          <h2>一座为 30 天重启而设计的个人成长研究院</h2>
          <p>
            课程不再像资料库，而是一个高端训练场：系统课建立底层模型，
            书籍转化课补充方法论，每日作业把知识压缩成可执行行动。
          </p>
          <div className="academy-hero-actions">
            <button onClick={() => selectCourse(activeCourse.id, activeLessonIndex, "lesson-workbench")}>
              进入今日课程
              <ChevronRight size={17} />
            </button>
            <button onClick={() => selectCourse(activeCourse.id, 0, "book-course-library")}>
              查看书籍转化课
            </button>
          </div>
        </div>

        <div className="academy-showcase">
          <div className="academy-showcase-card">
            <span>当前推荐系统课</span>
            <strong>{activeCourse.name}</strong>
            <p>{activeCourse.positioning}</p>
            <em>{completedLessons}/{activeCourse.lessons.length} 理论课已完成</em>
          </div>
          <div className="academy-stat-grid">
            {academyStats.map(([value, label, detail]) => (
              <article key={label} className="academy-stat-card">
                <strong>{value}</strong>
                <span>{label}</span>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel academy-curation-panel">
        <SectionTitle icon={Sparkles} title="精品课程陈列" action="像研究院一样组织学习" />
        <div className="academy-curation-grid">
          {academyBoutiqueTracks.map((track) => (
            <article key={track.title} className="academy-curation-card">
              <span>{track.label}</span>
              <strong>{track.title}</strong>
              <p>{track.body}</p>
              <em>{track.metric}</em>
              <button onClick={() => selectCourse(activeCourse.id, activeLessonIndex, track.target)}>
                进入模块
                <ChevronRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel academy-method-panel">
        <SectionTitle icon={Compass} title="课程转化方法" action="模型 -> 作业 -> 反馈" />
        <div className="academy-method-grid">
          {academyMethod.map((item, index) => (
            <article key={item.title} className="academy-method-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel academy-phase-panel">
        <SectionTitle icon={LineChart} title="学习路径" action="5 个阶段" />
        <div className="academy-phase-list">
          {academyPhases.map((phase) => (
            <article key={phase.phase} className="academy-phase-card">
              <div>
                <span>{phase.phase}</span>
                <strong>{phase.title}</strong>
                <em>{phase.range}</em>
              </div>
              <p>{phase.focus}</p>
              <div className="phase-system-row">
                {phase.systems.map((system) => (
                  <span key={system}>{system}</span>
                ))}
              </div>
              <small>{phase.output}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel academy-delivery-panel">
        <SectionTitle icon={NotebookPen} title="交付模块" action="平台化内容" />
        <div className="academy-delivery-list">
          {academyDelivery.map(([title, body]) => (
            <article key={title} className="academy-delivery-item">
              <CheckCircle2 size={18} />
              <div>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="courses-layout academy-course-zone">
        <section className="panel course-index-panel">
          <SectionTitle icon={BookOpen} title="八个体系理论课程" action={`${systemCourseCatalog.length} 个课程包`} />
          <div className="course-index-list">
            {systemCourseCatalog.map((course) => (
              <button
                key={course.id}
                className={course.id === activeCourse.id ? "course-index-row active" : "course-index-row"}
                onClick={() => selectCourse(course.id, 0, "system-course-detail")}
              >
                <span>{course.order}</span>
                <strong>{course.name}</strong>
                <em>{course.courseTitle}</em>
                <small>
                  {(courseWork[course.id]?.completedLessons && Object.values(courseWork[course.id].completedLessons).filter(Boolean).length) || 0}/
                  {course.lessons.length} 已完成
                </small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel course-detail-panel" id="system-course-detail">
          <SectionTitle icon={Compass} title={activeCourse.name} action={activeCourse.order} />
          <div className="course-hero-block">
            <span>{activeCourse.courseTitle}</span>
            <h2>{activeCourse.positioning}</h2>
            <p>{activeCourse.outcome}</p>
          </div>

          <div className="course-progress-band">
            <div>
              <span>理论课进度</span>
              <strong>{completedLessons}/{activeCourse.lessons.length}</strong>
              <em>{lessonProgress}%</em>
            </div>
            <div>
              <span>书籍转化课</span>
              <strong>{completedBookCourses}/{bookCourses.length}</strong>
              <em>作业沉淀</em>
            </div>
            <div>
              <span>当前学习</span>
              <strong>Lesson {String(activeLessonIndex + 1).padStart(2, "0")}</strong>
              <em>{activeCourse.lessons[activeLessonIndex][0]}</em>
            </div>
          </div>

          <div className="course-section">
            <h3>理论课程结构</h3>
            <div className="course-lesson-grid">
              {activeCourse.lessons.map(([title, body], index) => (
                <button
                  key={title}
                  className={[
                    "course-lesson-card",
                    index === activeLessonIndex ? "active" : "",
                    activeWork.completedLessons?.[index] ? "done" : "",
                  ].join(" ")}
                  onClick={() => {
                    setActiveLessonIndex(index);
                    setActiveBookTitle("");
                    setPendingCourseScroll("lesson-workbench");
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="course-section lesson-workbench" id="lesson-workbench">
            <div className="lesson-workbench-head">
              <div>
                <span>Lesson {String(activeLessonIndex + 1).padStart(2, "0")}</span>
                <h3>{activeCourse.lessons[activeLessonIndex][0]}</h3>
                <p>{activeLesson.objective}</p>
              </div>
              <button
                className={activeWork.completedLessons?.[activeLessonIndex] ? "lesson-complete-btn active" : "lesson-complete-btn"}
                onClick={() => toggleLessonComplete(activeLessonIndex)}
              >
                <CheckCircle2 size={17} />
                {activeWork.completedLessons?.[activeLessonIndex] ? "已完成" : "标记完成"}
              </button>
            </div>

            <div className="lesson-model-grid">
              {activeLesson.model.map((item, index) => (
                <article key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>

            <div className="lesson-content-grid">
              <article className="lesson-lecture-card">
                <span>课程讲义</span>
                {activeLesson.lecture.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
              <article className="lesson-case-card">
                <span>真实案例</span>
                <p>{activeLesson.case}</p>
                <strong>常见误区</strong>
                <p>{activeLesson.mistake}</p>
              </article>
            </div>

            <div className="lesson-step-list">
              <div>
                <span>本课执行步骤</span>
                <strong>{activeLesson.assignment}</strong>
              </div>
              {activeLesson.steps.map((step, index) => (
                <article key={step}>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <p>{step}</p>
                </article>
              ))}
            </div>

            <div className="lesson-interaction-grid">
              <div className="lesson-prompt-list">
                <h4>互动练习</h4>
                {activeLesson.prompts.map((prompt, index) => (
                  <label key={prompt}>
                    <span>{prompt}</span>
                    <textarea
                      value={activeWork.lessonPromptAnswers?.[activeLessonIndex]?.[index] ?? ""}
                      onChange={(event) => {
                        patchActiveWork((work) => ({
                          ...work,
                          lessonPromptAnswers: {
                            ...(work.lessonPromptAnswers ?? {}),
                            [activeLessonIndex]: {
                              ...(work.lessonPromptAnswers?.[activeLessonIndex] ?? {}),
                              [index]: event.target.value,
                            },
                          },
                        }));
                      }}
                      placeholder="写具体场景和动作，不写泛泛感受。"
                    />
                  </label>
                ))}
              </div>

              <div className="lesson-output-card">
                <h4>本课输出</h4>
                <label>
                  核心模型笔记
                  <textarea
                    value={activeWork.lessonNotes?.[activeLessonIndex] ?? ""}
                    onChange={(event) => updateLessonMap("lessonNotes", activeLessonIndex, event.target.value)}
                    placeholder="用自己的话写出本节课的模型。"
                  />
                </label>
                <label>
                  行动作业
                  <textarea
                    value={activeWork.lessonPractice?.[activeLessonIndex] ?? ""}
                    onChange={(event) => updateLessonMap("lessonPractice", activeLessonIndex, event.target.value)}
                    placeholder={activeLesson.practice}
                  />
                </label>
                <label className="confidence-slider">
                  <span>
                    掌握程度
                    <strong>{activeWork.lessonConfidence?.[activeLessonIndex] ?? 3}/5</strong>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={activeWork.lessonConfidence?.[activeLessonIndex] ?? 3}
                    onChange={(event) => updateLessonMap("lessonConfidence", activeLessonIndex, Number(event.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="lesson-self-check">
              {lessonSelfCheckItems.map(([key, label]) => (
                <button
                  key={key}
                  className={activeWork.lessonChecks?.[activeLessonIndex]?.[key] ? "self-check active" : "self-check"}
                  onClick={() => toggleLessonCheck(activeLessonIndex, key)}
                >
                  {activeWork.lessonChecks?.[activeLessonIndex]?.[key] ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                  {label}
                </button>
              ))}
            </div>

            <div className="generated-course-share">
              <div className="generated-head">
                <strong>本课群发作业文案</strong>
                <button onClick={copyCourseText}>
                  <Copy size={16} />
                  {copiedCourseText ? "已复制" : "复制"}
                </button>
              </div>
              <textarea readOnly value={generatedCourseText} aria-label="本课群发作业文案" />
            </div>
          </div>

          <div className="course-section" id="book-course-library">
            <h3>热门书籍转化课程</h3>
            <div className="book-course-grid">
              {bookCourses.map((course) => (
                <article
                  key={course.courseTitle}
                  id={`book-course-${contentId(course.courseTitle)}`}
                  className={[
                    "book-course-card",
                    activeWork.completedBooks?.[course.courseTitle] ? "done" : "",
                    activeBookTitle === course.courseTitle ? "active" : "",
                  ].join(" ")}
                >
                  <span>{course.source}</span>
                  <strong>{course.courseTitle}</strong>
                  <p>{course.model}</p>
                  <ul>
                    {course.outline.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <em>{course.assignment}</em>
                  <label className="book-assignment-field">
                    我的作业
                    <textarea
                      value={activeWork.bookAssignments?.[course.courseTitle] ?? ""}
                      onChange={(event) => updateBookAssignment(course.courseTitle, event.target.value)}
                      placeholder="把书里的模型转成自己的一个行动。"
                    />
                  </label>
                  <button
                    className={activeWork.completedBooks?.[course.courseTitle] ? "book-complete-btn active" : "book-complete-btn"}
                    onClick={() => toggleBookCourse(course.courseTitle)}
                  >
                    {activeWork.completedBooks?.[course.courseTitle] ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                    {activeWork.completedBooks?.[course.courseTitle] ? "书籍课已完成" : "完成这节书籍课"}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="course-section course-action-plan" id="course-action-plan">
            <h3>系统行动方案</h3>
            <div className="course-action-grid">
              <label>
                本系统我最需要改变的旧模式
                <textarea
                  value={activeWork.oldPattern ?? ""}
                  onChange={(event) => patchActiveWork((work) => ({ ...work, oldPattern: event.target.value }))}
                  placeholder="例：情绪一紧张就刷手机、吃甜食，回避真正任务。"
                />
              </label>
              <label>
                未来 7 天最小执行方案
                <textarea
                  value={activeWork.actionPlan ?? ""}
                  onChange={(event) => patchActiveWork((work) => ({ ...work, actionPlan: event.target.value }))}
                  placeholder="写清每天做什么、什么时候做、如何检查。"
                />
              </label>
            </div>
          </div>

          <div className="course-section" id="recommended-books">
            <h3>推荐书目</h3>
            <div className="book-grid">
              {activeCourse.books.map(([title, author, reason, url]) => (
                <a key={title} className="book-card" href={url} target="_blank" rel="noreferrer">
                  <strong>{title}</strong>
                  <span>{author}</span>
                  <p>{reason}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="course-section audio-block" id="course-audio">
            <div>
              <Headphones size={20} />
              <h3>课程语音概要</h3>
            </div>
            <p>MP3 文件已生成，可直接在平台内播放。</p>
            <audio controls src={assetPath(activeCourse.audio.file)}>
              当前浏览器不支持音频播放。
            </audio>
          </div>
        </section>
      </div>

      <section className="panel lesson-library-panel">
        <SectionTitle icon={ClipboardList} title="完整理论课库" action={`${lessonLibrary.length} 节系统课`} />
        <div className="lesson-library-grid">
          {lessonLibrary.map((lesson) => (
            <button
              key={`${lesson.systemId}-${lesson.number}`}
              className={[
                "lesson-library-card",
                lesson.systemId === activeCourse.id ? "active" : "",
                courseWork[lesson.systemId]?.completedLessons?.[(lesson.number - 1) % 4] ? "done" : "",
              ].join(" ")}
              onClick={() => {
                selectCourse(lesson.systemId, (lesson.number - 1) % 4, "lesson-workbench");
              }}
            >
              <span>Lesson {String(lesson.number).padStart(2, "0")}</span>
              <strong>{lesson.title}</strong>
              <em>{lesson.order} · {lesson.systemName}</em>
              <p>{lesson.body}</p>
              <small>作业：{lesson.practice}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel lesson-library-panel">
        <SectionTitle icon={BookOpen} title="书籍转化课库" action={`${totalBookCourses} 节精读转化课`} />
        <div className="book-library-grid">
          {systemCourseCatalog.map((course) => (
            <article key={course.id} className="book-library-system">
              <span>{course.order}</span>
              <strong>{course.name}</strong>
              {(bookCourseTracks[course.id] ?? []).map((item) => (
                <button
                  key={item.courseTitle}
                  className={courseWork[course.id]?.completedBooks?.[item.courseTitle] ? "book-library-row done" : "book-library-row"}
                  onClick={() => selectCourse(course.id, 0, `book-course-${contentId(item.courseTitle)}`, item.courseTitle)}
                >
                  <em>{item.source}</em>
                  <b>{item.courseTitle}</b>
                  <small>{item.assignment}</small>
                </button>
              ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TheoryView() {
  return (
    <div className="theory-layout">
      <section className="panel theory-hero-panel">
        <SectionTitle icon={Brain} title="平台理论总纲" action={courseTheory.source.title} />
        <p className="theory-thesis">{courseTheory.thesis}</p>
        <div className="source-card">
          <span>{courseTheory.source.recordedAt}</span>
          <strong>{courseTheory.source.duration}</strong>
          <em>{courseTheory.source.transcriptParagraphs} 段转写</em>
        </div>
        <div className="keyword-row">
          {courseTheory.source.keywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={Compass} title="六条底层原则" action="从理论到行为" />
        <div className="principle-grid">
          {courseTheory.principles.map((principle) => (
            <article key={principle.title} className="principle-card">
              <strong>{principle.title}</strong>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel theory-wide">
        <SectionTitle icon={LineChart} title="八个个人运行系统" action="平台长期主架构" />
        <div className="system-theory-grid">
          {courseTheory.personalSystems.map(([title, body], index) => (
            <article key={title} className="system-theory-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel theory-wide">
        <SectionTitle icon={Activity} title="身心能量四模块" action="当前 30 天训练主线" />
        <div className="module-grid">
          {courseTheory.energyModules.map((module) => (
            <article key={module.title} className="module-card">
              <span>{module.schedule}</span>
              <h3>{module.title}</h3>
              <p>{module.model}</p>
              <em>{module.product}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={ClipboardList} title="打卡与学习机制" action="让知道变成做到" />
        <div className="mechanism-list">
          {courseTheory.mechanisms.map(([title, body]) => (
            <article key={title} className="mechanism-item">
              <CheckCircle2 size={18} />
              <div>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel theory-wide brand-guidelines-panel" id="brand-guidelines">
        <SectionTitle icon={Sparkles} title="newlife30 高端品牌视觉规范" action="视觉资产 v1" />
        <div className="brand-guideline-hero">
          <div>
            <span>Brand System</span>
            <h2>克制、系统、可持续的高端个人成长平台</h2>
            <p>
              newlife30 的视觉不是“打卡工具”，而是“个人运行系统”的可视化：
              深色建立仪式感，浅色承载长期使用，香槟色只用于关键行动和成就。
            </p>
          </div>
          <a href={assetPath("/brand/newlife30-brand-guidelines.md")} target="_blank" rel="noreferrer">
            打开完整规范
          </a>
        </div>

        <div className="brand-palette-grid">
          {brandVisualGuidelines.palette.map(([name, color, usage]) => (
            <article key={name} className="brand-swatch-card">
              <i style={{ background: color }} />
              <strong>{name}</strong>
              <span>{color}</span>
              <p>{usage}</p>
            </article>
          ))}
        </div>

        <div className="brand-guideline-grid">
          <div>
            <h3>视觉原则</h3>
            {brandVisualGuidelines.principles.map(([title, body]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div>
            <h3>核心组件</h3>
            {brandVisualGuidelines.components.map(([title, body]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={NotebookPen} title="课程章节证据" action="AI 章节" />
        <div className="chapter-list">
          {courseTheory.chapters.map(([time, title]) => (
            <div key={`${time}-${title}`} className="chapter-row">
              <span>{time}</span>
              <p>{title}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressStats({ score, todayDay, streak, averageEnergy, systemCourseProgress, navigateToView, compact = false }) {
  return (
    <section className={compact ? "stats-row secondary-stats" : "stats-row"} aria-label="训练进度">
      <MetricCard
        label="30天进度"
        value={`${score.completedDays}/30`}
        detail={`今天是第 ${todayDay} 天`}
        icon={LineChart}
        onClick={() => navigateToView("dashboard", "day-progress-panel")}
      />
      <MetricCard
        label="连续完成"
        value={`${streak}天`}
        detail="从第 1 天起连续计算"
        icon={Flame}
        onClick={() => navigateToView("dashboard", "daily-ritual")}
      />
      <MetricCard
        label="平均精力"
        value={averageEnergy ? `${averageEnergy}/5` : "未记录"}
        detail="来自每日状态打卡"
        icon={Activity}
        onClick={() => navigateToView("nutrition", "sleep-score")}
      />
      <MetricCard
        label="体系课程"
        value={`${systemCourseProgress.completedLessons}/${systemCourseProgress.totalLessons}`}
        detail={`核心课 ${score.completedCourses}/4 · 书籍课 ${systemCourseProgress.completedBookCourses}/${systemCourseProgress.totalBookCourses}`}
        icon={BookOpen}
        onClick={() => navigateToView("courses", "system-course-detail")}
      />
      <MetricCard
        label="积分"
        value={`${score.totalScore}`}
        detail={`打卡 ${score.dailyScore} · 课程 ${score.courseScore} · 小组 ${score.groupScore}`}
        icon={ClipboardCheck}
        onClick={() => navigateToView("group")}
      />
    </section>
  );
}

function MetricCard({ label, value, detail, icon: Icon, onClick }) {
  const Component = onClick ? "button" : "article";
  return (
    <Component className={onClick ? "metric-card metric-button" : "metric-card"} onClick={onClick}>
      <Icon size={21} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </Component>
  );
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="section-title">
      <div>
        <Icon size={19} />
        <h2>{title}</h2>
      </div>
      <span>{action}</span>
    </div>
  );
}

function StateSlider({ label, value, onChange }) {
  return (
    <label className="state-slider">
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function CheckinModesPanel({ activeDay, check, updateCheckinTemplate, large = false }) {
  const [activeModeId, setActiveModeId] = useState(checkinModes[0].id);
  const [copiedMode, setCopiedMode] = useState("");
  const activeMode = checkinModes.find((mode) => mode.id === activeModeId) ?? checkinModes[0];
  const values = check.checkinTemplates?.[activeMode.id] ?? {};
  const generatedText = buildCheckinMessage(activeMode, values, activeDay);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopiedMode(activeMode.id);
      window.setTimeout(() => setCopiedMode(""), 1600);
    } catch {
      setCopiedMode("");
    }
  };

  return (
    <section className={large ? "panel checkin-panel large" : "panel checkin-panel"}>
      <SectionTitle icon={ClipboardList} title="打卡模式" action={activeMode.deadline} />

      <div className="mode-tabs" role="tablist" aria-label="打卡模板">
        {checkinModes.map((mode) => (
          <button
            key={mode.id}
            className={mode.id === activeMode.id ? "mode-tab active" : "mode-tab"}
            onClick={() => setActiveModeId(mode.id)}
          >
            {mode.title}
          </button>
        ))}
      </div>

      <div className="mode-brief">
        <TimerReset size={18} />
        <div>
          <strong>{activeMode.deadline}</strong>
          <p>{activeMode.intent}</p>
        </div>
      </div>

      <div className="template-fields">
        {activeMode.prompts.map((prompt, index) => (
          <label key={prompt.key} className="template-field">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{prompt.label}</strong>
            <em>{prompt.helper}</em>
            <textarea
              value={values[prompt.key] ?? ""}
              onChange={(event) => updateCheckinTemplate(activeMode.id, prompt.key, event.target.value)}
              placeholder={prompt.placeholder}
            />
          </label>
        ))}
      </div>

      <div className="specificity-box">
        <div>
          <strong>不是这样</strong>
          <p>“多吃蔬菜”</p>
        </div>
        <div>
          <strong>而是这样</strong>
          <p>“先吃半碗蔬菜，再吃其他”</p>
        </div>
      </div>

      <div className="generated-checkin">
        <div className="generated-head">
          <strong>群发文案</strong>
          <button onClick={copyText}>
            <Copy size={16} />
            {copiedMode === activeMode.id ? "已复制" : "复制"}
          </button>
        </div>
        <textarea readOnly value={generatedText} aria-label="生成的群发打卡文案" />
      </div>
    </section>
  );
}

function calculateSleepScore(scores = {}) {
  return sleepScoreModel.items.reduce((sum, item) => sum + Number(scores[item.key] ?? 0), 0);
}

function getSleepFeedback(total) {
  if (total >= 85) return "系统稳定：今晚保留现有结构，只做轻微优化。";
  if (total >= 60) return "基本可用：优先修正最低分项，不要一次改太多。";
  return "先救底盘：今晚只做一个最小动作，先让睡眠和饮食发生。";
}

function buildSleepShareText(activeDay, total, check) {
  const homework = check.sleepHomework ?? {};
  return [
    `【Day ${activeDay}｜饮食 + 睡眠 100 分】`,
    "",
    `今日总分：${total}/100`,
    `系统反馈：${getSleepFeedback(total)}`,
    "",
    "1. 今天我对睡眠的新认识：",
    homework.newInsight || "（待填写）",
    "",
    "2. 我最需要改善的是：",
    homework.priorityFix || "（待填写）",
    "",
    "3. 这一周我计划如何调整：",
    homework.weekPlan || "（待填写）",
  ].join("\n");
}

function SleepScorePanel({ activeDay, check, updateCheck }) {
  const [copied, setCopied] = useState(false);
  const scores = check.sleepScores ?? {};
  const homework = check.sleepHomework ?? {};
  const total = calculateSleepScore(scores);
  const shareText = buildSleepShareText(activeDay, total, check);

  const updateScore = (key, value) => {
    updateCheck(activeDay, {
      sleepScores: {
        ...scores,
        [key]: value,
      },
    });
  };

  const updateHomework = (key, value) => {
    updateCheck(activeDay, {
      sleepHomework: {
        ...homework,
        [key]: value,
      },
    });
  };

  const copySleepText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="panel sleep-score-panel" id="sleep-score">
      <SectionTitle icon={Moon} title="睡眠系统评分" action={`${total}/100`} />
      <div className="sleep-score-hero">
        <div>
          <span>{sleepScoreModel.title}</span>
          <h3>饮食 + 睡眠 100 分制</h3>
          <p>{sleepScoreModel.subtitle}</p>
        </div>
        <strong>{total}</strong>
      </div>

      <div className="sleep-group-row">
        {sleepScoreModel.groups.map(([title, score, body]) => (
          <article key={title}>
            <span>{title}</span>
            <strong>{score}分</strong>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <div className="sleep-score-table">
        {sleepScoreModel.items.map((item) => {
          const current = Number(scores[item.key] ?? 0);
          const options = [
            [0, "0分"],
            [item.half, "一半"],
            [item.max, "满分"],
          ];
          return (
            <article key={item.key} className="sleep-score-item">
              <div>
                <span>{item.group}</span>
                <strong>{item.title}</strong>
                <em>{item.max}分</em>
              </div>
              <p>{current === item.max ? item.full : current > 0 ? item.partial : item.zero}</p>
              <div className="score-option-row">
                {options.map(([value, label]) => (
                  <button
                    key={`${item.key}-${value}`}
                    className={current === value ? "score-option active" : "score-option"}
                    onClick={() => updateScore(item.key, value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="sleep-feedback-box">
        <strong>{getSleepFeedback(total)}</strong>
        <p>来自新材料：好睡眠不靠感觉，要看“睡得准、睡得够、睡得深、醒得好”。</p>
      </div>

      <div className="sleep-challenge-grid">
        {sleepScoreModel.challengeModules.map(([title, action, rating]) => (
          <article key={title}>
            <span>{title}</span>
            <p>{action}</p>
            <em>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</em>
          </article>
        ))}
      </div>

      <div className="sleep-homework-grid">
        {sleepScoreModel.homeworkPrompts.map(([key, label, placeholder]) => (
          <label key={key}>
            {label}
            <textarea
              value={homework[key] ?? ""}
              onChange={(event) => updateHomework(key, event.target.value)}
              placeholder={placeholder}
            />
          </label>
        ))}
      </div>

      <div className="generated-checkin sleep-copy-box">
        <div className="generated-head">
          <strong>睡眠作业群发文案</strong>
          <button onClick={copySleepText}>
            <Copy size={16} />
            {copied ? "已复制" : "复制"}
          </button>
        </div>
        <textarea readOnly value={shareText} aria-label="睡眠作业群发文案" />
      </div>

      <div className="material-duo">
        <figure className="material-strip">
          <img src={assetPath("/materials/sleep-score-100.jpg")} alt="饮食和睡眠 100 分制材料" />
          <figcaption>新材料已转化为可点击评分表。</figcaption>
        </figure>
        <figure className="material-strip">
          <img src={assetPath("/materials/sleep-homework.png")} alt="睡眠课程作业材料" />
          <figcaption>睡眠作业已转化为群发模板。</figcaption>
        </figure>
      </div>
    </section>
  );
}

function KitchenSystemPanel({ activeDay, check, updateCheck }) {
  const audit = check.kitchenAudit ?? {};
  const plan = check.kitchenPlan ?? {};
  const completed = kitchenSystem.audit.filter(([key]) => audit[key]).length;

  const toggleAudit = (key) => {
    updateCheck(activeDay, {
      kitchenAudit: {
        ...audit,
        [key]: !audit[key],
      },
    });
  };

  const updatePlan = (key, value) => {
    updateCheck(activeDay, {
      kitchenPlan: {
        ...plan,
        [key]: value,
      },
    });
  };

  return (
    <section className="panel kitchen-system-panel">
      <SectionTitle icon={Utensils} title={kitchenSystem.title} action={`${completed}/${kitchenSystem.audit.length} 已建立`} />
      <div className="kitchen-hero">
        <span>{kitchenSystem.subtitle}</span>
        <h3>把做饭从临时任务，升级成稳定供给系统</h3>
        <p>{kitchenSystem.definition}</p>
        <strong>{kitchenSystem.formula}</strong>
      </div>

      <div className="kitchen-module-grid">
        {kitchenSystem.modules.map(([title, body]) => (
          <article key={title}>
            <strong>{title}</strong>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <div className="kitchen-minimum-list">
        {kitchenSystem.minimum.map(([title, body]) => (
          <article key={title}>
            <span>{title}</span>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <div className="kitchen-audit-list">
        {kitchenSystem.audit.map(([key, label]) => (
          <button
            key={key}
            className={audit[key] ? "kitchen-audit-row active" : "kitchen-audit-row"}
            onClick={() => toggleAudit(key)}
          >
            {audit[key] ? <CheckCircle2 size={17} /> : <Circle size={17} />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="kitchen-plan-grid">
        <label>
          我的 10 道基础餐/基础组合
          <textarea
            value={plan.menu ?? ""}
            onChange={(event) => updatePlan("menu", event.target.value)}
            placeholder="例：鸡蛋牛奶燕麦；鸡腿紫薯西兰花；鱼豆腐菠菜。"
          />
        </label>
        <label>
          下周厨房系统最小改造
          <textarea
            value={plan.nextStep ?? ""}
            onChange={(event) => updatePlan("nextStep", event.target.value)}
            placeholder="例：周日采购一次，肉类分装，晚饭后 5 分钟复盘。"
          />
        </label>
      </div>

      <a className="material-link" href={assetPath(kitchenSystem.pdf)} target="_blank" rel="noreferrer">
        查看完整 PDF：厨房系统建模
      </a>
    </section>
  );
}

function LearningMechanism({ state, toggleCourse, updateCheck, activeDay, check, large = false }) {
  return (
    <section className={large ? "panel learning-panel large" : "panel learning-panel"}>
      <SectionTitle icon={BookOpen} title="学习机制" action="4 次核心课 + 每日闭环" />
      <div className="learning-loop" aria-label="学习闭环">
        <span>输入</span>
        <ChevronRight size={17} />
        <span>输出</span>
        <ChevronRight size={17} />
        <span>应用</span>
        <ChevronRight size={17} />
        <span>复盘</span>
      </div>

      <div className="course-list">
        {coreCourses.map((course) => (
          <button
            key={course.id}
            className={state.courses[course.id] ? "course-row done" : "course-row"}
            onClick={() => toggleCourse(course.id)}
          >
            {state.courses[course.id] ? <CheckCircle2 size={19} /> : <Circle size={19} />}
            <div>
              <strong>{course.title}</strong>
              <p>{course.week} · {course.focus}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="learning-notes">
        <label>
          今日学习输出
          <textarea
            value={check.learning ?? ""}
            onChange={(event) => updateCheck(activeDay, { learning: event.target.value })}
            placeholder="写 3 条要点：今天理解了什么？"
          />
        </label>
        <label>
          今日应用动作
          <textarea
            value={check.application ?? ""}
            onChange={(event) => updateCheck(activeDay, { application: event.target.value })}
            placeholder="写 1 个动作：把知识用到哪里？"
          />
        </label>
      </div>
    </section>
  );
}

function GroupFieldView({ state, setState, activeDay, activeDayDate, check, updateCheck, score }) {
  const [copied, setCopied] = useState(false);
  const group = {
    name: "一组",
    role: "组员",
    members: "",
    leaderboard: "",
    review: "",
    ...(state.group ?? {}),
  };
  const currentStatus = check.completed ? "已完成，个人 +10" : "未完成，可先真实记录";
  const groupStatus = check.groupFullAttendance ? "今日小组满勤，团队 +30" : "今日尚未标记满勤";
  const makeupStatus = `${score.makeupDays}/3`;
  const groupMessage = [
    `【第 ${activeDay} 天小组统计】`,
    `日期：${activeDayDate}`,
    `小组：${group.name}｜角色：${group.role}`,
    "",
    `个人打卡：${currentStatus}`,
    `小组满勤：${check.groupFullAttendance ? "是，+30" : "否"}`,
    `补打卡使用：${makeupStatus}`,
    "",
    `个人积分：${score.dailyScore + score.courseScore}`,
    `小组加分：${score.groupScore}`,
    `当前总分：${score.totalScore}`,
    "",
    "明日提醒：22:00 前完成真实、简洁、可持续的打卡；没做到也要记录。",
  ].join("\n");

  const updateGroupField = (key, value) => {
    setState((current) => ({
      ...current,
      group: {
        ...(current.group ?? {}),
        [key]: value,
      },
    }));
  };

  const toggleMakeup = () => {
    if (!check.makeup && score.makeupDays >= 3) {
      window.alert("每人最多 3 次补打卡，当前已经用完。");
      return;
    }
    updateCheck(activeDay, { makeup: !check.makeup });
  };

  const copyGroupMessage = async () => {
    try {
      await navigator.clipboard.writeText(groupMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group-layout">
      <section className="panel group-score-panel">
        <SectionTitle icon={LineChart} title="积分规则" action="每日 +10 · 作业 +20 · 满勤 +30" />
        <div className="group-metric-grid">
          <article className="group-stat-card">
            <span>每日打卡</span>
            <strong>{score.dailyScore}</strong>
            <p>{score.completedDays} 天完成，每天 +10。</p>
          </article>
          <article className="group-stat-card">
            <span>课程作业</span>
            <strong>{score.courseScore}</strong>
            <p>{score.completedCourses} 门核心课，每门 +20。</p>
          </article>
          <article className="group-stat-card">
            <span>小组满勤</span>
            <strong>{score.groupScore}</strong>
            <p>{score.groupFullDays} 天满勤，每天 +30。</p>
          </article>
          <article className="group-stat-card">
            <span>补打卡</span>
            <strong>{makeupStatus}</strong>
            <p>最多 3 次，用于保护连续性。</p>
          </article>
        </div>
      </section>

      <section className="panel group-day-panel">
        <SectionTitle icon={ClipboardCheck} title="今日小组统计" action={`Day ${activeDay}`} />
        <div className="group-day-status">
          <div>
            <strong>{currentStatus}</strong>
            <p>完成今日打卡会自动计入个人积分。</p>
          </div>
          <div>
            <strong>{groupStatus}</strong>
            <p>由组长根据次日 9 点统计结果手动标记。</p>
          </div>
        </div>
        <div className="group-day-actions">
          <button
            className={check.groupFullAttendance ? "group-toggle active" : "group-toggle"}
            onClick={() => updateCheck(activeDay, { groupFullAttendance: !check.groupFullAttendance })}
          >
            <CheckCircle2 size={17} />
            {check.groupFullAttendance ? "取消小组满勤" : "标记小组满勤 +30"}
          </button>
          <button className={check.makeup ? "group-toggle active" : "group-toggle"} onClick={toggleMakeup}>
            <RefreshCw size={17} />
            {check.makeup ? "取消补打卡" : "标记为补打卡"}
          </button>
        </div>
        <div className="group-rules">
          <span>真实</span>
          <span>简洁</span>
          <span>持续</span>
          <span>允许没做到，但不失联</span>
        </div>
      </section>

      <section className="panel group-form-panel">
        <SectionTitle icon={MessageCircle} title="组长后台" action="名单 · 排行 · 复盘" />
        <div className="group-form-grid">
          <label>
            小组名称
            <input value={group.name} onChange={(event) => updateGroupField("name", event.target.value)} />
          </label>
          <label>
            我的角色
            <input value={group.role} onChange={(event) => updateGroupField("role", event.target.value)} />
          </label>
        </div>
        <label className="group-text-field">
          成员名单
          <textarea
            value={group.members}
            onChange={(event) => updateGroupField("members", event.target.value)}
            placeholder="例：奥斯卡、张麟、兔兔、叶媚媚"
          />
        </label>
        <label className="group-text-field">
          小组排行记录
          <textarea
            value={group.leaderboard}
            onChange={(event) => updateGroupField("leaderboard", event.target.value)}
            placeholder="例：一组 260 分；二组 240 分；个人前三：A、B、C"
          />
        </label>
        <label className="group-text-field">
          每周 15 分钟复盘
          <textarea
            value={group.review}
            onChange={(event) => updateGroupField("review", event.target.value)}
            placeholder="记录本周有效动作、断点、下周微调。"
          />
        </label>
      </section>

      <section className="panel group-message-panel">
        <SectionTitle icon={ClipboardList} title="组长统计文案" action="次日 9:00" />
        <div className="generated-head">
          <strong>可复制到群里</strong>
          <button onClick={copyGroupMessage}>
            <Copy size={16} />
            {copied ? "已复制" : "复制"}
          </button>
        </div>
        <textarea readOnly value={groupMessage} aria-label="小组统计文案" />
      </section>
    </div>
  );
}

function CommitmentPanel({ state, setState }) {
  return (
    <section className="panel commitment-panel">
      <SectionTitle icon={ShieldCheck} title="承诺书" action={state.pledgeAccepted ? "已确认" : "待确认"} />
      <div className="commitment-layout">
        <img src={assetPath("/materials/commitment.jpg")} alt="30天身心能量系统承诺书" />
        <div className="commitment-copy">
          {commitments.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
          <button
            className={state.pledgeAccepted ? "primary-action accepted" : "primary-action"}
            onClick={() => setState((current) => ({ ...current, pledgeAccepted: !current.pledgeAccepted }))}
          >
            <ShieldCheck size={17} />
            {state.pledgeAccepted ? "我会继续执行" : "我确认并接受"}
          </button>
        </div>
      </div>
    </section>
  );
}

function SystemDetail({ system, onOpenCourse, onOpenDaily }) {
  const Icon = iconMap[system.icon];
  return (
    <article className="system-detail-content">
      <div className="system-hero">
        <Icon size={30} />
        <div>
          <span>{system.order}</span>
          <h2>{system.name}</h2>
        </div>
      </div>
      <div className="system-meta">
        <span>难度：{system.difficulty}</span>
        <span>典型用时：{system.duration}</span>
      </div>
      <dl>
        <dt>核心内容</dt>
        <dd>{system.content}</dd>
        <dt>价值</dt>
        <dd>{system.value}</dd>
        <dt>训练方式</dt>
        <dd>
          {system.training.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </dd>
      </dl>
      <div className="system-action-row">
        <button onClick={onOpenCourse}>
          <BookOpen size={17} />
          学习本系统课程
        </button>
        <button onClick={onOpenDaily}>
          <ClipboardCheck size={17} />
          回到今日训练
        </button>
      </div>
    </article>
  );
}

export default App;
