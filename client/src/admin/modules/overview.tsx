import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 站長總覽：健康總表（型態＝紅黃綠燈塔）。
 *
 * ## 為什麼需要這個模組
 *
 * 後台做到 19 個模組之後，出現一個真實問題：**站長要自己捲過所有模組
 * 才能拼出「現在健康嗎」**。而捲漫長的頁面找問題，是最容易被放棄的用法。
 *
 * 所以這個模組不提供新資料——它**只做彙整**：把其他模組已經取得的真實資料
 * 換成一眼能判讀的狀態燈。價值在於「不用捲」，不在於「多一份數字」。
 *
 * ## 三個設計紀律
 *
 * 1. **只用已經在畫面上顯示過的真實資料**。沒有的就寫「未取到」，
 *    不用 0 或猜測值假裝正常。
 * 2. **燈號門檻寫在畫面上**。看到「紅」要能立刻知道是什麼條件觸發的，
 *    否則這張表只是製造焦慮。
 * 3. **任一資料源失敗時降級而非全滅**。單一端點掛掉不該讓整張表變空白——
 *    那會讓站長以為「全站壞了」，比沒有這張表更糟。
 */

type Tone = "ok" | "watch" | "high" | "unknown";

type Light = {
  id: string;
  name: string;
  tone: Tone;
  /** 一句話現況。 */
  value: string;
  /** 觸發這個燈號的條件（誠實寫出來，讓站長能自己判斷）。 */
  rule: string;
  /** 建議動作；沒有就留空。 */
  action?: string;
};

const TONE_LABEL: Record<Tone, string> = {
  ok: "正常",
  watch: "留意",
  high: "需處理",
  unknown: "未取到",
};

