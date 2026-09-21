import { describe, expect, it } from "vitest";
import { ONION_LESSONS } from "./onionAcademyLessons";
import { ONION_LESSON_CATALOG } from "./onionLessonCatalog.gen";

/**
 * 輕量目錄是「產物」（scripts/build-onion-catalog.mts 產生）。
 * 這組測試負責把關：只要有人新增／修改課程卻忘記重跑 `pnpm catalog:onion`，
 * 目錄與完整課程就會不一致，測試隨即轉紅，避免首頁推薦到過期清單。
 */
describe("洋蔥課程輕量目錄", () => {
  it("堂數與 id 順序和完整課程清單一致", () => {
    expect(ONION_LESSON_CATALOG.length).toBe(ONION_LESSONS.length);
    expect(ONION_LESSON_CATALOG.map((l) => l.id)).toEqual(ONION_LESSONS.map((l) => l.id));
  });

  it("每堂的輕量欄位與完整課程完全一致", () => {
    for (const summary of ONION_LESSON_CATALOG) {
      const full = ONION_LESSONS.find((l) => l.id === summary.id);
      expect(full, `目錄引用了完整清單中不存在的課程：${summary.id}`).toBeTruthy();
      expect(summary).toEqual({
        id: full!.id,
        title: full!.title,
        subject: full!.subject,
        topic: full!.topic,
        grade: full!.grade,
        stages: full!.stages,
        desc: full!.desc,
      });
    }
  });
});
