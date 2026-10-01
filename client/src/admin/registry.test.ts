import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_GROUPS,
  clearAdminModulesForTest,
  getAdminModules,
  groupAdminModules,
  registerAdminModule,
  registerAdminModules,
} from "./registry";
import type { AdminModule } from "./types";

function mod(id: string, group: string, order = 0, extra: Partial<AdminModule> = {}): AdminModule {
  return { id, title: `標題-${id}`, group, order, render: () => null, ...extra };
}

beforeEach(() => {
  clearAdminModulesForTest();
});

describe("註冊表：模組排序", () => {
  it("同組內依 order 由小到大", () => {
    registerAdminModules([mod("c", "operations", 30), mod("a", "operations", 10), mod("b", "operations", 20)]);
    expect(getAdminModules().map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("未給 order 視為 0（排在同組最前）", () => {
    registerAdminModules([mod("with", "operations", 5), mod("without", "operations")]);
    expect(getAdminModules().map((m) => m.id)).toEqual(["without", "with"]);
  });

  it("重複 id 會被後者覆蓋（方便測試與熱替換）", () => {
    registerAdminModule(mod("dup", "operations", 1, { title: "舊" }));
    registerAdminModule(mod("dup", "operations", 1, { title: "新" }));
    const list = getAdminModules();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("新");
  });
});

describe("註冊表：isAvailable 過濾", () => {
  it("回 false 的模組不會出現", () => {
    registerAdminModules([mod("on", "operations"), mod("off", "operations", 0, { isAvailable: () => false })]);
    expect(getAdminModules().map((m) => m.id)).toEqual(["on"]);
  });

  it("⭐ isAvailable 拋錯時『隱藏該模組』而不是讓整個後台掛掉", () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerAdminModules([
      mod("safe", "operations"),
      mod("boom", "operations", 0, {
        isAvailable: () => {
          throw new Error("旗標讀取失敗");
        },
      }),
    ]);
    expect(() => getAdminModules()).not.toThrow();
    expect(getAdminModules().map((m) => m.id)).toEqual(["safe"]);
    consoleWarn.mockRestore();
  });
});

describe("分組：⭐ 未登記的分組不會被丟掉（擴充性核心保證）", () => {
  it("宣告過的分組依 ADMIN_GROUPS 的 order 排列", () => {
    registerAdminModules([mod("sys", "system"), mod("ops", "operations"), mod("acc", "access")]);
    const groups = groupAdminModules();
    expect(groups.map((g) => g.group.id)).toEqual(["operations", "access", "system"]);
  });

  it("未登記的分組會被自動附加在最後，並保留模組", () => {
    registerAdminModules([mod("future", "brand-new-group"), mod("ops", "operations")]);
    const groups = groupAdminModules();
    expect(groups.map((g) => g.group.id)).toEqual(["operations", "brand-new-group"]);
    const future = groups[1];
    expect(future.modules.map((m) => m.id)).toEqual(["future"]);
    // 自動產生的分組會用 id 當標題，並提示去 ADMIN_GROUPS 補說明
    expect(future.group.label).toBe("brand-new-group");
    expect(future.group.description).toContain("ADMIN_GROUPS");
  });

  it("多個未登記分組都保留，且維持首次出現的相對順序", () => {
    registerAdminModules([mod("x", "group-x"), mod("y", "group-y"), mod("ops", "operations")]);
    const groups = groupAdminModules();
    expect(groups.map((g) => g.group.id)).toEqual(["operations", "group-x", "group-y"]);
  });

  it("沒有模組的已宣告分組不會出現（宣告了但還沒內容是正常的）", () => {
    const declaredWithoutModules = ADMIN_GROUPS.filter((g) => !["operations", "access", "system"].includes(g.id));
    expect(declaredWithoutModules.length).toBeGreaterThan(0); // 例如 content 目前是預留
    registerAdminModules([mod("ops", "operations")]);
    expect(groupAdminModules().map((g) => g.group.id)).toEqual(["operations"]);
  });
});

describe("註冊表：span 與內容型態", () => {
  it("span 預設為 half（未指定時由外殼決定半寬）", () => {
    registerAdminModule(mod("a", "operations"));
    expect(getAdminModules()[0].span).toBeUndefined();
  });

  it("render 可回傳任意 ReactNode（型態不限）", () => {
    registerAdminModule(mod("a", "operations", 0, { render: () => "純字串也可以" }));
    expect(getAdminModules()[0].render()).toBe("純字串也可以");
  });
});
