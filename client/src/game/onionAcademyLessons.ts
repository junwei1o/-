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
  /** 幾何形：三角形／長方形／圓形（面積公式推導）。 */
  | {
      kind: "shape";
      shape: "triangle" | "rect" | "circle";
      base: number;
      height: number;
      label?: string;
    }
  /** 長條圖：比較數量、統計圖表讀值。 */
  | { kind: "bars"; items: Array<{ label: string; value: number }>; unit?: string; active?: number }
  /** 流程箭頭：步驟順序（實驗流程、反應機構、歷史脈絡）。 */
  | { kind: "flow"; steps: string[]; active?: number }
  /** 數線：整數／小數／負數的位置與移動。 */
  | {
      kind: "numberLine";
      from: number;
      to: number;
      marks?: Array<{ at: number; label?: string; tone?: "ok" | "warn" }>;
      cursor?: number;
    }
  /** 天平：等式兩邊的平衡（方程式、化學反應式配平）。 */
  | { kind: "balance"; left: string; right: string; tip?: string };

/** 分鏡停下來問學生的小問題（洋蔥式「先猜再學」）。答錯不扣分，只給提示。 */
export type OnionAsk = {
  prompt: string;
  options: string[];
  answer: number;
  /** 答錯時的引導提示。 */
  hint: string;
};

/** 一幀分鏡。 */
export type OnionFrame = {
  id: number;
  /**
   * 這一步在做什麼（例：「步驟 2：把分母通分」）。
   * 洋蔥學園的影片會把解題拆成清楚的步驟；這一欄就是我們的步驟標籤，
   * 顯示在字幕上方，讓孩子知道「現在走到哪一步、這一步要幹嘛」。
   */
  step?: string;
  /** 字幕（同步顯示在舞臺下方）。 */
  caption: string;
  action: OnionAction;
  prop: OnionProp;
  /** 這一幀停留毫秒。 */
  duration: number;
  /** 有值時，播放到這一幀會停下來先問學生（答完或略過才繼續）。 */
  ask?: OnionAsk;
};

/** 闖關題目。 */
export type OnionQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  /** 答錯時的逐級提示（最多三級；不足時以 explanation 兜底）。 */
  hints?: string[];
};

/** 一份動畫課。 */
/**
 * 學段：國小／國中／高中。
 * 一堂課只屬於一個學段（跨學段的內容會拆成兩堂，各自的步驟與深度不同）。
 */
export type OnionStage = "國小" | "國中" | "高中";

