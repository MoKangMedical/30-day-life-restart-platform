const { courses, coreCourses } = require("../../utils/data");
const { getState, patchState } = require("../../utils/store");

function buildCourseViews(activeId) {
  return courses.map((course) => ({
    ...course,
    active: course.id === activeId,
  }));
}

function buildLessonDetail(course, lessonIndex) {
  const lesson = course.lessons[lessonIndex] || course.lessons[0];
  const practice = (course.practices || [])[lessonIndex] || course.outcome;
  return {
    num: String(lessonIndex + 1).padStart(2, "0"),
    title: lesson[0],
    body: lesson[1],
    lecture: [
      `${lesson[0]}：${lesson[1]}`,
      `这节课在「${course.name}」里的作用，是把${course.courseTitle}从概念转成今天可以执行、明天可以复盘的动作。`,
    ],
    caseText: `把「${lesson[0]}」放到今天的一个真实场景里：先观察旧反应，再用本课模型解释它，最后只做一个最小修正。`,
    mistake: "只听懂概念，没有写下具体场景、具体动作和检查标准。",
    steps: [
      "写下旧模式",
      "写下本课新规则",
      practice,
      "晚上记录反馈",
    ],
    assignment: practice,
  };
}

function buildActiveCourse(course, activeLessonIndex = 0) {
  return {
    ...course,
    lessonViews: course.lessons.map((lesson, index) => ({
      num: String(index + 1).padStart(2, "0"),
      title: lesson[0],
      body: lesson[1],
      active: index === activeLessonIndex,
      index,
    })),
    activeLessonIndex,
    activeLesson: buildLessonDetail(course, activeLessonIndex),
    practiceViews: course.practices || [],
    bookViews: course.books.map((book) => ({
      title: book[0],
      body: book[1],
    })),
    bookCourseViews: (course.bookCourses || []).map((item) => ({
      source: item[0],
      title: item[1],
      assignment: item[2],
    })),
  };
}

function buildCoreViews(courseChecks) {
  return coreCourses.map((course) => ({
    ...course,
    done: Boolean(courseChecks[course.id]),
  }));
}

Page({
  data: {
    courses: buildCourseViews(courses[0].id),
    coreCourses: buildCoreViews({}),
    activeId: courses[0].id,
    activeLessonIndex: 0,
    activeCourse: buildActiveCourse(courses[0], 0),
    courseChecks: {},
    playing: false,
  },

  onLoad() {
    this.audio = wx.createInnerAudioContext();
    this.audio.onEnded(() => this.setData({ playing: false }));
    this.audio.onError(() => {
      this.setData({ playing: false });
      wx.showToast({ title: "音频暂不可用", icon: "none" });
    });
  },

  onShow() {
    this.refresh();
  },

  onUnload() {
    if (this.audio) {
      this.audio.destroy();
    }
  },

  refresh() {
    const state = getState();
    const activeCourse = courses.find((course) => course.id === this.data.activeId) || courses[0];
    const activeLessonIndex = this.data.activeLessonIndex || 0;
    const courseChecks = state.courses || {};
    this.setData({
      courses: buildCourseViews(this.data.activeId),
      coreCourses: buildCoreViews(courseChecks),
      activeCourse: buildActiveCourse(activeCourse, activeLessonIndex),
      courseChecks,
    });
  },

  selectCourse(event) {
    const activeId = event.currentTarget.dataset.id;
    const activeCourse = courses.find((course) => course.id === activeId) || courses[0];
    if (this.audio) {
      this.audio.stop();
    }
    this.setData({
      activeId,
      activeLessonIndex: 0,
      courses: buildCourseViews(activeId),
      activeCourse: buildActiveCourse(activeCourse, 0),
      playing: false,
    });
  },

  selectLesson(event) {
    const activeLessonIndex = Number(event.currentTarget.dataset.index || 0);
    const activeCourse = courses.find((course) => course.id === this.data.activeId) || courses[0];
    this.setData({
      activeLessonIndex,
      activeCourse: buildActiveCourse(activeCourse, activeLessonIndex),
    });
  },

  toggleCoreCourse(event) {
    const id = event.currentTarget.dataset.id;
    patchState((state) => ({
      ...state,
      courses: {
        ...state.courses,
        [id]: !state.courses[id],
      },
    }));
    this.refresh();
  },

  toggleAudio() {
    if (!this.audio) return;
    if (this.data.playing) {
      this.audio.pause();
      this.setData({ playing: false });
      return;
    }
    this.audio.src = this.data.activeCourse.audio;
    this.audio.play();
    this.setData({ playing: true });
  },
});
