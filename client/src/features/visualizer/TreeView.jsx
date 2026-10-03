import { layoutTree } from "./algorithms/tree.js";

export default function TreeView({ root, current, visited = [] }) {
  if (!root) return <div className="empty-note">Tree is empty. Insert a value to begin.</div>;
  const pos = layoutTree(root);
  const sx = 58, sy = 76, pad = 32;
  const vals = Object.keys(pos);
  const maxX = Math.max(...vals.map((k) => pos[k].x)), maxY = Math.max(...vals.map((k) => pos[k].y));
  const W = Math.max(pad * 2 + maxX * sx + 40, 400), H = pad * 2 + maxY * sy + 40;
  const off = (W - (pad * 2 + maxX * sx + 40)) / 2;
  const at = (v) => ({ cx: pad + pos[v].x * sx + 20 + off, cy: pad + pos[v].y * sy + 20 });

  const edges = [], nodes = [];
  (function walk(n) {
    if (!n) return;
    const a = at(n.value);
    [n.left, n.right].forEach((c) => c && edges.push(<line key={`${n.value}-${c.value}`} x1={a.cx} y1={a.cy} x2={at(c.value).cx} y2={at(c.value).cy} className="tree-edge" />));
    const cls = "tree-node" + (current === n.value ? " node-visiting" : visited.includes(n.value) ? " node-visited" : "");
    nodes.push(
      <g key={n.value} className={cls}>
        <circle cx={a.cx} cy={a.cy} r="19" />
        <text x={a.cx} y={a.cy + 4}>{n.value}</text>
      </g>,
    );
    walk(n.left); walk(n.right);
  })(root);

  return <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>{edges}{nodes}</svg>;
}
