/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __setTargetedPracticeItemsForTest,
  createWrongReviewReplacement,
  ensureTargetedPracticeLoaded,
  getTargetedPracticeItems,
  hasLoadedTargetedPractice,
  nextVariantIndex,
  readSelfReportedReason,
  rememberSelfReportedReason,
  toPaperQuestion,
  type TargetedPracticeItem,
} from "./targetedPractice";
import type { PaperQuestion } from "./paperExam";

const question = (over: Partial<PaperQuestion> = {}): PaperQuestion => ({
  id: "q1",
  grade: 4,
  subject: "數學",
  difficulty: "標準",
  learningTopic: "分數加減",
  prompt: "小明有 18 顆蘋果，吃掉了 7 顆，現在還有幾顆？",
  options: ["11", "25", "12", "10"],
  answer: 0,
  explanation: "把原本的數量減掉吃掉的数量。",
  ...over,
});

const item = (over: Partial<TargetedPracticeItem> = {}): TargetedPracticeItem => ({
  id: "t001",
  subject: "數學",
  grade: 4,
  difficulty: "標準",
  learningTopic: "分數加減",
  prompt: "小華有 24 顆彈珠，送給同學 9 顆，還剩下幾顆？",
  options: ["15", "33", "16", "14"],
  answer: 0,
  explanation: "24 - 9 = 15。",
  variantOf: null,
  ...over,
});

beforeEach(() => {
  window.localStorage.clear();
  __setTargetedPracticeItemsForTest(null);
});

afterEach(() => {
  window.localStorage.clear();
  __setTargetedPracticeItemsForTest(null);
});

