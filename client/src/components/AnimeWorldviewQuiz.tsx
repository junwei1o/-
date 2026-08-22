import React, { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { SpeechReadableText } from "@/components/SpeechReadableText";
import { QuestionTransition } from "@/components/QuestionTransition";
import {
  getAnimeWorldviewQuestions,
  getAnimeWorldviewResultMessage,
  scoreAnimeWorldviewQuiz,
  type AnimeWorldviewKey,
} from "@/lib/animeWorldviewQuiz";

export type AnimeWorldviewQuizProps = {
  entryKey: AnimeWorldviewKey;
  title: string;
  onBack: () => void;
  onComplete?: (result: { entryKey: AnimeWorldviewKey; correct: number; total: number; percentage: number }) => void;
};

export default function AnimeWorldviewQuiz({ entryKey, title, onBack, onComplete }: AnimeWorldviewQuizProps) {
  const questions = useMemo(() => getAnimeWorldviewQuestions(entryKey), [entryKey]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<number | null>>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions[questionIndex];
  const currentAnswer = answers[questionIndex];
  const result = scoreAnimeWorldviewQuiz(questions, answers);

  const restart = () => {
    setQuestionIndex(0);
    setSelected(null);
    setAnswers(questions.map(() => null));
    setSubmitted(false);
    setFinished(false);
  };

  const confirmAnswer = () => {
    if (!question || selected === null) return;
    setAnswers((previous) => previous.map((answer, index) => index === questionIndex ? selected : answer));
    setSubmitted(true);
  };

  const nextQuestion = () => {
    if (!submitted) return;
    if (questionIndex >= questions.length - 1) {
      onComplete?.({ entryKey, ...result });
      setFinished(true);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelected(null);
    setSubmitted(false);
  };

  if (questions.length === 0) return null;

  if (finished) {
    return (
      <section className="anime-quiz-panel anime-quiz-result" aria-labelledby="anime-quiz-result-title">
        <div className="anime-quiz-result-icon" aria-hidden="true"><CheckCircle2 size={26} /></div>
        <p className="eyebrow accent">OBSERVATION COMPLETE / 觀測完成</p>
        <h2 id="anime-quiz-result-title">{title}小測驗結果</h2>
        <p className="anime-quiz-score"><strong>{result.correct}</strong><span>／{result.total} 題答對</span></p>
        <p className="anime-quiz-result-message">{getAnimeWorldviewResultMessage(result.correct, result.total)}</p>
        <div className="anime-quiz-result-actions">
          <button type="button" className="btn primary" onClick={restart}><RotateCcw size={16} /> 再挑戰一次</button>
          <button type="button" className="btn secondary" onClick={onBack}><ArrowLeft size={16} /> 返回觀測卡</button>
        </div>
      </section>
    );
  }

  return (
    <section className="anime-quiz-panel" aria-labelledby="anime-quiz-title">
      <div className="anime-quiz-heading">
        <div>
          <p className="eyebrow accent"><Sparkles size={14} /> WORLDVIEW CHECK / 主題小測驗</p>
          <h2 id="anime-quiz-title">探索後，試著整理線索</h2>
        </div>
        <span className="anime-quiz-progress" aria-label={`第 ${questionIndex + 1} 題，共 ${questions.length} 題`}>{questionIndex + 1} / {questions.length}</span>
      </div>
      <div className="anime-quiz-progressbar" aria-hidden="true"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
      <QuestionTransition itemKey={questionIndex} className="anime-question-transition">
      <p className="anime-quiz-focus">本題觀測焦點：{question.focus}</p>
      <div className="anime-quiz-prompt-row">
        <SpeechReadableText text={question.prompt} label="朗讀題目" as="h3" className="anime-quiz-prompt" buttonClassName="anime-quiz-speech" />
      </div>
      <div className="anime-quiz-options" role="radiogroup" aria-label="答案選項">
        {question.options.map((option, index) => {
          const isCorrect = submitted && index === question.answer;
          const isWrong = submitted && currentAnswer === index && index !== question.answer;
          return (
            <div
              role="radio"
              aria-checked={selected === index || currentAnswer === index}
              aria-disabled={submitted}
              className={`anime-quiz-option${selected === index ? " is-selected" : ""}${isCorrect ? " is-correct" : ""}${isWrong ? " is-wrong" : ""}`}
              tabIndex={submitted ? -1 : 0}
              onClick={() => { if (!submitted) setSelected(index); }}
              onKeyDown={(event) => { if (!submitted && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelected(index); } }}
              key={option}
            >
              <span className="anime-quiz-option-index">{String.fromCharCode(65 + index)}</span>
              <SpeechReadableText text={option} label={`朗讀選項 ${String.fromCharCode(65 + index)}`} className="anime-quiz-option-text" buttonClassName="anime-quiz-option-speech" />
            </div>
          );
        })}
      </div>
      {submitted && <div className={`anime-quiz-explanation ${currentAnswer === question.answer ? "is-correct" : "is-wrong"}`} role="status"><strong>{currentAnswer === question.answer ? "答對了！" : "先記住這個線索"}</strong><SpeechReadableText text={question.explanation} label="朗讀題目解析" className="anime-quiz-explanation-text" buttonClassName="anime-quiz-speech" /></div>}
      <div className="anime-quiz-actions">
        {!submitted ? <button type="button" className="btn primary" disabled={selected === null} onClick={confirmAnswer}>確認答案</button> : <button type="button" className="btn primary" onClick={nextQuestion}>{questionIndex === questions.length - 1 ? "查看結果" : "下一題"}</button>}
        <button type="button" className="btn secondary" onClick={onBack}>返回觀測卡</button>
      </div>
      </QuestionTransition>
    </section>
  );
}
