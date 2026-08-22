import React, { useCallback, useMemo, useState } from "react";
import StreakCelebration from "@/components/StreakCelebration";
import AnswerBroadcast from "@/components/AnswerBroadcast";
import { ArrowLeft, Check, ChevronRight, RotateCcw, Sparkles, X } from "lucide-react";
import { CASUAL_QUIZ_CATEGORIES, CASUAL_QUIZ_QUESTIONS, type CasualQuizCategory } from "@/lib/casualQuiz";
import type { SpeechPreferences } from "@/lib/speechPreferences";
import { writeStoredJson } from "@/utils/storage";

type CasualQuizProps = { onExit: () => void; speechPreferences?: SpeechPreferences };
const CASUAL_PROGRESS_KEY = "xue-adventure-casual-quiz-v1";
const CASUAL_ROUND_SIZE = 10;

function createDeck(category: CasualQuizCategory | "全部") {
  const source = category === "全部" ? CASUAL_QUIZ_QUESTIONS : CASUAL_QUIZ_QUESTIONS.filter((question) => question.category === category);
  return shuffle(source).slice(0, Math.min(CASUAL_ROUND_SIZE, source.length));
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function activateWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

export default function CasualQuiz({ onExit, speechPreferences }: CasualQuizProps) {
  const [category, setCategory] = useState<CasualQuizCategory | "全部">("全部");
  const [deck, setDeck] = useState(() => createDeck("全部"));
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [broadcastCount, setBroadcastCount] = useState(0);

  const available = useMemo(() => category === "全部" ? CASUAL_QUIZ_QUESTIONS : CASUAL_QUIZ_QUESTIONS.filter((question) => question.category === category), [category]);
  const question = deck[active];
  const answered = selected !== null;
  const roundProgress = deck.length > 0 ? Math.round((active / deck.length) * 100) : 0;

  const chooseCategory = (next: CasualQuizCategory | "全部") => {
    setCategory(next);
    setDeck(createDeck(next));
    setActive(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setStreak(0);
    setCelebrationStreak(0);
    setAnsweredCount(0);
    setBroadcastCount(0);
  };

  const choose = (index: number) => {
    if (answered || !question) return;
    setSelected(index);
    const nextAnsweredCount = answeredCount + 1;
    setAnsweredCount(nextAnsweredCount);
    if (nextAnsweredCount % 5 === 0) setBroadcastCount(nextAnsweredCount);
    if (index === question.answer) {
      setScore((value) => value + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setCelebrationStreak(nextStreak >= 5 ? nextStreak : 0);
    } else {
      setStreak(0);
      setCelebrationStreak(0);
    }
  };

  const next = () => {
    if (active >= deck.length - 1) {
      writeStoredJson(CASUAL_PROGRESS_KEY, { version: 1, score: score + (selected === question?.answer ? 1 : 0), total: deck.length, category, date: new Date().toISOString() });
      setFinished(true);
      return;
    }
    setActive((value) => value + 1);
    setSelected(null);
    setCelebrationStreak(0);
  };

  const restart = () => chooseCategory(category);
  const closeCelebration = useCallback(() => setCelebrationStreak(0), []);
  const closeBroadcast = useCallback(() => setBroadcastCount(0), []);

  if (finished) {
    return <section className="casual-quiz-page" aria-labelledby="casual-result-title"><div className="casual-quiz-topbar"><button className="text-btn" onClick={onExit} onKeyDown={(event) => activateWithKeyboard(event, onExit)}><ArrowLeft size={16} /> 返回每日挑戰</button><span className="casual-kicker">LEISURE LOG / RESULT</span></div><div className="casual-result"><span className="casual-result-icon"><Sparkles size={25} /></span><p className="eyebrow accent">休閒觀測完成</p><h1 id="casual-result-title">這次答對 <i>{score} / {deck.length}</i> 題</h1><p>把喜歡的作品變成觀察線索，下一輪可以換一個主題再試試。</p><div className="casual-result-actions"><button className="btn primary" onClick={restart} onKeyDown={(event) => activateWithKeyboard(event, restart)}><RotateCcw size={16} /> 再玩一次</button><button className="text-btn" onClick={onExit} onKeyDown={(event) => activateWithKeyboard(event, onExit)}>回到每日挑戰 <ChevronRight size={16} /></button></div></div></section>;
  }

  return <section className="casual-quiz-page" aria-labelledby="casual-quiz-title">{celebrationStreak >= 5 && <StreakCelebration streak={celebrationStreak} onClose={closeCelebration} />}{broadcastCount >= 5 && <AnswerBroadcast answerCount={broadcastCount} soundEnabled={true} speechPreferences={speechPreferences} onClose={closeBroadcast} />}<div className="casual-quiz-topbar"><button className="text-btn" onClick={onExit} onKeyDown={(event) => activateWithKeyboard(event, onExit)}><ArrowLeft size={16} /> 返回每日挑戰</button><span className="casual-kicker">LEISURE LOG / FUN QUIZ</span></div><div className="casual-heading"><div><p className="eyebrow accent">SPECIAL SCREENING / 休閒答題</p><h1 id="casual-quiz-title">特攝動漫 <i>答題活動</i></h1><p>沒有壓力的作品觀測，挑一個主題，看看你記得哪些線索。</p><div className="casual-bank-note">150 題專題題庫（奧特曼／假面騎士／我是奶龍）· 每輪隨機 10 題</div></div><div className="casual-score"><strong>{score}</strong><span>目前答對</span>{streak > 0 && <small>連勝 {streak}</small>}</div></div><div className="casual-category-list" aria-label="特攝動漫題目分類">{CASUAL_QUIZ_CATEGORIES.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => chooseCategory(item)} onKeyDown={(event) => activateWithKeyboard(event, () => chooseCategory(item))}>{item}</button>)}</div><div className="casual-round-progress" aria-label={`本輪答題進度：第 ${active + 1} 題，共 ${deck.length} 題`}><div><span>本輪觀測進度</span><strong id="casual-progress-status">第 {active + 1} / {deck.length} 題</strong></div><div className="casual-progress-meter" aria-hidden="true"><i style={{ width: `${roundProgress}%` }} /></div><small>{answered ? "已記錄本題，查看解析後前往下一個觀測點。" : "選擇一個答案後，即可查看作品線索解析。"}</small></div><div className="casual-quiz-meta"><span>{question?.series} · {question?.category}</span><span>{answered ? "線索解析已開啟" : "等待觀測回答"}</span></div><article className={`casual-question-card ${answered ? selected === question?.answer ? "is-correct" : "is-wrong" : ""}`} aria-describedby="casual-progress-status"><p className="eyebrow">OBSERVATION POINT / {String(active + 1).padStart(2, "0")}</p><h2>{question?.prompt}</h2><div className="casual-option-list">{question?.options.map((option, index) => { const isCorrect = index === question.answer; const isSelected = selected === index; return <button key={option} type="button" aria-pressed={isSelected} className={`casual-option ${answered && isCorrect ? "correct" : ""} ${answered && isSelected && !isCorrect ? "wrong" : ""}`} disabled={answered} onClick={() => choose(index)} onKeyDown={(event) => activateWithKeyboard(event, () => choose(index))}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong>{answered && isCorrect && <Check size={17} />}{answered && isSelected && !isCorrect && <X size={17} />}</button>; })}</div>{answered && <div className={`casual-feedback ${selected === question?.answer ? "good" : "needs-work"}`} role="status"><strong>{selected === question?.answer ? "答對了，觀測線索連上了！" : "先記下這個線索，再看一次解析。"}</strong><p>{question?.explanation}</p></div>}<div className="casual-question-footer"><span>本活動不會改變課綱挑戰紀錄</span>{answered && <button className="btn primary small" onClick={next} onKeyDown={(event) => activateWithKeyboard(event, next)}>{active >= deck.length - 1 ? "查看結果" : "下一題"} <ChevronRight size={15} /></button>}</div></article></section>;
}
