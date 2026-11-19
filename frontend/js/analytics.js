(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mentorBadge(badge) {
    if (badge === "Grandmaster Mentor") {
      return '<span class="rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-1 text-xs font-bold text-yellow-300">👑 Grandmaster</span>';
    }
    if (badge === "Pro Mentor") {
      return '<span class="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2 py-1 text-xs font-bold text-indigo-300">Pro</span>';
    }
    return '<span class="rounded-full border border-slate-400/20 bg-slate-400/10 px-2 py-1 text-xs font-bold text-slate-300">Rising</span>';
  }

  async function loadLeaderboard() {
    const mentors = await window.apiRequest("/analytics/top-mentors");
    const container = document.getElementById("leaderboard");
    if (!mentors.length) {
      container.innerHTML = '<p class="text-sm text-slate-500">No completed mentor records yet.</p>';
      return;
    }
    container.innerHTML =
      '<div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="text-[10px] uppercase tracking-wider text-slate-500"><tr><th class="pb-2">#</th><th class="pb-2">Mentor</th><th class="pb-2">Badge</th><th class="pb-2 text-right">Coins</th></tr></thead><tbody>' +
      mentors.map(function (mentor, index) {
        return [
          '<tr class="border-t border-white/5">',
          '<td class="py-3 pr-2 text-slate-500">' + (index + 1) + '</td>',
          '<td class="py-3 pr-2"><p class="font-bold text-white">' + escapeHtml(mentor.name) + '</p>',
          '<p class="text-xs text-slate-500">' + escapeHtml(mentor.completedSessions) + ' sessions · ' + Number(mentor.averageRating || 0).toFixed(1) + ' rating</p></td>',
          '<td class="py-3 pr-2">' + mentorBadge(mentor.badge) + '</td>',
          '<td class="py-3 text-right font-bold text-yellow-300">' + escapeHtml(mentor.coinsEarned) + '</td>',
          '</tr>',
        ].join("");
      }).join("") +
      '</tbody></table></div>';
  }

  async function loadTrendingTags() {
    const tags = await window.apiRequest("/analytics/trending-tags");
    const container = document.getElementById("trending-tags");
    if (!tags.length) {
      container.innerHTML = '<p class="text-sm text-slate-500">No trending tags yet.</p>';
      return;
    }
    container.innerHTML = tags.map(function (tag) {
      return [
        '<button type="button" class="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-left">',
        '<span class="block text-sm font-bold text-indigo-300">#' + escapeHtml(tag.tag) + '</span>',
        '<span class="text-[10px] text-slate-500">' + escapeHtml(tag.totalSessions) + ' sessions</span>',
        '</button>',
      ].join("");
    }).join("");
  }

  function statCard(label, value) {
    return [
      '<article class="rounded-xl border border-white/10 bg-black/20 p-3">',
      '<p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">' + escapeHtml(label) + '</p>',
      '<p class="mt-2 text-lg font-black text-white">' + escapeHtml(value) + '</p>',
      '</article>',
    ].join("");
  }

  async function loadAdminInsights() {
    const container = document.getElementById("admin-insights");
    const badge = document.getElementById("admin-insights-badge");
    if (!window.state.currentUser || window.state.currentUser.role !== "ADMIN") {
      badge.classList.add("hidden");
      container.innerHTML =
        '<div class="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-center">' +
        '<p class="text-2xl">🔒</p>' +
        '<p class="mt-2 font-bold text-amber-200">Admin-only analytics</p>' +
        '<p class="mt-2 text-xs text-slate-400">login as admin@skillswap.com to view (demonstrates RBAC)</p>' +
        '</div>';
      return;
    }

    badge.classList.remove("hidden");
    const results = await Promise.all([
      window.apiRequest("/analytics/budget-teachers"),
      window.apiRequest("/analytics/popular-categories"),
      window.apiRequest("/analytics/economy"),
      window.apiRequest("/analytics/demand-gap"),
    ]);
    const budget = results[0];
    const categories = results[1];
    const economyRows = results[2];
    const demand = results[3];
    const economy = economyRows && economyRows[0] ? economyRows[0] : {};

    container.innerHTML =
      '<div class="grid gap-3 sm:grid-cols-2">' +
      statCard("Budget teachers", budget.length) +
      statCard("Popular categories", categories.length) +
      statCard("Coins in circulation", economy.totalCoinsInCirculation || 0) +
      statCard("Completed sessions", economy.completedSessions || 0) +
      statCard("Avg. session cost", Number(economy.averageSessionCost || 0).toFixed(1)) +
      statCard("Demand gaps", demand.length) +
      '</div>';

    if (budget.length) {
      container.innerHTML += '<div class="mt-3 rounded-xl border border-white/10 bg-black/20 p-3"><p class="mb-2 text-xs font-bold text-slate-400">Budget offers</p>' +
        budget.slice(0, 4).map(function (row) {
          return '<p class="text-xs text-slate-300">' + escapeHtml(row.name) + ' · ' + escapeHtml(row.skill) + ' · ' + escapeHtml(row.rate) + ' coins</p>';
        }).join("") + '</div>';
    }
    if (demand.length) {
      container.innerHTML += '<div class="mt-3 rounded-xl border border-white/10 bg-black/20 p-3"><p class="mb-2 text-xs font-bold text-slate-400">Demand gaps</p>' +
        '<p class="text-xs text-slate-300">' + demand.map(function (row) { return escapeHtml(row.name); }).join(", ") + '</p></div>';
    }
  }

  async function loadAnalyticsSummary() {
    const topMentors = await window.apiRequest("/analytics/top-mentors");
    const trending = await window.apiRequest("/analytics/trending-tags");
    const container = document.getElementById("analytics-summary");
    container.innerHTML =
      statCard("Mentor rankings", topMentors.length) +
      statCard("Trending tags", trending.length) +
      statCard("Top mentor coins", topMentors.length ? topMentors[0].coinsEarned : 0) +
      statCard("Top mentor rating", topMentors.length ? Number(topMentors[0].averageRating || 0).toFixed(1) : "0.0");
  }

  window.loadAnalyticsTab = async function () {
    await Promise.all([
      loadLeaderboard(),
      loadTrendingTags(),
      loadAdminInsights(),
      loadAnalyticsSummary(),
    ]);
  };
})();
