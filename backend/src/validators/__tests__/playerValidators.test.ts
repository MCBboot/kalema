import { describe, it, expect } from "vitest";
import { validateDisplayName } from "../playerValidators.js";

describe("validateDisplayName", () => {
  it("PV1: valid name returns valid result with trimmed name", () => {
    const result = validateDisplayName("  Alice  ", []);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.name).toBe("Alice");
    }
  });

  it("PV2: empty string returns INVALID_NAME", () => {
    const result = validateDisplayName("", []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_NAME");
    }
  });

  it("PV3: whitespace-only returns INVALID_NAME", () => {
    const result = validateDisplayName("   ", []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_NAME");
    }
  });

  it("PV4: too long name returns NAME_TOO_LONG", () => {
    const result = validateDisplayName("A".repeat(25), []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("NAME_TOO_LONG");
    }
  });

  it("PV5: duplicate name returns DUPLICATE_NAME", () => {
    const result = validateDisplayName("Alice", ["Alice", "Bob"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("DUPLICATE_NAME");
    }
  });

  it("PV6: non-string returns INVALID_NAME", () => {
    const result = validateDisplayName(123, []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_NAME");
    }
  });
});
