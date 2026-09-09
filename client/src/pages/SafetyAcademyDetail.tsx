import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Coins,
  ExternalLink,
  HeartPulse,
  Info,
  Lightbulb,
  RotateCcw,
  Siren,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import {
  SAFETY_CARDS,
  SAFETY_QUIZ_REWARD_COINS,
  getSafetyCard,
  getSafetyHall,
} from "@/lib/safetyAcademy";
import { loadRpgState, recordSafetyAcademyAnswer } from "@/game/rpgStorage";
import { isSafetyCardCompleted, type SafetyAcademyProgress } from "@/game/safetyAcademyProgress";
import "./SafetyAcademy.css";

const OPTION_MARKS = ["A", "B", "C", "D"];

export default function SafetyAcademyDetail() {
  const { key } = useParams<{ key: string }>();
  const [, setLocation] = useLocation();
  const card = getSafetyCard(key);

  const [progress, setProgress] = useState<SafetyAcademyProgress | undefined>(
    () => loadRpgState().safetyAcademyProgress,
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  if (!card) {
    return (
      <main className="safety-detail-shell">
        <header className="safety-topbar">
          <Link href="/safety" className="safety-back"><ArrowLeft size={16} /> 返回生活安全學院</Link>
        </header>
        <section className="safety-not-found">
          <Siren size={34} aria-hidden="true" />
          <h1>找不到這張知識卡</h1>
          <p>請回到生活安全學院，選擇一個主題館開始閱讀。</p>
          <Link href="/safety">返回生活安全學院</Link>
        </section>
      </main>
    );
  }

  const hall = getSafetyHall(card.hall);
  const index = SAFETY_CARDS.findIndex((item) => item.key === card.key);
  const next = SAFETY_CARDS[(index + 1) % SAFETY_CARDS.length];
  const alreadyDone = isSafetyCardCompleted(progress, card.key);
  const isCorrect = submitted && selected === card.quiz.answer;

  const submit = () => {
    if (selected === null || submitted) return;
    const correct = selected === card.quiz.answer;
    const result = recordSafetyAcademyAnswer({ cardKey: card.key, correct });
    setRewarded(result.rewarded);
    setProgress(result.state.safetyAcademyProgress);
    setSubmitted(true);
  };

  const retry = () => {
    setSelected(null);
    setSubmitted(false);
  };

  const optionClass = (optionIndex: number) => {
    if (!submitted) return `safety-quiz-option${selected === optionIndex ? " is-selected" : ""}`;
    if (optionIndex === card.quiz.answer) return "safety-quiz-option is-correct";
    if (selected === optionIndex) return "safety-quiz-option is-wrong";
    return "safety-quiz-option";
  };

  return (
    <main className={`safety-detail-shell safety-hall-${card.hall}`}>
      <header className="safety-topbar">
        <Link href="/safety" className="safety-back"><ArrowLeft size={16} /> 返回生活安全學院</Link>
        <span className="safety-code">SAFETY CARD / {String(index + 1).padStart(2, "0")}</span>
      </header>

      <nav className="safety-breadcrumb" aria-label="麵包屑導覽">
        <Link href="/">航海主頁</Link><span aria-hidden="true">/</span>
        <Link href="/safety">生活安全學院</Link><span aria-hidden="true">/</span>
        <strong aria-current="page">{card.title}</strong>
      </nav>

      <section className="safety-detail-hero">
        <p className="eyebrow accent">{card.eyebrow}</p>
        <h1>{card.title}</h1>
        <p className="safety-detail-lede">{card.short}</p>
        <span className="safety-detail-emblem" aria-hidden="true">
          {card.hall === "medical" ? <HeartPulse size={78} /> : card.hall === "fire" ? <Siren size={78} /> : <BadgeCheck size={78} />}
        </span>
      </section>

      {card.hall === "medical" && (
        <section className="safety-medical-note" aria-label="醫療提醒">
          <Info size={17} aria-hidden="true" />
          <span>這裡學習的是醫療常識，不能取代醫生的診斷。身體不舒服或受傷時，一定要告訴大人並及時就醫；遇到緊急狀況，請立刻請大人撥打 119。</span>
        </section>
      )}

      <section className="safety-detail-grid">
        <article className="safety-content-card wide">
          <div className="safety-card-kicker"><BookOpen size={15} aria-hidden="true" /> 把知識說清楚</div>
          <h2>先認識這個狀況</h2>
          {card.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex}>{paragraph}</p>
          ))}
        </article>

        <article className="safety-content-card">
          <div className="safety-card-kicker"><BadgeCheck size={15} aria-hidden="true" /> 記住這樣做</div>
          <h2>安全行動清單</h2>
          <ul className="safety-tip-list">
            {card.actionTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </article>

        <article className="safety-content-card">
          <div className="safety-card-kicker"><Lightbulb size={15} aria-hidden="true" /> 生活連結</div>
          <h2>它和我有什麼關係？</h2>
          <p>{card.lifeConnection}</p>
        </article>
      </section>

      <section className="safety-quiz" aria-labelledby="safety-quiz-title">
        <span className="safety-quiz-kicker"><Siren size={14} aria-hidden="true" /> 情境小測驗 · 首次答對可獲得 {SAFETY_QUIZ_REWARD_COINS} 金幣</span>
        <h2 id="safety-quiz-title">如果你遇到這個狀況</h2>
        <p className="safety-quiz-prompt">{card.quiz.prompt}</p>
        <div className="safety-quiz-options" role="group" aria-label="作答選項">
          {card.quiz.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              className={optionClass(optionIndex)}
              disabled={submitted}
              onClick={() => setSelected(optionIndex)}
              aria-pressed={selected === optionIndex}
            >
              <span className="opt-mark" aria-hidden="true">{OPTION_MARKS[optionIndex]}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        <div className="safety-quiz-actions">
          {!submitted && (
            <button type="button" className="safety-quiz-btn" onClick={submit} disabled={selected === null}>
              送出答案
            </button>
          )}
          {submitted && !isCorrect && (
            <button type="button" className="safety-quiz-btn" onClick={retry}>
              <RotateCcw size={15} aria-hidden="true" /> 再試一次
            </button>
          )}
        </div>

        {submitted && (
          <div className={`safety-quiz-feedback ${isCorrect ? "good" : "bad"}`} role="status">
            <strong>{isCorrect ? "答對了！這個選擇很安全。" : "再想想看，這個選項可能有危險。"}</strong>
            <span>{card.quiz.explanation}</span>
            {isCorrect && rewarded && (
              <span className="safety-reward"><Coins size={15} aria-hidden="true" /> 獲得 {SAFETY_QUIZ_REWARD_COINS} 金幣！可到每日營地商店運用</span>
            )}
            {isCorrect && !rewarded && (
              <span className="safety-already-done"><CheckCircle2 size={14} aria-hidden="true" /> 這張卡你之前已經完成過</span>
            )}
          </div>
        )}
        {!submitted && alreadyDone && (
          <p className="safety-already-done" style={{ marginTop: 14 }}>
            <CheckCircle2 size={14} aria-hidden="true" /> 你已經完成過這張卡，再練習一次也不會重複給予金幣
          </p>
        )}
      </section>

      <footer className="safety-detail-footer">
        <p>資料依據：{card.sourceLabel}公開衛教素材原創改寫</p>
        <a className="safety-source" href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
          閱讀原始資料 <ExternalLink size={13} aria-hidden="true" />
        </a>
        <button type="button" className="safety-next-btn" onClick={() => setLocation(`/safety/${next.key}`)}>
          下一張：{next.title} <ArrowRight size={15} aria-hidden="true" />
        </button>
      </footer>
    </main>
  );
}
