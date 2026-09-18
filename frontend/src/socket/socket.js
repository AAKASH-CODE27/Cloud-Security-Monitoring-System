import { io } from "socket.io-client";

function resolveSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    try {
      return new URL(import.meta.env.VITE_API_URL).origin;
    } catch (e) {
      // Fall through
    }
  }
  return "http://localhost:8080";
}

const SOCKET_URL = resolveSocketUrl();

let socketInstance = null;

export function getSocket(token) {
  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });
  } else {
    socketInstance.auth = { token };
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
