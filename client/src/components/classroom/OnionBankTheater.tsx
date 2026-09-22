/**
 * 洋蔥題庫劇場：五千題內建題庫 × 洋蔥動畫演出。
 *
 * 這是洋蔥學院的第三種學習形式——動畫課與分數工坊的題目都是寫死的內容，
 * 題庫劇場則是「庫存互相利用」：每次開演都從 5000 題的內建題庫依「基礎→標準→挑戰」
 * 難度梯度抽一組題（配合學生的年級偏好與選定的科目），洋蔥吉祥物全程演出：
 * 出題時指著題目（point）、答對跳起來歡呼（cheer）、答錯歪頭想（think）。
 *
 * 教學加深（與動畫課／分數工坊對齊）：
 *  - 開演前先給「本場學習地圖」：這一場會練到哪些知識點、難度如何遞進。
 *  - 答錯採三級提示：第一次給知識點方向、第二次給更具體的線索、第三次才公布答案並講解，
 *    不再只說「再想一想」。
 *  - 每題標示難度與知識點；答完一題把「為什麼」用字幕播出去。
 *  - 謝幕時做「錯題回顧」：把本場沒能自己答對的題連正解、知識點、詳解列出來複習。
 * 星級標準與其他玩法一致（gradeOnionLesson），成績一樣回寫教室最佳紀錄。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Home, Star, Clapperboard, ChevronRight, RotateCcw, Settings2, Lightbulb, Map, BookOpenCheck, BookX } from "lucide-react";
import { gradeOnionLesson, type OnionResult } from "@/game/onionAcademyLessons";
import { OnionMascot } from "@/components/classroom/OnionAcademyScenes";
import { buildTheaterDeck, type ClassroomChoice } from "@/lib/classroomBank";
import { loadLocalBank, LOCAL_QUESTION_BANK } from "@/lib/questionBank";
import { loadStudentGradePreference } from "@/lib/studentGradePreference";
import {
  loadAdaptiveProfile,
  recordAdaptiveAttempt,
  saveAdaptiveProfile,
  type AdaptiveDifficulty,
} from "@/game/adaptiveLearning";
import "@/components/classroom/classroom.css";

type Phase = "start" | "loading" | "briefing" | "quiz" | "result";

type Props = {
  bestStars?: number;
  onBest: (r: { stars: number; correct: number; total: number }) => void;
  onExit: () => void;
};

/** 答錯第三次公布答案的門檻（前兩次給提示、第三次公布）。 */
const REVEAL_AT_WRONG = 3;

/** 每個科目「看過的最佳紀錄」（只往上寫，與動畫課的 lessonBest 同做法）。 */
const THEATER_BEST_KEY = "hdmx_onion_theater_best_v1";
type TheaterBest = { stars: number; correct: number; total: number; at: number };

/** 錯題回顧列：記錄本場沒能自己答對、最後由系統公布答案的題。 */
type ReviewItem = { q: ClassroomChoice };

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

const DIFFICULTY_LABEL: Record<string, string> = {
  基礎: "基礎",
  標準: "標準",
  挑戰: "挑戰",
};

