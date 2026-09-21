import React, { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";
import { toast } from "sonner";
import type { PaperQuestion } from "@/lib/paperExam";
import type { KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import { addRecord, consumeStorageNotice, getLearningRecord, recordAnalyticsEvent } from "@/utils/storage";
import { recordRpgAnswer } from "@/game/rpgStorage";
import { recordPipiEvent } from "@/game/pipiCompanion";

export type QuizModalProps = { question: PaperQuestion; subject: KnowledgeIslandSubject; onClose: () => void; onCompleted: () => void };

export function QuizModal({ question, subject, onClose, onCompleted }: QuizModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); };
  }, []);

  const answered = selectedOption !== null;
  const correct = selectedOption === question.answer;
  const locked = answered || saved;

  function answer(index: number) {
    if (locked) return;
    const isCorrect = index === question.answer;
    setSelectedOption(index);
    setCorrectAnswer(isCorrect);
    recordAnalyticsEvent({ type: "answer", subject, questionId: question.id, correct: isCorrect, timestamp: Date.now() });
    try {
      addRecord({ questionId: question.id, subject, isCorrect, errorType: isCorrect ? undefined : "concept", timestamp: Date.now(), flagged: false, knowledge: [question.learningTopic], difficulty: question.difficulty === "標準" || question.difficulty === "挑戰" ? question.difficulty : "基礎", responseMs: 0, timeLimitMs: 25_000 });
      recordRpgAnswer({ eventId: `island-quiz-${question.id}-${Date.now()}`, correct: isCorrect, curriculumDomain: subject, difficulty: question.difficulty, subject });
      if (isCorrect) recordPipiEvent("answer-correct");
    } catch (error) { console.error("答題資料保存失敗", error); toast.warning("儲存空間不足，部分資料可能無法保存"); }
    const notice = consumeStorageNotice();
    if (notice) toast.warning(notice.message);
    setSaved(true);
    onCompleted();
  }

  return <div className="quiz-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saved) onClose(); }}>
    <section className="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-modal-title" aria-describedby="quiz-modal-prompt">
      <header className="quiz-modal-header"><div><p className="eyebrow">{subject}島・學習遠征</p><h2 id="quiz-modal-title">留下學習線索</h2></div><button ref={closeRef} type="button" className="quiz-modal-close" onClick={onClose} aria-label="關閉答題視窗"><X size={18} aria-hidden="true" /></button></header>
      <p className="quiz-modal-topic">主題：{question.learningTopic}</p>
      <p id="quiz-modal-prompt" className="quiz-modal-prompt">{question.prompt}</p>
      <div className="quiz-modal-options" role="group" aria-label="答題選項">{question.options.map((option, index) => { const isAnswer = index === question.answer; const isSelected = index === selectedOption; const optionClass = answered && isAnswer ? "is-correct" : answered && isSelected ? "is-wrong" : ""; return <button key={`${question.id}-${index}`} type="button" className={`quiz-modal-option ${optionClass}`} onClick={() => answer(index)} disabled={locked} aria-label={`選項 ${index + 1}：${option}`}><span>{index + 1}</span>{option}{answered && isAnswer ? <Check size={17} aria-hidden="true" /> : null}{answered && isSelected && !isAnswer ? <CircleAlert size={17} aria-hidden="true" /> : null}</button>; })}</div>
      {answered ? <div className={`quiz-modal-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status" aria-live="polite"><strong>{correct ? "答對了，學習能量已入袋！" : "整理線索：再想一次會更清楚"}</strong><p>{question.explanation}</p><button type="button" className="quiz-modal-done" onClick={onClose}>繼續探索</button></div> : <p className="quiz-modal-hint">選一個你目前最有把握的答案。</p>}
    </section>
  </div>;
}
