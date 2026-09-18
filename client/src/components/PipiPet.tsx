import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * 琵琵 — 黑面琵鷺浮動吉祥物（寶島探險家桌寵）
 * 跨頁面懸浮於右下角，可拖曳、點擊互動、右鍵選單。
 * 素材：/pipi/<state>/frame-NN.webp（已去背透明 PNG）
 */

type PetState =
  | "idle"
  | "blink"
  | "tap"
  | "pet-head"
  | "feed-fish"
  | "peek-curious"
  | "stretch-wing";

const FRAME_COUNT: Record<PetState, number> = {
  idle: 5,
  blink: 5,
  tap: 5,
  "pet-head": 5,
  "feed-fish": 5,
  "peek-curious": 5,
  "stretch-wing": 5,
};

const FRAME_MS: Record<PetState, number> = {
  idle: 220,
  blink: 80,
  tap: 110,
  "pet-head": 150,
  "feed-fish": 160,
  "peek-curious": 130,
  "stretch-wing": 140,
};

const INTERACTIONS: { id: PetState; emoji: string; label: string; lines: string[] }[] = [
  { id: "pet-head", emoji: "🪶", label: "摸摸頭", lines: ["琵琵舒服地眯起眼睛～", "好軟的羽毛呀！"] },
  { id: "feed-fish", emoji: "🐟", label: "餵小魚", lines: ["湯匙喙一口叼住小魚！", "新鮮的小魚乾最棒了～"] },
  { id: "peek-curious", emoji: "❓", label: "歪頭好奇", lines: ["？？？琵琵歪著頭看你", "那是什麼？想知道～"] },
  { id: "stretch-wing", emoji: "🕊️", label: "伸懶腰", lines: ["撐——翅膀伸展一下！", "活動活動筋骨～"] },
];

const IDLE_CHATTER = ["嘎～", "今天也要探索寶島！", "琵琵在這邊喔！", "發現新卡牌了嗎？"];

export function PipiPet() {
  const [state, setState] = useState<PetState>("idle");
  const [frame, setFrame] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  // Sprite animation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => {
        const max = FRAME_COUNT[state];
        const next = f + 1;
        if (next >= max) {
          // loop state stays, non-loop return to idle
          if (state !== "idle" && state !== "blink") {
            setState("idle");
          }
          return 0;
        }
        return next;
      });
    }, FRAME_MS[state]);
    return () => clearInterval(timer);
  }, [state]);

  // Random blink
  useEffect(() => {
    const t = setInterval(() => {
      if (state === "idle" && Math.random() < 0.35) {
        setState("blink");
        setFrame(0);
        setTimeout(() => {
          setState("idle");
          setFrame(0);
        }, FRAME_MS.blink * 5);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [state]);

  // Random idle chatter bubble
  useEffect(() => {
    const t = setInterval(() => {
      if (state === "idle" && !bubble) {
        setBubble(IDLE_CHATTER[Math.floor(Math.random() * IDLE_CHATTER.length)]);
        setTimeout(() => setBubble(null), 3500);
      }
    }, 22000);
    return () => clearInterval(t);
  }, [state, bubble]);

  const play = useCallback((s: PetState, line?: string) => {
    setState(s);
    setFrame(0);
    setMenuOpen(false);
    if (line) {
      setBubble(line);
      setTimeout(() => setBubble(null), 3000);
    }
  }, []);

  // Left click -> tap
  const onClick = useCallback(() => {
    if (dragRef.current?.moved) return;
    play("tap");
  }, [play]);

  // Right click -> menu
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen((v) => !v);
  }, []);

  // Drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect ? rect.left : window.innerWidth - 180,
      origY: rect ? rect.top : window.innerHeight - 180,
      moved: false,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (d.moved) {
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 100, d.origX + dx)), y: Math.max(0, Math.min(window.innerHeight - 100, d.origY + dy)) });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  if (hidden) {
    return (
      <button
        className="pipi-pet-reopen"
        onClick={() => setHidden(false)}
        title="叫出琵琵"
        aria-label="叫出琵琵"
      >
        🪶
      </button>
    );
  }

  const frameUrl = `/pipi/${state}/frame-${String(frame + 1).padStart(2, "0")}.webp`;

  return (
    <>
      {bubble && <div className="pipi-bubble" role="status">{bubble}</div>}
      {menuOpen && (
        <div className="pipi-menu" role="menu">
          <div className="pipi-menu-title">琵琵</div>
          {INTERACTIONS.map((it) => (
            <button key={it.id} onClick={() => play(it.id, it.lines[Math.floor(Math.random() * it.lines.length)])}>
              <span aria-hidden>{it.emoji}</span> {it.label}
            </button>
          ))}
          <button onClick={() => { setMenuOpen(false); setHidden(true); }}>
            <span aria-hidden>💤</span> 躲起來
          </button>
        </div>
      )}
      <div
        ref={rootRef}
        className="pipi-pet"
        style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="button"
        aria-label="琵琵（黑面琵鷺吉祥物），左鍵點擊互動，右鍵開選單，可拖曳"
        title="左鍵互動 · 右鍵選單 · 拖曳移動"
      >
        <img src={frameUrl} alt="" draggable={false} width={110} height={110} />
      </div>
    </>
  );
}

export default PipiPet;
