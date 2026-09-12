/**
 * LINE Messaging API webhook：接收 LINE 事件、自動綁定「通知要送到哪個聊天室」。
 *
 * 綁定規則（兩種都支援）：
 * - 老師把機器人加為好友（follow 事件）→ 綁定個人
 * - 老師在群組裡傳任一訊息（message 事件帶 groupId）→ 綁定群組
 * - 之後在別的聊天室再傳訊息，就會切換到那個聊天室（最後一次發言即接收處）
 *
 * 未設定 LINE_CHANNEL_SECRET 時回 501（功能休眠）；簽章驗證不過回 400。
 * 綁定資料存 `__line_recipient` 雲端記錄，只有 server 讀，學生端看不到。
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { ENV } from "./env";
import { createCloudSave, getCloudSave, updateCloudSave } from "../db";
import { LINE_RECIPIENT_KEY, type LineRecipientBinding } from "../lineNotify";

type LineEvent = {
  type?: string;
  source?: { type?: string; userId?: string; groupId?: string };
};

function verifySignature(secret: string, rawBody: Buffer, signatureHeader: string): boolean {
  const digest = createHmac("SHA256", secret).update(rawBody).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export async function handleLineWebhook(req: Request, res: Response) {
  const secret = ENV.lineChannelSecret.trim();
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!secret || !rawBody) {
    res.status(501).json({ ok: false, reason: "line-not-configured" });
    return;
  }

  const signature = req.headers["x-line-signature"];
  if (typeof signature !== "string" || !verifySignature(secret, rawBody, signature)) {
    res.status(400).json({ ok: false, reason: "invalid signature" });
    return;
  }

  let events: LineEvent[] = [];
  try {
    const parsed = JSON.parse(rawBody.toString("utf8")) as { events?: LineEvent[] };
    events = Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    res.status(400).json({ ok: false, reason: "bad json" });
    return;
  }

  let binding: LineRecipientBinding | null = null;
  for (const event of events) {
    const source = event?.source;
    if (!source) continue;
    if (source.groupId) {
      binding = { recipientType: "group", recipientId: source.groupId, updatedAt: Date.now() };
      break;
    }
    if (source.type === "user" && source.userId) {
      binding = { recipientType: "user", recipientId: source.userId, updatedAt: Date.now() };
    }
  }

  if (binding) {
    try {
      const existing = await getCloudSave(LINE_RECIPIENT_KEY);
      if (existing) {
        await updateCloudSave(LINE_RECIPIENT_KEY, binding, {
          coins: existing.coins,
          totalAnswers: existing.totalAnswers,
          badges: existing.badges,
        });
      } else {
        await createCloudSave({
          name: LINE_RECIPIENT_KEY,
          payload: binding,
          coins: 0,
          totalAnswers: 0,
          badges: 0,
        });
      }
    } catch (error) {
      console.error("[lineWebhook] 綁定接收對象失敗", error);
    }
  }

  res.status(200).json({ ok: true });
}
