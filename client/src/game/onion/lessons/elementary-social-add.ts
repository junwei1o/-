/**
 * 國小社會 10 堂（elementary-social-add.ts）
 *
 * 課程表來自 docs/onion-200-plan.md →「社會 10 堂」（id: el-soc-*）。
 * 每堂課 7 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 2 幀有 ask）
 * ＋ 5 題闖關（含 2 級提示與詳解）＋ 3 條 takeaways。
 * 圖解依各課核心概念選用 flow（演變、制度流程）、text（定義與對照）、
 * bars（人次／花費比較）、cycle（節慶循環）。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

const EL_SOC_FAMILY: OnionLesson = {
  id: "el-soc-family",
  title: "家庭與我",
  subject: "社會",
  topic: "家庭與我",
  grade: "三上",
  stages: ["國小"],
  desc: "家裡有哪些人？大家怎麼分工？洋蔥帶你認識家庭成員和家庭樹。",
  takeaways: [
    "家庭成員有祖輩、父母、子女，組成方式可能不同",
    "家人分工是為了互相幫忙、分擔家事",
    "家庭樹能清楚呈現我和長輩的親屬關係",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識家庭成員", caption: "嗨！每個人都有自己的家，今天一起認識家裡的成員和分工。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：列出家人角色", caption: "家裡常見成員有：爺爺奶奶、爸爸媽媽、我和兄弟姐妹。", action: "point", prop: { kind: "flow", steps: ["爺爺奶奶", "爸爸媽媽", "我", "兄弟姐妹"], active: 1 }, duration: 3600 },
    { id: 3, step: "步驟 3：了解家人分工", caption: "每個家人工作不同：有人賺錢、有人做家事，大家互相幫忙。", action: "think", prop: { kind: "flow", steps: ["爸爸上班賺錢", "媽媽做家事", "我整理書包", "一起做家事"], active: 2 }, duration: 3600, ask: { prompt: "家人分工最主要的原因是什麼？", options: ["為了互相幫忙、分擔工作", "因為喜歡吵架", "一個人做全部", "因為太無聊"], answer: 1, hint: "每個人做自己會的事，家裡更順利。" } },
    { id: 4, step: "步驟 4：畫出家庭樹", caption: "我們可以畫家庭樹，從『我』往上找出爸爸媽媽和祖父母。", action: "point", prop: { kind: "text", text: "家庭樹：我 → 父母 → 祖父母", sub: "從我往上推認識長輩", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：比較不同家庭", caption: "有的家只有父母和我（小家庭），也有和長輩同住的大家庭。", action: "jump", prop: { kind: "text", text: "小家庭：父母＋子女", sub: "大家庭：同住長輩親戚", tone: "ok" }, duration: 3600, ask: { prompt: "小美家只有爸爸、媽媽和她，這是哪一種家庭？", options: ["大家庭", "小家庭", "單親家庭", "隔代教養"], answer: 1, hint: "小家庭通常是父母和子女同住。" } },
    { id: 6, step: "步驟 6：感受家庭支持", caption: "家人照顧我們、陪伴長大，也給我們滿滿的安全感。", action: "walk", prop: { kind: "flow", steps: ["照顧生活", "陪伴成長", "給安全感"], active: 0 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住家庭口訣", caption: "口訣：家人有分工、家庭樹清楚、家人互相關心。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-family-1", prompt: "下列哪一組都屬於家庭成員？", options: ["爸爸、媽媽、我", "老師、同學", "店員、司機", "醫生、護士"], answer: 0, hints: ["家人是和你同住、有親屬關係的人", "爸爸媽媽和我是家人"], explanation: "爸爸、媽媽和自己是家庭的核心成員；老師、店員等是家庭以外的人。" },
    { id: "el-soc-family-2", prompt: "家人為什麼要分工？", options: ["互相幫忙、分擔工作", "因為喜歡吵架", "一個人做比較快", "其實不用分工"], answer: 0, hints: ["分工讓每人做擅長的事", "家事分著做才輕鬆"], explanation: "家人分工能互相幫忙、分擔家事，讓家庭生活更順利。" },
    { id: "el-soc-family-3", prompt: "小華家只有爸爸、媽媽和他同住，這是哪一種家庭？", options: ["大家庭", "小家庭", "單親家庭", "隔代教養家庭"], answer: 1, hints: ["小家庭是父母與子女同住", "沒有和長輩同住"], explanation: "父母和子女同住的家庭稱為小家庭。" },
    { id: "el-soc-family-4", prompt: "下列哪一項是家人對我們的照顧？", options: ["陪我們長大、準備三餐", "只叫我們寫功課", "完全不理我們", "把我們趕出去"], answer: 0, hints: ["家人會照顧生活與陪伴成長", "想想家人平常為你做的事"], explanation: "家人會照顧我們的生活、陪伴我們長大，給予支持與安全感。" },
    { id: "el-soc-family-5", prompt: "關於『家庭樹』，下列哪個說法正確？", options: ["是種在院子裡的樹", "從『我』往上可找到父母和祖父母", "只有大家庭才需要畫", "不能畫兄弟姐妹"], answer: 1, hints: ["家庭樹是表示親屬關係的圖", "從自己往上推長輩"], explanation: "家庭樹是一張表示親屬關係的圖，從『我』往上能找出父母、祖父母等長輩。" },
  ],
};

const EL_SOC_SCHOOL_RULES: OnionLesson = {
  id: "el-soc-school-rules",
  title: "校園生活與規則",
  subject: "社會",
  topic: "校園生活與規則",
  grade: "三上",
  stages: ["國小"],
  desc: "為什麼學校要有規則？遵守規則能讓大家安心學習、平安上課。",
  takeaways: [
    "校園規則是為了保護大家的安全與學習權利",
    "排隊、禮讓、保持安靜都是常見的校園規則",
    "遵守規則能讓教室和校園更和諧有序",
  ],
  frames: [
    { id: 1, step: "步驟 1：走進校園生活", caption: "嗨！每天上學真開心，你知道校園裡為什麼要有規則嗎？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：說出常見規則", caption: "校園常見規則有：排隊、禮讓、上課保持安靜等。", action: "point", prop: { kind: "text", text: "規則：排隊、禮讓、安靜", sub: "讓大家有秩序", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：規則保護安全", caption: "規則能保護我們的安全，例如不推擠、走廊靠右走。", action: "think", prop: { kind: "text", text: "規則保護：安全＋學習", sub: "不推擠才不會受傷", tone: "ok" }, duration: 3600, ask: { prompt: "為什麼下課要排隊不推擠？", options: ["排隊比較帥", "避免推擠受傷、保護安全", "老師喜歡看排隊", "排隊比較快吃飯"], answer: 1, hint: "推擠容易撞到人或跌倒。" } },
    { id: 4, step: "步驟 4：規則守護學習", caption: "上課保持安靜，大家才能專心聽課、不被打擾。", action: "point", prop: { kind: "text", text: "安靜等於專心聽課", sub: "不打擾別人學習", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：一起遵守規則", caption: "當每個人都守規則，教室和校園就會變得更和諧有序。", action: "jump", prop: { kind: "flow", steps: ["我守規則", "同學也守規則", "校園更和諧"], active: 1 }, duration: 3600, ask: { prompt: "下列哪一項是遵守校園規則的表現？", options: ["上課大聲講話", "排隊禮讓不推擠", "隨意亂丟垃圾", "在走廊奔跑"], answer: 1, hint: "守規則是尊重自己也尊重別人。" } },
    { id: 6, step: "步驟 6：規則需要商量", caption: "班級規則可以大家一起討論，變成我們共同的班規。", action: "walk", prop: { kind: "flow", steps: ["提出想法", "大家一起討論", "形成班規"], active: 2 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住規則口訣", caption: "口訣：規則保安全、安靜好學習、守規則更和諧。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-school-rules-1", prompt: "下列哪一項是常見的校園規則？", options: ["排隊禮讓", "在走廊奔跑", "上課大聲說話", "隨地丟垃圾"], answer: 0, hints: ["規則讓大家有秩序", "排隊是常見的好習慣"], explanation: "排隊、禮讓等規則能維持校園秩序，保護大家的安全。" },
    { id: "el-soc-school-rules-2", prompt: "上課為什麼要保持安靜？", options: ["老師怕吵", "讓大家能專心聽課不被打擾", "安靜比較涼快", "學校規定一定要睡覺"], answer: 1, hints: ["安靜能幫助學習", "不打擾別人也是尊重"], explanation: "上課安靜能讓自己和同學專心聽課，是尊重彼此的學習權利。" },
    { id: "el-soc-school-rules-3", prompt: "小華在走廊不小心推人，這違反了哪個觀念？", options: ["友善遊戲", "不推擠、保護安全", "大聲朗讀", "快速跑步"], answer: 1, hints: ["推擠容易讓人受傷", "規則要保護安全"], explanation: "走廊不推擠是為了保護安全，推人違反了校園安全規則。" },
    { id: "el-soc-school-rules-4", prompt: "班級規則最好是怎麼訂出來的？", options: ["老師一個人決定", "同學一起討論形成", "隨便訂就好", "不用訂規則"], answer: 1, hints: ["大家一起參與會更願意遵守", "共同討論出的規則更合理"], explanation: "班級規則由大家共同討論形成，會更公平，也更容易被遵守。" },
    { id: "el-soc-school-rules-5", prompt: "關於校園規則，下列哪個說法正確？", options: ["規則是為了處罰學生", "規則讓大家安心學習與活動", "有規則反而更亂", "只有下課才需要規則"], answer: 1, hints: ["規則保護安全與學習", "規則讓校園更有秩序"], explanation: "校園規則是為了保護大家的安全與學習權利，讓校園更和諧有序。" },
  ],
};

const EL_SOC_COMMUNITY: OnionLesson = {
  id: "el-soc-community",
  title: "社區與家鄉",
  subject: "社會",
  topic: "社區與家鄉",
  grade: "三下",
  stages: ["國小"],
  desc: "家裡附近有哪些公共設施？公園、圖書館、市場怎麼幫助生活？",
  takeaways: [
    "社區是住家附近的生活圈，有各種公共設施",
    "公園、圖書館、市場等設施方便我們的日常生活",
    "愛護公共設施、與鄰居和睦相處，社區更美好",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識我的社區", caption: "嗨！你住的地方就叫社區，今天來看看家附近有哪些好設施。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：找出公共設施", caption: "社區常見公共設施有公園、圖書館、市場、車站等。", action: "point", prop: { kind: "text", text: "公共設施：公園、圖書館、市場", sub: "大家一起使用的空間", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：公園的好處", caption: "公園可以運動、散步，還能認識鄰居、交到朋友。", action: "think", prop: { kind: "text", text: "公園：運動＋交朋友", sub: "讓身心更健康", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項是社區的公共設施？", options: ["自己家客廳", "社區公園", "私人臥室", "家裡書桌"], answer: 1, hint: "公共設施是大家都能使用的。" } },
    { id: 4, step: "步驟 4：設施使用人次", caption: "每週使用人次：公園 120 人、圖書館 80 人、市場 100 人。", action: "point", prop: { kind: "bars", items: [{ label: "公園", value: 120 }, { label: "圖書館", value: 80 }, { label: "市場", value: 100 }], unit: "人", active: 0 }, duration: 3800 },
    { id: 5, step: "步驟 5：市場與生活", caption: "市場讓我們買到新鮮蔬菜和日用品，也方便每天的生活。", action: "jump", prop: { kind: "flow", steps: ["買菜", "買日用品", "和攤販聊天"], active: 0 }, duration: 3600, ask: { prompt: "圖書館對社區有什麼幫助？", options: ["只能借錢", "借書閱讀、安靜學習", "賣水果", "停汽車"], answer: 1, hint: "圖書館是閱讀和學習的地方。" } },
    { id: 6, step: "步驟 6：愛護公共設施", caption: "公共設施是大家的，我們要愛惜、不破壞，也要和鄰居和睦。", action: "walk", prop: { kind: "flow", steps: ["不破壞", "用完歸位", "和大家分享"], active: 1 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住社區口訣", caption: "口訣：社區有設施、大家共用、愛惜更美好。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-community-1", prompt: "下列哪一項屬於社區的公共設施？", options: ["家裡的客廳", "社區公園", "私人臥室", "自己的書桌"], answer: 1, hints: ["公共設施是大家都能用的", "公園是開放的空間"], explanation: "社區公園是大家都能使用的公共設施；客廳、臥室是私人的。" },
    { id: "el-soc-community-2", prompt: "市場對我們的生活有什麼用處？", options: ["只能看熱鬧", "買到蔬菜和日用品", "借書的地方", "運動跑步"], answer: 1, hints: ["市場可以買食材和用品", "方便每天的食衣需求"], explanation: "市場讓我們買到新鮮蔬菜和日常用品，方便生活。" },
    { id: "el-soc-community-3", prompt: "根據使用人次，哪一個設施每週最多人使用？", options: ["圖書館", "市場", "公園", "一樣多"], answer: 2, hints: ["看哪個數字最大", "公園是 120 人"], explanation: "公園每週 120 人，多於圖書館 80 人與市場 100 人，所以公園最多人用。" },
    { id: "el-soc-community-4", prompt: "為什麼我們要愛惜公共設施？", options: ["反正壞了不用管", "它是大家一起用的資源", "可以隨意塗鴉", "別人會賠錢"], answer: 1, hints: ["公共設施是共享的", "愛惜才能長久使用"], explanation: "公共設施是大家共享的資源，愛惜它能讓所有人都方便使用。" },
    { id: "el-soc-community-5", prompt: "關於社區，下列哪個說法正確？", options: ["社區只有自己家", "社區是住家附近的生活圈", "公共設施只能大人用", "不用和鄰居打招呼"], answer: 1, hints: ["社區包含家與附近設施", "是生活的範圍"], explanation: "社區是住家附近的生活圈，包含住家與大家共用的公共設施。" },
  ],
};

const EL_SOC_MAP_DIRECTION: OnionLesson = {
  id: "el-soc-map-direction",
  title: "地圖與方位",
  subject: "社會",
  topic: "地圖與方位",
  grade: "四上",
  stages: ["國小"],
  desc: "地圖怎麼看？上北下南、比例尺算距離、圖例認符號，洋蔥教你讀圖。",
  takeaways: [
    "地圖方位口訣：上北、下南、左西、右東",
    "比例尺告訴我們圖上距離對應真實距離",
    "圖例說明地圖上各種符號代表什麼",
  ],
  frames: [
    { id: 1, step: "步驟 1：打開一張地圖", caption: "嗨！地圖就像土地的照片，今天學會看方位、比例尺和圖例。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：記住方位口訣", caption: "看地圖先認方向：上方是北、下方是南、左西、右東。", action: "point", prop: { kind: "text", text: "上北、下南、左西、右東", sub: "看地圖先找方向", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：用比例尺算距離", caption: "比例尺：圖上 1 公分代表真實 100 公尺，3 公分就是 300 公尺。", action: "think", prop: { kind: "flow", steps: ["圖上 1 公分", "代表真實 100 公尺", "兩地 3 公分為 300 公尺"], active: 2 }, duration: 3800, ask: { prompt: "地圖『上北下南』，右邊是哪個方向？", options: ["東", "西", "南", "北"], answer: 0, hint: "上北下南、左西右東，右邊是東。" } },
    { id: 4, step: "步驟 4：比例尺換算練習", caption: "練習：圖上量得 2 公分，乘上 100 公尺，真實距離是 200 公尺。", action: "point", prop: { kind: "flow", steps: ["量得 2 公分", "乘 100 公尺", "等於 200 公尺"], active: 2 }, duration: 3800 },
    { id: 5, step: "步驟 5：看懂圖例", caption: "圖例會說明符號：三角形是山、屋子是學校、波浪是河流等。", action: "jump", prop: { kind: "text", text: "圖例：▲山　⌂學校　≈河", sub: "符號代表真實地物", tone: "ok" }, duration: 3600, ask: { prompt: "圖上量得 4 公分，比例尺 1 公分為 50 公尺，真實多遠？", options: ["200 公尺", "54 公尺", "4 公尺", "500 公尺"], answer: 0, hint: "4 公分乘以 50 公尺。" } },
    { id: 6, step: "步驟 6：三個工具一起用", caption: "看好方位、量比例尺、查圖例，三個工具一起用就能讀懂地圖。", action: "walk", prop: { kind: "flow", steps: ["看方位", "量比例尺", "查圖例"], active: 0 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住讀圖口訣", caption: "口訣：上北下南、比例算距、圖例認符號。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-map-direction-1", prompt: "看地圖時，『上北下南』的下方是哪一個方向？", options: ["北", "南", "東", "西"], answer: 1, hints: ["上方是北", "下方就是南"], explanation: "地圖慣例：上方為北、下方為南，所以下方是南。" },
    { id: "el-soc-map-direction-2", prompt: "地圖上的圖例有什麼作用？", options: ["裝飾好看", "說明符號代表什麼地物", "計算距離", "指出北方"], answer: 1, hints: ["符號需要說明才看得懂", "圖例是地圖的字典"], explanation: "圖例說明地圖上各種符號（如▲、⌂）分別代表什麼真實地物。" },
    { id: "el-soc-map-direction-3", prompt: "比例尺 1 公分代表 100 公尺，圖上 5 公分等於真實多少？", options: ["5 公尺", "100 公尺", "500 公尺", "105 公尺"], answer: 2, hints: ["5 公分乘以 100 公尺", "把圖上長度放大"], explanation: "5 公分 × 100 公尺/公分 等於 500 公尺，是真實距離。" },
    { id: "el-soc-map-direction-4", prompt: "小文想在地圖上找學校，他應該先怎麼做？", options: ["隨便亂猜", "查圖例看學校的符號", "把地圖折起來", "問比例尺"], answer: 1, hints: ["圖例告訴你符號意義", "先認符號再找位置"], explanation: "先查圖例知道學校用什麼符號表示，才能在地圖上找到它。" },
    { id: "el-soc-map-direction-5", prompt: "關於地圖，下列哪個說法正確？", options: ["比例尺和距離無關", "方位、比例尺、圖例都要會看", "圖例只是裝飾", "地圖不用看方向"], answer: 1, hints: ["三種工具一起用才讀得懂", "方位比例圖例都重要"], explanation: "讀懂地圖要會看方位、用比例尺算距離、查圖例認符號，三者都重要。" },
  ],
};

const EL_SOC_TAIWAN_EARLY: OnionLesson = {
  id: "el-soc-taiwan-early",
  title: "臺灣早期的開發",
  subject: "社會",
  topic: "臺灣早期的開發",
  grade: "四上",
  stages: ["國小"],
  desc: "臺灣很早就有誰來開發？原住民、荷西、明鄭到清領，洋蔥說給你聽。",
  takeaways: [
    "最早住在臺灣的是原住民各族，有自己的文化",
    "荷蘭、西班牙曾短暫統治部分地區（荷西時期）",
    "明鄭和清領時期，更多漢人來臺開墾定居",
  ],
  frames: [
    { id: 1, step: "步驟 1：找到最早的主人", caption: "嗨！在很多人來之前，臺灣最早的主人其實是原住民各族。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：認識原住民", caption: "原住民很早就住在臺灣，各族有自己的語言、祭典和生活方式。", action: "point", prop: { kind: "text", text: "最早居民：原住民各族", sub: "有自己語言與文化", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：荷西時期來臨", caption: "後來荷蘭人占南部、西班牙人占北部，這段叫荷西時期。", action: "think", prop: { kind: "flow", steps: ["原住民定居", "荷蘭占南部", "西班牙占北部", "後荷蘭統一"], active: 1 }, duration: 3600, ask: { prompt: "臺灣最早的原住民，和後來的統治者有何不同？", options: ["原住民本來就住在這裡", "原住民是後來才搬來", "原住民來自歐洲", "原住民是明鄭帶來的"], answer: 0, hint: "原住民比荷西、明鄭都早。" } },
    { id: 4, step: "步驟 4：明鄭開墾", caption: "明鄭時期鄭成功來臺、趕走荷蘭，帶更多漢人來開墾農地。", action: "point", prop: { kind: "flow", steps: ["鄭成功來臺", "趕走荷蘭", "漢人拓墾農地"], active: 1 }, duration: 3600 },
    { id: 5, step: "步驟 5：清領時期發展", caption: "清領時期更多漢人移民來臺，慢慢出現街庄和城鎮。", action: "jump", prop: { kind: "flow", steps: ["清廷統治", "更多漢人移民", "城鎮慢慢出現"], active: 2 }, duration: 3600, ask: { prompt: "荷西、明鄭、清領，誰的時間最晚？", options: ["荷西", "明鄭", "清領", "原住民"], answer: 2, hint: "順序是原住民到荷西、明鄭，最後清領。" } },
    { id: 6, step: "步驟 6：開發順序整理", caption: "整理一下：原住民最早，再來荷西、明鄭，最後是清領時期。", action: "walk", prop: { kind: "flow", steps: ["原住民", "荷西", "明鄭", "清領"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住開發口訣", caption: "口訣：原住最先、荷西短暫、明鄭清領陸續開發。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-taiwan-early-1", prompt: "臺灣最早住在這裡的居民是誰？", options: ["荷蘭人", "原住民各族", "明鄭軍隊", "清領官員"], answer: 1, hints: ["比荷西明鄭都早", "原本就生活在臺灣"], explanation: "原住民各族很早就住在臺灣，是這塊土地最早的主人。" },
    { id: "el-soc-taiwan-early-2", prompt: "「荷西時期」是指哪兩個勢力？", options: ["荷蘭與西班牙", "荷蘭與英國", "西班牙與葡萄牙", "荷蘭與日本"], answer: 0, hints: ["名字裡有荷和西班", "荷蘭占南、西班牙占北"], explanation: "荷西時期指荷蘭與西班牙曾分別統治臺灣南部與北部的短暫時期。" },
    { id: "el-soc-taiwan-early-3", prompt: "明鄭時期對臺灣的開發有什麼影響？", options: ["沒有影響", "帶更多漢人來開墾農地", "趕走所有原住民", "興建高鐵"], answer: 1, hints: ["鄭成功驅荷後拓墾", "漢人農業發展起來"], explanation: "明鄭時期鄭成功驅走荷蘭，帶來更多漢人開墾農地，促進開發。" },
    { id: "el-soc-taiwan-early-4", prompt: "清領時期臺灣出現了什麼變化？", options: ["人口變少", "更多漢人移民、城鎮出現", "完全沒人住", "變成外國殖民地"], answer: 1, hints: ["移民增加才會形成街庄", "城鎮慢慢發展"], explanation: "清領時期更多漢人移民來臺，逐漸形成街庄與城鎮。" },
    { id: "el-soc-taiwan-early-5", prompt: "依開發先後排列，正確順序是？", options: ["清領到明鄭到荷西到原住民", "原住民到荷西到明鄭到清領", "荷西到原住民到清領到明鄭", "明鄭到清領到原住民到荷西"], answer: 1, hints: ["最早是原住民", "最晚是清領"], explanation: "正確順序：原住民最早，再來荷西、明鄭，最後是清領時期。" },
  ],
};

const EL_SOC_FESTIVALS: OnionLesson = {
  id: "el-soc-festivals",
  title: "臺灣的節慶習俗",
  subject: "社會",
  topic: "臺灣的節慶習俗",
  grade: "三下",
  stages: ["國小"],
  desc: "臺灣有哪些節慶？春節、端午、中秋和原住民祭典，各有什麼習俗？",
  takeaways: [
    "春節：過年團圓、發紅包、吃年菜",
    "端午：划龍舟、吃粽子；中秋：賞月、吃月餅",
    "原住民各族也有自己的祭典，展現文化特色",
  ],
  frames: [
    { id: 1, step: "步驟 1：一年中的節慶", caption: "嗨！一年裡有好多節慶，今天認識春節、端午、中秋和祭典。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：歡喜過春節", caption: "春節是農曆新年，全家團圓吃年菜、長輩發紅包給小孩。", action: "point", prop: { kind: "text", text: "春節：團圓、紅包、年菜", sub: "農曆新年全家聚", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：熱鬧的端午", caption: "端午節划龍舟、吃粽子，是紀念屈原的傳統節日。", action: "think", prop: { kind: "text", text: "端午：龍舟、粽子", sub: "紀念屈原的節日", tone: "ok" }, duration: 3600, ask: { prompt: "春節時，長輩常會做什麼？", options: ["發紅包給小孩", "劃龍舟", "吃月餅", "舉辦祭典"], answer: 0, hint: "過年長輩會包紅包。" } },
    { id: 4, step: "步驟 4：溫馨的中秋", caption: "中秋節晚上賞月、吃月餅和柚子，也是一家人團圓的日子。", action: "point", prop: { kind: "text", text: "中秋：賞月、月餅", sub: "秋天團圓的節日", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：原住民祭典", caption: "原住民各族有豐年祭等祭典，穿傳統服飾、唱歌跳舞慶祝。", action: "jump", prop: { kind: "text", text: "原住民祭典：豐年祭等", sub: "展現各族文化", tone: "ok" }, duration: 3600, ask: { prompt: "端午節常見的活動是什麼？", options: ["賞月", "划龍舟、吃粽子", "發紅包", "吃月餅"], answer: 1, hint: "端午和龍舟、粽子有關。" } },
    { id: 6, step: "步驟 6：節慶循環表", caption: "這些節慶隨著四季輪流出現，就像一個不斷循環的習俗圈。", action: "walk", prop: { kind: "cycle", nodes: ["春節", "端午", "中秋", "原住民祭典"], active: 0 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住節慶口訣", caption: "口訣：春團圓、端午舟、中秋月、祭典展文化。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-festivals-1", prompt: "春節時全家通常會做什麼？", options: ["划龍舟", "團圓吃年菜、發紅包", "賞月吃月餅", "舉辦豐年祭"], answer: 1, hints: ["春節是農曆新年", "長輩會發紅包"], explanation: "春節是農曆新年，全家團圓吃年菜，長輩發紅包給小孩。" },
    { id: "el-soc-festivals-2", prompt: "端午節的傳統活動不包括下列哪一項？", options: ["划龍舟", "吃粽子", "賞月", "紀念屈原"], answer: 2, hints: ["賞月是中秋的活動", "端午和龍舟粽子有關"], explanation: "賞月是中秋節的活動；端午節是划龍舟、吃粽子、紀念屈原。" },
    { id: "el-soc-festivals-3", prompt: "中秋節常會做什麼？", options: ["發紅包", "賞月、吃月餅和柚子", "划龍舟", "穿傳統服飾祭典"], answer: 1, hints: ["中秋在秋天", "和月亮有關"], explanation: "中秋節有賞月、吃月餅和柚子的習俗，也是團圓的日子。" },
    { id: "el-soc-festivals-4", prompt: "原住民各族的祭典，展現了什麼？", options: ["外國文化", "各族自己的文化特色", "只有一種統一慶祝", "和漢人一樣的節日"], answer: 1, hints: ["各族有不同祭典", "豐年祭是代表"], explanation: "原住民各族有豐年祭等祭典，穿傳統服飾、歌舞，展現自己的文化特色。" },
    { id: "el-soc-festivals-5", prompt: "下列哪個說法正確？", options: ["臺灣只有春節一個節慶", "節慶隨四季輪流出現，各具習俗", "祭典都不重要", "中秋和龍舟有關"], answer: 1, hints: ["節慶在不同季節", "各有不同習俗"], explanation: "臺灣節慶隨四季輪流出現，春節、端午、中秋與原住民祭典各有習俗。" },
  ],
};

const EL_SOC_GOVERNMENT: OnionLesson = {
  id: "el-soc-government",
  title: "政府的角色與選舉",
  subject: "社會",
  topic: "政府的角色與選舉",
  grade: "六上",
  stages: ["國小"],
  desc: "政府在做什麼？修橋鋪路、辦學校、保護我們，人民也能投票選代表。",
  takeaways: [
    "政府提供公共服務：教育、交通、治安、醫療等",
    "政府的錢來自稅收，用來照顧全體社會",
    "人民依法投票，選出替我們做事的代言人",
  ],
  frames: [
    { id: 1, step: "步驟 1：政府在哪裡", caption: "嗨！警察、學校、公園都和政府有關，今天看政府在做什麼。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：政府提供服務", caption: "政府辦學校、修橋鋪路、維持治安、提供醫療等公共服務。", action: "point", prop: { kind: "flow", steps: ["辦學校", "修橋鋪路", "維持治安", "公共醫療"], active: 0 }, duration: 3600 },
    { id: 3, step: "步驟 3：錢從哪裡來", caption: "政府的錢來自大家繳的稅，再拿來照顧全體社會的需要。", action: "think", prop: { kind: "flow", steps: ["大家繳稅", "政府收稅", "用在公共服務"], active: 2 }, duration: 3600, ask: { prompt: "政府辦學校、修路，錢主要來自哪裡？", options: ["向別國借的", "人民繳的稅", "自己印鈔票", "不花錢"], answer: 1, hint: "稅收是政府的主要財源。" } },
    { id: 4, step: "步驟 4：政府保護我們", caption: "政府也保護我們的安全與福利，例如救災、照顧弱勢。", action: "point", prop: { kind: "text", text: "政府保護：安全加福利", sub: "守護每個人", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：人民投票選代表", caption: "滿齡公民可以投票，選出替我們發聲、做事的代表。", action: "jump", prop: { kind: "flow", steps: ["登記成選民", "了解候選人", "出門投票", "選出代表"], active: 2 }, duration: 3600, ask: { prompt: "人民投票最主要的目的？", options: ["選出替自己發聲的代表", "決定明天天氣", "選誰當同學", "不用目的隨便投"], answer: 0, hint: "投票是選出為我們做事的人。" } },
    { id: 6, step: "步驟 6：權利與義務", caption: "我們享有政府服務，也要納稅、參與投票，這是權利也是義務。", action: "walk", prop: { kind: "flow", steps: ["享有公共服務", "履行納稅義務", "參與投票"], active: 1 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住政府口訣", caption: "口訣：政府服務、稅收支應、人民投票選代表。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-government-1", prompt: "下列哪一項是政府的公共服務？", options: ["修橋鋪路", "自己煮飯", "和朋友聊天", "在家看電視"], answer: 0, hints: ["政府做大家共用的事", "交通建設是政府職責"], explanation: "修橋鋪路、辦學校、維持治安等公共服務由政府提供。" },
    { id: "el-soc-government-2", prompt: "政府的經費主要來自哪裡？", options: ["人民繳的稅", "向月亮借", "自己印鈔票", "不用花錢"], answer: 0, hints: ["稅收是主要財源", "大家共同分擔"], explanation: "政府經費主要來自人民繳納的稅，再用於公共服務。" },
    { id: "el-soc-government-3", prompt: "人民參與投票，最主要可以做到什麼？", options: ["決定天氣", "選出替自己發聲的代表", "選出明天午餐", "讓學校放假"], answer: 1, hints: ["投票選出代表", "代表為我們做事"], explanation: "人民投票能選出替我們發聲、為社會做事的代表。" },
    { id: "el-soc-government-4", prompt: "關於政府的角色，下列何者正確？", options: ["政府只管罰錢", "政府提供服務也保護人民", "政府不用管治安", "稅收和自己無關"], answer: 1, hints: ["政府照顧全體", "安全福利都包含"], explanation: "政府提供教育、交通、治安、醫療等服務，也保護人民安全與福利。" },
    { id: "el-soc-government-5", prompt: "享有政府服務的同時，我們也應該？", options: ["什麼都不用做", "納稅並參與投票", "只要求不付出", "拒絕所有規則"], answer: 1, hints: ["權利義務是一體的", "繳稅投票是公民責任"], explanation: "我們享有公共服務，也應履行納稅、參與投票等公民責任，權利義務並重。" },
  ],
};

const EL_SOC_CONSUMPTION: OnionLesson = {
  id: "el-soc-consumption",
  title: "消費與理財",
  subject: "社會",
  topic: "消費與理財",
  grade: "六下",
  stages: ["國小"],
  desc: "買東西前先想：這是需要還是想要？記帳和儲蓄讓錢用得更聰明。",
  takeaways: [
    "需要是維持生活必需的；想要是喜歡但不一定必要",
    "記帳能清楚看見錢花到哪裡，幫助控制支出",
    "把錢存起來（儲蓄），可以應付未來的需要",
  ],
  frames: [
    { id: 1, step: "步驟 1：走進消費世界", caption: "嗨！每天我們都在買東西，先學會分清楚需要與想要。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：分辨需要與想要", caption: "需要是生活必需，如食物衣服；想要是喜歡但不一定必要。", action: "point", prop: { kind: "text", text: "需要：食物、衣服", sub: "想要：玩具、最新手機", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：記帳看花費", caption: "記帳就是把收入和每筆支出寫下來，月底就知道錢去哪了。", action: "think", prop: { kind: "flow", steps: ["寫下收入", "記每筆支出", "月底看總結"], active: 2 }, duration: 3600, ask: { prompt: "下面哪一個比較像『需要』？", options: ["最新的玩具", "限量球鞋", "每天吃的飯", "昂貴的手機"], answer: 2, hint: "需要是維持生活必需的。" } },
    { id: 4, step: "步驟 4：一週花費比較", caption: "一週花費：需要 300 元、想要 200 元，需要比想要多。", action: "point", prop: { kind: "bars", items: [{ label: "需要", value: 300 }, { label: "想要", value: 200 }], unit: "元", active: 0 }, duration: 3800 },
    { id: 5, step: "步驟 5：養成儲蓄習慣", caption: "把一部分錢存起來叫儲蓄，可以應付將來更大的需要。", action: "jump", prop: { kind: "text", text: "儲蓄：把錢存起來", sub: "留給未來的需要", tone: "ok" }, duration: 3600, ask: { prompt: "記帳最主要的好處是什麼？", options: ["錢變多魔法", "清楚錢花到哪裡", "不用再花錢", "可以不用工作"], answer: 1, hint: "記帳幫你看清支出。" } },
    { id: 6, step: "步驟 6：聰明消費三步", caption: "聰明消費三步：先想需要或想要、記帳看支出、再把錢存起來。", action: "walk", prop: { kind: "flow", steps: ["想需要或想要", "先記帳", "再儲蓄"], active: 1 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住理財口訣", caption: "口訣：需要優先、記帳看清、儲蓄備未來。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-consumption-1", prompt: "下列哪一項屬於『需要』？", options: ["最新遊戲機", "每天要吃的三餐", "昂貴球鞋", "限量的模型"], answer: 1, hints: ["需要是生活必需", "吃飯維持生命"], explanation: "三餐是維持生活必需的『需要』；遊戲機、球鞋多是『想要』。" },
    { id: "el-soc-consumption-2", prompt: "『想要』和『需要』最大的差別是？", options: ["價格都一樣", "需要是必要、想要是喜歡但不必要", "想要更便宜", "兩者完全相同"], answer: 1, hints: ["需要不能少", "想要可以省下"], explanation: "需要是生活必要，想要是喜歡但不一定必要，這是兩者最大差別。" },
    { id: "el-soc-consumption-3", prompt: "小美一週需要花 300 元、想要花 200 元，哪個多？", options: ["想要比較多", "需要比較多", "一樣多", "都沒花"], answer: 1, hints: ["比較 300 和 200", "需要是 300 元"], explanation: "需要 300 元多於想要 200 元，所以需要的花費比較多。" },
    { id: "el-soc-consumption-4", prompt: "為什麼要養成記帳的習慣？", options: ["錢會自己變多", "清楚支出、幫助控制花費", "記帳能免費拿東西", "不用再賺錢"], answer: 1, hints: ["記帳看見錢去哪", "才能控制預算"], explanation: "記帳能清楚看見每筆支出，幫助我們控制花費、避免亂買。" },
    { id: "el-soc-consumption-5", prompt: "關於儲蓄，下列哪個說法正確？", options: ["儲蓄是把手錢花光", "把錢存起來以備未來需要", "儲蓄只對大人有用", "有錢才需要儲蓄"], answer: 1, hints: ["儲蓄是累積備用", "未來有大需要時可用"], explanation: "儲蓄是把一部分錢存起來，累積起來以備未來較大的需要。" },
  ],
};

const EL_SOC_GLOBAL: OnionLesson = {
  id: "el-soc-global",
  title: "世界大不同與國際交流",
  subject: "社會",
  topic: "世界大不同與國際交流",
  grade: "六下",
  stages: ["國小"],
  desc: "世界各國文化不同：語言、食物、服飾都不一樣，互相尊重就能好好交流。",
  takeaways: [
    "各國文化不同：語言、食物、服飾、節慶各有特色",
    "面對差異要尊重與包容，不嘲笑、不歧視",
    "國際組織和交流讓各國合作、互相幫助",
  ],
  frames: [
    { id: 1, step: "步驟 1：打開世界地圖", caption: "嗨！世界很大，各國文化都不一樣，今天學著尊重與交流。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：看見文化差異", caption: "不同國家有不同語言、食物和服飾，這就是文化差異。", action: "point", prop: { kind: "text", text: "差異：語言、食物、服飾", sub: "各國都有自己的特色", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：尊重與包容", caption: "遇到不同的文化，我們要尊重包容，不嘲笑也不歧視。", action: "think", prop: { kind: "text", text: "尊重：不嘲笑、不歧視", sub: "包容讓世界更友善", tone: "ok" }, duration: 3600, ask: { prompt: "看到別國不同的習俗，最好怎麼做？", options: ["嘲笑它", "尊重包容、不歧視", "要求對方改掉", "完全不理會"], answer: 1, hint: "尊重差異能友好相處。" } },
    { id: 4, step: "步驟 4：節慶也各異", caption: "各國的節慶也不一樣，像嘉年華、潑水節，都是寶貴文化。", action: "point", prop: { kind: "text", text: "各國節慶不同", sub: "都是珍貴的文化", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：國際組織合作", caption: "各國透過國際組織合作，一起訂規則、解決全球問題。", action: "jump", prop: { kind: "flow", steps: ["各國加入組織", "一起訂規則", "合作解決問題"], active: 2 }, duration: 3600, ask: { prompt: "國際組織的主要功能是什麼？", options: ["只辦運動比賽", "讓各國合作解決問題", "統一全世界語言", "沒有任何作用"], answer: 1, hint: "各國一起合作才辦得到。" } },
    { id: 6, step: "步驟 6：交流帶來友誼", caption: "國際交流讓我們認識不同文化、互相學習，也交到外國朋友。", action: "walk", prop: { kind: "flow", steps: ["認識不同文化", "互相學習", "成為朋友"], active: 1 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住交流口訣", caption: "口訣：文化有差異、尊重能包容、交流交朋友。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-global-1", prompt: "下列何者屬於『文化差異』的例子？", options: ["各國有不同的語言和服飾", "大家都吃同一種食物", "全世界只說一種話", "衣服都長一樣"], answer: 0, hints: ["差異是不同的地方", "語言服飾各國不同"], explanation: "不同國家有各自的語言、食物、服飾，這就是文化差異。" },
    { id: "el-soc-global-2", prompt: "面對和自己不同的文化，應該怎麼做？", options: ["嘲笑對方", "尊重包容、不歧視", "強迫對方改變", "完全不來往"], answer: 1, hints: ["尊重才能友好", "包容讓世界友善"], explanation: "面對文化差異，應尊重包容、不嘲笑也不歧視，才能友好相處。" },
    { id: "el-soc-global-3", prompt: "為什麼國際組織對各國有幫助？", options: ["只辦比賽", "讓各國合作解決共同問題", "統一所有人的想法", "沒有任何用處"], answer: 1, hints: ["問題常跨國界", "合作力量大"], explanation: "國際組織讓各國合作，一起訂規則、解決環境、防疫等跨國問題。" },
    { id: "el-soc-global-4", prompt: "下列哪一個是國際交流的好處？", options: ["讓大家更孤立", "認識不同文化、交到朋友", "消滅所有差異", "只能和本國人說話"], answer: 1, hints: ["交流是互相認識", "學習對方文化"], explanation: "國際交流能讓我們認識不同文化、互相學習，也交到外國朋友。" },
    { id: "el-soc-global-5", prompt: "關於文化差異，下列哪個說法正確？", options: ["差異代表誰比較好", "差異值得尊重、不須分高下", "不同的都該被笑", "只有本國文化好"], answer: 1, hints: ["每種文化都珍貴", "尊重不比較高下"], explanation: "文化差異沒有高下之分，每種文化都值得尊重，不應嘲笑或歧視。" },
  ],
};

const EL_SOC_TRANSPORT: OnionLesson = {
  id: "el-soc-transport",
  title: "交通與通訊的演變",
  subject: "社會",
  topic: "交通與通訊的演變",
  grade: "四下",
  stages: ["國小"],
  desc: "交通和通訊怎麼進步？從走路、火車到高鐵，從書信到手機網路，洋蔥帶你看。",
  takeaways: [
    "交通工具從步行、牛車到火車、汽車、高鐵，越來越快",
    "通訊從書信、電報到電話、網路，越來越即時",
    "進步讓人與人聯繫更方便，生活圈也變大了",
  ],
  frames: [
    { id: 1, step: "步驟 1：回到從前", caption: "嗨！以前的人怎麼移動和聯絡？今天看交通通訊的演變。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：交通的演變", caption: "交通工具從步行、牛車，進步到火車、汽車，現在還有高鐵。", action: "point", prop: { kind: "flow", steps: ["步行", "牛車", "火車", "汽車高鐵"], active: 3 }, duration: 3600 },
    { id: 3, step: "步驟 3：速度越來越快", caption: "演變讓速度越來越快：步行慢、火車快、高鐵又快更多。", action: "think", prop: { kind: "flow", steps: ["步行最慢", "火車變快", "高鐵最快"], active: 2 }, duration: 3600, ask: { prompt: "下列交通工具，哪個速度通常最快？", options: ["步行", "牛車", "高鐵", "腳踏車"], answer: 2, hint: "高鐵是目前最快的大眾運輸。" } },
    { id: 4, step: "步驟 4：通訊的演變", caption: "通訊從書信、電報，到電話，現在用手機和網路即時聯絡。", action: "point", prop: { kind: "flow", steps: ["書信", "電報", "電話", "網路手機"], active: 3 }, duration: 3600 },
    { id: 5, step: "步驟 5：聯絡越來越即時", caption: "從書信要等好幾天，到網路訊息秒到，聯絡變得很即時。", action: "jump", prop: { kind: "flow", steps: ["書信要等", "電報較快", "網路秒到"], active: 2 }, duration: 3600, ask: { prompt: "從書信進步到網路，通訊變得怎樣？", options: ["更慢更麻煩", "更即時、更方便", "完全沒差", "只能寫字"], answer: 1, hint: "網路訊息立刻送達。" } },
    { id: 6, step: "步驟 6：生活圈變大了", caption: "交通快、通訊即時，讓我們的生活圈變大，聯繫更方便。", action: "walk", prop: { kind: "flow", steps: ["移動快", "聯絡易", "生活圈擴大"], active: 2 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住演變口訣", caption: "口訣：步行到高鐵、書信到網路、進步更方便。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-soc-transport-1", prompt: "下列交通工具，哪一個出現得最晚？", options: ["步行", "牛車", "高鐵", "火車"], answer: 2, hints: ["高鐵是現代科技", "比火車更新"], explanation: "高鐵是現代才出現的高速鐵路，比步行、牛車、火車都晚。" },
    { id: "el-soc-transport-2", prompt: "通訊從書信進步到網路，最大的改變是？", options: ["變得更慢", "更即時、更方便", "要等更久", "只能寄信"], answer: 1, hints: ["網路訊息立刻到", "不用再等郵差"], explanation: "網路讓訊息即時送達，比書信等好幾天更即時方便。" },
    { id: "el-soc-transport-3", prompt: "交通進步對我們有什麼影響？", options: ["生活圈變小", "移動更快、生活圈變大", "只能待在家", "都不出門"], answer: 1, hints: ["速度快才能去遠處", "聯繫也變容易"], explanation: "交通越來越快，讓我們能去更遠的地方，生活圈因此變大。" },
    { id: "el-soc-transport-4", prompt: "下列哪一項屬於『早期』的通訊方式？", options: ["即時視訊", "手機網路", "書信郵寄", "社群軟體"], answer: 2, hints: ["書信要寄送等待", "是古老的方式"], explanation: "書信郵寄是早期的通訊方式；視訊、網路、社群是現代的。" },
    { id: "el-soc-transport-5", prompt: "關於交通與通訊演變，下列哪個說法正確？", options: ["兩者都越來越慢", "進步讓人與人聯繫更方便", "高鐵比步行慢", "書信比網路即時"], answer: 1, hints: ["進步是為了便利", "速度和即時都提升"], explanation: "交通與通訊不斷進步，使人們移動更快、聯絡更即時方便。" },
  ],
};

export default [
  EL_SOC_FAMILY,
  EL_SOC_SCHOOL_RULES,
  EL_SOC_COMMUNITY,
  EL_SOC_MAP_DIRECTION,
  EL_SOC_TAIWAN_EARLY,
  EL_SOC_FESTIVALS,
  EL_SOC_GOVERNMENT,
  EL_SOC_CONSUMPTION,
  EL_SOC_GLOBAL,
  EL_SOC_TRANSPORT,
];
