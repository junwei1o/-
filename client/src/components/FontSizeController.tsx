import React, { useEffect, useState } from "react";
import { Type, Minus, Plus, RotateCcw } from "lucide-react";
import "./FontSizeController.css";

// 全站字級控制：調整 html 根元素 font-size，所有 rem 單位會等比縮放。
// 設定保存在本機（key 與專案 xue 前綴一致），啟動時由 initFontSize() 提早套用，避免字級閃爍。
const LEVELS = [
  { value: "small", label: "小", scale: 0.9, size: 14 },
  { value: "normal", label: "中", scale: 1, size: 16 },
  { value: "large", label: "大", scale: 1.15, size: 18 },
  { value: "xlarge", label: "特大", scale: 1.3, size: 20 },
] as const;

type FontSizeLevel = typeof LEVELS[number]["value"];
const STORAGE_KEY = "xueFontSize";
const DEFAULT_LEVEL: FontSizeLevel = "normal";

function getSavedLevel(): FontSizeLevel {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as FontSizeLevel | null;
    if (saved && LEVELS.some((l) => l.value === saved)) return saved;
  } catch {
    // localStorage 不可用（隱私模式等），使用預設值
  }
  return DEFAULT_LEVEL;
}

function applyFontSize(level: FontSizeLevel) {
  if (typeof document === "undefined") return;
  const info = LEVELS.find((l) => l.value === level) ?? LEVELS[1];
  // 設定根元素字級，全站 rem 都會跟著變
  document.documentElement.style.fontSize = `${info.size}px`;
  document.documentElement.setAttribute("data-font-size", level);
}

/** App 啟動時、React 掛載前呼叫，讓儲存的字級在第一畫面就生效。 */
export function initFontSize() {
  applyFontSize(getSavedLevel());
}

type Props = {
  compact?: boolean;
};

export function FontSizeController({ compact = false }: Props) {
  const [level, setLevel] = useState<FontSizeLevel>(() => getSavedLevel());

  useEffect(() => {
    applyFontSize(level);
    try {
      window.localStorage.setItem(STORAGE_KEY, level);
    } catch {
      // 無法寫入時仍在本次造訪生效
    }
  }, [level]);

  const currentIndex = LEVELS.findIndex((l) => l.value === level);

  const decrease = () => {
    if (currentIndex > 0) setLevel(LEVELS[currentIndex - 1].value);
  };

  const increase = () => {
    if (currentIndex < LEVELS.length - 1) setLevel(LEVELS[currentIndex + 1].value);
  };

  const reset = () => setLevel(DEFAULT_LEVEL);

  if (compact) {
    return (
      <div className="font-size-compact" title="字體大小">
        <button type="button" onClick={decrease} disabled={currentIndex === 0} aria-label="字體變小">
          <Minus size={16} />
        </button>
        <span className="font-size-label">
          <Type size={14} aria-hidden="true" />
          <span>{LEVELS[currentIndex].label}</span>
        </span>
        <button type="button" onClick={increase} disabled={currentIndex === LEVELS.length - 1} aria-label="字體變大">
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="font-size-controller">
      <div className="font-size-header">
        <Type size={18} aria-hidden="true" />
        <span>字體大小</span>
        <button type="button" className="font-size-reset" onClick={reset} title="恢復預設" aria-label="恢復預設字體大小">
          <RotateCcw size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="font-size-buttons" role="group" aria-label="選擇全站字體大小">
        {LEVELS.map((l) => (
          <button
            type="button"
            key={l.value}
            className={`font-size-btn${level === l.value ? " is-active" : ""}`}
            onClick={() => setLevel(l.value)}
            style={{ fontSize: `${12 + LEVELS.findIndex((x) => x.value === l.value) * 2}px` }}
            aria-pressed={level === l.value}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="font-size-preview">
        這是預覽文字：國小課綱學習，輕鬆又有趣！
      </p>
    </div>
  );
}
