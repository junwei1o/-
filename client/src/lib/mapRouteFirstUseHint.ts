export const MAP_ROUTE_FIRST_USE_HINT_STORAGE_KEY = "xue-map-route-first-use-hint-v1";

export type MapRouteFirstUseHintState = {
  version: 1;
  seen: boolean;
};

const DEFAULT_STATE: MapRouteFirstUseHintState = { version: 1, seen: false };

type RouteHintStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function browserStorage(): RouteHintStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidState(value: unknown): value is MapRouteFirstUseHintState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapRouteFirstUseHintState>;
  return candidate.version === 1 && typeof candidate.seen === "boolean";
}

export function loadMapRouteFirstUseHint(storage: RouteHintStorage | null = browserStorage()): MapRouteFirstUseHintState {
  if (!storage) return { ...DEFAULT_STATE };

  try {
    const raw = storage.getItem(MAP_ROUTE_FIRST_USE_HINT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidState(parsed)) throw new Error("Unsupported map route hint state");
    return parsed;
  } catch {
    try { storage.removeItem(MAP_ROUTE_FIRST_USE_HINT_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
    return { ...DEFAULT_STATE };
  }
}

export function markMapRouteFirstUseHintSeen(storage: RouteHintStorage | null = browserStorage()): MapRouteFirstUseHintState {
  const next: MapRouteFirstUseHintState = { ...loadMapRouteFirstUseHint(storage), seen: true };
  if (!storage) return next;

  try {
    storage.setItem(MAP_ROUTE_FIRST_USE_HINT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or disabled storage must not interrupt learning.
  }
  return next;
}
