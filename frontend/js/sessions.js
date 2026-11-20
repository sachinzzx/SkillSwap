(function () {
  let currentBalance = 0;
  let currentRate = 0;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusClass(status) {
    if (status === "COMPLETED") return "m-chip--lime";
    if (status === "CANCELLED") return "m-chip--coral";
    return "m-chip--butter";
  }

  async function refreshCoinBalance() {
    const balance = await window.apiRequest("/coins/balance");
    currentBalance = Number(balance.coins || 0);
    const coinElement = document.getElementById("skillcoin-wallet");
    document.getElementById("nav-coins").textContent = currentBalance;
    if (coinElement) {
      coinElement.classList.remove("coin-pulse");
      void coinElement.offsetWidth;
      coinElement.classList.add("coin-pulse");
    }
    updateBookingPreview();
  }

  async function downloadReceipt(sessionId) {
    const response = await fetch(window.API_BASE + "/sessions/" + sessionId + "/receipt", {
      headers: { Authorization: "Bearer " + window.state.accessToken },
    });
    if (!response.ok) {
      let message = "Could not download receipt";
      try {
        message = (await response.json()).message || message;
      } catch (_error) {}
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SkillSwap-session-" + sessionId + "-receipt.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function setReviewRating(rating) {
    document.getElementById("review-rating").value = String(rating);
    document.querySelectorAll("[data-rating]").forEach(function (button) {
      button.classList.toggle("is-on", Number(button.dataset.rating) <= rating);
    });
  }

  async function reviewSession(sessionId) {
    document.getElementById("review-session-id").value = String(sessionId);
    setReviewRating(5);
    document.getElementById("review-comment").value = "";
    document.getElementById("review-session-dialog").showModal();
  }

  function updateBookingPreview() {
    const teacherId = Number(document.getElementById("session-teacher-id").value);
    const duration = Number(document.getElementById("session-duration").value || 0);
    const preview = document.getElementById("session-cost-preview");
    const warning = document.getElementById("session-balance-warning");
    const submitButton = document.getElementById("session-book-submit");

    if (!teacherId) {
      currentRate = 0;
      preview.innerHTML =
        '<div class="m-empty"><strong>Pick a teacher in the Match tab first</strong></div>';
      warning.classList.add("hidden");
      submitButton.disabled = true;
      submitButton.classList.remove("is-loading");
      return;
    }

    if (!currentRate) {
      preview.innerHTML =
        '<div class="m-empty"><strong>Checking the teacher rate...</strong></div>';
      submitButton.disabled = true;
      return;
    }

    const cost = Math.ceil((currentRate * duration) / 60);
    preview.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;font:700 13px var(--m-mono);">' +
      '<span>Rate: ' + escapeHtml(currentRate) + ' sc/hr</span><span>Duration: ' + escapeHtml(duration) + ' min</span>' +
      '</div><div class="m-divider"></div><strong>Cost: ' + escapeHtml(cost) + ' sc</strong>';

    if (cost > currentBalance) {
      warning.textContent = "Not enough coins (you have " + currentBalance + ")";
      warning.classList.remove("hidden");
      submitButton.disabled = true;
    } else {
      warning.classList.add("hidden");
      submitButton.disabled = false;
    }
  }

  async function loadBookingRate() {
    const teacherId = Number(document.getElementById("session-teacher-id").value);
    const skillId = Number(document.getElementById("session-skill").value);
    currentRate = 0;
    if (!teacherId || !skillId) {
      updateBookingPreview();
      return;
    }
    try {
      const params = new URLSearchParams({ skillId: String(skillId) });
      const teachers = await window.apiRequest("/match/teachers?" + params.toString());
      const match = teachers.find(function (teacher) {
        return Number(teacher.user.id) === teacherId;
      });
      currentRate = match ? Number(match.hourlyCoinRate || 0) : 0;
    } catch (_error) {
      currentRate = 0;
    }
    updateBookingPreview();
  }

  async function loadSessions() {
    const list = document.getElementById("sessions-list");
    list.innerHTML =
      '<div class="m-skel"></div><div class="m-skel"></div><div class="m-skel"></div>';

    const results = await Promise.all([
      window.apiRequest("/sessions/my"),
      window.apiRequest("/coins/balance"),
    ]);
    const sessions = results[0];
    currentBalance = Number(results[1].coins || 0);
    document.getElementById("nav-coins").textContent = currentBalance;
    document.getElementById("session-count").textContent =
      sessions.length + (sessions.length === 1 ? " session" : " sessions");

    if (!sessions.length) {
      list.innerHTML =
        '<div class="m-empty"><span class="m-empty__icon">◎</span>' +
        '<strong>No sessions yet</strong>' +
        '<span>Find a teacher in Match &amp; Swap and book your first session</span>' +
        '<button data-go-match class="m-btn m-btn--lime" type="button" style="margin:16px auto 0;">' +
        'Go to Match &amp; Swap</button></div>';
      updateBookingPreview();
      const matchButton = list.querySelector("[data-go-match]");
      if (matchButton) {
        matchButton.addEventListener("click", function () {
          if (typeof window.switchDashboardTab === "function") window.switchDashboardTab("match");
        });
      }
      loadBookingRate();
      return;
    }

    const currentUserId = window.state.currentUser ? window.state.currentUser.id : null;
    list.innerHTML = sessions.map(function (session) {
      const role = session.learnerId === currentUserId ? "LEARNING" : "TEACHING";
      const person = role === "LEARNING" ? session.teacher : session.learner;
      const status = session.status || "BOOKED";
      let statusSteps = "";

      if (status === "COMPLETED") {
        statusSteps =
          '<div class="m-steps"><span class="m-steps__dot is-on"></span><span class="m-steps__dot is-on"></span></div>';
      } else if (status === "CANCELLED") {
        statusSteps =
          '<div class="m-steps"><span class="m-steps__dot is-on"></span><span class="m-steps__dot is-off"></span></div>';
      } else {
        statusSteps =
          '<div class="m-steps"><span class="m-steps__dot is-on"></span><span class="m-steps__dot"></span></div>';
      }

      let actions = "";
      if (status === "BOOKED") {
        if (session.teacherId === currentUserId) {
          actions +=
            '<button type="button" data-complete-session="' + session.id + '" class="m-btn m-btn--lime">Complete</button>';
        }
        actions +=
          '<button type="button" data-cancel-session="' + session.id + '" class="m-btn m-btn--danger">Cancel</button>';
      }
      actions +=
        '<button type="button" data-receipt-session="' + session.id + '" class="m-btn m-btn--ghost">Receipt PDF</button>';
      if (status === "COMPLETED" && session.learnerId === currentUserId) {
        actions +=
          '<button type="button" data-review-session="' + session.id + '" data-reviewed-id="' + session.teacherId +
          '" class="m-btn m-btn--primary">Review</button>';
      }

      return [
        '<article class="m-ticket" data-session-ticket="' + session.id + '">',
        '<div>',
        '<h3 class="m-ticket__title">' + escapeHtml(session.skill ? session.skill.name : "Unknown skill") + '</h3>',
        '<p class="m-ticket__meta">' +
        escapeHtml(new Date(session.scheduledAt).toLocaleString()) + ' · ' +
        escapeHtml(session.duration) + ' min · with ' +
        escapeHtml(person ? person.name : "Unknown") + '</p>',
        '<p style="margin-top:10px;"><span class="m-sticker">' + role + '</span></p>',
        '<p class="m-price" style="margin-top:12px;">' + escapeHtml(session.coinsCost) + ' <small>SC</small></p>',
        '</div>',
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;">',
        '<span class="m-chip ' + statusClass(status) + '">' + escapeHtml(status) + '</span>',
        statusSteps,
        '</div>',
        '<div class="m-ticket__actions">' + actions + '</div>',
        '</article>',
      ].join("");
    }).join("");

    updateBookingPreview();
    loadBookingRate();
  }

  document.querySelectorAll("[data-duration]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.getElementById("session-duration").value = button.dataset.duration;
      updateBookingPreview();
    });
  });

  document.getElementById("session-duration").addEventListener("input", updateBookingPreview);
  document.getElementById("session-skill").addEventListener("change", loadBookingRate);
  document.getElementById("session-scheduled-at").addEventListener("focus", function () {
    loadBookingRate();
  });

  document.getElementById("session-book-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitButton = document.getElementById("session-book-submit");
    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
    try {
      await window.apiRequest("/sessions", {
        method: "POST",
        body: {
          teacherId: Number(document.getElementById("session-teacher-id").value),
          skillId: Number(document.getElementById("session-skill").value),
          scheduledAt: document.getElementById("session-scheduled-at").value,
          duration: Number(document.getElementById("session-duration").value),
        },
      });
      window.showToast("Session booked", "success");
      document.getElementById("session-book-form").reset();
      document.getElementById("session-duration").value = "60";
      currentRate = 0;
      await refreshCoinBalance();
      await loadSessions();
      updateBookingPreview();
    } catch (error) {
      window.showToast(error.message, "error");
    } finally {
      submitButton.classList.remove("is-loading");
      updateBookingPreview();
    }
  });

  document.getElementById("sessions-list").addEventListener("click", async function (event) {
    const completeButton = event.target.closest("[data-complete-session]");
    const cancelButton = event.target.closest("[data-cancel-session]");
    const receiptButton = event.target.closest("[data-receipt-session]");
    const reviewButton = event.target.closest("[data-review-session]");

    if (completeButton) {
      completeButton.disabled = true;
      completeButton.classList.add("is-loading");
      try {
        await window.apiRequest("/sessions/" + completeButton.dataset.completeSession + "/complete", { method: "PATCH" });
        window.showToast("Session completed and coins transferred", "success");
        const ticket = completeButton.closest("[data-session-ticket]");
        if (ticket) {
          ticket.classList.add("is-complete-burst");
          await new Promise(function (resolve) { window.setTimeout(resolve, 600); });
          ticket.classList.remove("is-complete-burst");
        }
        await refreshCoinBalance();
        await loadSessions();
      } catch (error) {
        completeButton.disabled = false;
        completeButton.classList.remove("is-loading");
        window.showToast(error.message, "error");
      }
    } else if (cancelButton) {
      cancelButton.disabled = true;
      cancelButton.classList.add("is-loading");
      try {
        await window.apiRequest("/sessions/" + cancelButton.dataset.cancelSession + "/cancel", { method: "PATCH" });
        window.showToast("Session cancelled", "success");
        await loadSessions();
      } catch (error) {
        cancelButton.disabled = false;
        cancelButton.classList.remove("is-loading");
        window.showToast(error.message, "error");
      }
    } else if (receiptButton) {
      receiptButton.disabled = true;
      receiptButton.classList.add("is-loading");
      try {
        await downloadReceipt(receiptButton.dataset.receiptSession);
        window.showToast("Receipt downloaded", "success");
      } catch (error) {
        window.showToast(error.message, "error");
      } finally {
        receiptButton.disabled = false;
        receiptButton.classList.remove("is-loading");
      }
    } else if (reviewButton) {
      await reviewSession(reviewButton.dataset.reviewSession);
    }
  });

  document.querySelectorAll("[data-rating]").forEach(function (button) {
    button.addEventListener("click", function () {
      setReviewRating(Number(button.dataset.rating));
    });
  });

  document.getElementById("review-session-close").addEventListener("click", function () {
    document.getElementById("review-session-dialog").close();
  });

  document.getElementById("review-session-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitButton = document.getElementById("review-session-submit");
    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
    try {
      await window.apiRequest("/reviews", {
        method: "POST",
        body: {
          sessionId: Number(document.getElementById("review-session-id").value),
          rating: Number(document.getElementById("review-rating").value),
          comment: document.getElementById("review-comment").value,
        },
      });
      window.showToast("Review submitted", "success");
      document.getElementById("review-session-dialog").close();
    } catch (error) {
      window.showToast(error.message, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
    }
  });

  window.loadSessionsTab = loadSessions;
  window.refreshCoinBalance = refreshCoinBalance;
})();
