import React, { useEffect, useState } from "react";
import "./AnswerCombo.css";

type Props = {
  /** 目前連續答對幾題（答錯歸零）。 */
  combo: number;
  /** 每次答對就遞增，用來重播動畫。 */
  trigger: number;
};

/**
 * 答題連擊提示（純視覺裝飾）。
 *
 * 設計取捨：
 * - 只固定在畫面上緣短暫浮現，不擋題目與選項（小孩被擋住會亂點）。
 * - 刻意標 aria-hidden：答對結果本來就由 notice 以 aria-live 播報，
 *   這裡再播一次只會打斷使用朗讀功能的孩子。
 * - 動畫在 prefers-reduced-motion 時關閉，只留下靜態顯示。
 */
export function AnswerCombo({ combo, trigger }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (combo < 2 || trigger === 0) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 1100);
    return () => window.clearTimeout(timer);
  }, [combo, trigger]);

  if (!visible || combo < 2) return null;

  return (
    <div className="answer-combo" aria-hidden="true" key={trigger}>
      <span className="answer-combo-flame">🔥</span>
      <span className="answer-combo-count">{combo}</span>
      <span className="answer-combo-label">連擊</span>
    </div>
  );
}
