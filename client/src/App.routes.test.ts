import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

describe("App 守護者路由相容性", () => {
  it("保留既有守護者路徑與站內搜尋使用的遠征別名", () => {
    expect(appSource).toContain('path={"/guardian"}');
    expect(appSource).toContain('path={"/guardian-expedition"}');
  });

  it("將附件要求的決鬥短路徑導向既有知識決鬥頁", () => {
    expect(appSource).toContain('path={"/knowledge-duel"}');
    expect(appSource).toContain('path={"/duel"} component={KnowledgeDuel}');
  });
});
