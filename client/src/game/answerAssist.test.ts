import { describe, expect, it } from "vitest";
import { getEliminatedWrongOption } from "./answerAssist";

describe("getEliminatedWrongOption", () => {
  it("always eliminates one wrong option with a stable result", () => {
    const first = getEliminatedWrongOption("math-fraction-01", 4, 2);
    expect(first).toEqual(getEliminatedWrongOption("math-fraction-01", 4, 2));
    expect(first?.eliminatedIndex).not.toBe(2);
    expect(first?.eliminatedLabel).toMatch(/^[A-D]$/);
  });

  it("does not invent assistance for malformed or too-short option sets", () => {
    expect(getEliminatedWrongOption("", 4, 1)).toBeNull();
    expect(getEliminatedWrongOption("q", 2, 1)).toBeNull();
    expect(getEliminatedWrongOption("q", 4, 5)).toBeNull();
  });
});
