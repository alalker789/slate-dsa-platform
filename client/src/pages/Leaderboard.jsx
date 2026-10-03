import { useCallback, useEffect, useState } from "react";
import { api } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket, useSocketEvent } from "../context/SocketContext.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const { online } = useSocket();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => api.leaderboard().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  // The server nudges clients (throttled) when anyone earns XP, so the board stays live without polling.
  useSocketEvent("leaderboard:dirty", () => setTimeout(load, Math.random() * 3000)); // jitter so 1000 clients don't refetch at once

  return (
    <main className="board">
      <div className="panel-head">
        <h2>Leaderboard</h2>
        <p>Top learners by XP. Updates live{online != null ? ` · ${online} online now` : ""}.</p>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {!data ? <div className="empty-note">Loading…</div> : (
        <div className="card">
          <table className="lb">
            <thead><tr><th>#</th><th>Learner</th><th>Level</th><th>Streak</th><th>XP</th></tr></thead>
            <tbody>
              {data.top.length === 0 && <tr><td colSpan="5" className="empty-note">No XP earned yet. Be the first!</td></tr>}
              {data.top.map((r) => (
                <tr key={r.id} className={r.id === user?.id ? "me" : ""}>
                  <td>{r.rank}</td><td>{r.name}</td><td>{r.level}</td><td>{r.streak ? `🔥 ${r.streak}` : "—"}</td><td className="mono">{r.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.me && <p className="hint" style={{ marginTop: 12 }}>Your rank: <b>#{data.me.rank}</b> with {data.me.xp} XP</p>}
        </div>
      )}
    </main>
  );
}
