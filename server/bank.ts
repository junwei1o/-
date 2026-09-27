import fs from 'node:fs';
import path from 'node:path';

export interface Question {
  id: string;
  grade: number;
  subject: string;
  difficulty: string;
  learningTopic?: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation?: string;
  knowledge?: string[];
  questionType?: string;
}

interface BankFile {
  version: number;
  source?: string;
  count: number;
  questions: Question[];
}

let cached: Question[] | null = null;

/** 從磁碟載入題庫（只讀一次，之後常駐記憶體） */
export function loadQuestions(): Question[] {
  if (cached) return cached;

  const candidates = [
    path.resolve(process.cwd(), 'data', 'bank.json'),
    path.resolve(import.meta.dirname ?? '.', '..', 'data', 'bank.json'),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as BankFile;
    if (!Array.isArray(parsed.questions)) {
      throw new Error(`題庫格式錯誤：${file}`);
    }
    cached = parsed.questions;
    return cached;
  }

  throw new Error(`找不到題庫檔，已嘗試：${candidates.join(', ')}`);
}

// ─── 科目 × 年級 × 難度 索引 ───
// 原本 poolFor()/meta 每次請求都 filter 全表 2337 筆；
// 建成索引後：抽題變成 Map 查表，meta 更是直接取快取，O(1)。

let index: Map<string, Question[]> | null = null;

function poolKey(subject: string, grade: number, difficulty: string): string {
  return `${subject}|${grade}|${difficulty}`;
}

/** 取得主題庫索引（第一次建立，之後常駐記憶體） */
export function poolIndex(): Map<string, Question[]> {
  if (index) return index;

  const built = new Map<string, Question[]>();
  for (const q of loadQuestions()) {
    const key = poolKey(q.subject, q.grade, q.difficulty);
    const bucket = built.get(key);
    if (bucket) bucket.push(q);
    else built.set(key, [q]);
  }

  index = built;
  return index;
}

/** 取出指定科目／年級／難度的題目池（索引查表，找不到回空陣列） */
export function poolFor(subject: string, grade: number, difficulty: string): Question[] {
  return poolIndex().get(poolKey(subject, grade, difficulty)) ?? EMPTY_POOL;
}

const EMPTY_POOL: Question[] = [];

/** 以種子決定的亂數（mulberry32），確保同一關卡每次抽題與選項順序一致 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 把字串變成 32 位元種子 */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher–Yates 洗牌（原地，回傳同一陣列） */
export function shuffleInPlace<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
