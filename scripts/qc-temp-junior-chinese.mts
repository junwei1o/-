#!/usr/bin/env tsx
/* 臨時 QC：對 junior-chinese-add.ts 的 7 堂課套用與 scripts/qc-onion-lessons.mts 相同的檢查。 */
import myLessons from "../client/src/game/onion/lessons/junior-chinese-add";

type Issue = { lesson: string; where: string; message: string };
const issues: Issue[] = [];
const add = (lesson: string, where: string, message: string) => issues.push({ lesson, where, message });

function numbersIn(text: string): number[] {
  const found: number[] = [];
  for (const m of text.matchAll(/[\d]+(?:\.[\d]+)?/g)) found.push(Number(m[0]));
  return found;
}
function fractionsIn(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of text.matchAll(/(\d+)\s*\/\s*(\d+)/g)) out.push([Number(m[1]), Number(m[2])]);
  return out;
}
const APPROVED_PROPS = new Set(["none", "text", "bars", "flow", "numberLine", "balance", "cycle", "pie", "pies", "shape"]);

function checkFrame(lesson: string, frameIndex: number, frame: any) {
  const where = `第 ${frameIndex + 1} 幀`;
  if (!frame.step || !frame.step.trim()) {
    add(lesson, where, "缺少 step 步驟標籤");
  } else {
    const m = frame.step.match(/^步驟\s*(\d+)\s*：(.+)$/);
    if (!m) add(lesson, where, `step 格式不符「步驟 N：說明」→ ${frame.step}`);
    else {
      if (Number(m[1]) !== frameIndex + 1) add(lesson, where, `step 編號 ${m[1]} 與實際位置 ${frameIndex + 1} 不一致`);
      if (m[2].trim().length < 3) add(lesson, where, `step 說明過短：${frame.step}`);
    }
  }
  if (!frame.caption || frame.caption.trim().length < 8) add(lesson, where, `字幕過短或空白：${JSON.stringify(frame.caption)}`);
  const prop = frame.prop as { kind: string } & Record<string, unknown>;
  if (!APPROVED_PROPS.has(prop.kind)) { add(lesson, where, `教具 kind 不合法：${prop.kind}`); return; }
  const captionNumbers = numbersIn(frame.caption);
  if (prop.kind === "bars") {
    const items = prop.items as Array<{ label: string; value: number }> | undefined;
    if (!Array.isArray(items) || items.length === 0) add(lesson, where, "bars 沒有資料");
    else {
      for (const item of items) {
        if (!Number.isFinite(item.value) || item.value <= 0) add(lesson, where, `bars 的值不合理：${item.label} = ${item.value}`);
        if (captionNumbers.length > 0 && !captionNumbers.includes(item.value) && !frame.caption.includes(item.label))
          add(lesson, where, `bars 的 ${item.label}（${item.value}）與字幕數字（${captionNumbers.join("、")}）對不上`);
      }
      const active = prop.active as number | undefined;
      if (active !== undefined && (active < 0 || active >= items.length)) add(lesson, where, `bars.active 超出範圍：${active}`);
    }
  }
  if (prop.kind === "pie" || prop.kind === "pies") {
    const checkPie = (a: unknown, b: unknown, tag: string) => {
      const na = Number(a), nb = Number(b);
      if (!Number.isFinite(na) || !Number.isFinite(nb) || nb <= 0 || na < 0) { add(lesson, where, `${tag} 的分數不合理：${na}/${nb}`); return; }
      const frac = fractionsIn(frame.caption);
      if (frac.length > 0 && !frac.some(([fa, fb]) => fa === na && fb === nb)) add(lesson, where, `${tag} 畫的是 ${na}/${nb}，但字幕分數是 ${frac.map(([x, y]) => `${x}/${y}`).join("、")}`);
    };
    if (prop.kind === "pie") checkPie(prop.a, prop.b, "pie");
    else {
      const left = prop.left as { a: number; b: number } | undefined;
      const right = prop.right as { a: number; b: number } | undefined;
      const result = prop.result as { a: number; b: number } | undefined;
      const fracs = fractionsIn(frame.caption);
      const anyMatch = fracs.length === 0 || [left, right, result].filter(Boolean).some((p) => fracs.some(([fa, fb]) => fa === p!.a && fb === p!.b));
      if (!anyMatch) add(lesson, where, `pies 畫的分數與字幕（${fracs.map(([x, y]) => `${x}/${y}`).join("、")}）都對不上`);
    }
  }
  if (prop.kind === "balance") {
    const left = String(prop.left ?? ""), right = String(prop.right ?? "");
    if (!left.trim() || !right.trim()) add(lesson, where, "balance 缺少左邊或右邊");
    if (frame.caption.includes("＝") || frame.caption.includes("=")) {
      const nums = numbersIn(`${left}${right}`);
      if (nums.length === 0) add(lesson, where, "balance 兩邊都沒有數字，無法對應字幕的等式");
    }
  }
  if (prop.kind === "flow") {
    const steps = prop.steps as string[] | undefined;
    if (!Array.isArray(steps) || steps.length < 2) add(lesson, where, "flow 步驟少於 2 個");
    else { const active = prop.active as number | undefined; if (active !== undefined && (active < 0 || active >= steps.length)) add(lesson, where, `flow.active 超出範圍：${active}`); }
  }
  if (prop.kind === "cycle") { const nodes = prop.nodes as string[] | undefined; if (!Array.isArray(nodes) || nodes.length < 2) add(lesson, where, "cycle 節點少於 2 個"); }
  if (prop.kind === "text") { if (!String(prop.text ?? "").trim()) add(lesson, where, "text 教具沒有文字"); }
  if (prop.kind === "shape") {
    const base = Number(prop.base), height = Number(prop.height);
    if (!Number.isFinite(base) || base <= 0) add(lesson, where, `shape.base 不合理：${prop.base}`);
    if (!Number.isFinite(height) || height <= 0) add(lesson, where, `shape.height 不合理：${prop.height}`);
    const nums = numbersIn(`${prop.base} ${prop.height}`);
    const mismatched = captionNumbers.filter((n) => n > 3 && !nums.includes(n));
    if (mismatched.length > 0 && /公分|公尺|底|高/.test(frame.caption)) add(lesson, where, `shape 的尺寸與字幕 ${mismatched.join("、")} 對不上`);
  }
  if (frame.ask) {
    const ask = frame.ask;
    if (!ask.prompt || ask.prompt.trim().length < 6) add(lesson, where, "ask 題幹過短");
    if (!Array.isArray(ask.options) || ask.options.length !== 4) add(lesson, where, `ask 選項數不是 4：${ask.options?.length}`);
    else {
      if (new Set(ask.options).size !== ask.options.length) add(lesson, where, "ask 選項重複");
      if (!Number.isInteger(ask.answer) || ask.answer < 0 || ask.answer >= ask.options.length) add(lesson, where, `ask.answer 不合法：${ask.answer}`);
    }
    if (!ask.hint || ask.hint.trim().length < 4) add(lesson, where, "ask 缺少提示");
  }
}

