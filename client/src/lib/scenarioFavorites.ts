export const SCENARIO_FAVORITES_STORAGE_KEY = "xue-wormhole-scenario-favorites-v1";

type SavedScenarioFavorites = {
  version: 1;
  questionIds: string[];
};

const normalizeQuestionIds = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((id): id is string => typeof id === "string" && id.trim().length > 0))).slice(0, 40);
};

export function loadScenarioFavorites(storage: Pick<Storage, "getItem" | "removeItem"> = localStorage) {
  try {
    const raw = storage.getItem(SCENARIO_FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SavedScenarioFavorites>;
    if (parsed.version !== 1) throw new Error("Unsupported scenario favorites");
    return normalizeQuestionIds(parsed.questionIds);
  } catch {
    try { storage.removeItem(SCENARIO_FAVORITES_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
    return [];
  }
}

export function saveScenarioFavorites(questionIds: readonly string[], storage: Pick<Storage, "setItem"> = localStorage) {
  try {
    const value: SavedScenarioFavorites = { version: 1, questionIds: normalizeQuestionIds(questionIds) };
    storage.setItem(SCENARIO_FAVORITES_STORAGE_KEY, JSON.stringify(value));
  } catch { /* Private browsing must not interrupt learning. */ }
}
