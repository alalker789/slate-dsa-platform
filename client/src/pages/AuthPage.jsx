import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { token, login, register } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || "/";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
      nav(from, { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1 className="brand-lg">Slate<span className="dot">.</span></h1>
        <p className="auth-sub">Watch algorithms think. Then make them stick.</p>
        {error && <div className="error-banner">{error}</div>}
        {isRegister && (
          <label>Name<input className="txt" required minLength={2} value={form.name} onChange={set("name")} autoComplete="name" /></label>
        )}
        <label>Email<input className="txt" type="email" required value={form.email} onChange={set("email")} autoComplete="email" /></label>
        <label>Password<input className="txt" type="password" required minLength={isRegister ? 8 : 1} value={form.password} onChange={set("password")} autoComplete={isRegister ? "new-password" : "current-password"} /></label>
        {isRegister && <small className="hint">At least 8 characters.</small>}
        <button className="btn primary" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Log in"}</button>
        <p className="auth-switch">
          {isRegister ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
        </p>
      </form>
    </div>
  );
}
