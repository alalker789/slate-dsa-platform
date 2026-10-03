import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { token, booting } = useAuth();
  const loc = useLocation();
  if (booting) return <div className="empty-note">Loading…</div>;
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
