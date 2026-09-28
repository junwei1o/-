import { LETTERS } from './answerLetters';

/**
 * 題目情境回顧卡（題面快照）。
 *
 * 還原「學生剛才看到的完整題面」：
 * - 題幹、標籤（主題 / 題型 / 知識點）
 * - 當時凍結的選項順序（字母＋文字），正確與所選標記保留
 * - 標頭註明「第 N 題・作答快照」，與進度列的題號一致
 *
 * 為什麼是快照而不是圖片：選項每次挑戰都會重排，
 * 只有在作答瞬間凍結的順序才能準確對應到那一次作答；
 * DOM 快照具同等效果，又沒有圖片資源缺失與載入成本。
 */
export default function QuestionSnapshot({
  questionNumber,
  prompt,
  topic,
  questionType,
  knowledge,
  options,
  answer,
  picked,
  wasCorrect,
}: {
  questionNumber: number;
  prompt: string;
  topic?: string;
  questionType?: string;
  knowledge?: string[];
  options: string[];
  answer: number;
  picked: number;
  wasCorrect: boolean;
}) {
  return (
    <figure
      aria-label={`第 ${questionNumber} 題作答快照`}
      className="pop mt-5 overflow-hidden rounded-2xl border border-[#86e7dd]/25 bg-[#062033]/60"
    >
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[#86e7dd]">
          📸 第 {questionNumber} 題・作答快照
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            wasCorrect ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
          }`}
        >
          {wasCorrect ? '答對' : '答錯'}
        </span>
      </figcaption>

      <blockquote className="px-4 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {topic && <span className="tag">{topic}</span>}
          {questionType && <span className="tag">{questionType}</span>}
          {knowledge?.slice(0, 3).map((k) => (
            <span key={k} className="tag">
              {k}
            </span>
          ))}
        </div>
        <p className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-relaxed text-white">
          {prompt}
        </p>
      </blockquote>

      <ol className="space-y-2 px-4 py-4">
        {options.map((option, i) => {
          const isAnswer = i === answer;
          const isPicked = i === picked;
          return (
            <li
              key={i}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${
                isAnswer
                  ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-50'
                  : isPicked
                    ? 'border-rose-400/60 bg-rose-500/15 text-rose-50'
                    : 'border-white/10 bg-white/[0.03] text-slate-300'
              }`}
            >
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${
                  isAnswer
                    ? 'bg-emerald-400/40 text-emerald-100'
                    : isPicked
                      ? 'bg-rose-400/40 text-rose-100'
                      : 'bg-black/25 text-slate-300'
                }`}
                aria-hidden
              >
                {LETTERS[i]}
              </span>
              <span className="flex-1">{option}</span>
              {isAnswer && (
                <span className="shrink-0 text-xs font-bold text-emerald-300">正確</span>
              )}
              {isPicked && !isAnswer && (
                <span className="shrink-0 text-xs font-bold text-rose-300">你的選擇</span>
              )}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
