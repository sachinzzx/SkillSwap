(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadSkillsDropdown() {
    const skills = await window.apiRequest("/skills");
    const dropdowns = [
      document.getElementById("add-skill-id"),
      document.getElementById("match-skill"),
      document.getElementById("session-skill"),
    ];
    dropdowns.forEach(function (dropdown) {
      if (!dropdown) return;
      dropdown.querySelectorAll("option:not(:first-child)").forEach(function (option) {
        option.remove();
      });
      skills.forEach(function (skill) {
        const option = document.createElement("option");
        option.value = skill.id;
        option.textContent = skill.name;
        dropdown.appendChild(option);
      });
    });
  }

  function skillCard(item) {
    const name = item.skill ? item.skill.name : "Unknown skill";
    const rate = item.type === "TEACH" ? '<p class="text-xs text-amber-300">' + escapeHtml(item.hourlyCoinRate) + ' coins/hour</p>' : "";
    return [
      '<article class="rounded-xl border border-white/10 bg-black/20 p-4">',
      '<div class="flex items-start justify-between gap-3">',
      '<div><p class="font-bold text-white">' + escapeHtml(name) + '</p>' + rate + '</div>',
      '<button type="button" data-delete-user-skill="' + escapeHtml(item.id) + '" class="text-xs font-bold text-rose-300 hover:text-rose-200">Remove</button>',
      "</div>",
      "</article>",
    ].join("");
  }

  async function loadMySkills() {
    const grouped = await window.apiRequest("/users/me/skills");
    const teaching = grouped.teaching || [];
    const learning = grouped.learning || [];
    document.getElementById("skills-list").innerHTML =
      '<div class="space-y-3"><h3 class="text-xs font-bold uppercase tracking-wider text-emerald-300">Skills I Teach</h3>' +
      (teaching.length ? teaching.map(function (item) {
        item.type = "TEACH";
        return skillCard(item);
      }).join("") : '<p class="text-sm text-slate-500">No teaching skills yet.</p>') +
      "</div>" +
      '<div class="space-y-3"><h3 class="text-xs font-bold uppercase tracking-wider text-indigo-300">Skills I Want to Learn</h3>' +
      (learning.length ? learning.map(function (item) {
        item.type = "LEARN";
        return skillCard(item);
      }).join("") : '<p class="text-sm text-slate-500">No learning skills yet.</p>') +
      "</div>";
  }

  async function loadCoinHistory() {
    const history = await window.apiRequest("/coins/history");
    const container = document.getElementById("coin-ledger");
    if (!history.length) {
      container.innerHTML = '<p class="text-sm text-slate-500">No coin transactions yet.</p>';
      return;
    }
    container.innerHTML = history.map(function (transaction) {
      const credit = transaction.direction === "CREDIT";
      const counterpart = credit
        ? (transaction.sender && transaction.sender.name)
        : (transaction.receiver && transaction.receiver.name);
      return [
        '<article class="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">',
        '<div class="min-w-0"><p class="truncate text-sm font-semibold text-white">' + escapeHtml(transaction.reason || "SkillCoin transfer") + '</p>',
        '<p class="mt-1 text-xs text-slate-500">' + escapeHtml(counterpart || "Unknown user") + '</p></div>',
        '<p class="' + (credit ? "text-emerald-300" : "text-rose-300") + ' text-sm font-black">' +
        (credit ? "+" : "-") + escapeHtml(transaction.amount) + ' ' + (credit ? "CREDIT" : "DEBIT") + '</p>',
        "</article>",
      ].join("");
    }).join("");
  }

  async function loadSkillsTab() {
    await Promise.all([loadSkillsDropdown(), loadMySkills(), loadCoinHistory()]);
  }

  document.getElementById("add-skill-button").addEventListener("click", function () {
    document.getElementById("add-skill-form").classList.toggle("hidden");
  });

  document.getElementById("add-skill-type").addEventListener("change", function (event) {
    document.getElementById("add-skill-rate-wrap").classList.toggle("hidden", event.target.value !== "TEACH");
  });

  document.getElementById("add-skill-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    try {
      const type = document.getElementById("add-skill-type").value;
      await window.apiRequest("/users/skills", {
        method: "POST",
        body: {
          skillId: Number(document.getElementById("add-skill-id").value),
          type,
          hourlyCoinRate: type === "TEACH" ? Number(document.getElementById("add-skill-rate").value) : 0,
        },
      });
      window.showToast("Skill added", "success");
      await loadSkillsTab();
      document.getElementById("add-skill-form").reset();
    } catch (error) {
      window.showToast(error.message, "error");
    }
  });

  document.getElementById("skills-list").addEventListener("click", async function (event) {
    const button = event.target.closest("[data-delete-user-skill]");
    if (!button) return;
    try {
      await window.apiRequest("/users/skills/" + button.dataset.deleteUserSkill, { method: "DELETE" });
      window.showToast("Skill removed", "success");
      await loadSkillsTab();
    } catch (error) {
      window.showToast(error.message, "error");
    }
  });

  window.loadSkillsTab = loadSkillsTab;
})();
