(function () {
  window.showToast = function (message, type) {
    const container = document.getElementById("toasts");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "m-toast " + (type === "error" || type === "err" ? "m-toast--err" : "m-toast--ok");
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.textContent = message;
    container.appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, 3500);
  };

  window.apiRequest = async function (endpoint, options) {
    options = options || {};
    const request = async function (allowRefresh) {
      const headers = Object.assign({}, options.headers || {});
      if (window.state.accessToken) {
        headers.Authorization = "Bearer " + window.state.accessToken;
      }
      if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      let response = await fetch(window.API_BASE + endpoint, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (response.status === 401 && allowRefresh && window.state.refreshToken) {
        const refreshResponse = await fetch(window.API_BASE + "/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: window.state.refreshToken }),
        });
        const refreshPayload = await refreshResponse.json().catch(function () {
          return {};
        });
        const refreshed = refreshPayload.data || refreshPayload;
        if (!refreshResponse.ok || !refreshed.accessToken) {
          throw new Error(refreshed.message || "Your session has expired");
        }
        window.state.accessToken = refreshed.accessToken;
        window.saveState();
        response = await fetch(window.API_BASE + endpoint, {
          method: options.method || "GET",
          headers: Object.assign({}, headers, {
            Authorization: "Bearer " + window.state.accessToken,
          }),
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
      }

      const payload = await response.json().catch(function () {
        return {};
      });
      if (!response.ok) {
        throw new Error(payload.message || "Request failed");
      }
      return payload.data !== undefined ? payload.data : payload;
    };

    try {
      return await request(true);
    } catch (error) {
      if (error.message === "Your session has expired" && typeof window.clearState === "function") {
        window.clearState();
        if (typeof window.showAuthView === "function") window.showAuthView();
      }
      throw error;
    }
  };
})();