function HealthModule() {
  // 這裡刻意重用其他模組在用的同一批端點——不新增查詢。
  const stats = trpc.admin.siteStats.useQuery(undefined, { staleTime: 60_000, retry: false });
  const runtime = trpc.admin.runtime.useQuery(undefined, { staleTime: 60_000, retry: false });
  const requests = trpc.admin.requestStats.useQuery(undefined, { staleTime: 30_000, retry: false });
  const activity = trpc.admin.learningActivity.useQuery(undefined, { staleTime: 60_000, retry: false });
  const deploy = trpc.admin.deployInfo.useQuery(undefined, { staleTime: 120_000, retry: false });

  const loading = stats.isPending || runtime.isPending || requests.isPending || activity.isPending;
  if (loading) return <p className="admin-muted" aria-busy="true">正在彙整各系統狀態…</p>;

  const db = stats.data?.database;
  const envRows = runtime.data?.env ?? [];
  const missingEnv = envRows.filter((row) => !row.configured);
  const req = requests.data;
  const learn = activity.data;
  const uptimeHours = deploy.data ? deploy.data.uptimeMs / 3_600_000 : null;

  const lights: Light[] = [];

  // 1) 資料庫
  if (!db) {
    lights.push({ id: "db", name: "資料庫", tone: "unknown", value: "未取到", rule: "端點未回應" });
  } else if (!db.configured) {
    lights.push({
      id: "db",
      name: "資料庫",
      tone: "watch",
      value: "未設定（降級為本機模式）",
      rule: "DATABASE_URL 未設定",
      action: "雲端存檔／班級／公告／試卷紀錄不會累積；本機學習不受影響",
    });
  } else if (!db.reachable) {
    lights.push({
      id: "db",
      name: "資料庫",
      tone: "high",
      value: db.error ?? "無法連線",
      rule: "已設定但連不上",
      action: "到部署環境檢查 DATABASE_URL 與資料庫是否存活",
    });
  } else {
    lights.push({
      id: "db",
      name: "資料庫",
      tone: "ok",
      value: `正常（ping ${db.pingMs ?? 0} ms）`,
      rule: "已設定且可連線",
    });
  }

  // 2) 請求錯誤率
  if (!req || req.total === 0) {
    lights.push({ id: "req", name: "請求健康", tone: "unknown", value: req ? "尚無請求" : "未取到", rule: req ? "本次啟動以來沒有請求" : "端點未回應" });
  } else {
    const errorRate = ((req.byStatusClass.s4xx + req.byStatusClass.s5xx) / req.total) * 100;
    const tone: Tone = errorRate >= 10 ? "high" : errorRate >= 3 ? "watch" : "ok";
    lights.push({
      id: "req",
      name: "請求健康",
      tone,
      value: `${Math.round(errorRate * 10) / 10}% 錯誤（${req.total.toLocaleString("zh-TW")} 次）`,
      rule: "紅：≥10%｜黃：≥3%｜綠：<3%（4xx＋5xx 佔比）",
    });
  }

  // 3) 題庫
  if (!stats.data) {
    lights.push({ id: "bank", name: "題庫", tone: "unknown", value: "未取到", rule: "端點未回應" });
  } else if (!stats.data.bank) {
    lights.push({
      id: "bank",
      name: "題庫",
      tone: "high",
      value: "未載入",
      rule: "伺服器記憶體中沒有題庫",
      action: "剛部署完成時可能正在預熱；持續為空就要查題庫載入",
    });
  } else {
    lights.push({ id: "bank", name: "題庫", tone: "ok", value: `${stats.data.bank.total.toLocaleString("zh-TW")} 題可用`, rule: "記憶體中已有題庫" });
  }

  // 4) 必要環境變數
  const requiredMissing = missingEnv.filter((row) => ["DATABASE_URL", "JWT_SECRET"].includes(row.name));
  const optionalMissing = missingEnv.filter((row) => !["DATABASE_URL", "JWT_SECRET"].includes(row.name));
  if (requiredMissing.length > 0) {
    lights.push({
      id: "env",
      name: "必要設定",
      tone: "high",
      value: `缺 ${requiredMissing.length} 項`,
      rule: `必要變數未設定：${requiredMissing.map((row) => row.name).join("、")}`,
      action: "到部署環境補上後會觸發重新部署",
    });
  } else {
    lights.push({
      id: "env",
      name: "必要設定",
      tone: optionalMissing.length > 0 ? "watch" : "ok",
      value: optionalMissing.length > 0 ? `必要項齐全，另有 ${optionalMissing.length} 項選用未設` : "全部就緒",
      rule: "必要：DATABASE_URL、JWT_SECRET；其餘為選用（缺了會降級但不會壞）",
    });
  }

  // 5) 學習活躍度——「有沒有人在用」是站長最該先知道的事
  if (!learn) {
    lights.push({ id: "learn", name: "學習活躍", tone: "unknown", value: "未取到", rule: "端點未回應" });
  } else if (!learn.database.reachable) {
    lights.push({ id: "learn", name: "學習活躍", tone: "unknown", value: "需要資料庫", rule: "資料庫不可用，無法統計學習活動" });
  } else if (learn.windows[0] && learn.windows[0].sessions === 0 && learn.windows[1] && learn.windows[1].sessions === 0) {
    lights.push({
      id: "learn",
      name: "學習活躍",
      tone: "watch",
      value: "最近 7 天沒有答題紀錄",
      rule: "7 天內場次為 0",
      action: "確認是「沒人來用」還是「紀錄沒寫進去」——後者要查資料庫",
    });
  } else {
    const last7 = learn.windows.find((row) => row.days === 7);
    lights.push({
      id: "learn",
      name: "學習活躍",
      tone: "ok",
      value: `7 天內 ${last7?.sessions ?? 0} 場／${last7?.students ?? 0} 人`,
      rule: "以 7 天內的答題場次與不重複學生數判斷",
    });
  }

  // 6) 部署新鮮度
  if (!deploy.data) {
    lights.push({ id: "deploy", name: "部署", tone: "unknown", value: "未取到", rule: "端點未回應" });
  } else {
    // 記憶體統計會在重啟後歸零，所以「剛重啟」是正常現象，不是問題。
    const fresh = uptimeHours !== null && uptimeHours < 1;
    lights.push({
      id: "deploy",
      name: "部署",
      tone: "ok",
      value: fresh
        ? "剛重新部署（本機統計已歸零）"
        : `已穩定運行 ${uptimeHours !== null ? Math.floor(uptimeHours) : "?"} 小時`,
      rule: "記憶體統計在重啟後歸零，數字變小不代表資料遺失",
    });
  }

  const order: Record<Tone, number> = { high: 0, watch: 1, unknown: 2, ok: 3 };
  const sorted = [...lights].sort((a, b) => order[a.tone] - order[b.tone]);
  const needAttention = lights.filter((light) => light.tone === "high" || light.tone === "watch").length;

  return (
    <>
      <p className="admin-source">
        需要注意的子系統：<strong>{needAttention}</strong> / {lights.length}。
        燈號門檻都寫在每一列下面——看到紅燈要能立刻知道是什麼條件觸發的。
      </p>

      <ul className="admin-light-list">
        {sorted.map((light) => (
          <li key={light.id} className={`admin-light-item is-${light.tone}`}>
            <span className={`admin-light-badge is-${light.tone}`}>{TONE_LABEL[light.tone]}</span>
            <div className="admin-light-body">
              <p className="admin-light-title">
                {light.name}
                <span className="admin-light-value">{light.value}</span>
              </p>
              <p className="admin-light-rule">{light.rule}</p>
              {light.action && <p className="admin-light-action">→ {light.action}</p>}
            </div>
          </li>
        ))}
      </ul>

      <p className="admin-source">
        本表<strong>不提供新資料</strong>，只把其他模組已顯示的真實資料換成一眼能判讀的狀態。
        沒取到的項目會誠實標成「未取到」，不會假裝正常。
      </p>
    </>
  );
}

export const healthLighthouseModule: AdminModule = {
  id: "health-lighthouse",
  title: "健康總表",
  group: "overview",
  summary: "一眼看完所有子系統的紅黃綠燈——不用捲過所有模組才拼得出結論。",
  order: 10,
  span: "full",
  render: () => <HealthModule />,
};
