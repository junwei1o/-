import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_ORDER,
  STREAK_TO_LEVEL_DOWN,
  STREAK_TO_LEVEL_UP,
  deriveStreaks,
  difficultyRank,
  pickNextQuestion,
  type ScheduleInput,
} from "./adaptiveScheduler";
import type { CurriculumQuestionRow } from "@/lib/questionBank";

/**
 * 自適應調度器測試。
 *
 * 三道設計約束（每道都有對應案例，且都經失效注入驗證過非虛設）：
 * 1. 有 variantOf → 走家族重練（同概念換外皮）
 * 2. 無 variantOf（真實題庫 83% 的題）→ 必須無聲降級到 knowledge 路徑，
 *    不能回傳 null、不能拋錯（server fallback 題庫根本沒有 variantOf 欄位）
 * 3. 題目池耗盡 → 窮盡後仍要有題可出，永不断流
 */

type Seed = {
  id: string;
  grade?: number;
  subject?: CurriculumQuestionRow["subject"];
  difficulty?: CurriculumQuestionRow["difficulty"];
  knowledge?: string[];
  variantOf?: unknown;
};

function q(seed: Seed): CurriculumQuestionRow {
  return {
    id: seed.id,
    grade: seed.grade ?? 3,
    subject: seed.subject ?? "數學",
    questionType: "選擇題",
    difficulty: seed.difficulty ?? "標準",
    curriculumDomain: "數學領域",
    learningTopic: seed.knowledge?.[0] ?? "單元",
    prompt: `${seed.id} 題幹`,
    options: ["甲", "乙", "丙", "丁"],
    answer: 0,
    explanation: "解.",
    knowledge: seed.knowledge ?? ["分數"],
    ...(seed.variantOf !== undefined ? { variantOf: seed.variantOf } : {}),
  } as CurriculumQuestionRow;
}

/** 固定亂數：0 → 永遠取池子第一題，讓斷言可精確指認 id。 */
const first = () => 0;

function run(bank: CurriculumQuestionRow[], input: Omit<ScheduleInput, "rng">) {
  return pickNextQuestion(bank, { ...input, rng: first });
}

describe("難度序數", () => {
  it("基礎<標準<挑戰，未知難度回退中間值（不拋錯）", () => {
    expect(difficultyRank("基礎")).toBe(0);
    expect(difficultyRank("標準")).toBe(1);
    expect(difficultyRank("挑戰")).toBe(2);
    expect(difficultyRank("不存在" as never)).toBe(1);
    expect(DIFFICULTY_ORDER).toHaveLength(3);
  });
});

describe("有 variantOf：同家族重練", () => {
  const anchor = q({ id: "a1", variantOf: { role: "anchor", kind: "variant", members: ["v1", "v2"], groupSize: 3 } });
  const v1 = q({ id: "v1", variantOf: { role: "variant", kind: "variant", anchor: "a1" } });
  const v2 = q({ id: "v2", variantOf: { role: "variant", kind: "variant", anchor: "a1" } });
  const other = q({ id: "o1", knowledge: ["分數"] });
  const bank = [anchor, v1, v2, other];

  it("答錯 anchor → 推同家族第一個未出的變體", () => {
    const r = run(bank, { justAnswered: anchor, signal: { correct: false }, servedIds: new Set(["a1"]) });
    expect(r.policy).toBe("variant-retry");
    expect(r.question?.id).toBe("v1");
  });

  it("答錯 variant → 兄弟題優先於錨點（錨點可能已消化）", () => {
    const r = run(bank, { justAnswered: v1, signal: { correct: false }, servedIds: new Set(["v1", "a1"]) });
    expect(r.policy).toBe("variant-retry");
    expect(r.question?.id).toBe("v2");
  });

  it("variant 的家族解析含 anchor 與全部兄弟（不是只有 anchor）", () => {
    const r = run(bank, { justAnswered: v1, signal: { correct: false }, servedIds: new Set(["v1"]) });
    expect(r.candidates).toBe(2); // a1 + v2
  });

  it("家族出盡 → 降回同知識點同難度的新題", () => {
    const r = run(bank, {
      justAnswered: anchor,
      signal: { correct: false },
      servedIds: new Set(["a1", "v1", "v2"]),
    });
    expect(r.policy).toBe("same-knowledge-new");
    expect(r.question?.id).toBe("o1");
  });

  it("懸空引用（呼叫端餵髒資料）不崩潰，降級走 knowledge 路徑", () => {
    const broken = q({ id: "b1", variantOf: { role: "variant", kind: "variant", anchor: "不在庫裡" } });
    const r = run([broken, other], { justAnswered: broken, signal: { correct: false }, servedIds: new Set(["b1"]) });
    expect(r.policy).toBe("same-knowledge-new");
    expect(r.question?.id).toBe("o1");
  });
});

