import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { bxStore, BX_EVENTS } from "@/game/bxStore";
import { bxCelebrate } from "./bxRewards";

/**
 * BX.Empty.Quest — 「第一盞燈」破冰任務橫幅。
 * 首次答題前提示前往答題；首次答對後慶祝（撒花＋島嶼點亮）並轉為「連續答對 3 題」階段；
 * 達 3 題或手動關閉後隱藏。
 */
export default function FirstLightQuest() {
  const [, force] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [burst, setBurst] = useState(false);
  const celebratedRef = useRef(false);

  const refresh = useCallback(() => force((v) => v + 1), []);

  const celebrate = useCallback(() => {
    setBurst(true);
    bxCelebrate("🏅 解鎖徽章【啟航者】　+20 金幣");
    // 點亮對應島嶼：幫畫面上的 [data-island] 加亮燈動畫。
    const islandMap: Record<string, string> = { chinese: "north", math: "central", social: "south", science: "east" };
    const islands = bxStore.get("islands", {}) as Record<string, boolean>;
    document.querySelectorAll<HTMLElement>("[data-island]").forEach((node, i) => {
      const subject = node.dataset.subject;
      const region = subject ? islandMap[subject] : undefined;
      if (subject && region && islands[region]) {
        setTimeout(() => node.classList.add("bx-island--lit"), i * 160);
      }
    });
    setTimeout(() => {
      setBurst(false);
      refresh();
    }, 2200);
  }, [refresh]);

  useEffect(() => {
    const onAnswer = (e: Event) => {
      const detail = (e as CustomEvent).detail as { firstLight?: boolean; correct?: boolean } | undefined;
      refresh();
      if (detail?.firstLight && detail?.correct && !celebratedRef.current) {
        celebratedRef.current = true;
        celebrate();
      }
    };
    const onCheckin = () => refresh();
    document.addEventListener(BX_EVENTS.answer, onAnswer);
    document.addEventListener(BX_EVENTS.checkin, onCheckin);
    return () => {
      document.removeEventListener(BX_EVENTS.answer, onAnswer);
      document.removeEventListener(BX_EVENTS.checkin, onCheckin);
    };
  }, [celebrate, refresh]);

  const done = bxStore.get<boolean>("stats.first_light_done", false) ?? false;
  const correct = bxStore.get<number>("stats.total_correct", 0) ?? 0;

  if (hidden) return null;
  if (done && correct >= 3) return null;

  const isStageDone = done && correct < 3;

  return (
    <div className={`bx-quest ${isStageDone ? "bx-quest--done" : ""} ${burst ? "bx-quest--burst" : ""}`}>
      <div className="bx-quest__icon" aria-hidden="true">⚓</div>
      <div className="bx-quest__body">
        <strong className="bx-quest__title">
          {isStageDone ? "第一盞燈亮了！✨" : "新手任務：點亮第一盞燈"}
        </strong>
        <span className="bx-quest__desc">
          {isStageDone ? `接下來，試試連續答對 3 題（目前 ${correct} 題）` : "答對 1 題，你的航海圖就會永久亮起。"}
        </span>
        <span className="bx-quest__prog">
          {isStageDone
            ? `進度：${"●".repeat(Math.min(correct, 3))}${"○".repeat(Math.max(0, 3 - correct))} ${correct} / 3`
            : "進度：○ 0 / 1"}
        </span>
      </div>
      <Link className="bx-btn bx-btn--primary bx-btn--sm" href="/practice">
        {isStageDone ? "繼續挑戰" : "前往答題"}
      </Link>
      <button type="button" className="bx-quest__close" aria-label="關閉任務提示" onClick={() => setHidden(true)}>×</button>
    </div>
  );
}
