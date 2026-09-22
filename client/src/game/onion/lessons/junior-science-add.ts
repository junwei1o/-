/**
 * 國中自然 10 堂（junior-science-add.ts）
 *
 * 課程表來自 docs/onion-200-plan.md →「自然 10 堂」（id: jh-sci-*）。
 * 每堂課 7 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 2 幀有 ask）
 * ＋ 5 題闖關（含 2 級提示與詳解）＋ 3 條 takeaways。
 * 圖解依各課核心概念選用 bars（比較）、flow（順序／路徑）、cycle（循環）、
 * balance（等式／對照）、text（定律與口訣）、shape（示意三角形）。
 */

import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 課程 1：自然（國中）— 測量與單位
 * ======================================================================== */
const JH_SCI_MEASUREMENT: OnionLesson = {
  id: "jh-sci-measurement",
  title: "測量與單位：長度、體積、質量怎麼量？",
  subject: "自然",
  topic: "測量與單位",
  grade: "七上",
  stages: ["國中"],
  desc: "長度、體積、質量各用什麼工具？單位怎麼換？洋蔥帶你一次搞懂。",
  takeaways: [
    "長度用尺（公分、公尺），1 公尺 ＝ 100 公分",
    "液體體積用量筒，1 公升 ＝ 1000 毫升",
    "質量用天平（公克、公斤），1 公斤 ＝ 1000 公克",
    "測量前先認清量的是長度、體積還是質量，再選對工具；大單位換小單位要乘、小換大要除",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識三種測量", caption: "嗨！量身高、量水量、量體重，今天先認識這三種測量工具。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：比較長度單位", caption: "鉛筆約 15 公分、課本約 25 公分、黑板約 300 公分，用長條比一比。", action: "point", prop: { kind: "bars", items: [{ label: "鉛筆", value: 15 }, { label: "課本", value: 25 }, { label: "黑板", value: 300 }], unit: "公分", active: 0 }, duration: 3600 },
    { id: 3, step: "步驟 3：生活裡的長度感", caption: "操場一圈約 400 公尺、你的身高約 150 公分、鉛筆約 15 公分，先對單位大小有感覺。", action: "point", prop: { kind: "bars", items: [{ label: "操場一圈", value: 400 }, { label: "身高", value: 150 }, { label: "鉛筆", value: 15 }], unit: "公分", active: 1 }, duration: 3600 },
    { id: 4, step: "步驟 4：換算長度單位", caption: "1.5 公尺 ＝ 150 公分，關鍵是乘 100，把大單位變成小單位。", action: "think", prop: { kind: "balance", left: "1.5 m × 100", right: "150 cm", tip: "公尺→公分要乘 100" }, duration: 3600, ask: { prompt: "2 公尺等於多少公分？", options: ["20", "200", "2", "2000"], answer: 1, hint: "公尺換公分要乘 100，2 × 100 ＝ 200。" } },
    { id: 5, step: "步驟 5：測量液體體積", caption: "量液體用毫升和公升，1 公升 ＝ 1000 毫升，倒進量筒看刻度。", action: "walk", prop: { kind: "flow", steps: ["倒液體進量筒", "看凹液面最低處", "讀刻度", "記錄毫升"], active: 1 }, duration: 3600 },
    { id: 6, step: "步驟 6：測量物體質量", caption: "體重用公斤、小物用公克，1 公斤 ＝ 1000 公克，用天平來稱。", action: "point", prop: { kind: "balance", left: "1 公斤", right: "1000 公克", tip: "質量單位換算" }, duration: 3600, ask: { prompt: "想量一杯水的體積，最好用下列哪個工具？", options: ["天平", "量筒", "直尺", "溫度計"], answer: 1, hint: "液體體積要用有刻度的量筒來測量最準確。" } },
    { id: 7, step: "步驟 7：工具別用錯", caption: "易錯點：量長度用尺、量液體用量筒、量質量用天平，工具配對錯了就讀錯數。", action: "think", prop: { kind: "text", text: "長度→尺　液體→量筒　質量→天平", sub: "先認清量什麼，再選工具", tone: "warn" }, duration: 3600, ask: { prompt: "下列哪一組「工具—測量內容」配對是正確的？", options: ["天平—量液體體積", "量筒—量液體體積", "直尺—量質量", "溫度計—量長度"], answer: 1, hint: "量筒有刻度，是用來量液體體積的。" } },
    { id: 8, step: "步驟 8：讀出估計值", caption: "尺上最小格是 1 公厘，4.3 公分的 0.3 是估計出來的，要照實寫出。", action: "jump", prop: { kind: "text", text: "最小刻度 1 mm，下一位要估計", sub: "確定值＋估計值才完整", tone: "ok" }, duration: 3600 },
    { id: 9, step: "步驟 9：記住測量口訣", caption: "口訣：長度用尺、體積看量筒、質量用天平，換算記住 100 和 1000。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-measurement-1", prompt: "1 公尺等於幾公分？", options: ["10", "100", "1000", "1"], answer: 1, hints: ["長度單位換算", "公尺比公分大 100 倍"], explanation: "1 公尺 ＝ 100 公分，公尺換算成公分要乘 100。" },
    { id: "jh-sci-measurement-2", prompt: "量一杯水的體積，最合適的工具是？", options: ["天平", "量筒", "直尺", "溫度計"], answer: 1, hints: ["水在容器裡是液體", "要選有刻度的工具"], explanation: "液體體積用有刻度的量筒測量最準確，天平量質量、直尺量長度。" },
    { id: "jh-sci-measurement-3", prompt: "3.2 公尺等於多少公分？", options: ["32", "320", "3200", "3.2"], answer: 1, hints: ["公尺→公分乘 100", "3.2 × 100 ＝ ?"], explanation: "3.2 × 100 ＝ 320，所以是 320 公分。" },
    { id: "jh-sci-measurement-4", prompt: "一瓶 250 公克的牛奶等於幾公斤？", options: ["2.5", "0.25", "25", "0.025"], answer: 1, hints: ["公克→公斤要除以 1000", "250 ÷ 1000 ＝ ?"], explanation: "250 ÷ 1000 ＝ 0.25，所以是 0.25 公斤。" },
    { id: "jh-sci-measurement-5", prompt: "用尺量得 3.6 公分，其中小數點後的 0.6 是？", options: ["一定正確的確定值", "靠估計得到的估計值", "測量誤差", "單位名稱"], answer: 1, hints: ["尺的最小刻度後一位要自己估", "不是精準讀出的數字"], explanation: "刻度尺最小一格後的那一位是目測估計出來的，稱為估計值，要照實寫出才完整。" },
    { id: "jh-sci-measurement-6", prompt: "小明想量「這杯水有多重」（質量），應該選用哪個工具？", options: ["量筒", "天平", "直尺", "溫度計"], answer: 1, hints: ["量的是質量不是體積", "天平用來稱重"], explanation: "量筒量液體體積、直尺量長度、溫度計量溫度；量質量（多重）要用天平，才不會把體積和質量搞混。" },
  ],
};

/* ========================================================================
 * 課程 2：自然（國中）— 顯微鏡操作
 * ======================================================================== */
