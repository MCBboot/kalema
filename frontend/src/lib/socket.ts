import { io, Socket } from "socket.io-client";

function getSocketUrl(): string {
  // Explicit backend URL (for Docker or custom setups)
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;

  if (typeof window !== "undefined") {
    // Connect to same origin — reverse proxy routes /socket.io to backend
    return window.location.origin;
  }
  return "http://localhost:26033";
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
