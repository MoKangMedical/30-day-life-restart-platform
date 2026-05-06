import React, { useMemo, useState } from "react";
import {
  Activity,
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
  Headphones,
  LineChart,
  MessageCircle,
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
  nutrition,
  programDays,
  systems,
  zenCourses,
} from "./data.js";
import { bookCourseTracks, systemCourseCatalog } from "./systemCourses.js";

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
  { id: "dashboard", label: "今日重启" },
  { id: "theory", label: "理论体系" },
  { id: "courses", label: "八系课程" },
  { id: "learning", label: "学习机制" },
  { id: "group", label: "小组场域" },
  { id: "systems", label: "系统地图" },
  { id: "nutrition", label: "身心日课" },
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

function createDefaultState() {
  const today = getLocalDate();
  return {
    startDate: today,
    checks: {},
    courses: {},
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

function App() {
  const [state, setState] = useStoredState();
  const today = getLocalDate();
  const todayDay = clamp(daysBetween(state.startDate, today) + 1, 1, 30);
  const [activeDay, setActiveDay] = useState(todayDay);
  const [activeSystemId, setActiveSystemId] = useState(programDays[todayDay - 1].systemId);
  const [activeCourseId, setActiveCourseId] = useState(systemCourseCatalog[0].id);
  const [activeView, setActiveView] = useState("dashboard");

  const activeProgram = programDays[activeDay - 1];
  const activeSystem = systems.find((system) => system.id === activeSystemId) ?? systems[0];
  const check = state.checks[activeDay] ?? {};
  const score = calculateScore(state);
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

  const selectDay = (day) => {
    setActiveDay(day.day);
    setActiveSystemId(day.systemId);
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
              onClick={() => setActiveView(view.id)}
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
                onClick={() => {
                  setActiveSystemId(system.id);
                  setActiveCourseId(system.id);
                  setActiveView("systems");
                }}
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
              onClick={() => setState((current) => ({ ...current, pledgeAccepted: !current.pledgeAccepted }))}
            >
              <ShieldCheck size={18} />
              {state.pledgeAccepted ? "承诺已确认" : "确认承诺"}
            </button>
            <button className="primary-action" onClick={completeActiveDay}>
              <Save size={18} />
              完成今日打卡
            </button>
          </div>
        </header>

        <section className="stats-row" aria-label="训练进度">
          <MetricCard label="30天进度" value={`${score.completedDays}/30`} detail={`今天是第 ${todayDay} 天`} icon={LineChart} />
          <MetricCard label="连续完成" value={`${streak}天`} detail="从第 1 天起连续计算" icon={Flame} />
          <MetricCard label="平均精力" value={averageEnergy ? `${averageEnergy}/5` : "未记录"} detail="来自每日状态打卡" icon={Activity} />
          <MetricCard label="核心课程" value={`${score.completedCourses}/4`} detail="承诺参与 4 次核心课" icon={BookOpen} />
          <MetricCard label="积分" value={`${score.totalScore}`} detail={`打卡 ${score.dailyScore} · 课程 ${score.courseScore} · 小组 ${score.groupScore}`} icon={ClipboardCheck} />
        </section>

        {activeView === "dashboard" && (
          <div className="dashboard-grid">
            <section className="panel progress-panel">
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
                    onClick={() => selectDay(day)}
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

            <section className="panel today-panel">
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
                  value={check.output ?? ""}
                  onChange={(event) => updateCheck(activeDay, { output: event.target.value })}
                  placeholder="写下今天的真实输出，不需要完美。"
                />
              </label>
              <label className="note-field">
                复盘问题：{activeProgram.prompt}
                <textarea
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
          <SystemCoursesView activeCourseId={activeCourseId} setActiveCourseId={setActiveCourseId} />
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
                        setActiveDay(day.day);
                        setActiveSystemId(day.systemId);
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
          <div className="systems-layout">
            <section className="panel system-detail">
              <SectionTitle icon={Compass} title="系统地图" action={activeSystem.order} />
              <SystemDetail system={activeSystem} />
            </section>
            <section className="panel systems-table">
              <SectionTitle icon={LineChart} title="八大系统总览" action="训练方式可落地" />
              <div className="system-card-grid">
                {systems.map((system) => {
                  const Icon = iconMap[system.icon];
                  return (
                    <button
                      key={system.id}
                      className={system.id === activeSystemId ? "system-card active" : "system-card"}
                      onClick={() => setActiveSystemId(system.id)}
                    >
                      <Icon size={22} />
                      <span>{system.order}</span>
                      <strong>{system.name}</strong>
                      <em>{system.duration}</em>
                    </button>
                  );
                })}
              </div>
              <div className="architecture-note">
                <strong>架构已平台化</strong>
                <p>原始理念已经转化为八大系统、难度周期、训练方式、每日打卡、课程路径和小组场域，不再以原始材料图展示。</p>
              </div>
            </section>
          </div>
        )}

        {activeView === "nutrition" && (
          <div className="wide-grid">
            <CheckinModesPanel
              activeDay={activeDay}
              check={check}
              updateCheckinTemplate={updateCheckinTemplate}
              large
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
      </main>
    </div>
  );
}

function SystemCoursesView({ activeCourseId, setActiveCourseId }) {
  const activeCourse = systemCourseCatalog.find((course) => course.id === activeCourseId) ?? systemCourseCatalog[0];
  const bookCourses = bookCourseTracks[activeCourse.id] ?? [];

  return (
    <div className="courses-layout">
      <section className="panel course-index-panel">
        <SectionTitle icon={BookOpen} title="八个体系理论课程" action="课程包" />
        <div className="course-index-list">
          {systemCourseCatalog.map((course) => (
            <button
              key={course.id}
              className={course.id === activeCourse.id ? "course-index-row active" : "course-index-row"}
              onClick={() => setActiveCourseId(course.id)}
            >
              <span>{course.order}</span>
              <strong>{course.name}</strong>
              <em>{course.courseTitle}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="panel course-detail-panel">
        <SectionTitle icon={Compass} title={activeCourse.name} action={activeCourse.order} />
        <div className="course-hero-block">
          <span>{activeCourse.courseTitle}</span>
          <h2>{activeCourse.positioning}</h2>
          <p>{activeCourse.outcome}</p>
        </div>

        <div className="course-section">
          <h3>理论课程结构</h3>
          <div className="course-lesson-grid">
            {activeCourse.lessons.map(([title, body], index) => (
              <article key={title} className="course-lesson-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="course-section">
          <h3>训练作业</h3>
          <div className="practice-list">
            {activeCourse.practices.map((practice) => (
              <div key={practice} className="practice-item">
                <CheckCircle2 size={17} />
                <span>{practice}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="course-section">
          <h3>热门书籍转化课程</h3>
          <div className="book-course-grid">
            {bookCourses.map((course) => (
              <article key={course.courseTitle} className="book-course-card">
                <span>{course.source}</span>
                <strong>{course.courseTitle}</strong>
                <p>{course.model}</p>
                <ul>
                  {course.outline.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <em>{course.assignment}</em>
              </article>
            ))}
          </div>
        </div>

        <div className="course-section">
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

        <div className="course-section audio-block">
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

function MetricCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="metric-card">
      <Icon size={21} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
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

function SystemDetail({ system }) {
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
    </article>
  );
}

export default App;
