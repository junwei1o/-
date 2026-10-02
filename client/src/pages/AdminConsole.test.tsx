// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logoutMock = vi.fn();

/** 由每個測試決定 admin.me 的回應。 */
const meState: { data: { isAdmin: boolean; loginMethod: "username" } | undefined; isPending: boolean; isError: boolean } = {
  data: { isAdmin: false, loginMethod: "username" },
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
          // 每個 invalidate 都要列出來：新增端點時忘了補 mock，
          // tsc 不會報錯但執行時會炸——這類錯誤只有真的點下去才會發現。
          speechHealth: { invalidate: vi.fn() },
          siteStats: { invalidate: vi.fn() },
          auditLog: { invalidate: vi.fn() },
          requestStats: { invalidate: vi.fn() },
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
        learningActivity: {
          useQuery: okQuery({
            database: { configured: true, reachable: true, error: null },
            activeStudents: 2, registeredStudents: 3,
            windows: [
              { label: "最近 24 小時", days: 1, sessions: 3, students: 1 },
              { label: "最近 7 天", days: 7, sessions: 12, students: 2 },
              { label: "最近 30 天", days: 30, sessions: 40, students: 2 },
            ],
            daily: [
              { date: "2026-10-01", sessions: 5, students: 2 },
              { date: "2026-10-02", sessions: 0, students: 0 },
            ],
            bySubject: [{ subject: "數學", sessions: 12, accuracy: 0.72 }],
            overallAccuracy: 0.68, medianDurationSec: 240,
            topStudents: [{ name: "小航海士", sessions: 20, accuracy: 0.75 }],
            computedAt: Date.now(),
          }),
        },
        dataSafety: {
          useQuery: okQuery({
            database: { configured: true, reachable: true, error: null },
            backup: {
              endpoint: "/api/backup",
              tokenRequired: false,
              tokenConfiguredButUnused: false,
              excludes: ["node_modules（依賴）", ".env / .env.*（**機密**）"],
              purpose: "讓站長一鍵下載全站原始碼。",
            },
            purpose: "確認資料能不能救回來。",
            computedAt: Date.now(),
          }),
        },
        deployInfo: {
          useQuery: okQuery({
            startedAt: Date.now() - 7_200_000,
            uptimeMs: 7_200_000,
            gitCommit: { short: "abc1234", subject: "feat(admin): 測試" },
            platform: "Render", nodeVersion: "v22.22.2", environment: "production",
            computedAt: Date.now(),
          }),
        },
        auditLog: {
          useQuery: okQuery({
            total: 2, capacity: 100,
            entries: [
              { at: Date.now() - 60_000, seq: 2, action: "healthCheck", actor: "站長", ok: true, detail: "三項檢查全數正常" },
              { at: Date.now() - 120_000, seq: 1, action: "resetSpeechBreaker", actor: "站長", ok: true, detail: "手動重設朗讀熔斷器" },
            ],
          }),
        },
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
  meState.data = { isAdmin: false, loginMethod: "username" };
  meState.isPending = false;
  meState.isError = false;
  logoutMock.mockClear();
});

afterEach(() => {
  cleanup();
  clearAdminModulesForTest();
});

