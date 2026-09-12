import React, { useState } from "react";
import { CheckCircle2, Link2, MessageSquareText, Send, Unlink, Wrench } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import "./TeacherLineSection.css";

type Binding = { recipientType: "user" | "group"; recipientId: string; updatedAt: number };

/**
 * 督學台的 LINE 通知設定區。
 * 學生完成任何試卷（自由練習／錯題／限時／週測／複習中心）後，
 * server 自動推一條 LINE 給老師（含分數＋薄弱點）。
 * 金鑰在 Render 環境變數；接收對象由 webhook 自動綁定。
 */
export function TeacherLineSection() {
  const [sending, setSending] = useState(false);
  const query = trpc.line.getBinding.useQuery();
  const sendTest = trpc.line.sendTest.useMutation();
  const clearBinding = trpc.line.clearBinding.useMutation();

  const envReady = query.data?.envReady ?? false;
  const binding = (query.data?.binding ?? null) as Binding | null;

  const handleTest = async () => {
    setSending(true);
    try {
      const result = await sendTest.mutateAsync();
      if (result.ok) {
        toast.success("測試訊息已送出，請查看 LINE");
      } else if (result.reason === "line-token-not-set") {
        toast.error("尚未在 Render 設定 LINE 金鑰");
      } else if (result.reason === "line-recipient-not-bound") {
        toast.error("尚未綁定聊天室：先傳訊息給機器人");
      } else {
        toast.error(`傳送失敗：${result.reason ?? "未知錯誤"}`);
      }
    } catch {
      toast.error("傳送失敗，請稍後再試");
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearBinding.mutateAsync();
      toast.success("已解除綁定");
      await query.refetch();
    } catch {
      toast.error("解除綁定失敗，請稍後再試");
    }
  };

  return (
    <section className="teacher-card line-notify-card" aria-labelledby="line-notify-title">
      <header className="line-notify-head">
        <span className="line-notify-icon" aria-hidden="true">
          <MessageSquareText size={18} />
        </span>
        <div>
          <h2 id="line-notify-title">LINE 通知</h2>
          <p className="line-notify-sub">
            學生每次完成試卷（自由練習／錯題／限時／週測／複習中心）自動推播一條給你。
          </p>
        </div>
        {envReady ? (
          <span className="line-notify-status is-ready">
            <CheckCircle2 size={13} aria-hidden="true" /> 已啟用
          </span>
        ) : (
          <span className="line-notify-status is-pending">
            <Wrench size={13} aria-hidden="true" /> 待設定
          </span>
        )}
      </header>

      {!envReady ? (
        <ol className="line-notify-steps">
          <li>
            <strong>建立 LINE 機器人</strong>
            到 LINE Developers 建立「Messaging API」頻道，取得 Channel Secret 與 Access Token。
          </li>
          <li>
            <strong>設定 Render 環境變數</strong>
            在 Render 的 Service 加入 <code>LINE_CHANNEL_SECRET</code> 與{" "}
            <code>LINE_CHANNEL_ACCESS_TOKEN</code>，重新部署。
          </li>
          <li>
            <strong>設定 Webhook</strong>
            在 LINE 頻道設定裡，把 Webhook URL 填成 <code>https://xue-gr3a.onrender.com/api/line/webhook</code>
            ，並勾選「Allow bot to send push messages」。
          </li>
        </ol>
      ) : binding ? (
        <div className="line-notify-bound">
          <p className="line-notify-bound-line">
            <Link2 size={14} aria-hidden="true" />
            通知將送到：
            <strong>{binding.recipientType === "group" ? "LINE 群組" : "個人對話"}</strong>
            <small>{new Date(binding.updatedAt).toLocaleString("zh-TW")} 綁定</small>
          </p>
          <div className="line-notify-actions">
            <button type="button" className="line-notify-btn" onClick={handleTest} disabled={sending}>
              <Send size={14} aria-hidden="true" />
              {sending ? "傳送中…" : "傳送測試訊息"}
            </button>
            <button type="button" className="line-notify-btn ghost" onClick={handleClear}>
              <Unlink size={14} aria-hidden="true" />
              解除綁定
            </button>
          </div>
          <p className="line-notify-tip">
            想切換接收處？在目標聊天室（群組或個人）再傳任一訊息給機器人即可。
          </p>
        </div>
      ) : (
        <ol className="line-notify-steps">
          <li>
            <strong>加入機器人</strong>
            把機器人加為好友（個人通知），或建立群組把機器人加進去。
          </li>
          <li>
            <strong>傳任一訊息綁定</strong>
            在要接收通知的聊天室傳一句話（例如「hi」），系統會自動把該聊天室設為接收處。
          </li>
        </ol>
      )}
    </section>
  );
}
