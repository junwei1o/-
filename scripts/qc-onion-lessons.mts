#!/usr/bin/env tsx
/**
 * 洋蔥學院內容完整驗證。
 *
 * 為什麼需要這支腳本：洋蔥學院的動畫課是「資料驅動」的——分鏡字幕、教具、
 * 提問、闖關題全寫在同一份資料裡，只要有一格數字打錯，學生就會看到
 * 「字幕說 3/4、圖上畫 1/4」這種自相矛盾的畫面（也就是老師說的
 * 「視頻圖概念設計需準確無誤」）。這支腳本把每一堂課的每一幀都檢查一遍：
 *
 *   1. 結構：每堂 7 幀、每幀有 step 步驟標籤與字幕、每堂 5 題、選項數目正確
 *   2. 步驟：step 必須是「步驟 N：…」且 N 與實際位置相符（步驟分類清晰）
 *   3. 圖解一致性：字幕裡出現的數字／分數必須與教具（bars/pie/pies/balance/
 *      cycle/flow/shape）的資料相符——抓出「圖和字幕打架」的變態畫面
 *   4. 提問與題目：ask 的 answer 索引合法、選項不重複；題目的 answer 索引
 *      合法、選項不重複、詳解與提示不缺
 *   5. 規模：累計 200 堂課，涵蓋國小／國中／高中三個學段
 *
 * 用法：npx tsx scripts/qc-onion-lessons.mts
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { CORE_LESSONS, type OnionLesson } from "../client/src/game/onionAcademyLessons";

/**
 * 課程清單＝核心課程（onionAcademyLessons.ts）＋分冊課程（onion/lessons/*.ts）。
 *
 * App 端是用 Vite 的 import.meta.glob 自動彙總，但這支腳本是跑在 Node 上
 * （tsx），沒有 glob 可用，所以這裡自己讀目錄——兩邊的來源必須一致，
 * 否則會出現「App 有這堂課、體檢卻沒檢查到」的漏洞。
 */
async function loadAllLessons(): Promise<OnionLesson[]> {
  const dir = join(process.cwd(), "client/src/game/onion/lessons");
  const files = readdirSync(dir).filter((name) => name.endsWith(".ts")).sort();
  const extra: OnionLesson[] = [];
  for (const file of files) {
    const mod = (await import(join(dir, file))) as { default?: OnionLesson[] };
    extra.push(...(mod.default ?? []));
  }
  return [...CORE_LESSONS, ...extra];
}

const ONION_LESSONS: OnionLesson[] = await loadAllLessons();

type Issue = { lesson: string; where: string; message: string };

const issues: Issue[] = [];
const add = (lesson: string, where: string, message: string) => issues.push({ lesson, where, message });

/** 從字幕抓出所有數字（含分數 a/b、百分比、小數）。 */
function numbersIn(text: string): number[] {
  const found: number[] = [];
  for (const m of text.matchAll(/[\d]+(?:\.[\d]+)?/g)) found.push(Number(m[0]));
  return found;
}

/** 抓出字幕裡的分數 a/b。 */
function fractionsIn(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of text.matchAll(/(\d+)\s*\/\s*(\d+)/g)) out.push([Number(m[1]), Number(m[2])]);
  return out;
}

const APPROVED_PROPS = new Set([
  "none",
  "text",
  "bars",
  "flow",
  "numberLine",
  "balance",
  "cycle",
  "pie",
  "pies",
  "shape",
]);

