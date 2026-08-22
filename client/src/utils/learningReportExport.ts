import type { LearningRecord } from "@/utils/storage";

export type TeacherReportSummary = {
  generatedAt: number;
  totalAttempts: number;
  totalCorrect: number;
  activeDays: number;
  averagePlayMs: number;
  subjectRows: Array<{ subject: string; attempts: number; accuracy: number; averageResponseMs?: number }>;
  weakTags: Array<{ label: string; count: number }>;
  recommendations: string[];
};

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildTeacherReportCsv(summary: TeacherReportSummary, records: LearningRecord[]) {
  const rows: Array<Array<string | number>> = [
    ["寶島探險家｜單機學習報告"],
    ["產生時間", new Date(summary.generatedAt).toLocaleString("zh-TW")],
    ["總作答", summary.totalAttempts],
    ["答對", summary.totalCorrect],
    ["活躍天數", summary.activeDays],
    ["累積學習分鐘", Math.round(summary.averagePlayMs / 60_000)],
    [],
    ["科目", "作答數", "正確率", "平均答題秒數"],
    ...summary.subjectRows.map((item) => [item.subject, item.attempts, `${item.accuracy}%`, item.averageResponseMs ? `${Math.round(item.averageResponseMs / 100) / 10} 秒` : "—"]),
    [],
    ["弱項標籤", "錯題數"],
    ...summary.weakTags.map((item) => [item.label, item.count]),
    [],
    ["建議複習"],
    ...summary.recommendations.map((item) => [item]),
    [],
    ["近期作答紀錄", "科目", "結果", "錯誤標籤", "時間"],
    ...records.slice(-50).reverse().map((record) => [record.questionId, record.subject, record.isCorrect ? "答對" : "答錯", record.errorType ?? "—", new Date(record.timestamp).toLocaleString("zh-TW")]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

function htmlEscape(value: string | number) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

export function buildPrintableTeacherReportHtml(summary: TeacherReportSummary) {
  const generatedAt = new Date(summary.generatedAt).toLocaleString("zh-TW");
  const subjects = summary.subjectRows.map((item) => `<tr><td>${htmlEscape(item.subject)}</td><td>${item.attempts}</td><td>${item.accuracy}%</td><td>${item.averageResponseMs ? `${Math.round(item.averageResponseMs / 100) / 10} 秒` : "—"}</td></tr>`).join("");
  const tags = summary.weakTags.length ? summary.weakTags.map((item) => `<li>${htmlEscape(item.label)}：${item.count} 題</li>`).join("") : "<li>尚無足夠錯題資料。</li>";
  const recommendations = summary.recommendations.length ? summary.recommendations.map((item) => `<li>${htmlEscape(item)}</li>`).join("") : "<li>持續完成練習後，系統會提供個人化建議。</li>";
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>寶島探險家單機學習報告</title><style>body{font-family:system-ui,"Noto Sans TC",sans-serif;color:#17384a;padding:28px;line-height:1.55}h1{margin:0;color:#0b6e8e}h2{margin-top:28px;color:#15586c}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bfd5db;padding:8px;text-align:left}th{background:#eaf5f6}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.summary div{background:#f7fbfb;padding:10px;border-radius:8px}.muted{color:#54727c;font-size:12px}@media print{body{padding:0}}</style></head><body><h1>寶島探險家｜單機學習報告</h1><p class="muted">產生時間：${htmlEscape(generatedAt)}。本報告僅使用目前裝置中的真實學習紀錄。</p><div class="summary"><div>總作答<br><strong>${summary.totalAttempts}</strong></div><div>答對<br><strong>${summary.totalCorrect}</strong></div><div>活躍天數<br><strong>${summary.activeDays}</strong></div><div>累積學習<br><strong>${Math.round(summary.averagePlayMs / 60_000)} 分鐘</strong></div></div><h2>科目表現</h2><table><thead><tr><th>科目</th><th>作答數</th><th>正確率</th><th>平均答題秒數</th></tr></thead><tbody>${subjects}</tbody></table><h2>弱項標籤</h2><ul>${tags}</ul><h2>建議複習</h2><ul>${recommendations}</ul></body></html>`;
}
