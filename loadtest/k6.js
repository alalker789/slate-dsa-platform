// Simulates ~1000 concurrent learners. Install k6 (https://k6.io), then:
//   k6 run -e BASE=http://localhost:8080 loadtest/k6.js
// Each virtual user registers once, then loops: pull a session, review cards, check progress/leaderboard.
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 1000 }, // ramp to 1000 concurrent users
    { duration: "3m", target: 1000 }, // hold
    { duration: "30s", target: 0 },
  ],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"] },
};

const BASE = __ENV.BASE || "http://localhost:8080";
const json = { headers: { "Content-Type": "application/json" } };

export function setup() {
  return {};
}

let token;
export default function () {
  if (!token) {
    const email = `k6_${__VU}_${Date.now()}@load.test`;
    const r = http.post(`${BASE}/api/auth/register`, JSON.stringify({ name: `VU ${__VU}`, email, password: "password123" }), json);
    check(r, { registered: (x) => x.status === 201 });
    token = r.json("token");
  }
  const auth = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };

  http.get(`${BASE}/api/algorithms`);
  const s = http.get(`${BASE}/api/cards/session`, auth);
  check(s, { session: (x) => x.status === 200 });
  for (const c of (s.json("cards") || []).slice(0, 3)) {
    const r = http.post(`${BASE}/api/cards/${c.id}/review`, JSON.stringify({ rating: "good" }), auth);
    check(r, { reviewed: (x) => x.status === 200 });
    sleep(2 + Math.random() * 3); // humans read the card
  }
  http.get(`${BASE}/api/progress/summary`, auth);
  http.get(`${BASE}/api/leaderboard`, auth);
  sleep(5 + Math.random() * 10);
}
