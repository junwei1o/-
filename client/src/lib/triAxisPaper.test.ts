// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  AXIS_META,
  AXIS_ORDER,
  DEFAULT_AXIS_QUOTA,
  DEFAULT_TRI_AXIS_SIZE,
  buildTriAxisPaper,
  scoreTriAxisPaper,
  type TriAxisQuestion,
} from "./triAxisPaper";
import type { PaperQuestion } from "./paperExam";
import type { LearningRecord } from "@/utils/storage";

/** 造一批題目：每個年級 × 每個科目 × 每種難度各一題，方便驗證取題規則。 */
function makeBank(): PaperQuestion[] {
  const subjects = ["國語", "數學", "自然", "社會"] as const;
  const difficulties = ["基礎", "標準", "挑戰"] as const;
  const out: PaperQuestion[] = [];
  for (const grade of [3, 4, 5, 6]) {
    for (const subject of subjects) {
      for (const difficulty of difficulties) {
        out.push({
          id: `g${grade}-${subject}-${difficulty}`,
          grade,
          subject,
          difficulty,
          learningTopic: `${subject} ${difficulty}`,
          prompt: `${grade} 年級 ${subject} ${difficulty}`,
          options: ["A", "B", "C", "D"],
          answer: 0,
          explanation: "解析",
        });
      }
    }
  }
  return out;
}

function record(questionId: string, isCorrect: boolean, timestamp = 1): LearningRecord {
  return { questionId, subject: "數學", isCorrect, timestamp, flagged: false };
}

const prefs = { version: 1 as const, gradeLevel: 5 as const, difficultyPreference: "均衡混合" as const, updatedAt: 1 };

describe("buildTriAxisPaper", () => {
  const bank = makeBank();

  it("三軸交錯排列：過去 → 現在 → 未來 循環", () => {
    const records = [
      record("g5-國語-基礎", false, 1),
      record("g5-數學-基礎", false, 2),
      record("g5-自然-基礎", false, 3),
      record("g5-社會-基礎", false, 4),
    ];
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs });
    expect(deck.questions.length).toBe(DEFAULT_TRI_AXIS_SIZE);
    expect(deck.counts).toEqual({ 過去: 4, 現在: 4, 未來: 4 });
    // 每個三題一組，軸別必須是 過去/現在/未來
    for (let i = 0; i < deck.questions.length; i += 3) {
      expect(deck.questions[i].axis).toBe("過去");
      expect(deck.questions[i + 1]?.axis).toBe("現在");
      expect(deck.questions[i + 2]?.axis).toBe("未來");
    }
  });

  it("「過去」軸取自真實答錯過的題目（最近答錯的優先）", () => {
    const records = [
      record("g5-國語-基礎", false, 100),
      record("g5-數學-標準", false, 200),
      record("g5-自然-挑戰", true, 300), // 答對的不算錯題
    ];
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs });
    const past = deck.questions.filter((q) => q.axis === "過去").map((q) => q.id);
    expect(past).toContain("g5-數學-標準");
    expect(past).toContain("g5-國語-基礎");
    expect(past).not.toContain("g5-自然-挑戰");
    // 最近答錯（timestamp 200）排在前面
    expect(past[0]).toBe("g5-數學-標準");
  });

  it("「現在」軸的年級等於內容等級", () => {
    const deck = buildTriAxisPaper({ questions: bank, records: [], preferences: prefs });
    const now = deck.questions.filter((q) => q.axis === "現在");
    expect(now.length).toBeGreaterThan(0);
    expect(now.every((q) => q.grade === 5)).toBe(true);
  });

  it("同一題不會在試卷中出現兩次", () => {
    const records = [record("g5-數學-標準", false)];
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs });
    const ids = deck.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("「過去」與「未來」的題目不會重複取用", () => {
    const records = [record("g5-數學-標準", false)];
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs });
    const past = new Set(deck.questions.filter((q) => q.axis === "過去").map((q) => q.id));
    const future = deck.questions.filter((q) => q.axis === "未來").map((q) => q.id);
    expect(future.some((id) => past.has(id))).toBe(false);
  });

  it("沒有錯題紀錄時，「過去」軸為 0 題（不拿普通題冒充錯題），總題數仍由其他軸補齊", () => {
    const deck = buildTriAxisPaper({ questions: bank, records: [], preferences: prefs });
    expect(deck.counts.過去).toBe(0);
    expect(deck.questions.filter((q) => q.axis === "過去")).toHaveLength(0);
    expect(deck.questions.length).toBe(DEFAULT_TRI_AXIS_SIZE);
    // 補齊後仍不得有重複
    const ids = deck.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("軸別標示誠實：每題的 axis 與其來源池一致", () => {
    const records = [record("g5-國語-基礎", false)];
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs });
    for (const question of deck.questions) {
      if (question.axis === "過去") {
        // 過去軸的每一題，都必須真的在答錯紀錄裡
        expect(records.some((r) => r.questionId === question.id && !r.isCorrect)).toBe(true);
      }
      if (question.axis === "現在") {
        expect(question.grade).toBe(5);
      }
    }
  });

  it("同一個 seed 產生同一份試卷（可重現）", () => {
    const a = buildTriAxisPaper({ questions: bank, records: [], preferences: prefs, seed: 42 });
    const b = buildTriAxisPaper({ questions: bank, records: [], preferences: prefs, seed: 42 });
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
  });

  it("不同 seed 產生不同順序（避免每次都是同一份）", () => {
    const a = buildTriAxisPaper({ questions: bank, records: [], preferences: prefs, seed: 1 });
    const b = buildTriAxisPaper({ questions: bank, records: [], preferences: prefs, seed: 999 });
    expect(a.questions.map((q) => q.id)).not.toEqual(b.questions.map((q) => q.id));
  });

  it("題庫不足時不會爆掉，只是題數變少", () => {
    const tiny = bank.slice(0, 5);
    const deck = buildTriAxisPaper({ questions: tiny, records: [], preferences: prefs });
    expect(deck.questions.length).toBeLessThanOrEqual(5);
    expect(deck.questions.length).toBeGreaterThan(0);
  });

  it("題庫為空時回傳空試卷（呼叫端可據此顯示空狀態）", () => {
    const deck = buildTriAxisPaper({ questions: [], records: [], preferences: prefs });
    expect(deck.questions).toEqual([]);
  });

  it("配額可調整", () => {
    const deck = buildTriAxisPaper({ questions: bank, records: [], preferences: prefs, quota: 2 });
    expect(deck.questions.length).toBe(6);
  });
});

