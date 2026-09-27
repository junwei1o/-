import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { GRADES, STAGES_PER_GRADE, islandById, stageKey } from '../../../shared/islands';
import { computeStats, loadProgress } from '../lib/progress';
import { trpc } from '../lib/trpc';

export default function IslandPage({ subject }: { subject: string }) {
  const [, navigate] = useLocation();
  const island = islandById(subject);
  const meta = trpc.meta.useQuery();
  const progress = useMemo(() => loadProgress(), []);
  const stats = useMemo(() => computeStats(progress), [progress]);

  if (!island) {
    return (
      <div className="panel px-6 py-10 text-center">
        <div className="text-4xl" aria-hidden>
          🌫️
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-white">這座島還不存在</h1>
        <p className="mt-2 text-sm text-slate-400">也許你打錯了網址，回到地圖重新出發吧。</p>
        <Link href="/" className="btn btn-primary mt-6 text-sm">
          回島嶼地圖
        </Link>
      </div>
    );
  }

  const islandMeta = meta.data?.find((i) => i.id === island.id);
  const islandStats = stats.byIsland.find((s) => s.islandId === island.id);

  return (
    <div className="space-y-8">
      <button type="button" className="btn btn-ghost text-sm" onClick={() => navigate('/')}>
        ← 回島嶼地圖
      </button>

      {/* ─── 島嶼介紹 ─── */}
      <section className={`rise panel-solid overflow-hidden`}>
        <div className={`bg-gradient-to-r ${island.gradient} px-6 py-8 sm:px-10`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="bob text-6xl" aria-hidden>
                {island.emoji}
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                  {island.subject} 領域
                </div>
                <h1 className="text-3xl font-extrabold text-white drop-shadow">{island.name}</h1>
                <p className="mt-1 max-w-md text-sm text-white/90">{island.tagline}</p>
              </div>
            </div>
            <div className="text-right text-white">
              <div className="text-3xl font-extrabold">{islandStats?.cleared ?? 0}</div>
              <div className="text-xs">
                ／ {islandStats?.total ?? GRADES.length * STAGES_PER_GRADE} 關已通關
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-5 sm:grid-cols-4 sm:px-10">
          {[
            { label: '題目總數', value: islandMeta ? `${islandMeta.total}` : '…' },
            { label: '已收集星星', value: `${islandStats?.stars ?? 0}` },
            { label: '年級航線', value: `${GRADES.length}` },
            { label: '關卡數', value: `${GRADES.length * STAGES_PER_GRADE}` },
          ].map((item) => (
            <div key={item.label} className="panel px-4 py-3 text-center">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{item.label}</div>
              <div className="mt-1 text-2xl font-extrabold text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 年級航線 ─── */}
      <section>
        <h2 className="text-xl font-extrabold text-white">選擇年級航線</h2>
        <p className="mt-1 text-sm text-slate-400">
          每條航線 6 個關卡：前 2 關打基礎、中間 2 關挑標準、最後 2 關攻深海。
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GRADES.map((grade, index) => {
            const gradeMeta = islandMeta?.grades.find((g) => g.grade === grade);
            // 原本 cleared / stars 各走一次 Array.from + filter/reduce（掃兩遍），
            // 改成單次迴圈同時算出兩個值。
            let cleared = 0;
            let stars = 0;
            for (let stage = 1; stage <= STAGES_PER_GRADE; stage++) {
              const record = progress.stages[stageKey(island.id, grade, stage)];
              if (!record) continue;
              if (record.cleared) cleared += 1;
              stars += record.stars;
            }
            const pct = Math.round((cleared / STAGES_PER_GRADE) * 100);

            return (
              <button
                key={grade}
                type="button"
                onClick={() => navigate(`/island/${island.id}/${grade}`)}
                className="panel group px-5 py-5 text-left transition hover:-translate-y-1 hover:border-[#ffc857]/50"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl" aria-hidden>
                    {['🌱', '🌿', '🌳', '🏔️'][index]}
                  </span>
                  <span className="tag">{grade} 年級</span>
                </div>

                <div className="mt-4 text-lg font-extrabold text-white">
                  第 {grade} 學年航線
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {gradeMeta ? `${gradeMeta.total} 題可挑戰` : '載入中…'}
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#86e7dd] to-[#ffc857]"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    通關 {cleared}/{STAGES_PER_GRADE}
                  </span>
                  <span className="font-bold text-[#ffc857]">★ {stars}</span>
                </div>

                <div className="mt-3 text-xs font-semibold text-[#86e7dd] opacity-0 transition group-hover:opacity-100">
                  進入航線 →
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
