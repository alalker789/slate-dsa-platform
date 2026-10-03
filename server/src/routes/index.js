import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimit.js";
import * as auth from "../controllers/auth.controller.js";
import * as algos from "../controllers/algorithms.controller.js";
import * as cards from "../controllers/cards.controller.js";
import * as progress from "../controllers/progress.controller.js";
import { leaderboard } from "../controllers/leaderboard.controller.js";

const r = Router();

r.post("/auth/register", registerLimiter, validate(auth.registerSchema), auth.register);
r.post("/auth/login", loginLimiter, validate(auth.loginSchema), auth.login);
r.get("/auth/me", requireAuth, auth.me);

r.get("/algorithms", algos.listAlgorithms);
r.get("/algorithms/:slug", algos.getAlgorithm);
r.post("/algorithms/:slug/complete", requireAuth, algos.completeAlgorithm);

r.get("/cards/categories", requireAuth, cards.listCategories);
r.get("/cards/session", requireAuth, cards.getSession);
r.post("/cards/:id/review", requireAuth, validate(cards.reviewSchema), cards.reviewCard);

r.get("/progress/summary", requireAuth, progress.summary);
r.get("/progress/activity", requireAuth, progress.activity);

r.get("/leaderboard", requireAuth, leaderboard);

export default r;
