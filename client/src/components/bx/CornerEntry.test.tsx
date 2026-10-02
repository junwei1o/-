// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CornerEntry, classifyCornerInput, ADMIN_USERNAME } from "./CornerEntry";

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

describe("classifyCornerInput：三分支判斷", () => {
  it("輸入站長用戶名 → admin", () => {
    expect(classifyCornerInput(ADMIN_USERNAME, null)).toBe("admin");
    expect(classifyCornerInput(ADMIN_USERNAME, "小航海士")).toBe("admin");
  });

  it("站長用戶名比對大小寫不敏感（避免自己打錯被擋）", () => {
    expect(classifyCornerInput("ADMIN", null)).toBe("admin");
    expect(classifyCornerInput("Admin", null)).toBe("admin");
  });

  it("⭐ 輸入自己的船名 → settings", () => {
    expect(classifyCornerInput("小航海士", "小航海士")).toBe("settings");
  });

  it("⭐ 船名比對大小寫敏感（用 ASCII 船名才測得到，中文沒有大小寫）", () => {
    // 船名是使用者自己取的，不該替他改大小寫
    expect(classifyCornerInput("Kaohsiung", "Kaohsiung")).toBe("settings");
    expect(classifyCornerInput("kaohsiung", "Kaohsiung")).toBe("invalid");
  });

  it("⭐ 站長用戶名優先於船名比對（撞名時要給站長身分）", () => {
    // 有人剛好把船名叫 admin
    expect(classifyCornerInput("admin", "admin")).toBe("admin");
  });

  it("其他輸入 → invalid", () => {
    expect(classifyCornerInput("別人", "小航海士")).toBe("invalid");
    expect(classifyCornerInput("root", null)).toBe("invalid");
  });

  it("空白字串 → invalid（不是 admin）", () => {
    expect(classifyCornerInput("", "小航海士")).toBe("invalid");
    expect(classifyCornerInput("   ", "小航海士")).toBe("invalid");
  });

  it("前後空白會被去掉再判斷", () => {
    expect(classifyCornerInput("  admin  ", null)).toBe("admin");
    expect(classifyCornerInput("  小航海士  ", "小航海士")).toBe("settings");
  });

  it("未登入時打自己的船名 → invalid（沒有名字可比）", () => {
    expect(classifyCornerInput("小航海士", null)).toBe("invalid");
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

  it("⭐ 輸入站長用戶名 → 呼叫後端登入（不只前端跳轉）", () => {
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

  it("⭐ 帶空白的站長用戶名也會被清理後送出", () => {
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

  it("⭐ 其他輸入 → 顯示錯誤、停在輸入框、不跳轉", () => {
    setSession("小航海士");
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    fireEvent.change(screen.getByLabelText("輸入你的船名"), { target: { value: "不是我的名字" } });
    fireEvent.submit(screen.getByLabelText("輸入你的船名").closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent("不是你的船名");
    // 面板還開著、輸入框還在（使用者可以直接改，不該被清空）
    expect(screen.getByRole("dialog", { name: "船長入口" })).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("未登入時的錯誤訊息會提示先登入", () => {
    setSession(null);
    render(<CornerEntry />);
    fireEvent.click(screen.getByRole("button", { name: "船長入口" }));
    fireEvent.change(screen.getByLabelText("輸入你的船名"), { target: { value: "某個船名" } });
    fireEvent.submit(screen.getByLabelText("輸入你的船名").closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent("請先登入");
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
