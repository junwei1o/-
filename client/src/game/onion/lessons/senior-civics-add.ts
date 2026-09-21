/**
 * 高中公民 5 堂（senior-civics-add.ts）
 *
 * 課程表來自 docs/onion-200-plan.md →「三、高中新增 65 堂」→「公民 5 堂」（id: sh-civ-*）。
 * 每堂課 7 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 2 幀有 ask）
 * ＋ 5 題闖關（含 2 級提示與詳解）＋ 3 條 takeaways。
 *
 * 圖解依各課核心概念選用 flow（制度流程、救濟途徑、假訊息手法）、
 * balance（供需均衡、權利與義務）、text（定義與對照）、bars（價格與數量）。
 * 敘述保持中立、以臺灣課綱的憲政與法律事實為準，不涉黨派或主權立場。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 1. 高一 — 民主政治與憲政 ===================== */
const SH_CIV_DEMOCRACY: OnionLesson = {
  id: "sh-civ-democracy",
  title: "民主政治與憲政：主權在民、權力分立",
  subject: "公民",
  topic: "民主政治與憲政",
  grade: "高一",
  stages: ["高中"],
  desc: "從一張選票出發，看民主如何靠主權在民、五權分立與相互制衡來運作。",
  takeaways: [
    "民主的核心是主權在民：政府權力來自人民的同意",
    "權力分立為行政、立法、司法、考試、監察，避免權力過度集中",
    "制衡機制（覆議、釋憲、不信任案）讓各機關互相監督",
  ],
  frames: [
    { step: "步驟 1：從一張選票開始", id: 1, caption: "嗨！你投下的那一票，就是在決定誰來幫我們管理這個國家，這就是民主的起點。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識主權在民", id: 2, caption: "民主最根本的想法是「主權在民」：國家的權力來自人民，政府要得到人民同意才能統治。", action: "point", prop: { kind: "text", text: "主權在民：權力來自人民", sub: "政府由人民同意產生", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：看五權分立", id: 3, caption: "為避免權力太大，國家把權力分成五個：行政、立法、司法、考試、監察，各自負責不同工作。", action: "think", prop: { kind: "flow", steps: ["行政（執行）", "立法（立法）", "司法（審判）", "考試（用人）", "監察（監督）"], active: 0 }, duration: 3800, ask: { prompt: "臺灣的中央政府依憲法分成幾個不同的機關？", options: ["三個", "四個", "五個", "七個"], answer: 2, hint: "回想憲法的五權分立：行政、立法、司法、考試、監察。" } },
    { step: "步驟 4：認識制衡機制", id: 4, caption: "各機關不是各行其是，而會互相制衡：行政院可提覆議、立法院可提不信任案、司法院可解釋憲法。", action: "jump", prop: { kind: "flow", steps: ["行政院提覆議", "立法院可倒閣", "監察院糾彈", "司法院釋憲"], active: 0 }, duration: 3800 },
    { step: "步驟 5：人民的權利與義務", id: 5, caption: "民主之下人民既有權利也有義務：享有言論、參政等自由，也要守法、納稅、接受教育。", action: "walk", prop: { kind: "balance", left: "權利：自由、參政", right: "義務：納稅、守法", tip: "權利義務並重" }, duration: 3800 },
    { step: "步驟 6：分辨機關功能", id: 6, caption: "容易搞混的是：考試院負責公務人員的考試與任用，監察院則糾舉違法失職的官員。", action: "point", prop: { kind: "text", text: "考試院：任用公務人員", sub: "監察院：糾舉違法失職", tone: "ok" }, duration: 3800, ask: { prompt: "負責糾舉官員違法失職的是哪一個機關？", options: ["行政院", "考試院", "監察院", "司法院"], answer: 2, hint: "監察院的功能是監督與糾彈。" } },
    { step: "步驟 7：記民主口訣", id: 7, caption: "口訣：主權在民、五權分立、互相制衡、權利義務並重。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-civ-democracy-1", prompt: "民主政治最根本的原則是下列哪一個？", options: ["主權在民", "少數以武力強迫多數", "由軍隊統治", "由財富決定一切"], answer: 0, hints: ["國家權力從哪裡來？", "政府要得到人民同意"], explanation: "民主的核心是主權在民：國家的權力來自人民，政府由人民同意產生。" },
    { id: "sh-civ-democracy-2", prompt: "依憲法，中央政府權力分成哪五個機關？", options: ["行政、立法、司法、考試、監察", "行政、立法、司法", "國防、外交、財政、教育、內政", "黨、政、軍、警、法"], answer: 0, hints: ["是五權憲法的設計", "包含考試與監察"], explanation: "五權分立為行政、立法、司法、考試、監察，各自負責不同職能。" },
    { id: "sh-civ-democracy-3", prompt: "立法院對行政院院長可提出什麼來表達不信任？", options: ["不信任案（倒閣）", "彈劾總統", "修改憲法", "解散立法院"], answer: 0, hints: ["這是立法權對行政權的制衡", "又稱「倒閣」"], explanation: "立法院可對行政院院長提出不信任案（倒閣），是立法權制衡行政權的機制。" },
    { id: "sh-civ-democracy-4", prompt: "關於人民的權利與義務，下列說法何者正確？", options: ["只有權利沒有義務", "只有義務沒有權利", "權利義務並重、行使不侵犯他人", "權利可無限行使"], answer: 2, hints: ["民主強調兩者平衡", "自由有其界線"], explanation: "民主之下人民既享有權利也負有義務，行使權利時不得侵犯他人。" },
    { id: "sh-civ-democracy-5", prompt: "下列哪一項是監察院的主要職責？", options: ["舉辦公務人員考試", "糾舉違法失職的官員", "審判刑事案件", "制定法律"], answer: 1, hints: ["和「監督」有關", "考試院才負責考試任用"], explanation: "監察院負責監督與糾彈違法失職的官員；舉辦公務人員考試是考試院的職責。" },
  ],
};

/* ===================== 2. 高一 — 經濟學基礎 ===================== */
const SH_CIV_ECONOMICS: OnionLesson = {
  id: "sh-civ-economics",
  title: "經濟學基礎：機會成本、供需與市場",
  subject: "公民",
  topic: "經濟學基礎",
  grade: "高一",
  stages: ["高中"],
  desc: "從機會成本到供需均衡，看價格如何調節市場，以及失靈時政府怎麼介入。",
  takeaways: [
    "機會成本是做選擇時放棄的那個「最佳替代方案」",
    "價格上升會使供給量增加、需求量减少；供需相交形成均衡",
    "市場失靈（外部性、公共財、資訊不對稱）時，政府可用課稅、補貼、管制介入",
  ],
  frames: [
    { step: "步驟 1：一個選擇的代價", id: 1, caption: "嗨！週末你想看電影還是去打工？選了其中一個，就放棄了另一個，這正是經濟學在想的問題。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：定義機會成本", id: 2, caption: "機會成本是「做一個選擇時，所放棄的那個最好的替代方案」，而不是你付出去的那筆錢。", action: "point", prop: { kind: "text", text: "機會成本＝放棄的最佳替代", sub: "不是花掉的錢，而是捨去的選擇", tone: "ok" }, duration: 3800, ask: { prompt: "什麼是「機會成本」？", options: ["買東西花的錢", "做選擇時放棄的最佳替代方案", "所有的成本加總", "時間的總長度"], answer: 1, hint: "想想你為了選 A 而捨棄的那個最好的 B。" } },
    { step: "步驟 3：價格影響供需", id: 3, caption: "價格會影響數量：同樣的商品，價格低時大家想買 100 個、價格高時只想要 50 個。", action: "think", prop: { kind: "bars", items: [{ label: "低價需求量", value: 100 }, { label: "高價需求量", value: 50 }], unit: "個", active: 1 }, duration: 3800 },
    { step: "步驟 4：供需達到均衡", id: 4, caption: "當價格讓想賣的數量等於想買的數量，市場就達到均衡：供給量 ＝ 需求量，都是 100 個。", action: "jump", prop: { kind: "balance", left: "供給量 100", right: "需求量 100", tip: "均衡時 供給量＝需求量" }, duration: 3800 },
    { step: "步驟 5：看市場失靈", id: 5, caption: "有時市場會失靈：工廠污染影響鄰居（外部性）、路燈大家共用（公共財）、買方比賣方懂商品（資訊不對稱）。", action: "walk", prop: { kind: "flow", steps: ["外部性（影響第三人）", "公共財（大家共用）", "資訊不對稱（買賣資訊不等）"], active: 0 }, duration: 3800, ask: { prompt: "工廠排煙影響鄰居健康，這屬於哪一種市場失靈？", options: ["公共財", "外部性", "資訊不對稱", "供需均衡"], answer: 1, hint: "這是生產活動對「第三人」造成的影響。" } },
    { step: "步驟 6：政府怎麼介入", id: 6, caption: "遇到失靈，政府可課稅抑制污染、用補貼鼓勵好行為，或直接訂定規則來管制。", action: "point", prop: { kind: "flow", steps: ["課稅（抑制負外部性）", "補貼（鼓勵好行為）", "管制（訂規則）"], active: 0 }, duration: 3800 },
    { step: "步驟 7：記經濟口訣", id: 7, caption: "口訣：機會成本看放棄、價格調供需、失靈靠政府。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-civ-economics-1", prompt: "「機會成本」指的是什麼？", options: ["購買商品所付的價錢", "做選擇時放棄的最佳替代方案", "一整天的時間成本", "店面的租金"], answer: 1, hints: ["是「捨去」的那個選擇", "不是花掉的錢"], explanation: "機會成本是做一個選擇時所放棄的最佳替代方案。" },
    { id: "sh-civ-economics-2", prompt: "當商品價格上升時，通常會發生什麼？", options: ["供給量增加、需求量减少", "供給量减少、需求量增加", "供需都增加", "供需都減少"], answer: 0, hints: ["賣方願意多賣", "買方想少買"], explanation: "價格上升，供給者願意多供給、需求者想少買，故供給量增加、需求量减少。" },
    { id: "sh-civ-economics-3", prompt: "市場「均衡價格」成立的條件是？", options: ["供給量大於需求量", "需求量等於供給量", "完全沒有交易", "由政府統一定價"], answer: 1, hints: ["買賣雙方數量一致", "供給量＝需求量"], explanation: "均衡發生在供給量等於需求量時，此時市場既無剩餘也無短缺。" },
    { id: "sh-civ-economics-4", prompt: "為減少工廠污染這種負外部性，政府較可能採取哪一種做法？", options: ["給工廠補貼", "對污染課稅", "完全不管", "禁止所有生產"], answer: 1, hints: ["用稅讓污染變貴", "課稅可抑制負外部性"], explanation: "對負外部性課稅，使污染者承擔成本、減少污染，是政府常見的介入方式。" },
    { id: "sh-civ-economics-5", prompt: "下列哪一項比較符合「公共財」的特性？", options: ["你買的早餐（用了別人不能用）", "路燈（一人使用不減少他人使用）", "限量球鞋", "私人的手機"], answer: 1, hints: ["公共財是大家共用、不排他", "想想夜晚的路燈"], explanation: "公共財具有非排他、非競爭的特性，如路燈：一人使用不減少他人使用的可能。" },
  ],
};

/* ===================== 3. 高二 — 法律與生活 ===================== */
const SH_CIV_LAW: OnionLesson = {
  id: "sh-civ-law",
  title: "法律與生活：民法、刑法與救濟",
  subject: "公民",
  topic: "法律與生活",
  grade: "高二",
  stages: ["高中"],
  desc: "民法管私人權利義務、刑法管犯罪與刑罰，權利受損還有不同的救濟途徑。",
  takeaways: [
    "民法處理私人間權利義務（契約、侵權、繼承）",
    "刑法採罪刑法定：無法律明文者不罰，並區分故意與過失",
    "權利受損可走調解、訴訟或行政救濟等途徑",
  ],
  frames: [
    { step: "步驟 1：生活處處有法律", id: 1, caption: "嗨！買東西、租房子、被人撞傷，這些日常小事背後，其實都有法律在管。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識民法", id: 2, caption: "民法管私人之間的事：簽約要履約、傷害別人要賠償、過世後財產依繼承規定分配。", action: "point", prop: { kind: "text", text: "民法：私人間的權利義務", sub: "契約、侵權、繼承", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：認識刑法", id: 3, caption: "刑法管的是犯罪與刑罰。原則是「罪刑法定」：法律沒明文規定為犯罪，就不能處罰；還要分故意和過失。", action: "think", prop: { kind: "text", text: "刑法：犯罪與刑罰", sub: "罪刑法定、故意與過失", tone: "warn" }, duration: 3800 },
    { step: "步驟 4：故意與過失", id: 4, caption: "同樣撞傷人，故意是「明知會發生還去做」，過失是「該小心卻沒小心」，兩者都要負責但輕重不同。", action: "jump", prop: { kind: "flow", steps: ["故意：明知且想發生", "過失：應注意而未注意", "後果都須負責"], active: 0 }, duration: 3800, ask: { prompt: "刑法「罪刑法定」原則的意思是？", options: ["法官可隨意定罪", "法律無明文規定者不罰", "只要有害就罰", "罪刑由受害者決定"], answer: 1, hint: "關鍵在「法定」：要有法律依據才能罰。" } },
    { step: "步驟 5：救濟途徑", id: 5, caption: "權利被侵犯時，可以先調解、談不攏就向法院起訴；對政府處分不服則走行政救濟。", action: "walk", prop: { kind: "flow", steps: ["調解：雙方協商", "訴訟：向法院起訴", "行政救濟：對政府處分不服"], active: 0 }, duration: 3800, ask: { prompt: "對政府的處分不服，一般可走下列哪種救濟途徑？", options: ["民事調解", "行政救濟", "刑事訴訟", "完全不能救濟"], answer: 1, hint: "對象是「政府處分」，所以走行政類的救濟。" } },
    { step: "步驟 6：青少年相關法律", id: 6, caption: "未成年的問題另有「少年事件處理法」：處理時以保護、教育為原則，而非一律處罰。", action: "point", prop: { kind: "text", text: "少年事件：以保護教育為主", sub: "少年事件處理法", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：記法律口訣", id: 7, caption: "口訣：民法管私人、刑法管犯罪、權利受損有救濟。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-civ-law-1", prompt: "下列哪一項主要屬於「民法」處理的範圍？", options: ["簽訂買賣契約", "竊盜定罪", "殺人刑責", "叛亂罪"], answer: 0, hints: ["民法管私人間權利義務", "契約是私人之間的事"], explanation: "民法處理私人間的權利義務，如契約、侵權與繼承；竊盜、殺人屬刑法。" },
    { id: "sh-civ-law-2", prompt: "刑法「罪刑法定」原則，下列說法何者正確？", options: ["法律沒規定也能罰", "無法律明文規定為犯罪者，不罰", "法官可自行創設罪名", "罪與刑由被害人決定"], answer: 1, hints: ["重點在「法定」", "要有法律依據"], explanation: "罪刑法定主義：行為必須有法律明文規定為犯罪，才能加以處罰。" },
    { id: "sh-civ-law-3", prompt: "駕車時因看手機而撞傷人，這比較接近下列哪一種？", options: ["故意", "過失", "不算侵權", "正當防衛"], answer: 1, hints: ["是「該注意卻沒注意」", "不是明知會發生還去做"], explanation: "看手機分心是應注意能注意而未注意，屬過失；仍須負責但與故意不同。" },
    { id: "sh-civ-law-4", prompt: "租屋糾紛談不攏，房客可以怎麼做？", options: ["直接動手", "向法院起訴或聲請調解", "只能自認倒楣", "找媒體公審"], answer: 1, hints: ["先調解、不行再訴訟", "走法律途徑解決"], explanation: "私人糾紛可先聲請調解，不成再向法院提起民事訴訟。" },
    { id: "sh-civ-law-5", prompt: "關於少年事件處理，下列說法何者較合適？", options: ["一律重罰以示警戒", "以保護、教育為原則", "與成年人完全相同處罰", "少年不負任何責任"], answer: 1, hints: ["有專法保護少年", "重點在保護與教育"], explanation: "少年事件處理法以保護、教育為原則，依年齡與情節有不同處置，而非一律重罰。" },
  ],
};

/* ===================== 4. 高二 — 國際組織與全球化 ===================== */
const SH_CIV_GLOBAL_ORG: OnionLesson = {
  id: "sh-civ-global-org",
  title: "國際組織與全球化：合作與張力",
  subject: "公民",
  topic: "國際組織與全球化",
  grade: "高二",
  stages: ["高中"],
  desc: "聯合國、WTO、區域組織如何促成國際合作，以及主權讓渡帶來的討論。",
  takeaways: [
    "聯合國安全理事會常任理事國擁有否決權，可阻擋重要決議",
    "WTO 設有爭端解決機制，處理會員間的貿易歧見",
    "區域組織（歐盟、APEC）促進合作，也帶來主權讓渡的討論",
  ],
  frames: [
    { step: "步驟 1：世界需要合作", id: 1, caption: "嗨！傳染病、氣候、貿易都跨國界，單一國家管不了，所以需要國際組織來一起合作。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識聯合國", id: 2, caption: "聯合國是最重要的全球組織，目標是維持國際和平與合作；其中安全理事會負責維和與制裁。", action: "point", prop: { kind: "text", text: "聯合國（UN）：維持和平與合作", sub: "安全理事會居核心", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：安理會的否決權", id: 3, caption: "安全理事會有 5 個常任理事國，它們各自擁有否決權，可以阻擋重要的決議案通過。", action: "think", prop: { kind: "flow", steps: ["5 個常任理事國", "可行使否決權", "阻擋重要決議"], active: 0 }, duration: 3800, ask: { prompt: "聯合國安全理事會的常任理事國擁有什麼特殊權力？", options: ["否決權", "一票算十票", "可解散大會", "獨裁任命秘書長"], answer: 0, hint: "這個權力能讓決議案卡住、無法通過。" } },
    { step: "步驟 4：認識貿易爭端機制", id: 4, caption: "WTO 管世界貿易規則，會員國吵架時，可以走它設立的爭端解決機制，由小組來裁斷誰違規。", action: "jump", prop: { kind: "text", text: "WTO：處理貿易規則", sub: "設有爭端解決機制", tone: "ok" }, duration: 3800 },
    { step: "步驟 5：認識區域組織", id: 5, caption: "除了全球組織，也有區域組織：歐盟推動歐洲整合，APEC 促進亞太經濟合作，讓鄰近國家更緊密。", action: "walk", prop: { kind: "flow", steps: ["歐盟（EU）：經濟與政治整合", "APEC：亞太經濟合作", "區域合作更緊密"], active: 0 }, duration: 3800, ask: { prompt: "下列哪一個是「區域性」的國際經濟組織？", options: ["聯合國", "世界貿易組織（WTO）", "歐盟（EU）", "國際貨幣基金"], answer: 2, hint: "範圍只在歐洲一帶，不是全球性的。" } },
    { step: "步驟 6：主權讓渡的張力", id: 6, caption: "加入組織常要讓出部分權力（如統一關稅），這和「國家主權」之間會有拉扯，各國態度不同。", action: "point", prop: { kind: "text", text: "合作 vs 主權讓渡", sub: "讓渡部分權力換取合作", tone: "warn" }, duration: 3800 },
    { step: "步驟 7：記國際組織口訣", id: 7, caption: "口訣：UN 維和、安理會否決、WTO 解爭端、區域齊合作。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-civ-global-org-1", prompt: "聯合國最主要的目標是什麼？", options: ["發動戰爭", "維持國際和平與合作", "統一各國貨幣", "取代各國政府"], answer: 1, hints: ["名字裡就有「和平」", "是國與國合作的平臺"], explanation: "聯合國以維持國際和平與安全、促進合作為主要目標。" },
    { id: "sh-civ-global-org-2", prompt: "安全理事會常任理事國的「否決權」會造成什麼結果？", options: ["決議一定通過", "可阻擋重要決議通過", "投票權加倍", "自動解散會議"], answer: 1, hints: ["「否決」就是否定的權力", "能讓案子卡住"], explanation: "常任理事國可行使否決權，使重要決議案無法通過。" },
    { id: "sh-civ-global-org-3", prompt: "WTO 對會員國間的貿易歧見，主要提供什麼機制？", options: ["直接開戰", "爭端解決機制", "經濟制裁命令", "強制統一稅率"], answer: 1, hints: ["是一套「解決爭端」的程序", "由小組裁斷誰違規"], explanation: "WTO 設有爭端解決機制，處理會員間的貿易爭議。" },
    { id: "sh-civ-global-org-4", prompt: "關於歐盟（EU）與 APEC，下列說法何者正確？", options: ["兩者都是全球性組織", "都促進區域或跨國經濟合作", "兩者都擁有軍隊", "都不處理經濟"], answer: 1, hints: ["都是區域或跨國的經濟合作", "不是全球性的"], explanation: "歐盟與 APEC 都是促進區域或跨國經濟合作的组织，與全球性組織不同。" },
    { id: "sh-civ-global-org-5", prompt: "國家加入國際組織時，常面臨什麼張力？", options: ["完全沒有影響", "合作利益與主權讓渡的取捨", "必須放棄所有法律", "不能再與他國往來"], answer: 1, hints: ["加入要讓出部分權力", "各國對此態度不同"], explanation: "加入國際組織往往需要在合作利益與讓渡部分主權之間權衡，是一種常見的張力。" },
  ],
};

/* ===================== 5. 高三 — 媒體識讀 ===================== */
const SH_CIV_MEDIA_LITERACY: OnionLesson = {
  id: "sh-civ-media-literacy",
  title: "媒體識讀：看穿假訊息",
  subject: "公民",
  topic: "媒體識讀",
  grade: "高三",
  stages: ["高中"],
  desc: "辨認假訊息的四種手法，學會查證來源、看時間戳，並跳出同溫層。",
  takeaways: [
    "假訊息常見手法：斷章取義、移花接木、情緒煽動、假專家",
    "查證來源：找原始出處、交叉比對、看時間戳",
    "演算法會形成同溫層，需主動接觸多元資訊並實際查核",
  ],
  frames: [
    { step: "步驟 1：訊息來得快", id: 1, caption: "嗨！一則影片在十分鐘內傳遍群組，你會先相信，還是先停一下想想它是不是真的？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識假訊息手法", id: 2, caption: "假訊息常見四招：只截取一半話（斷章取義）、圖片張冠李戴（移花接木）、用憤怒引人轉傳、假裝專家說話。", action: "point", prop: { kind: "flow", steps: ["斷章取義", "移花接木", "情緒煽動", "假專家"], active: 0 }, duration: 3800, ask: { prompt: "把別人的話只截取一半就散布，這是哪一種手法？", options: ["移花接木", "斷章取義", "情緒煽動", "假專家"], answer: 1, hint: "關鍵在「只取一部分」、失去原意。" } },
    { step: "步驟 3：動手查來源", id: 3, caption: "看到可疑訊息，先找原始出處、用其他媒體交叉比對，再確認發布時間是不是舊聞新傳。", action: "think", prop: { kind: "flow", steps: ["找原始出處", "交叉比對", "看時間戳"], active: 0 }, duration: 3800 },
    { step: "步驟 4：看時間戳辨舊聞", id: 4, caption: "很多謠言是「舊聞新傳」：同一張災害圖每年都被拿出來騙人，核對時間戳就能拆穿。", action: "jump", prop: { kind: "text", text: "舊聞新傳：時間戳是關鍵", sub: "同一張圖可能年年出現", tone: "warn" }, duration: 3800 },
    { step: "步驟 5：媒體立場與同溫層", id: 5, caption: "每家媒體都有立場，演算法又老推你愛看的，形成同溫層；要主動看不同來源才全面。", action: "walk", prop: { kind: "flow", steps: ["媒體有立場", "演算法推同溫層", "主動看多元源"], active: 0 }, duration: 3800, ask: { prompt: "演算法總推你愛看的內容，容易形成什麼現象？", options: ["同溫層", "完全客觀", "資訊更多元", "沒有偏誤"], answer: 0, hint: "大家都只看相似的內容，觀點越來越像。" } },
    { step: "步驟 6：怎麼查核", id: 6, caption: "養成習慣：先查出處、再交叉比對、看時間，也能參考專門的事實查核單位再做判斷。", action: "point", prop: { kind: "text", text: "查核三步：出處／比對／時間", sub: "找事實查核單位協助", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：記媒體識讀口訣", id: 7, caption: "口訣：四手法要警覺、查出處比對時間、跳出同溫層。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-civ-media-literacy-1", prompt: "把圖片與事件錯誤配在一起，這是哪一種假訊息手法？", options: ["斷章取義", "移花接木", "情緒煽動", "假專家"], answer: 1, hints: ["是「張冠李戴」", "圖與事對不上"], explanation: "移花接木指把圖片或資訊錯誤搭配，誤導讀者以為相關。" },
    { id: "sh-civ-media-literacy-2", prompt: "看到可疑訊息，第一步最該做的是什麼？", options: ["立刻轉傳提醒親友", "找原始出處與來源", "直接相信標題", "只看留言判斷"], answer: 1, hints: ["先確認「從哪來」", "不要急著轉"], explanation: "查證第一步是追溯原始出處與可靠來源，再決定是否相信。" },
    { id: "sh-civ-media-literacy-3", prompt: "一張「今年」的災害圖，其實是三年前的舊照，這屬於什麼問題？", options: ["單純誤會", "舊聞新傳（時間戳不符）", "媒體立場", "同溫層"], answer: 1, hints: ["重點在「時間對不上」", "舊圖新用"], explanation: "這是舊聞新傳：用舊照片冒充新事件，核對時間戳就能發現。" },
    { id: "sh-civ-media-literacy-4", prompt: "演算法偏好推播你愛看的內容，可能造成什麼影響？", options: ["讓你看到更多相反意見", "強化同溫層、視野變窄", "完全中立", "消除所有偏見"], answer: 1, hints: ["你越看越只看相似的", "觀點被侷限"], explanation: "演算法回音室效應會強化同溫層，讓人較少接觸不同意見、視野變窄。" },
    { id: "sh-civ-media-literacy-5", prompt: "關於媒體識讀，下列做法何者最恰當？", options: ["只信自己喜歡的媒體", "交叉比對、查核來源再判斷", "看到驚悚標題就轉傳", "專家說的都照單全收"], answer: 1, hints: ["多元查證才穩", "不盲信單一來源"], explanation: "媒體識讀強調交叉比對、查證來源與時間，再形成判斷，而非盲信單一來源。" },
  ],
};

export default [
  SH_CIV_DEMOCRACY,
  SH_CIV_ECONOMICS,
  SH_CIV_LAW,
  SH_CIV_GLOBAL_ORG,
  SH_CIV_MEDIA_LITERACY,
];
