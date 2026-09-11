/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getReadingScale,
  setReadingScale,
  applyReadingScale,
  READING_SCALE_VALUES,
} from "./readingScale";

describe("readingScale", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-reading-scale");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-reading-scale");
  });

  it("預設回傳 none，且 <html> 沒有 data-reading-scale 屬性", () => {
    expect(getReadingScale()).toBe("none");
    expect(document.documentElement.getAttribute("data-reading-scale")).toBeNull();
  });

  it("setReadingScale 會寫入 localStorage 並在 <html> 設定屬性", () => {
    setReadingScale("large");
    expect(window.localStorage.getItem("xue-reading-scale-v1")).toBe("large");
    expect(document.documentElement.getAttribute("data-reading-scale")).toBe("large");

    setReadingScale("xlarge");
    expect(window.localStorage.getItem("xue-reading-scale-v1")).toBe("xlarge");
    expect(document.documentElement.getAttribute("data-reading-scale")).toBe("xlarge");
  });

  it("標準（none）會移除屬性並清除 localStorage", () => {
    setReadingScale("large");
    setReadingScale("none");
    expect(window.localStorage.getItem("xue-reading-scale-v1")).toBeNull();
    expect(document.documentElement.getAttribute("data-reading-scale")).toBeNull();
  });

  it("getReadingScale 能讀回已儲存的合法檔位", () => {
    window.localStorage.setItem("xue-reading-scale-v1", "xlarge");
    expect(getReadingScale()).toBe("xlarge");
  });

  it("getReadingScale 對非法值回退預設（none）", () => {
    window.localStorage.setItem("xue-reading-scale-v1", "huge");
    expect(getReadingScale()).toBe("none");
    window.localStorage.setItem("xue-reading-scale-v1", "");
    expect(getReadingScale()).toBe("none");
  });

  it("applyReadingScale 只在 <html> 切換屬性，不改 root font-size", () => {
    applyReadingScale("large");
    expect(document.documentElement.getAttribute("data-reading-scale")).toBe("large");
    expect(document.documentElement.style.fontSize).toBe("");
    applyReadingScale("none");
    expect(document.documentElement.getAttribute("data-reading-scale")).toBeNull();
  });

  it("所有合法檔位都能正確套用屬性", () => {
    for (const value of READING_SCALE_VALUES) {
      applyReadingScale(value);
      if (value === "none") {
        expect(document.documentElement.getAttribute("data-reading-scale")).toBeNull();
      } else {
        expect(document.documentElement.getAttribute("data-reading-scale")).toBe(value);
      }
    }
  });
});
