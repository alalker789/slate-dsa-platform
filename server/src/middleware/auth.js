import { verifyToken } from "../services/token.js";
import { ApiError } from "../utils/ApiError.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const userId = header.startsWith("Bearer ") ? verifyToken(header.slice(7)) : null;
  if (!userId) throw ApiError.unauthorized();
  req.userId = userId; // no DB hit on the hot path; controllers load the user only when needed
  next();
}
