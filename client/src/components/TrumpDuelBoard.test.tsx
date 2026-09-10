/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TrumpDuelBoard from "./TrumpDuelBoard";

vi.mock("@/lib/questionBank", () => ({
  useQuestionBank: () => ({ questions: [], total: 0, isLoading: false, error: null, refetch: () => {}, source: "local", isFallback: false }),
}));

describe("TrumpDuelBoard", () => {
  afterEach(() => localStorage.clear());

  it("顯示開始對戰按鈕", () => {
    render(<TrumpDuelBoard />);
    expect(screen.getByRole("button", { name: /開始對戰/ })).toBeTruthy();
  });
});
