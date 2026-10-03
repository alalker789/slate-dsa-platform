import { useMemo } from "react";

const dayKey = (d) => d.toISOString().slice(0, 10);

/** GitHub-style activity grid: 13 weeks x 7 days, coloured by number of reviews that day. */
export default function Heatmap({ activity = {}, weeks = 13 }) {
  const cells = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today.getTime() - ((weeks - 1) * 7 + today.getUTCDay()) * 86_400_000);
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(start.getTime() + i * 86_400_000);
      const key = dayKey(d);
      return { key, count: activity[key] || 0, future: d > today };
    });
  }, [activity, weeks]);

  const level = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 15 ? 3 : 4);
  return (
    <div className="heatmap" role="img" aria-label="Review activity over the last 13 weeks">
      {cells.map((c) => (
        <div key={c.key} className={`heat heat-${c.future ? "x" : level(c.count)}`} title={`${c.key}: ${c.count} review${c.count === 1 ? "" : "s"}`} />
      ))}
    </div>
  );
}
