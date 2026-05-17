const { courses, coreCourses } = require("../../utils/data");
const { getState, patchState } = require("../../utils/store");

function buildCourseViews(activeId) {
  return courses.map((course) => ({
    ...course,
    active: course.id === activeId,
  }));
}

function buildActiveCourse(course) {
  return {
    ...course,
    lessonViews: course.lessons.map((lesson, index) => ({
      num: String(index + 1).padStart(2, "0"),
      title: lesson[0],
      body: lesson[1],
    })),
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
    activeCourse: buildActiveCourse(courses[0]),
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
    const courseChecks = state.courses || {};
    this.setData({
      courses: buildCourseViews(this.data.activeId),
      coreCourses: buildCoreViews(courseChecks),
      activeCourse: buildActiveCourse(activeCourse),
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
      courses: buildCourseViews(activeId),
      activeCourse: buildActiveCourse(activeCourse),
      playing: false,
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
