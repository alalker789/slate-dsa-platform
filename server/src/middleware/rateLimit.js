import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import { verifyToken } from "../services/token.js";

const make = ({ name, ...opts }) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests, slow down." },
    // With Redis the counters are shared by every replica; otherwise they are per process.
    ...(redis ? { store: new RedisStore({ sendCommand: (...args) => redis.call(...args), prefix: `rl:${name}:` }) } : {}),
    ...opts,
  });

const ip = (req) => ipKeyGenerator(req.ip);

// Per-IP limits punish everyone on a shared campus/office NAT, so signed-in traffic is keyed by user id instead.
const userOrIp = (req) => {
  const h = req.headers.authorization || "";
  const uid = h.startsWith("Bearer ") ? verifyToken(h.slice(7)) : null;
  return uid ? `u:${uid}` : `ip:${ip(req)}`;
};

export const apiLimiter = make({ name: "api", windowMs: 60_000, limit: env.rateLimitApi, keyGenerator: userOrIp });

// Brute-force protection is per account (+IP), and only failed logins count.
export const loginLimiter = make({
  name: "login",
  windowMs: 15 * 60_000,
  limit: env.rateLimitLogin,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ip(req)}|${String(req.body?.email || "").toLowerCase()}`,
});

export const registerLimiter = make({ name: "register", windowMs: 60 * 60_000, limit: env.rateLimitRegister, keyGenerator: ip });
