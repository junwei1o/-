import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

/**
 * 小寶 — 寶島探險家的貓耳人形吉祥物
 * Q版貓耳少女，5套職業套裝依所在頁面自動切換，也可手動更換。
 * 配色貼合網站：teal #0B6E8E / gold #E8B84B / cream #F9F3E8 / brown #5C3D26
 */

type Outfit = "explorer" | "warrior" | "scholar" | "astronomer" | "tavern";
type SizeKey = "small" | "normal" | "large";
type Mood = "grumpy" | "neutral" | "happy" | "joyful";
type Particle = { id: number; x: number; y: number; emoji: string };
type Trivia = { q: string; a: string; b: string; correct: "a" | "b"; fact: string };

type OutfitInfo = { name: string; emoji: string; img: string; auto?: string };

const OUTFITS: Record<Outfit, OutfitInfo> = {
  explorer:   { name: "探險家",   emoji: "🧭", img: "/pipi/outfits/explorer.webp" },
  warrior:    { name: "戰士",     emoji: "⚔️", img: "/pipi/outfits/warrior.webp" },
  scholar:    { name: "學者",     emoji: "📚", img: "/pipi/outfits/scholar.webp" },
  astronomer: { name: "觀測員",   emoji: "🔭", img: "/pipi/outfits/astronomer.webp" },
  tavern:     { name: "酒館常客", emoji: "🍺", img: "/pipi/outfits/tavern.webp" },
};

const SIZE_PX: Record<SizeKey, number> = { small: 78, normal: 110, large: 150 };

// 依路徑自動決定套裝
function outfitForRoute(pathname: string): Outfit {
  if (/\/battle/.test(pathname)) return "warrior";
  if (/\/astronomy/.test(pathname)) return "astronomer";
  if (/\/tavern/.test(pathname)) return "tavern";
  if (/\/practice|\/study|\/report|\/learning/.test(pathname)) return "scholar";
  return "explorer";
}

const ROUTE_GREETINGS: [RegExp, string][] = [
  [/^\/$/, "歡迎回來！今天想去哪個島探險？"],
  [/\/battle/, "戰鬥開始！我已經握好劍了嘎！"],
  [/\/tavern/, "酒館！來杯果汁休息一下吧～"],
  [/\/astronomy/, "觀測站！今晚星星超美～"],
  [/\/cards?|\/collection/, "卡牌收集！又抽到新卡了嗎？"],
  [/\/learning-insights|\/report/, "看看你的學習報告吧！"],
  [/\/practice|\/study/, "讀書時間！我陪你一起唸～"],
  [/\/setting/, "設定調整好了嗎？"],
  [/\/map/, "打開地圖，規劃下一次探險！"],
  [/\/quiz|\/duel/, "答題挑戰！冷靜思考！"],
];

const MOOD_CHATTER: Record<Mood, string[]> = {
  grumpy: ["喵……無力……", "摸摸我嘛……", "今天不想動……"],
  neutral: ["喵～今天也要探索寶島！", "發現新卡牌了嗎？", "小寶在這邊喔！"],
  happy: ["小寶好開心喵！", "跟你一起探險真好～", "想去海邊看看！"],
  joyful: ["最喜歡你了！💖", "寶島守護者上線！", "今天的你也超棒的！"],
};

const TRIVIA_BANK: Trivia[] = [
  { q: "黑面琵鷺的喙像什麼樂器？", a: "琵琶", b: "吉他", correct: "a", fact: "扁平湯匙狀的黑喙像樂器琵琶！" },
  { q: "黑面琵鷺主要在台灣哪裡越冬？", a: "曾文溪口", b: "墾丁南灣", correct: "a", fact: "台南曾文溪口是全球最大度冬區！" },
  { q: "台灣的別稱？", a: "寶島", b: "綠島", correct: "a", fact: "寶島！富饒美麗的福爾摩沙～" },
  { q: "澎湖著名浪漫景點？", a: "雙心石滬", b: "海底玻璃", correct: "a", fact: "七美鄉雙心石滬，浪漫捕魚法！" },
  { q: "貓一天大約睡多久？", a: "12-16小時", b: "6小時", correct: "a", fact: "喵～小寶也想睡這麼久！" },
];

