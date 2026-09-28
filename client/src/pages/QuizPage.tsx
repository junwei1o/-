import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { STAGE_LABELS, islandById, stageDifficulty, stageKey, starFor } from '../../../shared/islands';
import Stars from '../components/Stars';
import { loadProgress, recordStage } from '../lib/progress';
import { nextOptionOrder } from '../lib/optionShuffler';
import { trpc } from '../lib/trpc';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * 路由入口：以 key 綁定關卡，換關時整段答題狀態重新掛載。
 *
 * 沒有這個 key 時，從結算頁按「下一關」只會更換 props，
 * index/picked/score/result 全部殘留，畫面會先閃一次上一關的結算結果。
 */
export default function QuizPage(props: { subject: string; grade: number; stage: number }) {
  return <QuizSession key={`${props.subject}-${props.grade}-${props.stage}`} {...props} />;
}

function QuizSession({
  subject,
  grade,
  stage,
}: {
  subject: string;
  grade: number;
  stage: number;
}) {
  const [, navigate] = useLocation();
  const island = islandById(subject);
  const valid = Boolean(island) && Number.isInteger(grade) && grade >= 3 && grade <= 6 && stage >= 1;

  const quiz = trpc.quiz.useQuery(
    { subject, grade, stage },
    { enabled: valid && stage >= 1 && stage <= 6 },
  );

  // 本次挑戰次數：從進度紀錄讀（同一關的第幾次挑戰）。
  // 每次挑戰（含看完解析後重新作答）都會遞增，選項順序隨之改變。
  const [attempt, setAttempt] = useState(() => {
    const key = stageKey(subject, grade, stage);
    return (loadProgress().stages[key]?.attempts ?? 0) + 1;
  });

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number; stars: number } | null>(null);

  const questions = quiz.data?.questions ?? [];
  const question = questions[index];
  const revealed = picked !== null;
  const isLast = index === questions.length - 1;

  // 選項順序：以「科目|年級|關卡|attempt」為種子逐題打亂。
  // 同一關每次挑戰順序都不同，且與上次保證不同（見 optionShuffler）。
  const seedKey = `${subject}|${grade}|${stage}`;
  const orders = useMemo(() => {
    if (!quiz.data) return [];
    return quiz.data.questions.map((q, i) => nextOptionOrder(q.options.length, i, seedKey, attempt));
  }, [quiz.data, attempt, seedKey]);

  const order = orders[index] ?? null;
  const displayOptions = order && question ? order.map((i) => question.options[i]) : [];
  const displayAnswer = order && question ? order.indexOf(question.answer) : -1;

  const difficulty = useMemo(() => stageDifficulty(stage), [stage]);

  // 累積星星只在結算畫面用到；原本每次 render 都 JSON.parse 整份 localStorage，
  // 改成 result 變動時才重算一次。
  const totalStars = useMemo(() => {
    const all = loadProgress().stages;
    let sum = 0;
    for (const record of Object.values(all)) sum += record.stars;
    return sum;
  }, [result]);

  if (!island || stage < 1 || stage > 6) {
    return (
      <div className="panel px-6 py-10 text-center">
        <div className="text-4xl" aria-hidden>
          🧭
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-white">找不到這個關卡</h1>
        <Link href="/" className="btn btn-primary mt-6 text-sm">
          回島嶼地圖
        </Link>
      </div>
    );
  }

  if (quiz.isLoading) {
    return (
      <div className="panel mx-auto max-w-2xl px-6 py-14 text-center">
        <div className="bob text-5xl" aria-hidden>
          ⛵
        </div>
        <p className="mt-4 text-slate-300">正在準備題目…</p>
      </div>
    );
  }

  if (quiz.isError || !quiz.data || !question) {
    return (
      <div className="panel mx-auto max-w-2xl px-6 py-10 text-center">
        <div className="text-4xl" aria-hidden>
          🌊
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-white">題目暫時取不到</h1>
        <p className="mt-2 text-sm text-slate-400">網路似乎不穩定，稍等一下再整理頁面。</p>
        <Link href={`/island/${island.id}/${grade}`} className="btn btn-primary mt-6 text-sm">
          回到航線
        </Link>
      </div>
    );
  }

  function pick(optionIndex: number) {
    if (revealed || result) return;
    setPicked(optionIndex);
    if (optionIndex === displayAnswer) setScore((s) => s + 1);
  }

  function next() {
    if (isLast) {
      const finalScore = score;
      const total = questions.length;
      const stars = starFor(finalScore, total);
      recordStage({
        islandId: island!.id,
        subject: island!.subject,
        grade,
        stage,
        score: finalScore,
        total,
      });
      setResult({ score: finalScore, total, stars });
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  function retry() {
    // 重新作答：attempt +1 → 選項順序改變，學生必須看內容而非位置
    setIndex(0);
    setPicked(null);
    setScore(0);
    setResult(null);
    setAttempt((a) => a + 1);
  }

  // ─── 結算畫面 ───
  if (result) {
    const hasNext = !(grade === 6 && stage === 6);
    const nextHref =
      stage < 6
        ? `/quiz/${island.id}/${grade}/${stage + 1}`
        : grade < 6
          ? `/quiz/${island.id}/${grade + 1}/1`
          : null;
    const message =
      result.stars === 3
        ? '完美靠岸！這條航線你已經完全掌握。'
        : result.stars === 2
          ? '表現很棒，再挑戰一次就能滿星。'
          : result.stars === 1
            ? '順利過關囉，把不熟的觀念再複習一次。'
            : '這次海況有點難，看完解析我們再出發一次。';

    return (
      <div className="rise panel-solid mx-auto max-w-2xl px-6 py-10 text-center sm:px-10">
        <div className="text-6xl" aria-hidden>
          {result.stars >= 2 ? '🏆' : result.stars === 1 ? '⛵' : '🧭'}
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
          {island.name}・第 {stage} 關 完成！
        </h1>
        <p className="mt-2 text-sm text-slate-300">{message}</p>

        <Stars count={result.stars} size="text-5xl" zero="dim" className="pop mt-6 block" />

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: '答對', value: `${result.score}/${result.total}` },
            { label: '正確率', value: `${Math.round((result.score / result.total) * 100)}%` },
            { label: '累積星星', value: `${totalStars}` },
          ].map((item) => (
            <div key={item.label} className="panel px-3 py-3">
              <div className="text-[11px] text-slate-400">{item.label}</div>
              <div className="mt-1 text-xl font-extrabold text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary text-sm" onClick={retry}>
            再挑戰一次
          </button>
          {hasNext && nextHref && (
            <button
              type="button"
              className="btn btn-ghost text-sm"
              onClick={() => navigate(nextHref)}
            >
              下一關 →
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => navigate(`/island/${island.id}/${grade}`)}
          >
            回航線
          </button>
        </div>
      </div>
    );
  }

  // ─── 答題畫面 ───
  const progressPct = Math.round((index / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* 導覽列 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/island/${island.id}/${grade}`} className="text-sm text-slate-400 hover:text-white">
          ← 離開航線
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="tag">
            {island.emoji} {island.name}
          </span>
          <span className="tag">
            {grade} 年級・{difficulty}
          </span>
        </div>
      </div>

      {/* 進度 */}
      <div className="panel px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-white">
            關卡 {stage}・第 {index + 1} / {questions.length} 題
          </span>
          <span className="text-[#ffc857]">已答對 {score} 題</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#86e7dd] to-[#ffc857] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {STAGE_LABELS[difficulty].title}海域・{STAGE_LABELS[difficulty].hint}
        </div>
      </div>

      {/* 題目 */}
      <div key={index} className="rise panel-solid px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {question.topic && <span className="tag">{question.topic}</span>}
          {question.questionType && <span className="tag">{question.questionType}</span>}
          {question.knowledge?.slice(0, 3).map((k) => (
            <span key={k} className="tag">
              {k}
            </span>
          ))}
        </div>

        <p className="mt-4 text-lg font-semibold leading-relaxed text-white sm:text-xl">
          {question.prompt}
        </p>

        <div className="mt-6 space-y-3">
          {displayOptions.map((option, optionIndex) => {
            const isPicked = picked === optionIndex;
            const isAnswer = optionIndex === displayAnswer;

            let style =
              'border-white/15 bg-white/5 hover:border-[#86e7dd]/60 hover:bg-white/10 text-slate-100';
            if (revealed && isAnswer) {
              style = 'border-emerald-400/70 bg-emerald-500/20 text-emerald-50';
            } else if (revealed && isPicked) {
              style = 'border-rose-400/70 bg-rose-500/20 text-rose-50';
            } else if (revealed) {
              style = 'border-white/10 bg-white/[0.03] text-slate-400';
            }

            return (
              <button
                key={optionIndex}
                type="button"
                onClick={() => pick(optionIndex)}
                disabled={revealed}
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${style}`}
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/25 text-sm font-black">
                  {LETTERS[optionIndex]}
                </span>
                <span className="text-[15px] leading-relaxed">{option}</span>
                {revealed && isAnswer && (
                  <span className="ml-auto shrink-0 text-sm font-bold text-emerald-300">正確</span>
                )}
                {revealed && isPicked && !isAnswer && (
                  <span className="ml-auto shrink-0 text-sm font-bold text-rose-300">你的答案</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 解析 */}
        {revealed && (
          <div className="pop mt-5 rounded-2xl border border-[#ffc857]/30 bg-[#ffc857]/10 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#ffc857]">
              <span aria-hidden>{picked === displayAnswer ? '✅' : '💡'}</span>
              {picked === displayAnswer ? '答對了！' : '差一點點，來看解析'}
            </div>
            {question.explanation && (
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {question.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary text-base"
          onClick={next}
          disabled={!revealed}
          style={{ opacity: revealed ? 1 : 0.5, cursor: revealed ? 'pointer' : 'not-allowed' }}
        >
          {isLast ? '看結果 🏁' : '下一題 →'}
        </button>
      </div>
    </div>
  );
}
