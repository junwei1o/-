import type { ArenaHabitatKey, RegionKey } from "./rpgTypes";

export type MapVictoryProgress = {
  unlockedRouteIds: string[];
  supplyMarkerIds: string[];
};

export const defaultMapVictoryProgress: MapVictoryProgress = {
  unlockedRouteIds: [],
  supplyMarkerIds: [],
};

export const routeIdForRegion = (region: RegionKey) => `victory-route-${region}`;
export const supplyMarkerIdForRegion = (region: RegionKey) => `supply-${region}`;
export const supplyMarkerIdForHabitat = (habitatId: ArenaHabitatKey) => `supply-habitat-${habitatId}`;

export function normalizeMapVictoryProgress(value?: Partial<MapVictoryProgress> | null): MapVictoryProgress {
  return {
    unlockedRouteIds: Array.from(new Set(value?.unlockedRouteIds ?? [])).filter(Boolean),
    supplyMarkerIds: Array.from(new Set(value?.supplyMarkerIds ?? [])).filter(Boolean),
  };
}

/**
 * A completed battle unlocks only the route and supply marker belonging to its
 * real encounter region. Set-based IDs make repeated victories idempotent.
 */
export function recordMapVictory(
  current: Partial<MapVictoryProgress> | null | undefined,
  input: { region: RegionKey; habitatId?: ArenaHabitatKey },
): MapVictoryProgress {
  const normalized = normalizeMapVictoryProgress(current);
  const routeId = routeIdForRegion(input.region);
  const regionSupplyId = supplyMarkerIdForRegion(input.region);
  const habitatSupplyId = input.habitatId ? supplyMarkerIdForHabitat(input.habitatId) : null;
  return {
    unlockedRouteIds: Array.from(new Set([...normalized.unlockedRouteIds, routeId])),
    supplyMarkerIds: Array.from(new Set([
      ...normalized.supplyMarkerIds,
      regionSupplyId,
      ...(habitatSupplyId ? [habitatSupplyId] : []),
    ])),
  };
}

export function hasUnlockedRoute(progress: Partial<MapVictoryProgress> | null | undefined, region: RegionKey) {
  return normalizeMapVictoryProgress(progress).unlockedRouteIds.includes(routeIdForRegion(region));
}
