import type { AdaptiveAttempt, AdaptiveErrorType, AdaptiveProfile } from "./adaptiveLearning";

export const ERROR_TYPE_ORDER: AdaptiveErrorType[] = ["concept", "careless", "memory"];

export const ERROR_TYPE_LABELS: Record<AdaptiveErrorType, string> = {
  concept: "觀念整理",
  careless: "細節檢查",
  memory: "記憶提取",
};

export const ERROR_TYPE_COLORS: Record<AdaptiveErrorType, string> = {
  concept: "#0B6E8E",
  careless: "#C29A4A",
  memory: "#B96862",
};

export type ErrorTypeDistribution = {
  type: AdaptiveErrorType;
  label: string;
  count: number;
  percentage: number;
};

export type ErrorTypeTrendPoint = {
  label: string;
  timestamp: number;
  totalAttempts: number;
  totalErrors: number;
  concept: number;
  careless: number;
  memory: number;
  accuracy: number;
};

export type ErrorTypeAnalytics = {
  attempts: number;
  classifiedErrors: number;
  distributions: ErrorTypeDistribution[];
  trend: ErrorTypeTrendPoint[];
  strongestType: AdaptiveErrorType | null;
};

const PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

function scopedAttempts(profile: AdaptiveProfile, questionIds?: Set<string>, now = Date.now()): AdaptiveAttempt[] {
  return profile.attempts
    .filter((attempt) => (!questionIds || questionIds.has(attempt.questionId)) && Number.isFinite(attempt.timestamp) && attempt.timestamp <= now)
    .slice(-1000);
}

function formatPeriodLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}

export function calculateErrorTypeAnalytics(profile: AdaptiveProfile, questionIds?: Set<string>, now = Date.now(), maxPeriods = 8): ErrorTypeAnalytics {
  const attempts = scopedAttempts(profile, questionIds, now);
  const classifiedErrors = attempts.filter((attempt) => !attempt.correct && attempt.errorType);
  const counts = new Map<AdaptiveErrorType, number>(ERROR_TYPE_ORDER.map((type) => [type, 0]));
  classifiedErrors.forEach((attempt) => {
    if (attempt.errorType) counts.set(attempt.errorType, (counts.get(attempt.errorType) ?? 0) + 1);
  });
  const total = classifiedErrors.length;
  const distributions = ERROR_TYPE_ORDER.map((type) => ({
    type,
    label: ERROR_TYPE_LABELS[type],
    count: counts.get(type) ?? 0,
    percentage: total ? Math.round(((counts.get(type) ?? 0) / total) * 100) : 0,
  }));
  const strongestType = total ? [...distributions].sort((a, b) => b.count - a.count || ERROR_TYPE_ORDER.indexOf(a.type) - ERROR_TYPE_ORDER.indexOf(b.type))[0].type : null;

  if (!attempts.length) return { attempts: 0, classifiedErrors: 0, distributions, trend: [], strongestType: null };
  const latestTimestamp = attempts[attempts.length - 1].timestamp;
  const periodOf = (timestamp: number) => Math.max(0, Math.floor((latestTimestamp - timestamp) / PERIOD_MS));
  const grouped = new Map<number, AdaptiveAttempt[]>();
  attempts.forEach((attempt) => {
    const period = periodOf(attempt.timestamp);
    if (period < maxPeriods) grouped.set(period, [...(grouped.get(period) ?? []), attempt]);
  });
  const periods = Array.from(grouped.keys()).sort((a, b) => b - a);
  const trend = periods.map((period) => {
    const periodAttempts = grouped.get(period) ?? [];
    const point = { concept: 0, careless: 0, memory: 0 };
    periodAttempts.forEach((attempt) => {
      if (!attempt.correct && attempt.errorType) point[attempt.errorType] += 1;
    });
    return {
      label: formatPeriodLabel(latestTimestamp - period * PERIOD_MS),
      timestamp: latestTimestamp - period * PERIOD_MS,
      totalAttempts: periodAttempts.length,
      totalErrors: point.concept + point.careless + point.memory,
      ...point,
      accuracy: Math.round((periodAttempts.filter((attempt) => attempt.correct).length / periodAttempts.length) * 100),
    };
  });
  return { attempts: attempts.length, classifiedErrors: total, distributions, trend, strongestType };
}

export function getErrorTypeLearningMessage(analytics: ErrorTypeAnalytics): string {
  if (!analytics.attempts) return "完成幾題後，這裡會用真實作答紀錄整理你的學習線索。";
  if (!analytics.classifiedErrors || !analytics.strongestType) return "目前還沒有可分類的錯誤；持續練習，之後可以看見更清楚的學習分佈。";
  const label = ERROR_TYPE_LABELS[analytics.strongestType];
  if ((analytics.distributions.find((item) => item.type === analytics.strongestType)?.percentage ?? 0) >= 60) return `目前較常需要整理的是「${label}」。這不是能力標籤，而是一個可以從小題目開始練習的方向。`;
  return `目前三種線索分佈較平均；可以先挑一個「${label}」練習入口，逐步建立自己的解題節奏。`;
}
