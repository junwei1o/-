import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  canBuildVariant,
  buildVariant,
  detectShape,
  parseNumeric,
  tokenizeNumbers,
  type VariantSource,
} from "./questionVariant";

// ---------------------------------------------------------------------------
// 讀取真實題庫
// ---------------------------------------------------------------------------

const bankPath = path.join(process.cwd(), "data", "taiwan_curriculum_500.json");
const bank = JSON.parse(fs.readFileSync(bankPath, "utf-8"));
const questions: any[] = bank.questions;

function toSource(q: any): VariantSource {
  return {
    id: q.id,
    subject: q.subject,
    grade: q.grade,
    learningTopic: q.learningTopic,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  };
}

function numbersOf(prompt: string): number[] {
  return tokenizeNumbers(prompt).map((t) => t.value);
}

const variSources: VariantSource[] = questions
  .map(toSource)
  .filter((s) => canBuildVariant(s));

// ---------------------------------------------------------------------------
// 1. 屬性測試：全庫可變體題 × index 0,1,2，防「巧合算式」漏網
// ---------------------------------------------------------------------------

describe("屬性測試：真實題庫全量守門", () => {
  it("可變體題數（預期會落在研究說的 25–28 區間；若偏低須說明）", () => {
    // 僅作報告，不硬性斷言數量（設計上為保守白名單）
    // eslint-disable-next-line no-console
    console.log(`[variant] VARI_COUNT = ${variSources.length}`);
    expect(variSources.length).toBeGreaterThan(0);
  });

  it("每個可變體題產生 3 個 variantIndex，且全部通過獨立重算閘門", () => {
    let checked = 0;
    for (const src of variSources) {
      for (const idx of [0, 1, 2]) {
        const out = buildVariant(src, idx);
        expect(out, `${src.id}#v${idx} 應可產生`).not.toBeNull();
        const o = out!;

        // 4 個選項、無重複
        expect(o.question.options.length).toBe(4);
        expect(new Set(o.question.options).size).toBe(4);
        // answer 合法
        expect(o.question.answer).toBeGreaterThanOrEqual(0);
        expect(o.question.answer).toBeLessThanOrEqual(3);

        // 獨立重算：從新題幹抽數字，關係重算值 === 正確選項數值
        const vals = numbersOf(o.question.prompt);
        expect(vals.length).toBe(2);
        const correctVal = parseNumeric(o.question.options[o.question.answer]);
        expect(correctVal).not.toBeNull();
        const det = detectShape(vals, correctVal!.value);
        expect(det, `${src.id}#v${idx} 應可唯一推導`).not.toBeNull();
        expect(det!.computed).toBeCloseTo(correctVal!.value, 9);

        // 三個干擾項都不等於正解（含數值等值但寫法不同）
        for (let i = 0; i < 4; i++) {
          if (i === o.question.answer) continue;
          const dv = parseNumeric(o.question.options[i]);
          expect(dv).not.toBeNull();
          expect(Math.abs(dv!.value - correctVal!.value)).toBeGreaterThan(1e-9);
        }

        // 答案不得等於題幹任一數字
        expect(Math.abs(vals[0] - correctVal!.value)).toBeGreaterThan(1e-9);
        expect(Math.abs(vals[1] - correctVal!.value)).toBeGreaterThan(1e-9);

        checked++;
      }
    }
    // eslint-disable-next-line no-console
    console.log(`[variant] CHECKED_VARIANTS = ${checked}`);
    expect(checked).toBe(variSources.length * 3);
  });
});

// ---------------------------------------------------------------------------
// 2. 負面案例：研究抓到的「巧合算式」題 id → canBuildVariant 必回 false
// ---------------------------------------------------------------------------