const JH_SCI_MICROSCOPE: OnionLesson = {
  id: "jh-sci-microscope",
  title: "顯微鏡操作：對光、調焦距、看倍率",
  subject: "自然",
  topic: "顯微鏡操作",
  grade: "七上",
  stages: ["國中"],
  desc: "從對光到調出清晰影像，再搞懂放大倍率怎麼算，洋蔥一步步教你。",
  takeaways: [
    "先用低倍物鏡對光，再用光圈調亮度",
    "粗調整螺旋找大致影像，細調整螺旋調清晰",
    "總放大倍率 ＝ 目鏡倍率 × 物鏡倍率",
    "低倍視野大而亮、高倍視野小而暗；粗調下降鏡筒時眼睛要從旁邊看，才不會壓破玻片",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識顯微鏡", caption: "嗨！想看細胞要先會用顯微鏡，今天從對光到調焦距一次學會。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：先對光", caption: "先用最低倍率的物鏡對準載物台孔，再調光圈讓視野變亮。", action: "point", prop: { kind: "flow", steps: ["選低倍物鏡", "對準通光孔", "調光圈", "視野變亮"], active: 3 }, duration: 3600 },
    { id: 3, step: "步驟 3：放好玻片", caption: "把玻片標本放在載物台上，用壓片夾固定，對準通光孔中央。", action: "walk", prop: { kind: "flow", steps: ["放玻片", "用壓片夾固定", "移到孔中央"], active: 2 }, duration: 3600 },
    { id: 4, step: "步驟 4：粗調找影像", caption: "眼睛看側邊，轉粗調整螺旋讓鏡筒下降靠近，再慢慢調出影像。", action: "think", prop: { kind: "text", text: "先低倍對光，再換高倍", sub: "低倍視野大、好對準", tone: "ok" }, duration: 3600, ask: { prompt: "對光時應該先用哪一個倍率的物鏡？", options: ["最高倍物鏡", "最低倍物鏡", "油鏡", "不用物鏡"], answer: 1, hint: "低倍視野大、好對光，先低倍找到光再換高倍。" } },
    { id: 5, step: "步驟 5：低倍高倍比一比", caption: "低倍看得廣又亮、高倍看得大卻窄又暗，所以先低倍找到目標，再換高倍看細節。", action: "point", prop: { kind: "balance", left: "低倍：視野大、較亮", right: "高倍：視野小、較暗", tip: "先低倍找，再高倍看細節" }, duration: 3600 },
    { id: 6, step: "步驟 6：細調變清晰", caption: "找到影像後，改轉細調整螺旋把畫面調到最清楚，不要再轉粗調。", action: "jump", prop: { kind: "flow", steps: ["粗調找大致影像", "改轉細調整螺旋", "調到最清晰"], active: 2 }, duration: 3600 },
    { id: 7, step: "步驟 7：下降鏡筒要看側邊", caption: "易錯點：轉粗調讓鏡筒下降時，眼睛要看著物鏡和玻片的距離，免得壓破玻片。", action: "think", prop: { kind: "text", text: "下降時眼看側邊，勿壓玻片", sub: "看清楚距離再往下", tone: "warn" }, duration: 3600, ask: { prompt: "轉動粗調整螺旋讓鏡筒下降時，眼睛應該怎麼做才安全？", options: ["眼睛直視目鏡", "眼睛從旁邊看著物鏡與玻片", "閉上眼睛", "把玻片拿走"], answer: 1, hint: "要即時看到物鏡有沒有壓到玻片。" } },
    { id: 8, step: "步驟 8：算放大倍率", caption: "總倍率 ＝ 目鏡 10 倍 × 物鏡 40 倍 ＝ 400 倍，兩個倍率相乘。", action: "point", prop: { kind: "balance", left: "10 × 40", right: "400 倍", tip: "目鏡倍率 × 物鏡倍率" }, duration: 3600, ask: { prompt: "目鏡 10 倍、物鏡 40 倍，總放大倍率是多少？", options: ["50 倍", "400 倍", "4 倍", "4000 倍"], answer: 1, hint: "兩個倍率要相乘，10 × 40 ＝ 400。" } },
    { id: 9, step: "步驟 9：記住操作口訣", caption: "口訣：先低倍對光、粗調找像、細調調清、倍率相乘。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-microscope-1", prompt: "使用顯微鏡觀察時，第一步通常要先做什麼？", options: ["直接轉到最高倍", "對光讓視野變亮", "轉細調整螺旋", "放上玻片"], answer: 1, hints: ["要先有光才能看", "讓光線通過標本"], explanation: "先用低倍物鏡對光、調光圈，使視野明亮，才能清楚觀察標本。" },
    { id: "jh-sci-microscope-2", prompt: "顯微鏡的總放大倍率怎麼計算？", options: ["目鏡＋物鏡", "目鏡 × 物鏡", "目鏡 − 物鏡", "只看物鏡"], answer: 1, hints: ["兩個倍率要合起來", "用乘法而不是加法"], explanation: "總放大倍率 ＝ 目鏡倍率 × 物鏡倍率。" },
    { id: "jh-sci-microscope-3", prompt: "目鏡 10 倍、物鏡 20 倍，總放大倍率是多少？", options: ["30 倍", "200 倍", "2 倍", "1000 倍"], answer: 1, hints: ["10 × 20 ＝ ?", "兩個倍率相乘"], explanation: "10 × 20 ＝ 200，所以是 200 倍。" },
    { id: "jh-sci-microscope-4", prompt: "找到模糊影像後，要轉哪一個螺旋把畫面調清晰？", options: ["粗調整螺旋", "細調整螺旋", "光圈", "載物台"], answer: 1, hints: ["粗調先用來找像", "細調才用來調清楚"], explanation: "先用粗調整螺旋找到大致影像，再用細調整螺旋調到清晰，避免壓破玻片。" },
    { id: "jh-sci-microscope-5", prompt: "為什麼對光要先用最低倍物鏡，而不是直接用高倍？", options: ["高倍會壞掉", "低倍視野大、容易對準光線", "高倍比較貴", "低倍放大比較多"], answer: 1, hints: ["低倍看到的範圍比較大", "先找到光再換高倍"], explanation: "低倍物鏡視野大、亮度高，容易對準光線與標本；找到後再換高倍觀察細節。" },
    { id: "jh-sci-microscope-6", prompt: "換用高倍物鏡後，視野會有什麼改變？", options: ["變大又變亮", "變小又變暗", "完全不變", "變成彩色"], answer: 1, hints: ["高倍看的範圍小", "進光量也變少"], explanation: "高倍物鏡看得大但視野範圍變小、進光變少，所以視野會變小又變暗，必要時要調大光圈。" },
  ],
};

/* ========================================================================
 * 課程 3：自然（國中）— 消化與營養
 * ======================================================================== */
