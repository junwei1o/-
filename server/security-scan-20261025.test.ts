import { describe, expect, it, vi } from "vitest";

/**
 * 2026-10-25 全站掃描後的安全收緊，用回歸測試鎖住（項目在測試裡一律
 * fail-closed：斷言「被拒」或「不觸及實作」，不需要真實 DB／LINE／TTS）。
 *
 * 對應掃描報告真缺陷：
 * - #2 league.settle 原本用「自報 teacherName 字串」當權限（Anyone 可傳
 *   "__teacher_x" 觸發全站賽季結算）→ 改 teacherProcedure。
 * - #3 cloud.upsertTeacherProfile 原本 public（拿到 6 碼班級級碼即可覆寫
 *   老師手機／LINE ID）→ 改 teacherProcedure。
 * - #5 line.sendTest / clearBinding / getBinding 原本 public（任意訪客可
 *   觸發對站長的手動 push、解除綁定、探測綁定狀態）→ 改 teacherProcedure。
 * - tts.health 屬營運診斷資訊，比照 dbUsage 先例（public→admin）收 admin。
 */

// 探針型端點的實作底層全部隔開：測試只走權限中間件，
// 斷言「匿名根本到不了 handler」；萬一中間件失效，mock 會暴露「竟被呼叫」。
const settleSpy = vi.fn();
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, settleLeagueSeason: (...args: unknown[]) => settleSpy(...args) };
});
vi.mock("./lineNotify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lineNotify")>();
  return { ...actual, sendLinePush: vi.fn(), getLineRecipient: vi.fn(), clearLineRecipient: vi.fn() };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const anonymous: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

const withRole = (role: "teacher" | "admin"): TrpcContext => ({
  ...anonymous,
  user: {
    id: 0,
    openId: role === "teacher" ? "__teacher__" : "__admin__",
    name: role,
    role,
  } as unknown as TrpcContext["user"],
});

describe("league.settle 權限（缺陷 #2：自報字串授權 → session 授權）", () => {
  it("匿名結算被拒，且結算實作從未被呼叫", async () => {
    const caller = appRouter.createCaller(anonymous);
    await expect(caller.league.settle({ seasonId: 1 })).rejects.toThrow(/需要教師身分/);
    expect(settleSpy).not.toHaveBeenCalled();
  });

  it("input 不再接受 teacherName 自報欄位（有教師 session 即可，與自報字串無關）", async () => {
    settleSpy.mockResolvedValue({ id: 1, seasonNumber: 1, startAt: new Date(0), endAt: new Date(1) } as never);
    const caller = appRouter.createCaller(withRole("teacher"));
    await expect(
      caller.league.settle({ seasonId: 1 } as never),
    ).resolves.toMatchObject({ ok: true });
    expect(settleSpy).toHaveBeenCalledWith(1);
  });
});

describe("teacher 級寫入端點的匿名拒絕（缺陷 #3/#5）", () => {
  it("匿名不能覆寫教師聯絡檔", async () => {
    const caller = appRouter.createCaller(anonymous);
    await expect(
      caller.cloud.upsertTeacherProfile({ classCode: "AB12CD", teacherName: "假冒老師" }),
    ).rejects.toThrow(/需要教師身分/);
  });

  it("匿名不能發 LINE 測試推播／解綁／讀綁定狀態", async () => {
    const caller = appRouter.createCaller(anonymous);
    await expect(caller.line.sendTest()).rejects.toThrow(/需要教師身分/);
    await expect(caller.line.clearBinding()).rejects.toThrow(/需要教師身分/);
    await expect(caller.line.getBinding()).rejects.toThrow(/需要教師身分/);
  });

  it("站長（admin ⊇ teacher）仍可通過同一道檢查", async () => {
    // 只驗證中間件層放行，不假設班級檔存在與否。
    settleSpy.mockResolvedValue({ id: 7, seasonNumber: 7, startAt: new Date(0), endAt: new Date(1) } as never);
    const caller = appRouter.createCaller(withRole("admin"));
    await expect(caller.league.settle({ seasonId: 7 })).resolves.toMatchObject({ ok: true });
    expect(settleSpy).toHaveBeenCalledWith(7);
  });
});

describe("tts.health 收緊為站長專屬（比照 dbUsage 先例）", () => {
  it("匿名無法讀取供應鏈診斷（純本地探測也被拒在中介件）", async () => {
    const caller = appRouter.createCaller(anonymous);
    await expect(caller.tts.health()).rejects.toThrow(/站長/);
  });
});
