import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext({ socket: null, online: null });
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [state, setState] = useState({ socket: null, online: null });

  useEffect(() => {
    if (!token) return setState({ socket: null, online: null });
    // websocket-only: matches the server and means the load balancer needs no sticky sessions
    const socket = io({ auth: { token }, transports: ["websocket"], reconnectionDelayMax: 10_000 });
    socket.on("presence", (n) => setState((s) => ({ ...s, online: n })));
    setState({ socket, online: null });
    return () => socket.close();
  }, [token]);

  return <SocketContext.Provider value={state}>{children}</SocketContext.Provider>;
}

/** Subscribe to a socket event for the lifetime of a component. */
export function useSocketEvent(event, handler) {
  const { socket } = useSocket();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket) return;
    const fn = (...a) => ref.current(...a);
    socket.on(event, fn);
    return () => socket.off(event, fn);
  }, [socket, event]);
}