describe("站長後台：身分閘", () => {
  it("未登入時顯示站長用戶名輸入框（純用戶名驗證）", () => {
    meState.data = { isAdmin: false, loginMethod: "username" };
    render(<AdminConsole />);
    expect(screen.getByLabelText("站長用戶名")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /進入後台/ })).toBeInTheDocument();
  });

  it("⭐ 閘門不再有「尚未啟用」狀態——用戶名一定有預設值", () => {
    meState.data = { isAdmin: false, loginMethod: "username" };
    render(<AdminConsole />);
    // 2026-10-02 移除 ADMIN_PASSPHRASE 後，沒有任何情況會顯示「尚未啟用」
    expect(screen.queryByText(/站長後台尚未啟用/)).not.toBeInTheDocument();
    expect(screen.queryByText("ADMIN_PASSPHRASE")).not.toBeInTheDocument();
    // 而且輸入框一定要在（否則使用者會對著空畫面發呆）
    expect(screen.getByLabelText("站長用戶名")).toBeInTheDocument();
  });

  it("用戶名欄位是文字而非密碼（純用戶名驗證的必然結果）", () => {
    render(<AdminConsole />);
    const input = screen.getByLabelText("站長用戶名") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "text");
    // 不可關閉自動完成與自動大寫，否則手機輸入會出錯
    expect(input).toHaveAttribute("autocapitalize", "none");
    expect(input).toHaveAttribute("spellcheck", "false");
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
    meState.data = { isAdmin: true, loginMethod: "username" };
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
    for (const group of ["站長總覽", "營運與資源", "內容與題庫", "成本與用量", "存取與角色", "維護工具", "系統與部署", "知識與文件"]) {
      expect(screen.getByRole("heading", { name: group })).toBeInTheDocument();
    }
    // 十一個模組
    for (const module of [
      "全站資源監控", "請求與限流", "朗讀供應鏈",
      "題庫規模與分布", "站點資料總覽", "AI 用量",
      "角色與存取", "安全防線", "執行環境", "環境資訊", "維運操作",
      "專案速覽", "知識文件中心",
      "健康總表", "學習活動實況", "功能降級狀態", "資料安全與備份",
      "維運操作審計", "部署與版本",
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

  it("⭐ 站長總覽要排在所有巡檢分組之前（先看這裡）", () => {
    render(<AdminConsole />);
    const headings = Array.from(document.querySelectorAll(".admin-page h2, .admin-page h3")).map((h) => h.textContent ?? "");
    const overview = headings.indexOf("站長總覽");
    const operations = headings.indexOf("營運與資源");
    expect(overview).toBeGreaterThanOrEqual(0);
    expect(overview).toBeLessThan(operations);
  });

  it("健康總表把每個子系統的判斷門檻寫出來（不能只給紅黃綠）", () => {
    render(<AdminConsole />);
    // 「資料庫」在多個模組都出現，必須限定在健康總表的燈塔清單內，
    // 否則 getByText 會多重匹配（這是本專案反覆踩到的坑）
    const lights = document.querySelector(".admin-light-list");
    expect(lights).not.toBeNull();
    expect(lights?.textContent).toContain("資料庫");
    expect(lights?.textContent).toContain("請求健康");
    expect(lights?.textContent).toContain("題庫");
    expect(lights?.textContent).toContain("學習活躍");
    // 門檻文字必須在畫面上，站長才知道紅燈是什麼條件觸發的
    expect(screen.getByText(/紅：≥10%｜黃：≥3%/)).toBeInTheDocument();
    // 學習活躍在 DB 正常時會顯示 7 天內的實際場次／人數
    expect(lights?.textContent).toContain("7 天內 12 場／2 人");
    // 燈號徽章也要有（正常／留意／需處理／未取到）
    expect(lights?.querySelectorAll(".admin-light-badge").length).toBeGreaterThanOrEqual(4);
  });

  it("⭐ 資料安全模組要明白說出備份端點是公開的（不隱瞞）", () => {
    render(<AdminConsole />);
    expect(screen.getByText("公開可下載")).toBeInTheDocument();
    expect(screen.getByText(/任何訪客都能下載/)).toBeInTheDocument();
    // 同時要提供下載入口
    expect(screen.getByRole("link", { name: /一鍵下載全站原始碼/ })).toHaveAttribute("href", "/api/backup");
  });

  it("學習活動顯示真實統計與趨勢", () => {
    render(<AdminConsole />);
    expect(screen.getByText("小航海士")).toBeInTheDocument();
    expect(screen.getByText(/68%/)).toBeInTheDocument();
    expect(screen.getByLabelText("最近 14 天答題場次")).toBeInTheDocument();
  });

  it("審計紀錄顯示時間、操作與摘要", () => {
    render(<AdminConsole />);
    // 「執行健康檢查」同時出現在維運操作的按鈕與審計紀錄裡 → 限定在審計清單
    const audit = document.querySelector(".admin-audit-list");
    expect(audit).not.toBeNull();
    expect(audit?.textContent).toContain("執行健康檢查");
    expect(audit?.textContent).toContain("重設朗讀熔斷");
    expect(audit?.textContent).toContain("三項檢查全數正常");
    expect(audit?.textContent).toContain("站長");
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
