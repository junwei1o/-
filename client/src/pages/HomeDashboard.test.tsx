// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home, { buildWeeklySuggestion } from "./Home";

const setLocation = vi.fn();
const storage = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => storage.clear(),
});

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    questionBank: {
      list: {
        useQuery: () => ({
          data: { questions: [{ id: "home-q-1", subject: "國語", grade: 3, prompt: "閱讀題", options: ["甲", "乙"], answer: 0, explanation: "說明", learningTopic: "閱讀理解" }] },
          isLoading: false,
        }),
      },
    },
  },
}));
vi.mock("@/components/TaiwanMainNavigationMap", () => ({
  TaiwanMainNavigationMap: () => <div data-testid="home-dashboard-map" aria-label="台灣主航海圖背景" />,
}));

describe("首頁沉浸式儀表板", () => {
  afterEach(() => {
    cleanup();
    storage.clear();
    setLocation.mockClear();
  });

  it("從 playerData 與既有本機進度顯示狀態，並以非模態面板呈現特產背包", () => {
    storage.set("playerData", JSON.stringify({ displayName: "小晴" }));
    render(<Home />);

    expect(screen.getByRole("main", { name: "寶島探險家學習儀表板" })).toBeInTheDocument();
    expect(screen.getByTestId("home-dashboard-map")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "小晴，見習航海士" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "目前等級經驗值" })).toHaveAttribute("aria-valuenow", "0");

    fireEvent.click(screen.getByRole("button", { name: /背包 0/ }));
    expect(screen.getByRole("complementary", { name: "特產背包" })).toHaveTextContent("完成真實學習里程碑");
  });

  it("在首次使用時引導至首座知識島，並保留錯題重練的實際路由", () => {
    render(<Home />);

    const startAction = screen.getByText("開始探險").closest("button");
    expect(startAction).not.toBeNull();
    fireEvent.click(startAction!);
    expect(setLocation).toHaveBeenCalledWith(expect.stringContaining("source=home-dashboard"));

    const wrongAnswersAction = screen.getByText("錯題重練").closest("button");
    expect(wrongAnswersAction).not.toBeNull();
    fireEvent.click(wrongAnswersAction!);
    expect(setLocation).toHaveBeenCalledWith("/wrong-answers");
  });

  it("在 storage 事件後重新讀取最新玩家資料並更新首頁渲染", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "島嶼探險家，見習航海士" })).toBeInTheDocument();

    storage.set("xueAdventurerData", JSON.stringify({ name: "最新航海士", level: 1, exp: 0, gold: 100, totalAnswers: 0, badges: [] }));
    fireEvent(window, new StorageEvent("storage", { key: "xueAdventurerData", newValue: storage.get("xueAdventurerData") }));

    expect(screen.getByRole("heading", { name: "最新航海士，見習航海士" })).toBeInTheDocument();
  });

  it("根據本週真實答題紀錄選出錯誤率較高的科目，並排除上週資料", () => {
    const now = Date.UTC(2026, 7, 20, 10);
    const records = [
      { questionId: "math-1", subject: "數學", isCorrect: false, errorType: "concept" as const, timestamp: Date.UTC(2026, 7, 18, 9), flagged: false },
      { questionId: "math-2", subject: "數學", isCorrect: false, errorType: "memory" as const, timestamp: Date.UTC(2026, 7, 19, 9), flagged: false },
      { questionId: "math-3", subject: "數學", isCorrect: true, timestamp: Date.UTC(2026, 7, 20, 9), flagged: false },
      { questionId: "language-old", subject: "國語", isCorrect: false, errorType: "careless" as const, timestamp: Date.UTC(2026, 7, 10, 9), flagged: false },
    ];

    expect(buildWeeklySuggestion(records, now)).toContain("本週數學錯誤率約 67%");
  });

  it("storage 更新金幣後顯示最新數值並啟用可近用的增加回饋", () => {
    storage.set("xueAdventurerData", JSON.stringify({ name: "島嶼探險家", level: 1, exp: 0, expToNextLevel: 100, gold: 100, totalAnswers: 0, badges: [] }));
    render(<Home />);
    const initialCoins = screen.getByRole("status");
    expect(initialCoins).toHaveTextContent("100 金幣");

    storage.set("xueAdventurerData", JSON.stringify({ name: "島嶼探險家", level: 1, exp: 10, expToNextLevel: 100, gold: 125, totalAnswers: 1, badges: [] }));
    fireEvent(window, new StorageEvent("storage", { key: "xueAdventurerData", newValue: storage.get("xueAdventurerData") }));

    const updatedCoins = screen.getByRole("status");
    expect(updatedCoins).toHaveTextContent("125 金幣");
    expect(updatedCoins).toHaveClass("is-gold-pulse");
  });

  it("將手機快捷入口收合為底部抽屜，展開後可由 Escape 關閉並恢復焦點", () => {
    render(<Home />);

    const toggle = screen.getByRole("button", { name: "開啟快速行動" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const startAction = screen.getByText("開始探險").closest("button");
    expect(startAction).not.toBeNull();
    expect(startAction).toHaveAttribute("tabindex", "-1");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "收合快速行動" })).toHaveAttribute("aria-expanded", "true");
    expect(startAction).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "開啟快速行動" })).toHaveAttribute("aria-expanded", "false");
  });

  it("在首頁列出全站公開功能，支援功能搜尋並導向安全調試參數入口", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "全站功能總覽" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /前往 守護者遠征/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /前往 天文館/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("搜尋功能"), { target: { value: "天文" } });
    expect(screen.getByRole("button", { name: /前往 天文館/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /前往 守護者遠征/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /調試參數/ }));
    expect(setLocation).toHaveBeenCalledWith("/settings#diagnostics");
  });
});
