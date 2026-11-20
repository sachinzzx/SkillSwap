(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function avatarInitial(name) {
    return escapeHtml(String(name || "M").trim().charAt(0).toUpperCase());
  }

  function mentorBadge(badge) {
    if (badge === "Grandmaster Mentor") return '<span class="m-chip m-chip--butter">Grandmaster</span>';
    if (badge === "Pro Mentor") return '<span class="m-chip m-chip--lime">Pro</span>';
    return '<span class="m-chip m-chip--mono">Beginner</span>';
  }

  function animateCount(element, newValue, decimal) {
    if (!element) return;
    const oldValue = Number(element.dataset.count || 0);
    const targetValue = Number(newValue || 0);
    const start = performance.now();
    element.dataset.count = String(targetValue);

    function tick(now) {
      const progress = Math.min((now - start) / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = oldValue + (targetValue - oldValue) * eased;
      element.textContent = decimal ? value.toFixed(1) : String(Math.round(value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderLeaderboard(mentors) {
    const container = document.getElementById("leaderboard");
    if (!Array.isArray(mentors) || !mentors.length) {
      container.innerHTML =
        '<div class="m-empty"><strong>No mentors ranked yet</strong><span>Complete sessions to appear here.</span></div>';
      return;
    }

    let podium = "";
    if (mentors.length >= 3) {
      const ordered = [mentors[1], mentors[0], mentors[2]];
      const ranks = [2, 1, 3];
      podium = '<div class="m-podium">' + ordered.map(function (mentor, index) {
        const rank = ranks[index];
        const rating = Number(mentor.averageRating || 0);
        const podiumClass = rank === 1 ? " m-podium__item--1" : (rank === 2 ? " m-podium__item--2" : "");
        return '<div class="m-podium__item' + podiumClass + '">' +
          '<span class="m-avatar" aria-hidden="true">' + avatarInitial(mentor.name) + '</span>' +
          '<strong>' + escapeHtml(mentor.name) + '</strong>' +
          '<span class="m-podium__rank">#' + rank + '</span>' +
          '<span class="m-price">' + escapeHtml(mentor.coinsEarned) + ' <small>SC</small></span>' +
          '<span class="m-chip--mono">' + rating.toFixed(1) + ' rating</span>' +
          '</div>';
      }).join("") + '</div>';
    }

    const rest = mentors.length >= 3 ? mentors.slice(3) : mentors;
    const list = rest.map(function (mentor, index) {
      const rank = mentors.length >= 3 ? index + 4 : index + 1;
      const rating = Number(mentor.averageRating || 0);
      return '<article class="m-teacher">' +
        '<span class="m-avatar" aria-hidden="true">' + avatarInitial(mentor.name) + '</span>' +
        '<div><strong>' + escapeHtml(mentor.name) + '</strong><div>' +
        mentorBadge(mentor.badge) +
        '<span class="m-chip--mono" style="margin-left:8px;">' + rating.toFixed(1) + ' rating</span>' +
        '</div></div>' +
        '<div style="text-align:right;"><span class="m-price">' + escapeHtml(mentor.coinsEarned) + ' <small>SC</small></span>' +
        '<div class="m-chip--mono">#' + rank + '</div></div>' +
        '</article>';
    }).join("");

    container.innerHTML = podium + list;
  }

  async function loadLeaderboard() {
    const mentors = await window.apiRequest("/analytics/top-mentors");
    renderLeaderboard(mentors);
  }

  function renderTrendingTags(tags) {
    const container = document.getElementById("trending-tags");
    if (!Array.isArray(tags) || !tags.length) {
      container.innerHTML =
        '<div class="m-empty"><strong>No trending tags yet</strong><span>Add session notes to light this up.</span></div>';
      return;
    }
    const maxCount = Math.max.apply(null, tags.map(function (tag) { return Number(tag.totalSessions || 0); }));
    container.innerHTML = tags.map(function (tag) {
      const count = Number(tag.totalSessions || 0);
      const width = maxCount ? Math.max(8, Math.round((count / maxCount) * 100)) : 0;
      return '<div class="m-bar"><span>#' + escapeHtml(tag.tag) + '</span>' +
        '<span class="m-bar__track"><span class="m-bar__fill" style="display:block;width:' + width + '%;"></span></span>' +
        '<span>' + escapeHtml(count) + '</span></div>';
    }).join("");
  }

  async function loadTrendingTags() {
    const tags = await window.apiRequest("/analytics/trending-tags");
    renderTrendingTags(tags);
  }

  function statCard(label, value) {
    return '<article class="m-stat"><span class="m-chip--mono">' + escapeHtml(label) + '</span>' +
      '<div class="m-stat__num">' + escapeHtml(value) + '</div></article>';
  }

  function tapeRows(rows, labelKey, valueKey) {
    if (!rows.length) {
      return '<div class="m-empty"><strong>No rows yet</strong><span>Complete activity to populate this SQL insight.</span></div>';
    }
    return '<div class="m-tape">' + rows.slice(0, 5).map(function (row) {
      return '<div class="m-tape__row"><span>•</span><strong>' +
        escapeHtml(row[labelKey]) + '</strong><span class="m-amt">' +
        escapeHtml(row[valueKey]) + '</span></div>';
    }).join("") + '</div>';
  }

  async function loadAdminInsights() {
    const section = document.getElementById("admin-insights-section");
    const badge = document.getElementById("admin-insights-badge");
    const container = document.getElementById("admin-insights");
    if (!window.state.currentUser || window.state.currentUser.role !== "ADMIN") {
      section.classList.add("hidden");
      badge.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    badge.classList.remove("hidden");
    const results = await Promise.all([
      window.apiRequest("/analytics/budget-teachers"),
      window.apiRequest("/analytics/popular-categories"),
      window.apiRequest("/analytics/economy"),
      window.apiRequest("/analytics/demand-gap"),
    ]);
    const budget = Array.isArray(results[0]) ? results[0] : [];
    const categories = Array.isArray(results[1]) ? results[1] : [];
    const economyRows = Array.isArray(results[2]) ? results[2] : [];
    const demand = Array.isArray(results[3]) ? results[3] : [];
    const economy = economyRows[0] || {};

    const budgetRows = budget.map(function (row) {
      return { name: row.name + " · " + row.skill, rate: row.rate };
    });
    const categoryRows = categories.map(function (row) {
      return { name: row.name, skillCount: row.skillCount };
    });

    container.innerHTML =
      '<div class="m-stack">' +
      statCard("Coins in circulation", economy.totalCoinsInCirculation || 0) +
      '<span class="m-chip m-chip--mono">SUM / COUNT / AVG</span>' +
      '</div>' +
      '<div class="m-stack">' +
      '<span class="m-chip m-chip--mono">Correlated subquery</span>' +
      (budgetRows.length
        ? tapeRows(budgetRows, "name", "rate")
        : '<div class="m-empty"><strong>No budget teachers</strong><span>Complete more teaching offers.</span></div>') +
      '</div>' +
      '<div class="m-stack">' +
      '<span class="m-chip m-chip--mono">GROUP BY / HAVING</span>' +
      (categoryRows.length
        ? tapeRows(categoryRows, "name", "skillCount")
        : '<div class="m-empty"><strong>No popular categories</strong><span>Add skills to existing categories.</span></div>') +
      '</div>' +
      '<div class="m-stack">' +
      '<span class="m-chip m-chip--mono">SUM / COUNT / AVG</span>' +
      statCard("Completed sessions", economy.completedSessions || 0) +
      statCard("Avg. session cost", Number(economy.averageSessionCost || 0).toFixed(1)) +
      '</div>' +
      '<div class="m-stack">' +
      '<span class="m-chip m-chip--mono">IN / NOT IN</span>' +
      (demand.length
        ? '<div class="m-chips">' + demand.map(function (row) {
            return '<span class="m-chip m-chip--coral">' + escapeHtml(row.name) + '</span>';
          }).join("") + '</div>'
        : '<div class="m-empty"><strong>No demand gaps</strong><span>Supply currently covers learning demand.</span></div>') +
      '</div>';
  }

  function renderStars(element, rating) {
    const oldValue = Number(element.dataset.count || 0);
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = oldValue + (rating - oldValue) * eased;
      const rounded = Math.max(0, Math.min(5, Math.round(value)));
      let stars = '<span class="m-stars" aria-label="' + value.toFixed(1) + ' rating">';
      for (let index = 1; index <= 5; index++) {
        stars += '<button type="button" tabindex="-1" class="' + (index <= rounded ? "is-on" : "") + '" aria-hidden="true">★</button>';
      }
      stars += '</span>';
      stars += '<span style="margin-left:8px;font:800 18px var(--m-mono);">' + value.toFixed(1) + '</span>';
      element.innerHTML = stars;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  async function loadAnalyticsSummary(topMentors, trending) {
    const top = Array.isArray(topMentors) ? topMentors : [];
    const tags = Array.isArray(trending) ? trending : [];
    const statElements = document.querySelectorAll("#analytics-summary .m-stat__num");
    animateCount(statElements[0], top.length, false);
    animateCount(statElements[1], tags.length, false);
    animateCount(statElements[2], top.length ? top[0].coinsEarned : 0, false);
    const rating = top.length ? Number(top[0].averageRating || 0) : 0;
    statElements[3].dataset.count = String(rating);
    statElements[3].innerHTML = "";
    renderStars(statElements[3], rating);
  }

  window.loadAnalyticsTab = async function () {
    const [topMentors, trending] = await Promise.all([
      window.apiRequest("/analytics/top-mentors"),
      window.apiRequest("/analytics/trending-tags"),
    ]);
    renderLeaderboard(topMentors);
    renderTrendingTags(trending);
    await loadAnalyticsSummary(topMentors, trending);
    await loadAdminInsights();
  };
})();
