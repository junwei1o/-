/**
 * 洋蔥學院風格動畫講解教室玩法。
 *
 * 流程：選課 → 課程簡介 → 動畫講解（分鏡播放器）→ 闖關練習（5 題）→ 結算獎勵。
 * 動畫與題目均由 onionLesson.ts 的 lesson 數據驅動，新增知識點只需換一份 lesson。
 * 教具渲染也是可擴展的：StageProp 依 prop.kind 分派到對應元件。
 * 成績透過 onBest 回寫教室最佳紀錄（與其他玩法一致的 3★ 標準）。
 */
import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles, Star, ChevronRight, Play, Pause, Home, GraduationCap, ArrowLeft, BookOpen, Lightbulb, SkipForward, ListChecks } from "lucide-react";
import {
  ONION_LESSONS,
  type OnionStage,
  getOnionLesson,
  gradeOnionLesson,
  type OnionFrame,
} from "@/game/onionAcademyLessons";
import "@/components/classroom/classroom.css";
import { LessonStage, OnionMascot } from "@/components/classroom/OnionAcademyScenes";
import { loadStudentGradePreference } from "@/lib/studentGradePreference";
import { useClassroomSound } from "./useClassroomSound";
import { shuffleQuestionOptions } from "@/lib/optionRandomizer";

type Phase = "start" | "intro" | "lesson" | "summary" | "quiz" | "result";

type Props = {
  bestStars?: number;
  /** 靜音（教室有全域靜音開關時傳入）。 */
  muted?: boolean;
  onBest: (r: { stars: number; correct: number; total: number }) => void;
  onExit: () => void;
};

/** 每一堂課的最佳紀錄（原本只有整個玩法一個最好成績，無法標記「這堂學過沒」）。 */
const LESSON_BEST_KEY = "hdmx_onion_lesson_best_v1";
type LessonBest = { stars: number; correct: number; total: number; at: number };

function loadLessonBest(): Record<string, LessonBest> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_BEST_KEY) ?? "{}") as Record<string, LessonBest>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLessonBest(lessonId: string, best: LessonBest) {
  if (typeof window === "undefined") return;
  try {
    const all = loadLessonBest();
    const previous = all[lessonId];
    if (previous && previous.stars >= best.stars) return; // 只往上寫
    all[lessonId] = best;
    window.localStorage.setItem(LESSON_BEST_KEY, JSON.stringify(all));
  } catch {
    /* localStorage 不可用就不標記，不影響上課 */
  }
}

