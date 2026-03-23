"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePlayer } from "@/store/playerStore";

interface ImpostorState {
  role: "impostor" | "normal" | null;
  word: string | null;
}

interface ImpostorContextType extends ImpostorState {
  setRole: (role: "impostor" | "normal", word?: string) => void;
  clearRole: () => void;
  hydrated: boolean;
}

function getStorageKey(playerId: string | null): string {
  return playerId ? `kalema_impostor_${playerId}` : "kalema_impostor";
}

function loadState(playerId: string | null): ImpostorState {
  if (typeof window === "undefined") return { role: null, word: null };
  try {
    const raw = localStorage.getItem(getStorageKey(playerId));
    return raw ? JSON.parse(raw) : { role: null, word: null };
  } catch {
    return { role: null, word: null };
  }
}

function saveState(state: ImpostorState, playerId: string | null) {
  if (typeof window === "undefined") return;
  const key = getStorageKey(playerId);
  if (state.role) {
    localStorage.setItem(key, JSON.stringify(state));
  } else {
    localStorage.removeItem(key);
  }
}

const ImpostorContext = createContext<ImpostorContextType | null>(null);

export function ImpostorProvider({ children }: { children: ReactNode }) {
  const { myPlayerId } = usePlayer();
  const [state, setState] = useState<ImpostorState>({ role: null, word: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState(myPlayerId));
    setHydrated(true);
  }, [myPlayerId]);

  useEffect(() => {
    if (hydrated) saveState(state, myPlayerId);
  }, [state, hydrated, myPlayerId]);

  const setRole = useCallback((role: "impostor" | "normal", word?: string) => {
    setState({ role, word: word || null });
  }, []);

  const clearRole = useCallback(() => {
    setState({ role: null, word: null });
  }, []);

  return (
    <ImpostorContext.Provider value={{ ...state, hydrated, setRole, clearRole }}>
      {children}
    </ImpostorContext.Provider>
  );
}

export function useImpostor(): ImpostorContextType {
  const ctx = useContext(ImpostorContext);
  if (!ctx) throw new Error("useImpostor must be used within ImpostorProvider");
  return ctx;
}
