import { describe, expect, it } from "vitest";
import { hasRoleAtLeast } from "./trpc";

/**
 * 角色層級（2026-10-01）。
 *
 * 三種角色的定位互相獨立：學生（無 user）／教師（teacher，班級與教學）／
 * 站長（admin，全站營運）。站長層級高於教師，因此可通行教師端點。
 * 這裡測的是層級判斷本身——它是所有 procedure 的守門依據，
 * 一旦寫錯（例如方向相反）會一次影響全部權限。
 */
describe("hasRoleAtLeast：角色層級判斷", () => {
  it("站長（admin）可通行站長與教師等級", () => {
    expect(hasRoleAtLeast({ role: "admin" }, "admin")).toBe(true);
    expect(hasRoleAtLeast({ role: "admin" }, "teacher")).toBe(true);
  });

  it("教師（teacher）只到教師等級，不可通行站長", () => {
    expect(hasRoleAtLeast({ role: "teacher" }, "teacher")).toBe(true);
    expect(hasRoleAtLeast({ role: "teacher" }, "admin")).toBe(false);
  });

  it("學生／匿名（user 為 null 或無 role）一律不通行", () => {
    expect(hasRoleAtLeast(null, "teacher")).toBe(false);
    expect(hasRoleAtLeast(null, "admin")).toBe(false);
    expect(hasRoleAtLeast(undefined, "teacher")).toBe(false);
    expect(hasRoleAtLeast({}, "teacher")).toBe(false);
  });

  it("未知角色視為最低權限（不因筆誤而放行）", () => {
    expect(hasRoleAtLeast({ role: "superuser" }, "teacher")).toBe(false);
    expect(hasRoleAtLeast({ role: "admin " }, "admin")).toBe(false); // 尾隨空白不算
    expect(hasRoleAtLeast({ role: "" }, "teacher")).toBe(false);
  });

  it("role 不是字串時不拋錯、視為無權限", () => {
    expect(hasRoleAtLeast({ role: 123 }, "teacher")).toBe(false);
    expect(hasRoleAtLeast({ role: { name: "admin" } }, "admin")).toBe(false);
  });
});
