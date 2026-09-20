import React, { useState } from "react";
import OnionLesson from "@/components/classroom/OnionLesson";
import OnionAcademyGame from "@/components/classroom/OnionAcademyGame";
import OnionBankTheater from "@/components/classroom/OnionBankTheater";

type Props = {
  bestStars?: number;
  onBest: (r: { stars: number; correct: number; total: number }) => void;
  onExit: () => void;
  /** 進站預設顯示哪個分頁：舊「分數工坊」入口進來會直接帶到分數工坊。 */
  initial?: "lessons" | "workshop";
};

type TabId = "lessons" | "theater" | "workshop";

const TABS: Array<{ id: TabId; label: string; sub: string }> = [
  { id: "lessons", label: "動畫課", sub: "多學科，逐堂看動畫＋闖關" },
  { id: "theater", label: "題庫劇場", sub: "5000 題庫存，每次開演都不同" },
  { id: "workshop", label: "分數工坊", sub: "分數四層，逐層解鎖" },
];

/**
 * 洋蔥學院單一入口。
 *
 * 原本「分數工坊」與「洋蔥動畫講解」是兩個獨立頁面、教室裡兩張卡片，
 * 學生要記得它們其實是同一套學習系統的兩種形式。合成一頁後只保留一個入口，
 * 用 Tab 切換；舊網址 /classroom/onion 仍會進來，並自動帶到分數工坊分頁。
 * 題庫劇場是第三種形式：題目不是寫死的，而是從全站 5000 題的內建題庫
 * 動態抽取，讓整座題庫與洋蔥動畫互相利用。
 */
export default function OnionAcademyHub({ bestStars, onBest, onExit, initial = "lessons" }: Props) {
  const [tab, setTab] = useState<TabId>(initial);

  return (
    <div className="onion-hub">
      <div className="onion-hub-tabs" role="tablist" aria-label="洋蔥學院學習形式">
        {TABS.map(({ id, label, sub }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`onion-hub-tab ${tab === id ? "is-on" : ""}`}
            onClick={() => setTab(id)}
          >
            <span className="onion-hub-tab-label">{label}</span>
            <span className="onion-hub-tab-sub">{sub}</span>
          </button>
        ))}
      </div>
      {tab === "lessons" ? (
        <OnionAcademyGame bestStars={bestStars} onBest={onBest} onExit={onExit} />
      ) : tab === "theater" ? (
        <OnionBankTheater bestStars={bestStars} onBest={onBest} onExit={onExit} />
      ) : (
        <OnionLesson bestStars={bestStars} onBest={onBest} onExit={onExit} />
      )}
    </div>
  );
}