describe("scoreTriAxisPaper", () => {
  const bank = makeBank();
  const deck: TriAxisQuestion[] = buildTriAxisPaper({
    questions: bank,
    records: [],
    preferences: prefs,
  }).questions;

  it("全對時總分與各軸皆滿分", () => {
    const answers: Record<string, number> = {};
    for (const q of deck) answers[q.id] = q.answer;
    const score = scoreTriAxisPaper(deck, answers);
    expect(score.correct).toBe(deck.length);
    expect(score.percentage).toBe(100);
    for (const axis of AXIS_ORDER) {
      expect(score.byAxis[axis].correct).toBe(score.byAxis[axis].total);
    }
  });

  it("未作答時 answered 為 0，但 total 不變", () => {
    const score = scoreTriAxisPaper(deck, {});
    expect(score.answered).toBe(0);
    expect(score.correct).toBe(0);
    expect(score.total).toBe(deck.length);
  });

  it("各軸分項加總等於總分", () => {
    const answers: Record<string, number> = {};
    deck.forEach((q, i) => {
      answers[q.id] = i % 2 === 0 ? q.answer : (q.answer + 1) % q.options.length;
    });
    const score = scoreTriAxisPaper(deck, answers);
    const axisTotal = AXIS_ORDER.reduce((sum, axis) => sum + score.byAxis[axis].total, 0);
    const axisCorrect = AXIS_ORDER.reduce((sum, axis) => sum + score.byAxis[axis].correct, 0);
    expect(axisTotal).toBe(score.total);
    expect(axisCorrect).toBe(score.correct);
  });

  it("空試卷不會除以零", () => {
    const score = scoreTriAxisPaper([], {});
    expect(score.percentage).toBe(0);
    expect(score.total).toBe(0);
  });
});

