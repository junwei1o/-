// 回歸測試：跨單元「哪一個的結果最大／最小」比較題，answer 必須永遠指向真實的 max／min。
// 生成器位於 build-time scripts/gen/math.mjs；此測試直接以種子亂數驅動它，
// 解析詳解中每個選項（①②③④）「＝ 數值」的結果，獨立重算 max／min，
// 驗證 answer 指標與詳解聲稱的字母一致，避免出現「C 標成正確、其實 B 才最小」的指標錯位。
import { describe, expect, it } from "vitest";
import { generateMathCombo } from "../../../scripts/gen/math.mjs";
import { createCollector, mulberry32 } from "../../../scripts/gen/common.mjs";

const LETTER_INDEX: Record<string, number> = { "①": 0, "②": 1, "③": 2, "④": 3 };

/** 從詳解解析出每個選項（依 ①②③④ 順序）對應的實際數值。 */
function parseOptionValues(explanation: string): number[] {
  // 詳解格式：「① <prompt> ＝ <value>；② … ＝ <value>；…」。
  // prompt 本身可能含「＝」（如「若 x ＝ 10」「4x ＋ 7 ＝ 35」），
  // 所以依 ①②③④ 切段後，取該段最後一個「＝ 數值」才是真正的結果。
  const segments = explanation.split(/[①②③④]/).slice(1, 5); // 只取 ①②③④ 四個選項段，忽略結尾「的是X」重複出現的答案字母
  return segments.map((seg) => {
    const matches = [...seg.matchAll(/＝\s*(-?\d+(?:\.\d+)?)/g)];
    const last = matches[matches.length - 1];
    return last ? Number(last[1]) : NaN;
  });
}

/** 從詳解結尾「因此答案最大/最小的是X」取出聲稱的答案字母。 */
function parseStatedLetter(explanation: string): string | null {
  const m = explanation.match(/的是([①②③④])。?$/);
  return m ? m[1] : null;
}

describe("generateMathCombo min/max comparison questions", () => {
  it("always points answer at the true max/min option (no mis-index)", () => {
    const rng = mulberry32(20260922);
    const collector = createCollector();
    // 一次生成足夠多題，涵蓋 wantMax／wantMin 兩個分支與各種子單元組合。
    const produced = generateMathCombo(rng, collector, 120, {});
    expect(produced).toBeGreaterThan(0);

    for (const question of collector.list()) {
      const values = parseOptionValues(question.explanation);
      expect(values.length, `詳解應能解析出 4 個選項數值：${question.id}`).toBe(4);
      const statedLetter = parseStatedLetter(question.explanation);
      expect(statedLetter, `詳解應聲稱答案字母：${question.id}`).not.toBeNull();

      const wantMax = /結果最大|答案最大/.test(question.prompt) || /答案最大/.test(question.explanation);
      const expected = wantMax ? Math.max(...values) : Math.min(...values);
      const expectedIndexes = values.map((v, i) => (v === expected ? i : -1)).filter((i) => i >= 0);
      // 重算驗證閘門：必須唯一指向真正的 max／min，不得有並列或指標錯位。
      expect(expectedIndexes.length, `${question.id} 的最大/最小應唯一`).toBe(1);

      const expectedLetter = (["①", "②", "③", "④"] as const)[expectedIndexes[0]];
      expect(statedLetter, `${question.id} 詳解聲稱的答案應與重算結果一致`).toBe(expectedLetter);
      expect(question.answer, `${question.id} answer 指標應對應重算出的 ${expectedLetter}`).toBe(LETTER_INDEX[expectedLetter]);
    }
  });
});
