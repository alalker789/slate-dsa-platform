import test from "node:test";
import assert from "node:assert/strict";
import { schedule, isMastered } from "../src/services/srs.js";
import { nextStreak, levelFromXp, levelBounds } from "../src/services/rewards.js";

const NOW = Date.UTC(2026, 0, 10, 12);
const DAY = 86_400_000;

test("new card rated good is due in 1 day, then 6, then ef-scaled", () => {
  const a = schedule(null, "good", NOW);
  assert.equal(a.interval, 1);
  assert.equal(a.due.getTime(), NOW + DAY);
  const b = schedule(a, "good", NOW);
  assert.equal(b.interval, 6);
  const c = schedule(b, "good", NOW);
  assert.equal(c.interval, Math.round(6 * b.ef));
  assert.equal(c.reps, 3);
});

test("failing a card resets reps, counts a lapse and re-queues within a minute", () => {
  const learned = schedule(schedule(null, "good", NOW), "good", NOW);
  const failed = schedule(learned, "again", NOW);
  assert.equal(failed.reps, 0);
  assert.equal(failed.lapses, 1);
  assert.equal(failed.due.getTime(), NOW + 60_000);
});

test("ease factor never drops below 1.3", () => {
  let s = null;
  for (let i = 0; i < 20; i++) s = schedule(s, "again", NOW);
  assert.equal(s.ef, 1.3);
});

test("easy raises ease, hard lowers it", () => {
  assert.ok(schedule(null, "easy", NOW).ef > 2.5);
  assert.ok(schedule(null, "hard", NOW).ef < 2.5);
});

test("mastered = 3+ reps and 14+ day interval", () => {
  assert.equal(isMastered({ reps: 3, interval: 14 }), true);
  assert.equal(isMastered({ reps: 2, interval: 30 }), false);
  assert.equal(isMastered(null), false);
});

test("streak: same day unchanged, consecutive day +1, gap resets", () => {
  const d1 = new Date(Date.UTC(2026, 0, 10, 9));
  let s = nextStreak(null, d1);
  assert.equal(s.count, 1);
  assert.deepEqual(nextStreak(s, new Date(Date.UTC(2026, 0, 10, 23))), s);
  s = nextStreak(s, new Date(Date.UTC(2026, 0, 11, 8)));
  assert.equal(s.count, 2);
  s = nextStreak(s, new Date(Date.UTC(2026, 0, 14, 8)));
  assert.equal(s.count, 1);
  assert.equal(s.best, 2);
});

test("levels follow 50*(n-1)^2 boundaries", () => {
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(49), 1);
  assert.equal(levelFromXp(50), 2);
  assert.equal(levelFromXp(200), 3);
  assert.deepEqual(levelBounds(3), { from: 200, to: 450 });
});
