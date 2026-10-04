/**
 * 站長鑑權（`isAdminRequest`）防回歸測試。
 *
 * 為什麼需要：初版實作把 `verifySession` 的回傳值直接餵給 `hasRoleAtLeast`——
 * 但 `verifySession` 回的是 session payload `{ openId, appId, name }`，**沒有 role 欄位**，
 * 而 `hasRoleAtLeast` 第一行就是 `if (!role) return false`。結果 `isAdminRequest`
 * **永遠回 false**：站長登入成功（`admin.me` 回 `isAdmin: true`）卻仍被 401 擋下，
 * 整條備份下載功能等於被關死。
 *
 * 當時只有「未授權 → 401」的負面測試，而**壞掉的實作同樣回 401**，
 * 所以測試是「因為錯的理由而通過」——這正是本檔存在的理由：
 * 關鍵在**正面路徑**（有效站長 session 必須回 true），負面路徑再怎麼測都補不上。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { verifySessionMock } = vi.hoisted(() => ({ verifySessionMock: vi.fn() }));

vi.mock("./sdk", () => ({ sdk: { verifySession: verifySessionMock } }));

import { isAdminRequest } from "./backupRoute";
import { ADMIN_OPEN_ID, TEACHER_OPEN_ID } from "./context";

/** 造一個只帶 headers 的假 request（本函式只讀 headers.cookie）。 */
function makeReq(cookie?: string) {
  return { headers: cookie === undefined ? {} : { cookie } } as never;
}

describe("isAdminRequest（備份端點站長鑑權）", () => {
  beforeEach(() => {
    verifySessionMock.mockReset();
  });

  it("沒有 cookie → false，且不呼叫 verifySession（避免匿名流量灌爆日誌）", async () => {
    expect(await isAdminRequest(makeReq())).toBe(false);
    expect(verifySessionMock).not.toHaveBeenCalled();
  });

  it("cookie 裡沒有 app_session_id → false，且不呼叫 verifySession", async () => {
    expect(await isAdminRequest(makeReq("other=1; another=2"))).toBe(false);
    expect(verifySessionMock).not.toHaveBeenCalled();
  });

  it("session 無效（verifySession 回 null）→ false", async () => {
    verifySessionMock.mockResolvedValue(null);
    expect(await isAdminRequest(makeReq("app_session_id=forged"))).toBe(false);
  });

  it("verifySession 拋錯 → false（例外不得冒出去變成 500）", async () => {
    verifySessionMock.mockRejectedValue(new Error("boom"));
    expect(await isAdminRequest(makeReq("app_session_id=x"))).toBe(false);
  });

  it("⭐ 有效站長 session → true（初版就是在這裡壞掉）", async () => {
    verifySessionMock.mockResolvedValue({
      openId: ADMIN_OPEN_ID,
      appId: "test-app",
      name: "admin",
    });
    expect(await isAdminRequest(makeReq("app_session_id=valid"))).toBe(true);
  });

  it("教師 session（哨兵不是站長）→ false", async () => {
    verifySessionMock.mockResolvedValue({
      openId: TEACHER_OPEN_ID,
      appId: "test-app",
      name: "teacher",
    });
    expect(await isAdminRequest(makeReq("app_session_id=valid"))).toBe(false);
  });

  it("一般使用者 openId → false", async () => {
    verifySessionMock.mockResolvedValue({
      openId: "user-123",
      appId: "test-app",
      name: "小明",
    });
    expect(await isAdminRequest(makeReq("app_session_id=valid"))).toBe(false);
  });

  it("session 物件沒有 openId → false（不因欄位缺失而誤放行）", async () => {
    verifySessionMock.mockResolvedValue({ appId: "test-app", name: "x" });
    expect(await isAdminRequest(makeReq("app_session_id=valid"))).toBe(false);
  });
});
