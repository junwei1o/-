import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  PIPI_COSTUMES,
  PIPI_QUEST_EVENT,
  claimPipiQuest,
  claimableQuests,
  costumeById,
  getTodayQuests,
  loadQuestState,
  loadWornCostumes,
  saveWornCostumes,
  unlockedCostumeIds,
  type PipiCostumeDef,
  type PipiQuestDef,
  type PipiQuestState,
} from "@/game/pipiCompanion";
import { loadRpgState, saveRpgState } from "@/game/rpgStorage";

/**
 * 小寶 v5 — 寶島探險家的貓耳人形吉祥物
 * Q版貓耳少女，5套職業套裝依所在頁面自動切換，也可手動更換。
 * v5 新增：每日派任務看板（真實進度＋金幣獎勵）、飾品衣櫥（解鎖＋分層穿搭）、
 *          互動表情、跳舞／轉圈／跳跳動作、全站板塊事件匯流（答題／遊戲／地圖／週測）。
 * 配色貼合網站：teal #0B6E8E / gold #E8B84B / cream #F9F3E8 / brown #5C3D26
 */

type Outfit = "explorer" | "warrior" | "scholar" | "astronomer" | "tavern";
type SizeKey = "small" | "normal" | "large";
type Mood = "grumpy" | "neutral" | "happy" | "joyful";
type Particle = { id: number; x: number; y: number; emoji: string };
type Trivia = { q: string; a: string; b: string; correct: "a" | "b"; fact: string };
type ActionKey = "dance" | "spin" | "hop";

type OutfitInfo = { name: string; emoji: string; img: string; auto?: string };

const OUTFITS: Record<Outfit, OutfitInfo> = {
  explorer:   { name: "探險家",   emoji: "🧭", img: "/pipi/outfits/explorer.webp" },
  warrior:    { name: "戰士",     emoji: "⚔️", img: "/pipi/outfits/warrior.webp" },
  scholar:    { name: "學者",     emoji: "📚", img: "/pipi/outfits/scholar.webp" },
  astronomer: { name: "觀測員",   emoji: "🔭", img: "/pipi/outfits/astronomer.webp" },
  tavern:     { name: "酒館常客", emoji: "🍺", img: "/pipi/outfits/tavern.webp" },
};

const SIZE_PX: Record<SizeKey, number> = { small: 78, normal: 110, large: 150 };

