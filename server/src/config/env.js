import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

export const env = {
  isProd,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/slate",
  mongoPoolSize: Number(process.env.MONGO_POOL_SIZE || 20),
  redisUrl: process.env.REDIS_URL || null, // optional: enables shared cache, rate limits, socket adapter
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  // Rate limits (requests per window). Authenticated traffic is limited per user, anonymous per IP.
  rateLimitApi: Number(process.env.RATE_LIMIT_API || 240), // per user per minute
  rateLimitLogin: Number(process.env.RATE_LIMIT_LOGIN || 10), // failed attempts per account+IP per 15 min
  rateLimitRegister: Number(process.env.RATE_LIMIT_REGISTER || 200), // sign-ups per IP per hour (campuses share NAT IPs)
  workers: Number(process.env.WEB_CONCURRENCY || 1), // node:cluster workers per container
};