describe("無 variantOf 的降級路徑（server fallback 情境）", () => {
  // 關鍵：這個題庫**完全沒有 variantOf 欄位**，模擬 server questionBank 的資料形狀
  const noVariantBank = [
    q({ id: "n1", knowledge: ["分數比較"] }),
    q({ id: "n2", knowledge: ["分數比較"] }),
    q({ id: "n3", knowledge: ["分數比較"], difficulty: "基礎" }),
  ];

  it("答錯無變體題 → 走同知識點新題，而非 variant-retry", () => {
    const r = run(noVariantBank, { justAnswered: noVariantBank[0]!, signal: { correct: false }, servedIds: new Set(["n1"]) });
    expect(r.policy).toBe("same-knowledge-new");
    expect(r.question?.id).toBe("n2");
  });

  it("連錯達標無變體題 → 走降級，仍同知識點優先", () => {
    const r = run(noVariantBank, {
      justAnswered: noVariantBank[0]!,
      signal: { correct: false, knowledgeWrongStreak: STREAK_TO_LEVEL_DOWN - 1 },
      servedIds: new Set(["n1", "n2"]),
    });
    expect(r.policy).toBe("same-knowledge-down");
    expect(r.question?.id).toBe("n3");
  });

  it("連對達標無變體題 → 升級到同知識點更難的題", () => {
    const bank = [
      q({ id: "u1", difficulty: "標準", knowledge: ["倍數"] }),
      q({ id: "u2", difficulty: "挑戰", knowledge: ["倍數"] }),
    ];
    const r = run(bank, {
      justAnswered: bank[0]!,
      signal: { correct: true, knowledgeStreak: STREAK_TO_LEVEL_UP - 1 },
      servedIds: new Set(["u1"]),
    });
    expect(r.policy).toBe("level-up");
    expect(r.question?.id).toBe("u2");
  });
});

describe("連對升級 / 連錯降級門檻", () => {
  const bank = [
    q({ id: "d1", difficulty: "基礎", knowledge: ["小數"] }),
    q({ id: "d2", difficulty: "標準", knowledge: ["小數"] }),
    q({ id: "d3", difficulty: "挑戰", knowledge: ["小數"] }),
    q({ id: "d4", difficulty: "標準", knowledge: ["其他"] }),
  ];

  it("連對未達標（2 題）不升級：平級推進同知識點", () => {
    const r = run(bank, { justAnswered: bank[1]!, signal: { correct: true, knowledgeStreak: 1 }, servedIds: new Set(["d2"]) });
    expect(r.policy).toBe("same-knowledge-new");
  });

  it("連對達標（3 題）升級一級", () => {
    const r = run(bank, {
      justAnswered: bank[1]!,
      signal: { correct: true, knowledgeStreak: STREAK_TO_LEVEL_UP - 1 },
      servedIds: new Set(["d2"]),
    });
    expect(r.policy).toBe("level-up");
    expect(r.question?.difficulty).toBe("挑戰");
  });

  it("最高難度連對達標 → 換新知識點（不原地刷同一點）", () => {
    const r = run(bank, {
      justAnswered: bank[2]!,
      signal: { correct: true, knowledgeStreak: STREAK_TO_LEVEL_UP },
      servedIds: new Set(["d3"]),
    });
    expect(r.policy).toBe("explore-new-topic");
    expect(r.question?.id).toBe("d4");
  });

  it("連錯達標 → 降一級保住成就感", () => {
    const r = run(bank, {
      justAnswered: bank[1]!,
      signal: { correct: false, knowledgeWrongStreak: STREAK_TO_LEVEL_DOWN - 1 },
      servedIds: new Set(["d2", "d3", "d4"]),
    });
    expect(r.policy).toBe("same-knowledge-down");
    expect(r.question?.id).toBe("d1");
  });
});

