import { describe, expect, it } from "vitest";
import { isAdminSurface } from "./routeSurface";

/**
 * 管理面路由判定回歸鎖（2026-10-25 審計 P0）。
 *
 * 背景：`AuthGate` 原本包住整個 Router，導致所有路由都要先輸入學生船名，
 * 站長在乾淨環境訪 /admin 只看到「輸入你的船長名字」——管理入口被學生閘吃掉。
 * 修法是在 AuthGate 放行管理面路由，而「哪些算管理面」由本函式定義。
 *
 * 這裡刻意測試「容易誤判的邊界」，因為放錯一題就會造成：
 * - 誤判為管理面 → 學生動線繞過登入閘（國小生可直入 /teacher）
 * - 誤判為非管理面 → 站長又被攔在船名閘外（修復失效）
 */
describe("isAdminSurface", () => {
  it("三個管理面前綴皆判為 true", () => {
    expect(isAdminSurface("/admin")).toBe(true);
    expect(isAdminSurface("/teacher")).toBe(true);
    expect(isAdminSurface("/learning-summary")).toBe(true);
  });

  it("子路徑判為 true（含結尾斜線）", () => {
    expect(isAdminSurface("/admin/")).toBe(true);
    expect(isAdminSurface("/admin/security")).toBe(true);
    expect(isAdminSurface("/teacher/classes")).toBe(true);
  });

  it("query 與 hash 不影響判定", () => {
    expect(isAdminSurface("/admin?tab=operations")).toBe(true);
    expect(isAdminSurface("/teacher#top")).toBe(true);
  });

  it("學生動線一律 false（最重要：不得讓學生繞過船名閘）", () => {
    for (const path of ["/", "/practice", "/dashboard", "/learning-insights", "/wrong-answers", "/settings", "/community", "/quiz-room", "/classroom/pacman"]) {
      expect(isAdminSurface(path), `${path} 必須不是管理面`).toBe(false);
    }
  });

  it("前綴相似但非管理面的路由不得誤判（防 /administrator 之類）", () => {
    expect(isAdminSurface("/administrator")).toBe(false);
    expect(isAdminSurface("/admin-console")).toBe(false);
    expect(isAdminSurface("/teachers")).toBe(false);
    expect(isAdminSurface("/learning-summary-x")).toBe(false);
  });

  it("空值與怪輸入安全回 false（不拋錯）", () => {
    expect(isAdminSurface("")).toBe(false);
    expect(isAdminSurface(null)).toBe(false);
    expect(isAdminSurface(undefined)).toBe(false);
  });
});
