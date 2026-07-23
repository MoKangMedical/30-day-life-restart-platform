const axisDefinitions = [
  {
    id: "recovery",
    label: "恢复来源",
    low: {
      title: "独处补能",
      short: "独处补能",
      body: "独处、安静和明确边界更容易让你恢复。训练优先安排个人仪式、异步复盘和低社交摩擦的行动。",
      training: "先给自己一个安静的恢复窗口，再决定是否进入同伴反馈。",
      systems: ["energy", "rhythm", "feedback"],
    },
    high: {
      title: "联结激活",
      short: "联结激活",
      body: "与可信任的人交流、共同开始和及时回应更容易带动你的行动。训练优先安排同伴回声与具体请求。",
      training: "把关键动作放进小组或伙伴关系中，让外部回应帮助你启动。",
      systems: ["relation", "energy", "identity"],
    },
  },
  {
    id: "information",
    label: "信息入口",
    low: {
      title: "具象起步",
      short: "具象起步",
      body: "看得见的步骤、案例和明确完成标准更容易让你开始。课程应先给操作，再解释模型。",
      training: "先完成一个具体动作，再回看它背后的原理。",
      systems: ["action", "rhythm", "energy"],
    },
    high: {
      title: "全局建模",
      short: "全局建模",
      body: "理解全貌、因果关系和长期意义后，你更容易投入。课程应先给系统图和问题框架。",
      training: "先看清问题结构，再把模型压缩成今天的一步。",
      systems: ["learning", "value", "identity"],
    },
  },
  {
    id: "decision",
    label: "决策锚点",
    low: {
      title: "证据校准",
      short: "证据校准",
      body: "你更愿意依据事实、比较和可验证结果作决定。训练适合使用指标、因果链和复盘规则。",
      training: "把感受翻译成证据、假设和下一次可验证的动作。",
      systems: ["feedback", "action", "value"],
    },
    high: {
      title: "价值联结",
      short: "价值联结",
      body: "当行动与关系、意义和真实感受相连时，你更容易持续。训练需要先建立为什么。",
      training: "先连接行动与自己在乎的人和事，再设定完成标准。",
      systems: ["identity", "relation", "energy"],
    },
  },
  {
    id: "structure",
    label: "行动结构",
    low: {
      title: "规则推进",
      short: "规则推进",
      body: "固定时间、明确边界和完成顺序能减少你的决策损耗。训练适合稳定节律和可见进度。",
      training: "把重要动作放进固定场域，用少量规则减少临时选择。",
      systems: ["rhythm", "action", "feedback"],
    },
    high: {
      title: "弹性探索",
      short: "弹性探索",
      body: "保留选择空间、从兴趣切入和允许调整更能保护你的持续性。训练适合任务池与最小回归动作。",
      training: "保留一个可替换的行动选项，失序后用最小动作重新进入。",
      systems: ["energy", "learning", "identity"],
    },
  },
];

export const preferenceQuestions = [
  {
    id: "recovery-1",
    axisId: "recovery",
    prompt: "经历一段高压工作后，什么更能让你恢复？",
    low: "安静待一会儿，先不回应任何人。",
    high: "找可信任的人聊几句，理清状态。",
  },
  {
    id: "recovery-2",
    axisId: "recovery",
    prompt: "面对一项重要任务时，你通常更容易怎样启动？",
    low: "自己先想清楚，再拿出初稿。",
    high: "先和伙伴约定，一起开始或互相提醒。",
  },
  {
    id: "recovery-3",
    axisId: "recovery",
    prompt: "当状态下滑时，什么提醒方式更有效？",
    low: "一条安静、明确的个人提示。",
    high: "一个人的追问或同伴打卡。",
  },
  {
    id: "recovery-4",
    axisId: "recovery",
    prompt: "你更希望复盘发生在哪里？",
    low: "独立写下事实、感受和下一步。",
    high: "先说出来，再获得具体反馈。",
  },
  {
    id: "information-1",
    axisId: "information",
    prompt: "学习一个新方法时，你最想先看到什么？",
    low: "具体案例和可以照着做的步骤。",
    high: "全局框架和它解决的问题。",
  },
  {
    id: "information-2",
    axisId: "information",
    prompt: "面对模糊目标时，你会先做什么？",
    low: "找出今天最小的一步并开始。",
    high: "理解长期方向和各部分之间的关系。",
  },
  {
    id: "information-3",
    axisId: "information",
    prompt: "一节课让你觉得有收获，通常因为？",
    low: "我能立刻用在今天的真实场景。",
    high: "它改变了我理解问题的方式。",
  },
  {
    id: "information-4",
    axisId: "information",
    prompt: "计划失效时，你更需要哪一种帮助？",
    low: "一个替代动作和清晰的完成标准。",
    high: "重新判断方向、假设和优先级。",
  },
  {
    id: "decision-1",
    axisId: "decision",
    prompt: "做取舍时，你通常先问什么？",
    low: "哪个选择的证据更充分、结果更可验证？",
    high: "哪个选择更符合我在乎的人和价值？",
  },
  {
    id: "decision-2",
    axisId: "decision",
    prompt: "复盘一次失败时，什么对你最有帮助？",
    low: "找到可控原因，并改成下一条规则。",
    high: "理解它对关系、感受和意义的影响。",
  },
  {
    id: "decision-3",
    axisId: "decision",
    prompt: "当朋友向你求助时，你倾向先提供？",
    low: "清晰分析、选项和可执行建议。",
    high: "理解、支持和双方都能接受的路径。",
  },
  {
    id: "decision-4",
    axisId: "decision",
    prompt: "什么最能让你持续完成一个长期训练？",
    low: "看见数据、进度和真实成果。",
    high: "感到它正在让我成为更一致的人。",
  },
  {
    id: "structure-1",
    axisId: "structure",
    prompt: "你更愿意怎样安排一周？",
    low: "提前固定重要场域和时间边界。",
    high: "保留可调整的任务池，按状态选择。",
  },
  {
    id: "structure-2",
    axisId: "structure",
    prompt: "遇到临时变化时，你更安心的是？",
    low: "知道替代安排和新的截止点。",
    high: "允许根据新的情况重新选择。",
  },
  {
    id: "structure-3",
    axisId: "structure",
    prompt: "每天打开平台时，你期待看到？",
    low: "一条明确的下一步指令。",
    high: "几种可以选择的行动入口。",
  },
  {
    id: "structure-4",
    axisId: "structure",
    prompt: "中断几天后，什么更能让你回来？",
    low: "按既定规则从一个固定动作重启。",
    high: "从当前最想做的轻量动作重新进入。",
  },
];