describe("負面案例：巧合算式家族", () => {
  const byId: Record<string, any> = Object.fromEntries(
    questions.map((q) => [q.id, q])
  );
  const ids = ["q235", "q710", "q711", "q712", "q239", "q183", "q223"];

  for (const id of ids) {
    it(`${id} 不應可變體`, () => {
      expect(byId[id], `${id} 必須存在於題庫`).toBeTruthy();
      expect(canBuildVariant(toSource(byId[id]))).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. 排除規則：中文數字 / 多於 2 數字 / 答案出現在題幹
// ---------------------------------------------------------------------------

function mk(over: Partial<VariantSource>): VariantSource {
  return {
    id: "synthetic",
    subject: "數學",
    grade: 3,
    learningTopic: "x",
    prompt: "",
    options: ["0", "1", "2", "3"],
    answer: 0,
    ...over,
  };
}

describe("排除規則單元", () => {
  it("題幹含中文數字 → null", () => {
    const s = mk({
      prompt: "小明有 五 顆糖，小華有 3 顆，共有幾顆？",
      options: ["8", "7", "9", "6"],
      answer: 0,
    });
    expect(canBuildVariant(s)).toBe(false);
  });

  it("題幹超過 2 個數字 → null", () => {
    const s = mk({
      prompt: "有 3 顆、5 顆、7 顆，總共幾顆？",
      options: ["15", "14", "16", "13"],
      answer: 0,
    });
    expect(canBuildVariant(s)).toBe(false);
  });

  it("正確答案數值原樣出現在題幹 → null", () => {
    const s = mk({
      prompt: "小華有 7 顆糖，小凱有 3 顆，請選出小華的糖數：",
      options: ["7", "3", "5", "10"],
      answer: 0,
    });
    expect(canBuildVariant(s)).toBe(false);
  });

  it("正確選項是分數（本版不處理）→ null", () => {
    const s = mk({
      prompt: "小明有 3 包糖，每包 4 顆，共有幾顆？",
      options: ["3/4", "12", "7", "1"],
      answer: 1,
    });
    expect(canBuildVariant(s)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3b. 變體不可再變體：source.id 含 "#" 一律回 null
// ---------------------------------------------------------------------------

describe("變體不可再變體（# 守門）", () => {
  it("正常 id 可變體；改成含 # 的 id 則不可（canBuildVariant）", () => {
    const base = mk({
      prompt: "小明有 5 顆，小華有 3 顆，小華比小明少幾顆？",
      options: ["2", "1", "3", "4"],
      answer: 0,
    });
    expect(canBuildVariant(base)).toBe(true); // 無 # 時本應可變體
    expect(canBuildVariant({ ...base, id: "q999#v0" })).toBe(false);
  });

  it("含 # 的 id 連 buildVariant 也回 null", () => {
    const s = mk({
      id: "q999#v0",
      prompt: "小明有 5 顆，小華有 3 顆，小華比小明少幾顆？",
      options: ["2", "1", "3", "4"],
      answer: 0,
    });
    expect(buildVariant(s, 0)).toBeNull();
  });

  it("真實變體產物（id 含 #）再餵回 → 回 null，不會誤差累積", () => {
    const realSrc = variSources[0];
    const variant = buildVariant(realSrc, 0)!;
    // 變體的 question 直接當作新的 source
    const fedBack: VariantSource = {
      id: variant.question.id, // 含 "#v0"
      subject: variant.question.subject,
      grade: variant.question.grade,
      learningTopic: variant.question.learningTopic,
      prompt: variant.question.prompt,
      options: variant.question.options,
      answer: variant.question.answer,
      explanation: variant.question.explanation,
    };
    expect(fedBack.id.includes("#")).toBe(true);
    expect(canBuildVariant(fedBack)).toBe(false);
    expect(buildVariant(fedBack, 1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3c. 量詞白名單擴充：袋/共 不再觸發中文數字排除（q130、q611 撈回）
// ---------------------------------------------------------------------------

describe("量詞白名單擴充（袋/共）", () => {
  const byId: Record<string, any> = Object.fromEntries(
    questions.map((q) => [q.id, q])
  );

  it("q130（一在「共有」）與 q611（一在「一袋」）現為可變體", () => {
    for (const id of ["q130", "q611"]) {
      expect(byId[id], `${id} 必須存在於題庫`).toBeTruthy();
      const q = byId[id];
      const src: VariantSource = {
        id: q.id,
        subject: q.subject,
        grade: q.grade,
        learningTopic: q.learningTopic,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      };
      expect(canBuildVariant(src), `${id} 應可變體`).toBe(true);
      expect(buildVariant(src, 0)).not.toBeNull();
    }
  });

  it("「一袋」「共有」本身不再觸發中文數字排除（合成 fixture）", () => {
    // 一+袋：應可變體
    const bag = mk({
      prompt: "小明有 24 個橘子，每 4 個裝一袋，可以裝幾袋？",
      options: ["6", "5", "7", "8"],
      answer: 0,
    });
    expect(canBuildVariant(bag)).toBe(true);
    // 一+共：應可變體（原本被「共有」誤判）
    const gong = mk({
      prompt: "小美有 5 顆糖，小凱一共有 12 顆糖，小凱有幾顆？",
      options: ["7", "6", "8", "5"],
      answer: 0,
    });
    expect(canBuildVariant(gong)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. 決定性：同 (source, index) 完全一致；index 0 與 1 數字不同
// ---------------------------------------------------------------------------

describe("決定性與可重現", () => {
  const src = variSources[0];
  it("同 (source, index) 兩次呼叫 deep equal", () => {
    expect(buildVariant(src, 0)).toEqual(buildVariant(src, 0));
    expect(buildVariant(src, 1)).toEqual(buildVariant(src, 1));
  });

  it("index 0 與 1 的題幹數字不同", () => {
    const p0 = buildVariant(src, 0)!.question.prompt;
    const p1 = buildVariant(src, 1)!.question.prompt;
    expect(numbersOf(p0)).not.toEqual(numbersOf(p1));
  });

  it("index 0、1、2 的題幹數字彼此不同（多數情況）", () => {
    const ps = [0, 1, 2].map((i) => numbersOf(buildVariant(src, i)!.question.prompt));
    // 至少要有兩組不同（避免 PRNG 巧合重複）
    const distinct = new Set(ps.map((p) => p.join(",")));
    expect(distinct.size).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 5. 邊界：選項 < 4 / answer 越界 / 題幹無數字 → 回 null 不拋錯
// ---------------------------------------------------------------------------

describe("邊界條件", () => {
  it("選項少於 4 → null", () => {
    const s = mk({
      prompt: "小明有 5 顆，小華有 3 顆，小華比小明少幾顆？",
      options: ["2", "3"],
      answer: 0,
    });
    expect(canBuildVariant(s)).toBe(false);
    expect(buildVariant(s, 0)).toBeNull();
  });

  it("answer 越界 → null", () => {
    const s = mk({
      prompt: "小明有 5 顆，小華有 3 顆，小華比小明少幾顆？",
      options: ["2", "1", "3", "4"],
      answer: 5,
    });
    expect(canBuildVariant(s)).toBe(false);
    expect(buildVariant(s, 0)).toBeNull();
  });

  it("題幹沒有數字 → null", () => {
    const s = mk({
      prompt: "請選出正確的顏色。",
      options: ["紅", "藍", "綠", "黃"],
      answer: 0,
    });
    expect(canBuildVariant(s)).toBe(false);
    expect(buildVariant(s, 0)).toBeNull();
  });

  it("variantIndex 為負 → null", () => {
    expect(buildVariant(variSources[0], -1)).toBeNull();
  });
});
