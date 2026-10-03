import { User } from "../models/User.js";
import { cached } from "../services/cache.js";
import { levelFromXp } from "../services/rewards.js";

export async function leaderboard(req, res) {
  // 1000 learners refreshing the board shouldn't mean 1000 sorts: cache the top list for 10s.
  const top = await cached("leaderboard:top", 10, async () => {
    const rows = await User.find({ xp: { $gt: 0 } }).sort({ xp: -1 }).limit(20).select("name xp streak.count").lean();
    return rows.map((u, i) => ({ rank: i + 1, id: String(u._id), name: u.name, xp: u.xp, level: levelFromXp(u.xp), streak: u.streak?.count || 0 }));
  });
  const me = await User.findById(req.userId).select("xp").lean();
  const rank = me ? (await User.countDocuments({ xp: { $gt: me.xp } })) + 1 : null; // uses the xp index
  res.json({ top, me: me ? { rank, xp: me.xp } : null });
}
