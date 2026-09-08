import { describe, expect, it } from "vitest";
import {
  algebraicDistractors,
  borrowingCandidates,
  buildBankPools,
  categoryDistractors,
  clockDistractors,
  embeddedNumberDistractors,
  emotionPhraseDistractors,
  expandQuestionBankToSix,
  fractionDistractors,
  hashStringToSeed,
  labelDistractors,
  numberWithUnitDistractors,
  passageClauseDistractors,
  seededRandom,
  sequenceDistractors,
  shuffleQuestionOptions,
} from "./optionRandomizer";

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

describe("sequenceDistractors（排序題）", () => {
  it("排列包含完全相同的階段，但順序不同", () => {
    const correct = "卵 → 幼蟲 → 蛹 → 成蟲";
    const options = [correct, "卵 → 幼蟲 → 成蟲 → 蛹"];
    const results = sequenceDistractors(options, correct);
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      const stages = result.split("→").map((stage) => stage.trim()).sort();
      expect(stages).toEqual(correct.split("→").map((stage) => stage.trim()).sort());
      expect(result.replace(/\s/g, "")).not.toBe(correct.replace(/\s/g, ""));
    }
  });
});

describe("fractionDistractors（分數題）", () => {
  it("「最大」比較題產生的分數必須比正解小", () => {
    const prompt = "下列哪一個分數最大？2/5、3/8、4/9、4/7。";
    const options = ["2/5", "3/8", "4/9", "4/7"];
    const results = fractionDistractors(prompt, options, "4/7");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      const match = result.match(/^(\d+)\/(\d+)$/)!;
      expect(Number(match[1]) / Number(match[2])).toBeLessThan(4 / 7);
    }
  });

  it("一般分數題產生相異分數且不重複", () => {
    const results = fractionDistractors("擲骰子出現偶數的機率是多少？", ["1/6", "1/3", "1/2", "2/3"], "1/2");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result).not.toBe("1/2");
      expect(results.indexOf(result)).toBe(results.lastIndexOf(result));
    }
  });
});

describe("clockDistractors（時刻題）", () => {
  it("產生合法時刻（小時 0–24、分鐘 0–59）且與正解不同", () => {
    for (const correct of ["10:05", "4:45", "08:30"]) {
      const results = clockDistractors(correct);
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        const match = result.match(/^(\d{1,2}):(\d{2})$/)!;
        expect(Number(match[1])).toBeGreaterThanOrEqual(0);
        expect(Number(match[1])).toBeLessThanOrEqual(24);
        expect(Number(match[2])).toBeLessThan(60);
        expect(result).not.toBe(correct);
      }
    }
  });
});

describe("categoryDistractors（封閉類別）", () => {
  it("方位題補上其他方位", () => {
    const results = categoryDistractors(["北方", "南方", "東方", "西方"], new Set());
    expect(results).toEqual(expect.arrayContaining(["東北方", "東南方", "西北方", "西南方"]));
  });

  it("單字方位題也能觸發", () => {
    const results = categoryDistractors(["北", "南", "東", "西"], new Set());
    expect(results).toEqual(expect.arrayContaining(["東北方", "東南方"]));
    expect(results).not.toContain("北");
    expect(results.every((result) => result.endsWith("方"))).toBe(true);
  });

  it("雲類題補上其他真實雲名", () => {
    const results = categoryDistractors(["卷雲", "積雲", "層雲", "積雨雲"], new Set());
    expect(results).toEqual(expect.arrayContaining(["高積雲", "層積雲"]));
    for (const result of results) expect(result).toContain("雲");
  });
});

describe("emotionPhraseDistractors（長句情緒）", () => {
  it("≥2 個「情緒，因為…」選項時補上其他情緒反應句", () => {
    const options = ["高興，因為考了一百分", "難過，因為跌倒受傷了", "開心，因為出去玩", "生氣，因為東西被弄壞"];
    const results = emotionPhraseDistractors(options);
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) expect(result).toContain("因為");
  });

  it("不是情緒句型時不觸發", () => {
    expect(emotionPhraseDistractors(["北方", "南方", "東方", "西方"])).toHaveLength(0);
  });
});

describe("labelDistractors（標籤枚舉題）", () => {
  it("天干標籤補題幹未提到的下一個標籤", () => {
    const prompt = "社區有四個公園：甲公園12棵、乙公園18棵、丙公園15棵、丁公園9棵。哪一個公園樹木最多？";
    const options = ["甲公園", "乙公園", "丙公園", "丁公園"];
    const results = labelDistractors(prompt, options, "乙公園");
    expect(results).toContain("戊公園");
    for (const result of results) expect(prompt).not.toContain(result);
  });

  it("字母標籤支援「社區A」後綴形式", () => {
    const prompt = "社區A人口3000人、社區B2000人、社區C2500人，哪個社區高齡比例最高？";
    const options = ["社區A", "社區B", "社區C", "三個社區一樣"];
    const results = labelDistractors(prompt, options, "社區B");
    expect(results).toContain("社區D");
  });

  it("星期標籤只補題幹沒列出的日子", () => {
    const prompt = "星期一3袋、星期二2袋、星期三4袋、星期四3袋、星期五2袋，哪一天回收最多？";
    const options = ["星期一", "星期二", "星期三", "星期五"];
    const results = labelDistractors(prompt, options, "星期三");
    expect(results).toContain("星期六");
    expect(results).not.toContain("星期四");
  });
});

