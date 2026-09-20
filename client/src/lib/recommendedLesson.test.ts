import { describe, expect, it } from "vitest";
import { ONION_LESSONS } from "@/game/onionAcademyLessons";
import { ONION_ACADEMY_ROUTE, pickRecommendedLesson, weakestSubjectThisWeek } from "./recommendedLesson";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 20, 12); // 2026-09-20，當週有資料

describe("weakestSubjectThisWeek", () => {
  it("沒有資料時回傳 null", () => {
    expect(weakestSubjectThisWeek([], NOW)).toBeNull();
  });

  it("全對時回傳 null（不算弱科）", () => {
    const rows = [
      { subject: "數學", isCorrect: true, timestamp: NOW - DAY },
      { subject: "數學", isCorrect: true, timestamp: NOW - 2 * DAY },
    ];
    expect(weakestSubjectThisWeek(rows, NOW)).toBeNull();
  });

  it("挑出錯誤率最高的科目", () => {
    const rows = [
      { subject: "數學", isCorrect: false, timestamp: NOW - DAY },
      { subject: "數學", isCorrect: false, timestamp: NOW - 2 * DAY },
      { subject: "自然", isCorrect: false, timestamp: NOW - DAY },
      { subject: "自然", isCorrect: true, timestamp: NOW - 2 * DAY },
    ];
    expect(weakestSubjectThisWeek(rows, NOW)?.subject).toBe("數學");
  });

  it("上週的紀錄不算進本週", () => {
    const rows = [{ subject: "數學", isCorrect: false, timestamp: NOW - 30 * DAY }];
    expect(weakestSubjectThisWeek(rows, NOW)).toBeNull();
  });
});

describe("pickRecommendedLesson", () => {
  it("國小只會推薦含國小的課，國中只會推薦含國中的課", () => {
    for (let offset = 0; offset < 10; offset += 1) {
      const el = pickRecommendedLesson({ stage: "國小", now: NOW + offset * DAY });
      expect(el?.lesson.stages).toContain("國小");
      const jh = pickRecommendedLesson({ stage: "國中", now: NOW + offset * DAY });
      expect(jh?.lesson.stages).toContain("國中");
    }
  });

  it("有弱科時優推該科，且理由提到科目", () => {
    const picked = pickRecommendedLesson({ stage: "國中", weakSubject: "數學", now: NOW });
    expect(picked?.lesson.subject).toBe("數學");
    expect(picked?.reason).toContain("數學");
  });

  it("沒有弱科時依日期輪替，不會永遠同一堂", () => {
    const titles = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      const picked = pickRecommendedLesson({ stage: "國小", now: NOW + i * DAY });
      if (picked) titles.add(picked.lesson.title);
    }
    expect(titles.size).toBeGreaterThan(1);
  });

  it("弱科沒有對應課程時仍會給一堂（不會回傳 null）", () => {
    const picked = pickRecommendedLesson({ stage: "國小", weakSubject: "英語", now: NOW });
    expect(picked).not.toBeNull();
  });

  it("推薦的課一定在課程清單裡，路由指向洋蔥動畫講解", () => {
    const picked = pickRecommendedLesson({ stage: "國中", now: NOW });
    expect(ONION_LESSONS.map((l) => l.id)).toContain(picked?.lesson.id);
    expect(ONION_ACADEMY_ROUTE).toBe("/classroom/onion-academy");
  });
});
