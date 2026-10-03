import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/index.js";
import { tokenStore, setUnauthorizedHandler } from "../api/http.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(tokenStore.get());
  const [booting, setBooting] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  useEffect(() => {
    if (!token) return setBooting(false);
    api.me().then((r) => setUser(r.user)).catch(() => {}).finally(() => setBooting(false));
  }, [token]);

  const authenticate = useCallback(async (call, payload) => {
    const r = await call(payload);
    tokenStore.set(r.token);
    setUser(r.user);
    setToken(r.token);
  }, []);

  const value = useMemo(
    () => ({
      user, token, booting, logout,
      login: (p) => authenticate(api.login, p),
      register: (p) => authenticate(api.register, p),
    }),
    [user, token, booting, logout, authenticate],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
