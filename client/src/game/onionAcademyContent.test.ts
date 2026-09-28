import { describe, expect, it } from "vitest";
import { ONION_LESSONS } from "./onionAcademyLessons";

/**
 * 洋蔥學院內容的結構驗證（可執行版）。
 * 完整的圖解一致性報告在 scripts/qc-onion-lessons.mts；這裡把最重要的規則
 * 固化成測試，避免之後新增課程時又把「步驟標籤」或「題數」漏掉。
 */
describe("洋蔥學院內容驗證", () => {
  /**
   * 2026-09-28：本專案改為只做國小，國中／高中課程已全部移除。
   * 因此門檻改為國小單一學段；原「200 堂、三學段各 65~70 堂」的目標不再適用。
   */
  it("課程規模達標（國小）", () => {
    const of = (stage: string) => ONION_LESSONS.filter((l) => l.stages.includes(stage));
    const count = (list: typeof ONION_LESSONS) => list.reduce((sum, l) => sum + l.questions.length, 0);
    expect(of("國小").length).toBeGreaterThanOrEqual(70);
    expect(count(of("國小"))).toBeGreaterThanOrEqual(350);
  });

  it("只有國小學段，且涵蓋多個科目", () => {
    const stages = new Set(ONION_LESSONS.map((l) => l.stages[0]));
    expect([...stages].sort()).toEqual(["國小"]);
    const subjects = new Set(ONION_LESSONS.map((l) => l.subject));
    expect(subjects.size).toBeGreaterThanOrEqual(5);
  });

  /**
   * 題目 id 必須全站唯一。
   *
   * App 目前用「題目索引」追蹤作答，所以撞號還不會出錯；但題目 id 是天然的
   * 作答紀錄鍵，一旦日後用它存進度，兩堂課撞號就會互相污染。實際踩過：
   * 1000 題裡有 85 個重複（例如角的分類與大氣的結構都用 at1-at5）。
   */
  it("題目 id 全站唯一，且以自己課程的 id 開頭", () => {
    const owners = new Map<string, string[]>();
    for (const lesson of ONION_LESSONS) {
      for (const question of lesson.questions) {
        expect(question.id, `${lesson.id} 的題目 id 未以課程 id 開頭`).toMatch(
          new RegExp(`^${lesson.id}-`),
        );
        owners.set(question.id, [...(owners.get(question.id) ?? []), lesson.id]);
      }
    }
    const duplicated = [...owners.entries()].filter(([, list]) => list.length > 1);
    expect(duplicated, `重複的題目 id：${duplicated.map(([id]) => id).join("、")}`).toHaveLength(0);
  });

  it("每一堂課都屬於剛好一個學段，且 id 不重複", () => {
    const ids = ONION_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lesson of ONION_LESSONS) {
      expect(lesson.stages, `${lesson.id} 的學段數`).toHaveLength(1);
      expect(["國小", "國中", "高中"]).toContain(lesson.stages[0]);
    }
  });

  it("每一幀都有步驟標籤，且編號與位置一致（步驟分類要清楚）", () => {
    for (const lesson of ONION_LESSONS) {
      lesson.frames.forEach((frame, index) => {
        expect(frame.step, `${lesson.id} 第 ${index + 1} 幀缺少步驟標籤`).toBeTruthy();
        const matched = /^步驟\s*(\d+)\s*：(.+)$/.exec(frame.step ?? "");
        expect(matched, `${lesson.id} 第 ${index + 1} 幀的步驟格式不對：${frame.step}`).not.toBeNull();
        expect(Number(matched![1]), `${lesson.id} 第 ${index + 1} 幀步驟編號不一致`).toBe(index + 1);
        expect(matched![2].trim().length, `${lesson.id} 第 ${index + 1} 幀步驟說明過短`).toBeGreaterThan(2);
      });
    }
  });

  it("教具的分數與字幕一致（圖和字幕不能各說各話）", () => {
    for (const lesson of ONION_LESSONS) {
      for (const frame of lesson.frames) {
        const prop = frame.prop as { kind: string; a?: number; b?: number };
        if (prop.kind !== "pie") continue;
        const captionFractions = [...frame.caption.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map(
          (m) => `${m[1]}/${m[2]}`,
        );
        if (captionFractions.length === 0) continue;
        expect(
          captionFractions,
          `${lesson.id}「${frame.caption}」的分數與 pie ${prop.a}/${prop.b} 不一致`,
        ).toContain(`${prop.a}/${prop.b}`);
      }
    }
  });

  it("題目結構完整：4 個相異選項、索引合法、有詳解與兩級提示", () => {
    for (const lesson of ONION_LESSONS) {
      for (const question of lesson.questions) {
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options).size).toBe(4);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(4);
        expect(question.explanation.trim().length).toBeGreaterThan(7);
        expect(question.hints?.length ?? 0).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