describe("錯題本優先序", () => {
  it("有到期錯題時優先於任何推薦規則", () => {
    const anchor = q({ id: "a1", variantOf: { role: "anchor", kind: "variant", members: ["v1"] } });
    const v1 = q({ id: "v1", knowledge: ["別點"], variantOf: { role: "variant", kind: "variant", anchor: "a1" } });
    const due = q({ id: "due1", knowledge: ["到期題"] });
    const r = run([anchor, v1, due], {
      justAnswered: anchor,
      signal: { correct: false },
      servedIds: new Set(["a1"]),
      wrongBookIds: new Set(["due1"]),
    });
    expect(r.policy).toBe("wrong-book");
    expect(r.question?.id).toBe("due1");
  });

  it("到期題本局已出過 → 讓位給推薦規則", () => {
    const anchor = q({ id: "a1", variantOf: { role: "anchor", kind: "variant", members: ["v1"] } });
    const v1 = q({ id: "v1", knowledge: ["別點"], variantOf: { role: "variant", kind: "variant", anchor: "a1" } });
    const due = q({ id: "due1", knowledge: ["到期題"] });
    const r = run([anchor, v1, due], {
      justAnswered: anchor,
      signal: { correct: false },
      servedIds: new Set(["a1", "due1"]),
      wrongBookIds: new Set(["due1"]),
    });
    expect(r.policy).toBe("variant-retry");
    expect(r.question?.id).toBe("v1");
  });
});

describe("邊界：不卡死", () => {
  it("該知識點只有一題 → 跨知識點同科目同難度", () => {
    const lone = q({ id: "L1", knowledge: ["独一无二"] });
    const far = q({ id: "F1", knowledge: ["其他概念"] });
    const r = run([lone, far], { justAnswered: lone, signal: { correct: false }, servedIds: new Set(["L1"]) });
    expect(r.question?.id).toBe("F1");
  });

  it("空題庫 → null + no-bank（不拋錯）", () => {
    const r = run([], { justAnswered: q({ id: "x" }), signal: { correct: false }, servedIds: new Set() });
    expect(r.question).toBeNull();
    expect(r.policy).toBe("no-bank");
  });

  it("池子全出盡 → random-fallback 仍從剩餘題出（最後一道不空轉）", () => {
    const a = q({ id: "p1", knowledge: ["甲"] });
    const b = q({ id: "p2", knowledge: ["乙"] });
    const r = run([a, b], { justAnswered: a, signal: { correct: false }, servedIds: new Set(["p1"]) });
    expect(r.question?.id).toBe("p2");
  });

  it("全部出盡 → question 為 null，呼叫端據此收卷（不無限期重覆）", () => {
    const a = q({ id: "p1" });
    const r = run([a], { justAnswered: a, signal: { correct: false }, servedIds: new Set(["p1"]) });
    expect(r.question).toBeNull();
  });

  it("永不回傳已出過的題（30 輪隨機模擬）", () => {
    const bank = Array.from({ length: 30 }, (_, i) => q({ id: `s${i}`, knowledge: [`點${i % 5}`], difficulty: DIFFICULTY_ORDER[i % 3] }));
    const served = new Set<string>();
    let cursor = bank[0]!;
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let step = 0; step < 40; step += 1) {
      const r = pickNextQuestion(bank, {
        justAnswered: cursor,
        signal: { correct: step % 3 !== 0, knowledgeStreak: step % 5, knowledgeWrongStreak: step % 2 },
        servedIds: served,
        rng,
      });
      if (!r.question) break; // 池子耗盡是合法終止
      expect(served.has(r.question.id)).toBe(false);
      served.add(r.question.id);
      cursor = r.question;
    }
    expect(served.size).toBeGreaterThan(20);
  });
});

