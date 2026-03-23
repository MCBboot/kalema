"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { Locale, Direction, TranslationMap, I18nContextType } from "./types";
import { LOCALE_CONFIG } from "./types";
import arCore from "./locales/ar.json";
import enCore from "./locales/en.json";

const STORAGE_KEY = "kalema_locale";

// Translation registry: merged core + game translations
const translations: Record<Locale, TranslationMap> = {
  ar: { ...arCore },
  en: { ...enCore },
};

/** Register additional translations (called by game modules) */
export function registerTranslations(locale: Locale, map: TranslationMap): void {
  translations[locale] = { ...translations[locale], ...map };
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;
  return "ar";
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, locale);
    // Update html attributes
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALE_CONFIG[locale].dir;
  }, [locale, hydrated]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = translations[locale]?.[key] || translations["ar"]?.[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale],
  );

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const dir: Direction = LOCALE_CONFIG[locale].dir;

  return (
    <I18nContext.Provider value={{ locale, dir, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
