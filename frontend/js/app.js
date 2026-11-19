(function () {
  const loadedTabs = new Set();

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
    window.loadDashboardTab(name);
  };

  document.querySelectorAll("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      window.switchDashboardTab(tab.dataset.tab);
    });
  });

  window.loadDashboardTab = async function (name) {
    if (loadedTabs.has(name)) return;
    loadedTabs.add(name);
    try {
      if (name === "skills" && typeof window.loadSkillsTab === "function") {
        await window.loadSkillsTab();
      } else if (name === "match" && typeof window.loadMatchTab === "function") {
        await window.loadMatchTab();
      } else if (name === "sessions" && typeof window.loadSessionsTab === "function") {
        await window.loadSessionsTab();
      } else if (name === "chat" && typeof window.loadChatTab === "function") {
        await window.loadChatTab();
      } else if (name === "analytics" && typeof window.loadAnalyticsTab === "function") {
        await window.loadAnalyticsTab();
      }
    } catch (error) {
      loadedTabs.delete(name);
      window.showToast(error.message || "Failed to load tab data", "error");
    }
  };

  window.loadDashboardData = async function () {
    await window.loadDashboardTab("skills");
    await window.loadDashboardTab("sessions");
  };

  function initializeApp() {
    if (window.state.accessToken && typeof window.restoreSession === "function") {
      window.restoreSession().catch(function (error) {
        window.showToast(error.message || "Session could not be restored", "error");
      });
    } else if (typeof window.showAuthView === "function") {
      window.showAuthView();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
})();
