// Correctness under concurrency: MONGO_URI=... node tests/concurrency.mjs
import http from "node:http";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { createApp } from "../src/app.js";

await connectDb();
const server = http.createServer(createApp());
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/api`;
const call = async (method, path, body, tok) => {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok && { authorization: `Bearer ${tok}` }) }, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};

// 1) Idempotent rewards: 15 simultaneous completions of the same algorithm -> exactly one payout
const reg = await call("POST", "/auth/register", { name: "Racer", email: `race${Date.now()}@x.io`, password: "password123" });
const tok = reg.body.token;
const results = await Promise.all(Array.from({ length: 15 }, () => call("POST", "/algorithms/merge/complete", null, tok)));
const paid = results.filter((r) => r.body.firstTime).length;
const me = await call("GET", "/progress/summary", null, tok);
console.log(`${paid === 1 && me.body.xp === 20 ? "PASS" : "FAIL"}  15 concurrent completions -> ${paid} payout(s), xp=${me.body.xp} (expect 1 and 20)`);

// 2) 100 learners in parallel: register -> session -> review 3 cards -> summary -> leaderboard
const N = 100, t0 = Date.now();
const errors = [];
await Promise.all(Array.from({ length: N }, async (_, i) => {
  try {
    const r = await call("POST", "/auth/register", { name: `User ${i}`, email: `u${i}_${Date.now()}@x.io`, password: "password123" });
    const t = r.body.token;
    const { body } = await call("GET", "/cards/session", null, t);
    for (const c of body.cards.slice(0, 3)) {
      const rv = await call("POST", `/cards/${c.id}/review`, { rating: "good" }, t);
      if (rv.status !== 200) errors.push(`review ${rv.status}`);
    }
    const [s, l] = await Promise.all([call("GET", "/progress/summary", null, t), call("GET", "/leaderboard", null, t)]);
    if (s.status !== 200 || s.body.xp !== 30) errors.push(`summary xp=${s.body?.xp}`);
    if (l.status !== 200) errors.push(`leaderboard ${l.status}`);
  } catch (e) { errors.push(e.message); }
}));
console.log(`${errors.length === 0 ? "PASS" : "FAIL"}  ${N} concurrent learners, ${N * 7} requests, ${errors.length} errors ${errors.slice(0, 3).join("; ")} (${Date.now() - t0}ms on a SQLite-backed stand-in DB: correctness only, not a performance number)`);
server.close(); await disconnectDb(); process.exit(0);
