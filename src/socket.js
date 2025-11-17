import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL || "https://backend-manpro.web.id", {
  transports: ["polling", "websocket"],
  withCredentials: true,
});