const LEVEL_NAMES = ["路過的", "認識的", "親密夥伴", "寶島守護者"];
const MOOD_NAMES: Record<Mood, string> = { grumpy: "睏", neutral: "平靜", happy: "開心", joyful: "興奮" };

const CHEER_LINES = [
  "加油！你一定可以的！", "專注力爆表！繼續衝～", "答對超棒的！",
  "一步一步來，你做得到！", "小寶在旁邊幫你搖旗！", "錯了不要緊，再試一次！",
];
const HIGH_FIVE_LINES = ["擊掌！讚！", "Yahoo！我們最強！", "啪！好默契～", "給你五顆星！"];
const FOCUS_LINES = ["好，小寶安靜陪你唸書！", "專注模式，不吵你～", "你唸書我守門！"];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function loadStreak(): number {
  try { return parseInt(localStorage.getItem("pipi-streak") || "0", 10) || 0; } catch { return 0; }
}
function loadChecked(): string {
  try { return localStorage.getItem("pipi-lastcheck") || ""; } catch { return ""; }
}

function loadAffection(): number {
  try { return parseInt(localStorage.getItem("pipi-affection") || "0", 10) || 0; } catch { return 0; }
}
function loadCount(): number {
  try { return parseInt(localStorage.getItem("pipi-count") || "0", 10) || 0; } catch { return 0; }
}
function loadSize(): SizeKey {
  try { const s = localStorage.getItem("pipi-size"); return (s === "small" || s === "large") ? s : "normal"; } catch { return "normal"; }
}
function loadOutfitOverride(): Outfit | null {
  try {
    const s = localStorage.getItem("pipi-outfit");
    return (s && s in OUTFITS) ? s as Outfit : null;
  } catch { return null; }
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
  if (h < 5) return "半夜了喵……早點休息吧";
  if (h < 11) return "早安！晨光正好，適合探險！";
  if (h < 14) return "中午好！吃過飯了嗎？";
  if (h < 18) return "下午時光～去海邊走走？";
  if (h < 22) return "晚上好！今天收穫不少吧！";
  return "夜深了喵……小寶陪你收尾～";
}

