import type { JournalEntry } from "./adventureJournal";

export type DailyAdventureSummaryInput = {
  date: number;
  entries: JournalEntry[];
  previousDayKey?: string;
};

export type DailyAdventureSummary = {
  dayKey: string;
  summary: string;
  answered: number;
  correct: number;
  accuracy: number | null;
  subject: string | null;
};

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function generateDailyAdventureSummary(input: DailyAdventureSummaryInput): DailyAdventureSummary {
  const targetKey = input.previousDayKey ?? dayKey(input.date - 86_400_000);
  const entries = input.entries.filter((entry) => dayKey(entry.date) === targetKey);
  const answered = entries.reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.topicCount)), 0);
  const correct = entries.reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.correctCount)), 0);
  const accuracy = answered > 0 ? correct / answered : null;
  const subjectCounts = new Map<string, number>();
  for (const entry of entries) subjectCounts.set(entry.subject, (subjectCounts.get(entry.subject) ?? 0) + entry.correctCount);
  const subject = Array.from(subjectCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const summary = entries.length === 0
    ? "昨夜的航海日誌還沒有新的足跡，今天就從一小段學習航線開始吧。"
    : accuracy !== null && accuracy >= 0.8
      ? `昨日你完成 ${answered} 題練習，${subject ?? "學習航線"}表現特別亮眼；知識之光正穩定點亮。`
      : accuracy !== null && accuracy < 0.5
        ? `昨日你在 ${subject ?? "部分知識航線"} 遇到幾個暗礁，別急著返航，今天用一組補強題重新觀察線索吧。`
        : `昨日你完成 ${answered} 題練習並答對 ${correct} 題，持續航行就能讓${subject ?? "各科"}的知識島更明亮。`;
  return { dayKey: targetKey, summary, answered, correct, accuracy, subject };
}
