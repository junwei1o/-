/**
 * 戰鬥教學（首次進入對戰引導，對齊設計稿 P1 新手戰鬥教學）：
 * ① 基礎攻擊（不需答題）② 答題技能與能量 ③ 連擊與怒氣技能 ④ 回合與戰鬥日誌。
 * 看完或關閉後寫入本地標記，之後不再自動彈出，但可隨時用「戰鬥說明」重新查閱。
 * 模式與 battleRageSkillTutorial 一致：純函式、storage 可注入、壞資料自動清除。
 * 註：戰鬥中目前沒有「使用消耗品」介面（補給由世界事件掉進背包），故不教尚未上線的操作。
 */

export const BATTLE_TUTORIAL_STORAGE_KEY = "xue-battle-tutorial-v1";

export type BattleTutorialState = {
  version: 1;
  seen: boolean;
};

export const BATTLE_TUTORIAL_STEPS = [
  {
    key: "basic",
    title: "第一步：基礎攻擊",
    text: "先選技能再答題。基礎攻擊不需要答題，點下去就直接造成傷害；第一次對戰建議從它開始，熟悉出手節奏。",
  },
  {
    key: "energy",
    title: "第二步：答題技能與能量",
    text: "潮汐脈衝等技能要消耗能量、答完課綱題才結算威力：答對獲得能量並打出更高傷害，答錯仍保留最低傷害，學習一定有進展。",
  },
  {
    key: "rage",
    title: "第三步：連擊與怒氣",
    text: "連續答對會累積連擊，三連擊起有 1.5 倍增幅；答題也會累積怒氣（答對 +10、答錯 +5），達到需求量就能施放精準打擊、防護壁壘或緊急包紮等怒氣技能。",
  },
  {
    key: "flow",
    title: "第四步：回合與戰鬥日誌",
    text: "你出手後換守門者回應，戰鬥日誌會即時列出雙方傷害、剩餘生命與能量變化；隨時點右上角「戰鬥說明」就能再看一次這份引導。",
  },
] as const;

const DEFAULT_STATE: BattleTutorialState = { version: 1, seen: false };

type TutorialStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function browserStorage(): TutorialStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidState(value: unknown): value is BattleTutorialState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BattleTutorialState>;
  return candidate.version === 1 && typeof candidate.seen === "boolean";
}

export function loadBattleTutorial(storage: TutorialStorage | null = browserStorage()): BattleTutorialState {
  if (!storage) return { ...DEFAULT_STATE };

  try {
    const raw = storage.getItem(BATTLE_TUTORIAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidState(parsed)) throw new Error("Unsupported battle tutorial state");
    return parsed;
  } catch {
    try {
      storage.removeItem(BATTLE_TUTORIAL_STORAGE_KEY);
    } catch {
      // Storage may be unavailable.
    }
    return { ...DEFAULT_STATE };
  }
}

export function markBattleTutorialSeen(storage: TutorialStorage | null = browserStorage()): BattleTutorialState {
  const next: BattleTutorialState = { ...loadBattleTutorial(storage), seen: true };
  if (!storage) return next;

  try {
    storage.setItem(BATTLE_TUTORIAL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or unavailable storage must not interrupt learning.
  }
  return next;
}

export function resetBattleTutorial(storage: TutorialStorage | null = browserStorage()): BattleTutorialState {
  if (!storage) return { ...DEFAULT_STATE };
  try {
    storage.removeItem(BATTLE_TUTORIAL_STORAGE_KEY);
  } catch {
    // Storage may be unavailable.
  }
  return { ...DEFAULT_STATE };
}
