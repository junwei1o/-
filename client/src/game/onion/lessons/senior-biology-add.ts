/**
 * 高中生物 8 堂（senior-biology-add.ts）
 *
 * 課程表來自 docs/onion-200-plan.md →「三、高中新增 65 堂」→「生物 8 堂」
 * （id: sh-bio-*，subject: 生物，stages: ["高中"]）。
 *
 * 每堂課 7 幀分鏡（每幀 step 步驟標籤、caption、action、prop、duration，
 * 至少 2 幀有 ask）＋ 5 題闖關（2 題基本 → 2 題應用 → 1 題易錯／跨概念，
 * 含 2 級提示與詳解）＋ 3 條 takeaways。
 *
 * 這是「高中版」：比國中（光合作用、細胞分裂、細胞的構造）更深，講到
 * 膜運輸機制、棋盤方格比例、密碼子、中心法則、天擇三步走、能量塔 10%
 * 傳遞、負回饋恆定、PCR 與基因轉殖。數字（3:1、9:3:3:1、100/10/1、10%）
 * 均與教具 bars 嚴格一致。
 */

import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 課程 1：生物（高中）— 細胞的構造與功能
 * ======================================================================== */
const SH_BIO_CELL: OnionLesson = {
  id: "sh-bio-cell",
  title: "細胞的構造與功能：胞器分工與膜運輸",
  subject: "生物",
  topic: "細胞的構造與功能",
  grade: "高一",
  stages: ["高中"],
  desc: "細胞是一座分工精密的工廠：核指揮、粒線體發電，膜還會選擇誰進誰出。",
  takeaways: [
    "細胞核指揮、粒線體供能、核糖體合成蛋白質、內質網與高基氏體加工運送",
    "細胞膜具選擇性通透；被動運輸（擴散、滲透）順濃度梯度、不消耗能量",
    "主動運輸逆濃度梯度、需消耗 ATP；植物細胞另有細胞壁、葉綠體、液胞",
  ],
  frames: [
    { id: 1, step: "步驟 1：細胞是一座分工工廠", caption: "嗨！細胞不是一袋漿糊，而是一座分工精密的工廠，今天來認識各區的員工。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：認識主要胞器", caption: "細胞核像總部、粒線體是發電廠、核糖體做蛋白質、內質網和高基氏體負責加工與運送。", action: "point", prop: { kind: "flow", steps: ["細胞核（總部）", "粒線體（發電廠）", "核糖體（做蛋白質）", "內質網（加工）", "高基氏體（包裝送出）"], active: 0 }, duration: 3600 },
    { id: 3, step: "步驟 3：膜的選擇性通透", caption: "細胞膜像篩子，只讓特定小分子通過，這叫選擇性通透，守護細胞內的穩定。", action: "think", prop: { kind: "text", text: "選擇性通透：膜只放行特定物質", sub: "脂溶性小分子、氣體較易通過", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：被動運輸不耗能", caption: "擴散和滲透都順著濃度梯度走，不用花能量；水從低濃度處流向高濃度處，這叫做滲透。", action: "walk", prop: { kind: "flow", steps: ["順濃度梯度", "擴散：分子隨機散開", "滲透：水穿膜", "不消耗 ATP"], active: 3 }, duration: 3600, ask: { prompt: "擴散和滲透進出細胞，需不需要消耗 ATP？", options: ["需要消耗 ATP", "不需要，順梯度進行", "只在植物細胞發生", "只在膜上發生"], answer: 1, hint: "被動運輸順濃度梯度、不耗能；主動運輸才要 ATP。" } },
    { id: 5, step: "步驟 5：主動運輸要花 ATP", caption: "主動運輸逆著濃度梯度送物質，像扛東西上樓，必須消耗 ATP 能量才辦得到。", action: "jump", prop: { kind: "text", text: "主動運輸：逆梯度、要 ATP", sub: "運輸蛋白協助、會耗能", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一種運輸方式需要消耗 ATP？", options: ["擴散", "滲透", "主動運輸", "都不需要"], answer: 2, hint: "主動運輸逆濃度梯度，要耗能；擴散與滲透是免費的被動運輸。" } },
    { id: 6, step: "步驟 6：植物細胞的專屬構造", caption: "植物細胞多了細胞壁、葉綠體和液胞：細胞壁撐外形、葉綠體行光合作用、液胞儲水。", action: "point", prop: { kind: "flow", steps: ["細胞壁（支撐）", "葉綠體（光合作用）", "液胞（儲水）", "動物細胞無此三樣"], active: 1 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住胞器分工口訣", caption: "口訣：核指揮、粒線體發電、膜選擇通透；被動不耗能、主動要 ATP。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-cell-1", prompt: "細胞內負責指揮、儲存 DNA 的構造是？", options: ["細胞膜", "細胞核", "粒線體", "核糖體"], answer: 1, hints: ["它是細胞的總部", "遺傳物質 DNA 所在地"], explanation: "細胞核內含有 DNA，是細胞遺傳與活動的指揮中心。" },
    { id: "sh-bio-cell-2", prompt: "細胞膜的「選擇性通透」是指什麼？", options: ["完全不通透", "只放行特定物質", "只有水分能通過", "隨時全部打開"], answer: 1, hints: ["膜像有選擇的篩子", "不是什麼都放進來"], explanation: "選擇性通透表示膜允許某些物質通過、擋下其他物質，以維持內部穩定。" },
    { id: "sh-bio-cell-3", prompt: "氧氣、二氧化碳等氣體進出細胞，主要透過下列哪一種方式？", options: ["主動運輸", "滲透", "簡單擴散", "胞吞作用"], answer: 2, hints: ["氣體是小分子", "順濃度梯度直接穿膜"], explanation: "氣體等小分子順濃度梯度直接穿過膜，屬於簡單擴散，不耗能。" },
    { id: "sh-bio-cell-4", prompt: "小腸絨毛把葡萄糖送進血液，常逆濃度梯度進行，這需要？", options: ["擴散即可", "滲透即可", "主動運輸與 ATP", "完全不需能量"], answer: 2, hints: ["逆梯度就要花能量", "靠運輸蛋白幫忙"], explanation: "逆濃度梯度運送必須靠主動運輸，消耗 ATP 並由運輸蛋白協助。" },
    { id: "sh-bio-cell-5", prompt: "植物細胞與動物細胞相比，特有的構造不包括下列哪一項？", options: ["細胞壁", "葉綠體", "液胞", "粒線體"], answer: 3, hints: ["想想兩者都有的胞器", "粒線體負責供能，雙方都有"], explanation: "粒線體在植物與動物細胞都有；細胞壁、葉綠體、液胞才是植物細胞特有的構造。" },
  ],
};

/* ========================================================================
 * 課程 2：生物（高中）— 孟德爾遺傳
 * ======================================================================== */
const SH_BIO_GENETICS: OnionLesson = {
  id: "sh-bio-genetics",
  title: "孟德爾遺傳：顯隱性與棋盤方格",
  subject: "生物",
  topic: "孟德爾遺傳",
  grade: "高一",
  stages: ["高中"],
  desc: "顯性蓋過隱性，單雜交得 3:1、雙雜交得 9:3:3:1，棋盤方格一眼看清。",
  takeaways: [
    "顯性基因表現、隱性被遮蓋；雜合子 Tt 外表與顯性相同",
    "單基因雜交 F2 基因型 1:2:1、表現型 3:1（可用棋盤方格驗證）",
    "雙基因雜交 F2 表現型呈 9:3:3:1，各對性狀獨立遺傳",
  ],
  frames: [
    { id: 1, step: "步驟 1：豌豆實驗藏規律", caption: "嗨！孟德爾種豌豆發現遺傳規律，今天用顯性和隱性解開 3:1 這個比例。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：顯性蓋過隱性", caption: "以高莖（T）對矮莖（t）為顯性：Tt 個體表現高莖，只有 tt 才表現矮莖。", action: "point", prop: { kind: "text", text: "顯性 T 蓋過隱性 t", sub: "基因型 Tt、TT → 高莖；tt → 矮莖", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：單性雜交得 F1", caption: "純種高莖 TT 與矮莖 tt 雜交，子代 F1 全為 Tt，外表通通都是高莖。", action: "think", prop: { kind: "flow", steps: ["親代 TT × tt", "配子 T 和 t", "F1 全為 Tt", "外表皆高莖"], active: 3 }, duration: 3600 },
    { id: 4, step: "步驟 4：F1 自交得 3:1", caption: "F1 自交 Tt × Tt，子代基因型 TT:Tt:tt ＝ 1:2:1，高莖:矮莖 ＝ 3:1。", action: "walk", prop: { kind: "bars", items: [{ label: "高莖", value: 3 }, { label: "矮莖", value: 1 }], unit: "份", active: 0 }, duration: 3600, ask: { prompt: "Tt 自交得到的子代，高莖與矮莖的比例約為？", options: ["1:1", "3:1", "9:3:3:1", "2:1"], answer: 1, hint: "基因型 1:2:1，顯性高莖佔 3 份、矮莖 1 份，故為 3:1。" } },
    { id: 5, step: "步驟 5：棋盤方格驗算", caption: "用棋盤方格把 T 和 t 排成橫直兩邊，四格分別是 TT、Tt、Tt、tt，一眼看清比例。", action: "jump", prop: { kind: "flow", steps: ["橫列 T、t", "直行 T、t", "交叉得四格", "TT、Tt、Tt、tt"], active: 3 }, duration: 3600, ask: { prompt: "棋盤方格中，Tt 這個基因型出現了幾格？", options: ["1 格", "2 格", "3 格", "4 格"], answer: 1, hint: "四格為 TT、Tt、Tt、tt，Tt 佔其中兩格。" } },
    { id: 6, step: "步驟 6：雙性雜交得 9:3:3:1", caption: "兩對性狀一起雜交（如黃圓 × 綠縐），F2 呈現 9:3:3:1 的四種表現型比例。", action: "point", prop: { kind: "bars", items: [{ label: "黃圓", value: 9 }, { label: "黃縐", value: 3 }, { label: "綠圓", value: 3 }, { label: "綠縐", value: 1 }], unit: "份", active: 0 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住遺傳口訣", caption: "口訣：顯性蓋隱性、單雜交 3:1、雙雜交 9:3:3:1，棋盤方格不慌張。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-genetics-1", prompt: "關於顯性與隱性，下列何者正確？", options: ["顯性基因一定比較好", "Tt 個體表現顯性性狀", "隱性性狀不會出現", "tt 是高莖"], answer: 1, hints: ["顯性會遮蓋隱性", "雜合子外表看顯性"], explanation: "顯性基因表現、隱性被遮蓋，所以 Tt 雜合子表現高莖這個顯性性狀。" },
    { id: "sh-bio-genetics-2", prompt: "純種高莖 TT 與矮莖 tt 雜交，F1 的基因型是？", options: ["TT", "Tt", "tt", "TT 和 tt"], answer: 1, hints: ["親代各給一個等位基因", "T 配 t"], explanation: "TT 只給 T、tt 只給 t，F1 全為 Tt。" },
    { id: "sh-bio-genetics-3", prompt: "Tt 自交，子代出現矮莖（tt）的機率約為？", options: ["1/4", "1/2", "3/4", "0"], answer: 0, hints: ["基因型 1:2:1", "tt 佔其中 1 份"], explanation: "Tt × Tt 的子代基因型 TT:Tt:tt ＝ 1:2:1，tt 佔 1/4，故矮莖機率 1/4。" },
    { id: "sh-bio-genetics-4", prompt: "雙因子雜交 F2 的表現型比例是？", options: ["3:1", "1:1", "9:3:3:1", "1:2:1"], answer: 2, hints: ["兩對性狀一起算", "四種表現型"], explanation: "兩對基因獨立遺傳，F2 表現型呈 9:3:3:1。" },
    { id: "sh-bio-genetics-5", prompt: "為什麼 F1 全為高莖，卻能生出矮莖的後代？", options: ["突變造成", "矮莖基因 t 被隱藏、自交才現形", "高莖是後天獲得", "孟德爾記錯了"], answer: 1, hints: ["隱性被顯性遮住", "純合 tt 才看得到"], explanation: "隱性基因在雜合子 Tt 中被顯性 T 遮蓋，自交出現 tt 純合子時矮莖才表現出來。" },
  ],
};

/* ========================================================================
 * 課程 3：生物（高中）— DNA 與基因表現
 * ======================================================================== */
const SH_BIO_DNA: OnionLesson = {
  id: "sh-bio-dna",
  title: "DNA 與基因表現：複製、轉錄、轉譯",
  subject: "生物",
  topic: "DNA 與基因表現",
  grade: "高二",
  stages: ["高中"],
  desc: "DNA 半保留複製、轉錄出 mRNA、轉譯成蛋白質，密碼子三鹼基對一胺基酸。",
  takeaways: [
    "DNA 半保留複製：每條子代 DNA 含一股舊、一股新",
    "轉錄以 DNA 為模板合成 mRNA（RNA 中 A 對 U）；鹼基配對 A-T、G-C",
    "轉譯時每 3 個鹼基（一個密碼子）對應 1 個胺基酸，中心法則 DNA→RNA→蛋白質",
  ],
  frames: [
    { id: 1, step: "步驟 1：細胞裡的說明書", caption: "嗨！你的每個細胞都有一本說明書——DNA，今天看它怎麼複製、轉錄、轉譯成蛋白質。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：DNA 半保留複製", caption: "DNA 雙股解開，各當模板合成新股，子代每條 DNA 都是一舊一新，叫做半保留複製。", action: "point", prop: { kind: "flow", steps: ["雙股解開", "各股當模板", "合成新互補股", "一舊一新"], active: 3 }, duration: 3600 },
    { id: 3, step: "步驟 3：鹼基配對守則", caption: "配對守則：DNA 中 A 對 T、G 對 C；轉錄時 RNA 改用 U，所以模板 A 對 U、T 對 A。", action: "think", prop: { kind: "text", text: "DNA：A=T、G≡C；RNA：A=U", sub: "轉錄以 DNA 為模板做出 mRNA", tone: "ok" }, duration: 3600, ask: { prompt: "DNA 複製時，A 應與下列哪一個鹼基配對？", options: ["T", "U", "G", "C"], answer: 0, hint: "DNA 中 A 與 T 配對；RNA 才用 U。" } },
    { id: 4, step: "步驟 4：轉錄抄出副本", caption: "轉錄：以 DNA 一股為模板，在細胞核合成 mRNA，把基因資訊抄成可帶出的副本。", action: "walk", prop: { kind: "flow", steps: ["RNA 聚合酶結合", "以 DNA 為模板", "合成 mRNA", "副本送出細胞核"], active: 2 }, duration: 3600 },
    { id: 5, step: "步驟 5：轉譯與密碼子", caption: "轉譯在核糖體進行：每 3 個鹼基組成一個密碼子，對應 1 個胺基酸，像三鍵一字的密碼。", action: "jump", prop: { kind: "text", text: "密碼子：3 個鹼基 = 1 個胺基酸", sub: "AUG 是起始密碼子", tone: "ok" }, duration: 3600, ask: { prompt: "mRNA 上幾個相鄰鹼基組成一個密碼子？", options: ["1 個", "2 個", "3 個", "4 個"], answer: 2, hint: "三個鹼基（一個密碼子）對應一個胺基酸。" } },
    { id: 6, step: "步驟 6：中心法則總覽", caption: "一條龍：DNA 複製留副本、轉錄成 mRNA、轉譯成蛋白質，中心法則串起遺傳資訊。", action: "point", prop: { kind: "flow", steps: ["DNA 複製", "轉錄→mRNA", "轉譯→蛋白質", "中心法則"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住基因表現口訣", caption: "口訣：複製半保留、轉錄抄副本、轉譯三鹼基一胺基酸。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-dna-1", prompt: "DNA 半保留複製後，每條子代 DNA 是？", options: ["兩股全新", "一舊一股", "兩股都舊", "隨機混合"], answer: 1, hints: ["舊股當模板", "新股補上去"], explanation: "半保留複製讓每條子代 DNA 含一股母股（舊）與一股新股。" },
    { id: "sh-bio-dna-2", prompt: "轉錄的產物是下列哪一種分子？", options: ["DNA", "mRNA", "蛋白質", "胺基酸"], answer: 1, hints: ["把基因資訊抄出來", "之後去核糖體"], explanation: "轉錄以 DNA 為模板合成 mRNA，作為後續轉譯的副本。" },
    { id: "sh-bio-dna-3", prompt: "轉錄時，mRNA 上的 A 是與 DNA 模板上的哪個鹼基配對？", options: ["T", "U", "G", "C"], answer: 0, hints: ["RNA 用 U 但對方是 DNA", "DNA 不用 U"], explanation: "模板是 DNA，其上 T 與 RNA 的 A 配對（DNA 中沒有 U，是 RNA 用 U 取代 T）。" },
    { id: "sh-bio-dna-4", prompt: "一個密碼子由幾個核苷酸組成，對應幾個胺基酸？", options: ["1 個核苷酸、對應 1 個", "2 個、對應 1 個", "3 個、對應 1 個", "3 個、對應 3 個"], answer: 2, hints: ["三鍵一字", "三個鹼基一組"], explanation: "三個相鄰核苷酸組成一個密碼子，對應一個胺基酸。" },
    { id: "sh-bio-dna-5", prompt: "下列有關「中心法則」的敘述，何者正確？", options: ["蛋白質可反轉錄成 DNA（一般情況）", "資訊流向為 DNA→RNA→蛋白質", "RNA 不能複製", "轉譯在細胞核進行"], answer: 1, hints: ["一般流向是轉錄再轉譯", "反轉錄只見於反轉錄病毒"], explanation: "一般中心法則：DNA 轉錄成 RNA、再轉譯成蛋白質；轉譯在細胞質的核糖體進行。" },
  ],
};

/* ========================================================================
 * 課程 4：生物（高中）— 演化
 * ======================================================================== */
const SH_BIO_EVOLUTION: OnionLesson = {
  id: "sh-bio-evolution",
  title: "演化：天擇、適應與共同祖先",
  subject: "生物",
  topic: "演化",
  grade: "高二",
  stages: ["高中"],
  desc: "變異先存在、天擇來篩選，適者遺傳；同源構造與化石訴說共同祖先。",
  takeaways: [
    "演化的原料是既有的遺傳變異；天擇三步走：變異→選擇→遺傳",
    "抗藥性等適應來自「篩選已有變異」，不是環境主動創造",
    "同源構造與化石證據支持生物有共同祖先",
  ],
  frames: [
    { id: 1, step: "步驟 1：長頸鹿脖子為何長", caption: "嗨！長頸鹿脖子為什麼長？不是用進廢退，而是天擇把有利的變異留下來。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：個體間本有變異", caption: "同一物種個體間本來就有差異，例如有的跑得快、有的跑得慢，變異是先天條件。", action: "point", prop: { kind: "flow", steps: ["個體間有變異", "來自突變與重組", "可遺傳給後代", "差異被保留或淘汰"], active: 1 }, duration: 3600 },
    { id: 3, step: "步驟 3：天擇三步走", caption: "天擇三步：變異→選擇→遺傳。環境選出適者生存、不適者淘汰，有利特徵代代變多。", action: "think", prop: { kind: "flow", steps: ["變異產生", "環境選擇", "適者生存", "特徵遺傳"], active: 3 }, duration: 3600, ask: { prompt: "天擇能直接『創造』變異嗎？", options: ["能，環境主動製造變異", "不能，環境只篩選已有的變異", "能，讓生物變完美", "不能，演化完全隨機"], answer: 1, hint: "變異先存在，天擇只負責保留有利的那些。" } },
    { id: 4, step: "步驟 4：抗藥性例子", caption: "例子：細菌本有抗藥個體，用抗生素後敏感菌死、抗藥菌留下，抗藥性就擴散開來。", action: "walk", prop: { kind: "flow", steps: ["族群本有抗藥變異", "抗生素殺敏感菌", "抗藥菌存活", "抗藥性擴散"], active: 3 }, duration: 3600, ask: { prompt: "濫用抗生素為什麼會讓抗藥菌變多？", options: ["抗生素訓練細菌變強", "它殺死敏感菌、留下抗藥菌", "細菌主動變抗藥", "與抗生素無關"], answer: 1, hint: "藥物篩選出原本就存在的抗藥個體，讓它們留下繁殖。" } },
    { id: 5, step: "步驟 5：同源構造與共同祖先", caption: "人、鯨、蝙蝠的前肢骨骼相似，功能不同卻構造相近，提示它們來自共同祖先。", action: "jump", prop: { kind: "text", text: "同源構造 → 共同祖先", sub: "相似骨骼、功能不同", tone: "ok" }, duration: 3600 },
    { id: 6, step: "步驟 6：化石是演化證據", caption: "化石按地層由老到新排列，顯示生物由簡單到複雜，是演化的重要證據之一。", action: "point", prop: { kind: "cycle", nodes: ["變異", "天擇", "適應", "遺傳", "再變異"], active: 0 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住演化口訣", caption: "口訣：變異先有、天擇來篩、適者遺傳；同源與化石訴說共同祖先。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-evolution-1", prompt: "天擇學說中，什麼是演化的原料？", options: ["環境主動創造", "個體間既有的變異", "生物主觀意願", "用進廢退"], answer: 1, hints: ["變異要先存在", "否則沒東西可篩"], explanation: "遺傳變異先存在於族群中，天擇才據此篩選，變異是演化的原料。" },
    { id: "sh-bio-evolution-2", prompt: "天擇的三個關鍵步驟依序是？", options: ["選擇→變異→遺傳", "變異→選擇→遺傳", "遺傳→選擇→變異", "變異→遺傳→選擇"], answer: 1, hints: ["有變異才選", "選中的才遺傳"], explanation: "正確順序是變異產生 → 環境選擇 → 有利特徵遺傳給後代。" },
    { id: "sh-bio-evolution-3", prompt: "關於抗生素抗藥性，下列正確的是？", options: ["是藥物讓細菌『學會』抗藥", "抗藥變異原已存在、被藥物篩選", "停用抗生素可立刻消除抗藥性", "抗藥性不會遺傳"], answer: 1, hints: ["變異早就有了", "藥只是篩子"], explanation: "抗藥變異原本就存在於菌群，抗生素殺死敏感菌、留下抗藥菌，使其比例上升。" },
    { id: "sh-bio-evolution-4", prompt: "人、鯨、蝙蝠的前肢骨骼相似，支持下列何種觀點？", options: ["各自獨立創造", "來自共同祖先（同源構造）", "只是巧合", "功能完全相同"], answer: 1, hints: ["構造像、功能不像", "同源構造"], explanation: "同源構造（相似骨骼、不同功能）是生物有共同祖先的重要證據。" },
    { id: "sh-bio-evolution-5", prompt: "下列關於「適應」的敘述，何者最恰當？", options: ["最完美的生物才會出現", "有利特徵在環境中較易生存繁殖、逐代變多", "適應是生物為了變好而主動改變", "演化有明確目標"], answer: 1, hints: ["天擇累積有利變異", "不是有目標的主動改變"], explanation: "適應是天擇累積有利變異的結果：具優勢者較易存活繁殖，特徵逐代變多，並非有目標的主動改變。" },
  ],
};

/* ========================================================================
 * 課程 5：生物（高中）— 生態系與能量流動
 * ======================================================================== */
const SH_BIO_ECOLOGY: OnionLesson = {
  id: "sh-bio-ecology",
  title: "生態系與能量流動：食物網與能量塔",
  subject: "生物",
  topic: "生態系與能量流動",
  grade: "高二",
  stages: ["高中"],
  desc: "生產者打底、消費者取食、分解者回收；能量塔每傳一層只剩約 10%。",
  takeaways: [
    "生態系三角色：生產者製造、消費者取食、分解者回收無機物",
    "能量沿食物鏈單向流動，相鄰營養階層間傳遞只剩約 10%",
    "營養階層越高能量越少，故頂級掠食者數量天生稀少",
  ],
  frames: [
    { id: 1, step: "步驟 1：草原上的能量鏈", caption: "嗨！草原上草被兔吃、兔被狐吃，能量一路往上卻越來越少，今天看能量塔。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：食物鏈與食物網", caption: "生產者（草）用陽光造養分，初級消費者（兔）吃草，次級消費者（狐）吃兔，交織成食物網。", action: "point", prop: { kind: "flow", steps: ["生產者：草", "初級消費者：兔", "次級消費者：狐", "多條鏈交織成網"], active: 3 }, duration: 3600 },
    { id: 3, step: "步驟 3：生態系三角色", caption: "生態系三角色：生產者製造有機物、消費者取食、分解者把屍體分解成無機物回歸環境。", action: "think", prop: { kind: "flow", steps: ["生產者（製造）", "消費者（取食）", "分解者（分解）", "物質循環再利用"], active: 3 }, duration: 3600, ask: { prompt: "在生態系中把動植物屍體分解成無機物的是？", options: ["生產者", "消費者", "分解者", "初級消費者"], answer: 2, hint: "分解者（如真菌、腐生生物）把有機物打回無機物。" } },
    { id: 4, step: "步驟 4：能量塔每層剩 10%", caption: "營養階層每往上傳一層，能量只剩約 10%：生產者 100 單位，到初級消費者剩 10，再到次級只剩 1。", action: "walk", prop: { kind: "bars", items: [{ label: "生產者", value: 100 }, { label: "初級消費者", value: 10 }, { label: "次級消費者", value: 1 }], unit: "單位", active: 0 }, duration: 3600, ask: { prompt: "能量在相鄰兩營養階層間傳遞，大約只剩多少比例？", options: ["約 10%", "約 50%", "約 90%", "100%"], answer: 0, hint: "能量塔每傳一層只剩約十分之一（10%）。" } },
    { id: 5, step: "步驟 5：頂級掠食者稀少", caption: "因為能量越往上越少，能養活的個體也越少，所以頂級掠食者數量天生就稀少。", action: "jump", prop: { kind: "text", text: "能量少 → 頂級掠食者數量少", sub: "營養階層越高、能量越少", tone: "ok" }, duration: 3600 },
    { id: 6, step: "步驟 6：物質循環再利用", caption: "物質在生態系中循環：碳、水經生產者、消費者、分解者不斷流轉，能量則單向流失。", action: "point", prop: { kind: "cycle", nodes: ["生產者", "初級消費者", "次級消費者", "分解者", "回到環境"], active: 0 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住能量塔口訣", caption: "口訣：生產者打底、消費者取食、分解者回收；能量塔每層只剩 10%，頂級稀少。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-ecology-1", prompt: "生態系中能自己製造有機物的角色是？", options: ["消費者", "分解者", "生產者", "次級消費者"], answer: 2, hints: ["利用陽光或化能", "綠色植物、藻類"], explanation: "生產者（如植物）行光合作用製造有機物，是能量進入生態系的入口。" },
    { id: "sh-bio-ecology-2", prompt: "草 → 兔 → 狐這條路中，狐狸屬於？", options: ["生產者", "初級消費者", "次級消費者", "分解者"], answer: 2, hints: ["吃初級消費者（兔）", "站在第三階層"], explanation: "狐吃兔（初級消費者），屬於次級消費者。" },
    { id: "sh-bio-ecology-3", prompt: "能量在營養階層間傳遞，大約保留多少比例？", options: ["10%", "50%", "90%", "100%"], answer: 0, hints: ["每層大量以熱散失", "所謂能量塔"], explanation: "相鄰營養階層間能量傳遞效率約 10%，其餘多以熱散失。" },
    { id: "sh-bio-ecology-4", prompt: "為什麼生態系中的頂級掠食者數量通常很少？", options: ["牠們不會繁殖", "能量逐層減少、能養活的個體有限", "被分解者吃光", "沒有食物鏈"], answer: 1, hints: ["越高層能量越少", "養不起太多個體"], explanation: "能量每層只剩約 10%，越高營養階層可得能量越少，能支持的個體數也越少。" },
    { id: "sh-bio-ecology-5", prompt: "關於物質循環與能量流動，下列何者正確？", options: ["能量也能在生態系中循環再利用", "物質循環、能量單向流失", "兩者都單向流失", "兩者都完全循環"], answer: 1, hints: ["物質可被回收", "能量沿鏈散失無法回收"], explanation: "物質（如碳、水）經分解者回收循環，能量沿食物鏈單向流動並以熱散失，無法回收。" },
  ],
};

/* ========================================================================
 * 課程 6：生物（高中）— 植物生理
 * ======================================================================== */
const SH_BIO_PLANT_PHYSIOLOGY: OnionLesson = {
  id: "sh-bio-plant-physiology",
  title: "植物生理：光合作用、蒸散與激素",
  subject: "生物",
  topic: "植物生理",
  grade: "高二",
  stages: ["高中"],
  desc: "光反應供能、碳反應固碳；蒸散拉水上升；生長素讓莖朝光彎曲。",
  takeaways: [
    "光合作用分光反應（產 ATP/NADPH）與碳反應（CO₂→葡萄糖），總式 6CO₂+6H₂O→葡萄糖+6O₂",
    "蒸散作用經氣孔散失水氣，產生拉力把根的水沿木質部拉上去",
    "生長素分布不均造成向光性，是植物感應環境的激素調節",
  ],
  frames: [
    { id: 1, step: "步驟 1：植物會三件事", caption: "嗨！植物靠光合作用自製養分、靠蒸散拉水上升、還受激素指揮生長，今天一次看三件事。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：光合作用兩階段", caption: "光合作用分兩階段：光反應在類囊體產生 ATP 和 NADPH，碳反應在基質把 CO₂ 變成葡萄糖。", action: "point", prop: { kind: "flow", steps: ["光反應（類囊體）", "產生 ATP、NADPH", "碳反應（基質）", "CO₂ → 葡萄糖"], active: 3 }, duration: 3600 },
    { id: 3, step: "步驟 3：總反應式", caption: "總反應式：6 CO₂ ＋ 6 H₂O，經光與葉綠體驅動，生成葡萄糖 C₆H₁₂O₆ 與 6 O₂。", action: "think", prop: { kind: "balance", left: "6 CO₂ ＋ 6 H₂O", right: "C₆H₁₂O₆ ＋ 6 O₂", tip: "光與葉綠體驅動" }, duration: 3600, ask: { prompt: "光合作用的原料（反應物）不包括下列哪一項？", options: ["CO₂", "H₂O", "光", "O₂"], answer: 3, hint: "O₂ 是產物不是原料；原料是 CO₂ 和 H₂O，能量來自光。" } },
    { id: 4, step: "步驟 4：蒸散產生拉力", caption: "葉片氣孔散失水氣產生拉力，把根部的水經木質部一路拉到葉片，這叫蒸散拉力。", action: "walk", prop: { kind: "flow", steps: ["根吸水", "經木質部上行", "葉氣孔散失水", "產生向上拉力"], active: 3 }, duration: 3600, ask: { prompt: "植物把水分從根運到葉的主要動力來自？", options: ["根部主動加壓", "葉片蒸散產生的拉力", "重力推動", "光合作用直接抽水"], answer: 1, hint: "蒸散使葉散失水氣，形成向上的拉力（蒸散拉力）。" } },
    { id: 5, step: "步驟 5：生長素與向光性", caption: "生長素集中在莖尖，受光會向背光側移動，使那側長得快，莖便朝光彎曲（向光性）。", action: "jump", prop: { kind: "text", text: "生長素：背光側多 → 長得快", sub: "造成向光性彎曲", tone: "ok" }, duration: 3600 },
    { id: 6, step: "步驟 6：三者分工合作", caption: "三件事配合：光合作用製養分、蒸散運水、生長素指揮生長方向，植物才能茁壯。", action: "point", prop: { kind: "flow", steps: ["光合作用製養分", "蒸散運輸水分", "生長素指揮生長", "三者分工合作"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住植物生理口訣", caption: "口訣：光反應供能、碳反應固碳；蒸散拉水、生長素向光。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-plant-physiology-1", prompt: "光合作用把 CO₂ 轉成葡萄糖，主要在哪個構造進行？", options: ["粒線體", "葉綠體", "液胞", "細胞核"], answer: 1, hints: ["綠色的小顆粒", "吸收光能的場所"], explanation: "葉綠體含有光合色素，是進行光合作用的場所。" },
    { id: "sh-bio-plant-physiology-2", prompt: "光合作用可分為光反應和下列哪一階段？", options: ["碳反應", "蒸散", "呼吸", "發酵"], answer: 0, hints: ["第二階段固定碳", "在基質進行"], explanation: "光合作用分為光反應（產生 ATP/NADPH）與碳反應（固定 CO₂ 成葡萄糖）。" },
    { id: "sh-bio-plant-physiology-3", prompt: "植物的水分主要由哪個構造向上運輸？", options: ["韌皮部", "木質部", "氣孔", "表皮"], answer: 1, hints: ["像水管往上送水", "導管在此"], explanation: "木質部中的導管把根吸收的水分和礦物質向上運輸到莖葉。" },
    { id: "sh-bio-plant-physiology-4", prompt: "植物莖朝光源彎曲（向光性），主要是因為？", options: ["莖兩側均勻生長", "生長素使背光側長得較快", "光直接把莖推彎", "根的吸收作用"], answer: 1, hints: ["生長素分布不均", "背光側細胞伸長快"], explanation: "生長素在背光側較多，該側細胞伸長較快，使莖朝光源彎曲。" },
    { id: "sh-bio-plant-physiology-5", prompt: "下列有關蒸散作用的敘述，何者正確？", options: ["蒸散會讓植物失水，完全沒好處", "蒸散產生的拉力協助運水上升", "蒸散只在夜間發生", "蒸散與氣孔無關"], answer: 1, hints: ["失水也帶來好處", "經由氣孔進行"], explanation: "蒸散散失水氣形成向上的拉力，是木質部運水的主要動力，且經由氣孔進行。" },
  ],
};

/* ========================================================================
 * 課程 7：生物（高中）— 人體生理整合
 * ======================================================================== */
const SH_BIO_HUMAN_BODY: OnionLesson = {
  id: "sh-bio-human-body",
  title: "人體生理整合：神經、內分泌與恆定",
  subject: "生物",
  topic: "人體生理整合",
  grade: "高三",
  stages: ["高中"],
  desc: "神經快而短效、內分泌慢而持久，負回饋把體溫血糖拉回設定點。",
  takeaways: [
    "神經系統：神經元傳電訊號，快、短效，適合即時反應",
    "內分泌系統：激素經血液，慢、持久，適合長期調節",
    "負回饋（如體溫、血糖）把偏離的數值拉回設定點，維持體內恆定",
  ],
  frames: [
    { id: 1, step: "步驟 1：兩套系統保恆定", caption: "嗨！你跑步會喘、受驚會心跳加速，這是神經和內分泌兩套系統在合作維持恆定。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：神經系統快又短", caption: "神經系統靠神經元傳電訊號，路徑固定、傳遞快（毫秒級）、效果短暫，適合即時反應。", action: "point", prop: { kind: "flow", steps: ["刺激", "神經元傳電訊", "中樞處理", "快速反應"], active: 3 }, duration: 3600 },
    { id: 3, step: "步驟 3：內分泌慢而持久", caption: "內分泌靠激素進入血液，到處跑、作用慢但持久，例如生長激素長期調節發育。", action: "think", prop: { kind: "text", text: "內分泌：激素經血液、慢而持久", sub: "適合長期調節", tone: "ok" }, duration: 3600, ask: { prompt: "相較於神經系統，內分泌系統的訊息傳遞有何特色？", options: ["快而短暫", "慢但持久", "只作用在腦", "不經血液"], answer: 1, hint: "激素經血液運送，作用慢但持續較久。" } },
    { id: 4, step: "步驟 4：負回饋維恆定", caption: "以體溫為例：變熱就出汗散熱、降回 37°C；偏離就被拉回，這叫負回饋。", action: "walk", prop: { kind: "cycle", nodes: ["偏離設定點", "偵測", "啟動相反反應", "回到恆定", "再監測"], active: 0 }, duration: 3600, ask: { prompt: "人體維持體溫、血糖等穩定，主要靠下列哪一種機制？", options: ["正回饋", "負回饋", "完全不調節", "隨機波動"], answer: 1, hint: "負回饋：偏離時啟動相反作用把數值拉回設定點。" } },
    { id: 5, step: "步驟 5：血糖調節例子", caption: "血糖升高，胰島分泌胰島素降血糖；過低則升糖素拉高，兩激素互相制衡回到正常。", action: "jump", prop: { kind: "balance", left: "血糖高→胰島素下降", right: "血糖低→升糖素上升", tip: "兩激素互相制衡" }, duration: 3600 },
    { id: 6, step: "步驟 6：兩系統合作", caption: "神經管即時、內分泌管長期，兩者配合才能又快又穩地維持體內恆定。", action: "point", prop: { kind: "flow", steps: ["神經：快、短", "內分泌：慢、久", "互相配合", "維持恆定"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住生理整合口訣", caption: "口訣：神經快短、內分泌慢久；負回饋拉回設定點，恆定靠兩套合作。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-human-body-1", prompt: "神經系統傳遞訊息的主要方式是？", options: ["激素經血液", "神經元傳電訊號", "擴散", "滲透"], answer: 1, hints: ["靠神經纖維", "速度快"], explanation: "神經系統由神經元以電訊號傳遞，快速且短暫。" },
    { id: "sh-bio-human-body-2", prompt: "下列何者是內分泌系統的特徵？", options: ["快而短暫", "激素經血液、慢而持久", "只作用在局部", "不調節發育"], answer: 1, hints: ["靠血液運送", "效果持久"], explanation: "內分泌系統分泌激素入血，作用慢但持久，適合長期調節。" },
    { id: "sh-bio-human-body-3", prompt: "體溫偏高時身體出汗散熱、把溫度拉回，這是？", options: ["正回饋", "負回饋", "發炎反應", "免疫作用"], answer: 1, hints: ["啟動相反作用", "拉回設定點"], explanation: "負回饋在偏離設定點時啟動相反作用（如出汗散熱），使數值回到恆定。" },
    { id: "sh-bio-human-body-4", prompt: "進食後血糖上升，體內主要分泌哪種激素來降低血糖？", options: ["升糖素", "胰島素", "腎上腺素", "生長激素"], answer: 1, hints: ["促進細胞吸收葡萄糖", "由胰島分泌"], explanation: "胰島素促進細胞吸收葡萄糖，使血糖下降；升糖素則相反，會升高血糖。" },
    { id: "sh-bio-human-body-5", prompt: "神經系統與內分泌系統最主要的差異是？", options: ["神經只存在脊椎動物", "神經快而短、內分泌慢而持久", "內分泌不需受刺激", "兩者完全相同"], answer: 1, hints: ["一個用電、一個用血", "時效不同"], explanation: "神經靠電訊號即時反應、效果短；內分泌靠血液運激素、慢而持久。" },
  ],
};

/* ========================================================================
 * 課程 8：生物（高中）— 生物科技
 * ======================================================================== */
const SH_BIO_BIOTECH: OnionLesson = {
  id: "sh-bio-biotech",
  title: "生物科技：PCR、基因轉殖與倫理",
  subject: "生物",
  topic: "生物科技",
  grade: "高三",
  stages: ["高中"],
  desc: "PCR 反覆放大 DNA、基因轉殖植入新性狀；效益與風險並存需審慎評估。",
  takeaways: [
    "PCR 三步循環：加熱解鏈 → 引子結合 → 延伸合成，可大量複製特定 DNA",
    "基因轉殖把目標基因送入受體，使其表現新性狀（如抗蟲作物）",
    "基因編輯效益（醫療、糧食）與風險（生態、倫理）並存，須審慎評估與管理",
  ],
  frames: [
    { id: 1, step: "步驟 1：生物科技在身邊", caption: "嗨！警察用 DNA 抓犯人、農民種抗蟲玉米，都靠生物科技，今天看 PCR 和基因轉殖。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：PCR 三步循環", caption: "PCR 在試管裡大量複製 DNA：先加熱解鏈、降溫讓引子結合、再延伸合成，循環放大。", action: "point", prop: { kind: "flow", steps: ["加熱解鏈（95°C）", "降溫引子結合", "延伸合成新股", "重複循環放大"], active: 3 }, duration: 3600, ask: { prompt: "PCR 第一步要把雙股 DNA 打開，需要怎麼做？", options: ["降溫", "加熱解鏈", "加引子", "加酶即可"], answer: 1, hint: "PCR 先高溫（約 95°C）使雙股變性解開。" } },
    { id: 3, step: "步驟 3：基因轉殖概念", caption: "基因轉殖：把一段目標基因（如抗蟲基因）送進另一生物，讓它表現出新性狀，例如抗蟲作物。", action: "think", prop: { kind: "text", text: "基因轉殖：植入目標基因", sub: "讓受體表現新性狀", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：轉殖操作流程", caption: "步驟：選目標基因→接入載體→轉入細胞→篩選成功株→培養成植株，一步步做到。", action: "walk", prop: { kind: "flow", steps: ["選目標基因", "接入載體", "轉入細胞", "篩選成功株"], active: 3 }, duration: 3600, ask: { prompt: "基因轉殖作物「抗蟲」，是因為被植入了什麼？", options: ["殺蟲劑", "一段抗蟲目標基因", "更多葉綠體", "肥料基因"], answer: 1, hint: "植入抗蟲基因後，作物自己能表現抗蟲蛋白質。" } },
    { id: 5, step: "步驟 5：基因編輯的倫理", caption: "基因編輯有正反觀點：支持者看重醫療與糧食效益，疑慮者擔心生態與倫理風險，需審慎評估。", action: "jump", prop: { kind: "text", text: "基因編輯：效益與風險並存", sub: "醫療糧食 vs 生態倫理", tone: "warn" }, duration: 3600 },
    { id: 6, step: "步驟 6：應用與法規管理", caption: "應用含 DNA 鑑定、基因治療、轉基因作物；各國多以法規與標示來管理潛在風險。", action: "point", prop: { kind: "flow", steps: ["DNA 鑑定", "基因治療", "轉基因作物", "法規管理風險"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：記住生物科技口訣", caption: "口訣：PCR 解鏈結引延長、基因轉殖植新性狀；效益風險兩相權。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-bio-biotech-1", prompt: "PCR 技術的主要用途是？", options: ["切割 DNA", "在試管中大量複製特定 DNA", "直接轉殖基因", "定序蛋白質"], answer: 1, hints: ["試管裡放大", "反覆循環"], explanation: "PCR（聚合酶連鎖反應）能在體外反覆循環，大量複製特定的 DNA 片段。" },
    { id: "sh-bio-biotech-2", prompt: "PCR 循環中，讓引子與模板結合發生在哪一步？", options: ["加熱解鏈", "降溫退火", "延伸合成", "純化"], answer: 1, hints: ["降溫才會配對", "退火步驟"], explanation: "降溫（退火）時引子與單股模板互補配對結合，之後才延伸。" },
    { id: "sh-bio-biotech-3", prompt: "基因轉殖作物能抗蟲，關鍵在於？", options: ["噴更多農藥", "植入並表現抗蟲基因", "改用有機肥", "改變葉片顏色"], answer: 1, hints: ["自己生產抗蟲蛋白", "不是外加農藥"], explanation: "植入抗蟲基因後，作物自身能表現抗蟲蛋白質，從而抵抗害蟲。" },
    { id: "sh-bio-biotech-4", prompt: "關於基因編輯的倫理，下列何者較為中立客觀？", options: ["應全面禁止", "完全無風險可隨意做", "效益與風險並存、需審慎評估", "只有壞處"], answer: 2, hints: ["權衡兩面", "依法規管理"], explanation: "客觀態度是權衡醫療與糧食效益，以及生態與倫理風險，並以法規管理。" },
    { id: "sh-bio-biotech-5", prompt: "為什麼 PCR 能讓極微量的 DNA 也被偵測到？", options: ["它把蛋白質變多", "它反覆循環放大、短時間複製出大量 DNA", "它直接創造 DNA", "它不需要模板"], answer: 1, hints: ["每次循環倍數增加", "指數放大"], explanation: "PCR 每次循環使模板加倍，微量 DNA 經多輪放大後達到可偵測的量。" },
  ],
};

export default [
  SH_BIO_CELL,
  SH_BIO_GENETICS,
  SH_BIO_DNA,
  SH_BIO_EVOLUTION,
  SH_BIO_ECOLOGY,
  SH_BIO_PLANT_PHYSIOLOGY,
  SH_BIO_HUMAN_BODY,
  SH_BIO_BIOTECH,
];
