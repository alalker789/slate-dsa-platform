import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/index.js";
import { useAsync } from "../hooks/useAsync.js";
import { useProgress } from "../context/ProgressContext.jsx";
import LangBar from "../components/LangBar.jsx";
import CodeCard from "../components/CodeCard.jsx";
import InfoGrid from "../components/InfoGrid.jsx";
import ArrayVisualizer from "../features/visualizer/ArrayVisualizer.jsx";
import TreeVisualizer from "../features/visualizer/TreeVisualizer.jsx";
import GraphVisualizer from "../features/visualizer/GraphVisualizer.jsx";

const VISUALIZERS = { array: ArrayVisualizer, tree: TreeVisualizer, graph: GraphVisualizer };
const CATEGORY_LABEL = { sorting: "Sorting", searching: "Searching", tree: "Binary Search Tree", graph: "Graph Traversal" };

export default function Learn() {
  const { slug } = useParams();
  const nav = useNavigate();
  const list = useAsync(() => api.algorithms(), []);
  const algos = list.data?.algorithms || [];
  const current = slug || algos[0]?.slug;

  const groups = algos.reduce((m, a) => ((m[a.category] ||= []).push(a), m), {});

  return (
    <>
      <LangBar />
      <div className="layout">
        <nav className="index">
          {Object.entries(groups).map(([cat, items]) => (
            <div key={cat}>
              <div className="index-group">{CATEGORY_LABEL[cat] || cat}</div>
              {items.map((a) => (
                <button key={a.slug} className={a.slug === current ? "active" : ""} onClick={() => nav(`/learn/${a.slug}`)}>{a.name}</button>
              ))}
            </div>
          ))}
          <div className="index-note">Finish a visualization for the first time to earn 20 XP. Colours mean the same thing everywhere.</div>
        </nav>
        <main className="board">
          {list.loading ? <div className="empty-note">Loading…</div> : current && <Workspace key={current} slug={current} />}
          {list.error && <div className="error-banner">{list.error.message}</div>}
        </main>
      </div>
    </>
  );
}

function Workspace({ slug }) {
  const { data, error, loading } = useAsync(() => api.algorithm(slug), [slug]);
  const { refresh } = useProgress();
  const [line, setLine] = useState(-1);
  const reported = useRef(false);

  if (loading) return <div className="empty-note">Loading…</div>;
  if (error) return <div className="error-banner">{error.message}</div>;
  const algo = data.algorithm;
  const Viz = VISUALIZERS[algo.kind];

  const onStep = ({ line, atEnd }) => {
    setLine(line);
    if (atEnd && !reported.current) {
      reported.current = true; // once per visit; the server also guards against double XP
      api.completeAlgorithm(slug).then((r) => r.firstTime && refresh()).catch(() => {});
    }
  };

  return (
    <section className="panel active">
      <div className="panel-head">
        <h2>{algo.name}</h2>
        <p>{algo.summary}</p>
      </div>
      <Viz algo={algo} onStep={onStep} />
      <div className="two-col">
        <CodeCard code={algo.code} activeLine={line} />
        <InfoGrid cells={algo.complexity} />
      </div>
    </section>
  );
}
