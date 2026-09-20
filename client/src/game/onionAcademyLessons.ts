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
/** 學段：國小／國中。跨學段的課（如「五上・七上」）會同時屬於兩邊。 */
export type OnionStage = "國小" | "國中";

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
    { id: 1, caption: "嗨！今天我們用一塊披薩，搞懂分數加法。", action: "wave", prop: { kind: "none" }, duration: 2600 },
    { id: 2, caption: "把披薩切成 4 等份，每一份就是 1/4。", action: "point", prop: { kind: "pie", a: 1, b: 4 }, duration: 3000 },
    { id: 3, caption: "你吃了 1 片，等於吃掉 1/4 塊披薩。", ask: { prompt: "披薩切成 4 等份，吃掉 1 片是多少？", options: ["1/4", "1/2", "4/1", "1/3"], answer: 0, hint: "全部 4 份中的 1 份，就是 1/4。" }, action: "think", prop: { kind: "pie", a: 1, b: 4, label: "1/4" }, duration: 3000 },
    { id: 4, caption: "朋友又夾給你 2 片，等於再多了 2/4。", action: "walk", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 } }, duration: 3400 },
    { id: 5, caption: "分母一樣（都是 4），就把分子直接相加！", ask: { prompt: "1/4 ＋ 2/4，相加後分母應該是多少？", options: ["4", "8", "6", "2"], answer: 0, hint: "同分母相加，分母保持不變。" }, action: "point", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 }, result: { a: 3, b: 4 } }, duration: 3400 },
    { id: 6, caption: "1 + 2 = 3，所以 1/4 ＋ 2/4 ＝ 3/4。", action: "jump", prop: { kind: "pie", a: 3, b: 4, label: "3/4" }, duration: 3200 },
    { id: 7, caption: "口訣：同分母相加，分母不變、分子相加。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
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
    { id: 1, caption: "嗨！這三個字讀起來都一樣，可是用法完全不同喔。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, caption: "「的」放在名詞前面，用來修飾。像「紅的蘋果」。", action: "point", prop: { kind: "text", text: "紅的蘋果", sub: "形容詞＋的＋名詞", tone: "ok" }, duration: 3400 },
    { id: 3, caption: "「得」放在動詞後面，補充說明程度。像「跑得快」。", ask: { prompt: "「跑__很快」，空格要填哪一個字？", options: ["的", "得", "地", "都不填"], answer: 1, hint: "動詞後面補充程度，用「得」。" }, action: "think", prop: { kind: "text", text: "跑得快", sub: "動詞＋得＋補語", tone: "ok" }, duration: 3400 },
    { id: 4, caption: "「地」放在動詞前面，修飾動作的方式。像「慢慢地走」。", action: "walk", prop: { kind: "text", text: "慢慢地走", sub: "副詞＋地＋動詞", tone: "ok" }, duration: 3400 },
    { id: 5, caption: "記口訣：的接名詞、得接動詞後、地接動詞前。", ask: { prompt: "「很漂亮__衣服」，後面接名詞，要用哪個？", options: ["的", "得", "地", "都可以"], answer: 0, hint: "後面是名詞「衣服」，用「的」。" }, action: "cheer", prop: { kind: "text", text: "的→名詞  得→動詞後  地→動詞前", tone: "ok" }, duration: 3600 },
    { id: 6, caption: "小心！「很漂亮的衣服」用的是「的」，因為後面接名詞「衣服」。", action: "point", prop: { kind: "text", text: "很漂亮的（的→對）衣服", sub: "後面是名詞，所以用的", tone: "ok" }, duration: 3600 },
    { id: 7, caption: "口訣記好了嗎？準備闖關，看看你會不會分！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
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
    { id: 1, caption: "嗨！你有沒有想過，天上的雨從哪裡來？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, caption: "太陽把海和河裡的水加熱，水變成水蒸氣往上升——這叫「蒸發」。", action: "point", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 0 }, duration: 3600 },
    { id: 3, caption: "水蒸氣到了高空，遇到冷就變回小水珠，聚成雲——這叫「凝結」。", ask: { prompt: "水蒸氣到高空遇冷變成雲，這個過程叫什麼？", options: ["蒸發", "凝結", "降水", "匯流"], answer: 1, hint: "氣體遇冷變回小水珠，就是凝結。" }, action: "think", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 1 }, duration: 3600 },
    { id: 4, caption: "雲裡的水珠越聚越重，掉下來變成雨或雪——這叫「降水」。", action: "jump", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 2 }, duration: 3600 },
    { id: 5, caption: "雨水流回河川和海洋，叫做「匯流」，然後又開始下一輪！", action: "walk", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"], active: 3 }, duration: 3600 },
    { id: 6, caption: "四個階段不斷循環，水就這樣在天上地下旅行，永遠不會用完。", ask: { prompt: "推動水循環不停轉動的能量來自哪裡？", options: ["太陽", "月亮", "風", "地熱"], answer: 0, hint: "太陽提供熱能，讓水蒸發上升。" }, action: "cheer", prop: { kind: "cycle", nodes: ["蒸發", "凝結", "降水", "匯流"] }, duration: 3400 },
    { id: 7, caption: "記住：循環的能量來自太陽。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
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
    { id: 1, caption: "嗨！三角形面積有個好記的公式，但你知道它怎麼來的嗎？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, caption: "先認識三角形：這條橫的叫「底」，從底垂直往上量到頂點叫「高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底8 高5" }, duration: 3600 },
    { id: 3, caption: "如果拿兩個一模一樣的三角形，可以拼成一個平行四邊形！", ask: { prompt: "兩個一模一樣的三角形，可以拼成什麼形狀？", options: ["平行四邊形", "圓形", "梯形", "五角形"], answer: 0, hint: "底相同、高相同，拼起來是平行四邊形。" }, action: "think", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "兩個三角形→平行四邊形" }, duration: 3800 },
    { id: 4, caption: "平行四邊形的面積是「底×高」。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高 = 8×5 = 40" }, duration: 3600 },
    { id: 5, caption: "三角形只是平行四邊形的一半，所以要再除以 2！", ask: { prompt: "拼出的平行四邊形面積是 40，三角形是多少？", options: ["40", "20", "80", "10"], answer: 1, hint: "三角形剛好是平行四邊形的一半，40÷2。" }, action: "jump", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "40÷2 = 20" }, duration: 3600 },
    { id: 6, caption: "所以三角形面積 = 底 × 高 ÷ 2。記住了嗎？", action: "cheer", prop: { kind: "shape", shape: "triangle", base: 8, height: 5, label: "底×高÷2" }, duration: 3200 },
    { id: 7, caption: "口訣：底乘高、除以二。準備闖關算算看！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
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
  grade: "五上・七上",
  stages: ["國小", "國中"],
  desc: "植物不會吃飯，怎麼長大？洋蔥帶你走進葉子的綠色工廠，看陽光、水、二氧化碳怎麼變成養分和氧氣。",
  takeaways: ["原料＝水＋二氧化碳，能量＝陽光", "場所在葉綠體", "產物＝養分（葡萄糖）＋氧氣"],
  frames: [
    { id: 1, caption: "嗨！植物的葉子其實是一座精密的工廠，今天帶你進去參觀！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, caption: "這座工廠需要三樣原料：陽光、水、二氧化碳。先來看水從哪裡來。", action: "point", prop: { kind: "none" }, duration: 3200 },
    { id: 3, caption: "水由根部吸收，沿著莖裡的細管子，一路往上送到葉子。", action: "walk", prop: { kind: "none" }, duration: 3400 },
    { id: 4, caption: "第二樣原料——二氧化碳，從葉背的小孔「氣孔」溜進來。", ask: { prompt: "二氧化碳是從葉子的哪裡進來的？", options: ["氣孔", "葉尖", "根", "花瓣"], answer: 0, hint: "葉背的小孔叫氣孔，氣體從這裡進出。" }, action: "point", prop: { kind: "none" }, duration: 3400 },
    { id: 5, caption: "葉肉裡有好多綠色小顆粒——葉綠體，它就是工廠的機器房，也是葉子是綠色的原因。", action: "think", prop: { kind: "none" }, duration: 3600 },
    { id: 6, caption: "陽光照進葉綠體，機器開動！把水和二氧化碳「合成」成養分。", action: "jump", prop: { kind: "none" }, duration: 3600 },
    { id: 7, caption: "合成出來的養分（葡萄糖）送到根、莖、全身，讓植物長高長大。", ask: { prompt: "光合作用做完後，排出來的是哪一種氣體？", options: ["氧氣", "二氧化碳", "氮氣", "水蒸氣"], answer: 0, hint: "副產品是氧氣，正好給我們呼吸。" }, action: "point", prop: { kind: "none" }, duration: 3400 },
    { id: 8, caption: "同時，工廠排出副產品——氧氣！從氣孔釋放出去，正好給我們呼吸。", action: "cheer", prop: { kind: "none" }, duration: 3400 },
    { id: 9, caption: "公式記起來：二氧化碳＋水 →（陽光・葉綠體）養分＋氧氣。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { id: 10, caption: "口訣：根送水、孔進氣、葉綠體曬太陽，變養分、吐氧氣。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
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
    { id: 1, caption: "嗨！天氣預報說「明天零下 3 度」，零下到底是什麼意思呢？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, caption: "比 0 小的數，就用「−」號表示：零下 3 度寫成 −3，念作「負三」。", action: "point", prop: { kind: "none" }, duration: 3400 },
    { id: 3, caption: "把所有數排成一條線：中間是 0，右邊是正數，左邊是負數——這就是「數線」。", action: "walk", prop: { kind: "none" }, duration: 3600 },
    { id: 4, caption: "數線三要素：原點（0 的位置）、正方向（通常朝右）、單位長度（每一格一樣大）。", action: "point", prop: { kind: "none" }, duration: 3800 },
    { id: 5, caption: "小船從 0 出發，往左（負方向）開 4 格，就到 −4 的位置。", ask: { prompt: "從 0 往左（負方向）走 4 格，會到哪個數？", options: ["−4", "4", "0", "−1"], answer: 0, hint: "數線左邊是負的方向。" }, action: "walk", prop: { kind: "none" }, duration: 3600 },
    { id: 6, caption: "再從 −4 往右開 6 格：−4 ＋ 6 ＝ 2，停在 2。左加右減，在數線上一目了然！", action: "walk", prop: { kind: "none" }, duration: 3800 },
    { id: 7, caption: "在數線上，越右邊的數越大：−4 ＜ −1 ＜ 0 ＜ 2。", ask: { prompt: "−2 和 −6，哪一個比較大？", options: ["−2", "−6", "一樣大", "不能比較"], answer: 0, hint: "數線越右邊越大，−2 在 −6 右邊。" }, action: "point", prop: { kind: "none" }, duration: 3600 },
    { id: 8, caption: "兩個負數怎麼比？記住：離 0 越遠的負數反而越小，所以 −5 ＜ −2。", action: "think", prop: { kind: "none" }, duration: 3800 },
    { id: 9, caption: "−3 和 3 到 0 的距離一樣遠（都是 3 格），它們互為「相反數」。", action: "jump", prop: { kind: "none" }, duration: 3600 },
    { id: 10, caption: "口訣：右大左小，負數離零越遠越小。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
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
    { id: 1, caption: "嗨！這裡有一座天平：左邊是一個神秘箱子和 3 個砝碼，右邊是 8 個砝碼，剛好平衡。", action: "wave", prop: { kind: "none" }, duration: 3800 },
    { id: 2, caption: "平衡就代表「左邊 ＝ 右邊」。箱子重 x，寫成式子就是：x ＋ 3 ＝ 8。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { id: 3, caption: "解方程式的目標：想辦法讓 x 一個人留在左邊，就知道它等於多少。", action: "think", prop: { kind: "none" }, duration: 3400 },
    { id: 4, caption: "第一步：從兩邊同時拿走 3 個砝碼。天平兩邊一起減，還是平衡的！", ask: { prompt: "x ＋ 3 ＝ 8，兩邊同時拿走 3，右邊還剩幾個砝碼？", options: ["5", "3", "8", "11"], answer: 0, hint: "8 − 3 ＝ 5，天平兩邊一起拿才會平衡。" }, action: "jump", prop: { kind: "none" }, duration: 3800 },
    { id: 5, caption: "左邊只剩 x，右邊剩 5 個砝碼，所以 x ＝ 5。解開了！", action: "cheer", prop: { kind: "none" }, duration: 3400 },
    { id: 6, caption: "檢驗一下：把 5 代回去，5 ＋ 3 ＝ 8，右邊也是 8，答對！", action: "point", prop: { kind: "none" }, duration: 3400 },
    { id: 7, caption: "剛剛「兩邊同減 3」，寫快一點就是：把 ＋3 從左邊搬到右邊，要變號成 −3。這叫「移項」。", ask: { prompt: "把「＋3」從左邊移到右邊，會變成什麼？", options: ["−3", "＋3", "×3", "÷3"], answer: 0, hint: "移項要變號：加變減。" }, action: "walk", prop: { kind: "none" }, duration: 3800 },
    { id: 8, caption: "口訣：移項要變號——加變減、減變加，乘變除、除變乘。", action: "cheer", prop: { kind: "none" }, duration: 3400 },
    { id: 9, caption: "再試一題：x − 2 ＝ 6。把 −2 移到右邊變 ＋2，得到 x ＝ 8。", action: "point", prop: { kind: "none" }, duration: 3600 },
    { id: 10, caption: "總整理：天平兩邊同進退，移項記得要變號。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
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
    { id: 1, caption: "嗨！今天由我親自介紹我的好朋友——洋蔥表皮細胞，因為我自己就是細胞組成的！", action: "wave", prop: { kind: "none" }, duration: 3400 },
    { id: 2, caption: "細胞是生物體最小的基本單位，一隻動物、一棵植物，都是由細胞組成的。", action: "point", prop: { kind: "none" }, duration: 3400 },
    { id: 3, caption: "把洋蔥表皮薄薄撕下一層，放到顯微鏡下——哇，一格一格像紅磚牆！每一格就是一個細胞。", action: "jump", prop: { kind: "none" }, duration: 3800 },
    { id: 4, caption: "最外面硬硬的框是「細胞壁」，像牆壁一樣保護細胞、維持方方的外形。植物才有喔！", action: "point", prop: { kind: "none" }, duration: 3800 },
    { id: 5, caption: "細胞壁內側還有一層薄薄的「細胞膜」，像大門的守衛，控制哪些東西可以進出。", ask: { prompt: "控制物質進出細胞的「守衛」是哪一個構造？", options: ["細胞膜", "細胞壁", "細胞核", "液泡"], answer: 0, hint: "細胞壁是外牆，真正管進出的是裡面的膜。" }, action: "point", prop: { kind: "none" }, duration: 3600 },
    { id: 6, caption: "裡面那顆深色圓球是「細胞核」，細胞的指揮中心，藏著遺傳物質 DNA。", action: "think", prop: { kind: "none" }, duration: 3600 },
    { id: 7, caption: "中間大大的泡泡是「液泡」，細胞的倉庫，儲存水分和養分——切洋蔥讓你流淚的就是它！", action: "jump", prop: { kind: "none" }, duration: 3800 },
    { id: 8, caption: "植物細胞有細胞壁和葉綠體，動物細胞沒有——這是兩者最大的差別。", ask: { prompt: "動物細胞沒有的構造是哪一個？", options: ["細胞壁", "細胞膜", "細胞核", "細胞質"], answer: 0, hint: "細胞壁（和葉綠體）只有植物細胞才有。" }, action: "point", prop: { kind: "none" }, duration: 3600 },
    { id: 9, caption: "由小到大：細胞 → 組織 → 器官 → 器官系統 → 個體，層層組合成一個生命。", action: "walk", prop: { kind: "none" }, duration: 3600 },
    { id: 10, caption: "口訣：牆保護、門進出、核指揮、泡儲水。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "c1", prompt: "生物體結構與功能的最小基本單位是什麼？", options: ["組織", "器官", "細胞", "系統"], answer: 2, hints: ["生物體最小的單位是什麼", "組織、器官都由它組成"], explanation: "所有生物都由細胞組成，細胞是最小的基本單位。" },
    { id: "c2", prompt: "保護細胞、維持植物細胞方形外觀的構造是？", options: ["細胞膜", "細胞壁", "液泡", "細胞核"], answer: 1, hints: ["植物細胞最外層、硬硬的那個構造", "它像牆壁一樣維持形狀"], explanation: "細胞壁在最外層，像牆壁一樣保護並撐起植物細胞的形狀。" },
    { id: "c3", prompt: "控制物質進出細胞的「守衛」是哪一個構造？", options: ["細胞壁", "細胞膜", "液泡", "葉綠體"], answer: 1, hints: ["像大門守衛、管制進出的構造", "不是最外層的牆，是裡面的膜"], explanation: "細胞膜像大門守衛，允許需要的物質進、不需要的擋住。" },
    { id: "c4", prompt: "含有遺傳物質、堪稱細胞指揮中心的是？", options: ["細胞核", "液泡", "細胞質", "細胞壁"], answer: 0, hints: ["藏著遺傳物質、指揮細胞的地方", "深色的圓球"], explanation: "細胞核內有 DNA，負責指揮細胞的活動與遺傳。" },
    { id: "c5", prompt: "動物細胞沒有、植物細胞才有的構造是？", options: ["細胞核和細胞膜", "細胞壁和葉綠體", "細胞質和液泡", "細胞膜和細胞質"], answer: 1, hints: ["植物才有、動物沒有的構造", "細胞壁和葉綠體"], explanation: "細胞壁與葉綠體是植物細胞特有的構造，動物細胞沒有。" },
  ],
};

/** 目前上架的動畫課清單（多學科，驗證架構通用性）。 */
export const ONION_LESSONS: OnionLesson[] = [
  FRACTION_LESSON,
  CHINESE_DE_LESSON,
  WATER_CYCLE_LESSON,
  TRIANGLE_AREA_LESSON,
  PHOTOSYNTHESIS_LESSON,
  NEGATIVE_NUMBER_LESSON,
  LINEAR_EQUATION_LESSON,
  ONION_CELL_LESSON,
];

/** 依 id 取課；找不到時回傳第一課作為兜底。 */
export function getOnionLesson(id: string): OnionLesson {
  return ONION_LESSONS.find((l) => l.id === id) ?? FRACTION_LESSON;
}
