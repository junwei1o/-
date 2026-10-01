import React, { useEffect, useState } from "react";
import type { AdminModule } from "../types";

/**
 * 安全防線（型態＝真實回應標頭檢查）。
 *
 * ⚠️ 這裡**刻意不寫死「我們有開 CSP」之類的宣稱**——那種寫法會在設定改了之後
 * 說謊。改成**實際發一個請求、讀回真正的回應標頭**，所以畫面上永遠是當下的實況。
 * 這也是為什麼這個模組不需要伺服器端端點。
 */

type HeaderFinding = {
  name: string;
  header: string;
  present: boolean;
  value: string | null;
  /** 這個標頭在防什麼。 */
  protects: string;
  /** 缺少時的後果。 */
  risk: string;
};

/**
 * 探測用的端點。
 *
 * ⚠️ 為什麼要打**兩個**請求（2026-10-01 修正）：
 * 安全標頭（CSP／HSTS…）掛在整站的靜態回應上，但**限流標頭只掛在 `/api/trpc`
 * 這條中介層**（見 server/_core/index.ts 的 apiLimiter）。原本只打 `GET /`，
 * 結果「API 限流」永遠顯示「未回報」——不是限流沒開，是**問錯地方**。
 * 這種「探測目標與宣稱不符」的假陽性，比沒有這個模組更糟。
 */
const PAGE_PROBE = "/";
const API_PROBE = "/api/trpc/admin.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D";

function useRealResponseHeaders() {
  const [state, setState] = useState<{
    loading: boolean;
    headers: Record<string, string> | null;
    /** 逐個探測目標的成功／失敗，讓「讀不到」與「沒設定」可以區分。 */
    probes: { target: string; ok: boolean; note: string }[];
    error: string | null;
  }>({ loading: true, headers: null, probes: [], error: null });

  useEffect(() => {
    let alive = true;

    const read = async (target: string) => {
      const response = await fetch(`${window.location.origin}${target}`, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      });
      const collected: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        collected[key.toLowerCase()] = value;
      });
      return { target, ok: true, note: `HTTP ${response.status}`, headers: collected };
    };

    Promise.allSettled([read(PAGE_PROBE), read(API_PROBE)])
      .then((results) => {
        if (!alive) return;
        const merged: Record<string, string> = {};
        const probes: { target: string; ok: boolean; note: string }[] = [];
        let failures = 0;

        for (const result of results) {
          if (result.status === "fulfilled") {
            Object.assign(merged, result.value.headers);
            probes.push({ target: result.value.target, ok: true, note: result.value.note });
          } else {
            failures += 1;
            probes.push({
              target: "（未知目標）",
              ok: false,
              note: result.reason instanceof Error ? result.reason.message : "請求失敗",
            });
          }
        }

        // 兩個都失敗才算整體失敗；只有一個失敗仍可呈現部分實況，並標明哪個沒讀到。
        setState({
          loading: false,
          headers: failures === results.length ? null : merged,
          probes,
          error: failures === results.length ? "兩個探測目標都無法連線" : null,
        });
      });

    return () => {
      alive = false;
    };
  }, []);

  return state;
}

