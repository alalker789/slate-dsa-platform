const TOKEN_KEY = "slate.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

/** Thin fetch wrapper: JSON in/out, bearer token, readable errors. */
export async function http(path, { method = "GET", body } = {}) {
  const token = tokenStore.get();
  const res = await fetch("/api" + path, {
    method,
    headers: { ...(body && { "Content-Type": "application/json" }), ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized(); // expired/invalid session -> log out
    const d = data?.details?.[0];
    const err = new Error(d ? `${d.path}: ${d.message}` : data?.error || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}
