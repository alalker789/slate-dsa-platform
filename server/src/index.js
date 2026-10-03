import cluster from "node:cluster";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

// Production entry: one process per CPU slice (set WEB_CONCURRENCY), respawn on crash.
// Combine with several container replicas behind nginx for horizontal scale.
if (cluster.isPrimary && env.workers > 1) {
  logger.info(`primary ${process.pid} starting ${env.workers} workers`);
  for (let i = 0; i < env.workers; i++) cluster.fork();
  cluster.on("exit", (w, code) => {
    logger.warn(`worker ${w.process.pid} exited (${code}), respawning`);
    cluster.fork();
  });
} else {
  await import("./server.js");
}
