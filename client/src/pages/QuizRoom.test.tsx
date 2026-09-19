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

  it("展示六種融合玩法並導向 /classroom 目的地", () => {
    render(<QuizRoom />);
    expect(screen.getByRole("heading", { name: /我的教室/ })).toBeInTheDocument();

    const plays: Array<[string, string]> = [
      ["翻牌圖鑑", "/classroom/flipdex"],
      ["閃電接力", "/classroom/flashrush"],
      ["選擇配對接力", "/classroom/relay"],
      ["陷阱題挑戰", "/classroom/trap"],
      ["倍數防衛戰", "/classroom/meteor"],
      ["因數雙重奏", "/classroom/duo"],
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

  it("預設為極簡海皮，具備進度條、鼓勵彈幕與領航員悄悄話", () => {
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

  it("教室右下角有燈寶，摸頭會說話並累積好感度", () => {
    render(<QuizRoom />);
    expect(document.querySelector(".pet-widget")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "摸一摸燈寶" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "摸一摸燈寶" }));
    // 好感度寫入本機（摸頭 +1）
    const bond = JSON.parse(localStorage.getItem("xue-pet-bond-v1") ?? "{}");
    expect(bond.bond).toBe(1);
    expect(bond.pats).toBe(1);
    // 說話氣泡出現
    expect(document.querySelector(".pet-speech")).toBeInTheDocument();
  });

  it("餵星星糖與戳戳點燈各自累積好感度", () => {
    render(<QuizRoom />);
    fireEvent.click(screen.getByRole("button", { name: "餵星星糖" }));
    fireEvent.click(screen.getByRole("button", { name: "戳戳點燈" }));
    const bond = JSON.parse(localStorage.getItem("xue-pet-bond-v1") ?? "{}");
    // 餵糖 +2、點燈 +1
    expect(bond.bond).toBe(3);
    expect(bond.feeds).toBe(1);
    expect(bond.lights).toBe(1);
  });
});
