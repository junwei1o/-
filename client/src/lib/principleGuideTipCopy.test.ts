import { describe, expect, it } from "vitest";
import { getPrincipleGuideFirstUseTipCopy } from "./principleGuideTipCopy";

describe("原理引導首次提示文案", () => {
  it("依低、中高年級與缺漏設定回傳不同但不揭示答案的操作提示", () => {
    expect(getPrincipleGuideFirstUseTipCopy("visual", 3)).toContain("你想看的線索");
    expect(getPrincipleGuideFirstUseTipCopy("visual", 6)).toContain("可驗證的圖像線索");
    expect(getPrincipleGuideFirstUseTipCopy("knowledge", null)).toContain("一個關鍵句");
    expect(getPrincipleGuideFirstUseTipCopy("visual", 3, "mathematics")).toContain("數學觀察策略");
    expect(getPrincipleGuideFirstUseTipCopy("knowledge", 6, "science")).toContain("自然觀察策略");
    expect(getPrincipleGuideFirstUseTipCopy("visual", null, "science-inquiry")).toContain("自然探究策略");

    [3, 4, 5, 6, null].forEach((grade) => {
      const copy = getPrincipleGuideFirstUseTipCopy("knowledge", grade as 3 | 4 | 5 | 6 | null, "science");
      expect(copy).toContain("不會");
      expect(copy).not.toContain("行星的重力持續拉向中心");
    });
  });
});
