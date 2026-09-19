import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * 琵琵 v2 — 黑面琵鷺浮動吉祥物（寶島探險家桌寵）
 * 升級：好感度系統、粒子特效、3D浮動陰影、隨機走動、寵物面板、大小切換、睡眠模式
 */

type PetState =
  | "idle" | "blink" | "tap"
  | "pet-head" | "feed-fish" | "peek-curious" | "stretch-wing"
  | "edge-snap" | "notify";

type SizeKey = "small" | "normal" | "large";
type Particle = { id: number; x: number; y: number; emoji: string; life: number };

const FRAME_COUNT: Record<PetState, number> = {
  idle: 5, blink: 5, tap: 5, "pet-head": 5, "feed-fish": 5,
  "peek-curious": 5, "stretch-wing": 5, "edge-snap": 5, notify: 5,
};
const FRAME_MS: Record<PetState, number> = {
  idle: 220, blink: 80, tap: 110, "pet-head": 150, "feed-fish": 160,
  "peek-curious": 130, "stretch-wing": 140, "edge-snap": 120, notify: 100,
};
const SIZE_PX: Record<SizeKey, number> = { small: 78, normal: 110, large: 150 };

const INTERACTIONS: { id: PetState; emoji: string; label: string; lines: string[]; affection: number }[] = [
  { id: "pet-head", emoji: "🪶", label: "摸摸頭", lines: ["舒服到眯起眼睛～", "羽毛被梳理好了！", "再摸一下嘛～"], affection: 8 },
  { id: "feed-fish", emoji: "🐟", label: "餵小魚", lines: ["湯匙喙叼住小魚！", "新鮮小魚乾最棒了～", "嘎嗚！好吃！"], affection: 12 },
  { id: "peek-curious", emoji: "❓", label: "歪頭好奇", lines: ["？？？這是什麼？", "讓我仔細看看～", "好奇寶寶誕生！"], affection: 6 },
  { id: "stretch-wing", emoji: "🕊️", label: "伸懶腰", lines: ["撐——活動翅膀！", "久站真的會酸～", "準備展翅高飛！"], affection: 5 },
];

const IDLE_CHATTER = [
  "嘎～今天也要探索寶島！",
  "發現新卡牌了嗎？",
  "琵琵在這邊喔！",
  "黑面琵鷺是好朋友～",
  "去 Tavern 找找夥伴吧！",
  "知識就是力量嘎！",
];
const SLEEP_LINES = ["呼……呼……", "琵琵睡著了～", "zzz..."];
const LEVEL_NAMES = ["路過的", "認識的", "親密夥伴", "寶島守護者"];

function loadAffection(): number {
  try { return parseInt(localStorage.getItem("pipi-affection") || "0", 10) || 0; } catch { return 0; }
}
function loadCount(): number {
  try { return parseInt(localStorage.getItem("pipi-count") || "0", 10) || 0; } catch { return 0; }
}
function loadSize(): SizeKey {
  try { const s = localStorage.getItem("pipi-size"); return (s === "small" || s === "large") ? s : "normal"; } catch { return "normal"; }
}
function affectionLevel(a: number): number {
  if (a >= 500) return 3;
  if (a >= 200) return 2;
  if (a >= 50) return 1;
  return 0;
}

