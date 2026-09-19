import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

/**
 * 琵琵 v3 — 黑面琵鷺浮動吉祥物（寶島探險家桌寵）
 * v3 新增：情境感知問候、心情系統、雙擊撒嬌、丟擲回饋、台灣小知識問答、升級慶祝、時段問候
 */

type PetState =
  | "idle" | "blink" | "tap"
  | "pet-head" | "feed-fish" | "peek-curious" | "stretch-wing"
  | "edge-snap" | "notify";

type SizeKey = "small" | "normal" | "large";
type Mood = "grumpy" | "neutral" | "happy" | "joyful";
type Particle = { id: number; x: number; y: number; emoji: string };
type Trivia = { q: string; a: string; b: string; correct: "a" | "b"; fact: string };

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

// 情境問候：根據所在頁面
const ROUTE_GREETINGS: [RegExp, string][] = [
  [/^\/$/, "歡迎回來！今天想去哪個島探險？"],
  [/\/battle/, "戰鬥加油！琵琵在旁邊幫你搖旗～"],
  [/\/tavern/, "酒館！來找夥伴喝杯果汁吧～"],
  [/\/astronomy/, "觀測站！今晚星星超美嘎～"],
  [/\/cards?|\/collection/, "卡牌收集！又抽到新卡了嗎？"],
  [/\/learning-insights|\/report/, "看看你的學習報告吧！"],
  [/\/practice|\/study/, "讀書時間～琵琵陪你！"],
  [/\/setting/, "設定調整好了嗎？"],
  [/\/map/, "打開地圖，規劃下一次探險！"],
  [/\/quiz|\/duel/, "答題挑戰！冷靜思考嘎！"],
];

const MOOD_CHATTER: Record<Mood, string[]> = {
  grumpy: ["嘎……無聊……", "摸摸我嘛……", "今天不想動……"],
  neutral: ["嘎～今天也要探索寶島！", "發現新卡牌了嗎？", "琵琵在這邊喔！"],
  happy: ["琵琵好開心！嘎！", "跟你一起探險真好～", "想去看海邊！"],
  joyful: ["最喜歡你了嘎！💖", "寶島守護者上線！", "今天的你也超棒的！"],
};

const TRIVIA_BANK: Trivia[] = [
  { q: "黑面琵鷺為什麼叫「琵琶」？", a: "湯匙狀的喙像樂器", b: "羽毛會發出琴聲", correct: "a", fact: "牠的黑喙末端扁平，像樂器琵琶！" },
  { q: "黑面琵鷺主要越冬地在台灣哪裡？", a: "曾文溪口", b: "墾丁南灣", correct: "a", fact: "台南曾文溪口是全球最大度冬區！" },
  { q: "黑面琵鷺是幾級保育類？", a: "瀕臨絕種", b: "一般保育", correct: "a", fact: "全球僅約 6000 隻，是一級保育鳥！" },
  { q: "台灣的別稱是什麼？", a: "寶島", b: "綠島", correct: "a", fact: "寶島！富饒美麗的福爾摩沙～" },
  { q: "澎湖著名的海中奇景是？", a: "海底玻璃", b: "雙心石滬", correct: "b", fact: "七美鄉的雙心石滬，浪漫捕魚法！" },
];

const SLEEP_LINES = ["呼……呼……", "琵琵睡著了～", "zzz..."];
const LEVEL_NAMES = ["路過的", "認識的", "親密夥伴", "寶島守護者"];
const MOOD_NAMES: Record<Mood, string> = { grumpy: "睏", neutral: "平靜", happy: "開心", joyful: "興奮" };

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
function moodOf(a: number): Mood {
  if (a >= 300) return "joyful";
  if (a >= 80) return "happy";
  if (a >= 10) return "neutral";
  return "grumpy";
}
function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "半夜了嘎……早點休息吧";
  if (h < 11) return "早安！晨光正好，適合探險！";
  if (h < 14) return "中午好！吃過飯了嗎？";
  if (h < 18) return "下午時光～去海邊走走？";
  if (h < 22) return "晚上好！今天收穫不少吧！";
  return "夜深了嘎……琵琵陪你收尾～";
}

