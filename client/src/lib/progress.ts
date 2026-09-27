// 學習進度：存在瀏覽器 localStorage，不需要登入、不寫伺服器

import {
  GRADES,
  ISLANDS,
  STAGES_PER_GRADE,
  starFor,
  stageKey,
  type SubjectId,
} from '../../../shared/islands';

export interface StageRecord {
  attempts: number;
  /** 最佳答對題數 */
  best: number;
  lastScore: number;
  /** 最高星等 0-3 */
  stars: number;
  cleared: boolean;
  updatedAt: number;
}

export interface HistoryItem {
  key: string;
  islandId: SubjectId;
  subject: string;
  grade: number;
  stage: number;
  score: number;
  total: number;
  stars: number;
  at: number;
}

export interface Progress {
  version: 1;
  stages: Record<string, StageRecord>;
  history: HistoryItem[];
  /** 最近玩過的關卡，首頁「繼續探險」用 */
  lastKey?: string;
}

const STORAGE_KEY = 'island-explorer.progress.v1';
const MAX_HISTORY = 100;

export const TOTAL_STAGES = ISLANDS.length * GRADES.length * STAGES_PER_GRADE;

const EMPTY: Progress = { version: 1, stages: {}, history: [] };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, stages: {}, history: [] };
    const parsed = JSON.parse(raw) as Progress;
    if (parsed.version !== 1 || typeof parsed.stages !== 'object') {
      return { ...EMPTY, stages: {}, history: [] };
    }
    return { ...parsed, stages: parsed.stages ?? {}, history: parsed.history ?? [] };
  } catch {
    return { ...EMPTY, stages: {}, history: [] };
  }
}

function persist(progress: Progress): Progress {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 隱私模式或空間不足：進度只留記憶體
  }
  return progress;
}

export function resetProgress(): Progress {
  return persist({ version: 1, stages: {}, history: [] });
}

/** 紀錄一次關卡結果，回傳新的進度物件 */
export function recordStage(input: {
  islandId: SubjectId;
  subject: string;
  grade: number;
  stage: number;
  score: number;
  total: number;
}): Progress {
  const progress = loadProgress();
  const key = stageKey(input.islandId, input.grade, input.stage);
  const stars = starFor(input.score, input.total);
  const prev = progress.stages[key];

  const record: StageRecord = {
    attempts: (prev?.attempts ?? 0) + 1,
    best: Math.max(prev?.best ?? 0, input.score),
    lastScore: input.score,
    stars: Math.max(prev?.stars ?? 0, stars),
    cleared: Boolean(prev?.cleared) || stars >= 1,
    updatedAt: Date.now(),
  };

  const next: Progress = {
    version: 1,
    stages: { ...progress.stages, [key]: record },
    history: [
      {
        key,
        islandId: input.islandId,
        subject: input.subject,
        grade: input.grade,
        stage: input.stage,
        score: input.score,
        total: input.total,
        stars,
        at: Date.now(),
      },
      ...progress.history,
    ].slice(0, MAX_HISTORY),
    lastKey: key,
  };

  return persist(next);
}

export interface IslandStats {
  islandId: SubjectId;
  subject: string;
  cleared: number;
  total: number;
  stars: number;
  maxStars: number;
  answered: number;
  correct: number;
}

export interface OverallStats {
  clearedStages: number;
  totalStages: number;
  stars: number;
  maxStars: number;
  answered: number;
  correct: number;
  accuracy: number;
  attempts: number;
  byIsland: IslandStats[];
  /** 0-100 的整體完成度 */
  percent: number;
}

export function computeStats(progress: Progress): OverallStats {
  const byIsland: IslandStats[] = ISLANDS.map((island) => {
    let cleared = 0;
    let stars = 0;
    let answered = 0;
    let correct = 0;

    for (const grade of GRADES) {
      for (let stage = 1; stage <= STAGES_PER_GRADE; stage++) {
        const record = progress.stages[stageKey(island.id, grade, stage)];
        if (!record) continue;
        if (record.cleared) cleared += 1;
        stars += record.stars;
        answered += record.attempts;
        correct += record.attempts * record.best;
      }
    }

    return {
      islandId: island.id,
      subject: island.subject,
      cleared,
      total: GRADES.length * STAGES_PER_GRADE,
      stars,
      maxStars: GRADES.length * STAGES_PER_GRADE * 3,
      answered,
      correct,
    };
  });

  const clearedStages = byIsland.reduce((sum, i) => sum + i.cleared, 0);
  const stars = byIsland.reduce((sum, i) => sum + i.stars, 0);
  const answered = byIsland.reduce((sum, i) => sum + i.answered, 0);
  const correct = byIsland.reduce((sum, i) => sum + i.correct, 0);
  const attempts = Object.values(progress.stages).reduce((sum, r) => sum + r.attempts, 0);

  return {
    clearedStages,
    totalStages: TOTAL_STAGES,
    stars,
    maxStars: TOTAL_STAGES * 3,
    answered,
    correct,
    accuracy: answered === 0 ? 0 : Math.round((correct / answered) * 100),
    attempts,
    byIsland,
    percent: Math.round((clearedStages / TOTAL_STAGES) * 100),
  };
}

/** 找出第一個還沒通關的關卡，作為「繼續探險」目標 */
export function nextStage(progress: Progress): { islandId: SubjectId; grade: number; stage: number } {
  if (progress.lastKey) {
    const [islandId, grade, stage] = progress.lastKey.split('-');
    const parsedGrade = Number(grade);
    const parsedStage = Number(stage);
    const record = progress.stages[progress.lastKey];
    if (record && !record.cleared && parsedStage < STAGES_PER_GRADE) {
      return {
        islandId: islandId as SubjectId,
        grade: parsedGrade,
        stage: Math.min(parsedStage + 1, STAGES_PER_GRADE),
      };
    }
    if (record?.cleared && parsedStage < STAGES_PER_GRADE) {
      return { islandId: islandId as SubjectId, grade: parsedGrade, stage: parsedStage + 1 };
    }
    if (parsedGrade < 6) {
      return { islandId: islandId as SubjectId, grade: Math.min(parsedGrade + 1, 6), stage: 1 };
    }
  }

  for (const island of ISLANDS) {
    for (const grade of GRADES) {
      for (let stage = 1; stage <= STAGES_PER_GRADE; stage++) {
        if (!progress.stages[stageKey(island.id, grade, stage)]?.cleared) {
          return { islandId: island.id, grade, stage };
        }
      }
    }
  }

  return { islandId: ISLANDS[0].id, grade: 3, stage: 1 };
}
