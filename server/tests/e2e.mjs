// End-to-end API test against a real MongoDB-compatible server: MONGO_URI=... node tests/e2e.mjs
import http from "node:http";
import assert from "node:assert/strict";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { createApp } from "../src/app.js";

await connectDb();
const server = http.createServer(createApp());
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/api`;
let token = "";
const call = async (method, path, body, tok = token) => {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok && { authorization: `Bearer ${tok}` }) }, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const step = (name, ok, extra = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`);
const email = `t${Date.now()}@example.com`;
let r;

r = await call("POST", "/auth/register", { name: "Test User", email, password: "password123" });
assert.equal(r.status, 201); token = r.body.token; step("register", true);
r = await call("POST", "/auth/register", { name: "Dup", email, password: "password123" });
step("duplicate email -> 409", r.status === 409);
r = await call("POST", "/auth/login", { email, password: "wrong-password" });
step("wrong password -> 401", r.status === 401);
r = await call("POST", "/auth/login", { email, password: "password123" });
step("login", r.status === 200 && !!r.body.token);
r = await call("GET", "/auth/me");
step("me", r.status === 200 && r.body.user.email === email);

r = await call("GET", "/algorithms", null, "");
step("algorithm catalog (public)", r.status === 200 && r.body.algorithms.length === 13, `(${r.body.algorithms?.length})`);
r = await call("GET", "/algorithms/quick", null, "");
step("algorithm detail has 4 languages", r.status === 200 && Object.keys(r.body.algorithm.code).length === 4, Object.keys(r.body.algorithm.code).join());
r = await call("GET", "/algorithms/nope", null, "");
step("unknown algorithm -> 404", r.status === 404);

r = await call("POST", "/algorithms/bubble/complete");
step("first completion awards 20 XP", r.body.firstTime === true && r.body.xp === 20, JSON.stringify(r.body));
r = await call("POST", "/algorithms/bubble/complete");
step("second completion awards nothing", r.body.firstTime === false);

r = await call("GET", "/cards/categories");
step("card categories", r.status === 200 && r.body.categories.length >= 3, r.body.categories.join());
r = await call("GET", "/cards/session");
const cards = r.body.cards;
step("new session = 10 new cards (cap)", cards.length === 10 && cards.every((c) => c.state === "new"), `(${cards.length})`);
r = await call("GET", "/cards/session?cat=Sorting");
step("category filter", r.body.cards.length > 0 && r.body.cards.every((c) => c.cat === "Sorting"));

r = await call("POST", `/cards/${cards[0].id}/review`, { rating: "good" });
step("review good -> +10 XP, due tomorrow", r.status === 200 && r.body.gained === 10 && r.body.interval === 1, JSON.stringify(r.body));
r = await call("POST", `/cards/${cards[1].id}/review`, { rating: "again" });
step("review again -> +1 XP, due within minutes", r.body.gained === 1 && new Date(r.body.nextDue) - Date.now() < 120_000);
r = await call("POST", `/cards/${cards[2].id}/review`, { rating: "meh" });
step("invalid rating -> 400", r.status === 400);
r = await call("POST", `/cards/507f1f77bcf86cd799439011/review`, { rating: "good" });
step("unknown card -> 404", r.status === 404);
r = await call("GET", "/cards/session");
step("reviewed cards leave the new pool", !r.body.cards.some((c) => c.id === cards[0].id));

r = await call("GET", "/progress/summary");
const s = r.body;
step("summary adds up", s.xp === 31 && s.streak.count === 1 && s.cards.total === 23 && s.cards.new === 21 && s.algorithms.explored[0] === "bubble", JSON.stringify({ xp: s.xp, lvl: s.level, cards: s.cards }));
r = await call("GET", "/progress/activity");
step("activity heatmap data", Object.values(r.body.activity).reduce((a, b) => a + b, 0) === 2, JSON.stringify(r.body.activity));
r = await call("GET", "/leaderboard");
step("leaderboard has me, rank 1", r.status === 200 && r.body.top.some((u) => u.xp === 31) && r.body.me.rank >= 1, JSON.stringify(r.body.me));
r = await call("GET", "/leaderboard", null, "");
step("leaderboard needs auth", r.status === 401);

server.close(); await disconnectDb(); process.exit(0);
