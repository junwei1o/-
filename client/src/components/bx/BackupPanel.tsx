import React, { useRef, useState } from "react";
import { bxStore, type BxState } from "@/game/bxStore";
import { useBxVersion } from "./useBx";
import { bxAlert, bxToast } from "./bxRewards";

/**
 * BX 備份面板：匯出 .json 備份檔、匯入時先預覽，提供「覆蓋」與「合併（保留較高進度）」。
 * 對應 js/bx-safety.js 的 initBackup/doExport/doImport。
 */

interface ImportPreview {
  totalAnswers: number;
  coins: number;
  badges: number;
  checkinDays: number;
  updatedAt: string;
  data: Record<string, unknown>;
}

function stripMeta(d: Record<string, unknown>): Record<string, unknown> {
  const c = JSON.parse(JSON.stringify(d));
  delete c._meta;
  return c;
}

const max = Math.max;

function mergeInto(cur: BxState, incomingRaw: Record<string, unknown>) {
  const inc = stripMeta(incomingRaw) as unknown as Partial<BxState>;
  const incStats = inc.stats ?? ({} as BxState["stats"]);
  cur.stats.total_answers = max(cur.stats.total_answers, incStats.total_answers ?? 0);
  cur.stats.total_correct = max(cur.stats.total_correct, incStats.total_correct ?? 0);
  cur.stats.streak_best = max(cur.stats.streak_best, incStats.streak_best ?? 0);
  cur.stats.best_day_count = max(cur.stats.best_day_count, incStats.best_day_count ?? 0);
  cur.stats.first_light_done = cur.stats.first_light_done || !!incStats.first_light_done;
  cur.coins = max(cur.coins, inc.coins ?? 0);
  cur.badges = Array.from(new Set([...(cur.badges ?? []), ...(inc.badges ?? [])]));
  cur.shop_owned = Array.from(new Set([...(cur.shop_owned ?? []), ...(inc.shop_owned ?? [])]));

  const curDates = cur.checkin?.dates ?? [];
  const incDates = inc.checkin?.dates ?? [];
  cur.checkin.dates = Array.from(new Set([...curDates, ...incDates])).sort();
  cur.checkin.longest = max(cur.checkin?.longest ?? 0, inc.checkin?.longest ?? 0);

  const relicMap = new Map((cur.relics ?? []).map((r) => [r.id, r] as const));
  (inc.relics ?? []).forEach((r) => {
    const existing = relicMap.get(r.id);
    relicMap.set(r.id, existing ? { ...existing, ...r, wrongCount: max(existing.wrongCount, r.wrongCount ?? 0) } : r);
  });
  cur.relics = Array.from(relicMap.values());

  (Object.keys(cur.islands ?? {}) as Array<keyof BxState["islands"]>).forEach((k) => {
    cur.islands[k] = cur.islands[k] || !!inc.islands?.[k];
  });
  (Object.keys(cur.subjects ?? {}) as Array<keyof BxState["subjects"]>).forEach((k) => {
    const a = cur.subjects[k];
    const b = inc.subjects?.[k];
    if (b) {
      a.answers = max(a.answers, b.answers ?? 0);
      a.correct = max(a.correct, b.correct ?? 0);
    }
  });
}

