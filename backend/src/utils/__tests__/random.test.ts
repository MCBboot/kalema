import { describe, it, expect } from "vitest";
import { pickRandom } from "@kalema/shared/dist/utils/random.js";

describe("pickRandom", () => {
  it("RN1: returns an element from the array", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = pickRandom(arr);
    expect(arr).toContain(result);
  });

  it("RN2: with single element returns that element", () => {
    expect(pickRandom([42])).toBe(42);
  });

  it("RN3: with empty array throws", () => {
    expect(() => pickRandom([])).toThrow("Cannot pick from an empty array");
  });
});
