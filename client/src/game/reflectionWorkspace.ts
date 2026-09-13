/**
 * 深度伴讀・可堆疊卡片工作台 — 資料層（框架無關的 singleton store）
 *
 * 設計：
 * - 每一張卡片對應「一個題目的深度伴讀對話」；同一題重複點擊只會把舊卡置頂，不重複開卡。
 * - 跨題保留：在答題頁切換題目不會關掉已開的卡片，因此可同時攤開多題對照（可拖拽堆疊）。
 * - LLM 呼叫仍由 React 層（ReflectionWorkspace）走 tRPC aiCompanion.reflect；store 只負責
 *   排定 outbox 請求、回收結果，任何失敗由 React 層回報，store 補上離線規則腦，保證永不空白。
 * - 對話卡片只活在記憶體（離開答題頁即清空）；唯有「主題偏好」與「佈局／主題快照」存 localStorage。
 * - 刻意不保存姓名、學校、班級；卡片上下文只有題目與選項。
 */
import {
  buildRuleReflection,
  type CompanionBrainSource,
  type RuleReflectionInput,
} from "@/game/companionBrain";

export type CardThemeId = "light" | "dark" | "glass" | "soft" | "mono" | "custom";

export const CARD_THEMES: Array<{ id: CardThemeId; label: string }> = [
  { id: "light", label: "晨光" },
  { id: "dark", label: "夜航" },
  { id: "glass", label: "毛玻璃" },
  { id: "soft", label: "暈染" },
  { id: "mono", label: "極簡黑白" },
  { id: "custom", label: "自訂" },
];

/** 開卡所需的題目上下文（刻意不含任何學生個人資料）。 */
export type ReflectionContext = {
  question: string;
  options: string[];
  selectedIndex: number;
  answerIndex: number;
  subject: string;
  learningTopic?: string;
};

export type ReflectionTurn = {
  id: number;
  turn: "first" | "more";
  text: string;
  source: CompanionBrainSource;
};

export type CardRect = { x: number; y: number; w: number; h: number };

export type ReflectionCard = ReflectionContext & {
  id: string;
  /** 同題去重鍵：題幹＋選項＋作答。 */
  cardKey: string;
  title: string;
  turns: ReflectionTurn[];
  /** asking 代表有一個 LLM 請求在空中（first/more）。 */
  pendingTurn: "first" | "more" | null;
  notice: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
};

/** 待送 LLM 請求；React 層看到新 nonce 就發 tRPC，完成後回報 resolve/reject。 */
export type OutboxItem = {
  nonce: number;
  cardId: string;
  turn: "first" | "more";
};

export type LayoutSnapshot = {
  id: string;
  name: string;
  ts: number;
  rects: Array<{ x: number; y: number; w: number; h: number }>;
};

export type ThemeSnapshot = {
  id: string;
  name: string;
  ts: number;
  theme: CardThemeId;
  customAccent: string;
};

type WorkspaceState = {
  cards: ReflectionCard[];
  theme: CardThemeId;
  customAccent: string;
  zTop: number;
  outbox: OutboxItem[];
  layoutSnapshots: LayoutSnapshot[];
  themeSnapshots: ThemeSnapshot[];
};

const PREFS_KEY = "reflection-workspace-prefs-v1";
const LAYOUT_SNAP_KEY = "reflection-layout-snapshots-v1";
const THEME_SNAP_KEY = "reflection-theme-snapshots-v1";
const MAX_SNAPSHOTS = 5;
const DEFAULT_W = 360;
const DEFAULT_H = 520;
const MIN_W = 280;
const MIN_H = 300;
const CASCADE_STEP = 30;

