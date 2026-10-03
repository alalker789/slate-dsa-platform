import os from "node:os";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { redis, duplicateRedis } from "../config/redis.js";
import { verifyToken } from "../services/token.js";
import { events } from "../services/events.js";

const INSTANCE = `${os.hostname()}:${process.pid}`;
const PRESENCE_KEY = "presence";

/**
 * Real-time layer:
 *  - `presence`            live count of learners online (summed across all instances)
 *  - `leaderboard:dirty`   "refetch the board" hint, throttled so 1000 clients don't stampede
 *  - `xp:gained`           sent to one user's private room (keeps their other tabs in sync)
 */
export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin.split(",") },
    transports: ["websocket"], // websocket-only => no sticky sessions needed behind the load balancer
  });

  // Redis adapter lets an emit on instance A reach sockets connected to instance B.
  if (redis) io.adapter(createAdapter(redis, duplicateRedis()));

  io.use((socket, next) => {
    const userId = verifyToken(socket.handshake.auth?.token);
    if (!userId) return next(new Error("unauthorized"));
    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    broadcastPresence(io);
  });

  // ---- presence ----
  const localCount = () => io.of("/").sockets.size;
  async function totalOnline() {
    if (!redis) return localCount();
    await redis.hset(PRESENCE_KEY, INSTANCE, `${localCount()}:${Date.now()}`);
    const all = await redis.hgetall(PRESENCE_KEY);
    let total = 0;
    for (const [k, v] of Object.entries(all)) {
      const [n, ts] = v.split(":");
      if (Date.now() - Number(ts) < 15_000) total += Number(n);
      else redis.hdel(PRESENCE_KEY, k).catch(() => {}); // dead instance
    }
    return total;
  }
  let presenceTimer = null;
  function broadcastPresence() {
    if (presenceTimer) return; // coalesce bursts of connects into one broadcast
    presenceTimer = setTimeout(async () => {
      presenceTimer = null;
      io.emit("presence", await totalOnline().catch(() => localCount()));
    }, 1000);
  }
  const heartbeat = setInterval(broadcastPresence, 5000);

  // ---- bridge from HTTP layer ----
  let lastDirty = 0;
  events.on("xp:gained", (payload) => {
    io.to(`user:${payload.userId}`).emit("xp:gained", payload);
    if (Date.now() - lastDirty > 5000) {
      lastDirty = Date.now();
      io.emit("leaderboard:dirty");
    }
  });

  io.engine.on("connection_error", (e) => logger.debug({ code: e.code }, "socket connection error"));
  httpServer.on("close", () => clearInterval(heartbeat));
  return io;
}
