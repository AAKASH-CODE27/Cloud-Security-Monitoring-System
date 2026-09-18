import React from "react";
import { useSocket } from "./SocketProvider";
import "./RealTimeNotification.css";

export function RealTimeStatusIndicator({ className = "" }) {
  const { isConnected } = useSocket();

  return (
    <div
      className={`realtime-status-pill ${
        isConnected ? "connected" : "disconnected"
      } ${className}`}
      title={
        isConnected
          ? "Socket.IO Live Stream Active"
          : "Socket.IO Disconnected / Reconnecting"
      }
    >
      <span className={`pulse-dot ${isConnected ? "online" : "offline"}`} />
      <span>{isConnected ? "LIVE SOC FEED" : "OFFLINE"}</span>
    </div>
  );
}

export default RealTimeStatusIndicator;