/** v5 表演動作（CSS 動畫疊加） */
const ACTIONS: Record<ActionKey, { label: string; emoji: string; line: string; particles: string[] }> = {
  dance: { label: "跳舞", emoji: "🎵", line: "喵喵喵～跟著節奏搖擺！", particles: ["🎵", "✨"] },
  spin: { label: "轉圈", emoji: "🌀", line: "轉圈圈～頭好暈喵！", particles: ["💫", "🌊"] },
  hop: { label: "跳跳", emoji: "🦘", line: "跳跳跳！活力滿點！", particles: ["⭐", "✨"] },
};

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
  const [questsOpen, setQuestsOpen] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
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
  // v5
  const [questState, setQuestState] = useState<PipiQuestState>(loadQuestState);
  const [worn, setWorn] = useState<string[]>(loadWornCostumes);
  const [actionAnim, setActionAnim] = useState<ActionKey | null>(null);
  // v6 生動感
  const [blink, setBlink] = useState(false);
  const [micro, setMicro] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean; velocity: number; lastX: number; lastY: number } | null>(null);
  const particleId = useRef(0);
  const lastRoute = useRef(location);
  const tapTimesRef = useRef<number[]>([]);

  const autoOutfit = outfitForRoute(location);
  const outfit = outfitOverride ?? autoOutfit;
  const outfitInfo = OUTFITS[outfit];
  const lvl = affectionLevel(affection);
  // v5
  const stats = { affection, count, questsClaimed: questState.claimedTotal };
  const ownedIds = unlockedCostumeIds(stats);
  const wornItems = worn
    .filter((id) => ownedIds.includes(id))
    .map((id) => costumeById(id))
    .filter((c): c is PipiCostumeDef => Boolean(c));
  const todayQuests = getTodayQuests(questState);
  const claimableN = claimableQuests(questState).length;

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
    // v5：進站提醒可領任務獎勵
    const t2 = setTimeout(() => {
      if (!sleeping && claimableQuests(loadQuestState()).length > 0) {
        setBubble("今天的任務有獎勵可以領喵！打開任務看板！");
        setBounce(true);
        setTimeout(() => { setBubble(null); setBounce(false); }, 4000);
      }
    }, 9000);
    return () => { clearTimeout(t); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // v5：全站任務事件匯流 — 各板塊 recordPipiEvent()，小寶即時反應
  useEffect(() => {
    setQuestState(loadQuestState());
    const onQuest = (e: Event) => {
      const detail = (e as CustomEvent<{ state: PipiQuestState; completed: PipiQuestDef[] }>).detail;
      if (!detail) return;
      setQuestState(detail.state);
      const done = detail.completed?.[0];
      if (done && !sleeping) {
        setCelebrating(true);
        spawnParticles(["📜", "🎉", "⭐"], 10);
        setBubble(`任務完成「${done.title}」！快來領獎勵喵！`);
        setTimeout(() => { setCelebrating(false); setBubble(null); }, 3500);
      }
    };
    window.addEventListener(PIPI_QUEST_EVENT, onQuest);
    return () => window.removeEventListener(PIPI_QUEST_EVENT, onQuest);
  }, [sleeping]);

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

  const interact = useCallback((line: string, aff: number, emojis: string, face?: string) => {
    setBubble(line);
    setBounce(true);
    setTimeout(() => setBounce(false), 500);
    setTimeout(() => setBubble(null), 3000);
    if (face) {
      setEmote(face);
      setTimeout(() => setEmote(null), 1800);
    }
    addAffection(aff);
    // 用 Array.from 而非 split("")：emoji 多為輔助平面字元（surrogate pair），
    // split("") 會把一個 emoji 拆成兩個半字，畫面會出現問號。
    spawnParticles(Array.from(emojis), 5 + aff);
  }, [addAffection, spawnParticles]);

  const onClick = useCallback(() => {
    if (dragRef.current?.moved || sleeping || trivia) return;
    // v6 彩蛋：1.5 秒內連點 3 下會嘟嘴生氣
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter((t) => now - t < 1500), now];
    if (tapTimesRef.current.length >= 3) {
      tapTimesRef.current = [];
      interact("喵嗚～戳癢了啦！", 2, "💢", "😤");
      return;
    }
    const lines = ["喵！", "嘿嘿～", "摸摸！", "開心！"];
    const faces = ["😍", "😊", "😸", "🥰"];
    const i = Math.floor(Math.random() * lines.length);
    interact(lines[i], 4, "💖✨", faces[i % faces.length]);
  }, [interact, sleeping, trivia]);

  const onDoubleClick = useCallback(() => {
    if (sleeping || trivia) return;
    interact("最喜歡你了喵！", 10, "💖💖💖✨", "🥰");
  }, [interact, sleeping, trivia]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // 打開選單時收起其他面板，避免互相遮擋
    setPanelOpen(false); setQuestsOpen(false); setWardrobeOpen(false);
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
      setEmote("😵");
      setTimeout(() => setEmote(null), 1800);
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
      setEmote("🤩");
      setTimeout(() => { setBounce(false); setEmote(null); }, 1500);
    } else {
      setBubble("再想想～提示：跟小寶有關！");
      spawnParticles(["🤔"], 3);
      setEmote("😯");
      setTimeout(() => setEmote(null), 1800);
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

  // v6：隨機眨眼
  useEffect(() => {
    if (sleeping) return;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 180);
        loop();
      }, 3200 + Math.random() * 4200);
    };
    loop();
    return () => clearTimeout(timer);
  }, [sleeping]);

  // v6：隨機微動作（歪頭／扭一扭／原地小跳）
  useEffect(() => {
    if (sleeping) return;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(() => {
        if (!roaming && !actionAnim && !bubble && !menuOpen && !trivia) {
          const kinds = ["tilt", "wiggle", "hop", "giggle"];
          setMicro(kinds[Math.floor(Math.random() * kinds.length)]);
          setTimeout(() => setMicro(null), 950);
        }
        loop();
      }, 9000 + Math.random() * 9000);
    };
    loop();
    return () => clearTimeout(timer);
  }, [sleeping, roaming, actionAnim, bubble, menuOpen, trivia]);

  // v6：睡覺說夢話
  useEffect(() => {
    if (!sleeping) return;
    const DREAMS = ["喵……小魚乾……", "（夢到環島旅行中）", "zzz……寶島真美……"];
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(() => {
        setBubble(DREAMS[Math.floor(Math.random() * DREAMS.length)]);
        setEmote("💭");
        setTimeout(() => { setBubble(null); setEmote(null); }, 2500);
        loop();
      }, 8000 + Math.random() * 7000);
    };
    loop();
    return () => clearTimeout(timer);
  }, [sleeping]);

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
    interact(CHEER_LINES[Math.floor(Math.random() * CHEER_LINES.length)], 6, "💪🔥✨", "💪");
  }, [interact]);

  // 擊掌
  const highFive = useCallback(() => {
    setMenuOpen(false);
    interact(HIGH_FIVE_LINES[Math.floor(Math.random() * HIGH_FIVE_LINES.length)], 8, "🖐️⭐💖", "🖐️");
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

  // v5：表演動作（跳舞／轉圈／跳跳）
  const playAction = useCallback((a: ActionKey) => {
    setMenuOpen(false);
    const conf = ACTIONS[a];
    setActionAnim(a);
    setBubble(conf.line);
    setEmote(conf.emoji === "🎵" ? "🎶" : conf.emoji);
    setTimeout(() => setEmote(null), 1500);
    addAffection(3);
    spawnParticles(conf.particles, 6);
    setTimeout(() => { setActionAnim(null); setBubble(null); }, 1600);
  }, [addAffection, spawnParticles]);

  // v5：領取任務獎勵（金幣入帳 RPG 狀態＋好感度）
  const claimQuest = useCallback((questId: string) => {
    const reward = claimPipiQuest(questId);
    if (!reward) return;
    try {
      const rpg = loadRpgState();
      saveRpgState({ ...rpg, coins: rpg.coins + reward.rewardCoins });
    } catch { /* 忽略 */ }
    addAffection(reward.rewardAffection);
    spawnParticles(["🪙", "✨", "💖"], 12);
    setBubble(`領到獎勵！+${reward.rewardCoins} 金幣、+${reward.rewardAffection} 好感喵！`);
    setBounce(true);
    setEmote("🤩");
    setTimeout(() => { setBubble(null); setBounce(false); setEmote(null); }, 3000);
  }, [addAffection, spawnParticles]);

  // v5：穿脫飾品
  const toggleWear = useCallback((id: string) => {
    setWorn((w) => {
      const next = w.includes(id) ? w.filter((x) => x !== id) : [...w, id];
      saveWornCostumes(next);
      return next;
    });
  }, []);

  const openQuests = useCallback(() => {
    setMenuOpen(false); setWardrobeOpen(false); setPanelOpen(false);
    setQuestState(loadQuestState());
    setQuestsOpen(true);
  }, []);
  const openWardrobe = useCallback(() => {
    setMenuOpen(false); setQuestsOpen(false); setPanelOpen(false);
    setWardrobeOpen(true);
  }, []);

  // 長按開選單（手機）
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setPanelOpen(false); setQuestsOpen(false); setWardrobeOpen(false);
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
    actionAnim ? `anim-${actionAnim}` : "",
    blink ? "blink" : "",
    micro ? `micro-${micro}` : "",
    `lv-${lvl}`,
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
          <button onClick={openQuests}>
            <span aria-hidden>📜</span> 任務看板{claimableN > 0 ? `（${claimableN} 可領！）` : ""}
          </button>
          <button onClick={openWardrobe}>
            <span aria-hidden>🎀</span> 飾品衣櫥（{ownedIds.length}/{PIPI_COSTUMES.length}）
          </button>
          <button onClick={() => setOutfit(null)}>
            <span aria-hidden>🧭</span> 自動換裝{!outfitOverride ? " ✓" : ""}
          </button>
          {(Object.keys(OUTFITS) as Outfit[]).map((o) => (
            <button key={o} onClick={() => setOutfit(o)}>
              <span aria-hidden>{OUTFITS[o].emoji}</span> {OUTFITS[o].name}{outfit === o ? " ✓" : ""}
            </button>
          ))}
          <button onClick={() => playAction("dance")}><span aria-hidden>🎵</span> 跳舞</button>
          <button onClick={() => playAction("spin")}><span aria-hidden>🌀</span> 轉圈</button>
          <button onClick={() => playAction("hop")}><span aria-hidden>🦘</span> 跳跳</button>
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

      {/* v5 任務看板（每日派任務） */}
      {questsOpen && (
        <div className="pipi-panel pipi-quests" role="dialog" aria-label="任務看板">
          <div className="pipi-panel-head">
            <div className="pipi-panel-emoji" aria-hidden>📜</div>
            <div>
              <strong>小寶任務看板</strong>
              <small>每天 3 個任務 · 完成領金幣</small>
            </div>
            <button className="pipi-panel-close" onClick={() => setQuestsOpen(false)} aria-label="關閉">✕</button>
          </div>
          {todayQuests.map((q) => {
            const p = Math.min(q.target, questState.progress[q.id] ?? 0);
            const done = p >= q.target;
            const claimed = questState.claimed.includes(q.id);
            return (
              <div key={q.id} className={`pipi-quest ${done && !claimed ? "ready" : ""} ${claimed ? "claimed" : ""}`}>
                <div className="pipi-quest-top">
                  <span className="pipi-quest-emoji" aria-hidden>{q.emoji}</span>
                  <span className="pipi-quest-title">{q.title}</span>
                  <span className="pipi-quest-reward">🪙{q.rewardCoins} 💖{q.rewardAffection}</span>
                </div>
                <div className="pipi-quest-desc">{q.desc}</div>
                <div className="pipi-quest-bar"><div style={{ width: `${(p / q.target) * 100}%` }} /></div>
                <div className="pipi-quest-foot">
                  <span>{p}/{q.target}</span>
                  {claimed
                    ? <span className="pipi-quest-claimed">✓ 已領取</span>
                    : done
                      ? <button className="pipi-quest-claim" onClick={() => claimQuest(q.id)}>領取獎勵</button>
                      : <span className="pipi-quest-doing">進行中…</span>}
                </div>
              </div>
            );
          })}
          <div className="pipi-panel-hint">答題、玩遊戲、地圖探索都會推進任務喵！</div>
        </div>
      )}

      {/* v5 飾品衣櫥（疊層穿搭） */}
      {wardrobeOpen && (
        <div className="pipi-panel pipi-wardrobe" role="dialog" aria-label="飾品衣櫥">
          <div className="pipi-panel-head">
            <div className="pipi-panel-emoji" aria-hidden>🎀</div>
            <div>
              <strong>小寶飾品衣櫥</strong>
              <small>達成條件解鎖，可疊在套裝上</small>
            </div>
            <button className="pipi-panel-close" onClick={() => setWardrobeOpen(false)} aria-label="關閉">✕</button>
          </div>
          <div className="pipi-wardrobe-grid">
            {PIPI_COSTUMES.map((c) => {
              const owned = ownedIds.includes(c.id);
              const isWorn = worn.includes(c.id);
              return (
                <button
                  key={c.id}
                  className={`pipi-costume-card ${isWorn ? "worn" : ""}`}
                  disabled={!owned}
                  onClick={() => toggleWear(c.id)}
                  title={owned ? c.desc : `🔒 ${c.unlockText}`}
                >
                  <span className="pipi-costume-card-emoji" aria-hidden>{owned ? c.emoji : "🔒"}</span>
                  <span className="pipi-costume-card-name">{c.name}</span>
                  <span className="pipi-costume-card-hint">{owned ? (isWorn ? "點擊脫下" : "點擊戴上") : c.unlockText}</span>
                </button>
              );
            })}
          </div>
          <div className="pipi-panel-hint">好感度、互動、任務都能解鎖新飾品喵！</div>
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
            <div><span>📜 任務完成</span><strong>{questState.claimedTotal}</strong></div>
            <div><span>👗 目前套裝</span><strong>{outfitInfo.emoji} {outfitInfo.name}</strong></div>
            <div><span>🎀 穿搭</span><strong>{wornItems.length > 0 ? wornItems.map((c) => c.emoji).join("") : "素顏"}</strong></div>
            <div><span>😊 心情</span><strong>{MOOD_NAMES[mood]}</strong></div>
          </div>
          <div className="pipi-panel-hint">點擊互動 · 雙擊撒嬌 · 右鍵選單（任務／衣櫥） · 拖曳丟擲</div>
        </div>
      )}

      <div
        ref={rootRef}
        className={cls}
        style={{
          ...(pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : {}),
          width: petPx, height: petPx,
          fontSize: petPx,
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
        title="點擊互動 · 雙擊撒嬌 · 右鍵/長按選單 · 拖曳移動"
      >
        <img src={outfitInfo.img} alt={`小寶 - ${outfitInfo.name}`} draggable={false} width={petPx} height={petPx} />
        {!sleeping && wornItems.map((c) => (
          <span key={c.id} className={`pipi-costume pipi-costume-${c.slot}`} aria-hidden>{c.emoji}</span>
        ))}
        <div className="pipi-shadow" />
        {emote && <div className="pipi-emote" aria-hidden>{emote}</div>}
      </div>
      {isTouch && !hidden && (
        <button
          className="pipi-menu-btn"
          onClick={() => { setPanelOpen(false); setQuestsOpen(false); setWardrobeOpen(false); setMenuOpen((v) => !v); }}
          aria-label="開啟小寶選單"
        >
          ☰
        </button>
      )}
    </>
  );
}

export default PipiPet;
