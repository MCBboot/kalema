"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRoom } from "@/store/roomStore";

const STORAGE_KEY = "kalema_player";
const NAME_STORAGE_KEY = "kalema_display_name";

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

function loadDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(NAME_STORAGE_KEY);
  } catch { return null; }
}

function saveDisplayName(name: string | null) {
  if (typeof window === "undefined") return;
  if (name) {
    localStorage.setItem(NAME_STORAGE_KEY, name);
  } else {
    localStorage.removeItem(NAME_STORAGE_KEY);
  }
}

interface PlayerState {
  myPlayerId: string | null;
  myDisplayName: string | null;
  /** Global display name persisted across rooms */
  savedDisplayName: string | null;
  isAdmin: boolean;
  hydrated: boolean;
  setMyPlayer: (id: string, name: string) => void;
  clearPlayer: () => void;
  /** Save display name globally (persists across rooms) */
  setSavedDisplayName: (name: string) => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  const [savedDisplayName, setSavedDisplayNameState] = useState<string | null>(null);
  const { room } = useRoom();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadPlayer();
    if (saved) {
      setMyPlayerId(saved.id);
      setMyDisplayName(saved.name);
    }
    const savedName = loadDisplayName();
    if (savedName) setSavedDisplayNameState(savedName);
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

  const setSavedDisplayName = useCallback((name: string) => {
    setSavedDisplayNameState(name);
    saveDisplayName(name);
  }, []);

  return (
    <PlayerContext.Provider value={{ myPlayerId, myDisplayName, savedDisplayName, isAdmin, hydrated, setMyPlayer, clearPlayer, setSavedDisplayName }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
