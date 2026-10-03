import { Link } from "react-router-dom";
import { api } from "../api/index.js";
import Heatmap from "../components/Heatmap.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { useProgress } from "../context/ProgressContext.jsx";

export default function Dashboard() {
  const { summary: s } = useProgress();
  const act = useAsync(() => api.activity(), []);
  if (!s) return <div className="empty-note">Loading your progress…</div>;

  const { from, to } = s.levelBounds;
  const pct = Math.min(100, Math.round(((s.xp - from) / (to - from)) * 100));

  return (
    <main className="board">
      <div className="panel-head">
        <h2>Welcome back, {s.name.split(" ")[0]}</h2>
        <p>
          {s.cards.due + s.cards.new > 0
            ? `${s.cards.due} card${s.cards.due === 1 ? "" : "s"} due and ${s.cards.new} new to learn today.`
            : "You're all caught up. Explore a new visualizer while you wait."}
        </p>
      </div>

      <div className="mem-stats">
        <Stat n={s.cards.due} l="due now" />
        <Stat n={s.cards.new} l="new" />
        <Stat n={s.cards.learning} l="learning" />
        <Stat n={s.cards.mastered} l="mastered" />
        <Stat n={`${s.streak?.count || 0}🔥`} l={`day streak (best ${s.streak?.best || 0})`} />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="progress-line"><span>Level {s.level}</span><span>{s.xp} / {to} XP</span></div>
        <div className="bar-track"><div className="bar-fill" style={{ width: pct + "%" }} /></div>
      </div>

      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <h4 className="card-title">Review activity · last 13 weeks</h4>
          <Heatmap activity={act.data?.activity} />
        </div>
        <div className="card">
          <h4 className="card-title">Algorithms explored · {s.algorithms.explored.length} / {s.algorithms.total}</h4>
          <div className="chip-row">
            {s.algorithms.explored.length === 0 && <span className="hint">Watch any visualizer to the end to earn XP.</span>}
            {s.algorithms.explored.map((slug) => <Link key={slug} className="chip" to={`/learn/${slug}`}>{slug}</Link>)}
          </div>
        </div>
      </div>

      <div className="btn-row">
        <Link className="btn primary" to="/review">Start review</Link>
        <Link className="btn" to="/learn">Open visualizers</Link>
      </div>
    </main>
  );
}

const Stat = ({ n, l }) => (
  <div className="mem-stat"><div className="n">{n}</div><div className="l">{l}</div></div>
);
