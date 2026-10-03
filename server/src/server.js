import http from "node:http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { redis } from "./config/redis.js";
import { createApp } from "./app.js";
import { initSockets } from "./sockets/index.js";

await connectDb();
const server = http.createServer(createApp());
const io = initSockets(server);

server.listen(env.port, () => logger.info(`API pid ${process.pid} listening on :${env.port}`));

// Graceful shutdown: stop accepting, let in-flight requests finish, then close connections.
async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  const force = setTimeout(() => process.exit(1), 10_000).unref();
  io.close();
  server.close(async () => {
    await disconnectDb();
    redis?.disconnect();
    clearTimeout(force);
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