const JH_SCI_DIGESTION: OnionLesson = {
  id: "jh-sci-digestion",
  title: "消化與營養：食物怎麼變成養分？",
  subject: "自然",
  topic: "消化與營養",
  grade: "七下",
  stages: ["國中"],
  desc: "跟著食物走完消化道，認識酵素和均衡飲食，洋蔥帶你消化全身。",
  takeaways: [
    "消化道順序：口 → 食道 → 胃 → 小腸 → 大腸",
    "酵素能加速分解食物，且每種酵素只作用一種養分",
    "六大類食物均衡攝取，身體才健康",
    "胃靠胃酸和蠕動把食物變成食糜；小腸吸收養分、大腸主要吸收水分，分工不同",
  ],
  frames: [
    { id: 1, step: "步驟 1：跟食物出發", caption: "嗨！你吃下的食物去哪了？今天跟著它走完整條消化道。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：排出道順序", caption: "食物路線：口 → 食道 → 胃 → 小腸 → 大腸，最後排出體外。", action: "point", prop: { kind: "flow", steps: ["口", "食道", "胃", "小腸", "大腸"], active: 0 }, duration: 3600 },
    { id: 3, step: "步驟 3：口腔先消化", caption: "在口腔裡，牙齒磨碎食物，唾液裡的澱粉酶開始分解澱粉。", action: "think", prop: { kind: "flow", steps: ["牙齒磨碎", "唾液潤滑", "澱粉酶分解澱粉"], active: 2 }, duration: 3600 },
    { id: 4, step: "步驟 4：胃把食物變食糜", caption: "胃分泌胃酸、靠胃壁蠕動把食物攪成粥狀的食糜，再慢慢送進小腸。", action: "point", prop: { kind: "flow", steps: ["胃壁蠕動", "胃酸殺菌", "食物變食糜", "送入小腸"], active: 2 }, duration: 3600 },
    { id: 5, step: "步驟 5：認識酵素", caption: "酵素像剪刀，能把大分子剪小，而且一種酵素只剪一種養分。", action: "jump", prop: { kind: "text", text: "酵素：加速反應、有專一性", sub: "一種酵素對應一種反應", tone: "ok" }, duration: 3600, ask: { prompt: "下列關於酵素的敘述，何者正確？", options: ["酵素能加速化學反應", "酵素會被消耗光", "一種酵素可分解所有養分", "酵素沒有專一性"], answer: 0, hint: "酵素是生物催化劑，加速反應且對作用對象有專一性。" } },
    { id: 6, step: "步驟 6：小腸吸收", caption: "小腸是吸收養分的主力，表面有絨毛增加面積，養分在這裡進血液。", action: "walk", prop: { kind: "flow", steps: ["小腸絨毛", "養分進血液", "運送全身"], active: 1 }, duration: 3600, ask: { prompt: "小腸為什麼能吸收很多養分？", options: ["它最長", "表面有絨毛、面積大", "它會蠕動", "它分泌唾液"], answer: 1, hint: "絨毛增加表面積，吸收才更有效率。" } },
    { id: 7, step: "步驟 7：大腸吸收水分", caption: "易錯點：小腸主要吸收養分，大腸主要吸收多餘水分，剩下的才形成糞便。", action: "think", prop: { kind: "balance", left: "小腸：吸收養分", right: "大腸：吸收水分", tip: "別把兩者功能搞反" }, duration: 3600, ask: { prompt: "小腸和大腸的主要功能，下列哪一項正確？", options: ["小腸吸水、大腸吸收養分", "小腸吸收養分、大腸吸收水分", "兩者都只磨碎食物", "兩者都分泌唾液"], answer: 1, hint: "養分在小腸進血液，水分主要在大腸被吸收。" } },
    { id: 8, step: "步驟 8：均衡飲食", caption: "六大類都要吃：全榖、蔬果、豆魚蛋肉、乳品、油脂、水，天天均衡。", action: "point", prop: { kind: "bars", items: [{ label: "全榖", value: 1 }, { label: "蔬果", value: 1 }, { label: "豆魚蛋肉", value: 1 }, { label: "乳品", value: 1 }, { label: "油脂", value: 1 }, { label: "水", value: 1 }], unit: "類", active: 0 }, duration: 3600 },
    { id: 9, step: "步驟 9：記住消化口訣", caption: "口訣：順序口食胃小大、酵素專一加速、六類均衡吃。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-digestion-1", prompt: "食物從口腔進入後，正確的消化道順序是？", options: ["口→胃→食道→小腸", "口→食道→胃→小腸→大腸", "口→小腸→胃→大腸", "口→胃→小腸→食道"], answer: 1, hints: ["食物先經過食道才到胃", "最後到大腸"], explanation: "順序為口腔 → 食道 → 胃 → 小腸 → 大腸，再排出體外。" },
    { id: "jh-sci-digestion-2", prompt: "小腸的主要功能是？", options: ["磨碎食物", "吸收養分", "儲存糞便", "分泌唾液"], answer: 1, hints: ["養分在這裡進入血液", "表面有絨毛增加面積"], explanation: "小腸絨毛表面積大，是吸收養分的主要場所。" },
    { id: "jh-sci-digestion-3", prompt: "唾液中的澱粉酶主要分解哪一類養分？", options: ["蛋白質", "澱粉（醣類）", "脂肪", "維生素"], answer: 1, hints: ["名字就有澱粉", "作用在口腔裡"], explanation: "澱粉酶專門分解澱粉等醣類，是消化最早開始的一步。" },
    { id: "jh-sci-digestion-4", prompt: "關於酵素的特性，下列何者正確？", options: ["一種酵素可分解所有食物", "酵素有專一性、只作用特定養分", "酵素會越用越少", "酵素只在高溫才作用"], answer: 1, hints: ["酵素像專用鑰匙", "每種酵素對應一種反應"], explanation: "酵素具有專一性，一種酵素通常只催化一種特定的反應，且反應前後本身不被消耗。" },
    { id: "jh-sci-digestion-5", prompt: "為什麼均衡飲食要包含六大類食物，而不是只吃喜歡的？", options: ["為了好看", "不同食物提供不同營養素，缺一不可", "六大類都比較便宜", "學校規定"], answer: 1, hints: ["每類食物營養不同", "身體需要多種營養素"], explanation: "六大類食物提供醣類、蛋白質、脂肪、維生素、礦物質、水等不同營養素，均衡攝取才能維持健康。" },
    { id: "jh-sci-digestion-6", prompt: "胃在消化過程中，主要把食物變成什麼狀態再送進小腸？", options: ["維持大塊固體", "攪成粥狀的食糜", "變成氣體", "完全不變"], answer: 1, hints: ["靠胃壁蠕動和胃酸", "攪拌成糊狀"], explanation: "胃藉胃壁蠕動與胃酸，把食物攪拌成粥狀的食糜，再分批送入小腸，有利養分吸收。" },
  ],
};

/* ========================================================================
 * 課程 4：自然（國中）— 血液循環與呼吸
 * ======================================================================== */
const JH_SCI_CIRCULATION: OnionLesson = {
  id: "jh-sci-circulation",
  title: "血液循環與呼吸：血液怎麼跑？",
  subject: "自然",
  topic: "血液循環與呼吸",
  grade: "七下",
  stages: ["國中"],
  desc: "體循環送養分到全身、肺循環做氣體交換，洋蔥帶你看懂兩條路線。",
  takeaways: [
    "體循環：左心室→全身→右心房（送氧、收廢）",
    "肺循環：右心室→肺→左心房（換氣體）",
    "肺泡處進行氧氣與二氧化碳的交換",
    "動脈把血液帶離心臟、靜脈把血液帶回心臟；左心室送含氧血、右心室送缺氧血",
  ],
  frames: [
    { id: 1, step: "步驟 1：心臟當幫浦", caption: "嗨！心臟像幫浦，把血液送到全身再收回，今天看兩條循環路線。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：整體循環一圈", caption: "血液繞身體一大圈：心臟→全身→心臟→肺→心臟，不斷重複。", action: "point", prop: { kind: "cycle", nodes: ["心臟打出", "全身", "回心臟", "去肺換氣", "回心臟"], active: 0 }, duration: 3600 },
    { id: 3, step: "步驟 3：拆解體循環", caption: "體循環：左心室把含氧血送到全身，帶走二氧化碳後回到右心房。", action: "think", prop: { kind: "flow", steps: ["左心室（含氧血）", "流到全身", "送氧、收 CO₂", "回右心房"], active: 3 }, duration: 3600 },
    { id: 4, step: "步驟 4：認識動脈與靜脈", caption: "動脈把血液帶離心臟、靜脈把血液帶回心臟，兩種血管的流向剛好相反。", action: "point", prop: { kind: "balance", left: "動脈：帶離心臟", right: "靜脈：帶回心臟", tip: "方向相反" }, duration: 3600 },
    { id: 5, step: "步驟 5：拆解肺循環", caption: "肺循環：右心室把缺氧血送到肺，換成氧氣後回到左心房。", action: "jump", prop: { kind: "flow", steps: ["右心室（缺氧血）", "送到肺", "換氧氣", "回左心房"], active: 2 }, duration: 3600, ask: { prompt: "把缺氧血送到肺部換氣的是哪一條循環？", options: ["體循環", "肺循環", "淋巴循環", "沒這條循環"], answer: 1, hint: "肺循環專門去肺做氣體交換，由右心室出發。" } },
    { id: 6, step: "步驟 6：肺泡換氣", caption: "在肺泡，氧氣進血液、二氧化碳排出，就在這裡完成氣體交換。", action: "walk", prop: { kind: "flow", steps: ["氧氣進血液", "二氧化碳排出", "完成交換"], active: 2 }, duration: 3600, ask: { prompt: "在肺泡處，氣體怎麼交換？", options: ["氧氣進血液、二氧化碳排出", "二氧化碳進血液、氧氣排出", "兩者都不交換", "只有水交換"], answer: 0, hint: "氧氣擴散進血液，二氧化碳擴散出體外。" } },
    { id: 7, step: "步驟 7：含氧血別記反", caption: "易錯點：心臟左邊流含氧血、右邊流缺氧血，送全身走左邊、去肺走右邊。", action: "think", prop: { kind: "text", text: "左邊＝含氧血　右邊＝缺氧血", sub: "送全身走左、去肺走右", tone: "warn" }, duration: 3600, ask: { prompt: "把含氧血打出送到全身的是心臟哪一個腔室？", options: ["右心室", "左心室", "左心房", "右心房"], answer: 1, hint: "送含氧血去全身的是左心室。" } },
    { id: 8, step: "步驟 8：比較兩條路", caption: "體循環去全身送氧、肺循環去肺換氣，兩條路都從心臟出發。", action: "point", prop: { kind: "balance", left: "體循環：去全身送氧", right: "肺循環：去肺換氣", tip: "兩條路都從心臟出發" }, duration: 3600 },
    { id: 9, step: "步驟 9：記住循環口訣", caption: "口訣：體循環去全身、肺循環去肺、肺泡換氣體，心臟不停當幫浦。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-circulation-1", prompt: "體循環的主要功能為何？", options: ["在肺部換氣", "把含氧血送到全身", "製造紅血球", "過濾廢物"], answer: 1, hints: ["體＝身體", "血液跑遍全身送氧"], explanation: "體循環將左心室射出的含氧血送到全身組織，供應氧氣並帶回二氧化碳。" },
    { id: "jh-sci-circulation-2", prompt: "血液在哪一個部位進行氧氣與二氧化碳的交換？", options: ["胃", "肺泡", "肝臟", "皮膚"], answer: 1, hints: ["交換發生在呼吸部位", "微小的空氣囊"], explanation: "在肺泡處，氧氣擴散進血液、二氧化碳排出，完成氣體交換。" },
    { id: "jh-sci-circulation-3", prompt: "肺循環的血液從心臟的哪裡出發？", options: ["左心室", "右心室", "左心房", "右心房"], answer: 1, hints: ["肺循環去肺", "缺氧血由右心室打出"], explanation: "肺循環由右心室將缺氧血送往肺部，換氣後經肺靜脈回左心房。" },
    { id: "jh-sci-circulation-4", prompt: "含氧血從肺部回到心臟後，會進入哪個腔室？", options: ["右心房", "左心室", "左心房", "右心室"], answer: 2, hints: ["肺回來的血進左側", "左心房接肺靜脈"], explanation: "肺循環換氣後的含氧血經肺靜脈回到左心房，再入左心室送往全身。" },
    { id: "jh-sci-circulation-5", prompt: "為什麼說體循環和肺循環是『同時』進行的，而不是先跑完一條再跑另一條？", options: ["課本寫錯了", "心臟左右兩邊同時收縮，兩條路一起跑", "肺循環比較慢", "只有運動時才同時"], answer: 1, hints: ["心臟是兩個幫浦一起工作", "左右心室同時打出"], explanation: "心臟左右兩側同時收縮，體循環與肺循環同時進行，血液不斷在全身與肺之間循環。" },
    { id: "jh-sci-circulation-6", prompt: "下列關於動脈與靜脈的敘述，何者正確？", options: ["動脈把血帶回心臟", "靜脈把血帶離心臟", "動脈把血帶離心臟、靜脈帶回", "兩者流向完全相同"], answer: 2, hints: ["動脈名稱來自離心", "靜脈是回到心臟"], explanation: "動脈把血液帶離心臟送往各處，靜脈把血液從各處帶回心臟，兩者方向相反。" },
  ],
};

