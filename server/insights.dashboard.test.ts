import { describe, expect, it, vi } from "vitest";

/**
 * insights.dashboard 掌握度口徑回歸鎖（2026-10-26 Phase 1）。
 *
 * 三條硬規則（皆有用例，皆經失效注入驗證）：
 * 1. 題目數加權：答 20 對 18 → 90%，不是「知識點平均」
 * 2. 樣本 < 5 的科目回 null（前端顯示 —），**絕不顯示 0%**
 * 3. 薄弱點取正確率最低 3 個，且樣本 >= 2 才入榜（單題失手不算薄弱）
 */

type FakeRecord = {
  id: number;
  name: string;
  subject: string;
  grade: number | null;
  difficulty: string | null;
  totalQuestions: number;
  correctCount: number;
  detail: unknown;
  sessionKey: string | null;
  durationSec: number | null;
  createdAt: Date;
};

let fakeRecords: FakeRecord[] = [];

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listExamRecords: vi.fn(async () => fakeRecords),
  };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * 這些案例測的是「有雲端紀錄時」的口徑，必須先給 DATABASE_URL，
 * 否則 router 會走「無 DB 優雅降級」分支（全部 null）——那是另一條路徑，
 * 由下方的 dedicated 案例單獨覆蓋。設定在 import 之後即可（router 執行期才讀）。
 */
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test";

const context: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

const caller = () => appRouter.createCaller(context);

/** 造一筆試卷紀錄；topics 是逐題明細（真實格式見 PaperExam.tsx 的 topicBreakdown）。 */
function makeRecord(
  over: Partial<FakeRecord> & { topics?: Array<{ subject: string; topic: string; correct: boolean }> },
): FakeRecord {
  const topics = over.topics ?? [];
  const correctCount = topics.length
    ? topics.filter((t) => t.correct).length
    : (over.correctCount ?? 0);
  const totalQuestions = topics.length ? topics.length : (over.totalQuestions ?? 1);
  return {
    id: over.id ?? Math.floor(Math.random() * 100000),
    name: over.name ?? "小明",
    subject: over.subject ?? "數學",
    grade: over.grade === undefined ? 4 : over.grade,
    difficulty: over.difficulty === undefined ? "標準" : over.difficulty,
    totalQuestions,
    correctCount,
    detail: { scope: over.subject ?? "數學", topics },
    sessionKey: null,
    durationSec: 60,
    createdAt: over.createdAt ?? new Date("2026-10-26T00:00:00Z"),
  };
}

