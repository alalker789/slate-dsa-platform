// SM-2 spaced repetition, ported from the original Slate prototype but made pure so it is unit-testable.

export const RATINGS = {
  again: { quality: 0, xp: 1 },
  hard: { quality: 3, xp: 5 },
  good: { quality: 4, xp: 10 },
  easy: { quality: 5, xp: 15 },
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * @param prev  existing state ({ ef, reps, interval, lapses }) or null for a new card
 * @param rating "again" | "hard" | "good" | "easy"
 * @returns the next state, including the `due` date
 */
export function schedule(prev, rating, now = Date.now()) {
  const { quality } = RATINGS[rating];
  const s = { ef: 2.5, reps: 0, interval: 0, lapses: 0, ...(prev || {}) };

  if (quality < 3) {
    s.reps = 0;
    s.interval = 1;
    s.lapses += 1;
  } else {
    s.interval = s.reps === 0 ? 1 : s.reps === 1 ? 6 : Math.round(s.interval * s.ef);
    s.reps += 1;
  }
  s.ef = Math.max(1.3, s.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  // A failed card comes back in a minute; a passed one after `interval` days.
  s.due = new Date(quality < 3 ? now + 60_000 : now + s.interval * DAY);
  return s;
}

export const isMastered = (s) => !!s && s.reps >= 3 && s.interval >= 14;
