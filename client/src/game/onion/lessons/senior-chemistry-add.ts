/**
 * 高中化學課程（洋蔥學院 200 堂擴充計畫：三、高中新增 65 堂／化學 8 堂）。
 *
 * 高中化學比國中更深：每堂都在「先做計算、再講趨勢」，圖解教具上的數字與字幕
 * 完全對齊（原子半徑 pm、電負度、熔點 °C、莫耳濃度 M、pH 等），所有計算題的
 * 數值都自行算過，確保學生看到的圖與講的話不會打架。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 課程 1：化學 — 原子結構與週期表（高一）
 * 核心：質子＝電子（中性原子）、同位素、質量數；同週期半徑變小、電負度與游離能變大。
 * ======================================================================== */
const SH_CHEM_ATOM: OnionLesson = {
  id: "sh-chem-atom",
  title: "原子結構與週期表",
  subject: "化學",
  topic: "原子與元素週期表",
  grade: "高一",
  stages: ["高中"],
  desc: "原子序等於質子數也等於電子數；同位素差在中子。同週期由左到右半徑變小、電負度與游離能變大。",
  takeaways: [
    "中性原子：原子序 ＝ 質子數 ＝ 電子數；同位素質子數相同、中子數不同。",
    "質量數 ＝ 質子數 ＋ 中子數；同位素因中子數不同而質量數不同。",
    "同週期由左到右：原子半徑變小、電負度變大、游離能大致變大。",
  ],
  frames: [
    { step: "步驟 1：先數質子與電子", id: 1, caption: "拿到一個原子，先看原子序：它等於質子數；中性原子裡質子數也等於電子數，電性才會平衡。", action: "wave", prop: { kind: "text", text: "原子序 ＝ 質子數 ＝ 電子數（中性原子）", sub: "質子帶正電、電子帶負電", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：同位素看中子數", id: 2, caption: "同一種元素還有兄弟版，叫同位素：它們質子數一樣，但中子數不同，所以質量數也不一樣。", action: "point", prop: { kind: "text", text: "同位素：質子數相同、中子數不同", sub: "如碳-12 與碳-14", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：質量數這樣算", id: 3, caption: "算質量數很簡單：把質子數和中子數加起來。碳-14 有 6 個質子、8 個中子，質量數就是 14。", action: "walk", prop: { kind: "balance", left: "質量數 ＝ 質子 ＋ 中子", right: "碳-14：6 ＋ 8 ＝ 14", tip: "質量數約等於原子量" }, duration: 3800 },
    { step: "步驟 4：同週期半徑變小", id: 4, caption: "同週期由左到右，原子半徑越來越小：左邊的鈉約 186 pm，右邊的氯只有約 99 pm。", action: "think", prop: { kind: "bars", items: [{ label: "Na", value: 186 }, { label: "Cl", value: 99 }], unit: "pm", active: 1 }, duration: 3800, ask: { prompt: "同週期由左到右，原子半徑會怎麼變？", options: ["越來越大", "越來越小", "不變", "不一定"], answer: 1, hint: "核電荷增加，把電子拉得更緊。" } },
    { step: "步驟 5：電負度變大", id: 5, caption: "同一週期電負度也由左到右變大：鈉只有 0.9，氯高達 3.0，抓電子的能力強很多。", action: "point", prop: { kind: "bars", items: [{ label: "Na", value: 0.9 }, { label: "Cl", value: 3.0 }], unit: "（鮑林標度）", active: 1 }, duration: 3800 },
    { step: "步驟 6：游離能大致變大", id: 6, caption: "游離能是「拔走一個電子要多少能量」：同週期由左到右大致變大，所以右邊的氯比左邊的鈉難電離。", action: "jump", prop: { kind: "text", text: "同週期：游離能大致變大", sub: "但 Be→B、N→O 有小波動", tone: "ok" }, duration: 3800, ask: { prompt: "同週期中，哪一邊的游離能通常較大？", options: ["越靠左越大", "越靠右越大", "都一樣大", "不一定"], answer: 1, hint: "核電荷越大，越難拔走電子。" } },
    { step: "步驟 7：帶走這張週期表", id: 7, caption: "記住三句：原子序＝質子＝電子；同位素差在中子；同週期由左到右半徑變小、電負度與游離能變大。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-atom-1", prompt: "中性原子中，質子數與電子數的關係是？", options: ["相等", "質子數較多", "電子數較多", "不一定"], answer: 0, hints: ["中性原子電性總和為 0", "正電（質子）與負電（電子）數量要相等"], explanation: "中性原子不帶電，質子帶正電、電子帶負電，所以質子數＝電子數。" },
    { id: "sh-chem-atom-2", prompt: "同位素之間，下列哪一個一定相同？", options: ["中子數", "質子數", "質量數", "原子量"], answer: 1, hints: ["同位素是同種元素的不同版本", "元素由質子數來定義"], explanation: "同位素是同一元素（質子數相同）但中子數不同，所以質子數一定相同。" },
    { id: "sh-chem-atom-3", prompt: "碳-14（質子 6、質量數 14）有幾個中子？", options: ["6", "8", "14", "7"], answer: 1, hints: ["中子數 ＝ 質量數 − 質子數", "14 − 6 ＝ ?"], explanation: "中子數 ＝ 質量數 − 質子數 ＝ 14 − 6 ＝ 8。" },
    { id: "sh-chem-atom-4", prompt: "同一週期由左到右，原子半徑的變化是？", options: ["變大", "變小", "不變", "先大後小"], answer: 1, hints: ["核電荷增加把電子拉緊", "最右邊的惰性氣體最小"], explanation: "同週期核電荷增加、電子層數不變，原子半徑由左到右變小。" },
    { id: "sh-chem-atom-5", prompt: "下列元素中，誰的原子半徑最大（同屬第三週期）？", options: ["Na", "Mg", "Al", "Cl"], answer: 0, hints: ["越靠左半徑越大", "氯在最右邊最小"], explanation: "同週期由左到右半徑變小，鈉在最左邊，所以半徑最大。" },
  ],
};

/* ========================================================================
 * 課程 2：化學 — 化學鍵（高一）
 * 核心：離子鍵（電子轉移）、共價鍵（電子共用）、金屬鍵（電子海）；鍵越強熔點越高。
 * ======================================================================== */
const SH_CHEM_BOND: OnionLesson = {
  id: "sh-chem-bond",
  title: "化學鍵：離子、共價、金屬",
  subject: "化學",
  topic: "化學鍵與物質性質",
  grade: "高一",
  stages: ["高中"],
  desc: "金屬配非金屬形成離子鍵（電子轉移）；非金屬間是共價鍵（電子共用）；金屬本身是金屬鍵（電子海）。鍵越強熔點越高。",
  takeaways: [
    "離子鍵：金屬失去電子、非金屬得到電子，靠靜電吸引結合（如 NaCl）。",
    "共價鍵：非金屬之間共用電子對（如 H₂O、CO₂）。",
    "金屬鍵：金屬陽離子沉浸在自由電子海中，所以能導電、有延展性。",
  ],
  frames: [
    { step: "步驟 1：先認三種化學鍵", id: 1, caption: "化學鍵就是把原子抓在一起的力量，主要分三種：離子鍵、共價鍵、金屬鍵，我們先認個臉。", action: "wave", prop: { kind: "flow", steps: ["離子鍵", "共價鍵", "金屬鍵"], active: 0 }, duration: 3400 },
    { step: "步驟 2：離子鍵靠轉移", id: 2, caption: "離子鍵發生在金屬和非金屬之間：金屬丟出電子變陽離子、非金屬接收變陰離子，靠正負電相吸。", action: "point", prop: { kind: "text", text: "離子鍵：金屬 ＋ 非金屬", sub: "金屬失電子、非金屬得電子（如 NaCl）", tone: "ok" }, duration: 3800, ask: { prompt: "離子鍵主要是靠什麼把原子結合？", options: ["共用電子對", "電子轉移後的靜電吸引", "金屬鍵", "氫鍵"], answer: 1, hint: "金屬給出電子、非金屬接收。" } },
    { step: "步驟 3：共價鍵共用", id: 3, caption: "共價鍵是非金屬跟非金屬之間，大家把電子「共用」一對，像 H₂O、CO₂ 都是共用電子對連起來。", action: "think", prop: { kind: "text", text: "共價鍵：非金屬之間共用電子對", sub: "如 H₂、O₂、H₂O、CO₂", tone: "ok" }, duration: 3400 },
    { step: "步驟 4：金屬鍵電子海", id: 4, caption: "金屬鍵是金屬陽離子泡在「自由電子海」裡：電子到處漂，所以金屬能導電、還能被捶打成薄片。", action: "walk", prop: { kind: "text", text: "金屬鍵：陽離子 ＋ 自由電子海", sub: "可導電、有延展性", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：鍵越強熔點越高", id: 5, caption: "鍵越強，要破壞它就要越高溫：網狀共價的金剛石熔點約 3550°C，比離子鍵的氯化鈉（801°C）還高。", action: "jump", prop: { kind: "bars", items: [{ label: "氯化鈉", value: 801 }, { label: "金剛石", value: 3550 }], unit: "°C", active: 1 }, duration: 3800, ask: { prompt: "網狀共價的金剛石，熔點通常比離子鍵的氯化鈉如何？", options: ["更低", "更高", "一樣高", "接近 0°C"], answer: 1, hint: "金剛石是全身共價網，極難打破。" } },
    { step: "步驟 6：三步判斷鍵種", id: 6, caption: "判斷口訣：金屬配非金屬是離子鍵；非金屬配非金屬是共價鍵；純金屬就是金屬鍵。", action: "point", prop: { kind: "flow", steps: ["金屬 ＋ 非金屬 → 離子鍵", "非金屬 ＋ 非金屬 → 共價鍵", "金屬本身 → 金屬鍵"], active: 0 }, duration: 3600 },
    { step: "步驟 7：帶走這三把鑰匙", id: 7, caption: "三把鑰匙帶走：離子鍵＝電子轉移、共價鍵＝電子共用、金屬鍵＝自由電子海。看組成元素就能猜是哪種鍵！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-bond-1", prompt: "離子鍵通常由哪兩類元素形成？", options: ["金屬 ＋ 非金屬", "非金屬 ＋ 非金屬", "金屬 ＋ 金屬", "任意兩元素"], answer: 0, hints: ["一個給電子、一個收電子", "回想 NaCl 的組成"], explanation: "離子鍵常見於金屬與非金屬之間，靠電子轉移後的靜電引力結合。" },
    { id: "sh-chem-bond-2", prompt: "共價鍵中的電子如何安排？", options: ["完全轉移", "成對共用", "完全游離", "完全不參與"], answer: 1, hints: ["非金屬傾向共用而非給出", "如 H₂ 共用一對電子"], explanation: "共價鍵是非金屬間共用電子對，使雙方都達到穩定電子組態。" },
    { id: "sh-chem-bond-3", prompt: "NaCl（氯化鈉）內的主要化學鍵是？", options: ["共價鍵", "離子鍵", "金屬鍵", "氫鍵"], answer: 1, hints: ["Na 是金屬、Cl 是非金屬", "金屬＋非金屬"], explanation: "Na 是金屬、Cl 是非金屬，兩者形成離子鍵（Na⁺Cl⁻）。" },
    { id: "sh-chem-bond-4", prompt: "金屬能導電、有延展性，主要靠什麼？", options: ["金屬鍵中的自由電子", "離子鍵", "共價鍵", "氫鍵"], answer: 0, hints: ["電子能在金屬中自由移動", "這也是金屬會導熱的原因"], explanation: "金屬鍵裡的自由電子可以移動，因此金屬能導電、傳熱且有延展性。" },
    { id: "sh-chem-bond-5", prompt: "下列物質中，熔點最高的是？", options: ["冰（0°C）", "氯化鈉（801°C）", "金剛石（3550°C）", "乾冰"], answer: 2, hints: ["網狀共價最難打破", "比較三者的鍵強弱"], explanation: "金剛石是全身共價網狀結構，鍵極強，熔點約 3550°C，高於氯化鈉與冰。" },
  ],
};

/* ========================================================================
 * 課程 3：化學 — 化學計量（高一）
 * 核心：莫耳（6×10²³）、n ＝ m/M、係數比＝莫耳比、限量試劑。
 * ======================================================================== */
const SH_CHEM_STOICH: OnionLesson = {
  id: "sh-chem-stoichiometry",
  title: "化學計量：莫耳與計算",
  subject: "化學",
  topic: "化學計量與反應計算",
  grade: "高一",
  stages: ["高中"],
  desc: "莫耳是化學計數單位（6×10²³ 個）；莫耳數 n ＝ m/M；反應式的係數比就是莫耳比，產量由限量試劑決定。",
  takeaways: [
    "1 mol ＝ 6×10²³ 個粒子（亞佛加厥數）。",
    "莫耳數 n ＝ 質量 m ÷ 莫耳質量 M；反應式係數比 ＝ 莫耳比。",
    "實際產量由「限量試劑」決定——實際量相對不足、先被耗盡的反應物。",
  ],
  frames: [
    { step: "步驟 1：莫耳是計數單位", id: 1, caption: "化學用「莫耳」當計數單位，就像「一打」是 12 個：1 莫耳就是 6×10²³ 個粒子，數量超級大。", action: "wave", prop: { kind: "text", text: "1 mol ＝ 6×10²³ 個粒子", sub: "亞佛加厥數", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：莫耳數 n ＝ m÷M", id: 2, caption: "要把「幾克」換成「幾莫耳」，用公式 n ＝ m ÷ M：質量除以莫耳質量，就得到莫耳數。", action: "point", prop: { kind: "text", text: "n ＝ m ÷ M", sub: "m 是質量(g)、M 是莫耳質量(g/mol)", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：算一次水的莫耳", id: 3, caption: "水的莫耳質量是 18 g/mol（2×1 ＋ 16）。那 18 克的水除以 18，正好就是 1 莫耳的水分子。", action: "walk", prop: { kind: "text", text: "M(H₂O) ＝ 18 g/mol", sub: "18 g 水 ＝ 1 mol", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：係數比就是莫耳比", id: 4, caption: "看反應式：2 莫耳 H₂ 配 1 莫耳 O₂，能產生 2 莫耳 H₂O，係數比 2:1:2 就是它們的莫耳比。", action: "think", prop: { kind: "balance", left: "2 H₂ ＋ O₂", right: "2 H₂O", tip: "係數比 2:1:2 ＝ 莫耳比" }, duration: 3800, ask: { prompt: "從反應式 2H₂＋O₂→2H₂O 看，前方的係數比代表什麼比？", options: ["質量比", "莫耳比", "體積比", "沒有關係"], answer: 1, hint: "反應式前面的數字直接對應莫耳數。" } },
    { step: "步驟 5：找出限量試劑", id: 5, caption: "舉例：4 mol H₂ 配 1 mol O₂。按 2:1，1 mol O₂ 只需 2 mol H₂，氫氣用不完，所以氧氣先耗盡，是限量試劑。", action: "jump", prop: { kind: "flow", steps: ["寫出平衡反應式", "算各反應物需要的量", "比對實際擁有的量", "先耗盡的就是限量試劑"], active: 2 }, duration: 3800, ask: { prompt: "4 mol H₂ 與 1 mol O₂ 反應（2H₂＋O₂→2H₂O），誰先耗盡？", options: ["H₂", "O₂", "兩個同時", "都不會"], answer: 1, hint: "1 mol O₂ 只要 2 mol H₂，氫氣綽綽有餘。" } },
    { step: "步驟 6：產量由限量決定", id: 6, caption: "產物最多只能照限量試劑來算：那個先用完的，就卡住了整鍋反應，其他反應物再多也沒用。", action: "point", prop: { kind: "text", text: "實際產量 ＝ 限量試劑決定", sub: "多出來的反應物用不到", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：帶走計量口訣", id: 7, caption: "三句帶走：1 mol 是 6×10²³ 個；n ＝ m÷M；係數比＝莫耳比，產量看限量試劑。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-stoichiometry-1", prompt: "1 莫耳物質含有多少個粒子？", options: ["6×10²³", "3×10²³", "10²³", "1×10²⁰"], answer: 0, hints: ["這叫亞佛加厥數", "約等於 602 後面 21 個零"], explanation: "1 莫耳 ＝ 6×10²³ 個粒子，這個常數稱為亞佛加厥數。" },
    { id: "sh-chem-stoichiometry-2", prompt: "莫耳數 n 的計算公式是？", options: ["n ＝ m × M", "n ＝ m ÷ M", "n ＝ M ÷ m", "n ＝ m ＋ M"], answer: 1, hints: ["把質量換算成莫耳要「除以」莫耳質量", "單位：g ÷ (g/mol) ＝ mol"], explanation: "n ＝ m ÷ M，質量除以莫耳質量得到莫耳數。" },
    { id: "sh-chem-stoichiometry-3", prompt: "36 克的水（H₂O，M ＝ 18）是幾莫耳？", options: ["1 mol", "2 mol", "18 mol", "0.5 mol"], answer: 1, hints: ["用 n ＝ m ÷ M", "36 ÷ 18 ＝ ?"], explanation: "n ＝ 36 g ÷ 18 g/mol ＝ 2 mol。" },
    { id: "sh-chem-stoichiometry-4", prompt: "反應 2H₂＋O₂→2H₂O，要生成 4 mol H₂O 需幾 mol O₂？", options: ["1 mol", "2 mol", "3 mol", "4 mol"], answer: 1, hints: ["莫耳比 O₂ : H₂O ＝ 1 : 2", "4 mol H₂O 是 2 倍"], explanation: "由莫耳比 O₂:H₂O ＝ 1:2，生成 4 mol H₂O 需要 2 mol O₂。" },
    { id: "sh-chem-stoichiometry-5", prompt: "「限量試劑」是指反應中的哪一個？", options: ["量最多的反應物", "最先耗盡的反應物", "最貴的試劑", "係數最大的反應物"], answer: 1, hints: ["它用完了反應就停", "產量由它決定"], explanation: "限量試劑是實際量相對不足、最先被耗盡的反應物，決定了最多產量。" },
  ],
};

/* ========================================================================
 * 課程 4：化學 — 酸鹼與中和（高二）
 * 核心：pH ＝ −log[H⁺]、指示劑、H⁺＋OH⁻→H₂O、強弱酸。
 * ======================================================================== */
const SH_CHEM_ACID_BASE: OnionLesson = {
  id: "sh-chem-acid-base",
  title: "酸鹼與中和",
  subject: "化學",
  topic: "酸鹼概念與中和反應",
  grade: "高二",
  stages: ["高中"],
  desc: "pH ＝ −log[H⁺]，7 為中性；酸釋出 H⁺、鹼釋出 OH⁻，兩者中和生成水。指示劑在固定範圍變色，強弱看電離程度。",
  takeaways: [
    "pH ＝ −log[H⁺]；pH 7 中性、<7 酸性、>7 鹼性。",
    "中和：H⁺ ＋ OH⁻ → H₂O；指示劑在固定範圍變色（石蕊紅酸藍鹼、酚酞鹼中變紅）。",
    "強酸完全電離、弱酸部分電離；強弱看電離程度，不是看濃度。",
  ],
  frames: [
    { step: "步驟 1：pH 是酸鹼尺", id: 1, caption: "酸鹼用 pH 這把尺來量：pH 等於「負的氫離子濃度對數」，7 是中性，越小越酸、越大越鹼。", action: "wave", prop: { kind: "text", text: "pH ＝ −log[H⁺]", sub: "pH 7 中性、<7 酸、>7 鹼", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：pH 尺從 0 到 14", id: 2, caption: "把 pH 想像成一條 0 到 14 的尺：中間 7 是中性，越往 0 越酸、越往 14 越鹼，一眼就看出酸鹼。", action: "point", prop: { kind: "numberLine", from: 0, to: 14, marks: [{ at: 7, label: "中性", tone: "ok" }, { at: 0, label: "強酸", tone: "warn" }, { at: 14, label: "強鹼", tone: "warn" }], cursor: 7 }, duration: 3600 },
    { step: "步驟 3：酸給 H⁺、鹼給 OH⁻", id: 3, caption: "按阿瑞尼士的說法：酸在水裡會放出 H⁺，鹼會放出 OH⁻；所以測到很多 H⁺，就知道它是酸。", action: "think", prop: { kind: "text", text: "酸釋出 H⁺、鹼釋出 OH⁻", sub: "阿瑞尼士定義", tone: "ok" }, duration: 3600, ask: { prompt: "pH 小於 7 的溶液，屬於什麼性質？", options: ["鹼性", "酸性", "中性", "無法定義"], answer: 1, hint: "pH 7 以下就是酸。" } },
    { step: "步驟 4：中和生成水", id: 4, caption: "酸和鹼碰在一起會中和：H⁺ 與 OH⁻ 結合成水分子 H₂O，酸鹼的尖刺就互相消掉了。", action: "walk", prop: { kind: "balance", left: "H⁺ ＋ OH⁻", right: "H₂O", tip: "酸 ＋ 鹼 → 鹽 ＋ 水" }, duration: 3800 },
    { step: "步驟 5：指示劑看顏色", id: 5, caption: "指示劑在固定 pH 範圍變色：石蕊遇酸紅、遇鹼藍；酚酞在酸中無色、到鹼性才轉紅，用來判斷酸鹼。", action: "jump", prop: { kind: "flow", steps: ["石蕊：酸紅、鹼藍", "酚酞：酸無色、鹼紅", "甲基橙：酸紅、鹼黃", "變色在固定範圍"], active: 1 }, duration: 3800, ask: { prompt: "酚酞在酸性溶液中呈現什麼顏色？", options: ["紅色", "無色", "藍色", "黃色"], answer: 1, hint: "酚酞只在鹼性才變紅。" } },
    { step: "步驟 6：強酸與弱酸", id: 6, caption: "同樣叫酸也有強弱之分：強酸像 HCl 在水中完全電離，弱酸像醋酸 CH₃COOH 只電離一小部分。", action: "point", prop: { kind: "text", text: "強酸完全電離（HCl）", sub: "弱酸部分電離（CH₃COOH）", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：帶走酸鹼口訣", id: 7, caption: "三句帶走：pH＝−log[H⁺]，7 為中性；H⁺＋OH⁻→H₂O 是中和；指示劑在固定範圍變色。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-acid-base-1", prompt: "pH ＝ 7 的溶液是？", options: ["強酸", "中性", "強鹼", "弱酸"], answer: 1, hints: ["pH 7 是酸鹼分界", "大於 7 才鹼、小於 7 才酸"], explanation: "pH 7 為中性；pH < 7 酸性、pH > 7 鹼性。" },
    { id: "sh-chem-acid-base-2", prompt: "酸與鹼中和反應最主要的生成物是？", options: ["H₂", "O₂", "H₂O", "CO₂"], answer: 2, hints: ["H⁺ 與 OH⁻ 結合", "酸＋鹼→鹽＋水"], explanation: "中和時 H⁺ 與 OH⁻ 結合成水 H₂O，同時生成鹽。" },
    { id: "sh-chem-acid-base-3", prompt: "若 [H⁺] ＝ 1×10⁻³ mol/L，則 pH 約為？", options: ["3", "11", "7", "−3"], answer: 0, hints: ["pH ＝ −log[H⁺]", "log(10⁻³) ＝ −3，取負得 3"], explanation: "pH ＝ −log(1×10⁻³) ＝ −(−3) ＝ 3。" },
    { id: "sh-chem-acid-base-4", prompt: "酚酞在鹼性溶液中呈現什麼顏色？", options: ["無色", "紅色", "藍色", "黃色"], answer: 1, hints: ["石蕊才在鹼中變藍", "酚酞鹼中變紅"], explanation: "酚酞在酸性無色、在鹼性變紅，常用來指示鹼性。" },
    { id: "sh-chem-acid-base-5", prompt: "[H⁺] 增加為原來的 10 倍，pH 會怎麼變？", options: ["加 10", "減 10", "差 1 個單位", "完全不變"], answer: 2, hints: ["pH 是對數刻度", "濃度差 10 倍 ⇒ pH 差 1"], explanation: "因為 pH ＝ −log[H⁺]，[H⁺] 變 10 倍，pH 只改變 1 個單位（如 3→2）。" },
  ],
};

/* ========================================================================
 * 課程 5：化學 — 氧化還原（高二）
 * 核心：氧化數算法、氧化＝失電子（氧化數升）、氧化劑本身被還原；鐵生鏽、燃燒、電池。
 * ======================================================================== */
const SH_CHEM_REDOX: OnionLesson = {
  id: "sh-chem-redox",
  title: "氧化還原反應",
  subject: "化學",
  topic: "氧化數與電子轉移",
  grade: "高二",
  stages: ["高中"],
  desc: "氧化數：單質 0、氧 −2、氫 +1。氧化＝氧化數上升＝失電子；氧化劑本身被還原。鐵生鏽、燃燒、電池都是氧化還原。",
  takeaways: [
    "氧化數規則：單質 0、氧通常 −2、氫通常 +1、中性分子各元素氧化數總和為 0。",
    "氧化＝氧化數上升＝失去電子；還原＝氧化數下降＝得到電子。",
    "氧化劑「本身被還原」、還原劑「本身被氧化」；鐵生鏽、燃燒、電池都是氧化還原。",
  ],
  frames: [
    { step: "步驟 1：氧化數先會算", id: 1, caption: "判斷氧化還原前，先學氧化數：單質是 0、氧通常 −2、氫通常 +1，這三條最常用。", action: "wave", prop: { kind: "text", text: "氧化數規則", sub: "單質 0、氧 −2、氫 +1", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：四條基本規則", id: 2, caption: "把規則記成四句：單質是 0；氧多半 −2；氫多半 +1；一個中性分子裡，所有元素氧化數加起來必須是 0。", action: "point", prop: { kind: "flow", steps: ["單質氧化數 0", "氧通常 −2", "氫通常 +1", "化合物總和為 0"], active: 3 }, duration: 3600 },
    { step: "步驟 3：升氧化、降還原", id: 3, caption: "口訣：氧化數「上升」是失去電子、叫氧化；「下降」是得到電子、叫還原。升氧、降還，很好記。", action: "think", prop: { kind: "text", text: "氧化數↑＝失去電子（氧化）", sub: "氧化數↓＝得到電子（還原）", tone: "ok" }, duration: 3800, ask: { prompt: "某元素氧化數由 +2 變成 +5，它發生了什麼？", options: ["被還原", "被氧化", "沒變化", "形成沉澱"], answer: 1, hint: "氧化數上升表示失去電子。" } },
    { step: "步驟 4：氧化劑被還原", id: 4, caption: "名字最容易搞反：氧化劑是「讓別人被氧化」的那個，它自己反而被還原；還原劑則自己被氧化。", action: "walk", prop: { kind: "text", text: "氧化劑本身被還原", sub: "還原劑本身被氧化", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：鐵生鏽就是氧化還原", id: 5, caption: "鐵生鏽 4Fe ＋ 3O₂ → 2Fe₂O₃：鐵從 0 升到 +3 被氧化，氧從 0 降到 −2 被還原，所以它就是氧化還原。", action: "jump", prop: { kind: "balance", left: "4 Fe ＋ 3 O₂", right: "2 Fe₂O₃", tip: "鐵 0 → +3 被氧化" }, duration: 3800, ask: { prompt: "鐵生鏽（4Fe＋3O₂→2Fe₂O₃）時，鐵發生了什麼？", options: ["被還原", "被氧化", "沒變化", "揮發掉"], answer: 1, hint: "鐵從 0 價升到 +3 價。" } },
    { step: "步驟 6：電池也靠它供電", id: 6, caption: "乾電池也是氧化還原：鋅失去電子被氧化、銅離子得到電子被還原，電子流動就變成電流。", action: "point", prop: { kind: "text", text: "電池：Zn 被氧化供電", sub: "鋅銅電池是最經典例子", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：帶走紅氧化口訣", id: 7, caption: "三句帶走：氧化數升＝失電子＝氧化；氧化劑自己被還原；鐵生鏽、燃燒、電池通通是氧化還原。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-redox-1", prompt: "單質（如 O₂、Fe）中元素的氧化數是？", options: ["0", "+1", "−2", "要看情況"], answer: 0, hints: ["單質沒有電子轉移", "所有單質氧化數皆為 0"], explanation: "單質中元素氧化數定為 0，因為電子完全共有、不分給誰。" },
    { id: "sh-chem-redox-2", prompt: "「氧化」指的是什麼？", options: ["氧化數上升、失去電子", "氧化數下降、得到電子", "顏色變紅", "質量增加"], answer: 0, hints: ["升氧（氧化數升）", "失去電子就是氧化"], explanation: "氧化＝氧化數上升＝失去電子；還原＝氧化數下降＝得到電子。" },
    { id: "sh-chem-redox-3", prompt: "在 H₂O 中，氧的氧化數是多少？", options: ["−2", "−1", "0", "+2"], answer: 0, hints: ["氫是 +1，兩個氫共 +2", "總和為 0 ⇒ 氧 = −2"], explanation: "H 為 +1，兩個 H 共 +2；分子總和 0，所以 O 為 −2。" },
    { id: "sh-chem-redox-4", prompt: "氧化劑在反應中本身會？", options: ["被氧化", "被還原", "不變", "消失不見"], answer: 1, hints: ["氧化劑「氧化」別人", "自己得到電子被還原"], explanation: "氧化劑使別人被氧化，自己則得到電子、被還原。" },
    { id: "sh-chem-redox-5", prompt: "下列何者屬於氧化還原反應？", options: ["NaCl 溶於水", "鐵生鏽", "冰融化", "糖溶於水"], answer: 1, hints: ["要有氧化數改變", "鐵的價數從 0 升到 +3"], explanation: "鐵生鏽時鐵的氧化數由 0 變 +3、氧由 0 變 −2，有電子轉移，是氧化還原；其餘只是物理溶解。" },
  ],
};

/* ========================================================================
 * 課程 6：化學 — 有機化合物（高二）
 * 核心：烷 CₙH₂ₙ₊₂、烯 CₙH₂ₙ、炔 CₙH₂ₙ₋₂、同系物；官能基（醇–OH、醛–CHO、酮 C=O、羧酸–COOH、酯–COO–）。
 * ======================================================================== */
const SH_CHEM_ORGANIC: OnionLesson = {
  id: "sh-chem-organic",
  title: "有機化合物",
  subject: "化學",
  topic: "有機化學基礎",
  grade: "高二",
  stages: ["高中"],
  desc: "烷 CₙH₂ₙ₊₂、烯 CₙH₂ₙ、炔 CₙH₂ₙ₋₂，同系物差 CH₂。官能基決定性質：醇 –OH、醛 –CHO、酮 C=O、羧酸 –COOH、酯 –COO–。",
  takeaways: [
    "烷 CₙH₂ₙ₊₂（單鍵）、烯 CₙH₂ₙ（雙鍵）、炔 CₙH₂ₙ₋₂（三鍵）；同系物彼此相差 CH₂。",
    "官能基決定性質：醇 –OH、醛 –CHO、酮 C=O、羧酸 –COOH、酯 –COO–。",
    "不飽度越高（雙鍵、三鍵）活性越大；辨認有機物先看碳氫比與官能基。",
  ],
  frames: [
    { step: "步驟 1：有機物都含碳", id: 1, caption: "有機化合物幾乎都含有碳，而且大多以碳為骨架、外面掛氫：從甲烷到塑膠，都是碳的化合物。", action: "wave", prop: { kind: "text", text: "有機化合物以碳為骨架", sub: "多含 C、H，常有 O、N", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：烷烯炔三兄弟", id: 2, caption: "碳氫化合物三兄弟：烷 CₙH₂ₙ₊₂ 全是單鍵；烯 CₙH₂ₙ 有雙鍵；炔 CₙH₂ₙ₋₂ 有三鍵，不飽度一台階一台階升。", action: "point", prop: { kind: "text", text: "烷 CₙH₂ₙ₊₂、烯 CₙH₂ₙ、炔 CₙH₂ₙ₋₂", sub: "差在碳碳鍵（單／雙／三）", tone: "ok" }, duration: 3800, ask: { prompt: "烯類碳氫化合物的通式是哪一個？", options: ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CH₂ₙ"], answer: 1, hint: "烯有雙鍵，比烷少兩個 H。" } },
    { step: "步驟 3：同系物差 CH₂", id: 3, caption: "同一族的化合物叫同系物：甲烷 CH₄、乙烷 C₂H₆、丙烷 C₃H₈，每多一個就多一組 CH₂，性質很相似。", action: "think", prop: { kind: "text", text: "同系物：彼此差 CH₂", sub: "性質類似、可排成家族", tone: "ok" }, duration: 3400 },
    { step: "步驟 4：認識官能基", id: 4, caption: "有機物的性格看官能基：醇掛 –OH、醛是 –CHO、酮有 C=O、羧酸是 –COOH、酯是 –COO–，掛什麼就決定它怎麼反應。", action: "walk", prop: { kind: "text", text: "官能基決定性質", sub: "醇 –OH、醛 –CHO、酮 C=O、羧酸 –COOH、酯 –COO–", tone: "ok" }, duration: 3800 },
    { step: "步驟 5：官能基改變性質", id: 5, caption: "官能基直接決定性質：醇能氧化成醛、羧酸帶酸性、酯常有水果香味——認官能基就認得它的脾氣。", action: "jump", prop: { kind: "flow", steps: ["醇 –OH：可氧化、可酯化", "醛 –CHO：易被氧化", "羧酸 –COOH：有酸性", "酯 –COO–：有香味"], active: 0 }, duration: 3800, ask: { prompt: "官能基 –COOH 屬於哪一類有機物？", options: ["醇", "羧酸", "醛", "酮"], answer: 1, hint: "–COOH 是羧基，帶酸性。" } },
    { step: "步驟 6：從分子式認人", id: 6, caption: "背幾個代表：甲烷 CH₄、乙烷 C₂H₆ 是烷；乙烯 C₂H₄、乙炔 C₂H₂ 則分別是烯和炔，數一下 H 就分得清。", action: "point", prop: { kind: "text", text: "甲烷 CH₄、乙烷 C₂H₆", sub: "乙烯 C₂H₄、乙炔 C₂H₂", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：帶走有機地圖", id: 7, caption: "三句帶走：烷烯炔看碳碳鍵與通式；同系物差 CH₂；官能基決定性質。看碳氫比和掛的基就能認人！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-organic-1", prompt: "烷類（飽和碳氫化合物）的通式是？", options: ["CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙH₂ₙ₋₂", "CH₂ₙ"], answer: 1, hints: ["烷全是單鍵", "比烯多兩個氫"], explanation: "烷類為飽和烴，通式 CₙH₂ₙ₊₂（如甲烷 CH₄、乙烷 C₂H₆）。" },
    { id: "sh-chem-organic-2", prompt: "分子中含有 C=C 雙鍵的碳氫化合物是？", options: ["烷", "烯", "炔", "芳香烴"], answer: 1, hints: ["雙鍵比單鍵少兩個 H", "通式 CₙH₂ₙ"], explanation: "烯類含有一個 C=C 雙鍵，通式 CₙH₂ₙ。" },
    { id: "sh-chem-organic-3", prompt: "乙烯的分子式 C₂H₄ 屬於下列哪一類？", options: ["烷", "烯", "炔", "醇"], answer: 1, hints: ["代入 n=2：CₙH₂ₙ 得 C₂H₄", "有雙鍵"], explanation: "C₂H₄ 符合烯的通式 CₙH₂ₙ（n=2），且含 C=C 雙鍵，所以屬烯類。" },
    { id: "sh-chem-organic-4", prompt: "官能基 –OH 對應的是哪一類有機物？", options: ["醛", "醇", "酮", "羧酸"], answer: 1, hints: ["–OH 是羥基", "乙醇 CH₃CH₂OH 就是醇"], explanation: "–OH（羥基）是醇的官能基，如乙醇。" },
    { id: "sh-chem-organic-5", prompt: "乙炔 C₂H₂ 符合哪個通式（令 n=2）？", options: ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙHₙ"], answer: 2, hints: ["炔有三鍵、比烷少 4 個 H", "代入 n=2：2n−2 ＝ 2"], explanation: "炔類通式 CₙH₂ₙ₋₂；n=2 時為 C₂H₂，正是乙炔。" },
  ],
};

/* ========================================================================
 * 課程 7：化學 — 化學平衡（高三）
 * 核心：可逆反應、平衡常數 K、勒沙特列原理（濃度／壓力／溫度改變時平衡移動方向）。
 * ======================================================================== */
const SH_CHEM_EQUILIBRIUM: OnionLesson = {
  id: "sh-chem-equilibrium",
  title: "化學平衡與勒沙特列",
  subject: "化學",
  topic: "化學平衡與平衡移動",
  grade: "高三",
  stages: ["高中"],
  desc: "可逆反應達平衡時正逆速率相等、濃度不變。平衡常數 K 看濃度冪次；勒沙特列說平衡會朝抵抗擾動的方向移動。",
  takeaways: [
    "可逆反應達平衡時正逆反應速率相等、各物濃度不再改變（但反應仍持續進行）。",
    "平衡常數 K ＝ 產物濃度冪次積 ÷ 反應物濃度冪次積。",
    "勒沙特列原理：系統受擾動會朝「抵抗擾動」的方向移動；催化劑不改變平衡位置。",
  ],
  frames: [
    { step: "步驟 1：反應可以可逆", id: 1, caption: "很多反應不是一條路走到底：正反應和逆反應同時在跑，用 ⇌ 表示，這就是可逆反應。", action: "wave", prop: { kind: "text", text: "可逆反應用 ⇌ 表示", sub: "正反應與逆反應同時進行", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：平衡時速率相等", id: 2, caption: "跑到某個時候，正反應變慢、逆反應變快，兩者速率一樣：這時各物濃度不再變，叫「達到平衡」。", action: "point", prop: { kind: "text", text: "平衡：正逆速率相等", sub: "各物濃度不再改變", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：平衡常數 K", id: 3, caption: "平衡常數 K 把平衡時的濃度記下來：產物濃度按係數次方乘起來，除以反應物同樣處理，K 越大越偏向右邊。", action: "think", prop: { kind: "text", text: "K ＝ 產物濃度冪次積 ÷ 反應物", sub: "如 N₂＋3H₂⇌2NH₃：K＝[NH₃]²÷([N₂][H₂]³)", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：加反應物會右移", id: 4, caption: "濃度改變時：多加反應物，平衡就往右（產物那邊）移，好把多出來的吃掉，這是勒沙特列原理。", action: "walk", prop: { kind: "flow", steps: ["增加反應物濃度", "平衡往右（產物側）移", "以消耗多加的反應物", "直到新平衡"], active: 1 }, duration: 3800, ask: { prompt: "增加反應物濃度，平衡會往哪邊移動？", options: ["向左", "向右", "不動", "立即停止"], answer: 1, hint: "系統想消耗多出來的反應物。" } },
    { step: "步驟 5：壓力溫度也會推", id: 5, caption: "壓力與溫度也推得動平衡：加壓往氣體分子少的一邊；升溫往吸熱的一邊跑，系統總想抵抗改變。", action: "jump", prop: { kind: "flow", steps: ["加壓→往氣體少的一邊", "升溫→往吸熱的一邊", "減壓→往氣體多的一邊", "降溫→往放熱的一邊"], active: 1 }, duration: 3800, ask: { prompt: "對放熱反應升溫，平衡會往哪邊移？", options: ["放熱方向", "吸熱方向", "不動", "停止"], answer: 1, hint: "升溫系統想吸熱來降溫。" } },
    { step: "步驟 6：勒沙特列一句話", id: 6, caption: "勒沙特列原理一句話：系統受到擾動，會朝「抵抗這個擾動」的方向移動，直到建立新的平衡。", action: "point", prop: { kind: "balance", left: "外加擾動", right: "平衡往抵抗方向移", tip: "系統總想抵消改變" }, duration: 3600 },
    { step: "步驟 7：帶走平衡羅盤", id: 7, caption: "三句帶走：平衡時正逆速率相等；K 看濃度冪次；勒沙特列說平衡會抵抗擾動。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-equilibrium-1", prompt: "化學平衡達成時，下列敘述何者正確？", options: ["反應完全停止", "正逆反應速率相等", "產物濃度為 0", "反應物濃度為 0"], answer: 1, hints: ["平衡是動態的", "分子仍來回反應"], explanation: "平衡時正反應與逆反應速率相等，各物濃度保持不變，但反應仍持續進行（動態平衡）。" },
    { id: "sh-chem-equilibrium-2", prompt: "增加反應物濃度，平衡會？", options: ["向左移", "向右移", "不動", "立即停止"], answer: 1, hints: ["系統想消耗多出的反應物", "往產物側才消耗它"], explanation: "根據勒沙特列原理，增加反應物濃度，平衡向右（產物側）移動以消耗多出的反應物。" },
    { id: "sh-chem-equilibrium-3", prompt: "反應 2SO₂＋O₂⇌2SO₃，加壓時平衡往哪邊移？", options: ["向左", "向右", "不動", "停止"], answer: 1, hints: ["左邊氣體 3 mol、右邊 2 mol", "加壓往分子數少的一邊"], explanation: "左邊氣體共 3 mol（2+1）、右邊 2 mol；加壓時平衡往氣體分子數較少的一邊（右）移。" },
    { id: "sh-chem-equilibrium-4", prompt: "對一個放熱反應升溫，平衡會往？", options: ["放熱方向", "吸熱方向", "不動", "停止"], answer: 1, hints: ["升溫系統想吸熱", "吸熱方向才能降溫"], explanation: "升溫時系統傾向吸收熱量，故平衡往吸熱方向移動（逆向，因正向放熱）。" },
    { id: "sh-chem-equilibrium-5", prompt: "在已達平衡的反應中加入催化劑，會如何？", options: ["平衡向右移", "平衡向左移", "不改變平衡位置、只加快達平衡", "反應停止"], answer: 2, hints: ["催化劑兩方向等速加速", "不影響平衡常數"], explanation: "催化劑同等加快正反應與逆反應速率，只縮短達平衡的時間，不改變平衡位置。" },
  ],
};

/* ========================================================================
 * 課程 8：化學 — 溶液與濃度（高三）
 * 核心：莫耳濃度 M ＝ mol/L、稀釋 M₁V₁ ＝ M₂V₂、重量百分濃度。
 * ======================================================================== */
const SH_CHEM_SOLUTION: OnionLesson = {
  id: "sh-chem-solution",
  title: "溶液與濃度",
  subject: "化學",
  topic: "溶液濃度與稀釋",
  grade: "高三",
  stages: ["高中"],
  desc: "莫耳濃度 M ＝ 溶質莫耳數 mol ÷ 溶液體積 L；稀釋前後溶質不變：M₁V₁ ＝ M₂V₂。重量百分濃度＝溶質重÷溶液總重×100%。",
  takeaways: [
    "莫耳濃度 M ＝ 溶質莫耳數 mol ÷ 溶液體積 L（單位 mol/L）。",
    "稀釋前後溶質不變：M₁V₁ ＝ M₂V₂；加水後體積變大、濃度變小。",
    "重量百分濃度 ＝ 溶質質量 ÷ 溶液總質量 × 100%（溶質＋溶劑才是溶液）。",
  ],
  frames: [
    { step: "步驟 1：濃度是密集度", id: 1, caption: "濃度描述「每一升裡溶了多少」：莫耳濃度 M 就是溶質的莫耳數除以溶液的總體積（公升）。", action: "wave", prop: { kind: "text", text: "莫耳濃度 M ＝ mol ÷ L", sub: "單位 mol/L（M）", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：算一次莫耳濃度", id: 2, caption: "舉例：0.5 mol 的蔗糖溶在 2 L 水裡，莫耳濃度就是 0.5 ÷ 2 ＝ 0.25 M，每升含 0.25 mol。", action: "point", prop: { kind: "text", text: "0.5 mol ÷ 2 L ＝ 0.25 M", sub: "M ＝ n ÷ V", tone: "ok" }, duration: 3800, ask: { prompt: "0.5 mol 的蔗糖溶於 2 L 水中，莫耳濃度是多少？", options: ["0.25 M", "0.5 M", "2 M", "4 M"], answer: 0, hint: "用 M ＝ mol ÷ L 來算。" } },
    { step: "步驟 3：兩杯比比看", id: 3, caption: "同樣都配成 1 L，A 杯有 0.25 mol、B 杯有 0.5 mol，B 杯的莫耳濃度 0.5 M 明顯比較濃。", action: "walk", prop: { kind: "bars", items: [{ label: "A杯", value: 0.25 }, { label: "B杯", value: 0.5 }], unit: "M", active: 1 }, duration: 3600 },
    { step: "步驟 4：重量百分濃度", id: 4, caption: "另一種濃度是重量百分濃度：10 克鹽溶進 90 克水，溶液共 100 克，所以濃度是 10 克÷100 克 ＝ 10%。", action: "think", prop: { kind: "text", text: "重量百分濃度 ＝ 溶質重 ÷ 溶液重 × 100%", sub: "例：10 g 鹽 ＋ 90 g 水 ＝ 10%", tone: "ok" }, duration: 3800 },
    { step: "步驟 5：稀釋 M₁V₁＝M₂V₂", id: 5, caption: "稀釋時溶質沒少：原來 1 M 配 2 L，和稀釋後 0.5 M 配 4 L，兩邊都是 2 mol，因為 M₁V₁ ＝ M₂V₂。", action: "jump", prop: { kind: "balance", left: "1 M × 2 L", right: "0.5 M × 4 L", tip: "稀釋前後溶質莫耳不變" }, duration: 3800, ask: { prompt: "把 1 M、2 L 的溶液加水稀釋到 4 L，新濃度為？", options: ["0.5 M", "1 M", "2 M", "4 M"], answer: 0, hint: "用 M₁V₁ ＝ M₂V₂：1×2 ＝ 4×M₂。" } },
    { step: "步驟 6：加水稀釋的直覺", id: 6, caption: "稀釋就是加水：體積 V 變大，但溶質莫耳數不變，所以濃度 M 必然變小——嘗起來變淡就是這個道理。", action: "point", prop: { kind: "text", text: "加水：V 變大、M 變小", sub: "溶質 mol 不變", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：帶走濃度兩招", id: 7, caption: "兩招帶走：M ＝ mol÷L；稀釋前後 M₁V₁ ＝ M₂V₂，加水後體積變大、濃度變小。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chem-solution-1", prompt: "莫耳濃度的標準單位是？", options: ["mol/L", "g/L", "L/mol", "mol/g"], answer: 0, hints: ["濃度＝莫耳數÷體積", "體積用公升"], explanation: "莫耳濃度 M ＝ 溶質莫耳數 ÷ 溶液體積(L)，單位 mol/L，也記作 M。" },
    { id: "sh-chem-solution-2", prompt: "2 mol 的鹽酸溶於 4 L 水，莫耳濃度為？", options: ["0.5 M", "2 M", "4 M", "8 M"], answer: 0, hints: ["M ＝ mol ÷ L", "2 ÷ 4 ＝ ?"], explanation: "M ＝ 2 mol ÷ 4 L ＝ 0.5 M。" },
    { id: "sh-chem-solution-3", prompt: "10 克 NaCl（M ＝ 58.5）配成 1 L 溶液，濃度約為？", options: ["0.17 M", "1.7 M", "10 M", "58.5 M"], answer: 0, hints: ["先算 n ＝ m ÷ M", "10 ÷ 58.5 ≒ 0.171"], explanation: "n ＝ 10 g ÷ 58.5 g/mol ≒ 0.171 mol，再 ÷1 L ≒ 0.17 M。" },
    { id: "sh-chem-solution-4", prompt: "將 1 M、2 L 的溶液稀釋到 4 L，新濃度為？", options: ["0.5 M", "1 M", "2 M", "4 M"], answer: 0, hints: ["M₁V₁ ＝ M₂V₂", "1×2 ＝ 4×M₂ ⇒ 0.5"], explanation: "M₁V₁ ＝ M₂V₂：1×2 ＝ 4×M₂，故 M₂ ＝ 0.5 M。" },
    { id: "sh-chem-solution-5", prompt: "重量百分濃度 10% 的意思是？", options: ["100 g 溶液含 10 g 溶質", "100 g 水含 10 g 溶質", "10 g 溶液", "10 mL 溶質"], answer: 0, hints: ["分母是「溶液總重」", "溶質＋溶劑才是溶液"], explanation: "重量百分濃度 ＝ 溶質質量 ÷ 溶液總質量 ×100%；10% 表示每 100 g 溶液含 10 g 溶質。" },
  ],
};

export default [
  SH_CHEM_ATOM,
  SH_CHEM_BOND,
  SH_CHEM_STOICH,
  SH_CHEM_ACID_BASE,
  SH_CHEM_REDOX,
  SH_CHEM_ORGANIC,
  SH_CHEM_EQUILIBRIUM,
  SH_CHEM_SOLUTION,
];