describe("軸別文案", () => {
  it("三軸都有主題名、學習狀態與說明", () => {
    for (const axis of AXIS_ORDER) {
      const meta = AXIS_META[axis];
      expect(meta.name.length).toBeGreaterThan(0);
      expect(meta.status.length).toBeGreaterThan(0);
      expect(meta.hint.length).toBeGreaterThan(0);
      expect(meta.eyebrow).toMatch(/^[A-Z]/);
    }
  });

  it("「過去」軸對應錯題魔王", () => {
    expect(AXIS_META.過去.name).toBe("錯題魔王");
  });

  it("三軸的主題名互不相同（形成清楚進程感）", () => {
    const names = AXIS_ORDER.map((axis) => AXIS_META[axis].name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("預設配額為三軸各 4 題", () => {
    expect(DEFAULT_AXIS_QUOTA).toBe(4);
    expect(DEFAULT_TRI_AXIS_SIZE).toBe(12);
  });
});

describe("重做保證（需求 R1/R2/R4）", () => {
  const bank = makeBank();
  const records = [
    record("g5-數學-基礎", false, 1),
    record("g5-國語-標準", false, 2),
  ];

  it("重做時選項排列與上次不同，也與題庫原始排列不同", () => {
    const first = buildTriAxisPaper({ questions: bank, records, preferences: prefs, seed: 11 });
    const second = buildTriAxisPaper({
      questions: bank,
      records,
      preferences: prefs,
      seed: 22,
      previousDeck: first.questions,
    });
    expect(second.questions.length).toBeGreaterThan(0);
    let differed = 0;
    for (const question of second.questions) {
      const original = bank.find((row) => row.id === question.id)!;
      const originalSignature = original.options.join("‖");
      const currentSignature = question.options.join("‖");
      // 不得與題庫原始排列相同
      expect(currentSignature).not.toBe(originalSignature);
      // 不得與上次 deck 中該題的排列相同
      const previous = first.questions.find((row) => row.id === question.id);
      if (previous && previous.options.join("‖") !== originalSignature) {
        if (currentSignature !== previous.options.join("‖")) differed += 1;
      } else {
        differed += 1;
      }
    }
    // 4 選題 24 種排列：若打亂真的生效，絕大多數題都應與上次不同
    expect(differed).toBe(second.questions.length);
  });

  it("previousDeck 可選：不傳時只保證與原始排列不同", () => {
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs, seed: 33 });
    for (const question of deck.questions) {
      const original = bank.find((row) => row.id === question.id)!;
      expect(question.options.join("‖")).not.toBe(original.options.join("‖"));
    }
  });

  it("打亂後正解文字不丟（options[answer] 仍是原正解）", () => {
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs, seed: 44 });
    for (const question of deck.questions) {
      const original = bank.find((row) => row.id === question.id)!;
      expect(question.options[question.answer]).toBe(original.options[original.answer]);
    }
  });

  it("seed A vs seed B：deck 的 id 序列不同（統計性，跑 5 組 seed）", () => {
    const sequences = new Set<string>();
    for (const seed of [101, 102, 103, 104, 105]) {
      const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs, seed });
      sequences.add(deck.questions.map((question) => question.id).join(","));
    }
    expect(sequences.size).toBeGreaterThan(1);
  });

  it("同 seed 重組前後（經 previousDeck）選項排列不同", () => {
    const first = buildTriAxisPaper({ questions: bank, records, preferences: prefs, seed: 55 });
    const second = buildTriAxisPaper({
      questions: bank,
      records,
      preferences: prefs,
      seed: 55,
      previousDeck: first.questions,
    });
    const signatures = (deck: TriAxisQuestion[]) =>
      deck.map((question) => `${question.id}:${question.options.join("‖")}`).join("｜");
    // 同一 seed 若選出相同題序，會觸發重掷 seed 保證（S3.2）；
    // 無論走哪條路，兩次試卷整體（題序＋選項排列）必須不同。
    expect(signatures(second.questions)).not.toBe(signatures(first.questions));
  });

  it("回歸：軸別計數與難度行為不變", () => {
    const deck = buildTriAxisPaper({ questions: bank, records, preferences: prefs, seed: 11 });
    expect(deck.questions.length).toBe(DEFAULT_TRI_AXIS_SIZE);
    // 過去軸來自真實錯題
    const pastIds = deck.questions.filter((question) => question.axis === "過去").map((question) => question.id);
    expect(pastIds.length).toBeGreaterThan(0);
    for (const id of pastIds) {
      expect(["g5-數學-基礎", "g5-國語-標準"]).toContain(id);
    }
  });
});
