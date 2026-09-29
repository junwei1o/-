import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import {
  buildExamSummary,
  collectWeakTopics,
  notifyExamCompletion,
  sendLinePush,
  sendLinePushWithRetry,
  shouldNotify,
  type ExamNotifyInput,
} from "./lineNotify";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("./db", () => ({
  getCloudSave: vi.fn(async () => null),
}));

const summaryBase: ExamNotifyInput = {
  studentName: "小晴",
  subject: "自由練習",
  totalQuestions: 10,
  correctCount: 8,
  detail: {
    scope: "自由練習",
    topics: [
      { subject: "數學", topic: "分數", correct: false },
      { subject: "數學", topic: "分數", correct: false },
      { subject: "數學", topic: "閱讀理解", correct: false },
      { subject: "數學", topic: "分數", correct: true },
    ],
  },
  sessionKey: "exam-1",
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => "" });
  vi.stubGlobal("fetch", fetchMock);
  ENV.lineChannelAccessToken = "";
  ENV.lineChannelSecret = "";
});

describe("buildExamSummary 訊息組裝", () => {
  it("含學生、卷種、分數與薄弱點（督學台數據精簡版）", () => {
    const text = buildExamSummary(summaryBase);
    expect(text).toContain("小晴");
    expect(text).toContain("自由練習");
    expect(text).toContain("10 題");
    expect(text).toContain("答對 8 題（正確率 80%）");
    expect(text).toContain("分數（錯 2）");
    expect(text).toContain("閱讀理解（錯 1）");
    expect(text).toContain("督學台");
  });

  it("全對時顯示鼓勵語而不是薄弱點", () => {
    const text = buildExamSummary({
      ...summaryBase,
      correctCount: 10,
      detail: { scope: "週測", topics: [{ subject: "數學", topic: "分數", correct: true }] },
    });
    expect(text).toContain("全對");
    expect(text).not.toContain("薄弱點");
  });

  it("卷種標籤取自 detail.scope（週測），缺省用 subject", () => {
    const weekly = buildExamSummary({ ...summaryBase, detail: { scope: "週測", topics: [] } });
    expect(weekly).toContain("週測");
    const plain = buildExamSummary({ ...summaryBase, detail: null });
    expect(plain).toContain("自由練習");
  });

  it("三軸欄位：試卷時間、完成時間、名次（有才顯示）", () => {
    const text = buildExamSummary({
      ...summaryBase,
      detail: { scope: "三軸混編試卷", topics: [] },
      durationSec: 65,
      finishedAt: new Date(2026, 8, 28, 15, 4, 0).getTime(),
      rank: 3,
    });
    expect(text).toContain("試卷時間 01:05");
    expect(text).toContain("2026/09/28 15:04");
    expect(text).toContain("目前第 3 名");
  });

  it("三軸欄位缺省時不顯示對應行", () => {
    const text = buildExamSummary({ ...summaryBase, detail: { scope: "三軸混編試卷", topics: [] } });
    expect(text).not.toContain("試卷時間");
    expect(text).not.toContain("完成時間");
    expect(text).not.toContain("目前第");
  });
});

describe("collectWeakTopics 薄弱點聚合", () => {
  it("依答錯次數降冪、只取前 3、全對的不列入", () => {
    const topics = collectWeakTopics({
      topics: [
        { subject: "數學", topic: "甲", correct: false },
        { subject: "數學", topic: "甲", correct: false },
        { subject: "國語", topic: "乙", correct: false },
        { subject: "自然", topic: "丙", correct: false },
        { subject: "自然", topic: "丙", correct: false },
        { subject: "社會", topic: "丁", correct: false },
        { subject: "數學", topic: "戊", correct: true },
      ],
    });
    expect(topics).toEqual([
      { subject: "數學", topic: "甲", wrong: 2 },
      { subject: "自然", topic: "丙", wrong: 2 },
      { subject: "國語", topic: "乙", wrong: 1 },
    ]);
  });
});

describe("shouldNotify 去重", () => {
  it("同一 sessionKey 5 分鐘內只推一次", () => {
    expect(shouldNotify("k1", 1_000_000)).toBe(true);
    expect(shouldNotify("k1", 1_000_001)).toBe(false);
    expect(shouldNotify("k1", 1_000_000 + 5 * 60_000 + 1)).toBe(true);
    expect(shouldNotify(null, 1_000_000)).toBe(true);
  });
});

describe("sendLinePush 發送", () => {
  it("POST 到 LINE push API 並帶 Bearer 與訊息", async () => {
    const result = await sendLinePush("token-1", { recipientType: "user", recipientId: "U123", updatedAt: 0 }, "測試");
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.line.me/v2/bot/message/push");
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer token-1");
    const body = JSON.parse(String(options.body));
    expect(body.to).toBe("U123");
    expect(body.messages[0].text).toBe("測試");
  });

  it("LINE 回非 2xx 時回報 reason 而不拋錯", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => "invalid token" });
    const result = await sendLinePush("bad", { recipientType: "user", recipientId: "U1", updatedAt: 0 }, "x");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("401");
  });

  it("fetch 拋錯時回報 reason 而不拋錯", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const result = await sendLinePush("t", { recipientType: "group", recipientId: "G1", updatedAt: 0 }, "x");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("network down");
  });
});

describe("sendLinePushWithRetry 指數退避重試", () => {
  it("成功時只送一次", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const result = await sendLinePushWithRetry(
      "t",
      { recipientType: "user", recipientId: "U1", updatedAt: 0 },
      "x",
      { sleepMs: async () => {} },
    );
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("429 先失敗後成功：重試並最終成功", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 429, text: async () => "rate limited" })
      .mockResolvedValueOnce({ ok: true });
    const result = await sendLinePushWithRetry(
      "t",
      { recipientType: "user", recipientId: "U1", updatedAt: 0 },
      "x",
      { sleepMs: async () => {} },
    );
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it("401 不重試（憑證錯重送也不會好）", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => "invalid token" });
    const result = await sendLinePushWithRetry(
      "t",
      { recipientType: "user", recipientId: "U1", updatedAt: 0 },
      "x",
      { sleepMs: async () => {} },
    );
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("連續 5xx 用完 3 次重試後回報", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => "boom" });
    const result = await sendLinePushWithRetry(
      "t",
      { recipientType: "user", recipientId: "U1", updatedAt: 0 },
      "x",
      { sleepMs: async () => {} },
    );
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("notifyExamCompletion 總入口", () => {
  it("金鑰未設定時靜默跳過（不 fetch）", async () => {
    const result = await notifyExamCompletion(summaryBase);
    expect(result.notified).toBe(false);
    expect(result.reason).toBe("line-token-not-set");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("未綁定接收對象時跳過", async () => {
    ENV.lineChannelAccessToken = "token-1";
    const { getCloudSave } = await import("./db");
    vi.mocked(getCloudSave).mockResolvedValueOnce(null);
    const result = await notifyExamCompletion(summaryBase);
    expect(result.notified).toBe(false);
    expect(result.reason).toBe("line-recipient-not-bound");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("金鑰＋綁定齊全時送出訊息", async () => {
    ENV.lineChannelAccessToken = "token-1";
    const { getCloudSave } = await import("./db");
    vi.mocked(getCloudSave).mockResolvedValueOnce({
      name: "__line_recipient",
      payload: { recipientType: "user", recipientId: "U123", updatedAt: 1 },
      coins: 0,
      totalAnswers: 0,
      badges: 0,
    } as never);
    const result = await notifyExamCompletion({ ...summaryBase, sessionKey: "exam-2" });
    expect(result.notified).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
