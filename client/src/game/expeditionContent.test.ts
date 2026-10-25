import { describe, expect, it } from "vitest";
import { CURRICULUM_QUESTIONS, getRareMonsters, type SubjectKey } from "./expeditionContent";

describe("expedition content", () => {
  it("provides four complete 100-question subject banks", () => {
    (Object.keys(CURRICULUM_QUESTIONS) as SubjectKey[]).forEach((subject) => {
      const questions = CURRICULUM_QUESTIONS[subject];
      expect(questions).toHaveLength(100);
      expect(new Set(questions.map((question) => question.id)).size).toBe(100);
      questions.forEach((question) => {
        // 找到幾個真的干擾項就用幾個（4、5 或 6 個選項）；
        // 找不到時維持 4 選題，不為了湊滿 6 個硬塞「以上皆非」——那正是會被學生唸的變態題。
        expect([4, 5, 6]).toContain(question.options.length);
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        if (question.options.length === 4) {
          expect(question.options).not.toContain("以上皆非");
          expect(question.options).not.toContain("以上皆是");
        }
        expect(question.prompt.trim()).not.toBe("");
        expect(question.explanation.trim()).not.toBe("");
        expect(["concept", "careless", "memory"]).toContain(question.errorTag);
      });
    });
  });

  it("provides three rare monsters per subject", () => {
    (Object.keys(CURRICULUM_QUESTIONS) as SubjectKey[]).forEach((subject) => {
      const rareMonsters = getRareMonsters(subject);
      expect(rareMonsters).toHaveLength(3);
      expect(new Set(rareMonsters.map((monster) => monster.id)).size).toBe(3);
      rareMonsters.forEach((monster) => {
        expect(monster.requiredStreak).toBe(10);
        expect(monster.title).toMatch(/^擊敗後獲得限定稱號：/);
      });
    });
  });
});

/**
 * 效能防回歸閘門：題庫展開必須保持「惰性」。
 *
 * 背景：`expandQuestionBankToSix`（4→6 選項借用）是 57-88ms 的重計算
 * （佔本模組初始化 99.8%）。它曾經寫在 `export const` 的初始化式，
 * 導致 import 即同步執行 —— /badges、/settings、/community、/learning-report
 * 四頁每次首載各多 250ms 主執行緒阻塞（4x 降速實測，20 個測量點全數重現），
 * 而 /badges 與 /settings 其實只用 getRareMonsters、根本不需要這份題庫。
 *
 * 改為 getter 之後，真正的計算被推遲到「首次存取該科目」才發生。
 * 這裡以 property descriptor 鎖住這個結構：若哪天有人改回
 * `const CURRICULUM_QUESTIONS = { chinese: expandQuestionBankToSix(...) }`
 * （一個有 value、沒有 get 的資料屬性），本測試就會失敗。
 *
 * 為什麼用結構檢查而不是直接量測時間：CI runner 的效能波動大，
 * 時間閘門容易 flaky；而「是不是 getter」是確定性的事實，
 * 且它正是 250ms 卡頓的唯一成因。
 */
describe("expedition content 效能防回歸", () => {
  it("CURRICULUM_QUESTIONS 的每個科目都是 getter（展開不得在 import 時執行）", () => {
    const subjects = ["chinese", "math", "english", "science", "social"] as SubjectKey[];
    for (const subject of subjects) {
      const descriptor = Object.getOwnPropertyDescriptor(CURRICULUM_QUESTIONS, subject);
      expect(descriptor, `${subject} 缺少 property descriptor`).toBeTruthy();
      // 有 getter → 惰性；有 value → import 時就求值（會讓首屏多 250ms 阻塞）
      expect(typeof descriptor!.get, `${subject} 必須是 getter，不可是 eager value`).toBe("function");
      expect("value" in descriptor!, `${subject} 不可帶 value（那代表 import 即展開）`).toBe(false);
    }
  });

  it("Object.keys 與索引存取仍正常運作（API 相容性）", () => {
    expect(Object.keys(CURRICULUM_QUESTIONS).sort()).toEqual(
      ["chinese", "english", "math", "science", "social"]
    );
    // 存取會觸發惰性計算，回傳結果應與原本一致
    expect(CURRICULUM_QUESTIONS.chinese).toHaveLength(100);
  });
});
