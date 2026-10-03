import { useMemo, useState } from "react";
import ArrayBars from "./ArrayBars.jsx";
import PlayerControls from "../../components/PlayerControls.jsx";
import { usePlayer } from "../../hooks/usePlayer.js";
import { useReportStep } from "../../hooks/useReportStep.js";
import { randomArray } from "./algorithms/helpers.js";
import { sortGenerators } from "./algorithms/sorting.js";
import { searchGenerators } from "./algorithms/searching.js";

/** Handles every algorithm whose kind is "array": the 5 sorts and 2 searches. */
export default function ArrayVisualizer({ algo, onStep }) {
  const isSearch = algo.category === "searching";
  const [arr, setArr] = useState(() => randomArray(12));
  const [target, setTarget] = useState(() => arr[3]);
  const [speed, setSpeed] = useState(450);
  const [custom, setCustom] = useState("");

  const steps = useMemo(() => {
    const gen = isSearch ? searchGenerators[algo.slug] : sortGenerators[algo.slug];
    return isSearch ? gen(arr, Number(target)) : gen(arr);
  }, [algo.slug, isSearch, arr, target]);

  const player = usePlayer(steps, 1100 - speed);
  useReportStep(onStep, player.step?.line ?? -1, player.atEnd);

  const shuffle = (n = arr.length) => { const a = randomArray(n); setArr(a); setTarget(a[Math.floor(Math.random() * a.length)]); };
  const applyCustom = () => {
    const vals = custom.split(",").map((s) => parseInt(s.trim(), 10)).filter((v) => !Number.isNaN(v)).slice(0, 30);
    if (vals.length >= 2) setArr(vals);
  };

  return (
    <>
      <div className="controls">
        <label>Array size
          <input type="range" min="6" max="24" value={arr.length} onChange={(e) => shuffle(+e.target.value)} />
        </label>
        <label>Speed
          <input type="range" min="80" max="1000" step="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
        {isSearch && (
          <label>Target value
            <input className="txt" type="number" style={{ width: 80 }} value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
        )}
        <label>Custom array
          <div className="btn-row">
            <input className="txt" style={{ width: 150 }} placeholder="e.g. 8,3,9,1,5" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyCustom()} />
            <button className="btn" onClick={applyCustom}>Apply</button>
          </div>
        </label>
        <button className="btn" onClick={() => shuffle()}>Shuffle new array</button>
      </div>
      <div className="stage"><ArrayBars step={player.step} /></div>
      <PlayerControls player={player}><span>{algo.name}</span></PlayerControls>
    </>
  );
}
