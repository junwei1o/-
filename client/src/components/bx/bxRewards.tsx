import React, { useSyncExternalStore } from "react";
import { bxStore } from "@/game/bxStore";

/**
 * BX 獎勵反饋層：toast 輕提示、alert 強制對話框、celebrate 撒花。
 * 以模組級 pub/sub 提供命令式 API（bxToast/bxAlert/bxCelebrate），
 * 由 <BxToastHost/> 訂閱並渲染，與 bx-enhance.css 的 .bx-toast/.bx-confetti/.bx-modal 對應。
 */

export interface BxToastItem {
  id: number;
  msg: string;
}

interface RewardsSnapshot {
  toasts: BxToastItem[];
  alertMsg: string | null;
  confettiSeed: number;
}

let seq = 0;
let toasts: BxToastItem[] = [];
let alertMsg: string | null = null;
let confettiSeed = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // 單一監聽器錯誤不影響其他元件。
    }
  });
}

// 以淺層不變性維護快照，避免 useSyncExternalStore 無限迴圈。
function snapshot(): RewardsSnapshot {
  return { toasts: [...toasts], alertMsg, confettiSeed };
}

let lastSnapshot: RewardsSnapshot | null = null;
function stableSnapshot(): RewardsSnapshot {
  const next = snapshot();
  if (
    !lastSnapshot ||
    lastSnapshot.alertMsg !== next.alertMsg ||
    lastSnapshot.confettiSeed !== next.confettiSeed ||
    lastSnapshot.toasts.length !== next.toasts.length ||
    lastSnapshot.toasts.some((t, i) => t.id !== next.toasts[i]?.id)
  ) {
    lastSnapshot = next;
  }
  return lastSnapshot;
}

export function bxToast(msg: string, ms = 2600) {
  const id = ++seq;
  toasts = [...toasts, { id, msg }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, ms);
}

export function bxAlert(msg: string) {
  alertMsg = msg;
  emit();
}

export function bxClearAlert() {
  alertMsg = null;
  emit();
}

export function bxCelebrate(title: string) {
  // 尊重「減少動畫」偏好：關閉撒花，僅以文字提示。
  if (bxStore.get<boolean>("prefs.reduceMotion", false)) {
    bxToast(title, 3200);
    return;
  }
  confettiSeed += 1;
  bxToast(title, 3200);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const CONFETTI_COLORS = ["#F5A623", "#FFD86B", "#5FA8D3", "#7ED6A5", "#FF8A8A"];

export function BxToastHost() {
  const state = useSyncExternalStore(subscribe, stableSnapshot);
  const showConfetti = state.confettiSeed > 0 && !bxStore.get<boolean>("prefs.reduceMotion", false);

  return (
    <>
      <div className="bx-toasts" aria-live="polite">
        {state.toasts.map((t) => (
          <div key={t.id} className="bx-toast bx-toast--in">
            {t.msg}
          </div>
        ))}
      </div>

      {showConfetti ? (
        <div className="bx-confetti" aria-hidden="true" key={state.confettiSeed}>
          {Array.from({ length: 44 }, (_, i) => {
            const left = Math.random() * 100;
            const dx = (Math.random() - 0.5) * 180;
            const r = Math.random() * 720 - 360;
            const delay = Math.random() * 0.4;
            return (
              <i
                key={i}
                style={{
                  left: `${left}%`,
                  ["--dx" as string]: `${dx}px`,
                  ["--r" as string]: `${r}deg`,
                  animationDelay: `${delay}s`,
                  background: CONFETTI_COLORS[i % 5],
                }}
              />
            );
          })}
        </div>
      ) : null}

      {state.alertMsg ? (
        <div className="bx-modal" role="alertdialog" onClick={(e) => { if (e.target === e.currentTarget) bxClearAlert(); }}>
          <div className="bx-modal__box bx-modal__box--sm">
            <p>{state.alertMsg}</p>
            <button type="button" className="bx-btn bx-btn--primary" onClick={bxClearAlert}>
              我知道了
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
