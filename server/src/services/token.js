import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Stateless auth: any API replica can verify a token, so no sticky sessions are needed.
export const signToken = (userId) => jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret).sub;
  } catch {
    return null;
  }
}