describe("挑題優先順序", () => {
  it("第 1 層：有明確標記為該題變體的備用題時優先使用", () => {
    __setTargetedPracticeItemsForTest([
      item({ id: "t002", variantOf: "q1", prompt: "專為這題產生的變體" }),
      item({ id: "t003", variantOf: null, prompt: "同知識點的其他替補題" }),
    ]);
    const replace = createWrongReviewReplacement([question()]);
    const picked = replace({ source: question(), usedIds: new Set() });
    expect(picked?.id).toBe("t002");
  });

  it("第 2 層：沒有精確變體時，取同知識點且同年級的替補題", () => {
    __setTargetedPracticeItemsForTest([
      item({ id: "t010", grade: 5, learningTopic: "分數加減", variantOf: null }),
      item({ id: "t011", grade: 4, learningTopic: "分數加減", variantOf: null }),
    ]);
    const replace = createWrongReviewReplacement([question()]);
    expect(replace({ source: question(), usedIds: new Set() })?.id).toBe("t011");
  });

  it("第 2 層：同知識點只有其他年級時仍然可用（不要退回同題）", () => {
    __setTargetedPracticeItemsForTest([item({ id: "t020", grade: 5, variantOf: null })]);
    const replace = createWrongReviewReplacement([question()]);
    expect(replace({ source: question(), usedIds: new Set() })?.id).toBe("t020");
  });

  it("第 3 層：備用題庫沒有可用題時，改用執行期變體（同題型換數字）", () => {
    __setTargetedPracticeItemsForTest([]);
    const replace = createWrongReviewReplacement([question()]);
    const picked = replace({ source: question(), usedIds: new Set() });
    expect(picked?.id).toMatch(/^q1#v\d+$/);
    expect(picked?.learningTopic).toBe("分數加減");
    expect(picked?.difficulty).toBe("標準");
  });

  it("第 4 層：連變體都不可行時，輪替同知識點的其他正式題", () => {
    __setTargetedPracticeItemsForTest([]);
    // 這題不是純減法也不是整除除法（三個數字、含「平均」語意）→ 不可變體
    const source = question({
      id: "q900",
      prompt: "甲班有 5 人、乙班有 7 人、丙班有 9 人，三班平均幾人？",
      options: ["7", "21", "6", "8"],
      answer: 0,
    });
    const sibling = question({ id: "q901", prompt: "另一個同知識點的題目" });
    const replace = createWrongReviewReplacement([source, sibling]);
    const picked = replace({ source, usedIds: new Set() });
    expect(picked?.id).toBe("q901");
  });

  it("第 5 層：都沒有可用的替代時回 null（由呼叫端保留原題）", () => {
    __setTargetedPracticeItemsForTest([]);
    const source = question({
      id: "q910",
      prompt: "下列何者是質數？",
      options: ["2", "4", "6", "9"],
      answer: 0,
    });
    const replace = createWrongReviewReplacement([source]);
    expect(replace({ source, usedIds: new Set() })).toBeNull();
  });
});

describe("自評「記不起來」時刻意出原題", () => {
  it("memory 一律回 null，即使備用題庫有現成變體", () => {
    __setTargetedPracticeItemsForTest([item({ id: "t030", variantOf: "q1" })]);
    rememberSelfReportedReason("q1", "memory");
    const replace = createWrongReviewReplacement([question()]);
    expect(replace({ source: question(), usedIds: new Set() })).toBeNull();
  });

  it("concept / careless 仍要換題（換數字才驗得出真的懂）", () => {
    __setTargetedPracticeItemsForTest([item({ id: "t031", variantOf: "q1" })]);
    rememberSelfReportedReason("q1", "concept");
    const replace = createWrongReviewReplacement([question()]);
    expect(replace({ source: question(), usedIds: new Set() })?.id).toBe("t031");
  });

  it("沒有自評紀錄時視為需要換題（不可讀自適應存檔的預設 memory）", () => {
    __setTargetedPracticeItemsForTest([item({ id: "t032", variantOf: "q1" })]);
    expect(readSelfReportedReason("q1")).toBeUndefined();
    const replace = createWrongReviewReplacement([question()]);
    expect(replace({ source: question(), usedIds: new Set() })?.id).toBe("t032");
  });
});

describe("已用過的題目不會重複出", () => {
  it("精確變體用過就換下一個可用來源", () => {
    __setTargetedPracticeItemsForTest([
      item({ id: "t040", variantOf: "q1" }),
      item({ id: "t041", learningTopic: "分數加減", variantOf: null }),
    ]);
    const replace = createWrongReviewReplacement([question()]);
    expect(replace({ source: question(), usedIds: new Set(["t040"]) })?.id).toBe("t041");
  });

  it("原題本身不會被當成替代題（避免換了個寂寞）", () => {
    __setTargetedPracticeItemsForTest([]);
    const source = question({ id: "q950", prompt: "下列何者是質數？", options: ["2", "4", "6", "9"], answer: 0 });
    const replace = createWrongReviewReplacement([source]);
    expect(replace({ source, usedIds: new Set() })).toBeNull();
  });

  it("輪替時也會跳過已用過的兄弟題", () => {
    __setTargetedPracticeItemsForTest([]);
    const source = question({ id: "q960", prompt: "下列何者是質數？", options: ["2", "4", "6", "9"], answer: 0 });
    const first = question({ id: "q961", prompt: "同知識點第一題" });
    const second = question({ id: "q962", prompt: "同知識點第二題" });
    const replace = createWrongReviewReplacement([source, first, second]);
    expect(replace({ source, usedIds: new Set() })?.id).toBe("q961");
    expect(replace({ source, usedIds: new Set(["q961"]) })?.id).toBe("q962");
  });
});

describe("載入備用題庫", () => {
  it("尚未載入時回空陣列（呼叫端據此退回輪替，不會壞掉）", () => {
    expect(hasLoadedTargetedPractice()).toBe(false);
    expect(getTargetedPracticeItems()).toEqual([]);
  });

  it("後端不可用時不拋錯，且保留可重試狀態", async () => {
    // 測試環境沒有 tRPC Provider／伺服器，這裡等於模擬連線失敗。
    await expect(ensureTargetedPracticeLoaded(50)).resolves.toBeUndefined();
    expect(getTargetedPracticeItems()).toEqual([]);
  });
});

describe("題目格式轉換與變體序號", () => {
  it("toPaperQuestion 保留四個選項與正確項索引", () => {
    const converted = toPaperQuestion(item({ id: "t050" }));
    expect(converted.options).toHaveLength(4);
    expect(new Set(converted.options).size).toBe(4);
    expect(converted.answer).toBe(0);
    expect(converted.subject).toBe("數學");
    expect(converted.learningTopic).toBe("分數加減");
  });

  it("同一個知識點每次重練拿到不同序號（換一組數字）", () => {
    const first = nextVariantIndex("q1");
    const second = nextVariantIndex("q1");
    expect(first).toBe(0);
    expect(second).toBe(1);
    // 不同題目各自獨立計數
    expect(nextVariantIndex("q2")).toBe(0);
  });
});
