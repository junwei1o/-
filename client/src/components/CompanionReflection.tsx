import React, { useEffect, useRef, useState } from "react";
import { Sparkles, X, RefreshCw, BrainCircuit } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getPlayerName } from "@/utils/storage";
import { loadUserPreferences } from "@/game/adaptiveLearning";
import {
  BRAIN_SOURCE_LABEL,
  buildRuleReflection,
  loadCompanionConfig,
  type CompanionBrainSource,
  type RuleReflectionInput,
} from "@/game/companionBrain";
import "./CompanionReflection.css";

export type CompanionReflectionProps = {
  /** 題幹文字。 */
  question: string;
  options: string[];
  /** 學生本題選的選項 index（答題後必有）。 */
  selectedIndex: number;
  /** 正確選項 index。 */
  answerIndex: number;
  subject: string;
  learningTopic?: string;
};

type ReflectionTurn = {
  id: number;
  turn: "first" | "more";
  text: string;
  source: CompanionBrainSource;
};

const MAX_TURNS = 12;

/**
 * 答題後的「深度伴讀」唯一入口：伴小星不直接給答案，只一次丟一個蘇格拉底提問。
 * LLM 腦（自備代理或內建模型）失敗／被每分鐘限額擋下時，自動降級離線規則腦。
 */
export function CompanionReflection({
  question,
  options,
  selectedIndex,
  answerIndex,
  subject,
  learningTopic,
}: CompanionReflectionProps) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ReflectionTurn[]>([]);
  const [pending, setPending] = useState<"first" | "more" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const turnIdRef = useRef(0);
  const inflightRef = useRef(false);
  const reflect = trpc.aiCompanion.reflect.useMutation();

  // 換題時重置對話（元件在 PaperExam 中持續掛載，題目切換要關掉舊對話）。
  useEffect(() => {
    setOpen(false);
    setTurns([]);
    setNotice(null);
    setPending(null);
    inflightRef.current = false;
  }, [question]);

  // Esc 關閉。
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function buildContext(turn: "first" | "more"): RuleReflectionInput {
    return {
      question,
      options,
      selectedAnswer: selectedIndex >= 0 ? options[selectedIndex] ?? "" : "",
      correctAnswer: options[answerIndex] ?? "",
      correct: selectedIndex === answerIndex,
      subject,
      learningTopic,
      turn,
    };
  }

  async function ask(turn: "first" | "more") {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setPending(turn);
    setNotice(null);
    const context = buildContext(turn);
    try {
      const config = loadCompanionConfig();
      const preferences = loadUserPreferences();
      const result = await reflect.mutateAsync({
        studentName: getPlayerName() || undefined,
        proxy: config
          ? { base: config.base, key: config.key, model: config.model || undefined }
          : null,
        question: context.question,
        options: context.options,
        selectedAnswer: context.selectedAnswer,
        correctAnswer: context.correctAnswer,
        correct: context.correct,
        subject: context.subject,
        learningTopic: context.learningTopic,
        grade: preferences.gradeLevel,
        turn,
      });
      turnIdRef.current += 1;
      setTurns((prev) => [
        ...prev,
        { id: turnIdRef.current, turn, text: result.text, source: result.source },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimited = /每分鐘|TOO_MANY_REQUESTS|429/.test(message);
      setNotice(
        isRateLimited
          ? message
          : "AI 學習夥伴暫時連不上，先由離線規則腦陪你想一想。",
      );
      turnIdRef.current += 1;
      setTurns((prev) => [
        ...prev,
        { id: turnIdRef.current, turn, text: buildRuleReflection(context), source: "rule" },
      ]);
    } finally {
      setPending(null);
      inflightRef.current = false;
    }
  }

  function openDialog() {
    setOpen(true);
    if (turns.length === 0) void ask("first");
  }

  const reachedCap = turns.length >= MAX_TURNS;

  return (
    <div className="companion-reflect">
      <button
        type="button"
        className="companion-reflect-trigger"
        onClick={openDialog}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Sparkles size={16} aria-hidden="true" />
        和伴小星聊聊這題
      </button>

      {open ? (
        <div
          className="companion-reflect-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="companion-reflect-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="companion-reflect-title"
          >
            <header className="companion-reflect-head">
              <div>
                <p className="companion-reflect-eyebrow">深度伴讀</p>
                <h2 id="companion-reflect-title">
                  <BrainCircuit size={20} aria-hidden="true" />
                  伴小星陪你想
                </h2>
              </div>
              <button
                type="button"
                className="companion-reflect-close"
                onClick={() => setOpen(false)}
                aria-label="關閉深度伴讀"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <p className="companion-reflect-intro">
              伴小星不會直接說答案，會一次問你一個問題，陪你自己把道理想出來。
            </p>

            <div className="companion-reflect-thread" role="log" aria-live="polite">
              {turns.map((item) => (
                <article key={item.id} className="companion-reflect-bubble">
                  <p className="companion-reflect-text">{item.text}</p>
                  <span className={`companion-reflect-source is-${item.source}`}>
                    {BRAIN_SOURCE_LABEL[item.source]}
                  </span>
                </article>
              ))}
              {pending ? (
                <p className="companion-reflect-loading" role="status">
                  伴小星正在想問題…
                </p>
              ) : null}
              {notice ? <p className="companion-reflect-notice" role="alert">{notice}</p> : null}
            </div>

            <footer className="companion-reflect-foot">
              <button
                type="button"
                className="companion-reflect-more"
                onClick={() => void ask("more")}
                disabled={!!pending || reachedCap}
              >
                <RefreshCw size={15} aria-hidden="true" />
                {pending === "more" ? "思考中…" : "換個角度再問我"}
              </button>
              {reachedCap ? (
                <small>已經陪你想很多面向了，剩下的交給你自己試試看。</small>
              ) : (
                <small>離線規則腦隨時可用；AI 提問每分鐘有安全次數上限。</small>
              )}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default CompanionReflection;
