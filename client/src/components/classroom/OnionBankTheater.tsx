/**
 * 洋蔥題庫劇場：五千題內建題庫 × 洋蔥動畫演出。
 *
 * 這是洋蔥學院的第三種學習形式——動畫課與分數工坊的題目都是寫死的內容，
 * 題庫劇場則是「庫存互相利用」：每次開演都從 5000 題的內建題庫抽一組題
 * （依學生的年級偏好與選定的科目），洋蔥吉祥物全程演出：
 * 出題時指著題目（point）、答對跳起來欢呼（cheer）、答錯歪頭想（think），
 * 並在每一題後演出「為什麼」——把詳解用字幕播出去。
 * 星級標準與其他玩法一致（gradeOnionLesson），成績一樣回寫教室最佳紀錄。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Home, Star, Clapperboard, ChevronRight, RotateCcw, Settings2, Lightbulb } from "lucide-react";
import { gradeOnionLesson, type OnionResult } from "@/game/onionAcademyLessons";
import { OnionMascot } from "@/components/classroom/OnionAcademyScenes";
import { buildChoiceDeck, type ClassroomChoice } from "@/lib/classroomBank";
import { loadLocalBank, LOCAL_QUESTION_BANK } from "@/lib/questionBank";
import { loadStudentGradePreference } from "@/lib/studentGradePreference";
import "@/components/classroom/classroom.css";

type Phase = "start" | "loading" | "quiz" | "result";

type Props = {
  bestStars?: number;
  onBest: (r: { stars: number; correct: number; total: number }) => void;
  onExit: () => void;
};

/** 每個科目「看過的最佳紀錄」（只往上寫，與動畫課的 lessonBest 同做法）。 */
const THEATER_BEST_KEY = "hdmx_onion_theater_best_v1";
type TheaterBest = { stars: number; correct: number; total: number; at: number };

function loadTheaterBest(): Record<string, TheaterBest> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(THEATER_BEST_KEY) ?? "{}") as Record<string, TheaterBest>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveTheaterBest(scope: string, best: TheaterBest) {
  if (typeof window === "undefined") return;
  try {
    const all = loadTheaterBest();
    const previous = all[scope];
    if (previous && previous.stars >= best.stars) return;
    all[scope] = best;
    window.localStorage.setItem(THEATER_BEST_KEY, JSON.stringify(all));
  } catch {
    /* localStorage 不可用就跳過，不影響演出 */
  }
}

const SUBJECT_OPTIONS = ["全部", "數學", "自然", "社會", "國語", "英語"] as const;
const COUNT_OPTIONS = [5, 10, 15] as const;

