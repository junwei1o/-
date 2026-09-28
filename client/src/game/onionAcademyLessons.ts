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
  | { kind: "balance"; left: string; right: string; tip?: string }
  /** 函數坐標圖：x-y 座標＋內建範本曲線（以型別＋係數描述，不做字串求值），可標關鍵點。 */
  | {
      kind: "functionPlot";
      xRange: [number, number];
      yRange: [number, number];
      curves: Array<{
        type: "linear" | "quadratic" | "cubic" | "sine" | "exp" | "log";
        coef?: number[];
        label?: string;
        tone?: "primary" | "accent";
      }>;
      points?: Array<{ x: number; y: number; label?: string }>;
    }
  /** 分子模型：原子（el 元素符號依 CPK 配色）＋鍵（order 單/雙/三鍵）；product 為反應後並排。 */
  | {
      kind: "molecule";
      atoms: Array<{ id: string; el: string; x: number; y: number }>;
      bonds: Array<{ a: string; b: string; order?: 1 | 2 | 3 }>;
      product?: {
        atoms: Array<{ id: string; el: string; x: number; y: number }>;
        bonds: Array<{ a: string; b: string; order?: 1 | 2 | 3 }>;
      };
      label?: string;
    }
  /** 力與運動：物體（含斜面）＋力向量（dir 角度、mag 相對長度、標籤）。 */
  | {
      kind: "forceDiagram";
      body: "box" | "ball" | "cart" | "incline";
      forces: Array<{ label: string; dir: number; mag: number; tone?: "primary" | "accent" | "muted" }>;
      note?: string;
    }
  /** 時間軸：橫向紀年軸＋事件節點（when 年代、title），active 標記當前，era 標示時期。 */
  | {
      kind: "timeline";
      events: Array<{ when: string; title: string }>;
      active?: number;
      era?: string;
    };

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
  takeaways: ["分母是「全部切成幾份」", "同分母相加：分母不變", "分子相加就是答案", "分母是「全部切幾份」，相加時絕對不能把分母也加起來"],
  frames: [
    { step: "步驟 1：認識披薩題目", id: 1, caption: "嗨！今天我們用一塊披薩，搞懂分數加法。", action: "wave", prop: { kind: "none" }, duration: 2600 },
    { step: "步驟 2：為什麼要切一樣大", id: 2, caption: "切披薩一定要切成一樣大的片，才能用分數來數；大小不一就不能相加了。", action: "point", prop: { kind: "pie", a: 1, b: 4 }, duration: 3200 },
    { step: "步驟 3：把披薩切四份", id: 3, caption: "把披薩切成 4 等份，每一份就是 1/4。", action: "point", prop: { kind: "pie", a: 1, b: 4 }, duration: 3000 },
    { step: "步驟 4：吃掉一片是1/4", id: 4, caption: "你吃了 1 片，等於吃掉 1/4 塊披薩。", ask: { prompt: "披薩切成 4 等份，吃掉 1 片是多少？", options: ["1/4", "1/2", "4/1", "1/3"], answer: 0, hint: "全部 4 份中的 1 份，就是 1/4。" }, action: "think", prop: { kind: "pie", a: 1, b: 4, label: "1/4" }, duration: 3000 },
    { step: "步驟 5：朋友再拿兩片", id: 5, caption: "朋友又夾給你 2 片，等於再多了 2/4。", action: "walk", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 } }, duration: 3400 },
    { step: "步驟 6：分母同加分子", id: 6, caption: "分母一樣（都是 4），就把分子直接相加！", ask: { prompt: "1/4 ＋ 2/4，相加後分母應該是多少？", options: ["4", "8", "6", "2"], answer: 0, hint: "同分母相加，分母保持不變。" }, action: "point", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 }, result: { a: 3, b: 4 } }, duration: 3400 },
    { step: "步驟 7：算出1/4加2/4", id: 7, caption: "1 + 2 = 3，所以 1/4 ＋ 2/4 ＝ 3/4。", action: "jump", prop: { kind: "pie", a: 3, b: 4, label: "3/4" }, duration: 3200 },
    { step: "步驟 8：分母不能相加", id: 8, caption: "小心！分母是「全部切成幾份」，相加時分母不變，千萬別把分母也加起來。", ask: { prompt: "1/4 ＋ 2/4，分母應該怎麼處理？", options: ["維持 4 不變", "4＋4＝8", "3 寫進分母", "可以省略分母"], answer: 0, hint: "同分母相加，分母代表切成的份數，不會跟著相加。" }, action: "think", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 }, result: { a: 3, b: 4 } }, duration: 3600 },
    { step: "步驟 9：再算3/8加2/8", id: 9, caption: "再算一題：3/8 ＋ 2/8，分母 8 不變，分子 3＋2＝5，答案是 5/8。", action: "jump", prop: { kind: "pie", a: 5, b: 8, label: "5/8" }, duration: 3400 },
    { step: "步驟 10：記住同分母口訣", id: 10, caption: "口訣：同分母相加，分母不變、分子相加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "fraction-add-1", prompt: "1/4 ＋ 2/4 ＝ ？", options: ["3/8", "3/4", "2/4", "3/4 ÷ 4"], answer: 1, hints: ["分母是「全部幾份」，分子是「拿了幾份」", "分母相同時，分母不用相加"], explanation: "同分母相加：分母 4 不變，分子 1+2=3，答案是 3/4。" },
    { id: "fraction-add-2", prompt: "2/5 ＋ 1/5 ＝ ？", options: ["3/10", "3/5", "2/5", "3/25"], answer: 1, hints: ["先看分母是不是一樣（都是 5）", "分子 2＋1＝3，分母仍是 5"], explanation: "分母 5 不變，分子 2+1=3，答案是 3/5。" },
    { id: "fraction-add-3", prompt: "1/3 ＋ 1/3 ＝ ？", options: ["2/3", "2/6", "1/6", "2/9"], answer: 0, hints: ["1/3 加 1/3，全部切成 3 份", "分子 1＋1＝2"], explanation: "分母 3 不變，分子 1+1=2，答案是 2/3。" },
    { id: "fraction-add-4", prompt: "3/8 ＋ 4/8 ＝ ？", options: ["7/8", "7/16", "12/8", "7/64"], answer: 0, hints: ["分母 8 不變，只要加分子", "3＋4＝7"], explanation: "分母 8 不變，分子 3+4=7，答案是 7/8。" },
    { id: "fraction-add-5", prompt: "一條緞帶，姊姊用了 1/6，弟弟用了 3/6，兩人共用了幾分之幾？", options: ["4/6", "4/12", "3/6", "1/6"], answer: 0, hints: ["兩個人用的分母都是 6", "1＋3＝4，分母是 6"], explanation: "同分母：1/6 ＋ 3/6，分子 1+3=4，答案是 4/6。" },
    { id: "fraction-add-6", prompt: "一杯果汁，小明喝了 2/6 杯、小華喝了 3/6 杯，兩人一共喝了幾杯？", options: ["5/6 杯", "5/12 杯", "6/6 杯", "1/6 杯"], answer: 0, hints: ["兩人喝的分母都是 6", "分子 2＋3＝5，分母仍是 6"], explanation: "同分母 6 不變，分子 2+3=5，答案是 5/6 杯。" },
    { id: "fraction-add-7", prompt: "小華寫 1/3 ＋ 1/3 ＝ 2/6，他錯在哪裡？", options: ["分母不該相加", "分子加錯了", "答案應是 1/6", "他沒有錯"], answer: 0, hints: ["同分母相加分母保持不變", "正確答案是 2/3"], explanation: "同分母相加分母 3 不變，分子 1+1=2，正確答案是 2/3；把分母也加起來是常見錯誤。" },
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
  takeaways: ["的 → 接名詞", "得 → 在動詞後", "地 → 在動詞前", "動詞「前」用「地」、「後」用「得」，一前一後方向相反"],
  frames: [
    { step: "步驟 1：三個字讀音同", id: 1, caption: "嗨！這三個字讀起來都一樣，可是用法完全不同喔。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：為什麼會搞混", id: 2, caption: "這三個字讀起來都念 de，寫字時常常搞混，其實只要看「後面接什麼詞」就不會錯。", action: "point", prop: { kind: "text", text: "的．得．地", sub: "看後面接什麼詞", tone: "ok" }, duration: 3200 },
    { step: "步驟 3：認識「的」接名詞", id: 3, caption: "「的」放在名詞前面，用來修飾。像「紅的蘋果」。", action: "point", prop: { kind: "text", text: "紅的蘋果", sub: "形容詞＋的＋名詞", tone: "ok" }, duration: 3400 },
    { step: "步驟 4：認識「得」接動詞後", id: 4, caption: "「得」放在動詞後面，補充說明程度。像「跑得快」。", ask: { prompt: "「跑__很快」，空格要填哪一個字？", options: ["的", "得", "地", "都不填"], answer: 1, hint: "動詞後面補充程度，用「得」。" }, action: "think", prop: { kind: "text", text: "跑得快", sub: "動詞＋得＋補語", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：認識「地」接動詞前", id: 5, caption: "「地」放在動詞前面，修飾動作的方式。像「慢慢地走」。", action: "walk", prop: { kind: "text", text: "慢慢地走", sub: "副詞＋地＋動詞", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：背口訣分用法", id: 6, caption: "記口訣：的接名詞、得接動詞後、地接動詞前。", ask: { prompt: "「很漂亮__衣服」，後面接名詞，要用哪個？", options: ["的", "得", "地", "都可以"], answer: 0, hint: "後面是名詞「衣服」，用「的」。" }, action: "cheer", prop: { kind: "text", text: "的→名詞  得→動詞後  地→動詞前", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：小心名詞用「的」", id: 7, caption: "小心！「很漂亮的衣服」用的是「的」，因為後面接名詞「衣服」。", action: "point", prop: { kind: "text", text: "很漂亮的（的→對）衣服", sub: "後面是名詞，所以用的", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：動詞前後的地和得", id: 8, caption: "記一個訣竅：動詞「前面」用「地」、「後面」用「得」，方向剛好相反。", ask: { prompt: "「快快__跑過來」，動詞「跑」前面要用哪個？", options: ["地", "的", "得", "都不填"], answer: 0, hint: "動詞前面修飾動作，用「地」。" }, action: "think", prop: { kind: "text", text: "地＋動詞／動詞＋得", sub: "一前一後，方向相反", tone: "ok" }, duration: 3600 },
    { step: "步驟 9：多念幾次三個de", id: 9, caption: "多念幾次：美麗的花、輕輕地唱、唱得大聲，三個 de 各站各的位置。", action: "cheer", prop: { kind: "text", text: "美麗的花．輕輕地唱．唱得大聲", sub: "各站各的位置", tone: "ok" }, duration: 3400 },
    { step: "步驟 10：準備闖關分三字", id: 10, caption: "口訣記好了嗎？準備闖關，看看你會不會分！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "de-usage-1", prompt: "他跑__很快。（填哪個？）", options: ["的", "得", "地", "都行"], answer: 1, hints: ["「跑」是動詞，空格在動詞後面", "動詞後補充程度用「得」"], explanation: "「跑」是動詞，後面補充程度用「得」，所以是「跑得快」。" },
    { id: "de-usage-2", prompt: "一__美麗的花園。", options: ["的", "得", "地", "都行"], answer: 0, hints: ["空格後面接的是「花園」，是名詞", "接名詞用「的」"], explanation: "後面接名詞「花園」，修飾名詞用「的」。" },
    { id: "de-usage-3", prompt: "輕輕__推開門。", options: ["的", "得", "地", "都行"], answer: 2, hints: ["「輕輕」在修飾動作「推開」", "動詞前面用「地」"], explanation: "「輕輕」修飾動詞「推開」，動詞前面用「地」。" },
    { id: "de-usage-4", prompt: "這碗飯真好吃__！啊，這裡不加的字。哪句正確？", options: ["好吃得很", "好吃得很呢", "好吃得不得了", "好吃得"], answer: 2, hints: ["「好吃」是形容詞，後面要補充到什麼程度", "形容詞／動詞後用「得」"], explanation: "動詞/形容詞「好吃」後接「得」再接補語，常見說法如「好吃得不得了」。" },
    { id: "de-usage-5", prompt: "下列哪一句的「的」用法正確？", options: ["他高興的跳起來", "美麗的花朵", "慢慢的走", "跑快得"], answer: 1, hints: ["檢查每一句：後面接名詞才用「的」", "「美麗的花朵」後面是名詞"], explanation: "「美麗的花朵」中「的」後接名詞「花朵」，用法正確。其他應為地/得。" },
    { id: "de-usage-6", prompt: "「弟弟高興__跳了起來」，空格要填哪個？", options: ["地", "的", "得", "不填"], answer: 0, hints: ["「跳」是動詞，空格在它前面", "動詞前面用「地」"], explanation: "「高興」在修飾動詞「跳」，動詞前面用「地」：高興地跳起來。" },
    { id: "de-usage-7", prompt: "下列哪一句的 de 用字完全正確？", options: ["美麗的風景、認真地寫、跑得很快", "美麗得風景、認真的寫、跑地很快", "美麗地風景、認真得寫、跑的很快", "三句都對"], answer: 0, hints: ["的接名詞、地接動詞前、得接動詞後", "風景是名詞、寫在動詞前、跑後補程度"], explanation: "風景是名詞用「的」、寫在動詞前用「地」、跑後補充程度用「得」，三者都正確。" },
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
  takeaways: ["蒸發：水變水蒸氣上升", "凝結：遇冷聚成雲", "降水→匯流，太陽是動力", "越高空越冷，水蒸氣才會遇冷凝結成雲；蒸發需要太陽的熱"],
  frames: [
    { step: "步驟 1：雨從哪裡來", id: 1, caption: "嗨！你有沒有想過，天上的雨從哪裡來？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：毛巾晾乾的啟示", id: 2, caption: "你看過溼毛巾晾在陽台一下就乾了嗎？水分跑到空氣裡，其實就是水循環的開頭。", action: "point", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 0 }, duration: 3400 },
    { step: "步驟 3：太陽加熱蒸發", id: 3, caption: "太陽把海和河裡的水加熱，水變成水蒸氣往上升——這叫「蒸發」。", action: "point", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 0 }, duration: 3600 },
    { step: "步驟 4：高空遇冷凝結", id: 4, caption: "水蒸氣到了高空，遇到冷就變回小水珠，聚成雲——這叫「凝結」。", ask: { prompt: "水蒸氣到高空遇冷變成雲，這個過程叫什麼？", options: ["蒸發", "凝結", "降水", "匯流"], answer: 1, hint: "氣體遇冷變回小水珠，就是凝結。" }, action: "think", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 1 }, duration: 3600 },
    { step: "步驟 5：水珠變重降水", id: 5, caption: "雲裡的水珠越聚越重，掉下來變成雨或雪——這叫「降水」。", action: "jump", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 2 }, duration: 3600 },
    { step: "步驟 6：流回河海匯流", id: 6, caption: "雨水流回河川和海洋，叫做「匯流」，然後又開始下一輪！", action: "walk", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 3 }, duration: 3600 },
    { step: "步驟 7：四階段不停循環", id: 7, caption: "四個階段不斷循環，水就這樣在天上地下旅行，永遠不會用完。", ask: { prompt: "推動水循環不停轉動的能量來自哪裡？", options: ["太陽", "月亮", "風", "地熱"], answer: 0, hint: "太陽提供熱能，讓水蒸發上升。" }, action: "cheer", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"] }, duration: 3400 },
    { step: "步驟 8：哪裡蒸發最快", id: 8, caption: "注意：蒸發在太陽曬得到的地方最快，所以海面、河面是蒸發的大本營。", ask: { prompt: "下列哪個地方最容易發生蒸發？", options: ["陽光下的河面", "陰暗的房間", "冰庫裡", "晚上的地下室"], answer: 0, hint: "太陽提供熱，溫度高的地方蒸發快。" }, action: "point", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 0 }, duration: 3600 },
    { step: "步驟 9：窗戶水珠的秘密", id: 9, caption: "冬天窗戶內側會冒水珠，就是屋裡的水蒸氣遇到冷玻璃凝結，和天上結雲是同一回事。", action: "think", prop: { kind: "text", text: "窗戶水珠＝水蒸氣遇冷凝結", sub: "和天上結雲同一個道理", tone: "ok" }, duration: 3600 },
    { step: "步驟 10：能量來自太陽", id: 10, caption: "記住：循環的能量來自太陽。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "water-cycle-1", prompt: "水變成水蒸氣往上升，這個過程叫什麼？", options: ["凝結", "蒸發", "降水", "匯流"], answer: 1, hints: ["水受熱會變成水蒸氣往上升", "這個階段發生在循環一開始"], explanation: "水受熱變成水蒸氣上升，稱為蒸發。" },
    { id: "water-cycle-2", prompt: "水蒸氣到高空遇冷變成雲，這叫什麼？", options: ["蒸發", "凝結", "降水", "融化"], answer: 1, hints: ["水蒸氣到高空遇冷會變回小水珠", "小水珠聚在一起就是雲"], explanation: "水蒸氣遇冷聚成小水珠成雲，稱為凝結。" },
    { id: "water-cycle-3", prompt: "雲裡的水變重掉下來成雨，這叫什麼？", options: ["蒸發", "凝結", "降水", "昇華"], answer: 2, hints: ["雲裡的水珠變重就會掉下來", "掉下來的雨、雪都算這一階段"], explanation: "雲中水珠過重落下成雨雪，稱為降水。" },
    { id: "water-cycle-4", prompt: "水循環最主要的能量來自哪裡？", options: ["月亮", "風", "太陽", "地熱"], answer: 2, hints: ["想想是誰提供熱能讓水蒸發", "沒有它，水就不會往天上跑"], explanation: "太陽提供熱能讓水蒸發，是水循環的動力來源。" },
    { id: "water-cycle-5", prompt: "下列哪一項不是水循環的階段？", options: ["蒸發", "凝結", "燃燒", "降水"], answer: 2, hints: ["水循環四階段：蒸發、凝結、降水、匯流", "燃燒是化學變化，不是水循環"], explanation: "燃燒是化學反應，不屬於水循環。水循環為蒸發→凝結→降水→匯流。" },
    { id: "water-cycle-6", prompt: "把溼衣服晾在太陽下很快就乾，是因為水發生了什麼？", options: ["蒸發", "凝結", "降水", "結冰"], answer: 0, hints: ["水受熱變成水蒸氣跑到空中", "太陽曬得越熱越快"], explanation: "衣服上的水受熱蒸發成水蒸氣，所以衣服變乾。" },
    { id: "water-cycle-7", prompt: "下列哪個現象和「凝結」有關？", options: ["冰塊融化成水", "草地上的露水", "河水結冰", "海水變鹹"], answer: 1, hints: ["凝結是水蒸氣遇冷變成小水珠", "夜間水蒸氣遇冷在草上結成水珠"], explanation: "露水是空氣中的水蒸氣夜間遇冷凝結在草葉上；其他是熔化或凝固。" },
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
  takeaways: ["兩個全等三角形可拼成平行四邊形", "平行四邊形面積＝底×高", "三角形是一半，要再÷2", "「高」必須垂直於底，斜著量的邊不能當高"],
  frames: [
    { step: "步驟 1：三角形面積之謎", id: 1, caption: "嗨！三角形面積有個好記的公式，但你知道它怎麼來的嗎？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：裁縫的三角形布", id: 2, caption: "裁縫要剪一塊三角形的布，得先知道面積才不會浪費布料。今天就來推公式。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "三角形布" }, duration: 3400 },
    { step: "步驟 3：認識底和高", id: 3, caption: "先認識三角形：這條橫的叫「底」，從底垂直往上量到頂點叫「高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底8 高5" }, duration: 3600 },
    { step: "步驟 4：兩個三角形拼平行四邊形", id: 4, caption: "如果拿兩個一模一樣的三角形，可以拼成一個平行四邊形！", ask: { prompt: "兩個一模一樣的三角形，可以拼成什麼形狀？", options: ["平行四邊形", "圓形", "梯形", "五角形"], answer: 0, hint: "底相同、高相同，拼起來是平行四邊形。" }, action: "think", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "兩個三角形→平行四邊形" }, duration: 3800 },
    { step: "步驟 5：平行四邊形底乘高", id: 5, caption: "平行四邊形的面積是「底×高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高 = 8×5 = 40" }, duration: 3600 },
    { step: "步驟 6：三角形要再除以二", id: 6, caption: "三角形只是平行四邊形的一半，所以要再除以 2！", ask: { prompt: "拼出的平行四邊形面積是 40，三角形是多少？", options: ["40", "20", "80", "10"], answer: 1, hint: "三角形剛好是平行四邊形的一半，40÷2。" }, action: "jump", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "40÷2 = 20" }, duration: 3600 },
    { step: "步驟 7：高要垂直到底", id: 7, caption: "記住：「高」一定要從頂點垂直到底，斜斜量出來的不算高喔。", ask: { prompt: "量三角形的高時，高和底要成什麼角度？", options: ["垂直（90 度）", "平行", "45 度", "隨便量"], answer: 0, hint: "高是從頂點垂直畫到底的距離。" }, action: "think", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "高要垂直到底" }, duration: 3600 },
    { step: "步驟 8：再算底12高7", id: 8, caption: "再算一題：底 12、高 7，代入公式底×高÷2，答案看標籤。", action: "jump", prop: { kind: "shape", shape: "triangle", base: 12, height: 7, label: "12×7÷2＝42" }, duration: 3600 },
    { step: "步驟 9：公式底乘高除二", id: 9, caption: "所以三角形面積 = 底 × 高 ÷ 2。記住了嗎？", action: "cheer", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高÷2" }, duration: 3200 },
    { step: "步驟 10：記底乘高除二口訣", id: 10, caption: "口訣：底乘高、除以二。準備闖關算算看！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "triangle-area-1", prompt: "三角形面積公式是？", options: ["底×高", "底×高÷2", "底＋高", "底×高×2"], answer: 1, hints: ["兩個三角形可以拼成平行四邊形", "三角形是平行四邊形的一半"], explanation: "兩個三角形拼成平行四邊形（底×高），三角形是一半，所以是底×高÷2。" },
    { id: "triangle-area-2", prompt: "底 6、高 4 的三角形，面積是多少？", options: ["24", "12", "10", "48"], answer: 1, hints: ["先算底×高，再除以 2", "6×4＝24，24÷2＝？"], explanation: "6×4÷2 = 24÷2 = 12。" },
    { id: "triangle-area-3", prompt: "底 8、高 5 的三角形，面積是多少？", options: ["40", "13", "20", "80"], answer: 2, hints: ["8×5＝40，別忘了除以 2", "40÷2＝20"], explanation: "8×5÷2 = 40÷2 = 20。" },
    { id: "triangle-area-4", prompt: "底 10、高 7 的三角形，面積是多少？", options: ["70", "35", "17", "140"], answer: 1, hints: ["10×7＝70，再除以 2", "70÷2＝35"], explanation: "10×7÷2 = 70÷2 = 35。" },
    { id: "triangle-area-5", prompt: "一個三角形面積是 24，底是 8，高是多少？", options: ["3", "6", "4", "12"], answer: 1, hints: ["面積＝底×高÷2，反過來高＝面積×2÷底", "24×2＝48，48÷8＝？"], explanation: "面積 = 底×高÷2，所以高 = 24×2÷8 = 48÷8 = 6。" },
    { id: "triangle-area-6", prompt: "一個三角形底 12、高 5，面積是多少？", options: ["30", "60", "17", "120"], answer: 0, hints: ["先 12×5＝60，再除以 2", "60÷2＝？"], explanation: "12×5÷2＝60÷2＝30。" },
    { id: "triangle-area-7", prompt: "兩個底 6、高 4 的全等三角形拼成平行四邊形，平行四邊形面積是多少？", options: ["24", "12", "10", "48"], answer: 0, hints: ["平行四邊形面積＝底×高", "6×4＝24"], explanation: "平行四邊形面積＝底×高＝6×4＝24；三角形是它的一半＝12。" },
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
  takeaways: ["原料＝水＋二氧化碳，能量＝陽光", "場所在葉綠體", "產物＝養分（葡萄糖）＋氧氣", "光合作用養活了整個食物鏈：氧氣和五穀蔬果都靠它"],
  frames: [
    { step: "步驟 1：葉子像綠色工廠", id: 1, caption: "嗨！植物的葉子其實是一座精密的工廠，今天帶你進去參觀！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：工廠需要三原料", id: 2, caption: "這座工廠需要三樣原料：陽光、水、二氧化碳。先來看水從哪裡來。", action: "point", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 3：根吸水送葉子", id: 3, caption: "水由根部吸收，沿著莖裡的細管子，一路往上送到葉子。", action: "walk", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 4：二氧化碳從氣孔進", id: 4, caption: "第二樣原料——二氧化碳，從葉背的小孔「氣孔」溜進來。", ask: { prompt: "二氧化碳是從葉子的哪裡進來的？", options: ["氣孔", "葉尖", "根", "花瓣"], answer: 0, hint: "葉背的小孔叫氣孔，氣體從這裡進出。" }, action: "point", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 5：葉綠體是機器房", id: 5, caption: "葉肉裡有好多綠色小顆粒——葉綠體，它就是工廠的機器房，也是葉子是綠色的原因。", action: "think", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 6：陽光合成養分", id: 6, caption: "陽光照進葉綠體，機器開動！把水和二氧化碳「合成」成養分。", action: "jump", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 7：回顧三原料", id: 7, caption: "回顧一下：光合作用需要的兩種原料是水和二氧化碳，能量是陽光，一樣都不能少。", ask: { prompt: "下列哪一組全是光合作用需要的原料？", options: ["水和二氧化碳", "氧氣和養分", "土壤和石頭", "雨水和月光"], answer: 0, hint: "根送水、氣孔進二氧化碳，陽光提供能量。" }, action: "think", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 8：養分送到全身", id: 8, caption: "合成出來的養分（葡萄糖）送到根、莖、全身，讓植物長高長大。", ask: { prompt: "光合作用做完後，排出來的是哪一種氣體？", options: ["氧氣", "二氧化碳", "氮氣", "水蒸氣"], answer: 0, hint: "副產品是氧氣，正好給我們呼吸。" }, action: "point", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 9：排出副產氧氣", id: 9, caption: "同時，工廠排出副產品——氧氣！從氣孔釋放出去，正好給我們呼吸。", action: "cheer", prop: { kind: "none" }, duration: 3400 },
    { step: "步驟 10：養活整個食物鏈", id: 10, caption: "正因為植物會行光合作用，我們才有氧氣呼吸、有蔬菜五穀可吃，整個食物鏈都靠它。", action: "cheer", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 11：記光合作用公式", id: 11, caption: "公式記起來：二氧化碳＋水 →（陽光・葉綠體）養分＋氧氣。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { step: "步驟 12：口訣根送水吐氧", id: 12, caption: "口訣：根送水、孔進氣、葉綠體曬太陽，變養分、吐氧氣。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "photosynthesis-1", prompt: "光合作用主要在葉片的哪個構造進行？", options: ["氣孔", "葉綠體", "細胞壁", "葉脈"], answer: 1, hints: ["葉子裡綠色的小顆粒是什麼", "它負責接收陽光、進行光合作用"], explanation: "葉綠體是光合作用的機器房，能吸收陽光把原料合成養分。" },
    { id: "photosynthesis-2", prompt: "植物主要靠哪個部位吸收水分，往上送給葉子？", options: ["葉", "花", "根", "果實"], answer: 2, hints: ["水從植物哪個部位被吸收", "根吸收後沿著莖往上送"], explanation: "根部吸收水分，沿著莖往上送到葉子，是光合作用的原料之一。" },
    { id: "photosynthesis-3", prompt: "空氣中的二氧化碳從葉片的哪裡進入？", options: ["氣孔", "葉尖", "樹皮", "芽"], answer: 0, hints: ["葉背有小孔可以讓氣體進出", "那個小孔叫做什麼"], explanation: "葉背的氣孔是二氧化碳進入、氧氣排出的通道。" },
    { id: "photosynthesis-4", prompt: "光合作用的能量來源是什麼？", options: ["土壤", "風", "陽光", "肥料"], answer: 2, hints: ["光合作用的能量來源", "沒有它就無法合成養分"], explanation: "陽光提供能量，讓葉綠體能把水和二氧化碳合成養分。" },
    { id: "photosynthesis-5", prompt: "光合作用排出、剛好供人類呼吸的氣體是？", options: ["二氧化碳", "氮氣", "氫氣", "氧氣"], answer: 3, hints: ["光合作用排出的氣體剛好是我們呼吸要用的", "不是二氧化碳，是另一種"], explanation: "光合作用把二氧化碳轉成養分，同時釋放氧氣，剛好是動物需要的。" },
    { id: "photosynthesis-6", prompt: "植物行光合作用的主要目的是什麼？", options: ["製造養分供自己生長", "吸收土壤養分", "呼吸氧氣", "製造二氧化碳"], answer: 0, hints: ["葉綠體把原料合成養分", "養分送到根莖讓植物長大"], explanation: "光合作用把水和二氧化碳合成葡萄糖（養分），供植物生長所需。" },
    { id: "photosynthesis-7", prompt: "把植物放到完全沒有光的黑暗處一段時間，它最可能？", options: ["無法製造養分，長得不好", "光合作用變更快", "開始只排出二氧化碳", "立刻開花"], answer: 0, hints: ["光合作用一定要有光", "沒有光就沒有能量合成養分"], explanation: "光合作用需要光能，完全無光時無法合成養分，植物會長不好甚至枯萎。" },
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
  takeaways: ["1 公尺 = 100 公分", "1 公里 = 1000 公尺", "大單位→小單位用乘；小單位→大單位用除", "跨級換算要連乘進率，1 公里＝100000 公分"],
  frames: [
    { step: "步驟 1：公分公尺公里比", id: 1, caption: "嗨！公分、公尺、公里常常搞混嗎？今天把它們排在一起比比看。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { step: "步驟 2：身高跑道的單位", id: 2, caption: "量身高說 135，其實是 135 公分；跑道一圈 400，是 400 公尺。單位搞錯會差很多！", action: "point", prop: { kind: "bars", items: [{ label: "135公分", value: 135 }, { label: "400公尺", value: 400 }] }, duration: 3400 },
    { step: "步驟 3：認識1公分", id: 3, caption: "先看最小的公分：手指寬度大約 1 公分；10 公分大約是一個手掌寬，量鉛筆、橡皮擦都用它。", action: "point", prop: { kind: "bars", items: [{ label: "1公分", value: 1 }, { label: "10公分", value: 10 }], unit: "公分" }, duration: 3200 },
    { step: "步驟 4：100公分是1公尺", id: 4, caption: "100 個 1 公分接起來，就是 1 公尺——大概是一張書桌的高度。", ask: { prompt: "1 公尺等於幾公分？", options: ["10 公分", "100 公分", "1000 公分", "10000 公分"], answer: 1, hint: "「公尺」的「厘」就是百分之一，1 公尺 = 100 公分。" }, action: "jump", prop: { kind: "bars", items: [{ label: "1公分", value: 1 }, { label: "1公尺", value: 100 }], unit: "公分", active: 1 }, duration: 3600 },
    { step: "步驟 5：1000公尺是1公里", id: 5, caption: "再上去是公里：1000 個 1 公尺接起來才是 1 公里，走路大概要 15 分鐘。", ask: { prompt: "1 公里等於幾公尺？", options: ["100 公尺", "10 公尺", "1000 公尺", "10000 公尺"], answer: 2, hint: "「公里」的「千」就是一千，1 公里 = 1000 公尺。" }, action: "walk", prop: { kind: "bars", items: [{ label: "1公尺", value: 1 }, { label: "1公里", value: 1000 }], unit: "公尺", active: 1 }, duration: 3600 },
    { step: "步驟 6：大換小用乘法", id: 6, caption: "記住這條樓梯：公里 →（×1000）→ 公尺 →（×100）→ 公分。往下走就乘以進率。", action: "point", prop: { kind: "flow", steps: ["公里", "×1000", "公尺", "×100", "公分"], active: 2 }, duration: 3600 },
    { step: "步驟 7：小換大用除法", id: 7, caption: "反過來往上走，就要「除以」進率：公分 ÷100 變公尺、公尺 ÷1000 變公里。", action: "think", prop: { kind: "flow", steps: ["公分", "÷100", "公尺", "÷1000", "公里"], active: 1 }, duration: 3600 },
    { step: "步驟 8：跨級要連乘", id: 8, caption: "跨一級要連乘：像 1 公里換公分，先 ×1000 再 ×100，別乘錯次數。", ask: { prompt: "1 公里等於幾公分？（1 公里＝1000 公尺、1 公尺＝100 公分）", options: ["100000 公分", "1000 公分", "100 公分", "10000 公分"], answer: 0, hint: "1000×100＝100000。" }, action: "think", prop: { kind: "flow", steps: ["公里", "×1000", "公尺", "×100", "公分"], active: 4 }, duration: 3800 },
    { step: "步驟 9：操場兩圈半", id: 9, caption: "操場一圈 400 公尺，半圈是 200 公尺，兩圈半加起來就是 1000 公尺＝1 公里。", action: "walk", prop: { kind: "bars", items: [{ label: "半圈", value: 200 }, { label: "2.5圈", value: 1000 }], unit: "公尺" }, duration: 3400 },
    { step: "步驟 10：記大乘小除口訣", id: 10, caption: "口訣：大換小、用乘法；小換大、用除法。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "unit-conversion-1", prompt: "3 公尺等於幾公分？", options: ["30 公分", "300 公分", "3000 公分", "3 公分"], answer: 1, hints: ["1 公尺 = 100 公分", "3 × 100 = ?"], explanation: "1 公尺 = 100 公分，大換小用乘法：3 × 100 = 300 公分。" },
    { id: "unit-conversion-2", prompt: "500 公分等於幾公尺？", options: ["5 公尺", "50 公尺", "5000 公尺", "0.5 公尺"], answer: 0, hints: ["小單位換大單位要用除法", "500 ÷ 100 = ?"], explanation: "小換大用除法：500 ÷ 100 = 5 公尺。" },
    { id: "unit-conversion-3", prompt: "2 公里等於幾公尺？", options: ["200 公尺", "2000 公尺", "20000 公尺", "20 公尺"], answer: 1, hints: ["1 公里 = 1000 公尺", "2 × 1000 = ?"], explanation: "1 公里 = 1000 公尺，2 × 1000 = 2000 公尺。" },
    { id: "unit-conversion-4", prompt: "4000 公尺等於幾公里？", options: ["40 公里", "400 公里", "4 公里", "0.4 公里"], answer: 2, hints: ["公尺換公里要除以 1000", "4000 ÷ 1000 = ?"], explanation: "4000 ÷ 1000 = 4，所以是 4 公里。" },
    { id: "unit-conversion-5", prompt: "教室長 8 公尺、寬 50 公分，下面哪個長度最長？", options: ["8 公尺", "50 公分", "一樣長", "無法比較"], answer: 0, hints: ["先把單位換成一樣再比", "50 公分只有 0.5 公尺"], explanation: "50 公分 = 0.5 公尺，比 8 公尺短很多，所以 8 公尺最長。" },
    { id: "unit-conversion-6", prompt: "3.5 公里等於幾公尺？", options: ["3500 公尺", "350 公尺", "35000 公尺", "35 公尺"], answer: 0, hints: ["1 公里＝1000 公尺", "3.5×1000＝？"], explanation: "大換小用乘法：3.5×1000＝3500 公尺。" },
    { id: "unit-conversion-7", prompt: "甲長 2 公尺、乙長 180 公分，兩人誰比較長？", options: ["甲（2 公尺）", "乙（180 公分）", "一樣長", "無法比較"], answer: 0, hints: ["先把單位換成一樣", "180 公分＝1.8 公尺"], explanation: "180 公分＝1.8 公尺，比 2 公尺短，所以甲比較長。" },
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
  takeaways: ["能整除這個數的是「因數」", "這個數乘以整數得到的是「倍數」", "因數有限個，倍數有無限多個", "因數成對出現（相乘等於原數）；倍數一直乘下去，永遠數不完"],
  frames: [
    { step: "步驟 1：12顆糖平分誰行", id: 1, caption: "嗨！有 12 顆糖，要平分給幾個人才能剛好分完、沒有剩下？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：分裝成一樣多包", id: 2, caption: "有 12 顆糖，分成 1 包每包 12 顆、2 包每包 6 顆、3 包每包 4 顆，都剛好分完。", action: "point", prop: { kind: "bars", items: [{ label: "1包", value: 12 }, { label: "2包", value: 6 }, { label: "3包", value: 4 }], unit: "顆/包" }, duration: 3400 },
    { step: "步驟 3：分1人分2人", id: 3, caption: "分給 1 個人：12 顆全給他，12 ÷ 1 ＝ 12；分給 2 個人：每人 6 顆，12 ÷ 2 ＝ 6。都可以整除。", action: "point", prop: { kind: "bars", items: [{ label: "1人", value: 12 }, { label: "2人", value: 6 }], unit: "顆" }, duration: 3200 },
    { step: "步驟 4：整除與不能整除", id: 4, caption: "分給 2 人每人 6 顆、3 人每人 4 顆，都剛好分完；但分給 5 人會剩 2 顆，分不掉！", ask: { prompt: "12 ÷ 5 能不能整除？", options: ["可以，每人 2 顆", "可以，每人 3 顆", "不行，會剩下 2 顆", "不行，會剩下 1 顆"], answer: 2, hint: "5 × 2 = 10，還剩下 2 顆分不掉。" }, action: "think", prop: { kind: "bars", items: [{ label: "3人", value: 4 }, { label: "5人", value: 2 }], unit: "顆", active: 1 }, duration: 3600 },
    { step: "步驟 5：能整除的是因數", id: 5, caption: "像 1、2、3、4、6、12 這些「能整除 12」的數，就是 12 的因數。", action: "point", prop: { kind: "text", text: "12 的因數：1, 2, 3, 4, 6, 12", sub: "能整除 12 的數，一共 6 個", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：一直加是倍數", id: 6, caption: "反過來看：12、24、36、48 一直加 12 上去，這些就是 12 的倍數。", ask: { prompt: "下面哪一個不是 12 的倍數？", options: ["24", "36", "60", "30"], answer: 3, hint: "12 × 2 = 24、12 × 3 = 36、12 × 5 = 60。", }, action: "walk", prop: { kind: "bars", items: [{ label: "12", value: 12 }, { label: "24", value: 24 }, { label: "36", value: 36 }], unit: "" }, duration: 3600 },
    { step: "步驟 7：因數有限倍數無限", id: 7, caption: "關鍵差異：因數數得完（有限個），倍數一直乘下去數不完（無限多個）。", action: "jump", prop: { kind: "text", text: "因數有限 ‧ 倍數無限", sub: "12 的因數 6 個；12 的倍數數不完", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：因數成對出現", id: 8, caption: "因數成對出現：1 和 12、2 和 6、3 和 4，一對一對湊起來相乘都等於 12。", ask: { prompt: "下列哪一組「不是」12 的因數對？", options: ["5 和 7", "1 和 12", "2 和 6", "3 和 4"], answer: 0, hint: "相乘要等於 12；5×7＝35。" }, action: "think", prop: { kind: "text", text: "1×12、2×6、3×4", sub: "相乘都等於 12", tone: "ok" }, duration: 3600 },
    { step: "步驟 9：倍數永遠加不完", id: 9, caption: "倍數永遠加不完：12、24、36、48……一直乘下去沒有盡頭，所以倍數有無限多個。", action: "jump", prop: { kind: "bars", items: [{ label: "12", value: 12 }, { label: "24", value: 24 }, { label: "36", value: 36 }, { label: "48", value: 48 }] }, duration: 3400 },
    { step: "步驟 10：記因數倍數口訣", id: 10, caption: "口訣：因數能整除、倍數一直加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "factor-multiple-1", prompt: "下面哪一個是 18 的因數？", options: ["5", "6", "8", "12"], answer: 1, hints: ["因數要能整除 18", "18 ÷ 6 = 3 剛好整除"], explanation: "18 ÷ 6 = 3，可以整除，所以 6 是 18 的因數。" },
    { id: "factor-multiple-2", prompt: "20 的因數共有幾個？", options: ["4 個", "5 個", "6 個", "8 個"], answer: 2, hints: ["列出能整除 20 的數：1, 2, 4, 5, 10, 20", "一共 6 個"], explanation: "1、2、4、5、10、20 都能整除 20，共 6 個因數。" },
    { id: "factor-multiple-3", prompt: "7 的倍數中，比 30 大又最接近 30 的是哪一個？", options: ["28", "35", "42", "49"], answer: 1, hints: ["7 × 4 = 28 還不夠大", "7 × 5 = ?"], explanation: "7 × 5 = 35，是比 30 大又最接近的 7 的倍數。" },
    { id: "factor-multiple-4", prompt: "一個數的最大因數和最小倍數（不含 0）分別是自己，這是因為？", options: ["自己一定能整除自己", "自己最大", "剛好湊巧", "老師規定的"], answer: 0, hints: ["任何數除以自己都等於 1", "所以自己一定是自己的因數"], explanation: "任何數都能被自己整除（商為 1），所以最大因數是自己；最小倍數也是自己（×1）。" },
    { id: "factor-multiple-5", prompt: "24 顆蘋果平分給若干人剛好分完，人數不可能是？", options: ["3 人", "5 人", "6 人", "8 人"], answer: 1, hints: ["人數必須是 24 的因數", "24 ÷ 5 會剩下 4 顆"], explanation: "24 ÷ 5 = 4 餘 4，不能整除，所以不能分給 5 人。" },
    { id: "factor-multiple-6", prompt: "下列哪一個數是 7 的倍數？", options: ["49", "45", "52", "23"], answer: 0, hints: ["7×7＝49", "倍數要能被 7 整除"], explanation: "49÷7＝7 剛好整除，所以 49 是 7 的倍數。" },
    { id: "factor-multiple-7", prompt: "一個數最大的因數是 18，下列哪個一定正確？", options: ["這個數就是 18", "這個數是 36", "它沒有因數", "它是質數"], answer: 0, hints: ["任何數最大的因數就是自己", "所以這個數是 18"], explanation: "任何數最大的因數是自己，因此這個數就是 18。" },
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
  takeaways: ["分數×整數 = 分子乘以整數、分母不變", "也可以想成「同一份加好幾次」", "算出來的假分數記得化成帶分數", "乘整數只動分子、分母不變，因為「每份的大小」並沒有改變"],
  frames: [
    { step: "步驟 1：1/4塊蛋糕三份", id: 1, caption: "嗨！一塊蛋糕切成 4 等份，你拿了其中的 1 份，就是 1/4 塊。", action: "wave", prop: { kind: "pie", a: 1, b: 4, label: "1/4" }, duration: 3200 },
    { step: "步驟 2：每人吃幾塊", id: 2, caption: "如果每人吃 1/4 塊蛋糕，3 個人一共吃幾塊？就是 1/4 的 3 倍，用乘法算。", action: "point", prop: { kind: "pie", a: 1, b: 4, label: "每人 1/4 塊" }, duration: 3400 },
    { step: "步驟 3：疊兩個1/4看", id: 3, caption: "先拿 2 個這樣的 1/4，疊起來看看是幾分之幾。", action: "point", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 1, b: 4 }, result: { a: 2, b: 4 } }, duration: 3400 },
    { step: "步驟 4：1/4乘3等於3/4", id: 4, caption: "1/4 ＋ 1/4 ＋ 1/4 ＝ 3/4。所以 1/4 × 3 ＝ 3/4！", ask: { prompt: "1/4 × 3 等於多少？", options: ["3/4", "3/12", "1/12", "4/3"], answer: 0, hint: "分母都是 4，只把分子 1×3 = 3。" }, action: "jump", prop: { kind: "pie", a: 3, b: 4, label: "3/4" }, duration: 3600 },
    { step: "步驟 5：規則動分子", id: 5, caption: "規則很簡單：分數乘以整數，只把「分子」乘以整數，分母不動。", action: "point", prop: { kind: "text", text: "a/b × n = (a×n)/b", sub: "分子乘以整數，分母保持不變", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：試2/5乘3", id: 6, caption: "試試看 2/5 × 3：分子 2×3 = 6，分母還是 5，答案是 6/5。", ask: { prompt: "2/5 × 3 等於多少？", options: ["6/5", "6/15", "5/6", "2/15"], answer: 0, hint: "分子 2×3 = 6，分母 5 不變。" }, action: "think", prop: { kind: "pie", a: 6, b: 5, label: "6/5" }, duration: 3600 },
    { step: "步驟 7：假分數變帶分數", id: 7, caption: "6/5 是假分數（分子比分母大），換成帶分數是 1 又 1/5。", action: "cheer", prop: { kind: "text", text: "6/5 = 1 又 1/5", sub: "分子 ÷ 分母：6 ÷ 5 = 1 餘 1", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：為何分母不變", id: 8, caption: "為什麼分母不用乘？因為每塊蛋糕都還是切成 4 份，「份數」沒有改變，只是拿了 3 份。", ask: { prompt: "1/4 × 3，分母 4 要不要也乘以 3？", options: ["不要，分母保持 4", "要，變成 12", "要，變成 7", "分母消失"], answer: 0, hint: "蛋糕還是切成 4 份，份數沒變。" }, action: "think", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 1, b: 4 }, result: { a: 3, b: 4 } }, duration: 3600 },
    { step: "步驟 9：再算3/4乘2", id: 9, caption: "再算一題：3/4 × 2，分子 3×2＝6、分母還是 4，得 6/4＝1 又 2/4。", action: "jump", prop: { kind: "pie", a: 6, b: 4, label: "6/4＝1又2/4" }, duration: 3600 },
    { step: "步驟 10：記乘整數動分子", id: 10, caption: "口訣：乘整數、動分子；分母不動。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "fraction-multiply-1", prompt: "1/6 × 4 等於多少？", options: ["4/6", "4/24", "6/4", "1/24"], answer: 0, hints: ["分子 1×4 = 4", "分母 6 保持不變"], explanation: "分子乘以整數：1×4 = 4，分母 6 不變，答案是 4/6（可約分成 2/3）。" },
    { id: "fraction-multiply-2", prompt: "3/8 × 2 等於多少？", options: ["3/16", "6/8", "6/16", "5/8"], answer: 1, hints: ["分子 3×2 = 6", "分母 8 不變"], explanation: "3×2 = 6，分母 8 不變，答案是 6/8（約分後是 3/4）。" },
    { id: "fraction-multiply-3", prompt: "一條繩子長 2/3 公尺，3 條共長多少公尺？", options: ["2 公尺", "6/3 公尺", "2/9 公尺", "5/3 公尺"], answer: 0, hints: ["2/3 × 3 = 6/3", "6/3 化簡是多少"], explanation: "2/3 × 3 = 6/3 = 2 公尺。" },
    { id: "fraction-multiply-4", prompt: "5/4 化成帶分數是多少？", options: ["1 又 1/4", "4 又 1/5", "1 又 4/5", "5 又 1/4"], answer: 0, hints: ["5 ÷ 4 = 1 餘 1", "整數部分是 1，剩下的 1 是分子"], explanation: "5 ÷ 4 = 1 餘 1，所以 5/4 = 1 又 1/4。" },
    { id: "fraction-multiply-5", prompt: "下列哪一個算式的結果最大？", options: ["1/2 × 3", "1/3 × 3", "1/4 × 3", "1/6 × 3"], answer: 0, hints: ["分母相同時，分子大的分數比較大", "都乘 3，原本最大的還是最大"], explanation: "1/2 × 3 = 3/2，和其他相比 1/2 本身就最大，乘同樣的 3 之後仍然最大。" },
    { id: "fraction-multiply-6", prompt: "4/7 × 3 等於多少？", options: ["12/7", "12/21", "7/12", "4/21"], answer: 0, hints: ["分子 4×3＝12", "分母 7 保持不變"], explanation: "分子乘以整數：4×3＝12，分母 7 不變，答案 12/7。" },
    { id: "fraction-multiply-7", prompt: "小英算 2/5 × 4 寫成 8/20，她錯在哪？", options: ["分母不該乘 4，應是 8/5", "分子算錯", "答案應是 6/5", "她沒有錯"], answer: 0, hints: ["分數乘整數只動分子", "分母 5 不變"], explanation: "分數乘整數只把分子乘以 4：2×4＝8，分母仍是 5，正解 8/5。" },
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
  takeaways: ["逗號＝還沒說完，句號＝說完了", "問號＝有問題要問", "驚嘆號＝有情緒、很大聲", "引號「」用來框住別人說的話；驚嘆號比句號多一層強烈情緒"],
  frames: [
    { step: "步驟 1：標點像紅綠燈", id: 1, caption: "嗨！寫句子的時候，標點符號就像馬路上的紅綠燈，告訴讀者哪裡要停。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：沒有標點的句子", id: 2, caption: "如果句子裡沒有標點，一口氣念到底，別人一定聽不懂你在哪裡停。", action: "point", prop: { kind: "text", text: "今天天氣很好我們去公園玩", sub: "沒有標點，喘不過氣", tone: "warn" }, duration: 3400 },
    { step: "步驟 3：逗號是黃燈", id: 3, caption: "逗號「，」是黃燈：話還沒說完，先喘一口氣再繼續。", ask: { prompt: "「今天天氣很好__我們去公園玩。」空格要放什麼？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 1, hint: "話還沒說完，後面還有「我們去公園玩」。" }, action: "point", prop: { kind: "text", text: "今天天氣很好，我們去公園玩。", sub: "逗號＝黃燈，話還沒說完", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：句號是紅燈", id: 4, caption: "句號「。」是紅燈：這句話說完了，到此為止。", action: "walk", prop: { kind: "text", text: "我們去公園玩。", sub: "句號＝紅燈，句子結束", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：問號用來發問", id: 5, caption: "問號「？」用在發問：句子裡有「誰、什麼、哪裡、嗎、呢」通常就是問句。", ask: { prompt: "「你今天要不要去圖書館__」空格要放什麼？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 2, hint: "這句話是在問別人的意見。" }, action: "think", prop: { kind: "text", text: "你今天要不要去圖書館？", sub: "問號＝有問題要問", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：驚嘆號有情緒", id: 6, caption: "驚嘆號「！」用在有強烈情緒：驚訝、生氣、開心大叫都用它。", action: "jump", prop: { kind: "text", text: "這朵花好漂亮啊！", sub: "驚嘆號＝有情緒、很大聲", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：四種燈號記起來", id: 7, caption: "四種燈號記起來了嗎？黃燈逗號、紅燈句號、問號發問、驚嘆有情緒。", action: "point", prop: { kind: "flow", steps: ["，還沒說完", "。說完了", "？要發問", "！有情緒"], active: 3 }, duration: 3600 },
    { step: "步驟 8：驚嘆和句號差別", id: 8, caption: "驚嘆號比句號多了「情緒」：同一句「他回來了！」比「他回來了。」更興奮。", ask: { prompt: "「放假了__」想表達很興奮，要用哪個？", options: ["驚嘆號！", "句號。", "逗號，", "問號？"], answer: 0, hint: "帶著強烈情緒用驚嘆號。" }, action: "think", prop: { kind: "text", text: "放假了！", sub: "興奮、大叫用驚嘆號", tone: "ok" }, duration: 3600 },
    { step: "步驟 9：說話用引號", id: 9, caption: "說話的時候還要用引號「」把別人說的話框起來，像：他大聲說：「我來了！」", action: "cheer", prop: { kind: "text", text: "他說：「我來了！」", sub: "說的話要用引號框起來", tone: "ok" }, duration: 3600 },
    { step: "步驟 10：記標點口訣", id: 10, caption: "口訣：停一下用逗號，說完用句號，發問用問號，大叫用驚嘆號。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "punctuation-1", prompt: "「妹妹把碗洗乾淨__」這句話說完了，要用？", options: ["逗號，", "句號。", "問號？", "驚嘆號！"], answer: 1, hints: ["這是一句完整的敘述，沒有情緒也沒有問題", "句子結束用句號"], explanation: "整件事說完了，用句號「。」。" },
    { id: "punctuation-2", prompt: "「你為什麼遲到__」要用哪一個符號？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 2, hints: ["「為什麼」是在問原因", "問句用問號"], explanation: "「為什麼」是疑問詞，句尾用問號「？」。" },
    { id: "punctuation-3", prompt: "「這場表演真是太精采了__」要用哪一個符號？", options: ["句號。", "逗號，", "問號？", "驚嘆號！"], answer: 3, hints: ["「太精采了」帶有讚嘆的情緒", "有情緒用驚嘆號"], explanation: "帶有強烈讚嘆的情緒，用驚嘆號「！」。" },
    { id: "punctuation-4", prompt: "「早上起床__我先刷牙洗臉__再去吃早餐。」兩個空格依序是？", options: ["，。", "。。", "，！", "？。"], answer: 0, hints: ["前兩句話都還沒結束", "最後「再去吃早餐」說完了才用句號"], explanation: "前兩處話還沒說完用逗號，最後整句結束用句號。" },
    { id: "punctuation-5", prompt: "下面哪一個句子「不應該」用問號？", options: ["你幾歲？", "這是誰的鉛筆？", "今天的功勞是你的。", "你要不要一起來？"], answer: 2, hints: ["這句話沒有要問問題", "它只是在陳述一件事"], explanation: "「今天的功勞是你的。」是陳述句，用句號，不是問句。" },
    { id: "punctuation-6", prompt: "「這裡就是我們的學校__」說話語氣平淡、沒有驚訝，要用？", options: ["句號。", "驚嘆號！", "問號？", "逗號，"], answer: 0, hints: ["只是平平的敘述", "情緒平穩用句號"], explanation: "平靜地敘述一件事，沒有強烈情緒，句尾用句號。" },
    { id: "punctuation-7", prompt: "「媽媽問我：你今天功課寫完了__」空格要用哪個？", options: ["問號？", "句號。", "逗號，", "驚嘆號！"], answer: 0, hints: ["這是媽媽在「問」話", "問句用問號"], explanation: "引號內是媽媽發出的疑問句，句尾用問號。" },
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
  takeaways: ["箭頭指向「吃掉的那一方」", "生產者是植物，消費者是動物", "能量沿著食物鏈一直傳下去", "多條食物鏈交織成食物網；能量每傳一層就消耗，頂端動物數量最少"],
  frames: [
    { step: "步驟 1：草原三角色", id: 1, caption: "嗨！草原上有草、有兔子、有老鷹，牠們之間藏著一條看不見的線。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：能量源頭是太陽", id: 2, caption: "太陽的能量先存進植物體，再一層層傳給動物，食物鏈最源頭其實是太陽。", action: "point", prop: { kind: "flow", steps: ["太陽", "草", "兔子", "老鷹"], active: 1 }, duration: 3400 },
    { step: "步驟 3：草被兔吃箭頭", id: 3, caption: "兔子吃草，所以能量從「草」跑到「兔子」身上。箭頭要畫成 草 → 兔子。", ask: { prompt: "食物鏈裡的箭頭代表什麼？", options: ["誰被誰吃", "能量的流向（被誰吃掉）", "誰比較大隻", "誰跑得比較快"], answer: 1, hint: "箭頭指向「把對方吃掉」的那一方。" }, action: "point", prop: { kind: "flow", steps: ["草", "兔子"], active: 1 }, duration: 3600 },
    { step: "步驟 4：鷹吃兔能量傳", id: 4, caption: "老鷹又吃掉兔子，能量繼續往上傳：草 → 兔子 → 老鷹。", action: "walk", prop: { kind: "flow", steps: ["草", "兔子", "老鷹"], active: 2 }, duration: 3600 },
    { step: "步驟 5：植物是生產者", id: 5, caption: "第一棒幾乎都是綠色植物，叫做「生產者」——它們自己用陽光製造養分。", action: "point", prop: { kind: "cycle", nodes: ["生產者", "消費者"], active: 0 }, duration: 3400 },
    { step: "步驟 6：吃人的是消費者", id: 6, caption: "吃別人的叫做「消費者」：吃植物的是草食性，吃動物的是肉食性。", ask: { prompt: "兔子在食物鏈裡是什麼角色？", options: ["生產者", "草食性消費者", "肉食性消費者", "分解者"], answer: 1, hint: "兔子吃草，自己不會製造養分。" }, action: "think", prop: { kind: "cycle", nodes: ["生產者", "消費者"], active: 1 }, duration: 3600 },
    { step: "步驟 7：分解者收尾", id: 7, caption: "還有一群默默工作的「分解者」：黴菌、細菌把屍體和落葉分解回土壤。", action: "jump", prop: { kind: "text", text: "生產者 → 消費者 → 分解者", sub: "養分最後回到土壤，給植物再用", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：多條交織成食物網", id: 8, caption: "現實中一條食物鏈常常交織成好幾條，叫做「食物網」；一種生物可能被好幾種吃。", ask: { prompt: "「草 → 兔子 → 老鷹」和「草 → 蝗蟲 → 小鳥」交織在一起，合稱？", options: ["食物網", "分解者", "生產者", "食物鏈一定只有一條"], answer: 0, hint: "多條食物鏈交織成食物網。" }, action: "think", prop: { kind: "flow", steps: ["草", "兔子", "老鷹", "蝗蟲", "小鳥"], active: 0 }, duration: 3600 },
    { step: "步驟 9：能量愈傳愈少", id: 9, caption: "能量每傳一層就消耗掉一部分，所以食物鏈通常不會太長，頂端的大型肉食動物數量最少。", action: "jump", prop: { kind: "text", text: "能量愈傳愈少，頂端數量最少", sub: "養分最後回到土壤", tone: "ok" }, duration: 3600 },
    { step: "步驟 10：記箭頭指吃方", id: 10, caption: "口訣：箭頭指向吃的一方，植物開頭、動物接棒、細菌收尾。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "food-chain-1", prompt: "食物鏈「草 → 兔子 → 老鷹」中，箭頭代表什麼？", options: ["兔子被草吃", "能量的流向，老鷹吃兔子", "草吃兔子", "只是裝飾"], answer: 1, hints: ["箭頭指向吃掉對方的那一方", "老鷹吃兔子"], explanation: "箭頭代表能量的流向，指向吃掉對方的那一方：能量從草傳給兔子，再從兔子傳給老鷹。" },
    { id: "food-chain-2", prompt: "下列哪一個通常是食物鏈的「生產者」？", options: ["老鷹", "綠色植物", "兔子", "細菌"], answer: 1, hints: ["生產者能自己製造養分", "只有植物能行光合作用"], explanation: "綠色植物可行光合作用自行製造養分，是生產者。" },
    { id: "food-chain-3", prompt: "「稻子 → 蝗蟲 → 青蛙 → 蛇」，蛇屬於？", options: ["生產者", "草食性消費者", "肉食性消費者", "分解者"], answer: 2, hints: ["蛇吃青蛙", "吃動物的是肉食性"], explanation: "蛇吃青蛙（動物），屬於肉食性消費者。" },
    { id: "food-chain-4", prompt: "如果把食物鏈中間的兔子全部移走，最可能發生什麼？", options: ["草長得更多，老鷹變少", "草和老鷹都變多", "完全沒有影響", "老鷹改吃草"], answer: 0, hints: ["沒人吃草，草會變多", "老鷹少了食物來源"], explanation: "少了兔子，草會長得更多；老鷹失去主要食物，數量會減少。" },
    { id: "food-chain-5", prompt: "下列哪一種生物屬於「分解者」？", options: ["黴菌", "老鷹", "小草", "兔子"], answer: 0, hints: ["分解者會把屍體、落葉分解回土壤", "它通常很小、用肉眼看不見"], explanation: "黴菌、細菌會分解動植物遺體，是分解者。" },
    { id: "food-chain-6", prompt: "在食物鏈「稻子 → 蝗蟲 → 青蛙 → 蛇 → 老鷹」中，生產者是？", options: ["稻子", "蝗蟲", "青蛙", "老鷹"], answer: 0, hints: ["生產者是綠色植物", "自己用陽光製造養分"], explanation: "稻子是綠色植物，可行光合作用自製養分，是生產者。" },
    { id: "food-chain-7", prompt: "為什麼食物鏈最頂端的大型肉食動物通常數量很少？", options: ["能量每傳一層就消耗一部分", "牠們跑得慢", "牠們都很大隻", "生產者太多"], answer: 0, hints: ["能量沿食物鏈愈傳愈少", "傳到頂端所剩不多"], explanation: "能量每傳一層就消耗掉一部分，頂端獲得的能量最少，所以大型肉食動物數量有限。" },
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
  takeaways: ["先看標題和單位", "長條越長代表數量越多", "兩條相比用減法算相差", "讀長條圖要看清「一格代表多少」；看趨勢要用折線圖"],
  frames: [
    { step: "步驟 1：最愛水果調查", id: 1, caption: "嗨！老師調查全班最喜歡的水果，結果要怎麼一眼看出來？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：為什麼要畫圖", id: 2, caption: "一排數字又多又亂，畫成圖表一眼就看出誰多誰少，這就是長條圖的好處。", action: "point", prop: { kind: "bars", items: [{ label: "蘋果", value: 8 }, { label: "香蕉", value: 5 }, { label: "葡萄", value: 12 }], unit: "人" }, duration: 3400 },
    { step: "步驟 3：畫成長條圖", id: 3, caption: "把數量畫成長條圖：每種水果一根長條，越高代表喜歡的人越多。", action: "point", prop: { kind: "bars", items: [{ label: "蘋果", value: 8 }, { label: "香蕉", value: 5 }, { label: "葡萄", value: 12 }], unit: "人" }, duration: 3600 },
    { step: "步驟 4：先讀標題單位", id: 4, caption: "第一步：先看「標題」和「單位」，才知道這張圖在比什麼、一格是多少。", ask: { prompt: "看長條圖時，第一步要先看什麼？", options: ["最長的那根", "標題和單位", "顏色", "圖的大小"], answer: 1, hint: "不知道單位，就不知道一格代表多少。" }, action: "think", prop: { kind: "text", text: "標題：最喜歡的水果　單位：1 格 = 1 人", sub: "先讀標題與單位", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：找最長最短", id: 5, caption: "第二步：找最長和最矮的長條，就知道「最多」和「最少」。", action: "point", prop: { kind: "bars", items: [{ label: "葡萄", value: 12 }, { label: "香蕉", value: 5 }], unit: "人", active: 0 }, duration: 3400 },
    { step: "步驟 6：相差用減法", id: 6, caption: "第三步：要比「相差多少」，就用長的減掉短的：12 − 5 = 7 人。", ask: { prompt: "喜歡葡萄（12 人）比香蕉（5 人）多幾人？", options: ["7 人", "17 人", "5 人", "12 人"], answer: 0, hint: "相差要用減法：12 − 5。" }, action: "jump", prop: { kind: "text", text: "12 − 5 = 7（人）", sub: "比多少用減法", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：總共全部加", id: 7, caption: "要算「總共多少人」，就把每一根長條的數量全部加起來。", action: "walk", prop: { kind: "bars", items: [{ label: "蘋果", value: 8 }, { label: "香蕉", value: 5 }, { label: "葡萄", value: 12 }], unit: "人" }, duration: 3400 },
    { step: "步驟 8：一格代表多少", id: 8, caption: "讀值時先看縱軸「一格代表多少」：如果一格是 5 人，長條對到 4 格就要乘上 5，得到 20 人。", ask: { prompt: "縱軸一格代表 5 人，某長條對到 4 格，是幾人？", options: ["20 人", "4 人", "9 人", "5 人"], answer: 0, hint: "4×5＝20。" }, action: "think", prop: { kind: "bars", items: [{ label: "4格", value: 4 }], unit: "格" }, duration: 3600 },
    { step: "步驟 9：看趨勢用折線", id: 9, caption: "想看出「愈來愈多或愈來愈少」的趨勢，就要把點連成線，這是折線圖的工作。", action: "walk", prop: { kind: "flow", steps: ["1月", "2月", "3月", "4月"], active: 3 }, duration: 3400 },
    { step: "步驟 10：記讀圖三步驟", id: 10, caption: "口訣：先讀標題單位，再看最長最短，相差用減、總共用加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "stat-chart-1", prompt: "看長條圖時，第一步應該先確認什麼？", options: ["最長的長條", "標題與單位", "圖的顏色", "紙張大小"], answer: 1, hints: ["不知道一格代表多少就沒法讀值", "標題說明這張圖在比什麼"], explanation: "先讀標題與單位，才知道圖表的意義與每格代表的數量。" },
    { id: "stat-chart-2", prompt: "長條圖中，長條越長代表什麼？", options: ["數量越多", "數量越少", "比較便宜", "比較重要"], answer: 0, hints: ["長條高度對應數量", "越高就是越多"], explanation: "長條的長度（高度）對應數量，越長代表數量越多。" },
    { id: "stat-chart-3", prompt: "蘋果 8 人、葡萄 12 人，兩者相差多少人？", options: ["4 人", "20 人", "8 人", "12 人"], answer: 0, hints: ["相差用減法", "12 − 8 = ?"], explanation: "12 − 8 = 4，相差 4 人。" },
    { id: "stat-chart-4", prompt: "蘋果 8 人、香蕉 5 人、葡萄 12 人，全班共幾人？", options: ["17 人", "25 人", "13 人", "20 人"], answer: 1, hints: ["總共要用加法", "8 + 5 + 12 = ?"], explanation: "8 + 5 + 12 = 25 人。" },
    { id: "stat-chart-5", prompt: "想比較「每週讀書時間的變化趨勢」，用哪一種圖最適合？", options: ["長條圖", "折線圖", "圓餅圖", "流程圖"], answer: 1, hints: ["要看「隨時間變化」的趨勢", "點連成線的圖最能看趨勢"], explanation: "折線圖能顯示隨時間的增減趨勢，最適合看變化。" },
    { id: "stat-chart-6", prompt: "縱軸一格代表 3 公斤，長條對到 5 格，代表多少公斤？", options: ["15 公斤", "5 公斤", "8 公斤", "3 公斤"], answer: 0, hints: ["一格 3 公斤，對到 5 格", "5×3＝？"], explanation: "長條對到 5 格、每格 3 公斤：5×3＝15 公斤。" },
    { id: "stat-chart-7", prompt: "班長想呈現「這學期每個月體重的變化」，最適合用哪一種圖？", options: ["折線圖", "長條圖", "圓餅圖", "都一樣"], answer: 0, hints: ["要看隨時間的變化趨勢", "點連成線最能看漲跌"], explanation: "折線圖能顯示隨時間增減的趨勢，最適合表現體重的變化。" },
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
  takeaways: ["圓周率 π ≈ 3.14 = 周長 ÷ 直徑", "周長 = 直徑 × π", "面積 = 半徑 × 半徑 × π", "面積是二維用平方公分、周長是一維用公分；題目給直徑要先 ÷2 得半徑再代公式"],
  frames: [
    { step: "步驟 1：圓藏著π", id: 1, caption: "嗨！不管是大圓還是小圓，藏著一個永遠不變的數字——它就是 π。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：周長除直徑得π", id: 2, caption: "量量看：把圓的周長除以直徑，答案永遠大約是 3.14，這就是圓周率 π。", ask: { prompt: "圓周率 π 是怎麼算出來的？", options: ["周長 ÷ 直徑", "直徑 ÷ 周長", "半徑 × 2", "面積 ÷ 2"], answer: 0, hint: "周長大約是直徑的 3.14 倍。" }, action: "point", prop: { kind: "text", text: "π = 周長 ÷ 直徑 ≈ 3.14", sub: "不管圓多大，這個比值都一樣", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：周長等直徑乘π", id: 3, caption: "所以反過來：周長 = 直徑 × π。直徑 10 公分的圓，周長約 31.4 公分。", action: "walk", prop: { kind: "balance", left: "直徑 10 × 3.14", right: "周長 31.4", tip: "單位：公分" }, duration: 3600 },
    { step: "步驟 4：已知半徑算周長", id: 4, caption: "換方向練：已知半徑 5，先 ×2 得直徑 10，再乘 π：周長＝10 × 3.14＝31.4 公分。", action: "point", prop: { kind: "balance", left: "半徑5 ×2 → 直徑10", right: "×3.14 = 周長31.4", tip: "半徑先變直徑再算" }, duration: 3600 },
    { step: "步驟 5：半徑是直徑一半", id: 5, caption: "半徑是直徑的一半：直徑 10，半徑就是 5。面積公式用的是半徑。", ask: { prompt: "直徑 10 公分的圓，半徑是多少？", options: ["10 公分", "5 公分", "20 公分", "3.14 公分"], answer: 1, hint: "半徑是直徑的一半。" }, action: "think", prop: { kind: "shape", shape: "circle", base: 10, height: 5, label: "直徑 10 ‧ 半徑 5" }, duration: 3600 },
    { step: "步驟 6：圓面積公式", id: 6, caption: "圓面積 = 半徑 × 半徑 × π。半徑 5 的圓：5 × 5 × 3.14 = 78.5 平方公分。", action: "jump", prop: { kind: "text", text: "5 × 5 × 3.14 = 78.5", sub: "面積 = 半徑 × 半徑 × π", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：扇形拼長方形", id: 7, caption: "為什麼？把圓切成很多小扇形再拼起來，會接近一個長方形：長是半周長、寬是半徑。", action: "point", prop: { kind: "flow", steps: ["切成扇形", "拼成長方形", "長 × 寬 = 面積"], active: 2 }, duration: 3600 },
    { step: "步驟 8：周長面積單位別混", id: 8, caption: "小心單位：周長是長度用公分；面積是二維範圍，要用「平方公分」，兩種單位不能混用。", ask: { prompt: "一個圓的面積算出來是 78.5，單位應是？", options: ["公分", "平方公分", "立方公分", "公升"], answer: 1, hint: "面積是二維，用平方單位。" }, action: "think", prop: { kind: "text", text: "周長＝公分｜面積＝平方公分", sub: "一個是長、一個是面", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：給直徑先換半徑", id: 9, caption: "常考題型：題目常直接給「直徑」，記得先 ÷2 變半徑，再代面積公式，別把直徑直接乘進去。", action: "walk", prop: { kind: "flow", steps: ["題目給直徑", "÷2 得半徑", "半徑×半徑×π"], active: 1 }, duration: 3600 },
    { step: "步驟 10：記周長面積口訣", id: 10, caption: "口訣：周長＝直徑×π，面積＝半徑×半徑×π。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "circle-area-1", prompt: "圓周率 π 代表的比值是？", options: ["周長 ÷ 直徑", "直徑 ÷ 周長", "面積 ÷ 周長", "半徑 ÷ 直徑"], answer: 0, hints: ["周長大概是直徑的幾倍", "這個倍數就是 π"], explanation: "π = 周長 ÷ 直徑，約等於 3.14。" },
    { id: "circle-area-2", prompt: "直徑 6 公分的圓，周長約是多少？（π ≈ 3.14）", options: ["9.42 公分", "18.84 公分", "37.68 公分", "6 公分"], answer: 1, hints: ["周長 = 直徑 × π", "6 × 3.14 = ?"], explanation: "6 × 3.14 = 18.84 公分。" },
    { id: "circle-area-3", prompt: "半徑 4 公分的圓，面積約是多少？（π ≈ 3.14）", options: ["12.56", "25.12", "50.24", "16"], answer: 2, hints: ["面積 = 半徑 × 半徑 × π", "4 × 4 × 3.14 = ?"], explanation: "4 × 4 × 3.14 = 50.24 平方公分。" },
    { id: "circle-area-4", prompt: "圓的半徑變成原來的 2 倍，面積會變成幾倍？", options: ["2 倍", "4 倍", "8 倍", "不變"], answer: 1, hints: ["面積用的是半徑 × 半徑", "2 × 2 = ?"], explanation: "面積與半徑平方成正比，半徑 2 倍、面積變成 4 倍。" },
    { id: "circle-area-5", prompt: "直徑 10 公分的圓，半徑與周長分別約是多少？", options: ["半徑 5，周長 31.4", "半徑 10，周長 31.4", "半徑 5，周長 15.7", "半徑 20，周長 62.8"], answer: 0, hints: ["半徑是直徑的一半 = 5", "周長 = 10 × 3.14 = 31.4"], explanation: "半徑 5 公分，周長 10 × 3.14 = 31.4 公分。" },
    { id: "circle-area-6", prompt: "半徑 10 公分的圓，周長約是多少？（π ≈ 3.14）", options: ["31.4 公分", "62.8 公分", "314 公分", "628 公分"], answer: 1, hints: ["直徑＝半徑×2＝20", "周長＝20×3.14"], explanation: "半徑 10 → 直徑 20，周長＝20×3.14＝62.8 公分。" },
    { id: "circle-area-7", prompt: "求「直徑 8 公分的圓面積」時，第一步應該先做什麼？", options: ["直接 8×8×3.14", "先把直徑÷2 得半徑 4，再 4×4×3.14", "改用周長公式", "把 8 當半徑再×2"], answer: 1, hints: ["面積公式用的是半徑", "半徑＝直徑÷2"], explanation: "面積＝半徑×半徑×π，題目給直徑要先 ÷2 得半徑 4，再 4×4×3.14＝50.24，不能把 8 直接平方。" },
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
  takeaways: ["把字句：主動者當主角（A 把 B 怎麼了）", "被字句：承受者當主角（B 被 A 怎麼了）", "互換時動詞不動，只換主詞位置", "把/被依強調重點選用；被字句中 by 後的主動者有時可省略，重點在承受者"],
  frames: [
    { step: "步驟 1：三種句子講", id: 1, caption: "嗨！同一件事可以用三種句子講，今天學「把字句」和「被字句」。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：基本句主動", id: 2, caption: "基本句：我吃掉了蛋糕。主角是「我」，動作是「吃掉了」，對象是「蛋糕」。", action: "point", prop: { kind: "text", text: "我 吃掉了 蛋糕", sub: "主角 動作 對象", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：把字句主動者", id: 3, caption: "把字句：把「對象」提前到動作前面——我把蛋糕吃掉了。主角還是「我」。", ask: { prompt: "「我把蛋糕吃掉了」的主角是誰？", options: ["蛋糕", "我", "吃", "沒有主角"], answer: 1, hint: "「我」是做出動作的人。" }, action: "think", prop: { kind: "text", text: "我把蛋糕吃掉了", sub: "把字句：主動者是主角", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：為何換主角", id: 4, caption: "生活中為什麼要換主角？想強調「誰做的」就用把字句；想強調「東西怎麼了」就用被字句，重點不同。", action: "point", prop: { kind: "balance", left: "把字句：看主動者", right: "被字句：看承受者", tip: "只是鏡頭不同" }, duration: 3600 },
    { step: "步驟 5：被字句承受者", id: 5, caption: "被字句：改讓「對象」當主角——蛋糕被我吃掉了。", action: "walk", prop: { kind: "text", text: "蛋糕被我吃掉了", sub: "被字句：承受者是主角", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：兩句意思同", id: 6, caption: "兩句意思一樣，只是「鏡頭」不同：把字句看主動者，被字句看承受者。", ask: { prompt: "「小狗咬破了鞋子」改成被字句是？", options: ["小狗把鞋子咬破了", "鞋子被小狗咬破了", "鞋子咬破了小狗", "小狗被鞋子咬破了"], answer: 1, hint: "被字句要讓「鞋子」當主角。" }, action: "jump", prop: { kind: "balance", left: "小狗把鞋子咬破了", right: "鞋子被小狗咬破了", tip: "意思相同，主角不同" }, duration: 3800 },
    { step: "步驟 7：判斷把還是被", id: 7, caption: "練判斷：看有沒有「把」「被」，再看誰站在句首當主角，就知道是哪一種。", ask: { prompt: "「蛋糕被弟弟吃光了」這句的主角（主詞）是誰？", options: ["弟弟", "蛋糕", "吃光", "被"], answer: 1, hint: "被字句讓承受者當主角。" }, action: "think", prop: { kind: "text", text: "蛋糕 被 弟弟 吃光了", sub: "句首「蛋糕」才是主角", tone: "warn" }, duration: 3800 },
    { step: "步驟 8：轉換口訣", id: 8, caption: "轉換口訣：把字句＝A 把 B 怎麼了；被字句＝B 被 A 怎麼了。動詞永遠不改。", action: "point", prop: { kind: "flow", steps: ["A 把 B", "動作不變", "B 被 A"], active: 1 }, duration: 3600 },
    { step: "步驟 9：有時不說主動者", id: 9, caption: "有時主動者不必說：「窗戶被打破了」就沒說是誰打破的，by 後面的人可省略，重點在窗戶。", action: "walk", prop: { kind: "text", text: "窗戶被打破了", sub: "沒說誰打破，重點在窗戶", tone: "ok" }, duration: 3600 },
    { step: "步驟 10：記主動被動口訣", id: 10, caption: "口訣：主動用把、被動用被；動詞不動，只換主角。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ba-bei-1", prompt: "「我把功課寫完了」改成被字句是？", options: ["功課被我寫完了", "我把功課寫完了", "我寫完了功課", "功課把我寫完了"], answer: 0, hints: ["被字句要讓「功課」當主角", "結構是 B 被 A 怎麼了"], explanation: "「功課被我寫完了」——功課當主角，是被字句。" },
    { id: "ba-bei-2", prompt: "「窗戶被風吹破了」是把字句還是被字句？", options: ["把字句", "被字句", "都不是", "疑問句"], answer: 1, hints: ["句子裡有「被」", "窗戶是承受動作的一方"], explanation: "有「被」字且承受者當主角，是被字句。" },
    { id: "ba-bei-3", prompt: "「妹妹把花瓶打破了」，動作（動詞）是什麼？", options: ["妹妹", "花瓶", "打破了", "把"], answer: 2, hints: ["誰做了什麼", "打破是這個句子裡的動作"], explanation: "「打破了」是這句的動作（動詞）。" },
    { id: "ba-bei-4", prompt: "「蛋糕被弟弟吃光了」改成把字句是？", options: ["弟弟把蛋糕吃光了", "蛋糕把弟弟吃光了", "弟弟吃光了蛋糕", "蛋糕被吃光了"], answer: 0, hints: ["把字句要讓「弟弟」當主角", "結構是 A 把 B 怎麼了"], explanation: "「弟弟把蛋糕吃光了」——弟弟當主角，是把字句。" },
    { id: "ba-bei-5", prompt: "把字句與被字句互換時，哪一個部分「一定不能改」？", options: ["主詞", "動詞（動作）", "句子的長度", "標點符號"], answer: 1, hints: ["換的是誰當主角", "發生的事本身沒變"], explanation: "互換只換主角位置，動作（動詞）保持不變。" },
    { id: "ba-bei-6", prompt: "「弟弟把報紙看完了」改寫成被字句，下列何者正確？", options: ["報紙被弟弟看完了", "弟弟被報紙看完了", "報紙看完了弟弟", "把弟弟報紙看完了"], answer: 0, hints: ["被字句讓「報紙」當主角", "動詞「看完了」不變"], explanation: "把字句 A 把 B 怎麼了 → 被字句 B 被 A 怎麼了：報紙被弟弟看完了，動詞不變。" },
    { id: "ba-bei-7", prompt: "「信被郵差送走了」這句話，主要想強調的是什麼？", options: ["郵差這個人", "信怎麼了（被送走）", "寄信的時間", "郵局的地點"], answer: 1, hints: ["被字句讓承受者當主角", "鏡頭對著「信」"], explanation: "被字句把「信」拉到句首當主角，重點在信發生了什麼事，而不是誰做的。" },
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
  takeaways: ["時針走 1 大格＝1 小時；分針繞 1 圈＝1 小時", "短針看「時」、長針看「分」，合起來是幾點幾分", "經過時間＝結束時刻 − 開始時刻", "長針每大格＝5 分（指幾就乘 5）；跨小時算經過時間先加到整點再繼續加"],
  frames: [
    { step: "步驟 1：時針分針認", id: 1, caption: "嗨！時鐘上有兩根針：短的是時針、長的是分針，你認得嗎？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：一小時是60分", id: 2, caption: "時針走 1 大格是 1 小時；分針繞一整圈剛好也是 1 小時，兩根針會在 1 小時後重合。", action: "point", prop: { kind: "text", text: "時針 1 大格 = 分針 1 圈 = 1 小時", sub: "短針慢、長針快，一小時同步一次", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：1小時半小時比", id: 3, caption: "1 小時有 60 分鐘，半小時就是 30 分。長度一樣長，只是單位不同。", action: "jump", prop: { kind: "bars", items: [{ label: "1 小時", value: 60 }, { label: "半小時", value: 30 }], unit: "分", active: 0 }, duration: 3600 },
    { step: "步驟 4：長針每格5分", id: 4, caption: "記一個重點：長針每走一大格是 5 分鐘，走幾大格就乘 5，不用一格一格慢慢數。", action: "point", prop: { kind: "text", text: "長針 1 大格 = 5 分", sub: "指幾就 ×5，例如指 6 是 30 分", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：讀時刻方法", id: 5, caption: "讀時刻先讀時針在哪一格（時），再看分針指向幾分，合起來就是幾點幾分。", action: "think", prop: { kind: "flow", steps: ["看短針（時）", "看長針（分）", "合起來讀"], active: 1 }, duration: 3600 },
    { step: "步驟 6：3點30分怎讀", id: 6, caption: "短針過 3、長針指 12 是 3 點整；長針指 6（6×5=30）就是 3 點 30 分。", ask: { prompt: "短針在 3、長針指 6，是幾點幾分？", options: ["3 點 6 分", "3 點 30 分", "6 點 3 分", "3 點 15 分"], answer: 1, hint: "長針指 6 表示 30 分（6×5=30）。" }, action: "point", prop: { kind: "text", text: "3 點 30 分", sub: "短針過 3、長針指 6", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：經過時間用減", id: 7, caption: "經過時間＝結束 − 開始：9:00 到 9:40 經過 40 分鐘；9:00 到 10:10 則經過 70 分鐘。", ask: { prompt: "從 9:00 到 9:40，經過幾分鐘？", options: ["30 分", "40 分", "50 分", "1 小時"], answer: 1, hint: "結束減開始：40 分 − 0 分 ＝ 40 分。" }, action: "walk", prop: { kind: "bars", items: [{ label: "到 9:40", value: 40 }, { label: "到 10:10", value: 70 }], unit: "分", active: 0 }, duration: 3600 },
    { step: "步驟 8：跨小時怎麼算", id: 8, caption: "跨小時也別怕：先算到上一個整點，再繼續往下加。9:50 到 10:20 試試看。", ask: { prompt: "從 9:50 到 10:20，經過幾分鐘？", options: ["30 分", "70 分", "20 分", "50 分"], answer: 0, hint: "9:50→10:00 是 10 分，再加 20 分。" }, action: "think", prop: { kind: "bars", items: [{ label: "9:50→10:00", value: 10 }, { label: "10:00→10:20", value: 20 }], unit: "分", active: 0 }, duration: 3800 },
    { step: "步驟 9：拆兩段不亂算", id: 9, caption: "口訣化：跨小時就拆兩段——先加到整點、再加剩下，分段算就不容易出錯。", action: "walk", prop: { kind: "flow", steps: ["先加到整點", "再加剩餘分", "兩段相加"], active: 1 }, duration: 3600 },
    { step: "步驟 10：記短針長針口訣", id: 10, caption: "口訣：短針看時、長針看分；經過時間用減法。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "time-telling-1", prompt: "1 小時等於幾分鐘？", options: ["30 分", "60 分", "100 分", "12 分"], answer: 1, hints: ["時針走 1 大格是 1 小時", "分針繞一圈 = 60 分"], explanation: "1 小時 = 60 分鐘。" },
    { id: "time-telling-2", prompt: "時鐘上短針表示的是什麼？", options: ["分", "時", "秒", "天"], answer: 1, hints: ["短針走得慢", "它告訴你現在幾點"], explanation: "短針是時針，指「時」；長針才是分針。" },
    { id: "time-telling-3", prompt: "長針指 6，表示幾分？", options: ["6 分", "30 分", "60 分", "12 分"], answer: 1, hints: ["長針每大格 = 5 分", "6 × 5 = 30"], explanation: "長針每大格 5 分，指 6 就是 6×5 = 30 分。" },
    { id: "time-telling-4", prompt: "短針在 2、長針在 12，是幾點？", options: ["2 點整", "12 點 2 分", "2 點 12 分", "2 點 30 分"], answer: 0, hints: ["長針指 12 就是整點", "短針在 2 就是 2 時"], explanation: "長針指 12 是整點，短針在 2，所以是 2 點整。" },
    { id: "time-telling-5", prompt: "從 8:10 到 8:35，經過幾分鐘？", options: ["25 分", "15 分", "45 分", "35 分"], answer: 0, hints: ["結束 − 開始", "35 − 10 = 25"], explanation: "經過時間＝結束 − 開始：35 − 10 = 25 分鐘。" },
    { id: "time-telling-6", prompt: "從 3:40 到 4:10，經過幾分鐘？", options: ["30 分", "70 分", "20 分", "50 分"], answer: 0, hints: ["先算 3:40→4:00 是 20 分", "再加 10 分 = 30 分"], explanation: "跨小時拆兩段：3:40 到 4:00 是 20 分，4:00 到 4:10 是 10 分，共 30 分。" },
    { id: "time-telling-7", prompt: "長針指到 9，表示幾分？", options: ["9 分", "45 分", "54 分", "90 分"], answer: 1, hints: ["長針每大格 5 分", "9 × 5 = 45"], explanation: "長針每大格 5 分，指 9 就是 9×5＝45 分。" },
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
  takeaways: ["銳角：小於 90 度（尖尖的）", "直角：等於 90 度（方方的）", "鈍角：大於 90、小於 180 度；平角 = 180 度", "邊界要算對：正好 90° 是直角、正好 180° 是平角；繞一圈 360° 是周角"],
  frames: [
    { step: "步驟 1：角有名字", id: 1, caption: "嗨！書本的角、三角板的角都有名字，今天我們來把角分一分類。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識角的組成", id: 2, caption: "角是由兩條線共用一個端點（頂點）形成的，用量角器能量出它的「度數」。", action: "point", prop: { kind: "text", text: "角 = 兩條射線 ＋ 1 個頂點", sub: "度數用量角器測量", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：生活中找角", id: 3, caption: "生活中到處是角：打開的書本、時鐘兩根針、三角板，張開的大小都不一樣，所以才要分類。", action: "point", prop: { kind: "text", text: "書本角 / 時鐘角 / 三角板", sub: "張開大小不同 → 分類", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：比三種角度", id: 4, caption: "比一比：銳角尖尖的只有 45 度，直角方方的 90 度，鈍角張開更大到 135 度。", action: "jump", prop: { kind: "bars", items: [{ label: "銳角", value: 45 }, { label: "直角", value: 90 }, { label: "鈍角", value: 135 }], unit: "度", active: 0 }, duration: 3600 },
    { step: "步驟 5：直角是90度", id: 5, caption: "直角剛好 90 度，像正方形、長方形、三角板的角都是直角，可以用 L 型比對。", action: "think", prop: { kind: "text", text: "直角 = 90°", sub: "正方形、長方形的角都是直角", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：鈍角介於中", id: 6, caption: "鈍角比直角大、比平角小：大於 90 度、小於 180 度，像打開的扇子。", ask: { prompt: "一個角有 120 度，它是哪一種角？", options: ["銳角", "直角", "鈍角", "平角"], answer: 2, hint: "120 大於 90、小於 180，是鈍角。" }, action: "point", prop: { kind: "text", text: "鈍角：90° < 角度 < 180°", sub: "比直角大、比平角小", tone: "warn" }, duration: 3800 },
    { step: "步驟 7：平角是180度", id: 7, caption: "平角是直角的兩倍：兩條邊拉成一條直線，等於 180 度。", ask: { prompt: "平角是直角的幾倍？", options: ["1 倍", "2 倍", "3 倍", "4 倍"], answer: 1, hint: "180 ÷ 90 = 2。" }, action: "walk", prop: { kind: "bars", items: [{ label: "直角", value: 90 }, { label: "平角", value: 180 }], unit: "度", active: 1 }, duration: 3600 },
    { step: "步驟 8：邊界要算對", id: 8, caption: "注意邊界：正好 90 度是直角（不是銳角）、正好 180 度是平角（不是鈍角），邊界不能算錯。", ask: { prompt: "一個角正好是 90 度，它是？", options: ["銳角", "直角", "鈍角", "平角"], answer: 1, hint: "正好 90 度就是直角，不是銳角。" }, action: "think", prop: { kind: "text", text: "正好90=直角｜正好180=平角", sub: "邊界不歸入隔壁類", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：一圈是周角", id: 9, caption: "再往上：平角轉一圈回到原方向是 360 度，叫周角；兩個直角拼起來剛好是一個平角。", action: "walk", prop: { kind: "bars", items: [{ label: "直角", value: 90 }, { label: "平角", value: 180 }, { label: "周角", value: 360 }], unit: "度", active: 2 }, duration: 3600 },
    { step: "步驟 10：記角度分類口訣", id: 10, caption: "口訣：小於 90 銳角、等於 90 直角、90~180 鈍角。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "angle-types-1", prompt: "幾度叫做直角？", options: ["45 度", "90 度", "180 度", "60 度"], answer: 1, hints: ["正方形、長方形的角都是", "量角器量剛好一半"], explanation: "直角等於 90 度。" },
    { id: "angle-types-2", prompt: "一個角是 70 度，它屬於？", options: ["銳角", "直角", "鈍角", "平角"], answer: 0, hints: ["銳角小於 90 度", "70 比 90 小"], explanation: "小於 90 度的角是銳角，70 度 < 90 度所以是銳角。" },
    { id: "angle-types-3", prompt: "下列哪一個角最大？", options: ["銳角 45 度", "直角 90 度", "鈍角 120 度", "它們一樣大"], answer: 2, hints: ["鈍角大於直角", "120 > 90 > 45"], explanation: "鈍角大於 90 度，120 度比直角和銳角都大。" },
    { id: "angle-types-4", prompt: "平角是多少度？", options: ["90 度", "180 度", "360 度", "45 度"], answer: 1, hints: ["兩條邊成一直線", "是直角的兩倍"], explanation: "平角的兩邊成一直線，等於 180 度。" },
    { id: "angle-types-5", prompt: "用量角器量角時，中心點要對準哪裡？", options: ["邊的中間", "頂點", "任意位置", "線的末端"], answer: 1, hints: ["頂點是兩條邊的交點", "對準頂點才能量準"], explanation: "量角器的中心點要對準角的頂點，才能正確讀出度數。" },
    { id: "angle-types-6", prompt: "一個角正好是 90 度，它屬於？", options: ["銳角", "直角", "鈍角", "平角"], answer: 1, hints: ["邊界正好 90", "不是小於 90"], explanation: "銳角要「小於」90 度，正好 90 度就是直角，不能算銳角。" },
    { id: "angle-types-7", prompt: "把兩個直角拼在一起，會等於哪一種角？", options: ["銳角", "平角", "周角", "還是直角"], answer: 1, hints: ["90 + 90 = 180", "180 度是平角"], explanation: "一個直角 90 度，兩個直角拼成 180 度，正好是平角。" },
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
  takeaways: ["根：固定植物並從土壤吸收水分和養分", "莖：支撐植物並運輸水分", "葉：進行光合作用製造養分", "光合作用只在葉（含葉綠體）進行，根莖不會自製養分；三部位缺一不可"],
  frames: [
    { step: "步驟 1：根莖葉分工", id: 1, caption: "嗨！一株植物從頭到腳分成根、莖、葉，它們各有工作，今天來認識它們。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：根固定吸水", id: 2, caption: "根是植物的腳：把自己固定在土裡，還從土壤中吸收水分和養分。", action: "point", prop: { kind: "flow", steps: ["根（固定＋吸水）", "莖（支撐＋運輸）", "葉（光合作用）"], active: 0 }, duration: 3600 },
    { step: "步驟 3：莖支撐運輸", id: 3, caption: "莖像輸送管：把根吸到的水往上送，還支撐植物站直、不會倒下來。", ask: { prompt: "植物進行光合作用的部位是哪一個？", options: ["根", "莖", "葉", "花"], answer: 2, hint: "葉子是食物的工廠。" }, action: "think", prop: { kind: "flow", steps: ["根（固定＋吸水）", "莖（支撐＋運輸）", "葉（光合作用）"], active: 1 }, duration: 3600 },
    { step: "步驟 4：為何澆土裡", id: 4, caption: "想想看：澆花為什麼要澆在土裡、不是噴在葉子上？因為喝水的工作交給「根」，根才在土裡。", action: "point", prop: { kind: "text", text: "澆水 → 澆在土裡", sub: "讓根吸水，不是澆葉子", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：葉做食物", id: 5, caption: "葉是食物的工廠：用陽光把水和二氧化碳做成養分，這就是光合作用。", action: "jump", prop: { kind: "flow", steps: ["根（固定＋吸水）", "莖（支撐＋運輸）", "葉（光合作用）"], active: 2 }, duration: 3600 },
    { step: "步驟 6：三部位合作", id: 6, caption: "三個部位合作：根供水、莖送水、葉做食物，缺一不可。", ask: { prompt: "植物靠哪個部位從土裡吸收水分？", options: ["根", "莖", "葉", "花"], answer: 0, hint: "根在土壤中，負責吸水。" }, action: "point", prop: { kind: "cycle", nodes: ["根：固定吸水", "莖：支撐運輸", "葉：光合作用"], active: 0 }, duration: 3800 },
    { step: "步驟 7：循環根莖葉", id: 7, caption: "看這個循環：根吸水 → 莖運送 → 葉製造，養分再供全身，合作無間。", action: "walk", prop: { kind: "cycle", nodes: ["根：固定吸水", "莖：支撐運輸", "葉：光合作用"], active: 2 }, duration: 3600 },
    { step: "步驟 8：誰不會光合作用", id: 8, caption: "易錯提醒：光合作用只有葉子做，根和莖都在土裡或當管子，不會自己製造養分。", ask: { prompt: "下列哪個部位「不會」進行光合作用？", options: ["葉子", "根", "葉綠體多的綠葉", "綠色的葉"], answer: 1, hint: "根在土裡、沒有葉綠體，只負責吸水。" }, action: "think", prop: { kind: "text", text: "光合作用 只有葉", sub: "根、莖不自製養分", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：缺一不可", id: 9, caption: "缺一不可：根沒水、莖斷了、葉子被蟲吃光，植物都長不好——三部位一起合作才活得下去。", action: "walk", prop: { kind: "cycle", nodes: ["根斷→缺水", "莖斷→無法運輸", "葉光→沒養分"], active: 2 }, duration: 3600 },
    { step: "步驟 10：記根深莖直口訣", id: 10, caption: "口訣：根深、莖直、葉光合，分工合作長得好。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "plant-parts-1", prompt: "植物用哪個部位吸收水分？", options: ["葉", "莖", "根", "花"], answer: 2, hints: ["在土壤裡的那個部位", "負責吸水"], explanation: "根在土中吸收水分和養分。" },
    { id: "plant-parts-2", prompt: "莖的主要功能不包括下列哪一項？", options: ["支撐植物", "運輸水分", "進行光合作用", "連接根和葉"], answer: 2, hints: ["光合作用在葉子進行", "莖是管子和支柱"], explanation: "光合作用是葉子的功能，莖負責支撐與運輸。" },
    { id: "plant-parts-3", prompt: "葉子進行光合作用，需要什麼？", options: ["只有水", "水和陽光", "只有土壤", "只有空氣"], answer: 1, hints: ["葉是食物工廠", "陽光提供能量"], explanation: "葉子利用陽光把水和二氧化碳轉成養分，需要水和陽光。" },
    { id: "plant-parts-4", prompt: "根除了吸收水分，還有什麼作用？", options: ["製造養分", "把植物固定在土裡", "進行呼吸", "開花結果"], answer: 1, hints: ["根是植物的腳", "固定才不會被風吹倒"], explanation: "根能把植物固定在土壤中，使其站穩。" },
    { id: "plant-parts-5", prompt: "下列哪一種說法正確？", options: ["根莖葉各司其職、互相合作", "只有葉子重要", "莖不重要", "根會進行光合作用"], answer: 0, hints: ["三個部位缺一不可", "合作才能存活"], explanation: "根、莖、葉各有功能並互相合作，共同維持植物生長。" },
    { id: "plant-parts-6", prompt: "為什麼澆花要把水澆在土壤裡，而不是只噴在葉子上？", options: ["葉子完全不會吸水", "根在土壤中負責吸收水分", "澆葉子比較貴", "沒有特別原因"], answer: 1, hints: ["喝水的工作交給根", "根在土裡"], explanation: "根在土壤中吸收水分和養分，所以要把水澆在土裡讓根喝到。" },
    { id: "plant-parts-7", prompt: "把一株植物的葉子全部摘除，最先會發生什麼問題？", options: ["無法製造養分", "無法固定植物", "無法吸收水分", "無法呼吸空氣"], answer: 0, hints: ["葉子是食物工廠", "沒有食物工廠就沒養分"], explanation: "葉子進行光合作用製造養分，摘光後植物沒有養分來源，會慢慢枯死。" },
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
  takeaways: ["台灣位於東亞島鏈，在福建東南方", "北回歸線通過中南部，是熱帶亞熱帶分界", "五大地形：平原、丘陵、台地、盆地、山地；山地最多、平原最少", "台灣東臨太平洋、西隔台灣海峽；中央山脈縱貫南北，平原多分布在西部"],
  frames: [
    { step: "步驟 1：認識家園台灣", id: 1, caption: "嗨！我們住的台灣在哪裡？有什麼地形？今天就用地圖來認識我們的家園。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：台灣在東南", id: 2, caption: "台灣位於東亞的島鏈上，在福建的東南方，四面環海，是個海島。", action: "point", prop: { kind: "text", text: "台灣：東亞島鏈、福建東南", sub: "四面環海的海島", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：北回歸線通過", id: 3, caption: "北回歸線從台灣中南部穿過，把台灣分成熱帶（南）和亞熱帶（北）。", ask: { prompt: "北回歸線通過台灣的哪裡？", options: ["北部", "中南部", "東部海面", "沒有通過"], answer: 1, hint: "通過嘉義、花蓮一帶的中南部。" }, action: "think", prop: { kind: "flow", steps: ["北回歸線通過", "中南部", "熱帶／亞熱帶分界"], active: 1 }, duration: 3600 },
    { step: "步驟 4：四周環海", id: 4, caption: "認識四周：台灣東臨太平洋、西隔台灣海峽對福建，四面環海，海運和漁業都很方便。", action: "point", prop: { kind: "text", text: "東：太平洋｜西：台灣海峽", sub: "四面環海的海島", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：五大地形", id: 5, caption: "台灣有五大地形：平原、丘陵、台地、盆地、山地，各有不同的高度和樣子。", action: "jump", prop: { kind: "text", text: "五大地形：平原／丘陵／台地／盆地／山地", sub: "地形種類多樣", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：山地最多", id: 6, caption: "地形比一比：山地高高在上約 2000 公尺，丘陵約 500，平原只有幾十公尺。台灣山地佔最多。", ask: { prompt: "台灣面積最大的是哪一種地形？", options: ["平原", "丘陵", "山地", "盆地"], answer: 2, hint: "中央山脈縱貫，山地佔一半以上。" }, action: "point", prop: { kind: "bars", items: [{ label: "山地", value: 2000 }, { label: "丘陵", value: 500 }, { label: "平原", value: 50 }], unit: "公尺", active: 0 }, duration: 3800 },
    { step: "步驟 7：人口集中平原", id: 7, caption: "因為山地多、平原少，所以大多數人住在很少的平原上，城市也多在平原。", action: "walk", prop: { kind: "flow", steps: ["山地多", "平原少", "人口集中在平原"], active: 2 }, duration: 3600 },
    { step: "步驟 8：五大地形再確認", id: 8, caption: "再記一次五大地形：平原、丘陵、台地、盆地、山地——注意裡面沒有「高原」喔。", ask: { prompt: "下列哪一個「不屬於」台灣五大地形？", options: ["平原", "高原", "盆地", "台地"], answer: 1, hint: "五大地形是平原、丘陵、台地、盆地、山地。" }, action: "think", prop: { kind: "text", text: "五大地形沒有「高原」", sub: "常把高原誤記進去", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：中央山脈縱貫", id: 9, caption: "台灣南北狹長，中央山脈縱貫南北，所以山勢高、平原多集中在西部一帶。", action: "walk", prop: { kind: "flow", steps: ["中央山脈縱貫", "東陡西緩", "平原多在西部"], active: 2 }, duration: 3600 },
    { step: "步驟 10：記島鏈地形口訣", id: 10, caption: "口訣：島鏈東南、北回歸線、五地形、山多平原少。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "taiwan-geo-1", prompt: "台灣位於哪裡？", options: ["東亞島鏈、福建東南", "歐洲", "非洲", "南極"], answer: 0, hints: ["是個海島", "在亞洲東邊"], explanation: "台灣位於東亞島鏈，在福建（中國東南）的外海東南方。" },
    { id: "taiwan-geo-2", prompt: "北回歸線通過台灣的哪裡？", options: ["北部", "中南部", "東部", "沒有通過"], answer: 1, hints: ["它把台灣分成熱帶亞熱帶", "通過嘉義、花蓮一帶"], explanation: "北回歸線通過台灣中南部，是熱帶與亞熱帶的分界。" },
    { id: "taiwan-geo-3", prompt: "下列哪一項不是台灣五大地形之一？", options: ["平原", "山地", "丘陵", "高原"], answer: 3, hints: ["五大地形不含高原", "是平原丘陵台地盆地山地"], explanation: "台灣五大地形為平原、丘陵、台地、盆地、山地，沒有高原。" },
    { id: "taiwan-geo-4", prompt: "台灣地形以哪一種佔最多面積？", options: ["平原", "山地", "盆地", "台地"], answer: 1, hints: ["山脈縱貫中央", "山地佔約一半以上"], explanation: "台灣中央山脈縱貫，山地佔全島面積一半以上，是最多的地形。" },
    { id: "taiwan-geo-5", prompt: "為什麼台灣人口大多集中在平原？", options: ["平原風景最美", "山地多平原少，平原適合居住農耕", "平原比較冷", "法律規定"], answer: 1, hints: ["平原少但平坦", "適合耕作與居住"], explanation: "台灣山地多、平原少，而平原地勢平坦、適合農耕與居住，所以人口集中。" },
    { id: "taiwan-geo-6", prompt: "台灣東面瀕臨哪一個海洋？", options: ["台灣海峽", "太平洋", "大西洋", "印度洋"], answer: 1, hints: ["東邊面對廣大海洋", "西邊才是海峽"], explanation: "台灣東臨太平洋，西隔台灣海峽與福建相望。" },
    { id: "taiwan-geo-7", prompt: "台灣的平原大多分布在哪裡？", options: ["東部", "西部", "中央地帶", "全島平均分布"], answer: 1, hints: ["中央山脈縱貫", "西部地勢較平坦"], explanation: "中央山脈縱貫，平原多分布在西部沿海，所以西部人口也最稠密。" },
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
  takeaways: ["近義詞：意思相近，可互相替換（開心 ≈ 高興）", "反義詞：意思相反（冷 ↔ 熱）", "可從上下文判斷詞意是相近還是相反", "同一詞的反義詞要看語境（長度長↔短、輩分長↔晚）；近義詞語意微有差別，替換要讀順"],
  frames: [
    { step: "步驟 1：近義反義詞", id: 1, caption: "嗨！有些詞意思很像，有些詞意思恰恰相反，今天學近義詞和反義詞。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：開心高興近義", id: 2, caption: "「開心」和「高興」都表示快樂，意思相近，放在句子裡差不多，這叫近義詞。", ask: { prompt: "「開心」和「高興」意思相近，稱為？", options: ["反義詞", "近義詞", "諧音詞", "成語"], answer: 1, hint: "意思相近就是近義詞。" }, action: "point", prop: { kind: "text", text: "開心 ≈ 高興", sub: "意思相近，可互相替換", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：天平看近義", id: 3, caption: "這兩個詞在天平兩端平衡：意思差不多，只是說法不同，可以互換。", action: "think", prop: { kind: "balance", left: "開心", right: "高興", tip: "意思相近，可以互相替換" }, duration: 3600 },
    { step: "步驟 4：冷熱意思相反", id: 4, caption: "「冷」和「熱」、「大」和「小」意思完全相反，這叫反義詞。", action: "jump", prop: { kind: "text", text: "冷 ↔ 熱　大 ↔ 小", sub: "意思相反，就是反義詞", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：天平看反義", id: 5, caption: "再看天平：冷和熱在兩端對立，意思相反，不能互換。", ask: { prompt: "下列哪一組是反義詞？", options: ["開心／高興", "冷／熱", "美麗／漂亮", "快樂／歡喜"], answer: 1, hint: "冷和熱意思相反。" }, action: "point", prop: { kind: "balance", left: "冷", right: "熱", tip: "意思相反" }, duration: 3600 },
    { step: "步驟 6：寫作文換字", id: 6, caption: "為什麼要學？寫作文時同一個字不要一直重複，用近義詞換著說，文章會更生動。", action: "point", prop: { kind: "text", text: "重複「很好」→ 換「很棒／不錯」", sub: "近義詞讓文章更生動", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：從上下文判斷", id: 7, caption: "還可以從上下文判斷：同一段話裡，意思靠近是近義、意思對立是反義。", action: "walk", prop: { kind: "text", text: "看上下文：相近 or 相反", sub: "同一句中推敲詞意關係", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：反義詞要看語境", id: 8, caption: "注意：同一個詞在不同句子裡反義詞可能不同。「這條路很長」對短；「長輩」對晚輩，要看上下文。", ask: { prompt: "「這支鉛筆很長」的「長」，反義詞是？", options: ["短", "晚", "高", "大"], answer: 0, hint: "指長度時，長對短。" }, action: "think", prop: { kind: "text", text: "長(長度)↔短｜長(輩分)↔晚", sub: "依語境決定反義詞", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：近義詞微差", id: 9, caption: "近義詞不是百分之百相同：「開心」偏心情、「高興」偏喜悅，程度場合略有差別，替換時要讀一讀順不順。", action: "walk", prop: { kind: "text", text: "近義詞 ≠ 完全相同", sub: "替換後要唸順、語意貼切", tone: "ok" }, duration: 3600 },
    { step: "步驟 10：記近義反義口訣", id: 10, caption: "口訣：意思近是近義詞、意思反是反義詞。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "synonym-antonym-1", prompt: "「開心」和「高興」是什麼關係？", options: ["近義詞", "反義詞", "沒關係", "同音詞"], answer: 0, hints: ["兩者都表示快樂", "意思相近"], explanation: "開心和高興意思相近，是近義詞。" },
    { id: "synonym-antonym-2", prompt: "下列哪一組是反義詞？", options: ["美麗／漂亮", "冷／熱", "快樂／歡喜", "安靜／寧靜"], answer: 1, hints: ["冷和熱意思相反", "其他都是相近"], explanation: "冷和熱意思相反，是反義詞；其餘都是近義詞。" },
    { id: "synonym-antonym-3", prompt: "「黑暗」的反義詞最有可能是？", options: ["明亮", "漆黑", "陰影", "夜晚"], answer: 0, hints: ["反義詞要意思相反", "黑暗對光亮"], explanation: "黑暗是沒有光，反義詞是明亮。" },
    { id: "synonym-antonym-4", prompt: "「巨大」的近義詞可以是？", options: ["龐大", "微小", "細小", "短小"], answer: 0, hints: ["巨大表示很大", "找意思相近的詞"], explanation: "巨大和龐大意思相近，都表示很大，是近義詞。" },
    { id: "synonym-antonym-5", prompt: "閱讀時要怎麼判斷近義或反義？", options: ["隨便猜", "看上下文的意思相近或相反", "只看第一個字", "問別人"], answer: 1, hints: ["同一段話推敲", "相近或對立來判斷"], explanation: "從上下文判斷：詞意相近為近義詞、詞意對立為反義詞。" },
    { id: "synonym-antonym-6", prompt: "「這本書很厚」的「厚」，最恰當的反義詞是？", options: ["薄", "重", "大", "寬"], answer: 0, hints: ["形容厚度的厚", "厚 ↔ 薄"], explanation: "形容厚度時，「厚」的反義詞是「薄」。" },
    { id: "synonym-antonym-7", prompt: "下列哪一組「不是」近義詞？", options: ["美麗／漂亮", "迅速／快速", "勇敢／膽小", "聰明／伶俐"], answer: 2, hints: ["勇敢和膽小意思相反", "其餘意思都相近"], explanation: "勇敢和膽小意思相反，是反義詞不是近義詞；其他三組意思都相近。" },
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
  takeaways: ["小數加減要先把小數點對齊", "小數點對齊後按位數加減", "結果的小數點和原數對齊", "位數不同要先補 0 再對齊；十分位相加滿 10 要進到整數位"],
  frames: [
    { step: "步驟 1：認識小數加法題目", id: 1, caption: "嗨！3.5 元加 2.1 元到底是多少？今天我們一起學小數的加減。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：先把小數點對齊", id: 2, caption: "關鍵第一步：把兩個小數的小數點上下對齊，位數才不會錯。", action: "point", prop: { kind: "text", text: "3.5 ＋ 2.1", sub: "小數點一定要對齊", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：照位數分別相加", id: 3, caption: "對齊後，整數加整數、十分位加十分位：3＋2、0.5＋0.1。", action: "think", prop: { kind: "text", text: "3.5 ＋ 2.1 = 5.6", sub: "整數位與小數位分開加", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：用數線驗算", id: 4, caption: "從 3.5 往右走 2.1 格，停在 5.6，和算的一樣！", ask: { prompt: "3.5 ＋ 2.1 等於多少？", options: ["5.6", "5.05", "5.15", "6.6"], answer: 0, hint: "小數點對齊後 3+2、0.5+0.1。" }, action: "walk", prop: { kind: "numberLine", from: 3, to: 6, marks: [{ at: 3.5, label: "起點", tone: "ok" }, { at: 5.6, label: "終點", tone: "ok" }], cursor: 5.6 }, duration: 3800 },
    { step: "步驟 5：位數不同先補0", id: 5, caption: "位數不一樣也要對齊：3.45 ＋ 2.1，把 2.1 寫成 2.10 再對齊，百分位才不會錯位。", action: "point", prop: { kind: "text", text: "3.45 ＋ 2.10 = 5.55", sub: "位數不足補 0 再對齊", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：小數減法也對齊", id: 6, caption: "減法一樣：4.8 − 1.3，小數點對齊後 4−1、0.8−0.3 = 3.5。", action: "point", prop: { kind: "text", text: "4.8 − 1.3 = 3.5", sub: "小數點對齊再相減", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：退位要注意", id: 7, caption: "小心退位：5.2 − 3.7，2 減 7 不夠，向 5 借 1 當 10。", ask: { prompt: "5.2 − 3.7 等於多少？", options: ["1.5", "2.5", "1.9", "2.1"], answer: 0, hint: "十分位 2 減 7 不夠，向整數借 1。" }, action: "think", prop: { kind: "text", text: "5.2 − 3.7 = 1.5", sub: "不夠減要向整數位借位", tone: "warn" }, duration: 3800 },
    { step: "步驟 8：十分位進位", id: 8, caption: "小心進位：十分位相加滿 10 要進到整數位，別把 0.7 ＋ 0.8 誤算成 0.15。", ask: { prompt: "0.7 ＋ 0.8 等於多少？", options: ["1.5", "0.15", "15", "0.5"], answer: 0, hint: "0.7+0.8=1.5，滿十要進位。" }, action: "think", prop: { kind: "text", text: "0.7 ＋ 0.8 = 1.5", sub: "滿 10 進 1 到整數位", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：生活中的小數", id: 9, caption: "生活中到處是小數：買東西找零、量身高公分，都要把小數點對齊才不會算錯錢。", action: "walk", prop: { kind: "text", text: "找零、量身高 → 對齊小數點", sub: "算錯一點就差很多", tone: "ok" }, duration: 3600 },
    { step: "步驟 10：記小數點對齊口訣", id: 10, caption: "口訣：小數點對齊，像整數一樣加減。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "decimal-add-1", prompt: "3.2 ＋ 4.5 等於多少？", options: ["7.7", "7.2", "8.7", "7.5"], answer: 0, hints: ["小數點對齊，3+4、0.2+0.5", "=7.7"], explanation: "小數點對齊後 3+4=7、0.2+0.5=0.7，得 7.7。" },
    { id: "decimal-add-2", prompt: "6.8 − 2.3 等於多少？", options: ["4.5", "4.1", "5.5", "3.5"], answer: 0, hints: ["小數點對齊，6−2、0.8−0.3", "=4.5"], explanation: "對齊後 6−2=4、0.8−0.3=0.5，得 4.5。" },
    { id: "decimal-add-3", prompt: "小數加減時，最重要的第一步是？", options: ["把數字排好", "小數點對齊", "先算整數", "隨便加"], answer: 1, hints: ["不對齊位數會算錯", "對齊才不會把十分位加錯"], explanation: "小數加減必須先讓小數點上下對齊，位數才不會錯。" },
    { id: "decimal-add-4", prompt: "5.2 − 3.7 等於多少？", options: ["1.5", "2.5", "1.9", "3.5"], answer: 0, hints: ["十分位不夠減要借位", "12−7=5，整數 4−3=1"], explanation: "5.2−3.7，十分位 2 減 7 不夠，向 5 借 1 成 12−7=5；整數 4−3=1，得 1.5。" },
    { id: "decimal-add-5", prompt: "1.4 ＋ 0.6 等於多少？", options: ["1.10", "2.0", "1.0", "0.20"], answer: 1, hints: ["0.4+0.6=1.0 進位", "1+0+1=2"], explanation: "1.4+0.6，十分位 4+6=10 進 1，整數 1+0+1=2，得 2.0。" },
    { id: "decimal-add-6", prompt: "3.45 ＋ 2.1 等於多少？", options: ["5.55", "3.66", "5.46", "3.47"], answer: 0, hints: ["先把 2.1 看成 2.10 再對齊", "3.45+2.10=5.55"], explanation: "位數不同先補 0：3.45＋2.10＝5.55。" },
    { id: "decimal-add-7", prompt: "小數加法中，十分位 7 ＋ 5 = 12，正確做法是？", options: ["寫成 .12 留在十分位", "進 1 到整數位，十分位寫 2", "捨棄不計", "只寫 2"], answer: 1, hints: ["滿十要進位", "跟整數加法一樣"], explanation: "十分位滿十要進一位到整數位，十分位留 2，不能兩個數擠在同一格。" },
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
  takeaways: ["長方體體積 = 長×寬×高", "體積單位是立方公分等", "容器內部能裝多少是容積", "體積是三維要長×寬×高連乘（不是相加）；正方體體積＝邊長×邊長×邊長"],
  frames: [
    { step: "步驟 1：鞋盒大小的問題", id: 1, caption: "嗨！這個長方體鞋盒，到底佔多大空間？今天學體積。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：用立方公分堆", id: 2, caption: "先想：1 個 1 立方公分的小方塊，是體積的最小單位。", action: "point", prop: { kind: "text", text: "1 立方公分 (cm³)", sub: "體積的最小方塊", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：一排有幾個", id: 3, caption: "底下一排擺 5 個，正面寬 3 個，一層就是 5×3 = 15 個。", action: "think", prop: { kind: "text", text: "一層：長5 × 寬3 = 15", sub: "底層排滿的小方塊數", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：疊幾層", id: 4, caption: "高度疊 2 層，總共 15 × 2 = 30 個小方塊，體積就是 30 立方公分。", ask: { prompt: "長5、寬3、高2的長方體，體積多少？", options: ["30", "10", "15", "60"], answer: 0, hint: "5×3×2 = 30。" }, action: "jump", prop: { kind: "bars", items: [{ label: "一層", value: 15 }, { label: "兩層", value: 30 }], unit: "個", active: 1 }, duration: 3800 },
    { step: "步驟 5：公式長乘寬乘高", id: 5, caption: "整理成公式：體積 ＝ 長 × 寬 × 高。記住三個數都要乘。", action: "point", prop: { kind: "text", text: "體積 = 長 × 寬 × 高", sub: "5 × 3 × 2 = 30 cm³", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：為什麼是相乘", id: 6, caption: "為什麼是乘不是加？長乘寬算出底層有幾個、再乘高算疊了幾層，所以三個要連乘，不是相加。", action: "point", prop: { kind: "balance", left: "長×寬：底層個數", right: "×高：共疊幾層", tip: "三維度要連乘" }, duration: 3600 },
    { step: "步驟 7：體積與容積", id: 7, caption: "體積是物體佔的空間；容器裡能裝多少水，叫做「容積」。", ask: { prompt: "500 立方公分的盒子，最多能裝多少水？", options: ["500 毫升", "50 毫升", "5 毫升", "5000 毫升"], answer: 0, hint: "1 立方公分 = 1 毫升。" }, action: "walk", prop: { kind: "text", text: "體積：佔的空間", sub: "容積：容器能裝多少（1 cm³ = 1 mL）", tone: "ok" }, duration: 3800 },
    { step: "步驟 8：別把體積加成和", id: 8, caption: "易錯：體積要三個維度相乘，不是把長寬高加起來，也不是只算一個面。", ask: { prompt: "有人把長方體體積算成「長＋寬＋高」，錯在哪？", options: ["完全沒錯", "體積是三維空間，要長×寬×高相乘", "應該改用減法", "應該只算長×寬"], answer: 1, hint: "體積佔三個維度，要連乘不是相加。" }, action: "think", prop: { kind: "text", text: "體積＝長×寬×高（不是加）", sub: "相加只算一條邊長", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：正方體特例", id: 9, caption: "特例：三邊一樣長的是正方體，體積＝邊長×邊長×邊長，例如邊長 3 就是 3×3×3＝27。", action: "walk", prop: { kind: "text", text: "正方體：邊長³", sub: "邊長3 → 3×3×3=27 cm³", tone: "ok" }, duration: 3600 },
    { step: "步驟 10：記長寬高相乘", id: 10, caption: "口訣：體積＝長×寬×高；容器裝的是容積。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "cuboid-volume-1", prompt: "長方體體積公式是？", options: ["長+寬+高", "長×寬×高", "長×寬", "(長+寬)×高"], answer: 1, hints: ["三個維度都要乘", "長寬高相乘"], explanation: "長方體體積 = 長 × 寬 × 高。" },
    { id: "cuboid-volume-2", prompt: "長 4、寬 3、高 2 的長方體，體積多少？", options: ["24", "9", "14", "12"], answer: 0, hints: ["4×3×2", "先 4×3=12 再×2"], explanation: "4×3×2 = 24 立方單位。" },
    { id: "cuboid-volume-3", prompt: "長 5、寬 3、高 2，剛算過體積 30，單位是？", options: ["平方公分", "立方公分", "公分", "毫升"], answer: 1, hints: ["體積是三維，用立方", "長寬高都乘起來"], explanation: "體積是三維空間，單位是立方公分（cm³）。" },
    { id: "cuboid-volume-4", prompt: "「容器能裝多少水」叫做？", options: ["體積", "容積", "重量", "面積"], answer: 1, hints: ["是內部能裝的量", "和物體佔空間不同"], explanation: "容器內部能裝的液體量叫做容積。" },
    { id: "cuboid-volume-5", prompt: "1 立方公分等於多少毫升？", options: ["1 毫升", "10 毫升", "100 毫升", "0.1 毫升"], answer: 0, hints: ["兩者是同一容量的不同說法", "cm³ 與 mL 相等"], explanation: "1 立方公分 (cm³) 剛好等於 1 毫升 (mL)。" },
    { id: "cuboid-volume-6", prompt: "邊長 2 公分的正方體，體積是多少？", options: ["8 立方公分", "6 立方公分", "4 立方公分", "12 立方公分"], answer: 0, hints: ["正方體體積＝邊長×邊長×邊長", "2×2×2=8"], explanation: "正方體三邊相等，體積＝2×2×2＝8 立方公分。" },
    { id: "cuboid-volume-7", prompt: "一個長方體體積 60，長 5、寬 4，高是多少？", options: ["3", "15", "20", "12"], answer: 0, hints: ["體積＝長×寬×高", "60 ÷ (5×4) = 60÷20"], explanation: "高＝體積÷長÷寬＝60÷5÷4＝3。" },
  ],
};





/* ========================================================================
 * 課程 34：英語（國中）— 被動語態 be + p.p.
 * 用字卡、天平（主動↔被動）與流程圖講 be 隨時態變。
 * ======================================================================== */





/** 目前上架的動畫課清單（多學科，驗證架構通用性）。 */
/** 寫在本檔的核心課程（其餘分冊課程見下方 glob 彙總）。 */
export const CORE_LESSONS: OnionLesson[] = [
  FRACTION_LESSON,
  CHINESE_DE_LESSON,
  WATER_CYCLE_LESSON,
  TRIANGLE_AREA_LESSON,
  PHOTOSYNTHESIS_LESSON,
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
