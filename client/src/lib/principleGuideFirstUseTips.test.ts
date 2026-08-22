import { describe, expect, it } from "vitest";
import {
  loadPrincipleGuideFirstUseTips,
  markPrincipleGuideFirstUseTipSeen,
  PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY,
  savePrincipleGuideFirstUseTips,
} from "./principleGuideFirstUseTips";

describe("原理引導首次使用提示保存", () => {
  it("在沒有紀錄時提供兩張卡片皆未顯示的安全預設值", () => {
    const storage = { getItem: () => null, removeItem: () => undefined };
    expect(loadPrincipleGuideFirstUseTips(storage)).toEqual({ version: 1, visual: false, knowledge: false });
  });

  it("損壞或不相容紀錄會清除並安全回退", () => {
    let removed = false;
    const storage = { getItem: () => "{broken", removeItem: () => { removed = true; } };
    expect(loadPrincipleGuideFirstUseTips(storage)).toEqual({ version: 1, visual: false, knowledge: false });
    expect(removed).toBe(true);
  });

  it("分別保存圖像與概念卡已出現過的提示", () => {
    let stored = "";
    const storage = {
      getItem: () => stored || null,
      removeItem: () => undefined,
      setItem: (key: string, value: string) => { expect(key).toBe(PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY); stored = value; },
    };

    expect(markPrincipleGuideFirstUseTipSeen("visual", storage)).toEqual({ version: 1, visual: true, knowledge: false });
    expect(markPrincipleGuideFirstUseTipSeen("knowledge", storage)).toEqual({ version: 1, visual: true, knowledge: true });
    savePrincipleGuideFirstUseTips({ version: 1, visual: false, knowledge: true }, storage);
    expect(JSON.parse(stored)).toEqual({ version: 1, visual: false, knowledge: true });
  });
});
