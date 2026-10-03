import { useMemo, useState } from "react";
import TreeView from "./TreeView.jsx";
import PlayerControls from "../../components/PlayerControls.jsx";
import { usePlayer } from "../../hooks/usePlayer.js";
import { useReportStep } from "../../hooks/useReportStep.js";
import { buildTree, insertNode, treeSteps } from "./algorithms/tree.js";
import { randInt } from "./algorithms/helpers.js";

export default function TreeVisualizer({ algo, onStep }) {
  const [root, setRoot] = useState(() => buildTree([8, 4, 12, 2, 6, 10, 14]));
  const [value, setValue] = useState("");
  const [speed, setSpeed] = useState(600);

  const steps = useMemo(() => (root ? treeSteps(root, algo.slug) : []), [root, algo.slug]);
  const player = usePlayer(steps, 1350 - speed);
  useReportStep(onStep, -1, player.atEnd);

  const insert = () => {
    const v = parseInt(value, 10);
    if (!Number.isNaN(v)) { setRoot((r) => insertNode(r, v)); setValue(""); }
  };
  const random = () => {
    const s = new Set();
    while (s.size < 9) s.add(randInt(1, 99));
    setRoot(buildTree([...s]));
  };

  return (
    <>
      <div className="controls">
        <label>Value
          <input className="txt" style={{ width: 90 }} placeholder="e.g. 12" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && insert()} />
        </label>
        <button className="btn" onClick={insert}>Insert</button>
        <button className="btn" onClick={random}>Random tree</button>
        <button className="btn ghost" onClick={() => setRoot(null)}>Clear</button>
        <label>Speed
          <input type="range" min="150" max="1200" step="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
      </div>
      <div className="stage">
        <TreeView root={root} current={player.step?.current} visited={player.step?.visited} />
      </div>
      <PlayerControls player={player} playLabel="Traverse">
        <span>Visit order: {player.step ? player.step.visited.join(", ") : "—"}</span>
      </PlayerControls>
    </>
  );
}
