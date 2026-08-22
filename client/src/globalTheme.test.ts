import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("全站宣紙主題", () => {
  it("uses the requested warm parchment foundation and Traditional Chinese font stack", () => {
    const styles = projectFile("client/src/index.css");

    expect(styles).toContain("--paper:#F9F3E8");
    expect(styles).toContain("html { background:#F9F3E8; }");
    expect(styles).toContain("body { margin:0; min-width:320px; background:#F9F3E8;");
    expect(styles).toContain("font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif");
    expect(styles).toContain("line-height:1.8;");
    expect(styles).toContain("h1,h2,h3,h4,h5,h6 { font-family:'Noto Sans TC'");
    expect(styles).toContain("font-weight:700 !important;");
    expect(styles).toContain("border-radius:9999px");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("loads Noto Sans TC from the document head without duplicating stylesheet imports", () => {
    const documentHead = projectFile("client/index.html");
    const styles = projectFile("client/src/index.css");

    expect(documentHead).toContain("family=Noto+Sans+TC");
    expect(documentHead).toContain('rel="preconnect" href="https://fonts.gstatic.com" crossorigin');
    expect(styles).not.toContain("@import url('https://fonts.googleapis.com");
  });
});
