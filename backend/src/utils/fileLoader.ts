import { readFileSync } from "node:fs";

export function loadWordsFromFile(filePath: string): string[] {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`Failed to read words file: ${filePath}`);
  }

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const unique = [...new Set(lines)];

  if (unique.length === 0) {
    throw new Error(`Words file is empty: ${filePath}`);
  }

  return unique;
}
