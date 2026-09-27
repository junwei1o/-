import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  ISLANDS,
  QUESTIONS_PER_STAGE,
  STAGES_PER_GRADE,
  islandById,
} from '../../../shared/islands';
import {
  computeStats,
  loadProgress,
  resetProgress,
  type HistoryItem,
} from '../lib/progress';
import Stars from '../components/Stars';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export default function RecordsPage() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = useMemo(() => computeStats(progress), [progress]);

  const history = progress.history as HistoryItem[];

  return (
    <div className="space-y-8">
      <section className="rise panel-solid px-6 py-8 sm:px-10">
        <span className="tag">學習紀錄</span>
        <h1 className="mt-3 text-3xl font-extrabold text-white">你的航海日誌</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          所有紀錄都保存在這台裝置的瀏覽器中，不會上傳。換裝置或清除瀏覽器資料後會重新開始。
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: '完成度', value: `${stats.percent}%` },
            { label: '通關關卡', value: `${stats.clearedStages}/${stats.totalStages}` },
            { label: '星星數', value: `${stats.stars}` },
            { label: '答題正確率', value: `${stats.accuracy}%` },
            { label: '挑戰次數', value: `${stats.attempts}` },
          ].map((item) => (
            <div key={item.label} className="panel px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{item.label}</div>
              <div className="mt-1 text-2xl font-extrabold text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#86e7dd] to-[#ffc857] transition-all duration-700"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </section>

      {/* ─── 各科表現 ─── */}
      <section>
        <h2 className="text-xl font-extrabold text-white">各島表現</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {ISLANDS.map((island) => {
            const s = stats.byIsland.find((i) => i.islandId === island.id)!;
            const accuracy = s.answered === 0 ? 0 : Math.round((s.correct / s.answered) * 100);

            return (
              <Link
                key={island.id}
                href={`/island/${island.id}`}
                className="panel block px-5 py-5 transition hover:-translate-y-1 hover:border-[#86e7dd]/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden>
                      {island.emoji}
                    </span>
                    <div>
                      <div className="font-extrabold text-white">{island.name}</div>
                      <div className="text-xs text-slate-400">{island.subject} 領域</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-white">
                      {s.cleared}/{s.total}
                    </div>
                    <div className="text-[11px] text-slate-400">關卡通關</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>正確率</span>
                    <span className="font-bold text-white">{s.answered ? `${accuracy}%` : '—'}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#86e7dd] to-[#ffc857]"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>星星</span>
                    <span className="font-bold text-[#ffc857]">
                      {s.stars} / {s.maxStars}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── 最近紀錄 ─── */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">最近挑戰</h2>
            <p className="mt-1 text-sm text-slate-400">保留最近 {history.length} 筆紀錄</p>
          </div>
          {stats.attempts > 0 && (
            <button
              type="button"
              className="btn btn-ghost text-sm text-rose-200"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                setProgress(resetProgress());
                setConfirmReset(false);
              }}
              onBlur={() => setConfirmReset(false)}
            >
              {confirmReset ? '再按一次確定清除全部進度' : '清除全部進度'}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="panel mt-4 px-6 py-10 text-center">
            <div className="text-4xl" aria-hidden>
              📭
            </div>
            <p className="mt-3 text-slate-300">還沒有任何紀錄，先去打第一關吧！</p>
            <Link href="/" className="btn btn-primary mt-5 text-sm">
              回島嶼地圖
            </Link>
          </div>
        ) : (
          <div className="panel mt-4 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">時間</th>
                  <th className="px-4 py-3 font-semibold">島嶼</th>
                  <th className="px-4 py-3 font-semibold">關卡</th>
                  <th className="px-4 py-3 font-semibold">成績</th>
                  <th className="px-4 py-3 font-semibold">星星</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.slice(0, 15).map((item, i) => {
                  const isl = islandById(item.islandId);
                  return (
                    <tr key={`${item.key}-${item.at}-${i}`} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-400">{formatDate(item.at)}</td>
                      <td className="px-4 py-3 text-white">
                        <span aria-hidden>{isl?.emoji}</span> {isl?.name ?? item.subject}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.grade} 年級・關卡 {item.stage}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {item.score}/{item.total}
                      </td>
                      <td className="px-4 py-3">
                        <Stars count={item.stars} size="text-sm" zero="dim" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-500">
        每個關卡固定 {QUESTIONS_PER_STAGE} 題、每條航線 {STAGES_PER_GRADE} 關，
        四座島嶼共 {stats.totalStages} 關。
      </p>
    </div>
  );
}
