import { describe, expect, it } from "vitest";
import { QUESTION_TYPES } from "./questionTypes";
import {
  DEFAULT_SUBJECT_CONFIG,
  SUBJECTS,
  SUBJECT_CONFIGS,
  englishSkillOf,
  isAutoGradable,
  pendingDimensions,
  subjectConfigFor,
} from "./subjectConfig";

describe("科目字串與題庫一致", () => {
  it("五個科目＝題庫實際使用的字串", () => {
    expect([...SUBJECTS].sort()).toEqual(["國語", "數學", "社會", "自然", "英語"].sort());
  });

  it("「國語文」不是有效科目，會落到保守預設（避免查不到而靜默失敗）", () => {
    expect(subjectConfigFor("國語文")).toBe(DEFAULT_SUBJECT_CONFIG);
    expect(SUBJECT_CONFIGS["國語文" as never]).toBeUndefined();
  });

  it("每個科目都有 failureShape 與 extraDimensions", () => {
    for (const s of SUBJECTS) {
      expect(SUBJECT_CONFIGS[s].failureShape.length).toBeGreaterThan(0);
      expect(Array.isArray(SUBJECT_CONFIGS[s].extraDimensions)).toBe(true);
    }
  });
});

describe("可自動評分題型（交叉引用 questionTypes 註冊表）", () => {
  it("各科列出的題型都必須是註冊表中 autoGradable 且 implemented 的", () => {
    for (const s of SUBJECTS) {
      for (const t of SUBJECT_CONFIGS[s].autoGradableTypes) {
        const spec = QUESTION_TYPES.find((q) => q.id === t);
        expect(spec, `${s} 的 ${t} 不在註冊表`).toBeDefined();
        expect(spec!.autoGradable, `${t} 不應被列為可自動評分`).toBe(true);
        expect(spec!.implemented, `${t} 尚未實作，不應列入`).toBe(true);
      }
    }
  });

  it("未實作的 fill-blank 目前不在任何科目（實作後會自動納入）", () => {
    for (const s of SUBJECTS) {
      expect(SUBJECT_CONFIGS[s].autoGradableTypes).not.toContain("fill-blank");
    }
  });

  it("社會科暫不含填空題（目前題庫以選擇／是非／配對為主）", () => {
    expect(SUBJECT_CONFIGS["社會"].autoGradableTypes).toEqual([
      "single-choice",
      "true-false",
      "matching",
    ]);
  });

  it("isAutoGradable：已知科目用設定，未知科目用保守預設", () => {
    expect(isAutoGradable("數學", "single-choice")).toBe(true);
    expect(isAutoGradable("數學", "open-ended")).toBe(false);
    expect(isAutoGradable("未知科目", "single-choice")).toBe(true);
    expect(isAutoGradable("未知科目", "short-answer")).toBe(false);
  });
});

describe("診斷維度宣告（不得有回傳 0 的假實作）", () => {
  it("需要題目標籤的維度標為 needs-question-tags 並寫明所需標籤", () => {
    const dims = pendingDimensions("國語");
    expect(dims).toHaveLength(1);
    expect(dims[0].requiredTags).toContain("comprehensionLevel");
    expect(dims[0].status).toBe("needs-question-tags");
  });

  it("英語的語言技能維度＝available（由題型即可推導，無需新標籤）", () => {
    const dim = SUBJECT_CONFIGS["英語"].extraDimensions[0];
    expect(dim.status).toBe("available");
    expect(dim.source).toBe("question-type");
  });

  it("沒有科目宣告 source 為 question-tags 卻標 available（避免假實作）", () => {
    for (const s of SUBJECTS) {
      for (const d of SUBJECT_CONFIGS[s].extraDimensions) {
        if (d.source === "question-tags") expect(d.status).toBe("needs-question-tags");
      }
    }
  });
});

describe("englishSkillOf", () => {
  it("依題型對應認讀／拼寫／應用", () => {
    expect(englishSkillOf("single-choice")).toBe("recognition");
    expect(englishSkillOf("fill-blank")).toBe("spelling");
    expect(englishSkillOf("short-answer")).toBe("application");
  });
});
