import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Orbit, RadioTower, Rocket, RotateCcw, Telescope, X } from "lucide-react";
import { QuestionTransition } from "@/components/QuestionTransition";
import {
  ASTRONOMY_QUIZ_TIERS,
  createAstronomyQuizDeck,
  getAstronomyQuizTier,
  type AstronomyQuizTier,
} from "@/lib/astronomy";
import { writeStoredJson } from "@/utils/storage";

type AstronomyQuizProps = { onExit: () => void };
const ASTRONOMY_PROGRESS_KEY = "xue-adventure-astronomy-quiz-v1";
const DEFAULT_TIER: AstronomyQuizTier = "planet";

function keyActivate(event: React.KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

function TierGlyph({ tier }: { tier: AstronomyQuizTier }) {
  if (tier === "planet") return <Orbit size={18} aria-hidden="true" />;
  if (tier === "galaxy") return <Telescope size={18} aria-hidden="true" />;
  if (tier === "mission") return <Rocket size={18} aria-hidden="true" />;
  return <RadioTower size={18} aria-hidden="true" />;
}

export default function AstronomyQuiz({ onExit }: AstronomyQuizProps) {
  const [tier, setTier] = useState<AstronomyQuizTier>(DEFAULT_TIER);
  const [deck, setDeck] = useState(() => createAstronomyQuizDeck(DEFAULT_TIER));
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = deck[active];
  const answered = selected !== null;
  const progress = deck.length ? Math.round((active / deck.length) * 100) : 0;
  const tierInfo = useMemo(() => getAstronomyQuizTier(tier), [tier]);
  const canChangeTier = active === 0 && !answered && score === 0 && !finished;

  const beginTier = (nextTier: AstronomyQuizTier) => {
    if (!canChangeTier && nextTier !== tier) return;
    setTier(nextTier);
    setDeck(createAstronomyQuizDeck(nextTier));
    setActive(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const reset = () => beginTier(tier);

  const choose = (index: number) => {
    if (answered || !question) return;
    setSelected(index);
    if (index === question.answer) setScore((value) => value + 1);
  };

  const next = () => {
    if (!question) return;
    if (active >= deck.length - 1) {
      writeStoredJson(ASTRONOMY_PROGRESS_KEY, { version: 2, tier, score, total: deck.length, completedAt: new Date().toISOString() });
      setFinished(true);
      return;
    }
    setActive((value) => value + 1);
    setSelected(null);
  };

  const tierPicker = <section className="astronomy-tier-picker" aria-labelledby="astronomy-tier-title">
    <div><p className="eyebrow accent">OBSERVATORY LEVELS</p><h2 id="astronomy-tier-title">選擇本輪觀測層級</h2><p>每個層級會建立獨立固定題組；開始作答後，本輪不會自動換層。</p></div>
    <div className="astronomy-tier-list" role="radiogroup" aria-label="天文問答難度層級">
      {ASTRONOMY_QUIZ_TIERS.map((item) => <button key={item.id} type="button" className={item.id === tier ? "is-selected" : ""} role="radio" aria-checked={item.id === tier} disabled={!canChangeTier && item.id !== tier} onClick={() => beginTier(item.id)} onKeyDown={(event) => keyActivate(event, () => beginTier(item.id))}>
        <TierGlyph tier={item.id} /><span><small>{item.level}</small><strong>{item.name}</strong><em>{item.short}</em></span>
      </button>)}
    </div>
    {!canChangeTier && <small className="astronomy-tier-lock" role="status">本輪 {tierInfo?.name} 進行中；請先完成或重新開始後，再選擇其他層級。</small>}
  </section>;

  if (finished) {
    return <section className="astronomy-quiz-shell" aria-labelledby="astronomy-result-title">
      <div className="astronomy-quiz-topbar"><button type="button" className="text-btn" onClick={onExit} onKeyDown={(event) => keyActivate(event, onExit)}><ArrowLeft size={16} /> 返回天文館</button><span>OBSERVATORY / RESULT</span></div>
      <div className="astronomy-quiz-result"><Telescope size={30} /><p className="eyebrow accent">{tierInfo?.level}／天文觀測完成</p><h1 id="astronomy-result-title">{tierInfo?.name}：答對 <i>{score} / {deck.length}</i> 題</h1><p>這份紀錄只屬於 {tierInfo?.name} 天文問答，不會混入一般課綱挑戰或休閒觀測題庫。</p><div><button type="button" className="btn primary" onClick={reset} onKeyDown={(event) => keyActivate(event, reset)}><RotateCcw size={16} /> 再觀測一次</button><button type="button" className="text-btn" onClick={onExit} onKeyDown={(event) => keyActivate(event, onExit)}>回到天文館 <ChevronRight size={16} /></button></div></div>
    </section>;
  }

  return <section className="astronomy-quiz-shell" aria-labelledby="astronomy-quiz-title">
    <div className="astronomy-quiz-topbar"><button type="button" className="text-btn" onClick={onExit} onKeyDown={(event) => keyActivate(event, onExit)}><ArrowLeft size={16} /> 返回天文館</button><span>OBSERVATORY / KNOWLEDGE QUIZ</span></div>
    <header className="astronomy-quiz-heading"><div><p className="eyebrow accent">ASTRONOMY ONLY / 專屬問答</p><h1 id="astronomy-quiz-title">天文知識 <i>觀測問答</i></h1><p>以行星、星系、太空任務與觀測工具四個難度層級，循序建立可靠的天文證據觀念。</p></div><div className="astronomy-quiz-score"><strong>{score}</strong><span>本輪答對</span></div></header>
    {tierPicker}
    <div className="astronomy-quiz-progress" aria-label={`${tierInfo?.name ?? "天文問答"}進度：第 ${active + 1} 題，共 ${deck.length} 題`}><div><span>{tierInfo?.level}／{tierInfo?.name}</span><strong id="astronomy-progress-status">第 {active + 1} / {deck.length} 題</strong></div><div aria-hidden="true"><i style={{ width: `${progress}%` }} /></div><small>{answered ? "本題已結算；請閱讀解析後，手動前往下一題。" : tierInfo?.description}</small></div>
    <QuestionTransition itemKey={active} className="astronomy-question-transition">
    <article className={`astronomy-quiz-card ${answered ? selected === question?.answer ? "is-correct" : "is-wrong" : ""}`} aria-describedby="astronomy-progress-status"><div className="astronomy-quiz-meta"><span>{tierInfo?.name}／{question?.topic}</span><span>{answered ? "解析已開啟" : "等待觀測回答"}</span></div><p className="eyebrow">SKY QUESTION / {String(active + 1).padStart(2, "0")}</p><h2>{question?.prompt}</h2><div className="astronomy-option-list">{question?.options.map((option, index) => { const isCorrect = index === question.answer; const isSelected = selected === index; return <button key={option} type="button" aria-pressed={isSelected} className={`${answered && isCorrect ? "correct" : ""} ${answered && isSelected && !isCorrect ? "wrong" : ""}`} disabled={answered} onClick={() => choose(index)} onKeyDown={(event) => keyActivate(event, () => choose(index))}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong>{answered && isCorrect && <Check size={17} />}{answered && isSelected && !isCorrect && <X size={17} />}</button>; })}</div>{answered && <div className={`astronomy-quiz-feedback ${selected === question?.answer ? "good" : "needs-work"}`} role="status"><strong>{selected === question?.answer ? "答對了，這個天文線索已記錄。" : "先保存這個線索，再從解析建立下一次判斷。"}</strong><p>{question?.explanation}</p></div>}<footer><span>固定題組 · 不會自動跳至其他答題環節</span>{answered && <button type="button" className="btn primary small" onClick={next} onKeyDown={(event) => keyActivate(event, next)}>{active >= deck.length - 1 ? "查看結果" : "下一題"} <ChevronRight size={15} /></button>}</footer></article>
    </QuestionTransition>
  </section>;
}
