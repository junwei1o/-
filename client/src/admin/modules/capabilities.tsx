import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 功能降級狀態（型態＝需求檢查清單）。
 *
 * 回答的是站長最常問、而目前最難自己回答的問題：
 * **「為什麼某個功能沒生效？」**
 *
 * 做法不是列一堆環境變數（那是「執行環境」模組在做的事，會重複），
 * 而是「**功能 → 需要什麼 → 現在有沒有**」的對照。
 * 同一個 `GROQ_API_KEY` 在這裡的意義是「AI 問答能不能用」，
 * 在執行環境那邊的意義只是「有沒有設定」——後者不回答功能問題。
 */

type Feature = {
  name: string;
  /** 對應的環境變數名；null 表示不依賴環境變數。 */
  env: string | null;
  /** 缺了會怎樣——寫「會壞」還是「只是降級」。 */
  effect: string;
  /** 怎麼補。 */
  remedy: string;
  /** 需要在前端之外確認的條件（朗讀就是這種）。 */
  extra?: "speech";
};

const FEATURES: Feature[] = [
  { name: "學習內容與答題", env: null, effect: "不依賴任何環境變數", remedy: "題庫是靜態程式碼，永遠可用" },
  { name: "雲端存檔／班級／公告／試卷紀錄", env: "DATABASE_URL", effect: "降級：全部退回瀏覽器本機模式，資料不跨裝置", remedy: "到部署環境設定 DATABASE_URL" },
  { name: "站長後台登入", env: "ADMIN_USERNAME", effect: "無此變數時用預設用戶名 admin（⚠️ 純用戶名驗證，無第二道因子）", remedy: "設一個更難猜的值，例如 ADMIN_USERNAME=<隨機長字串>（需同時改前端 CornerEntry 的 ADMIN_USERNAME）" },
  { name: "督學台登入", env: "TEACHER_PASSPHRASE", effect: "不可用：教師端會顯示未設定", remedy: "設定 TEACHER_PASSPHRASE" },
  { name: "學生會話與存檔", env: "JWT_SECRET", effect: "不可用：會話簽不出來，等於登入永不通", remedy: "設定 JWT_SECRET（隨機長字串）" },
  { name: "AI 深度導讀", env: "GROQ_API_KEY", effect: "降級：深度反思題會失敗，其餘題型正常", remedy: "到 Groq 取免費層金鑰" },
  { name: "AI 備援供應商", env: "CEREBRAS_API_KEY", effect: "可選：主供應商掛掉時沒有備援", remedy: "任一或多個備援金鑰都建議加" },
  { name: "LINE 推播與通知", env: "LINE_CHANNEL_ACCESS_TOKEN", effect: "降級：站內仍正常，只是不推播到 LINE", remedy: "照 docs/LINE通知設定.md 設定" },
  { name: "LINE webhook 驗簽", env: "LINE_CHANNEL_SECRET", effect: "降級：收不到 LINE 傳來的訊息", remedy: "同上" },
  { name: "遠端朗讀（Edge TTS）", env: null, extra: "speech", effect: "降級：退回瀏覽器內建語音（功能仍可用，音質較差）", remedy: "部署已自動嘗試安裝 edge-tts；持續失敗看「朗讀供應鏈」模組" },
];

function CapabilitiesModule() {
  const runtime = trpc.admin.runtime.useQuery(undefined, { staleTime: 60_000, retry: false });
  const speech = trpc.admin.speechHealth.useQuery(undefined, { staleTime: 60_000, retry: false });

  if (runtime.isPending) return <p className="admin-muted" aria-busy="true">正在讀取執行環境…</p>;
  if (runtime.isError || !runtime.data) return <p className="admin-error" role="alert">目前無法取得執行環境。</p>;

  const configured = new Set(runtime.data.env.filter((row) => row.configured).map((row) => row.name));
  const speechOk = speech.data?.candidates.some((candidate) => candidate.edgeTts) ?? null;

  const rows = FEATURES.map((feature) => {
    let ok: boolean;
    let note = "";
    if (feature.extra === "speech") {
      ok = speechOk === true;
      if (speechOk === null) note = "（朗讀狀態尚未探測完成）";
    } else if (feature.env === null) {
      ok = true;
    } else {
      ok = configured.has(feature.env);
    }
    return { ...feature, ok, note };
  });

  const broken = rows.filter((row) => !row.ok);
  const optionalDown = broken.filter((row) => row.effect.startsWith("降級"));
  const hardDown = broken.filter((row) => row.effect.startsWith("不可用"));

  return (
    <>
      <p className="admin-source">
        <strong>{rows.length - broken.length}</strong> / {rows.length} 項功能正常。
        {hardDown.length > 0 && (
          <>
            {" "}
            <strong className="is-bad">{hardDown.length}</strong> 項不可用、
          </>
        )}
        {optionalDown.length > 0 && <>{optionalDown.length} 項降級中</>}。
        這裡刻意<strong>不列環境變數本身</strong>——那是「執行環境」模組的工作；
        這裡只回答「少了它，那個功能會怎樣」。
      </p>

      <ul className="admin-check-list">
        {rows.map((row) => (
          <li key={row.name} className={`admin-check-item is-${row.ok ? "ok" : row.effect.startsWith("不可用") ? "high" : "watch"}`}>
            <span className="admin-check-mark" aria-hidden="true">{row.ok ? "✓" : "!"}</span>
            <div className="admin-check-body">
              <p className="admin-check-title">
                {row.name}
                <span className={`admin-check-tag is-${row.ok ? "ok" : row.effect.startsWith("不可用") ? "high" : "watch"}`}>
                  {row.ok ? "正常" : row.effect.startsWith("不可用") ? "不可用" : "降級"}
                </span>
                {row.env && <code className="admin-check-env">{row.env}</code>}
                {row.note && <span className="admin-check-neutral">{row.note}</span>}
              </p>
              <p className="admin-check-note">
                {row.effect}
                {row.ok ? "" : `　 remedy：${row.remedy}`}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {broken.length > 0 && (
        <p className="admin-source">
          <strong>降級不等於壞掉。</strong>多數功能在缺設定時會走替代路徑而繼續可用
          （例如朗讀退回瀏覽器語音、雲端存檔退回本機）。
          標成「不可用」的才是真的會擋住某個角色。
        </p>
      )}
    </>
  );
}

export const capabilitiesModule: AdminModule = {
  id: "capabilities",
  title: "功能降級狀態",
  group: "overview",
  summary: "「功能 → 需要什麼 → 現在有沒有」的對照。直接回答：為什麼某個功能沒生效？",
  order: 30,
  span: "full",
  render: () => <CapabilitiesModule />,
};
