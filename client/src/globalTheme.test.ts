import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("全站宣紙主題", () => {
  it("uses the requested warm parchment foundation and Traditional Chinese font stack", () => {
    const styles = projectFile("client/src/index.css");

    expect(styles).toContain("--paper: #F9F3E8");
    expect(styles).toContain("html { background:var(--paper); }");
    expect(styles).toContain("body { margin:0; min-width:320px; background:var(--paper);");
    // 繁中本地系統字體堆疊：系統有 Noto Sans TC 就用，否則依序降級 PingFang／JhengHei。
    expect(styles).toContain('--font-sans: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Heiti TC"');
    expect(styles).toContain("line-height:1.8;");
    expect(styles).toContain("h1,h2,h3,h4,h5,h6 { font-family:var(--font-sans)");
    expect(styles).toContain("font-weight:700 !important;");
    expect(styles).toContain("border-radius:var(--radius-pill)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses a local system font stack without render-blocking external font CDNs", () => {
    const documentHead = projectFile("client/index.html");
    const styles = projectFile("client/src/index.css");

    // local-first：不從 Google Fonts 載入字體（離線可用、不擋首屏、不發第三方請求）。
    expect(documentHead).not.toContain("fonts.googleapis.com");
    expect(documentHead).not.toContain("fonts.gstatic.com");
    expect(documentHead).not.toContain("family=Noto+Sans+TC");
    expect(styles).not.toContain("@import url('https://fonts.googleapis.com");
    // 仍以系統內建 Noto Sans TC 為首選，再向 PingFang／JhengHei 降級。
    expect(styles).toContain('"Noto Sans TC", "PingFang TC", "Microsoft JhengHei"');
  });
});