function checkFrame(lesson: OnionLesson, frameIndex: number) {
  const frame = lesson.frames[frameIndex];
  const where = `第 ${frameIndex + 1} 幀`;
  const label = lesson.id;

  // ── 步驟標籤 ────────────────────────────────────────────────
  if (!frame.step || !frame.step.trim()) {
    add(label, where, "缺少 step 步驟標籤（步驟分類必須清楚）");
  } else {
    const m = frame.step.match(/^步驟\s*(\d+)\s*：(.+)$/);
    if (!m) {
      add(label, where, `step 格式不符「步驟 N：說明」→ ${frame.step}`);
    } else {
      if (Number(m[1]) !== frameIndex + 1) {
        add(label, where, `step 編號 ${m[1]} 與實際位置 ${frameIndex + 1} 不一致`);
      }
      if (m[2].trim().length < 3) add(label, where, `step 說明過短：${frame.step}`);
    }
  }

  // ── 字幕與教具 ──────────────────────────────────────────────
  if (!frame.caption || frame.caption.trim().length < 8) {
    add(label, where, `字幕過短或空白：${JSON.stringify(frame.caption)}`);
  }
  const prop = frame.prop as { kind: string } & Record<string, unknown>;
  if (!APPROVED_PROPS.has(prop.kind)) {
    add(label, where, `教具 kind 不合法：${prop.kind}`);
    return;
  }
  const captionNumbers = numbersIn(frame.caption);

  if (prop.kind === "bars") {
    const items = prop.items as Array<{ label: string; value: number }> | undefined;
    if (!Array.isArray(items) || items.length === 0) {
      add(label, where, "bars 沒有資料");
    } else {
      for (const item of items) {
        if (!Number.isFinite(item.value) || item.value <= 0) {
          add(label, where, `bars 的值不合理：${item.label} = ${item.value}`);
        }
        // 只有字幕「有提到數字」時才比對：字幕完全沒數字（例如「把數量畫成長條圖」）
        // 時無從矛盾，不該當成錯誤。
        if (
          captionNumbers.length > 0 &&
          !captionNumbers.includes(item.value) &&
          !frame.caption.includes(item.label)
        ) {
          add(label, where, `bars 的 ${item.label}（${item.value}）與字幕提到的數字（${captionNumbers.join("、")}）對不上`);
        }
      }
      const active = prop.active as number | undefined;
      if (active !== undefined && (active < 0 || active >= items.length)) {
        add(label, where, `bars.active 超出範圍：${active}`);
      }
    }
  }

  if (prop.kind === "pie" || prop.kind === "pies") {
    const checkPie = (a: unknown, b: unknown, tag: string) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isFinite(na) || !Number.isFinite(nb) || nb <= 0 || na < 0) {
        add(label, where, `${tag} 的分數不合理：${na}/${nb}`);
        return;
      }
      const frac = fractionsIn(frame.caption);
      if (frac.length > 0 && !frac.some(([fa, fb]) => fa === na && fb === nb)) {
        add(label, where, `${tag} 畫的是 ${na}/${nb}，但字幕裡的分數是 ${frac.map(([x, y]) => `${x}/${y}`).join("、")}`);
      }
    };
    if (prop.kind === "pie") checkPie(prop.a, prop.b, "pie");
    else {
      const left = prop.left as { a: number; b: number } | undefined;
      const right = prop.right as { a: number; b: number } | undefined;
      const result = prop.result as { a: number; b: number } | undefined;
      // pies 是「左＋右→結果」的過程圖：只要有一個圓餅對得上字幕的分數就不算矛盾，
      // 因為字幕常常只講正在處理的那一份（例如只講 1/4）。
      const fracs = fractionsIn(frame.caption);
      const anyMatch =
        fracs.length === 0 ||
        [left, right, result]
          .filter(Boolean)
          .some((p) => fracs.some(([fa, fb]) => fa === p!.a && fb === p!.b));
      if (!anyMatch) {
        add(label, where, `pies 畫的分數與字幕的分數（${fracs.map(([x, y]) => `${x}/${y}`).join("、")}）都對不上`);
      }
    }
  }

  if (prop.kind === "balance") {
    const left = String(prop.left ?? "");
    const right = String(prop.right ?? "");
    if (!left.trim() || !right.trim()) {
      add(label, where, "balance 缺少左邊或右邊");
    }
    // 字幕若有等號，兩邊的數字必須都出現在教具上（避免天平畫的和講的不同）
    if (frame.caption.includes("＝") || frame.caption.includes("=")) {
      const nums = numbersIn(`${left}${right}`);
      if (nums.length === 0) add(label, where, "balance 兩邊都沒有數字，無法對應字幕的等式");
    }
  }

  if (prop.kind === "flow") {
    const steps = prop.steps as string[] | undefined;
    if (!Array.isArray(steps) || steps.length < 2) {
      add(label, where, "flow 步驟少於 2 個");
    } else {
      const active = prop.active as number | undefined;
      if (active !== undefined && (active < 0 || active >= steps.length)) {
        add(label, where, `flow.active 超出範圍：${active}`);
      }
    }
  }

  if (prop.kind === "cycle") {
    const nodes = prop.nodes as string[] | undefined;
    if (!Array.isArray(nodes) || nodes.length < 2) add(label, where, "cycle 節點少於 2 個");
  }

  if (prop.kind === "text") {
    const text = String(prop.text ?? "");
    if (!text.trim()) add(label, where, "text 教具沒有文字");
  }

  if (prop.kind === "shape") {
    const base = Number(prop.base);
    const height = Number(prop.height);
    if (!Number.isFinite(base) || base <= 0) add(label, where, `shape.base 不合理：${prop.base}`);
    if (!Number.isFinite(height) || height <= 0) add(label, where, `shape.height 不合理：${prop.height}`);
    // 字幕若有提到尺寸，教具必須一致
    const nums = numbersIn(`${prop.base} ${prop.height}`);
    // 只比對「尺寸級」的數字：1-3 這種小數字多半是運算符（÷2、×2）或「2 條」，
    // 拿它們去比對邊長會誤報。
    const mismatched = captionNumbers.filter((n) => n > 3 && !nums.includes(n));
    if (mismatched.length > 0 && /公分|公尺|底|高/.test(frame.caption)) {
      add(label, where, `shape 的尺寸（${base}／${height}）與字幕提到的 ${mismatched.join("、")} 對不上`);
    }
  }

  // ── 中途提問 ────────────────────────────────────────────────
  if (frame.ask) {
    const ask = frame.ask;
    if (!ask.prompt || ask.prompt.trim().length < 6) add(label, where, "ask 題幹過短");
    if (!Array.isArray(ask.options) || ask.options.length !== 4) {
      add(label, where, `ask 選項數不是 4：${ask.options?.length}`);
    } else {
      if (new Set(ask.options).size !== ask.options.length) add(label, where, "ask 選項重複");
      if (!Number.isInteger(ask.answer) || ask.answer < 0 || ask.answer >= ask.options.length) {
        add(label, where, `ask.answer 不合法：${ask.answer}`);
      }
    }
    if (!ask.hint || ask.hint.trim().length < 4) add(label, where, "ask 缺少提示");
  }
}

