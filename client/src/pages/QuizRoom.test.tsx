// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuizRoom from "./QuizRoom";

const setLocation = vi.fn();

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

describe("QuizRoom 我的教室", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
    localStorage.clear();
  });

  it("展示六種自由玩法並導向 /classroom 目的地", () => {
    render(<QuizRoom />);
    expect(screen.getByRole("heading", { name: /我的教室/ })).toBeInTheDocument();

    const plays: Array<[string, string]> = [
      ["翻牌問答", "/classroom/flip"],
      ["看圖選答", "/classroom/image"],
      ["是非閃電", "/classroom/bolt"],
      ["限時接力", "/classroom/rush"],
      ["選擇配對接力", "/classroom/relay"],
      ["陷阱題挑戰", "/classroom/trap"],
    ];
    for (const [label, href] of plays) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
      expect(setLocation).toHaveBeenCalledWith(href);
      setLocation.mockClear();
    }
  });

  it("保留經典答題模式並導向對應目的地", () => {
    render(<QuizRoom />);
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