/* ========================================================================
 * 課程 5：自然（國中）— 植物的運輸
 * ======================================================================== */
const JH_SCI_PLANT_TRANSPORT: OnionLesson = {
  id: "jh-sci-plant-transport",
  title: "植物的運輸：水往上、養分往全身",
  subject: "自然",
  topic: "植物的運輸",
  grade: "七下",
  stages: ["國中"],
  desc: "木質部把水送上葉子、韌皮部把養分送到各處，蒸散拉著水往上跑。",
  takeaways: [
    "木質部（導管）向上運輸水分和礦物質",
    "韌皮部（篩管）運輸光合作用製造的養分",
    "蒸散作用讓葉片失水，產生拉力把水拉上去",
    "根毛增加根部吸收表面積；缺水或天冷時落葉可減少蒸散、保留體內水分",
  ],
  frames: [
    { id: 1, step: "步驟 1：植物的水管", caption: "嗨！植物沒有心臟，卻能把水送到高高的葉子，秘密在兩套運輸管。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：木質部運水", caption: "木質部像水管，把根吸收的水和礦物質，一路往上送到葉子。", action: "point", prop: { kind: "flow", steps: ["根吸水", "木質部導管", "向上運送", "到葉子"], active: 2 }, duration: 3600, ask: { prompt: "根吸收的水分主要是靠哪個構造往上運送？", options: ["韌皮部", "木質部", "氣孔", "葉綠體"], answer: 1, hint: "木質部像水管，負責把水向上運輸。" } },
    { id: 3, step: "步驟 3：根毛增加吸水面積", caption: "根上長滿細小的根毛，把吸收表面積撐大，才能從土壤吸到更多水和礦物質。", action: "point", prop: { kind: "text", text: "根毛多 → 表面積大 → 吸水多", sub: "和小腸絨毛同道理", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：韌皮部運養分", caption: "韌皮部像運輸帶，把葉子做的糖分送到莖、根、果實各處。", action: "think", prop: { kind: "flow", steps: ["葉子製糖", "韌皮部篩管", "送往莖根果實"], active: 1 }, duration: 3600 },
    { id: 5, step: "步驟 5：認識蒸散", caption: "葉子上的氣孔會散失水氣，這叫蒸散，像吸管把水往上拉。", action: "jump", prop: { kind: "text", text: "蒸散：葉散失水氣，產生向上拉力", sub: "拉著水往上運", tone: "ok" }, duration: 3600, ask: { prompt: "植物把水分從根部拉到葉片的主要動力來自？", options: ["根部壓力", "葉片蒸散產生的拉力", "光合作用", "重力"], answer: 1, hint: "葉子散失水氣造成向上的拉力，這是主要動力。" } },
    { id: 6, step: "步驟 6：兩套管對照", caption: "木質部向上運水、韌皮部雙向運養分，兩套管分工不打架。", action: "walk", prop: { kind: "balance", left: "木質部：向上運水", right: "韌皮部：運送養分", tip: "一個運水、一個運糖" }, duration: 3600 },
    { id: 7, step: "步驟 7：影響蒸散因素", caption: "天氣越熱、風越大、葉面積越大，蒸散越快，水也送得越快。", action: "point", prop: { kind: "flow", steps: ["溫度高", "風大", "葉面積大", "蒸散快"], active: 3 }, duration: 3600 },
    { id: 8, step: "步驟 8：落葉減少蒸散", caption: "生活例：天冷或缺水時落葉，就是減少葉面積、從氣孔散失的水氣，把水保下來。", action: "think", prop: { kind: "text", text: "落葉＝減少葉面積、降低蒸散", sub: "缺水時的自保", tone: "warn" }, duration: 3600, ask: { prompt: "移植樹木時常剪掉部分枝葉，主要目的是？", options: ["比較美觀", "減少蒸散、保留水分", "讓樹長更高", "增加光合作用"], answer: 1, hint: "葉子少了，從氣孔散失的水氣就跟著變少。" } },
    { id: 9, step: "步驟 9：記住運輸口訣", caption: "口訣：木質部運水向上、韌皮部運糖到處、蒸散拉水往上。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-plant-transport-1", prompt: "植物體內負責把水分向上運輸的是？", options: ["韌皮部", "木質部", "表皮", "氣孔"], answer: 1, hints: ["木質部像水管", "向上運水"], explanation: "木質部中的導管負責將根吸收的水分和礦物質向上運輸到莖葉。" },
    { id: "jh-sci-plant-transport-2", prompt: "光合作用製造的糖分，主要由哪個構造運送？", options: ["木質部", "韌皮部", "葉脈", "根毛"], answer: 1, hints: ["糖分是養分", "韌皮部運養分"], explanation: "韌皮部的篩管負責把葉片製造的糖分等養分運送到植物各部位。" },
    { id: "jh-sci-plant-transport-3", prompt: "蒸散作用對植物的主要意義是？", options: ["製造氧氣", "產生拉力幫助運水", "吸收陽光", "儲存澱粉"], answer: 1, hints: ["水分從葉散失", "形成向上拉力"], explanation: "葉片蒸散散失水氣，產生向上的拉力，協助木質部將水分運送到高處。" },
    { id: "jh-sci-plant-transport-4", prompt: "下列哪一個會讓蒸散作用變快？", options: ["低溫無風", "高溫且有風", "葉子很小", "空氣潮濕"], answer: 1, hints: ["熱和風加速水氣散失", "溫度高、風大更快"], explanation: "溫度高、風大、葉面積大、空氣乾燥都會加快蒸散速率。" },
    { id: "jh-sci-plant-transport-5", prompt: "木質部和韌皮部運輸方向最大的不同是？", options: ["木質部只向上、韌皮部可雙向", "兩者都只能向上", "木質部運糖、韌皮部運水", "兩者都向下"], answer: 0, hints: ["水主要向上", "養分要送到各處可上可下"], explanation: "木質部主要將水向上運輸；韌皮部運送養分可依需求往上或往下，方向較靈活。" },
    { id: "jh-sci-plant-transport-6", prompt: "植物根部長出許多根毛，主要功能是？", options: ["固定植物不被風吹倒", "增加吸收表面積、多吸水和礦物質", "進行光合作用", "製造養分"], answer: 1, hints: ["根毛又細又多", "和小腸絨毛同道理"], explanation: "根毛增加根部與土壤接觸的表面積，能更有效率地吸收水分和溶解在水中的礦物質。" },
  ],
};

/* ========================================================================
 * 課程 6：自然（國中）— 光的反射與折射
 * ======================================================================== */
const JH_SCI_OPTICS: OnionLesson = {
  id: "jh-sci-optics",
  title: "光的反射與折射：光為什麼拐彎？",
  subject: "自然",
  topic: "光的反射與折射",
  grade: "八上",
  stages: ["國中"],
  desc: "反射角等於入射角、折射讓筷子看起來彎，洋蔥用圖帶你看光怎麼拐。",
  takeaways: [
    "反射定律：入射角 ＝ 反射角，兩角都從法線量起",
    "折射：光從一種介質斜射進另一種會偏折",
    "光從空氣進水會靠近法線，看起來物體位置偏移",
    "平面鏡成等大、左右相反的虛像；反射是碰到界面反彈，折射是穿入另一介質偏折，兩者別搞混",
  ],
  frames: [
    { id: 1, step: "步驟 1：光走直線也會拐", caption: "嗨！平靜水面能照出你，筷子插水卻像折斷，今天看光怎麼拐彎。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：認識反射", caption: "光碰到鏡面會反彈，這叫反射；反彈回去的光就是反射光。", action: "point", prop: { kind: "text", text: "反射：光碰到鏡面反彈回去", sub: "反彈的光叫反射光", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：平面鏡裡的你", caption: "平面鏡照出和你一樣大的像，而且左右相反，這就是光反射形成的虛像。", action: "point", prop: { kind: "text", text: "平面鏡：等大、左右相反", sub: "由光的反射成像", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：反射定律", caption: "入射角與反射角都從法線量起，兩者大小相等、在法線兩側。", action: "think", prop: { kind: "text", text: "入射角 ＝ 反射角（都從法線量）", sub: "兩角在法線兩側", tone: "ok" }, duration: 3600, ask: { prompt: "根據反射定律，入射角等於什麼？", options: ["折射角", "反射角", "臨界角", "偏折角"], answer: 1, hint: "反射定律：入射角等於反射角，都從法線量起。" } },
    { id: 5, step: "步驟 5：畫出法線", caption: "法線是垂直鏡面的虛線，入射角和反射角都是跟它比較大小。", action: "jump", prop: { kind: "shape", shape: "triangle", base: 60, height: 40, label: "入射光、法線、反射光" }, duration: 3600 },
    { id: 6, step: "步驟 6：認識折射", caption: "光斜著從空氣進水，速度變慢會偏折，這叫折射，筷子看起來彎了。", action: "walk", prop: { kind: "flow", steps: ["光從空氣", "斜射入水", "速度變慢", "光線偏折"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：反射折射別搞混", caption: "易錯點：光碰到鏡面反彈回去是反射；穿進水裡偏折方向是折射，一個反彈、一個穿入。", action: "think", prop: { kind: "balance", left: "反射：碰到界面反彈", right: "折射：穿入介質偏折", tip: "反彈 vs 穿入" }, duration: 3600, ask: { prompt: "筷子插進水裡看起來像折斷，主要是光的哪一種現象？", options: ["反射", "折射", "吸收", "直線前進"], answer: 1, hint: "光穿進水裡改變方向，才讓筷子看起來偏移。" } },
    { id: 8, step: "步驟 8：折射方向", caption: "光從空氣進水會靠近法線；從水進空氣則遠離法線偏折。", action: "point", prop: { kind: "text", text: "空氣→水：折射光靠近法線", sub: "水→空氣：遠離法線", tone: "ok" }, duration: 3600, ask: { prompt: "光從空氣斜射進水中，折射光會怎麼偏？", options: ["遠離法線", "靠近法線", "不偏折", "往回反射"], answer: 1, hint: "進入較慢的介質（水）時，光會靠近法線偏折。" } },
    { id: 9, step: "步驟 9：記住光學口訣", caption: "口訣：反射角等於入射角、折射進水靠法線，光會拐彎但要守規矩。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-optics-1", prompt: "光碰到平滑鏡面後反彈回來，這現象叫？", options: ["折射", "反射", "繞射", "吸收"], answer: 1, hints: ["光被彈回", "鏡子照出影像"], explanation: "光遇到鏡面等障礙物反彈回來的現象稱為反射。" },
    { id: "jh-sci-optics-2", prompt: "反射定律中，入射角和反射角的關係是？", options: ["入射角大於反射角", "兩者相等", "入射角小於反射角", "不一定"], answer: 1, hints: ["反射定律", "都從法線量起"], explanation: "反射定律：入射角等於反射角，兩者皆由法線（垂直鏡面的線）量起。" },
    { id: "jh-sci-optics-3", prompt: "光從空氣斜射進入水中，折射光線會？", options: ["遠離法線", "靠近法線", "沿原方向", "消失"], answer: 1, hints: ["水比空氣慢", "較慢介質使光靠近法線"], explanation: "光從光疏（空氣）進入光密（水）會減速並靠近法線偏折。" },
    { id: "jh-sci-optics-4", prompt: "為什麼插在水裡的筷子看起來像折斷？", options: ["筷子真的斷了", "光折射使位置看起來偏移", "水把筷子腐蝕", "視力問題"], answer: 1, hints: ["光在水面偏折", "眼睛以為光走直線"], explanation: "光在空氣與水的界面折射，眼睛延直線回溯，便覺得筷子位置偏移而像折斷。" },
    { id: "jh-sci-optics-5", prompt: "入射角是『入射光與法線』的夾角，而非與鏡面的夾角，為什麼要這樣定義？", options: ["比較好畫圖", "法線垂直鏡面，用它能公平比較反射與折射", "老師規定", "鏡面會動"], answer: 1, hints: ["法線固定垂直鏡面", "角度都對同一條線量才一致"], explanation: "法線垂直於界面，入射角、反射角、折射角都對它測量，才能一致地描述並比較偏折情形。" },
    { id: "jh-sci-optics-6", prompt: "平靜的湖面可以照出岸邊的樹木，主要是光的哪一種現象？", options: ["折射", "反射", "繞射", "吸收"], answer: 1, hints: ["湖面像鏡子", "光被彈回來"], explanation: "平靜水面像平面鏡，光線碰到水面反彈回來（反射），才照出岸邊景物的像。" },
  ],
};

/* ========================================================================
 * 課程 7：自然（國中）— 溫度與熱量
 * ======================================================================== */
const JH_SCI_HEAT: OnionLesson = {
  id: "jh-sci-heat",
  title: "溫度與熱量：比熱是什麼？",
  subject: "自然",
  topic: "溫度與熱量",
  grade: "八上",
  stages: ["國中"],
  desc: "同樣加熱，水比鐵升得慢？比熱解釋這現象，洋蔥帶你算熱量與熱平衡。",
  takeaways: [
    "比熱：讓 1 公克物質上升 1°C 所需的熱量",
    "熱量 ＝ 質量 × 比熱 × 溫差",
    "熱平衡：熱從高溫流向低溫，最後溫度相同",
    "水的比熱大、升溫慢也降溫慢，能調節氣溫與當冷卻劑；熱平衡時吸放熱量相等",
  ],
  frames: [
    { id: 1, step: "步驟 1：同樣加熱誰升溫快", caption: "嗨！同樣用火烤，鐵勺很快燙、水卻慢半拍，今天用比熱來解釋。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：比較比熱大小", caption: "水的比熱約 1、鐵約 0.1，同質量加同熱，鐵升溫比水快很多。", action: "point", prop: { kind: "bars", items: [{ label: "水", value: 1 }, { label: "鐵", value: 0.1 }], unit: "cal/g°C", active: 0 }, duration: 3600 },
    { id: 3, step: "步驟 3：海邊的比熱道理", caption: "夏天中午沙灘很燙、海水卻還涼，因為水比熱大，吸同樣的熱升溫比較慢。", action: "point", prop: { kind: "balance", left: "沙子比熱小→燙", right: "海水比熱大→涼", tip: "比熱大升溫慢" }, duration: 3600 },
    { id: 4, step: "步驟 4：搞懂比熱意義", caption: "比熱是讓 1 公克物質上升 1°C 需要的熱量，越大越不容易變熱。", action: "think", prop: { kind: "text", text: "比熱大：難升溫、能儲熱", sub: "cal/g°C 越大越耐熱", tone: "ok" }, duration: 3600, ask: { prompt: "比熱比較大的物質，會有什麼特性？", options: ["升溫比較快", "升溫比較慢、較能儲熱", "不會吸熱", "所有物質比熱都一樣"], answer: 1, hint: "比熱大表示要更多熱才能升 1 度。" } },
    { id: 5, step: "步驟 5：熱量計算", caption: "熱量 ＝ 質量 × 比熱 × 溫差，100 公克水升 10°C 要 1000 卡。", action: "walk", prop: { kind: "balance", left: "100 g × 1 × 10", right: "1000 cal", tip: "質量 × 比熱 × 溫差" }, duration: 3600, ask: { prompt: "100 公克水（比熱 1）從 20°C 升到 30°C，需多少熱量？", options: ["10 cal", "100 cal", "1000 cal", "10000 cal"], answer: 2, hint: "熱量 ＝ 100 × 1 × (30−20) ＝ 1000。" } },
    { id: 6, step: "步驟 6：熱平衡概念", caption: "熱從高溫流向低溫，直到兩邊溫度一樣，這叫達到熱平衡。", action: "jump", prop: { kind: "flow", steps: ["高溫物體", "熱流向低溫", "溫度趨近", "達到熱平衡"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：算熱平衡", caption: "冷熱水混合：熱水放出的熱 ＝ 冷水吸收的熱，最後溫度相同。", action: "point", prop: { kind: "balance", left: "熱水放出 500 cal", right: "冷水吸收 500 cal", tip: "熱平衡時兩者相等" }, duration: 3600 },
    { id: 8, step: "步驟 8：水的調溫妙用", caption: "深化：水比熱大、升溫降溫都慢，所以海邊氣候溫和，也常拿水來冷卻引擎。", action: "think", prop: { kind: "text", text: "水比熱大 → 調溫、冷卻", sub: "升溫慢、降溫也慢", tone: "ok" }, duration: 3600, ask: { prompt: "汽車引擎常用水來冷卻，主要是因為水的比熱？", options: ["很小", "很大、能吸收大量熱", "等於零", "和鐵一樣"], answer: 1, hint: "比熱大的水能吸很多熱而溫度不會暴衝。" } },
    { id: 9, step: "步驟 9：記住熱量口訣", caption: "口訣：比熱大不易熱、熱量＝質量×比熱×溫差、熱平衡同溫。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-heat-1", prompt: "比熱的定義是？", options: ["物質的質量", "讓 1 公克上升 1°C 所需熱量", "物體的溫度", "熱傳導速度"], answer: 1, hints: ["和升溫 1 度有關", "單位是 cal/g°C"], explanation: "比熱是使 1 公克物質溫度上升 1°C 所需要的熱量，是物質的性質。" },
    { id: "jh-sci-heat-2", prompt: "計算熱量的公式是？", options: ["質量 ÷ 比熱", "質量 × 比熱 × 溫差", "比熱 ÷ 溫差", "質量 ＋ 溫差"], answer: 1, hints: ["三者相乘", "升溫越多熱越多"], explanation: "吸收（或放出）的熱量 ＝ 質量 × 比熱 × 溫度變化。" },
    { id: "jh-sci-heat-3", prompt: "100 公克水（比熱 1）從 20°C 升到 30°C，吸收多少熱量？", options: ["100 cal", "1000 cal", "10 cal", "3000 cal"], answer: 1, hints: ["溫差 ＝ 10", "100 × 1 × 10 ＝ ?"], explanation: "100 × 1 × (30−20) ＝ 1000 cal。" },
    { id: "jh-sci-heat-4", prompt: "同質量、同加熱下，比熱較小的鐵會比水？", options: ["升溫較慢", "升溫較快", "不升溫", "一樣快"], answer: 1, hints: ["比熱小要的熱少", "相同熱量下升更多"], explanation: "比熱小的物質只需較少熱量就能升溫，因此同條件下鐵比水升溫快。" },
    { id: "jh-sci-heat-5", prompt: "冷熱水混合達到熱平衡時，下列何者正確？", options: ["熱水溫度不變", "冷水吸熱等於熱水放熱、最後同溫", "總熱量變多", "比熱會改變"], answer: 1, hints: ["熱量守恆", "最後兩邊溫度相同"], explanation: "熱平衡時熱水放出的熱量等於冷水吸收的熱量（忽略散失），兩者最後達到相同溫度。" },
    { id: "jh-sci-heat-6", prompt: "夏天中午海邊沙灘很燙、海水卻還涼，主要原因是？", options: ["沙子比熱大", "水的比熱大、升溫較慢", "海水太深", "太陽只照沙子"], answer: 1, hints: ["水比熱大", "吸同樣的熱升溫少"], explanation: "水的比熱比沙子大，吸收同樣的太陽熱量時水升溫較慢，所以中午沙灘燙、海水仍涼。" },
  ],
};

/* ========================================================================
 * 課程 8：自然（國中）— 化學反應與質量守恆
 * ======================================================================== */
const JH_SCI_CHEMICAL_REACTION: OnionLesson = {
  id: "jh-sci-chemical-reaction",
  title: "化學反應與質量守恆：原子沒消失",
  subject: "自然",
  topic: "化學反應與質量守恆",
  grade: "八下",
  stages: ["國中"],
  desc: "反應前後原子數不變，所以質量守恆；洋蔥教你把反應式係數配平。",
  takeaways: [
    "質量守恆：反應前後總質量不變（原子只是重新組合）",
    "化學反應式左右原子種類與數目要相等",
    "配平係數是讓左右各原子數相同",
    "質量守恆要在密閉系統才看得出來；反應前後原子種類與數目不變，只是重新組合",
  ],
  frames: [
    { id: 1, step: "步驟 1：反應前後秤一秤", caption: "嗨！蠟燭燃燒變輕，但其實原子沒消失，今天看質量守恆。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：原子重新排隊", caption: "化學反應只是原子拆開再組合，種類和數目都不會變少。", action: "point", prop: { kind: "text", text: "反應前後：原子種類、數目不變", sub: "只是重新組合", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：蠟燭變輕的真相", caption: "蠟燭燃燒後變輕，是生成的二氧化碳和水蒸氣跑進空氣，不是原子憑空消失。", action: "point", prop: { kind: "text", text: "質量跑進空氣，不是消失", sub: "密閉起來才秤得出來", tone: "warn" }, duration: 3600 },
    { id: 4, step: "步驟 4：認識質量守恆", caption: "反應前總質量 ＝ 反應後總質量，這就是質量守恆定律。", action: "think", prop: { kind: "balance", left: "12 g 反應物", right: "12 g 生成物", tip: "原子沒增加也沒消失" }, duration: 3600, ask: { prompt: "化學反應前後，原子的什麼保持不變？", options: ["種類和數目", "只有質量", "只有體積", "全部都變"], answer: 0, hint: "原子只是重新組合，種類與數目都不變。" } },
    { id: 5, step: "步驟 5：看反應式", caption: "氫氣加氧氣生成水：H₂ ＋ O₂ → H₂O，先數數兩邊的原子。", action: "walk", prop: { kind: "flow", steps: ["左：H₂ + O₂", "右：H₂O", "數 H 和 O", "發現不平衡"], active: 3 }, duration: 3600 },
    { id: 6, step: "步驟 6：配平係數", caption: "在 H₂O 前放 2，再加 2 個 H₂、1 個 O₂：2H₂ ＋ O₂ → 2H₂O。", action: "jump", prop: { kind: "balance", left: "2 H₂ ＋ O₂", right: "2 H₂O", tip: "左右 H、O 數目相等" }, duration: 3600, ask: { prompt: "配平 H₂ ＋ O₂ → H₂O 時，H₂O 前的係數應該是？", options: ["1", "2", "3", "4"], answer: 1, hint: "先讓 O 平衡，H₂O 要 2 個才對稱。" } },
    { id: 7, step: "步驟 7：驗收原子數", caption: "左邊 4 個 H、2 個 O，右邊也是 4 個 H、2 個 O，終於平衡了！", action: "point", prop: { kind: "bars", items: [{ label: "H 左", value: 4 }, { label: "O 左", value: 2 }, { label: "H 右", value: 4 }, { label: "O 右", value: 2 }], unit: "個", active: 0 }, duration: 3600 },
    { id: 8, step: "步驟 8：密閉才守恆", caption: "易錯點：要在密閉容器裡反應，氣體跑不掉，前後秤重才會相等；敞開時氣體逸出看起來會變輕。", action: "think", prop: { kind: "balance", left: "密閉：前後同重", right: "敞開：氣體逸出", tip: "密閉系統才守恆" }, duration: 3600, ask: { prompt: "蠟燭在空氣中燃燒後變輕，最合理的解釋是？", options: ["原子消失了", "生成的氣體與水蒸氣逸散到空氣中", "質量不守恆", "蠟燭本來就會變"], answer: 1, hint: "不是原子不見，是生成物跑掉了。" } },
    { id: 9, step: "步驟 9：記住反應口訣", caption: "口訣：原子不滅守恆質量、反應式左右配平、係數讓原子相等。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-chemical-reaction-1", prompt: "質量守恆定律是指？", options: ["反應後質量變多", "反應前後總質量不變", "反應後質量變少", "只有固體守恆"], answer: 1, hints: ["原子沒消失", "只是重新組合"], explanation: "化學反應前後原子的種類與數目不變，因此總質量保持不變。" },
    { id: "jh-sci-chemical-reaction-2", prompt: "化學反應的本質是？", options: ["原子消失", "原子重新組合成新物質", "質量改變", "元素改變"], answer: 1, hints: ["舊鍵斷、新鍵成", "原子只是重新排列"], explanation: "化學反應是原子間化學鍵斷裂與形成，原子重新排列組成新物質，原子本身不變。" },
    { id: "jh-sci-chemical-reaction-3", prompt: "配平 2H₂ ＋ O₂ → ?H₂O 時，H₂O 的係數是多少？", options: ["1", "2", "3", "4"], answer: 1, hints: ["左邊有 4 個 H", "右邊也要 4 個 H"], explanation: "左邊有 4 個 H 與 2 個 O，右邊每個 H₂O 含 2H、1O，故需 2 個 H₂O 才平衡。" },
    { id: "jh-sci-chemical-reaction-4", prompt: "下列哪一個也符合質量守恆？", options: ["反應前 10 g、反應後 10 g", "反應前 10 g、反應後 8 g", "反應後憑空多出 2 g", "反應後少 3 g"], answer: 0, hints: ["前後總質量要相等", "沒物質憑空出現或消失"], explanation: "質量守恆要求反應前後總質量相等，10 g 反應物生成 10 g 生成物即符合。" },
    { id: "jh-sci-chemical-reaction-5", prompt: "為什麼配平化學反應式時，不能改變物質『右下角數字』（如 H₂O 的 2）？", options: ["只是習慣", "那是分子內原子數，改了就變成別的物質", "老師規定", "數字不重要"], answer: 1, hints: ["右下角是分子組成", "改了分子就變了"], explanation: "化學式右下角的數字表示分子中原子數，改變它就改變了物質本身；配平只能調整左邊的係數，不能動右下角。" },
    { id: "jh-sci-chemical-reaction-6", prompt: "驗證質量守恆時，最好把反應放在密閉容器中做，主要是為了？", options: ["比較好看", "防止氣體逸散，使前後秤重相等", "讓反應比較快", "節省材料"], answer: 1, hints: ["氣體也有質量", "跑掉就秤不到"], explanation: "密閉容器能防止生成的氣體逸散，使反應物與生成物都留在容器內，前後秤重才會相等，真正展現質量守恆。" },
  ],
};

/* ========================================================================
 * 課程 9：自然（國中）— 電磁鐵與電磁感應
 * ======================================================================== */
const JH_SCI_ELECTROMAGNET: OnionLesson = {
  id: "jh-sci-electromagnet",
  title: "電磁鐵與電磁感應：電和磁會變身",
  subject: "自然",
  topic: "電磁鐵與電磁感應",
  grade: "九上",
  stages: ["國中"],
  desc: "通電的線圈變磁鐵，磁場變化又能生電，洋蔥帶你看電磁如何互變。",
  takeaways: [
    "通電線圈產生磁場，成為電磁鐵（電生磁）",
    "電磁鐵磁性強弱隨電流大小、圈數而變",
    "改變穿過線圈的磁場會感應出電流（磁生電）",
    "電磁鐵用在電鈴、吸盤、起重機；馬達是電生磁、發電機是磁生電，兩者方向相反",
  ],
  frames: [
    { id: 1, step: "步驟 1：電也能變磁鐵", caption: "嗨！鐵釘繞上電線、通電就變磁鐵，今天看電和磁怎麼互變。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：做電磁鐵", caption: "把電線繞在鐵釘上通電，鐵釘就吸住迴紋針，這就是電磁鐵。", action: "point", prop: { kind: "flow", steps: ["繞線圈在鐵釘", "接通電池", "產生磁性", "吸住迴紋針"], active: 3 }, duration: 3600 },
    { id: 3, step: "步驟 3：電生磁", caption: "電流流過線圈會產生磁場，這就是『電生磁』，斷電磁性就消失。", action: "think", prop: { kind: "text", text: "電生磁：電流流過線圈產生磁場", sub: "斷電磁性就消失", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：電磁鐵的應用", caption: "生活例：電鈴、電磁吸盤、吊鋼鐵的起重機，都靠電磁鐵，通電才有磁、斷電就放開。", action: "point", prop: { kind: "text", text: "電鈴／吸盤／起重機", sub: "通電有磁、斷電釋放", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：影響磁性強弱", caption: "電流越大、線圈繞越多圈，電磁鐵吸力越強，斷電就沒磁性。", action: "jump", prop: { kind: "text", text: "電流大、圈數多 → 磁性強", sub: "斷電就沒磁性", tone: "ok" }, duration: 3600, ask: { prompt: "想讓電磁鐵吸力更強，可以怎麼做？", options: ["減少電流", "加大電流、增加圈數", "斷開電路", "拿掉鐵釘"], answer: 1, hint: "電流大、圈數多，磁性會更強。" } },
    { id: 6, step: "步驟 6：磁生電", caption: "反過來，讓磁鐵在線圈中移動、磁場改變，線圈就感應出電流。", action: "walk", prop: { kind: "flow", steps: ["磁鐵移動", "穿過線圈磁通變", "感應電流", "產生電"], active: 2 }, duration: 3600, ask: { prompt: "磁鐵在線圈中快速移動，線圈會發生什麼？", options: ["發熱熔化", "感應出電流", "失去磁性", "沒有變化"], answer: 1, hint: "磁場改變會感應生電，這就是磁生電。" } },
    { id: 7, step: "步驟 7：電磁互變對照", caption: "電生磁：通電有磁場；磁生電：磁場變化生電流，兩者正好相反。", action: "point", prop: { kind: "balance", left: "電生磁：通電產磁場", right: "磁生電：磁場變產電流", tip: "方向相反、互為因果" }, duration: 3600 },
    { id: 8, step: "步驟 8：馬達與發電機", caption: "易錯點：馬達是用電生磁讓線圈轉動；發電機是靠磁生電把動能變電，別記反。", action: "think", prop: { kind: "balance", left: "馬達：電→磁→轉動", right: "發電機：磁→電", tip: "一個用電、一個生電" }, duration: 3600, ask: { prompt: "發電機能夠發電，主要利用哪一種現象？", options: ["電生磁", "磁生電（電磁感應）", "靜電摩擦", "電流熱效應"], answer: 1, hint: "發電機靠磁場改變來感應出電流。" } },
    { id: 9, step: "步驟 9：記住電磁口訣", caption: "口訣：通電生磁做電磁鐵、磁場變化生電流，電磁互變真奇妙。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-electromagnet-1", prompt: "在鐵釘上繞線圈並通電，會得到什麼？", options: ["永久磁鐵", "電磁鐵", "電池", "馬達"], answer: 1, hints: ["電流通過線圈", "斷電磁性消失"], explanation: "通電的線圈產生磁場使鐵芯磁化，稱為電磁鐵；斷電後磁性隨之消失。" },
    { id: "jh-sci-electromagnet-2", prompt: "『電生磁』的意思是？", options: ["電會變成磁鐵", "電流流過導體產生磁場", "磁會變成電", "電和磁無關"], answer: 1, hints: ["電流伴隨磁場", "奧斯特實驗"], explanation: "電生磁指電流會在其周圍產生磁場，是電磁鐵與馬達的基礎。" },
    { id: "jh-sci-electromagnet-3", prompt: "下列何者會讓電磁鐵磁性更強？", options: ["電流變小", "線圈圈數增加", "切斷電源", "改用木芯"], answer: 1, hints: ["圈數多磁場疊加", "電流大也會更強"], explanation: "增加線圈圈數或加大電流都能增強電磁鐵的磁性；斷電則磁性消失。" },
    { id: "jh-sci-electromagnet-4", prompt: "把磁鐵在線圈中快速移動，線圈會？", options: ["發熱熔化", "感應產生電流", "失去磁性", "沒有變化"], answer: 1, hints: ["磁場在變", "磁通量改變生電"], explanation: "磁鐵運動使穿過線圈的磁通量改變，依電磁感應線圈會感應出電流，即『磁生電』。" },
    { id: "jh-sci-electromagnet-5", prompt: "為什麼磁生電必須讓磁場『改變』，靜止不動就不會產生電流？", options: ["磁鐵會累", "只有磁通量改變才會感應電動勢", "靜止時沒有磁場", "導線要轉才有效"], answer: 1, hints: ["關鍵是變化率", "法拉第電磁感應"], explanation: "根據電磁感應定律，只有穿過線圈的磁通量發生變化（磁場改變或相對運動）才會感應出電動勢與電流；磁場靜止不變則不會生電。" },
    { id: "jh-sci-electromagnet-6", prompt: "下列哪一項最主要是利用『電磁鐵（電生磁）』運作的？", options: ["對話的電話筒", "起重機吊起廢鐵的磁鐵", "太陽能板發電", "水壺煮開水"], answer: 1, hints: ["通電有磁、斷電放開", "用電來控制磁性"], explanation: "起重機的電磁吸盤通電時產生磁性吊起鋼鐵、斷電就放下，正是電磁鐵（電生磁）的應用。" },
  ],
};

/* ========================================================================
 * 課程 10：自然（國中）— 天氣與鋒面
 * ======================================================================== */
const JH_SCI_WEATHER_FRONT: OnionLesson = {
  id: "jh-sci-weather-front",
  title: "天氣與鋒面：冷空氣撞暖空氣",
  subject: "自然",
  topic: "天氣與鋒面",
  grade: "九上",
  stages: ["國中"],
  desc: "冷鋒、暖鋒、滯留鋒各帶不同天氣，洋蔥帶你看鋒面怎麼帶來降雨。",
  takeaways: [
    "冷鋒：冷空氣推進、暖空氣被迫抬升，易下雷陣雨",
    "暖鋒：暖空氣緩慢爬到冷空氣上，連續性降雨",
    "滯留鋒：冷暖僵持，長時間降雨（如梅雨）",
    "冷空氣較重貼地推進而抬升暖空氣成雲；冷鋒過境後氣溫下降、暖鋒過境後回升",
  ],
  frames: [
    { id: 1, step: "步驟 1：兩團空氣相遇", caption: "嗨！冷空氣和暖空氣相遇的地方叫鋒面，天氣劇烈變化就在這裡。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：認識冷鋒", caption: "冷鋒：較重的冷空氣快速推進，把暖空氣猛抬起來，常下雷陣雨。", action: "point", prop: { kind: "flow", steps: ["冷空氣推進", "暖空氣被抬升", "快速成雲", "下雷陣雨"], active: 3 }, duration: 3600, ask: { prompt: "冷鋒是哪一種空氣主動推進？", options: ["暖空氣", "冷空氣", "兩者都不", "只有風"], answer: 1, hint: "冷空氣較重、主動推進就是冷鋒。" } },
    { id: 3, step: "步驟 3：暖空氣為何被抬升", caption: "冷空氣比較重、貼著地面推進，把輕的暖空氣整個抬升上去，水氣凝結就成雲降雨。", action: "point", prop: { kind: "flow", steps: ["冷空氣重貼地", "主動推進", "抬升暖空氣", "成雲降雨"], active: 2 }, duration: 3600 },
    { id: 4, step: "步驟 4：認識暖鋒", caption: "暖鋒：暖空氣緩緩爬到冷空氣上方，形成大片雲、下連續雨。", action: "think", prop: { kind: "text", text: "暖鋒：暖空氣爬上冷空氣，連續降雨", sub: "慢而綿", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：分辨冷鋒暖鋒", caption: "冷鋒又快又猛、暖鋒慢又綿；一個下驟雨、一個下綿雨。", action: "jump", prop: { kind: "balance", left: "冷鋒：冷推暖、快而猛", right: "暖鋒：暖爬冷、慢而綿", tip: "移動速度與雨勢不同" }, duration: 3600, ask: { prompt: "冷空氣快速推進、把暖空氣抬起，形成的是哪種鋒面？", options: ["暖鋒", "冷鋒", "滯留鋒", "無鋒面"], answer: 1, hint: "冷空氣主動推進就是冷鋒。" } },
    { id: 6, step: "步驟 6：認識滯留鋒", caption: "滯留鋒：冷熱誰也推不動誰，僵在那裡，帶來長時間降雨。", action: "walk", prop: { kind: "flow", steps: ["冷空氣", "暖空氣", "僵持不下", "長時間降雨"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：鋒面循環", caption: "鋒面過境常輪流出現：冷鋒、暖鋒、滯留鋒輪流影響天氣。", action: "point", prop: { kind: "cycle", nodes: ["冷鋒", "暖鋒", "滯留鋒", "再冷鋒"], active: 0 }, duration: 3600 },
    { id: 8, step: "步驟 8：過境後的氣溫", caption: "易錯點：冷鋒過境後冷空氣接手，氣溫下降；暖鋒過境後暖空氣報到，氣溫回升。", action: "think", prop: { kind: "balance", left: "冷鋒過後：變冷", right: "暖鋒過後：變暖", tip: "看誰最後接手" }, duration: 3600, ask: { prompt: "冷鋒過境後，當地氣溫通常會如何變化？", options: ["明顯下降", "明顯上升", "維持不變", "先升後降"], answer: 0, hint: "冷空氣接手，當地就變冷。" } },
    { id: 9, step: "步驟 9：記住鋒面口訣", caption: "口訣：冷鋒快猛雷陣雨、暖鋒綿綿連續雨、滯留鋒久雨不休。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-sci-weather-front-1", prompt: "冷空氣與暖空氣交界、天氣變化劇烈的地帶叫？", options: ["鋒面", "等高線", "等壓線", "颱風眼"], answer: 0, hints: ["兩種空氣相遇處", "天氣前線"], explanation: "冷、暖空氣交接的過渡帶稱為鋒面，天氣常在這裡劇烈變化。" },
    { id: "jh-sci-weather-front-2", prompt: "冷鋒過境時，常出現下列哪種天氣？", options: ["長時間細雨", "雷陣雨等驟雨", "萬里無雲", "乾旱"], answer: 1, hints: ["冷空氣猛抬暖空氣", "又快又猛"], explanation: "冷鋒推進快，暖空氣被迅速抬升，常發展成積雨雲而下雷陣雨等陣性降雨。" },
    { id: "jh-sci-weather-front-3", prompt: "下列哪一個是暖鋒的特徵？", options: ["又快又猛的雷陣雨", "暖空氣緩慢爬升、連續性降雨", "冷空氣推進", "鋒面靜止不動"], answer: 1, hints: ["暖空氣主動爬升", "雨下得綿長"], explanation: "暖鋒是暖空氣緩慢爬到冷空氣之上，形成層狀雲並帶來大範圍、連續性的降雨。" },
    { id: "jh-sci-weather-front-4", prompt: "梅雨季節台灣常受到哪一種鋒面影響，導致長時間降雨？", options: ["冷鋒", "暖鋒", "滯留鋒", "沒鋒面"], answer: 2, hints: ["冷暖僵持不下", "雨下很久"], explanation: "滯留鋒是冷、暖空氣勢均力敵、停滯不前，使降雨持續多日，是梅雨的主要成因。" },
    { id: "jh-sci-weather-front-5", prompt: "為什麼冷鋒和暖鋒都會下雨，但雨的『型態』卻不一樣？", options: ["冷鋒沒有雲", "抬升速度不同：冷鋒猛、暖鋒緩，雲雨型態各異", "鋒面種類無關", "只看溫度不管抬升"], answer: 1, hints: ["關鍵在暖空氣被抬升的快慢", "快→積雨雲陣雨；慢→層雲綿雨"], explanation: "冷鋒抬升快、發展積雨雲而下陣雨；暖鋒緩慢爬升、形成層狀雲而下連續雨，差別在抬升速度與雲型。" },
    { id: "jh-sci-weather-front-6", prompt: "滯留鋒會帶來長時間的降雨，主要原因是？", options: ["冷暖空氣勢均力敵、停滯不前", "只有冷空氣", "只有暖空氣", "完全沒有空氣流動"], answer: 0, hints: ["誰也推不動誰", "鋒面卡在原地"], explanation: "滯留鋒是冷、暖空氣勢均力敵、誰也推不動誰，鋒面停滯在原地，使暖空氣持續抬升而降雨數日。" },
  ],
};

export default [
  JH_SCI_MEASUREMENT,
  JH_SCI_MICROSCOPE,
  JH_SCI_DIGESTION,
  JH_SCI_CIRCULATION,
  JH_SCI_PLANT_TRANSPORT,
  JH_SCI_OPTICS,
  JH_SCI_HEAT,
  JH_SCI_CHEMICAL_REACTION,
  JH_SCI_ELECTROMAGNET,
  JH_SCI_WEATHER_FRONT,
];
