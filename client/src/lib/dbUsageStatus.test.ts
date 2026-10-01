import { describe, expect, it } from "vitest";
import {
  RU_QUOTA_EXPLANATION,
  formatPercent,
  formatRu,
  formatUptime,
  projectedPercent,
  warningPresentation,
} from "./dbUsageStatus";

describe("formatRu：中文單位縮寫", () => {
  it("未滿千直接顯示", () => {
    expect(formatRu(0)).toBe("0");
    expect(formatRu(12.34)).toBe("12.3");
    expect(formatRu(999)).toBe("999");
  });

  it("千位以上加分隔、萬與億換單位", () => {
    expect(formatRu(1_500)).toBe("1,500");
    expect(formatRu(50_000_000)).toBe("5000 萬");
    expect(formatRu(69_444)).toBe("6.9 萬");
    expect(formatRu(120_000_000)).toBe("1.2 億");
  });

  it("無效值回破折號而非 NaN", () => {
    expect(formatRu(null)).toBe("—");
    expect(formatRu(undefined)).toBe("—");
    expect(formatRu(Number.NaN)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("極小但非零顯示 <1%（不可顯示成 0% 讓人誤以為沒用到）", () => {
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(0.02)).toBe("<1%");
    expect(formatPercent(0.9)).toBe("<1%");
  });

  it("常見範圍保留一位小數，大值取整", () => {
    expect(formatPercent(1)).toBe("1%");
    expect(formatPercent(4.25)).toBe("4.3%");
    expect(formatPercent(37.6)).toBe("38%");
    expect(formatPercent(120)).toBe("120%");
  });

  it("無效值回破折號", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(Number.NaN)).toBe("—");
  });
});

describe("formatUptime", () => {
  it("依時長換單位", () => {
    expect(formatUptime(0)).toBe("剛啟動");
    expect(formatUptime(20_000)).toBe("1 分鐘");
    expect(formatUptime(45 * 60_000)).toBe("45 分鐘");
    expect(formatUptime(3 * 3_600_000 + 20 * 60_000)).toBe("3 小時 20 分");
    expect(formatUptime(2 * 24 * 3_600_000 + 5 * 3_600_000)).toBe("2 天 5 小時");
  });
});

describe("warningPresentation：明確提示的分級文案", () => {
  it("high：點出「照這個速度會用完額度」並給具體行動", () => {
    const view = warningPresentation("high", 69_444);
    expect(view.tone).toBe("high");
    expect(view.badge).toBe("消耗偏高");
    expect(view.headline).toContain("會用完本月額度");
    expect(view.advice).toContain("6.9 萬"); // 可持續速度換成中文單位
    expect(view.advice).not.toBeNull();
  });

  it("watch：說明仍在範圍內但要留意", () => {
    const view = warningPresentation("watch", 69_444);
    expect(view.tone).toBe("watch");
    expect(view.headline).toContain("仍在可持續範圍內");
    expect(view.advice).not.toBeNull();
  });

  it("ok：不給多餘建議", () => {
    const view = warningPresentation("ok", 69_444);
    expect(view.tone).toBe("ok");
    expect(view.advice).toBeNull();
  });

  it("unknown：說明為何還沒有數字（避免看起來像壞掉）", () => {
    const view = warningPresentation("unknown", 69_444);
    expect(view.badge).toBe("資料累積中");
    expect(view.advice).toContain("5 分鐘");
  });
});

describe("projectedPercent", () => {
  it("依外推月用量算佔比", () => {
    expect(projectedPercent(25_000_000, 50_000_000)).toBe(50);
    expect(projectedPercent(75_000_000, 50_000_000)).toBe(150);
  });

  it("無外推值或額度無效時回 null", () => {
    expect(projectedPercent(null, 50_000_000)).toBeNull();
    expect(projectedPercent(1_000, 0)).toBeNull();
  });
});

describe("額度說明文案", () => {
  it("同時說明『小型專案足夠』與『密集情境需留意』兩個面向", () => {
    expect(RU_QUOTA_EXPLANATION).toContain("小型網站或個人專案通常足夠");
    expect(RU_QUOTA_EXPLANATION).toContain("高頻 API 呼叫");
    expect(RU_QUOTA_EXPLANATION).toContain("大量寫入");
    expect(RU_QUOTA_EXPLANATION).toContain("消耗速度");
  });
});