const CUSTOM_ACCENTS = ["#FF6B35", "#5FA8D3", "#76A482", "#8E7CC3", "#E07A9C"];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadTheme(): { theme: CardThemeId; customAccent: string } {
  if (typeof localStorage === "undefined") return { theme: "light", customAccent: CUSTOM_ACCENTS[0]! };
  const parsed = safeParse<{ theme?: CardThemeId; customAccent?: string } | null>(
    localStorage.getItem(PREFS_KEY),
    null,
  );
  const valid = parsed && CARD_THEMES.some((t) => t.id === parsed.theme);
  return {
    theme: valid ? parsed!.theme! : "light",
    customAccent: typeof parsed?.customAccent === "string" && parsed.customAccent ? parsed.customAccent : CUSTOM_ACCENTS[0]!,
  };
}

function persistPrefs(theme: CardThemeId, customAccent: string) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, customAccent }));
  } catch {
    // 容量不足不影響對話功能。
  }
}

function loadSnapshots<T>(key: string): T[] {
  if (typeof localStorage === "undefined") return [];
  const value = safeParse<T[] | null>(localStorage.getItem(key), null);
  return Array.isArray(value) ? value : [];
}

function persistSnapshots<T>(key: string, list: T[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // 忽略容量錯誤。
  }
}

function buildCardKey(ctx: ReflectionContext): string {
  return `${ctx.subject}::${ctx.question}::${ctx.selectedIndex}::${ctx.answerIndex}`;
}

export function toRuleInput(card: ReflectionCard, turn: "first" | "more"): RuleReflectionInput {
  return {
    question: card.question,
    options: card.options,
    selectedAnswer: card.selectedIndex >= 0 ? card.options[card.selectedIndex] ?? "" : "",
    correctAnswer: card.options[card.answerIndex] ?? "",
    correct: card.selectedIndex === card.answerIndex,
    subject: card.subject,
    learningTopic: card.learningTopic,
    turn,
  };
}

let nonceSeq = 0;
let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

const initialPrefs = loadTheme();

let state: WorkspaceState = {
  cards: [],
  theme: initialPrefs.theme,
  customAccent: initialPrefs.customAccent,
  zTop: 10,
  outbox: [],
  layoutSnapshots: loadSnapshots<LayoutSnapshot>(LAYOUT_SNAP_KEY),
  themeSnapshots: loadSnapshots<ThemeSnapshot>(THEME_SNAP_KEY),
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (error) {
      console.error("[ReflectionWorkspace] listener error", error);
    }
  });
}
function setState(patch: Partial<WorkspaceState>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function getState(): WorkspaceState {
  return state;
}

/** 階梯錯落的初始位置，並夾在視窗內。 */
function cascadeRect(index: number): { x: number; y: number; w: number; h: number } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const w = Math.min(DEFAULT_W, Math.max(MIN_W, vw - 24));
  const h = Math.min(DEFAULT_H, Math.max(MIN_H, vh - 80));
  const maxX = Math.max(12, vw - w - 12);
  const maxY = Math.max(72, vh - h - 12);
  const offset = (index % 6) * CASCADE_STEP;
  return {
    x: Math.min(maxX, Math.max(12, vw - w - 24 - offset)),
    y: Math.min(maxY, Math.max(72, 84 + offset)),
    w,
    h,
  };
}

function clampRect<T extends CardRect>(rect: T): T {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const w = Math.min(Math.max(rect.w, MIN_W), vw - 12);
  const h = Math.min(Math.max(rect.h, MIN_H), vh - 24);
  return {
    ...rect,
    w,
    h,
    x: Math.min(Math.max(rect.x, -w + 80), vw - 80),
    y: Math.min(Math.max(rect.y, 8), vh - 48),
  };
}