export default function OnionBankTheater({ bestStars, onBest, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("start");
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]>("全部");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(10);
  const [deck, setDeck] = useState<ClassroomChoice[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<OnionResult>({ stars: 0, correct: 0, total: 0, coins: 0 });
  const [theaterBest, setTheaterBest] = useState<Record<string, TheaterBest>>(() => loadTheaterBest());

  /** 吉祥物的動作：出題時指題目、答對歡呼、答錯歪頭想。 */
  const mascotAction = answered ? (selected === deck[qIdx]?.answer ? "cheer" : "think") : "point";
  const mascotTick = useRef(0);
  useEffect(() => {
    mascotTick.current += 1;
  }, [qIdx, answered]);

  const grade = typeof window === "undefined" ? null : loadStudentGradePreference();
  const q = deck[qIdx];
  const scopeKey = subject === "全部" ? "綜合" : subject;

  const startShow = async () => {
    setPhase("loading");
    // 題庫是動態載入的活陣列：第一次開演前確保 5000 題都讀進來了。
    if (LOCAL_QUESTION_BANK.length === 0) {
      await loadLocalBank();
    }
    const picked = buildChoiceDeck(count, subject === "全部" ? "綜合" : subject);
    setDeck(picked);
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setWrongPicks([]);
    setCorrectCount(0);
    setPhase("quiz");
  };

  const choose = (i: number) => {
    if (answered) return;
    if (wrongPicks.includes(i)) return;
    const isRight = i === q.answer;
    if (isRight) {
      setSelected(i);
      setAnswered(true);
      setCorrectCount((c) => c + 1);
    } else {
      // 答錯可以先再試一次（與動畫課闖關同款），第二次答對仍計分。
      setWrongPicks((w) => [...w, i]);
    }
  };

  const next = () => {
    if (qIdx >= deck.length - 1) {
      const r = gradeOnionLesson(correctCount, deck.length);
      setResult(r);
      saveTheaterBest(scopeKey, { stars: r.stars, correct: r.correct, total: r.total, at: Date.now() });
      setTheaterBest(loadTheaterBest());
      onBest({ stars: r.stars, correct: r.correct, total: r.total });
      setPhase("result");
      return;
    }
    setQIdx((i) => i + 1);
    setSelected(null);
    setAnswered(false);
    setWrongPicks([]);
  };

  const subjectChips = useMemo(
    () =>
      SUBJECT_OPTIONS.map((s) => {
        const key = s === "全部" ? "綜合" : s;
        const best = theaterBest[key];
        return { id: s, label: s, best: best ? `${best.stars}★` : null };
      }),
    [theaterBest],
  );

  /* ---------------- 開演前：選科目與題數 ---------------- */
  if (phase === "start" || phase === "loading") {
    return (
      <div className="ol-page">
        <div className="ol-top">
          <button type="button" className="ol-exit" onClick={onExit}><Home size={15} /> 回我的教室</button>
        </div>
        <div className="ol-summary">
          <div className="ol-summary-mascot" aria-hidden="true">
            <OnionMascot action="wave" frame={3} size={78} />
          </div>
          <span className="ol-tag"><Clapperboard size={14} /> 題庫劇場</span>
          <h2>五千題庫存，每次開演都不同</h2>
          <p className="ob-intro">
            這裡的題目不是寫死的——每一場都從全站 5000 題的題庫抽出來，
            {grade ? `並且配合你的年級（${grade} 年級）選題。` : "答錯沒關係，洋蔥會演出為什麼。"}
            答完每一題，洋蔥都會把「為什麼」演給你看。
          </p>
          <div className="ob-settings" role="group" aria-label="選擇科目">
            {subjectChips.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`ob-chip ${subject === s.id ? "is-on" : ""}`}
                onClick={() => setSubject(s.id)}
                aria-pressed={subject === s.id}
              >
                {s.label}
                {s.best && <small>{s.best}</small>}
              </button>
            ))}
          </div>
          <div className="ob-settings" role="group" aria-label="選擇題數">
            {COUNT_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`ob-chip ${count === c ? "is-on" : ""}`}
                onClick={() => setCount(c)}
                aria-pressed={count === c}
              >
                {c} 題
              </button>
            ))}
          </div>
          <div className="ol-start-btns">
            <button
              type="button"
              className="ol-btn ol-btn--primary"
              onClick={() => void startShow()}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? "題庫進場中…" : <>開始演出 <ChevronRight size={15} /></>}
            </button>
          </div>
          {typeof bestStars === "number" && bestStars > 0 && (
            <p className="ob-best">洋蔥學院目前最佳紀錄：{bestStars}★</p>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- 演出中：逐題問答 ---------------- */
  if (phase === "quiz" && q) {
    const isRight = answered && selected === q.answer;
    return (
      <div className="ol-page">
        <header className="ol-bar">
          <button type="button" className="ol-exit ol-exit--bar" onClick={onExit}><Home size={14} /> 離開</button>
          <span className="ol-bar-title"><Star size={16} /> 題庫劇場 — {scopeKey}</span>
          <span className="ol-quiz-progress">第 {qIdx + 1} / {deck.length} 題</span>
        </header>
        <div className="ol-quiz ob-quiz">
          <div className="ob-stage" aria-hidden="true">
            <OnionMascot action={mascotAction} frame={mascotTick.current} size={86} />
          </div>
          <div className="ob-meta">
            <span className="ob-meta-chip">{q.subject}</span>
            <span className="ob-meta-chip">{q.grade} 年級</span>
            <span className="ob-meta-chip">{q.learningTopic}</span>
          </div>
          <p className="ol-q-prompt" aria-live="polite">{q.prompt}</p>
          {!answered && wrongPicks.length > 0 && (
            <div className="ol-hint" role="status">
              <Lightbulb size={13} /> 這個不對，再想一想！（答錯不扣分）
            </div>
          )}
          <div className="ol-q-options">
            {q.options.map((opt, i) => {
              const isWrongPick = wrongPicks.includes(i);
              const cls = answered
                ? i === q.answer
                  ? "ol-opt ol-opt--right"
                  : isWrongPick
                    ? "ol-opt ol-opt--wrong"
                    : "ol-opt"
                : isWrongPick
                  ? "ol-opt ol-opt--wrong"
                  : "ol-opt";
              return (
                <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={answered || isWrongPick}>
                  {opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="ob-explain" role="status" aria-live="polite">
              <p className={`ob-explain-head ${isRight ? "is-ok" : "is-warn"}`}>
                {isRight ? "答對了！洋蔥給你拍拍手" : "沒關係，記住這個就好"}
              </p>
              <p className="ob-explain-body">{q.explanation}</p>
              <button type="button" className="ol-btn ol-btn--primary" onClick={next}>
                {qIdx >= deck.length - 1 ? "看結果" : "下一題"} <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- 謝幕：結算獎勵 ---------------- */
  return (
    <div className="ol-page">
      <div className="ol-top">
        <button type="button" className="ol-exit" onClick={onExit}><Home size={15} /> 回我的教室</button>
      </div>
      <div className="ol-summary">
        <div className="ol-summary-mascot" aria-hidden="true">
          <OnionMascot action={result.stars >= 2 ? "cheer" : "wave"} frame={7} size={78} />
        </div>
        <span className="ol-tag"><Star size={14} /> 本場演出結束</span>
        <h2>{scopeKey} · {result.correct} / {result.total} 題答對</h2>
        <p className="ob-result-stars" aria-label={`${result.stars} 顆星`}>
          {"★".repeat(result.stars)}{"☆".repeat(3 - result.stars)}
        </p>
        <p className="ob-result-coins">獲得 {result.coins} 金幣</p>
        <div className="ol-start-btns">
          <button type="button" className="ol-btn ol-btn--primary" onClick={() => void startShow()}>
            <RotateCcw size={14} /> 再來一場（新題目）
          </button>
          <button type="button" className="ol-btn ol-btn--ghost" onClick={() => setPhase("start")}>
            <Settings2 size={14} /> 換科目與題數
          </button>
        </div>
      </div>
    </div>
  );
}
