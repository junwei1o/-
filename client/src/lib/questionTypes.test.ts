import { describe, expect, it } from "vitest";
import {
  FEATURES,
  IMPLEMENTED_QUESTION_TYPES,
  QUESTION_TYPES,
  questionTypeById,
  questionTypeIdFromBankLabel,
  supportsFeature,
  typesSupporting,
} from "./questionTypes";

describe("questionTypes 註冊表", () => {
  it("每個題型都有 features，且不重複", () => {
    for (const t of QUESTION_TYPES) {
      expect(t.features.length).toBeGreaterThan(0);
      expect(new Set(t.features).size).toBe(t.features.length);
    }
  });

  it("features 只包含已定義的功能維度", () => {
    for (const t of QUESTION_TYPES) {
      for (const f of t.features) expect(FEATURES).toContain(f);
    }
  });

  it("已實作題型＝選擇／是非／配對", () => {
    expect(IMPLEMENTED_QUESTION_TYPES.map((t) => t.id).sort()).toEqual([
      "matching",
      "single-choice",
      "true-false",
    ]);
  });

  it("bank label 可映射到 id", () => {
    expect(questionTypeIdFromBankLabel("選擇題")).toBe("single-choice");
    expect(questionTypeIdFromBankLabel("是非題")).toBe("true-false");
    expect(questionTypeIdFromBankLabel("填空題")).toBeUndefined();
  });
});

describe("supportsFeature 支援矩陣契約", () => {
  it("選擇題支援排行榜", () => {
    expect(supportsFeature("single-choice", "排行榜")).toBe("yes");
  });

  it("簡答題不支援排行榜（設計時必須降級）", () => {
    expect(supportsFeature("short-answer", "排行榜")).toBe("no");
  });

  it("申論題不應支援組卷與自動批改", () => {
    expect(supportsFeature("open-ended", "組卷")).toBe("no");
    expect(supportsFeature("open-ended", "自動批改")).toBe("no");
  });

  it("填空題的自動批改＝planned（schema 已定案、尚未實作）", () => {
    expect(supportsFeature("fill-blank", "自動批改")).toBe("planned");
  });

  it("題組題的組卷＝conditional（容器已有）", () => {
    expect(supportsFeature("passage-group", "組卷")).toBe("conditional");
  });

  it("未知題型一律回 no", () => {
    expect(supportsFeature("__nope__" as never, "排行榜")).toBe("no");
  });
});

describe("typesSupporting", () => {
  it("現在就能計入排行榜的題型不含簡答／申論", () => {
    const list = typesSupporting("排行榜");
    expect(list).toContain("single-choice");
    expect(list).toContain("true-false");
    expect(list).toContain("matching");
    expect(list).not.toContain("short-answer");
    expect(list).not.toContain("open-ended");
    expect(list).not.toContain("fill-blank");
  });

  it("AI 導讀支援全部題型", () => {
    expect(typesSupporting("AI導讀").length).toBe(QUESTION_TYPES.length);
  });

  it("questionTypeById 可查得規格", () => {
    expect(questionTypeById("matching")?.uiKind).toBe("pairing-board");
  });
});
