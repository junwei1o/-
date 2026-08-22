import { loadRpgState, saveRpgState } from "./rpgStorage";

const RANDOM_ADVENTURE_BONUS_KEY = "xue-adventure-random-adventure-bonus-v1";
const MAX_CLAIMED_BONUSES = 60;

type BonusReceipt = {
  claimedEventIds: string[];
};

function loadReceipt(storage: Storage | Pick<Storage, "getItem"> = localStorage): BonusReceipt {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(RANDOM_ADVENTURE_BONUS_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object") return { claimedEventIds: [] };
    const ids = (parsed as Partial<BonusReceipt>).claimedEventIds;
    return { claimedEventIds: Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(-MAX_CLAIMED_BONUSES) : [] };
  } catch {
    return { claimedEventIds: [] };
  }
}

function saveReceipt(receipt: BonusReceipt, storage: Storage | Pick<Storage, "setItem"> = localStorage) {
  try {
    storage.setItem(RANDOM_ADVENTURE_BONUS_KEY, JSON.stringify(receipt));
  } catch {
    // Private browsing and storage quota errors must not interrupt learning.
  }
}

/**
 * Extra coins are deliberately awarded only after the ordinary answer event has
 * been recorded as correct. A stable event id makes refreshes and double-clicks harmless.
 */
export function claimRandomAdventureBonus(input: { eventId: string; correct: boolean; bonusCoins: number }, storage: Storage = localStorage) {
  if (!input.correct || !input.eventId || !Number.isFinite(input.bonusCoins) || input.bonusCoins <= 0) return { awarded: 0, state: loadRpgState(storage) };
  const receipt = loadReceipt(storage);
  const current = loadRpgState(storage);
  if (receipt.claimedEventIds.includes(input.eventId)) return { awarded: 0, state: current };

  const awarded = Math.floor(input.bonusCoins);
  const next = {
    ...current,
    coins: current.coins + awarded,
    notice: `隨機冒險答對！額外獲得 ${awarded} 枚航海金幣。`,
  };
  saveRpgState(next, storage);
  saveReceipt({ claimedEventIds: [...receipt.claimedEventIds, input.eventId].slice(-MAX_CLAIMED_BONUSES) }, storage);
  return { awarded, state: next };
}