/* ===================== 主元件 ===================== */
export default function OnionLessonGame({ bestStars, muted = false, onBest, onExit }: Props) {
  const play = useClassroomSound(muted);
  const [lessonId, setLessonId] = useState<string>(ONION_LESSONS[0].id);
  const lesson = getOnionLesson(lessonId);
  const reducedMotion = useRef(false);
  if (typeof window !== "undefined" && window.matchMedia) {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** 每一堂課的最佳紀錄（選課頁標記已學過與星數）。 */
  const [lessonBest, setLessonBest] = useState<Record<string, LessonBest>>(() => loadLessonBest());
  /** 選課頁科目篩選。 */
  const [subjectFilter, setSubjectFilter] = useState<string>("全部");
  /** 選課頁學段分流：國中生進站不會再被國小課淹沒。 */
  const [stage, setStage] = useState<OnionStage | "全部">(() => {
    const grade = typeof window === "undefined" ? null : loadStudentGradePreference();
    return grade && grade >= 7 ? "國中" : "國小";
  });
  const visibleLessons = ONION_LESSONS.filter(
    (l) =>
      (stage === "全部" || l.stages.includes(stage)) &&
      (subjectFilter === "全部" || l.subject === subjectFilter),
  );

  const [phase, setPhase] = useState<Phase>("start");
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState(gradeOnionLesson(0, lesson.questions.length));
  /** 已問過的分鏡（避免回到同一幀又問一次）。 */
  const [asked, setAsked] = useState<number[]>([]);
  const [askPicked, setAskPicked] = useState<number | null>(null);
  /** 闖關：本題已錯幾次（驅動逐級提示）。 */
  const [quizWrong, setQuizWrong] = useState<number[]>([]);

  /** 每次進場洗牌選項，避免正解固定在同一個位置。 */
  const quizPool = React.useMemo(
    () => lesson.questions.map((q) => shuffleQuestionOptions(q)),
    [lesson],
  );
  const frame: OnionFrame = lesson.frames[frameIdx];
  const isLastFrame = frameIdx >= lesson.frames.length - 1;
  /** 這一幀有「停下來問學生」且還沒問過 → 先暫停播放。 */
  const needAsk = Boolean(frame.ask) && !asked.includes(frameIdx);
  const q = quizPool[qIdx];

  // 分鏡自動推進
  useEffect(() => {
    if (phase !== "lesson" || !playing || needAsk) return;
    // 字幕長的幀要停久一點：孩子讀中文約 5–6 字／秒，
    // 固定 2.6 秒的幀配上 30 字字幕會來不及讀完就跳走。
    const needRead = Math.min(1800 + frame.caption.length * 110, 7000);
    const dur = reducedMotion.current
      ? Math.min(Math.max(frame.duration, needRead), 900)
      : Math.max(frame.duration, needRead);
    const t = setTimeout(() => {
      if (isLastFrame) {
        setPlaying(false);
      } else {
        setFrameIdx((i) => i + 1);
      }
    }, dur);
    return () => clearTimeout(t);
  }, [phase, playing, frameIdx, frame.duration, frame.caption, isLastFrame, needAsk]);

  const pickLesson = (id: string) => {
    setLessonId(id);
    setPhase("intro");
  };
  const startLesson = () => {
    setFrameIdx(0);
    setAsked([]);
    setAskPicked(null);
    setPlaying(true);
    setPhase("lesson");
  };
  /** 答對（或略過）這一幀的提問，繼續播放。 */
  const resolveAsk = (picked: number | null) => {
    if (frame.ask && picked !== null) {
      if (picked === frame.ask.answer) play("ok");
      else play("no");
    }
    setAskPicked(picked);
    setAsked((prev) => (prev.includes(frameIdx) ? prev : [...prev, frameIdx]));
    setPlaying(true);
  };
  /** 中途提問作答：答對才繼續，答錯給提示可再試（不扣分）。 */
  const pickAsk = (i: number) => {
    if (!frame.ask) return;
    if (i === frame.ask.answer) {
      play("ok");
      resolveAsk(i);
      return;
    }
    play("no");
    setAskPicked(i);
  };
  const goSummary = () => {
    play("flip");
    setPhase("summary");
  };
  const togglePlay = () => {
    if (isLastFrame && !playing) {
      setFrameIdx(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };
  const goQuiz = () => {
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setQuizWrong([]);
    setPhase("quiz");
  };
  const choose = (i: number) => {
    if (answered) return;
    if (quizWrong.includes(i)) return; // 已排除的錯誤選項
    if (i === q.answer) {
      play("ok");
      setSelected(i);
      setAnswered(true);
      // 只有「第一次就答對」才計入成績（與洋蔥分層微課一致）
      if (quizWrong.length === 0) setCorrectCount((c) => c + 1);
      return;
    }
    play("no");
    setQuizWrong((prev) => (prev.includes(i) ? prev : [...prev, i]));
  };
  const nextQ = () => {
    setQuizWrong([]);
    if (qIdx >= lesson.questions.length - 1) {
      const r = gradeOnionLesson(correctCount, lesson.questions.length);
      setResult(r);
      onBest({ stars: r.stars, correct: r.correct, total: r.total });
      const record = { stars: r.stars, correct: r.correct, total: r.total, at: Date.now() };
      saveLessonBest(lesson.id, record);
      setLessonBest((prev) => ({ ...prev, [lesson.id]: record }));
      setPhase("result");
      return;
    }
    setQIdx((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  };

  /* ---------------- 選課介面 ---------------- */
  if (phase === "start") {
    return (
      <div className="ol-page">
        <div className="ol-top">
          <button type="button" className="ol-exit" onClick={onExit}><Home size={15} /> 回我的教室</button>
        </div>
        <div className="ol-picker">
          <header className="ol-picker-head">
            <span className="ol-tag"><BookOpen size={14} /> 洋蔥動畫講解</span>
            <h2>選一門動畫課</h2>
            <p className="ol-desc">每堂約 5 分鐘：先看動畫講解，再闖 5 題。答對即時解析，全對三顆星。</p>
          </header>
          <div className="ol-stage-tabs" role="tablist" aria-label="依學段篩選課程">
            {(["國小", "國中", "全部"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={stage === item}
                className={`ol-stage-tab ${stage === item ? "is-active" : ""}`}
                onClick={() => setStage(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="ol-subject-chips" role="group" aria-label="依科目篩選課程">
            {["全部", "數學", "國語", "自然"].map((item) => (
              <button
                key={item}
                type="button"
                className={`ol-subject-chip ${subjectFilter === item ? "is-active" : ""}`}
                aria-pressed={subjectFilter === item}
                onClick={() => setSubjectFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="ol-stage-count">
            {visibleLessons.length
              ? `共 ${visibleLessons.length} 堂課${lessonBest && Object.keys(lessonBest).length ? ` · 已學過 ${visibleLessons.filter((l) => lessonBest[l.id]).length} 堂` : ""}`
              : "這個組合目前沒有課程"}
          </p>
          <div className="ol-picker-grid">
            {visibleLessons.map((l) => {
              const color = subjectColor(l.subject);
              return (
                <button
                  key={l.id}
                  type="button"
                  className="ol-lesson-card"
                  style={{ ["--lc" as string]: color }}
                  onClick={() => pickLesson(l.id)}
                >
                  <span className="ol-lc-top">
                    <span className="ol-lc-subject" style={{ background: color }}>{l.subject}</span>
                    {lessonBest[l.id] ? (
                      <span className="ol-lc-learned" role="img" aria-label={`已學過，最佳 ${lessonBest[l.id].stars} 顆星`}>
                        <Star size={12} aria-hidden="true" /> {lessonBest[l.id].stars}★
                      </span>
                    ) : null}
                  </span>
                  <span className="ol-lc-title">{l.title}</span>
                  <span className="ol-lc-meta">{l.grade} · {l.topic}</span>
                  <span className="ol-lc-desc">{l.desc}</span>
                  <span className="ol-lc-cta">開始 <ChevronRight size={14} /></span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 課程簡介 ---------------- */
  if (phase === "intro") {
    return (
      <div className="ol-page">
        <div className="ol-top">
          <button type="button" className="ol-exit" onClick={onExit}><Home size={15} /> 回我的教室</button>
        </div>
        <div className="ol-start">
          <div className="ol-start-mascot" aria-hidden="true">
            <OnionMascot action="wave" frame={0} />
          </div>
          <span className="ol-tag">{lesson.subject}動畫講解</span>
          <h2>{lesson.title}</h2>
          <p className="ol-subject-line">{lesson.grade} · {lesson.subject} · {lesson.topic}</p>
          <p className="ol-desc">{lesson.desc}</p>
          <ul className="ol-rules">
            <li><Play size={14} /> 先看 {lesson.frames.length} 幀動畫講解（約 2 分鐘）</li>
            <li><Star size={14} /> 再闖 {lesson.questions.length} 題練習</li>
            <li><Sparkles size={14} /> 答對即時解析，全對三顆星</li>
          </ul>
          {bestStars ? <p className="ol-best">最佳紀錄 {bestStars}★</p> : <p className="ol-best ol-best--new">尚未留下紀錄</p>}
          <div className="ol-start-btns">
            <button type="button" className="ol-btn ol-btn--primary" onClick={startLesson}>
              <Play size={16} /> 開始動畫講解
            </button>
            <button type="button" className="ol-btn ol-btn--ghost" onClick={goQuiz}>
              跳過動畫，直接闖關 <ChevronRight size={15} />
            </button>
          </div>
          <button type="button" className="ol-exit" onClick={() => setPhase("start")}><ArrowLeft size={14} /> 換一堂課</button>
        </div>
      </div>
    );
  }

  /* ---------------- 動畫講解 ---------------- */
  if (phase === "lesson") {
    return (
      <div className="ol-page">
        <header className="ol-bar">
          <button type="button" className="ol-exit ol-exit--bar" onClick={onExit}><Home size={14} /> 離開</button>
          <span className="ol-bar-title"><GraduationCap size={16} /> {lesson.title}</span>
          <span className="ol-progress-dots">
            {lesson.frames.map((f, i) => (
              <span key={f.id} className={`ol-dot ${i === frameIdx ? "is-on" : ""} ${i < frameIdx ? "is-done" : ""}`} />
            ))}
          </span>
        </header>
        <div className="ol-stage">
          <LessonStage lessonId={lesson.id} prop={frame.prop} frame={frameIdx} action={frame.action} />
          <p className="ol-caption" key={`cap-${frame.id}`} aria-live="polite">{frame.caption}</p>
          {needAsk && frame.ask && (
            <div className="ol-ask" role="group" aria-label="動畫中途提問">
              <p className="ol-ask-head"><Lightbulb size={14} /> 先想一想，再往下看</p>
              <p className="ol-ask-q">{frame.ask.prompt}</p>
              <div className="ol-ask-opts">
                {frame.ask.options.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`ol-opt ${askPicked === i && i !== frame.ask!.answer ? "ol-opt--wrong" : ""}`}
                    onClick={() => pickAsk(i)}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {askPicked !== null && askPicked !== frame.ask.answer && (
                <p className="ol-ask-hint" role="status">提示：{frame.ask.hint}</p>
              )}
              <button type="button" className="ol-ask-skip" onClick={() => resolveAsk(null)}>
                <SkipForward size={13} /> 略過，繼續播放
              </button>
            </div>
          )}
        </div>
        <div className="ol-controls">
          <button type="button" className="ol-btn ol-btn--primary" onClick={togglePlay}>
            {playing ? <><Pause size={15} /> 暫停</> : <><Play size={15} /> {isLastFrame ? "重播" : "播放"}</>}
          </button>
          <div className="ol-seek">
            <button type="button" className="ol-seek-btn" disabled={frameIdx === 0} onClick={() => setFrameIdx((i) => Math.max(0, i - 1))}>＜ 上一幀</button>
            <span className="ol-seek-now">第 {frameIdx + 1} / {lesson.frames.length} 幀</span>
            <button type="button" className="ol-seek-btn" disabled={isLastFrame} onClick={() => setFrameIdx((i) => Math.min(lesson.frames.length - 1, i + 1))}>下一幀 ＞</button>
          </div>
          {isLastFrame && (
            <button type="button" className="ol-btn ol-btn--primary" onClick={goSummary}>
              <ListChecks size={15} /> 看重點整理
            </button>
          )}
          <button type="button" className="ol-btn ol-btn--ghost" onClick={goQuiz}>
            進入闖關 <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- 重點整理（看完動畫的小結） ---------------- */
  if (phase === "summary") {
    const takeaways = lesson.takeaways ?? [];
    return (
      <div className="ol-page">
        <div className="ol-top">
          <button type="button" className="ol-exit" onClick={onExit}><Home size={15} /> 回我的教室</button>
        </div>
        <div className="ol-summary">
          <div className="ol-summary-mascot" aria-hidden="true">
            <OnionMascot action="cheer" frame={99} size={78} />
          </div>
          <span className="ol-tag"><ListChecks size={14} /> 重點整理</span>
          <h2>{lesson.title}</h2>
          <ul className="ol-summary-list">
            {takeaways.map((item, i) => (
              <li key={i}><span className="ol-summary-num">{i + 1}</span> {item}</li>
            ))}
          </ul>
          <p className="ol-summary-hint">記住這幾點，就可以去闖關了！</p>
          <div className="ol-start-btns">
            <button type="button" className="ol-btn ol-btn--primary" onClick={goQuiz}>
              開始闖關 <ChevronRight size={15} />
            </button>
            <button type="button" className="ol-btn ol-btn--ghost" onClick={startLesson}>
              <RotateCcw size={14} /> 再看一次動畫
            </button>
          </div>
          <button type="button" className="ol-exit" onClick={() => setPhase("start")}><ArrowLeft size={14} /> 換一堂課</button>
        </div>
      </div>
    );
  }

  /* ---------------- 闖關練習 ---------------- */
  if (phase === "quiz") {
    const isRight = answered && selected === q.answer;
    return (
      <div className="ol-page">
        <header className="ol-bar">
          <button type="button" className="ol-exit ol-exit--bar" onClick={onExit}><Home size={14} /> 離開</button>
          <span className="ol-bar-title"><Star size={16} /> {lesson.title} — 闖關</span>
          <span className="ol-quiz-progress">第 {qIdx + 1} / {lesson.questions.length} 題</span>
        </header>
        <div className="ol-quiz">
          <p className="ol-q-prompt">{q.prompt}</p>
          {!answered && quizWrong.length > 0 && (
            <div className="ol-hint" role="status">
              <b>提示（第 {Math.min(quizWrong.length, 3)} 次）：</b>{" "}
              {q.hints && q.hints.length
                ? q.hints[Math.min(quizWrong.length - 1, q.hints.length - 1)]
                : "再想一下，真的卡住可以回去重看動畫。"}
            </div>
          )}
          <div className="ol-q-options">
            {q.options.map((opt, i) => {
              const isWrongPick = quizWrong.includes(i);
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
            <div className={`ol-feedback ${isRight ? "is-right" : "is-wrong"}`}>
              <p className="ol-feedback-head">{isRight ? "答對了！🎉" : "再想一想～"}</p>
              <p className="ol-feedback-exp">{q.explanation}</p>
              <button type="button" className="ol-btn ol-btn--primary" onClick={nextQ}>
                {qIdx >= lesson.questions.length - 1 ? "查看結果" : "下一題"} <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- 結算 ---------------- */
  const stars = result.stars;
  return (
    <div className="ol-page">
      <div className="ol-result">
        <div className="ol-result-mascot" aria-hidden="true">
          <OnionMascot action={stars >= 2 ? "cheer" : "wave"} frame={99} />
        </div>
        <h2>{stars === 3 ? "滿分通關！洋蔥為你驕傲！" : stars >= 1 ? "不錯！再來一次會更好。" : "別灰心，重看動畫就會了。"}</h2>
        <div className="ol-stars" aria-label={`${stars} 顆星`}>
          {[0, 1, 2].map((i) => (
            <Star key={i} size={38} className={i < stars ? "ol-star is-on" : "ol-star"} />
          ))}
        </div>
        <p className="ol-result-score">
          答對 <b>{result.correct}</b> / {result.total} 題 · 獲得 <b>{result.coins}</b> 金幣
        </p>
        {bestStars && bestStars > stars && <p className="ol-result-best">目前最佳仍是 {bestStars}★</p>}
        <div className="ol-result-btns">
          <button type="button" className="ol-btn ol-btn--primary" onClick={startLesson}>
            <RotateCcw size={15} /> 再玩一輪
          </button>
          <button type="button" className="ol-btn ol-btn--ghost" onClick={() => setPhase("start")}>
            <BookOpen size={14} /> 換一堂課
          </button>
          <button type="button" className="ol-btn ol-btn--ghost" onClick={onExit}>
            <Home size={14} /> 回我的教室
          </button>
        </div>
      </div>
    </div>
  );
}

/** 依學科回傳代表色（用於選課卡片）。 */
function subjectColor(subject: string): string {
  switch (subject) {
    case "數學":
      return "#8a5fb0";
    case "國語":
      return "#3a7bbf";
    case "自然":
      return "#2f9e6e";
    case "社會":
      return "#c0763f";
    default:
      return "#8a5fb0";
  }
}
