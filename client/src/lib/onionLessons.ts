/**
 * 洋蔥式動畫微課——課程資料模型與進度（local-first）。
 *
 * 設計對齊洋蔥學院方法論：
 * - 一輪課程切成多個「層」（知識點），一次只講一個核心觀點，像剝洋蔥一層層來；
 * - 每層由數個程序化 SVG 動畫分鏡（scene）＋即時互動測驗（quiz）組成；
 * - 通過測驗才解鎖下一層；答錯給三級分層提示；星等與進度存這台裝置。
 *
 * 第一輪：國小數學三年級「分數工坊」——平均分 → 分母分子 → 看圖寫分數 → 等值分數。
 */

export type SceneKind =
  | "uneven" // 不均切（一大一小，錯誤示範）
  | "wheel" // 圓形等分（披薩扇形）
  | "bar" // 長條等分（巧克力格）
  | "frac" // 分數符號組裝（分子／分數線／分母）
  | "equiv"; // 等值分數並排（1/2 = 2/4 = 3/6）

export interface OnionScene {
  kind: SceneKind;
  /** 分鏡停留毫秒（配合旁白閱讀） */
  ms: number;
  /** 旁白字幕 */
  narration: string;
  /** wheel/bar：總共分成幾份 */
  parts?: number;
  /** wheel/bar：塗色（取走）幾份 */
  take?: number;
  /** 是否把塗色部分浮起 */
  lift?: boolean;
  /** 標出分母（總份數） */
  showDen?: boolean;
  /** 標出分子（塗色份數） */
  showNum?: boolean;
  /** frac 分鏡的分子、分母 */
  num?: number;
  den?: number;
}

export interface OnionQuizVisual {
  kind: SceneKind;
  parts?: number;
  take?: number;
}

export interface OnionQuiz {
  id: string;
  prompt: string;
  options: string[];
  /** 正解選項 index */
  answer: number;
  explain: string;
  /** 分層提示：看不太懂 → 再想想 → 幾乎說破，三級 */
  hints: [string, string, string];
  visual?: OnionQuizVisual;
}

export interface OnionLayer {
  id: string;
  /** 第幾層（1 起） */
  order: number;
  title: string;
  /** 這一層唯一的核心觀點 */
  goal: string;
  scenes: OnionScene[];
  quiz: OnionQuiz[];
}

export interface OnionCourse {
  id: string;
  subject: string;
  grade: string;
  title: string;
  tagline: string;
  layers: OnionLayer[];
}

