import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Card } from "../models/Card.js";
import { Algorithm } from "../models/Algorithm.js";
import { CardProgress } from "../models/CardProgress.js";
import { ReviewLog } from "../models/ReviewLog.js";
import { cached } from "../services/cache.js";
import { levelFromXp, levelBounds, dayKey } from "../services/rewards.js";
import { ApiError } from "../utils/ApiError.js";

export async function summary(req, res) {
  const uid = new mongoose.Types.ObjectId(req.userId);
  const now = new Date();
  const base = { user: uid };
  // Three small indexed counts in parallel beat one conditional aggregation: simpler, and each uses {user, due}.
  const [user, totalCards, totalAlgos, seen, due, mastered] = await Promise.all([
    User.findById(uid).lean(),
    cached("cards:count", 300, () => Card.countDocuments()),
    cached("algorithms:count", 300, () => Algorithm.countDocuments()),
    CardProgress.countDocuments(base),
    CardProgress.countDocuments({ ...base, due: { $lte: now } }),
    CardProgress.countDocuments({ ...base, reps: { $gte: 3 }, interval: { $gte: 14 } }), // mirrors srs.isMastered
  ]);
  if (!user) throw ApiError.unauthorized();
  const level = levelFromXp(user.xp);
  res.json({
    name: user.name,
    xp: user.xp,
    level,
    levelBounds: levelBounds(level),
    streak: user.streak,
    cards: { total: totalCards, new: totalCards - seen, due, learning: seen - mastered, mastered },
    algorithms: { explored: user.explored, total: totalAlgos },
  });
}

/** Reviews per UTC day for the last N days (default 90) -> drives the heatmap. */
export async function activity(req, res) {
  const days = Math.min(Number(req.query.days) || 90, 365);
  const since = dayKey(new Date(Date.now() - days * 86_400_000));
  const rows = await ReviewLog.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.userId), day: { $gte: since } } },
    { $group: { _id: "$day", count: { $sum: 1 } } },
  ]);
  res.json({ activity: Object.fromEntries(rows.map((r) => [r._id, r.count])) });
}
