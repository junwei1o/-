// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BX_ANSWER_MILESTONES,
  BX_DAILY_COIN_CAP,
  BX_EVENTS,
  BX_STORAGE_KEY,
  bxStore,
  type BxRelic,
} from "./bxStore";

beforeEach(() => {
  localStorage.clear();
  bxStore.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BX.Store 基礎讀寫", () => {
  it("提供完整預設結構", () => {
    const s = bxStore.all();
    expect(s.schema_version).toBe(1);
    expect(s.stats.total_answers).toBe(0);
    expect(s.stats.first_light_done).toBe(false);
    expect(Object.keys(s.subjects)).toEqual(["chinese", "math", "social", "science"]);
    expect(s.islands).toEqual({ north: false, central: false, south: false, east: false });
    expect(s.relics).toEqual([]);
    expect(s.coins).toBe(0);
    expect(s.badges).toEqual([]);
    expect(s.privacy.accepted).toBe(false);
    expect(s.onboarding.completed).toBe(false);
  });

  it("get 支援巢狀路徣與 fallback", () => {
    expect(bxStore.get("stats.total_answers", 0)).toBe(0);
    expect(bxStore.get("nope.deep.path", 42)).toBe(42);
    expect(bxStore.get("no.such")).toBeUndefined();
  });

  it("update 後 flush 會寫入 localStorage 同一個鍵", () => {
    bxStore.update((s) => {
      s.coins += 10;
      s.privacy.accepted = true;
    });
    bxStore.flush();
    const raw = JSON.parse(localStorage.getItem(BX_STORAGE_KEY) ?? "null");
    expect(raw.coins).toBe(10);
    expect(raw.privacy.accepted).toBe(true);
  });

  it("subscribe 會收到變更通知，取消訂閱後不再觸發", () => {
    const fn = vi.fn();
    const unsub = bxStore.subscribe(fn);
    bxStore.update((s) => {
      s.coins = 1;
    });
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    bxStore.update((s) => {
      s.coins = 2;
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("BX.Store 版本遷移", () => {
  it("舊資料缺漏欄位時以深合併補上預設值、保留既有值", () => {
    const legacy = {
      coins: 77,
      stats: { total_answers: 3, total_correct: 2 },
      relics: [{ id: "math::加法", subject: "math", topic: "加法", wrongCount: 1, status: "sunken" }],
    };
    localStorage.setItem(BX_STORAGE_KEY, JSON.stringify(legacy));
    const s = bxStore.reload();
    expect(s.coins).toBe(77);
    expect(s.stats.total_answers).toBe(3);
    expect(s.stats.total_correct).toBe(2);
    // 補上的預設欄位
    expect(s.stats.first_light_done).toBe(false);
    expect(s.stats.streak_current).toBe(0);
    expect(s.subjects.science.answers).toBe(0);
    expect(s.onboarding.completed).toBe(false);
    // 保留的舊遺物
    expect(s.relics).toHaveLength(1);
    expect(s.relics[0]?.wrongCount).toBe(1);
  });

  it("毀損的 JSON 安全回退為預設值", () => {
    localStorage.setItem(BX_STORAGE_KEY, "{not-json");
    const s = bxStore.reload();
    expect(s.schema_version).toBe(1);
    expect(s.stats.total_answers).toBe(0);
  });
});

describe("BX.Store.logAnswer", () => {
  it("首次答對觸發第一盞燈：給 20 金、授啟航徽章、點亮對應島嶼", () => {
    const result = bxStore.logAnswer({ subject: "chinese", topic: "字形", correct: true, coinReward: 5 });
    const s = bxStore.all();
    expect(result.coinEarned).toBe(5);
    expect(s.stats.total_answers).toBe(1);
    expect(s.stats.total_correct).toBe(1);
    expect(s.stats.streak_current).toBe(1);
    expect(s.stats.first_light_done).toBe(true);
    expect(s.badges).toContain("qihang");
    expect(s.islands.north).toBe(true);
    // 答題獎勵 5 + 第一盞燈 20
    expect(s.coins).toBe(25);
    expect(s.subjects.chinese.answers).toBe(1);
    expect(s.subjects.chinese.correct).toBe(1);
  });

  it("派發 bx:answer 事件且標記 firstLight", () => {
    const handler = vi.fn();
    document.addEventListener(BX_EVENTS.answer, handler);
    bxStore.logAnswer({ subject: "math", topic: "加法", correct: true, coinReward: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0]?.[0] as CustomEvent).detail).toMatchObject({
      correct: true,
      firstLight: true,
      actualCoin: 3,
    });
    document.removeEventListener(BX_EVENTS.answer, handler);
  });

  it("答錯建立沉沒遺物並中斷連勝", () => {
    bxStore.logAnswer({ subject: "math", topic: "加法", correct: false });
    bxStore.logAnswer({ subject: "math", topic: "加法", correct: false });
    const s = bxStore.all();
    expect(s.stats.streak_current).toBe(0);
    expect(s.relics).toHaveLength(1);
    const relic = s.relics[0] as BxRelic;
    expect(relic.id).toBe("math::加法");
    expect(relic.status).toBe("sunken");
    expect(relic.wrongCount).toBe(2);
    expect(relic.hitStreak).toBe(0);
  });

  it("同主題連續答對兩次後遺物修復", () => {
    bxStore.logAnswer({ subject: "science", topic: "電路", correct: false });
    bxStore.logAnswer({ subject: "science", topic: "電路", correct: true });
    expect(bxStore.derived.sunkRelics()).toHaveLength(1);
    bxStore.logAnswer({ subject: "science", topic: "電路", correct: true });
    expect(bxStore.derived.sunkRelics()).toHaveLength(0);
    expect(bxStore.all().relics[0]?.status).toBe("repaired");
  });

  it("金幣每日達上限後不再增加", () => {
    bxStore.update((s) => {
      s.daily_coin_log[bxStore.today()] = BX_DAILY_COIN_CAP - 2;
    });
    const result = bxStore.logAnswer({ subject: "math", topic: "減法", correct: true, coinReward: 10 });
    expect(result.coinEarned).toBe(2);
    // 已達上限後再答題不再給幣
    const result2 = bxStore.logAnswer({ subject: "math", topic: "減法", correct: true, coinReward: 10 });
    expect(result2.coinEarned).toBe(0);
  });

  it("達到答題里程碑時派發 bx:milestone 事件並記錄已通知", () => {
    const handler = vi.fn();
    document.addEventListener(BX_EVENTS.milestone, handler);
    const target = BX_ANSWER_MILESTONES[0];
    for (let i = 0; i < target; i++) {
      bxStore.logAnswer({ subject: "social", topic: "地圖", correct: true, coinReward: 0 });
    }
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ count: target });
    expect(bxStore.all().backup.notified_milestones).toContain(target);
    document.removeEventListener(BX_EVENTS.milestone, handler);
  });
});

describe("BX.Store.derived", () => {
  it("整體與分科正確率", () => {
    bxStore.logAnswer({ subject: "math", correct: true });
    bxStore.logAnswer({ subject: "math", correct: false });
    expect(bxStore.derived.accuracy("math")).toBe(50);
    expect(bxStore.derived.accuracy()).toBe(50);
    expect(bxStore.derived.accuracy("science")).toBe(0);
  });

  it("點亮島嶼數、是否有資料", () => {
    expect(bxStore.derived.hasAnyData()).toBe(false);
    expect(bxStore.derived.litIslands()).toBe(0);
    bxStore.logAnswer({ subject: "social", correct: true });
    expect(bxStore.derived.hasAnyData()).toBe(true);
    expect(bxStore.derived.litIslands()).toBe(1);
  });

  it("遺物分層與價值", () => {
    const tier = (wrongCount: number) =>
      bxStore.derived.relicTier({ wrongCount } as BxRelic);
    expect(tier(1)).toBe("bronze");
    expect(tier(2)).toBe("silver");
    expect(tier(3)).toBe("gold");
    expect(bxStore.derived.relicValue({ wrongCount: 3 } as BxRelic)).toBe(25);
    expect(bxStore.derived.relicValue({ wrongCount: 1 } as BxRelic)).toBe(5);
  });

  it("reset 後回到空白狀態", () => {
    bxStore.logAnswer({ subject: "math", correct: true });
    expect(bxStore.derived.hasAnyData()).toBe(true);
    bxStore.reset();
    expect(bxStore.derived.hasAnyData()).toBe(false);
    expect(bxStore.all().coins).toBe(0);
  });
});

describe("BX.Store 簽到", () => {
  it("首次簽到給 10 金、記錄日期並派發 bx:checkin", () => {
    const handler = vi.fn();
    document.addEventListener(BX_EVENTS.checkin, handler);
    const r = bxStore.checkIn();
    expect(r.already).toBe(false);
    expect(r.coins).toBe(10);
    expect(bxStore.all().coins).toBe(10);
    expect(bxStore.derived.activeDays()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
    document.removeEventListener(BX_EVENTS.checkin, handler);
  });

  it("當天重複簽到不再給獎勵", () => {
    expect(bxStore.checkIn().already).toBe(false);
    const again = bxStore.checkIn();
    expect(again.already).toBe(true);
    expect(again.coins).toBe(0);
    expect(bxStore.all().coins).toBe(10);
  });

  it("todayCount 回報當日答對題數", () => {
    expect(bxStore.derived.todayCount()).toBe(0);
    bxStore.logAnswer({ subject: "math", correct: true, coinReward: 0 });
    bxStore.logAnswer({ subject: "math", correct: false });
    expect(bxStore.derived.todayCount()).toBe(1);
  });
});
