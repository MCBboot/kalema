"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

  const setRole = useCallback((role: "impostor" | "normal", word?: string) => {
    setRoleState(role);
    setWord(word ?? null);
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    setWord(null);
  }, []);

  const state: SecretState = {
    role,
    word,
    setRole,
    clearRole,
  };

  return (
    <SecretContext.Provider value={state}>
      {children}
    </SecretContext.Provider>
  );
}

export function useSecret(): SecretState {
  const ctx = useContext(SecretContext);
  if (!ctx) throw new Error("useSecret must be used within SecretProvider");
  return ctx;
}
