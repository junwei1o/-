/* 將新題（q949 起）的 learningTopic 對齊舊庫既有組別名稱，並補足 2 題讓新組達 4 題。
 * 原則：語意相近優先；圓/百分率應用/統計/生物與環境依題目關鍵字拆組，避免誤歸類。
 * 用法：node scripts/remap-topics.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const MAIN_PATH = "data/taiwan_curriculum_500.json";
const REPORT_PATH = "data/taiwan_curriculum_500_quality_report.json";
const main = JSON.parse(readFileSync(MAIN_PATH, "utf8"));
const newQuestions = main.questions.slice(948);
const oldPrompts = new Set(main.questions.filter((q) => q.id < "q949").map((q) => q.prompt));

const SUBJECTS = new Set(["數學", "自然", "社會", "國語"]);
const DIFFICULTIES = new Set(["基礎", "標準", "挑戰"]);
const DOMAINS = new Set(["語文領域", "數學領域", "自然科學領域", "社會領域"]);
const TYPES = new Set(["選擇題", "是非題"]);

/* subject + 原 topic → 目標 topic；特殊規則用函式依 prompt 判斷 */
const simpleMap = {
  "數學/小數": "小數乘法",
  "數學/面積": "面積計算",
  "數學/體積": "體積",
  "數學/時間": "時間計算",
  "數學/比率與百分率": "百分比與生活應用",
  "數學/速率": "速率",
  "數學/比與比值": "比例",
  "數學/正比": "比例",
  "數學/反比": "比例",
  "數學/扇形": "面積計算",
  "自然/燃燒與滅火": "物質特性",
  "自然/溶解": "溶解",
  "自然/水溶液": "混合物與溶液",
  "自然/觀測月亮": "天文觀測",
  "自然/觀測太陽": "天文觀測",
  "自然/觀測星星": "天文觀測",
  "自然/地球的構造": "地震與防災",
  "自然/岩石與礦物": "岩石",
  "自然/空氣": "物質特性",
  "自然/鐵鏽": "物質特性",
  "自然/水生生物": "河川",
  "自然/聲音": "聲音",
  "自然/光": "光與影",
  "自然/光的反射": "光與影",
  "自然/大氣與天氣": "天氣",
  "自然/水循環": "水循環",
  "自然/人類活動與環境": "能源與永續",
  "社會/臺灣的政治": "民主",
  "社會/國際組織": "全球連結與貿易政策",
  "社會/國際交流": "全球連結與貿易政策",
  "社會/權利與責任": "權利",
  "國語/記敘文": "記敘文",
  "國語/寓言": "寓言寓意",
  "國語/語詞": "詞語理解",
  "國語/狀聲詞": "詞語理解",
  "國語/量詞": "詞語理解",
  "國語/標點符號": "標點符號",
  "國語/說明文": "說明文",
  "國語/文字": "字形判讀",
  "國語/句子": "句構",
  "國語/部首": "字形判讀",
  "國語/閱讀理解": "閱讀推論",
  "國語/童詩": "修辭與意象",
  "國語/議論文": "議論文",
  "國語/古詩": "古典語句與文化理解",
  "國語/書信": "資訊文本",
  "國語/成語": "詞語與成語",
  "國語/經典": "古典語句與文化理解",
  "國語/應用文": "資訊文本",
  "國語/劇本": "閱讀",
};

function remapTopic(q) {
  const key = `${q.subject}/${q.learningTopic}`;
  if (simpleMap[key]) return simpleMap[key];
  if (key === "數學/圓") {
    if (/圓周長|圓周率/.test(q.prompt)) return "周長計算";
    if (/面積/.test(q.prompt)) return "面積計算";
    return "周長計算";
  }
  if (key === "數學/百分率應用") {
    if (/折扣/.test(q.prompt)) return "折扣與多步運算";
    if (/加成|加三成/.test(q.prompt)) return "折扣與順序運算";
    return "百分比與生活應用";
  }
  if (key === "數學/統計") {
    if (/平均數/.test(q.prompt) || /平均/.test(q.prompt)) return "平均數";
    return "資料與不確定性";
  }
  if (key === "自然/生物與環境") {
    if (/生產者|分解者|食物鏈/.test(q.prompt) || /生物是生產者|分解者/.test(q.prompt)) return "食物鏈";
    if (/保育/.test(q.prompt)) return "保育";
    return "食物鏈";
  }
  return q.learningTopic; // ≥4 的組別與「簡單機械」「世界地理」保留原組
}

let remapped = 0;
for (const q of newQuestions) {
  const next = remapTopic(q);
  if (next !== q.learningTopic) {
    q.learningTopic = next;
    remapped += 1;
  }
}

