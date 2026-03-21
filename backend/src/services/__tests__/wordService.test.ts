import { describe, it, expect, beforeEach } from "vitest";
import { Room, createRoom as createRoomModel } from "../../models/room.js";
import { addWord } from "../wordService.js";

function makeRoom(words: string[] = ["apple", "banana"]): Room {
  return createRoomModel("room-1", "ABCDE", "admin-1", "ADMIN_PLAYER", words);
}

describe("wordService – addWord", () => {
  let room: Room;

  beforeEach(() => {
    room = makeRoom();
  });

  it("W7: add valid word to room → word appended", () => {
    const result = addWord(room, "cherry");

    expect(result).toBe("cherry");
    expect(room.words).toContain("cherry");
    expect(room.words).toHaveLength(3);
  });

  it("W8: add empty word → INVALID_WORD", () => {
    expect(() => addWord(room, "")).toThrow("INVALID_WORD");
  });

  it("W9: add whitespace-only word → INVALID_WORD", () => {
    expect(() => addWord(room, "   ")).toThrow("INVALID_WORD");
  });

  it("W10: add duplicate word → DUPLICATE_WORD", () => {
    expect(() => addWord(room, "apple")).toThrow("DUPLICATE_WORD");
  });

  it("W11: added word exists only in that room → other rooms unaffected", () => {
    const room2 = makeRoom(["grape", "melon"]);

    addWord(room, "cherry");

    expect(room.words).toContain("cherry");
    expect(room2.words).not.toContain("cherry");
  });
});
