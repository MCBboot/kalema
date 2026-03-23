"use client";
import { useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { ClientEvents, ServerEvents } from "@/lib/api-types";
import type { Room, ActionRejectedPayload } from "@/lib/api-types";

// localStorage helpers
export function getStoredReconnectToken(code: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`reconnect_token_${code}`);
}

export function getStoredRoomCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("reconnect_room_code");
}

export function storeReconnectData(code: string, token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`reconnect_token_${code}`, token);
  localStorage.setItem("reconnect_room_code", code);
}

export function clearReconnectData(code?: string): void {
  if (typeof window === "undefined") return;
  const roomCode = code || localStorage.getItem("reconnect_room_code");
  if (roomCode) {
    localStorage.removeItem(`reconnect_token_${roomCode}`);
  }
  localStorage.removeItem("reconnect_room_code");
}

interface SessionRecoveredPayload {
  room: Room;
  playerId: string;
  displayName: string;
  reconnectToken: string;
  gamePlayerData?: unknown;
}

interface UseReconnectCallbacks {
  onSessionRecovered: (data: SessionRecoveredPayload) => void;
  onReconnectFailed: (message: string) => void;
}

export function useReconnect(callbacks: UseReconnectCallbacks) {
  const attemptReconnect = useCallback(
    (code: string) => {
      const token = getStoredReconnectToken(code);
      if (!token) {
        callbacks.onReconnectFailed("No reconnect token");
        return;
      }

      const socket = getSocket();

      const onRecovered = (data: SessionRecoveredPayload) => {
        storeReconnectData(code, data.reconnectToken);
        callbacks.onSessionRecovered(data);
        cleanup();
      };

      const onRejected = (data: ActionRejectedPayload) => {
        clearReconnectData(code);
        callbacks.onReconnectFailed(data.message || "Session expired");
        cleanup();
      };

      function cleanup() {
        socket.off(ServerEvents.SESSION_RECOVERED, onRecovered);
        socket.off(ServerEvents.ACTION_REJECTED, onRejected);
      }

      socket.on(ServerEvents.SESSION_RECOVERED, onRecovered);
      socket.on(ServerEvents.ACTION_REJECTED, onRejected);

      socket.emit(ClientEvents.RECONNECT_SESSION, { token });
    },
    [callbacks]
  );

  return { attemptReconnect };
}
