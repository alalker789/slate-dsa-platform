export default function GraphView({ graph, current, visited = [], frontier = [], activeEdge }) {
  const nodes = Object.keys(graph);
  const W = 520, H = 340, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 42;
  const pos = Object.fromEntries(nodes.map((n, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
    return [n, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }];
  }));
  const seen = new Set();
  const edges = [];
  nodes.forEach((u) => graph[u].forEach((v) => {
    const key = [u, v].sort().join("-");
    if (seen.has(key)) return;
    seen.add(key);
    const active = activeEdge && ((activeEdge[0] === u && activeEdge[1] === v) || (activeEdge[0] === v && activeEdge[1] === u));
    edges.push(<line key={key} x1={pos[u].x} y1={pos[u].y} x2={pos[v].x} y2={pos[v].y} className={"graph-edge" + (active ? " active" : "")} />);
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {edges}
      {nodes.map((n) => {
        const cls = "graph-node" + (current === n ? " current" : visited.includes(n) ? " visited" : "") + (frontier.includes(n) && current !== n ? " frontier" : "");
        return (
          <g key={n} className={cls}>
            <circle cx={pos[n].x} cy={pos[n].y} r="19" />
            <text x={pos[n].x} y={pos[n].y + 4}>{n}</text>
          </g>
        );
      })}
    </svg>
  );
}
