// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logoutMock = vi.fn();

/** 由每個測試決定 admin.me 的回應。 */
const meState: { data: { isAdmin: boolean; passphraseConfigured: boolean } | undefined; isPending: boolean; isError: boolean } = {
  data: { isAdmin: false, passphraseConfigured: true },
  isPending: false,
  isError: false,
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      me: { useQuery: () => meState },
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logout: { useMutation: () => ({ mutate: logoutMock, isPending: false }) },
    },
    dbUsage: {
      status: {
        useQuery: () => ({
          isPending: false,
          isError: false,
          data: {
            source: "estimate",
            sourceNote: "由本站自行計量 DB 操作推估，非 TiDB Cloud 帳單數字。",
            quota: { ruPerMonth: 50_000_000, label: "5000 萬 RU/月" },
            uptimeMs: 3_600_000,
            statements: 120,
            failedStatements: 0,
            rowsTouched: 3_000,
            estimatedRu: 420,
            percentOfQuota: 0.00084,
            ruPerHour: 420,
            projectedMonthlyRu: 302_400,
            sustainableRuPerHour: 69_444,
            level: "ok",
            recentBuckets: [],
          },
        }),
      },
    },
  },
}));

import AdminConsole from "./AdminConsole";
import { clearAdminModulesForTest, registerAdminModule } from "@/admin/registry";
import { ADMIN_MODULES } from "@/admin/modules";

beforeEach(() => {
  meState.data = { isAdmin: false, passphraseConfigured: true };
  meState.isPending = false;
  meState.isError = false;
  logoutMock.mockClear();
});

afterEach(() => {
  cleanup();
  clearAdminModulesForTest();
});

describe("站長後台：身分閘", () => {
  it("尚未設定通關語時，明講原因與要設定的環境變數（不要讓人對著登不進去的畫面猜）", () => {
    meState.data = { isAdmin: false, passphraseConfigured: false };
    render(<AdminConsole />);
    expect(screen.getByText(/站長後台尚未啟用/)).toBeInTheDocument();
    expect(screen.getByText("ADMIN_PASSPHRASE")).toBeInTheDocument();
    // 未設定時不該出現登入表單
    expect(screen.queryByLabelText("站長通關語")).not.toBeInTheDocument();
  });

  it("已設定但未登入時顯示通關語輸入框", () => {
    render(<AdminConsole />);
    expect(screen.getByLabelText("站長通關語")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /進入後台/ })).toBeInTheDocument();
  });

  it("身分查詢失敗時給明確錯誤，而不是空白頁", () => {
    meState.data = undefined;
    meState.isError = true;
    render(<AdminConsole />);
    expect(screen.getByRole("alert")).toHaveTextContent(/無法確認身分/);
  });
});

describe("站長後台：模組渲染（由註冊表驅動）", () => {
  beforeEach(() => {
    meState.data = { isAdmin: true, passphraseConfigured: true };
    // 重新註冊內建模組（afterEach 會清空註冊表）
    for (const module of ADMIN_MODULES) registerAdminModule(module);
  });

  it("渲染分組標題與各模組標題", () => {
    render(<AdminConsole />);
    // 分組
    expect(screen.getByRole("heading", { name: "營運與資源" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "存取與角色" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "系統與部署" })).toBeInTheDocument();
    // 模組
    expect(screen.getByRole("heading", { name: "全站資源監控" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "角色與存取" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "系統與部署" })).toBeInTheDocument();
  });

  it("資源監控模組顯示 RU 額度與用量對比", () => {
    render(<AdminConsole />);
    expect(screen.getByText(/RU 限額/)).toBeInTheDocument();
    expect(screen.getByText("5000 萬 RU/月")).toBeInTheDocument();
    expect(screen.getByText(/小型網站或個人專案通常足夠/)).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: /本次實例已使用/ })).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: /外推月用量/ })).toBeInTheDocument();
  });

  it("角色模組把三種角色的定位列出來", () => {
    render(<AdminConsole />);
    expect(screen.getByRole("rowheader", { name: "學生" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "老師" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "站長" })).toBeInTheDocument();
  });

  it("⭐ 掛上新模組（含新分組）就能出現，完全不需要改動本頁或外殼", () => {
    registerAdminModule({
      id: "future-module",
      title: "未來的模組",
      group: "brand-new-group",
      summary: "驗證擴充性：只要註冊就會出現。",
      render: () => <p>未來模組內容</p>,
    });
    render(<AdminConsole />);
    expect(screen.getByRole("heading", { name: "未來的模組" })).toBeInTheDocument();
    expect(screen.getByText("未來模組內容")).toBeInTheDocument();
    // 未登記分組會以 id 自動附加，不會被丟掉
    expect(screen.getByRole("heading", { name: "brand-new-group" })).toBeInTheDocument();
  });

  it("已有模組時提供登出", () => {
    render(<AdminConsole />);
    const logout = screen.getByRole("button", { name: /登出/ });
    fireEvent.click(logout);
    expect(logoutMock).toHaveBeenCalled();
  });
});
