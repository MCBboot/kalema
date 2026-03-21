import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWordsFromFile } from "../utils/fileLoader.js";
import { Room } from "../models/room.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let defaultWords: string[] = [];

export function loadDefaultWords(): void {
  const filePath = resolve(__dirname, "../data/default-words.txt");
  defaultWords = loadWordsFromFile(filePath);

  if (defaultWords.length === 0) {
    throw new Error("Default words file is empty or missing");
  }
}

export function getDefaultWords(): string[] {
  return [...defaultWords];
}

export function addWord(room: Room, word: string): string {
  const trimmed = word.trim();

  if (trimmed.length === 0) {
    throw new Error("INVALID_WORD");
  }

  if (room.words.includes(trimmed)) {
    throw new Error("DUPLICATE_WORD");
  }

  room.words.push(trimmed);
  room.updatedAt = Date.now();
  return trimmed;
}