function SecurityModule() {
  const { loading, headers, probes, error } = useRealResponseHeaders();

  if (loading) return <p className="admin-muted" aria-busy="true">正在讀取實際回應標頭…</p>;
  if (error || !headers) return <p className="admin-error" role="alert">無法讀取回應標頭：{error ?? "未知原因"}</p>;

  const cspReportOnly = headers["content-security-policy-report-only"] ?? null;
  const cspEnforced = headers["content-security-policy"] ?? null;

  const findings: HeaderFinding[] = [
    {
      name: "內容安全政策（CSP）",
      header: cspEnforced ? "content-security-policy" : "content-security-policy-report-only",
      present: Boolean(cspReportOnly || cspEnforced),
      value: cspEnforced ?? cspReportOnly,
      protects: "限制可載入的指令碼與連線來源，降低注入攻擊影響。",
      risk: "未設定時，若出現注入點可被載入外部指令碼。",
    },
    {
      name: "強制 HTTPS（HSTS）",
      header: "strict-transport-security",
      present: Boolean(headers["strict-transport-security"]),
      value: headers["strict-transport-security"] ?? null,
      protects: "要求瀏覽器後續只用 HTTPS 連線，防降級與中間人。",
      risk: "未設定時首次連線可能被降級為 HTTP。",
    },
    {
      name: "禁用 MIME 猜測",
      header: "x-content-type-options",
      present: headers["x-content-type-options"] === "nosniff",
      value: headers["x-content-type-options"] ?? null,
      protects: "阻止瀏覽器把非指令碼檔當成指令碼執行。",
      risk: "未設定時上傳內容可能被當成指令碼執行。",
    },
    {
      name: "禁止被嵌入（點擊劫持）",
      header: "x-frame-options",
      present: Boolean(headers["x-frame-options"]),
      value: headers["x-frame-options"] ?? null,
      protects: "拒絕本站被其它網站以 iframe 嵌入。",
      risk: "未設定時可能被嵌入偽裝頁面，誘導點擊。",
    },
    {
      name: "來源資訊政策",
      header: "referrer-policy",
      present: Boolean(headers["referrer-policy"]),
      value: headers["referrer-policy"] ?? null,
      protects: "限制跨站時洩漏的來源路徑。",
      risk: "未設定時可能把站內路徑帶給外部網站。",
    },
  ];

  const rateLimitPolicy = headers["ratelimit-policy"] ?? null;
  const vary = headers["vary"] ?? null;

  return (
    <>
      <ul className="admin-check-list">
        {findings.map((finding) => (
          <li key={finding.header} className={`admin-check-item is-${finding.present ? "ok" : "watch"}`}>
            <span className="admin-check-mark" aria-hidden="true">{finding.present ? "✓" : "!"}</span>
            <div className="admin-check-body">
              <p className="admin-check-title">
                {finding.name}
                <span className={`admin-check-tag is-${finding.present ? "ok" : "watch"}`}>{finding.present ? "已設定" : "未設定"}</span>
                {finding.header === "content-security-policy-report-only" && <span className="admin-check-tag is-watch">僅觀察模式</span>}
              </p>
              <p className="admin-check-value">{finding.value ? finding.value.slice(0, 140) + (finding.value.length > 140 ? "…" : "") : "—"}</p>
              <p className="admin-check-note">
                {finding.present ? finding.protects : `缺少時的風險：${finding.risk}`}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="admin-kv">
        <div className="admin-kv-row">
          <dt>API 限流</dt>
          <dd>{rateLimitPolicy ?? "未回報"}</dd>
          <small>
            來自回應標頭 <code>ratelimit-policy</code>；由實際請求讀取，非寫死的設定值。
            限流掛在 <code>/api/trpc</code> 這條中介層上，因此是打一支 API 才讀得到的。
          </small>
        </div>
        <div className="admin-kv-row">
          <dt>內容協商</dt>
          <dd>{vary ?? "未回報"}</dd>
          <small>伺服器快取依這些標頭變化，避免把不同格式回應混用。</small>
        </div>
      </dl>

      <p className="admin-source">
        探測目標：
        {probes.map((probe) => `${probe.target}（${probe.ok ? probe.note : `讀取失敗：${probe.note}`}）`).join("、")}。
        安全標頭取自整站頁面、限流標頭取自 API，兩者分開才不會把「問錯地方」誤判成「沒有設定」。
      </p>

      {cspReportOnly && !cspEnforced && (
        <p className="admin-source">
          CSP 目前為<strong>觀察模式</strong>：違規只會被回報、不會阻擋。這是刻意的前置階段——
          確認沒有誤報後再改為強制模式。要改為強制需修改 <code>server/_core/index.ts</code>。
        </p>
      )}
    </>
  );
}

export const securityModule: AdminModule = {
  id: "security-headers",
  title: "安全防線",
  group: "access",
  summary: "實際回應標頭檢查——CSP、HSTS、MIME、點擊劫持與限流。",
  order: 20,
  span: "full",
  render: () => <SecurityModule />,
};
