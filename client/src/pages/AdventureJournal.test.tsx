// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdventureJournal from "./AdventureJournal";
import { ADVENTURE_JOURNAL_STORAGE_KEY } from "@/game/adventureJournal";

const setLocation = vi.fn();

vi.mock("wouter", () => ({ useLocation: () => ["/adventure-journal", setLocation] }));

describe("AdventureJournal", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocation.mockReset();
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel: vi.fn(), speak: vi.fn(), getVoices: vi.fn(() => []) } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class MockSpeechSynthesisUtterance { constructor(public text: string) {} } });
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("shows an honest empty state and returns to a real learning entry", () => {
    render(<AdventureJournal />);

    expect(screen.getByRole("heading", { name: "探險日誌" })).toBeInTheDocument();
    expect(screen.getByText("尚未找到可驗證的完成紀錄。完成一份試卷或一場學習對戰後，這裡會留下真實的探索回顧。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "開始今日試卷" }));
    expect(setLocation).toHaveBeenCalledWith("/");
  });

  it("renders real entries as a dated timeline and supports TTS plus map return", () => {
    localStorage.setItem(ADVENTURE_JOURNAL_STORAGE_KEY, JSON.stringify({
      version: 1,
      entries: [{ id: "exam-1", date: Date.UTC(2026, 7, 20, 9, 0), subject: "數學", topicCount: 2, correctCount: 4, sessionType: "exam", islandId: "math", summary: "整理了2 個知識主題，完成了 4 道數學題。" }],
    }));

    render(<AdventureJournal />);

    expect(screen.getByTestId("adventure-journal-timeline")).toHaveTextContent("整理了2 個知識主題");
    expect(screen.getByText("試卷練習")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "回到我的地圖" }));
    expect(setLocation).toHaveBeenCalledWith("/map");
    fireEvent.click(screen.getByRole("button", { name: "朗讀探險日誌" }));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });
});
