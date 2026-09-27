import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  QUESTIONS_PER_STAGE,
  STAGES_PER_GRADE,
  STAGE_LABELS,
  islandById,
  stageDifficulty,
  stageKey,
} from '../../../shared/islands';
import Stars from '../components/Stars';
import { loadProgress } from '../lib/progress';

const DIFFICULTY_STYLE: Record<string, string> = {
  基礎: 'from-sky-500/25 to-sky-700/10 border-sky-300/30',
  標準: 'from-amber-400/25 to-orange-600/10 border-amber-300/30',
  挑戰: 'from-rose-500/25 to-red-700/10 border-rose-300/30',
};

export default function StagesPage({ subject, grade }: { subject: string; grade: number }) {
  const [, navigate] = useLocation();
  const island = islandById(subject);
  const progress = useMemo(() => loadProgress(), []);

  if (!island || !Number.isInteger(grade) || grade < 3 || grade > 6) {
    return (
      <div className="panel px-6 py-10 text-center">
        <div className="text-4xl" aria-hidden>
          🧭
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-white">找不到這條航線</h1>
        <Link href="/" className="btn btn-primary mt-6 text-sm">
          回島嶼地圖
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-white">
          島嶼地圖
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/island/${island.id}`} className="hover:text-white">
          {island.name}
        </Link>
        <span aria-hidden>›</span>
        <span className="text-white">{grade} 年級航線</span>
      </nav>

      <section className="rise panel-solid px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="bob text-5xl" aria-hidden>
              {island.emoji}
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#86e7dd]">
                {island.subject}・{grade} 年級
              </div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                第 {grade} 學年航線
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                共 {STAGES_PER_GRADE} 關、每關 {QUESTIONS_PER_STAGE} 題，依難度分為淺灘、礁岩、深海。
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => navigate(`/island/${island.id}`)}
          >
            ← 換年級
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: STAGES_PER_GRADE }, (_, i) => i + 1).map((stage, index) => {
          const difficulty = stageDifficulty(stage);
          const label = STAGE_LABELS[difficulty];
          const record = progress.stages[stageKey(island.id, grade, stage)];
          const stars = record?.stars ?? 0;

          return (
            <button
              key={stage}
              type="button"
              onClick={() => navigate(`/quiz/${island.id}/${grade}/${stage}`)}
              className={`panel group relative overflow-hidden bg-gradient-to-br px-5 py-5 text-left transition hover:-translate-y-1 ${DIFFICULTY_STYLE[difficulty]}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    {difficulty}・{label.title}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-white">
                    關卡 {String(stage).padStart(2, '0')}
                  </div>
                </div>
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full text-lg font-black ${
                    record?.cleared
                      ? 'bg-[#ffc857] text-[#062033]'
                      : 'border border-white/25 bg-white/10 text-white'
                  }`}
                >
                  {record?.cleared ? '✓' : stage}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-300">{label.hint}</p>

              <div className="mt-4 flex items-center justify-between">
<Stars count={stars} size="text-lg" zero="dim" ariaLabel={`${stars} 顆星`} />
                <span className="text-xs text-slate-400">
                  {record
                    ? `最佳 ${record.best}/${QUESTIONS_PER_STAGE}・玩 ${record.attempts} 次`
                    : '尚未挑戰'}
                </span>
              </div>

              <div className="mt-3 text-xs font-semibold text-[#86e7dd] opacity-0 transition group-hover:opacity-100">
                {record?.cleared ? '再挑戰一次 →' : '開始挑戰 →'}
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
