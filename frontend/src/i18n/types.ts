export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export type TranslationMap = Record<string, string>;

export interface I18nContextType {
  locale: Locale;
  dir: Direction;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

export const LOCALE_CONFIG: Record<Locale, { dir: Direction; label: string }> = {
  ar: { dir: "rtl", label: "العربية" },
  en: { dir: "ltr", label: "English" },
};
