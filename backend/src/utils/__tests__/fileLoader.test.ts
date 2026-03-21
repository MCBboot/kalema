import { describe, it, expect, afterAll } from "vitest";
import { writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWordsFromFile } from "../fileLoader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = resolve(__dirname, "../../.tmp-test");
const tmpFile = resolve(tmpDir, "test-words.txt");

function createTmpFile(content: string): void {
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(tmpFile, content, "utf-8");
}

afterAll(() => {
  try {
    unlinkSync(tmpFile);
  } catch {
    // ignore
  }
});

describe("loadWordsFromFile", () => {
  it("FL1: loads valid UTF-8 file and returns array of strings", () => {
    createTmpFile("apple\nbanana\ncherry\n");
    const words = loadWordsFromFile(tmpFile);
    expect(words).toEqual(["apple", "banana", "cherry"]);
  });

  it("FL2: trims lines", () => {
    createTmpFile("  apple  \n  banana  \n");
    const words = loadWordsFromFile(tmpFile);
    expect(words).toEqual(["apple", "banana"]);
  });

  it("FL3: removes blank lines", () => {
    createTmpFile("apple\n\n\nbanana\n\n");
    const words = loadWordsFromFile(tmpFile);
    expect(words).toEqual(["apple", "banana"]);
  });

  it("FL4: throws error for non-existent file", () => {
    expect(() => loadWordsFromFile("/non/existent/path.txt")).toThrow();
  });

  it("FL5: preserves Arabic content", () => {
    createTmpFile("تفاحة\nسيارة\nمدرسة\n");
    const words = loadWordsFromFile(tmpFile);
    expect(words).toEqual(["تفاحة", "سيارة", "مدرسة"]);
  });

  it("FL6: deduplicates words", () => {
    createTmpFile("apple\napple\nbanana\n");
    const words = loadWordsFromFile(tmpFile);
    expect(words).toEqual(["apple", "banana"]);
  });
});
