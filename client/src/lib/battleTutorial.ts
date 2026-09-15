/**
 * 三步戰鬥教學（首次進入對戰引導）：
 * ① 選擇技能或先答題 ② 作答課綱題 ③ 觀看傷害結算。
 * 看完或跳過後寫入本地標記，之後不再重複彈出。
 * 模式與 battleRageSkillTutorial 一致：純函式、storage 可注入、壞資料自動清除。
 */

export const BATTLE_TUTORIAL_STORAGE_KEY = "xue-battle-tutorial-v1";

export type BattleTutorialState = {
  version: 1;
  seen: boolean;
};

export const BATTLE_TUTORIAL_STEPS = [
  {
    key: "act",
    title: "選擇你的行動",
    text: "點擊技能按鈕，或先回答課綱題讓下一擊獲得增幅；守門者會在每回合結束後回應。",
  },
  {
    key: "answer",
    title: "作答課綱題",
    text: "答對會大幅提高傷害並累積連擊；答錯仍保留最低傷害，學習永遠有進展。",
  },
  {
    key: "damage",
    title: "觀看傷害結算",
    text: "每次出手後，戰鬥日誌會顯示你與守門者的傷害與剩餘生命，能量消耗也會同步更新。",
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
