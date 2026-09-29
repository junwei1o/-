// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TriSpeechPanel } from "./TriSpeechPanel";

function stubSpeech() {
  const speak = vi.fn();
  const cancel = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  // @ts-expect-error 測試用全域 stub
  globalThis.speechSynthesis = { speak, cancel, pause, resume, getVoices: () => [] };
  // @ts-expect-error 測試用全域 stub
  globalThis.SpeechSynthesisUtterance = class {
    text: string;
    lang = "";
    rate = 0;
    volume = 0;
    pitch = 0;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onboundary: (() => void) | null = null;
    constructor(text: string) { this.text = text; }
  };
  return { speak, cancel, pause, resume };
}

describe("TriSpeechPanel（三軸朗讀面板）", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("渲染朗讀按鈕與語速調整", () => {
    stubSpeech();
    render(<TriSpeechPanel text="題目內容" label="朗讀題目" />);
    expect(screen.getByRole("button", { name: /朗讀題目/ })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "朗讀語速" })).toBeTruthy();
  });

  it("點擊朗讀後可暫停", () => {
    stubSpeech();
    render(<TriSpeechPanel text="題目內容" />);
    const button = screen.getByRole("button", { name: /朗讀/ });
    fireEvent.click(button);
    // speak 走 mock engine：onstart 回呼會把狀態切到 speaking
    expect(screen.getByRole("button", { name: /暫停/ })).toBeTruthy();
  });

  it("不支援時顯示降級提示且按鈕 disabled", () => {
    // @ts-expect-error 模擬不支援
    globalThis.speechSynthesis = undefined;
    // @ts-expect-error 模擬不支援
    globalThis.SpeechSynthesisUtterance = undefined;
    render(<TriSpeechPanel text="題目內容" />);
    expect(screen.getByText(/不支援語音朗讀/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /不支援/ }).hasAttribute("disabled")).toBe(true);
  });

  it("語速調整寫入 localStorage", () => {
    stubSpeech();
    render(<TriSpeechPanel text="題目內容" />);
    const slider = screen.getByRole("slider", { name: "朗讀語速" }) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "1.20" } });
    const raw = localStorage.getItem("xue-adventure-speech-preferences-v1");
    expect(raw).toContain("1.2");
  });
});
