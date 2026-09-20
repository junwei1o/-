import { describe, expect, it } from "vitest";
import { buildQrDataUri } from "./qrSvg";

const LINE_URL = "https://line.me/ti/p/~testlineid";

describe("buildQrDataUri", () => {
  it("空字串回傳空值", () => {
    expect(buildQrDataUri("")).toBe("");
  });

  it("產出 SVG data URI（不再依賴外部 QR 服務）", () => {
    const uri = buildQrDataUri(LINE_URL);
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    const svg = decodeURIComponent(uri.replace("data:image/svg+xml;charset=utf-8,", ""));
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    // 有畫出模組（深色方塊）
    expect((svg.match(/<rect/g) ?? []).length).toBeGreaterThan(20);
  });

  it("同一內容每次結果一致（可快取、可重現）", () => {
    expect(buildQrDataUri(LINE_URL)).toBe(buildQrDataUri(LINE_URL));
  });

  it("不同內容結果不同", () => {
    expect(buildQrDataUri(LINE_URL)).not.toBe(buildQrDataUri("https://line.me/ti/p/~another"));
  });

  it("中文內容也不會噴錯", () => {
    const uri = buildQrDataUri("https://example.com/?name=劉老師");
    expect(uri.startsWith("data:image/svg+xml")).toBe(true);
  });
});