export function PipiPet() {
  const [location] = useLocation();
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
  const [mood, setMood] = useState<Mood>(() => moodOf(loadAffection()));
  const [trivia, setTrivia] = useState<Trivia | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean; startTime: number; lastX: number; lastY: number; velocity: number } | null>(null);
  const particleId = useRef(0);
  const lastRoute = useRef(location);

  const lvl = affectionLevel(affection);

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

  // Float phase
  useEffect(() => {
    const t = setInterval(() => setFloatPhase((p) => p + 1), 120);
    return () => clearInterval(t);
  }, []);

  // Random blink
  useEffect(() => {
    if (sleeping || trivia) return;
    const t = setInterval(() => {
      if (state === "idle" && Math.random() < 0.35) {
        setState("blink"); setFrame(0);
        setTimeout(() => { setState("idle"); setFrame(0); }, FRAME_MS.blink * 5);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [state, sleeping, trivia]);

  // Route change -> context greeting
  useEffect(() => {
    if (lastRoute.current === location) return;
    lastRoute.current = location;
    if (sleeping) return;
    const hit = ROUTE_GREETINGS.find(([re]) => re.test(location));
    if (hit) {
      setBubble(hit[1]);
      setState("notify"); setFrame(0);
      setTimeout(() => { setBubble(null); setState("idle"); setFrame(0); }, 4000);
    }
  }, [location, sleeping]);

  // Time greeting on first mount
  useEffect(() => {
    const g = timeGreeting();
    setBubble(g);
    setState("notify"); setFrame(0);
    const t = setTimeout(() => { setBubble(null); setState("idle"); setFrame(0); }, 4500);
    return () => clearTimeout(t);
  }, []);

  // Random mood-based chatter
  useEffect(() => {
    if (sleeping || trivia) return;
    const t = setInterval(() => {
      if (state === "idle" && !bubble && !roaming && !menuOpen) {
        const lines = MOOD_CHATTER[mood];
        setBubble(lines[Math.floor(Math.random() * lines.length)]);
        setTimeout(() => setBubble(null), 3500);
      }
    }, 22000);
    return () => clearInterval(t);
  }, [state, bubble, roaming, sleeping, mood, trivia, menuOpen]);

  // Roaming
  useEffect(() => {
    if (sleeping || trivia) return;
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
  }, [state, roaming, bubble, sleeping, trivia]);

  const spawnParticles = useCallback((emojis: string[], n = 6) => {
    const pet = rootRef.current?.getBoundingClientRect();
    const cx = pet ? pet.left + pet.width / 2 : window.innerWidth - 80;
    const cy = pet ? pet.top : window.innerHeight - 180;
    const newP: Particle[] = [];
    for (let i = 0; i < n; i++) {
      newP.push({
        id: ++particleId.current,
        x: cx + (Math.random() - 0.5) * 70,
        y: cy - 10,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }
    setParticles((p) => [...p, ...newP]);
    setTimeout(() => {
      setParticles((p) => p.filter((pp) => !newP.find((n) => n.id === pp.id)));
    }, 1600);
  }, []);

  const addAffection = useCallback((amount: number) => {
    setAffection((a) => {
      const na = a + amount;
      // Level up celebration
      const oldLvl = affectionLevel(a);
      const newLvl = affectionLevel(na);
      if (newLvl > oldLvl) {
        setCelebrating(true);
        spawnParticles(["🎉", "✨", "💖", "⭐"], 14);
        setBubble(`升級了！現在是「${LEVEL_NAMES[newLvl]}」！`);
        setTimeout(() => { setCelebrating(false); setBubble(null); }, 3500);
      }
      try { localStorage.setItem("pipi-affection", String(na)); } catch {}
      return na;
    });
    setCount((c) => {
      const nc = c + 1;
      try { localStorage.setItem("pipi-count", String(nc)); } catch {}
      return nc;
    });
    setMood(moodOf(affection + amount));
  }, [spawnParticles, affection]);

  const play = useCallback((s: PetState, line?: string, aff?: number, particleEmojis?: string) => {
    setState(s); setFrame(0); setMenuOpen(false);
    if (line) { setBubble(line); setTimeout(() => setBubble(null), 3000); }
    if (aff) { addAffection(aff); spawnParticles(particleEmojis ? particleEmojis.split("") : ["💖"], 5 + aff); }
  }, [addAffection, spawnParticles]);

  // Single click -> tap
  const onClick = useCallback(() => {
    if (dragRef.current?.moved || sleeping || trivia) return;
    play("tap", undefined, 4, "💖✨");
  }, [play, sleeping, trivia]);

  // Double click -> love burst
  const onDoubleClick = useCallback(() => {
    if (sleeping || trivia) return;
    play("pet-head", "最喜歡你了嘎！", 10, "💖💖💖✨");
  }, [play, sleeping, trivia]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen((v) => !v);
  }, []);

  // Drag with velocity for throw detection
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origX: rect ? rect.left : window.innerWidth - 180,
      origY: rect ? rect.top : window.innerHeight - 180,
      moved: false, startTime: Date.now(),
      lastX: e.clientX, lastY: e.clientY, velocity: 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    const instV = Math.hypot(e.clientX - d.lastX, e.clientY - d.lastY);
    d.velocity = d.velocity * 0.7 + instV * 0.3;
    d.lastX = e.clientX; d.lastY = e.clientY;
    if (d.moved) {
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 100, d.origX + dx)), y: Math.max(0, Math.min(window.innerHeight - 100, d.origY + dy)) });
    }
  }, []);
  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    if (d && d.moved && d.velocity > 30) {
      // Thrown! Pet reacts
      setState("notify"); setFrame(0);
      setBubble("哇哦——！太慢丟啦嘎！");
      spawnParticles(["💫", "✨"], 6);
      setTimeout(() => { setBubble(null); setState("idle"); setFrame(0); }, 2500);
    }
    dragRef.current = null;
  }, [spawnParticles]);

  const askTrivia = useCallback(() => {
    setMenuOpen(false);
    const t = TRIVIA_BANK[Math.floor(Math.random() * TRIVIA_BANK.length)];
    setTrivia(t);
  }, []);

  const answerTrivia = useCallback((choice: "a" | "b") => {
    if (!trivia) return;
    if (choice === trivia.correct) {
      addAffection(20);
      setBubble(`答對了！${trivia.fact}`);
      spawnParticles(["🎉", "⭐", "💖"], 10);
      setState("notify"); setFrame(0);
    } else {
      setBubble("再想想～提示：跟琵琵有關！");
      spawnParticles(["🤔"], 3);
      setState("peek-curious"); setFrame(0);
    }
    setTimeout(() => { setTrivia(null); setBubble(null); setState("idle"); setFrame(0); }, 4000);
  }, [trivia, addAffection, spawnParticles]);

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

  const petPx = SIZE_PX[size];
  const bob = Math.sin(floatPhase * 0.15) * 4;
  const shadowScale = 1 - Math.sin(floatPhase * 0.15) * 0.08;

  if (hidden) {
    return <button className="pipi-pet-reopen" onClick={() => setHidden(false)} title="叫出琵琵" aria-label="叫出琵琵">🪶</button>;
  }

  const frameUrl = `/pipi/${sleeping ? "idle" : state}/frame-${String(frame + 1).padStart(2, "0")}.webp`;

  return (
    <>
      {particles.map((p) => (
        <div key={p.id} className="pipi-particle" style={{ left: p.x, top: p.y }}>{p.emoji}</div>
      ))}

      {bubble && <div className="pipi-bubble" role="status">{bubble}</div>}

      {/* Trivia question */}
      {trivia && (
        <div className="pipi-bubble pipi-trivia" role="dialog" aria-label="小知識問答">
          <div className="pipi-trivia-q">{trivia.q}</div>
          <div className="pipi-trivia-opts">
            <button onClick={() => answerTrivia("a")}>A. {trivia.a}</button>
            <button onClick={() => answerTrivia("b")}>B. {trivia.b}</button>
          </div>
        </div>
      )}

      {/* Context menu */}
      {menuOpen && (
        <div className="pipi-menu" role="menu">
          <div className="pipi-menu-title">琵琵 · Lv.{lvl} · {MOOD_NAMES[mood]}</div>
          {INTERACTIONS.map((it) => (
            <button key={it.id} onClick={() => play(it.id, it.lines[Math.floor(Math.random() * it.lines.length)], it.affection, "💖🐟")}>
              <span aria-hidden>{it.emoji}</span> {it.label}
            </button>
          ))}
          <button onClick={askTrivia}><span aria-hidden>📚</span> 小知識問答</button>
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
              <small>黑面琵鷺 · {LEVEL_NAMES[lvl]} · {MOOD_NAMES[mood]}</small>
            </div>
            <button className="pipi-panel-close" onClick={() => setPanelOpen(false)} aria-label="關閉">✕</button>
          </div>
          <div className="pipi-panel-bar">
            <div className="pipi-panel-bar-fill" style={{ width: `${Math.min(100, (affection % 100) / 1)}%` }} />
          </div>
          <div className="pipi-panel-stats">
            <div><span>💖 好感度</span><strong>{affection}</strong></div>
            <div><span>🤝 互動次數</span><strong>{count}</strong></div>
            <div><span>😊 心情</span><strong>{MOOD_NAMES[mood]}</strong></div>
            <div><span>📏 大小</span><strong>{size === "small" ? "小" : size === "normal" ? "中" : "大"}</strong></div>
          </div>
          <div className="pipi-panel-hint">點擊互動 · 雙擊撒嬌 · 右鍵選單 · 拖曳丟擲</div>
        </div>
      )}

      {/* Pet */}
      <div
        ref={rootRef}
        className={`pipi-pet ${roaming ? "roaming" : ""} ${sleeping ? "sleeping" : ""} ${celebrating ? "celebrating" : ""}`}
        style={{
          ...(pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : {}),
          width: petPx, height: petPx,
          transform: `translateY(${bob}px)`,
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="button"
        aria-label="琵琵（黑面琵鷺吉祥物）"
        title="點擊互動 · 雙擊撒嬌 · 右鍵選單 · 拖曳移動"
      >
        <img src={frameUrl} alt="" draggable={false} width={petPx} height={petPx} />
        <div className="pipi-shadow" style={{ transform: `scaleX(${shadowScale})` }} />
      </div>
    </>
  );
}

export default PipiPet;
