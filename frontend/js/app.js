(function () {
  window.switchDashboardTab = function (name) {
    document.querySelectorAll("[data-tab]").forEach(function (tab) {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("border-indigo-400", active);
      tab.classList.toggle("bg-indigo-500/10", active);
      tab.classList.toggle("text-white", active);
      tab.classList.toggle("border-transparent", !active);
      tab.classList.toggle("text-slate-400", !active);
    });
    document.querySelectorAll("[data-panel]").forEach(function (panel) {
      panel.classList.toggle("hidden", panel.dataset.panel !== name);
    });
  };

  document.querySelectorAll("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      window.switchDashboardTab(tab.dataset.tab);
    });
  });

  window.loadDashboardData = async function () {
    const tasks = [];
    if (typeof window.loadSkillsTab === "function") tasks.push(window.loadSkillsTab());
    if (typeof window.loadSessionsTab === "function") tasks.push(window.loadSessionsTab());
    await Promise.all(tasks.map(function (task) {
      return task.catch(function (error) {
        window.showToast(error.message || "Failed to load dashboard data", "error");
      });
    }));
  };
})();