/** 第一輪課程：分數工坊。 */
export const FRACTION_COURSE: OnionCourse = {
  id: "fractions",
  subject: "數學",
  grade: "三年級 · 分數",
  title: "分數工坊",
  tagline: "像剝洋蔥一樣，一層層把分數弄懂",
  layers: [
    {
      id: "equal-parts",
      order: 1,
      title: "第一層：公平的平均分",
      goal: "每一份都要一樣大",
      scenes: [
        {
          kind: "uneven",
          ms: 6000,
          narration: "一塊大、一塊小，這樣分披薩一點都不公平！公平的第一個條件，就是每一份都要一樣大。",
        },
        {
          kind: "wheel",
          parts: 4,
          ms: 7500,
          narration: "看，把披薩切成 4 片，每一片都一樣大——這就叫做「平均分」。",
        },
        {
          kind: "wheel",
          parts: 4,
          take: 1,
          lift: true,
          ms: 7500,
          narration: "把一個披薩平均分成 4 份，其中的 1 份，就是這個披薩的「四分之一」。",
        },
      ],
      quiz: [
        {
          id: "ep-q1",
          prompt: "下面哪一種分法是「平均分」？",
          options: ["隨便剝成好幾塊", "切成 4 片，每片一樣大", "一刀切成一大一小"],
          answer: 1,
          explain: "平均分的重點是「每一份都一樣大」，切成 4 片一樣大才公平。",
          hints: ["先想「公平」是什麼意思。", "平均分，就是每一份都要一樣大。", "切成 4 片、每片一樣大，就是平均分。"],
        },
        {
          id: "ep-q2",
          prompt: "一個蛋糕要平均分給 6 個小朋友，每人一塊，要切成幾份？",
          options: ["3 份", "6 份", "12 份"],
          answer: 1,
          explain: "平均分給 6 個人、每人剛好一塊，就要切成 6 份。",
          hints: ["每一個人會拿到幾塊？", "每人一塊，幾個人就切幾份。", "6 個小朋友，所以切成 6 份。"],
        },
      ],
    },
    {
      id: "den-num",
      order: 2,
      title: "第二層：分母與分子",
      goal: "分母記一共幾份、分子記拿到幾份",
      scenes: [
        {
          kind: "wheel",
          parts: 4,
          showDen: true,
          ms: 7500,
          narration: "先看下面的數字。披薩平均分成 4 份，這個「一共 4 份」的 4，寫在分數的下面，叫做分母。",
        },
        {
          kind: "wheel",
          parts: 4,
          take: 3,
          lift: true,
          showNum: true,
          ms: 7500,
          narration: "如果我拿了其中 3 片，「拿到 3 份」的 3 寫在上面，叫做分子。",
        },
        {
          kind: "frac",
          num: 3,
          den: 4,
          ms: 6500,
          narration: "分子在上、分母在下，中間一條線，合起來就是四分之三，寫成 3/4。",
        },
      ],
      quiz: [
        {
          id: "dn-q1",
          prompt: "這個圓平均分成 8 份、其中 5 份塗色。請問「分母」是多少？",
          options: ["5", "8", "3"],
          answer: 1,
          explain: "分母在分數的下面，記的是「一共分成幾份」，一共 8 份，所以分母是 8。",
          hints: ["分母寫在分數的上面還是下面？", "分母記的是「全部」的份數。", "一共分成 8 份，分母就是 8。"],
          visual: { kind: "wheel", parts: 8, take: 5 },
        },
        {
          id: "dn-q2",
          prompt: "同一個圓（8 份、塗色 5 份），「分子」是多少？",
          options: ["8", "3", "5"],
          answer: 2,
          explain: "分子在上面，記的是「塗色／拿到」的份數，塗色 5 份，所以分子是 5。",
          hints: ["分子記的是哪一部份？", "分子記的是塗色（拿到）的份數。", "塗色了 5 份，分子就是 5。"],
          visual: { kind: "wheel", parts: 8, take: 5 },
        },
      ],
    },
    {
      id: "name-it",
      order: 3,
      title: "第三層：看圖寫出分數",
      goal: "分母數全部、分子數塗色",
      scenes: [
        {
          kind: "bar",
          parts: 6,
          take: 2,
          ms: 7000,
          narration: "這條巧克力平均分成 6 格、塗色 2 格。先數全部：一共 6 格，6 就是分母。",
        },
        {
          kind: "bar",
          parts: 6,
          take: 2,
          showNum: true,
          ms: 7000,
          narration: "再數塗色的：2 格，2 就是分子。所以塗色的部份是六分之二，寫成 2/6。",
        },
        {
          kind: "wheel",
          parts: 5,
          take: 4,
          ms: 7000,
          narration: "換成圓形也一樣：全部 5 份當分母、塗色 4 份當分子，就是五分之四，寫成 4/5。",
        },
      ],
      quiz: [
        {
          id: "ni-q1",
          prompt: "這條巧克力平均分成 8 格、塗色 3 格。塗色部份是幾分之幾？",
          options: ["3/8（八分之三）", "8/3（三分之八）", "5/8（八分之五）"],
          answer: 0,
          explain: "全部 8 格是分母、塗色 3 格是分子，所以是 3/8。",
          hints: ["先數全部有幾格，放在下面。", "再數塗色幾格，放在上面。", "全部 8、塗色 3，就是 3/8。"],
          visual: { kind: "bar", parts: 8, take: 3 },
        },
        {
          id: "ni-q2",
          prompt: "這個圓平均分成 6 份、塗色 5 份。塗色部份是幾分之幾？",
          options: ["1/6", "5/6（六分之五）", "6/5"],
          answer: 1,
          explain: "全部 6 份、塗色 5 份，塗色比較多、幾乎整個都塗滿，是 5/6。",
          hints: ["塗色比較多，分數會接近 1。", "全部 6 份、塗色 5 份。", "分母 6、分子 5，是 5/6。"],
          visual: { kind: "wheel", parts: 6, take: 5 },
        },
      ],
    },
    {
      id: "equivalent",
      order: 4,
      title: "第四層：等值分數",
      goal: "切得更細、塊數變多，拿到的量可以一樣",
      scenes: [
        {
          kind: "bar",
          parts: 2,
          take: 1,
          ms: 6500,
          narration: "一條巧克力切成 2 格、拿 1 格，拿到的是二分之一，寫成 1/2。",
        },
        {
          kind: "bar",
          parts: 4,
          take: 2,
          ms: 7500,
          narration: "同一條巧克力，把每一格再對半切，變成 4 格、拿 2 格——你看，拿到的巧克力一樣多！",
        },
        {
          kind: "equiv",
          ms: 8500,
          narration: "所以 1/2 和 2/4 是一樣大的；再切細一點，還會等於 3/6。這種大小相同、寫法不同的分數，叫「等值分數」。",
        },
      ],
      quiz: [
        {
          id: "eq-q1",
          prompt: "下面哪一個分數和 1/2（一半）一樣大？",
          options: ["1/4", "2/4（四分之二）", "2/2"],
          answer: 1,
          explain: "一半就是切成 4 份拿 2 份，2/4 和 1/2 一樣大，是等值分數。",
          hints: ["在心裡把巧克力對半切。", "一半＝切成 4 格、拿 2 格。", "2/4 就是一半，和 1/2 等值。"],
        },
        {
          id: "eq-q2",
          prompt: "這條巧克力切成 6 格、塗色 3 格（剛好一半），它寫成 3/6，也等於多少？",
          options: ["1/2（二分之一）", "1/6", "2/6"],
          answer: 0,
          explain: "6 格塗 3 格剛好是一半，所以 3/6＝1/2，它們是等值分數。",
          hints: ["6 格塗色 3 格，塗色的量是多少？", "剛好塗了一半。", "一半就是 1/2，所以 3/6＝1/2。"],
          visual: { kind: "bar", parts: 6, take: 3 },
        },
      ],
    },
  ],
};

