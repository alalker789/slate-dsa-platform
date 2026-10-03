import { User } from "../models/User.js";
import { events } from "./events.js";

// Level n starts at 50 * (n-1)^2 XP: 0, 50, 200, 450, 800 ...
export const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const levelBounds = (level) => ({ from: 50 * (level - 1) ** 2, to: 50 * level ** 2 });

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10); // UTC day

/** Pure streak update: same day = unchanged, next day = +1, gap = reset to 1. */
export function nextStreak(streak, now = new Date()) {
  const today = dayKey(now);
  const cur = streak || { count: 0, best: 0, lastDay: null };
  if (cur.lastDay === today) return cur;
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const count = cur.lastDay === yesterday ? cur.count + 1 : 1;
  return { count, best: Math.max(cur.best || 0, count), lastDay: today };
}

/**
 * Grants XP, bumps the streak, and tells the socket layer, in ONE atomic update.
 * `filter` lets callers make the grant conditional (e.g. "only if not yet explored");
 * returns null when the filter doesn't match, so concurrent requests can never double-award.
 */
export async function awardXp(userId, amount, { filter = {}, update = {} } = {}) {
  const current = await User.findById(userId).select("streak").lean();
  if (!current) return null;
  // updateOne is atomic and honours `filter`; modifiedCount === 0 means the condition no longer held.
  const res = await User.updateOne(
    { _id: userId, ...filter },
    { ...update, $inc: { xp: amount }, $set: { streak: nextStreak(current.streak) } },
  );
  if (res.modifiedCount === 0) return null;
  const updated = await User.findById(userId).select("xp streak").lean();
  const result = { xp: updated.xp, level: levelFromXp(updated.xp), streak: updated.streak, gained: amount };
  events.emit("xp:gained", { userId: String(userId), ...result });
  return result;
}
