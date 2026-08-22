export const MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY = "xue-map-supply-strategy-preference-v2";
export const LEGACY_MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY = "xue-map-supply-strategy-preference-v1";

export type MapSupplyStrategyPreference = {
  version: 2;
  expandedByIsland: Record<string, boolean>;
  legacyExpanded?: boolean;
};

type PreferenceStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const DEFAULT_PREFERENCE: MapSupplyStrategyPreference = { version: 2, expandedByIsland: {} };

function browserStorage(): PreferenceStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidIslandMap(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "boolean");
}

function isValidPreference(value: unknown): value is MapSupplyStrategyPreference {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapSupplyStrategyPreference>;
  return candidate.version === 2
    && isValidIslandMap(candidate.expandedByIsland)
    && (candidate.legacyExpanded === undefined || typeof candidate.legacyExpanded === "boolean");
}

function readJson(storage: PreferenceStorage, key: string): unknown {
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export function loadMapSupplyStrategyPreference(
  storage: PreferenceStorage | null = browserStorage(),
): MapSupplyStrategyPreference {
  if (!storage) return { ...DEFAULT_PREFERENCE, expandedByIsland: {} };

  try {
    const current = readJson(storage, MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY);
    if (isValidPreference(current)) return { ...current, expandedByIsland: { ...current.expandedByIsland } };

    const legacy = readJson(storage, LEGACY_MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY) as { version?: unknown; expanded?: unknown } | null;
    if (legacy?.version === 1 && typeof legacy.expanded === "boolean") {
      const migrated: MapSupplyStrategyPreference = {
        version: 2,
        expandedByIsland: {},
        legacyExpanded: legacy.expanded,
      };
      storage.setItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    if (current !== null) storage.removeItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY);
    return { ...DEFAULT_PREFERENCE, expandedByIsland: {} };
  } catch {
    try {
      storage.removeItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY);
      storage.removeItem(LEGACY_MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; the map remains usable without persistence.
    }
    return { ...DEFAULT_PREFERENCE, expandedByIsland: {} };
  }
}

export function preferenceForIsland(
  preference: MapSupplyStrategyPreference,
  islandId: string,
): boolean {
  return preference.expandedByIsland[islandId] ?? preference.legacyExpanded ?? false;
}

/**
 * 判斷某座島是否真的有可恢復的保存偏好；沒有紀錄時不應誤顯示恢復提示。
 * legacyExpanded 代表 v1 偏好已安全遷移，仍視為可套用的保存狀態。
 */
export function hasSavedPreferenceForIsland(
  preference: MapSupplyStrategyPreference,
  islandId: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(preference.expandedByIsland, islandId)
    || preference.legacyExpanded !== undefined;
}

export function saveMapSupplyStrategyPreference(
  islandId: string,
  expanded: boolean,
  storage: PreferenceStorage | null = browserStorage(),
): MapSupplyStrategyPreference {
  const current = loadMapSupplyStrategyPreference(storage);
  const next: MapSupplyStrategyPreference = {
    version: 2,
    expandedByIsland: { ...current.expandedByIsland, [islandId]: expanded },
    ...(current.legacyExpanded === undefined ? {} : { legacyExpanded: current.legacyExpanded }),
  };
  if (!storage) return next;

  try {
    storage.setItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or disabled storage must not interrupt learning.
  }
  return next;
}
