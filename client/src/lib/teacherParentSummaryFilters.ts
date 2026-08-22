import type { AdaptiveProfile } from "@/game/adaptiveLearning";

export type SupporterSummaryFilters = {
  islandSubject: string;
  fromDate: string;
  toDate: string;
};

export const DEFAULT_SUPPORTER_SUMMARY_FILTERS: SupporterSummaryFilters = {
  islandSubject: "all",
  fromDate: "",
  toDate: "",
};

export const SUPPORTER_SUMMARY_FILTERS_STORAGE_KEY = "xue-adventure-supporter-summary-filters-v1";

function localDateStart(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;
  return new Date(year, month - 1, day).getTime();
}

function localDateEnd(date: string) {
  const start = localDateStart(date);
  return start === null ? null : start + 24 * 60 * 60 * 1000 - 1;
}

export function filterAdaptiveProfile(profile: AdaptiveProfile, filters: SupporterSummaryFilters): AdaptiveProfile {
  const from = filters.fromDate ? localDateStart(filters.fromDate) : null;
  const to = filters.toDate ? localDateEnd(filters.toDate) : null;
  const hasValidRange = from === null || to === null || from <= to;
  const attempts = hasValidRange
    ? profile.attempts.filter((attempt) => {
      const matchesIsland = filters.islandSubject === "all" || attempt.curriculumDomain === filters.islandSubject;
      const matchesFrom = from === null || attempt.timestamp >= from;
      const matchesTo = to === null || attempt.timestamp <= to;
      return matchesIsland && matchesFrom && matchesTo;
    })
    : [];
  return { ...profile, attempts, spacedReviews: profile.spacedReviews ?? [] };
}

export function hasSupporterSummaryFilters(filters: SupporterSummaryFilters) {
  return filters.islandSubject !== "all" || Boolean(filters.fromDate) || Boolean(filters.toDate);
}

export function hasValidSupporterDateRange(filters: SupporterSummaryFilters) {
  const from = filters.fromDate ? localDateStart(filters.fromDate) : null;
  const to = filters.toDate ? localDateEnd(filters.toDate) : null;
  return from === null || to === null || from <= to;
}

export function loadSupporterSummaryFilters(storage: Pick<Storage, "getItem"> = localStorage): SupporterSummaryFilters {
  try {
    const raw = storage.getItem(SUPPORTER_SUMMARY_FILTERS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SUPPORTER_SUMMARY_FILTERS };
    const parsed = JSON.parse(raw) as Partial<SupporterSummaryFilters>;
    return {
      islandSubject: typeof parsed.islandSubject === "string" && parsed.islandSubject ? parsed.islandSubject : "all",
      fromDate: typeof parsed.fromDate === "string" ? parsed.fromDate : "",
      toDate: typeof parsed.toDate === "string" ? parsed.toDate : "",
    };
  } catch {
    return { ...DEFAULT_SUPPORTER_SUMMARY_FILTERS };
  }
}

export function saveSupporterSummaryFilters(filters: SupporterSummaryFilters, storage: Pick<Storage, "setItem"> = localStorage) {
  try { storage.setItem(SUPPORTER_SUMMARY_FILTERS_STORAGE_KEY, JSON.stringify(filters)); } catch { /* private browsing should not interrupt viewing */ }
}
