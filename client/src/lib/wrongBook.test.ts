import { describe, expect, it } from "vitest";
import { FILL_QUESTIONS, ORDER_QUESTIONS } from "./classroomBank";
import { buildQuestionLookup } from "./questionLookup";
import { collectGraduatedGroups, collectWrongBookGroups } from "./wrongBook";
import type { AdaptiveAttempt, AdaptiveProfile } from "@/game/adaptiveLearning";

/**
 * 回歸測試：試卷 deck 會混入 fill_bank / order_bank 的題目，
 * 但主題庫（useQuestionBank）沒有它們 → 錯題重練／畢業榜會顯示「（題目資料待補）」。
 * 這裡鎖定「查找表必須涵蓋試卷真正用得到的全部來源」。
 */

function attempt(
  overrides: Pick<AdaptiveAttempt, "questionId" | "correct"> & Partial<AdaptiveAttempt>,
): AdaptiveAttempt {
  return {
    curriculumDomain: "國語",
    knowledge: ["量詞搭配"],
    difficulty: "標準",
    responseMs: 1_200,
    timeLimitMs: 25_000,
    timestamp: 1_000,
    ...overrides,
  };
}

function profile(attempts: AdaptiveAttempt[]): AdaptiveProfile {
  return { version: 2, attempts, spacedReviews: [] };
}

const allItems = (groups: ReturnType<typeof collectWrongBookGroups>) =>
  groups.flatMap((group) => group.items);

describe("題目查找表", () => {
  it("涵蓋試卷會混入的填空題與排序題", () => {
    expect(FILL_QUESTIONS.length).toBeGreaterThan(0);
    expect(ORDER_QUESTIONS.length).toBeGreaterThan(0);

    const lookup = buildQuestionLookup([]);
    expect(lookup.get(FILL_QUESTIONS[0]!.id)?.prompt).toBe(FILL_QUESTIONS[0]!.prompt);
    expect(lookup.get(ORDER_QUESTIONS[0]!.id)?.prompt).toBe(ORDER_QUESTIONS[0]!.prompt);
  });

  it("主題庫已有的 id 優先，不被 classroomBank 覆寫", () => {
    const lookup = buildQuestionLookup([
      {
        id: FILL_QUESTIONS[0]!.id,
        prompt: "主題庫版本的題幹",
      } as never,
    ]);
    expect(lookup.get(FILL_QUESTIONS[0]!.id)?.prompt).toBe("主題庫版本的題幹");
  });
});

describe("錯題重練分組", () => {
  it("填空／排序題能顯示真實題幹，不會出現「題目資料待補」", () => {
    const lookup = buildQuestionLookup([]);
    const groups = collectWrongBookGroups(
      profile([
        attempt({ questionId: FILL_QUESTIONS[0]!.id, correct: false }),
        attempt({ questionId: ORDER_QUESTIONS[0]!.id, correct: false }),
      ]),
      lookup,
    );

    const items = allItems(groups);
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.prompt).not.toContain("題目資料待補");
    }
    expect(items.find((item) => item.questionId === FILL_QUESTIONS[0]!.id)?.prompt).toBe(
      FILL_QUESTIONS[0]!.prompt,
    );
  });

  it("題目確實已不在題庫時，退回知識點而不是丟佔位文字給學生", () => {
    const items = allItems(
      collectWrongBookGroups(profile([attempt({ questionId: "已經下架的題", correct: false })]), buildQuestionLookup([])),
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.prompt).toBe("量詞搭配");
    expect(items[0]!.prompt).not.toContain("題目資料待補");
  });

  it("連續答對兩次就移出錯題本；只對一次仍保留、顯示再答對 1 題", () => {
    const lookup = buildQuestionLookup([]);
    const onceWrong = collectWrongBookGroups(
      profile([attempt({ questionId: "q-a", correct: false }), attempt({ questionId: "q-a", correct: true })]),
      lookup,
    );
    expect(allItems(onceWrong)).toHaveLength(1);
    expect(allItems(onceWrong)[0]!.streak).toBe(1);
    expect(allItems(onceWrong)[0]!.remaining).toBe(1);

    const twice = collectWrongBookGroups(
      profile([
        attempt({ questionId: "q-b", correct: false }),
        attempt({ questionId: "q-b", correct: true }),
        attempt({ questionId: "q-b", correct: true }),
      ]),
      lookup,
    );
    expect(allItems(twice)).toHaveLength(0);
  });

  it("分組固定為國語、數學、社會、自然，且只回傳有題目的科目", () => {
    const groups = collectWrongBookGroups(
      profile([
        attempt({ questionId: "q-c", correct: false }),
        attempt({ questionId: "q-d", correct: false, curriculumDomain: "數學" }),
      ]),
      buildQuestionLookup([]),
    );
    expect(groups.map((group) => group.subject)).toEqual(["國語", "數學"]);
  });
});

describe("畢業紀念榜分組", () => {
  it("只收已畢業的題，並以畢業時間由新到舊排序", () => {
    const lookup = buildQuestionLookup([]);
    const groups = collectGraduatedGroups(
      profile([
        attempt({ questionId: "older", correct: false }),
        attempt({ questionId: "older", correct: true }),
        attempt({ questionId: "older", correct: true, timestamp: 2_000 }),
        attempt({ questionId: "newer", correct: false }),
        attempt({ questionId: "newer", correct: true }),
        attempt({ questionId: "newer", correct: true, timestamp: 9_000 }),
      ]),
      lookup,
    );

    const items = groups.flatMap((group) => group.items);
    expect(items.map((item) => item.questionId)).toEqual(["newer", "older"]);
    expect(items[0]!.graduatedAt).toBe(9_000);
    expect(items[1]!.graduatedAt).toBe(2_000);
  });

  it("從未答錯、一直答對的題不算畢業", () => {
    const items = collectGraduatedGroups(
      profile([
        attempt({ questionId: "q-ok", correct: true }),
        attempt({ questionId: "q-ok", correct: true }),
      ]),
      buildQuestionLookup([]),
    ).flatMap((group) => group.items);
    expect(items).toHaveLength(0);
  });
});
