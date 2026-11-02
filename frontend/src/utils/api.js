export const API_BASE = (
  import.meta.env.VITE_APP_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
export async function api(
  path,
  { body, token, ownerToken, signal, method, ...options } = {},
) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal: signal || AbortSignal.timeout(65000),
    method: method || (body === undefined ? "GET" : "POST"),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { "X-Player-Token": token } : {}),
      ...(ownerToken ? { "X-Room-Token": ownerToken } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : "入力内容を確認して、もう一度お試しください。";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}
export function readStorage(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* In-memory play still works. */
  }
}
