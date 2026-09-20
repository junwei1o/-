/**
 * 洋蔥學院風格動畫講解教室玩法（local-first）。
 *
 * 設計理念借鑒洋蔥學院：
 *  - 一份動畫課 = 一個知識點，由「分鏡腳本 frames + 闖關題目」組成
 *  - 5-8 分鐘精講一個知識點、摒棄真人教師用動畫角色、生活情境引入、抽象→具象、學練結合
 *  - 數據驅動：新增知識點只要寫一份 lesson，不用改動畫邏輯
 *
 * 一組學習單 = 一段動畫講解（情境引入→動畫拆解→互動演示）＋ 一輪闖關練習（5 題）＋ 總結獎勵。
 * 整體約 4-5 分鐘，可無限重玩，成績留在自己裝置。
 *
 * 教具系統（OnionProp）是可擴展的聯集型：只要新增一個 kind 分支＋對應渲染元件，
 * 任何學科的抽象概念都能具象化。目前支援：
 *  - none：空舞臺（純對白）
 *  - pie / pies：分數圓餅（數學·分數）
 *  - text：字卡（國語·字詞辨識）
 *  - cycle：循環圖（自然·水循環等週期系統）
 *  - shape：幾何形（數學·三角形面積）
 */

/** 洋蔥角色的動作（驅動 SVG 動畫）。 */
export type OnionAction = "wave" | "walk" | "point" | "jump" | "think" | "cheer";

/** 舞臺上的教具（抽象概念具象化）。可擴展聯集型。 */
export type OnionProp =
  | { kind: "none" }
  | { kind: "pie"; a: number; b: number; label?: string }
  | {
      kind: "pies";
      left: { a: number; b: number };
      right: { a: number; b: number };
      result?: { a: number; b: number };
    }
  /** 字卡：國語字詞辨識、成語等。 */
  | { kind: "text"; text: string; sub?: string; tone?: "ok" | "warn" }
  /** 循環圖：自然科學的週期系統（水循環、食物鏈…）。nodes 順時針排列，active 標示當前階段。 */
  | { kind: "cycle"; nodes: string[]; active?: number }
  /** 幾何形：三角形（底×高÷2）。 */
  | { kind: "shape"; shape: "triangle"; base: number; height: number; label?: string };

/** 一幀分鏡。 */
export type OnionFrame = {
  id: number;
  /** 字幕（同步顯示在舞臺下方）。 */
  caption: string;
  action: OnionAction;
  prop: OnionProp;
  /** 這一幀停留毫秒。 */
  duration: number;
};

/** 闖關題目。 */
export type OnionQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

/** 一份動畫課。 */
export type OnionLesson = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade: string;
  desc: string;
  frames: OnionFrame[];
  questions: OnionQuestion[];
};

/** 通關結算。 */
export type OnionResult = { stars: number; correct: number; total: number; coins: number };

/** 依答對率結算星等與金幣（與教室其他玩法一致的 3★ 標準）。 */
export function gradeOnionLesson(correct: number, total: number): OnionResult {
  const ratio = total ? correct / total : 0;
  const stars = ratio >= 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
  const coins = correct * 10 + (stars === 3 ? 20 : 0);
  return { stars, correct, total, coins };
}

/* ========================================================================
 * 課程 1：數學 — 分數加減（同分母）
 * 從「吃披薩」的生活情境引入，逐步抽象到 1/4 + 2/4 = 3/4。
 * ======================================================================== */
