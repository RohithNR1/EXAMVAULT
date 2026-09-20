import axios from "axios";

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/",
});

// ── Request interceptor ───────────────────────────────────────────────
// Attaches the Bearer access token to every request except login/register
// and the token-refresh endpoint itself (to avoid leaking the refresh
// token in an Authorization header where it is not expected).
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  const isAuthRequest =
    config.url.includes("login/") ||
    config.url.includes("register/") ||
    config.url.includes("token/refresh/");

  if (token && !isAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor (401 / refresh) ─────────────────────────────
// When a request returns 401 we attempt a single silent refresh using the
// stored refresh token, then retry the original request exactly once.
// Multiple simultaneous 401s share one refresh operation via the
// _isRefreshing flag and the _deferredReplies queue.

let _isRefreshing = false; // true while exactly one refresh request is inflight
const _deferredReplies = []; // [{resolve, reject, config}, ...]

/**
 * Attempt to exchange the stored refresh token for a new access token.
 * Returns { ok: true,  accessToken } on success, or { ok: false } on failure.
 * Guarantees only one HTTP call even when many requests fail simultaneously.
 */
async function attemptRefresh() {
  const refreshToken = localStorage.getItem("refresh");
  if (!refreshToken) {
    return { ok: false };
  }

  try {
    const res = await client.post("token/refresh/", { refresh: refreshToken });
    const newAccess = res.data?.access;
    if (!newAccess) {
      return { ok: false };
    }
    // Persist the new access token; keep the existing refresh token intact
    // (standard SimpleJWT behaviour does not rotate it unless configured).
    localStorage.setItem("access", newAccess);
    return { ok: true, accessToken: newAccess };
  } catch (err) {
    console.error("Token refresh failed:", err.response?.status, err);
    return { ok: false };
  }
}

client.interceptors.response.use(
  (response) => response, // pass through successful responses unchanged

  async (error) => {
    const { config } = error;

    // ── Guard: do not retry the request that already failed once ──────
    if (config._retry) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // ── Guard: do not intercept 401 on auth endpoints ────────────────
    if (
      status === 401 &&
      (config.url.includes("login/") ||
        config.url.includes("register/") ||
        config.url.includes("token/refresh/"))
    ) {
      return Promise.reject(error);
    }

    // ── Only act on 401 ───────────────────────────────────────────────
    if (status !== 401) {
      return Promise.reject(error);
    }

    // No refresh token on record → force logout immediately.
    if (!localStorage.getItem("refresh")) {
      console.warn("401 with no refresh token — clearing session.");
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // ── Either no refresh is in flight, or this caller must wait ─────
    if (!_isRefreshing) {
      _isRefreshing = true;
      const result = await attemptRefresh();
      _isRefreshing = false;

      if (!result.ok) {
        // Refresh itself failed → authentication is dead.
        console.warn("Refresh failed — clearing session and redirecting.");
        localStorage.clear();
        window.location.href = "/login";
        // Reject every queued deferred reply so they surface the same
        // stale-credential error rather than hanging forever.
        _deferredReplies.forEach(({ reject }) => reject(error));
        _deferredReplies.length = 0;
        return Promise.reject(error);
      }

      // Mark the original config so a second 401 on replay is rejected
      // immediately (no recursive refresh).
      config._retry = true;

      // Replay every waiting request once with the new token already in
      // localStorage and the Authorization header patched onto each config.
      // Mark each config _retry = true so the second 401 is rejected here.
      const pending = _deferredReplies.splice(0);
      pending.forEach(({ resolve, reject, config: retryConfig }) => {
        retryConfig._retry = true;
        client.request(retryConfig).then(resolve).catch(reject);
      });

      // Replay this request once as well.
      return client.request(config);
    }

    // Another refresh is already underway — enqueue this caller.
    return new Promise((resolve, reject) => {
      _deferredReplies.push({ resolve, reject, config });
    });
  }
);

export default client;