export default function BackupPanel() {
  useBxVersion();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [remind, setRemind] = useState(bxStore.get<boolean>("backup.weekly_reminder", true) ?? true);

  const lastExport = bxStore.get<number | null>("backup.last_export_ts", null);
  const sizeKb = (new Blob([JSON.stringify(bxStore.all())]).size / 1024).toFixed(1);

  const doExport = () => {
    bxStore.flush();
    const raw = bxStore.all();
    const clean = JSON.parse(JSON.stringify(raw));
    clean._meta = {
      app: "寶島探險家",
      schema_version: raw.schema_version,
      exported_at: new Date().toISOString(),
      note: "此檔案不含姓名或個資，可安全保存。",
    };
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `寶島探險家_備份_${bxStore.today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    bxStore.update((s) => { s.backup.last_export_ts = Date.now(); });
    bxToast("✅ 備份檔已下載，請妥善保存");
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(String(reader.result));
      } catch {
        bxAlert("❌ 檔案格式錯誤，請確認選擇的是寶島探險家備份檔（.json）");
        return;
      }
      if (!data || typeof data !== "object" || !data.stats) {
        bxAlert("❌ 這不是有效的備份檔。");
        return;
      }
      const stats = (data.stats ?? {}) as { total_answers?: number };
      const checkin = (data.checkin ?? {}) as { dates?: unknown[] };
      setPreview({
        totalAnswers: stats.total_answers ?? 0,
        coins: (data.coins as number) ?? 0,
        badges: Array.isArray(data.badges) ? data.badges.length : 0,
        checkinDays: Array.isArray(checkin.dates) ? checkin.dates.length : 0,
        updatedAt: data.updated_at ? new Date(data.updated_at as number).toLocaleString("zh-TW") : "未知",
        data,
      });
    };
    reader.readAsText(file);
  };

  const close = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyOverwrite = () => {
    if (!preview) return;
    const incoming = stripMeta(preview.data) as unknown as Record<string, unknown>;
    bxStore.update((s) => {
      Object.keys(incoming).forEach((k) => {
        (s as unknown as Record<string, unknown>)[k] = incoming[k];
      });
    });
    bxStore.flush();
    close();
    bxToast("✅ 已覆蓋還原");
    setTimeout(() => window.location.reload(), 700);
  };

  const applyMerge = () => {
    if (!preview) return;
    bxStore.update((s) => mergeInto(s, preview.data));
    bxStore.flush();
    close();
    bxToast("✅ 已合併還原");
    setTimeout(() => window.location.reload(), 700);
  };

  return (
    <section className="bx-panel" id="bxBackup">
      <h3 className="bx-panel__title">💾 我的航海日誌備份</h3>
      <div className="bx-backup__meta">
        <span>上次備份：<strong>{lastExport ? new Date(lastExport).toLocaleString("zh-TW") : "尚未備份"}</strong></span>
        <span>資料大小：<strong>{sizeKb} KB</strong></span>
      </div>
      <p className="bx-backup__warn">
        ⚠️ 你的學習紀錄儲存在<strong>這台裝置的瀏覽器</strong>中。如果清除瀏覽器資料、更換裝置，或使用無痕模式，進度將會遺失。建議每週備份一次。
      </p>
      <div className="bx-backup__actions">
        <button type="button" className="bx-btn bx-btn--primary" onClick={doExport}>📤 匯出備份檔</button>
        <button type="button" className="bx-btn bx-btn--outline" onClick={() => fileRef.current?.click()}>📥 匯入備份檔</button>
        <label className="bx-check">
          <input
            type="checkbox"
            checked={remind}
            onChange={(e) => {
              setRemind(e.target.checked);
              bxStore.update((s) => { s.backup.weekly_reminder = e.target.checked; });
            }}
          />
          <span>開啟每週自動提醒</span>
        </label>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
      />

      {preview ? (
        <div className="bx-modal" role="dialog" aria-label="匯入確認" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="bx-modal__box">
            <h4>📥 確認匯入內容</h4>
            <ul className="bx-modal__list">
              <li><span>答題總數</span><strong>{preview.totalAnswers} 題</strong></li>
              <li><span>金幣</span><strong>{preview.coins} 枚</strong></li>
              <li><span>徽章</span><strong>{preview.badges} 枚</strong></li>
              <li><span>簽到天數</span><strong>{preview.checkinDays} 天</strong></li>
              <li><span>最後活躍</span><strong>{preview.updatedAt}</strong></li>
            </ul>
            <p className="bx-modal__note">請選擇匯入方式：</p>
            <div className="bx-modal__actions">
              <button type="button" className="bx-btn bx-btn--danger" onClick={applyOverwrite}>覆蓋現有資料</button>
              <button type="button" className="bx-btn bx-btn--primary" onClick={applyMerge}>合併（保留較高進度）</button>
              <button type="button" className="bx-btn bx-btn--ghost" onClick={close}>取消</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
