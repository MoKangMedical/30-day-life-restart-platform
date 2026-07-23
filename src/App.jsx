import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ClipboardList,
  ClipboardSignature,
  Compass,
  Copy,
  Cloud,
  CloudUpload,
  Flame,
  Gift,
  Headphones,
  HeartPulse,
  LineChart,
  LogIn,
  MessageCircle,
  MonitorPlay,
  Moon,
  NotebookPen,
  RefreshCw,
  RotateCcw,
  Route,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sunrise,
  Target,
  TimerReset,
  Utensils,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
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
  academyCohortRhythm,
  academyDelivery,
  academyMethod,
  academyPhases,
  academyStats,
  bookCourseTracks,
  immersiveCourseCollections,
  lessonContentDetails,
  systemCourseCatalog,
} from "./systemCourses.js";
import { getPreferenceCalibration, getPreferenceMap, preferenceAxisDefinitions, preferenceQuestions } from "./preferenceMap.js";
import {
  cloudConfigured,
  getCloudSession,
  loadCloudProgress,
  onCloudAuthChange,
  saveCloudProgress,
  sendPhoneOtp,
  signOutCloud,
  startWechatLogin,
  verifyPhoneOtp,
} from "./cloudSync.js";

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

const routeDefinitions = {
  landing: {
    path: "/",
    label: "首页",
    eyebrow: "NEWLIFE30",
    title: "从一个真实问题开始",
    description: "不用先学完所有内容。先确认你现在最想改善的状态，再进入当天的最小行动。",
    nextView: "dashboard",
    nextLabel: "进入今天的行动",
  },
  dashboard: {
    path: "/today",
    label: "今天",
    eyebrow: "今天的行动",
    title: "今天只做这一组动作",
    description: "先完成今天的任务、记录真实状态、留下复盘。其他功能只在你需要时打开。",
    nextView: "learning",
    nextLabel: "查看 30 天路径",
  },
  learning: {
    path: "/path",
    label: "30 天路径",
    eyebrow: "训练路线",
    title: "知道现在在哪，也知道下一步去哪",
    description: "按天查看训练主题、当日输出与练习安排。完成一段，再进入下一段。",
    nextView: "courses",
    nextLabel: "选择一门课程",
  },
  courses: {
    path: "/courses",
    label: "精品课程",
    eyebrow: "学习与练习",
    title: "每门课都对应一个可执行改变",
    description: "选择你当前最需要的系统课，完成学习、练习和一次真实应用。",
    nextView: "dashboard",
    nextLabel: "回到今天行动",
  },
  group: {
    path: "/review",
    label: "记录与复盘",
    eyebrow: "记录与陪伴",
    title: "把行动留下来，才看得见改变",
    description: "在这里完成打卡、同伴互动和周期复盘，不需要写得完美，只要保持连接。",
    nextView: "dashboard",
    nextLabel: "完成今日打卡",
  },
  systems: {
    path: "/systems",
    label: "八大系统",
    eyebrow: "个人运行系统",
    title: "不是补一张计划表，而是补齐运行环节",
    description: "从身心能量到反馈进化，选择你最需要先修复的一环，再进入对应训练。",
    nextView: "courses",
    nextLabel: "学习对应课程",
  },
  nutrition: {
    path: "/body",
    label: "身体底盘",
    eyebrow: "身体底盘",
    title: "先让睡眠和饮食支持你的行动",
    description: "用轻量记录识别最薄弱的一环，为明天写下一条具体可执行的微调。",
    nextView: "dashboard",
    nextLabel: "回到今日行动",
  },
  campaign: {
    path: "/programs",
    label: "训练营选择",
    eyebrow: "训练营",
    title: "选择最贴近你当前状态的一条训练线",
    description: "每条训练营都有明确的起点、30 天行动安排和结业成果，不需要一次做完所有事。",
    nextView: "dashboard",
    nextLabel: "开始今天的训练",
  },
  theory: {
    path: "/method",
    label: "方法与依据",
    eyebrow: "训练方法",
    title: "先理解方法，再把它用在今天",
    description: "这里解释平台为什么这样设计。阅读后回到今天的行动，把理解变成一次实践。",
    nextView: "dashboard",
    nextLabel: "回到今天行动",
  },
};

const primaryViewIds = ["dashboard", "learning", "courses", "group", "systems"];
const secondaryViewIds = ["nutrition", "campaign", "theory"];

