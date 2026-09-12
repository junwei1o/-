import { describe, expect, it } from "vitest";
import {
  buildWeeklyQuiz,
  collectWeakTopics,
  computeWeeklyRewards,
  expForDifficulty,
  getWeeklyQuizStatus,
  getWeeklyQuizWindow,
  goldForDifficulty,
  mondayOfWeek,
  scoreWeeklyQuiz,
  weekKeyFor,
  type WeeklyQuizBankRow,
} from "./weeklyQuiz";

/** 台北時間 2026-09-12（六）00:00 = UTC 2026-09-11 16:00 */
const SATURDAY_TAIPEI = Date.UTC(2026, 8, 11, 16);
/** 台北時間 2026-09-11（五）00:00 = UTC 2026-09-10 16:00 */
const FRIDAY_TAIPEI_0000 = Date.UTC(2026, 8, 10, 16);
/** 台北時間 2026-09-14（一）00:00 = UTC 2026-09-13 16:00 */
const MONDAY_TAIPEI_0000 = Date.UTC(2026, 8, 13, 16);

function makeBank(count = 30): WeeklyQuizBankRow[] {
  const bank: WeeklyQuizBankRow[] = [];
  const subjects = ["國語", "數學", "自然", "社會"] as const;
  let id = 0;
  for (const subject of subjects) {
    for (let topicIdx = 0; topicIdx < 4; topicIdx += 1) {
      for (let variant = 0; variant < Math.ceil(count / 16); variant += 1) {
        id += 1;
        bank.push({
          id: `${subject}-${topicIdx}-${variant}`,
          subject,
          grade: 4,
          difficulty: topicIdx % 2 === 0 ? "標準" : "挑戰",
          learningTopic: `${subject}主題${topicIdx + 1}`,
          prompt: `${subject}題目 ${topicIdx}-${variant}？`,
          options: ["甲", "乙", "丙", "丁"],
          answer: 0,
          explanation: "解析",
        });
      }
    }
  }
  return bank;
}

function recordWith(topics: Array<{ subject: string; topic: string; correct: boolean }>) {
  return { detail: { scope: "綜合課綱", topics } };
}

describe("週 key 與台北時間視窗", () => {
  it("mondayOfWeek 回傳台北時間週一 00:00（UTC 毫秒）", () => {
    expect(mondayOfWeek(SATURDAY_TAIPEI)).toBe(Date.UTC(2026, 8, 6, 16)); // 台北 09-07（一）00:00
  });

  it("週六的週 key 是該週的 ISO 週", () => {
    expect(weekKeyFor(SATURDAY_TAIPEI)).toBe("2026-W37");
  });

  it("週五 00:00 是視窗起點、下週一 00:00 是視窗終點", () => {
    const window = getWeeklyQuizWindow(SATURDAY_TAIPEI);
    expect(window.weekKey).toBe("2026-W37");
    expect(window.opensAt).toBe(FRIDAY_TAIPEI_0000);
    expect(window.closesAt).toBe(MONDAY_TAIPEI_0000);
  });

  it("週五至週日 23:59 開放，週一～週四不開放", () => {
    expect(getWeeklyQuizStatus(FRIDAY_TAIPEI_0000)).toBe("open");
    expect(getWeeklyQuizStatus(Date.UTC(2026, 8, 10, 15, 59))).toBe("notOpen"); // 台北週四 23:59
    expect(getWeeklyQuizStatus(SATURDAY_TAIPEI)).toBe("open");
    expect(getWeeklyQuizStatus(Date.UTC(2026, 8, 13, 15, 59, 59))).toBe("open"); // 台北週日 23:59:59
    expect(getWeeklyQuizStatus(MONDAY_TAIPEI_0000)).toBe("notOpen");
  });
});

describe("collectWeakTopics 薄弱知識點", () => {
  it("依錯誤率降冪排序，只收有錯的知識點", () => {
    const topics = collectWeakTopics([
      recordWith([
        { subject: "數學", topic: "分數", correct: false },
        { subject: "數學", topic: "分數", correct: false },
        { subject: "數學", topic: "分數", correct: true },
        { subject: "國語", topic: "閱讀", correct: false },
      ]),
    ]);
    expect(topics).toEqual([
      { subject: "國語", topic: "閱讀", total: 1, wrong: 1 }, // 錯誤率 100% 最優先
      { subject: "數學", topic: "分數", total: 3, wrong: 2 },
    ]);
  });

  it("全對的知識點不列入，空 topic 忽略", () => {
    const topics = collectWeakTopics([
      recordWith([
        { subject: "數學", topic: "分數", correct: true },
        { subject: "數學", topic: "   ", correct: false },
      ]),
    ]);
    expect(topics).toEqual([]);
  });
});

