"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { Room, Player, RoomStatus } from "@/lib/api-types";

const STORAGE_KEY = "kalema_room";

function loadRoom(): Room | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveRoom(room: Room | null) {
  if (typeof window === "undefined") return;
  if (room) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

interface RoomState {
  room: Room | null;
  hydrated: boolean;
  setRoom: (room: Room) => void;
  updatePlayers: (players: Player[]) => void;
  updateRoomStatus: (status: RoomStatus) => void;
  clearRoom: () => void;
}

const RoomContext = createContext<RoomState | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoomState] = useState<Room | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRoomState(loadRoom());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveRoom(room);
  }, [room, hydrated]);

  const setRoom = useCallback((room: Room) => {
    setRoomState(room);
  }, []);

  const updatePlayers = useCallback((players: Player[]) => {
    setRoomState((prev) => (prev ? { ...prev, players } : null));
  }, []);

  const updateRoomStatus = useCallback((status: RoomStatus) => {
    setRoomState((prev) => (prev ? { ...prev, status } : null));
  }, []);

  const clearRoom = useCallback(() => {
    setRoomState(null);
  }, []);

  return (
    <RoomContext.Provider value={{ room, hydrated, setRoom, updatePlayers, updateRoomStatus, clearRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomState {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
