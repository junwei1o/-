// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyCloudSave,
  buildPayload,
  chooseLocalMode,
  cloudApi,
  decideMerge,
  extractMetrics,
  getCloudMode,
  hasChosenMode,
  loadCloud,
  registerCloud,
  validateCloudName,
  type CloudSaveSummary,
} from "./cloudSync";

const RPG_KEY = "xue-adventure-rpg-v1";
const BX_KEY = "bx_state_v1";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("名字驗證", () => {
  it("接受 2–6 個中文字或英數字", () => {
    expect(validateCloudName("張三")).toBeNull();
    expect(validateCloudName("小航海士02")).toBeNull();
    expect(validateCloudName("AB")).toBeNull();
    expect(validateCloudName("  張三  ")).toBeNull(); // 前後空白可接受
  });

  it("拒絕過短、過長與特殊符號", () => {
    expect(validateCloudName("張")).toContain("至少 2 個字");
    expect(validateCloudName("一二三四五六七")).toContain("最多 6 個字");
    expect(validateCloudName("張@三")).toContain("中文字或英數字");
    expect(validateCloudName("   ")).toContain("至少 2 個字");
  });
});

describe("模式儲存", () => {
  it("預設為本機模式且尚未選擇過", () => {
    expect(getCloudMode()).toEqual({ mode: "local" });
    expect(hasChosenMode()).toBe(false);
  });

  it("選擇本機後 hasChosenMode 為 true", () => {
    chooseLocalMode();
    expect(hasChosenMode()).toBe(true);
    expect(getCloudMode().mode).toBe("local");
  });

  it("損壞的 JSON 回退本機模式", () => {
    localStorage.setItem("xue-cloud-mode-v1", "{broken");
    expect(getCloudMode().mode).toBe("local");
  });
});

describe("進度打包與合併", () => {
  it("空儲存時指標為零", () => {
    expect(extractMetrics()).toEqual({ coins: 0, totalAnswers: 0, badges: 0 });
  });

  it("從 rpg/bx 原始字串萃取指標", () => {
    localStorage.setItem(RPG_KEY, JSON.stringify({ coins: 42, answeredEventIds: ["a", "b", "c"] }));
    localStorage.setItem(BX_KEY, JSON.stringify({ stats: { totalAnswers: 5 }, badges: ["x", "y"] }));
    const metrics = extractMetrics();
    expect(metrics.coins).toBe(42);
    expect(metrics.totalAnswers).toBe(5); // max(rpg 3, bx 5)
    expect(metrics.badges).toBe(2);
  });

  it("buildPayload 帶原始字串與版本", () => {
    localStorage.setItem(RPG_KEY, "{\"coins\":1}");
    const payload = buildPayload();
    expect(payload.v).toBe(1);
    expect(payload.rpg).toBe("{\"coins\":1}");
    expect(payload.bx).toBeNull();
    expect(payload.savedAt).toBeGreaterThan(0);
  });

  it("進度較高者勝出：作答數優先，平手比金幣，再平手保本機", () => {
    expect(decideMerge({ coins: 0, totalAnswers: 3, badges: 0 }, { coins: 0, totalAnswers: 5, badges: 0 })).toBe("remote");
    expect(decideMerge({ coins: 0, totalAnswers: 9, badges: 0 }, { coins: 99, totalAnswers: 5, badges: 0 })).toBe("local");
    expect(decideMerge({ coins: 10, totalAnswers: 5, badges: 0 }, { coins: 20, totalAnswers: 5, badges: 0 })).toBe("remote");
    expect(decideMerge({ coins: 20, totalAnswers: 5, badges: 0 }, { coins: 20, totalAnswers: 5, badges: 0 })).toBe("local");
  });
});

describe("開船／回航流程", () => {
  it("開船成功後進入雲端模式並記住名字", async () => {
    vi.spyOn(cloudApi, "register").mockResolvedValue({ ok: true });
    const result = await registerCloud("張三");
    expect(result.ok).toBe(true);
    expect(getCloudMode()).toMatchObject({ mode: "cloud", name: "張三" });
  });

  it("名字被佔用時回傳 taken 且不切換模式", async () => {
    vi.spyOn(cloudApi, "register").mockResolvedValue({ ok: false, reason: "taken" });
    const result = await registerCloud("張三");
    expect(result).toEqual({ ok: false, reason: "taken" });
    expect(getCloudMode().mode).toBe("local");
  });

  it("名字不合法時不打 API", async () => {
    const spy = vi.spyOn(cloudApi, "register");
    const result = await registerCloud("張");
    expect(result.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("回航找不到船籍回傳 notFound", async () => {
    vi.spyOn(cloudApi, "load").mockResolvedValue({ ok: false, reason: "notFound" });
    const result = await loadCloud("李四");
    expect(result).toEqual({ ok: false, reason: "notFound" });
  });

  it("認船後雲端進度較高時寫入本機", async () => {
    localStorage.setItem(RPG_KEY, JSON.stringify({ coins: 1, answeredEventIds: [] }));
    const remotePayload = { v: 1 as const, rpg: JSON.stringify({ coins: 99, answeredEventIds: ["a", "b"] }), bx: JSON.stringify({ badges: ["b1"] }), savedAt: Date.now() };
    const save: CloudSaveSummary = { name: "張三", payload: remotePayload, coins: 99, totalAnswers: 2, badges: 1, updatedAt: Date.now() };
    const winner = await applyCloudSave(save);
    expect(winner).toBe("remote");
    expect(JSON.parse(localStorage.getItem(RPG_KEY)!)).toMatchObject({ coins: 99 });
    expect(JSON.parse(localStorage.getItem(BX_KEY)!)).toMatchObject({ badges: ["b1"] });
    expect(getCloudMode()).toMatchObject({ mode: "cloud", name: "張三" });
  });

  it("認船後本機進度較高時以本機覆寫雲端", async () => {
    localStorage.setItem(RPG_KEY, JSON.stringify({ coins: 500, answeredEventIds: ["a", "b", "c", "d", "e"] }));
    const saveSpy = vi.spyOn(cloudApi, "save").mockResolvedValue({ ok: true });
    const save: CloudSaveSummary = { name: "張三", payload: { v: 1, rpg: null, bx: null, savedAt: Date.now() }, coins: 1, totalAnswers: 1, badges: 0, updatedAt: Date.now() };
    const winner = await applyCloudSave(save);
    expect(winner).toBe("local");
    expect(saveSpy).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem(RPG_KEY)!)).toMatchObject({ coins: 500 });
  });
});
