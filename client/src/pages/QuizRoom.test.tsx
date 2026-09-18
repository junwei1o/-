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

  it("展示九種自由玩法並導向 /classroom 目的地", () => {
    render(<QuizRoom />);
    expect(screen.getByRole("heading", { name: /我的教室/ })).toBeInTheDocument();

    const plays: Array<[string, string]> = [
      ["翻牌問答", "/classroom/flip"],
      ["看圖選答", "/classroom/image"],
      ["是非閃電", "/classroom/bolt"],
      ["限時接力", "/classroom/rush"],
      ["選擇配對接力", "/classroom/relay"],
      ["陷阱題挑戰", "/classroom/trap"],
      ["因數探險", "/classroom/factor"],
      ["倍數防衛戰", "/classroom/meteor"],
      ["長方形拼拼樂", "/classroom/rect"],
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

  it("預設為極簡紫皮，具備進度條、鼓勵彈幕與領航員悄悄話", () => {
    render(<QuizRoom />);
    expect(document.querySelector(".mc-page")).toHaveAttribute("data-skin", "concise");
    expect(screen.getByRole("group", { name: "教室佈置切換" })).toBeInTheDocument();
    expect(screen.getByText(/你的探索進度/)).toBeInTheDocument();
    expect(document.querySelector(".cs-bullets")).toBeInTheDocument();
    // 點氣泡會換一句領航員悄悄話
    fireEvent.click(screen.getByRole("button", { name: /今天想試試/ }));
    expect(screen.getByRole("button", { name: /先從會的開始/ })).toBeInTheDocument();
  });

  it("切換到孟菲斯皮：幾何裝飾出現、偏好寫入本機", () => {
    render(<QuizRoom />);
    fireEvent.click(screen.getByRole("button", { name: "孟菲斯" }));
    expect(document.querySelector(".mc-page")).toHaveAttribute("data-skin", "memphis");
    expect(document.querySelector(".mm-decor")).toBeInTheDocument();
    expect(document.querySelector(".cs-bullets")).not.toBeInTheDocument();
    expect(localStorage.getItem("xue-classroom-skin-v1")).toBe("memphis");
  });

  it("切換到經典海報皮：彩帶出現並記住選擇", () => {
    render(<QuizRoom />);
    fireEvent.click(screen.getByRole("button", { name: "經典海報" }));
    expect(document.querySelector(".mc-page")).toHaveAttribute("data-skin", "classic");
    expect(document.querySelector(".mc-garland")).toBeInTheDocument();
    expect(localStorage.getItem("xue-classroom-skin-v1")).toBe("classic");
  });

  it("重新進入時沿用本機儲存的皮膚", () => {
    localStorage.setItem("xue-classroom-skin-v1", "memphis");
    render(<QuizRoom />);
    expect(document.querySelector(".mc-page")).toHaveAttribute("data-skin", "memphis");
  });
});
