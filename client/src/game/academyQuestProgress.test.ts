import { describe, expect, it } from "vitest";
import { academyRouteForSubject } from "./academyQuestData";

describe("學苑遠征進度", () => {
  it("依科目選擇對應學苑路徑", () => {
    expect(academyRouteForSubject("數學")?.region).toBe("north");
    expect(academyRouteForSubject("不存在")).toBeUndefined();
  });
});
