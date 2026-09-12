/**
 * LINE Messaging API 通知：學生完成試卷後推 LINE 給老師。
 *
 * LINE Notify 已於 2025/3/31 全面停用，改用官方 Messaging API：
 * - 金鑰（LINE_CHANNEL_ACCESS_TOKEN / LINE_CHANNEL_SECRET）放 Render 環境變數，
 *   未設定時整個功能休眠、不影響其他服務。
 * - 接收對象由 webhook（/api/line/webhook）自動綁定：老師把機器人加為好友（個人）
 *   或建群後傳任一訊息（群組），最後一次發言的聊天室即接收處，兩種都支援。
 * - 訊息內容 = 督學台數據的精簡版：學生、卷種、分數、最多 3 個薄弱知識點。
 *
 * 原則：通知失敗只記 log，絕不讓推播拖垮作答流程（fire-and-forget）。
 */

import { ENV } from "./_core/env";
import { getCloudSave } from "./db";

export const LINE_RECIPIENT_KEY = "__line_recipient";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
/** 督學台深連結（Render 正式部署位址；訊息裡給老師一鍵跳轉）。 */
const TEACHER_DASHBOARD_URL = "https://xue-gr3a.onrender.com/teacher";

export type LineRecipientBinding = {
  recipientType: "user" | "group";
  recipientId: string;
  updatedAt: number;
};

export type ExamNotifyInput = {
  studentName: string;
  subject: string;
  totalQuestions: number;
  correctCount: number;
  detail: unknown;
  /** 同一份試卷的識別碼（去重用）；沒帶就不去重。 */
  sessionKey: string | null;
};

type TopicRow = { subject?: string; topic?: string; correct?: boolean };

/** 讀出 detail 的逐題明細（格式不對時回空陣列）。 */
export function readNotifyTopics(detail: unknown): TopicRow[] {
  const parsed = detail as { topics?: unknown } | null;
  if (!parsed || !Array.isArray(parsed.topics)) return [];
  return (parsed.topics as TopicRow[]).filter(
    (row) => row && typeof row === "object" && typeof row.topic === "string",
  );
}

/** 督學台數據精簡版：最多 3 個薄弱知識點（答錯次數降冪）。 */
export function collectWeakTopics(detail: unknown): Array<{ subject: string; topic: string; wrong: number }> {
  const stats = new Map<string, { subject: string; topic: string; wrong: number }>();
  for (const row of readNotifyTopics(detail)) {
    const topic = (row.topic ?? "").trim();
    if (!topic) continue;
    const subject = (row.subject ?? "").trim();
    const key = `${subject}|${topic}`;
    const current = stats.get(key) ?? { subject, topic, wrong: 0 };
    if (row.correct === false) current.wrong += 1;
    stats.set(key, current);
  }
  return Array.from(stats.values())
    .filter((item) => item.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3);
}

/** 卷種標籤：週測/自由練習/錯題魔王/限時挑戰…取自 detail.scope，缺省用 subject。 */
export function examLabel(input: Pick<ExamNotifyInput, "subject" | "detail">): string {
  const parsed = input.detail as { scope?: unknown } | null;
  const scope = parsed && typeof parsed.scope === "string" ? parsed.scope.trim() : "";
  return scope || input.subject || "試卷";
}

/** 組裝推播訊息（純函式，可測）。 */
export function buildExamSummary(input: ExamNotifyInput): string {
  const label = examLabel(input);
  const rate = input.totalQuestions > 0
    ? Math.round((input.correctCount / input.totalQuestions) * 100)
    : 0;
  const weakTopics = collectWeakTopics(input.detail);

  const lines = [
    "🧭 寶島探險家學習通知",
    `${input.studentName} 完成「${label}」${input.totalQuestions} 題`,
    `答對 ${input.correctCount} 題（正確率 ${rate}%）`,
  ];
  if (weakTopics.length > 0) {
    lines.push(`⚠️ 薄弱點：${weakTopics.map((item) => `${item.topic}（錯 ${item.wrong}）`).join("・")}`);
  } else {
    lines.push("🎉 本輪全對，表現超棒！");
  }
  lines.push(`詳情見督學台：${TEACHER_DASHBOARD_URL}`);
  return lines.join("\n");
}

/** 發送推播（fetch 可 mock；任何失敗都回報 reason 而不拋錯）。 */
export async function sendLinePush(
  token: string,
  recipient: LineRecipientBinding,
  text: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const response = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: recipient.recipientId,
        messages: [{ type: "text", text }],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      return { ok: false, reason: `LINE API ${response.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/** 同一 sessionKey 5 分鐘內只推一次（學生補標錯誤原因會重複上報同一份卷）。 */
const recentlyNotified = new Map<string, number>();
const DEDUPE_MS = 5 * 60_000;

export function shouldNotify(sessionKey: string | null, now = Date.now()): boolean {
  if (!sessionKey) return true;
  const last = recentlyNotified.get(sessionKey) ?? 0;
  if (now - last < DEDUPE_MS) return false;
  recentlyNotified.set(sessionKey, now);
  return true;
}

/** 讀接收對象（未綁定回傳 null）。 */
export async function getLineRecipient(): Promise<LineRecipientBinding | null> {
  const row = await getCloudSave(LINE_RECIPIENT_KEY);
  const payload = row?.payload as Partial<LineRecipientBinding> | null;
  if (!payload || typeof payload.recipientId !== "string" || !payload.recipientId) return null;
  return {
    recipientType: payload.recipientType === "group" ? "group" : "user",
    recipientId: payload.recipientId,
    updatedAt: typeof payload.updatedAt === "number" ? payload.updatedAt : Date.now(),
  };
}

/**
 * 試卷完成通知總入口：金鑰或綁定缺一即靜默跳過，推播失敗只記 log。
 * 回傳 { notified: true } 表示已送達 LINE。
 */
export async function notifyExamCompletion(input: ExamNotifyInput): Promise<{ notified: boolean; reason?: string }> {
  const token = ENV.lineChannelAccessToken.trim();
  if (!token) return { notified: false, reason: "line-token-not-set" };
  if (!shouldNotify(input.sessionKey)) return { notified: false, reason: "dedupe" };
  const recipient = await getLineRecipient();
  if (!recipient) return { notified: false, reason: "line-recipient-not-bound" };
  const result = await sendLinePush(token, recipient, buildExamSummary(input));
  if (!result.ok) {
    console.error(`[lineNotify] 推播失敗: ${result.reason ?? "unknown"}`);
  }
  return { notified: result.ok, reason: result.reason };
}
