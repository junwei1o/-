/* 合併五、六年級補充題進主題庫。
 * 流程：讀補充檔 → 格式驗證 → prompt 重複比對（含主庫）→ 生成 q949 起 id → 寫回主 JSON → 重跑品質報告。
 * 用法：node scripts/merge-supplement.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const MAIN_PATH = "data/taiwan_curriculum_500.json";
const REPORT_PATH = "data/taiwan_curriculum_500_quality_report.json";
const SUPPLEMENTS = [
  "data/supplement_math.json",
  "data/supplement_science.json",
  "data/supplement_social.json",
  "data/supplement_chinese.json",
];

const SUBJECTS = new Set(["數學", "自然", "社會", "國語"]);
const DIFFICULTIES = new Set(["基礎", "標準", "挑戰"]);
const DOMAINS = new Set(["語文領域", "數學領域", "自然科學領域", "社會領域"]);
const TYPES = new Set(["選擇題", "是非題"]);

const main = JSON.parse(readFileSync(MAIN_PATH, "utf8"));
const existingIds = new Set(main.questions.map((q) => q.id));
const existingPrompts = new Set(main.questions.map((q) => q.prompt));
const failures = [];
const all = [];

let nextNumber = 1;
while (existingIds.has(`q${String(nextNumber).padStart(3, "0")}`)) nextNumber += 1;

for (const file of SUPPLEMENTS) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  for (const q of data.questions) {
    const errors = [];
    if (typeof q.grade !== "number" || ![3, 4, 5, 6].includes(q.grade)) errors.push("grade");
    if (!SUBJECTS.has(q.subject)) errors.push("subject");
    if (!TYPES.has(q.questionType)) errors.push("questionType");
    if (!DIFFICULTIES.has(q.difficulty)) errors.push("difficulty");
    if (!DOMAINS.has(q.curriculumDomain)) errors.push("curriculumDomain");
    if (typeof q.learningTopic !== "string" || !q.learningTopic) errors.push("learningTopic");
    if (typeof q.learningPerformance !== "string" || !q.learningPerformance) errors.push("learningPerformance");
    if (typeof q.learningContent !== "string" || !q.learningContent) errors.push("learningContent");
    if (typeof q.competency !== "string" || !q.competency) errors.push("competency");
    if (typeof q.prompt !== "string" || !q.prompt) errors.push("prompt");
    if (typeof q.explanation !== "string" || !q.explanation) errors.push("explanation");
    const expectedOptions = q.questionType === "是非題" ? 2 : 4;
    if (!Array.isArray(q.options) || q.options.length !== expectedOptions) errors.push(`options(${Array.isArray(q.options) ? q.options.length : "?"}/${expectedOptions})`);
    else if (!q.options.every((o) => typeof o === "string" && o.trim())) errors.push("options blank");
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) errors.push("answer");
    if (!Array.isArray(q.knowledge) || q.knowledge.length === 0 || !q.knowledge.every((k) => typeof k === "string")) errors.push("knowledge");
    if (existingPrompts.has(q.prompt)) errors.push("prompt duplicate with main bank");
    if (existingPrompts.has(q.prompt)) { /* 已記錄 */ }
    const promptKey = `${q.grade}|${q.subject}|${q.prompt}`;
    if (all.some((item) => `${item.grade}|${item.subject}|${item.prompt}` === promptKey)) errors.push("prompt duplicate within supplement");
    if (errors.length > 0) {
      failures.push({ file, prompt: String(q.prompt).slice(0, 30), errors });
      continue;
    }
    const id = `q${String(nextNumber).padStart(3, "0")}`;
    nextNumber += 1;
    all.push({ id, ...q });
    existingPrompts.add(q.prompt);
  }
}

if (failures.length > 0) {
  console.error(`合併中止：${failures.length} 題未通過驗證`);
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

main.questions.push(...all);
main.questionCount = main.questions.length;
writeFileSync(MAIN_PATH, JSON.stringify(main, null, 2) + "\n", "utf8");
console.log(`已合併 ${all.length} 題 → 總數 ${main.questionCount}`);

/* 重跑品質報告（與手動驗證同一套規則） */
const qs = main.questions;
const ids = new Set();
const prompts = new Map();
const counts = { subject: {}, grade: {}, difficulty: {}, questionType: {}, curriculumDomain: {}, optionCount: {} };
const reportFailures = [];
qs.forEach((q, i) => {
  const errs = [];
  if (typeof q.id !== "string") errs.push("id");
  if (ids.has(q.id)) reportFailures.push({ id: q.id, reason: "duplicate id" });
  ids.add(q.id);
  if (!Number.isInteger(q.grade)) errs.push("grade");
  if (!q.subject) errs.push("subject");
  if (!q.difficulty) errs.push("difficulty");
  const qt = q.questionType ?? "選擇題";
  const expOpts = qt === "是非題" ? 2 : 4;
  if (!Array.isArray(q.options) || q.options.length !== expOpts) errs.push("options len");
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errs.push("answer");
  if (!Array.isArray(q.knowledge) || q.knowledge.length === 0) errs.push("knowledge");
  if (!q.prompt || !q.explanation) errs.push("prompt/expl");
  if (errs.length) reportFailures.push({ id: q.id ?? "idx" + i, reason: errs.join(",") });
  if (q.prompt) { const n = prompts.get(q.prompt) ?? 0; prompts.set(q.prompt, n + 1); }
  counts.subject[q.subject] = (counts.subject[q.subject] || 0) + 1;
  counts.grade[q.grade] = (counts.grade[q.grade] || 0) + 1;
  counts.difficulty[q.difficulty] = (counts.difficulty[q.difficulty] || 0) + 1;
  counts.questionType[qt] = (counts.questionType[qt] || 0) + 1;
  counts.curriculumDomain[q.curriculumDomain] = (counts.curriculumDomain[q.curriculumDomain] || 0) + 1;
  counts.optionCount[q.options.length] = (counts.optionCount[q.options.length] || 0) + 1;
});
const dupPrompts = [...prompts.entries()].filter(([, n]) => n > 1).map(([p, n]) => ({ count: n, prompt: p.slice(0, 40) }));
const report = {
  generatedAt: new Date().toISOString(),
  questionCount: qs.length,
  validQuestionCount: qs.length - reportFailures.length,
  validationFailures: reportFailures.slice(0, 20),
  duplicatePromptCount: dupPrompts.length,
  duplicatePrompts: dupPrompts.slice(0, 10),
  counts,
};
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log("品質報告已更新：", JSON.stringify(report.counts));