export const FRACTION_LESSON: OnionLesson = {
  id: "fraction-add",
  title: "分數加減：同分母怎麼加？",
  subject: "數學",
  topic: "分數加減",
  grade: "五上",
  desc: "洋蔥帶你用一塊披薩搞懂「分母相同」的分數加法，動畫拆解＋互動演示，看完立刻闖關。",
  frames: [
    { id: 1, caption: "嗨！今天我們用一塊披薩，搞懂分數加法。", action: "wave", prop: { kind: "none" }, duration: 2600 },
    { id: 2, caption: "把披薩切成 4 等份，每一份就是 1/4。", action: "point", prop: { kind: "pie", a: 1, b: 4 }, duration: 3000 },
    { id: 3, caption: "你吃了 1 片，等於吃掉 1/4 塊披薩。", action: "think", prop: { kind: "pie", a: 1, b: 4, label: "1/4" }, duration: 3000 },
    { id: 4, caption: "朋友又夾給你 2 片，等於再多了 2/4。", action: "walk", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 } }, duration: 3400 },
    { id: 5, caption: "分母一樣（都是 4），就把分子直接相加！", action: "point", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 }, result: { a: 3, b: 4 } }, duration: 3400 },
    { id: 6, caption: "1 + 2 = 3，所以 1/4 ＋ 2/4 ＝ 3/4。", action: "jump", prop: { kind: "pie", a: 3, b: 4, label: "3/4" }, duration: 3200 },
    { id: 7, caption: "口訣：同分母相加，分母不變、分子相加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "f1", prompt: "1/4 ＋ 2/4 ＝ ？", options: ["3/8", "3/4", "2/4", "3/4 ÷ 4"], answer: 1, explanation: "同分母相加：分母 4 不變，分子 1+2=3，答案是 3/4。" },
    { id: "f2", prompt: "2/5 ＋ 1/5 ＝ ？", options: ["3/10", "3/5", "2/5", "3/25"], answer: 1, explanation: "分母 5 不變，分子 2+1=3，答案是 3/5。" },
    { id: "f3", prompt: "1/3 ＋ 1/3 ＝ ？", options: ["2/3", "2/6", "1/6", "2/9"], answer: 0, explanation: "分母 3 不變，分子 1+1=2，答案是 2/3。" },
    { id: "f4", prompt: "3/8 ＋ 4/8 ＝ ？", options: ["7/8", "7/16", "12/8", "7/64"], answer: 0, explanation: "分母 8 不變，分子 3+4=7，答案是 7/8。" },
    { id: "f5", prompt: "一條緞帶，姊姊用了 1/6，弟弟用了 3/6，兩人共用了幾分之幾？", options: ["4/6", "4/12", "3/6", "1/6"], answer: 0, explanation: "同分母：1/6 ＋ 3/6，分子 1+3=4，答案是 4/6。" },
  ],
};

/* ========================================================================
 * 課程 2：國語 — 「的、得、地」怎麼分？
 * 三個同音字讀起來一樣，用法靠「接什麼詞」來分。用字卡對比呈現。
 * ======================================================================== */