describe("passageClauseDistractors（文段抽取）", () => {
  it("只有國語學科觸發", () => {
    const prompt = "段落：蝴蝶卵孵化後變成毛毛蟲，幼蟲吃葉子長大。請問蝴蝶怎麼繁殖？";
    const options = ["產卵", "分裂", "種子", "發芽"];
    expect(passageClauseDistractors("自然", prompt, options, "產卵")).toHaveLength(0);
    const chinese = passageClauseDistractors("國語", prompt, options, "產卵");
    expect(chinese.length).toBeGreaterThan(0);
  });

  it("是非／評價框架題（恰當／不恰當）不抽取子句", () => {
    const prompt = "故事：小明球賽輸了，全隊很沮喪。媽媽安慰他們說：「失敗乃成功之母。」這句話用法是否恰當？";
    const options = ["恰當，表示失敗能成為學習經驗", "不恰當，表示失敗就是沒有希望", "不恰當，表示應該放棄", "不恰當，表示勝負不重要"];
    expect(passageClauseDistractors("國語", prompt, options, options[0])).toHaveLength(0);
  });
});

describe("embeddedNumberDistractors（句中數字擾動）", () => {
  it("保留文字骨架並更動數字", () => {
    const results = embeddedNumberDistractors("老師把18支鉛筆平分給4人，每人幾支？剩幾支？", ["每位4支，剩2支", "每位3支", "每位5支", "每位6支"], "每位4支，剩2支");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result).toContain("支");
      expect(result).not.toBe("每位4支，剩2支");
    }
  });

  it("答案中重複出現的數字會同步取代（保持句子一致）", () => {
    const correct = "-21 公釐（下降21公釐）";
    const results = embeddedNumberDistractors("水塘水量變化是多少？", [correct, "-10 公釐", "-30 公釐", "10 公釐"], correct);
    for (const result of results) {
      const numbers = result.match(/-?\d+/g) ?? [];
      // 兩處數字必須同步（-26 與 26），不能出現前後矛盾
      const magnitudes = numbers.map((number) => Math.abs(Number(number)));
      expect(new Set(magnitudes).size).toBe(1);
    }
  });
});

describe("numberWithUnitDistractors（數字加單位）", () => {
  it("保留單位、擾動數字且不重複現有選項", () => {
    const results = numberWithUnitDistractors("媽媽買了45顆蘋果，每袋9顆，可以裝幾袋？", ["3 袋", "4 袋", "5 袋", "6 袋"], "5 袋");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result).toMatch(/^\d+\s*袋$/);
      expect(["3 袋", "4 袋", "5 袋", "6 袋"]).not.toContain(result);
    }
  });
});

describe("algebraicDistractors（代數式）", () => {
  it("產生結構相似但意義不同的算式", () => {
    const results = algebraicDistractors("下面哪一個代數式代表「某數增加5後乘以3」？", ["3(x+5)", "3x+5", "3(x-5)", "5(x+3)"], "3(x+5)");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result).toMatch(/^\d+\(x[+-]\d+\)$/);
      expect(result).not.toBe("3(x+5)");
    }
  });
});

describe("borrowingCandidates（跨題借用）", () => {
  it("標點符號題不借用任何文字選項", () => {
    const questions: TestQuestion[] = [
      { ...BANK[2] },
      {
        id: "p1",
        subject: "國語",
        learningTopic: "標點",
        prompt: "下列句子中，標點使用正確的是哪一項？",
        explanation: "標點規則。",
        options: ["小明買了蘋果、香蕉和葡萄。", "小明買了，蘋果、香蕉和葡萄。", "小明買了蘋果香蕉葡萄。", "小明買了蘋果、香蕉、與葡萄。"],
        answer: 0,
      },
    ];
    const pools = buildBankPools(questions);
    const punctuation = questions[1];
    expect(borrowingCandidates(punctuation, pools, punctuation.prompt)).toHaveLength(0);
  });

  it("借來的選項不會冒出題幹沒有的人物", () => {
    const questions: TestQuestion[] = [
      BANK[2],
      {
        id: "l2",
        subject: "國語",
        learningTopic: "記敘文",
        prompt: "故事中阿美最喜歡做的事是什麼？",
        explanation: "阿美喜歡畫畫。",
        options: ["阿美在畫畫", "阿美在唱歌", "阿美在跑步", "阿美在看書"],
        answer: 0,
      },
    ];
    const pools = buildBankPools(questions);
    for (const candidate of borrowingCandidates(questions[2] ?? questions[1], pools, questions[1].prompt)) {
      expect(candidate).not.toContain("小明");
    }
  });
});
