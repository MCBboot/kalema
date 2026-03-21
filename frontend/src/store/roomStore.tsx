"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Room, Player, RoomStatus } from "@/lib/api-types";

interface RoomState {
  room: Room | null;
  setRoom: (room: Room) => void;
  updatePlayers: (players: Player[]) => void;
  updateRoomStatus: (status: RoomStatus) => void;
  clearRoom: () => void;
}

const RoomContext = createContext<RoomState | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoomState] = useState<Room | null>(null);

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

  const state: RoomState = {
    room,
    setRoom,
    updatePlayers,
    updateRoomStatus,
    clearRoom,
  };

  return (
    <RoomContext.Provider value={state}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomState {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
