import { http } from "./http.js";

const memo = new Map(); // the algorithm catalog is static per session; avoid refetching on every click
const once = (key, fn) => (memo.has(key) ? memo.get(key) : (memo.set(key, fn().catch((e) => (memo.delete(key), Promise.reject(e)))), memo.get(key)));

export const api = {
  register: (b) => http("/auth/register", { method: "POST", body: b }),
  login: (b) => http("/auth/login", { method: "POST", body: b }),
  me: () => http("/auth/me"),

  algorithms: () => once("algos", () => http("/algorithms")),
  algorithm: (slug) => once("algo:" + slug, () => http("/algorithms/" + slug)),
  completeAlgorithm: (slug) => http(`/algorithms/${slug}/complete`, { method: "POST" }),

  categories: () => http("/cards/categories"),
  session: (cat) => http("/cards/session" + (cat && cat !== "All" ? `?cat=${encodeURIComponent(cat)}` : "")),
  review: (id, rating) => http(`/cards/${id}/review`, { method: "POST", body: { rating } }),

  summary: () => http("/progress/summary"),
  activity: () => http("/progress/activity?days=91"),
  leaderboard: () => http("/leaderboard"),
};