export function PipiPet() {
  const [location] = useLocation();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [affection, setAffection] = useState(loadAffection);
  const [count, setCount] = useState(loadCount);
  const [size, setSize] = useState<SizeKey>(loadSize);
  const [outfitOverride, setOutfitOverride] = useState<Outfit | null>(loadOutfitOverride);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [roaming, setRoaming] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [trivia, setTrivia] = useState<Trivia | null>(null);
  const [mood, setMood] = useState<Mood>(() => moodOf(loadAffection()));
  const [streak, setStreak] = useState(loadStreak);
  const [checkedToday, setCheckedToday] = useState(loadChecked() === todayKey());
  const [emote, setEmote] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean; velocity: number; lastX: number; lastY: number } | null>(null);
  const particleId = useRef(0);
  const lastRoute = useRef(location);

  const autoOutfit = outfitForRoute(location);
  const outfit = outfitOverride ?? autoOutfit;
  const outfitInfo = OUTFITS[outfit];
  const lvl = affectionLevel(affection);

  // Route change -> context greeting + auto outfit
  useEffect(() => {
    if (lastRoute.current === location) return;
    lastRoute.current = location;
    if (sleeping) return;
    const auto = outfitForRoute(location);
    // 自動換裝提示（只有在手動未覆蓋時）
    if (!outfitOverride && auto !== outfit) {
      setBubble(`換上${OUTFITS[auto].emoji}${OUTFITS[auto].name}裝！`);
      setBounce(true);
      setTimeout(() => { setBubble(null); setBounce(false); }, 2500);
    }
    const hit = ROUTE_GREETINGS.find(([re]) => re.test(location));
    if (hit) {
      setTimeout(() => { setBubble(hit[1]); setTimeout(() => setBubble(null), 3500); }, 2600);
    }
  }, [location, sleeping, outfitOverride, outfit]);

  // Time greeting on mount
  useEffect(() => {
    setBubble(timeGreeting());
    setBounce(true);
    const t = setTimeout(() => { setBubble(null); setBounce(false); }, 4000);
    return () => clearTimeout(t);
  }, []);

  // Random mood chatter
  useEffect(() => {
    if (sleeping || trivia) return;
    const t = setInterval(() => {
      if (!bubble && !roaming && !menuOpen) {
        const lines = MOOD_CHATTER[mood];
        setBubble(lines[Math.floor(Math.random() * lines.length)]);
        setTimeout(() => setBubble(null), 3500);
      }
    }, 22000);
    return () => clearInterval(t);
  }, [bubble, roaming, sleeping, mood, trivia, menuOpen]);

  // Roaming
  useEffect(() => {
    if (sleeping || trivia) return;
    const t = setInterval(() => {
      if (!roaming && Math.random() < 0.35 && !bubble) {
        setRoaming(true);
        const nx = 40 + Math.random() * (window.innerWidth - 220);
        const ny = 80 + Math.random() * (window.innerHeight - 240);
        setPos({ x: nx, y: ny });
        setTimeout(() => setRoaming(false), 2000);
      }
    }, 35000);
    return () => clearInterval(t);
  }, [roaming, bubble, sleeping, trivia]);

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
    setMood(moodOf(loadAffection() + amount));
  }, [spawnParticles]);

  const interact = useCallback((line: string, aff: number, emojis: string) => {
    setBubble(line);
    setBounce(true);
    setTimeout(() => setBubble(false), 500);
    setTimeout(() => setBubble(null), 3000);
    addAffection(aff);
    spawnParticles(emojis.split(""), 5 + aff);
  }, [addAffection, spawnParticles]);

  const onClick = useCallback(() => {
    if (dragRef.current?.moved || sleeping || trivia) return;
    const lines = ["喵！", "嘿嘿～", "摸摸！", "開心！"];
    interact(lines[Math.floor(Math.random() * lines.length)], 4, "💖✨");
  }, [interact, sleeping, trivia]);

  const onDoubleClick = useCallback(() => {
    if (sleeping || trivia) return;
    interact("最喜歡你了喵！", 10, "💖💖💖✨");
  }, [interact, sleeping, trivia]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen((v) => !v);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origX: rect ? rect.left : window.innerWidth - 180,
      origY: rect ? rect.top : window.innerHeight - 180,
      moved: false, velocity: 0, lastX: e.clientX, lastY: e.clientY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    d.velocity = d.velocity * 0.7 + Math.hypot(e.clientX - d.lastX, e.clientY - d.lastY) * 0.3;
    d.lastX = e.clientX; d.lastY = e.clientY;
    if (d.moved) {
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 100, d.origX + dx)), y: Math.max(0, Math.min(window.innerHeight - 100, d.origY + dy)) });
    }
  }, []);
  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    if (d && d.moved && d.velocity > 30) {
      setBubble("哇哦——！太快了喵！");
      setBounce(true);
      spawnParticles(["💫", "✨"], 6);
      setTimeout(() => { setBubble(null); setBounce(false); }, 2500);
    }
    dragRef.current = null;
  }, [spawnParticles]);

  const askTrivia = useCallback(() => {
    setMenuOpen(false);
    setTrivia(TRIVIA_BANK[Math.floor(Math.random() * TRIVIA_BANK.length)]);
  }, []);

  const answerTrivia = useCallback((choice: "a" | "b") => {
    if (!trivia) return;
    if (choice === trivia.correct) {
      addAffection(20);
      setBubble(`答對了！${trivia.fact}`);
      spawnParticles(["🎉", "⭐", "💖"], 10);
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
    } else {
      setBubble("再想想～提示：跟小寶有關！");
      spawnParticles(["🤔"], 3);
    }
    setTimeout(() => { setTrivia(null); setBubble(null); }, 4000);
  }, [trivia, addAffection, spawnParticles]);

  const setOutfit = useCallback((o: Outfit | null) => {
    setOutfitOverride(o);
    try {
      if (o) localStorage.setItem("pipi-outfit", o);
      else localStorage.removeItem("pipi-outfit");
    } catch {}
    setMenuOpen(false);
    if (o) {
      setBubble(`換上${OUTFITS[o].emoji}${OUTFITS[o].name}裝！`);
      setBounce(true);
      setTimeout(() => { setBubble(null); setBounce(false); }, 2000);
    }
  }, []);

  const toggleSleep = useCallback(() => {
    setMenuOpen(false);
    setSleeping((s) => {
      const ns = !s;
      setBubble(ns ? "呼……小寶睡了……" : "喵！醒來了！精神百倍！");
      setTimeout(() => setBubble(null), 2500);
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

  // 偵測觸控裝置（手機顯示明顯選單按鈕）
  useEffect(() => {
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);
  }, []);

  // 每日簽到
  const checkIn = useCallback(() => {
    setMenuOpen(false);
    const today = todayKey();
    const last = loadChecked();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    let newStreak = streak;
    if (last === today) return;
    if (last === yKey) newStreak = streak + 1; else newStreak = 1;
    setStreak(newStreak);
    setCheckedToday(true);
    try {
      localStorage.setItem("pipi-streak", String(newStreak));
      localStorage.setItem("pipi-lastcheck", today);
    } catch {}
    addAffection(15 + Math.min(10, newStreak));
    spawnParticles(["📅", "⭐", "🎉"], 8);
    setBounce(true);
    setBubble(newStreak > 1 ? `連續簽到 ${newStreak} 天！+${15 + Math.min(10, newStreak)} 好感！` : "簽到成功！明天再來！");
    setTimeout(() => { setBounce(false); setBubble(null); }, 3000);
  }, [streak, addAffection, spawnParticles]);

  // 加油打氣
  const cheer = useCallback(() => {
    setMenuOpen(false);
    interact(CHEER_LINES[Math.floor(Math.random() * CHEER_LINES.length)], 6, "💪🔥✨");
    setEmote("💪");
    setTimeout(() => setEmote(null), 2000);
  }, [interact]);

  // 擊掌
  const highFive = useCallback(() => {
    setMenuOpen(false);
    interact(HIGH_FIVE_LINES[Math.floor(Math.random() * HIGH_FIVE_LINES.length)], 8, "🖐️⭐💖");
    setEmote("🖐️");
    setTimeout(() => setEmote(null), 1500);
  }, [interact]);

  // 專注模式
  const toggleFocus = useCallback(() => {
    setMenuOpen(false);
    setFocusMode((f) => {
      const nf = !f;
      setBubble(FOCUS_LINES[Math.floor(Math.random() * FOCUS_LINES.length)]);
      setEmote(nf ? "🤫" : "😊");
      setTimeout(() => { setBubble(null); setEmote(null); }, 2500);
      return nf;
    });
  }, []);

  // 長按開選單（手機）
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setMenuOpen((v) => !v);
    }, 550);
  }, []);
  const onTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const petPx = SIZE_PX[size];

  if (hidden) {
    return <button className="pipi-pet-reopen" onClick={() => setHidden(false)} title="叫出小寶" aria-label="叫出小寶">🐱</button>;
  }

  const cls = [
    "pipi-pet",
    roaming ? "roaming" : "",
    sleeping ? "sleeping" : "",
    celebrating ? "celebrating" : "",
    bounce ? "bounce" : "",
  ].join(" ");

  return (
    <>
      {particles.map((p) => (
        <div key={p.id} className="pipi-particle" style={{ left: p.x, top: p.y }}>{p.emoji}</div>
      ))}

      {bubble && !trivia && <div className="pipi-bubble" role="status">{bubble}</div>}

      {trivia && (
        <div className="pipi-bubble pipi-trivia" role="dialog" aria-label="小知識問答">
          <div className="pipi-trivia-q">{trivia.q}</div>
          <div className="pipi-trivia-opts">
            <button onClick={() => answerTrivia("a")}>A. {trivia.a}</button>
            <button onClick={() => answerTrivia("b")}>B. {trivia.b}</button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="pipi-menu" role="menu">
          <div className="pipi-menu-title">小寶 · Lv.{lvl} · {MOOD_NAMES[mood]}</div>
          <button onClick={() => setOutfit(null)}>
            <span aria-hidden>🧭</span> 自動換裝{!outfitOverride ? " ✓" : ""}
          </button>
          {(Object.keys(OUTFITS) as Outfit[]).map((o) => (
            <button key={o} onClick={() => setOutfit(o)}>
              <span aria-hidden>{OUTFITS[o].emoji}</span> {OUTFITS[o].name}{outfit === o ? " ✓" : ""}
            </button>
          ))}
          <button onClick={askTrivia}><span aria-hidden>📚</span> 小知識問答</button>
          <button onClick={cheer}><span aria-hidden>💪</span> 加油打氣</button>
          <button onClick={highFive}><span aria-hidden>🖐️</span> 擊掌</button>
          <button onClick={toggleFocus}><span aria-hidden>{focusMode ? "😊" : "🤫"}</span> {focusMode ? "結束專注" : "專陪唸書"}</button>
          <button onClick={checkIn} disabled={checkedToday}>
            <span aria-hidden>📅</span> {checkedToday ? `今日已簽到（${streak}天）` : `每日簽到（連續${streak}天）`}
          </button>
          <button onClick={cycleSize}><span aria-hidden>📐</span> 大小：{size === "small" ? "小" : size === "normal" ? "中" : "大"}</button>
          <button onClick={() => { setMenuOpen(false); setPanelOpen(true); }}><span aria-hidden>📋</span> 寵物面板</button>
          <button onClick={toggleSleep}><span aria-hidden>{sleeping ? "☀️" : "💤"}</span> {sleeping ? "醒來" : "睡覺"}</button>
          <button onClick={() => { setMenuOpen(false); setHidden(true); }}><span aria-hidden>🙈</span> 躲起來</button>
        </div>
      )}

      {panelOpen && (
        <div className="pipi-panel" role="dialog" aria-label="寵物面板">
          <div className="pipi-panel-head">
            <img src={outfitInfo.img} alt="小寶" width={64} height={64} />
            <div>
              <strong>小寶</strong>
              <small>貓耳探險家 · {LEVEL_NAMES[lvl]}</small>
            </div>
            <button className="pipi-panel-close" onClick={() => setPanelOpen(false)} aria-label="關閉">✕</button>
          </div>
          <div className="pipi-panel-bar">
            <div className="pipi-panel-bar-fill" style={{ width: `${Math.min(100, affection % 100)}%` }} />
          </div>
          <div className="pipi-panel-stats">
            <div><span>💖 好感度</span><strong>{affection}</strong></div>
            <div><span>🔥 連續簽到</span><strong>{streak} 天</strong></div>
            <div><span>🤝 互動次數</span><strong>{count}</strong></div>
            <div><span>👗 目前套裝</span><strong>{outfitInfo.emoji} {outfitInfo.name}</strong></div>
            <div><span>😊 心情</span><strong>{MOOD_NAMES[mood]}</strong></div>
          </div>
          <div className="pipi-panel-hint">點擊互動 · 雙擊撒嬌 · 右鍵換裝選單 · 拖曳丟擲</div>
        </div>
      )}

      <div
        ref={rootRef}
        className={cls}
        style={{
          ...(pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : {}),
          width: petPx, height: petPx,
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        role="button"
        aria-label="小寶（貓耳探險家吉祥物）"
        title="點擊互動 · 雙擊撒嬌 · 右鍵/長按換裝 · 拖曳移動"
      >
        <img src={outfitInfo.img} alt={`小寶 - ${outfitInfo.name}`} draggable={false} width={petPx} height={petPx} />
        <div className="pipi-shadow" />
        {emote && <div className="pipi-emote" aria-hidden>{emote}</div>}
      </div>
      {isTouch && !hidden && (
        <button
          className="pipi-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="開啟小寶選單"
        >
          ☰
        </button>
      )}
    </>
  );
}

export default PipiPet;
