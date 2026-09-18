import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "../AuthContext";
import { getSocket, disconnectSocket } from "./socket";
import { toast } from "react-toastify";

export const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (user && token) {
      const s = getSocket(token);
      socketRef.current = s;
      setSocket(s);

      if (!s.connected) {
        s.connect();
      }

      const onConnect = () => {
        console.log("[Socket.IO] Connected to server as", user.email);
        setIsConnected(true);
      };

      const onDisconnect = (reason) => {
        console.log("[Socket.IO] Disconnected from server:", reason);
        setIsConnected(false);
      };

      const onConnectError = (err) => {
        console.warn("[Socket.IO] Connection error:", err.message);
        setIsConnected(false);
      };

      // Global critical alert listener for toast notification
      const onAlertCreated = (alert) => {
        if (alert.severity === "CRITICAL") {
          toast.error(`🚨 CRITICAL ALERT: ${alert.title || alert.description}`, {
            autoClose: 5000,
          });
        }
      };

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("connect_error", onConnectError);
      s.on("alert:created", onAlertCreated);

      return () => {
        s.off("connect", onConnect);
        s.off("disconnect", onDisconnect);
        s.off("connect_error", onConnectError);
        s.off("alert:created", onAlertCreated);
      };
    } else {
      setIsConnected(false);
      disconnectSocket();
      socketRef.current = null;
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
export default SocketProvider;