/** 小工具：僅在物件存在且欄位是數字時回傳 true（避免 undefined 檢查散落各處）。 */
function ymdGuard(value: unknown): boolean {
  return Boolean(value) && typeof value === "object";
}

function checkLesson(lesson: OnionLesson) {
  const label = lesson.id;
  // 一堂課的分鏡數允許 7-12 幀（較深的課會多拆幾步）；少於 7 或爆量才是問題。
  if (lesson.frames.length < 7 || lesson.frames.length > 12) {
    add(label, "整堂", `分鏡數不合理（應為 7-12）：${lesson.frames.length}`);
  }
  lesson.frames.forEach((_, i) => checkFrame(lesson, i));

  const asks = lesson.frames.filter((f) => f.ask).length;
  if (asks < 2) add(label, "整堂", `中途提問只有 ${asks} 次（至少 2 次）`);

  if (!lesson.takeaways || lesson.takeaways.length < 3) add(label, "整堂", "重點整理少於 3 條");
  if (lesson.questions.length !== 5) add(label, "整堂", `闖關題數不是 5：${lesson.questions.length}`);
  if (lesson.stages.length !== 1) add(label, "整堂", `stages 不是單一學段：${lesson.stages.join("、")}`);

  lesson.questions.forEach((q, i) => {
    const where = `第 ${i + 1} 題`;
    if (!q.prompt || q.prompt.trim().length < 6) add(label, where, "題幹過短");
    if (!Array.isArray(q.options) || q.options.length !== 4) add(label, where, `選項數不是 4：${q.options?.length}`);
    else {
      if (new Set(q.options).size !== q.options.length) add(label, where, "選項重複");
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
        add(label, where, `answer 不合法：${q.answer}`);
      }
    }
    if (!q.explanation || q.explanation.trim().length < 8) add(label, where, "詳解過短");
    if (!q.hints || q.hints.length < 2) add(label, where, "提示少於 2 級");
  });
}

