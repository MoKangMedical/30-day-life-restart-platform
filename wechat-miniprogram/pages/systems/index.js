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
