(function () {
  const storageKey = "skillswap_theme";

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(storageKey);
    applyTheme(saved || "light");
  }

  window.setButtonLoading = function (button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.originalHtml = button.dataset.originalHtml || button.innerHTML;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.classList.add("is-loading");
      button.innerHTML = '<span class="coin-spinner" aria-hidden="true"></span><span>' + (label || "Working") + "</span>";
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.classList.remove("is-loading");
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  };

  window.escapeMintHtml = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        localStorage.setItem(storageKey, next);
        applyTheme(next);
      });
    });
  });
})();
