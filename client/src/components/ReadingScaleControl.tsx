import React, { useState } from "react";
import {
  getReadingScale,
  setReadingScale,
  READING_SCALE_FACTORS,
  type ReadingScale,
} from "@/game/readingScale";
import "./ReadingScaleControl.css";

type Option = { value: ReadingScale; label: string; full: string };

const OPTIONS: Option[] = [
  { value: "none", label: "標準", full: "標準（不調整字級）" },
  { value: "large", label: "大", full: "大字級（1.15 倍）" },
  { value: "xlarge", label: "特大", full: "特大字級（1.3 倍）" },
];

/**
 * 閱讀字號控制：三檔切換（標準 / 大 / 特大），緊湊版，適合放在設定頁的無障礙區塊。
 * 只影響答題頁的題目、選項、解析與提示文字，不動全站 rem 佈局。
 */
export function ReadingScaleControl() {
  const [scale, setScale] = useState<ReadingScale>(() => getReadingScale());

  const choose = (next: ReadingScale) => {
    setScale(next);
    setReadingScale(next);
  };

  return (
    <div className="reading-scale-control">
      <p className="reading-scale-desc">
        覺得題目或選項字太小嗎？可以放大「答題頁」的題目、選項、解析與提示文字，設定會自動儲存在這台裝置。
      </p>
      <div className="reading-scale-buttons" role="group" aria-label="閱讀字號">
        {OPTIONS.map((opt) => {
          const active = scale === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              className={`reading-scale-btn${active ? " is-active" : ""}`}
              aria-pressed={active}
              aria-label={opt.full}
              onClick={() => choose(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p
        className="reading-scale-preview"
        aria-hidden="true"
        style={{ fontSize: `${READING_SCALE_FACTORS[scale]}em` }}
      >
        這是預覽文字：國小課綱學習，輕鬆又有趣！
      </p>
    </div>
  );
}

export default ReadingScaleControl;