export function PipiPet() {
  const [state, setState] = useState<PetState>("idle");
  const [frame, setFrame] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [affection, setAffection] = useState(loadAffection);
  const [count, setCount] = useState(loadCount);
  const [size, setSize] = useState<SizeKey>(loadSize);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [roaming, setRoaming] = useState(false);
  const [floatPhase, setFloatPhase] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);
  const particleId = useRef(0);

  // Sprite animation
  useEffect(() => {
    if (sleeping) return;
    const timer = setInterval(() => {
      setFrame((f) => {
        const next = f + 1;
        if (next >= FRAME_COUNT[state]) {
          if (state !== "idle" && state !== "blink" && state !== "edge-snap") setState("idle");
          return 0;
        }
        return next;
      });
    }, FRAME_MS[state]);
    return () => clearInterval(timer);
  }, [state, sleeping]);

  // Float phase (breathing bobbing)
  useEffect(() => {
    const t = setInterval(() => setFloatPhase((p) => p + 1), 120);
    return () => clearInterval(t);
  }, []);

  // Random blink
  useEffect(() => {
    if (sleeping) return;
    const t = setInterval(() => {
      if (state === "idle" && Math.random() < 0.35) {
        setState("blink"); setFrame(0);
        setTimeout(() => { setState("idle"); setFrame(0); }, FRAME_MS.blink * 5);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [state, sleeping]);

  // Random idle chatter
  useEffect(() => {
    if (sleeping) return;
    const t = setInterval(() => {
      if (state === "idle" && !bubble && !roaming) {
        setBubble(IDLE_CHATTER[Math.floor(Math.random() * IDLE_CHATTER.length)]);
        setTimeout(() => setBubble(null), 3500);
      }
    }, 25000);
    return () => clearInterval(t);
  }, [state, bubble, roaming, sleeping]);

  // Roaming: pet walks to a random spot
  useEffect(() => {
    if (sleeping) return;
    const t = setInterval(() => {
      if (state === "idle" && !roaming && Math.random() < 0.4 && !bubble) {
        setRoaming(true);
        setState("edge-snap"); setFrame(0);
        const nx = 40 + Math.random() * (window.innerWidth - 220);
        const ny = 80 + Math.random() * (window.innerHeight - 240);
        setPos({ x: nx, y: ny });
        setTimeout(() => { setRoaming(false); setState("idle"); setFrame(0); }, 2000);
      }
    }, 35000);
    return () => clearInterval(t);
  }, [state, roaming, bubble, sleeping]);

  // Spawn particles
  const spawnParticles = useCallback((emojis: string[], n = 6) => {
    const pet = rootRef.current?.getBoundingClientRect();
    const cx = pet ? pet.left + pet.width / 2 : window.innerWidth - 80;
    const cy = pet ? pet.top : window.innerHeight - 180;
    const newP: Particle[] = [];
    for (let i = 0; i < n; i++) {
      newP.push({
        id: ++particleId.current,
        x: cx + (Math.random() - 0.5) * 60,
        y: cy - 10,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        life: 1,
      });
    }
    setParticles((p) => [...p, ...newP]);
    // cleanup after animation
    setTimeout(() => {
      setParticles((p) => p.filter((pp) => !newP.find((n) => n.id === pp.id)));
    }, 1500);
  }, []);

  const addAffection = useCallback((amount: number) => {
    setAffection((a) => {
      const na = a + amount;
      try { localStorage.setItem("pipi-affection", String(na)); } catch {}
      return na;
    });
    setCount((c) => {
      const nc = c + 1;
      try { localStorage.setItem("pipi-count", String(nc)); } catch {}
      return nc;
    });
  }, []);

  const play = useCallback((s: PetState, line?: string, aff?: number, particleEmojis?: string) => {
    setState(s); setFrame(0); setMenuOpen(false);
    if (line) { setBubble(line); setTimeout(() => setBubble(null), 3000); }
    if (aff) { addAffection(aff); spawnParticles(particleEmojis ? particleEmojis.split("") : ["💖"], 5 + aff); }
  }, [addAffection, spawnParticles]);

  // Left click -> tap + hearts
  const onClick = useCallback(() => {
    if (dragRef.current?.moved || sleeping) return;
    play("tap", undefined, 4, "💖✨");
  }, [play, sleeping]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen((v) => !v);
  }, []);

  // Drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origX: rect ? rect.left : window.innerWidth - 180,
      origY: rect ? rect.top : window.innerHeight - 180,
      moved: false,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (d.moved) {
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 100, d.origX + dx)), y: Math.max(0, Math.min(window.innerHeight - 100, d.origY + dy)) });
    }
  }, []);
  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  const toggleSleep = useCallback(() => {
    setMenuOpen(false);
    setSleeping((s) => {
      const ns = !s;
      if (ns) { setBubble(SLEEP_LINES[0]); setTimeout(() => setBubble(null), 2500); }
      else { setBubble("嘎！醒來了！精神百倍！"); setTimeout(() => setBubble(null), 2500); }
      return ns;
    });
  }, []);

  const cycleSize = useCallback(() => {
    setMenuOpen(false);
    setSize((s) => {
      const order: SizeKey[] = ["small", "normal", "large"];
      const next = order[(order.indexOf(s) + 1) % 3];
      try { localStorage.setItem("pipi-size", next); } catch {}
      return next;
    });
  }, []);

  const lvl = affectionLevel(affection);
  const petPx = SIZE_PX[size];
  const bob = Math.sin(floatPhase * 0.15) * 4;
  const shadowScale = 1 - Math.sin(floatPhase * 0.15) * 0.08;

  if (hidden) {
    return <button className="pipi-pet-reopen" onClick={() => setHidden(false)} title="叫出琵琵" aria-label="叫出琵琵">🪶</button>;
  }

  const frameUrl = `/pipi/${sleeping ? "idle" : state}/frame-${String(frame + 1).padStart(2, "0")}.webp`;

  return (
    <>
      {/* Particles */}
      {particles.map((p) => (
        <div key={p.id} className="pipi-particle" style={{ left: p.x, top: p.y }}>{p.emoji}</div>
      ))}

      {/* Bubble */}
      {bubble && <div className="pipi-bubble" role="status">{bubble}</div>}

      {/* Context menu */}
      {menuOpen && (
        <div className="pipi-menu" role="menu">
          <div className="pipi-menu-title">琵琵 · Lv.{lvl}</div>
          {INTERACTIONS.map((it) => (
            <button key={it.id} onClick={() => play(it.id, it.lines[Math.floor(Math.random() * it.lines.length)], it.affection, "💖🐟")}>
              <span aria-hidden>{it.emoji}</span> {it.label}
            </button>
          ))}
          <button onClick={cycleSize}><span aria-hidden>📐</span> 大小：{size === "small" ? "小" : size === "normal" ? "中" : "大"}</button>
          <button onClick={() => { setMenuOpen(false); setPanelOpen(true); }}><span aria-hidden>📋</span> 寵物面板</button>
          <button onClick={toggleSleep}><span aria-hidden>{sleeping ? "☀️" : "💤"}</span> {sleeping ? "醒來" : "睡覺"}</button>
          <button onClick={() => { setMenuOpen(false); setHidden(true); }}><span aria-hidden>🙈</span> 躲起來</button>
        </div>
      )}

      {/* Pet panel */}
      {panelOpen && (
        <div className="pipi-panel" role="dialog" aria-label="寵物面板">
          <div className="pipi-panel-head">
            <img src={frameUrl} alt="琵琵" width={64} height={64} />
            <div>
              <strong>琵琵</strong>
              <small>黑面琵鷺 · {LEVEL_NAMES[lvl]}</small>
            </div>
            <button className="pipi-panel-close" onClick={() => setPanelOpen(false)} aria-label="關閉">✕</button>
          </div>
          <div className="pipi-panel-bar">
            <div className="pipi-panel-bar-fill" style={{ width: `${Math.min(100, (affection % 100) / 1)}%` }} />
          </div>
          <div className="pipi-panel-stats">
            <div><span>💖 好感度</span><strong>{affection}</strong></div>
            <div><span>🤝 互動次數</span><strong>{count}</strong></div>
            <div><span>📏 大小</span><strong>{size === "small" ? "小" : size === "normal" ? "中" : "大"}</strong></div>
          </div>
          <div className="pipi-panel-hint">左鍵點擊互動 · 右鍵開選單 · 拖曳移動</div>
        </div>
      )}

      {/* Pet */}
      <div
        ref={rootRef}
        className={`pipi-pet ${roaming ? "roaming" : ""} ${sleeping ? "sleeping" : ""}`}
        style={{
          ...(pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : {}),
          width: petPx, height: petPx,
          transform: `translateY(${bob}px)`,
        }}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="button"
        aria-label="琵琵（黑面琵鷺吉祥物）"
        title="左鍵互動 · 右鍵選單 · 拖曳移動"
      >
        <img src={frameUrl} alt="" draggable={false} width={petPx} height={petPx} />
        <div className="pipi-shadow" style={{ transform: `scaleX(${shadowScale})` }} />
      </div>
    </>
  );
}

export default PipiPet;
