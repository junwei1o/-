// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CornerEntry, classifyCornerInput } from "./CornerEntry";

/**
 * 船長入口的測試。
 *
 * 焦點在**三種輸入的分支**——那是這個功能的核心判斷。
 * 把它抽成 `classifyCornerInput` 純函式就是為了能獨立測：
 * 「點畫面看對不對」撐不起三個分支的組合。
 */

const loginMock = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      login: { useMutation: () => ({ mutate: loginMock, isPending: false, isError: false }) },
    },
  },
}));

const navigateMock = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/", navigateMock],
}));

function setSession(name: string | null) {
  if (name === null) localStorage.removeItem("xue-session-v1");
  else localStorage.setItem("xue-session-v1", JSON.stringify({ name, role: "student", lastPath: "/", loginAt: Date.now() }));
}

afterEach(() => {
  cleanup();
  loginMock.mockReset();
  navigateMock.mockReset();
  localStorage.clear();
});

describe("classifyCornerInput：前端只認得自己的船名", () => {
  // ⭐ 這組測試同時是「安全屬性」的守護：前端**不應該**知道站長用戶名是什麼。
  // 若有人日後把 ADMIN_USERNAME 加回前端，這些測試應該立刻失敗。
  it("⭐ 站長用戶名不對外匯出（避免它進入公開 bundle）", () => {
    // 用 Record 轉型繞過型別，證明執行期也拿不到這個匯出
    expect((CornerEntry as unknown as Record<string, unknown>).ADMIN_USERNAME).toBeUndefined();
  });

  it("等於自己的船名 → settings（不打後端）", () => {
    expect(classifyCornerInput("小航海士", "小航海士")).toBe("settings");
    expect(classifyCornerInput("  小航海士  ", "小航海士")).toBe("settings");
  });

  it("船名比對大小寫敏感（用 ASCII 船名才測得到，中文沒有大小寫）", () => {
    expect(classifyCornerInput("Kaohsiung", "Kaohsiung")).toBe("settings");
    expect(classifyCornerInput("kaohsiung", "Kaohsiung")).toBe("askServer");
  });

  it("⭐ 其他一切 → askServer（連「猜中的站長用戶名」也一樣，交後端判斷）", () => {
    expect(classifyCornerInput("admin", "小航海士")).toBe("askServer");
    expect(classifyCornerInput("不是我的名字", "小航海士")).toBe("askServer");
    expect(classifyCornerInput("root", null)).toBe("askServer");
  });

  it("空白 → askServer（讓後端回錯誤，不在前端洩漏任何判斷依據）", () => {
    expect(classifyCornerInput("", "小航海士")).toBe("askServer");
    expect(classifyCornerInput("   ", "小航海士")).toBe("askServer");
  });

  it("未登入時打自己的船名 → askServer（沒有名字可比，交给後端）", () => {
    expect(classifyCornerInput("小航海士", null)).toBe("askServer");
  });

  it("⭐ 前端對「猜中」與「猜錯」的回應必須完全相同（不可枚舉）", () => {
    // 兩者都只回 askServer → 端點收到的請求一模一樣，無法用來枚舉站長用戶名
    expect(classifyCornerInput("admin", "小航海士")).toBe(
      classifyCornerInput("definitely-not-admin", "小航海士")
    );
  });
});

describe("CornerEntry 互動", () => {
  it("圖標有 aria-label（螢幕閱讀器找得到，不是純視覺裝飾）", () => {
    render(<CornerEntry />);
    expect(screen.getByRole("button", { name: "船長入口" })).toBeInTheDocument();
  });

  it("點圖標才展開面板；面板是 role=dialog", () => {
    render(<CornerEntry />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    expect(screen.getByRole("dialog", { name: "船長入口" })).toBeInTheDocument();
  });

  it("⭐ 輸入非自己船名的名稱 → 一律呼叫後端（前端不預先判斷）", () => {
    setSession("小航海士");
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    const input = screen.getByLabelText("輸入你的船名");
    fireEvent.change(input, { target: { value: "admin" } });
    fireEvent.submit(input.closest("form")!);

    expect(loginMock).toHaveBeenCalledTimes(1);
    // 送出的是清理過空白的使用者名
    expect(loginMock.mock.calls[0][0]).toEqual({ username: "admin" });
    // 設定頁不該被跳
    expect(navigateMock).not.toHaveBeenCalledWith("/settings");
  });

  it("⭐ 帶空白的輸入也會被清理後送出（手機輸入常會帶到空白）", () => {
    setSession(null);
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    const input = screen.getByLabelText("輸入你的船名");
    fireEvent.change(input, { target: { value: "  admin  " } });
    fireEvent.submit(input.closest("form")!);
    expect(loginMock.mock.calls[0][0]).toEqual({ username: "admin" });
  });

  it("⭐ 輸入自己的船名 → 進設定頁，且不呼叫後端", () => {
    setSession("小航海士");
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    fireEvent.change(screen.getByLabelText("輸入你的船名"), { target: { value: "小航海士" } });
    fireEvent.submit(screen.getByLabelText("輸入你的船名").closest("form")!);

    expect(navigateMock).toHaveBeenCalledWith("/settings");
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("⭐ 其他輸入 → 交給後端判斷，失敗時顯示錯誤、留在輸入框", () => {
    setSession("小航海士");
    loginMock.mockImplementation((_input: unknown, opts: { onSuccess: (r: { ok: boolean }) => void }) => {
      opts.onSuccess({ ok: false });
    });
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    const input = screen.getByLabelText("輸入你的船名");
    fireEvent.change(input, { target: { value: "不是我的名字" } });
    fireEvent.submit(input.closest("form")!);

    // 一定真的問了後端——前端不認得站長用戶名，所以不能自己判斷
    expect(loginMock).toHaveBeenCalledWith({ username: "不是我的名字" }, expect.anything());
    expect(screen.getByRole("alert")).toHaveTextContent("認不出來");
    // 面板還開著（使用者可以直接改，不該被清空）
    expect(screen.getByRole("dialog", { name: "船長入口" })).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("⭐ 後端回 ok 時進後台（前端不預先知道是誰，只信任後端）", () => {
    setSession("小航海士");
    loginMock.mockImplementation((_input: unknown, opts: { onSuccess: (r: { ok: boolean }) => void }) => {
      opts.onSuccess({ ok: true });
    });
    const assign = vi.fn();
    Object.defineProperty(window, "location", { value: { ...window.location, assign }, writable: true });

    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    const input = screen.getByLabelText("輸入你的船名");
    fireEvent.change(input, { target: { value: "任何東西" } });
    fireEvent.submit(input.closest("form")!);

    expect(loginMock).toHaveBeenCalledWith({ username: "任何東西" }, expect.anything());
    expect(assign).toHaveBeenCalledWith("/admin");
  });

  it("Esc 可以關閉面板（不給人卡住）", () => {
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("關閉鈕與「關閉」標籤可及", () => {
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
