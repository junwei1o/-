import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { GRADES, ISLANDS, STAGES_PER_GRADE, stageKey } from '../../../shared/islands';
import { computeStats, loadProgress, nextStage } from '../lib/progress';
import Stars from '../components/Stars';

/**
 * 首頁＝島嶼地圖（極簡版）。
 *
 * 設計原則：一屏只看得到「要去哪」。
 * - 標題與一句話說明
 * - 有進度時放一張「繼續探險」卡（自動指向下一關）
 * - 四座島嶼卡片：emoji、名稱、一句話、通關進度條與星星
 * - 頁尾一個「學習紀錄」入口
 *
 * 所有進度都來自 localStorage（lib/progress），不發任何請求。
 */
export default function Home() {
  const [, navigate] = useLocation();
  const progress = useMemo(() => loadProgress(), []);
  const stats = useMemo(() => computeStats(progress), [progress]);
  const next = useMemo(() => nextStage(progress), [progress]);
  const nextIsland = ISLANDS.find((i) => i.id === next.islandId);
  const hasProgress = stats.attempts > 0;

  return (
    <div className="space-y-10">
      {/* ─── 標題 ─── */}
      <section className="rise pt-4 text-center sm:pt-8">
        <div className="bob text-6xl" aria-hidden>
          🏝️
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
          島嶼探險家
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
          四座島嶼、四個年級、96 個關卡。
          <br />
          選一座島，揚帆出發。
        </p>
      </section>

      {/* ─── 繼續探險（有進度才出現） ─── */}
      {hasProgress && nextIsland && (
        <section className="rise" style={{ animationDelay: '80ms' }}>
          <button
            type="button"
            onClick={() => navigate(`/quiz/${next.islandId}/${next.grade}/${next.stage}`)}
            className="panel-solid group flex w-full items-center gap-4 px-6 py-5 text-left transition hover:-translate-y-0.5 hover:border-[#ffc857]/50"
          >
            <span className="text-4xl" aria-hidden>
              ⛵
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#86e7dd]">
                繼續探險
              </span>
              <span className="mt-1 block truncate text-lg font-extrabold text-white">
                {nextIsland.name}・{next.grade} 年級・第 {next.stage} 關
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-[#ffc857] transition group-hover:translate-x-1">
              啟航 →
            </span>
          </button>
        </section>
      )}

      {/* ─── 島嶼地圖 ─── */}
      <section className="grid gap-4 sm:grid-cols-2" aria-label="選擇島嶼">
        {ISLANDS.map((island, index) => {
          const s = stats.byIsland.find((i) => i.islandId === island.id)!;
          const pct = Math.round((s.cleared / s.total) * 100);

          return (
            <Link
              key={island.id}
              href={`/island/${island.id}`}
              className="rise panel group block px-6 py-6 transition hover:-translate-y-1 hover:border-[#86e7dd]/40"
              style={{ animationDelay: `${140 + index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="bob text-5xl" aria-hidden>
                  {island.emoji}
                </span>
                <span className="tag">{island.subject}</span>
              </div>

              <h2 className="mt-4 text-xl font-extrabold text-white">{island.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{island.tagline}</p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    通關 {s.cleared}/{s.total}
                  </span>
                  <span className="font-bold text-[#ffc857]">
                    <Stars count={s.stars} size="text-sm" zero="dim" />
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${island.gradient} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 text-xs font-semibold text-[#86e7dd] opacity-0 transition group-hover:opacity-100">
                選擇年級，進入航線 →
              </div>
            </Link>
          );
        })}
      </section>

      {/* ─── 頁尾入口 ─── */}
      <section className="rise flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm" style={{ animationDelay: '440ms' }}>
        <p className="text-slate-400">
          進度保存在這台裝置的瀏覽器中，不需要註冊。
        </p>
        <Link href="/records" className="btn btn-ghost text-sm">
          學習紀錄
        </Link>
      </section>
    </div>
  );
}
