const API_BASE = "/api/v1";

export const state = {
  accessToken: localStorage.getItem("skillswap_access_token"),
  refreshToken: localStorage.getItem("skillswap_refresh_token"),
  user: null,
};

export function saveAuth(accessToken, refreshToken, user) {
  state.accessToken = accessToken;
  state.refreshToken = refreshToken;
  state.user = user || null;
  if (accessToken) localStorage.setItem("skillswap_access_token", accessToken);
  if (refreshToken) localStorage.setItem("skillswap_refresh_token", refreshToken);
  if (user) localStorage.setItem("skillswap_current_user", JSON.stringify(user));
}

export function clearAuth() {
  state.accessToken = null;
  state.refreshToken = null;
  state.user = null;
  localStorage.removeItem("skillswap_access_token");
  localStorage.removeItem("skillswap_refresh_token");
  localStorage.removeItem("skillswap_current_user");
}

export async function apiRequest(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;
  if (options.body) headers["Content-Type"] = "application/json";

  let response = await fetch(API_BASE + endpoint, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && state.refreshToken) {
    const refreshResponse = await fetch(API_BASE + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: state.refreshToken }),
    });
    const refreshPayload = await refreshResponse.json().catch(() => ({}));
    const refreshed = refreshPayload.data || refreshPayload;
    if (!refreshResponse.ok || !refreshed.accessToken) throw new Error(refreshed.message || "Session expired");
    state.accessToken = refreshed.accessToken;
    if (refreshed.refreshToken) state.refreshToken = refreshed.refreshToken;
    localStorage.setItem("skillswap_access_token", state.accessToken);
    localStorage.setItem("skillswap_refresh_token", state.refreshToken);
    response = await fetch(API_BASE + endpoint, {
      method: options.method || "GET",
      headers: { ...headers, Authorization: `Bearer ${state.accessToken}` },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload.data !== undefined ? payload.data : payload;
}
