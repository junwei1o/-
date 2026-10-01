import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listAiTokenUsage: vi.fn(),
    addAiTokenUsage: vi.fn(),
    getAiUsage: vi.fn(),
    incrementAiUsage: vi.fn(),
  };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { listAiTokenUsage } from "./db";

/** 匿名（未登入）情境。 */
const context: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

/** 教師情境：全站用量彙總需要教師以上權限（2026-10-01 隱私自公開收緊）。 */
const teacherContext: TrpcContext = {
  ...context,
  user: { id: 0, openId: "__teacher__", name: "teacher", role: "teacher" } as unknown as TrpcContext["user"],
};

const listAiTokenUsageMock = vi.mocked(listAiTokenUsage);

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("aiTutor.tokenUsage", () => {
  it("無 name 時回傳全站今日、近 7 天總計與每日明細", async () => {
    // 固定系統時間為台北 2026-09-16 中午，與 mock 的 today 資料一致，避免隨真實日期飄移。
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T04:00:00.000Z"));
    listAiTokenUsageMock.mockResolvedValue([
      { usageDate: "2026-09-09", calls: 1, promptTokens: 200, completionTokens: 50, totalTokens: 250 },
      { usageDate: "2026-09-16", calls: 3, promptTokens: 700, completionTokens: 180, totalTokens: 880 },
    ]);
    const caller = appRouter.createCaller(teacherContext);
    const result = await caller.aiTutor.tokenUsage({});
    expect(result.today).toMatchObject({ usageDate: "2026-09-16", calls: 3, totalTokens: 880 });
    expect(result.last7Days).toEqual({ calls: 4, promptTokens: 900, completionTokens: 230, totalTokens: 1130 });
    expect(result.byDay).toHaveLength(2);
    expect(listAiTokenUsageMock).toHaveBeenCalledWith(7, undefined);
  });

  it("⭐ 匿名不可查「全站」用量（隱私回歸鎖，2026-10-01 修復）", async () => {
    // 修復前：publicProcedure 且不帶 name 會回傳全站統計——任何訪客（含學生）
    // 都能讀到全站 AI 用量。現在必須是教師以上。
    const caller = appRouter.createCaller(context);
    await expect(caller.aiTutor.tokenUsage({})).rejects.toThrow(/需要教師身分/);
    expect(listAiTokenUsageMock).not.toHaveBeenCalled();
  });

  it("匿名帶 name 仍可查個人用量（學生在學習歷程頁看自己的）", async () => {
    listAiTokenUsageMock.mockResolvedValue([
      { usageDate: "2026-09-16", calls: 1, promptTokens: 100, completionTokens: 20, totalTokens: 120 },
    ]);
    const caller = appRouter.createCaller(context);
    const result = await caller.aiTutor.tokenUsage({ name: "小航海士" });
    expect(result.last7Days.calls).toBe(1);
    expect(listAiTokenUsageMock).toHaveBeenCalledWith(7, "小航海士");
  });

  it("帶 name 時只查單一船員且傳入正確名稱", async () => {
    listAiTokenUsageMock.mockResolvedValue([
      { usageDate: "2026-09-16", calls: 2, promptTokens: 500, completionTokens: 120, totalTokens: 620 },
    ]);
    const caller = appRouter.createCaller(context);
    const result = await caller.aiTutor.tokenUsage({ name: "小航海士" });
    expect(result.last7Days.calls).toBe(2);
    expect(listAiTokenUsageMock).toHaveBeenCalledWith(7, "小航海士");
  });

  it("沒有紀錄時回傳零值而非錯誤", async () => {
    listAiTokenUsageMock.mockResolvedValue([]);
    const caller = appRouter.createCaller(teacherContext);
    const result = await caller.aiTutor.tokenUsage({});
    expect(result.today.calls).toBe(0);
    expect(result.last7Days.totalTokens).toBe(0);
    expect(result.byDay).toEqual([]);
  });
});
