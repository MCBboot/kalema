import { describe, it, expect } from "vitest";
import { validateCreateRoom, validateJoinRoom } from "../roomValidators.js";

describe("validateCreateRoom", () => {
  it("RV1: valid payload returns valid result", () => {
    const result = validateCreateRoom({ displayName: "Alice" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.displayName).toBe("Alice");
    }
  });

  it("RV2: missing displayName returns error", () => {
    const result = validateCreateRoom({});
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_NAME");
    }
  });

  it("RV4: whitespace-only displayName returns error", () => {
    const result = validateCreateRoom({ displayName: "   " });
    expect(result.valid).toBe(false);
  });

  it("RV5: name too long returns error", () => {
    const result = validateCreateRoom({ displayName: "A".repeat(25) });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("NAME_TOO_LONG");
    }
  });
});

describe("validateJoinRoom", () => {
  it("RV6: valid join payload returns valid result", () => {
    const result = validateJoinRoom({ code: "ABCDE", displayName: "Bob" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.code).toBe("ABCDE");
      expect(result.data.displayName).toBe("Bob");
    }
  });

  it("RV7: missing code returns error", () => {
    const result = validateJoinRoom({ displayName: "Bob" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_CODE");
    }
  });

  it("RV8: null payload returns error", () => {
    const result = validateJoinRoom(null);
    expect(result.valid).toBe(false);
  });
});
