"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const STORAGE_KEY = "kalema_secret";

function loadSecret(): { role: "impostor" | "normal"; word: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSecret(role: "impostor" | "normal" | null, word: string | null) {
  if (typeof window === "undefined") return;
  if (role) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, word }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

interface SecretState {
  role: "impostor" | "normal" | null;
  word: string | null;
  setRole: (role: "impostor" | "normal", word?: string) => void;
  clearRole: () => void;
}

const SecretContext = createContext<SecretState | null>(null);

export function SecretProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<"impostor" | "normal" | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSecret();
    if (saved) {
      setRoleState(saved.role);
      setWord(saved.word);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSecret(role, word);
  }, [role, word, hydrated]);

  const setRole = useCallback((role: "impostor" | "normal", word?: string) => {
    setRoleState(role);
    setWord(word ?? null);
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    setWord(null);
  }, []);

  return (
    <SecretContext.Provider value={{ role, word, setRole, clearRole }}>
      {children}
    </SecretContext.Provider>
  );
}

export function useSecret(): SecretState {
  const ctx = useContext(SecretContext);
  if (!ctx) throw new Error("useSecret must be used within SecretProvider");
  return ctx;
}
