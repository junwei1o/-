import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";

/**
 * 燈寶 —— 我的教室的小燈靈（桌寵品質網頁寵物）。
 *
 * 桌寵對標：
 * - 待機：呼吸微動（程序形變）+ 眨眼（素材級狀態切換）
 * - 互動三式：摸頭 / 餵星星糖 / 戳戳點燈，各有動畫、音效與角色化回饋
 * - 說話氣泡：隨機台詞，摸頭與餵食也會回話
 * - 好感度：local-first（xue-pet-bond-v1），互動累積、顯示等級
 * - 尺寸四檔：迷你 / 小 / 標準 / 大（0.65 / 0.8 / 1 / 1.2）
 * - 三皮適配：光暈、底座、面板色隨教室皮膚變化
 */
export type PetSize = "mini" | "small" | "standard" | "large";

const PET_BOND_KEY = "xue-pet-bond-v1";

const BOND_LINES = [
  "教室亮著，等你回來。",
  "星星糖好好吃，謝謝你！",
  "摸頭最舒服了～",
  "點燈！照亮今天的題目！",
  "我會一直幫你照路。",
  "又解開一題，你比燈還亮！",
  "休息一下，燈不會滅的。",
];

const SIZE_SCALE: Record<PetSize, number> = {
  mini: 0.65,
  small: 0.8,
  standard: 1,
  large: 1.2,
};

const SIZE_LABEL: Record<PetSize, string> = {
  mini: "迷你",
  small: "小",
  standard: "標準",
  large: "大",
};

interface BondState {
  bond: number; // 累積好感度
  pats: number;
  feeds: number;
  lights: number;
}

function loadBond(): BondState {
  try {
    const raw = localStorage.getItem(PET_BOND_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BondState>;
      return {
        bond: Number(parsed.bond ?? 0),
        pats: Number(parsed.pats ?? 0),
        feeds: Number(parsed.feeds ?? 0),
        lights: Number(parsed.lights ?? 0),
      };
    }
  } catch {
    // 隱私模式或無 localStorage 時從零開始
  }
  return { bond: 0, pats: 0, feeds: 0, lights: 0 };
}

/** 好感度等級：每 5 點升一級，最高 Lv.10 */
export function petLevel(bond: number): number {
  return Math.min(10, Math.floor(bond / 5) + 1);
}

interface ClassroomPetProps {
  muted?: boolean;
  skin?: "concise" | "memphis" | "classic";
}

