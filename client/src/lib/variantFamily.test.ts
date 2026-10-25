import { describe, expect, it } from "vitest";
import { familySiblingIds, hasVariantFamily, type VariantLike } from "./variantFamily";

/**
 * variantOf 家族解析單測——調度器與錯題備用題共用，這裡是單一的真相鎖。
 */

type Q = VariantLike & { variantOf?: unknown };

const bank = (items: Q[]): Map<string, VariantLike> => new Map(items.map((i) => [i.id, i]));

describe("familySiblingIds", () => {
  it("anchor 題 → 回傳 members（不含自己）", () => {
    const byId = bank([
      { id: "a", variantOf: { role: "anchor", kind: "variant", members: ["v1", "v2"] } },
      { id: "v1", variantOf: { role: "variant", kind: "variant", anchor: "a" } },
      { id: "v2", variantOf: { role: "variant", kind: "variant", anchor: "a" } },
    ]);
    expect(familySiblingIds(byId.get("a")!, byId)).toEqual(["v1", "v2"]);
  });

  it("variant 題 → 錨點排最前，再接兄弟，且不含自己", () => {
    const byId = bank([
      { id: "a", variantOf: { role: "anchor", kind: "variant", members: ["v1", "v2"] } },
      { id: "v1", variantOf: { role: "variant", kind: "variant", anchor: "a" } },
      { id: "v2", variantOf: { role: "variant", kind: "variant", anchor: "a" } },
    ]);
    expect(familySiblingIds(byId.get("v1")!, byId)).toEqual(["a", "v2"]);
  });

  it("無 variantOf / 髒形狀 → 空陣列（優雅降級，不拋錯）", () => {
    const byId = bank([{ id: "x" }, { id: "y", variantOf: null }, { id: "z", variantOf: "字串不是物件" }, { id: "w", variantOf: { role: "未知角色" } }]);
    for (const id of ["x", "y", "z", "w"]) expect(familySiblingIds(byId.get(id)!, byId)).toEqual([]);
  });

  it("懸空引用（指向庫外 id）→ 忽略該項，不返回查不到的 id", () => {
    const byId = bank([
      { id: "v1", variantOf: { role: "variant", kind: "variant", anchor: "不在庫裡" } },
      { id: "a2", variantOf: { role: "anchor", kind: "variant", members: ["幽靈題"] } },
    ]);
    expect(familySiblingIds(byId.get("v1")!, byId)).toEqual([]);
    expect(familySiblingIds(byId.get("a2")!, byId)).toEqual([]);
  });

  it("anchor 的 members 含重複/自己 → 原樣保留（呼叫端自己排除 source.id）", () => {
    const byId = bank([
      { id: "a", variantOf: { role: "anchor", kind: "variant", members: ["a", "v1", "v1"] } },
      { id: "v1" },
    ]);
    expect(familySiblingIds(byId.get("a")!, byId)).toEqual(["a", "v1", "v1"]);
  });

  it("variant 的錨點自己沒有 members → 只回錨點（不是空）", () => {
    const byId = bank([
      { id: "a" }, // 沒有 variantOf 的裸題被當作錨點引用目標
      { id: "v1", variantOf: { role: "variant", kind: "variant", anchor: "a" } },
    ]);
    expect(familySiblingIds(byId.get("v1")!, byId)).toEqual(["a"]);
  });
});

describe("hasVariantFamily", () => {
  it("有可解析家族 → true；無標記 → false", () => {
    const byId = bank([
      { id: "a", variantOf: { role: "anchor", kind: "variant", members: ["v1"] } },
      { id: "v1", variantOf: { role: "variant", kind: "variant", anchor: "a" } },
      { id: "solo" },
    ]);
    expect(hasVariantFamily(byId.get("a")!, byId)).toBe(true);
    expect(hasVariantFamily(byId.get("v1")!, byId)).toBe(true);
    expect(hasVariantFamily(byId.get("solo")!, byId)).toBe(false);
  });
});
