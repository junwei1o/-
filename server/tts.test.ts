import { describe, expect, it } from "vitest";
import { toEdgeRate } from "./tts";

describe("toEdgeRate：前端語速倍率 → edge-tts 速率字串", () => {
  it("1 倍速就是原速", () => {
    expect(toEdgeRate(1)).toBe("+0%");
  });

  it("慢速為負百分比，快速為正百分比", () => {
    expect(toEdgeRate(0.92)).toBe("-8%"); // 全站預設語速
    expect(toEdgeRate(1.4)).toBe("+40%");
    expect(toEdgeRate(0.6)).toBe("-40%");
  });

  it("四捨五入到整數百分比", () => {
    expect(toEdgeRate(0.975)).toBe("-3%");
  });

  it("超出範圍時夾限（與前端夾限一致）", () => {
    expect(toEdgeRate(3)).toBe("+100%");
    expect(toEdgeRate(0.1)).toBe("-50%");
  });

  it("非數值安全回退原速", () => {
    expect(toEdgeRate(Number.NaN)).toBe("+0%");
  });
});
