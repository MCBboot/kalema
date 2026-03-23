"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "auto" | "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "kalema_theme";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && ["auto", "dark", "light"].includes(saved)) {
      setThemeState(saved);
    }
  }, []);

  // Resolve theme and apply to document
  useEffect(() => {
    const resolved = theme === "auto" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);

    // Listen for system theme changes when in auto mode
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? "dark" : "light";
        setResolvedTheme(newResolved);
        root.setAttribute("data-theme", newResolved);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
