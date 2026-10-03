import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const { summary, toast } = useProgress();
  const { online } = useSocket();

  return (
    <div className="app">
      <header className="board-header topbar">
        <div className="brand">
          <h1>Slate<span className="dot">.</span></h1>
          <p>Watch algorithms think, then make them stick.</p>
        </div>
        <nav className="topnav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/learn">Learn</NavLink>
          <NavLink to="/review">Review</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
        </nav>
        <div className="userbar">
          {online != null && <span className="online" title="Learners online right now"><i /> {online} online</span>}
          {summary && (
            <span className="chip" title={`${summary.xp} XP total`}>
              Lv {summary.level} · {summary.xp} XP{summary.streak?.count ? ` · 🔥 ${summary.streak.count}` : ""}
            </span>
          )}
          <span className="who">{user?.name}</span>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <Outlet />
      {toast && <div key={toast.id} className="xp-toast">{toast.text}</div>}
    </div>
  );
}
