import { describe, it, expect } from "vitest";
import { generateId, generateRoomCode } from "@kalema/shared/dist/utils/id.js";
import { ROOM_CODE_LENGTH } from "@kalema/shared/dist/config/constants.js";

describe("generateId", () => {
  it("ID1: returns unique values across 100 calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

describe("generateRoomCode", () => {
  it("ID2: returns correct length", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(ROOM_CODE_LENGTH);
  });

  it("ID3: is alphanumeric uppercase", () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("ID4: produces unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateRoomCode());
    }
    expect(codes.size).toBe(50);
  });
});
