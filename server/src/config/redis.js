import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

/**
 * Redis is optional. With it: shared cache, shared rate limits, cross-instance
 * Socket.IO and presence. Without it everything falls back to per-process memory,
 * which is fine for local development and a single instance.
 */
export const redis = env.redisUrl
  ? new Redis(env.redisUrl, { maxRetriesPerRequest: 2, lazyConnect: false })
  : null;

if (redis) {
  redis.on("error", (e) => logger.error({ err: e.message }, "redis error"));
  redis.on("ready", () => logger.info("Redis ready"));
}

export const duplicateRedis = () => redis.duplicate();
