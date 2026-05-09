import { ImpostorData } from "./state.js";
import { defaultWordsList } from "./data/defaultWords.js";

let defaultWords: string[] = defaultWordsList;

export function loadImpostorWords(): void {
  // Now loaded directly from JS array in shared environment to support browsers
  if (defaultWords.length === 0) {
    throw new Error("Impostor default words list is empty");
  }
}

export function getDefaultWords(): string[] {
  return [...defaultWords];
}

export function addWord(data: ImpostorData, word: string): string {
  const trimmed = word.trim();

  if (trimmed.length === 0) {
    throw new Error("INVALID_WORD");
  }

  if (data.words.includes(trimmed)) {
    throw new Error("DUPLICATE_WORD");
  }

  data.words.push(trimmed);
  return trimmed;
}
