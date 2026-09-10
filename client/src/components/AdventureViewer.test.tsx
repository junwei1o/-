/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdventureViewer from "./AdventureViewer";

vi.mock("@/lib/questionBank", () => ({
  useQuestionBank: () => ({ questions: [], total: 0, isLoading: false, error: null, refetch: () => {}, source: "local", isFallback: false }),
}));

describe("AdventureViewer", () => {
  afterEach(() => localStorage.clear());

  it("顯示冒險章節列表", () => {
    render(<AdventureViewer />);
    expect(screen.getByText(/燈塔的呼喚/)).toBeTruthy();
    expect(screen.getByText(/失落的古籍/)).toBeTruthy();
  });
});
