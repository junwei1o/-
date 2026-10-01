import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 內容類模組（型態＝分布清單 ＋ 計數表）。
 * 資料來源：admin.siteStats（資料庫 COUNT(*) ＋ 記憶體題庫分布）。
 */

function shareList(record: Record<string, number>, total: number) {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, share: total > 0 ? (value / total) * 100 : 0 }));
}

function Distribution({ title, record, total, unit }: { title: string; record: Record<string, number>; total: number; unit: string }) {
  const rows = shareList(record, total);
  return (
    <div className="admin-dist">
      <h4 className="admin-dist-title">{title}</h4>
      <ul className="admin-meter-list">
        {rows.map((row) => (
          <li className="admin-meter-item" key={row.label}>
            <span className="admin-meter-label">{row.label}</span>
            <meter
              className="admin-meter"
              min={0}
              max={100}
              value={Math.min(100, row.share)}
              aria-label={`${row.label}：${row.value} ${unit}`}
            />
            <span className="admin-meter-value">
              {row.value.toLocaleString("zh-TW")} {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 題庫規模與分布 ─────────────────────────────────────────

function QuestionBankModule() {
  const query = trpc.admin.siteStats.useQuery(undefined, { staleTime: 60_000, retry: false });
  if (query.isPending) return <p className="admin-muted" aria-busy="true">正在讀取題庫統計…</p>;
  if (query.isError || !query.data) return <p className="admin-error" role="alert">目前無法取得題庫統計。</p>;

  const bank = query.data.bank;
  if (!bank) {
    return (
      <p className="admin-muted">
        題庫目前為空或尚未載入。若剛部署完成，第一次讀取會需要幾秒鐘。
      </p>
    );
  }

  return (
    <>
      <p className="admin-big-number">
        <strong>{bank.total.toLocaleString("zh-TW")}</strong> <span>題</span>
        <small>伺服器記憶體中的題庫總數（靜態碼表，載入一次後重複使用）。</small>
      </p>
      <Distribution title="科目分布" record={bank.bySubject} total={bank.total} unit="題" />
      <Distribution title="年級分布" record={bank.byGrade} total={bank.total} unit="題" />
      <Distribution title="難度分布" record={bank.byDifficulty} total={bank.total} unit="題" />
      <Distribution title="題型（依選項數）" record={bank.byOptionCount} total={bank.total} unit="題" />
    </>
  );
}

// ── 站點資料總覽 ───────────────────────────────────────────

function SiteDataModule() {
  const query = trpc.admin.siteStats.useQuery(undefined, { staleTime: 60_000, retry: false });
  if (query.isPending) return <p className="admin-muted" aria-busy="true">正在讀取站點資料…</p>;
  if (query.isError || !query.data) return <p className="admin-error" role="alert">目前無法取得站點資料。</p>;

  const { database, counts } = query.data;

  if (!database.configured) {
    return (
      <div className="admin-warning is-watch" role="status">
        <strong className="admin-warning-badge">未啟用雲端資料庫</strong>
        <span className="admin-warning-headline">
          沒有設定 <code>DATABASE_URL</code>，因此雲端存檔、班級、公告與試卷紀錄都不會累積。
        </span>
        <small className="admin-warning-advice">本機模式（localStorage）仍可正常運作。</small>
      </div>
    );
  }

  if (!database.reachable || !counts) {
    return (
      <div className="admin-warning is-high" role="alert">
        <strong className="admin-warning-badge">資料庫連線異常</strong>
        <span className="admin-warning-headline">{database.error ?? "無法連線"}</span>
        <small className="admin-warning-advice">雲端相關功能可能失效；本機學習功能不受影響。</small>
      </div>
    );
  }

  const rows: { label: string; value: number; note?: string }[] = [
    { label: "班級", value: counts.classes, note: "教師建立的班級數" },
    { label: "班級成員", value: counts.classMembers, note: "加入班級的學生人次" },
    { label: "作業", value: counts.assignments },
    { label: "公告", value: counts.announcements },
    { label: "試卷紀錄", value: counts.examRecords, note: "含三軸混編試卷" },
    { label: "週測紀錄", value: counts.weeklyQuizzes },
    { label: "雲端存檔", value: counts.cloudSaves, note: "以船名為單位的存檔" },
    { label: "帳號", value: counts.users },
    { label: "AI 用量列", value: counts.aiUsageRows, note: "每日每人一列的彙總" },
  ];

  return (
    <>
      <p className="admin-source">
        資料庫實測：<strong>{database.pingMs === null ? "使用快取" : `${database.pingMs} ms`}</strong>
        {database.pingMs !== null && "（十個 COUNT 查詢的總耗時；為節省 RU 有 60 秒快取）"}
      </p>
      <dl className="admin-kv">
        {rows.map((row) => (
          <div className="admin-kv-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value.toLocaleString("zh-TW")}</dd>
            {row.note && <small>{row.note}</small>}
          </div>
        ))}
      </dl>
    </>
  );
}

export const questionBankModule: AdminModule = {
  id: "question-bank",
  title: "題庫規模與分布",
  group: "content",
  summary: "題庫總數，以及科目／年級／難度／題型的分布。",
  order: 10,
  span: "full",
  render: () => <QuestionBankModule />,
};

export const siteDataModule: AdminModule = {
  id: "site-data",
  title: "站點資料總覽",
  group: "content",
  summary: "班級、成員、作業、公告、試卷與存檔的累計筆數。",
  order: 20,
  span: "half",
  render: () => <SiteDataModule />,
};