export type OnionLesson = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade: string;
  /** 這堂課適用於哪些學段；用於選課頁分流。 */
  stages: OnionStage[];
  desc: string;
  /** 看完動畫後的重點整理（小結頁用）。 */
  takeaways?: string[];
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
  stages: ["國小"],
  desc: "洋蔥帶你用一塊披薩搞懂「分母相同」的分數加法，動畫拆解＋互動演示，看完立刻闖關。",
  takeaways: ["分母是「全部切成幾份」", "同分母相加：分母不變", "分子相加就是答案"],
  frames: [
    { step: "步驟 1：認識披薩題目", id: 1, caption: "嗨！今天我們用一塊披薩，搞懂分數加法。", action: "wave", prop: { kind: "none" }, duration: 2600 },
    { step: "步驟 2：把披薩切四份", id: 2, caption: "把披薩切成 4 等份，每一份就是 1/4。", action: "point", prop: { kind: "pie", a: 1, b: 4 }, duration: 3000 },
    { step: "步驟 3：吃掉一片是1/4", id: 3, caption: "你吃了 1 片，等於吃掉 1/4 塊披薩。", ask: { prompt: "披薩切成 4 等份，吃掉 1 片是多少？", options: ["1/4", "1/2", "4/1", "1/3"], answer: 0, hint: "全部 4 份中的 1 份，就是 1/4。" }, action: "think", prop: { kind: "pie", a: 1, b: 4, label: "1/4" }, duration: 3000 },
    { step: "步驟 4：朋友再拿兩片", id: 4, caption: "朋友又夾給你 2 片，等於再多了 2/4。", action: "walk", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 } }, duration: 3400 },
    { step: "步驟 5：分母同加分子", id: 5, caption: "分母一樣（都是 4），就把分子直接相加！", ask: { prompt: "1/4 ＋ 2/4，相加後分母應該是多少？", options: ["4", "8", "6", "2"], answer: 0, hint: "同分母相加，分母保持不變。" }, action: "point", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 }, result: { a: 3, b: 4 } }, duration: 3400 },
    { step: "步驟 6：算出1/4加2/4", id: 6, caption: "1 + 2 = 3，所以 1/4 ＋ 2/4 ＝ 3/4。", action: "jump", prop: { kind: "pie", a: 3, b: 4, label: "3/4" }, duration: 3200 },
    { step: "步驟 7：記住同分母口訣", id: 7, caption: "口訣：同分母相加，分母不變、分子相加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "f1", prompt: "1/4 ＋ 2/4 ＝ ？", options: ["3/8", "3/4", "2/4", "3/4 ÷ 4"], answer: 1, hints: ["分母是「全部幾份」，分子是「拿了幾份」", "分母相同時，分母不用相加"], explanation: "同分母相加：分母 4 不變，分子 1+2=3，答案是 3/4。" },
    { id: "f2", prompt: "2/5 ＋ 1/5 ＝ ？", options: ["3/10", "3/5", "2/5", "3/25"], answer: 1, hints: ["先看分母是不是一樣（都是 5）", "分子 2＋1＝3，分母仍是 5"], explanation: "分母 5 不變，分子 2+1=3，答案是 3/5。" },
    { id: "f3", prompt: "1/3 ＋ 1/3 ＝ ？", options: ["2/3", "2/6", "1/6", "2/9"], answer: 0, hints: ["1/3 加 1/3，全部切成 3 份", "分子 1＋1＝2"], explanation: "分母 3 不變，分子 1+1=2，答案是 2/3。" },
    { id: "f4", prompt: "3/8 ＋ 4/8 ＝ ？", options: ["7/8", "7/16", "12/8", "7/64"], answer: 0, hints: ["分母 8 不變，只要加分子", "3＋4＝7"], explanation: "分母 8 不變，分子 3+4=7，答案是 7/8。" },
    { id: "f5", prompt: "一條緞帶，姊姊用了 1/6，弟弟用了 3/6，兩人共用了幾分之幾？", options: ["4/6", "4/12", "3/6", "1/6"], answer: 0, hints: ["兩個人用的分母都是 6", "1＋3＝4，分母是 6"], explanation: "同分母：1/6 ＋ 3/6，分子 1+3=4，答案是 4/6。" },
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
  stages: ["國小"],
  desc: "三個讀音一樣的字，用法卻不同。洋蔥用字卡帶你記住：的接名詞、得接動詞後、地接動詞前。",
  takeaways: ["的 → 接名詞", "得 → 在動詞後", "地 → 在動詞前"],
  frames: [
    { step: "步驟 1：三個字讀音同", id: 1, caption: "嗨！這三個字讀起來都一樣，可是用法完全不同喔。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：認識「的」接名詞", id: 2, caption: "「的」放在名詞前面，用來修飾。像「紅的蘋果」。", action: "point", prop: { kind: "text", text: "紅的蘋果", sub: "形容詞＋的＋名詞", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：認識「得」接動詞後", id: 3, caption: "「得」放在動詞後面，補充說明程度。像「跑得快」。", ask: { prompt: "「跑__很快」，空格要填哪一個字？", options: ["的", "得", "地", "都不填"], answer: 1, hint: "動詞後面補充程度，用「得」。" }, action: "think", prop: { kind: "text", text: "跑得快", sub: "動詞＋得＋補語", tone: "ok" }, duration: 3400 },
    { step: "步驟 4：認識「地」接動詞前", id: 4, caption: "「地」放在動詞前面，修飾動作的方式。像「慢慢地走」。", action: "walk", prop: { kind: "text", text: "慢慢地走", sub: "副詞＋地＋動詞", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：背口訣分用法", id: 5, caption: "記口訣：的接名詞、得接動詞後、地接動詞前。", ask: { prompt: "「很漂亮__衣服」，後面接名詞，要用哪個？", options: ["的", "得", "地", "都可以"], answer: 0, hint: "後面是名詞「衣服」，用「的」。" }, action: "cheer", prop: { kind: "text", text: "的→名詞  得→動詞後  地→動詞前", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：小心名詞用「的」", id: 6, caption: "小心！「很漂亮的衣服」用的是「的」，因為後面接名詞「衣服」。", action: "point", prop: { kind: "text", text: "很漂亮的（的→對）衣服", sub: "後面是名詞，所以用的", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：準備闖關分三字", id: 7, caption: "口訣記好了嗎？準備闖關，看看你會不會分！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "d1", prompt: "他跑__很快。（填哪個？）", options: ["的", "得", "地", "都行"], answer: 1, hints: ["「跑」是動詞，空格在動詞後面", "動詞後補充程度用「得」"], explanation: "「跑」是動詞，後面補充程度用「得」，所以是「跑得快」。" },
    { id: "d2", prompt: "一__美麗的花園。", options: ["的", "得", "地", "都行"], answer: 0, hints: ["空格後面接的是「花園」，是名詞", "接名詞用「的」"], explanation: "後面接名詞「花園」，修飾名詞用「的」。" },
    { id: "d3", prompt: "輕輕__推開門。", options: ["的", "得", "地", "都行"], answer: 2, hints: ["「輕輕」在修飾動作「推開」", "動詞前面用「地」"], explanation: "「輕輕」修飾動詞「推開」，動詞前面用「地」。" },
    { id: "d4", prompt: "這碗飯真好吃__！啊，這裡不加的字。哪句正確？", options: ["好吃得很", "好吃得很呢", "好吃得不得了", "好吃得"], answer: 2, hints: ["「好吃」是形容詞，後面要補充到什麼程度", "形容詞／動詞後用「得」"], explanation: "動詞/形容詞「好吃」後接「得」再接補語，常見說法如「好吃得不得了」。" },
    { id: "d5", prompt: "下列哪一句的「的」用法正確？", options: ["他高興的跳起來", "美麗的花朵", "慢慢的走", "跑快得"], answer: 1, hints: ["檢查每一句：後面接名詞才用「的」", "「美麗的花朵」後面是名詞"], explanation: "「美麗的花朵」中「的」後接名詞「花朵」，用法正確。其他應為地/得。" },
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
  stages: ["國小"],
  desc: "水從來不會消失，只是不停旅行。洋蔥用循環圖帶你看懂蒸發、凝結、降水三個階段。",
  takeaways: ["蒸發：水變水蒸氣上升", "凝結：遇冷聚成雲", "降水→匯流，太陽是動力"],
  frames: [
    { step: "步驟 1：雨從哪裡來", id: 1, caption: "嗨！你有沒有想過，天上的雨從哪裡來？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：太陽加熱蒸發", id: 2, caption: "太陽把海和河裡的水加熱，水變成水蒸氣往上升——這叫「蒸發」。", action: "point", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 0 }, duration: 3600 },
    { step: "步驟 3：高空遇冷凝結", id: 3, caption: "水蒸氣到了高空，遇到冷就變回小水珠，聚成雲——這叫「凝結」。", ask: { prompt: "水蒸氣到高空遇冷變成雲，這個過程叫什麼？", options: ["蒸發", "凝結", "降水", "匯流"], answer: 1, hint: "氣體遇冷變回小水珠，就是凝結。" }, action: "think", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 1 }, duration: 3600 },
    { step: "步驟 4：水珠變重降水", id: 4, caption: "雲裡的水珠越聚越重，掉下來變成雨或雪——這叫「降水」。", action: "jump", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 2 }, duration: 3600 },
    { step: "步驟 5：流回河海匯流", id: 5, caption: "雨水流回河川和海洋，叫做「匯流」，然後又開始下一輪！", action: "walk", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 3 }, duration: 3600 },
    { step: "步驟 6：四階段不停循環", id: 6, caption: "四個階段不斷循環，水就這樣在天上地下旅行，永遠不會用完。", ask: { prompt: "推動水循環不停轉動的能量來自哪裡？", options: ["太陽", "月亮", "風", "地熱"], answer: 0, hint: "太陽提供熱能，讓水蒸發上升。" }, action: "cheer", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"] }, duration: 3400 },
    { step: "步驟 7：能量來自太陽", id: 7, caption: "記住：循環的能量來自太陽。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "w1", prompt: "水變成水蒸氣往上升，這個過程叫什麼？", options: ["凝結", "蒸發", "降水", "匯流"], answer: 1, hints: ["水受熱會變成水蒸氣往上升", "這個階段發生在循環一開始"], explanation: "水受熱變成水蒸氣上升，稱為蒸發。" },
    { id: "w2", prompt: "水蒸氣到高空遇冷變成雲，這叫什麼？", options: ["蒸發", "凝結", "降水", "融化"], answer: 1, hints: ["水蒸氣到高空遇冷會變回小水珠", "小水珠聚在一起就是雲"], explanation: "水蒸氣遇冷聚成小水珠成雲，稱為凝結。" },
    { id: "w3", prompt: "雲裡的水變重掉下來成雨，這叫什麼？", options: ["蒸發", "凝結", "降水", "昇華"], answer: 2, hints: ["雲裡的水珠變重就會掉下來", "掉下來的雨、雪都算這一階段"], explanation: "雲中水珠過重落下成雨雪，稱為降水。" },
    { id: "w4", prompt: "水循環最主要的能量來自哪裡？", options: ["月亮", "風", "太陽", "地熱"], answer: 2, hints: ["想想是誰提供熱能讓水蒸發", "沒有它，水就不會往天上跑"], explanation: "太陽提供熱能讓水蒸發，是水循環的動力來源。" },
    { id: "w5", prompt: "下列哪一項不是水循環的階段？", options: ["蒸發", "凝結", "燃燒", "降水"], answer: 2, hints: ["水循環四階段：蒸發、凝結、降水、匯流", "燃燒是化學變化，不是水循環"], explanation: "燃燒是化學反應，不屬於水循環。水循環為蒸發→凝結→降水→匯流。" },
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
  stages: ["國小"],
  desc: "三角形面積公式不是死記的！洋蔥帶你用「兩個三角形拼一拼」搞懂為什麼是底×高÷2。",
  takeaways: ["兩個全等三角形可拼成平行四邊形", "平行四邊形面積＝底×高", "三角形是一半，要再÷2"],
  frames: [
    { step: "步驟 1：三角形面積之謎", id: 1, caption: "嗨！三角形面積有個好記的公式，但你知道它怎麼來的嗎？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：認識底和高", id: 2, caption: "先認識三角形：這條橫的叫「底」，從底垂直往上量到頂點叫「高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底8 高5" }, duration: 3600 },
    { step: "步驟 3：兩個三角形拼平行四邊形", id: 3, caption: "如果拿兩個一模一樣的三角形，可以拼成一個平行四邊形！", ask: { prompt: "兩個一模一樣的三角形，可以拼成什麼形狀？", options: ["平行四邊形", "圓形", "梯形", "五角形"], answer: 0, hint: "底相同、高相同，拼起來是平行四邊形。" }, action: "think", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "兩個三角形→平行四邊形" }, duration: 3800 },
    { step: "步驟 4：平行四邊形底乘高", id: 4, caption: "平行四邊形的面積是「底×高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高 = 8×5 = 40" }, duration: 3600 },
    { step: "步驟 5：三角形要再除以二", id: 5, caption: "三角形只是平行四邊形的一半，所以要再除以 2！", ask: { prompt: "拼出的平行四邊形面積是 40，三角形是多少？", options: ["40", "20", "80", "10"], answer: 1, hint: "三角形剛好是平行四邊形的一半，40÷2。" }, action: "jump", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "40÷2 = 20" }, duration: 3600 },
    { step: "步驟 6：公式底乘高除二", id: 6, caption: "所以三角形面積 = 底 × 高 ÷ 2。記住了嗎？", action: "cheer", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高÷2" }, duration: 3200 },
    { step: "步驟 7：記底乘高除二口訣", id: 7, caption: "口訣：底乘高、除以二。準備闖關算算看！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "t1", prompt: "三角形面積公式是？", options: ["底×高", "底×高÷2", "底＋高", "底×高×2"], answer: 1, hints: ["兩個三角形可以拼成平行四邊形", "三角形是平行四邊形的一半"], explanation: "兩個三角形拼成平行四邊形（底×高），三角形是一半，所以是底×高÷2。" },
    { id: "t2", prompt: "底 6、高 4 的三角形，面積是多少？", options: ["24", "12", "10", "48"], answer: 1, hints: ["先算底×高，再除以 2", "6×4＝24，24÷2＝？"], explanation: "6×4÷2 = 24÷2 = 12。" },
    { id: "t3", prompt: "底 8、高 5 的三角形，面積是多少？", options: ["40", "13", "20", "80"], answer: 2, hints: ["8×5＝40，別忘了除以 2", "40÷2＝20"], explanation: "8×5÷2 = 40÷2 = 20。" },
    { id: "t4", prompt: "底 10、高 7 的三角形，面積是多少？", options: ["70", "35", "17", "140"], answer: 1, hints: ["10×7＝70，再除以 2", "70÷2＝35"], explanation: "10×7÷2 = 70÷2 = 35。" },
    { id: "t5", prompt: "一個三角形面積是 24，底是 8，高是多少？", options: ["3", "6", "4", "12"], answer: 1, hints: ["面積＝底×高÷2，反過來高＝面積×2÷底", "24×2＝48，48÷8＝？"], explanation: "面積 = 底×高÷2，所以高 = 24×2÷8 = 48÷8 = 6。" },
  ],
};

/* ========================================================================
 * 課程 5：自然 — 光合作用：葉子裡的綠色工廠
 * 水從根上送、二氧化碳從氣孔進、葉綠體接收陽光合成養分、排出氧氣。
 * 用「參觀工廠」的順序逐站細講，10 幀把原料→機器→產品拆到最細。
 * ======================================================================== */
export const PHOTOSYNTHESIS_LESSON: OnionLesson = {
  id: "photosynthesis",
  title: "光合作用：葉子裡的綠色工廠",
  subject: "自然",
  topic: "光合作用",
  grade: "五上",
  stages: ["國小"],
  desc: "植物不會吃飯，怎麼長大？洋蔥帶你走進葉子的綠色工廠，看陽光、水、二氧化碳怎麼變成養分和氧氣。",
  takeaways: ["原料＝水＋二氧化碳，能量＝陽光", "場所在葉綠體", "產物＝養分（葡萄糖）＋氧氣"],
  frames: [
    { step: "步驟 1：葉子像綠色工廠", id: 1, caption: "嗨！植物的葉子其實是一座精密的工廠，今天帶你進去參觀！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：工廠需要三原料", id: 2, caption: "這座工廠需要三樣原料：陽光、水、二氧化碳。先來看水從哪裡來。", action: "point", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 3：根吸水送葉子", id: 3, caption: "水由根部吸收，沿著莖裡的細管子，一路往上送到葉子。", action: "walk", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 4：二氧化碳從氣孔進", id: 4, caption: "第二樣原料——二氧化碳，從葉背的小孔「氣孔」溜進來。", ask: { prompt: "二氧化碳是從葉子的哪裡進來的？", options: ["氣孔", "葉尖", "根", "花瓣"], answer: 0, hint: "葉背的小孔叫氣孔，氣體從這裡進出。" }, action: "point", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 5：葉綠體是機器房", id: 5, caption: "葉肉裡有好多綠色小顆粒——葉綠體，它就是工廠的機器房，也是葉子是綠色的原因。", action: "think", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 6：陽光合成養分", id: 6, caption: "陽光照進葉綠體，機器開動！把水和二氧化碳「合成」成養分。", action: "jump", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 7：養分送到全身", id: 7, caption: "合成出來的養分（葡萄糖）送到根、莖、全身，讓植物長高長大。", ask: { prompt: "光合作用做完後，排出來的是哪一種氣體？", options: ["氧氣", "二氧化碳", "氮氣", "水蒸氣"], answer: 0, hint: "副產品是氧氣，正好給我們呼吸。" }, action: "point", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 8：排出副產氧氣", id: 8, caption: "同時，工廠排出副產品——氧氣！從氣孔釋放出去，正好給我們呼吸。", action: "cheer", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 9：記光合作用公式", id: 9, caption: "公式記起來：二氧化碳＋水 →（陽光・葉綠體）養分＋氧氣。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 10：口訣根送水吐氧", id: 10, caption: "口訣：根送水、孔進氣、葉綠體曬太陽，變養分、吐氧氣。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "p1", prompt: "光合作用主要在葉片的哪個構造進行？", options: ["氣孔", "葉綠體", "細胞壁", "葉脈"], answer: 1, hints: ["葉子裡綠色的小顆粒是什麼", "它負責接收陽光、進行光合作用"], explanation: "葉綠體是光合作用的機器房，能吸收陽光把原料合成養分。" },
    { id: "p2", prompt: "植物主要靠哪個部位吸收水分，往上送給葉子？", options: ["葉", "花", "根", "果實"], answer: 2, hints: ["水從植物哪個部位被吸收", "根吸收後沿著莖往上送"], explanation: "根部吸收水分，沿著莖往上送到葉子，是光合作用的原料之一。" },
    { id: "p3", prompt: "空氣中的二氧化碳從葉片的哪裡進入？", options: ["氣孔", "葉尖", "樹皮", "芽"], answer: 0, hints: ["葉背有小孔可以讓氣體進出", "那個小孔叫做什麼"], explanation: "葉背的氣孔是二氧化碳進入、氧氣排出的通道。" },
    { id: "p4", prompt: "光合作用的能量來源是什麼？", options: ["土壤", "風", "陽光", "肥料"], answer: 2, hints: ["光合作用的能量來源", "沒有它就無法合成養分"], explanation: "陽光提供能量，讓葉綠體能把水和二氧化碳合成養分。" },
    { id: "p5", prompt: "光合作用排出、剛好供人類呼吸的氣體是？", options: ["二氧化碳", "氮氣", "氫氣", "氧氣"], answer: 3, hints: ["光合作用排出的氣體剛好是我們呼吸要用的", "不是二氧化碳，是另一種"], explanation: "光合作用把二氧化碳轉成養分，同時釋放氧氣，剛好是動物需要的。" },
  ],
};

/* ========================================================================
 * 課程 6：數學 — 負數與數線：零下的世界
 * 從「零下 3 度」引入，數線三要素、左右移動、大小比較、相反數，10 幀細講。
 * ======================================================================== */
export const NEGATIVE_NUMBER_LESSON: OnionLesson = {
  id: "negative-number",
  title: "負數與數線：零下的世界",
  subject: "數學",
  topic: "負數與數線",
  grade: "七上",
  stages: ["國中"],
  desc: "「零下 3 度」是什麼意思？洋蔥開著小船在數線上航向零下的世界，負數的大小一次搞懂。",
  takeaways: ["數線右邊較大、左邊較小", "負數離 0 越遠越小", "到 0 距離相同的是相反數"],
  frames: [
    { step: "步驟 1：零下3度是什麼", id: 1, caption: "嗨！天氣預報說「明天零下 3 度」，零下到底是什麼意思呢？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：比0小用負號", id: 2, caption: "比 0 小的數，就用「−」號表示：零下 3 度寫成 −3，念作「負三」。", action: "point", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 3：排成數線", id: 3, caption: "把所有數排成一條線：中間是 0，右邊是正數，左邊是負數——這就是「數線」。", action: "walk", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 4：數線三要素", id: 4, caption: "數線三要素：原點（0 的位置）、正方向（通常朝右）、單位長度（每一格一樣大）。", action: "point", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 5：往左開到負4", id: 5, caption: "小船從 0 出發，往左（負方向）開 4 格，就到 −4 的位置。", ask: { prompt: "從 0 往左（負方向）走 4 格，會到哪個數？", options: ["−4", "4", "0", "−1"], answer: 0, hint: "數線左邊是負的方向。" }, action: "walk", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 6：往右加回數線", id: 6, caption: "再從 −4 往右開 6 格：−4 ＋ 6 ＝ 2，停在 2。左加右減，在數線上一目了然！", action: "walk", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 7：右大左小比大小", id: 7, caption: "在數線上，越右邊的數越大：−4 ＜ −1 ＜ 0 ＜ 2。", ask: { prompt: "−2 和 −6，哪一個比較大？", options: ["−2", "−6", "一樣大", "不能比較"], answer: 0, hint: "數線越右邊越大，−2 在 −6 右邊。" }, action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 8：負數離零越遠越小", id: 8, caption: "兩個負數怎麼比？記住：離 0 越遠的負數反而越小，所以 −5 ＜ −2。", action: "think", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 9：距零相同是相反數", id: 9, caption: "−3 和 3 到 0 的距離一樣遠（都是 3 格），它們互為「相反數」。", action: "jump", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 10：口訣右大左小", id: 10, caption: "口訣：右大左小，負數離零越遠越小。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "n1", prompt: "「零下 5 度」用負數怎麼表示？", options: ["−5", "5−", "+5", "0.5"], answer: 0, hints: ["比 0 小要用負號表示", "零下 5 度就是比 0 度再低 5 度"], explanation: "比 0 小 5 度，用負號寫成 −5。" },
    { id: "n2", prompt: "數線上 −2 和 −6 哪一個比較大？", options: ["−6", "−2", "一樣大", "無法比較"], answer: 1, hints: ["數線越右邊越大", "−2 在 −6 的右邊"], explanation: "越右邊越大：−2 在 −6 的右邊，所以 −2 ＞ −6。" },
    { id: "n3", prompt: "從 −3 往右走 5 格，會停在數線上的哪個數？", options: ["−8", "−2", "2", "8"], answer: 2, hints: ["往右是加法", "−3 ＋ 5 等於多少"], explanation: "−3 ＋ 5 ＝ 2，往右是加法，停在 2。" },
    { id: "n4", prompt: "3 的相反數是多少？", options: ["1/3", "0", "−3", "6"], answer: 2, hints: ["相反數到 0 的距離一樣，方向相反", "3 的相反數是負的 3"], explanation: "到 0 距離一樣、方向相反的數互為相反數，3 的相反數是 −3。" },
    { id: "n5", prompt: "下列哪一個數最小？", options: ["−8", "−1", "0", "1"], answer: 0, hints: ["負數離 0 越遠，數值越小", "−8 離 0 最遠"], explanation: "負數離 0 越遠越小，−8 離 0 最遠，所以最小。" },
  ],
};

/* ========================================================================
 * 課程 7：數學 — 一元一次方程式：天平上的 x
 * 用天平平衡講等式，兩邊同減 → x=5 → 移項變號規則，10 幀細講。
 * ======================================================================== */
export const LINEAR_EQUATION_LESSON: OnionLesson = {
  id: "linear-equation",
  title: "一元一次方程式：天平上的 x",
  subject: "數學",
  topic: "一元一次方程式",
  grade: "七上",
  stages: ["國中"],
  desc: "方程式就是一座天平！洋蔥用砝碼讓你親眼看著 x＋3＝8 怎麼一步步解開，移項變號不再是死背。",
  takeaways: ["方程式像天平，兩邊要同時加減", "目標是讓 x 一個人留下來", "移項一定要變號"],
  frames: [
    { step: "步驟 1：天平上的神祕箱", id: 1, caption: "嗨！這裡有一座天平：左邊是一個神秘箱子和 3 個砝碼，右邊是 8 個砝碼，剛好平衡。", action: "wave", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 2：平衡寫成等式", id: 2, caption: "平衡就代表「左邊 ＝ 右邊」。箱子重 x，寫成式子就是：x ＋ 3 ＝ 8。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 3：目標留住x", id: 3, caption: "解方程式的目標：想辦法讓 x 一個人留在左邊，就知道它等於多少。", action: "think", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 4：兩邊同減3", id: 4, caption: "第一步：從兩邊同時拿走 3 個砝碼。天平兩邊一起減，還是平衡的！", ask: { prompt: "x ＋ 3 ＝ 8，兩邊同時拿走 3，右邊還剩幾個砝碼？", options: ["5", "3", "8", "11"], answer: 0, hint: "8 − 3 ＝ 5，天平兩邊一起拿才會平衡。" }, action: "jump", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 5：解出x等於5", id: 5, caption: "左邊只剩 x，右邊剩 5 個砝碼，所以 x ＝ 5。解開了！", action: "cheer", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 6：代回檢验算對", id: 6, caption: "檢驗一下：把 5 代回去，5 ＋ 3 ＝ 8，右邊也是 8，答對！", action: "point", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 7：移項要變號", id: 7, caption: "剛剛「兩邊同減 3」，寫快一點就是：把 ＋3 從左邊搬到右邊，要變號成 −3。這叫「移項」。", ask: { prompt: "把「＋3」從左邊移到右邊，會變成什麼？", options: ["−3", "＋3", "×3", "÷3"], answer: 0, hint: "移項要變號：加變減。" }, action: "walk", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 8：記移項變號口訣", id: 8, caption: "口訣：移項要變號——加變減、減變加，乘變除、除變乘。", action: "cheer", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 9：再試x減2等6", id: 9, caption: "再試一題：x − 2 ＝ 6。把 −2 移到右邊變 ＋2，得到 x ＝ 8。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 10：總整理天平法", id: 10, caption: "總整理：天平兩邊同進退，移項記得要變號。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "e1", prompt: "x ＋ 3 ＝ 8，x ＝ ？", options: ["3", "5", "11", "24"], answer: 1, hints: ["兩邊同時拿走 3 個砝碼", "8 − 3 ＝ 5"], explanation: "兩邊同減 3（＋3 移到右邊變 −3）：x ＝ 8 − 3 ＝ 5。" },
    { id: "e2", prompt: "x − 2 ＝ 6，x ＝ ？", options: ["4", "8", "12", "3"], answer: 1, hints: ["−2 移到右邊要變號成 ＋2", "6 ＋ 2 ＝ 8"], explanation: "−2 移到右邊變 ＋2：x ＝ 6 ＋ 2 ＝ 8。" },
    { id: "e3", prompt: "解 x ＋ 5 ＝ 12 時，把 ＋5 移項到右邊會變成？", options: ["＋5", "−5", "×5", "不變"], answer: 1, hints: ["移項要變號：加變減", "＋5 過去會變成 −5"], explanation: "移項要變號：＋5 過去變 −5，所以 x ＝ 12 − 5 ＝ 7。" },
    { id: "e4", prompt: "4x ＝ 12，x ＝ ？", options: ["8", "16", "3", "48"], answer: 2, hints: ["4x 表示 4 乘 x，要用除法還原", "兩邊同除以 4"], explanation: "兩邊同除以 4：x ＝ 12 ÷ 4 ＝ 3。" },
    { id: "e5", prompt: "x ＝ 3 是下列哪一個方程式的解？", options: ["x ＋ 1 ＝ 3", "2x ＋ 1 ＝ 7", "x − 3 ＝ 1", "3x ＝ 12"], answer: 1, hints: ["把 x＝3 代進去算算看", "2×3＋1 ＝ 7，成立"], explanation: "把 3 代入 2x＋1＝7：2×3＋1 ＝ 7，成立！其他式子代入都不成立。" },
  ],
};

/* ========================================================================
 * 課程 8：自然 — 洋蔥表皮細胞：顯微鏡下的大世界
 * 洋蔥介紹洋蔥細胞（彩蛋）：顯微鏡視野逐層標示細胞壁/膜/核/液泡，10 幀細講。
 * ======================================================================== */
export const ONION_CELL_LESSON: OnionLesson = {
  id: "onion-cell",
  title: "洋蔥表皮細胞：顯微鏡下的大世界",
  subject: "自然",
  topic: "細胞構造",
  grade: "七上",
  stages: ["國中"],
  desc: "由洋蔥親自介紹洋蔥表皮細胞！顯微鏡視野一格一格，細胞壁、細胞膜、細胞核、液泡一次認齊。",
  takeaways: ["細胞是生物體最小單位", "壁保護、膜進出、核指揮、泡儲水", "植物才有細胞壁與葉綠體"],
  frames: [
    { step: "步驟 1：洋蔥介紹細胞", id: 1, caption: "嗨！今天由我親自介紹我的好朋友——洋蔥表皮細胞，因為我自己就是細胞組成的！", action: "wave", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 2：細胞是最小單位", id: 2, caption: "細胞是生物體最小的基本單位，一隻動物、一棵植物，都是由細胞組成的。", action: "point", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 3：撕表皮看格子", id: 3, caption: "把洋蔥表皮薄薄撕下一層，放到顯微鏡下——哇，一格一格像紅磚牆！每一格就是一個細胞。", action: "jump", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 4：細胞壁像牆壁", id: 4, caption: "最外面硬硬的框是「細胞壁」，像牆壁一樣保護細胞、維持方方的外形。植物才有喔！", action: "point", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 5：細胞膜管進出", id: 5, caption: "細胞壁內側還有一層薄薄的「細胞膜」，像大門的守衛，控制哪些東西可以進出。", ask: { prompt: "控制物質進出細胞的「守衛」是哪一個構造？", options: ["細胞膜", "細胞壁", "細胞核", "液泡"], answer: 0, hint: "細胞壁是外牆，真正管進出的是裡面的膜。" }, action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 6：細胞核是指揮", id: 6, caption: "裡面那顆深色圓球是「細胞核」，細胞的指揮中心，藏著遺傳物質 DNA。", action: "think", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 7：液泡儲水倉庫", id: 7, caption: "中間大大的泡泡是「液泡」，細胞的倉庫，儲存水分和養分——切洋蔥讓你流淚的就是它！", action: "jump", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 8：植物才有細胞壁", id: 8, caption: "植物細胞有細胞壁和葉綠體，動物細胞沒有——這是兩者最大的差別。", ask: { prompt: "動物細胞沒有的構造是哪一個？", options: ["細胞壁", "細胞膜", "細胞核", "細胞質"], answer: 0, hint: "細胞壁（和葉綠體）只有植物細胞才有。" }, action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 9：細胞組成個體", id: 9, caption: "由小到大：細胞 → 組織 → 器官 → 器官系統 → 個體，層層組合成一個生命。", action: "walk", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 10：口訣牆門核泡", id: 10, caption: "口訣：牆保護、門進出、核指揮、泡儲水。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "c1", prompt: "生物體結構與功能的最小基本單位是什麼？", options: ["組織", "器官", "細胞", "系統"], answer: 2, hints: ["生物體最小的單位是什麼", "組織、器官都由它組成"], explanation: "所有生物都由細胞組成，細胞是最小的基本單位。" },
    { id: "c2", prompt: "保護細胞、維持植物細胞方形外觀的構造是？", options: ["細胞膜", "細胞壁", "液泡", "細胞核"], answer: 1, hints: ["植物細胞最外層、硬硬的那個構造", "它像牆壁一樣維持形狀"], explanation: "細胞壁在最外層，像牆壁一樣保護並撐起植物細胞的形狀。" },
    { id: "c3", prompt: "控制物質進出細胞的「守衛」是哪一個構造？", options: ["細胞壁", "細胞膜", "液泡", "葉綠體"], answer: 1, hints: ["像大門守衛、管制進出的構造", "不是最外層的牆，是裡面的膜"], explanation: "細胞膜像大門守衛，允許需要的物質進、不需要的擋住。" },
    { id: "c4", prompt: "含有遺傳物質、堪稱細胞指揮中心的是？", options: ["細胞核", "液泡", "細胞質", "細胞壁"], answer: 0, hints: ["藏著遺傳物質、指揮細胞的地方", "深色的圓球"], explanation: "細胞核內有 DNA，負責指揮細胞的活動與遺傳。" },
    { id: "c5", prompt: "動物細胞沒有、植物細胞才有的構造是？", options: ["細胞核和細胞膜", "細胞壁和葉綠體", "細胞質和液泡", "細胞膜和細胞質"], answer: 1, hints: ["植物才有、動物沒有的構造", "細胞壁和葉綠體"], explanation: "細胞壁與葉綠體是植物細胞特有的構造，動物細胞沒有。" },
  ],
};

/* ===================== 課程 9：八年級數學 — 畢氏定理（兩杯水倒進大杯子） ===================== */
export const PYTHAGOREAN_LESSON: OnionLesson = {
  id: "pythagorean",
  title: "畢氏定理：兩杯水倒進大杯子",
  subject: "數學",
  topic: "畢氏定理",
  grade: "八下",
  stages: ["國中"],
  desc: "直角三角形三邊各蓋一個正方形，兩個小杯子的水倒進大杯子剛好滿——這就是畢氏定理。",
  takeaways: ["斜邊是直角對面的最長邊", "兩股的平方和 ＝ 斜邊的平方", "a² ＋ b² ＝ c²，c 一定是斜邊"],
  frames: [
    { step: "步驟 1：認識斜邊最長", id: 1, caption: "嗨！看到這個直角三角形了嗎？直角對面的那一條，叫做「斜邊」，它是最長的邊。", action: "wave", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 2：兩股長3和4", id: 2, caption: "另外兩條夾著直角的邊叫「股」。這兩股分別長 3 和 4，斜邊長 5。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 3：三邊蓋正方形", id: 3, caption: "現在在三條邊上各蓋一個正方形，像三個方形的杯子。", action: "jump", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 4：小杯9中杯16大杯25", id: 4, caption: "小杯子裝 3×3＝9、中杯子裝 4×4＝16，大杯子可以裝 5×5＝25。", ask: { prompt: "兩個小杯子的水加起來是多少？（3×3 ＋ 4×4）", options: ["25", "49", "7", "24"], answer: 0, hint: "9 ＋ 16 ＝ 25，剛好等於大杯子 5×5。" }, action: "point", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 5：兩小杯倒出來", id: 5, caption: "把兩個小杯子裡的水全部倒出來……", action: "walk", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 6：倒進大杯剛滿", id: 6, caption: "倒進斜邊上的大杯子——剛好裝滿！不多也不少，這就是畢氏定理。", action: "cheer", prop: { kind: "none" }, duration: 3800 },
    { step: "步驟 7：換6和8算斜邊", id: 7, caption: "換一組試試：兩股是 6 和 8，6²＋8²＝36＋64＝100，所以斜邊是 √100＝10。", ask: { prompt: "兩股是 6 和 8 的直角三角形，斜邊是多少？", options: ["10", "14", "12", "100"], answer: 0, hint: "36 ＋ 64 ＝ 100，√100 ＝ 10。" }, action: "think", prop: { kind: "none" }, duration: 4200 },
    { step: "步驟 8：公式a平方加b平方等c平方", id: 8, caption: "寫成公式：a² ＋ b² ＝ c²。記住，c 永遠是斜邊，不能放錯位置。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 9：已知斜邊求一股", id: 9, caption: "已知斜邊求一股也可以：c² − a² ＝ b²。13² − 5² ＝ 169 − 25 ＝ 144，另一股就是 12。", action: "think", prop: { kind: "none" }, duration: 4200 },
    { step: "步驟 10：口訣斜邊平方", id: 10, caption: "口訣：斜邊平方 ＝ 兩股平方和。看到直角，就想到 a² ＋ b² ＝ c²！", action: "cheer", prop: { kind: "none" }, duration: 3600 },
  ],
  questions: [
    { id: "py1", prompt: "直角三角形兩股長 3 和 4，斜邊長是多少？", options: ["5", "6", "7", "25"], answer: 0, hints: ["斜邊平方 ＝ 兩股平方和", "9 ＋ 16 ＝ 25，√25 ＝ 5"], explanation: "3²＋4²＝9＋16＝25，斜邊 ＝ √25 ＝ 5。" },
    { id: "py2", prompt: "兩股長 6 和 8 的直角三角形，斜邊是多少？", options: ["10", "14", "48", "100"], answer: 0, hints: ["先算兩股的平方再相加", "36 ＋ 64 ＝ 100，√100 ＝ 10"], explanation: "6²＋8²＝36＋64＝100，斜邊 ＝ √100 ＝ 10。" },
    { id: "py3", prompt: "斜邊 13、其中一股 5，另一股是多少？", options: ["12", "8", "18", "144"], answer: 0, hints: ["這次要反過來用減法", "13² − 5² ＝ 169 − 25 ＝ 144"], explanation: "13²−5²＝169−25＝144，另一股 ＝ √144 ＝ 12。" },
    { id: "py4", prompt: "畢氏定理只能用在什麼樣的三角形？", options: ["直角三角形", "任意三角形", "等腰三角形", "銳角三角形"], answer: 0, hints: ["注意公式裡出現的是哪一條邊", "要有「斜邊」才有畢氏定理"], explanation: "畢氏定理只適用於直角三角形，因為只有直角三角形才有斜邊。" },
    { id: "py5", prompt: "長 5 公尺的梯子斜靠在牆上，梯腳離牆 3 公尺，梯子頂端離地多高？", options: ["4 公尺", "3 公尺", "5 公尺", "8 公尺"], answer: 0, hints: ["牆、地面、梯子剛好組成一個直角三角形", "5² − 3² ＝ 25 − 9 ＝ 16"], explanation: "梯子 5 是斜邊、離牆 3 是一股：5²−3²＝16，高度 ＝ √16 ＝ 4 公尺。" },
  ],
};

/* ===================== 課程 10：九年級數學 — 二次函數（會轉彎的拋物線） ===================== */
export const QUADRATIC_LESSON: OnionLesson = {
  id: "quadratic",
  title: "二次函數：會轉彎的拋物線",
  subject: "數學",
  topic: "二次函數",
  grade: "九上",
  stages: ["國中"],
  desc: "一次函數畫出來是直線，二次函數畫出來會轉彎——洋蔥帶你認識拋物線的開口、頂點與平移。",
  takeaways: ["y ＝ ax² 的圖形是拋物線", "a ＞ 0 開口向上，a ＜ 0 開口向下", "加減常數上下移，括號裡加減左右移"],
  frames: [
    { step: "步驟 1：一次函數是直線", id: 1, caption: "嗨！你學過的一次函數 y ＝ 2x，畫出來是一條直直的線。", action: "wave", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 2：x平方會轉彎", id: 2, caption: "但 y ＝ x² 不一樣：x 自己乘以自己，畫出來的線會轉彎。先畫好座標平面。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 3：先描點畫圖", id: 3, caption: "先描點：x＝−2 時 y＝4；x＝−1 時 y＝1；x＝0 時 y＝0。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 4：左右對稱y軸", id: 4, caption: "右邊對稱：x＝1 時 y＝1；x＝2 時 y＝4。左右兩邊一模一樣。", ask: { prompt: "y ＝ x² 的圖形，會以哪一條直線為對稱軸？", options: ["y 軸（x ＝ 0）", "x 軸（y ＝ 0）", "y ＝ x", "沒有對稱軸"], answer: 0, hint: "左右兩邊的點高度完全相同，鏡子在中間。" }, action: "point", prop: { kind: "none" }, duration: 4000 },
    { step: "步驟 5：連成拋物線", id: 5, caption: "把點連成一條平滑的曲線，這個形狀叫做「拋物線」。", action: "jump", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 6：頂點在最低點", id: 6, caption: "曲線的最低點叫「頂點」。y ＝ x² 的頂點在 (0, 0)，開口朝上。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 7：負號開口朝下", id: 7, caption: "如果 x² 前面是負號，例如 y ＝ −x²，整個圖形翻過來，開口朝下，頂點變成最高點。", action: "jump", prop: { kind: "none" }, duration: 4000 },
    { step: "步驟 8：加常數上下移", id: 8, caption: "加一個常數就上下移動：y ＝ x² ＋ 3 是整條曲線往上平移 3 格。", ask: { prompt: "y ＝ x² ＋ 3 的圖形，頂點會移到哪裡？", options: ["(0, 3)", "(3, 0)", "(0, −3)", "(−3, 0)"], answer: 0, hint: "加常數是上下移動，動的是 y 座標。" }, action: "walk", prop: { kind: "none" }, duration: 4000 },
    { step: "步驟 9：括號裡左右移", id: 9, caption: "寫在括號裡就左右移動：y ＝ (x − 2)² 是往右平移 2 格，頂點在 (2, 0)。", action: "walk", prop: { kind: "none" }, duration: 4000 },
    { step: "步驟 10：口訣a正開口上", id: 10, caption: "口訣：a 正開口上、a 負開口下；加減在外面上下移，加減在括號裡左右移（方向相反）。", action: "cheer", prop: { kind: "none" }, duration: 4600 },
  ],
  questions: [
    { id: "qd1", prompt: "y ＝ x² − 4 的圖形與 x 軸的交點，x 坐標是多少？", options: ["x ＝ 2 和 −2", "x ＝ 4 和 −4", "只有 x ＝ 0", "沒有交點"], answer: 0, hints: ["與 x 軸相交時 y ＝ 0", "x² − 4 ＝ 0，x ＝ ±2"], explanation: "令 y ＝ 0：x²−4＝0 → x² ＝ 4 → x ＝ ±2，所以交點是 x ＝ 2 與 −2。" },
    { id: "qd2", prompt: "y ＝ x² 的頂點座標是什麼？", options: ["(0, 0)", "(1, 1)", "(0, 1)", "(1, 0)"], answer: 0, hints: ["頂點是曲線的最低點", "x ＝ 0 時 y 最小"], explanation: "y ＝ x² 的最小值在 x ＝ 0，此時 y ＝ 0，頂點是 (0, 0)。" },
    { id: "qd3", prompt: "y ＝ −x² 的圖形開口朝向哪裡？", options: ["向下", "向上", "向左", "向右"], answer: 0, hints: ["看 x² 前面的係數是正還是負", "係數為負，頂點變成最高點"], explanation: "x² 的係數為負，圖形開口向下，頂點 (0, 0) 是最高點。" },
    { id: "qd4", prompt: "y ＝ (x − 3)² 的對稱軸是哪一條直線？", options: ["x ＝ 3", "x ＝ −3", "y ＝ 3", "x ＝ 0"], answer: 0, hints: ["括號裡的加減控制左右平移", "(x − 3) 表示往右移 3"], explanation: "y ＝ (x−3)² 是 y ＝ x² 往右平移 3 格，對稱軸是 x ＝ 3。" },
    { id: "qd5", prompt: "y ＝ x² ＋ 2 的最小值是多少？", options: ["2", "0", "−2", "沒有最小值"], answer: 0, hints: ["開口向上時頂點就是最小值", "頂點移到 (0, 2)"], explanation: "y ＝ x² ＋ 2 的頂點在 (0, 2)，開口向上，所以最小值是 2。" },
  ],
};

/* ========================================================================
 * 課程 11：數學（國小）— 長度單位換算
 * 大單位換小單位用乘、小換大用除；先用長條圖建立量感，再給換算流程。
 * ======================================================================== */
export const UNIT_CONVERSION_LESSON: OnionLesson = {
  id: "unit-conversion",
  title: "長度單位換算：公里、公尺、公分",
  subject: "數學",
  topic: "長度單位換算",
  grade: "三下",
  stages: ["國小"],
  desc: "1 公里到底有多長？洋蔥用長條圖讓你「看見」單位的大小，再記住大換小用乘、小換大用除。",
  takeaways: ["1 公尺 = 100 公分", "1 公里 = 1000 公尺", "大單位→小單位用乘；小單位→大單位用除"],
  frames: [
    { step: "步驟 1：公分公尺公里比", id: 1, caption: "嗨！公分、公尺、公里常常搞混嗎？今天把它們排在一起比比看。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：認識1公分", id: 2, caption: "先看最小的公分：手指寬度大約 1 公分；10 公分大約是一個手掌寬，量鉛筆、橡皮擦都用它。", action: "point", prop: { kind: "bars", items: [{ label: "1公分", value: 1 }, { label: "10公分", value: 10 }], unit: "公分" }, duration: 3200 },
    { step: "步驟 3：100公分是1公尺", id: 3, caption: "100 個 1 公分接起來，就是 1 公尺——大概是一張書桌的高度。", ask: { prompt: "1 公尺等於幾公分？", options: ["10 公分", "100 公分", "1000 公分", "10000 公分"], answer: 1, hint: "「公尺」的「厘」就是百分之一，1 公尺 = 100 公分。" }, action: "jump", prop: { kind: "bars", items: [{ label: "1公分", value: 1 }, { label: "1公尺", value: 100 }], unit: "公分", active: 1 }, duration: 3600 },
    { step: "步驟 4：1000公尺是1公里", id: 4, caption: "再上去是公里：1000 個 1 公尺接起來才是 1 公里，走路大概要 15 分鐘。", ask: { prompt: "1 公里等於幾公尺？", options: ["100 公尺", "10 公尺", "1000 公尺", "10000 公尺"], answer: 2, hint: "「公里」的「千」就是一千，1 公里 = 1000 公尺。" }, action: "walk", prop: { kind: "bars", items: [{ label: "1公尺", value: 1 }, { label: "1公里", value: 1000 }], unit: "公尺", active: 1 }, duration: 3600 },
    { step: "步驟 5：大換小用乘法", id: 5, caption: "記住這條樓梯：公里 →（×1000）→ 公尺 →（×100）→ 公分。往下走就乘以進率。", action: "point", prop: { kind: "flow", steps: ["公里", "×1000", "公尺", "×100", "公分"], active: 2 }, duration: 3600 },
    { step: "步驟 6：小換大用除法", id: 6, caption: "反過來往上走，就要「除以」進率：公分 ÷100 變公尺、公尺 ÷1000 變公里。", action: "think", prop: { kind: "flow", steps: ["公分", "÷100", "公尺", "÷1000", "公里"], active: 1 }, duration: 3600 },
    { step: "步驟 7：記大乘小除口訣", id: 7, caption: "口訣：大換小、用乘法；小換大、用除法。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "u1", prompt: "3 公尺等於幾公分？", options: ["30 公分", "300 公分", "3000 公分", "3 公分"], answer: 1, hints: ["1 公尺 = 100 公分", "3 × 100 = ?"], explanation: "1 公尺 = 100 公分，大換小用乘法：3 × 100 = 300 公分。" },
    { id: "u2", prompt: "500 公分等於幾公尺？", options: ["5 公尺", "50 公尺", "5000 公尺", "0.5 公尺"], answer: 0, hints: ["小單位換大單位要用除法", "500 ÷ 100 = ?"], explanation: "小換大用除法：500 ÷ 100 = 5 公尺。" },
    { id: "u3", prompt: "2 公里等於幾公尺？", options: ["200 公尺", "2000 公尺", "20000 公尺", "20 公尺"], answer: 1, hints: ["1 公里 = 1000 公尺", "2 × 1000 = ?"], explanation: "1 公里 = 1000 公尺，2 × 1000 = 2000 公尺。" },
    { id: "u4", prompt: "4000 公尺等於幾公里？", options: ["40 公里", "400 公里", "4 公里", "0.4 公里"], answer: 2, hints: ["公尺換公里要除以 1000", "4000 ÷ 1000 = ?"], explanation: "4000 ÷ 1000 = 4，所以是 4 公里。" },
    { id: "u5", prompt: "教室長 8 公尺、寬 50 公分，下面哪個長度最長？", options: ["8 公尺", "50 公分", "一樣長", "無法比較"], answer: 0, hints: ["先把單位換成一樣再比", "50 公分只有 0.5 公尺"], explanation: "50 公分 = 0.5 公尺，比 8 公尺短很多，所以 8 公尺最長。" },
  ],
};

/* ========================================================================
 * 課程 12：數學（國小）— 因數與倍數
 * 用「能不能整除」判斷，再用長條圖看倍數跳躍。
 * ======================================================================== */
export const FACTOR_MULTIPLE_LESSON: OnionLesson = {
  id: "factor-multiple",
  title: "因數與倍數：誰能整除誰？",
  subject: "數學",
  topic: "因數與倍數",
  grade: "五上",
  stages: ["國小"],
  desc: "12 顆糖果要平分給幾個人剛好分完？洋蔥用「整除」帶你一次搞懂因數和倍數這對雙胞胎。",
  takeaways: ["能整除這個數的是「因數」", "這個數乘以整數得到的是「倍數」", "因數有限個，倍數有無限多個"],
  frames: [
    { step: "步驟 1：12顆糖平分誰行", id: 1, caption: "嗨！有 12 顆糖，要平分給幾個人才能剛好分完、沒有剩下？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：分1人分2人", id: 2, caption: "分給 1 個人：12 顆全給他，12 ÷ 1 ＝ 12；分給 2 個人：每人 6 顆，12 ÷ 2 ＝ 6。都可以整除。", action: "point", prop: { kind: "bars", items: [{ label: "1人", value: 12 }, { label: "2人", value: 6 }], unit: "顆" }, duration: 3200 },
    { step: "步驟 3：整除與不能整除", id: 3, caption: "分給 2 人每人 6 顆、3 人每人 4 顆，都剛好分完；但分給 5 人會剩 2 顆，分不掉！", ask: { prompt: "12 ÷ 5 能不能整除？", options: ["可以，每人 2 顆", "可以，每人 3 顆", "不行，會剩下 2 顆", "不行，會剩下 1 顆"], answer: 2, hint: "5 × 2 = 10，還剩下 2 顆分不掉。" }, action: "think", prop: { kind: "bars", items: [{ label: "3人", value: 4 }, { label: "5人", value: 2 }], unit: "顆", active: 1 }, duration: 3600 },
    { step: "步驟 4：能整除的是因數", id: 4, caption: "像 1、2、3、4、6、12 這些「能整除 12」的數，就是 12 的因數。", action: "point", prop: { kind: "text", text: "12 的因數：1, 2, 3, 4, 6, 12", sub: "能整除 12 的數，一共 6 個", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：一直加是倍數", id: 5, caption: "反過來看：12、24、36、48 一直加 12 上去，這些就是 12 的倍數。", ask: { prompt: "下面哪一個不是 12 的倍數？", options: ["24", "36", "60", "30"], answer: 3, hint: "12 × 2 = 24、12 × 3 = 36、12 × 5 = 60。", }, action: "walk", prop: { kind: "bars", items: [{ label: "12", value: 12 }, { label: "24", value: 24 }, { label: "36", value: 36 }], unit: "" }, duration: 3600 },
    { step: "步驟 6：因數有限倍數無限", id: 6, caption: "關鍵差異：因數數得完（有限個），倍數一直乘下去數不完（無限多個）。", action: "jump", prop: { kind: "text", text: "因數有限 ‧ 倍數無限", sub: "12 的因數 6 個；12 的倍數數不完", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：記因數倍數口訣", id: 7, caption: "口訣：因數能整除、倍數一直加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "fm1", prompt: "下面哪一個是 18 的因數？", options: ["5", "6", "8", "12"], answer: 1, hints: ["因數要能整除 18", "18 ÷ 6 = 3 剛好整除"], explanation: "18 ÷ 6 = 3，可以整除，所以 6 是 18 的因數。" },
    { id: "fm2", prompt: "20 的因數共有幾個？", options: ["4 個", "5 個", "6 個", "8 個"], answer: 2, hints: ["列出能整除 20 的數：1, 2, 4, 5, 10, 20", "一共 6 個"], explanation: "1、2、4、5、10、20 都能整除 20，共 6 個因數。" },
    { id: "fm3", prompt: "7 的倍數中，比 30 大又最接近 30 的是哪一個？", options: ["28", "35", "42", "49"], answer: 1, hints: ["7 × 4 = 28 還不夠大", "7 × 5 = ?"], explanation: "7 × 5 = 35，是比 30 大又最接近的 7 的倍數。" },
    { id: "fm4", prompt: "一個數的最大因數和最小倍數（不含 0）分別是自己，這是因為？", options: ["自己一定能整除自己", "自己最大", "剛好湊巧", "老師規定的"], answer: 0, hints: ["任何數除以自己都等於 1", "所以自己一定是自己的因數"], explanation: "任何數都能被自己整除（商為 1），所以最大因數是自己；最小倍數也是自己（×1）。" },
    { id: "fm5", prompt: "24 顆蘋果平分給若干人剛好分完，人數不可能是？", options: ["3 人", "5 人", "6 人", "8 人"], answer: 1, hints: ["人數必須是 24 的因數", "24 ÷ 5 會剩下 4 顆"], explanation: "24 ÷ 5 = 4 餘 4，不能整除，所以不能分給 5 人。" },
  ],
};

/* ========================================================================
 * 課程 13：數學（國小）— 分數乘以整數
 * 用圓餅累加：3 × 1/4 = 3/4。
 * ======================================================================== */
export const FRACTION_MULTIPLY_LESSON: OnionLesson = {
  id: "fraction-multiply",
  title: "分數乘以整數：幾份的 3 倍是多少？",
  subject: "數學",
  topic: "分數乘法",
  grade: "六上",
  stages: ["國小"],
  desc: "1/4 塊蛋糕有 3 個，一共是幾塊？洋蔥用圓餅一片一片疊給你看，分數乘法其實就是「重複加好幾次」。",
  takeaways: ["分數×整數 = 分子乘以整數、分母不變", "也可以想成「同一份加好幾次」", "算出來的假分數記得化成帶分數"],
  frames: [
    { step: "步驟 1：1/4塊蛋糕三份", id: 1, caption: "嗨！一塊蛋糕切成 4 等份，你拿了其中的 1 份，就是 1/4 塊。", action: "wave", prop: { kind: "pie", a: 1, b: 4, label: "1/4" }, duration: 3200 },
    { step: "步驟 2：疊兩個1/4看", id: 2, caption: "先拿 2 個這樣的 1/4，疊起來看看是幾分之幾。", action: "point", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 1, b: 4 }, result: { a: 2, b: 4 } }, duration: 3400 },
    { step: "步驟 3：1/4乘3等於3/4", id: 3, caption: "1/4 ＋ 1/4 ＋ 1/4 ＝ 3/4。所以 1/4 × 3 ＝ 3/4！", ask: { prompt: "1/4 × 3 等於多少？", options: ["3/4", "3/12", "1/12", "4/3"], answer: 0, hint: "分母都是 4，只把分子 1×3 = 3。" }, action: "jump", prop: { kind: "pie", a: 3, b: 4, label: "3/4" }, duration: 3600 },
    { step: "步驟 4：規則動分子", id: 4, caption: "規則很簡單：分數乘以整數，只把「分子」乘以整數，分母不動。", action: "point", prop: { kind: "text", text: "a/b × n = (a×n)/b", sub: "分子乘以整數，分母保持不變", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：試2/5乘3", id: 5, caption: "試試看 2/5 × 3：分子 2×3 = 6，分母還是 5，答案是 6/5。", ask: { prompt: "2/5 × 3 等於多少？", options: ["6/5", "6/15", "5/6", "2/15"], answer: 0, hint: "分子 2×3 = 6，分母 5 不變。" }, action: "think", prop: { kind: "pie", a: 6, b: 5, label: "6/5" }, duration: 3600 },
    { step: "步驟 6：假分數變帶分數", id: 6, caption: "6/5 是假分數（分子比分母大），換成帶分數是 1 又 1/5。", action: "cheer", prop: { kind: "text", text: "6/5 = 1 又 1/5", sub: "分子 ÷ 分母：6 ÷ 5 = 1 餘 1", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：記乘整數動分子", id: 7, caption: "口訣：乘整數、動分子；分母不動。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "mx1", prompt: "1/6 × 4 等於多少？", options: ["4/6", "4/24", "6/4", "1/24"], answer: 0, hints: ["分子 1×4 = 4", "分母 6 保持不變"], explanation: "分子乘以整數：1×4 = 4，分母 6 不變，答案是 4/6（可約分成 2/3）。" },
    { id: "mx2", prompt: "3/8 × 2 等於多少？", options: ["3/16", "6/8", "6/16", "5/8"], answer: 1, hints: ["分子 3×2 = 6", "分母 8 不變"], explanation: "3×2 = 6，分母 8 不變，答案是 6/8（約分後是 3/4）。" },
    { id: "mx3", prompt: "一條繩子長 2/3 公尺，3 條共長多少公尺？", options: ["2 公尺", "6/3 公尺", "2/9 公尺", "5/3 公尺"], answer: 0, hints: ["2/3 × 3 = 6/3", "6/3 化簡是多少"], explanation: "2/3 × 3 = 6/3 = 2 公尺。" },
    { id: "mx4", prompt: "5/4 化成帶分數是多少？", options: ["1 又 1/4", "4 又 1/5", "1 又 4/5", "5 又 1/4"], answer: 0, hints: ["5 ÷ 4 = 1 餘 1", "整數部分是 1，剩下的 1 是分子"], explanation: "5 ÷ 4 = 1 餘 1，所以 5/4 = 1 又 1/4。" },
    { id: "mx5", prompt: "下列哪一個算式的结果最大？", options: ["1/2 × 3", "1/3 × 3", "1/4 × 3", "1/6 × 3"], answer: 0, hints: ["分母相同時，分子大的分數比較大", "都乘 3，原本最大的還是最大"], explanation: "1/2 × 3 = 3/2，和其他相比 1/2 本身就最大，乘同樣的 3 之後仍然最大。" },
  ],
};

/* ========================================================================
 * 課程 14：國語（國小）— 標點符號
 * ======================================================================== */
export const PUNCTUATION_LESSON: OnionLesson = {
  id: "punctuation",
  title: "標點符號：句子的紅綠燈",
  subject: "國語",
  topic: "標點符號",
  grade: "三上",
  stages: ["國小"],
  desc: "一句話寫完要停一下還是要結束？洋蔥把逗號、句號、問號、驚嘆號變成紅綠燈，讓你一看就知道該放哪一個。",
  takeaways: ["逗號＝還沒說完，句號＝說完了", "問號＝有問題要問", "驚嘆號＝有情緒、很大聲"],
  frames: [
    { step: "步驟 1：標點像紅綠燈", id: 1, caption: "嗨！寫句子的時候，標點符號就像馬路上的紅綠燈，告訴讀者哪裡要停。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：逗號是黃燈", id: 2, caption: "逗號「，」是黃燈：話還沒說完，先喘一口氣再繼續。", ask: { prompt: "「今天天氣很好__我們去公園玩。」空格要放什麼？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 1, hint: "話還沒說完，後面還有「我們去公園玩」。" }, action: "point", prop: { kind: "text", text: "今天天氣很好，我們去公園玩。", sub: "逗號＝黃燈，話還沒說完", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：句號是紅燈", id: 3, caption: "句號「。」是紅燈：這句話說完了，到此為止。", action: "walk", prop: { kind: "text", text: "我們去公園玩。", sub: "句號＝紅燈，句子結束", tone: "ok" }, duration: 3400 },
    { step: "步驟 4：問號用來發問", id: 4, caption: "問號「？」用在發問：句子裡有「誰、什麼、哪裡、嗎、呢」通常就是問句。", ask: { prompt: "「你今天要不要去圖書館__」空格要放什麼？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 2, hint: "這句話是在問別人的意見。" }, action: "think", prop: { kind: "text", text: "你今天要不要去圖書館？", sub: "問號＝有問題要問", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：驚嘆號有情緒", id: 5, caption: "驚嘆號「！」用在有強烈情緒：驚訝、生氣、開心大叫都用它。", action: "jump", prop: { kind: "text", text: "這朵花好漂亮啊！", sub: "驚嘆號＝有情緒、很大聲", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：四種燈號記起來", id: 6, caption: "四種燈號記起來了嗎？黃燈逗號、紅燈句號、問號發問、驚嘆有情緒。", action: "point", prop: { kind: "flow", steps: ["，還沒說完", "。說完了", "？要發問", "！有情緒"], active: 3 }, duration: 3600 },
    { step: "步驟 7：記標點口訣", id: 7, caption: "口訣：停一下用逗號，說完用句號，發問用問號，大叫用驚嘆號。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "pu1", prompt: "「妹妹把碗洗乾淨__」這句話說完了，要用？", options: ["逗號，", "句號。", "問號？", "驚嘆號！"], answer: 1, hints: ["這是一句完整的敘述，沒有情緒也沒有問題", "句子結束用句號"], explanation: "整件事說完了，用句號「。」。" },
    { id: "pu2", prompt: "「你為什麼遲到__」要用哪一個符號？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 2, hints: ["「為什麼」是在問原因", "問句用問號"], explanation: "「為什麼」是疑問詞，句尾用問號「？」。" },
    { id: "pu3", prompt: "「這場表演真是太精采了__」要用哪一個符號？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 3, hints: ["「太精采了」帶有讚嘆的情緒", "有情緒用驚嘆號"], explanation: "帶有強烈讚嘆的情緒，用驚嘆號「！」。" },
    { id: "pu4", prompt: "「早上起床__我先刷牙洗臉__再去吃早餐。」兩個空格依序是？", options: ["，。", "。。", "，！", "？。"], answer: 0, hints: ["前兩句話都還沒結束", "最後「再去吃早餐」說完了才用句號"], explanation: "前兩處話還沒說完用逗號，最後整句結束用句號。" },
    { id: "pu5", prompt: "下面哪一個句子「不應該」用問號？", options: ["你幾歲？", "這是誰的鉛筆？", "今天的功勞是你的。", "你要不要一起來？"], answer: 2, hints: ["這句話沒有要問問題", "它只是在陳述一件事"], explanation: "「今天的功勞是你的。」是陳述句，用句號，不是問句。" },
  ],
};

/* ========================================================================
 * 課程 15：自然（國小）— 食物鏈
 * ======================================================================== */
export const FOOD_CHAIN_LESSON: OnionLesson = {
  id: "food-chain",
  title: "食物鏈：誰吃誰？",
  subject: "自然",
  topic: "食物鏈",
  grade: "五下",
  stages: ["國小"],
  desc: "草被兔子吃、兔子被老鷹吃——這條「誰吃誰」的線就是食物鏈。洋蔥帶你追一次能量的旅行。",
  takeaways: ["箭頭指向「吃掉的那一方」", "生產者是植物，消費者是動物", "能量沿著食物鏈一直傳下去"],
  frames: [
    { step: "步驟 1：草原三角色", id: 1, caption: "嗨！草原上有草、有兔子、有老鷹，牠們之間藏著一條看不見的線。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：草被兔吃箭頭", id: 2, caption: "兔子吃草，所以能量從「草」跑到「兔子」身上。箭頭要畫成 草 → 兔子。", ask: { prompt: "食物鏈裡的箭頭代表什麼？", options: ["誰被誰吃", "能量的流向（被誰吃掉）", "誰比較大隻", "誰跑得比較快"], answer: 1, hint: "箭頭指向「把對方吃掉」的那一方。" }, action: "point", prop: { kind: "flow", steps: ["草", "兔子"], active: 1 }, duration: 3600 },
    { step: "步驟 3：鷹吃兔能量傳", id: 3, caption: "老鷹又吃掉兔子，能量繼續往上傳：草 → 兔子 → 老鷹。", action: "walk", prop: { kind: "flow", steps: ["草", "兔子", "老鷹"], active: 2 }, duration: 3600 },
    { step: "步驟 4：植物是生產者", id: 4, caption: "第一棒幾乎都是綠色植物，叫做「生產者」——它們自己用陽光製造養分。", action: "point", prop: { kind: "cycle", nodes: ["生產者", "消費者"], active: 0 }, duration: 3400 },
    { step: "步驟 5：吃人的是消費者", id: 5, caption: "吃別人的叫做「消費者」：吃植物的是草食性，吃動物的是肉食性。", ask: { prompt: "兔子在食物鏈裡是什麼角色？", options: ["生產者", "草食性消費者", "肉食性消費者", "分解者"], answer: 1, hint: "兔子吃草，自己不會製造養分。" }, action: "think", prop: { kind: "cycle", nodes: ["生產者", "消費者"], active: 1 }, duration: 3600 },
    { step: "步驟 6：分解者收尾", id: 6, caption: "還有一群默默工作的「分解者」：黴菌、細菌把屍體和落葉分解回土壤。", action: "jump", prop: { kind: "text", text: "生產者 → 消費者 → 分解者", sub: "養分最後回到土壤，給植物再用", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：記箭頭指吃方", id: 7, caption: "口訣：箭頭指向吃的一方，植物開頭、動物接棒、細菌收尾。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "fc1", prompt: "食物鏈「草 → 兔子 → 老鷹」中，箭頭代表什麼？", options: ["兔子被草吃", "能量的流向，老鷹吃兔子", "草吃兔子", "只是裝飾"], answer: 1, hints: ["箭頭指向吃掉對方的那一方", "老鷹吃兔子"], explanation: "箭頭代表能量的流向，指向吃掉對方的那一方：能量從草傳給兔子，再從兔子傳給老鷹。" },
    { id: "fc2", prompt: "下列哪一個通常是食物鏈的「生產者」？", options: ["老鷹", "綠色植物", "兔子", "細菌"], answer: 1, hints: ["生產者能自己製造養分", "只有植物能行光合作用"], explanation: "綠色植物可行光合作用自行製造養分，是生產者。" },
    { id: "fc3", prompt: "「稻子 → 蝗蟲 → 青蛙 → 蛇」，蛇屬於？", options: ["生產者", "草食性消費者", "肉食性消費者", "分解者"], answer: 2, hints: ["蛇吃青蛙", "吃動物的是肉食性"], explanation: "蛇吃青蛙（動物），屬於肉食性消費者。" },
    { id: "fc4", prompt: "如果把食物鏈中間的兔子全部移走，最可能發生什麼？", options: ["草長得更多，老鷹變少", "草和老鷹都變多", "完全沒有影響", "老鷹改吃草"], answer: 0, hints: ["沒人吃草，草會變多", "老鷹少了食物來源"], explanation: "少了兔子，草會長得更多；老鷹失去主要食物，數量會減少。" },
    { id: "fc5", prompt: "下列哪一種生物屬於「分解者」？", options: ["黴菌", "老鷹", "小草", "兔子"], answer: 0, hints: ["分解者會把屍體、落葉分解回土壤", "它通常很小、用肉眼看不見"], explanation: "黴菌、細菌會分解動植物遺體，是分解者。" },
  ],
};

/* ========================================================================
 * 課程 16：數學（國小）— 統計圖表讀值
 * ======================================================================== */
export const STAT_CHART_LESSON: OnionLesson = {
  id: "stat-chart",
  title: "統計圖表：長條圖怎麼看？",
  subject: "數學",
  topic: "統計圖表",
  grade: "五下",
  stages: ["國小"],
  desc: "班上同學最喜歡哪種水果？洋蔥把答案畫成長條圖，教你三步驟讀出「最多、最少、差多少」。",
  takeaways: ["先看標題和單位", "長條越長代表數量越多", "兩條相比用減法算相差"],
  frames: [
    { step: "步驟 1：最愛水果調查", id: 1, caption: "嗨！老師調查全班最喜歡的水果，結果要怎麼一眼看出來？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：畫成長條圖", id: 2, caption: "把數量畫成長條圖：每種水果一根長條，越高代表喜歡的人越多。", action: "point", prop: { kind: "bars", items: [{ label: "蘋果", value: 8 }, { label: "香蕉", value: 5 }, { label: "葡萄", value: 12 }], unit: "人" }, duration: 3600 },
    { step: "步驟 3：先讀標題單位", id: 3, caption: "第一步：先看「標題」和「單位」，才知道這張圖在比什麼、一格是多少。", ask: { prompt: "看長條圖時，第一步要先看什麼？", options: ["最長的那根", "標題和單位", "顏色", "圖的大小"], answer: 1, hint: "不知道單位，就不知道一格代表多少。" }, action: "think", prop: { kind: "text", text: "標題：最喜歡的水果　單位：1 格 = 1 人", sub: "先讀標題與單位", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：找最長最短", id: 4, caption: "第二步：找最長和最矮的長條，就知道「最多」和「最少」。", action: "point", prop: { kind: "bars", items: [{ label: "葡萄", value: 12 }, { label: "香蕉", value: 5 }], unit: "人", active: 0 }, duration: 3400 },
    { step: "步驟 5：相差用減法", id: 5, caption: "第三步：要比「相差多少」，就用長的減掉短的：12 − 5 = 7 人。", ask: { prompt: "喜歡葡萄（12 人）比香蕉（5 人）多幾人？", options: ["7 人", "17 人", "5 人", "12 人"], answer: 0, hint: "相差要用減法：12 − 5。" }, action: "jump", prop: { kind: "text", text: "12 − 5 = 7（人）", sub: "比多少用減法", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：總共全部加", id: 6, caption: "要算「總共多少人」，就把每一根長條的數量全部加起來。", action: "walk", prop: { kind: "bars", items: [{ label: "蘋果", value: 8 }, { label: "香蕉", value: 5 }, { label: "葡萄", value: 12 }], unit: "人" }, duration: 3400 },
    { step: "步驟 7：記讀圖三步驟", id: 7, caption: "口訣：先讀標題單位，再看最長最短，相差用減、總共用加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sc1", prompt: "看長條圖時，第一步應該先確認什麼？", options: ["最長的長條", "標題與單位", "圖的顏色", "紙張大小"], answer: 1, hints: ["不知道一格代表多少就沒法讀值", "標題說明這張圖在比什麼"], explanation: "先讀標題與單位，才知道圖表的意義與每格代表的數量。" },
    { id: "sc2", prompt: "長條圖中，長條越長代表什麼？", options: ["數量越多", "數量越少", "比較便宜", "比較重要"], answer: 0, hints: ["長條高度對應數量", "越高就是越多"], explanation: "長條的長度（高度）對應數量，越長代表數量越多。" },
    { id: "sc3", prompt: "蘋果 8 人、葡萄 12 人，兩者相差多少人？", options: ["4 人", "20 人", "8 人", "12 人"], answer: 0, hints: ["相差用減法", "12 − 8 = ?"], explanation: "12 − 8 = 4，相差 4 人。" },
    { id: "sc4", prompt: "蘋果 8 人、香蕉 5 人、葡萄 12 人，全班共幾人？", options: ["17 人", "25 人", "13 人", "20 人"], answer: 1, hints: ["總共要用加法", "8 + 5 + 12 = ?"], explanation: "8 + 5 + 12 = 25 人。" },
    { id: "sc5", prompt: "想比較「每週讀書時間的變化趨勢」，用哪一種圖最適合？", options: ["長條圖", "折線圖", "圓餅圖", "流程圖"], answer: 1, hints: ["要看「隨時間變化」的趨勢", "點連成線的圖最能看趨勢"], explanation: "折線圖能顯示隨時間的增減趨勢，最適合看變化。" },
  ],
};

/* ========================================================================
 * 課程 17：自然（國中）— 光合作用【國中版】
 * 與國小版「葉子裡的綠色工廠」分工：這裡進到葉綠體內部，講光反應／暗反應
 * 與反應式，國小版只講原料與產物的整廠概念。兩邊的 stages 互不重疊。
 * ======================================================================== */
export const PHOTOSYNTHESIS_JUNIOR_LESSON: OnionLesson = {
  id: "photosynthesis-junior",
  title: "光合作用（國中版）：葉綠體裡的兩條生產線",
  subject: "自然",
  topic: "光合作用",
  grade: "七上",
  stages: ["國中"],
  desc: "國小只看過整座工廠，現在要拆開葉綠體：光反應把水拆開、暗反應把二氧化碳組起來，兩條生產線缺一不可。",
  takeaways: ["光反應在葉綠餅上進行，需要光", "暗反應在基質進行，固定 CO₂ 合成葡萄糖", "總反應式：6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂"],
  frames: [
    { step: "步驟 1：拆開葉綠體", id: 1, caption: "嗨！國小我們把葉子當成一整座工廠，今天要拆開葉綠體，看裡面有幾條生產線。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：葉綠餅與基質", id: 2, caption: "葉綠體內部有兩區：堆疊起來的「葉綠餅」和周圍的液體「基質」，各管一條生產線。", action: "point", prop: { kind: "flow", steps: ["葉綠餅", "基質"], active: 0 }, duration: 3400 },
    { step: "步驟 3：光反應拆水放氧", id: 3, caption: "第一條：光反應——一定要有光。水被拆開，釋放出氧氣，同時把光能存成能量貨幣 ATP。", ask: { prompt: "光合作用產生的氧氣，來自哪個物質被分解？", options: ["二氧化碳", "水", "葡萄糖", "葉綠素"], answer: 1, hint: "光反應把「水」拆開，氧氣是水的副產品。" }, action: "think", prop: { kind: "flow", steps: ["光能", "水被拆解", "釋出 O₂", "存成 ATP"], active: 2 }, duration: 3800 },
    { step: "步驟 4：暗反應在基質", id: 4, caption: "第二條：暗反應——在基質進行，有沒有光都能跑（但需要光反應給的 ATP）。", action: "walk", prop: { kind: "flow", steps: ["CO₂ 進入", "ATP 供能", "合成葡萄糖"], active: 1 }, duration: 3600 },
    { step: "步驟 5：暗反應固定CO2", id: 5, caption: "暗反應把二氧化碳一個一個「固定」起來，慢慢組出葡萄糖 C₆H₁₂O₆。", ask: { prompt: "暗反應需要的能量貨幣來自哪裡？", options: ["土壤", "光反應產生的 ATP", "直接吸收陽光", "水蒸氣"], answer: 1, hint: "暗反應本身不吸光，它用的是光反應存下來的能量。" }, action: "jump", prop: { kind: "flow", steps: ["CO₂ 進入", "ATP 供能", "合成葡萄糖"], active: 2 }, duration: 3800 },
    { step: "步驟 6：總反應式平衡", id: 6, caption: "把兩條線合起來就是總反應式，左右兩邊的原子數必須一樣多。", action: "point", prop: { kind: "balance", left: "6CO₂ + 6H₂O", right: "C₆H₁₂O₆ + 6O₂", tip: "反應條件寫在箭頭上：光能、葉綠體" }, duration: 3800 },
    { step: "步驟 7：對照呼吸作用", id: 7, caption: "對照一下：光合作用存能量、放出氧氣；呼吸作用釋放能量、消耗氧氣，兩者方向相反。", action: "cheer", prop: { kind: "text", text: "光合作用：CO₂＋H₂O → 養分＋O₂（存能量）", sub: "呼吸作用：養分＋O₂ → CO₂＋H₂O（釋能量）", tone: "ok" }, duration: 4000 },
  ],
  questions: [
    { id: "pj1", prompt: "光反應進行在葉綠體的哪個部位？", options: ["基質", "葉綠餅（類囊體）", "細胞膜", "細胞核"], answer: 1, hints: ["需要光的那條生產線在哪裡", "堆疊成餅狀的構造上"], explanation: "光反應在葉綠餅（類囊體膜）上進行，那裡才有葉綠素可以吸收光能。" },
    { id: "pj2", prompt: "光合作用釋放的氧氣，來自哪個物質？", options: ["二氧化碳", "水", "葡萄糖", "葉綠素"], answer: 1, hints: ["光反應把哪個物質拆開", "水被拆解後剩下的就是氧"], explanation: "光反應把水拆解，氧氣來自水的分解，不是來自二氧化碳。" },
    { id: "pj3", prompt: "暗反應的主要功能是什麼？", options: ["吸收光能", "固定 CO₂ 合成葡萄糖", "分解水釋氧", "運輸水分"], answer: 1, hints: ["暗反應處理的是二氧化碳", "最後做出醣類"], explanation: "暗反應利用 ATP 的能量把 CO₂ 固定、合成葡萄糖。" },
    { id: "pj4", prompt: "下列哪一個是光合作用的總反應式？", options: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", "6O₂ + 6H₂O → C₆H₁₂O₆ + 6CO₂", "CO₂ + H₂O → O₂ + H₂O"], answer: 0, hints: ["原料是二氧化碳和水", "產物是葡萄糖和氧氣"], explanation: "6CO₂ + 6H₂O 在光能與葉綠體作用下生成 C₆H₁₂O₆ + 6O₂。" },
    { id: "pj5", prompt: "光合作用與呼吸作用的關係，下列何者正確？", options: ["完全相同", "反應方向相反", "只發生在植物", "都只在白天進行"], answer: 1, hints: ["一個存能量、一個釋能量", "反應物與生成物正好互換"], explanation: "兩者反應方向相反：光合作用儲存能量並釋氧，呼吸作用釋放能量並耗氧。" },
  ],
};

/* ========================================================================
 * 課程 18：自然（國中）— 物理變化 vs 化學變化
 * ======================================================================== */
export const CHEMICAL_CHANGE_LESSON: OnionLesson = {
  id: "chemical-change",
  title: "物理變化 vs 化學變化：有沒有新物質？",
  subject: "自然",
  topic: "物質變化",
  grade: "七上",
  stages: ["國中"],
  desc: "冰塊融化是物理變化，鐵生鏽是化學變化——差別在哪？洋蔥給你一個萬用判斷法：有沒有產生新物質。",
  takeaways: ["物理變化：只是外形、狀態變，物質本身沒變", "化學變化：產生新物質，通常不可逆", "判斷關鍵：有沒有新物質生成"],
  frames: [
    { step: "步驟 1：融化生鏽兩回事", id: 1, caption: "嗨！冰塊化成水、鐵釘生鏽，這兩種「變了」其實是兩回事。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：冰融是物理變化", id: 2, caption: "冰塊融化成水：只是從固體變液體，成分都還是 H₂O，沒有新物質。", action: "point", prop: { kind: "flow", steps: ["冰（固體）", "水（液體）"], active: 1 }, duration: 3400 },
    { step: "步驟 3：形狀變是物理", id: 3, caption: "這種只改變外形或狀態、物質本身不變的，叫做「物理變化」。", ask: { prompt: "把紙撕成兩半，是物理變化還是化學變化？", options: ["物理變化", "化學變化", "兩者都不是", "無法判斷"], answer: 0, hint: "撕碎的紙還是紙，成分沒變。" }, action: "think", prop: { kind: "text", text: "物理變化：形狀、狀態改變", sub: "物質本身不變，多半可以回復", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：鐵生鏽新物質", id: 4, caption: "鐵釘生鏽就不一樣了：鐵（Fe）和空氣中的氧、水反應，生成「氧化鐵」這個新物質。", action: "walk", prop: { kind: "flow", steps: ["鐵 Fe", "＋ O₂、H₂O", "氧化鐵（鏽）"], active: 2 }, duration: 3600 },
    { step: "步驟 5：產新物質是化學", id: 5, caption: "這種產生新物質、性質也跟著變的，叫做「化學變化」，通常無法輕易變回來。", ask: { prompt: "下列哪一個是化學變化？", options: ["冰塊融化", "鹽溶在水裡", "木材燃燒", "玻璃打破"], answer: 2, hint: "燃燒後產生灰燼和氣體，是新物質。" }, action: "jump", prop: { kind: "text", text: "化學變化：產生新物質", sub: "性質改變，多半不可逆", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：化學變化四線索", id: 6, caption: "化學變化常有的線索：顏色改變、產生氣體、沉澱、溫度明顯變化、發光。", action: "point", prop: { kind: "flow", steps: ["變色", "冒氣泡", "生成沉澱", "溫度變化"], active: 1 }, duration: 3600 },
    { step: "步驟 7：有無新物質判斷", id: 7, caption: "口訣：有沒有「新物質」？有→化學變化；沒有→物理變化。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "cc1", prompt: "冰塊融化成水屬於哪種變化？", options: ["物理變化", "化學變化", "兩者都是", "都不是"], answer: 0, hints: ["成分仍然是 H₂O", "只是狀態從固體變液體"], explanation: "只是狀態改變、物質本身不變，是物理變化。" },
    { id: "cc2", prompt: "鐵釘生鏽屬於哪種變化？", options: ["物理變化", "化學變化", "只是髒了", "無法判斷"], answer: 1, hints: ["產生了氧化鐵這個新物質", "鐵和氧、水反應"], explanation: "鐵與氧、水反應生成氧化鐵（新物質），是化學變化。" },
    { id: "cc3", prompt: "下列哪一個是「化學變化」的線索？", options: ["形狀改變", "位置移動", "產生氣體（冒氣泡）", "體積脹大"], answer: 2, hints: ["冒氣泡代表有新物質（氣體）產生", "有新物質才是化學變化"], explanation: "冒氣泡表示生成了氣體這種新物質，是化學變化的線索。" },
    { id: "cc4", prompt: "把糖溶解在水中，屬於？", options: ["化學變化", "物理變化", "產生新物質", "燃燒反應"], answer: 1, hints: ["糖分子本身沒有變成別的東西", "把水蒸乾還能得到糖"], explanation: "糖只是均勻分散在水中，蒸乾可再得回糖，是物理變化。" },
    { id: "cc5", prompt: "「物理變化多半可逆、化學變化多半不可逆」，主要原因是？", options: ["物理變化沒有產生新物質", "化學變化比較慢", "老師規定的", "物理變化比較簡單"], answer: 0, hints: ["沒有新物質，就能變回原狀", "變成新物質就回不去了"], explanation: "物理變化沒產生新物質，所以多半能回復原狀；化學變化已生成新物質，通常不可逆。" },
  ],
};

/* ========================================================================
 * 課程 19：自然（國中）— 細胞分裂
 * ======================================================================== */
export const CELL_DIVISION_LESSON: OnionLesson = {
  id: "cell-division",
  title: "細胞分裂：一套變兩套的複製術",
  subject: "自然",
  topic: "細胞分裂",
  grade: "七下",
  stages: ["國中"],
  desc: "一個細胞怎麼變成兩個，而且染色體還不能少給？洋蔥用循環圖带你走完複製→排隊→分裂四步驟。",
  takeaways: ["分裂前先複製染色體，數目暫時加倍", "分裂時平均分配，兩個子細胞各得一套", "子細胞染色體數目與母細胞相同"],
  frames: [
    { step: "步驟 1：分裂長大身體", id: 1, caption: "嗨！你從一個受精卵長到現在，靠的就是細胞不停分裂。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：先複製染色體", id: 2, caption: "第一步：細胞先生長，把裡面的東西都準備好，特別是「染色體」要複製一份。", action: "point", prop: { kind: "cycle", nodes: ["複製", "排隊", "分離", "分裂"], active: 0 }, duration: 3600 },
    { step: "步驟 3：染色體排隊", id: 3, caption: "第二步：複製好的染色體一對一對排在中間，準備平均分配。", ask: { prompt: "分裂前染色體要先做什麼？", options: ["先消失", "先複製成兩份", "先送出細胞", "不用做任何事"], answer: 1, hint: "這樣兩個子細胞才拿得到完整的一套。" }, action: "think", prop: { kind: "cycle", nodes: ["複製", "排隊", "分離", "分裂"], active: 1 }, duration: 3600 },
    { step: "步驟 4：染色體分離", id: 4, caption: "第三步：成對的染色體被拉向兩端，一邊一份，誰也不多拿。", action: "walk", prop: { kind: "cycle", nodes: ["複製", "排隊", "分離", "分裂"], active: 2 }, duration: 3600 },
    { step: "步驟 5：一分為二", id: 5, caption: "第四步：細胞從中間一分為二，形成兩個一模一樣的子細胞。", ask: { prompt: "一個母細胞分裂後會產生幾個子細胞？", options: ["1 個", "2 個", "4 個", "很多個"], answer: 1, hint: "一次分裂就是「一分為二」。" }, action: "jump", prop: { kind: "cycle", nodes: ["複製", "排隊", "分離", "分裂"], active: 3 }, duration: 3600 },
    { step: "步驟 6：子細胞數目相同", id: 6, caption: "關鍵：子細胞的染色體數目和母細胞「相同」，所以複製這一步不能省。", action: "point", prop: { kind: "balance", left: "母細胞複製後 4n", right: "子細胞 2n ＋ 子細胞 2n", tip: "先複製再平分，數目才不會減半" }, duration: 3800 },
    { step: "步驟 7：記複製分離口訣", id: 7, caption: "口訣：先複製、再排隊、平均分、一分二。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "cd1", prompt: "細胞分裂前，染色體必須先做什麼？", options: ["複製", "消失", "減半", "送出細胞"], answer: 0, hints: ["要讓兩個子細胞都拿到完整一套", "所以要先準備兩份"], explanation: "分裂前先複製染色體，之後才能平均分配給兩個子細胞。" },
    { id: "cd2", prompt: "一個細胞分裂一次後會產生幾個子細胞？", options: ["1 個", "2 個", "3 個", "4 個"], answer: 1, hints: ["一分為二", "一次分裂產生兩個"], explanation: "一次細胞分裂產生兩個子細胞。" },
    { id: "cd3", prompt: "子細胞的染色體數目與母細胞相比？", options: ["相同", "減半", "加倍", "不一定"], answer: 0, hints: ["先複製再平分", "加倍後平分剛好回到原數"], explanation: "先複製（加倍）再平均分配，子細胞染色體數目與母細胞相同。" },
    { id: "cd4", prompt: "細胞分裂的順序，下列何者正確？", options: ["分離→複製→排隊→分裂", "複製→排隊→分離→分裂", "分裂→複製→排隊→分離", "排隊→分離→複製→分裂"], answer: 1, hints: ["要先有兩份才能分", "排好隊再往兩邊拉"], explanation: "正確順序是：複製 → 排隊 → 分離 → 分裂成兩個細胞。" },
    { id: "cd5", prompt: "如果分裂時染色體沒有平均分配，可能造成什麼結果？", options: ["子細胞長得比較快", "子細胞的遺傳資訊異常", "完全沒有影響", "細胞會變大"], answer: 1, hints: ["染色體帶有遺傳資訊", "少了或多了一條都不正常"], explanation: "染色體攜帶遺傳資訊，分配不均會讓子細胞的遺傳物質異常。" },
  ],
};

/* ========================================================================
 * 課程 20：自然（國中）— 速度與速率
 * ======================================================================== */
export const SPEED_RATE_LESSON: OnionLesson = {
  id: "speed-rate",
  title: "速度與速率：誰跑得比較快？",
  subject: "自然",
  topic: "速度與速率",
  grade: "八上",
  stages: ["國中"],
  desc: "跑 100 公尺花 12 秒，到底是快還是慢？洋蔥教你用「距離 ÷ 時間」把感覺變成數字。",
  takeaways: ["速率 = 距離 ÷ 時間", "速度 = 速率 + 方向", "比較快慢要在相同時間或相同距離下比"],
  frames: [
    { step: "步驟 1：甲乙誰比較快", id: 1, caption: "嗨！甲跑 100 公尺花 20 秒，乙跑 100 公尺花 25 秒，誰比較快？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：同距比時間", id: 2, caption: "距離一樣時，花的時間越短就越快。所以甲比較快。", action: "point", prop: { kind: "bars", items: [{ label: "甲", value: 20 }, { label: "乙", value: 25 }], unit: "秒", active: 0 }, duration: 3400 },
    { step: "步驟 3：算速率公式", id: 3, caption: "但如果距離不同，就不能只看時間了。這時要算「每秒跑幾公尺」——這就是速率。", ask: { prompt: "速率的計算公式是什麼？", options: ["距離 ÷ 時間", "時間 ÷ 距離", "距離 × 時間", "距離 ＋ 時間"], answer: 0, hint: "「每」單位時間走多少距離，所以用除法。" }, action: "think", prop: { kind: "text", text: "速率 = 距離 ÷ 時間", sub: "單位：公尺/秒（m/s）", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：100除20得5", id: 4, caption: "算算看：跑 100 公尺花 20 秒，速率 = 100 ÷ 20 = 5 公尺/秒。", action: "walk", prop: { kind: "balance", left: "100 m ÷ 20 s", right: "5 m/s", tip: "每秒前進 5 公尺" }, duration: 3600 },
    { step: "步驟 5：乙4甲5比大小", id: 5, caption: "再看乙：100 ÷ 25 = 4 公尺/秒。5 > 4，用數字比就一清二楚。", ask: { prompt: "時速 90 公里開 2 小時，共走多遠？", options: ["45 公里", "180 公里", "92 公里", "90 公里"], answer: 1, hint: "距離 = 速率 × 時間 = 90 × 2。" }, action: "jump", prop: { kind: "bars", items: [{ label: "甲", value: 5 }, { label: "乙", value: 4 }], unit: "m/s", active: 0 }, duration: 3600 },
    { step: "步驟 6：速度多方向", id: 6, caption: "最後一塊拼圖：「速度」比「速率」多了「方向」。只講快慢是速率，加上往哪裡才是速度。", action: "point", prop: { kind: "text", text: "速率：只有大小（5 m/s）", sub: "速度：大小 ＋ 方向（向東 5 m/s）", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：記速率除時間", id: 7, caption: "口訣：速率＝距離÷時間；速度還要講方向。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sp1", prompt: "速率的公式是？", options: ["距離 ÷ 時間", "時間 ÷ 距離", "距離 × 時間", "速度 × 時間"], answer: 0, hints: ["每單位時間走多遠", "「每」就是除的意思"], explanation: "速率 = 距離 ÷ 時間。" },
    { id: "sp2", prompt: "跑步 200 公尺花了 40 秒，平均速率是多少？", options: ["5 m/s", "8 m/s", "240 m/s", "0.2 m/s"], answer: 0, hints: ["200 ÷ 40 = ?", "每秒跑幾公尺"], explanation: "200 ÷ 40 = 5，平均速率是 5 m/s。" },
    { id: "sp3", prompt: "車子以 60 km/h 行駛 3 小時，走了多遠？", options: ["20 km", "180 km", "63 km", "60 km"], answer: 1, hints: ["距離 = 速率 × 時間", "60 × 3 = ?"], explanation: "距離 = 60 × 3 = 180 公里。" },
    { id: "sp4", prompt: "「速度」與「速率」最主要的差別是什麼？", options: ["速度比較快", "速度多包含了方向", "速率多包含了方向", "兩者完全相同"], answer: 1, hints: ["速度是向量", "要講「往哪裡」才是速度"], explanation: "速度是「速率＋方向」的向量；速率只有大小。" },
    { id: "sp5", prompt: "兩車都走 120 公里，甲花 2 小時、乙花 3 小時，誰的速率較大？", options: ["甲", "乙", "一樣", "無法判斷"], answer: 0, hints: ["距離相同時，時間越短速率越大", "120÷2 與 120÷3 比大小"], explanation: "甲 120÷2 = 60 km/h，乙 120÷3 = 40 km/h，甲的速率較大。" },
  ],
};

/* ========================================================================
 * 課程 21：自然（國中）— 板塊運動與地震
 * ======================================================================== */
export const PLATE_TECTONICS_LESSON: OnionLesson = {
  id: "plate-tectonics",
  title: "板塊運動與地震：地板其實在動",
  subject: "自然",
  topic: "板塊運動",
  grade: "九上",
  stages: ["國中"],
  desc: "腳下的地殼不是一整塊，而是好幾片會慢慢移動的板塊。洋蔥帶你看它們怎麼擠出山脈、又怎麼引發地震。",
  takeaways: ["地殼分成數個板塊，會緩慢移動", "板塊互相擠壓會形成山脈與海溝", "地震是板塊累積的能量瞬間釋放"],
  frames: [
    { step: "步驟 1：地殼像拼圖", id: 1, caption: "嗨！你腳下的地面其實是「拼圖」拼起來的，每一片都在慢慢移動。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：岩石圈破成板塊", id: 2, caption: "地球最外層的岩石圈破裂成好幾大塊，叫做「板塊」，下面是可以流動的地函。", action: "point", prop: { kind: "flow", steps: ["岩石圈", "板塊", "地函"], active: 1 }, duration: 3400 },
    { step: "步驟 3：板塊一年幾公分", id: 3, caption: "板塊移動很慢，一年大概幾公分——跟指甲長大的速度差不多。", ask: { prompt: "板塊移動的速度大約如何？", options: ["每秒幾公里", "一年幾公分（很慢）", "完全不動", "一天幾公尺"], answer: 1, hint: "跟指甲長大的速度差不多。" }, action: "think", prop: { kind: "text", text: "板塊一年移動約幾公分", sub: "慢到感覺不出來，但千萬年後會造山", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：擠壓造山脈", id: 4, caption: "兩個板塊互相擠壓（聚合），交界處會被擠皺隆起，形成山脈或海溝。", action: "walk", prop: { kind: "flow", steps: ["板塊擠壓", "地層隆起", "形成山脈"], active: 2 }, duration: 3600 },
    { step: "步驟 5：張裂造裂谷", id: 5, caption: "相反地，兩個板塊互相拉開（張裂），中間會裂開形成裂谷或新的海洋。", ask: { prompt: "兩個板塊互相「拉開」會形成什麼地形？", options: ["山脈", "裂谷或新海洋", "什麼都不會發生", "火山灰"], answer: 1, hint: "拉開就是讓中間空出來。" }, action: "jump", prop: { kind: "flow", steps: ["板塊張裂", "地殼裂開", "形成裂谷"], active: 2 }, duration: 3600 },
    { step: "步驟 6：能量釋放地震", id: 6, caption: "板塊卡住時能量會一直累積，撐不住的瞬間一口氣釋放——那就是地震。", action: "point", prop: { kind: "flow", steps: ["板塊擠壓卡住", "能量累積", "瞬間斷裂", "發生地震"], active: 3 }, duration: 3800 },
    { step: "步驟 7：記擠壓張裂地震", id: 7, caption: "口訣：擠壓造山、張裂造谷、能量爆發就是地震。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "pt1", prompt: "地球最外層破裂成數大塊的岩石圈稱為？", options: ["地函", "板塊", "地核", "岩漿"], answer: 1, hints: ["像拼圖一樣分成好幾片", "它會緩慢移動"], explanation: "岩石圈破裂成的數大塊稱為「板塊」。" },
    { id: "pt2", prompt: "兩個板塊互相擠壓（聚合）最可能形成什麼地形？", options: ["裂谷", "山脈或海溝", "平原", "沙漠"], answer: 1, hints: ["擠壓會把地層擠皺隆起", "隆起的就是山"], explanation: "聚合型板塊邊界會擠壓隆起，形成山脈或海溝。" },
    { id: "pt3", prompt: "地震發生的主要原因是？", options: ["颱風經過", "板塊累積的能量瞬間釋放", "太陽照射", "海水漲潮"], answer: 1, hints: ["板塊卡住後會一直累積力量", "撐不住的瞬間就爆發"], explanation: "板塊運動累積的能量在斷層瞬間釋放，就是地震。" },
    { id: "pt4", prompt: "板塊移動的速度通常是？", options: ["非常快，肉眼可見", "很慢，一年約幾公分", "完全靜止", "忽快忽慢每天不同"], answer: 1, hints: ["跟指甲生長的速度差不多", "所以要很久才看得出變化"], explanation: "板塊一年只移動幾公分，非常緩慢。" },
    { id: "pt5", prompt: "下列哪一個現象「不是」板塊運動造成的？", options: ["山脈隆起", "火山活動", "地震", "颱風形成"], answer: 3, hints: ["颱風是大氣現象", "跟地殼運動無關"], explanation: "颱風是大氣與海洋的現象，與板塊運動無關。" },
  ],
};

/* ========================================================================
 * 課程 22：英語（國中）— 現在簡單式 vs 現在進行式
 * ======================================================================== */
export const ENGLISH_TENSE_LESSON: OnionLesson = {
  id: "english-tense",
  title: "現在簡單式 vs 現在進行式",
  subject: "英語",
  topic: "動詞時態",
  grade: "七上",
  stages: ["國中"],
  desc: "I eat 跟 I am eating 差在哪裡？洋蔥用「習慣」和「正在做」兩個關鍵字，一次分清楚。",
  takeaways: ["現在簡單式：習慣、常態（常配 every day）", "現在進行式：此刻正在做（be + V-ing）", "關鍵字提示：always / now"],
  frames: [
    { step: "步驟 1：吃飯兩種說法", id: 1, caption: "嗨！英文裡「吃飯」有兩種說法，用錯就會讓人誤會。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：簡單式表習慣", id: 2, caption: "I eat breakfast at 7. ——這是「習慣」：每天七點吃早餐，講的是常態。", action: "point", prop: { kind: "text", text: "I eat breakfast at 7.", sub: "現在簡單式：習慣、常態", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：every day關鍵字", id: 3, caption: "現在簡單式常出現這些關鍵字：every day、usually、always、on Sundays。", ask: { prompt: "「I ___ breakfast at 7 every day.」空格要用？", options: ["eat", "am eating", "ate", "eating"], answer: 0, hint: "every day 是習慣，用現在簡單式。" }, action: "think", prop: { kind: "text", text: "every day / usually / always", sub: "看到這些就是「習慣」→ 現在簡單式", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：進行式表正在", id: 4, caption: "I am eating breakfast now. ——這是「正在做」：說話的這一刻正在吃。", action: "walk", prop: { kind: "text", text: "I am eating breakfast now.", sub: "現在進行式：此刻正在做", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：be加V-ing公式", id: 5, caption: "現在進行式的公式很固定：be 動詞（am / is / are）＋ 動詞-ing。", ask: { prompt: "現在進行式的結構是？", options: ["主詞 + 原形動詞", "be 動詞 + V-ing", "主詞 + V-ed", "will + 原形動詞"], answer: 1, hint: "一定要有 be 動詞，動詞要加 -ing。" }, action: "jump", prop: { kind: "balance", left: "am / is / are", right: "＋ V-ing", tip: "I am / He is / They are" }, duration: 3800 },
    { step: "步驟 6：now等提示語", id: 6, caption: "現在進行式常出現 now、right now、at the moment、Look!、Listen! 這些提示語。", action: "point", prop: { kind: "text", text: "now / right now / Look!", sub: "看到這些就是「此刻正在」→ 現在進行式", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：記習慣與正在", id: 7, caption: "口訣：習慣用簡單式（天天做），此刻用進行式（正在做）。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "en1", prompt: "「He ___ his homework every evening.」應填入？", options: ["does", "is doing", "doing", "did"], answer: 0, hints: ["every evening 是習慣", "習慣用現在簡單式"], explanation: "every evening 表示習慣，用現在簡單式 does。" },
    { id: "en2", prompt: "「Look! It ___ outside.」空格要用？", options: ["rains", "is raining", "rain", "rained"], answer: 1, hints: ["Look! 表示此刻正在發生", "正在做要用 be + V-ing"], explanation: "Look! 提示當下正在發生，用現在進行式 is raining。" },
    { id: "en3", prompt: "現在進行式的正確結構是？", options: ["主詞 + V-ing", "be 動詞 + V-ing", "主詞 + 原形動詞", "will + V"], answer: 1, hints: ["不能少了 be 動詞", "動詞要加 -ing"], explanation: "現在進行式 = be 動詞（am/is/are）＋ V-ing。" },
    { id: "en4", prompt: "「They are playing basketball now.」這句屬於哪個時態？", options: ["現在簡單式", "現在進行式", "過去式", "未來式"], answer: 1, hints: ["有 are + playing", "now 表示此刻"], explanation: "are playing 是 be + V-ing，加上 now，是現在進行式。" },
    { id: "en5", prompt: "「She usually ___ to school by bus.」空格要用？", options: ["goes", "is going", "going", "go"], answer: 0, hints: ["usually 表示習慣", "主詞是第三人稱單數，動詞要加 s"], explanation: "usually 是習慣，用現在簡單式；She 是第三人稱單數，動詞加 es → goes。" },
  ],
};

/* ========================================================================
 * 課程 23：數學（國小）— 圓周率與圓面積
 * ======================================================================== */
export const CIRCLE_AREA_LESSON: OnionLesson = {
  id: "circle-area",
  title: "圓面積與圓周率：π 是怎麼來的？",
  subject: "數學",
  topic: "圓周率與圓面積",
  grade: "六下",
  stages: ["國小"],
  desc: "不管圓多大，周長除以直徑都是 3.14…這個神奇的數字就是 π。洋蔥用它推出圓面積公式。",
  takeaways: ["圓周率 π ≈ 3.14 = 周長 ÷ 直徑", "周長 = 直徑 × π", "面積 = 半徑 × 半徑 × π"],
  frames: [
    { step: "步驟 1：圓藏著π", id: 1, caption: "嗨！不管是大圓還是小圓，藏著一個永遠不變的數字——它就是 π。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：周長除直徑得π", id: 2, caption: "量量看：把圓的周長除以直徑，答案永遠大約是 3.14，這就是圓周率 π。", ask: { prompt: "圓周率 π 是怎麼算出來的？", options: ["周長 ÷ 直徑", "直徑 ÷ 周長", "半徑 × 2", "面積 ÷ 2"], answer: 0, hint: "周長大約是直徑的 3.14 倍。" }, action: "point", prop: { kind: "text", text: "π = 周長 ÷ 直徑 ≈ 3.14", sub: "不管圓多大，這個比值都一樣", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：周長等直徑乘π", id: 3, caption: "所以反過來：周長 = 直徑 × π。直徑 10 公分的圓，周長約 31.4 公分。", action: "walk", prop: { kind: "balance", left: "直徑 10 × 3.14", right: "周長 31.4", tip: "單位：公分" }, duration: 3600 },
    { step: "步驟 4：半徑是直徑一半", id: 4, caption: "半徑是直徑的一半：直徑 10，半徑就是 5。面積公式用的是半徑。", ask: { prompt: "直徑 10 公分的圓，半徑是多少？", options: ["10 公分", "5 公分", "20 公分", "3.14 公分"], answer: 1, hint: "半徑是直徑的一半。" }, action: "think", prop: { kind: "shape", shape: "circle", base: 10, height: 5, label: "直徑 10 ‧ 半徑 5" }, duration: 3600 },
    { step: "步驟 5：圓面積公式", id: 5, caption: "圓面積 = 半徑 × 半徑 × π。半徑 5 的圓：5 × 5 × 3.14 = 78.5 平方公分。", action: "jump", prop: { kind: "text", text: "5 × 5 × 3.14 = 78.5", sub: "面積 = 半徑 × 半徑 × π", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：扇形拼長方形", id: 6, caption: "為什麼？把圓切成很多小扇形再拼起來，會接近一個長方形：長是半周長、寬是半徑。", action: "point", prop: { kind: "flow", steps: ["切成扇形", "拼成長方形", "長 × 寬 = 面積"], active: 2 }, duration: 3600 },
    { step: "步驟 7：記周長面積口訣", id: 7, caption: "口訣：周長＝直徑×π，面積＝半徑×半徑×π。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ca1", prompt: "圓周率 π 代表的比值是？", options: ["周長 ÷ 直徑", "直徑 ÷ 周長", "面積 ÷ 周長", "半徑 ÷ 直徑"], answer: 0, hints: ["周長大概是直徑的幾倍", "這個倍數就是 π"], explanation: "π = 周長 ÷ 直徑，約等於 3.14。" },
    { id: "ca2", prompt: "直徑 6 公分的圓，周長約是多少？（π ≈ 3.14）", options: ["9.42 公分", "18.84 公分", "37.68 公分", "6 公分"], answer: 1, hints: ["周長 = 直徑 × π", "6 × 3.14 = ?"], explanation: "6 × 3.14 = 18.84 公分。" },
    { id: "ca3", prompt: "半徑 4 公分的圓，面積約是多少？（π ≈ 3.14）", options: ["12.56", "25.12", "50.24", "16"], answer: 2, hints: ["面積 = 半徑 × 半徑 × π", "4 × 4 × 3.14 = ?"], explanation: "4 × 4 × 3.14 = 50.24 平方公分。" },
    { id: "ca4", prompt: "圓的半徑變成原來的 2 倍，面積會變成幾倍？", options: ["2 倍", "4 倍", "8 倍", "不變"], answer: 1, hints: ["面積用的是半徑 × 半徑", "2 × 2 = ?"], explanation: "面積與半徑平方成正比，半徑 2 倍、面積變成 4 倍。" },
    { id: "ca5", prompt: "直徑 10 公分的圓，半徑與周長分別約是多少？", options: ["半徑 5，周長 31.4", "半徑 10，周長 31.4", "半徑 5，周長 15.7", "半徑 20，周長 62.8"], answer: 0, hints: ["半徑是直徑的一半 = 5", "周長 = 10 × 3.14 = 31.4"], explanation: "半徑 5 公分，周長 10 × 3.14 = 31.4 公分。" },
  ],
};

/* ========================================================================
 * 課程 24：國語（國小）— 把字句與被字句
 * ======================================================================== */
export const BA_BEI_LESSON: OnionLesson = {
  id: "ba-bei",
  title: "把字句與被字句：主角換人做做看",
  subject: "國語",
  topic: "句型轉換",
  grade: "四下",
  stages: ["國小"],
  desc: "「我吃掉了蛋糕」改成「我把蛋糕吃掉了」和「蛋糕被我吃掉了」，主角換了，意思卻一樣。",
  takeaways: ["把字句：主動者當主角（A 把 B 怎麼了）", "被字句：承受者當主角（B 被 A 怎麼了）", "互換時動詞不動，只換主詞位置"],
  frames: [
    { step: "步驟 1：三種句子講", id: 1, caption: "嗨！同一件事可以用三種句子講，今天學「把字句」和「被字句」。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：基本句主動", id: 2, caption: "基本句：我吃掉了蛋糕。主角是「我」，動作是「吃掉了」，對象是「蛋糕」。", action: "point", prop: { kind: "text", text: "我 吃掉了 蛋糕", sub: "主角 動作 對象", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：把字句主動者", id: 3, caption: "把字句：把「對象」提前到動作前面——我把蛋糕吃掉了。主角還是「我」。", ask: { prompt: "「我把蛋糕吃掉了」的主角是誰？", options: ["蛋糕", "我", "吃", "沒有主角"], answer: 1, hint: "「我」是做出動作的人。" }, action: "think", prop: { kind: "text", text: "我把蛋糕吃掉了", sub: "把字句：主動者是主角", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：被字句承受者", id: 4, caption: "被字句：改讓「對象」當主角——蛋糕被我吃掉了。", action: "walk", prop: { kind: "text", text: "蛋糕被我吃掉了", sub: "被字句：承受者是主角", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：兩句意思同", id: 5, caption: "兩句意思一樣，只是「鏡頭」不同：把字句看主動者，被字句看承受者。", ask: { prompt: "「小狗咬破了鞋子」改成被字句是？", options: ["小狗把鞋子咬破了", "鞋子被小狗咬破了", "鞋子咬破了小狗", "小狗被鞋子咬破了"], answer: 1, hint: "被字句要讓「鞋子」當主角。" }, action: "jump", prop: { kind: "balance", left: "小狗把鞋子咬破了", right: "鞋子被小狗咬破了", tip: "意思相同，主角不同" }, duration: 3800 },
    { step: "步驟 6：轉換口訣", id: 6, caption: "轉換口訣：把字句＝A 把 B 怎麼了；被字句＝B 被 A 怎麼了。動詞永遠不改。", action: "point", prop: { kind: "flow", steps: ["A 把 B", "動作不變", "B 被 A"], active: 1 }, duration: 3600 },
    { step: "步驟 7：記主動被動口訣", id: 7, caption: "口訣：主動用把、被動用被；動詞不動，只換主角。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "bb1", prompt: "「我把功課寫完了」改成被字句是？", options: ["功課被我寫完了", "我把功課寫完了", "我寫完了功課", "功課把我寫完了"], answer: 0, hints: ["被字句要讓「功課」當主角", "結構是 B 被 A 怎麼了"], explanation: "「功課被我寫完了」——功課當主角，是被字句。" },
    { id: "bb2", prompt: "「窗戶被風吹破了」是把字句還是被字句？", options: ["把字句", "被字句", "都不是", "疑問句"], answer: 1, hints: ["句子裡有「被」", "窗戶是承受動作的一方"], explanation: "有「被」字且承受者當主角，是被字句。" },
    { id: "bb3", prompt: "「妹妹把花瓶打破了」，動作（動詞）是什麼？", options: ["妹妹", "花瓶", "打破了", "把"], answer: 2, hints: ["誰做了什麼", "打破是這個句子裡的動作"], explanation: "「打破了」是這句的動作（動詞）。" },
    { id: "bb4", prompt: "「蛋糕被弟弟吃光了」改成把字句是？", options: ["弟弟把蛋糕吃光了", "蛋糕把弟弟吃光了", "弟弟吃光了蛋糕", "蛋糕被吃光了"], answer: 0, hints: ["把字句要讓「弟弟」當主角", "結構是 A 把 B 怎麼了"], explanation: "「弟弟把蛋糕吃光了」——弟弟當主角，是把字句。" },
    { id: "bb5", prompt: "把字句與被字句互換時，哪一個部分「一定不能改」？", options: ["主詞", "動詞（動作）", "句子的長度", "標點符號"], answer: 1, hints: ["換的是誰當主角", "發生的事本身沒變"], explanation: "互換只換主角位置，動作（動詞）保持不變。" },
  ],
};

/* ========================================================================
 * 課程 25：數學（國小）— 認識時刻與時間計算
 * 用長條圖比較「時間長度」、用流程圖講讀法與經過時間。
 * ======================================================================== */
export const TIME_TELLING_LESSON: OnionLesson = {
  id: "time-telling",
  title: "認識時刻與時間計算",
  subject: "數學",
  topic: "認識時刻與時間計算",
  grade: "三下",
  stages: ["國小"],
  desc: "短針看時、長針看分，1 小時是 60 分。洋蔥教你讀幾點幾分，再算經過多久。",
  takeaways: ["時針走 1 大格＝1 小時；分針繞 1 圈＝1 小時", "短針看「時」、長針看「分」，合起來是幾點幾分", "經過時間＝結束時刻 − 開始時刻"],
  frames: [
    { step: "步驟 1：時針分針認", id: 1, caption: "嗨！時鐘上有兩根針：短的是時針、長的是分針，你認得嗎？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：一小時是60分", id: 2, caption: "時針走 1 大格是 1 小時；分針繞一整圈剛好也是 1 小時，兩根針會在 1 小時後重合。", action: "point", prop: { kind: "text", text: "時針 1 大格 = 分針 1 圈 = 1 小時", sub: "短針慢、長針快，一小時同步一次", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：1小時半小時比", id: 3, caption: "1 小時有 60 分鐘，半小時就是 30 分。長度一樣長，只是單位不同。", action: "jump", prop: { kind: "bars", items: [{ label: "1 小時", value: 60 }, { label: "半小時", value: 30 }], unit: "分", active: 0 }, duration: 3600 },
    { step: "步驟 4：讀時刻方法", id: 4, caption: "讀時刻先讀時針在哪一格（時），再看分針指向幾分，合起來就是幾點幾分。", action: "think", prop: { kind: "flow", steps: ["看短針（時）", "看長針（分）", "合起來讀"], active: 1 }, duration: 3600 },
    { step: "步驟 5：3點30分怎讀", id: 5, caption: "短針過 3、長針指 12 是 3 點整；長針指 6（6×5=30）就是 3 點 30 分。", ask: { prompt: "短針在 3、長針指 6，是幾點幾分？", options: ["3 點 6 分", "3 點 30 分", "6 點 3 分", "3 點 15 分"], answer: 1, hint: "長針指 6 表示 30 分（6×5=30）。" }, action: "point", prop: { kind: "text", text: "3 點 30 分", sub: "短針過 3、長針指 6", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：經過時間用減", id: 6, caption: "經過時間＝結束 − 開始：9:00 到 9:40 經過 40 分鐘；9:00 到 10:10 則經過 70 分鐘。", ask: { prompt: "從 9:00 到 9:40，經過幾分鐘？", options: ["30 分", "40 分", "50 分", "1 小時"], answer: 1, hint: "結束減開始：40 分 − 0 分 ＝ 40 分。" }, action: "walk", prop: { kind: "bars", items: [{ label: "到 9:40", value: 40 }, { label: "到 10:10", value: 70 }], unit: "分", active: 0 }, duration: 3600 },
    { step: "步驟 7：記短針長針口訣", id: 7, caption: "口訣：短針看時、長針看分；經過時間用減法。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "tt1", prompt: "1 小時等於幾分鐘？", options: ["30 分", "60 分", "100 分", "12 分"], answer: 1, hints: ["時針走 1 大格是 1 小時", "分針繞一圈 = 60 分"], explanation: "1 小時 = 60 分鐘。" },
    { id: "tt2", prompt: "時鐘上短針表示的是什麼？", options: ["分", "時", "秒", "天"], answer: 1, hints: ["短針走得慢", "它告訴你現在幾點"], explanation: "短針是時針，指「時」；長針才是分針。" },
    { id: "tt3", prompt: "長針指 6，表示幾分？", options: ["6 分", "30 分", "60 分", "12 分"], answer: 1, hints: ["長針每大格 = 5 分", "6 × 5 = 30"], explanation: "長針每大格 5 分，指 6 就是 6×5 = 30 分。" },
    { id: "tt4", prompt: "短針在 2、長針在 12，是幾點？", options: ["2 點整", "12 點 2 分", "2 點 12 分", "2 點 30 分"], answer: 0, hints: ["長針指 12 就是整點", "短針在 2 就是 2 時"], explanation: "長針指 12 是整點，短針在 2，所以是 2 點整。" },
    { id: "tt5", prompt: "從 8:10 到 8:35，經過幾分鐘？", options: ["25 分", "15 分", "45 分", "35 分"], answer: 0, hints: ["結束 − 開始", "35 − 10 = 25"], explanation: "經過時間＝結束 − 開始：35 − 10 = 25 分鐘。" },
  ],
};

/* ========================================================================
 * 課程 26：數學（國小）— 角度的種類
 * 用量角器的觀念＋長條圖比大小，區分銳角、直角、鈍角、平角。
 * ======================================================================== */
export const ANGLE_TYPES_LESSON: OnionLesson = {
  id: "angle-types",
  title: "角度的種類：銳角、直角、鈍角",
  subject: "數學",
  topic: "角度的種類",
  grade: "四下",
  stages: ["國小"],
  desc: "角其實有名字：小於 90 度是銳角、等於 90 是直角、介於 90~180 是鈍角。洋蔥用量角器幫你分。",
  takeaways: ["銳角：小於 90 度（尖尖的）", "直角：等於 90 度（方方的）", "鈍角：大於 90、小於 180 度；平角 = 180 度"],
  frames: [
    { step: "步驟 1：角有名字", id: 1, caption: "嗨！書本的角、三角板的角都有名字，今天我們來把角分一分類。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識角的組成", id: 2, caption: "角是由兩條線共用一個端點（頂點）形成的，用量角器能量出它的「度數」。", action: "point", prop: { kind: "text", text: "角 = 兩條射線 ＋ 1 個頂點", sub: "度數用量角器測量", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：比三種角度", id: 3, caption: "比一比：銳角尖尖的只有 45 度，直角方方的 90 度，鈍角張開更大到 135 度。", action: "jump", prop: { kind: "bars", items: [{ label: "銳角", value: 45 }, { label: "直角", value: 90 }, { label: "鈍角", value: 135 }], unit: "度", active: 0 }, duration: 3600 },
    { step: "步驟 4：直角是90度", id: 4, caption: "直角剛好 90 度，像正方形、長方形、三角板的角都是直角，可以用 L 型比對。", action: "think", prop: { kind: "text", text: "直角 = 90°", sub: "正方形、長方形的角都是直角", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：鈍角介於中", id: 5, caption: "鈍角比直角大、比平角小：大於 90 度、小於 180 度，像打開的扇子。", ask: { prompt: "一個角有 120 度，它是哪一種角？", options: ["銳角", "直角", "鈍角", "平角"], answer: 2, hint: "120 大於 90、小於 180，是鈍角。" }, action: "point", prop: { kind: "text", text: "鈍角：90° < 角度 < 180°", sub: "比直角大、比平角小", tone: "warn" }, duration: 3800 },
    { step: "步驟 6：平角是180度", id: 6, caption: "平角是直角的兩倍：兩條邊拉成一條直線，等於 180 度。", ask: { prompt: "平角是直角的幾倍？", options: ["1 倍", "2 倍", "3 倍", "4 倍"], answer: 1, hint: "180 ÷ 90 = 2。" }, action: "walk", prop: { kind: "bars", items: [{ label: "直角", value: 90 }, { label: "平角", value: 180 }], unit: "度", active: 1 }, duration: 3600 },
    { step: "步驟 7：記角度分類口訣", id: 7, caption: "口訣：小於 90 銳角、等於 90 直角、90~180 鈍角。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "at1", prompt: "幾度叫做直角？", options: ["45 度", "90 度", "180 度", "60 度"], answer: 1, hints: ["正方形、長方形的角都是", "量角器量剛好一半"], explanation: "直角等於 90 度。" },
    { id: "at2", prompt: "一個角是 70 度，它屬於？", options: ["銳角", "直角", "鈍角", "平角"], answer: 0, hints: ["銳角小於 90 度", "70 比 90 小"], explanation: "小於 90 度的角是銳角，70 度 < 90 度所以是銳角。" },
    { id: "at3", prompt: "下列哪一個角最大？", options: ["銳角 45 度", "直角 90 度", "鈍角 120 度", "它們一樣大"], answer: 2, hints: ["鈍角大於直角", "120 > 90 > 45"], explanation: "鈍角大於 90 度，120 度比直角和銳角都大。" },
    { id: "at4", prompt: "平角是多少度？", options: ["90 度", "180 度", "360 度", "45 度"], answer: 1, hints: ["兩條邊成一直線", "是直角的兩倍"], explanation: "平角的兩邊成一直線，等於 180 度。" },
    { id: "at5", prompt: "用量角器量角時，中心點要對準哪裡？", options: ["邊的中間", "頂點", "任意位置", "線的末端"], answer: 1, hints: ["頂點是兩條邊的交點", "對準頂點才能量準"], explanation: "量角器的中心點要對準角的頂點，才能正確讀出度數。" },
  ],
};

/* ========================================================================
 * 課程 27：自然（國小）— 植物的根莖葉
 * 用流程圖分工、循環圖串起合作關係。
 * ======================================================================== */
export const PLANT_PARTS_LESSON: OnionLesson = {
  id: "plant-parts",
  title: "植物的根莖葉：各司其職",
  subject: "自然",
  topic: "植物的根莖葉",
  grade: "四上",
  stages: ["國小"],
  desc: "根是腳、莖是水管、葉是食物工廠。洋蔥帶你看植物怎麼分工合作長大。",
  takeaways: ["根：固定植物並從土壤吸收水分和養分", "莖：支撐植物並運輸水分", "葉：進行光合作用製造養分"],
  frames: [
    { step: "步驟 1：根莖葉分工", id: 1, caption: "嗨！一株植物從頭到腳分成根、莖、葉，它們各有工作，今天來認識它們。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：根固定吸水", id: 2, caption: "根是植物的腳：把自己固定在土裡，還從土壤中吸收水分和養分。", action: "point", prop: { kind: "flow", steps: ["根（固定＋吸水）", "莖（支撐＋運輸）", "葉（光合作用）"], active: 0 }, duration: 3600 },
    { step: "步驟 3：莖支撐運輸", id: 3, caption: "莖像輸送管：把根吸到的水往上送，還支撐植物站直、不會倒下來。", ask: { prompt: "植物進行光合作用的部位是哪一個？", options: ["根", "莖", "葉", "花"], answer: 2, hint: "葉子是食物的工廠。" }, action: "think", prop: { kind: "flow", steps: ["根（固定＋吸水）", "莖（支撐＋運輸）", "葉（光合作用）"], active: 1 }, duration: 3600 },
    { step: "步驟 4：葉做食物", id: 4, caption: "葉是食物的工廠：用陽光把水和二氧化碳做成養分，這就是光合作用。", action: "jump", prop: { kind: "flow", steps: ["根（固定＋吸水）", "莖（支撐＋運輸）", "葉（光合作用）"], active: 2 }, duration: 3600 },
    { step: "步驟 5：三部位合作", id: 5, caption: "三個部位合作：根供水、莖送水、葉做食物，缺一不可。", ask: { prompt: "植物靠哪個部位從土裡吸收水分？", options: ["根", "莖", "葉", "花"], answer: 0, hint: "根在土壤中，負責吸水。" }, action: "point", prop: { kind: "cycle", nodes: ["根：固定吸水", "莖：支撐運輸", "葉：光合作用"], active: 0 }, duration: 3800 },
    { step: "步驟 6：循環根莖葉", id: 6, caption: "看這個循環：根吸水 → 莖運送 → 葉製造，養分再供全身，合作無間。", action: "walk", prop: { kind: "cycle", nodes: ["根：固定吸水", "莖：支撐運輸", "葉：光合作用"], active: 2 }, duration: 3600 },
    { step: "步驟 7：記根深莖直口訣", id: 7, caption: "口訣：根深、莖直、葉光合，分工合作長得好。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "pp1", prompt: "植物用哪個部位吸收水分？", options: ["葉", "莖", "根", "花"], answer: 2, hints: ["在土壤裡的那個部位", "負責吸水"], explanation: "根在土中吸收水分和養分。" },
    { id: "pp2", prompt: "莖的主要功能不包括下列哪一項？", options: ["支撐植物", "運輸水分", "進行光合作用", "連接根和葉"], answer: 2, hints: ["光合作用在葉子進行", "莖是管子和支柱"], explanation: "光合作用是葉子的功能，莖負責支撐與運輸。" },
    { id: "pp3", prompt: "葉子進行光合作用，需要什麼？", options: ["只有水", "水和陽光", "只有土壤", "只有空氣"], answer: 1, hints: ["葉是食物工廠", "陽光提供能量"], explanation: "葉子利用陽光把水和二氧化碳轉成養分，需要水和陽光。" },
    { id: "pp4", prompt: "根除了吸收水分，還有什麼作用？", options: ["製造養分", "把植物固定在土裡", "進行呼吸", "開花結果"], answer: 1, hints: ["根是植物的腳", "固定才不會被風吹倒"], explanation: "根能把植物固定在土壤中，使其站穩。" },
    { id: "pp5", prompt: "下列哪一種說法正確？", options: ["根莖葉各司其職、互相合作", "只有葉子重要", "莖不重要", "根會進行光合作用"], answer: 0, hints: ["三個部位缺一不可", "合作才能存活"], explanation: "根、莖、葉各有功能並互相合作，共同維持植物生長。" },
  ],
};

/* ========================================================================
 * 課程 28：社會（國小）— 台灣的位置與地形
 * 用字卡、流程圖與長條圖（地形高度比較）認識家園。
 * ======================================================================== */
export const TAIWAN_GEO_LESSON: OnionLesson = {
  id: "taiwan-geo",
  title: "台灣的位置與地形",
  subject: "社會",
  topic: "台灣的位置與地形",
  grade: "五上",
  stages: ["國小"],
  desc: "台灣在東亞島鏈、北回歸線穿過，有五大地形，而且山地多、平原少。洋蔥用地圖帶你認識。",
  takeaways: ["台灣位於東亞島鏈，在福建東南方", "北回歸線通過中南部，是熱帶亞熱帶分界", "五大地形：平原、丘陵、台地、盆地、山地；山地最多、平原最少"],
  frames: [
    { step: "步驟 1：認識家園台灣", id: 1, caption: "嗨！我們住的台灣在哪裡？有什麼地形？今天就用地圖來認識我們的家園。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：台灣在東南", id: 2, caption: "台灣位於東亞的島鏈上，在福建的東南方，四面環海，是個海島。", action: "point", prop: { kind: "text", text: "台灣：東亞島鏈、福建東南", sub: "四面環海的海島", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：北回歸線通過", id: 3, caption: "北回歸線從台灣中南部穿過，把台灣分成熱帶（南）和亞熱帶（北）。", ask: { prompt: "北回歸線通過台灣的哪裡？", options: ["北部", "中南部", "東部海面", "沒有通過"], answer: 1, hint: "通過嘉義、花蓮一帶的中南部。" }, action: "think", prop: { kind: "flow", steps: ["北回歸線通過", "中南部", "熱帶／亞熱帶分界"], active: 1 }, duration: 3600 },
    { step: "步驟 4：五大地形", id: 4, caption: "台灣有五大地形：平原、丘陵、台地、盆地、山地，各有不同的高度和樣子。", action: "jump", prop: { kind: "text", text: "五大地形：平原／丘陵／台地／盆地／山地", sub: "地形種類多樣", tone: "ok" }, duration: 3800 },
    { step: "步驟 5：山地最多", id: 5, caption: "地形比一比：山地高高在上約 2000 公尺，丘陵約 500，平原只有幾十公尺。台灣山地佔最多。", ask: { prompt: "台灣面積最大的是哪一種地形？", options: ["平原", "丘陵", "山地", "盆地"], answer: 2, hint: "中央山脈縱貫，山地佔一半以上。" }, action: "point", prop: { kind: "bars", items: [{ label: "山地", value: 2000 }, { label: "丘陵", value: 500 }, { label: "平原", value: 50 }], unit: "公尺", active: 0 }, duration: 3800 },
    { step: "步驟 6：人口集中平原", id: 6, caption: "因為山地多、平原少，所以大多數人住在很少的平原上，城市也多在平原。", action: "walk", prop: { kind: "flow", steps: ["山地多", "平原少", "人口集中在平原"], active: 2 }, duration: 3600 },
    { step: "步驟 7：記島鏈地形口訣", id: 7, caption: "口訣：島鏈東南、北回歸線、五地形、山多平原少。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "tg1", prompt: "台灣位於哪裡？", options: ["東亞島鏈、福建東南", "歐洲", "非洲", "南極"], answer: 0, hints: ["是個海島", "在亞洲東邊"], explanation: "台灣位於東亞島鏈，在福建（中國東南）的外海東南方。" },
    { id: "tg2", prompt: "北回歸線通過台灣的哪裡？", options: ["北部", "中南部", "東部", "沒有通過"], answer: 1, hints: ["它把台灣分成熱帶亞熱帶", "通過嘉義、花蓮一帶"], explanation: "北回歸線通過台灣中南部，是熱帶與亞熱帶的分界。" },
    { id: "tg3", prompt: "下列哪一項不是台灣五大地形之一？", options: ["平原", "山地", "丘陵", "高原"], answer: 3, hints: ["五大地形不含高原", "是平原丘陵台地盆地山地"], explanation: "台灣五大地形為平原、丘陵、台地、盆地、山地，沒有高原。" },
    { id: "tg4", prompt: "台灣地形以哪一種佔最多面積？", options: ["平原", "山地", "盆地", "台地"], answer: 1, hints: ["山脈縱貫中央", "山地佔約一半以上"], explanation: "台灣中央山脈縱貫，山地佔全島面積一半以上，是最多的地形。" },
    { id: "tg5", prompt: "為什麼台灣人口大多集中在平原？", options: ["平原風景最美", "山地多平原少，平原適合居住農耕", "平原比較冷", "法律規定"], answer: 1, hints: ["平原少但平坦", "適合耕作與居住"], explanation: "台灣山地多、平原少，而平原地勢平坦、適合農耕與居住，所以人口集中。" },
  ],
};

/* ========================================================================
 * 課程 29：國語（國小）— 近義詞與反義詞
 * 用字卡與天平（兩詞對照）區分意思相近與相反。
 * ======================================================================== */
export const SYNONYM_ANTONYM_LESSON: OnionLesson = {
  id: "synonym-antonym",
  title: "近義詞與反義詞",
  subject: "國語",
  topic: "近義詞與反義詞",
  grade: "四上",
  stages: ["國小"],
  desc: "意思相近叫近義詞（開心／高興），意思相反叫反義詞（冷／熱）。洋蔥教你從上下文判斷。",
  takeaways: ["近義詞：意思相近，可互相替換（開心 ≈ 高興）", "反義詞：意思相反（冷 ↔ 熱）", "可從上下文判斷詞意是相近還是相反"],
  frames: [
    { step: "步驟 1：近義反義詞", id: 1, caption: "嗨！有些詞意思很像，有些詞意思恰恰相反，今天學近義詞和反義詞。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：開心高興近義", id: 2, caption: "「開心」和「高興」都表示快樂，意思相近，放在句子裡差不多，這叫近義詞。", ask: { prompt: "「開心」和「高興」意思相近，稱為？", options: ["反義詞", "近義詞", "諧音詞", "成語"], answer: 1, hint: "意思相近就是近義詞。" }, action: "point", prop: { kind: "text", text: "開心 ≈ 高興", sub: "意思相近，可互相替換", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：天平看近義", id: 3, caption: "這兩個詞在天平兩端平衡：意思差不多，只是說法不同，可以互換。", action: "think", prop: { kind: "balance", left: "開心", right: "高興", tip: "意思相近，可以互相替換" }, duration: 3600 },
    { step: "步驟 4：冷熱意思相反", id: 4, caption: "「冷」和「熱」、「大」和「小」意思完全相反，這叫反義詞。", action: "jump", prop: { kind: "text", text: "冷 ↔ 熱　大 ↔ 小", sub: "意思相反，就是反義詞", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：天平看反義", id: 5, caption: "再看天平：冷和熱在兩端對立，意思相反，不能互換。", ask: { prompt: "下列哪一组是反義詞？", options: ["開心／高興", "冷／熱", "美麗／漂亮", "快樂／歡喜"], answer: 1, hint: "冷和熱意思相反。" }, action: "point", prop: { kind: "balance", left: "冷", right: "熱", tip: "意思相反" }, duration: 3600 },
    { step: "步驟 6：從上下文判斷", id: 6, caption: "還可以從上下文判斷：同一段話裡，意思靠近是近義、意思對立是反義。", action: "walk", prop: { kind: "text", text: "看上下文：相近 or 相反", sub: "同一句中推敲詞意關係", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：記近義反義口訣", id: 7, caption: "口訣：意思近是近義詞、意思反是反義詞。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sa1", prompt: "「開心」和「高興」是什麼關係？", options: ["近義詞", "反義詞", "沒關係", "同音詞"], answer: 0, hints: ["兩者都表示快樂", "意思相近"], explanation: "開心和高興意思相近，是近義詞。" },
    { id: "sa2", prompt: "下列哪一组是反義詞？", options: ["美麗／漂亮", "冷／熱", "快樂／歡喜", "安靜／寧靜"], answer: 1, hints: ["冷和熱意思相反", "其他都是相近"], explanation: "冷和熱意思相反，是反義詞；其餘都是近義詞。" },
    { id: "sa3", prompt: "「黑暗」的反義詞最有可能是？", options: ["明亮", "漆黑", "陰影", "夜晚"], answer: 0, hints: ["反義詞要意思相反", "黑暗對光亮"], explanation: "黑暗是沒有光，反義詞是明亮。" },
    { id: "sa4", prompt: "「巨大」的近義詞可以是？", options: ["龐大", "微小", "細小", "短小"], answer: 0, hints: ["巨大表示很大", "找意思相近的詞"], explanation: "巨大和龐大意思相近，都表示很大，是近義詞。" },
    { id: "sa5", prompt: "閱讀時要怎麼判斷近義或反義？", options: ["隨便猜", "看上下文的意思相近或相反", "只看第一個字", "問別人"], answer: 1, hints: ["同一段話推敲", "相近或對立來判斷"], explanation: "從上下文判斷：詞意相近為近義詞、詞意對立為反義詞。" },
  ],
};

/* ========================================================================
 * 課程 30：自然（國中）— 電流與電路
 * 用流程圖看通路／斷路／短路，用天平對照串聯並聯。
 * ======================================================================== */
/* ========================================================================
 * 課程 11.5（國小·新增）：數學 — 小數的加減、長方體的體積與容積
 * ======================================================================== */
export const DECIMAL_ADD_LESSON: OnionLesson = {
  id: "decimal-add",
  title: "小數的加減：小數點要對齊",
  subject: "數學",
  topic: "小數的加減",
  grade: "五上",
  stages: ["國小"],
  desc: "3.5 元加 2.1 元是多少？洋蔥用數線和方格帶你對齊小數點，先把小數位「疊好」再像整數一樣加減。",
  takeaways: ["小數加減要先把小數點對齊", "小數點對齊後按位數加減", "結果的小數點和原數對齊"],
  frames: [
    { step: "步驟 1：認識小數加法題目", id: 1, caption: "嗨！3.5 元加 2.1 元到底是多少？今天我們一起學小數的加減。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：先把小數點對齊", id: 2, caption: "關鍵第一步：把兩個小數的小數點上下對齊，位數才不會錯。", action: "point", prop: { kind: "text", text: "3.5 ＋ 2.1", sub: "小數點一定要對齊", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：照位數分別相加", id: 3, caption: "對齊後，整數加整數、十分位加十分位：3＋2、0.5＋0.1。", action: "think", prop: { kind: "text", text: "3.5 ＋ 2.1 = 5.6", sub: "整數位與小數位分開加", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：用數線驗算", id: 4, caption: "從 3.5 往右走 2.1 格，停在 5.6，和算的一樣！", ask: { prompt: "3.5 ＋ 2.1 等於多少？", options: ["5.6", "5.05", "5.15", "6.6"], answer: 0, hint: "小數點對齊後 3+2、0.5+0.1。" }, action: "walk", prop: { kind: "numberLine", from: 3, to: 6, marks: [{ at: 3.5, label: "起點", tone: "ok" }, { at: 5.6, label: "終點", tone: "ok" }], cursor: 5.6 }, duration: 3800 },
    { step: "步驟 5：小數減法也對齊", id: 5, caption: "減法一樣：4.8 − 1.3，小數點對齊後 4−1、0.8−0.3 = 3.5。", action: "point", prop: { kind: "text", text: "4.8 − 1.3 = 3.5", sub: "小數點對齊再相減", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：退位要注意", id: 6, caption: "小心退位：5.2 − 3.7，2 減 7 不夠，向 5 借 1 當 10。", ask: { prompt: "5.2 − 3.7 等於多少？", options: ["1.5", "2.5", "1.9", "2.1"], answer: 0, hint: "十分位 2 減 7 不夠，向整數借 1。" }, action: "think", prop: { kind: "text", text: "5.2 − 3.7 = 1.5", sub: "不夠減要向整數位借位", tone: "warn" }, duration: 3800 },
    { step: "步驟 7：記小數點對齊口訣", id: 7, caption: "口訣：小數點對齊，像整數一樣加減。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "da1", prompt: "3.2 ＋ 4.5 等於多少？", options: ["7.7", "7.2", "8.7", "7.5"], answer: 0, hints: ["小數點對齊，3+4、0.2+0.5", "=7.7"], explanation: "小數點對齊後 3+4=7、0.2+0.5=0.7，得 7.7。" },
    { id: "da2", prompt: "6.8 − 2.3 等於多少？", options: ["4.5", "4.1", "5.5", "3.5"], answer: 0, hints: ["小數點對齊，6−2、0.8−0.3", "=4.5"], explanation: "對齊後 6−2=4、0.8−0.3=0.5，得 4.5。" },
    { id: "da3", prompt: "小數加減時，最重要的第一步是？", options: ["把數字排好", "小數點對齊", "先算整數", "隨便加"], answer: 1, hints: ["不對齊位數會算錯", "對齊才不會把十分位加錯"], explanation: "小數加減必須先讓小數點上下對齊，位數才不會錯。" },
    { id: "da4", prompt: "5.2 − 3.7 等於多少？", options: ["1.5", "2.5", "1.9", "3.5"], answer: 0, hints: ["十分位不夠減要借位", "12−7=5，整數 4−3=1"], explanation: "5.2−3.7，十分位 2 減 7 不夠，向 5 借 1 成 12−7=5；整數 4−3=1，得 1.5。" },
    { id: "da5", prompt: "1.4 ＋ 0.6 等於多少？", options: ["1.10", "2.0", "1.0", "0.20"], answer: 1, hints: ["0.4+0.6=1.0 進位", "1+0+1=2"], explanation: "1.4+0.6，十分位 4+6=10 進 1，整數 1+0+1=2，得 2.0。" },
  ],
};

export const CUBOID_VOLUME_LESSON: OnionLesson = {
  id: "cuboid-volume",
  title: "長方體的體積與容積",
  subject: "數學",
  topic: "長方體的體積與容積",
  grade: "五下",
  stages: ["國小"],
  desc: "一個鞋盒能裝多少？洋蔥用堆小 cube 的方式，帶你從「長×寬×高」推出體積，再區分體積和容積。",
  takeaways: ["長方體體積 = 長×寬×高", "體積單位是立方公分等", "容器內部能裝多少是容積"],
  frames: [
    { step: "步驟 1：鞋盒大小的問題", id: 1, caption: "嗨！這個長方體鞋盒，到底佔多大空間？今天學體積。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：用立方公分堆", id: 2, caption: "先想：1 個 1 立方公分的小方塊，是體積的最小單位。", action: "point", prop: { kind: "text", text: "1 立方公分 (cm³)", sub: "體積的最小方塊", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：一排有幾個", id: 3, caption: "底下一排擺 5 個，正面寬 3 個，一層就是 5×3 = 15 個。", action: "think", prop: { kind: "text", text: "一層：長5 × 寬3 = 15", sub: "底層排滿的小方塊數", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：疊幾層", id: 4, caption: "高度疊 2 層，總共 15 × 2 = 30 個小方塊，體積就是 30 立方公分。", ask: { prompt: "長5、寬3、高2的長方體，體積多少？", options: ["30", "10", "15", "60"], answer: 0, hint: "5×3×2 = 30。" }, action: "jump", prop: { kind: "bars", items: [{ label: "一層", value: 15 }, { label: "兩層", value: 30 }], unit: "個", active: 1 }, duration: 3800 },
    { step: "步驟 5：公式長乘寬乘高", id: 5, caption: "整理成公式：體積 ＝ 長 × 寬 × 高。記住三個數都要乘。", action: "point", prop: { kind: "text", text: "體積 = 長 × 寬 × 高", sub: "5 × 3 × 2 = 30 cm³", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：體積與容積", id: 6, caption: "體積是物體佔的空間；容器裡能裝多少水，叫做「容積」。", ask: { prompt: "500 立方公分的盒子，最多能裝多少水？", options: ["500 毫升", "50 毫升", "5 毫升", "5000 毫升"], answer: 0, hint: "1 立方公分 = 1 毫升。" }, action: "walk", prop: { kind: "text", text: "體積：佔的空間", sub: "容積：容器能裝多少（1 cm³ = 1 mL）", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：記長寬高相乘", id: 7, caption: "口訣：體積＝長×寬×高；容器裝的是容積。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "cv1", prompt: "長方體體積公式是？", options: ["長+寬+高", "長×寬×高", "長×寬", "(長+寬)×高"], answer: 1, hints: ["三個維度都要乘", "長寬高相乘"], explanation: "長方體體積 = 長 × 寬 × 高。" },
    { id: "cv2", prompt: "長 4、寬 3、高 2 的長方體，體積多少？", options: ["24", "9", "14", "12"], answer: 0, hints: ["4×3×2", "先 4×3=12 再×2"], explanation: "4×3×2 = 24 立方單位。" },
    { id: "cv3", prompt: "長 5、寬 3、高 2，剛算過體積 30，單位是？", options: ["平方公分", "立方公分", "公分", "毫升"], answer: 1, hints: ["體積是三維，用立方", "長寬高都乘起來"], explanation: "體積是三維空間，單位是立方公分（cm³）。" },
    { id: "cv4", prompt: "「容器能裝多少水」叫做？", options: ["體積", "容積", "重量", "面積"], answer: 1, hints: ["是內部能裝的量", "和物體佔空間不同"], explanation: "容器內部能裝的液體量叫做容積。" },
    { id: "cv5", prompt: "1 立方公分等於多少毫升？", options: ["1 毫升", "10 毫升", "100 毫升", "0.1 毫升"], answer: 0, hints: ["兩者是同一容量的不同說法", "cm³ 與 mL 相等"], explanation: "1 立方公分 (cm³) 剛好等於 1 毫升 (mL)。" },
  ],
};

export const ELECTRIC_CIRCUIT_LESSON: OnionLesson = {
  id: "electric-circuit",
  title: "電流與電路：通路、斷路、短路",
  subject: "自然",
  topic: "電流與電路",
  grade: "八上",
  stages: ["國中"],
  desc: "電燈為什麼亮？通路、斷路、短路差在哪？洋蔥用流程圖與天平帶你看串聯並聯和 V=IR。",
  takeaways: ["通路（閉合回路）燈才亮；斷路不亮；短路危險", "串聯共用一條路（一斷全斷），並聯各走分支", "電流方向慣例由電池正極出發回到負極"],
  frames: [
    { step: "步驟 1：電燈為何亮", id: 1, caption: "嗨！電燈為什麼會亮？秘密在電路。今天就來看通路、斷路和短路。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：通路閉合回路", id: 2, caption: "通路：電從電池出發，經導線繞一圈回到電池，燈就亮——這叫閉合回路。", action: "point", prop: { kind: "flow", steps: ["電池", "導線", "電燈", "形成回路"], active: 3 }, duration: 3600 },
    { step: "步驟 3：斷路不亮", id: 3, caption: "斷路：線路中有一處斷開，電走不過去，燈就不亮。", action: "think", prop: { kind: "flow", steps: ["電池", "斷開的導線", "電燈不亮"], active: 1 }, duration: 3600 },
    { step: "步驟 4：短路危險", id: 4, caption: "短路：電池正負極被導線直接相連，電流繞過電燈、又大又快，會發燙甚至危險。", ask: { prompt: "短路時電流會怎麼樣？", options: ["正常經過電燈", "繞過電燈、過大危險", "完全停止", "變得很小"], answer: 1, hint: "電池兩極直接相連，電流過大。" }, action: "jump", prop: { kind: "balance", left: "短路：電池兩極直接相連", right: "電流繞過電燈", tip: "電流過大、危險！" }, duration: 3800 },
    { step: "步驟 5：串聯並聯", id: 5, caption: "串聯是一條線串接；並聯是各走各的分支。串聯一處斷、全部停。", ask: { prompt: "兩顆電燈串聯，其中一顆壞了會怎樣？", options: ["另一顆更亮", "兩顆都不亮", "完全沒影響", "電池變大"], answer: 1, hint: "串聯是同一條路，斷一處全斷。" }, action: "point", prop: { kind: "balance", left: "串聯：元件一條線串接", right: "並聯：元件各走分支", tip: "串聯一斷全斷；並聯互不影響" }, duration: 3800 },
    { step: "步驟 6：電流方向", id: 6, caption: "電流方向：慣例上從電池正極出發，經過元件，再回到負極。", action: "walk", prop: { kind: "flow", steps: ["電池（＋ → −）", "經過電燈", "回到電池"], active: 0 }, duration: 3600 },
    { step: "步驟 7：記通路短路口訣", id: 7, caption: "口訣：通路上課、斷路下課、短路危險；串聯共路、並聯分家。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ec1", prompt: "電燈會亮的電路稱為？", options: ["斷路", "通路（閉合回路）", "短路", "開路"], answer: 1, hints: ["電要繞一圈回來", "形成完整回路才亮"], explanation: "電路完整接通、電流能循環，燈才亮，稱為通路（閉合回路）。" },
    { id: "ec2", prompt: "電池正負極被導線直接相連，會發生？", options: ["正常發光", "短路", "斷路", "沒事"], answer: 1, hints: ["電流繞過用電器", "電流過大很危險"], explanation: "電池兩極直接相連、電流繞過用電器稱為短路，電流過大會發燙危險。" },
    { id: "ec3", prompt: "兩顆電燈串聯，一顆壞了，另一顆會？", options: ["更亮", "也跟著不亮", "完全不受影響", "閃爍"], answer: 1, hints: ["串聯只有一條路", "斷一處整條斷"], explanation: "串聯元件共用同一條路徑，一處斷開整條電路就斷，兩燈都不亮。" },
    { id: "ec4", prompt: "並聯電路的特點是？", options: ["一斷全斷", "各元件有獨立分支，互不影響", "只有一條路", "電流最小"], answer: 1, hints: ["各走各的分支", "一顆壞另一顆仍亮"], explanation: "並聯中每個用電器有獨立支路，互不影響，一顆壞了其他仍正常。" },
    { id: "ec5", prompt: "習慣上，電流方向是從電池的哪裡出發？", options: ["負極", "正極", "中間", "兩極同時"], answer: 1, hints: ["電流慣例方向", "從 ＋ 到 −"], explanation: "慣例上電流方向從電池正極出發，經元件回到負極。" },
  ],
};

/* ========================================================================
 * 課程 31：自然（國中）— 力與平衡
 * 用天平講兩力平衡條件，用流程圖講合力與平衡狀態。
 * ======================================================================== */
export const FORCE_BALANCE_LESSON: OnionLesson = {
  id: "force-balance",
  title: "力與平衡：什麼時候不動？",
  subject: "自然",
  topic: "力與平衡",
  grade: "八下",
  stages: ["國中"],
  desc: "力會改變形狀或運動，但合力為零就平衡。洋蔥用天平講兩力平衡，用流程圖講靜止與等速。",
  takeaways: ["力的效應：改變形狀或改變運動狀態", "合力：同向相加、反向相減的總效果", "兩力平衡＝等大、反向、同一直線；靜止與等速都是平衡"],
  frames: [
    { step: "步驟 1：力與平衡", id: 1, caption: "嗨！力會讓東西變形或改變運動，但什麼時候物體會「平衡」？今天來看力與平衡。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：力的兩種效應", id: 2, caption: "力作用在物體上，會產生兩種效應：被壓扁（改變形狀），或被推動（改變運動狀態）。", action: "point", prop: { kind: "balance", left: "力的效應", right: "改變形狀 / 改變運動狀態", tip: "推、拉、壓都算施力" }, duration: 3600 },
    { step: "步驟 3：合力總效果", id: 3, caption: "合力：把作用在同一物體上的力加總——方向相同相加、相反的相減，得到總效果。", ask: { prompt: "考慮方向把多個力加總，得到的是？", options: ["分力", "合力", "重力", "壓力"], answer: 1, hint: "同向相加、反向相減的總效果叫合力。" }, action: "think", prop: { kind: "flow", steps: ["同向力相加", "反向力相減", "得到合力"], active: 2 }, duration: 3600 },
    { step: "步驟 4：兩力平衡條件", id: 4, caption: "兩力平衡的條件：大小相等、方向相反、作用在同一條直線上，物體就不會被推動。", action: "jump", prop: { kind: "balance", left: "F₁ = 5 N（向右）", right: "F₂ = 5 N（向左）", tip: "等大、反向、同一直線 → 平衡" }, duration: 3800 },
    { step: "步驟 5：靜止等速平衡", id: 5, caption: "不管是靜止不動，還是等速直線前進，只要合力為零，就都處於平衡狀態。", ask: { prompt: "一個物體靜止不動，它受到的力？", options: ["一定沒有受力", "合力為零（平衡）", "只有重力", "越來越大"], answer: 1, hint: "靜止也是平衡，合力為零。" }, action: "point", prop: { kind: "balance", left: "靜止在桌面", right: "等速直線運動", tip: "這兩種都是平衡狀態" }, duration: 3800 },
    { step: "步驟 6：平衡狀態整理", id: 6, caption: "所以：靜止或等速，速度都「不變」，合力都是零——它們都是平衡狀態。", action: "walk", prop: { kind: "flow", steps: ["靜止", "等速直線運動", "合力皆為零", "都是平衡"], active: 3 }, duration: 3600 },
    { step: "步驟 7：記等大反向口訣", id: 7, caption: "口訣：等大反向同線才平衡；靜止與等速都是平衡。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "fb1", prompt: "力作用在物體上，可能產生什麼效應？", options: ["只會發熱", "改變形狀或改變運動狀態", "什麼都不會", "只會變色"], answer: 1, hints: ["推拉會壓扁或推動", "力和運動有關"], explanation: "力能改變物體形狀（如壓扁）或改變其運動狀態（加速、減速）。" },
    { id: "fb2", prompt: "兩力要達到平衡，不需要下列哪一個條件？", options: ["大小相等", "方向相反", "作用在同一條直線", "作用在不同物體"], answer: 3, hints: ["兩力要作用在同一物體", "還要大、反、同線"], explanation: "兩力平衡要作用在同一物體上，且等大、反向、同一直線；作用在不同物體就不是平衡力。" },
    { id: "fb3", prompt: "一個物體靜止在桌面上，它所受力的是？", options: ["完全不受力", "合力為零（平衡）", "只有向上的力", "合力越來越大"], answer: 1, hints: ["靜止是平衡狀態", "支持力與重力抵消"], explanation: "靜止時受力平衡，合力為零（如下壓重力與上推支持力抵消）。" },
    { id: "fb4", prompt: "下列何者屬於「平衡狀態」？", options: ["加速前進", "等速直線運動", "從靜止開始加速", "自由落體"], answer: 1, hints: ["平衡時合力為零", "等速代表速度不變"], explanation: "等速直線運動的速度不改變，合力為零，屬於平衡狀態。" },
    { id: "fb5", prompt: "合力是怎麼算出來的？", options: ["所有力隨便加", "同方向相加、反方向相減", "只看最大的力", "永遠為零"], answer: 1, hints: ["方向相同的力相加", "相反的力相減"], explanation: "合力要考慮方向：同向相加、反向相減，得到總效果。" },
  ],
};

/* ========================================================================
 * 課程 32：社會（國中）— 台灣的氣候特色
 * 用流程圖講季風與緯度，用長條圖比較迎風坡／背風坡雨量。
 * ======================================================================== */
export const TAIWAN_CLIMATE_LESSON: OnionLesson = {
  id: "taiwan-climate",
  title: "台灣的氣候特色",
  subject: "社會",
  topic: "台灣的氣候",
  grade: "七上",
  stages: ["國中"],
  desc: "低緯度讓台灣偏熱，夏吹西南、冬吹東北季風，迎風坡多雨、背風坡少雨。洋蔥帶你看氣候。",
  takeaways: ["低緯度＋近赤道，全年氣溫偏高", "夏季西南季風（暖濕）、冬季東北季風（乾冷）", "迎風坡多雨、背風坡少雨（雨蔭）"],
  frames: [
    { step: "步驟 1：台灣氣候之謎", id: 1, caption: "嗨！台灣夏天熱、冬天濕冷，為什麼？因為我們受季風和緯度影響，今天來看氣候。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：低緯度高溫", id: 2, caption: "緯度：台灣位於低緯度，離赤道近、接收的太陽熱量多，整年氣溫偏高。", action: "point", prop: { kind: "flow", steps: ["低緯度", "接收太陽熱量多", "氣溫較高"], active: 1 }, duration: 3600 },
    { step: "步驟 3：夏季西南季風", id: 3, caption: "夏季：太陽直射北半球，風從海洋吹向陸地，是西南季風，帶來大量暖濕水氣。", ask: { prompt: "台灣夏季吹西南季風，它會帶來？", options: ["乾冷空氣", "暖濕水氣", "沙塵", "下雪"], answer: 1, hint: "從海洋來、含有大量水氣。" }, action: "think", prop: { kind: "flow", steps: ["夏季", "太陽偏北", "吹西南季風", "帶來暖濕海風"], active: 3 }, duration: 3800 },
    { step: "步驟 4：冬季東北季風", id: 4, caption: "冬季反過來：風從大陸吹向海洋，是東北季風，乾冷、水氣少。", action: "jump", prop: { kind: "flow", steps: ["冬季", "太陽偏南", "吹東北季風", "乾冷陸風"], active: 3 }, duration: 3600 },
    { step: "步驟 5：迎風坡多雨", id: 5, caption: "同樣吹季風，迎風坡（山面對風）雨多，背風坡（山後）雨少。東半部多雨、西部少些。", ask: { prompt: "季風吹向的山坡，雨量通常？", options: ["比較多（迎風坡）", "比較少（背風坡）", "一樣多", "完全沒雨"], answer: 0, hint: "迎風坡被迫抬升、容易下雨。" }, action: "point", prop: { kind: "bars", items: [{ label: "迎風坡", value: 3000 }, { label: "背風坡", value: 1000 }], unit: "mm", active: 0 }, duration: 3800 },
    { step: "步驟 6：背風坡雨蔭", id: 6, caption: "所以地形也決定雨量：迎風坡多雨、背風坡形成雨蔭，兩邊雨量差很多。", action: "walk", prop: { kind: "flow", steps: ["迎風坡：多雨", "背風坡：少雨", "地形影響雨量"], active: 2 }, duration: 3600 },
    { step: "步驟 7：記低緯季風口訣", id: 7, caption: "口訣：低緯度高溫、夏西南冬東北、迎風多雨背風少。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "tc1", prompt: "台灣整年氣溫偏高的主因是？", options: ["高緯度", "低緯度、近赤道", "四面環海", "沒有太陽"], answer: 1, hints: ["離赤道近", "接收太陽熱量多"], explanation: "台灣位於低緯度，靠近赤道、接收太陽熱量多，所以氣溫偏高。" },
    { id: "tc2", prompt: "台灣夏季主要吹什麼季風？", options: ["東北季風", "西南季風", "西風", "颶風"], answer: 1, hints: ["夏季風從海洋來", "帶來暖濕水氣"], explanation: "夏季吹西南季風，從海洋帶來暖濕水氣，多雨。" },
    { id: "tc3", prompt: "台灣冬季吹的東北季風，特性是？", options: ["暖濕", "乾冷", "炎熱", "無風"], answer: 1, hints: ["冬季風從大陸來", "水氣少、較冷"], explanation: "冬季東北季風從大陸吹來，乾冷、水氣較少。" },
    { id: "tc4", prompt: "為什麼迎風坡的雨量比背風坡多？", options: ["迎風坡比較高", "濕空氣被地形抬升成雲下雨", "背風坡會吸水", "風比較小"], answer: 1, hints: ["空氣爬坡冷卻", "容易凝結降雨"], explanation: "濕潤空氣遇山被迫抬升、冷卻凝結，在迎風坡成雲下雨，所以雨量多。" },
    { id: "tc5", prompt: "下列哪一種說法正確？", options: ["台灣全年都吹同一方向風", "夏吹西南、冬吹東北季風", "台灣不受季風影響", "冬季比夏季雨多"], answer: 1, hints: ["季風會隨季節反轉", "夏西南、冬東北"], explanation: "台灣受季風影響，夏季西南、冬季東北，隨季節反轉。" },
  ],
};

/* ========================================================================
 * 課程 33：數學（國中）— 提出公因式與因式分解
 * 用天平對照分配律反過來，用流程圖講 x²+bx+c 十字交乘。
 * ======================================================================== */
export const FACTORING_LESSON: OnionLesson = {
  id: "factoring",
  title: "提出公因式與因式分解",
  subject: "數學",
  topic: "因式分解",
  grade: "八下",
  stages: ["國中"],
  desc: "把乘法分配律反過來用，就是因式分解。洋蔥用天平提公因式，用流程圖講十字交乘。",
  takeaways: ["因式分解＝乘法分配律反過來用", "提公因式：找係數公因數與共同字母再提出", "x²＋bx＋c 型用十字交乘：兩數和＝b、積＝c"],
  frames: [
    { step: "步驟 1：分配律反過來", id: 1, caption: "嗨！學過乘法分配律 a(b＋c)＝ab＋ac，現在我們要把它反過來用，這就叫因式分解。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：提出共同數", id: 2, caption: "分配律：3×4 ＋ 3×5 ＝ 3×(4＋5)。反過來，把共同的那個數「提出來」就是因式分解。", action: "point", prop: { kind: "text", text: "3×4 ＋ 3×5 = 3(4＋5)", sub: "把共同的 3 提出來", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：找公因式3", id: 3, caption: "找公因式：6x 和 9 都能被 3 整除，把 3 提出來，得到 3(2x＋3)。", ask: { prompt: "6x＋9 的公因式是？", options: ["3", "x", "9", "6x"], answer: 0, hint: "6 和 9 都能被 3 整除。" }, action: "think", prop: { kind: "balance", left: "6x ＋ 9", right: "3(2x ＋ 3)", tip: "公因式是 3" }, duration: 3800 },
    { step: "步驟 4：三步驟提公因式", id: 4, caption: "三步驟：先找係數的最大公因數，再看字母有沒有共同的部分，最後一起提出。", action: "jump", prop: { kind: "flow", steps: ["看係數公因數", "看字母共同項", "提出公因式"], active: 2 }, duration: 3600 },
    { step: "步驟 5：再練2x加4", id: 5, caption: "再練一次：2x＋4 都含因數 2，提出來得到 2(x＋2)。", ask: { prompt: "2x＋4 因式分解後是？", options: ["2(x＋2)", "x(2＋4)", "(2x)(4)", "4(x＋1)"], answer: 0, hint: "提出 2：2x÷2=x、4÷2=2。" }, action: "point", prop: { kind: "balance", left: "2x ＋ 4", right: "2(x ＋ 2)", tip: "公因式是 2" }, duration: 3800 },
    { step: "步驟 6：十字交乘", id: 6, caption: "x²＋bx＋c 型：用十字交乘找兩數，它們相加等於 b、相乘等於 c。這裡 2＋3=5、2×3=6。", action: "walk", prop: { kind: "flow", steps: ["x²＋5x＋6", "找兩數：和5、積6", "2 和 3", "(x＋2)(x＋3)"], active: 3 }, duration: 3800 },
    { step: "步驟 7：記分配律反過來", id: 7, caption: "口訣：分配律反過來提公因式；x²+bx+c 用十字交乘。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "fc1", prompt: "因式分解和乘法分配律的關係是？", options: ["完全無關", "把分配律反過來用", "乘法分配律更難", "因式分解不存在"], answer: 1, hints: ["a(b+c)=ab+ac 反過來", "拆開的反向是提出"], explanation: "因式分解就是把乘法分配律 ab＋ac＝a(b＋c) 反過來使用，把公因式提出。" },
    { id: "fc2", prompt: "6x＋9 提出公因式後是？", options: ["3(2x＋3)", "x(6＋9)", "(6x)(9)", "3x(2＋3)"], answer: 0, hints: ["6 和 9 的公因數是 3", "6x÷3=2x、9÷3=3"], explanation: "6x＋9＝3·2x＋3·3＝3(2x＋3)。" },
    { id: "fc3", prompt: "2x＋4 的公因式是？", options: ["2", "x", "4", "2x"], answer: 0, hints: ["2x 和 4 都能被 2 整除", "x 不在兩項都出現"], explanation: "2x 和 4 都含因數 2，公因式（式）是 2。" },
    { id: "fc4", prompt: "x²＋5x＋6 用十字交乘分解，應得到？", options: ["(x＋2)(x＋3)", "(x＋1)(x＋6)", "(x−2)(x−3)", "(x＋5)(x＋6)"], answer: 0, hints: ["2+3=5、2×3=6", "找和為5、積為6的兩數"], explanation: "2 和 3 相加為 5、相乘為 6，所以 x²＋5x＋6＝(x＋2)(x＋3)。" },
    { id: "fc5", prompt: "分解 x²＋bx＋c 型時，十字交乘要找兩數滿足？", options: ["和為 b、積為 c", "和為 c、積為 b", "只差 1", "都為正"], answer: 0, hints: ["中間項係數是兩數和", "常數項是兩數積"], explanation: "x²＋bx＋c 分解時，兩數的和等於一次項係數 b、積等於常數項 c。" },
  ],
};

/* ========================================================================
 * 課程 34：英語（國中）— 被動語態 be + p.p.
 * 用字卡、天平（主動↔被動）與流程圖講 be 隨時態變。
 * ======================================================================== */
/* ========================================================================
 * 課程 34.5（國中·新增）：數學·自然·社會·英語 各一
 * ======================================================================== */
export const LINEAR_SYSTEM_LESSON: OnionLesson = {
  id: "linear-system",
  title: "二元一次聯立方程式：兩式同解",
  subject: "數學",
  topic: "二元一次聯立方程式",
  grade: "八上",
  stages: ["國中"],
  desc: "x 和 y 同時未知，一個方程式不夠！洋蔥用天平組合帶你用代入法和加減法解出二元一次聯立。",
  takeaways: ["兩個未知數用兩個方程式聯立", "代入法：把一個式子代入另一個", "加減法：消去一個未知數"],
  frames: [
    { step: "步驟 1：兩個未知數的難題", id: 1, caption: "嗨！蘋果和橘子共 5 個、總價 13 元，這要兩個式子才夠解。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：列出兩個方程式", id: 2, caption: "設蘋果 x、橘子 y：x＋y＝5，3x＋2y＝13，這就是聯立方程式。", action: "point", prop: { kind: "text", text: "x＋y＝5", sub: "3x＋2y＝13", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：代入法思路", id: 3, caption: "從 x＋y＝5 得到 y＝5−x，把它代進第二式，就只剩 x 了。", action: "think", prop: { kind: "flow", steps: ["由式一得 y=5−x", "代入式二", "只剩 x"], active: 1 }, duration: 3600 },
    { step: "步驟 4：算出 x", id: 4, caption: "代入：3x＋2(5−x)＝13 → 3x＋10−2x＝13 → x＝3。", ask: { prompt: "聯立 x＋y＝5、3x＋2y＝13，x 是多少？", options: ["3", "2", "5", "1"], answer: 0, hint: "把 y=5−x 代入第二式解 x。" }, action: "jump", prop: { kind: "balance", left: "3x＋2(5−x)", right: "13", tip: "解出 x＝3" }, duration: 3800 },
    { step: "步驟 5：再求 y", id: 5, caption: "x＝3 代回 y＝5−x，得到 y＝2。所以蘋果 3 顆、橘子 2 顆。", action: "walk", prop: { kind: "text", text: "x＝3 → y＝5−3＝2", sub: "蘋果 3 顆、橘子 2 顆", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：加減消去法", id: 6, caption: "另一招：兩式相減直接消去一個未知數，更快得到答案。", ask: { prompt: "解聯立方程式常用哪兩種方法？", options: ["代入法與加減法", "加法與減法", "乘法與除法", "猜測法"], answer: 0, hint: "消去一個未知數或直接代入。" }, action: "point", prop: { kind: "flow", steps: ["兩式相減消去", "解出一個", "代回求另一個"], active: 0 }, duration: 3800 },
    { step: "步驟 7：記聯立兩式同解", id: 7, caption: "口訣：兩個未知數、兩個式子；代入或加減消去。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ls1", prompt: "聯立方程式 x＋y＝5、3x＋2y＝13，x 是多少？", options: ["3", "2", "5", "1"], answer: 0, hints: ["從第一式得 y=5−x", "代入第二式 3x+2(5−x)=13"], explanation: "代入 y=5−x：3x+10−2x=13 → x=3。" },
    { id: "ls2", prompt: "承上題，y 是多少？", options: ["2", "3", "5", "1"], answer: 0, hints: ["y=5−x", "5−3=2"], explanation: "x=3 代回 x+y=5，得 y=2。" },
    { id: "ls3", prompt: "為什麼兩個未知數需要兩個方程式？", options: ["老師規定", "一個式子無法同時定出兩個未知數", "計算比較快", "一定會錯"], answer: 1, hints: ["一個方程式有很多組解", "多一條件才唯一"], explanation: "一個方程式對兩個未知數有無數解，必須兩式聯立才能唯一確定。" },
    { id: "ls4", prompt: "「把一個式子代入另一個」是哪一種解法？", options: ["加減法", "代入法", "圖解法", "窮舉法"], answer: 1, hints: ["從一式表出一個未知數", "再代進另一式"], explanation: "先由一個方程式表示出某未知數，再代入另一式，稱為代入法。" },
    { id: "ls5", prompt: "聯立 x＋y＝10、x−y＝2，用加減法 x 是多少？", options: ["6", "4", "8", "5"], answer: 0, hints: ["兩式相加消去 y", "(x+y)+(x−y)=12 → 2x=12"], explanation: "兩式相加：2x=12 → x=6；再得 y=4。" },
  ],
};

export const ACID_BASE_PH_LESSON: OnionLesson = {
  id: "acid-base-ph",
  title: "酸鹼與 pH 值：越小越酸",
  subject: "自然",
  topic: "酸鹼與 pH 值",
  grade: "八下",
  stages: ["國中"],
  desc: "檸檬酸、肥皂鹼——洋蔥用 pH 尺帶你看懂 0 到 14 的酸鹼刻度，pH7 是中性，越小越酸、越大越鹼。",
  takeaways: ["pH＜7 是酸性、=7 中性、＞7 鹼性", "pH 每差 1，酸鹼濃度差 10 倍", "石蕊試紙可粗略分辨酸鹼"],
  frames: [
    { step: "步驟 1：檸檬酸肥皂鹼", id: 1, caption: "嗨！檸檬嘗起來酸、肥皂摸起來滑，這就是酸性和鹼性。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：pH 尺 0 到 14", id: 2, caption: "科學家用 pH 值 0～14 表示酸鹼：正中間 7 是中性；pH 1 是很強的酸，pH 14 是很強的鹼。", action: "point", prop: { kind: "bars", items: [{ label: "強酸", value: 1 }, { label: "中性7", value: 7 }, { label: "強鹼", value: 14 }], unit: "pH", active: 1 }, duration: 3600 },
    { step: "步驟 3：小於7是酸性", id: 3, caption: "pH 小於 7 是酸性，越小越酸；醋和檸檬汁都在這一邊。", action: "think", prop: { kind: "text", text: "pH ＜ 7：酸性", sub: "越小越酸（如檸檬、醋）", tone: "warn" }, duration: 3400 },
    { step: "步驟 4：大於7是鹼性", id: 4, caption: "pH 大於 7 是鹼性，越大越鹼；肥皂、小蘇打屬於這一邊。", ask: { prompt: "pH 值等於 7，代表什麼？", options: ["強酸", "中性", "強鹼", "沒有意義"], answer: 1, hint: "正中間就是中性，如純水。" }, action: "jump", prop: { kind: "text", text: "pH ＞ 7：鹼性", sub: "越大越鹼（如肥皂、蘇打）", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：pH 差 1 差 10 倍", id: 5, caption: "pH 每差 1，酸或鹼的強度就差 10 倍，差 2 就差 100 倍！", action: "point", prop: { kind: "flow", steps: ["pH 差 1 → 10 倍", "差 2 → 100 倍", "差 3 → 1000 倍"], active: 0 }, duration: 3800 },
    { step: "步驟 6：石蕊試紙分辨", id: 6, caption: "用石蕊試紙可粗分：遇酸變紅、遇鹼變藍，遇中性不變色。", ask: { prompt: "石蕊試紙遇到酸會變什麼顏色？", options: ["紅色", "藍色", "綠色", "不變色"], answer: 0, hint: "酸讓石蕊變紅。" }, action: "walk", prop: { kind: "text", text: "石蕊：酸→紅、鹼→藍、中性不變", sub: "粗略分辨酸鹼", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：記 pH 越小越酸", id: 7, caption: "口訣：pH7 中性，越小越酸、越大越鹼。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ab1", prompt: "pH 值為 3 的溶液，屬於？", options: ["酸性", "中性", "鹼性", "強鹼"], answer: 0, hints: ["pH 小於 7 是酸性", "3 遠小於 7"], explanation: "pH＜7 為酸性，3 屬於酸性。" },
    { id: "ab2", prompt: "下列哪一種最接近中性（pH≈7）？", options: ["檸檬汁(pH2)", "純水(pH7)", "肥皂水(pH10)", "胃酸(pH1)"], answer: 1, hints: ["中性就是 pH=7", "純水約中性"], explanation: "純水 pH 約 7，屬中性；其餘都偏酸或偏鹼。" },
    { id: "ab3", prompt: "pH 從 4 變成 3，酸性如何變化？", options: ["變弱 10 倍", "變強 10 倍", "沒變化", "變成鹼性"], answer: 1, hints: ["pH 每減 1，酸性強 10 倍", "越小越酸"], explanation: "pH 每差 1，酸強度差 10 倍；從 4 到 3 酸性增強 10 倍。" },
    { id: "ab4", prompt: "石蕊試紙遇到鹼性溶液會變什麼顏色？", options: ["紅色", "藍色", "不變色", "黑色"], answer: 1, hints: ["鹼讓石蕊變藍", "酸才變紅"], explanation: "石蕊試紙遇鹼性變藍色，遇酸性變紅色。" },
    { id: "ab5", prompt: "pH 大於 7 表示的是？", options: ["酸性越強", "鹼性", "中性", "越酸"], answer: 1, hints: ["大於 7 是鹼性", "越大越鹼"], explanation: "pH＞7 為鹼性，數值越大鹼性越強。" },
  ],
};

export const TAIWAN_INDUSTRY_LESSON: OnionLesson = {
  id: "taiwan-industry",
  title: "台灣的產業變遷：農→工→服務",
  subject: "社會",
  topic: "台灣的產業變遷",
  grade: "八下",
  stages: ["國中"],
  desc: "阿公種田、爸爸進工廠、我開咖啡廳——洋蔥用長條圖帶你看台灣從農業、工業到服務業的產業變遷。",
  takeaways: ["產業分一級（農）、二級（工）、三級（服務）", "台灣從農業轉向工業再轉向服務業", "現在以服務業就業人口最多"],
  frames: [
    { step: "步驟 1：三代不同的工作", id: 1, caption: "嗨！阿公務農、爸爸進工廠、你可能在咖啡廳工作，這就是產業變遷。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：三級產業是什麼", id: 2, caption: "產業分三級：一級農林漁牧、二級工業製造、三級服務業。", action: "point", prop: { kind: "flow", steps: ["一級：農林漁牧", "二級：工業製造", "三級：服務業"], active: 0 }, duration: 3600 },
    { step: "步驟 3：早年以農業為主", id: 3, caption: "早期台灣以農業（一級）為主，米、糖、茶是重要出口。", action: "think", prop: { kind: "text", text: "早期：農業為主", sub: "米、糖、茶出口", tone: "ok" }, duration: 3400 },
    { step: "步驟 4：工業起飛", id: 4, caption: "1960 年代後推動加工出口，工廠變多：農業降到 30%、工業升到 45%、服務業約 25%。", ask: { prompt: "下列哪一個屬於二級產業？", options: ["種稻", "汽車工廠", "便利商店", "學校"], answer: 1, hint: "製造、加工屬工業（二級）。" }, action: "jump", prop: { kind: "bars", items: [{ label: "農業", value: 30 }, { label: "工業", value: 45 }, { label: "服務業", value: 25 }], unit: "%", active: 1 }, duration: 3800 },
    { step: "步驟 5：現在服務業最大", id: 5, caption: "如今服務業（三級）就業人口最多，餐飲、零售、金融都算。", action: "walk", prop: { kind: "bars", items: [{ label: "農業", value: 5 }, { label: "工業", value: 35 }, { label: "服務業", value: 60 }], unit: "%", active: 2 }, duration: 3600 },
    { step: "步驟 6：變遷的方向", id: 6, caption: "變遷方向：農業↓、工業先升後穩、服務業↑，整體往三級移動。", ask: { prompt: "現在台灣就業人口最多的產業是？", options: ["農業", "工業", "服務業", "礦業"], answer: 2, hint: "餐飲、零售、金融都屬服務業。" }, action: "point", prop: { kind: "flow", steps: ["農業減少", "工業穩定", "服務業最多"], active: 2 }, duration: 3800 },
    { step: "步驟 7：記三級產業與變遷", id: 7, caption: "口訣：一級農、二級工、三級服務；現在服務業最大。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ti1", prompt: "餐飲、金融屬於哪一級產業？", options: ["一級產業", "二級產業", "三級產業（服務業）", "不算產業"], answer: 2, hints: ["提供服務而非製造", "服務業是三級"], explanation: "餐飲、金融等提供服務，屬三級產業（服務業）。" },
    { id: "ti2", prompt: "下列哪一個屬於一級產業？", options: ["汽車工廠", "便利商店", "漁業捕撈", "銀行"], answer: 2, hints: ["直接取自自然", "農林漁牧是一級"], explanation: "漁業捕撈屬農林漁牧，是一級產業；其餘是二、三級。" },
    { id: "ti3", prompt: "台灣早期重要的出口農產品不包括？", options: ["稻米", "甘蔗（糖）", "茶葉", "汽車"], answer: 3, hints: ["汽車是工業產品", "早期以農產出口"], explanation: "汽車屬工業製品（二級），不是早期農產出口品；米、糖、茶才是。" },
    { id: "ti4", prompt: "目前台灣就業人口最多的產業是？", options: ["農業", "工業", "服務業", "採礦業"], answer: 2, hints: ["經濟發展後服務業興起", "餐飲零售金融吸很多人力"], explanation: "隨經濟發展，服務業就業人口已超過農、工，為最多。" },
    { id: "ti5", prompt: "台灣產業變遷的整體方向是？", options: ["農→工→服務", "服務→工→農", "一直以農為主", "一直以工為主"], answer: 0, hints: ["先農業、再工業化", "最後服務業興起"], explanation: "台灣從農業為主，經工業起飛，到現在以服務業為主，方向是農→工→服務。" },
  ],
};

export const PRESENT_PERFECT_LESSON: OnionLesson = {
  id: "present-perfect",
  title: "現在完成式：have/has + p.p.",
  subject: "英語",
  topic: "現在完成式",
  grade: "九上",
  stages: ["國中"],
  desc: "「我已經吃過了」英文怎麼講？洋蔥用 have/has + 過去分詞，帶你看現在完成式和過去式的差別。",
  takeaways: ["現在完成式 = have/has + p.p.", "強調過去動作對現在的影響", "常搭配 already / yet / ever / never"],
  frames: [
    { step: "步驟 1：已經發生影響現在", id: 1, caption: "Hi! 「我已經寫完作業」強調現在沒事了，這就用現在完成式。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：公式 have/has + p.p.", id: 2, caption: "現在完成式公式：have/has ＋ 過去分詞（p.p.）。I have eaten.", action: "point", prop: { kind: "text", text: "have / has ＋ p.p.", sub: "I have eaten.（我已經吃了）", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：has 還是 have", id: 3, caption: "主詞第三人稱單數用 has，其餘用 have：He has gone. / They have gone.", action: "think", prop: { kind: "balance", left: "He / She / It → has", right: "I / You / We / They → have", tip: "依主詞選 have 或 has" }, duration: 3600 },
    { step: "步驟 4：和過去式哪裡不同", id: 4, caption: "過去式只說「昨天吃了」；完成式強調「到現在為止的經驗或結果」。", ask: { prompt: "「我已經看過這部電影」用英文是？", options: ["I saw the movie.", "I have seen the movie.", "I see the movie.", "I will see it."], answer: 1, hint: "「已經看過」強調經驗，用 have + seen。" }, action: "jump", prop: { kind: "text", text: "過去式：動作在過去", sub: "完成式：影響到現在", tone: "ok" }, duration: 3800 },
    { step: "步驟 5：常用時間詞", id: 5, caption: "完成式常搭配 already（已經）、yet（還沒）、ever（曾經）、never（從未）。", action: "point", prop: { kind: "flow", steps: ["already 已經", "yet 還沒", "ever 曾經", "never 從未"], active: 0 }, duration: 3600 },
    { step: "步驟 6：yet 放句尾", id: 6, caption: "疑問或否定句常用 yet 放句尾：Have you finished yet? 你做完了嗎？", ask: { prompt: "完成式「你吃過了嗎」句尾常加哪個字？", options: ["yet", "now", "tomorrow", "yesterday"], answer: 0, hint: "還沒／了嗎用 yet，放句尾。" }, action: "walk", prop: { kind: "text", text: "Have you eaten yet?", sub: "yet 常放完成式疑問句尾", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：記 have/has 加 p.p.", id: 7, caption: "口訣：現在完成式＝have/has＋p.p.，強調對現在的影響。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "pp1", prompt: "現在完成式的結構是？", options: ["have/has + p.p.", "主詞 + 原形動詞", "will + V", "was/were + V-ing"], answer: 0, hints: ["一定要 have/has", "動詞用過去分詞"], explanation: "現在完成式 = have/has ＋ 過去分詞（p.p.）。" },
    { id: "pp2", prompt: "He ___ finished his homework.（他已經寫完功課）", options: ["have", "has", "had", "having"], answer: 1, hints: ["主詞 He 是第三人稱單數", "單數用 has"], explanation: "主詞 He 是第三人稱單數，用 has：He has finished。" },
    { id: "pp3", prompt: "「我已經看過這部電影」要用？", options: ["I saw the movie.", "I have seen the movie.", "I see the movie.", "I am seeing it."], answer: 1, hints: ["「已經看過」強調經驗", "用 have + seen"], explanation: "強調到現在的經驗用現在完成式：I have seen the movie." },
    { id: "pp4", prompt: "完成式常搭配的「已經」是哪一個字？", options: ["yet", "already", "never", "tomorrow"], answer: 1, hints: ["already 是已經", "yet 多用於還未/疑問"], explanation: "already 表示「已經」，常放完成式肯定句；yet 多用於否定/疑問。" },
    { id: "pp5", prompt: "下列哪一句是現在完成式？", options: ["She went home.", "They have gone home.", "He goes home.", "We will go home."], answer: 1, hints: ["有 have/has + p.p.", "have gone 是完成式"], explanation: "They have gone home. 含 have + gone(p.p.)，是現在完成式。" },
  ],
};

export const PASSIVE_VOICE_LESSON: OnionLesson = {
  id: "passive-voice",
  title: "英語被動語態：be + p.p.",
  subject: "英語",
  topic: "被動語態",
  grade: "九",
  stages: ["國中"],
  desc: "英文「被……」怎麼講？公式 be + p.p.，by 引出原主詞，be 動詞還要隨時態變。洋蔥帶你練。",
  takeaways: ["被動語態 = be 動詞 ＋ 過去分詞（p.p.）", "改被動：原受詞變主詞，原主詞用 by 引出", "be 動詞依時態變化（is/am/are、was/were、has been）"],
  frames: [
    { step: "步驟 1：被動怎麼講", id: 1, caption: "Hi! 英文裡「被……」怎麼講？這就是被動語態，公式很簡單：be ＋ 過去分詞。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：主動改被動", id: 2, caption: "主動：The cat ate the fish.（貓吃了魚。）被動：The fish was eaten by the cat.（魚被貓吃了。）", action: "point", prop: { kind: "text", text: "主動：The cat ate the fish.", sub: "被動：The fish was eaten by the cat.", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：改被動三步", id: 3, caption: "改被動三步：①原受詞拉來當主詞；②動詞改成 be＋p.p.；③原主詞用 by 接在後面。", ask: { prompt: "主動改被動時，原來的受詞會變成？", options: ["刪掉", "新的主詞", "用 by 接", "保持受詞"], answer: 1, hint: "承受動作者當主詞。" }, action: "think", prop: { kind: "balance", left: "主動: S + V + O", right: "被動: O + be+Vp.p. + by S", tip: "原受詞變主詞，動詞變 be+p.p." }, duration: 3800 },
    { step: "步驟 4：be隨時態變", id: 4, caption: "be 動詞要隨時態變：現在用 is/am/are、過去用 was/were、完成用 has/have been。", action: "jump", prop: { kind: "text", text: "be 動詞依時態變", sub: "現在 is/am/are；過去 was/were", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：看was broken", id: 5, caption: "看這句：The window was broken by Tom. 主詞是 window（被動者），was＋broken 成對，by Tom 引出原主詞。", ask: { prompt: "「The book was read by Mary.」是什麼語態？", options: ["主動語態", "被動語態", "疑問句", "否定句"], answer: 1, hint: "有 be＋p.p.，且 by 引出原主詞。" }, action: "point", prop: { kind: "balance", left: "The window was broken by Tom.", right: "主詞=window（被動）", tip: "be(was)+broken(p.p.)+by Tom" }, duration: 3800 },
    { step: "步驟 6：常見錯誤", id: 6, caption: "常見錯誤：①忘了加 be 動詞；②p.p. 拼錯；③時態和 be 對不上。記得 be 和 p.p. 一定要成對。", action: "walk", prop: { kind: "flow", steps: ["找受詞當主詞", "動詞變 be+p.p.", "原主詞加 by", "調整時態"], active: 3 }, duration: 3800 },
    { step: "步驟 7：記be加p.p.口訣", id: 7, caption: "口訣：被動＝be＋p.p.，by 引出原主詞，be 隨時態變。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "pv1", prompt: "被動語態的基本結構是？", options: ["主詞 + 原形動詞", "be 動詞 + 過去分詞 (p.p.)", "will + p.p.", "主詞 + V-ing"], answer: 1, hints: ["一定要有 be", "動詞要變 p.p."], explanation: "被動語態公式為 be 動詞 ＋ 過去分詞（be + p.p.）。" },
    { id: "pv2", prompt: "主動句改成被動句，原受詞會變成？", options: ["受詞不變", "新的主詞", "用 by 接", "刪掉"], answer: 1, hints: ["誰被做就當主詞", "The fish 變主詞"], explanation: "改被動時，原句子的受詞（承受動作者）要提升為新主詞。" },
    { id: "pv3", prompt: "「The book was read by Mary.」的被動標記是？", options: ["read 原形", "was + read (p.p.)", "by Mary 在句首", "沒有被動"], answer: 1, hints: ["be 用 was（過去）", "read 的 p.p. 同形"], explanation: "was（be 動詞，過去式）＋ read（過去分詞）構成被動，by Mary 引出原主詞。" },
    { id: "pv4", prompt: "現在式的被動，be 動詞要用？", options: ["was / were", "is / am / are", "has been", "will"], answer: 1, hints: ["現在對應 is/am/are", "過去才用 was/were"], explanation: "現在式被動用 is / am / are 作 be 動詞，再接 p.p.。" },
    { id: "pv5", prompt: "改寫被動時，常見的錯誤是？", options: ["加太多主詞", "忘了 be 動詞或 p.p. 拼錯", "用錯顏色", "句子太短"], answer: 1, hints: ["be 和 p.p. 要成對", "時態也要對上 be"], explanation: "常見錯誤是漏掉 be 動詞、p.p. 拼錯，或 be 動詞時態與語境不合。" },
  ],
};

/** 目前上架的動畫課清單（多學科，驗證架構通用性）。 */
/** 寫在本檔的核心課程（其餘分冊課程見下方 glob 彙總）。 */
export const CORE_LESSONS: OnionLesson[] = [
  FRACTION_LESSON,
  CHINESE_DE_LESSON,
  WATER_CYCLE_LESSON,
  TRIANGLE_AREA_LESSON,
  PHOTOSYNTHESIS_LESSON,
  NEGATIVE_NUMBER_LESSON,
  LINEAR_EQUATION_LESSON,
  ONION_CELL_LESSON,
  PYTHAGOREAN_LESSON,
  QUADRATIC_LESSON,
  UNIT_CONVERSION_LESSON,
  FACTOR_MULTIPLE_LESSON,
  FRACTION_MULTIPLY_LESSON,
  PUNCTUATION_LESSON,
  FOOD_CHAIN_LESSON,
  STAT_CHART_LESSON,
  CIRCLE_AREA_LESSON,
  BA_BEI_LESSON,
  TIME_TELLING_LESSON,
  ANGLE_TYPES_LESSON,
  PLANT_PARTS_LESSON,
  TAIWAN_GEO_LESSON,
  SYNONYM_ANTONYM_LESSON,
  DECIMAL_ADD_LESSON,
  CUBOID_VOLUME_LESSON,
  PHOTOSYNTHESIS_JUNIOR_LESSON,
  CHEMICAL_CHANGE_LESSON,
  CELL_DIVISION_LESSON,
  SPEED_RATE_LESSON,
  PLATE_TECTONICS_LESSON,
  ENGLISH_TENSE_LESSON,
  ELECTRIC_CIRCUIT_LESSON,
  FORCE_BALANCE_LESSON,
  TAIWAN_CLIMATE_LESSON,
  FACTORING_LESSON,
  PASSIVE_VOICE_LESSON,
  LINEAR_SYSTEM_LESSON,
  ACID_BASE_PH_LESSON,
  TAIWAN_INDUSTRY_LESSON,
  PRESENT_PERFECT_LESSON,
];

/** 依 id 取課；找不到時回傳第一課作為兜底。 */
/**
 * 分冊課程自動彙總。
 *
 * 課程累計到 200 堂之後，全部塞在同一個檔案裡會讓「同時撰寫多堂課」變成
 * 不可能的事（每次編輯都在搶同一個檔案）。因此新增的課程改成一堂一檔放在
 * `client/src/game/onion/lessons/*.ts`，這裡用 Vite 的 glob 自動收集，
 * 檔名排序即顯示順序；核心課程仍留在本檔最前面。
 */
/**
 * 這裡的 `import.meta.glob(...)` 必須寫成「字面語法」——Vite 是在轉譯階段用
 * 字串比對把這段換成靜態匯入；只要寫成 `(import.meta as X).glob(...)` 就抓不到、
 * 執行時會變成 undefined（實際踩過：vitest 裡課程只剩核心的 40 堂）。
 *
 * `import.meta.env` 是 Vite 注入的：用 tsx 直接跑 Node 腳本時不存在，
 * 那些腳本（scripts/qc-onion-lessons.mts）本來就會自己讀 lessons/ 目錄，
 * 所以降級成空陣列即可，重點是不能讓整個模組載入失敗。
 */
const lessonFiles =
  typeof import.meta.env !== "undefined"
    ? import.meta.glob<{ default?: OnionLesson[] }>("./onion/lessons/*.ts", { eager: true })
    : {};

const FILE_LESSONS: OnionLesson[] = Object.keys(lessonFiles)
  .sort()
  .flatMap((path) => lessonFiles[path].default ?? []);

/** 洋蔥學院全部課程：核心課程 ＋ 分冊課程。 */
export const ONION_LESSONS: OnionLesson[] = [...CORE_LESSONS, ...FILE_LESSONS];

export function getOnionLesson(id: string): OnionLesson {
  return ONION_LESSONS.find((l) => l.id === id) ?? FRACTION_LESSON;
}
