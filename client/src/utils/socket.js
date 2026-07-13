import { io } from "socket.io-client";

function apiBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

export function createSmartSellSocket(token) {
  return io(apiBaseUrl(), {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });
}
