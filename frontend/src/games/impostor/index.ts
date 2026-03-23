import { registerGame } from "../registry";
import { registerTranslations } from "@/i18n/context";
import ImpostorGame from "./components/ImpostorGame";
import arLocale from "./locales/ar.json";
import enLocale from "./locales/en.json";

export function registerImpostorGame(): void {
  // Register translations
  registerTranslations("ar", arLocale);
  registerTranslations("en", enLocale);

  // Register the game
  registerGame({
    id: "impostor",
    nameKey: "impostor.name",
    descriptionKey: "impostor.description",
    minPlayers: 3,
    maxPlayers: 50,
    icon: "؟",
    GameComponent: ImpostorGame,
  });
}
