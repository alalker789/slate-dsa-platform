import { useCallback, useEffect, useState } from "react";

/**
 * Step player shared by every visualizer.
 * `steps` is an array of frames produced by a pure generator; `delayMs` is the autoplay interval.
 */
export function usePlayer(steps, delayMs) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = Math.max(steps.length - 1, 0);

  // New steps (different algorithm / array / tree) -> rewind. Done during render, not in an effect,
  // so it never runs on mount and can't race with a user's first click.
  const [prevSteps, setPrevSteps] = useState(steps);
  if (prevSteps !== steps) {
    setPrevSteps(steps);
    setIdx(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, last)), delayMs);
    return () => clearInterval(t);
  }, [playing, delayMs, last]);

  useEffect(() => { if (playing && idx >= last) setPlaying(false); }, [playing, idx, last]);

  const toggle = useCallback(() => {
    if (!playing && idx >= last) setIdx(0);
    setPlaying((p) => !p);
  }, [playing, idx, last]);

  return {
    idx, total: steps.length, step: steps[idx], playing,
    atEnd: steps.length > 1 && idx >= last,
    toggle,
    next: () => { setPlaying(false); setIdx((i) => Math.min(i + 1, last)); },
    prev: () => { setPlaying(false); setIdx((i) => Math.max(i - 1, 0)); },
    reset: () => { setPlaying(false); setIdx(0); },
  };
}
