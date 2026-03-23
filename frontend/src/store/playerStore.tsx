"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRoom } from "@/store/roomStore";

const STORAGE_KEY = "kalema_player";

function loadPlayer(): { id: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePlayer(id: string | null, name: string | null) {
  if (typeof window === "undefined") return;
  if (id && name) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadPlayer();
    if (saved) {
      setMyPlayerId(saved.id);
      setMyDisplayName(saved.name);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePlayer(myPlayerId, myDisplayName);
  }, [myPlayerId, myDisplayName, hydrated]);

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

  return (
    <PlayerContext.Provider value={{ myPlayerId, myDisplayName, isAdmin, setMyPlayer, clearPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
