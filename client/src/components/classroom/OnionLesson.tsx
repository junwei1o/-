import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Lock,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
} from "lucide-react";
import FractionStage from "./FractionStage";
import { useClassroomSound } from "./useClassroomSound";
import {
  FRACTION_COURSE,
  completedLayerCount,
  courseProgress,
  courseTotalStars,
  isLayerUnlocked,
  layerStars,
  loadOnionProgress,
  rankTitle,
  saveOnionProgress,
  type LayerProgress,
  type OnionCourse,
  type OnionScene,
} from "@/lib/onionLessons";
import { shuffleQuestionOptions } from "@/lib/optionRandomizer";
import "./onion.css";

type Props = {
  course?: OnionCourse;
  muted?: boolean;
  onExit: () => void;
  onBest?: (record: { stars: number; correct: number; total: number }) => void;
  bestStars?: number;
};

type Screen = "start" | "map" | "anim" | "quiz" | "layerdone" | "result";

const CONFETTI_COLORS = ["#f2994a", "#1b7082", "#6fbf9f", "#e8843a", "#7c6bb5", "#e8b84b"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.round((i * 37 + 13) % 100),
        delay: ((i * 0.13) % 1.4).toFixed(2),
        duration: (2.2 + ((i * 7) % 18) / 10).toFixed(2),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: (i * 47) % 360,
      })),
    [],
  );
  return (
    <div className="on-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * 洋蔥式動畫微課播放器：
 * 課程地圖（分層解鎖）→ 動畫分鏡（可暫停/重播/略過）→ 即時測驗（三級提示）→ 過層星等 → 全課結算。
 */
export default function OnionLesson({ course = FRACTION_COURSE, muted = false, onExit, onBest, bestStars }: Props) {
  const play = useClassroomSound(muted);
  const [screen, setScreen] = useState<Screen>("start");
  const [progress, setProgress] = useState(() => loadOnionProgress());
  const [activeLayer, setActiveLayer] = useState(0);
  const [confetti, setConfetti] = useState(false);

  // 動畫播放狀態
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [runId, setRunId] = useState(0);
  const [animDone, setAnimDone] = useState(false);

  // 測驗狀態
  const [qIndex, setQIndex] = useState(0);
  const [wrongSet, setWrongSet] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState(0);
  const [questionEverWrong, setQuestionEverWrong] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [layerResult, setLayerResult] = useState<{ stars: number; mistakes: number }>({ stars: 0, mistakes: 0 });

  const reportedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const layers = courseProgress(progress, course.id);
  const layer = course.layers[activeLayer];
  const doneCount = completedLayerCount(course, layers);
  const rank = rankTitle(doneCount, course.layers.length);
  const totalQuiz = course.layers.reduce((sum, l) => sum + l.quiz.length, 0);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => clearTimer, []);

  /* ---------- 動畫分鏡自動推進 ---------- */
  useEffect(() => {
    if (screen !== "anim") return undefined;
    clearTimer();
    if (!playing) return undefined;
    const scene = layer.scenes[sceneIndex];
    timerRef.current = window.setTimeout(() => {
      if (sceneIndex < layer.scenes.length - 1) {
        setSceneIndex((i) => i + 1);
      } else {
        setPlaying(false);
        setAnimDone(true);
      }
    }, scene.ms);
    return clearTimer;
  }, [screen, playing, sceneIndex, runId, layer]);

  const openLayer = (index: number) => {
    if (!isLayerUnlocked(course, index, layers)) {
      play("no");
      return;
    }
    play("flip");
    setActiveLayer(index);
    setSceneIndex(0);
    setPlaying(true);
    setAnimDone(false);
    setRunId((r) => r + 1);
    setScreen("anim");
  };

  const restartScene = () => {
    setPlaying(true);
    setAnimDone(false);
    setRunId((r) => r + 1);
  };
  const gotoScene = (delta: number) => {
    const next = Math.min(layer.scenes.length - 1, Math.max(0, sceneIndex + delta));
    setSceneIndex(next);
    setAnimDone(next >= layer.scenes.length - 1 ? false : false);
    setPlaying(true);
    setRunId((r) => r + 1);
  };
  const startQuiz = () => {
    clearTimer();
    setQIndex(0);
    setWrongSet([]);
    setMistakes(0);
    setWrongQuestions(0);
    setQuestionEverWrong(false);
    setChosen(null);
    setScreen("quiz");
  };

  /* ---------- 測驗作答 ---------- */
  const quiz = layer.quiz;
  /** 每次進場洗牌選項，避免正解固定在同一個位置。 */
  const quizPool = useMemo(() => quiz.map((q) => shuffleQuestionOptions(q)), [quiz]);
  const question = quizPool[qIndex];
  const wrongCountThisQ = wrongSet.length;
  const hintLevel = chosen === null ? Math.min(wrongCountThisQ, 3) : 0;

  const choose = (optionIndex: number) => {
    if (chosen !== null) return;
    if (optionIndex === question.answer) {
      play("ok");
      setChosen(optionIndex);
      if (!questionEverWrong) {
        // 首次就答對，計入 firstTry（在 finishLayer 用 quiz 長度 - wrongQuestions）
      }
    } else {
      play("no");
      if (!questionEverWrong) {
        setQuestionEverWrong(true);
        setWrongQuestions((n) => n + 1);
      }
      setMistakes((m) => m + 1);
      setWrongSet((s) => (s.includes(optionIndex) ? s : [...s, optionIndex]));
    }
  };

  const nextQuestion = () => {
    play("flip");
    if (qIndex < quiz.length - 1) {
      setQIndex((i) => i + 1);
      setWrongSet([]);
      setQuestionEverWrong(false);
      setChosen(null);
    } else {
      finishLayer();
    }
  };

  const finishLayer = useCallback(() => {
    const stars = layerStars(mistakes);
    const firstTry = quiz.length - wrongQuestions;
    setProgress((prev) => {
      const entry = prev[course.id]?.layers ?? {};
      const old: LayerProgress | undefined = entry[layer.id];
      const merged: LayerProgress = {
        done: true,
        mistakes: old ? Math.min(old.mistakes, mistakes) : mistakes,
        firstTry: Math.max(old?.firstTry ?? 0, firstTry),
        stars: Math.max(old?.stars ?? 0, stars),
        completedAt: Date.now(),
      };
      const nextMap = { ...prev, [course.id]: { layers: { ...entry, [layer.id]: merged } } };
      saveOnionProgress(nextMap);
      return nextMap;
    });
    setLayerResult({ stars, mistakes });
    play("win");
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 3600);
    setScreen("layerdone");
  }, [mistakes, wrongQuestions, quiz.length, course.id, layer.id, play]);

  /* ---------- 全課結算 → 回報最佳成績 ---------- */
  useEffect(() => {
    if (screen !== "result" || reportedRef.current) return;
    reportedRef.current = true;
    const fresh = courseProgress(loadOnionProgress(), course.id);
    const stars = courseTotalStars(course, fresh);
    const firstTrySum = course.layers.reduce((s, l) => s + (fresh[l.id]?.firstTry ?? 0), 0);
    onBest?.({ stars, correct: firstTrySum, total: totalQuiz });
    setConfetti(true);
    const t = window.setTimeout(() => setConfetti(false), 4000);
    return () => window.clearTimeout(t);
  }, [screen, course, onBest, totalQuiz]);

  const goResult = () => setScreen("result");
  const nextLayer = () => openLayer(activeLayer + 1);
  const backToMap = () => {
    play("flip");
    setScreen("map");
  };

  /* ================= 畫面渲染 ================= */

  const topBar = (
    <div className="on-top">
      <button type="button" className="on-back" onClick={onExit}>← 回我的教室</button>
      <span className="on-tag">{course.title}</span>
      <span className="on-rank"><Sparkles size={13} style={{ verticalAlign: "-2px" }} /> {rank}</span>
    </div>
  );

  // ---- 開始封面 ----
  if (screen === "start") {
    return (
      <div className="on-page">
        <div className="on-wrap">
          {topBar}
          <div className="on-card">
            <div className="on-start-hero">
              <div className="on-onion">🧅</div>
              <p className="on-quiz-meta" style={{ textAlign: "center" }}>{course.subject} · {course.grade}</p>
              <h2>{course.title}</h2>
              <p>{course.tagline}</p>
              <p style={{ fontSize: "13.5px", color: "#57697a", marginTop: 10 }}>
                把一個觀點切成好幾層，每層先看一段小動畫、馬上回答 2 題，答對才解鎖下一層。
              </p>
              <div className="on-rules">
                <span className="on-rule-chip">🧅 {course.layers.length} 層知識點</span>
                <span className="on-rule-chip">🎬 動畫講解</span>
                <span className="on-rule-chip">✏️ 看完立即測驗</span>
                <span className="on-rule-chip">🔓 逐層解鎖</span>
                <span className="on-rule-chip">⭐ 全對三顆星</span>
              </div>
              {bestStars ? <p className="on-bestline">你的最佳紀錄：{"★".repeat(bestStars)}{"☆".repeat(3 - bestStars)}</p> : null}
              <button type="button" className="on-btn sea" style={{ marginTop: 16 }} onClick={() => { play("flip"); setScreen("map"); }}>
                {doneCount > 0 ? "繼續學習" : "開始剝洋蔥"} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 課程地圖 ----
  if (screen === "map") {
    return (
      <div className="on-page">
        <div className="on-wrap">
          {topBar}
          {confetti && <Confetti />}
          <div className="on-card">
            <h2 className="on-map-title">{course.title} · 學習地圖</h2>
            <p className="on-map-sub">一層一個觀點，完成前一層就解鎖下一層（已完成 {doneCount}/{course.layers.length}）。</p>
            <div className="on-path">
              {course.layers.map((l, index) => {
                const rec: LayerProgress | undefined = layers[l.id];
                const done = Boolean(rec?.done);
                const unlocked = isLayerUnlocked(course, index, layers);
                const cls = done ? "is-done" : unlocked ? "is-current" : "is-locked";
                return (
                  <button
                    key={l.id}
                    type="button"
                    className={`on-node ${cls}`}
                    disabled={!unlocked}
                    onClick={() => openLayer(index)}
                  >
                    <span className="on-node-num">{done ? <Check size={22} /> : unlocked ? l.order : <Lock size={18} />}</span>
                    <span className="on-node-body">
                      <h3>{l.title}</h3>
                      <p>{l.goal}</p>
                    </span>
                    {done ? (
                      <span className="on-node-state stars">{"★".repeat(rec?.stars ?? 0)}</span>
                    ) : unlocked ? (
                      <span className="on-node-state go">{doneCount === index ? "開始" : "進入"} →</span>
                    ) : (
                      <span className="on-node-state lock"><Lock size={16} /></span>
                    )}
                  </button>
                );
              })}
            </div>
            <button type="button" className="on-btn ghost" style={{ marginTop: 18 }} onClick={onExit}>回我的教室</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- 動畫播放 ----
  if (screen === "anim") {
    const scene: OnionScene = layer.scenes[sceneIndex];
    const isLast = sceneIndex >= layer.scenes.length - 1;
    return (
      <div className="on-page">
        <div className="on-wrap">
          {topBar}
          <div className="on-card on-stagecard">
            <div className="on-scene-progress" aria-label="分鏡進度">
              {layer.scenes.map((_, i) => (
                <span
                  key={i}
                  className={`on-scene-dot${i < sceneIndex ? " is-done" : ""}${i === sceneIndex ? " is-active" : ""}`}
                  style={
                    i === sceneIndex
                      ? ({
                          "--scene-ms": `${scene.ms}ms`,
                          "--play": playing ? "running" : "paused",
                        } as React.CSSProperties)
                      : undefined
                  }
                />
              ))}
            </div>
            <div className="on-stage">
              <FractionStage key={`${activeLayer}-${sceneIndex}-${runId}`} scene={scene} />
            </div>
            <div className="on-narration">
              <span className="on-mascot">🧅</span>
              <p key={`n-${sceneIndex}-${runId}`} className="is-fading" aria-live="polite">{scene.narration}</p>
            </div>
            <div className="on-player-ctrl">
              <button type="button" className="on-ctrl icon" aria-label="上一個分鏡" onClick={() => gotoScene(-1)} disabled={sceneIndex === 0}>
                ‹
              </button>
              <button
                type="button"
                className="on-ctrl icon primary"
                aria-label={playing ? "暫停" : "播放"}
                onClick={() => {
                  if (isLast && animDone) {
                    restartScene();
                  } else {
                    setPlaying((p) => !p);
                  }
                }}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <button type="button" className="on-ctrl icon" aria-label="重播這個分鏡" onClick={restartScene}>
                <RotateCcw size={16} />
              </button>
              <button type="button" className="on-ctrl icon" aria-label="下一個分鏡" onClick={() => gotoScene(1)} disabled={isLast}>
                ›
              </button>
              <span className="on-ctrl-spacer" />
              <button type="button" className="on-ctrl" onClick={startQuiz}>
                略過 <SkipForward size={14} style={{ verticalAlign: "-2px" }} />
              </button>
            </div>
            <button
              type="button"
              className="on-btn sea"
              style={{ marginTop: 14, opacity: animDone ? 1 : 0.55 }}
              onClick={startQuiz}
            >
              {animDone ? "我看完了，開始作答" : `分鏡 ${sceneIndex + 1} / ${layer.scenes.length}（看完會自動停下來）`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- 即時測驗 ----
  if (screen === "quiz") {
    const visualScene: OnionScene | null = question.visual
      ? { kind: question.visual.kind, parts: question.visual.parts, take: question.visual.take, ms: 0, narration: "" }
      : null;
    return (
      <div className="on-page">
        <div className="on-wrap">
          {topBar}
          <div className="on-card">
            <span className="on-quiz-meta">{layer.title} · 小測驗 {qIndex + 1}/{quiz.length}</span>
            <h2 className="on-quiz-title">{question.prompt}</h2>
            {visualScene && (
              <div className="on-quiz-stage">
                <FractionStage key={`q-${question.id}`} scene={visualScene} />
              </div>
            )}
            <div className="on-options">
              {question.options.map((opt, i) => {
                const isWrongPick = wrongSet.includes(i);
                const isAnswer = chosen === i;
                let cls = "on-option";
                if (isAnswer) cls += " is-correct";
                else if (isWrongPick) cls += " is-wrong";
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    disabled={chosen !== null || isWrongPick}
                    onClick={() => choose(i)}
                  >
                    <span className="on-opt-key">{String.fromCharCode(65 + i)}</span>
                    {opt}
                    {isAnswer && <Check size={18} style={{ marginLeft: "auto", color: "#4aa584" }} />}
                  </button>
                );
              })}
            </div>

            {chosen === null && hintLevel > 0 && (
              <div className="on-hint" role="status">
                <b>提示（第 {hintLevel} 次）：</b> {question.hints[Math.min(hintLevel - 1, 2)]}
              </div>
            )}
            {chosen !== null && (
              <div className="on-explain" role="status">
                <b>答對了！</b> {question.explain}
              </div>
            )}
            {chosen !== null && (
              <button type="button" className="on-btn sea" style={{ marginTop: 14 }} onClick={nextQuestion}>
                {qIndex < quiz.length - 1 ? "下一題" : "完成這一層"} <ChevronRight size={18} />
              </button>
            )}
            <p className="on-quiz-progress">答錯不會被懲罰，只會給你更多提示，直到你懂為止。</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- 過層 ----
  if (screen === "layerdone") {
    const isLastLayer = activeLayer >= course.layers.length - 1;
    return (
      <div className="on-page">
        <div className="on-wrap">
          {confetti && <Confetti />}
          {topBar}
          <div className="on-card">
            <div className="on-done">
              <div className="on-done-badge">🎉</div>
              <p className="on-quiz-meta" style={{ textAlign: "center" }}>你完成了</p>
              <h2>{layer.title}</h2>
              <div className="on-done-stars">
                {"★".repeat(layerResult.stars)}<span className="off">{"★".repeat(3 - layerResult.stars)}</span>
              </div>
              <p>
                {layerResult.mistakes === 0
                  ? "太厲害了，一次全對！這個觀點你已經牢牢掌握。"
                  : `這一層共重新判斷 ${layerResult.mistakes} 次，沒關係——錯過再弄懂，觀念會更穩。`}
              </p>
              {!isLastLayer && (
                <div className="on-done-unlock">🔓 已解鎖：{course.layers[activeLayer + 1].title}</div>
              )}
              <div className="on-actions">
                <button type="button" className="on-btn ghost" onClick={backToMap}>回地圖</button>
                {isLastLayer ? (
                  <button type="button" className="on-btn sea" onClick={goResult}>看學習成果 <ChevronRight size={18} /></button>
                ) : (
                  <button type="button" className="on-btn" onClick={nextLayer}>剝下一層 <ChevronRight size={18} /></button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 全課結算 ----
  const freshLayers = courseProgress(progress, course.id);
  const totalStars = courseTotalStars(course, freshLayers);
  const firstTryTotal = course.layers.reduce((s, l) => s + (freshLayers[l.id]?.firstTry ?? 0), 0);
  return (
    <div className="on-page">
      <div className="on-wrap">
        {confetti && <Confetti />}
        {topBar}
        <div className="on-card">
          <div className="on-done">
            <div className="on-done-badge">🏆</div>
            <p className="on-quiz-meta" style={{ textAlign: "center" }}>恭喜完成整輪微課</p>
            <h2>{course.title} · 學習成果</h2>
            <div className="on-done-stars">
              {"★".repeat(totalStars)}<span className="off">{"★".repeat(3 - totalStars)}</span>
            </div>
            <p>
              你已剝完 {course.layers.length} 層知識點，獲得稱號「<b>{rankTitle(course.layers.length, course.layers.length)}</b>」。
            </p>
            <p style={{ fontSize: "14px", color: "#57697a" }}>
              首次答對 {firstTryTotal} / {totalQuiz} 題。想更熟練，可以隨時回來重看任一層動畫。
            </p>
            <div className="on-actions">
              <button type="button" className="on-btn ghost" onClick={onExit}>回我的教室</button>
              <button type="button" className="on-btn sea" onClick={backToMap}>回學習地圖</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
