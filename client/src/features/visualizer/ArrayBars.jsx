/** Bar chart for sorting & searching frames. Colours come from the shared legend (compare / swap / sorted / pivot). */
export default function ArrayBars({ step }) {
  if (!step) return null;
  const { arr, compare = [], swap = [], sorted = [], pivot = null } = step;
  const n = arr.length, max = Math.max(...arr, 1);
  const W = Math.max(640, n * 34), H = 220, gap = 8;
  const barW = Math.max((W - gap * (n + 1)) / n, 14);

  return (
    <svg className="array-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Array visualization">
      {arr.map((v, i) => {
        const h = (v / max) * (H - 56), x = gap + i * (barW + gap);
        const cls = ["bar", sorted.includes(i) && "bar-sorted", compare.includes(i) && "bar-compare", swap.includes(i) && "bar-swap", pivot === i && "bar-pivot"].filter(Boolean).join(" ");
        return (
          <g key={i}>
            <rect x={x} y={H - 30 - h} width={barW} height={Math.max(h, 2)} rx="3" className={cls} />
            {barW > 16 && <text x={x + barW / 2} y={H - 12} className="bar-label" textAnchor="middle">{v}</text>}
          </g>
        );
      })}
    </svg>
  );
}
