(function () {
  let activePartnerId = null;
  let tagValues = [];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getSessionId() {
    const selectValue = Number(document.getElementById("note-session-select").value);
    return selectValue || Number(document.getElementById("note-session-id").value);
  }

  function setButtonLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    button.classList.toggle("is-loading", loading);
  }

  function syncTypedTags() {
    const input = document.getElementById("note-tags");
    input.value.split(",").forEach(function (tag) {
      const clean = tag.trim();
      if (clean && tagValues.indexOf(clean) === -1) tagValues.push(clean);
    });
    input.value = "";
    renderTagChips();
  }

  function renderTagChips() {
    const container = document.getElementById("note-tag-chips");
    container.innerHTML = tagValues.map(function (tag, index) {
      return '<span class="m-chip m-chip--butter">' +
        escapeHtml(tag) +
        '<button type="button" class="m-chip__x" data-remove-tag="' + index + '" aria-label="Remove ' +
        escapeHtml(tag) + '">x</button></span>';
    }).join("");
  }

  async function loadUnreadCount() {
    const result = await window.apiRequest("/chat/unread/count");
    const count = Number(result.unreadCount || 0);
    const badge = document.getElementById("chat-unread-badge");
    badge.textContent = count + " unread";
    badge.classList.toggle("hidden", count === 0);
  }

  async function loadConversation() {
    if (!activePartnerId) return;
    const messages = await window.apiRequest("/chat/" + activePartnerId);
    const container = document.getElementById("chat-messages");
    if (!Array.isArray(messages) || !messages.length) {
      container.innerHTML =
        '<div class="m-empty"><span class="m-empty__icon">💬</span>' +
        '<strong>No messages yet</strong><span>Start the conversation.</span></div>';
      container.scrollTop = container.scrollHeight;
      return;
    }

    const currentUserId = window.state.currentUser ? window.state.currentUser.id : null;
    container.innerHTML = messages.map(function (message) {
      const own = message.senderId === currentUserId;
      return '<div class="m-bubble ' + (own ? "m-bubble--me" : "m-bubble--them") + '">' +
        '<span>' + escapeHtml(message.text) + '</span>' +
        '<time>' + escapeHtml(message.createdAt ? new Date(message.createdAt).toLocaleString() : "") + '</time>' +
        '</div>';
    }).join("");
    container.scrollTop = container.scrollHeight;
  }

  async function openConversation() {
    const partnerId = Number(document.getElementById("chat-partner-id").value);
    if (!partnerId) {
      window.showToast("Enter a partner user ID", "error");
      return;
    }
    activePartnerId = partnerId;
    document.getElementById("chat-title").textContent = "Conversation with user #" + partnerId;
    const openButton = document.getElementById("open-chat-button");
    setButtonLoading(openButton, true);
    try {
      await window.apiRequest("/chat/" + partnerId + "/read", { method: "PATCH" });
      await loadUnreadCount();
      await loadConversation();
    } finally {
      setButtonLoading(openButton, false);
    }

    document.querySelectorAll("[data-conversation-partner]").forEach(function (item) {
      item.classList.toggle("is-active", Number(item.dataset.conversationPartner) === partnerId);
    });
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
    const sendButton = document.getElementById("chat-send-button");
    setButtonLoading(sendButton, true);
    try {
      await window.apiRequest("/chat/" + activePartnerId + "/message", {
        method: "POST",
        body: { text },
      });
      input.value = "";
      await loadConversation();
    } finally {
      setButtonLoading(sendButton, false);
    }
  }

  async function loadNote() {
    const sessionId = getSessionId();
    if (!sessionId) {
      window.showToast("Enter a session ID", "error");
      return;
    }
    const button = document.getElementById("load-session-note");
    setButtonLoading(button, true);
    try {
      const note = await window.apiRequest("/notes/" + sessionId);
      document.getElementById("teacher-notes").value = note.teacherNotes || "";
      document.getElementById("learner-notes").value = note.learnerNotes || "";
      tagValues = Array.isArray(note.tags) ? note.tags.slice() : [];
      renderTagChips();
      document.getElementById("note-tags").value = tagValues.join(", ");
      renderNoteResources(note.resources || []);
      renderNoteComments(note.comments || []);
      window.showToast("Session note loaded", "success");
    } finally {
      setButtonLoading(button, false);
    }
  }

  async function saveNote() {
    syncTypedTags();
    const sessionId = getSessionId();
    if (!sessionId) {
      window.showToast("Enter a session ID", "error");
      return;
    }
    await window.apiRequest("/notes/" + sessionId, {
      method: "POST",
      body: {
        teacherNotes: document.getElementById("teacher-notes").value,
        learnerNotes: document.getElementById("learner-notes").value,
        tags: tagValues,
      },
    });
  }

  function renderNoteResources(resources) {
    const container = document.getElementById("note-resources");
    if (!resources.length) {
      container.innerHTML =
        '<div class="m-empty"><strong>No resources yet</strong><span>Add a link for this session.</span></div>';
      return;
    }
    container.innerHTML = resources.map(function (resource) {
      let domain = "";
      try {
        domain = new URL(resource.url).hostname;
      } catch (_error) {
        domain = resource.url;
      }
      return '<a class="m-chip" href="' + escapeHtml(resource.url) +
        '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">' +
        '<strong>' + escapeHtml(resource.title) + '</strong><span class="m-chip--mono">' +
        escapeHtml(domain) + '</span></a>';
    }).join("");
  }

  function renderNoteComments(comments) {
    const container = document.getElementById("note-comments");
    if (!comments.length) {
      container.innerHTML =
        '<div class="m-empty"><strong>No comments yet</strong><span>Start the session discussion.</span></div>';
      return;
    }
    container.innerHTML = comments.map(function (comment) {
      return '<div class="m-bubble m-bubble--them">' +
        '<strong>User #' + escapeHtml(comment.userId) + '</strong>' +
        '<span style="display:block;margin-top:4px;">' + escapeHtml(comment.text) + '</span>' +
        '<time>' + escapeHtml(comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "") + '</time>' +
        '</div>';
    }).join("");
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
    syncTypedTags();
    const tags = tagValues.length
      ? tagValues.join(",")
      : document.getElementById("note-tags").value.trim();
    if (!tags) {
      window.showToast("Enter comma-separated tags", "error");
      return;
    }
    const notes = await window.apiRequest("/notes/search?tags=" + encodeURIComponent(tags));
    const container = document.getElementById("note-search-results");
    if (!Array.isArray(notes) || !notes.length) {
      container.innerHTML =
        '<div class="m-empty"><strong>No matching session notes</strong><span>Try other tags.</span></div>';
      return;
    }
    container.innerHTML = notes.map(function (note) {
      return '<article class="m-chip" style="justify-content:space-between;width:100%;">' +
        '<strong>Session #' + escapeHtml(note.sessionId) + '</strong>' +
        '<span class="m-chip--mono">' + escapeHtml((note.tags || []).join(", ")) + '</span></article>';
    }).join("");
  }

  async function loadSessionOptions() {
    const sessions = await window.apiRequest("/sessions/my");
    const currentUserId = window.state.currentUser ? window.state.currentUser.id : null;
    const select = document.getElementById("note-session-select");
    select.innerHTML = '<option value="">Select a session</option>';
    sessions.forEach(function (session) {
      const option = document.createElement("option");
      option.value = session.id;
      const date = session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : "";
      option.textContent = (session.skill ? session.skill.name : "Session") + " · " + date;
      select.appendChild(option);
    });

    const partners = new Map();
    sessions.forEach(function (session) {
      const partner = session.teacherId === currentUserId ? session.learner : session.teacher;
      if (partner && Number(partner.id) !== Number(currentUserId)) {
        partners.set(Number(partner.id), partner);
      }
    });

    const chatList = document.getElementById("chat-list");
    chatList.className = "m-stack";
    chatList.style.gap = "8px";
    if (!partners.size) {
      chatList.innerHTML =
        '<div class="m-empty"><strong>No conversations yet</strong><span>Partners from your sessions will appear here.</span></div>';
      return;
    }
    chatList.innerHTML = Array.from(partners.values()).map(function (partner) {
      const active = activePartnerId && Number(partner.id) === activePartnerId;
      return '<button type="button" class="m-chat__item' + (active ? " is-active" : "") +
        '" data-conversation-partner="' + escapeHtml(partner.id) + '">' +
        '<span class="m-avatar" aria-hidden="true">' + escapeHtml(String(partner.name || "U").charAt(0).toUpperCase()) +
        '</span><strong>' + escapeHtml(partner.name || "Unknown partner") + '</strong></button>';
    }).join("");
  }

  document.getElementById("open-chat-button").addEventListener("click", function () {
    openConversation().catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("chat-form").addEventListener("submit", function (event) {
    sendMessage(event).catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("chat-list").addEventListener("click", function (event) {
    const item = event.target.closest("[data-conversation-partner]");
    if (!item) return;
    document.getElementById("chat-partner-id").value = item.dataset.conversationPartner;
    openConversation().catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("note-session-select").addEventListener("change", function (event) {
    document.getElementById("note-session-id").value = event.target.value;
  });
  document.getElementById("note-tags").addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const tag = event.currentTarget.value.replace(/,$/, "").trim();
      if (tag && tagValues.indexOf(tag) === -1) tagValues.push(tag);
      event.currentTarget.value = "";
      renderTagChips();
    }
  });
  document.getElementById("note-tags").addEventListener("input", function (event) {
    if (event.currentTarget.value.indexOf(",") !== -1) {
      event.currentTarget.value.split(",").forEach(function (tag) {
        const clean = tag.trim();
        if (clean && tagValues.indexOf(clean) === -1) tagValues.push(clean);
      });
      event.currentTarget.value = "";
      renderTagChips();
    }
  });
  document.getElementById("note-tag-chips").addEventListener("click", function (event) {
    const remove = event.target.closest("[data-remove-tag]");
    if (!remove) return;
    tagValues.splice(Number(remove.dataset.removeTag), 1);
    renderTagChips();
  });

  document.getElementById("load-session-note").addEventListener("click", function () {
    loadNote().catch(function (error) { window.showToast(error.message, "error"); });
  });
  document.getElementById("save-session-note").addEventListener("click", function () {
    const button = document.getElementById("save-session-note");
    setButtonLoading(button, true);
    saveNote().then(function () {
      window.showToast("Session note saved", "success");
    }).catch(function (error) {
      window.showToast(error.message, "error");
    }).finally(function () {
      setButtonLoading(button, false);
    });
  });
  document.getElementById("add-note-resource").addEventListener("click", function () {
    const button = document.getElementById("add-note-resource");
    setButtonLoading(button, true);
    addResource().then(function () {
      document.getElementById("note-resource-title").value = "";
      document.getElementById("note-resource-url").value = "";
      window.showToast("Resource added", "success");
      return loadNote();
    }).catch(function (error) {
      window.showToast(error.message, "error");
    }).finally(function () {
      setButtonLoading(button, false);
    });
  });
  document.getElementById("add-note-comment").addEventListener("click", function () {
    const button = document.getElementById("add-note-comment");
    setButtonLoading(button, true);
    addComment().then(function () {
      document.getElementById("note-comment").value = "";
      window.showToast("Comment added", "success");
      return loadNote();
    }).catch(function (error) {
      window.showToast(error.message, "error");
    }).finally(function () {
      setButtonLoading(button, false);
    });
  });
  document.getElementById("search-note-tags").addEventListener("click", function () {
    const button = document.getElementById("search-note-tags");
    setButtonLoading(button, true);
    searchTags().catch(function (error) {
      window.showToast(error.message, "error");
    }).finally(function () {
      setButtonLoading(button, false);
    });
  });

  window.loadChatTab = async function () {
    await Promise.all([loadUnreadCount(), loadSessionOptions()]);
  };
})();
