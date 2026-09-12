// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeContactCard } from "./HomeContactCard";

const STORAGE_LINE_ID = "hdmx_teacher_line_id_v1";
const STORAGE_TEACHER_NAME = "hdmx_teacher_name_v1";
const STORAGE_PHONE = "hdmx_teacher_phone_v1";
const STORAGE_NOTICE = "hdmx_class_notice_v1";

/** vitest 環境是 node，沒有 localStorage；用 Map stub 出 in-memory 版本。 */
function makeLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", makeLocalStorageStub());
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HomeContactCard 聯絡老師區塊", () => {
  it("未設定時顯示提示與設定入口", () => {
    render(<HomeContactCard />);
    expect(screen.getByText("聯絡老師")).toBeTruthy();
    expect(screen.getByText("點擊設定")).toBeTruthy();
  });

  it("點擊展開後可進入首次設定並儲存 LINE ID + 電話 + 公告", async () => {
    render(<HomeContactCard />);
    fireEvent.click(screen.getByRole("button", { name: /聯絡老師/ }));

    fireEvent.click(screen.getByRole("button", { name: "首次設定" }));

    const nameInput = screen.getByPlaceholderText("例：劉老師") as HTMLInputElement;
    const phoneInput = screen.getByPlaceholderText("例：0932075752 或 02-1234-5678") as HTMLInputElement;
    const lineInput = screen.getByPlaceholderText("例：liu_taipei_t3") as HTMLInputElement;
    const noticeInput = screen.getByPlaceholderText(/週末作業/) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: "劉老師" } });
    fireEvent.change(phoneInput, { target: { value: "0932075752" } });
    fireEvent.change(lineInput, { target: { value: "liu_taipei_t3" } });
    fireEvent.change(noticeInput, { target: { value: "週末作業：練習本第 32 頁。" } });

    fireEvent.click(screen.getByRole("button", { name: "儲存" }));

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_LINE_ID)).toBe("liu_taipei_t3");
      expect(localStorage.getItem(STORAGE_TEACHER_NAME)).toBe("劉老師");
      expect(localStorage.getItem(STORAGE_PHONE)).toBe("0932075752");
      expect(localStorage.getItem(STORAGE_NOTICE)).toBe("週末作業：練習本第 32 頁。");
    });

    // 儲存後回到檢視模式，應看到撥號按鈕與 LINE ID
    expect(screen.getByText("liu_taipei_t3")).toBeTruthy();
    expect(screen.getByText("撥打 0932075752")).toBeTruthy();
    expect(screen.getByText("週末作業：練習本第 32 頁。")).toBeTruthy();
  });

  it("拒絕不合法的 LINE ID", async () => {
    render(<HomeContactCard />);
    fireEvent.click(screen.getByRole("button", { name: /聯絡老師/ }));
    fireEvent.click(screen.getByRole("button", { name: "首次設定" }));

    const lineInput = screen.getByPlaceholderText("例：liu_taipei_t3") as HTMLInputElement;
    fireEvent.change(lineInput, { target: { value: "X" } }); // 太短
    fireEvent.click(screen.getByRole("button", { name: "儲存" }));

    await waitFor(() => {
      expect(screen.getByText(/LINE ID 應為 2-30 字/)).toBeTruthy();
    });
    expect(localStorage.getItem(STORAGE_LINE_ID)).toBeNull();
  });

  it("已設定的 LINE ID 會自動渲染 QR + LINE 連結", () => {
    localStorage.setItem(STORAGE_LINE_ID, "liu_t3");
    localStorage.setItem(STORAGE_TEACHER_NAME, "劉老師");
    localStorage.setItem(STORAGE_PHONE, "0932075752");

    render(<HomeContactCard />);
    fireEvent.click(screen.getByRole("button", { name: /聯絡老師/ }));

    const img = screen.getByAltText("劉老師 的 LINE 好友 QR code") as HTMLImageElement;
    expect(img.src).toContain("line.me");
    expect(img.src).toContain("liu_t3");

    const lineLink = screen.getByRole("link", { name: /開啟 LINE/ }) as HTMLAnchorElement;
    expect(lineLink.href).toBe("https://line.me/ti/p/~liu_t3");

    const phoneLink = screen.getByRole("link", { name: /撥打/ }) as HTMLAnchorElement;
    expect(phoneLink.getAttribute("href")).toBe("tel:0932075752");
  });

  it("編輯模式可取消且不寫入 localStorage", () => {
    localStorage.setItem(STORAGE_LINE_ID, "liu_t3");
    render(<HomeContactCard />);
    fireEvent.click(screen.getByRole("button", { name: /聯絡老師/ }));
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    // 仍然顯示原本的 LINE ID，沒有被覆寫
    expect(localStorage.getItem(STORAGE_LINE_ID)).toBe("liu_t3");
    expect(screen.getByText("liu_t3")).toBeTruthy();
  });
});