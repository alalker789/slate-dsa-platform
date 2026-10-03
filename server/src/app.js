import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import pino from "pino-http";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/error.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind nginx / a load balancer: real client IP for rate limits

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin.split(","), credentials: false }));
  app.use(compression());
  app.use(express.json({ limit: "10kb" }));
  app.use(pino({ logger, autoLogging: { ignore: (req) => req.url === "/healthz" } }));

  // Liveness/readiness probe for the load balancer & orchestrator (not rate limited).
  app.get("/healthz", (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ ok: mongoose.connection.readyState === 1 }));

  app.use("/api", apiLimiter, routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
