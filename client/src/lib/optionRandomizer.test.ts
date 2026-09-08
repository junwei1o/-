import { describe, expect, it } from "vitest";
import { expandQuestionBankToSix, hashStringToSeed, seededRandom, shuffleQuestionOptions } from "./optionRandomizer";

type TestQuestion = {
  id: string;
  subject: string;
  learningTopic: string;
  prompt: string;
  explanation: string;
  options: string[];
  answer: number;
  strongDistractor?: { optionIndex: number; note: string };
};

const BANK: TestQuestion[] = [
  {
    id: "m1",
    subject: "數學",
    learningTopic: "倍數與因數",
    prompt: "下列哪一個數是 5 的倍數？",
    explanation: "5 的倍數末位必為 0 或 5。",
    options: ["27", "40", "33", "18"],
    answer: 1,
  },
  {
    id: "m2",
    subject: "數學",
    learningTopic: "倍數與因數",
    prompt: "下列哪一個數是 3 的倍數？",
    explanation: "3 的倍數各位數字和為 3 的倍數。",
    options: ["14", "21", "25", "31"],
    answer: 1,
  },
  {
    id: "l1",
    subject: "國語",
    learningTopic: "記敘文",
    prompt: "故事中最先發生的事是哪一項？",
    explanation: "依時間順序詞判斷，最先發生的是小明在家吃早餐。",
    options: ["小明在家吃早餐", "小華放風箏", "小明騎車", "小華整理書包"],
    answer: 0,
    strongDistractor: { optionIndex: 2, note: "時間順序" },
  },
];

describe("expandQuestionBankToSix", () => {
  it("把每題擴充成 6 個相異選項，且不改變正解文字", () => {
    const expanded = expandQuestionBankToSix(BANK);
    expect(expanded).toHaveLength(3);
    for (const question of expanded) {
      expect(question.options).toHaveLength(6);
      expect(new Set(question.options).size).toBe(6);
      expect(question.options[question.answer]).toBe(BANK.find((q) => q.id === question.id)!.options[BANK.find((q) => q.id === question.id)!.answer]);
    }
  });

  it("數字題的擾動選項必須違反題目規則（倍數題不會產生第二個倍數）", () => {
    const expanded = expandQuestionBankToSix(BANK);
    const multiplesOf5 = expanded[0];
    const extras = multiplesOf5.options.slice(4);
    expect(extras.every((option) => /^\d+$/.test(option) && Number(option) % 5 !== 0)).toBe(true);
  });

  it("文字題借用同主題其他題目的干擾選項，且不會借到任何一題的正解", () => {
    const expanded = expandQuestionBankToSix(BANK);
    const languageQuestion = expanded[2];
    const original = new Set(BANK[2].options);
    const extras = languageQuestion.options.slice(4);
    expect(extras).toHaveLength(2);
    for (const extra of extras) {
      expect(original.has(extra)).toBe(false);
      expect(extra).not.toBe("小明在家吃早餐");
    }
  });

  it("保留 strongDistractor（附加選項不改變前 4 個索引）", () => {
    const expanded = expandQuestionBankToSix(BANK);
    expect(expanded[2].strongDistractor?.optionIndex).toBe(2);
  });

  it("已經是 6 選項的題目維持原樣", () => {
    const sixOptionQuestion = { ...BANK[0], options: ["1", "2", "3", "4", "5", "6"], answer: 2 };
    const expanded = expandQuestionBankToSix([sixOptionQuestion]);
    expect(expanded[0].options).toEqual(["1", "2", "3", "4", "5", "6"]);
  });
});

describe("shuffleQuestionOptions", () => {
  it("打乱後正解文字不變，answer 指向同一個文字", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const shuffled = shuffleQuestionOptions(BANK[0], seededRandom(seed));
      expect(shuffled.options[shuffled.answer]).toBe("40");
    }
  });

  it("打乱是原本選項的重新排列", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const shuffled = shuffleQuestionOptions(BANK[2], seededRandom(seed));
      expect([...shuffled.options].sort()).toEqual([...BANK[2].options].sort());
    }
  });

  it("strongDistractor.optionIndex 會對應打乱後的位置", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const shuffled = shuffleQuestionOptions(BANK[2], seededRandom(seed));
      expect(shuffled.options[shuffled.strongDistractor!.optionIndex]).toBe("小明騎車");
    }
  });

  it("同一種子順序穩定，不同種子（通常）不同", () => {
    const first = shuffleQuestionOptions(BANK[0], seededRandom(42));
    const again = shuffleQuestionOptions(BANK[0], seededRandom(42));
    expect(again.options).toEqual(first.options);
    let differed = false;
    for (let seed = 1; seed < 20 && !differed; seed += 1) {
      const other = shuffleQuestionOptions(BANK[0], seededRandom(seed));
      if (other.options.join("|") !== first.options.join("|")) differed = true;
    }
    expect(differed).toBe(true);
  });
});

describe("hashStringToSeed / seededRandom", () => {
  it("同一輸入產生穩定種子與穩定亂數序列", () => {
    expect(hashStringToSeed("m1")).toBe(hashStringToSeed("m1"));
    const left = seededRandom(hashStringToSeed("m1"));
    const right = seededRandom(hashStringToSeed("m1"));
    expect([left(), left()]).toEqual([right(), right()]);
  });
});
