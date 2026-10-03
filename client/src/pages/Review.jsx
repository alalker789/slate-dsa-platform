import { useCallback, useEffect, useState } from "react";
import { api } from "../api/index.js";
import { useAsync } from "../hooks/useAsync.js";
import { useProgress } from "../context/ProgressContext.jsx";

const RATINGS = [
  { id: "again", label: "Again", cls: "rate-again", key: "1" },
  { id: "hard", label: "Hard", cls: "rate-hard", key: "2" },
  { id: "good", label: "Good", cls: "rate-good", key: "3" },
  { id: "easy", label: "Easy", cls: "rate-easy", key: "4" },
];

export default function Review() {
  const cats = useAsync(() => api.categories(), []);
  const [cat, setCat] = useState("All");
  const { refresh } = useProgress();
  const [queue, setQueue] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ done: 0, xp: 0 });

  useEffect(() => {
    setQueue(null); setFlipped(false); setStats({ done: 0, xp: 0 });
    api.session(cat).then((r) => setQueue(r.cards)).catch((e) => setError(e.message));
  }, [cat]);

  const card = queue?.[0];

  const rate = useCallback(async (rating) => {
    if (!card) return;
    setFlipped(false);
    // Optimistic: move on immediately; "again" re-queues the card at the end of this session.
    setQueue((q) => (rating === "again" ? [...q.slice(1), q[0]] : q.slice(1)));
    try {
      const r = await api.review(card.id, rating);
      setStats((s) => ({ done: s.done + 1, xp: s.xp + r.gained }));
    } catch (e) { setError(e.message); }
  }, [card]);

  useEffect(() => {
    if (!queue?.length && queue !== null) refresh();
  }, [queue, refresh]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      const r = RATINGS.find((x) => x.key === e.key);
      if (r && flipped) rate(r.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate]);

  return (
    <main className="board">
      <div className="panel-head">
        <h2>Review</h2>
        <p>Spaced repetition (SM-2), scheduled on the server so your progress follows you across devices. Space flips the card; 1–4 rates it.</p>
      </div>
      <div className="cat-row">
        {["All", ...(cats.data?.categories || [])].map((c) => (
          <button key={c} className={"cat-chip" + (c === cat ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      {error && <div className="error-banner">{error}</div>}
      {queue === null ? <div className="empty-note">Loading cards…</div> : !card ? (
        <div className="mem-done">
          <h3>{stats.done ? "Session complete 🎉" : "All caught up for now"}</h3>
          <p style={{ marginTop: 8 }}>{stats.done ? `You reviewed ${stats.done} card${stats.done === 1 ? "" : "s"} and earned ${stats.xp} XP.` : "Nothing due in this category. Come back later or switch categories."}</p>
        </div>
      ) : (
        <>
          <div className="progress-line"><span>{queue.length} left</span><span>{stats.done} reviewed · +{stats.xp} XP</span></div>
          <div className="card-scene">
            <div className={"flashcard" + (flipped ? " flipped" : "")} onClick={() => setFlipped((f) => !f)}>
              <div className="face front"><div className="eyebrow">{card.cat}{card.state === "new" ? " · NEW" : ""}</div><div className="txt">{card.front}</div></div>
              <div className="face back"><div className="eyebrow">ANSWER</div><div className="txt">{card.back}</div></div>
            </div>
          </div>
          <div className="flip-hint">{flipped ? "" : "Click the card (or press Space) to reveal the answer"}</div>
          {flipped && (
            <div className="rate-row">
              {RATINGS.map((r) => <button key={r.id} className={"rate-btn " + r.cls} onClick={() => rate(r.id)}>{r.label} <small>({r.key})</small></button>)}
            </div>
          )}
        </>
      )}
    </main>
  );
}