export default function OnionBankTheater({ bestStars, onBest, onExit }: Props) {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>("start");
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]>("全部");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(10);
  const [deck, setDeck] = useState<ClassroomChoice[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  /** 本題是否因連錯三次而由系統公布答案（沒有自己答對）。 */
  const [revealed, setRevealed] = useState(false);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [result, setResult] = useState<OnionResult>({ stars: 0, correct: 0, total: 0, coins: 0 });
  const [theaterBest, setTheaterBest] = useState<Record<string, TheaterBest>>(() => loadTheaterBest());

  /** 吉祥物的動作：出題時指題目、答對歡呼、答錯歪頭想。 */
  const mascotAction = answered ? (revealed ? "think" : "cheer") : "point";
  const mascotTick = useRef(0);
  useEffect(() => {
    mascotTick.current += 1;
  }, [qIdx, answered]);

  const grade = typeof window === "undefined" ? null : loadStudentGradePreference();
  const q = deck[qIdx];
  const scopeKey = subject === "全部" ? "綜合" : subject;

  /**
   * 把一題的最終結果寫入自適應檔案（與試卷系統同一個資料源）：
   * 連錯三次、由系統公布答案的題 correct:false，會自動收進「錯題本」供日後重練；
   * 自己答對的題 correct:true，並記錄用了幾次提示。
   */
  const recordAttempt = (item: ClassroomChoice, correct: boolean, hintsUsed: number) => {
    const difficulty: AdaptiveDifficulty =
      item.difficulty === "挑戰" ? "挑戰" : item.difficulty === "標準" ? "標準" : "基礎";
    let profile = loadAdaptiveProfile();
    profile = recordAdaptiveAttempt(profile, {
      questionId: item.id,
      curriculumDomain: item.subject,
      knowledge: item.knowledge?.length ? item.knowledge : [item.learningTopic],
      difficulty,
      correct,
      responseMs: 25_000,
      timeLimitMs: 25_000,
      hintsUsed,
      flagged: false,
      ...(correct ? {} : { errorType: "concept" as const }),
    });
    saveAdaptiveProfile(profile);
  };

  /** 本場學習地圖：把抽到的題按學習主題去重，做為開演前的學習目標。 */
  const briefingTopics = useMemo(() => {
    const seen = new Set<string>();
    const topics: string[] = [];
    for (const item of deck) {
      const t = item.learningTopic?.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        topics.push(t);
      }
    }
    return topics.slice(0, 8);
  }, [deck]);

  const startShow = async () => {
    setPhase("loading");
    // 題庫是動態載入的活陣列：第一次開演前確保 5000 題都讀進來了。
    if (LOCAL_QUESTION_BANK.length === 0) {
      await loadLocalBank();
    }
    // 難度梯度組卷：基礎→標準→挑戰，由淺到深。
    const picked = buildTheaterDeck(count, subject === "全部" ? "綜合" : subject);
    setDeck(picked);
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setRevealed(false);
    setWrongPicks([]);
    setCorrectCount(0);
    setReview([]);
    setPhase("briefing");
  };

  const choose = (i: number) => {
    if (answered) return;
    if (wrongPicks.includes(i)) return;
    const isRight = i === q.answer;
    if (isRight) {
      setSelected(i);
      setAnswered(true);
      setRevealed(false);
      setCorrectCount((c) => c + 1);
      // 自己答對（含前面錯過、最後答對）：記一題 correct，並帶上用了幾次提示。
      recordAttempt(q, true, wrongPicks.length);
    } else {
      const nextWrong = [...wrongPicks, i];
      setWrongPicks(nextWrong);
      // 前兩次答錯給分層提示、可再試；第三次仍錯就公布正解、帶入錯題回顧（不計分）。
      if (nextWrong.length >= REVEAL_AT_WRONG) {
        setSelected(q.answer);
        setAnswered(true);
        setRevealed(true);
        setReview((list) => [...list, { q }]);
        // 連錯三次公布答案：記一題 wrong，自動收進錯題本。
        recordAttempt(q, false, REVEAL_AT_WRONG);
      }
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
    setRevealed(false);
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
            這裡的題目不是寫死的——每一場都從全站 5000 題的題庫，按「基礎→標準→挑戰」循序抽出來，
            {grade ? `並且配合你的年級（${grade} 年級）選題。` : "難度會一題題往上加。"}
            答錯有兩次提示引導，答完每一題，洋蔥都會把「為什麼」演給你看。
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

  /* ---------------- 開演前：本場學習地圖 ---------------- */
  if (phase === "briefing") {
    return (
      <div className="ol-page">
        <div className="ol-top">
          <button type="button" className="ol-exit" onClick={onExit}><Home size={15} /> 回我的教室</button>
        </div>
        <div className="ol-summary">
          <div className="ol-summary-mascot" aria-hidden="true">
            <OnionMascot action="point" frame={4} size={78} />
          </div>
          <span className="ol-tag"><Map size={14} /> 本場學習地圖</span>
          <h2>{scopeKey} · {deck.length} 題，由淺到深</h2>
          <p className="ob-intro">
            這一場會從「基礎」暖身，進到「標準」熟練，再用「挑戰」題驗收。先看看等等會練到哪些重點：
          </p>
          <div className="ob-brief-topics" role="list">
            {briefingTopics.map((t) => (
              <span key={t} className="ob-brief-topic" role="listitem">{t}</span>
            ))}
          </div>
          <ul className="ob-brief-flow">
            <li><b>基礎題</b>先建立觀念</li>
            <li><b>標準題</b>熟練作法</li>
            <li><b>挑戰題</b>活用與跨單元</li>
          </ul>
          <p className="ob-brief-tip">
            <Lightbulb size={13} /> 答錯別緊張：洋蔥會先提示兩次，真的不會再公布答案，結束還能複習錯題。
          </p>
          <div className="ol-start-btns">
            <button type="button" className="ol-btn ol-btn--primary" onClick={() => setPhase("quiz")}>
              開始答題 <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 演出中：逐題問答 ---------------- */
  if (phase === "quiz" && q) {
    const isRight = answered && !revealed;
    const hintLevel = wrongPicks.length;
    const hintText = !answered
      ? hintLevel === 1
        ? q.knowledge?.[0]
          ? `提示一：這題考的是「${q.knowledge[0]}」，先從這個方向想一想。`
          : `提示一：先回到「${q.learningTopic}」的基本觀念，再比對選項。`
        : hintLevel === 2
          ? q.knowledge?.[1]
            ? `提示二：再注意「${q.knowledge[1]}」這個關鍵，錯誤選項常在這裡設陷阱。`
            : `提示二：把題目條件逐項套入「${q.learningTopic}」的作法，刪掉明顯不符的選項。`
          : null
      : null;
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
            <span className={`ob-meta-chip ob-diff ob-diff--${q.difficulty}`}>
              {DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}
            </span>
            <span className="ob-meta-chip">{q.learningTopic}</span>
            {q.knowledge?.map((k) => (
              <span key={k} className="ob-meta-chip ob-knowledge">{k}</span>
            ))}
            {q.subjectCombination && (
              <span className="ob-meta-chip ob-meta-chip--cross">
                跨科：{q.subjectCombination.join("．")}
              </span>
            )}
          </div>
          <p className="ol-q-prompt" aria-live="polite">{q.prompt}</p>
          {!answered && hintText && (
            <div className={`ol-hint ob-hint ob-hint--l${hintLevel}`} role="status">
              <Lightbulb size={13} /> {hintText}
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
                {isRight ? "答對了！洋蔥給你拍拍手" : "別灰心，洋蔥把這題演給你看"}
              </p>
              {q.knowledge && q.knowledge.length > 0 && (
                <p className="ob-explain-knowledge">
                  <BookOpenCheck size={13} /> 知識點：{q.knowledge.join("、")}
                </p>
              )}
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

  /* ---------------- 謝幕：結算獎勵＋錯題回顧 ---------------- */
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

        {review.length > 0 ? (
          <div className="ob-review" aria-label="錯題回顧">
            <p className="ob-review-head"><BookOpenCheck size={14} /> 錯題回顧（{review.length} 題，建議再讀一次詳解）</p>
            <ol className="ob-review-list">
              {review.map((item, idx) => (
                <li key={`${item.q.id}-${idx}`} className="ob-review-item">
                  <p className="ob-review-q">{idx + 1}. {item.q.prompt}</p>
                  <p className="ob-review-a">
                    正解：{item.q.options[item.q.answer]}
                    {item.q.knowledge && item.q.knowledge.length > 0 && (
                      <span className="ob-review-k"> · {item.q.knowledge.join("、")}
                    </span>
                    )}
                  </p>
                  <p className="ob-review-e">{item.q.explanation}</p>
                </li>
              ))}
            </ol>
            <div className="ob-review-saved">
              <p className="ob-review-saved-txt"><BookX size={14} /> 這 {review.length} 題已自動收進「錯題本」，日後可到錯題重練再考一次。</p>
              <button
                type="button"
                className="ol-btn ol-btn--ghost ob-review-gobtn"
                onClick={() => setLocation("/wrong-answers")}
              >
                <BookX size={14} /> 前往錯題本
              </button>
            </div>
          </div>
        ) : (
          <p className="ob-review-allok"><BookOpenCheck size={14} /> 全部自己答對，沒有錯題，太厲害了！</p>
        )}

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
