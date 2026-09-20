/**
 * 配對關係題：把「配對題庫」（matching_bank）的庫存互相利用，轉成選擇題。
 *
 * 配對題庫原本只能玩連連看；這裡把每一組配對拆開重組——
 * 正確選項是某組真實的配對，干擾項則是「同一組裡故意接錯線」的配對
 * （每組的右值都驗證過唯一，所以接錯線的配對必定錯誤）。
 * 學生等於在選擇題裡複習配對關係，兩種玩法互相印證。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { shuffle, makeQuestion } from "./common.mjs";

const SET_FILES = ["data/matching_bank.json", "data/matching_bank_extra.json"];

/** 配對組的年級標記（「3-4年級」「7-9年級」…）轉成單一年級數字。 */
function gradeOf(raw) {
  const nums = String(raw ?? "").match(/\d+/g)?.map(Number) ?? [5];
  if (nums.length === 0) return 5;
  if (nums.length === 1) return Math.min(9, Math.max(3, nums[0]));
  return Math.min(9, Math.max(3, Math.round((nums[0] + nums[1]) / 2)));
}

const PROMPT_FORMS = (title) => [
  `${title}：下列哪一組配對是正確的？`,
  `玩過「${title}」連連看嗎？下列哪一組配對是對的？`,
  `關於「${title}」的配對關係，哪一個選項接對了？`,
];

/**
 * 產生配對關係題。
 *
 * @param rng 種子亂數
 * @param collector 去重收集器
 * @param target 想產生的總題數（各科依配對組數自然分佈）
 * @returns 實際產生題數
 */
export function generateMatchingRelations(rng, collector, target = 180) {
  const root = process.cwd();
  const sets = [];
  for (const file of SET_FILES) {
    const parsed = JSON.parse(readFileSync(join(root, file), "utf8"));
    for (const set of parsed.sets ?? []) {
      // 只用文字配對組；圖片組的左欄是圖片，不適合做成選項文字。
      if (!Array.isArray(set.pairs) || set.pairs.length < 4) continue;
      const texts = set.pairs.every((p) => typeof p.l === "string" && typeof p.r === "string" && p.l && p.r);
      if (!texts) continue;
      sets.push(set);
    }
  }

  let produced = 0;
  let guard = 0;
  /** 每一組配對抽 2 題（題多的大組不會被抽爆，小組也有出場機會）。 */
  const queue = sets.flatMap((set) =>
    shuffle(rng, [...set.pairs]).slice(0, 2).map((pair) => ({ set, pair })),
  );
  shuffle(rng, queue);

  for (const { set, pair } of queue) {
    if (produced >= target) break;
    guard += 1;
    if (guard > target * 8) break;

    const others = set.pairs.filter((p) => p !== pair);
    const correct = `${pair.l} → ${pair.r}`;
    /**
     * 干擾項：同一組裡「接錯線」的配對。
     * 兩種接法——l 接到別人的 r、別人的 l 接到這個 r——在右值唯一的組裡必定錯誤。
     */
    const wrongPairings = [];
    for (const other of others) {
      if (other.r !== pair.r) wrongPairings.push(`${pair.l} → ${other.r}`);
      if (other.l !== pair.l) wrongPairings.push(`${other.l} → ${pair.r}`);
    }
    const distractors = shuffle(rng, [...new Set(wrongPairings)]).slice(0, 3);
    if (distractors.length < 3) continue;

    const forms = shuffle(rng, PROMPT_FORMS(set.title));
    const question = makeQuestion({
      subject: set.subject,
      grade: gradeOf(set.grade),
      topic: `內容配對：${set.title}`,
      difficulty: "標準",
      prompt: forms[0],
      options: [correct, ...distractors],
      answer: 0,
      explanation: `在「${set.title}」的配對中，${pair.l} 對應的是「${pair.r}」；其他選項把不同的項目接錯線了。`,
      knowledge: [set.title, `${set.subject}內容配對`],
    });
    if (question && collector.add(question)) produced += 1;
  }
  return produced;
}