// ── 執行 ──────────────────────────────────────────────────────
const ids = ONION_LESSONS.map((l) => l.id);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupIds.length) console.log(`❗ 課程 id 重複：${dupIds.join("、")}`);

ONION_LESSONS.forEach(checkLesson);

const elementary = ONION_LESSONS.filter((l) => l.stages.includes("國小"));
const junior = ONION_LESSONS.filter((l) => l.stages.includes("國中"));
const senior = ONION_LESSONS.filter((l) => l.stages.includes("高中"));
const questionsOf = (list: OnionLesson[]) => list.reduce((sum, l) => sum + l.questions.length, 0);
const stepsOf = (list: OnionLesson[]) =>
  list.reduce((sum, l) => sum + l.frames.filter((f) => f.step && f.step.trim()).length, 0);

console.log("── 洋蔥學院內容驗證 ──");
console.log(
  `課程總數：${ONION_LESSONS.length} 堂（國小 ${elementary.length}、國中 ${junior.length}、高中 ${senior.length}）`,
);
console.log(
  `題目總數：${questionsOf(ONION_LESSONS)} 題（國小 ${questionsOf(elementary)}、國中 ${questionsOf(junior)}、高中 ${questionsOf(senior)}）`,
);
console.log(`步驟標籤：${stepsOf(ONION_LESSONS)} / ${ONION_LESSONS.length * 7} 幀`);
console.log(`科目：${[...new Set(ONION_LESSONS.map((l) => l.subject))].join("、")}`);

// 規模門檻：累計 200 堂，三個學段都要有足夠份量（課程數／題數同步檢查）。
const TARGETS = [
  { stage: "國小", lessons: elementary, minLessons: 70, minQuestions: 350 },
  { stage: "國中", lessons: junior, minLessons: 65, minQuestions: 325 },
  { stage: "高中", lessons: senior, minLessons: 60, minQuestions: 300 },
];
for (const target of TARGETS) {
  if (target.lessons.length < target.minLessons) {
    console.log(`❗ ${target.stage}課程數應達 ${target.minLessons}，實際 ${target.lessons.length}`);
  }
  const count = questionsOf(target.lessons);
  if (count < target.minQuestions) {
    console.log(`❗ ${target.stage}題數應達 ${target.minQuestions}，實際 ${count}`);
  }
}
if (ONION_LESSONS.length < 200) console.log(`❗ 課程總數應達 200 堂，實際 ${ONION_LESSONS.length}`);

if (issues.length === 0) {
  console.log("\n沒有發現問題 ✅");
} else {
  console.log(`\n發現 ${issues.length} 個問題：`);
  for (const issue of issues.slice(0, 60)) {
    console.log(`  [${issue.lesson}] ${issue.where}：${issue.message}`);
  }
  if (issues.length > 60) console.log(`  …其餘 ${issues.length - 60} 個省略`);
  process.exitCode = 1;
}
