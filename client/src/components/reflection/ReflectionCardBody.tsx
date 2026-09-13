import React from "react";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { BRAIN_SOURCE_LABEL } from "@/game/companionBrain";
import type { ReflectionCard } from "@/game/reflectionWorkspace";
import { reflectionWorkspace } from "@/game/reflectionWorkspace";

const MAX_TURNS = 12;

/** 單張堆疊卡片的對話本體：提問串流、來源標籤、追問按鈕。 */
export function ReflectionCardBody({ card }: { card: ReflectionCard }) {
  const reachedCap = card.turns.length >= MAX_TURNS;
  return (
    <div className="rc-thread-wrap">
      <p className="rc-intro">
        <BrainCircuit size={15} aria-hidden="true" />
        伴小星不會直接說答案，會一次問你一個問題，陪你自己把道理想出來。
      </p>
      <div className="rc-thread" role="log" aria-live="polite">
        {card.turns.map((item) => (
          <article key={item.id} className="rc-bubble">
            <p className="rc-text">{item.text}</p>
            <span className={`rc-source is-${item.source}`}>{BRAIN_SOURCE_LABEL[item.source]}</span>
          </article>
        ))}
        {card.pendingTurn ? <p className="rc-loading" role="status">伴小星正在想問題…</p> : null}
        {card.notice ? <p className="rc-notice" role="alert">{card.notice}</p> : null}
      </div>
      <footer className="rc-foot">
        <button
          type="button"
          className="rc-more"
          onClick={() => reflectionWorkspace.requestMore(card.id)}
          disabled={!!card.pendingTurn || reachedCap}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {card.pendingTurn === "more" ? "思考中…" : "換個角度再問我"}
        </button>
        <small>
          {reachedCap
            ? "已經陪你想很多面向了，剩下的交給你自己試試看。"
            : "離線規則腦隨時可用；AI 提問每分鐘有安全次數上限。"}
        </small>
      </footer>
    </div>
  );
}

export default ReflectionCardBody;
