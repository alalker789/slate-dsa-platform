import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";

export const notFound = (req, res) => res.status(404).json({ error: "Route not found" });

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err instanceof ZodError)
    return res.status(400).json({ error: "Validation failed", details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
  if (err?.code === 11000) return res.status(409).json({ error: "Already exists" });
  if (err?.name === "CastError") return res.status(400).json({ error: "Invalid id" });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Malformed JSON" });
  logger.error({ err, path: req.path }, "unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
