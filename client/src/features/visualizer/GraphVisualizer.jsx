import { useMemo, useState } from "react";
import GraphView from "./GraphView.jsx";
import PlayerControls from "../../components/PlayerControls.jsx";
import { usePlayer } from "../../hooks/usePlayer.js";
import { useReportStep } from "../../hooks/useReportStep.js";
import { DEFAULT_GRAPH, bfsSteps, dfsSteps, withEdge } from "./algorithms/graph.js";

export default function GraphVisualizer({ algo, onStep }) {
  const [graph, setGraph] = useState(DEFAULT_GRAPH);
  const [start, setStart] = useState("A");
  const [edge, setEdge] = useState("");
  const [speed, setSpeed] = useState(600);
  const [error, setError] = useState("");

  const steps = useMemo(() => (algo.slug === "bfs" ? bfsSteps : dfsSteps)(graph, graph[start] ? start : Object.keys(graph)[0]), [algo.slug, graph, start]);
  const player = usePlayer(steps, 1350 - speed);
  useReportStep(onStep, -1, player.atEnd);

  const addEdge = () => {
    const m = edge.trim().toUpperCase().match(/^([A-Z0-9]+)\s*-\s*([A-Z0-9]+)$/);
    if (!m) return setError("Use the form A-B");
    setError("");
    setGraph((g) => withEdge(g, m[1], m[2]));
    setEdge("");
  };

  const s = player.step;
  return (
    <>
      <div className="controls">
        <label>Start node
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            {Object.keys(graph).map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label>Add edge
          <div className="btn-row">
            <input className="txt" style={{ width: 80 }} placeholder="A-D" value={edge} onChange={(e) => setEdge(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEdge()} />
            <button className="btn" onClick={addEdge}>Add</button>
          </div>
        </label>
        <button className="btn ghost" onClick={() => { setGraph(DEFAULT_GRAPH); setStart("A"); }}>Reset graph</button>
        <label>Speed
          <input type="range" min="150" max="1200" step="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="stage"><GraphView graph={graph} current={s?.current} visited={s?.visited} frontier={s?.frontier} activeEdge={s?.activeEdge} /></div>
      <PlayerControls player={player} playLabel="Traverse">
        <span>Frontier: {s?.frontier?.length ? s.frontier.join(", ") : "—"}</span>
      </PlayerControls>
    </>
  );
}
