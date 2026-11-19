(function () {
  let activePartnerId = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getSessionId() {
    return Number(document.getElementById("note-session-id").value);
  }

  async function loadUnreadCount() {
    const result = await window.apiRequest("/chat/unread/count");
    const count = Number(result.unreadCount || 0);
    const badge = document.getElementById("chat-unread-badge");
    badge.textContent = count + " unread";
    badge.classList.toggle("hidden", count === 0);
  }

  async function openConversation() {
    const partnerId = Number(document.getElementById("chat-partner-id").value);
    if (!partnerId) {
      window.showToast("Enter a partner user ID", "error");
      return;
    }
    activePartnerId = partnerId;
    document.getElementById("chat-title").textContent = "Conversation with user #" + partnerId;
    await window.apiRequest("/chat/" + partnerId + "/read", { method: "PATCH" });
    await loadUnreadCount();
    await loadConversation();
  }

  async function loadConversation() {
    if (!activePartnerId) return;
    const messages = await window.apiRequest("/chat/" + activePartnerId);
    const container = document.getElementById("chat-messages");
    if (!messages.length) {
      container.innerHTML = '<p class="text-sm text-slate-500">No messages yet. Start the conversation.</p>';
      return;
    }
    const currentUserId = window.state.currentUser ? window.state.currentUser.id : null;
    container.innerHTML = messages.map(function (message) {
      const own = message.senderId === currentUserId;
      return [
        '<div class="flex ' + (own ? "justify-end" : "justify-start") + '">',
        '<div class="' + (own ? "border-indigo-400/30 bg-indigo-500/20" : "border-white/10 bg-black/20") + ' max-w-[80%] rounded-2xl border px-4 py-3">',
        '<p class="text-sm text-slate-100">' + escapeHtml(message.text) + '</p>',
        '<p class="mt-1 text-right text-[10px] text-slate-500">' + escapeHtml(message.createdAt ? new Date(message.createdAt).toLocaleString() : "") + '</p>',
        '</div></div>',
      ].join("");
    }).join("");
    container.scrollTop = container.scrollHeight;

    document.getElementById("chat-list").innerHTML =
      '<button type="button" class="w-full rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-left">' +
      '<p class="font-bold text-white">User #' + escapeHtml(activePartnerId) + '</p>' +
      '<p class="mt-1 text-xs text-slate-400">Active conversation</p></button>';
  }

  async function sendMessage(event) {
    event.preventEvent && event.preventEvent();
    event.preventDefault();
    if (!activePartnerId) {
      window.showToast("Open a conversation first", "error");
      return;
    }
    const input = document.getElementById("chat-message");
    const text = input.value.trim();
    if (!text) return;
    await window.apiRequest("/chat/" + activePartnerId + "/message", {
      method: "POST",
      body: { text },
    });
    input.value = "";
    await loadConversation();
  }

  async function loadNote() {
    const sessionId = getSessionId();
    if (!sessionId) {
      window.showToast("Enter a session ID", "error");
      return;
    }
    try {
      const note = await window.apiRequest("/notes/" + sessionId);
      document.getElementById("teacher-notes").value = note.teacherNotes || "";
      document.getElementById("learner-notes").value = note.learnerNotes || "";
      document.getElementById("note-tags").value = (note.tags || []).join(", ");
      window.showToast("Session note loaded", "success");
    } catch (error) {
      window.showToast(error.message, "error");
    }
  }

  async function saveNote() {
    const sessionId = getSessionId();
    if (!sessionId) {
      window.showToast("Enter a session ID", "error");
      return;
    }
    const tags = document.getElementById("note-tags").value
      .split(",")
      .map(function (tag) { return tag.trim(); })
      .filter(Boolean);
    await window.apiRequest("/notes/" + sessionId, {
      method: "POST",
      body: {
        teacherNotes: document.getElementById("teacher-notes").value,
        learnerNotes: document.getElementById("learner-notes").value,
        tags,
      },
    });
  }

  async function addResource() {
    const sessionId = getSessionId();
    const title = document.getElementById("note-resource-title").value.trim();
    const url = document.getElementById("note-resource-url").value.trim();
    if (!sessionId || !title || !url) {
      window.showToast("Enter a session ID, resource title, and URL", "error");
      return;
    }
    await window.apiRequest("/notes/" + sessionId + "/resources", {
      method: "POST",
      body: { title, url },
    });
  }

  async function addComment() {
    const sessionId = getSessionId();
    const text = document.getElementById("note-comment").value.trim();
    if (!sessionId || !text) {
      window.showToast("Enter a session ID and comment", "error");
      return;
    }
    await window.apiRequest("/notes/" + sessionId + "/comments", {
      method: "POST",
      body: { text },
    });
  }

  async function searchTags() {
    const tags = document.getElementById("note-tags").value.trim();
    if (!tags) {
      window.showToast("Enter comma-separated tags", "error");
      return;
    }
    const notes = await window.apiRequest("/notes/search?tags=" + encodeURIComponent(tags));
    const container = document.getElementById("note-search-results");
    if (!notes.length) {
      container.innerHTML = '<p class="text-sm text-slate-500">No matching session notes.</p>';
      return;
    }
    container.innerHTML = notes.map(function (note) {
      return [
        '<article class="rounded-xl border border-white/10 bg-black/20 p-4">',
        '<p class="font-bold text-white">Session #' + escapeHtml(note.sessionId) + '</p>',
        '<p class="mt-2 text-xs text-indigo-300">' + escapeHtml((note.tags || []).join(", ")) + '</p>',
        '</article>',
      ].join("");
    }).join("");
  }

  document.getElementById("open-chat-button").addEventListener("click", function () {
    openConversation().catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("chat-form").addEventListener("submit", function (event) {
    sendMessage(event).catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("load-session-note").addEventListener("click", loadNote);
  document.getElementById("save-session-note").addEventListener("click", function () {
    saveNote().then(function () {
      window.showToast("Session note saved", "success");
    }).catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("add-note-resource").addEventListener("click", function () {
    addResource().then(function () {
      window.showToast("Resource added", "success");
    }).catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("add-note-comment").addEventListener("click", function () {
    addComment().then(function () {
      window.showToast("Comment added", "success");
    }).catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("search-note-tags").addEventListener("click", function () {
    searchTags().catch(function (error) { window.showToast(error.message, "error"); });
  });

  window.loadChatTab = async function () {
    await loadUnreadCount();
  };
})();