describe("buildWeeklyQuiz 出題", () => {
  const bank = makeBank();

  it("薄弱知識點優先：每點最多 2 題、同年級優先，且不重複", () => {
    const quiz = buildWeeklyQuiz({
      records: [
        recordWith([
          { subject: "數學", topic: "數學主題1", correct: false },
          { subject: "數學", topic: "數學主題1", correct: false },
          { subject: "國語", topic: "國語主題1", correct: false },
        ]),
      ],
      bank,
      grade: 4,
      count: 10,
    });
    const ids = quiz.map((question) => question.id);
    expect(new Set(ids).size).toBe(quiz.length);
    // 數學主題1 與 國語主題1 各占 2 題（同年級 variant 0/1）
    const mathTopic1 = quiz.filter((q) => q.learningTopic === "數學主題1").length;
    const chineseTopic1 = quiz.filter((q) => q.learningTopic === "國語主題1").length;
    expect(mathTopic1).toBe(2);
    expect(chineseTopic1).toBe(2);
    expect(quiz.length).toBe(10);
  });

  it("薄弱知識點不足時用本週有練習的科目補滿，再以他科輪補", () => {
    const quiz = buildWeeklyQuiz({
      records: [recordWith([{ subject: "社會", topic: "社會主題1", correct: false }])],
      bank,
      grade: 4,
      count: 10,
    });
    expect(quiz.length).toBe(10);
    // 社會主題1 2 題 + 社會科其餘題（本週有練習科目優先）
    expect(quiz.filter((q) => q.learningTopic === "社會主題1").length).toBe(2);
    expect(quiz.filter((q) => q.subject === "社會").length).toBeGreaterThanOrEqual(8);
  });

  it("完全沒有紀錄時用同年級各科平衡補滿", () => {
    const quiz = buildWeeklyQuiz({ records: [], bank, grade: 4, count: 10 });
    expect(quiz.length).toBe(10);
    const subjects = new Set(quiz.map((q) => q.subject));
    expect(subjects.size).toBeGreaterThanOrEqual(3);
  });

  it("題庫不足時回傳能給的全部（不開天窗）", () => {
    const quiz = buildWeeklyQuiz({ records: [], bank: bank.slice(0, 3), count: 10 });
    expect(quiz.length).toBe(3);
  });
});

describe("計分與獎勵", () => {
  const bank = makeBank();
  const quiz = buildWeeklyQuiz({ records: [], bank, grade: 4, count: 10 });

  it("scoreWeeklyQuiz 計算正確數與已答數", () => {
    const answers: Record<string, number> = {};
    quiz.forEach((question, index) => {
      answers[question.id] = index % 2 === 0 ? question.answer : question.answer + 1;
    });
    const score = scoreWeeklyQuiz(quiz, answers);
    expect(score.total).toBe(10);
    expect(score.answered).toBe(10);
    expect(score.correct).toBe(5);
  });

  it("computeWeeklyRewards 依難度給金幣/經驗", () => {
    expect(goldForDifficulty("基礎")).toBe(6);
    expect(goldForDifficulty("標準")).toBe(12);
    expect(goldForDifficulty("挑戰")).toBe(20);
    expect(expForDifficulty("基礎")).toBe(5);
    expect(expForDifficulty("標準")).toBe(10);
    expect(expForDifficulty("挑戰")).toBe(18);

    const rewards = computeWeeklyRewards(quiz, new Set(quiz.slice(0, 3).map((q) => q.id)));
    const expectedGold = quiz.slice(0, 3).reduce((sum, q) => sum + goldForDifficulty(q.difficulty), 0);
    const expectedExp = quiz.slice(0, 3).reduce((sum, q) => sum + expForDifficulty(q.difficulty), 0);
    expect(rewards).toEqual({ goldEarned: expectedGold, expEarned: expectedExp });
  });
});
