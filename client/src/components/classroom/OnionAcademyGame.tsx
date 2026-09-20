/**
 * 洋蔥學院風格動畫講解教室玩法。
 *
 * 流程：選課 → 課程簡介 → 動畫講解（分鏡播放器）→ 闖關練習（5 題）→ 結算獎勵。
 * 動畫與題目均由 onionLesson.ts 的 lesson 數據驅動，新增知識點只需換一份 lesson。
 * 教具渲染也是可擴展的：StageProp 依 prop.kind 分派到對應元件。
 * 成績透過 onBest 回寫教室最佳紀錄（與其他玩法一致的 3★ 標準）。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Sparkles, Star, ChevronRight, Play, Pause, Home, GraduationCap, ArrowLeft, BookOpen } from "lucide-react";
import {
  ONION_LESSONS,
  getOnionLesson,
  gradeOnionLesson,
  type OnionAction,
  type OnionFrame,
  type OnionLesson,
  type OnionProp,
} from "@/game/onionAcademyLessons";
import "@/components/classroom/classroom.css";

type Phase = "start" | "intro" | "lesson" | "quiz" | "result";

type Props = {
  bestStars?: number;
  onBest: (r: { stars: number; correct: number; total: number }) => void;
  onExit: () => void;
};

/* ===================== 洋蔥角色（SVG 吉祥物） ===================== */
function OnionMascot({ action, frame }: { action: OnionAction; frame: number }) {
  const bodyCls =
    action === "jump" || action === "cheer" ? "ol-onion--hop" : action === "walk" ? "ol-onion--bob" : "";
  const armCls =
    action === "wave"
      ? "ol-arm--wave"
      : action === "point"
        ? "ol-arm--point"
        : action === "cheer"
          ? "ol-arm--cheer"
          : action === "think"
            ? "ol-arm--think"
            : "";
  return (
    <div className={`ol-onion ${bodyCls}`} key={frame} aria-hidden="true">
      <svg viewBox="0 0 120 150" width="120" height="150" className="ol-onion-svg">
        {/* 頂芽 */}
        <path d="M60 18 C 54 6 66 -2 62 16" stroke="#5fa84f" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M60 16 C 70 6 78 12 64 20" stroke="#6fc15c" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* 身體 */}
        <path
          d="M60 22 C 30 22 18 52 30 96 C 36 118 48 130 60 130 C 72 130 84 118 90 96 C 102 52 90 22 60 22 Z"
          fill="#b794d6"
          stroke="#8a5fb0"
          strokeWidth="2"
        />
        {/* 洋蔥紋路 */}
        <path d="M40 40 C 50 44 70 44 80 40" stroke="#9a6cc0" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M36 70 C 48 74 72 74 84 70" stroke="#9a6cc0" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M40 98 C 50 102 70 102 80 98" stroke="#9a6cc0" strokeWidth="2" fill="none" opacity="0.5" />
        {/* 眼睛 */}
        <circle cx="48" cy="62" r="5.5" fill="#2a1d3a" />
        <circle cx="72" cy="62" r="5.5" fill="#2a1d3a" />
        <circle cx="50" cy="60" r="1.8" fill="#fff" />
        <circle cx="74" cy="60" r="1.8" fill="#fff" />
        {/* 嘴 */}
        <path d="M52 80 Q 60 88 68 80" stroke="#2a1d3a" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* 腮紅 */}
        <ellipse cx="38" cy="78" rx="6" ry="4" fill="#f2a0c0" opacity="0.55" />
        <ellipse cx="82" cy="78" rx="6" ry="4" fill="#f2a0c0" opacity="0.55" />
        {/* 手臂 */}
        <g className={`ol-arm ol-arm-l ${armCls}`}>
          <path d="M32 86 C 18 88 12 100 18 110" stroke="#8a5fb0" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
        <g className={`ol-arm ol-arm-r ${armCls}`}>
          <path d="M88 86 C 102 88 108 100 102 110" stroke="#8a5fb0" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
        {/* 思考泡泡 */}
        {action === "think" && (
          <g className="ol-think">
            <circle cx="100" cy="40" r="3" fill="#fff" stroke="#8a5fb0" />
            <circle cx="108" cy="30" r="5" fill="#fff" stroke="#8a5fb0" />
            <text x="108" y="34" textAnchor="middle" fontSize="9" fill="#8a5fb0">?</text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ===================== 教具元件（依 kind 分派） ===================== */

/** 圓餅教具：把圓分成 b 等份，塗色 a 份。 */
function FractionPie({ a, b, label }: { a: number; b: number; label?: string }) {
  const cx = 50;
  const cy = 50;
  const r = 40;
  const slices = useMemo(() => {
    if (b <= 0) return [] as string[];
    if (b === 1) return ["M50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0 Z"];
    const out: string[] = [];
    const step = 360 / b;
    for (let i = 0; i < b; i++) {
      const s = ((i * step - 90) * Math.PI) / 180;
      const e = (((i + 1) * step - 90) * Math.PI) / 180;
      const x1 = cx + r * Math.cos(s);
      const y1 = cy + r * Math.sin(s);
      const x2 = cx + r * Math.cos(e);
      const y2 = cy + r * Math.sin(e);
      const large = step > 180 ? 1 : 0;
      out.push(`M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`);
    }
    return out;
  }, [b]);

  return (
    <div className="ol-pie">
      <svg viewBox="0 0 100 100" width="120" height="120" className="ol-pie-svg">
        <circle cx={cx} cy={cy} r={r} fill="#f3ecf8" stroke="#8a5fb0" strokeWidth="2" />
        {slices.map((d, i) => (
          <path key={i} d={d} fill={i < a ? "#8a5fb0" : "transparent"} stroke="#b794d6" strokeWidth="1.5" className="ol-pie-slice" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </svg>
      {label && <span className="ol-pie-label">{label}</span>}
    </div>
  );
}

/** 字卡教具：國語字詞辨識。 */
function TextCard({ text, sub, tone }: { text: string; sub?: string; tone?: "ok" | "warn" }) {
  return (
    <div className={`ol-text-card ${tone === "warn" ? "is-warn" : "is-ok"}`}>
      <span className="ol-text-main">{text}</span>
      {sub && <span className="ol-text-sub">{sub}</span>}
    </div>
  );
}

/** 循環圖教具：自然科學週期系統。節點順時針排列，active 標示當前階段。 */
function CycleDiagram({ nodes, active }: { nodes: string[]; active?: number }) {
  const n = nodes.length;
  const cx = 60;
  const cy = 60;
  const r = 38;
  const pts = useMemo(() => {
    return nodes.map((label, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), label };
    });
  }, [nodes]);
  return (
    <div className="ol-cycle">
      <svg viewBox="0 0 120 120" width="180" height="180" className="ol-cycle-svg">
        {/* 循環箭頭（圓弧） */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d9c3ee" strokeWidth="2" strokeDasharray="4 5" className="ol-cycle-ring" />
        {pts.map((p, i) => {
          const isActive = active === i || (active === undefined && false);
          const next = pts[(i + 1) % n];
          return (
            <g key={i}>
              {/* 節點到下一節點的箭頭（除匯回起點外） */}
              <line
                x1={p.x} y1={p.y} x2={next.x} y2={next.y}
                stroke={isActive ? "#8a5fb0" : "#cdb0e6"}
                strokeWidth={isActive ? "2.5" : "1.5"}
                markerEnd="url(#olArrow)"
                className={isActive ? "ol-cycle-arrow is-on" : "ol-cycle-arrow"}
              />
              {/* 節點圓 */}
              <circle
                cx={p.x} cy={p.y} r="15"
                fill={isActive ? "#8a5fb0" : "#fff"}
                stroke={isActive ? "#5a3a7a" : "#b794d6"}
                strokeWidth="2"
                className={isActive ? "ol-cycle-node is-on" : "ol-cycle-node"}
              />
              <text
                x={p.x} y={p.y + 3} textAnchor="middle"
                fontSize="6.5" fontWeight="700"
                fill={isActive ? "#fff" : "#5a3a7a"}
              >
                {p.label}
              </text>
            </g>
          );
        })}
        <defs>
          <marker id="olArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="#8a5fb0" />
          </marker>
        </defs>
      </svg>
      {active !== undefined && active >= 0 && (
        <span className="ol-cycle-now">現在：{nodes[active]}</span>
      )}
    </div>
  );
}

/** 三角形教具：幾何形（底×高÷2）。 */
function TriangleShape({ base, height, label }: { base: number; height: number; label?: string }) {
  // 底邊在下方，頂點在上方中央偏左一點
  const bx = 10;
  const by = 80;
  const bw = Math.min(base * 6, 80);
  const tx = bx + bw / 2 - 8;
  const ty = by - Math.min(height * 6, 64);
  const mx = bx + bw / 2;
  return (
    <div className="ol-shape">
      <svg viewBox="0 0 100 100" width="160" height="160" className="ol-shape-svg">
        {/* 三角形本體 */}
        <path
          d={`M${bx} ${by} L${bx + bw} ${by} L${tx} ${ty} Z`}
          fill="#e9d8f5"
          stroke="#8a5fb0"
          strokeWidth="2.5"
          className="ol-shape-tri"
        />
        {/* 高（虛線） */}
        <line x1={mx} y1={by} x2={tx} y2={ty} stroke="#e07a4f" strokeWidth="1.8" strokeDasharray="4 3" />
        {/* 底邊標示 */}
        <line x1={bx} y1={by + 6} x2={bx + bw} y2={by + 6} stroke="#5a3a7a" strokeWidth="2" />
        <text x={mx} y={by + 16} textAnchor="middle" fontSize="7" fontWeight="700" fill="#5a3a7a">底 {base}</text>
        {/* 高標示 */}
        <text x={tx + 6} y={(by + ty) / 2 + 2} fontSize="7" fontWeight="700" fill="#e07a4f">高 {height}</text>
        {/* 直角記號 */}
        <path d={`M${mx} ${by} L${mx - 5} ${by} L${mx - 5} ${by - 5}`} fill="none" stroke="#5a3a7a" strokeWidth="1.5" />
      </svg>
      {label && <span className="ol-shape-label">{label}</span>}
    </div>
  );
}

/** 依 prop 類型渲染舞臺教具（可擴展分派）。 */
function StageProp({ prop }: { prop: OnionProp }) {
  if (prop.kind === "none") return <div className="ol-prop-empty" aria-hidden="true" />;
  if (prop.kind === "pie") return <FractionPie a={prop.a} b={prop.b} label={prop.label} />;
  if (prop.kind === "pies") {
    return (
      <div className="ol-pies">
        <FractionPie a={prop.left.a} b={prop.left.b} />
        <span className="ol-op">＋</span>
        <FractionPie a={prop.right.a} b={prop.right.b} />
        {prop.result && (
          <>
            <span className="ol-op">＝</span>
            <FractionPie a={prop.result.a} b={prop.result.b} label={`${prop.result.a}/${prop.result.b}`} />
          </>
        )}
      </div>
    );
  }
  if (prop.kind === "text") return <TextCard text={prop.text} sub={prop.sub} tone={prop.tone} />;
  if (prop.kind === "cycle") return <CycleDiagram nodes={prop.nodes} active={prop.active} />;
  if (prop.kind === "shape" && prop.shape === "triangle")
    return <TriangleShape base={prop.base} height={prop.height} label={prop.label} />;
  return null;
}

/* ===================== 主元件 ===================== */
export default function OnionLessonGame({ bestStars, onBest, onExit }: Props) {
  const [lessonId, setLessonId] = useState<string>(ONION_LESSONS[0].id);
  const lesson = getOnionLesson(lessonId);
  const reducedMotion = useRef(false);
  if (typeof window !== "undefined" && window.matchMedia) {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  const [phase, setPhase] = useState<Phase>("start");
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState(gradeOnionLesson(0, lesson.questions.length));

  const frame: OnionFrame = lesson.frames[frameIdx];
  const isLastFrame = frameIdx >= lesson.frames.length - 1;
  const q = lesson.questions[qIdx];

  // 分鏡自動推進
  useEffect(() => {
    if (phase !== "lesson" || !playing) return;
    const dur = reducedMotion.current ? Math.min(frame.duration, 900) : frame.duration;
    const t = setTimeout(() => {
      if (isLastFrame) {
        setPlaying(false);
      } else {
        setFrameIdx((i) => i + 1);
      }
    }, dur);
    return () => clearTimeout(t);
  }, [phase, playing, frameIdx, frame.duration, isLastFrame]);

  const pickLesson = (id: string) => {
    setLessonId(id);
    setPhase("intro");
  };
  const startLesson = () => {
    setFrameIdx(0);
    setPlaying(true);
    setPhase("lesson");
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
    setPhase("quiz");
  };
  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.answer) setCorrectCount((c) => c + 1);
  };
  const nextQ = () => {
    if (qIdx >= lesson.questions.length - 1) {
      const r = gradeOnionLesson(correctCount, lesson.questions.length);
      setResult(r);
      onBest({ stars: r.stars, correct: r.correct, total: r.total });
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
        <div className="ol-picker">
          <header className="ol-picker-head">
            <span className="ol-tag"><BookOpen size={14} /> 洋蔥動畫講解</span>
            <h2>選一門動畫課</h2>
            <p className="ol-desc">每堂約 5 分鐘：先看動畫講解，再闖 5 題。答對即時解析，全對三顆星。</p>
          </header>
          <div className="ol-picker-grid">
            {ONION_LESSONS.map((l) => {
              const color = subjectColor(l.subject);
              return (
                <button
                  key={l.id}
                  type="button"
                  className="ol-lesson-card"
                  style={{ ["--lc" as string]: color }}
                  onClick={() => pickLesson(l.id)}
                >
                  <span className="ol-lc-subject" style={{ background: color }}>{l.subject}</span>
                  <span className="ol-lc-title">{l.title}</span>
                  <span className="ol-lc-meta">{l.grade} · {l.topic}</span>
                  <span className="ol-lc-desc">{l.desc}</span>
                  <span className="ol-lc-cta">開始 <ChevronRight size={14} /></span>
                </button>
              );
            })}
          </div>
          <button type="button" className="ol-exit" onClick={onExit}><Home size={14} /> 回我的教室</button>
        </div>
      </div>
    );
  }

  /* ---------------- 課程簡介 ---------------- */
  if (phase === "intro") {
    return (
      <div className="ol-page">
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
        <div className="ol-stage" key={frame.id}>
          <div className="ol-stage-scene">
            <div className="ol-stage-floor" aria-hidden="true" />
            <StageProp prop={frame.prop} />
            <div className="ol-mascot-slot">
              <OnionMascot action={frame.action} frame={frame.id} />
            </div>
          </div>
          <p className="ol-caption" key={`cap-${frame.id}`}>{frame.caption}</p>
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
          <button type="button" className="ol-btn ol-btn--ghost" onClick={goQuiz}>
            進入闖關 <ChevronRight size={15} />
          </button>
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
          <div className="ol-q-options">
            {q.options.map((opt, i) => {
              const cls = answered
                ? i === q.answer
                  ? "ol-opt ol-opt--right"
                  : i === selected
                    ? "ol-opt ol-opt--wrong"
                    : "ol-opt"
                : "ol-opt";
              return (
                <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={answered}>
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