/* 補 2 題：自然/簡單機械（輪軸）、社會/世界地理（太平洋） */
const nextNumber = main.questions.length + 1;
const extras = [
  {
    grade: 6, subject: "自然", questionType: "選擇題", difficulty: "標準",
    curriculumDomain: "自然科學領域", learningTopic: "簡單機械",
    learningPerformance: "能認識輪軸的應用。", learningContent: "門把是輪軸的應用，轉動軸心可以省力。", competency: "能說出生活中輪軸的應用。",
    prompt: "旋轉圓形的門把就可以打開門，門把主要應用哪一種簡單機械？",
    options: ["輪軸", "彈簧", "滑輪", "齒輪"], answer: 0,
    explanation: "門把是輪軸的應用，轉動較大的圓盤（輪）可以帶動較小的軸心省力。",
    knowledge: ["輪軸"],
  },
  {
    grade: 6, subject: "社會", questionType: "選擇題", difficulty: "標準",
    curriculumDomain: "社會領域", learningTopic: "世界地理",
    learningPerformance: "能認識世界的主要海洋。", learningContent: "太平洋是世界上面積最大的海洋，臺灣位於太平洋西岸。", competency: "能說出世界上面積最大的海洋。",
    prompt: "世界上面積最大的海洋是哪一個？",
    options: ["太平洋", "大西洋", "印度洋", "北冰洋"], answer: 0,
    explanation: "太平洋是世界上面積最大的海洋，臺灣東側就是太平洋。",
    knowledge: ["海洋"],
  },
];

const failures = [];
let skipped = 0;
const extrasToAdd = [];
const existingPrompts = new Set([...oldPrompts, ...newQuestions.map((q) => q.prompt)]);
for (const q of extras) {
  const errors = [];
  if (typeof q.grade !== "number" || ![3, 4, 5, 6].includes(q.grade)) errors.push("grade");
  if (!SUBJECTS.has(q.subject)) errors.push("subject");
  if (!TYPES.has(q.questionType)) errors.push("questionType");
  if (!DIFFICULTIES.has(q.difficulty)) errors.push("difficulty");
  if (!DOMAINS.has(q.curriculumDomain)) errors.push("curriculumDomain");
  const expectedOptions = q.questionType === "是非題" ? 2 : 4;
  if (!Array.isArray(q.options) || q.options.length !== expectedOptions) errors.push("options");
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errors.push("answer");
  if (!Array.isArray(q.knowledge) || q.knowledge.length === 0) errors.push("knowledge");
  if (existingPrompts.has(q.prompt)) { skipped += 1; continue; } // 已存在：冪等跳過
  if (errors.length) failures.push({ prompt: q.prompt.slice(0, 25), errors });
  existingPrompts.add(q.prompt);
  extrasToAdd.push(q);
}
if (failures.length) {
  console.error("補題驗證失敗", JSON.stringify(failures, null, 2));
  process.exit(1);
}
extrasToAdd.forEach((q, i) => {
  main.questions.push({ id: `q${String(nextNumber + i).padStart(3, "0")}`, ...q });
});
main.questionCount = main.questions.length;
writeFileSync(MAIN_PATH, JSON.stringify(main, null, 2) + "\n", "utf8");
console.log(`remapped=${remapped}，新增補題=${extrasToAdd.length}（跳過=${skipped}），總數=${main.questionCount}`);

/* 重跑品質報告（含知識點≥4 檢查） */
const qs = main.questions;
const ids = new Set();
const prompts = new Map();
const counts = { subject: {}, grade: {}, difficulty: {}, questionType: {}, curriculumDomain: {}, optionCount: {} };
const reportFailures = [];
const topicCounts = new Map();
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
  const tkey = `${q.subject}/${q.learningTopic}`;
  topicCounts.set(tkey, (topicCounts.get(tkey) ?? 0) + 1);
});
const thin = [...topicCounts.entries()].filter(([, n]) => n < 4);
const dupPrompts = [...prompts.entries()].filter(([, n]) => n > 1).map(([p, n]) => ({ count: n, prompt: p.slice(0, 40) }));
const report = {
  generatedAt: new Date().toISOString(),
  questionCount: qs.length,
  validQuestionCount: qs.length - reportFailures.length,
  validationFailures: reportFailures.slice(0, 20),
  duplicatePromptCount: dupPrompts.length,
  duplicatePrompts: dupPrompts.slice(0, 10),
  thinKnowledgeGroups: thin,
  counts,
};
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log("薄知識點組:", thin.length ? JSON.stringify(thin) : "無（全部≥4）");
console.log("品質報告已更新：", JSON.stringify(report.counts));
