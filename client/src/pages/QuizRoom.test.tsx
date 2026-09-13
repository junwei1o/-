// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuizRoom from "./QuizRoom";

const setLocation = vi.fn();

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

describe("QuizRoom 答題室", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  it("展示七種答題模式並導向對應目的地", () => {
    render(<QuizRoom />);
    expect(screen.getByRole("heading", { name: /答題室/ })).toBeInTheDocument();

    const cases: Array<[string, string]> = [
      ["自由練習", "/practice"],
      ["潮汐戰鬥", "/battle"],
      ["卡牌決鬥", "/knowledge-duel"],
      ["錯題本", "/review-hub"],
      ["專題觀測", "/gallery"],
      ["限時挑戰", "/community?mode=timed"],
      ["本週週測", "/weekly-quiz"],
    ];
    for (const [label, href] of cases) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
      expect(setLocation).toHaveBeenCalledWith(href);
      setLocation.mockClear();
    }
  });
});