export const CHINESE_DE_LESSON: OnionLesson = {
  id: "de-usage",
  title: "「的、得、地」怎麼分？",
  subject: "國語",
  topic: "的字用法",
  grade: "五上",
  desc: "三個讀音一樣的字，用法卻不同。洋蔥用字卡帶你記住：的接名詞、得接動詞後、地接動詞前。",
  frames: [
    { id: 1, caption: "嗨！這三個字讀起來都一樣，可是用法完全不同喔。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, caption: "「的」放在名詞前面，用來修飾。像「紅的蘋果」。", action: "point", prop: { kind: "text", text: "紅的蘋果", sub: "形容詞＋的＋名詞", tone: "ok" }, duration: 3400 },
    { id: 3, caption: "「得」放在動詞後面，補充說明程度。像「跑得快」。", action: "think", prop: { kind: "text", text: "跑得快", sub: "動詞＋得＋補語", tone: "ok" }, duration: 3400 },
    { id: 4, caption: "「地」放在動詞前面，修飾動作的方式。像「慢慢地走」。", action: "walk", prop: { kind: "text", text: "慢慢地走", sub: "副詞＋地＋動詞", tone: "ok" }, duration: 3400 },
    { id: 5, caption: "記口訣：的接名詞、得接動詞後、地接動詞前。", action: "cheer", prop: { kind: "text", text: "的→名詞  得→動詞後  地→動詞前", tone: "ok" }, duration: 3600 },
    { id: 6, caption: "小心！「很漂亮的衣服」用的是「的」，因為後面接名詞「衣服」。", action: "point", prop: { kind: "text", text: "很漂亮的（的→對）衣服", sub: "後面是名詞，所以用的", tone: "ok" }, duration: 3600 },
    { id: 7, caption: "口訣記好了嗎？準備闖關，看看你會不會分！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "d1", prompt: "他跑__很快。（填哪個？）", options: ["的", "得", "地", "都行"], answer: 1, explanation: "「跑」是動詞，後面補充程度用「得」，所以是「跑得快」。" },
    { id: "d2", prompt: "一__美麗的花園。", options: ["的", "得", "地", "都行"], answer: 0, explanation: "後面接名詞「花園」，修飾名詞用「的」。" },
    { id: "d3", prompt: "輕輕__推開門。", options: ["的", "得", "地", "都行"], answer: 2, explanation: "「輕輕」修飾動詞「推開」，動詞前面用「地」。" },
    { id: "d4", prompt: "這碗飯真好吃__！啊，這裡不加的字。哪句正確？", options: ["好吃得很", "好吃得很呢", "好吃得不得了", "好吃得"], answer: 2, explanation: "動詞/形容詞「好吃」後接「得」再接補語，常見說法如「好吃得不得了」。" },
    { id: "d5", prompt: "下列哪一句的「的」用法正確？", options: ["他高興的跳起來", "美麗的花朵", "慢慢的走", "跑快得"], answer: 1, explanation: "「美麗的花朵」中「的」後接名詞「花朵」，用法正確。其他應為地/得。" },
  ],
};

/* ========================================================================
 * 課程 3：自然 — 水循環怎麼轉？
 * 蒸發→凝結→降水→匯流，週而復始。用循環圖呈現階段流動。
 * ======================================================================== */
export const WATER_CYCLE_LESSON: OnionLesson = {
  id: "water-cycle",
  title: "水循環：水在天上地下怎麼轉？",
  subject: "自然",
  topic: "水循環",
  grade: "四上",
  desc: "水從來不會消失，只是不停旅行。洋蔥用循環圖帶你看懂蒸發、凝結、降水三個階段。",
  frames: [
    { id: 1, caption: "嗨！你有沒有想過，天上的雨從哪裡來？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, caption: "太陽把海和河裡的水加熱，水變成水蒸氣往上升——這叫「蒸發」。", action: "point", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 0 }, duration: 3600 },
    { id: 3, caption: "水蒸氣到了高空，遇到冷就變回小水珠，聚成雲——這叫「凝結」。", action: "think", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 1 }, duration: 3600 },
    { id: 4, caption: "雲裡的水珠越聚越重，掉下來變成雨或雪——這叫「降水」。", action: "jump", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 2 }, duration: 3600 },
    { id: 5, caption: "雨水流回河川和海洋，叫做「匯流」，然後又開始下一輪！", action: "walk", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 3 }, duration: 3600 },
    { id: 6, caption: "四個階段不斷循環，水就這樣在天上地下旅行，永遠不會用完。", action: "cheer", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"] }, duration: 3400 },
    { id: 7, caption: "記住：循環的能量來自太陽。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "w1", prompt: "水變成水蒸氣往上升，這個過程叫什麼？", options: ["凝結", "蒸發", "降水", "匯流"], answer: 1, explanation: "水受熱變成水蒸氣上升，稱為蒸發。" },
    { id: "w2", prompt: "水蒸氣到高空遇冷變成雲，這叫什麼？", options: ["蒸發", "凝結", "降水", "融化"], answer: 1, explanation: "水蒸氣遇冷聚成小水珠成雲，稱為凝結。" },
    { id: "w3", prompt: "雲裡的水變重掉下來成雨，這叫什麼？", options: ["蒸發", "凝結", "降水", "昇華"], answer: 2, explanation: "雲中水珠過重落下成雨雪，稱為降水。" },
    { id: "w4", prompt: "水循環最主要的能量來自哪裡？", options: ["月亮", "風", "太陽", "地熱"], answer: 2, explanation: "太陽提供熱能讓水蒸發，是水循環的動力來源。" },
    { id: "w5", prompt: "下列哪一項不是水循環的階段？", options: ["蒸發", "凝結", "燃燒", "降水"], answer: 2, explanation: "燃燒是化學反應，不屬於水循環。水循環為蒸發→凝結→降水→匯流。" },
  ],
};

/* ========================================================================
 * 課程 4：數學 — 三角形面積怎麼算？
 * 底×高÷2。用「兩個三角形拼成平行四邊形」的視覺化來理解公式由來。
 * ======================================================================== */
export const TRIANGLE_AREA_LESSON: OnionLesson = {
  id: "triangle-area",
  title: "三角形面積：底×高÷2 怎麼來？",
  subject: "數學",
  topic: "三角形面積",
  grade: "五上",
  desc: "三角形面積公式不是死記的！洋蔥帶你用「兩個三角形拼一拼」搞懂為什麼是底×高÷2。",
  frames: [
    { id: 1, caption: "嗨！三角形面積有個好記的公式，但你知道它怎麼來的嗎？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, caption: "先認識三角形：這條橫的叫「底」，從底垂直往上量到頂點叫「高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底8 高5" }, duration: 3600 },
    { id: 3, caption: "如果拿兩個一模一樣的三角形，可以拼成一個平行四邊形！", action: "think", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "兩個三角形→平行四邊形" }, duration: 3800 },
    { id: 4, caption: "平行四邊形的面積是「底×高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高 = 8×5 = 40" }, duration: 3600 },
    { id: 5, caption: "三角形只是平行四邊形的一半，所以要再除以 2！", action: "jump", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "40÷2 = 20" }, duration: 3600 },
    { id: 6, caption: "所以三角形面積 = 底 × 高 ÷ 2。記住了嗎？", action: "cheer", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高÷2" }, duration: 3200 },
    { id: 7, caption: "口訣：底乘高、除以二。準備闖關算算看！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "t1", prompt: "三角形面積公式是？", options: ["底×高", "底×高÷2", "底＋高", "底×高×2"], answer: 1, explanation: "兩個三角形拼成平行四邊形（底×高），三角形是一半，所以是底×高÷2。" },
    { id: "t2", prompt: "底 6、高 4 的三角形，面積是多少？", options: ["24", "12", "10", "48"], answer: 1, explanation: "6×4÷2 = 24÷2 = 12。" },
    { id: "t3", prompt: "底 8、高 5 的三角形，面積是多少？", options: ["40", "13", "20", "80"], answer: 2, explanation: "8×5÷2 = 40÷2 = 20。" },
    { id: "t4", prompt: "底 10、高 7 的三角形，面積是多少？", options: ["70", "35", "17", "140"], answer: 1, explanation: "10×7÷2 = 70÷2 = 35。" },
    { id: "t5", prompt: "一個三角形面積是 24，底是 8，高是多少？", options: ["3", "6", "4", "12"], answer: 1, explanation: "面積 = 底×高÷2，所以高 = 24×2÷8 = 48÷8 = 6。" },
  ],
};

/** 目前上架的動畫課清單（多學科，驗證架構通用性）。 */
export const ONION_LESSONS: OnionLesson[] = [
  FRACTION_LESSON,
  CHINESE_DE_LESSON,
  WATER_CYCLE_LESSON,
  TRIANGLE_AREA_LESSON,
];

/** 依 id 取課；找不到時回傳第一課作為兜底。 */
export function getOnionLesson(id: string): OnionLesson {
  return ONION_LESSONS.find((l) => l.id === id) ?? FRACTION_LESSON;
}
