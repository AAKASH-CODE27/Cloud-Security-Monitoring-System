import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../AuthContext";
import { getSocket, disconnectSocket } from "./socket";
import { toast } from "react-toastify";

export const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
        setIsConnected(true);
      };

      const onDisconnect = () => {
        setIsConnected(false);
      };

      const onConnectError = () => {
        setIsConnected(false);
      };

      // Real-time toast notifications
      const onAlertCreated = (alert) => {
        if (alert?.severity === "CRITICAL") {
          toast.error(`🚨 CRITICAL ALERT: ${alert.title || alert.description}`, {
            autoClose: 5000,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      };

      const onAlertUpdated = () => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      };

      const onIncidentEvent = (incident) => {
        if (incident?.severity === "CRITICAL") {
          toast.warn(`⚠️ Critical Incident: ${incident.title}`);
        }
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      };

      const onVulnerabilityEvent = () => {
        queryClient.invalidateQueries({ queryKey: ["vulnerabilities"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["assets"] });
      };

      const onAssetEvent = () => {
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      };

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("connect_error", onConnectError);

      s.on("alert:created", onAlertCreated);
      s.on("alert:updated", onAlertUpdated);
      s.on("incident:created", onIncidentEvent);
      s.on("incident:updated", onIncidentEvent);
      s.on("vulnerability:created", onVulnerabilityEvent);
      s.on("vulnerability:updated", onVulnerabilityEvent);
      s.on("vulnerability:resolved", onVulnerabilityEvent);
      s.on("asset:created", onAssetEvent);
      s.on("asset:updated", onAssetEvent);
      s.on("asset:discovered", onAssetEvent);

      return () => {
        s.off("connect", onConnect);
        s.off("disconnect", onDisconnect);
        s.off("connect_error", onConnectError);

        s.off("alert:created", onAlertCreated);
        s.off("alert:updated", onAlertUpdated);
        s.off("incident:created", onIncidentEvent);
        s.off("incident:updated", onIncidentEvent);
        s.off("vulnerability:created", onVulnerabilityEvent);
        s.off("vulnerability:updated", onVulnerabilityEvent);
        s.off("vulnerability:resolved", onVulnerabilityEvent);
        s.off("asset:created", onAssetEvent);
        s.off("asset:updated", onAssetEvent);
        s.off("asset:discovered", onAssetEvent);
      };
    } else {
      setIsConnected(false);
      disconnectSocket();
      socketRef.current = null;
      setSocket(null);
    }
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
export default SocketProvider;
