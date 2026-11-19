(function () {
  const API_BASE = "/api/v1";
  window.API_BASE = API_BASE;

  window.state = {
    accessToken: null,
    refreshToken: null,
    currentUser: null,
  };

  window.loadState = function () {
    try {
      window.state.accessToken = localStorage.getItem("skillswap_access_token");
      window.state.refreshToken = localStorage.getItem("skillswap_refresh_token");
      const user = localStorage.getItem("skillswap_current_user");
      window.state.currentUser = user ? JSON.parse(user) : null;
    } catch (_error) {
      window.clearState();
    }
  };

  window.saveState = function () {
    if (window.state.accessToken) {
      localStorage.setItem("skillswap_access_token", window.state.accessToken);
    } else {
      localStorage.removeItem("skillswap_access_token");
    }
    if (window.state.refreshToken) {
      localStorage.setItem("skillswap_refresh_token", window.state.refreshToken);
    } else {
      localStorage.removeItem("skillswap_refresh_token");
    }
    if (window.state.currentUser) {
      localStorage.setItem("skillswap_current_user", JSON.stringify(window.state.currentUser));
    } else {
      localStorage.removeItem("skillswap_current_user");
    }
  };

  window.clearState = function () {
    window.state.accessToken = null;
    window.state.refreshToken = null;
    window.state.currentUser = null;
    window.saveState();
  };

  window.loadState();
})();
