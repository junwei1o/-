// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Settings, { buildDiagnosticSummary } from "./Settings";

const setLocation = vi.fn();
const storage = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => storage.clear(),
});

vi.mock("wouter", () => ({ useLocation: () => ["/settings", setLocation] }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("設定頁錯誤日誌", () => {
  afterEach(() => {
    cleanup();
    storage.clear();
    setLocation.mockClear();
  });

  it("顯示本機錯誤日誌並截斷過長訊息", () => {
    storage.set("errorLogs", JSON.stringify([
      { context: "保存學習紀錄", message: "x".repeat(220), timestamp: Date.UTC(2026, 7, 20, 12) },
    ]));

    render(<Settings />);

    expect(screen.getByRole("heading", { name: "儲存錯誤日誌" })).toBeInTheDocument();
    expect(screen.getByText("保存學習紀錄")).toBeInTheDocument();
    expect(screen.getByText(`${"x".repeat(180)}…`)).toBeInTheDocument();
    expect(screen.getByText("1 筆")).toBeInTheDocument();
  });

  it("清理前要求確認，確認後清除日誌並顯示空狀態", () => {
    storage.set("errorLogs", JSON.stringify([
      { context: "讀取 localStorage", message: "讀取失敗", timestamp: Date.now() },
    ]));

    render(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: /清除日誌/ }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent("確定清除所有錯誤日誌？");
    fireEvent.click(screen.getByRole("button", { name: "確認清除" }));

    expect(storage.has("errorLogs")).toBe(false);
    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("目前沒有儲存錯誤"))).toBe(true);
  });

  it("產生的診斷摘要會遮蔽網址、電子郵件與令牌", () => {
    const summary = buildDiagnosticSummary([
      {
        context: "保存學習紀錄",
        message: "Bearer secret-token user@example.com https://example.com/path abcdef0123456789abcdef0123456789",
        timestamp: Date.UTC(2026, 7, 20, 12),
      },
    ]);

    expect(summary).toContain("[已遮蔽]");
    expect(summary).toContain("[電子郵件已遮蔽]");
    expect(summary).toContain("[網址已遮蔽]");
    expect(summary).not.toContain("user@example.com");
    expect(summary).not.toContain("secret-token");
  });

  it("調試頁顯示學習與儲存狀態，且只列出最近十筆遮蔽日誌", () => {
    storage.set("errorLogs", JSON.stringify(Array.from({ length: 12 }, (_, index) => ({
      context: `日誌-${index + 1}`,
      message: index === 0 ? "https://example.com/private" : "讀寫失敗",
      timestamp: Date.UTC(2026, 7, 20, 12, index),
    }))));
    storage.set("xueAdventurerData", JSON.stringify({ level: 7, exp: 60, gold: 120, totalAnswers: 18, badges: [] }));
    storage.set("xueLearningRecord", JSON.stringify([]));

    render(<Settings />);

    expect(screen.getByRole("heading", { name: "系統與學習摘要" })).toBeInTheDocument();
    expect(screen.getByText("學習紀錄")).toBeInTheDocument();
    expect(screen.getByText("Lv. 7")).toBeInTheDocument();
    expect(screen.getByText("顯示最近 10 筆（共 12 筆）遮蔽錯誤日誌。")).toBeInTheDocument();
    expect(screen.getByText("日誌-12")).toBeInTheDocument();
    expect(screen.queryByText("日誌-1")).not.toBeInTheDocument();
    expect(screen.queryByText("https://example.com/private")).not.toBeInTheDocument();
  });

  it("可一鍵複製診斷摘要並提供成功狀態", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    storage.set("errorLogs", JSON.stringify([
      { context: "讀取 localStorage", message: "讀取失敗", timestamp: Date.now() },
    ]));

    render(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: /複製診斷摘要/ }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain("Academy Expedition 儲存診斷摘要");
    expect(writeText.mock.calls[0][0]).toContain("=== 系統狀態 ===");
    expect(writeText.mock.calls[0][0]).toContain("=== 學習數據（僅數值） ===");
    expect(writeText.mock.calls[0][0]).toContain("=== 錯誤日誌（已遮蔽） ===");
    expect(writeText.mock.calls[0][0]).toMatch(/生成時間戳：\d{4}-\d{2}-\d{2}T/);
    expect(writeText.mock.calls[0][0]).not.toContain("題目答案");
    await vi.waitFor(() => {
      expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("診斷摘要已複製"))).toBe(true);
    });
  });

  it("依關鍵詞顯示錯誤嚴重度、類型與重複發生次數", () => {
    storage.set("errorLogs", JSON.stringify([
      { context: "保存 localStorage", message: "QuotaExceededError 儲存空間不足", timestamp: Date.now() },
      { context: "保存 localStorage", message: "QuotaExceededError 儲存空間不足", timestamp: Date.now() - 1000 },
      { context: "網路連線", message: "Network warning", timestamp: Date.now() - 2000 },
    ]));

    render(<Settings />);

    expect(screen.getAllByText("🔴 嚴重").length).toBeGreaterThan(0);
    expect(screen.getAllByText("類型：儲存").length).toBeGreaterThan(0);
    expect(screen.getByText("類型：網路")).toBeInTheDocument();
    expect(screen.getAllByText("發生次數：2").length).toBe(2);
  });

  it("提供局部重新整理與完整 JSON 匯出入口", () => {
    render(<Settings />);

    const refreshButton = screen.getByRole("button", { name: "重新整理調試資料" });
    expect(refreshButton).toBeEnabled();
    fireEvent.click(refreshButton);
    expect(screen.getByText(/上次更新：/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯出 JSON 診斷報告" })).toBeInTheDocument();
  });

  it("可調整戰鬥音量並保存百分比偏好", () => {
    render(<Settings />);
    const slider = screen.getByRole("slider", { name: "音量" });
    expect(slider).toHaveValue("0.65");
    fireEvent.change(slider, { target: { value: "0.35" } });
    expect(slider).toHaveValue("0.35");
    expect(document.querySelector('output[for="battle-volume"]')).toHaveTextContent("35%");
    expect(storage.get("xueBattleVolume")).toBe("0.35");
  });

  it("可即時調整特效、震動與動畫簡化設定", () => {
    render(<Settings />);
    const intensity = screen.getByRole("slider", { name: "特效強度" });
    expect(intensity).toHaveValue("3");
    fireEvent.change(intensity, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("switch", { name: /震動回饋/ }));
    fireEvent.click(screen.getByRole("switch", { name: /動畫簡化/ }));

    expect(intensity).toHaveValue("1");
    expect(screen.getByRole("switch", { name: /震動回饋/ })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: /動畫簡化/ })).toBeChecked();
    expect(JSON.parse(storage.get("xue-adventure-accessibility-prefs-v1") ?? "{}")).toEqual({ effectIntensity: "low", vibrationEnabled: false, reducedAnimation: true });
    expect(document.documentElement.dataset.effectIntensity).toBe("low");
    expect(document.documentElement.dataset.animationSimplified).toBe("true");
  });

  it("沒有日誌時提供安全空狀態與返回入口", () => {
    render(<Settings />);

    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("目前沒有儲存錯誤"))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /返回航海儀表板/ }));
    expect(setLocation).toHaveBeenCalledWith("/");
  });

  it("以 Enter 鍵確認清除錯誤日誌", () => {
    storage.set("errorLogs", JSON.stringify([
      { context: "讀取 localStorage", message: "讀取失敗", timestamp: Date.now() },
    ]));

    render(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: /清除日誌/ }));
    const confirmButton = screen.getByRole("button", { name: "確認清除" });
    fireEvent.keyDown(confirmButton, { key: "Enter" });

    expect(storage.has("errorLogs")).toBe(false);
    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("目前沒有儲存錯誤"))).toBe(true);
  });

  it("以 Escape 取消清除並將焦點還給觸發按鈕", async () => {
    storage.set("errorLogs", JSON.stringify([
      { context: "讀取 localStorage", message: "讀取失敗", timestamp: Date.now() },
    ]));

    render(<Settings />);
    const trigger = screen.getByRole("button", { name: /清除日誌/ });
    fireEvent.click(trigger);
    const confirmButton = screen.getByRole("button", { name: "確認清除" });
    await vi.waitFor(() => expect(confirmButton).toHaveFocus());
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    await vi.waitFor(() => expect(screen.getByRole("button", { name: /清除日誌/ })).toHaveFocus());
    expect(storage.has("errorLogs")).toBe(true);
  });
});