export const preferenceAxisDefinitions = axisDefinitions;

export function getPreferenceMap(responses = {}) {
  const axes = axisDefinitions.map((axis) => {
    const questions = preferenceQuestions.filter((question) => question.axisId === axis.id);
    const answered = questions.filter((question) => responses[question.id] === "low" || responses[question.id] === "high");
    const total = answered.reduce((sum, question) => sum + (responses[question.id] === "high" ? 1 : -1), 0);
    const orientation = total === 0 ? "balanced" : total > 0 ? "high" : "low";
    const profile = orientation === "balanced"
      ? {
          title: "双向可用",
          short: "双向可用",
          body: `你会根据场景在${axis.low.short}和${axis.high.short}之间切换。训练不预设单一路径，而是让你先选择当下阻力更低的入口。`,
          training: "每周复盘哪一种方式让真实行动更容易发生，再以记录而非自我印象调整。",
          systems: [...axis.low.systems.slice(0, 2), ...axis.high.systems.slice(0, 2)],
        }
      : axis[orientation];
    return {
      ...axis,
      answered: answered.length,
      totalQuestions: questions.length,
      score: total,
      orientation,
      profile,
    };
  });

  const complete = axes.every((axis) => axis.answered === axis.totalQuestions);
  const systemScores = {};
  const reasons = {};
  axes.forEach((axis) => {
    axis.profile.systems.forEach((systemId, index) => {
      systemScores[systemId] = (systemScores[systemId] ?? 0) + (3 - index);
      reasons[systemId] = [...(reasons[systemId] ?? []), axis.profile.short];
    });
  });

  const systemOrder = ["energy", "rhythm", "action", "feedback", "learning", "relation", "value", "identity"];
  const recommendedSystemIds = [...systemOrder].sort((left, right) => {
    const scoreDifference = (systemScores[right] ?? 0) - (systemScores[left] ?? 0);
    return scoreDifference || systemOrder.indexOf(left) - systemOrder.indexOf(right);
  });

  return {
    complete,
    axes,
    answeredCount: axes.reduce((sum, axis) => sum + axis.answered, 0),
    totalQuestions: preferenceQuestions.length,
    recommendedSystemIds,
    systemScores,
    reasons,
  };
}

export function getPreferenceCalibration(preferenceMap, checks = {}) {
  const checkValues = Object.values(checks);
  const completedDays = checkValues.filter((check) => check.completed).length;
  const groupDays = checkValues.filter((check) => check.groupFullAttendance).length;
  const completionRate = checkValues.length ? Math.round((completedDays / Math.min(checkValues.length, 30)) * 100) : 0;
  const recoveryAxis = preferenceMap.axes.find((axis) => axis.id === "recovery");
  const structureAxis = preferenceMap.axes.find((axis) => axis.id === "structure");

  if (completedDays < 3) {
    return {
      status: "观察期",
      body: "完成至少 3 天真实训练后，系统会用完成率、状态记录和小组参与度校正推荐，不会把首次选择当成永久标签。",
    };
  }

  if (structureAxis?.orientation === "low" && completionRate < 60) {
    return {
      status: "降低摩擦",
      body: "固定规则目前没有稳定发生。接下来优先把今日训练压缩为一个触发时间和一个最小动作，再逐步增加结构。",
    };
  }

  if (structureAxis?.orientation === "high" && completionRate < 60) {
    return {
      status: "保留弹性",
      body: "你选择了弹性探索，但完成率仍不稳定。接下来会保留任务选择，同时固定一个不可替换的回归动作。",
    };
  }

  if (recoveryAxis?.orientation === "high" && groupDays === 0) {
    return {
      status: "补足外部支持",
      body: "你更容易被联结带动，但还没有记录小组回声。下一步建议带一件真实行动进入小组，获得一次具体反馈。",
    };
  }

  return {
    status: "推荐已校准",
    body: "你的偏好入口与近期训练记录能够共同工作。系统会继续以真实完成和复盘为准，调整下一阶段的课程顺序。",
  };
}
