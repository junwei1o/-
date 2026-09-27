// 島嶼探險家 — 四個學習島嶼的共用設定（前端與後端共用）

export type SubjectId = 'chinese' | 'math' | 'science' | 'social';

export type Difficulty = '基礎' | '標準' | '挑戰';

export interface Island {
  id: SubjectId;
  /** 科目名稱，與題庫 subject 欄位一致 */
  subject: string;
  name: string;
  emoji: string;
  tagline: string;
  /** Tailwind 色系前綴，例如 sea / sun / leaf / clay */
  theme: string;
  gradient: string;
}

export const ISLANDS: Island[] = [
  {
    id: 'chinese',
    subject: '國語',
    name: '文字島',
    emoji: '📖',
    tagline: '讀懂故事、抓緊語意，靠岸即通關',
    theme: 'sea',
    gradient: 'from-sky-500 to-blue-700',
  },
  {
    id: 'math',
    subject: '數學',
    name: '算式島',
    emoji: '🧭',
    tagline: '計算、圖形與規律，一路解開航向密碼',
    theme: 'sun',
    gradient: 'from-amber-400 to-orange-600',
  },
  {
    id: 'science',
    subject: '自然',
    name: '生態島',
    emoji: '🌿',
    tagline: '觀察動植物與地球變化，成為小小探險家',
    theme: 'leaf',
    gradient: 'from-emerald-400 to-green-700',
  },
  {
    id: 'social',
    subject: '社會',
    name: '人文島',
    emoji: '🗺️',
    tagline: '認識地理、歷史與公民，掌握台灣脈動',
    theme: 'clay',
    gradient: 'from-rose-400 to-red-600',
  },
];

export const GRADES = [3, 4, 5, 6] as const;

/** 每個年級航線的關卡數 */
export const STAGES_PER_GRADE = 6;

/** 每個關卡的題數 */
export const QUESTIONS_PER_STAGE = 10;

export const DIFFICULTIES: Difficulty[] = ['基礎', '標準', '挑戰'];

/** 關卡 → 難度：1-2 基礎、3-4 標準、5-6 挑戰 */
export function stageDifficulty(stage: number): Difficulty {
  if (stage <= 2) return '基礎';
  if (stage <= 4) return '標準';
  return '挑戰';
}

/** 關卡難度標語，顯示在關卡卡片上 */
export const STAGE_LABELS: Record<Difficulty, { title: string; hint: string }> = {
  基礎: { title: '淺灘', hint: '先暖身，穩穩拿分' },
  標準: { title: '礁岩', hint: '中等難度，考驗理解' },
  挑戰: { title: '深海', hint: '進階挑戰，攻下高分' },
};

export function islandById(id: string): Island | undefined {
  return ISLANDS.find((i) => i.id === id);
}

export function gradeLabel(grade: number): string {
  return `${grade} 年級`;
}

/** 進度儲存用的關卡鍵，例如 chinese-5-3 */
export function stageKey(subjectId: string, grade: number, stage: number): string {
  return `${subjectId}-${grade}-${stage}`;
}

/** 成績等第：>=90 金、>=75 銀、>=60 銅，其餘未通過 */
export function starFor(score: number, total: number): 0 | 1 | 2 | 3 {
  const pct = total === 0 ? 0 : (score / total) * 100;
  if (pct >= 90) return 3;
  if (pct >= 75) return 2;
  if (pct >= 60) return 1;
  return 0;
}
