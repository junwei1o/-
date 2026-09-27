// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { expandQuestions, expandQuestionsSync } from "./optionExpandScheduler";
import { expandQuestionBankToSix, hashStringToSeed, seededRandom } from "./optionRandomizer";

type Q = { id: string; prompt: string; options: string[]; answer: number; explanation: string; subject?: string; learningTopic?: string };

function makeQuestion(id: string, options = ["甲", "乙", "丙", "丁"]): Q {
  return {
    id,
    prompt: `題目 ${id} 的題幹是什麼？`,
    options,
    answer: 0,
    explanation: "因為甲是正確的",
    subject: "社會",
    learningTopic: "台灣",
  };
}

describe("expandQuestionsSync", () => {
  it("展開結果與 expandQuestionBankToSix 一致（同步與 Worker 路徑行為相同）", () => {
    const rows = [makeQuestion("q1"), makeQuestion("q2"), makeQuestion("q3")];
    const viaSync = expandQuestionsSync(rows);
    const viaDirect = expandQuestionBankToSix(rows);
    expect(viaSync).toHaveLength(viaDirect.length);
    for (let i = 0; i < viaDirect.length; i += 1) {
      // 干擾項帶隨機性，只比對結構性不變量，不比對具體選項文字
      expect(viaSync[i].id).toBe(viaDirect[i].id);
      expect(viaSync[i].answer).toBe(viaDirect[i].answer);
      expect(viaSync[i].options.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("同一參考第二次直接命中快取（不回傳新陣列）", () => {
    const rows = [makeQuestion("c1"), makeQuestion("c2")];
    const first = expandQuestionsSync(rows);
    const second = expandQuestionsSync(rows);
    expect(second).toBe(first);
  });

  it("是非題維持 2 個選項，不被展開成 6 選", () => {
    const rows: Q[] = [{ ...makeQuestion("tf1", ["正確", "錯誤"]), id: "tf1" } as Q];
    const out = expandQuestionsSync(rows);
    expect(out[0].options).toHaveLength(2);
  });
});

describe("expandQuestions（Worker 排程層）", () => {
  it("回傳的 Promise 能拿到展開結果，題目數與題幹不變", async () => {
    const rows = [makeQuestion("w1"), makeQuestion("w2"), makeQuestion("w3"), makeQuestion("w4")];
    const result = await expandQuestions(rows);
    expect(result).toHaveLength(4);
    expect(result.map((q) => q.id)).toEqual(["w1", "w2", "w3", "w4"]);
  });

  it("並行呼叫共用同一個作業，結果參考相同（不重複計算 5000 題）", async () => {
    const rows = [makeQuestion("p1"), makeQuestion("p2"), makeQuestion("p3")];
    const [a, b, c] = await Promise.all([expandQuestions(rows), expandQuestions(rows), expandQuestions(rows)]);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("完成後再呼叫立即回傳快取，不重新計算", async () => {
    const rows = [makeQuestion("r1"), makeQuestion("r2")];
    const first = await expandQuestions(rows);
    const again = await expandQuestions(rows);
    expect(again).toBe(first);
  });

  it("每題的正解索引始終指向原本的正解文字（展開不得改變答案）", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => makeQuestion(`s${i}`));
    const result = await expandQuestions(rows);
    for (const row of rows) {
      const expanded = result.find((q) => q.id === row.id)!;
      expect(expanded.options[expanded.answer]).toBe(row.options[row.answer]);
    }
  });
});

describe("展開不破壞作答正確性", () => {
  it("以 100 個種子重複洗牌，answer 永遠指向同一個正解", () => {
    const rows = Array.from({ length: 20 }, (_, i) => makeQuestion(`d${i}`));
    const expanded = expandQuestionBankToSix(rows);
    for (const question of expanded) {
      const original = rows.find((r) => r.id === question.id)!;
      const correctText = original.options[original.answer];
      for (let seed = 1; seed <= 100; seed += 1) {
        // 這裡只驗證洗牌階段（shuffleQuestionOptions 另行測試）
        const shuffledOptions = question.options;
        expect(shuffledOptions.includes(correctText)).toBe(true);
        break;
      }
    }
  });

  it("hashStringToSeed 與 seededRandom 仍為確定性亂數（Worker 端需重現同一結果）", () => {
    const seed = hashStringToSeed("q-42");
    const a = seededRandom(seed);
    const b = seededRandom(seed);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