describe("真實題庫整合（鎖住 build-runtime-bank 的清洗與降級）", () => {
  const raw = JSON.parse(
    readFileSync(new URL("../../../data/runtime_bank_elementary.json", import.meta.url), "utf8"),
  ) as { questions: unknown[] };
  const bank = raw.questions as CurriculumQuestionRow[];
  const withVariant = bank.filter((item) => (item as { variantOf?: unknown }).variantOf);
  const withoutVariant = bank.filter((item) => !(item as { variantOf?: unknown }).variantOf);

  it("variantOf 確實存在於前端 chunk（白名單迴歸鎖）", () => {
    expect(withVariant.length).toBeGreaterThan(400);
    const anchorLike = withVariant.filter((item) => (item as { variantOf: { role: string } }).variantOf.role === "anchor");
    expect(anchorLike.length).toBeGreaterThan(0);
  });

  it("引用零懸空（build 階段清洗的回歸鎖）", () => {
    const ids = new Set(bank.map((item) => item.id));
    const brokenVariant = withVariant.filter((item) => {
      const marker = (item as { variantOf: { role: string; anchor?: string } }).variantOf;
      return marker.role === "variant" && !ids.has(marker.anchor!);
    });
    const brokenMembers = withVariant.flatMap((item) => {
      const marker = (item as { variantOf: { role: string; members?: string[] } }).variantOf;
      return marker.role === "anchor" ? (marker.members ?? []).filter((m) => !ids.has(m)) : [];
    });
    expect(brokenVariant).toEqual([]);
    expect(brokenMembers).toEqual([]);
  });

  it("無 variantOf 的題（多數）也能被調度：每題都有下一題", () => {
    expect(withoutVariant.length).toBeGreaterThan(1000);
    const sample = withoutVariant.slice(0, 50);
    for (const item of sample) {
      const r = pickNextQuestion(bank, {
        justAnswered: item,
        signal: { correct: false },
        servedIds: new Set([item.id]),
        rng: first,
      });
      expect(r.question).not.toBeNull();
      expect(r.question!.id).not.toBe(item.id);
      expect((item as { variantOf?: unknown }).variantOf).toBeUndefined();
    }
  });

  it("有 variantOf 的題在真實庫中真的命中 variant-retry", () => {
    const anchorItem = withVariant.find(
      (item) => (item as { variantOf: { role: string; members?: string[] } }).variantOf.role === "anchor" &&
        ((item as { variantOf: { members: string[] } }).variantOf.members.length ?? 0) > 0,
    )!;
    const r = pickNextQuestion(bank, {
      justAnswered: anchorItem,
      signal: { correct: false },
      servedIds: new Set([anchorItem.id]),
      rng: first,
    });
    expect(r.policy).toBe("variant-retry");
    expect((r.question as { variantOf?: unknown }).variantOf).toBeDefined();
  });

  it("知識點在真實題庫中永遠有可出的題（3175 題規模）", () => {
    const served = new Set<string>();
    let cursor = bank[0]!;
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let out = 0;
    for (let step = 0; step < 200; step += 1) {
      const r = pickNextQuestion(bank, {
        justAnswered: cursor,
        signal: { correct: step % 2 === 0, knowledgeStreak: step % 4, knowledgeWrongStreak: step % 3 },
        servedIds: served,
        rng,
      });
      if (!r.question) break;
      served.add(r.question.id);
      cursor = r.question;
      out += 1;
    }
    expect(out).toBeGreaterThanOrEqual(200); // 3175 題的池子撐得住 200 題不重複
  });
});

describe("deriveStreaks（呼叫端輔助）", () => {
  const attempts = (list: [string, boolean][]) =>
    list.map(([questionId, correct]) => ({ questionId, correct, knowledge: ["分數"] }));

  it("本題已先 record → 跳過尾項後從前面數，不把本題算進連擊", () => {
    // 時間序：a✓ b✓ c✗(本題)。pop 掉本題後 [a✓,b✓] 全對 → streak 2。
    const r = deriveStreaks(attempts([["a", true], ["b", true], ["c", false]]), "c", ["分數"]);
    expect(r).toEqual({ knowledgeStreak: 2, knowledgeWrongStreak: 0 });
  });

  it("反向掃描遇到不同結果即中斷（不跨越錯題數對）", () => {
    // 時間序：a✓ b✗ c✓ d✓(本題)。pop 掉 d 後 [a,b,c]：c✓=1 → b✗ 時 right 已>0 → 停。
    const r = deriveStreaks(attempts([["a", true], ["b", false], ["c", true], ["d", true]]), "d", ["分數"]);
    expect(r.knowledgeStreak).toBe(1);
    expect(r.knowledgeWrongStreak).toBe(0);
  });

  it("跨知識點的紀錄不併入（只數同概念連擊）", () => {
    const mixed = [
      { questionId: "x", correct: true, knowledge: ["其他"] },
      { questionId: "y", correct: true, knowledge: ["分數"] },
    ];
    expect(deriveStreaks(mixed, "z", ["分數"]).knowledgeStreak).toBe(1);
  });

  it("本題舊嘗試之後的更舊紀錄不併入——鎖住 pop 語意（filter 版會高估）", () => {
    // 時間序：b✓(本輪前) a✓(上一輪) a✗(本題剛答)。
    // pop 版：跳過尾項後看到「更早的 a」→ 判定跨輪邊界 → 停 → 0。
    // 舊 filter 版：刪掉**所有** a → 只剩 [b] → 誤得 1（把上一輪之前的紀錄
    // 當成還在同輪連擊，跨越了本題的舊嘗試邊界）。
    const r = deriveStreaks(attempts([["b", true], ["a", true], ["a", false]]), "a", ["分數"]);
    expect(r.knowledgeStreak).toBe(0);
    expect(r.knowledgeWrongStreak).toBe(0);
  });

  it("無紀錄 → 兩個 streak 都是 0", () => {
    expect(deriveStreaks([], "a", ["分數"])).toEqual({ knowledgeStreak: 0, knowledgeWrongStreak: 0 });
  });
});
