/**
 * 臨時工具：檢查 client/src/game/onion/lessons/ 下每個課程檔的結構。
 * 用途是在「自動彙總」還沒接上之前，先獨立驗證各分冊課程的格式與規模。
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "client/src/game/onion/lessons");
const files = readdirSync(dir).filter((name) => name.endsWith(".ts"));

type Lesson = {
  id: string;
  subject: string;
  stages: string[];
  frames: Array<{ step?: string; ask?: unknown }>;
  questions: unknown[];
};

const all: Array<Lesson & { file: string }> = [];
for (const file of files) {
  const mod = (await import(join(dir, file))) as { default?: Lesson[] };
  const list = mod.default ?? [];
  console.log(`${file}: ${list.length} 堂`);
  for (const lesson of list) all.push({ ...lesson, file });
}

console.log(`\n合計 ${all.length} 堂`);
const ids = all.map((lesson) => lesson.id);
const dup = ids.filter((id, index) => ids.indexOf(id) !== index);
console.log("重複 id:", dup.length ? dup.join("、") : "無");

const problems: string[] = [];
for (const lesson of all) {
  if (lesson.frames.length !== 7) problems.push(`${lesson.id}: 分鏡 ${lesson.frames.length}`);
  if (lesson.questions.length !== 5) problems.push(`${lesson.id}: 題數 ${lesson.questions.length}`);
  if (lesson.stages.length !== 1) problems.push(`${lesson.id}: 學段數 ${lesson.stages.length}`);
  lesson.frames.forEach((frame, index) => {
    if (!frame.step || !/^步驟\s*\d+\s*：/.test(frame.step)) {
      problems.push(`${lesson.id} 第 ${index + 1} 幀: step 格式「${frame.step}」`);
    }
  });
  const asks = lesson.frames.filter((frame) => frame.ask).length;
  if (asks < 2) problems.push(`${lesson.id}: 中途提問只有 ${asks} 次`);
}
console.log("結構問題:", problems.length ? `\n  ${problems.slice(0, 25).join("\n  ")}` : "無");

const count = (key: (lesson: Lesson) => string) => {
  const map = new Map<string, number>();
  for (const lesson of all) map.set(key(lesson), (map.get(key(lesson)) ?? 0) + 1);
  return [...map].map(([k, v]) => `${k} ${v}`).join("、");
};
console.log("科目分布:", count((lesson) => lesson.subject));
console.log("學段分布:", count((lesson) => lesson.stages[0]));