function checkLesson(lesson: any) {
  const label = lesson.id;
  if (lesson.frames.length < 7 || lesson.frames.length > 12) add(label, "整堂", `分鏡數不合理：${lesson.frames.length}`);
  lesson.frames.forEach((_: unknown, i: number) => checkFrame(label, i, lesson.frames[i]));
  const asks = lesson.frames.filter((f: any) => f.ask).length;
  if (asks < 2) add(label, "整堂", `中途提問只有 ${asks} 次`);
  if (!lesson.takeaways || lesson.takeaways.length < 3) add(label, "整堂", "重點整理少於 3 條");
  if (lesson.questions.length !== 5) add(label, "整堂", `闖關題數不是 5：${lesson.questions.length}`);
  if (lesson.stages.length !== 1) add(label, "整堂", `stages 不是單一學段：${lesson.stages.join("、")}`);
  lesson.questions.forEach((q: any, i: number) => {
    const where = `第 ${i + 1} 題`;
    if (!q.prompt || q.prompt.trim().length < 6) add(label, where, "題幹過短");
    if (!Array.isArray(q.options) || q.options.length !== 4) add(label, where, `選項數不是 4：${q.options?.length}`);
    else {
      if (new Set(q.options).size !== q.options.length) add(label, where, "選項重複");
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) add(label, where, `answer 不合法：${q.answer}`);
    }
    if (!q.explanation || q.explanation.trim().length < 8) add(label, where, "詳解過短");
    if (!q.hints || q.hints.length < 2) add(label, where, "提示少於 2 級");
  });
}

myLessons.forEach(checkLesson);
console.log(`檢查課程數：${myLessons.length}`);
if (issues.length === 0) console.log("\n沒有發現問題 ✅");
else { console.log(`\n發現 ${issues.length} 個問題：`); for (const i of issues) console.log(`  [${i.lesson}] ${i.where}：${i.message}`); process.exitCode = 1; }
