const { systems } = require("../../utils/data");

function buildSystemViews(activeId) {
  return systems.map((system) => ({
    ...system,
    active: system.id === activeId,
  }));
}

Page({
  data: {
    systems: buildSystemViews(systems[0].id),
    activeId: systems[0].id,
    activeSystem: systems[0],
  },

  onShow() {
    const preferredId = wx.getStorageSync("life-restart-selected-system");
    if (systems.some((system) => system.id === preferredId)) {
      const activeSystem = systems.find((system) => system.id === preferredId) || systems[0];
      this.setData({
        activeId: activeSystem.id,
        activeSystem,
        systems: buildSystemViews(activeSystem.id),
      });
    }
  },

  selectSystem(event) {
    const activeId = event.currentTarget.dataset.id;
    const activeSystem = systems.find((system) => system.id === activeId) || systems[0];
    this.setData({
      activeId,
      activeSystem,
      systems: buildSystemViews(activeId),
    });
  },
});
