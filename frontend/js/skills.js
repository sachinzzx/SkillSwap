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
      dropdown.querySelectorAll("optgroup").forEach(function (optgroup) {
        optgroup.remove();
      });
      dropdown.querySelectorAll("option:not(:first-child)").forEach(function (option) {
        option.remove();
      });
      if (dropdown.id === "add-skill-id") {
        const groups = new Map();
        skills.forEach(function (skill) {
          const category = skill.category
            ? (typeof skill.category === "string" ? skill.category : skill.category.name)
            : "Other";
          if (!groups.has(category)) groups.set(category, []);
          groups.get(category).push(skill);
        });
        groups.forEach(function (groupSkills, category) {
          const optgroup = document.createElement("optgroup");
          optgroup.label = category || "Other";
          groupSkills.forEach(function (skill) {
            const option = document.createElement("option");
            option.value = skill.id;
            option.textContent = skill.name;
            optgroup.appendChild(option);
          });
          dropdown.appendChild(optgroup);
        });
      } else {
        skills.forEach(function (skill) {
          const option = document.createElement("option");
          option.value = skill.id;
          option.textContent = skill.name;
          dropdown.appendChild(option);
        });
      }
    });
  }

  function skillCard(item) {
    const name = item.skill ? item.skill.name : "Unknown skill";
    if (item.type === "TEACH") {
      return '<span class="m-chip m-chip--lime">' +
        escapeHtml(name) +
        '<span class="m-chip--mono">' + escapeHtml(item.hourlyCoinRate) + ' sc/hr</span>' +
        '<button type="button" class="m-chip__x" data-delete-user-skill="' + escapeHtml(item.id) +
        '" aria-label="Remove ' + escapeHtml(name) + '">x</button></span>';
    }
    return '<span class="m-chip m-chip--blue">' +
      escapeHtml(name) +
      '<button type="button" class="m-chip__x" data-delete-user-skill="' + escapeHtml(item.id) +
      '" aria-label="Remove ' + escapeHtml(name) + '">x</button></span>';
  }

  async function loadMySkills() {
    const grouped = await window.apiRequest("/users/me/skills");
    const teaching = grouped.teaching || [];
    const learning = grouped.learning || [];
    document.getElementById("skills-list").innerHTML = teaching.length
      ? '<div class="m-chips">' + teaching.map(function (item) {
          item.type = "TEACH";
          return skillCard(item);
        }).join("") + "</div>"
      : '<div class="m-empty"><span class="m-empty__icon">+</span><strong>Nothing taught yet</strong><span>Add a skill you can teach and earn SkillCoins</span></div>';
    document.getElementById("learning-skills-list").innerHTML = learning.length
      ? '<div class="m-chips">' + learning.map(function (item) {
          item.type = "LEARN";
          return skillCard(item);
        }).join("") + "</div>"
      : '<div class="m-empty"><span class="m-empty__icon">?</span><strong>Nothing on your wishlist</strong><span>Add what you want to learn</span></div>';
  }

  async function loadCoinHistory() {
    const history = await window.apiRequest("/coins/history");
    const container = document.getElementById("coin-ledger");
    if (!Array.isArray(history) || !history.length) {
      container.innerHTML = '<div class="m-empty"><span class="m-empty__icon">0</span><strong>No coin transactions yet</strong><span>Complete a session to see coins move</span></div>';
      return;
    }
    container.innerHTML = history.map(function (transaction) {
      const credit = String(transaction.direction).toUpperCase() === "CREDIT";
      const skillName = transaction.skill && transaction.skill.name
        ? transaction.skill.name
        : (transaction.session && transaction.session.skill && transaction.session.skill.name);
      const counterpart = credit
        ? (transaction.sender && transaction.sender.name)
        : (transaction.receiver && transaction.receiver.name);
      const title = skillName
        ? "Session: " + skillName
        : (counterpart || transaction.reason || "SkillCoin transfer");
      const date = transaction.createdAt
        ? new Date(transaction.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : "";
      return [
        '<div class="m-tape__row">',
        '<span aria-hidden="true">' + (credit ? "↓" : "↑") + '</span>',
        '<div><strong>' + escapeHtml(title) + '</strong><span class="m-tape__meta">' + escapeHtml(date) + '</span></div>',
        '<span class="m-amt ' + (credit ? "m-amt--plus" : "m-amt--minus") + '">' +
        (credit ? "+" : "-") + escapeHtml(transaction.amount) + '</span>',
        "</div>",
      ].join("");
    }).join("");
  }

  function animateCoinBalance(newValue) {
    const balanceElement = document.getElementById("coin-balance");
    if (!balanceElement) return;
    balanceElement.classList.remove("m-skel");
    const oldValue = Number(balanceElement.dataset.coins || 0);
    const targetValue = Number(newValue || 0);
    const start = performance.now();
    balanceElement.dataset.coins = String(targetValue);
    function tick(now) {
      const progress = Math.min((now - start) / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      balanceElement.textContent = String(Math.round(oldValue + (targetValue - oldValue) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  async function loadCoinBalance() {
    const balance = await window.apiRequest("/coins/balance");
    animateCoinBalance(balance.coins);
  }

  async function loadSkillsTab() {
    document.getElementById("skills-list").innerHTML = '<div class="m-skel"></div>';
    document.getElementById("learning-skills-list").innerHTML = '<div class="m-skel"></div>';
    const balanceElement = document.getElementById("coin-balance");
    balanceElement.textContent = "...";
    balanceElement.classList.add("m-skel");
    document.getElementById("coin-ledger").innerHTML =
      '<div class="m-skel"></div><div class="m-skel"></div><div class="m-skel"></div>';
    await Promise.all([loadSkillsDropdown(), loadMySkills(), loadCoinHistory(), loadCoinBalance()]);
  }

  function setAddSkillType(type) {
    document.getElementById("add-skill-type").value = type;
    document.querySelectorAll("[data-skill-type]").forEach(function (button) {
      const selected = button.dataset.skillType === type;
      button.classList.toggle("m-btn--lime", selected);
      button.classList.toggle("m-btn--ghost", !selected);
    });
    document.getElementById("add-skill-rate-wrap").classList.toggle("hidden", type !== "TEACH");
  }

  document.getElementById("add-skill-button").addEventListener("click", function () {
    setAddSkillType("TEACH");
    document.getElementById("add-skill-dialog").showModal();
  });

  document.getElementById("add-skill-dialog-close").addEventListener("click", function () {
    document.getElementById("add-skill-dialog").close();
  });

  document.querySelectorAll("[data-skill-type]").forEach(function (button) {
    button.addEventListener("click", function () {
      setAddSkillType(button.dataset.skillType);
    });
  });

  document.getElementById("add-skill-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitButton = document.getElementById("add-skill-submit");
    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
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
      document.getElementById("add-skill-form").reset();
      setAddSkillType("TEACH");
      document.getElementById("add-skill-dialog").close();
      await loadSkillsTab();
    } catch (error) {
      window.showToast(error.message, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
    }
  });

  document.getElementById("skills-list").addEventListener("click", async function (event) {
    const button = event.target.closest("[data-delete-user-skill]");
    if (!button) return;
    button.disabled = true;
    button.classList.add("is-loading");
    try {
      await window.apiRequest("/users/skills/" + button.dataset.deleteUserSkill, { method: "DELETE" });
      window.showToast("Skill removed", "success");
      await loadSkillsTab();
    } catch (error) {
      window.showToast(error.message, "error");
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  });

  document.getElementById("learning-skills-list").addEventListener("click", async function (event) {
    const button = event.target.closest("[data-delete-user-skill]");
    if (!button) return;
    button.disabled = true;
    button.classList.add("is-loading");
    try {
      await window.apiRequest("/users/skills/" + button.dataset.deleteUserSkill, { method: "DELETE" });
      window.showToast("Skill removed", "success");
      await loadSkillsTab();
    } catch (error) {
      window.showToast(error.message, "error");
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  });

  window.loadSkillsTab = loadSkillsTab;
})();
