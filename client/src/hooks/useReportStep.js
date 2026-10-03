import { useEffect, useRef } from "react";

/** Lets a visualizer tell its parent which code line is active and whether playback finished (via an effect, never during render). */
export function useReportStep(onStep, line, atEnd) {
  const ref = useRef(onStep);
  ref.current = onStep;
  useEffect(() => { ref.current?.({ line, atEnd }); }, [line, atEnd]);
}