function getViewFromHash() {
  if (typeof window === "undefined") return "landing";
  const requestedPath = window.location.hash.replace(/^#/, "") || "/";
  return Object.entries(routeDefinitions).find(([, route]) => route.path === requestedPath)?.[0] ?? "landing";
}

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
    onboarding: {},
    preferenceMap: {
      responses: {},
      completedAt: "",
    },
    goalMap: {
      outcome: "",
      meaning: "",
      dailyAction: "",
      milestones: {},
      balance: {
        energy: 3,
        focus: 3,
        relationship: 3,
        recovery: 3,
      },
    },
    outcomeReview: {},
    cloud: {
      syncEnabled: false,
      lastSyncedAt: "",
    },
    reminderSettings: {
      enabled: false,
      time: "20:45",
    },
    reminderLog: {},
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

const checkpointMilestones = [
  {
    day: 1,
    badge: "启动见证",
    title: "Day 1：先让系统真正启动",
    body: "确认当前问题、完成第一组动作，并写下明天仍愿意回来的理由。",
    reportPrompt: "我今天决定先改变什么？为什么这件事值得被保护？",
  },
  {
    day: 7,
    badge: "第一周见证",
    title: "Day 7：把感受转成可复用的规则",
    body: "回看第一周最有效的一个动作，找出最容易断线的环节。",
    reportPrompt: "第一周里，什么动作最值得保留？我下周准备怎样降低断线概率？",
  },
  {
    day: 14,
    badge: "节律见证",
    title: "Day 14：让节律开始替代临时意志",
    body: "确认哪些动作已经进入固定场域，并删掉一个不再必要的负担。",
    reportPrompt: "我已经形成了什么固定节律？下一阶段只需要继续守住什么？",
  },
  {
    day: 30,
    badge: "重启结业徽章",
    title: "Day 30：把改变写进个人运行手册",
    body: "完成结业复盘、领取重启徽章，并为下一轮 30 天保留一个最小实验。",
    reportPrompt: "这 30 天最真实的改变是什么？我下一轮只继续哪一个系统？",
  },
];

const resetQuestChapters = [
  { start: 1, end: 7, label: "第一章", title: "稳定底盘", body: "先让身体、承诺和真实记录稳定下来。" },
  { start: 8, end: 14, label: "第二章", title: "重建节律", body: "把重要动作放进可回归的日周结构。" },
  { start: 15, end: 21, label: "第三章", title: "升级认知", body: "让学习、表达和反馈开始产生能力。" },
  { start: 22, end: 28, label: "第四章", title: "形成身份", body: "把价值排序和关系支持整合成长期选择。" },
  { start: 29, end: 30, label: "终章", title: "写入手册", body: "把有效动作压缩成下一轮可运行的规则。" },
];

const questLevels = [
  { level: 1, title: "启程者", minXp: 0, nextXp: 60 },
  { level: 2, title: "校准者", minXp: 60, nextXp: 160 },
  { level: 3, title: "践行者", minXp: 160, nextXp: 300 },
  { level: 4, title: "构建者", minXp: 300, nextXp: 500 },
  { level: 5, title: "重启者", minXp: 500, nextXp: null },
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
    body: "每个系统 4 节精选课，按问题、模型、案例、作业组织；一周只攻一个真实卡点。",
    metric: "8 个系统 · 32 节课",
    target: "lesson-workbench",
  },
  {
    label: "Book Lab",
    title: "书籍转化课",
    body: "把经典书籍中的模型转成课程作业，不做读书摘抄，只保留能用在当天的训练。",
    metric: "24 节精读转化",
    target: "book-course-library",
  },
  {
    label: "Cohort Lab",
    title: "陪跑工作坊",
    body: "Day 1 定题、Day 2-5 应用、Day 6 互评、Day 7 复盘，让内容、工具和小组只服务一个成果。",
    metric: "4 个周训练节奏",
    target: "academy-cohort-rhythm",
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

const internationalProductGoals = [
  {
    platform: "Mindvalley",
    goal: "每天 20 分钟也能进入转化训练",
    lesson: "把大课程拆成每日微训练，让用户不用等有整块时间才开始。",
  },
  {
    platform: "Fabulous",
    goal: "用行为科学建立晨间、日间、晚间 routine",
    lesson: "从用户生活场景出发，给出可被完成的流程，而不是泛泛建议。",
  },
  {
    platform: "Headspace",
    goal: "用户按压力、睡眠、焦虑、专注等状态进入内容",
    lesson: "把入口从课程分类改成用户当前问题，降低第一次使用门槛。",
  },
  {
    platform: "Brilliant / Duolingo",
    goal: "挑战、连胜、每日目标让用户持续回来",
    lesson: "留存机制必须服务学习和行动，不做廉价游戏化。",
  },
];

const fabulousBenchmark = {
  strengths: [
    ["理论线索清晰", "从日常场景进入行为改变，降低用户对“自律”的理解门槛。"],
    ["体验引导轻", "把大目标拆成可开始的小动作，让第一次行动不需要意志力硬撑。"],
    ["反馈节奏短", "以日常提示、连续完成和微习惯回看，给用户即时的完成感。"],
  ],
  gaps: [
    ["周期闭环较弱", "单点习惯容易开始，但缺少固定 7、14、30 天的训练与复盘节奏。"],
    ["本土场景有限", "对中国用户的家庭、职场、群体互助和时间现实需要更细的适配。"],
    ["关系支持不足", "缺少真实同伴的输出、回应与共同完成机制，留存更多依赖个人。"],
  ],
};

const userNeedEntries = [
  {
    id: "sleep",
    title: "睡不好",
    body: "先进入睡眠饮食评分，找到今晚最值得调整的一步。",
    action: "做睡眠评分",
    view: "nutrition",
    scrollId: "sleep-score",
    intention: "今晚先完成睡眠饮食评分，找到一个可执行调整。",
  },
  {
    id: "energy",
    title: "没精力",
    body: "从身心能量系统开始，先稳定饮食、睡眠、运动和情绪。",
    action: "看能量系统",
    view: "systems",
    scrollId: "system-detail-panel",
    systemId: "energy",
    intention: "今天只保护一件事：先恢复精力，不硬扛。",
  },
  {
    id: "chaos",
    title: "节奏乱",
    body: "进入今日开启仪式，把今天压缩成一个能完成的闭环。",
    action: "开启今日",
    view: "dashboard",
    scrollId: "daily-ritual",
    intention: "今天不求多，只完成一个清晰闭环。",
  },
  {
    id: "learning",
    title: "学不进去",
    body: "从课程研究院进入当前系统课，把一节课转成一个动作。",
    action: "进入课程",
    view: "courses",
    scrollId: "lesson-workbench",
    systemId: "learning",
    intention: "今天只学一节课，并写下一个可执行动作。",
  },
];

const restartProfiles = [
  {
    id: "pressure",
    title: "高压职场人",
    range: "25-35 岁知识工作者",
    body: "白天持续输出，晚上停不下来；看起来正常，身体和节奏已经透支。",
    systems: ["energy", "rhythm", "action", "feedback"],
    icon: BriefcaseBusiness,
  },
  {
    id: "transition",
    title: "上升与转型者",
    range: "22-29 岁职业起步期",
    body: "不是不努力，而是不知道怎样把焦虑、目标、能力和身份串成一条路。",
    systems: ["action", "learning", "identity", "rhythm"],
    icon: Route,
  },
  {
    id: "independent",
    title: "自由职业者",
    range: "26-40 岁项目型工作者",
    body: "自由很多，但结构太少；工作和生活边界不断漂移。",
    systems: ["rhythm", "action", "value", "relation"],
    icon: UserRound,
  },
  {
    id: "dualRole",
    title: "家庭事业双压者",
    range: "32-42 岁多重角色人群",
    body: "每天都在处理事情，却越来越难留出恢复、关系和自己的位置。",
    systems: ["energy", "rhythm", "relation", "identity"],
    icon: UsersRound,
  },
];

const restartEntryStates = [
  { id: "sleep", title: "睡不好、醒不来", systemId: "energy", body: "先让身体从持续透支回到可恢复状态。" },
  { id: "chaos", title: "节奏乱、生活失控", systemId: "rhythm", body: "先建立一个可回归的日节奏，而不是塞满计划。" },
  { id: "stuck", title: "想改变却做不动", systemId: "action", body: "把模糊焦虑压缩成今天可验证的一个动作。" },
  { id: "lost", title: "方向感弱、学不进去", systemId: "learning", body: "先找到当前值得投入的能力和下一步学习闭环。" },
];

const resultMilestones = [
  { day: 7, title: "稳定底盘", body: "你应该开始看见睡眠、精力或日程中一个可复用的改善。" },
  { day: 14, title: "形成节律", body: "重要动作开始有固定场域，不再每天从零开始选择。" },
  { day: 30, title: "输出个人系统", body: "带走一份复盘报告和下一轮 30 天的运行方案。" },
];

const campaignProfiles = [
  {
    id: "pressure",
    tag: "FOR HIGH-PRESSURE WORK",
    navLabel: "高压职场人",
    title: "别再拿透支，\n证明你还在努力。",
    subtitle: "给 25-35 岁高压职场人的 30 天恢复与执行训练",
    body: "你不需要再学一套效率方法。先让睡眠、精力和工作节奏回到能长期运转的状态，再重新拿回高质量行动。",
    entryStateId: "sleep",
    firstSystem: "energy",
    systemIds: ["energy", "rhythm", "action"],
    painPoints: ["白天输出不断，晚上大脑停不下来", "任务越来越多，重要事情却持续后移", "周末只剩下恢复，没有真正的生活"],
    promise: "30 天后，你不会拥有一张更满的日程表，而是一套能在高压下保护恢复与关键行动的工作方式。",
    milestones: ["Day 7：找到最耗能的一个环节，并建立晚间收束动作", "Day 14：固定一个深度工作窗口和一个恢复窗口", "Day 30：完成个人高压周期运行规则"],
    ritual: "今天先保护：晚上 22:45 开始收束，不带着工作进入睡眠。",
    accent: "energy",
  },
  {
    id: "transition",
    tag: "FOR TRANSITION",
    navLabel: "上升与转型者",
    title: "方向不是想清楚的，\n是做出来的。",
    subtitle: "给职业起步、转型与重新选择的人",
    body: "当身份还没站稳，最容易把焦虑误认为不够努力。训练营会把“我该怎么办”拆成可验证的目标、能力输入和每日行动。",
    entryStateId: "stuck",
    firstSystem: "action",
    systemIds: ["action", "learning", "identity"],
    painPoints: ["计划写了很多，却一直没有一个能完成", "信息越看越多，方向反而更模糊", "担心选错路，所以迟迟不敢开始"],
    promise: "30 天后，你会留下一个可验证目标、一套学习输出机制，以及下一阶段可以继续使用的身份承诺。",
    milestones: ["Day 7：把一个焦虑转成可验证成果", "Day 14：建立输入、输出、应用、复盘的学习闭环", "Day 30：完成下一轮路径原型与身份宣言"],
    ritual: "今天先完成：为一个真实目标写下第一个 25 分钟行动。",
    accent: "action",
  },
  {
    id: "independent",
    tag: "FOR INDEPENDENT WORK",
    navLabel: "自由职业者",
    title: "自由不是没有结构，\n而是自己拥有结构。",
    subtitle: "给自由职业者、创作者与项目型工作者",
    body: "当没有组织替你安排节奏时，边界、注意力和资源都会被临时需求吞掉。你需要的不是更狠地逼自己，而是自己的运行系统。",
    entryStateId: "chaos",
    firstSystem: "rhythm",
    systemIds: ["rhythm", "action", "value"],
    painPoints: ["工作和生活混在一起，随时都像没下班", "项目很多，但没有稳定的推进节奏", "收入与机会波动时，注意力也被拉散"],
    promise: "30 天后，你会拥有一张可回归的周节奏、一套项目推进机制和一份资源取舍清单。",
    milestones: ["Day 7：画出真实的能量与工作边界", "Day 14：固定一周的产出、恢复与关系场域", "Day 30：完成个人项目与资源配置规则"],
    ritual: "今天先划出：一个不被消息打断的 60 分钟工作场域。",
    accent: "rhythm",
  },
  {
    id: "dualRole",
    tag: "FOR DUAL RESPONSIBILITY",
    navLabel: "家庭事业双压者",
    title: "照顾所有人之前，\n先让自己不被耗尽。",
    subtitle: "给家庭与职业双重责任中的成年人",
    body: "你不是时间管理失败，而是长期承担了过多角色。训练营先帮你把恢复、节律、关系和自我位置重新放回生活里。",
    entryStateId: "sleep",
    firstSystem: "energy",
    systemIds: ["energy", "rhythm", "relation"],
    painPoints: ["每天都在完成责任，却越来越难感觉到自己", "家庭沟通与工作任务相互挤压", "想休息时会内疚，想努力时又没有精力"],
    promise: "30 天后，你会形成一套更可持续的家庭-工作节律，并拥有一次更清晰、更少消耗的关键沟通方式。",
    milestones: ["Day 7：保留一个属于自己的恢复动作", "Day 14：建立家庭与工作之间的节律边界", "Day 30：完成关系支持与个人恢复的延续方案"],
    ritual: "今天先留出：晚餐后 20 分钟，只做恢复，不处理任何责任。",
    accent: "relation",
  },
];

const retentionLoops = [
  ["今日唯一动作", "减少选择，把注意力放在当前最小闭环。"],
  ["锦囊与徽章", "每天给一个轻量惊喜，让打开动作有反馈。"],
  ["连续天数", "用连胜提醒持续性，但允许真实复盘，不追求完美。"],
  ["群内输出", "把学习转成可分享文本，形成外部承诺。"],
];

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
  const completedLessons = systemCourseCatalog.reduce((sum, course) => {
    const completed = state.courseWork?.[course.id]?.completedLessons ?? {};
    return sum + course.lessons.filter((_, index) => completed[index]).length;
  }, 0);
  const completedBookCourses = Object.entries(bookCourseTracks).reduce((sum, [courseId, courses]) => {
    const completed = state.courseWork?.[courseId]?.completedBooks ?? {};
    return sum + courses.filter((course) => completed[course.courseTitle]).length;
  }, 0);
  const dailyScore = completedDays * 10;
  const courseScore = completedCourses * 20;
  const lessonScore = completedLessons * 20;
  const bookScore = completedBookCourses * 15;
  const groupScore = groupFullDays * 30;

  return {
    completedDays,
    completedCourses,
    completedLessons,
    completedBookCourses,
    dailyScore,
    courseScore,
    lessonScore,
    bookScore,
    groupFullDays,
    groupScore,
    makeupDays,
    totalScore: dailyScore + courseScore + lessonScore + bookScore + groupScore,
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

function getQuestLevel(totalScore) {
  const level = [...questLevels].reverse().find((item) => totalScore >= item.minXp) ?? questLevels[0];
  const range = level.nextXp ? level.nextXp - level.minXp : 1;
  const progress = level.nextXp ? Math.min(Math.round(((totalScore - level.minXp) / range) * 100), 100) : 100;
  return {
    ...level,
    progress,
    remaining: level.nextXp ? Math.max(level.nextXp - totalScore, 0) : 0,
  };
}

function getResetQuestChapter(activeDay) {
  return resetQuestChapters.find((chapter) => activeDay >= chapter.start && activeDay <= chapter.end) ?? resetQuestChapters.at(-1);
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
  const [cloudSession, setCloudSession] = useState(null);
  const [cloudNotice, setCloudNotice] = useState("");
  const today = getLocalDate();
  const todayDay = clamp(daysBetween(state.startDate, today) + 1, 1, 30);
  const [activeDay, setActiveDay] = useState(todayDay);
  const [activeSystemId, setActiveSystemId] = useState(programDays[todayDay - 1].systemId);
  const [activeCourseId, setActiveCourseId] = useState(systemCourseCatalog[0].id);
  const [activeView, setActiveView] = useState(getViewFromHash);
  const [pendingScroll, setPendingScroll] = useState(null);

  const activeProgram = programDays[activeDay - 1];
  const activeSystem = systems.find((system) => system.id === activeSystemId) ?? systems[0];
  const activeDaySystem = systems.find((system) => system.id === activeProgram.systemId) ?? activeSystem;
  const check = state.checks[activeDay] ?? {};
  const score = calculateScore(state);
  const systemCourseProgress = calculateSystemCourseProgress(state.courseWork);
  const cloudSnapshot = useMemo(
    () => JSON.stringify({ ...state, cloud: { ...(state.cloud ?? {}), lastSyncedAt: "" } }),
    [state]
  );
  const averageEnergy = useMemo(() => {
    const values = Object.values(state.checks)
      .map((item) => Number(item.energy))
      .filter(Boolean);
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [state.checks]);
  const streak = calculateStreak(state.checks);
  const route = routeDefinitions[activeView] ?? routeDefinitions.landing;
  const needsStartingPoint = !state.onboarding?.entryStateId;
  const needsPreferenceMap = !state.preferenceMap?.completedAt;

  useEffect(() => {
    const syncRouteFromAddress = () => {
      setActiveView(getViewFromHash());
      setPendingScroll(null);
    };
    window.addEventListener("hashchange", syncRouteFromAddress);
    return () => window.removeEventListener("hashchange", syncRouteFromAddress);
  }, []);

  useEffect(() => {
    if (!cloudConfigured) return undefined;
    let mounted = true;
    getCloudSession()
      .then((session) => {
        if (mounted) setCloudSession(session);
      })
      .catch((error) => {
        if (mounted) setCloudNotice(error.message || "账户状态读取失败，请稍后再试。");
      });
    const unsubscribe = onCloudAuthChange((session) => {
      if (mounted) setCloudSession(session);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!cloudSession || !state.cloud?.syncEnabled) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const result = await saveCloudProgress(JSON.parse(cloudSnapshot));
        if (result?.updatedAt) {
          setState((current) => ({
            ...current,
            cloud: {
              ...(current.cloud ?? {}),
              syncEnabled: true,
              lastSyncedAt: result.updatedAt,
            },
          }));
        }
      } catch (error) {
        setCloudNotice(error.message || "云端保存失败，本地记录仍然保留。");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [cloudSession, cloudSnapshot, setState, state.cloud?.syncEnabled]);

  useEffect(() => {
    const settings = state.reminderSettings ?? {};
    if (!settings.enabled || !settings.time || typeof window.Notification === "undefined") return undefined;
    const notify = () => {
      if (window.Notification.permission !== "granted") return;
      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const reminderKey = `${getLocalDate()}-${settings.time}`;
      if (nowTime !== settings.time || state.reminderLog?.[reminderKey]) return;
      new window.Notification("NewLife30 今日开启仪式", {
        body: `Day ${todayDay}：打开平台，完成今天最小的一组动作。`,
      });
      setState((current) => ({
        ...current,
        reminderLog: {
          ...(current.reminderLog ?? {}),
          [reminderKey]: new Date().toISOString(),
        },
      }));
    };
    notify();
    const timer = window.setInterval(notify, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [setState, state.reminderLog, state.reminderSettings, todayDay]);

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

  const enableCloudSync = () => {
    if (!cloudSession) {
      setCloudNotice("请先完成手机号或微信登录，再启用跨设备云同步。");
      return;
    }
    setState((current) => ({
      ...current,
      cloud: {
        ...(current.cloud ?? {}),
        syncEnabled: true,
      },
    }));
    setCloudNotice("云同步已启用：后续记录会自动加密传输并保存到你的账户。");
  };

  const restoreCloudProgress = async () => {
    if (!cloudSession) {
      setCloudNotice("请先登录后再恢复云端记录。");
      return;
    }
    try {
      const remote = await loadCloudProgress();
      if (!remote?.snapshot) {
        setCloudNotice("云端还没有可恢复的记录，当前本地记录不会被覆盖。");
        return;
      }
      const confirmed = window.confirm("恢复云端记录会覆盖当前浏览器中的训练记录，是否继续？");
      if (!confirmed) return;
      setState({
        ...createDefaultState(),
        ...remote.snapshot,
        cloud: {
          ...(remote.snapshot.cloud ?? {}),
          syncEnabled: true,
          lastSyncedAt: remote.updated_at ?? new Date().toISOString(),
        },
      });
      setCloudNotice("已恢复云端记录。");
    } catch (error) {
      setCloudNotice(error.message || "云端记录恢复失败。");
    }
  };

  const handlePhoneOtp = async (phone) => {
    try {
      const normalizedPhone = await sendPhoneOtp(phone);
      setCloudNotice(`验证码已发送至 ${normalizedPhone}。`);
      return normalizedPhone;
    } catch (error) {
      setCloudNotice(error.message || "验证码发送失败。");
      throw error;
    }
  };

  const handleVerifyPhoneOtp = async (phone, token) => {
    try {
      const session = await verifyPhoneOtp(phone, token);
      setCloudSession(session);
      setCloudNotice("登录成功。现在可以启用云同步，或恢复你的历史记录。");
    } catch (error) {
      setCloudNotice(error.message || "验证码校验失败。");
      throw error;
    }
  };

  const handleWechatLogin = () => {
    try {
      startWechatLogin();
    } catch (error) {
      setCloudNotice(error.message || "微信登录暂时不可用。");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutCloud();
      setCloudSession(null);
      setState((current) => ({
        ...current,
        cloud: {
          ...(current.cloud ?? {}),
          syncEnabled: false,
        },
      }));
      setCloudNotice("已退出账户，本地记录仍保留在当前设备。");
    } catch (error) {
      setCloudNotice(error.message || "退出账户失败。");
    }
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
    const targetRoute = routeDefinitions[viewId] ?? routeDefinitions.landing;
    setActiveView(viewId);
    setPendingScroll(scrollId ? { id: scrollId, viewId } : null);
    const targetHash = `#${targetRoute.path}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, "", targetHash);
    }
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

  const chooseCampaign = (campaign, targetView = "dashboard") => {
    setState((current) => ({
      ...current,
      onboarding: {
        ...(current.onboarding ?? {}),
        campaignId: campaign.id,
        profileId: campaign.id,
        entryStateId: campaign.entryStateId,
      },
    }));
    setActiveSystemId(campaign.firstSystem);
    setActiveCourseId(campaign.firstSystem);
    navigateToView(targetView, targetView === "dashboard" ? "restart-assessment" : "campaign-hero");
  };

  const startFromLanding = (entryStateId = "") => {
    const entry = restartEntryStates.find((item) => item.id === entryStateId);
    setState((current) => ({
      ...current,
      onboarding: {
        ...(current.onboarding ?? {}),
        ...(entry ? { entryStateId: entry.id } : {}),
        landingStartedAt: new Date().toISOString(),
      },
    }));
    if (entry) {
      setActiveSystemId(entry.systemId);
      setActiveCourseId(entry.systemId);
    }
    navigateToView("dashboard", "restart-assessment");
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

  /* ── 3D tilt-card mouse tracking ── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      const card = e.target.closest(
        ".course-index-row, .daily-spark-card, .cabin-command-card, .cabin-stage-card, .system-orbit-node"
      );
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mouse-x", `${x}%`);
      card.style.setProperty("--mouse-y", `${y}%`);
      const wrapper = card.closest(".tilt-card-wrapper");
      if (wrapper) {
        const tiltX = ((y - 50) / 50) * -5;
        const tiltY = ((x - 50) / 50) * 5;
        card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }
    };
    const handleMouseOut = (e) => {
      const card = e.target.closest(
        ".course-index-row, .daily-spark-card, .cabin-command-card, .cabin-stage-card, .system-orbit-node"
      );
      if (!card) return;
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
      if (card.closest(".tilt-card-wrapper")) {
        card.style.transform = "";
      }
    };
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseout", handleMouseOut);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  if (activeView === "landing") {
    return (
      <LandingHome
        onStart={startFromLanding}
        onOpenSystems={() => navigateToView("systems", "system-detail-panel")}
        onOpenDashboard={() => navigateToView("dashboard", "today-action-panel")}
        onOpenLearning={() => navigateToView("learning")}
        onOpenCourses={() => navigateToView("courses", "system-course-detail")}
      />
    );
  }

  return (
    <div className="app report-editorial">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">30</div>
          <div>
            <p>人生重启平台</p>
            <strong>30天重建人生体系</strong>
          </div>
        </div>

        <div className="start-date">
          <label htmlFor="startDate">我的训练 · Day {todayDay}</label>
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

        <nav className="view-nav" aria-label="主要任务">
          {primaryViewIds.map((viewId) => {
            const view = routeDefinitions[viewId];
            return (
            <button
              key={viewId}
              className={activeView === viewId ? "nav-pill active" : "nav-pill"}
              onClick={() => navigateToView(viewId)}
            >
              {view.label}
            </button>
            );
          })}
        </nav>

        <details className="sidebar-more">
          <summary>更多工具</summary>
          <div className="sidebar-more-links">
            {secondaryViewIds.map((viewId) => {
              const view = routeDefinitions[viewId];
              return (
                <button
                  key={viewId}
                  className={activeView === viewId ? "nav-pill active" : "nav-pill"}
                  onClick={() => navigateToView(viewId)}
                >
                  {view.label}
                </button>
              );
            })}
          </div>
          <div className="system-nav">
            <p className="side-label">按系统进入</p>
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
        </details>

        <button className="reset-button" onClick={resetData}>
          <RotateCcw size={16} />
          清空本地记录
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="overline">{route.eyebrow} · {route.path}</span>
            <h1>{route.title}</h1>
            <p className="route-description">{route.description}</p>
          </div>
          <div className="top-actions">
            {activeView === "dashboard" ? (
              <>
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
              </>
            ) : (
              <button className="primary-action" onClick={() => navigateToView(route.nextView)}>
                <ChevronRight size={18} />
                {route.nextLabel}
              </button>
            )}
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

        {activeView === "dashboard" && needsStartingPoint && (
          <RestartAssessmentPanel
            state={state}
            setState={setState}
            activeDay={activeDay}
            navigateToView={navigateToView}
            openSystem={openSystem}
          />
        )}

        {activeView === "dashboard" && needsPreferenceMap && (
          <PreferenceMapPanel
            state={state}
            setState={setState}
            activeDay={activeDay}
            openSystem={openSystem}
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
          <MilestoneCheckpointPanel
            activeDay={activeDay}
            check={check}
            updateCheck={updateCheck}
            score={score}
            streak={streak}
            averageEnergy={averageEnergy}
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

          </div>
        )}

        {activeView === "dashboard" && (
          <details className="advanced-tools-panel">
            <summary>
              <span>需要更多支持？</span>
              <em>课程、账户、提醒、目标和更深入的工具都在这里</em>
            </summary>
            <div className="advanced-tools-content">
              <AudienceCampaignPanel
                campaignId={state.onboarding?.campaignId}
                onBrowse={() => navigateToView("campaign", "campaign-hero")}
                onChooseCampaign={chooseCampaign}
              />
              <PromoVideoPanel navigateToView={navigateToView} />
              <TransformationCompassPanel
                activeDay={activeDay}
                check={check}
                updateCheck={updateCheck}
                navigateToView={navigateToView}
                openSystem={openSystem}
              />
              <GoalMapPanel
                state={state}
                setState={setState}
                activeDay={activeDay}
                activeProgram={activeProgram}
                check={check}
                updateCheck={updateCheck}
                navigateToView={navigateToView}
              />
              <AccountCloudPanel
                configured={cloudConfigured}
                session={cloudSession}
                cloud={state.cloud}
                notice={cloudNotice}
                onSendPhoneOtp={handlePhoneOtp}
                onVerifyPhoneOtp={handleVerifyPhoneOtp}
                onWechatLogin={handleWechatLogin}
                onEnableSync={enableCloudSync}
                onRestore={restoreCloudProgress}
                onSignOut={handleSignOut}
              />
              <ReminderCenterPanel state={state} setState={setState} activeDay={activeDay} />
              <QuestDrivePanel
                activeDay={activeDay}
                activeProgram={activeProgram}
                check={check}
                taskDoneCount={taskDoneCount}
                taskTotal={taskTotal}
                score={score}
                systemCourseProgress={systemCourseProgress}
                streak={streak}
                navigateToView={navigateToView}
              />
              <RetentionEnginePanel
                activeDay={activeDay}
                activeProgram={activeProgram}
                check={check}
                taskDoneCount={taskDoneCount}
                taskTotal={taskTotal}
                streak={streak}
                updateCheck={updateCheck}
                navigateToView={navigateToView}
              />
              <ProgressStats
                score={score}
                todayDay={todayDay}
                streak={streak}
                averageEnergy={averageEnergy}
                systemCourseProgress={systemCourseProgress}
                navigateToView={navigateToView}
              />
              <OutcomeLedgerPanel
                state={state}
                setState={setState}
                activeDay={activeDay}
                score={score}
                streak={streak}
                averageEnergy={averageEnergy}
                systemCourseProgress={systemCourseProgress}
                navigateToView={navigateToView}
              />
              <div className="dashboard-grid advanced-tools-grid">
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
            </div>
          </details>
        )}

        {activeView === "theory" && <TheoryView navigateToView={navigateToView} />}

        {activeView === "courses" && (
          <SystemCoursesView
            activeCourseId={activeCourseId}
            setActiveCourseId={setActiveCourseId}
            setActiveSystemId={setActiveSystemId}
            courseWork={state.courseWork}
            updateCourseWork={updateCourseWork}
            navigateToView={navigateToView}
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
                  const depthLayer = index % 2 === 0 ? "inner" : "mid";
                  return (
                    <button
                      key={system.id}
                      className={system.id === activeSystemId ? "system-orbit-node active" : "system-orbit-node"}
                      data-depth={depthLayer}
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

        {activeView === "campaign" && (
          <CampaignLandingView
            campaignId={state.onboarding?.campaignId}
            onChooseCampaign={chooseCampaign}
            openSystem={openSystem}
          />
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

function AccountCloudPanel({
  configured,
  session,
  cloud,
  notice,
  onSendPhoneOtp,
  onVerifyPhoneOtp,
  onWechatLogin,
  onEnableSync,
  onRestore,
  onSignOut,
}) {
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    setBusy(true);
    try {
      await onSendPhoneOtp(phone);
      setOtpSent(true);
    } catch {
      // The parent panel surfaces the actionable provider error.
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    try {
      await onVerifyPhoneOtp(phone, token);
    } catch {
      // The parent panel surfaces the actionable provider error.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel account-cloud-panel" id="account-cloud">
      <div className="account-cloud-head">
        <div>
          <span className="panel-kicker">ACCOUNT + CLOUD</span>
          <h2>登录后，把进度带到下一台设备</h2>
          <p>未登录时，训练记录只保留在当前浏览器。登录后由账户私有空间保存，恢复云端记录前始终要求确认。</p>
        </div>
        <span className={configured ? "cloud-status ready" : "cloud-status"}>
          <Cloud size={16} /> {configured ? (session ? "账户已连接" : "等待登录") : "等待正式配置"}
        </span>
      </div>

      {!configured && (
        <div className="account-config-note">
          <ShieldCheck size={18} />
          <p>手机号验证码、微信 OAuth 与云端数据库已预留正式接口；上线前需要填入短信服务、微信 AppID 与服务器端密钥，不会使用演示验证码代替真实登录。</p>
        </div>
      )}

      {configured && !session && (
        <div className="account-login-grid">
          <label>
            手机号
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="请输入 11 位手机号" />
          </label>
          <button className="account-action" disabled={busy || !phone.trim()} onClick={sendOtp}>
            <Smartphone size={16} /> {otpSent ? "重新发送验证码" : "发送验证码"}
          </button>
          {otpSent && (
            <>
              <label>
                验证码
                <input value={token} onChange={(event) => setToken(event.target.value)} inputMode="numeric" placeholder="请输入验证码" />
              </label>
              <button className="account-action primary" disabled={busy || !token.trim()} onClick={verifyOtp}>
                <LogIn size={16} /> 验证并登录
              </button>
            </>
          )}
          <button className="wechat-login" onClick={onWechatLogin}>
            <MessageCircle size={17} /> 微信登录
          </button>
        </div>
      )}

      {session && (
        <div className="account-connected-grid">
          <div>
            <span>当前账户</span>
            <strong>{session.user.phone || session.user.email || "已验证用户"}</strong>
            <p>{cloud?.lastSyncedAt ? `上次云端保存：${new Date(cloud.lastSyncedAt).toLocaleString("zh-CN")}` : "尚未保存任何训练记录"}</p>
          </div>
          <button className={cloud?.syncEnabled ? "account-action primary" : "account-action"} onClick={onEnableSync}>
            <CloudUpload size={16} /> {cloud?.syncEnabled ? "云同步已开启" : "启用云同步"}
          </button>
          <button className="account-action" onClick={onRestore}><RefreshCw size={16} /> 恢复云端记录</button>
          <button className="account-action subtle" onClick={onSignOut}>退出账户</button>
        </div>
      )}

      {notice && <p className="account-notice" role="status">{notice}</p>}
    </section>
  );
}

function ReminderCenterPanel({ state, setState, activeDay }) {
  const settings = state.reminderSettings ?? { enabled: false, time: "20:45" };
  const canUseNotification = typeof window.Notification !== "undefined";
  const permission = canUseNotification ? window.Notification.permission : "unsupported";

  const updateSettings = (patch) => {
    setState((current) => ({
      ...current,
      reminderSettings: {
        ...(current.reminderSettings ?? {}),
        ...patch,
      },
    }));
  };

  const enableReminder = async () => {
    if (!canUseNotification) return;
    const result = permission === "granted" ? "granted" : await window.Notification.requestPermission();
    if (result === "granted") updateSettings({ enabled: true });
  };

  const sendTestReminder = () => {
    if (permission !== "granted") return;
    new window.Notification("NewLife30 提醒测试", { body: `Day ${activeDay}：现在打开平台，完成今天最小的一组动作。` });
  };

  return (
    <section className="panel reminder-center-panel" id="reminder-center">
      <div className="reminder-copy">
        <span className="panel-kicker">RETURN RHYTHM</span>
        <h2>把“明天再做”变成一个准时出现的入口</h2>
        <p>网页打开时，会在你设定的时间提示今日仪式。小程序端会在用户主动订阅后使用微信订阅消息补充提醒。</p>
      </div>
      <div className="reminder-controls">
        <label>
          每日提醒时间
          <input type="time" value={settings.time || "20:45"} onChange={(event) => updateSettings({ time: event.target.value })} />
        </label>
        <button className="account-action primary" disabled={!canUseNotification || permission === "denied"} onClick={enableReminder}>
          <Bell size={16} /> {settings.enabled ? "提醒已开启" : permission === "denied" ? "浏览器已拒绝提醒" : "开启网页提醒"}
        </button>
        <button className="account-action" disabled={permission !== "granted"} onClick={sendTestReminder}>发送测试提醒</button>
      </div>
    </section>
  );
}

function MilestoneCheckpointPanel({ activeDay, check, updateCheck, score, streak, averageEnergy }) {
  const checkpoint = checkpointMilestones.filter((item) => item.day <= activeDay).at(-1) ?? checkpointMilestones[0];
  const checkpointDone = Boolean(check.checkpointConfirmed);
  const report = [
    `【NewLife30｜Day ${checkpoint.day} 节点报告】`,
    `节点：${checkpoint.title}`,
    `连续行动：${streak} 天`,
    `已完成训练：${score.completedDays}/30`,
    `平均精力：${averageEnergy ? `${averageEnergy}/5` : "尚未形成趋势"}`,
    "",
    "本节点反思：",
    check.checkpointReflection || "（待填写）",
    "",
    `下一步：${checkpoint.reportPrompt}`,
  ].join("\n");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={checkpointDone ? "panel milestone-checkpoint-panel confirmed" : "panel milestone-checkpoint-panel"} id="milestone-checkpoint">
      <div className="milestone-head">
        <div>
          <span>DAY {checkpoint.day} CHECKPOINT</span>
          <h2>{checkpoint.title}</h2>
          <p>{checkpoint.body}</p>
        </div>
        <div className="milestone-badge"><Award size={19} /> {checkpoint.badge}</div>
      </div>
      <div className="milestone-rail">
        {checkpointMilestones.map((item) => (
          <span key={item.day} className={activeDay >= item.day ? "reached" : ""}>DAY {item.day}</span>
        ))}
      </div>
      <label className="milestone-reflection">
        {checkpoint.reportPrompt}
        <textarea value={check.checkpointReflection ?? ""} onChange={(event) => updateCheck(activeDay, { checkpointReflection: event.target.value })} placeholder="用真实发生过的事情回答，不需要写得完美。" />
      </label>
      <div className="milestone-actions">
        <button className={checkpointDone ? "account-action primary" : "account-action"} onClick={() => updateCheck(activeDay, { checkpointConfirmed: !checkpointDone, checkpointConfirmedAt: new Date().toISOString() })}>
          <Award size={16} /> {checkpointDone ? "已领取节点徽章" : "确认并领取节点徽章"}
        </button>
        <button className="account-action" onClick={copy}><Copy size={16} /> {copied ? "节点报告已复制" : "复制节点报告"}</button>
      </div>
    </section>
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

function QuestDrivePanel({
  activeDay,
  activeProgram,
  check,
  taskDoneCount,
  taskTotal,
  score,
  systemCourseProgress,
  streak,
  navigateToView,
}) {
  const chapter = getResetQuestChapter(activeDay);
  const level = getQuestLevel(score.totalScore);
  const taskPercent = taskTotal ? Math.round((taskDoneCount / taskTotal) * 100) : 0;
  const reflectionComplete = Boolean(check.output?.trim() && check.reflection?.trim());
  const quests = [
    {
      type: "主线",
      title: `Day ${activeDay} · ${activeProgram.title}`,
      body: `${taskDoneCount}/${taskTotal} 个真实动作已完成`,
      progress: check.completed ? 100 : taskPercent,
      xp: "+10 XP",
      complete: Boolean(check.completed),
      action: () => navigateToView("dashboard", "today-checkin"),
      actionLabel: check.completed ? "已结算" : "继续任务",
    },
    {
      type: "系统",
      title: "把知识变成一次行动",
      body: `${systemCourseProgress.completedLessons}/${systemCourseProgress.totalLessons} 节系统课已完成`,
      progress: systemCourseProgress.totalLessons
        ? Math.round((systemCourseProgress.completedLessons / systemCourseProgress.totalLessons) * 100)
        : 0,
      xp: "+20 XP",
      complete: systemCourseProgress.completedLessons > 0,
      action: () => navigateToView("courses", "lesson-workbench"),
      actionLabel: "进入课程",
    },
    {
      type: "回声",
      title: "让同伴看见你的行动",
      body: check.groupFullAttendance ? "今日小组满勤已记录" : "把一次卡点或有效经验带进小组",
      progress: check.groupFullAttendance ? 100 : 0,
      xp: "+30 XP",
      complete: Boolean(check.groupFullAttendance),
      action: () => navigateToView("group"),
      actionLabel: check.groupFullAttendance ? "已结算" : "进入小组",
    },
    {
      type: "复盘",
      title: "把今天写入下一次选择",
      body: reflectionComplete ? "输出与复盘已保存" : "完成输出与复盘，让经验可被下一次调用",
      progress: reflectionComplete ? 100 : 0,
      xp: "成果条件",
      complete: reflectionComplete,
      action: () => navigateToView("dashboard", "today-output"),
      actionLabel: reflectionComplete ? "已存档" : "去复盘",
    },
  ];

  return (
    <section className="quest-drive-panel" aria-label="重启远征任务系统">
      <div className="quest-drive-header">
        <div>
          <span>NEWLIFE30 QUEST ENGINE</span>
          <h2>重启远征，不靠刷分通关。</h2>
          <p>每一点 XP 都来自已经发生的行动、学习或同伴回声；积分只记录证据，不替代真实改变。</p>
        </div>
        <div className="quest-chapter-mark">
          <small>{chapter.label}</small>
          <strong>{chapter.title}</strong>
          <p>Day {chapter.start}-{chapter.end}</p>
        </div>
      </div>

      <div className="quest-level-panel">
        <div className="quest-level-copy">
          <span>当前等级</span>
          <strong>Lv.{level.level}</strong>
          <div>
            <b>{level.title}</b>
            <p>{chapter.body}</p>
          </div>
        </div>
        <div className="quest-xp-track" aria-label={`经验值 ${score.totalScore} XP`}>
          <div className="quest-xp-meta">
            <span>{score.totalScore} XP</span>
            <span>{level.nextXp ? `距下一等级 ${level.remaining} XP` : "已完成重启旅程"}</span>
          </div>
          <div className="quest-xp-bar"><span style={{ width: `${level.progress}%` }} /></div>
          <small>日课 +10 · 核心课 +20 · 系统课 +20 · 书籍实践 +15 · 小组满勤 +30</small>
        </div>
        <div className="quest-streak-mark">
          <Flame size={19} />
          <strong>{streak}</strong>
          <span>连续行动天数</span>
        </div>
      </div>

      <div className="quest-card-grid">
        {quests.map((quest) => (
          <article key={quest.type} className={quest.complete ? "quest-card complete" : "quest-card"}>
            <div className="quest-card-top">
              <span>{quest.type}</span>
              <em>{quest.xp}</em>
            </div>
            <strong>{quest.title}</strong>
            <p>{quest.body}</p>
            <div className="quest-card-progress" aria-label={`${quest.title} ${quest.progress}%`}>
              <span style={{ width: `${quest.progress}%` }} />
            </div>
            <button onClick={quest.action}>
              {quest.complete ? <CheckCircle2 size={15} /> : <Target size={15} />}
              {quest.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function RetentionEnginePanel({
  activeDay,
  activeProgram,
  check,
  taskDoneCount,
  taskTotal,
  streak,
  updateCheck,
  navigateToView,
}) {
  const remainingTasks = Math.max(taskTotal - taskDoneCount, 0);
  const nextReward = getNextReward(streak);
  const returnReason = check.returnReason ?? "";
  const retentionMetrics = [
    ["今日目标", remainingTasks ? `还差 ${remainingTasks} 个动作` : "今日动作已完成"],
    ["连续打开", `${streak} 天`],
    ["下一枚徽章", `${nextReward.title} · ${Math.max(nextReward.day - streak, 0)} 天`],
  ];

  return (
    <section className="panel retention-engine-panel" aria-label="用户留存和完成感机制">
      <div className="retention-copy">
        <span>Retention Loop</span>
        <h2>让用户明天还想回来</h2>
        <p>
          顶级习惯和学习产品都会把“回来”设计成可见反馈。这里用目标、连胜、徽章、
          群输出和明日理由，帮用户把 30 天跑完。
        </p>
        <div className="retention-loop-list">
          {retentionLoops.map(([title, body]) => (
            <article key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="return-command-card">
        <span>下一次打开的理由</span>
        <strong>Day {activeProgram.day} · {activeProgram.title}</strong>
        <div className="retention-metrics">
          {retentionMetrics.map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <b>{value}</b>
            </div>
          ))}
        </div>
        <label>
          明天回来，我要继续完成什么？
          <textarea
            value={returnReason}
            onChange={(event) => updateCheck(activeDay, { returnReason: event.target.value })}
            placeholder="例：明天早上先打开平台，完成睡眠评分和一个最小动作。"
          />
        </label>
        <div className="return-command-actions">
          <button onClick={() => navigateToView("dashboard", "daily-ritual")}>开启仪式</button>
          <button onClick={() => navigateToView("group")}>群内输出</button>
          <button onClick={() => navigateToView("courses", "lesson-workbench")}>继续学习</button>
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

function LandingHome({ onStart, onOpenSystems, onOpenDashboard, onOpenLearning, onOpenCourses }) {
  const journeyHighlights = [
    ["01", "找到起点", "30 秒识别当前最卡的一环，获得第一条具体建议。", "#f2a11a", Target],
    ["02", "清晰路径", "四个阶段、八个系统，知道此刻练什么、为什么练。", "#3f7bea", Route],
    ["03", "每日行动", "每天一个最小行动，打卡、记录、反馈都在同一处完成。", "#38a97f", ClipboardCheck],
    ["04", "复盘进化", "看见自己的变化，保留有效规则，进入下一轮升级。", "#796fd0", RefreshCw],
  ];
  const heroStages = [
    { number: "1", title: "恢复状态", body: "先让自己重新稳定运行", tone: "warm", Icon: HeartPulse },
    { number: "2", title: "建立行动", body: "把改变转化为今天的动作", tone: "blue", Icon: Target },
    { number: "3", title: "扩展能力", body: "让认知和关系成为支持", tone: "green", Icon: Brain },
    { number: "4", title: "形成方向", body: "把资源投入真正重要的事", tone: "violet", Icon: Compass },
  ];
  const phaseActions = [
    ["阶段 1", "恢复状态", "身心能量系统 · 节律秩序系统", "先恢复能量和生活节奏，让自己重新稳定运行。", onOpenSystems, "查看恢复系统"],
    ["阶段 2", "建立行动", "目标行动系统 · 反馈进化系统", "把模糊感受变成今天能完成的一个动作。", onOpenDashboard, "开始今日行动"],
    ["阶段 3", "扩展能力", "认知学习系统 · 沟通关系系统", "让学习和关系成为长期成长的支持。", onOpenCourses, "进入精品课程"],
    ["阶段 4", "形成方向", "价值资源系统 · 身份意义系统", "把时间、资源和选择带回真正重要的方向。", onOpenLearning, "查看30天路径"],
  ];

  return (
    <div className="landing-home">
      <header className="landing-nav">
        <button className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="回到 Newlife30 首页">
          <span><Zap size={23} fill="currentColor" /></span>
          <strong>NewLife30</strong>
        </button>
        <nav aria-label="首页导航">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>首页</button>
          <button onClick={() => onStart()}>30秒自测</button>
          <button onClick={() => scrollToId("landing-roadmap")}>重建路线图</button>
          <button onClick={onOpenSystems}>八大系统</button>
          <button onClick={onOpenDashboard}>行动工具</button>
        </nav>
        <button className="landing-workbench-button" onClick={onOpenDashboard}>继续今天的训练</button>
      </header>

      <main>
        <section className="landing-hero" id="landing-concept">
          <div className="landing-hero-copy">
            <span className="landing-kicker"><i /> 30天重建人生体系</span>
            <h1>30天，重新建立<br /><strong>属于你的人生系统</strong></h1>
            <p>你不需要一次解决所有问题。先找到现在最需要改变的一环，再沿着“恢复状态、建立行动、扩展能力、形成方向”的路径，完成一轮可执行、可记录、可复盘的重建。</p>
            <div className="landing-hero-actions">
              <button className="landing-primary-button" onClick={() => onStart()}>
                <Compass size={19} /> 开始30秒系统自测
              </button>
              <button className="landing-secondary-button" onClick={() => scrollToId("landing-roadmap")}>
                查看完整重建路线 <ChevronRight size={19} />
              </button>
            </div>
            <div className="landing-hero-proof" aria-label="平台核心结构">
              <span><Sparkles size={20} /> 8大人生系统</span>
              <span><CalendarDays size={20} /> 4个重建阶段</span>
              <span><RefreshCw size={20} /> 30天行动周期</span>
            </div>
          </div>

          <div className="landing-path-visual" aria-label="四阶段人生重建路径">
            <div className="landing-path-caption">
              <span>我的30天重建路径</span>
              <strong>从此刻，走向<br />稳定的个人系统</strong>
            </div>
            <div className="landing-path-orbit" aria-hidden="true" />
            <div className="landing-path-current">
              <UserRound size={31} />
              <span>现在的我</span>
            </div>
            <div className="landing-path-stage-list">
              {heroStages.map((stage) => {
                const StageIcon = stage.Icon;
                return (
                  <button key={stage.number} className={`landing-path-stage ${stage.tone}`} onClick={onOpenLearning}>
                    <span className="landing-path-number">{stage.number}</span>
                    <StageIcon size={20} />
                    <strong>{stage.title}</strong>
                    <em>{stage.body}</em>
                  </button>
                );
              })}
            </div>
            <div className="landing-path-goal"><Sparkles size={22} /><span>更稳定的<br />个人系统</span></div>
          </div>
        </section>

        <section className="landing-value-section" aria-label="NewLife30 如何帮助用户">
          <div className="landing-highlight-grid">
            {journeyHighlights.map(([number, title, body, accent, Icon]) => (
              <article key={number} style={{ "--highlight": accent }}>
                <Icon size={27} />
                <div><span>{number}</span><strong>{title}</strong></div>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-roadmap-section" id="landing-roadmap">
          <div className="landing-section-head">
            <div>
              <span>MY 30-DAY REBUILD ROADMAP</span>
              <h2>不是平均用力，而是按阶段解决当前最卡的一环。</h2>
            </div>
            <p>先恢复状态，再建立行动，然后扩展能力，最后形成稳定方向。八个系统会在最需要的时候出现。</p>
          </div>
          <figure className="landing-roadmap-poster">
            <img src={assetPath("/images/newlife30-30-day-roadmap.png")} alt="我的30天人生重建路线图，展示恢复状态、建立行动、扩展能力、形成方向四个阶段和八个个人运行系统" />
            <figcaption>先完成系统自测，平台会根据你的当前状态推荐起点；完成 30 天后，生成个人系统报告与下一轮建议。</figcaption>
          </figure>
          <div className="landing-phase-grid">
            {phaseActions.map(([eyebrow, title, systemsText, body, action, actionLabel], index) => (
              <article key={title} className={`landing-phase-card phase-${index + 1}`}>
                <span>{eyebrow}</span>
                <h3>{title}</h3>
                <strong>{systemsText}</strong>
                <p>{body}</p>
                <button onClick={action}>{actionLabel} <ChevronRight size={16} /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-systems-section" id="landing-systems">
          <div className="landing-section-head">
            <div>
              <span>8 PERSONAL OPERATING SYSTEMS</span>
              <h2>不是多一张计划表，而是补齐八个运行环节。</h2>
            </div>
            <button onClick={onOpenSystems}>查看完整系统图谱 <ChevronRight size={17} /></button>
          </div>
          <div className="landing-system-grid">
            {systems.map((system, index) => {
              const Icon = iconMap[system.icon];
              return (
                <button key={system.id} onClick={onOpenSystems}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={20} />
                  <strong>{system.name}</strong>
                  <p>{system.content}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="landing-closing">
          <div>
            <span>从第一天开始</span>
            <h2>今天不需要改变全部，只需要开始第一步。</h2>
          </div>
          <button className="landing-primary-button" onClick={() => onStart()}>
            开始我的 30 天 <ChevronRight size={19} />
          </button>
        </section>
      </main>
    </div>
  );
}

function AudienceCampaignPanel({ campaignId, onBrowse, onChooseCampaign }) {
  return (
    <section className="audience-campaign-panel" aria-label="四类用户的训练营入口">
      <div className="audience-campaign-head">
        <div>
          <span className="panel-kicker">30 DAY FIELD PROGRAMS</span>
          <h2>不是所有人的重启，都从同一个问题开始。</h2>
        </div>
        <button onClick={onBrowse}>查看四类训练营 <ChevronRight size={16} /></button>
      </div>
      <div className="audience-campaign-grid">
        {campaignProfiles.map((campaign, index) => (
          <article key={campaign.id} className={campaignId === campaign.id ? `audience-campaign-card ${campaign.accent} selected` : `audience-campaign-card ${campaign.accent}`}>
            <span>{String(index + 1).padStart(2, "0")} · {campaign.tag}</span>
            <h3>{campaign.title.replace("\n", " ")}</h3>
            <p>{campaign.subtitle}</p>
            <button onClick={() => onChooseCampaign(campaign)}>选择这条路径 <ChevronRight size={16} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CampaignLandingView({ campaignId, onChooseCampaign, openSystem }) {
  const [activeCampaignId, setActiveCampaignId] = useState(campaignId ?? campaignProfiles[0].id);
  const campaign = campaignProfiles.find((item) => item.id === activeCampaignId) ?? campaignProfiles[0];
  const routeSystems = campaign.systemIds
    .map((systemId) => systems.find((system) => system.id === systemId))
    .filter(Boolean);

  useEffect(() => {
    if (campaignId && campaignProfiles.some((item) => item.id === campaignId)) {
      setActiveCampaignId(campaignId);
    }
  }, [campaignId]);

  return (
    <div className={`campaign-page ${campaign.accent}`}>
      <section className="campaign-selector" aria-label="选择训练营人群">
        <span>SELECT YOUR PROGRAM</span>
        <div>
          {campaignProfiles.map((item, index) => (
            <button
              key={item.id}
              className={item.id === campaign.id ? "active" : ""}
              onClick={() => setActiveCampaignId(item.id)}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              {item.navLabel}
            </button>
          ))}
        </div>
      </section>

      <section className="campaign-hero" id="campaign-hero">
        <div className="campaign-hero-copy">
          <span>{campaign.tag}</span>
          <h1>{campaign.title.split("\n").map((line) => <React.Fragment key={line}>{line}<br /></React.Fragment>)}</h1>
          <p className="campaign-subtitle">{campaign.subtitle}</p>
          <p className="campaign-body">{campaign.body}</p>
          <div className="campaign-hero-actions">
            <button className="campaign-primary" onClick={() => onChooseCampaign(campaign)}>
              从今天开始这 30 天 <ChevronRight size={18} />
            </button>
            <button className="campaign-secondary" onClick={() => openSystem(campaign.firstSystem, "systems", "system-detail-panel")}>
              先看第一个系统
            </button>
          </div>
        </div>
        <div className="campaign-hero-signal" aria-label="训练营核心信号">
          <span>30</span>
          <strong>DAY<br />RESET</strong>
          <p>{campaign.promise}</p>
          <em>今日启动句：{campaign.ritual}</em>
        </div>
      </section>

      <section className="campaign-section campaign-problem-section">
        <div className="campaign-section-heading">
          <span>THIS MAY BE YOU</span>
          <h2>你不是缺少意志力。<br />你需要一套新的运行方式。</h2>
        </div>
        <div className="campaign-pain-list">
          {campaign.painPoints.map((pain, index) => (
            <article key={pain}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{pain}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="campaign-section campaign-route-section">
        <div className="campaign-section-heading">
          <span>YOUR FIRST THREE SYSTEMS</span>
          <h2>先恢复，<br />再建立长期能力。</h2>
        </div>
        <div className="campaign-system-route">
          {routeSystems.map((system, index) => {
            const Icon = iconMap[system.icon];
            return (
              <button key={system.id} onClick={() => openSystem(system.id, "systems", "system-detail-panel")}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon size={23} />
                <strong>{system.name}</strong>
                <p>{system.value}</p>
                <em>查看系统 <ChevronRight size={14} /></em>
              </button>
            );
          })}
        </div>
      </section>

      <section className="campaign-section campaign-milestone-section">
        <div className="campaign-section-heading">
          <span>WHAT CHANGES ACROSS 30 DAYS</span>
          <h2>不是一夜翻盘。<br />是每天把自己拿回来一点。</h2>
        </div>
        <div className="campaign-milestone-list">
          {campaign.milestones.map((milestone, index) => {
            const [day, body] = milestone.split("：");
            return (
              <article key={milestone}>
                <span>{day}</span>
                <strong>{body}</strong>
                <p>{index === 0 ? "先出现一个真实可感的变化。" : index === 1 ? "让重要行为从临时选择变成固定场域。" : "把经历整理为下一阶段仍可使用的规则。"}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="campaign-closing">
        <span>NEWLIFE30</span>
        <h2>{campaign.promise}</h2>
        <button onClick={() => onChooseCampaign(campaign)}>
          选择「{campaign.subtitle}」<ChevronRight size={18} />
        </button>
      </section>
    </div>
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

function TransformationCompassPanel({ activeDay, check, updateCheck, navigateToView, openSystem }) {
  const handleEntry = (entry) => {
    updateCheck(activeDay, {
      intention: entry.intention,
      selectedNeed: entry.id,
    });

    if (entry.systemId) {
      openSystem(entry.systemId, entry.view, entry.scrollId);
      return;
    }

    navigateToView(entry.view, entry.scrollId);
  };

  return (
    <section className="panel transformation-compass-panel" aria-label="用户状态入口和国际标杆目标">
      <div className="need-entry-zone">
        <div className="panel-kicker">从用户当前问题出发</div>
        <h2>我现在卡在哪里？</h2>
        <p>不要求用户先理解完整体系。先选择当前最真实的问题，平台直接给出下一步路径。</p>
        <div className="need-entry-grid">
          {userNeedEntries.map((entry) => (
            <button
              key={entry.id}
              className={check.selectedNeed === entry.id ? "need-entry-card active" : "need-entry-card"}
              onClick={() => handleEntry(entry)}
            >
              <strong>{entry.title}</strong>
              <span>{entry.body}</span>
              <em>{entry.action}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="benchmark-zone">
        <div className="panel-kicker">国际标杆目标</div>
        <h3>不是做更多功能，而是做到每天愿意回来</h3>
        <div className="benchmark-list">
          {internationalProductGoals.map((item) => (
            <article key={item.platform}>
              <span>{item.platform}</span>
              <strong>{item.goal}</strong>
              <p>{item.lesson}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RestartAssessmentPanel({ state, setState, activeDay, navigateToView, openSystem }) {
  const onboarding = state.onboarding ?? {};
  const selectedProfile = restartProfiles.find((profile) => profile.id === onboarding.profileId);
  const selectedState = restartEntryStates.find((item) => item.id === onboarding.entryStateId);
  const recommendedIds = selectedProfile?.systems ?? ["energy", "rhythm", "action"];
  const orderedIds = selectedState
    ? [selectedState.systemId, ...recommendedIds.filter((systemId) => systemId !== selectedState.systemId)]
    : recommendedIds;
  const recommendedSystems = orderedIds
    .map((systemId) => systems.find((system) => system.id === systemId))
    .filter(Boolean);

  const updateOnboarding = (patch) => {
    setState((current) => ({
      ...current,
      onboarding: {
        ...(current.onboarding ?? {}),
        ...patch,
      },
    }));
  };

  const startPlan = () => {
    if (!selectedProfile || !selectedState) return;
    updateOnboarding({ planStartedAt: new Date().toISOString() });
    openSystem(recommendedSystems[0].id, "systems", "system-detail-panel");
  };

  return (
    <section className="panel restart-assessment-panel" id="restart-assessment">
      <div className="assessment-intro">
        <div>
          <span className="panel-kicker">先诊断，再训练</span>
          <h2>为现在的你生成 30 天重启路径</h2>
          <p>
            Newlife30 面向处于高压与转折中的成人。先确认你正在经历的现实场景，系统只给你当前最需要的起点，而不是一份泛泛的任务清单。
          </p>
        </div>
        <div className="assessment-day-mark">
          <span>DAY</span>
          <strong>{String(activeDay).padStart(2, "0")}</strong>
          <em>当前训练日</em>
        </div>
      </div>

      <div className="assessment-step">
        <div className="assessment-step-head">
          <span>01</span>
          <div>
            <strong>我更接近哪一种真实状态？</strong>
            <p>不做人格标签，只用来匹配更贴近现实的行动顺序。</p>
          </div>
        </div>
        <div className="profile-choice-grid">
          {restartProfiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <button
                key={profile.id}
                className={onboarding.profileId === profile.id ? "profile-choice active" : "profile-choice"}
                onClick={() => updateOnboarding({ profileId: profile.id })}
              >
                <Icon size={19} />
                <span>{profile.range}</span>
                <strong>{profile.title}</strong>
                <p>{profile.body}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="assessment-step">
        <div className="assessment-step-head">
          <span>02</span>
          <div>
            <strong>现在最需要先解决什么？</strong>
            <p>前 7 天先处理高感知痛点：睡不好、节奏乱、做不动或学不进去。</p>
          </div>
        </div>
        <div className="entry-state-list">
          {restartEntryStates.map((entry) => (
            <button
              key={entry.id}
              className={onboarding.entryStateId === entry.id ? "entry-state-row active" : "entry-state-row"}
              onClick={() => updateOnboarding({ entryStateId: entry.id })}
            >
              <HeartPulse size={18} />
              <div>
                <strong>{entry.title}</strong>
                <p>{entry.body}</p>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className={selectedProfile && selectedState ? "personal-route ready" : "personal-route"}>
        <div>
          <span>你的优先路径</span>
          <h3>{selectedProfile && selectedState ? `${selectedProfile.title} · 从 ${selectedState.title} 开始` : "选择上方两项，生成你的起步路径"}</h3>
          <p>
            {selectedProfile && selectedState
              ? "先让身体和生活恢复可运行，再进入长期学习、关系、资源与身份的升级。"
              : "30 天不是把八个系统同时做完，而是按你当前的难处决定先后顺序。"}
          </p>
        </div>
        <div className="route-system-list">
          {recommendedSystems.map((system, index) => (
            <button
              key={system.id}
              onClick={() => openSystem(system.id, "systems", "system-detail-panel")}
              aria-label={`查看${system.name}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{system.name}</strong>
            </button>
          ))}
        </div>
        <button className="route-start-button" disabled={!selectedProfile || !selectedState} onClick={startPlan}>
          <Route size={18} />
          {onboarding.planStartedAt ? "查看我的重启路径" : "生成并开启我的路径"}
        </button>
      </div>

      <div className="assessment-safety">
        <ShieldCheck size={18} />
        <p>
          本平台提供行为与系统重建训练，不替代医疗或心理治疗。若存在急性心理危机、自伤风险、严重失眠或其他需要临床支持的情况，请优先联系专业医疗或心理服务。
        </p>
        <button onClick={() => navigateToView("theory", "platform-boundary")}>了解使用边界</button>
      </div>
    </section>
  );
}

function PreferenceMapPanel({ state, setState, activeDay, openSystem }) {
  const preferenceState = {
    responses: {},
    completedAt: "",
    ...(state.preferenceMap ?? {}),
  };
  const preferenceMap = getPreferenceMap(preferenceState.responses);
  const calibration = getPreferenceCalibration(preferenceMap, state.checks);
  const recommendedSystems = preferenceMap.recommendedSystemIds
    .slice(0, 4)
    .map((systemId) => systems.find((system) => system.id === systemId))
    .filter(Boolean);
  const routeStages = [
    ["Day 1-7", "先稳定最容易失序的一环"],
    ["Day 8-14", "建立可回归的行动结构"],
    ["Day 15-21", "把经验变成能力与反馈"],
    ["Day 22-30", "写入长期可持续的规则"],
  ];

  const updateResponse = (questionId, value) => {
    setState((current) => ({
      ...current,
      preferenceMap: {
        ...(current.preferenceMap ?? {}),
        responses: {
          ...(current.preferenceMap?.responses ?? {}),
          [questionId]: value,
        },
        completedAt: "",
      },
    }));
  };

  const completePreferenceMap = () => {
    if (!preferenceMap.complete) return;
    setState((current) => ({
      ...current,
      preferenceMap: {
        ...(current.preferenceMap ?? {}),
        completedAt: new Date().toISOString(),
      },
    }));
  };

  const resetPreferenceMap = () => {
    setState((current) => ({
      ...current,
      preferenceMap: {
        responses: {},
        completedAt: "",
      },
    }));
  };

  const openRecommendedCourse = (systemId) => {
    setState((current) => ({
      ...current,
      onboarding: {
        ...(current.onboarding ?? {}),
        preferencePathStartedAt: new Date().toISOString(),
        preferenceStartSystemId: systemId,
      },
    }));
    openSystem(systemId, "courses", "system-course-detail");
  };

  return (
    <section className="panel preference-map-panel" id="preference-map">
      <div className="preference-map-head">
        <div>
          <span className="panel-kicker">PERSONAL OPERATING PREFERENCES</span>
          <h2>找到适合你的开始方式，而不是给你贴标签。</h2>
          <p>
            这是一份 Newlife30 自研的行动偏好地图。它只用来调整课程入口、打卡节奏和支持方式，训练后的真实完成与复盘记录会持续校正推荐。
          </p>
        </div>
        <div className="preference-progress-mark" aria-label={`已完成 ${preferenceMap.answeredCount} 题，共 ${preferenceMap.totalQuestions} 题`}>
          <span>已完成</span>
          <strong>{preferenceMap.answeredCount}<em>/{preferenceMap.totalQuestions}</em></strong>
          <small>{preferenceMap.complete ? "可以生成路径" : "按第一反应作答"}</small>
        </div>
      </div>

      <div className="preference-boundary">
        <ShieldCheck size={17} />
        <p>不是官方 MBTI 测评，不使用 MBTI 题目或类型代码；不用于医疗、心理诊断、招聘或能力判断。</p>
      </div>

      <div className="preference-axis-list">
        {preferenceAxisDefinitions.map((axis, axisIndex) => {
          const axisResult = preferenceMap.axes.find((item) => item.id === axis.id);
          const questions = preferenceQuestions.filter((question) => question.axisId === axis.id);
          return (
            <section className="preference-axis-section" key={axis.id}>
              <div className="preference-axis-head">
                <span>{String(axisIndex + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{axis.label}</strong>
                  <p>{axis.low.short} <i>至</i> {axis.high.short}</p>
                </div>
                <em>{axisResult?.answered ?? 0}/4</em>
              </div>
              <div className="preference-question-list">
                {questions.map((question, questionIndex) => {
                  const selected = preferenceState.responses[question.id];
                  return (
                    <article className="preference-question" key={question.id}>
                      <p><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.prompt}</p>
                      <div className="preference-options" role="group" aria-label={question.prompt}>
                        <button
                          className={selected === "low" ? "active" : ""}
                          aria-pressed={selected === "low"}
                          onClick={() => updateResponse(question.id, "low")}
                        >
                          {question.low}
                        </button>
                        <button
                          className={selected === "high" ? "active" : ""}
                          aria-pressed={selected === "high"}
                          onClick={() => updateResponse(question.id, "high")}
                        >
                          {question.high}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {!preferenceMap.complete && (
        <div className="preference-incomplete">
          <Compass size={18} />
          <span>还差 {preferenceMap.totalQuestions - preferenceMap.answeredCount} 题。完成后生成你的课程顺序与打卡方式。</span>
        </div>
      )}

      {preferenceMap.complete && (
        <section className="preference-result-panel" aria-live="polite">
          <div className="preference-result-head">
            <div>
              <span>你的个人运行偏好图</span>
              <h3>从 {preferenceMap.axes.map((axis) => axis.profile.short).join(" · ")} 开始训练</h3>
            </div>
            <div>
              <button className="secondary" onClick={resetPreferenceMap}>重新作答</button>
              <button className="primary-action" onClick={completePreferenceMap}>
                <CheckCircle2 size={16} />
                {preferenceState.completedAt ? "偏好图已保存" : "保存我的偏好图"}
              </button>
            </div>
          </div>

          <div className="preference-result-grid">
            {preferenceMap.axes.map((axis) => (
              <article key={axis.id}>
                <span>{axis.label}</span>
                <strong>{axis.profile.title}</strong>
                <p>{axis.profile.body}</p>
                <em>{axis.profile.training}</em>
              </article>
            ))}
          </div>

          <div className="preference-route-block">
            <div className="preference-route-intro">
              <span>自适应 30 天课程顺序</span>
              <h3>优先训练最符合你启动方式的系统。</h3>
              <p>这是起点顺序，不是对能力的判断。每 7 天由真实完成、状态记录和复盘更新下一阶段建议。</p>
            </div>
            <div className="preference-route-grid">
              {recommendedSystems.map((system, index) => {
                const course = systemCourseCatalog.find((item) => item.id === system.id);
                return (
                  <article key={system.id}>
                    <span>{routeStages[index]?.[0]}</span>
                    <strong>{system.name}</strong>
                    <p>{routeStages[index]?.[1]}</p>
                    <em>{(preferenceMap.reasons[system.id] ?? []).slice(0, 2).join(" · ")}</em>
                    <button onClick={() => openRecommendedCourse(system.id)}>
                      {index === 0 ? "从这里开始" : `进入${course?.courseTitle ?? "系统课程"}`}
                      <ChevronRight size={15} />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="preference-calibration">
            <div>
              <span>第 {activeDay} 天行为校正</span>
              <strong>{calibration.status}</strong>
            </div>
            <p>{calibration.body}</p>
          </div>
        </section>
      )}
    </section>
  );
}

function GoalMapPanel({ state, setState, activeDay, activeProgram, check, updateCheck, navigateToView }) {
  const defaultBalance = { energy: 3, focus: 3, relationship: 3, recovery: 3 };
  const goalMap = {
    outcome: "",
    meaning: "",
    dailyAction: "",
    milestones: {},
    ...(state.goalMap ?? {}),
    balance: { ...defaultBalance, ...(state.goalMap?.balance ?? {}) },
  };
  const milestones = [
    { key: "week1", range: "Day 1-7", title: "稳定底盘", prompt: "这一周结束时，我希望稳定出现的一个变化" },
    { key: "week2", range: "Day 8-14", title: "建立节律", prompt: "这一周，我要固定下来的一个场域或规则" },
    { key: "week3", range: "Day 15-21", title: "验证能力", prompt: "这一周，我要用行动验证的一项能力" },
    { key: "week4", range: "Day 22-30", title: "留下手册", prompt: "30 天结束时，我要保留的一条运行规则" },
  ];
  const balanceDimensions = [
    ["energy", "精力", "身体和情绪是否还有余量"],
    ["focus", "专注", "重要事情是否得到保护"],
    ["relationship", "关系", "是否与重要的人保持真实连接"],
    ["recovery", "恢复", "是否有不被任务侵占的恢复空间"],
  ];
  const completedMilestones = milestones.filter((item) => goalMap.milestones?.[item.key]?.trim()).length;
  const planSignals = [goalMap.outcome, goalMap.meaning, goalMap.dailyAction, completedMilestones === milestones.length].filter(Boolean).length;
  const planProgress = Math.round((planSignals / 4) * 100);
  const balanceAverage = Math.round((Object.values(goalMap.balance).reduce((sum, value) => sum + Number(value), 0) / balanceDimensions.length) * 10) / 10;

  const updateGoalMap = (patch) => {
    setState((current) => ({
      ...current,
      goalMap: {
        ...(current.goalMap ?? {}),
        ...patch,
      },
    }));
  };

  const updateMilestone = (key, value) => {
    updateGoalMap({
      milestones: {
        ...(goalMap.milestones ?? {}),
        [key]: value,
      },
    });
  };

  const updateBalance = (key, value) => {
    updateGoalMap({
      balance: {
        ...goalMap.balance,
        [key]: Number(value),
      },
    });
  };

  const syncDailyAction = () => {
    const action = goalMap.dailyAction.trim();
    if (!action) return;
    updateCheck(activeDay, { intention: action, goalActionSynced: true });
    navigateToView("dashboard", "daily-ritual");
  };

  return (
    <section className="panel goal-map-panel" id="goal-map" aria-label="重启目标地图">
      <div className="goal-map-head">
        <div>
          <span className="panel-kicker">GOAL TO DAILY ACTION</span>
          <h2>把 30 天愿景，拆成今天能发生的动作。</h2>
          <p>不是写一张漂亮的目标清单，而是建立成果、里程碑、今日行动和生活平衡之间的可回看连接。</p>
        </div>
        <div className="goal-map-readiness">
          <span>目标清晰度</span>
          <strong>{planProgress}%</strong>
          <div><i style={{ width: `${planProgress}%` }} /></div>
          <small>{planSignals}/4 个关键节点已写下</small>
        </div>
      </div>

      <div className="goal-map-intent-grid">
        <label>
          30 天后，我要看见什么可验证成果？
          <textarea
            value={goalMap.outcome}
            onChange={(event) => updateGoalMap({ outcome: event.target.value })}
            placeholder="例：连续 21 天在 23:30 前进入睡前收束，并在上午保持一个 90 分钟深度工作块。"
          />
        </label>
        <label>
          为什么这个成果值得我持续投入？
          <textarea
            value={goalMap.meaning}
            onChange={(event) => updateGoalMap({ meaning: event.target.value })}
            placeholder="例：我想先恢复稳定的身体和节奏，不再靠透支换取完成感。"
          />
        </label>
      </div>

      <div className="goal-map-milestones" aria-label="四周里程碑">
        {milestones.map((milestone) => (
          <article key={milestone.key} className={goalMap.milestones?.[milestone.key]?.trim() ? "complete" : ""}>
            <div>
              <span>{milestone.range}</span>
              <strong>{milestone.title}</strong>
            </div>
            <textarea
              value={goalMap.milestones?.[milestone.key] ?? ""}
              onChange={(event) => updateMilestone(milestone.key, event.target.value)}
              placeholder={milestone.prompt}
              aria-label={`${milestone.range} ${milestone.title}`}
            />
          </article>
        ))}
      </div>

      <div className="goal-map-execution-grid">
        <div className="goal-map-today">
          <span>DAY {String(activeDay).padStart(2, "0")} · 今日关键动作</span>
          <strong>{activeProgram.title}</strong>
          <p>{activeProgram.lesson}</p>
          <textarea
            value={goalMap.dailyAction}
            onChange={(event) => updateGoalMap({ dailyAction: event.target.value })}
            placeholder={check.intention || "写下一个地点、时间和完成标准明确的最小行动。"}
          />
          <button disabled={!goalMap.dailyAction.trim()} onClick={syncDailyAction}>
            <Target size={16} />
            同步到今日任务
          </button>
        </div>
        <div className="goal-map-balance">
          <div className="goal-map-balance-head">
            <div>
              <span>生活平衡校准</span>
              <strong>当前 {balanceAverage}/5</strong>
            </div>
            <small>目标不应靠长期透支完成</small>
          </div>
          {balanceDimensions.map(([key, label, hint]) => (
            <label key={key}>
              <span>{label}<em>{goalMap.balance[key]}/5</em></span>
              <input type="range" min="1" max="5" value={goalMap.balance[key]} onChange={(event) => updateBalance(key, event.target.value)} />
              <small>{hint}</small>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function OutcomeLedgerPanel({
  state,
  setState,
  activeDay,
  score,
  streak,
  averageEnergy,
  systemCourseProgress,
  navigateToView,
}) {
  const [copied, setCopied] = useState(false);
  const review = state.outcomeReview ?? {};
  const completedMilestone = resultMilestones.filter((item) => activeDay >= item.day).at(-1);
  const nextMilestone = resultMilestones.find((item) => activeDay < item.day) ?? resultMilestones[resultMilestones.length - 1];
  const learningCompleted = systemCourseProgress.completedLessons + systemCourseProgress.completedBookCourses;
  const reportText = [
    `【Newlife30｜第 ${activeDay} 天个人运行报告】`,
    "",
    `连续行动：${streak} 天`,
    `完成训练日：${score.completedDays}/30`,
    `学习完成：${learningCompleted} 项`,
    `平均精力：${averageEnergy ? `${averageEnergy}/5` : "尚未形成趋势"}`,
    "",
    "本阶段最真实的变化：",
    review.biggestGain || "（待填写）",
    "",
    "当前断点：",
    review.breakPoint || "（待填写）",
    "",
    "下一周只保留的微调：",
    review.nextExperiment || "（待填写）",
    "",
    "我不是在追求完美打卡，而是在搭建一套可以持续运行的个人系统。",
  ].join("\n");

  const updateReview = (key, value) => {
    setState((current) => ({
      ...current,
      outcomeReview: {
        ...(current.outcomeReview ?? {}),
        [key]: value,
      },
    }));
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="panel outcome-ledger-panel" id="outcome-ledger">
      <div className="outcome-ledger-head">
        <div>
          <span className="panel-kicker">把改变变成成果资产</span>
          <h2>不是多打几次卡，而是留下证据</h2>
          <p>每周只看三件事：我变好了什么、我卡在哪里、下一周保留哪一个微调。30 天结束时，这些记录会成为你的个人运行报告。</p>
        </div>
        <button onClick={() => navigateToView("group")}>去小组复盘 <ChevronRight size={16} /></button>
      </div>

      <div className="result-rail" aria-label="30 天成果节点">
        {resultMilestones.map((milestone) => (
          <article key={milestone.day} className={activeDay >= milestone.day ? "reached" : ""}>
            <span>DAY {milestone.day}</span>
            <strong>{milestone.title}</strong>
            <p>{milestone.body}</p>
          </article>
        ))}
      </div>

      <div className="outcome-evidence-row">
        <article>
          <span>行动证据</span>
          <strong>{score.completedDays}/30</strong>
          <p>真实完成的训练日</p>
        </article>
        <article>
          <span>连续性</span>
          <strong>{streak} 天</strong>
          <p>中断时也允许回归</p>
        </article>
        <article>
          <span>学习转化</span>
          <strong>{learningCompleted} 项</strong>
          <p>课程和书籍的行动沉淀</p>
        </article>
        <article>
          <span>下一节点</span>
          <strong>Day {nextMilestone.day}</strong>
          <p>{completedMilestone ? `已完成：${completedMilestone.title}` : "从今天的一个动作开始"}</p>
        </article>
      </div>

      <div className="outcome-review-grid">
        <label>
          本阶段最真实的变化
          <textarea value={review.biggestGain ?? ""} onChange={(event) => updateReview("biggestGain", event.target.value)} placeholder="例：连续三天 23:30 前放下手机，上午开工更稳定。" />
        </label>
        <label>
          我最需要修正的断点
          <textarea value={review.breakPoint ?? ""} onChange={(event) => updateReview("breakPoint", event.target.value)} placeholder="例：加班后的晚餐和入睡时间容易失控。" />
        </label>
        <label>
          下一周只保留的微调
          <textarea value={review.nextExperiment ?? ""} onChange={(event) => updateReview("nextExperiment", event.target.value)} placeholder="例：晚餐后 20 分钟散步，22:45 开始睡前收束。" />
        </label>
      </div>

      <div className="outcome-report-preview">
        <div className="generated-head">
          <strong><ClipboardSignature size={17} /> 个人运行报告</strong>
          <button onClick={copyReport}><Copy size={16} />{copied ? "已复制" : "复制报告"}</button>
        </div>
        <textarea readOnly value={reportText} aria-label="个人运行报告" />
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
    quote: detail.quote ?? null,
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

function SystemCoursesView({
  activeCourseId,
  setActiveCourseId,
  setActiveSystemId,
  courseWork = {},
  updateCourseWork,
  navigateToView,
}) {
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
            {activeCourse.goldenQuote && (
              <blockquote className="academy-golden-quote">{activeCourse.goldenQuote}</blockquote>
            )}
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

      <section id="academy-cohort-rhythm" className="panel academy-cohort-panel">
        <SectionTitle icon={UsersRound} title="30 天陪跑式课程机制" action="课程、工具、同伴只服务一个成果" />
        <div className="academy-cohort-intro">
          <div>
            <span>NEWLIFE30 COURSE RHYTHM</span>
            <h3>先完成一周，再升级下一周。</h3>
          </div>
          <p>
            我们保留一站式成长的课程与工具优势，但不让用户淹没在内容里。每周围绕一个具体问题，完成一次学习、应用、反馈和成果回看。
          </p>
        </div>
        <div className="academy-cohort-grid">
          {academyCohortRhythm.map((stage, index) => (
            <article key={stage.day} className="academy-cohort-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <em>{stage.day}</em>
              <strong>{stage.title}</strong>
              <p>{stage.body}</p>
              <small>{stage.output}</small>
            </article>
          ))}
        </div>
        <div className="academy-cohort-actions">
          <button onClick={() => selectCourse(activeCourse.id, activeLessonIndex, "lesson-workbench")}>
            从{activeCourse.name}开始
            <ChevronRight size={16} />
          </button>
          <button className="secondary" onClick={() => navigateToView("group")}>
            进入同伴反馈
          </button>
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

      <section className="panel immersive-course-panel">
        <SectionTitle icon={Headphones} title="全球成长主题引入课" action="自研转化 · 多模态微训练" />
        <div className="immersive-course-intro">
          <div>
            <span>IMMERSIVE INTRODUCTORY SERIES</span>
            <h3>把高阶成长主题，翻译成今天就能练的一次体验。</h3>
          </div>
          <p>
            这些课程由 Newlife30 按中国用户的生活场景重新编排：每节保留一个模型、一段引导和一个当日动作，
            并接回八大系统、打卡与小组反馈。课程采用自研内容与公开书目，不转载第三方付费课程材料。
          </p>
        </div>
        <div className="immersive-course-grid">
          {immersiveCourseCollections.map((collection) => (
            <article key={collection.id} className="immersive-course-card">
              <div className="immersive-course-card-head">
                <span>{collection.label}</span>
                <em>{collection.duration}</em>
              </div>
              <strong>{collection.title}</strong>
              <p>{collection.body}</p>
              <div className="immersive-course-flow">
                {collection.flow.map((step, index) => <span key={step}>{String(index + 1).padStart(2, "0")} {step}</span>)}
              </div>
              <div className="immersive-course-action">
                <small>当日动作</small>
                <p>{collection.action}</p>
              </div>
              <button onClick={() => selectCourse(collection.systemId, collection.lessonIndex, "lesson-workbench")}>
                进入引入训练
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
              <div key={course.id} className="tilt-card-wrapper">
                <button
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
              </div>
            ))}
          </div>
        </section>

        <section className="panel course-detail-panel" id="system-course-detail">
          <SectionTitle icon={Compass} title={activeCourse.name} action={activeCourse.order} />
          <div className="course-hero-block">
            <span>{activeCourse.courseTitle}</span>
            <h2>{activeCourse.positioning}</h2>
            <p>{activeCourse.outcome}</p>
            {activeCourse.goldenQuote && (
              <blockquote className="course-golden-quote">{activeCourse.goldenQuote}</blockquote>
            )}
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
              {activeLesson.quote && (
                <div className="lesson-golden-quote">
                  <span className="lesson-golden-quote-mark">✦</span>
                  <blockquote>{activeLesson.quote}</blockquote>
                  <span className="lesson-golden-quote-label">本课金句</span>
                </div>
              )}
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

function TheoryView({ navigateToView }) {
  return (
    <div className="theory-layout">
      <section className="benchmark-study-panel theory-wide" aria-label="Fabulous 标杆产品拆解">
        <header className="benchmark-study-header">
          <span>04 · 标杆产品拆解</span>
          <h2>Fabulous</h2>
        </header>
        <p className="benchmark-study-summary">
          以行为科学与游戏化体验切入日常习惯，它证明了“先让人愿意开始”比先讲完整理论更重要。
          Newlife30 将这一优势延伸为有固定周期、有本土生活场景、有同伴支持的 30 天训练。
        </p>

        <div className="benchmark-study-grid">
          <article className="benchmark-product-card">
            <div className="benchmark-product-mark">
              <MonitorPlay size={19} />
              <span>BEHAVIOR DESIGN BENCHMARK</span>
            </div>
            <h3>从“愿意打开”到“愿意完成”</h3>
            <p>Fabulous 的核心启发，是用清晰场景、低门槛动作和短反馈把健康习惯从概念变成可发生的体验。</p>
            <div className="benchmark-pattern-list" aria-label="可借鉴的行为设计机制">
              <span>场景化起点</span>
              <span>微动作引导</span>
              <span>连续反馈</span>
            </div>
            <button onClick={() => navigateToView("dashboard", "daily-ritual")}>
              看 Newlife30 的每日仪式 <ChevronRight size={16} />
            </button>
          </article>

          <article className="benchmark-evidence-card strength">
            <div>
              <Sparkles size={19} />
              <span>可借鉴优势</span>
            </div>
            {fabulousBenchmark.strengths.map(([title, body]) => (
              <p key={title}><strong>{title}</strong>{body}</p>
            ))}
          </article>

          <article className="benchmark-evidence-card gap">
            <div>
              <Target size={19} />
              <span>需要补足的部分</span>
            </div>
            {fabulousBenchmark.gaps.map(([title, body]) => (
              <p key={title}><strong>{title}</strong>{body}</p>
            ))}
          </article>
        </div>

        <div className="benchmark-conclusion-grid">
          <article className="benchmark-insight-card">
            <span>核心洞察</span>
            <p>体验可以降低启动门槛，但只有把训练周期、现实场景和复盘机制连成一套系统，习惯才会留下来。</p>
          </article>
          <article className="benchmark-opportunity-card">
            <div>
              <span>Newlife30 的突破路径</span>
              <p>把每日仪式、八大系统、7/14/30 天成果节点、群内输出与个人报告串成一个可回归的训练闭环。</p>
            </div>
            <button onClick={() => navigateToView("campaign", "campaign-hero")}>
              查看 30 天训练营 <ChevronRight size={16} />
            </button>
          </article>
        </div>
      </section>

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

      <section className="panel theory-wide platform-boundary-panel" id="platform-boundary">
        <SectionTitle icon={ShieldCheck} title="平台使用边界" action="行为训练，不替代专业照护" />
        <div className="platform-boundary-grid">
          <article>
            <strong>平台可以帮助的事</strong>
            <p>把睡眠、节律、目标、学习和复盘转成更小、更具体、更容易持续的日常动作。</p>
          </article>
          <article>
            <strong>平台不承担的事</strong>
            <p>不作医疗诊断，不替代医生、心理治疗师或其他持证专业人员的评估和治疗。</p>
          </article>
          <article>
            <strong>优先寻求专业支持的情况</strong>
            <p>出现急性心理危机、自伤风险、严重睡眠障碍或其他需要临床支持的情况时，请优先联系专业服务。</p>
          </article>
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
        label="训练 XP"
        value={`${score.totalScore}`}
        detail={`日课 ${score.dailyScore} · 课程 ${score.courseScore + score.lessonScore + score.bookScore} · 小组 ${score.groupScore}`}
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
    `个人训练经验：${score.dailyScore + score.courseScore + score.lessonScore + score.bookScore}`,
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
        <SectionTitle icon={LineChart} title="XP 结算规则" action="日课 +10 · 系统课 +20 · 满勤 +30" />
        <div className="group-metric-grid">
          <article className="group-stat-card">
            <span>每日打卡</span>
            <strong>{score.dailyScore}</strong>
            <p>{score.completedDays} 天完成，每天 +10。</p>
          </article>
          <article className="group-stat-card">
            <span>课程训练</span>
            <strong>{score.courseScore + score.lessonScore + score.bookScore}</strong>
            <p>{score.completedCourses} 门核心课、{score.completedLessons} 节系统课、{score.completedBookCourses} 节书籍实践。</p>
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
