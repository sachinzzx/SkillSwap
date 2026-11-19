(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function searchTeachers() {
    const skillId = document.getElementById("match-skill").value;
    const maxRate = document.getElementById("match-max-rate").value;
    if (!skillId) {
      window.showToast("Select a skill first", "error");
      return;
    }
    const params = new URLSearchParams({ skillId });
    if (maxRate !== "") params.set("maxRate", maxRate);
    const teachers = await window.apiRequest("/match/teachers?" + params.toString());
    renderMatches(teachers);
  }

  function renderMatches(teachers) {
    const container = document.getElementById("match-results");
    if (!teachers.length) {
      container.innerHTML = '<div class="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500 sm:col-span-2">No teachers found.</div>';
      return;
    }
    container.innerHTML = teachers.map(function (teacher) {
      return [
        '<article class="rounded-xl border border-white/10 bg-black/20 p-4">',
        '<p class="font-bold text-white">' + escapeHtml(teacher.user.name) + '</p>',
        '<p class="mt-1 text-sm text-slate-400">' + escapeHtml(teacher.skill.name) + '</p>',
        '<p class="mt-2 text-sm font-bold text-amber-300">' + escapeHtml(teacher.hourlyCoinRate) + ' coins/hour</p>',
        '<button type="button" data-book-teacher="' + escapeHtml(teacher.user.id) + '" data-book-skill="' + escapeHtml(teacher.skillId) + '" class="mt-4 w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-400">Book</button>',
        "</article>",
      ].join("");
    }).join("");
  }

  async function findBarterMatches() {
    const matches = await window.apiRequest("/match/direct-swap");
    const container = document.getElementById("match-results");
    if (!matches.length) {
      container.innerHTML = '<div class="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500 sm:col-span-2">No direct barter matches found.</div>';
      return;
    }
    container.innerHTML = matches.map(function (match) {
      return [
        '<article class="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">',
        '<p class="font-bold text-white">' + escapeHtml(match.partnerName) + '</p>',
        '<p class="mt-2 text-sm text-slate-300">You teach <span class="font-bold text-emerald-300">' + escapeHtml(match.iTeach) + '</span> ↔ They teach <span class="font-bold text-indigo-300">' + escapeHtml(match.iLearn) + '</span></p>',
        '<button type="button" data-barter-partner="' + escapeHtml(match.partnerId) + '" data-barter-skill="' + escapeHtml(match.iLearn) + '" class="mt-4 w-full rounded-lg border border-emerald-400/30 px-3 py-2 text-sm font-bold text-emerald-300">Start swap</button>',
        "</article>",
      ].join("");
    }).join("");
  }

  document.getElementById("match-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    try {
      await searchTeachers();
    } catch (error) {
      window.showToast(error.message, "error");
    }
  });

  document.getElementById("find-barter-button").addEventListener("click", async function () {
    try {
      await findBarterMatches();
    } catch (error) {
      window.showToast(error.message, "error");
    }
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
      '<div class="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500 sm:col-span-2">Select a skill and search for teachers.</div>';
  };
  window.findBarterMatches = findBarterMatches;
})();
