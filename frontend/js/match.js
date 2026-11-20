(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function avatarInitial(name) {
    return escapeHtml(String(name || "U").trim().charAt(0).toUpperCase());
  }

  function renderLoading() {
    document.getElementById("match-results").innerHTML =
      '<div class="m-skel"></div><div class="m-skel"></div><div class="m-skel"></div>';
  }

  async function searchTeachers() {
    const skillId = document.getElementById("match-skill").value;
    const maxRate = document.getElementById("match-max-rate").value;
    if (!skillId) {
      window.showToast("Select a skill first", "error");
      return;
    }
    renderLoading();
    const submitButton = document.querySelector("#match-form button[type=\"submit\"]");
    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
    try {
      const params = new URLSearchParams({ skillId });
      if (maxRate !== "") params.set("maxRate", maxRate);
      const teachers = await window.apiRequest("/match/teachers?" + params.toString());
      renderMatches(teachers);
    } catch (error) {
      window.showToast(error.message || "Could not load teachers", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
    }
  }

  function renderMatches(teachers) {
    const container = document.getElementById("match-results");
    if (!Array.isArray(teachers) || !teachers.length) {
      container.innerHTML =
        '<div class="m-empty"><span class="m-empty__icon">◎</span>' +
        '<strong>No teachers found</strong><span>Try another skill or increase the maximum hourly rate.</span></div>';
      return;
    }

    container.innerHTML = teachers.map(function (teacher) {
      const name = teacher.user ? teacher.user.name : "Unknown teacher";
      const level = teacher.skill && teacher.skill.level ? teacher.skill.level : "";
      const rating = Number(teacher.averageRating != null
        ? teacher.averageRating
        : (teacher.user && teacher.user.averageRating != null
          ? teacher.user.averageRating
          : 0));
      const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));
      let stars = "";
      if (rating > 0) {
        stars = '<span class="m-stars" aria-label="' + escapeHtml(rating.toFixed ? rating.toFixed(1) : rating) + ' stars">';
        for (let index = 1; index <= 5; index++) {
          stars += '<button type="button" tabindex="-1" class="' + (index <= roundedRating ? "is-on" : "") + '" aria-hidden="true">★</button>';
        }
        stars += '</span>';
      }

      return [
        '<article class="m-teacher">',
        '<span class="m-avatar" aria-hidden="true">' + avatarInitial(name) + '</span>',
        '<div>',
        '<strong>' + escapeHtml(name) + '</strong>',
        (level ? ' <span class="m-chip m-chip--mono">' + escapeHtml(level) + '</span>' : ""),
        (stars ? '<div>' + stars + '</div>' : ""),
        '</div>',
        '<div style="text-align:right;">',
        '<p class="m-price">' + escapeHtml(teacher.hourlyCoinRate) + ' <small>sc/hr</small></p>',
        '<button type="button" data-book-teacher="' + escapeHtml(teacher.user.id) +
        '" data-book-skill="' + escapeHtml(teacher.skillId) +
        '" class="m-btn m-btn--sm" style="margin-top:8px;">Prefill booking</button>',
        '</div>',
        '</article>',
      ].join("");
    }).join("");
  }

  async function findBarterMatches() {
    renderLoading();
    const directButton = document.getElementById("find-barter-button");
    directButton.disabled = true;
    directButton.classList.add("is-loading");
    try {
      const matches = await window.apiRequest("/match/direct-swap");
      const container = document.getElementById("match-results");
      if (!Array.isArray(matches) || !matches.length) {
        container.innerHTML =
          '<div class="m-empty"><span class="m-empty__icon">↔</span>' +
          '<strong>No exact swaps yet</strong>' +
          '<span>Add more teach and learn skills, or browse teachers instead.</span></div>';
        return;
      }
      container.innerHTML = matches.map(function (match) {
        const partnerName = match.partnerName || "Swap partner";
        const taughtSkill = match.iTeach || "Skill";
        const learnedSkill = match.iLearn || "Skill";
        return [
          '<article class="m-match">',
          '<div class="m-match__body">',
          '<div class="m-match__side">',
          '<span class="m-avatar" aria-hidden="true">' + avatarInitial(partnerName) + '</span>',
          '<strong>' + escapeHtml(partnerName) + '</strong>',
          '<span class="m-chip m-chip--lime">You teach: ' + escapeHtml(taughtSkill) + '</span>',
          '</div>',
          '<span class="m-match__link" aria-hidden="true">↔</span>',
          '<div class="m-match__side m-match__side--right">',
          '<span class="m-avatar" aria-hidden="true">' + avatarInitial(partnerName) + '</span>',
          '<span class="m-chip m-chip--blue">You learn: ' + escapeHtml(learnedSkill) + '</span>',
          '</div>',
          '</div>',
          '<div class="m-match__foot">',
          '<strong>0 coins</strong>',
          '<button type="button" data-barter-partner="' + escapeHtml(match.partnerId) +
          '" data-barter-skill="' + escapeHtml(learnedSkill) +
          '" class="m-btn m-btn--lime m-btn--sm">Prefill booking</button>',
          '</div>',
          '</article>',
        ].join("");
      }).join("");
    } catch (error) {
      window.showToast(error.message || "Could not load direct swaps", "error");
    } finally {
      directButton.disabled = false;
      directButton.classList.remove("is-loading");
    }
  }

  document.getElementById("match-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    await searchTeachers();
  });

  document.getElementById("find-barter-button").addEventListener("click", async function () {
    await findBarterMatches();
  });

  document.getElementById("match-results").addEventListener("click", function (event) {
    const teacherButton = event.target.closest("[data-book-teacher]");
    const barterButton = event.target.closest("[data-barter-partner]");
    if (teacherButton) {
      document.getElementById("session-teacher-id").value = teacherButton.dataset.bookTeacher;
      document.getElementById("session-skill").value = teacherButton.dataset.bookSkill;
      if (typeof window.switchDashboardTab === "function") window.switchDashboardTab("sessions");
      document.getElementById("session-scheduled-at").focus();
      window.showToast("Teacher and skill pre-filled", "info");
    }
    if (barterButton) {
      const skillSelect = document.getElementById("session-skill");
      const skillName = barterButton.dataset.barterSkill;
      const skillOption = Array.from(skillSelect.options).find(function (option) {
        return option.textContent === skillName;
      });
      document.getElementById("session-teacher-id").value = barterButton.dataset.barterPartner;
      if (skillOption) skillSelect.value = skillOption.value;
      if (typeof window.switchDashboardTab === "function") window.switchDashboardTab("sessions");
      document.getElementById("session-scheduled-at").focus();
      window.showToast("Barter partner pre-filled", "info");
    }
  });

  window.loadMatchTab = async function () {
    document.getElementById("match-results").innerHTML =
      '<div class="m-empty"><span class="m-empty__icon">↔</span>' +
      '<strong>Choose how to find a match</strong><span>Find direct swaps or browse teachers by skill and rate.</span></div>';
  };
  window.findBarterMatches = findBarterMatches;
})();
