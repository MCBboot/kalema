import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWordsFromFile } from "../../utils/fileLoader.js";
import { ImpostorData } from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let defaultWords: string[] = [];

export function loadImpostorWords(): void {
  const filePath = resolve(__dirname, "./data/default-words.txt");
  defaultWords = loadWordsFromFile(filePath);

  if (defaultWords.length === 0) {
    throw new Error("Impostor default words file is empty or missing");
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
