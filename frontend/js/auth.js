(function () {
  function setAuthTab(name) {
    document.querySelectorAll("[data-auth-form]").forEach(function (form) {
      form.classList.toggle("hidden", form.dataset.authForm !== name);
    });
    document.querySelectorAll("[data-auth-tab]").forEach(function (tab) {
      const active = tab.dataset.authTab === name;
      tab.classList.toggle("border-indigo-400", active);
      tab.classList.toggle("text-white", active);
      tab.classList.toggle("border-transparent", !active);
      tab.classList.toggle("text-slate-400", !active);
    });
  }

  async function updateCoinBalance() {
    const balance = await window.apiRequest("/coins/balance");
    document.getElementById("nav-coins").textContent = balance.coins;
  }

  window.showAuthView = function () {
    document.getElementById("auth-view").classList.remove("hidden");
    document.getElementById("dashboard-view").classList.add("hidden");
    document.getElementById("navbar-user").classList.add("hidden");
    document.getElementById("navbar-user").classList.remove("flex");
  };

  window.showDashboardView = function () {
    document.getElementById("auth-view").classList.add("hidden");
    document.getElementById("dashboard-view").classList.remove("hidden");
    document.getElementById("navbar-user").classList.remove("hidden");
    document.getElementById("navbar-user").classList.add("flex");
  };

  async function restoreSession() {
    if (!window.state.accessToken) {
      window.showAuthView();
      return;
    }
    try {
      await window.loginSuccess();
    } catch (_error) {
      window.clearState();
      window.showAuthView();
    }
  }
  window.restoreSession = restoreSession;

  window.loginSuccess = async function () {
    const user = await window.apiRequest("/users/me");
    window.state.currentUser = user;
    window.saveState();
    await updateCoinBalance();

    document.getElementById("nav-user-name").textContent = user.name;
    document.getElementById("nav-user-role").textContent = user.role;
    document.getElementById("dashboard-name").textContent = user.name;
    document.getElementById("dashboard-date").textContent =
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    window.showDashboardView();

    if (typeof window.loadDashboardData === "function") {
      await window.loadDashboardData();
    }
  };

  async function logout() {
    try {
      if (window.state.accessToken) {
        await window.apiRequest("/auth/logout", { method: "POST" });
      }
    } catch (_error) {
      // Always clear local credentials even if the server logout fails.
    } finally {
      window.clearState();
      window.showAuthView();
      window.showToast("Logged out successfully", "success");
    }
  }

  document.getElementById("login-tab").addEventListener("click", function () {
    setAuthTab("login");
  });
  document.getElementById("register-tab").addEventListener("click", function () {
    setAuthTab("register");
  });

  document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    try {
      const result = await window.apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: document.getElementById("login-email").value.trim(),
          password: document.getElementById("login-password").value,
        },
      });
      window.state.accessToken = result.accessToken;
      window.state.refreshToken = result.refreshToken;
      window.saveState();
      await window.loginSuccess();
      window.showToast("Welcome back!", "success");
    } catch (error) {
      window.showToast(error.message, "error");
    }
  });

  document.getElementById("register-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    try {
      await window.apiRequest("/auth/register", {
        method: "POST",
        body: {
          name: document.getElementById("register-name").value.trim(),
          email: document.getElementById("register-email").value.trim(),
          password: document.getElementById("register-password").value,
        },
      });
      window.showToast("Account created - logging you in", "success");
      const result = await window.apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: document.getElementById("register-email").value.trim(),
          password: document.getElementById("register-password").value,
        },
      });
      window.state.accessToken = result.accessToken;
      window.state.refreshToken = result.refreshToken;
      window.saveState();
      await window.loginSuccess();
    } catch (error) {
      window.showToast(error.message, "error");
    }
  });

  document.getElementById("logout-button").addEventListener("click", logout);
  document.getElementById("brand-home").addEventListener("click", function () {
    if (window.state.accessToken) {
      window.showDashboardView();
    } else {
      window.showAuthView();
    }
  });

  window.updateCoinBalance = updateCoinBalance;
  window.logout = logout;
  window.restoreSession = restoreSession;
})();
