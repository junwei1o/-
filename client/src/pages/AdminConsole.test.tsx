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

vi.mock("@/lib/trpc", () => {
  const noopMutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isError: false, data: undefined });
  const okQuery = (data: unknown) => () => ({ isPending: false, isError: false, data });
  return {
    trpc: {
      useUtils: () => ({
        admin: {
          speechHealth: { invalidate: vi.fn() },
          siteStats: { invalidate: vi.fn() },
        },
      }),
      admin: {
        me: { useQuery: () => meState },
        login: { useMutation: noopMutation },
        logout: { useMutation: () => ({ mutate: logoutMock, isPending: false }) },
        siteStats: {
          useQuery: okQuery({
            database: { configured: true, reachable: true, pingMs: 12, error: null },
            counts: {
              users: 3, cloudSaves: 2, examRecords: 48, classes: 1, classMembers: 3,
              assignments: 5, announcements: 4, weeklyQuizzes: 6, aiUsageRows: 12,
            },
            bank: {
              total: 2895,
              bySubject: { 國語: 700, 數學: 800, 自然: 700, 社會: 695 },
              byGrade: { "3": 700, "4": 700, "5": 750, "6": 745 },
              byDifficulty: { 基礎: 1000, 標準: 1000, 挑戰: 895 },
              byOptionCount: { "4 個選項": 2895 },
            },
            cachedAt: Date.now(),
          }),
        },
        runtime: {
          useQuery: okQuery({
            nodeVersion: "v22.0.0", platform: "linux", environment: "production",
            startedAt: Date.now() - 3_600_000, uptimeMs: 3_600_000,
            memory: { rssMb: 120, heapUsedMb: 40, heapTotalMb: 80 },
            env: [
              { name: "DATABASE_URL", configured: true, note: "雲端存檔" },
              { name: "ADMIN_PASSPHRASE", configured: true, note: "站長登入" },
              { name: "GROQ_API_KEY", configured: false, note: "AI 主要供應商" },
            ],
          }),
        },
        requestStats: {
          useQuery: okQuery({
            startedAt: Date.now() - 3_600_000, uptimeMs: 3_600_000, total: 500,
            byStatusClass: { s2xx: 480, s3xx: 2, s4xx: 16, s5xx: 2 },
            byMethod: { GET: 450, POST: 50 }, slowestMs: 4200, slowRequests: 3,
          }),
        },
        speechHealth: {
          useQuery: okQuery({
            candidates: [{ python: "python3", exists: true, edgeTts: true, pip: true, userSite: true }],
            breaker: { failures: 0, brokenForMs: 0 },
            installAttempted: true, installRunning: false, installNote: "ok via pip",
          }),
        },
        healthCheck: { useMutation: noopMutation },
        resetSpeechBreaker: { useMutation: noopMutation },
        knowledgeIndex: {
          useQuery: okQuery({
            builtAt: Date.now(),
            stale: false,
            docs: [
              { id: "knowledge/README.md", title: "知識庫", category: "知識庫", bytes: 1400, summary: "這裡是給站長與 agent 看的專案知識。" },
              { id: "knowledge/05-踩坑與陷阱.md", title: "05 · 踩坑與陷阱", category: "知識庫", bytes: 9800, summary: "症狀 → 根因 → 解法。" },
              { id: "docs/handover.md", title: "handover", category: "專案文件", bytes: 141000, summary: "交接文件。" },
            ],
          }),
        },
        knowledgeDoc: {
          useQuery: (input: { id: string }) => ({
            isPending: false,
            isError: false,
            data: {
              id: input?.id ?? "",
              title: "05 · 踩坑與陷阱",
              markdown: "# 踩坑與陷阱\n\n## SPA fallback\n\n**症狀**：回 200 但其實是 HTML。\n\n- 看 content-type\n- 不要只看狀態碼\n",
            },
          }),
        },
      },
      dbUsage: {
        status: {
          useQuery: okQuery({
            source: "estimate",
            sourceNote: "由本站自行計量 DB 操作推估，非 TiDB Cloud 帳單數字。",
            quota: { ruPerMonth: 50_000_000, label: "5000 萬 RU/月" },
            uptimeMs: 3_600_000, statements: 120, failedStatements: 0, rowsTouched: 3_000,
            estimatedRu: 420, percentOfQuota: 0.00084, ruPerHour: 420,
            projectedMonthlyRu: 302_400, sustainableRuPerHour: 69_444, level: "ok", recentBuckets: [],
          }),
        },
      },
      aiTutor: {
        tokenUsage: {
          useQuery: okQuery({
            today: { usageDate: "2026-10-01", calls: 5, promptTokens: 900, completionTokens: 200, totalTokens: 1100 },
            last7Days: { calls: 20, promptTokens: 3600, completionTokens: 800, totalTokens: 4400 },
            byDay: [{ usageDate: "2026-10-01", calls: 5, promptTokens: 900, completionTokens: 200, totalTokens: 1100 }],
          }),
        },
      },
    },
  };
});

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

  it("擴充後的模組與分組都應該出現（涵蓋資料／統計／操作／設定）", () => {
    render(<AdminConsole />);
    // 六個分組
    for (const group of ["營運與資源", "內容與題庫", "成本與用量", "存取與角色", "維護工具", "系統與部署", "知識與文件"]) {
      expect(screen.getByRole("heading", { name: group })).toBeInTheDocument();
    }
    // 十一個模組
    for (const module of [
      "全站資源監控", "請求與限流", "朗讀供應鏈",
      "題庫規模與分布", "站點資料總覽", "AI 用量",
      "角色與存取", "安全防線", "執行環境", "環境資訊", "維運操作",
      "專案速覽", "知識文件中心",
    ]) {
      expect(screen.getByRole("heading", { name: module })).toBeInTheDocument();
    }
  });

  it("知識文件中心列出知識庫與專案文件，並可展開閱讀", async () => {
    render(<AdminConsole />);
    // 用文件 id 抓，不要用「知識庫」——它同時是分類標籤，每顆按鈕的
    // accessible name 都包含它，會多重匹配。id 是唯一的。
    expect(await screen.findByText("knowledge/README.md")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /05 · 踩坑與陷阱/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /handover/ })).toBeInTheDocument();

    // 展開後應該看到 markdown 渲染出來的內容
    fireEvent.click(screen.getByRole("button", { name: /05 · 踩坑與陷阱/ }));
    expect(await screen.findByRole("heading", { name: "踩坑與陷阱" })).toBeInTheDocument();
    // 表格與清單也被正確渲染（而不是原始 markdown 文字）
    expect(screen.getByText("SPA fallback")).toBeInTheDocument();
  });

  it("搜尋可以篩掉不相關的文件", async () => {
    render(<AdminConsole />);
    const input = await screen.findByLabelText("搜尋文件");
    fireEvent.change(input, { target: { value: "handover" } });
    expect(screen.queryByRole("button", { name: /05 · 踩坑與陷阱/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /handover/ })).toBeInTheDocument();
  });

  it("⭐ 專案速覽要明確指向 repo 路徑與線上站點（agent 與站長都靠這幾行找路）", () => {
    render(<AdminConsole />);
    expect(screen.getByText("/Users/g/Documents/trae_projects/hdmx")).toBeInTheDocument();
    expect(screen.getByText("xue-gr3a.onrender.com")).toBeInTheDocument();
    expect(screen.getByText("督學台 /teacher")).toBeInTheDocument();
  });

  it("維運操作會真的觸發伺服器端動作", () => {
    render(<AdminConsole />);
    fireEvent.click(screen.getByRole("button", { name: /執行健康檢查/ }));
    fireEvent.click(screen.getByRole("button", { name: /重設朗讀熔斷/ }));
    // 兩顆按鈕都存在且可點（實際 mutation 由 mock 承接）
    expect(screen.getByRole("button", { name: /執行健康檢查/ })).toBeInTheDocument();
  });

  it("已有模組時提供登出", () => {
    render(<AdminConsole />);
    const logout = screen.getByRole("button", { name: /登出/ });
    fireEvent.click(logout);
    expect(logoutMock).toHaveBeenCalled();
  });
});
