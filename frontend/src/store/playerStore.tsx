"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useRoom } from "@/store/roomStore";

interface PlayerState {
  myPlayerId: string | null;
  myDisplayName: string | null;
  isAdmin: boolean;
  setMyPlayer: (id: string, name: string) => void;
  clearPlayer: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  const { room } = useRoom();

  const isAdmin =
    room !== null &&
    myPlayerId !== null &&
    room.players.some((p) => p.id === myPlayerId && p.isAdmin);

  const setMyPlayer = useCallback((id: string, name: string) => {
    setMyPlayerId(id);
    setMyDisplayName(name);
  }, []);

  const clearPlayer = useCallback(() => {
    setMyPlayerId(null);
    setMyDisplayName(null);
  }, []);

  const state: PlayerState = {
    myPlayerId,
    myDisplayName,
    isAdmin,
    setMyPlayer,
    clearPlayer,
  };

  return (
    <PlayerContext.Provider value={state}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