export const ONION_COURSES: OnionCourse[] = [FRACTION_COURSE];

export function getCourse(id: string): OnionCourse | undefined {
  return ONION_COURSES.find((course) => course.id === id);
}

/* ---------------- 進度（local-first） ---------------- */

export const ONION_PROGRESS_KEY = "xue-onion-progress-v1";

export interface LayerProgress {
  done: boolean;
  /** 該層測驗答錯總次數（首次通過時計算星等） */
  mistakes: number;
  /** 首次就答對、沒有重試的題數（用於整輪正確率結算） */
  firstTry: number;
  stars: number; // 0–3
  completedAt?: number;
}

export type OnionProgressMap = Record<string, { layers: Record<string, LayerProgress> }>;

export function loadOnionProgress(): OnionProgressMap {
  try {
    return JSON.parse(localStorage.getItem(ONION_PROGRESS_KEY) ?? "{}") as OnionProgressMap;
  } catch {
    return {};
  }
}

export function saveOnionProgress(progress: OnionProgressMap) {
  try {
    localStorage.setItem(ONION_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* 隱私模式無法寫入就只留在記憶體 */
  }
}

export function courseProgress(progress: OnionProgressMap, courseId: string): Record<string, LayerProgress> {
  return progress[courseId]?.layers ?? {};
}

/** 前一層完成才解鎖下一層；第一層永遠開放。 */
export function isLayerUnlocked(course: OnionCourse, layerIndex: number, layers: Record<string, LayerProgress>): boolean {
  if (layerIndex <= 0) return true;
  const prev = course.layers[layerIndex - 1];
  return Boolean(layers[prev.id]?.done);
}

/** 單層星等：該層測驗零失誤 3 星、錯 1 次 2 星、錯 2 次以上 1 星（完成至少 1 星）。 */
export function layerStars(mistakes: number): 1 | 2 | 3 {
  if (mistakes <= 0) return 3;
  if (mistakes === 1) return 2;
  return 1;
}

/** 整輪完成後的總星等：全 3 星→3、各層平均 ≥1.5→2，否則 1。 */
export function courseTotalStars(course: OnionCourse, layers: Record<string, LayerProgress>): number {
  const done = course.layers.filter((layer) => layers[layer.id]?.done);
  if (done.length < course.layers.length) return 0;
  const avg = done.reduce((sum, layer) => sum + (layers[layer.id]?.stars ?? 1), 0) / done.length;
  if (avg >= 2.999) return 3;
  if (avg >= 1.5) return 2;
  return 1;
}

/** 已完成層數。 */
export function completedLayerCount(course: OnionCourse, layers: Record<string, LayerProgress>): number {
  return course.layers.filter((layer) => layers[layer.id]?.done).length;
}

/** 學習等級頭銜（遊戲化）：依完成層數給稱號。 */
export function rankTitle(doneCount: number, total: number): string {
  if (doneCount >= total) return "分數小達人";
  if (doneCount >= 3) return "概念行家";
  if (doneCount >= 2) return "分數學徒";
  if (doneCount >= 1) return "剝皮助手";
  return "新手洋蔥";
}
