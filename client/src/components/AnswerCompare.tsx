import { charDiff, type DiffSeg } from '../lib/textDiff';
import { LETTERS } from './answerLetters';

function renderSegs(segs: DiffSeg[], tone: 'emerald' | 'rose') {
  return segs.map((seg, i) =>
    seg.diff ? (
      <mark
        key={i}
        className={
          tone === 'emerald'
            ? 'rounded bg-emerald-400/30 px-0.5 text-emerald-100'
            : 'rounded bg-rose-400/30 px-0.5 text-rose-100'
        }
      >
        {seg.text}
      </mark>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

/**
 * 答錯時的並排答案比較。
 *
 * 左（上）為正確答案、右（下）為你的答案：
 * - 徽章標出字母差異（B ≠ D），一眼對應到題面選項
 * - 兩邊文字做字級差異高亮，相同部分灰掉、差異部分亮起
 * - 手機直向堆疊、sm 以上並排（grid-cols-2）
 */
export default function AnswerCompare({
  correctLetter,
  correctText,
  pickedLetter,
  pickedText,
}: {
  correctLetter: string;
  correctText: string;
  pickedLetter: string;
  pickedText: string;
}) {
  const { a: correctSegs, b: pickedSegs } = charDiff(correctText, pickedText);

  return (
    <section
      aria-label="正確答案與你的答案比較"
      className="pop mt-5 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <span className="text-sm font-extrabold text-white">✅ 正確答案 vs 你的答案</span>
        <span
          aria-label={`正確答案是 ${correctLetter}，你選了 ${pickedLetter}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-black"
        >
          <span className="text-emerald-300">{correctLetter}</span>
          <span className="text-slate-400" aria-hidden>
            ≠
          </span>
          <span className="text-rose-300">{pickedLetter}</span>
        </span>
      </header>

      <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
        <div className="border-l-4 border-l-emerald-400 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/25 text-sm font-black text-emerald-200">
              {correctLetter}
            </span>
            <span className="text-xs font-bold text-emerald-300">正確答案</span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-emerald-50">
            {renderSegs(correctSegs, 'emerald')}
          </p>
        </div>
        <div className="border-l-4 border-l-rose-400 border-t border-t-white/10 px-4 py-4 sm:border-t-0">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-500/25 text-sm font-black text-rose-200">
              {pickedLetter}
            </span>
            <span className="text-xs font-bold text-rose-300">你的答案</span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-rose-50">
            {renderSegs(pickedSegs, 'rose')}
          </p>
        </div>
      </div>
    </section>
  );
}
