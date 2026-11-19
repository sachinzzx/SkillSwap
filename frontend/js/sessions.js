(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusClass(status) {
    if (status === "COMPLETED") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    if (status === "CANCELLED") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  async function loadSessions() {
    const sessions = await window.apiRequest("/sessions/my");
    document.getElementById("session-count").textContent = sessions.length + (sessions.length === 1 ? " session" : " sessions");
    if (!sessions.length) {
      document.getElementById("sessions-list").innerHTML = '<div class="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No sessions yet.</div>';
      return;
    }
    const currentUserId = window.state.currentUser ? window.state.currentUser.id : null;
    document.getElementById("sessions-list").innerHTML = sessions.map(function (session) {
      const role = session.learnerId === currentUserId ? "Learning" : "Teaching";
      const person = role === "Learning" ? session.teacher : session.learner;
      let actions = "";
      if (session.status === "BOOKED") {
        if (session.teacherId === currentUserId) {
          actions += '<button type="button" data-complete-session="' + session.id + '" class="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">✅ Complete &amp; Transfer Coins</button>';
        }
        actions += '<button type="button" data-cancel-session="' + session.id + '" class="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300">❌ Cancel</button>';
      }
      actions += '<button type="button" data-receipt-session="' + session.id + '" class="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">📄 Receipt</button>';
      if (session.status === "COMPLETED" && session.learnerId === currentUserId) {
        actions += '<button type="button" data-review-session="' + session.id + '" data-reviewed-id="' + session.teacherId + '" class="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300">⭐ Review</button>';
      }
      return [
        '<article class="rounded-xl border border-white/10 bg-black/20 p-4">',
        '<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">',
        '<div><div class="flex items-center gap-2"><p class="font-bold text-white">' + escapeHtml(session.skill.name) + '</p>',
        '<span class="rounded-full border px-2 py-1 text-[10px] font-bold ' + statusClass(session.status) + '">' + escapeHtml(session.status) + '</span></div>',
        '<p class="mt-2 text-sm text-slate-400">' + role + ' with ' + escapeHtml(person ? person.name : "Unknown") + '</p>',
        '<p class="mt-1 text-xs text-slate-500">' + escapeHtml(new Date(session.scheduledAt).toLocaleString()) + ' · ' + escapeHtml(session.duration) + ' min · ' + escapeHtml(session.coinsCost) + ' coins</p></div>',
        '<div class="flex flex-wrap gap-2">' + actions + '</div>',
        '</div></article>',
      ].join("");
    }).join("");
  }

  async function refreshCoinBalance() {
    const balance = await window.apiRequest("/coins/balance");
    const coinElement = document.getElementById("skillcoin-wallet");
    document.getElementById("nav-coins").textContent = balance.coins;
    coinElement.classList.remove("coin-pulse");
    void coinElement.offsetWidth;
    coinElement.classList.add("coin-pulse");
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

  async function reviewSession(sessionId) {
    const rating = window.prompt("Rating (1-5):");
    if (!rating) return;
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      window.showToast("Rating must be between 1 and 5", "error");
      return;
    }
    const comment = window.prompt("Review comment (optional):") || "";
    await window.apiRequest("/reviews", {
      method: "POST",
      body: { sessionId: Number(sessionId), rating: parsedRating, comment },
    });
  }

  document.getElementById("session-book-form").addEventListener("submit", async function (event) {
    event.preventDefault();
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
      await window.updateCoinBalance();
      await loadSessions();
    } catch (error) {
      window.showToast(error.message, "error");
    }
  });

  document.getElementById("sessions-list").addEventListener("click", async function (event) {
    const completeButton = event.target.closest("[data-complete-session]");
    const cancelButton = event.target.closest("[data-cancel-session]");
    const receiptButton = event.target.closest("[data-receipt-session]");
    const reviewButton = event.target.closest("[data-review-session]");
    try {
      if (completeButton) {
        await window.apiRequest("/sessions/" + completeButton.dataset.completeSession + "/complete", { method: "PATCH" });
        window.showToast("Session completed and coins transferred", "success");
        await refreshCoinBalance();
        await loadSessions();
      } else if (cancelButton) {
        await window.apiRequest("/sessions/" + cancelButton.dataset.cancelSession + "/cancel", { method: "PATCH" });
        window.showToast("Session cancelled", "success");
        await loadSessions();
      } else if (receiptButton) {
        await downloadReceipt(receiptButton.dataset.receiptSession);
        window.showToast("Receipt downloaded", "success");
      } else if (reviewButton) {
        await reviewSession(reviewButton.dataset.reviewSession);
        window.showToast("Review submitted", "success");
      }
    } catch (error) {
      window.showToast(error.message, "error");
    }
  });

  window.loadSessionsTab = loadSessions;
  window.refreshCoinBalance = refreshCoinBalance;
})();
