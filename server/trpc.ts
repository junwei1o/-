import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import z from 'zod';
import {
  DIFFICULTIES,
  GRADES,
  ISLANDS,
  QUESTIONS_PER_STAGE,
  STAGES_PER_GRADE,
  stageDifficulty,
  type Difficulty,
} from '../shared/islands';
import {
  hashSeed,
  loadQuestions,
  poolFor,
  seededRandom,
  shuffleInPlace,
} from './bank';

const t = initTRPC.create({ transformer: superjson });

/** 回給前端的題目（已重排選項，答案索引同步更新） */
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation?: string;
  topic?: string;
  knowledge?: string[];
  questionType?: string;
}

/** 同一個關卡永遠拿到同一份題目與同一組選項順序 */
function buildStage(subject: string, grade: number, stage: number): QuizQuestion[] {
  const difficulty = stageDifficulty(stage);
  const pool = poolFor(subject, grade, difficulty);
  if (pool.length === 0) {
    throw new TRPCError({ code: 'NOT_FOUND', message: '這個航線目前沒有題目' });
  }

  const rand = seededRandom(hashSeed(`${subject}|${grade}|${stage}|v1`));
  const picked = shuffleInPlace([...pool], rand).slice(0, Math.min(QUESTIONS_PER_STAGE, pool.length));

  return picked.map((q) => {
    const order = shuffleInPlace(
      q.options.map((_, i) => i),
      rand,
    );
    return {
      id: q.id,
      prompt: q.prompt,
      options: order.map((i) => q.options[i]),
      answer: order.indexOf(q.answer),
      explanation: q.explanation,
      topic: q.learningTopic,
      knowledge: q.knowledge,
      questionType: q.questionType,
    };
  });
}

/**
 * 題目統計摘要。
 *
 * 這份資料完全來自題庫（執行期間不變），原本每個請求都要對 2337 筆做
 * 約 68 次 filter 全表掃描；改成建立一次後永久快取，後續請求 O(1)。
 * 結構與欄位名稱維持不變，前端 `meta` 的型別不受影響。
 */
type MetaSnapshot = ReturnType<typeof buildMeta>;

let cachedMeta: MetaSnapshot | null = null;

function buildMeta() {
  return ISLANDS.map((island) => {
    const grades = GRADES.map((grade) => {
      const counts = {} as Record<Difficulty, number>;
      let total = 0;
      for (const difficulty of DIFFICULTIES) {
        const n = poolFor(island.subject, grade, difficulty).length;
        counts[difficulty] = n;
        total += n;
      }
      return { grade, total, counts, stages: STAGES_PER_GRADE };
    });

    return {
      ...island,
      total: grades.reduce((sum, g) => sum + g.total, 0),
      grades,
    };
  });
}

function metaSnapshot(): MetaSnapshot {
  if (!cachedMeta) cachedMeta = buildMeta();
  return cachedMeta;
}

export const appRouter = t.router({
  /** 服務是否活著 + 題庫規模，供健康檢查與首頁顯示 */
  health: t.procedure.query(() => {
    const questions = loadQuestions();
    return {
      ok: true as const,
      name: '島嶼探險家',
      bankCount: questions.length,
      islands: ISLANDS.length,
      stages: ISLANDS.length * GRADES.length * STAGES_PER_GRADE,
      time: new Date().toISOString(),
    };
  }),

  /** 地圖頁需要的摘要：每座島、每個年級有多少題（資料靜態，快取一次永久回傳） */
  meta: t.procedure.query(() => metaSnapshot()),

  /** 抽取某個關卡的題目 */
  quiz: t.procedure
    .input(
      z.object({
        subject: z.string().min(1),
        grade: z.number().int().min(3).max(6),
        stage: z.number().int().min(1).max(STAGES_PER_GRADE),
      }),
    )
    .query(({ input }) => {
      const island = ISLANDS.find((i) => i.subject === input.subject || i.id === input.subject);
      if (!island) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到這座島嶼' });
      }
      const questions = buildStage(island.subject, input.grade, input.stage);
      return {
        island: { id: island.id, name: island.name, subject: island.subject, emoji: island.emoji },
        grade: input.grade,
        stage: input.stage,
        difficulty: stageDifficulty(input.stage),
        questions,
      };
    }),
});

export type AppRouter = typeof appRouter;
