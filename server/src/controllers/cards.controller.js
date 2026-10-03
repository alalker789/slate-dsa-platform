import { z } from "zod";
import { Card } from "../models/Card.js";
import { CardProgress } from "../models/CardProgress.js";
import { ReviewLog } from "../models/ReviewLog.js";
import { cached } from "../services/cache.js";
import { schedule, RATINGS } from "../services/srs.js";
import { awardXp, dayKey } from "../services/rewards.js";
import { ApiError } from "../utils/ApiError.js";

export const reviewSchema = z.object({ rating: z.enum(Object.keys(RATINGS)) });

const slim = (c, state) => ({ id: c._id, cat: c.cat, front: c.front, back: c.back, state });

export async function listCategories(req, res) {
  const cats = await cached("cards:cats", 300, () => Card.distinct("cat"));
  res.json({ categories: cats });
}

/** Today's session: cards that are due first, then brand-new ones (capped), optionally by category. */
export async function getSession(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const newCap = Math.min(Number(req.query.newPerSession) || 10, 20);
  const cat = typeof req.query.cat === "string" && req.query.cat !== "All" ? req.query.cat : null;
  const now = new Date();

  const catIds = cat ? await Card.find({ cat }).distinct("_id") : null;
  const dueQuery = { user: req.userId, due: { $lte: now }, ...(catIds && { card: { $in: catIds } }) };

  const due = await CardProgress.find(dueQuery).sort({ due: 1 }).limit(limit).populate("card").lean();
  const seen = await CardProgress.find({ user: req.userId }).distinct("card");
  const room = Math.max(0, Math.min(newCap, limit - due.length));
  const fresh = room
    ? await Card.find({ _id: { $nin: seen }, ...(cat && { cat }) }).sort({ order: 1 }).limit(room).lean()
    : [];

  res.json({
    cards: [...due.filter((p) => p.card).map((p) => slim(p.card, "due")), ...fresh.map((c) => slim(c, "new"))],
  });
}

export async function reviewCard(req, res) {
  const { rating } = req.body;
  const userId = req.userId;
  if (!(await Card.exists({ _id: req.params.id }))) throw ApiError.notFound("Unknown card");

  const now = Date.now();
  const prev = await CardProgress.findOne({ user: userId, card: req.params.id }).lean();
  const next = schedule(prev, rating, now);
  const progress = await CardProgress.findOneAndUpdate(
    { user: userId, card: req.params.id },
    { $set: { ...next, lastReviewedAt: new Date(now) } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  await ReviewLog.create({ user: userId, card: req.params.id, rating, day: dayKey() });

  const reward = await awardXp(userId, RATINGS[rating].xp);
  res.json({ nextDue: progress.due, interval: progress.interval, ...reward });
}