const actions = {
  /** 開卡：同題置頂，否則新增並排定首輪 LLM 請求。回傳卡片 id。 */
  openCard(ctx: ReflectionContext): string {
    const cardKey = buildCardKey(ctx);
    const existing = state.cards.find((card) => card.cardKey === cardKey);
    if (existing) {
      actions.focusCard(existing.id);
      // 已最小化的舊卡重新展開。
      if (existing.minimized) actions.toggleMinimize(existing.id);
      return existing.id;
    }
    const zTop = state.zTop + 1;
    const rect = cascadeRect(state.cards.length);
    const id = nextId("rc");
    const correct = ctx.selectedIndex === ctx.answerIndex;
    const card: ReflectionCard = {
      ...ctx,
      id,
      cardKey,
      title: `${ctx.subject}・${correct ? "答對了" : "再想一想"}`,
      turns: [],
      pendingTurn: "first",
      notice: null,
      z: zTop,
      minimized: false,
      ...rect,
    };
    nonceSeq += 1;
    const outboxItem: OutboxItem = { nonce: nonceSeq, cardId: id, turn: "first" };
    setState({
      zTop,
      cards: [...state.cards, card],
      outbox: [...state.outbox, outboxItem],
    });
    return id;
  },

  requestMore(cardId: string) {
    const card = state.cards.find((item) => item.id === cardId);
    if (!card || card.pendingTurn) return;
    nonceSeq += 1;
    const outboxItem: OutboxItem = { nonce: nonceSeq, cardId, turn: "more" };
    setState({
      outbox: [...state.outbox, outboxItem],
      cards: state.cards.map((item) => (item.id === cardId ? { ...item, pendingTurn: "more" } : item)),
    });
  },

  /** React 層成功回收：補上一輪對話。 */
  resolveTurn(nonce: number, cardId: string, text: string, source: CompanionBrainSource) {
    const card = state.cards.find((item) => item.id === cardId);
    if (!card) {
      setState({ outbox: state.outbox.filter((item) => item.nonce !== nonce) });
      return;
    }
    const turnId = card.turns.length + 1;
    const turn = card.pendingTurn ?? "first";
    setState({
      outbox: state.outbox.filter((item) => item.nonce !== nonce),
      cards: state.cards.map((item) =>
        item.id === cardId
          ? {
              ...item,
              pendingTurn: null,
              notice: null,
              turns: [...item.turns, { id: turnId, turn, text, source }],
            }
          : item,
      ),
    });
  },

  /** React 層失敗回收：以離線規則腦兜底，並留下非阻塞提示。 */
  rejectTurn(nonce: number, cardId: string, message: string) {
    const card = state.cards.find((item) => item.id === cardId);
    if (!card) {
      setState({ outbox: state.outbox.filter((item) => item.nonce !== nonce) });
      return;
    }
    const turn = state.outbox.find((item) => item.nonce === nonce)?.turn ?? "first";
    const isRateLimited = /每分鐘|TOO_MANY_REQUESTS|429/.test(message);
    const fallback = buildRuleReflection(toRuleInput(card, turn));
    const turnId = card.turns.length + 1;
    setState({
      outbox: state.outbox.filter((item) => item.nonce !== nonce),
      cards: state.cards.map((item) =>
        item.id === cardId
          ? {
              ...item,
              pendingTurn: null,
              notice: isRateLimited ? message : "AI 學習夥伴暫時連不上，先由離線規則腦陪你想一想。",
              turns: [...item.turns, { id: turnId, turn, text: fallback, source: "rule" }],
            }
          : item,
      ),
    });
  },

  closeCard(cardId: string) {
    setState({ cards: state.cards.filter((item) => item.id !== cardId) });
  },

  closeAll() {
    setState({ cards: [], outbox: [] });
  },

  focusCard(cardId: string) {
    const card = state.cards.find((item) => item.id === cardId);
    if (!card) return;
    if (card.z === state.zTop && !card.minimized) return;
    const zTop = state.zTop + 1;
    setState({
      zTop,
      cards: state.cards.map((item) =>
        item.id === cardId ? { ...item, z: zTop, minimized: false } : item,
      ),
    });
  },

  toggleMinimize(cardId: string) {
    setState({
      cards: state.cards.map((item) =>
        item.id === cardId ? { ...item, minimized: !item.minimized } : item,
      ),
    });
  },

  moveCard(cardId: string, x: number, y: number) {
    setState({
      cards: state.cards.map((item) => {
        if (item.id !== cardId) return item;
        return clampRect({ ...item, x, y });
      }),
    });
  },

  resizeCard(cardId: string, w: number, h: number) {
    setState({
      cards: state.cards.map((item) => {
        if (item.id !== cardId) return item;
        return clampRect({ ...item, w, h });
      }),
    });
  },

  /** 一鍵排列：cascade 階梯或 grid 網格。 */
  arrange(mode: "cascade" | "grid") {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    setState({
      zTop: state.zTop + 1,
      cards: state.cards.map((card, index) => {
        if (mode === "grid") {
          const gap = 16;
          const col = index % 3;
          const row = Math.floor(index / 3);
          const w = Math.min(DEFAULT_W, (vw - gap * 4) / 3);
          const h = Math.min(DEFAULT_H, vh - 160);
          return {
            ...card,
            minimized: false,
            w,
            h,
            x: gap + col * (w + gap),
            y: 64 + row * (h + gap),
            z: state.zTop + 1 + index,
          };
        }
        const rect = cascadeRect(index);
        return { ...card, minimized: false, ...rect, z: state.zTop + 1 + index };
      }),
    });
  },

  setTheme(theme: CardThemeId) {
    setState({ theme });
    persistPrefs(theme, state.customAccent);
  },

  setCustomAccent(customAccent: string) {
    setState({ customAccent, theme: "custom" });
    persistPrefs("custom", customAccent);
  },

  // ---------- 佈局快照 ----------
  saveLayoutSnapshot(name: string) {
    const snapshot: LayoutSnapshot = {
      id: nextId("ls"),
      name: name.trim() || `佈局 ${state.layoutSnapshots.length + 1}`,
      ts: Date.now(),
      rects: state.cards.map((card) => ({ x: card.x, y: card.y, w: card.w, h: card.h })),
    };
    const list = [snapshot, ...state.layoutSnapshots].slice(0, MAX_SNAPSHOTS);
    setState({ layoutSnapshots: list });
    persistSnapshots(LAYOUT_SNAP_KEY, list);
  },

  restoreLayoutSnapshot(id: string) {
    const snapshot = state.layoutSnapshots.find((item) => item.id === id);
    if (!snapshot) return;
    setState({
      cards: state.cards.map((card, index) => {
        const rect = snapshot.rects[index] ?? cascadeRect(index);
        return { ...card, ...rect, minimized: false };
      }),
    });
  },

  deleteLayoutSnapshot(id: string) {
    const list = state.layoutSnapshots.filter((item) => item.id !== id);
    setState({ layoutSnapshots: list });
    persistSnapshots(LAYOUT_SNAP_KEY, list);
  },

  // ---------- 主題快照 ----------
  saveThemeSnapshot(name: string) {
    const snapshot: ThemeSnapshot = {
      id: nextId("ts"),
      name: name.trim() || `主題 ${state.themeSnapshots.length + 1}`,
      ts: Date.now(),
      theme: state.theme,
      customAccent: state.customAccent,
    };
    const list = [snapshot, ...state.themeSnapshots].slice(0, MAX_SNAPSHOTS);
    setState({ themeSnapshots: list });
    persistSnapshots(THEME_SNAP_KEY, list);
  },

  restoreThemeSnapshot(id: string) {
    const snapshot = state.themeSnapshots.find((item) => item.id === id);
    if (!snapshot) return;
    setState({ theme: snapshot.theme, customAccent: snapshot.customAccent });
    persistPrefs(snapshot.theme, snapshot.customAccent);
  },

  deleteThemeSnapshot(id: string) {
    const list = state.themeSnapshots.filter((item) => item.id !== id);
    setState({ themeSnapshots: list });
    persistSnapshots(THEME_SNAP_KEY, list);
  },

  /** 離開答題頁時清空對話卡片（保留主題與快照）。 */
  clearCards() {
    setState({ cards: [], outbox: [] });
  },
};

export const reflectionWorkspace = {
  subscribe,
  getState,
  ...actions,
};

export { CUSTOM_ACCENTS, MIN_W, MIN_H };