describe("insights.dashboard 掌握度口徑", () => {
  it("題目數加權：20 題對 18 題 → 90%", async () => {
    fakeRecords = [
      makeRecord({
        topics: Array.from({ length: 20 }, (_, i) => ({ subject: "數學", topic: "分數", correct: i < 18 })),
      }),
    ];
    const res = await caller().insights.dashboard({ name: "小明" });
    const math = res.subjects.find((s) => s.subject === "數學")!;
    expect(math.rate).toBe(90);
    expect(math.answered).toBe(20);
    expect(math.correct).toBe(18);
  });

  it("樣本 < 5 的科目回 null（不是 0%）", async () => {
    fakeRecords = [
      makeRecord({
        topics: [
          { subject: "數學", topic: "分數", correct: true },
          { subject: "數學", topic: "分數", correct: true },
        ],
      }),
    ];
    const res = await caller().insights.dashboard({ name: "小明" });
    const math = res.subjects.find((s) => s.subject === "數學")!;
    expect(math.answered).toBe(2);
    expect(math.rate).toBeNull(); // 關鍵：不是 0
    // 完全沒碰過的科目也是 null
    const social = res.subjects.find((s) => s.subject === "社會")!;
    expect(social.answered).toBe(0);
    expect(social.rate).toBeNull();
  });

  it("恰好 5 題時開始顯示百分比（門檻邊界）", async () => {
    fakeRecords = [
      makeRecord({
        // ⚠️ subject 必須與 topics 內的 subject 一致：整卷的 subject 決定
        // bySubject 聚合、topics 內的 subject 不參與聚合（只取 topic）。
        // 兩者不一致時題數會記到「數學」而知識點記到「自然」，測試會誤判。
        subject: "自然",
        topics: Array.from({ length: 5 }, (_, i) => ({ subject: "自然", topic: "光合作用", correct: i < 4 })),
      }),
    ];
    const res = await caller().insights.dashboard({ name: "小明" });
    const science = res.subjects.find((s) => s.subject === "自然")!;
    expect(science.answered).toBe(5);
    expect(science.rate).toBe(80);
  });

  it("薄弱點：取正確率最低的，最多 3 個，且單題不計入", async () => {
    fakeRecords = [
      makeRecord({
        topics: [
          // 分數比較：4 題對 1 → 25%（最弱）
          { subject: "數學", topic: "分數比較", correct: true },
          { subject: "數學", topic: "分數比較", correct: false },
          { subject: "數學", topic: "分數比較", correct: false },
          { subject: "數學", topic: "分數比較", correct: false },
          // 單位換算：3 題對 1 → 33%
          { subject: "數學", topic: "單位換算", correct: true },
          { subject: "數學", topic: "單位換算", correct: false },
          { subject: "數學", topic: "單位換算", correct: false },
          // 因數：3 題對 2 → 67%
          { subject: "數學", topic: "因數", correct: true },
          { subject: "數學", topic: "因數", correct: true },
          { subject: "數學", topic: "因數", correct: false },
          // 單題全錯：不該入榜（樣本 < 2）
          { subject: "數學", topic: "面積", correct: false },
        ],
      }),
    ];
    const res = await caller().insights.dashboard({ name: "小明" });
    expect(res.weakTopics.map((w) => w.topic)).toEqual(["分數比較", "單位換算", "因數"]);
    expect(res.weakTopics[0]!.rate).toBe(25);
    expect(res.weakTopics.map((w) => w.topic)).not.toContain("面積");
  });

  it("沒有任何紀錄 → totalQuestions 0、全科目 null、recent null", async () => {
    fakeRecords = [];
    const res = await caller().insights.dashboard({ name: "小明" });
    expect(res.totalQuestions).toBe(0);
    expect(res.subjects.every((s) => s.rate === null)).toBe(true);
    expect(res.weakTopics).toEqual([]);
    expect(res.recent).toBeNull();
  });

  it("最近一筆帶出知識點清單（供「繼續上次」顯示）", async () => {
    fakeRecords = [
      makeRecord({
        subject: "國語",
        grade: 5,
        createdAt: new Date("2026-10-26T10:00:00Z"),
        topics: [
          { subject: "國語", topic: "成語運用", correct: true },
          { subject: "國語", topic: "標點符號", correct: false },
          { subject: "國語", topic: "成語運用", correct: true },
        ],
      }),
    ];
    const res = await caller().insights.dashboard({ name: "小明" });
    expect(res.recent?.subject).toBe("國語");
    expect(res.recent?.grade).toBe(5);
    expect(res.recent?.topics).toEqual(["成語運用", "標點符號"]);
    expect(res.recent?.topics.length).toBeLessThanOrEqual(4);
  });

  it("綜合課綱不進薄弱點排名（跨科題無法歸因單一知識點）", async () => {
    fakeRecords = [
      makeRecord({
        subject: "綜合課綱",
        topics: [
          { subject: "綜合課綱", topic: "跨科整合", correct: false },
          { subject: "綜合課綱", topic: "跨科整合", correct: false },
        ],
      }),
    ];
    const res = await caller().insights.dashboard({ name: "小明" });
    expect(res.weakTopics.map((w) => w.topic)).not.toContain("跨科整合");
  });
});

describe("insights.examDetail 單卷洞察", () => {
  it("找到紀錄時回傳知識點與錯誤型態摘要", async () => {
    fakeRecords = [
      makeRecord({
        id: 42,
        subject: "數學",
        topics: [
          { subject: "數學", topic: "分數比較", correct: false },
          { subject: "數學", topic: "分數比較", correct: true },
        ],
      }),
    ];
    const res = await caller().insights.examDetail({ name: "小明", recordId: 42 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.recordId).toBe(42);
      expect(res.subject).toBe("數學");
      expect(res.totalQuestions).toBe(2);
    }
  });

  it("紀錄不存在或屬於別人時回 notFound（不洩漏他人資料）", async () => {
    fakeRecords = [makeRecord({ id: 7, name: "小明" })];
    const res = await caller().insights.examDetail({ name: "小明", recordId: 999 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("notFound");
  });
});

describe("無資料庫時的優雅降級（2026-10-26）", () => {
  it("沒有 DATABASE_URL → 回空狀態而非 500", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const res = await caller().insights.dashboard({ name: "小明" });
      expect(res.ok).toBe(true);
      expect(res.cloudAvailable).toBe(false);
      expect(res.totalQuestions).toBe(0);
      expect(res.subjects.every((s) => s.rate === null)).toBe(true);
      expect(res.recent).toBeNull();
    } finally {
      process.env.DATABASE_URL = saved;
    }
  });

  it("有 DATABASE_URL → cloudAvailable 為 true（兩條路徑可區分）", async () => {
    const res = await caller().insights.dashboard({ name: "小明" });
    expect(res.cloudAvailable).toBe(true);
  });
});
