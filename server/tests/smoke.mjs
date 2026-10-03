// Manual smoke test that needs no database: node tests/smoke.mjs
import http from "node:http";
import { createApp } from "../src/app.js";
import { initSockets } from "../src/sockets/index.js";
import { signToken } from "../src/services/token.js";
import { io as client } from "../../client/node_modules/socket.io-client/build/esm-debug/index.js";

const server = http.createServer(createApp());
const sio = initSockets(server);
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const j = async (p, o) => { const r = await fetch(base + p, o); return [r.status, await r.json().catch(() => null), r.headers]; };
const post = (p, body) => j(p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

console.log("healthz (no db)      ", (await j("/healthz"))[0], "expect 503");
console.log("unknown route        ", (await j("/nope"))[0], "expect 404");
console.log("me without token     ", (await j("/api/auth/me"))[0], "expect 401");
console.log("leaderboard no token ", (await j("/api/leaderboard"))[0], "expect 401");
console.log("bad token            ", (await j("/api/progress/summary", { headers: { authorization: "Bearer x.y.z" } }))[0], "expect 401");
const [s, b] = await post("/api/auth/register", { name: "A", email: "nope", password: "short" });
console.log("register invalid     ", s, "expect 400", JSON.stringify(b.details.map((d) => d.path)));
console.log("malformed json       ", (await j("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: "{bad" }))[0], "expect 400");
const [, , h] = await j("/healthz");
console.log("helmet header        ", (await j("/healthz"))[2].get("x-content-type-options"));
const rl = (await j("/api/auth/me"))[2];
console.log("ratelimit headers    ", rl.get("ratelimit"), rl.get("ratelimit-policy"));

const url = base;
const bad = client(url, { transports: ["websocket"], auth: { token: "bad" } });
await new Promise((r) => bad.on("connect_error", (e) => { console.log("socket bad token    ", e.message, "expect unauthorized"); r(); }));
const good = client(url, { transports: ["websocket"], auth: { token: signToken("507f1f77bcf86cd799439011") } });
const presence = await new Promise((r) => good.on("presence", r));
console.log("socket presence      ", presence, "expect 1");
const { events } = await import("../src/services/events.js");
const got = new Promise((r) => good.on("xp:gained", r));
const dirty = new Promise((r) => good.on("leaderboard:dirty", () => r(true)));
events.emit("xp:gained", { userId: "507f1f77bcf86cd799439011", xp: 10, gained: 10 });
console.log("xp event routed      ", JSON.stringify(await got), "| dirty hint:", await dirty);
good.close(); sio.close(); server.close(); process.exit(0);
