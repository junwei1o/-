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
import { ADMIN_MODULES } from "./modules";

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

describe("⭐ 不變式：真實模組集不得與分組同名（2026-10-01）", () => {
  it("分組標題與模組標題不得重複——否則 getByRole 會多重匹配，畫面上也會讓站長混淆", () => {
    const groupLabels = new Set(ADMIN_GROUPS.map((group) => group.label));
    const collisions = ADMIN_MODULES.filter((module) => groupLabels.has(module.title)).map((module) => module.title);
    expect(collisions).toEqual([]);
  });

  it("模組 id 不得重複", () => {
    const ids = ADMIN_MODULES.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("每個模組的分組都已登記（未登記雖不會壞，但不該在正式模組集裡出現）", () => {
    const known = new Set(ADMIN_GROUPS.map((group) => group.id));
    const unregistered = ADMIN_MODULES.filter((module) => !known.has(module.group)).map((module) => module.id);
    expect(unregistered).toEqual([]);
  });
});

describe("⭐ 不變式：分組順序（2026-10-01 第二輪）", () => {
  it("每個分組的 order 不得重複——重複會讓畫面順序變成未定義（依陣列順序），難以預期", () => {
    const orders = ADMIN_GROUPS.map((group) => group.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("分組必須依 order 遞增排列——陣列順序要等於顯示順序，否則讀原始碼會被誤導", () => {
    const orders = ADMIN_GROUPS.map((group) => group.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("巡檢動線正確：內容與題庫在成本與用量之前，成本與用量在存取與角色之前", () => {
    const at = (id: string) => ADMIN_GROUPS.findIndex((group) => group.id === id);
    expect(at("operations")).toBeLessThan(at("content"));
    expect(at("content")).toBeLessThan(at("usage"));
    expect(at("usage")).toBeLessThan(at("access"));
    expect(at("access")).toBeLessThan(at("maintenance"));
    expect(at("maintenance")).toBeLessThan(at("system"));
  });
});