export default function ClassroomPet({ muted = false, skin = "concise" }: ClassroomPetProps) {
  const play = useClassroomSound(muted);
  const [bond, setBond] = useState<BondState>(loadBond);
  const [mood, setMood] = useState<"idle" | "happy" | "eating" | "lit">("idle");
  const [speech, setSpeech] = useState<string | null>(null);
  const [size, setSize] = useState<PetSize>("standard");
  const [showPanel, setShowPanel] = useState(false);
  const [blink, setBlink] = useState(false);
  const [petBounce, setPetBounce] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 眨眼：每 3.2–6 秒眨一次（桌寵眨眼節奏）
  useEffect(() => {
    let alive = true;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 180);
        schedule();
      }, 3200 + Math.random() * 2800);
    };
    schedule();
    return () => {
      alive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const commitBond = useCallback((delta: number, kind: keyof BondState) => {
    setBond((prev) => {
      const next = { ...prev, bond: prev.bond + delta, [kind]: prev[kind] + 1 };
      try {
        localStorage.setItem(PET_BOND_KEY, JSON.stringify(next));
      } catch {
        // 寫入失敗不影響本次互動
      }
      return next;
    });
  }, []);

  const say = useCallback((text: string, duration = 2400) => {
    setSpeech(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSpeech(null), duration);
  }, []);

  const runBounce = useCallback(() => {
    setPetBounce(1);
    setTimeout(() => setPetBounce(0), 380);
  }, []);

  // 摸頭：開心回彈 + 暖音 + 好感 +1
  const handlePat = useCallback(() => {
    setMood("happy");
    runBounce();
    play("ok");
    commitBond(1, "pats");
    const line = BOND_LINES[Math.floor(Math.random() * BOND_LINES.length)];
    say(line);
    setTimeout(() => setMood("idle"), 700);
  }, [commitBond, play, runBounce, say]);

  // 餵星星糖：張嘴吃 + 上行琶音 + 好感 +2
  const handleFeed = useCallback(() => {
    setMood("eating");
    play("win");
    commitBond(2, "feeds");
    say("星星糖！甜甜的～");
    setTimeout(() => setMood("idle"), 900);
  }, [commitBond, play, say]);

  // 戳戳點燈：燈芯點亮 + 滴答/亮音 + 好感 +1
  const handleLight = useCallback(() => {
    setMood("lit");
    play("flip");
    commitBond(1, "lights");
    say("燈亮了！一起看題吧。");
    setTimeout(() => setMood("idle"), 900);
  }, [commitBond, play, say]);

  const cycleSize = useCallback(() => {
    setSize((prev) => {
      const order: PetSize[] = ["mini", "small", "standard", "large"];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, []);

  const level = petLevel(bond.bond);
  const pct = Math.min(100, Math.round(((bond.bond % 5) / 5) * 100));
  const scale = SIZE_SCALE[size];

  return (
    <aside className={`pet-widget pet-widget-${skin}`} aria-label="燈寶，我的教室小夥伴">
      {/* 尺寸與面板開關 */}
      <div className="pet-toolbar">
        <button type="button" className="pet-size-btn" onClick={cycleSize} aria-label={`尺寸：${SIZE_LABEL[size]}`}>
          {SIZE_LABEL[size]}
        </button>
        <button
          type="button"
          className="pet-info-btn"
          onClick={() => setShowPanel((v) => !v)}
          aria-expanded={showPanel}
          aria-label="燈寶好感度"
        >
          ♥ Lv.{level}
        </button>
      </div>

      {/* 說話氣泡 */}
      {speech && <p className="pet-speech" role="status">{speech}</p>}

      {/* 燈寶本體 */}
      <button
        type="button"
        className={`pet-body pet-${mood}${blink ? " pet-blink" : ""}${petBounce ? " pet-bounce" : ""}`}
        onClick={handlePat}
        aria-label="摸一摸燈寶"
        style={{ width: 132 * scale, height: 152 * scale }}
      >
        <svg viewBox="0 0 132 152" role="img" aria-label="燈寶小燈靈" className="pet-svg">
          {/* 光暈 */}
          <circle className="pet-halo" cx="66" cy="66" r="52" />
          {/* 燈芯火焰 */}
          <g className="pet-wick">
            <path d="M66 40c-7 9-11 15-8 20 2 3 6 3 8 0 2-3 1-6 0-8-2-3-4-6 0-12z" />
          </g>
          {/* 燈罩（頭） */}
          <path className="pet-glass" d="M46 64c0-16 6-30 20-30s20 14 20 30c0 8-2 13-4 17-2 3-8 3-16 3s-14 0-16-3c-2-4-4-9-4-17z" />
          {/* 燈座環 */}
          <rect className="pet-collar" x="42" y="84" width="48" height="8" rx="4" />
          {/* 身體 */}
          <path className="pet-body-fill" d="M50 94h32c5 0 9 4 9 9v22c0 6-4 10-9 10H50c-5 0-9-4-9-10v-22c0-5 4-9 9-9z" />
          {/* 臉頰 */}
          <circle className="pet-blush" cx="52" cy="72" r="5" />
          <circle className="pet-blush" cx="80" cy="72" r="5" />
          {/* 眼睛 */}
          <g className="pet-eyes">
            <ellipse cx="56" cy="66" rx="5.5" ry="7" />
            <ellipse cx="76" cy="66" rx="5.5" ry="7" />
          </g>
          {/* 微笑 */}
          <path className="pet-mouth" d="M61 78c3 3 7 3 10 0" />
          {/* 木質燈台底座 */}
          <rect className="pet-stand" x="38" y="128" width="56" height="7" rx="3.5" />
          <rect className="pet-stand-top" x="44" y="122" width="44" height="7" rx="3.5" />
          {/* 餵食時的星星糖 */}
          {mood === "eating" && <path className="pet-star" d="M96 62l3.2 6.5 7.2 1-5.2 5 1.2 7.1-6.4-3.4-6.4 3.4 1.2-7.1-5.2-5 7.2-1z" />}
          {/* 點燈時的閃光 */}
          {mood === "lit" && (
            <g className="pet-sparkles">
              <path d="M22 40l2.5 5 5.5.8-4 3.9.9 5.5L22 52l-4.9 2.2.9-5.5-4-3.9 5.5-.8z" />
              <path d="M110 30l2 4 4.4.6-3.2 3.1.7 4.4-3.9-2-3.9 2 .7-4.4-3.2-3.1 4.4-.6z" />
            </g>
          )}
        </svg>
      </button>

      {/* 互動列 */}
      <div className="pet-actions">
        <button type="button" className="pet-action-btn" onClick={handleFeed} aria-label="餵星星糖">
          <span aria-hidden="true">⭐</span> 餵糖
        </button>
        <button type="button" className="pet-action-btn" onClick={handleLight} aria-label="戳戳點燈">
          <span aria-hidden="true">💡</span> 點燈
        </button>
      </div>

      {/* 好感度面板 */}
      {showPanel && (
        <div className="pet-panel" role="dialog" aria-label="燈寶好感度">
          <strong>燈寶</strong>
          <span>好感度 Lv.{level} / 10</span>
          <div className="pet-bond-track">
            <div className="pet-bond-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="pet-bond-stats">
            <span>摸頭 ×{bond.pats}</span>
            <span>餵糖 ×{bond.feeds}</span>
            <span>點燈 ×{bond.lights}</span>
          </div>
          <small>成績與好感度都只存在這台裝置。</small>
        </div>
      )}
    </aside>
  );
}
