import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/index.js";
import { useAuth } from "./AuthContext.jsx";
import { useSocketEvent } from "./SocketContext.jsx";

const ProgressContext = createContext(null);
export const useProgress = () => useContext(ProgressContext);

export function ProgressProvider({ children }) {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => api.summary().then(setSummary).catch(() => {}), []);
  useEffect(() => { token ? refresh() : setSummary(null); }, [token, refresh]);

  // Server pushes XP changes (also keeps a second open tab in sync).
  useSocketEvent("xp:gained", (p) => {
    setSummary((s) => (s ? { ...s, xp: p.xp, level: p.level, streak: p.streak } : s));
    setToast({ id: Date.now(), text: `+${p.gained} XP` });
  });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  return <ProgressContext.Provider value={{ summary, refresh, toast }}>{children}</ProgressContext.Provider>;
}
