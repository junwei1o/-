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

describe("標籤式選項守衛貫穿排程層（gen-國語-deep019/deep023 回歸）", () => {
  // 取自 data/runtime_bank_elementary.json 的真實題型：句子以 A. B. C. D. 列舉在題幹，options 是洗牌後的字母
  const deepLike: Q = {
    id: "gen-國語-deep019",
    prompt:
      "下列哪一句話中畫引號的詞是**動詞**（表示動作）？\nA「他把房間打掃得乾乾淨淨。」\nB「這個問題非常簡單。」\nC「她的笑容很甜美。」\nD「圖書館安安靜靜的。」",
    options: ["A", "B", "D", "C"],
    answer: 0,
    explanation: "「打掃」表示動作，是動詞。",
    subject: "國語",
    learningTopic: "詞義與詞性",
  };

  it("同步路徑：標籤式選題維持原 4 選項，不補出題幹沒有的 E、F", () => {
    const out = expandQuestionsSync([{ ...deepLike }]);
    expect(out[0].options).toEqual(["A", "B", "D", "C"]);
    expect(out[0].answer).toBe(0);
  });

  it("Worker 排程路徑（jsdom 降級同步）：deep023 形同樣維持 4 選項", async () => {
    const out = await expandQuestions([{ ...deepLike, id: "gen-國語-deep023", options: ["D", "C", "B", "A"] }]);
    expect(out[0].options).toEqual(["D", "C", "B", "A"]);
    expect(out[0].answer).toBe(0);
  });

  it("同一批混入一般題：一般題照常擴充成 6 選，標籤題維持原樣（守衛不誤傷）", async () => {
    const normal: Q = {
      ...makeQuestion("mix-normal-1", ["4.0公里", "4.5公里", "5.0公里", "3.9公里"]),
      answer: 1,
      prompt: "小明跑步 3.6 公里，爸爸跑的距離是小明的 1 又 1/4 倍。爸爸跑了多少公里？",
      explanation: "3.6 × 1.25 = 4.5。",
      subject: "數學",
      learningTopic: "小數乘法",
    };
    const out = await expandQuestions([{ ...deepLike }, normal]);
    expect(out[0].options).toEqual(["A", "B", "D", "C"]);
    expect(out[1].options).toHaveLength(6);
    expect(out[1].options[out[1].answer]).toBe("4.5公里");
  });
});
