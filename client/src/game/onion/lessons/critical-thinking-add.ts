/**
 * 思辨（批判性思考）系列第一批課程（critical-thinking-add.ts）
 *
 * 設計理念：對應「寶島探險家 BD 系列」分鏡腳本。
 *  - 每堂課 9 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 3 幀有 ask）
 *  - 6 題闖關（含 2 級提示與詳解）＋ 4 條以上 takeaways。
 *  - 視覺沿用洋蔥教具：text 字卡（概念對照）、flow 流程（因果/步驟）、
 *    cycle 循環（累積迴圈）、balance 天平（利弊權衡）、none（純對白）。
 *  - 傳統中文書寫；案例取自校園生活，保持中立、開放思辨，不給唯一標準答案。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 1. 局部與整體（只見樹木不見森林） ===================== */
const CT_PART_WHOLE: OnionLesson = {
  id: "ct-part-whole",
  title: "看不見的整體：局部與關係",
  subject: "思辨",
  topic: "局部與整體",
  grade: "思辨入門",
  stages: ["國中"],
  desc: "盲人摸象的故事告訴我們：只看到一小段，就以為看見全部，容易誤判。學會把不同片段拼起來。",
  takeaways: [
    "局部只是整體的一小部分，不能拿它當全部",
    "每個人站的位置不同，看到的片段也不同",
    "整體不只是片段相加，片段之間的關係也很重要",
    "下判斷前先自問：我看到的是全貌，還是其中一小段？",
  ],
  frames: [
    { step: "步驟 1：一張局部的照片", id: 1, caption: "有時候我們只看到事情的一小部分，就急著以為看見了全部。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：盲人摸到象鼻", id: 2, caption: "想像一個盲人摸到長長的象鼻，他以為大象像一條會動的水管。", action: "point", prop: { kind: "text", text: "象鼻局部", sub: "他只摸到這一段", tone: "warn" }, duration: 3400 },
    { step: "步驟 3：另一人摸到象耳", id: 3, caption: "另一個人摸到大大的象耳，他以為大象像一把扇子。", ask: { prompt: "兩個人說的完全不一樣，問題出在哪？", options: ["一定有人說謊", "他們摸到的局部不同", "大象會變形", "有人記錯了"], answer: 1, hint: "想想每個人摸到的部位本來就不同。" }, action: "think", prop: { kind: "text", text: "象耳局部", sub: "另一個人看到的片段", tone: "warn" }, duration: 3600 },
    { step: "步驟 4：把片段拼起來", id: 4, caption: "把象鼻、象耳、象腿、象尾這些片段拼在一起，才慢慢看見整頭大象。", action: "walk", prop: { kind: "flow", steps: ["象鼻", "象耳", "象腿", "象尾", "整頭象"], active: 4 }, duration: 3600 },
    { step: "步驟 5：只見樹木不見森林", id: 5, caption: "只盯著一棵樹，就會錯過整片森林；單看一個片段，很容易做出片面判斷。", ask: { prompt: "「只見樹木不見森林」最接近哪個意思？", options: ["樹木比森林重要", "只看局部忽略整體", "森林裡沒有樹", "爬山要看樹"], answer: 1, hint: "樹木代表局部，森林代表整體。" }, action: "point", prop: { kind: "text", text: "樹木＝局部　森林＝整體", sub: "別只看一棵樹", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：片段之間的關係", id: 6, caption: "整體不只是把片段相加，片段之間怎麼連結、怎麼互相影響，也很關鍵。", action: "think", prop: { kind: "flow", steps: ["片段 A", "片段 B", "兩者的關係"], active: 2 }, duration: 3600 },
    { step: "步驟 7：下判斷前先暫停", id: 7, caption: "看到一件事，先停一下問自己：我現在看到的，是完整全貌，還是其中一小段？", ask: { prompt: "看到一段很短的影片就下結論，第一步該做什麼？", options: ["馬上轉發出去", "想想還有沒有其他片段", "照感覺留言", "大家都一樣就信"], answer: 1, hint: "提醒自己也許還有沒看到的部分。" }, action: "think", prop: { kind: "text", text: "我看見全貌了嗎？", sub: "先問自己這句話", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：多找幾個角度", id: 8, caption: "多找幾個不同角度的片段互相對照，拼起來才會更接近真相。", action: "cheer", prop: { kind: "flow", steps: ["這個片段", "那個片段", "拼出全貌"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：局部拼起來才接近整體。準備接受挑戰！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-part-whole-1", prompt: "盲人摸象的故事最主要告訴我們什麼？", options: ["摸到的就是全部", "每個人只看到局部片段", "大象沒有固定形狀", "盲人都在說謊"], answer: 1, hints: ["每個人摸到的部位不同", "片段要拼起來才完整"], explanation: "每個人只摸到大象的一部分，各自的說法都對了一半，但都不完整。" },
    { id: "ct-part-whole-2", prompt: "「只見樹木不見森林」最接近下列哪個意思？", options: ["只看局部、忽略整體", "樹木比森林重要", "森林其實很小", "爬山要看樹"], answer: 0, hints: ["樹木是小片段", "森林是全部"], explanation: "比喻只看到細小的局部，卻忽略了更大、更完整的全貌。" },
    { id: "ct-part-whole-3", prompt: "看到一段很短的影片就立刻下結論，最可能犯什麼錯？", options: ["太過細心", "只看局部就概括全部", "用了太多證據", "過度客觀"], answer: 1, hints: ["影片只是片段", "不能代表整體事件"], explanation: "短片只是事件的一個片段，拿它當全部就會落入以偏概全。" },
    { id: "ct-part-whole-4", prompt: "想要真正看懂一件事，最好的做法是？", options: ["只問一個人", "多收集不同片段互相對照", "相信第一個印象", "越快決定越好"], answer: 1, hints: ["不同角度有不同片段", "對照拼圖才完整"], explanation: "多收集幾個角度、幾個片段互相對照，才能拼出較完整的全貌。" },
    { id: "ct-part-whole-5", prompt: "下列哪一項比較像「整體」，而不是局部？", options: ["一片樹葉", "一棵樹", "整片森林", "一根樹枝"], answer: 2, hints: ["局部是小部分", "整體是全部"], explanation: "森林是由許多樹組成的整體；樹葉、樹枝、一棵樹都只是它的一部分。" },
    { id: "ct-part-whole-6", prompt: "兩個人對同一件事說法不同，最合理的解釋是？", options: ["一定有人說謊", "他們站的位置、看到的片段不同", "這件事沒有真相", "他們說話聲音不同"], answer: 1, hints: ["每個人視角不同", "看到的片段不一樣"], explanation: "立場和位置不同，看到的片段就不同，說法自然會有差異，不一定有人說謊。" },
  ],
};

/* ===================== 2. 量變引起質變 ===================== */
const CT_CHANGE_SCALE: OnionLesson = {
  id: "ct-change-scale",
  title: "量變引起質變：小改變的累積",
  subject: "思辨",
  topic: "量變與質變",
  grade: "思辨入門",
  stages: ["國中"],
  desc: "每天進步一點點，看似沒什麼，累積到一個程度，就會產生讓人驚訝的大變化。",
  takeaways: [
    "小改變一開始不明顯，這叫量變",
    "累積到一個臨界點，就會出現質變",
    "壞習慣也是一天天養成的，不要輕視小處",
    "時間拉長來看，每天的小選擇都有意義",
  ],
  frames: [
    { step: "步驟 1：每天多背一個單字", id: 1, caption: "想像你每天多背一個英文單字，第一天看起來完全沒什麼改變。", action: "wave", prop: { kind: "text", text: "每天 +1 個單字", sub: "第一天沒什麼感覺", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：一週後、一個月後", id: 2, caption: "一個星期後多了七個字，一個月後多了三十個，慢慢變多，但變化還是不大。", action: "point", prop: { kind: "cycle", nodes: ["每天累積", "一週", "一個月"], active: 2 }, duration: 3400 },
    { step: "步驟 3：累積到臨界點", id: 3, caption: "持續好幾個月，你忽然發現自己能讀懂以前看不懂的短文了。", ask: { prompt: "從「每天一個字」到「能讀短文」，中間發生了什麼？", options: ["突然發生奇蹟", "小改變累積到一個程度", "本來就會", "運氣好"], answer: 1, hint: "改變不是一天發生的。" }, action: "think", prop: { kind: "text", text: "量變 → 質變", sub: "累積到臨界點", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：這就是量變到質變", id: 4, caption: "一點一點的改變叫量變；到了臨界點出現全新的能力，叫質變。", action: "point", prop: { kind: "flow", steps: ["每天小改變", "不斷累積", "臨界點", "全新樣貌"], active: 3 }, duration: 3600 },
    { step: "步驟 5：壞習慣也會累積", id: 5, caption: "反過來說，每天拖延一點、耍廢一下，一開始也沒感覺，久了差距會很大。", ask: { prompt: "每天拖延十分鐘，久了最可能怎樣？", options: ["完全沒有影響", "累積起來變成大問題", "成績自動變好", "同學都不會發現"], answer: 1, hint: "小事情會一直累積。" }, action: "think", prop: { kind: "text", text: "小壞習慣 × 很多天", sub: "也會帶來大改變", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：不要小看一點點", id: 6, caption: "不要因為改變很小就放棄，時間是放大鏡，會把每天的選擇放大。", action: "walk", prop: { kind: "flow", steps: ["今天的小選擇", "很多天之後", "看起來巨大的差距"], active: 2 }, duration: 3400 },
    { step: "步驟 7：耐心等待臨界點", id: 7, caption: "質變常常在你快放棄時才出現，這就是為什麼要堅持下去。", ask: { prompt: "努力了一陣子還沒看到改變，最好的態度是？", options: ["馬上放棄", "理解累積還沒到臨界點，繼續", "一定是方法錯", "等天上掉禮物"], answer: 1, hint: "回顧一下累積的過程。" }, action: "cheer", prop: { kind: "text", text: "堅持到臨界點", sub: "改變會在後面出現", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：把時間拉長看", id: 8, caption: "把時間拉長到一年、兩年，今天的一個小決定，意義就完全不同了。", action: "point", prop: { kind: "cycle", nodes: ["今天", "三個月", "一年", "兩年後"], active: 3 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：小改變累積久了，會變成大不同。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-change-scale-1", prompt: "「量變引起質變」最接近下列哪個意思？", options: ["瞬間就會改變", "小改變長期累積會帶來大變化", "數字越大越好", "質量決定一切"], answer: 1, hints: ["重點是累積", "一開始小、後來大"], explanation: "點點滴滴的小改變累積到臨界點，就會出現明顯、不一樣的新狀態。" },
    { id: "ct-change-scale-2", prompt: "每天只進步一點點，為什麼長期差這麼多？", options: ["因為運氣", "因為每天的進步不斷累加", "因為老師比較好", "因為同學很笨"], answer: 1, hints: ["一天一點，很多天就很多", "時間把它放大了"], explanation: "每天的小進步會像滾雪球一樣累積，拉長時間看差距就變大。" },
    { id: "ct-change-scale-3", prompt: "下列哪個最像「質變」？", options: ["今天多喝一口水", "終於能跑完以前跑不完的操場", "今天多寫一個字", "今天早十分鐘起床"], answer: 1, hints: ["是能力或狀態的明顯躍升", "不是單次的小動作"], explanation: "能跑完以前跑不完的操場，是能力出現了階段性的躍升，屬於質變。" },
    { id: "ct-change-scale-4", prompt: "關於壞習慣，下列說法哪個正確？", options: ["偶爾一次完全沒關係", "小壞習慣累積久了也會變大問題", "壞習慣不會影響成績", "年紀大自然會好"], answer: 1, hints: ["壞習慣也會累積", "不要輕視小處"], explanation: "壞習慣和好習慣一樣會量變累積，久了同樣會造成明顯的壞影響。" },
    { id: "ct-change-scale-5", prompt: "努力一陣子還沒看到成果，最合理的想法是？", options: ["我不是讀書的料", "累積可能還沒到臨界點，再堅持看看", "乾脆放棄", "一定是別人作弊"], answer: 1, hints: ["質變需要時間", "臨界點之前看不到明顯變化"], explanation: "很多改變在臨界點之前看起來都沒什麼，堅持才可能等到質變。" },
    { id: "ct-change-scale-6", prompt: "這個概念提醒我們看待日常小事時要？", options: ["覺得小事都不重要", "把時間拉長，看每天小選擇的長遠影響", "只看今天成績", "不用管未來"], answer: 1, hints: ["時間是放大鏡", "今天的選擇有意義"], explanation: "拉長時間視角，每天的小選擇、小累積都會在未後發揮巨大作用。" },
  ],
};

/* ===================== 3. 內因與外因 ===================== */
const CT_INTERNAL_EXTERNAL: OnionLesson = {
  id: "ct-internal-external",
  title: "內因與外因：改變的力量來自哪裡",
  subject: "思辨",
  topic: "內因與外因",
  grade: "思辨入門",
  stages: ["國中"],
  desc: "一件事的結果，是自己內在條件和外在環境一起造成的。不要只怪自己，也不要只怪環境。",
  takeaways: [
    "內因：自己的態度、習慣、能力，相對可以掌控",
    "外因：環境、運氣、他人，常常無法完全掌控",
    "結果是兩者共同作用，不要單方面歸因",
    "先把力氣放在能改變的內因，再理解不能控制的外因",
  ],
  frames: [
    { step: "步驟 1：小苗長得不好", id: 1, caption: "一株小苗長得不好，只看小苗，你可能會說：一定是種子不好。", action: "wave", prop: { kind: "text", text: "小苗長不好", sub: "先怪種子？", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：看看外在環境", id: 2, caption: "可是低頭一看，土壤乾旱、很久沒下雨、也沒什麼陽光。", ask: { prompt: "小苗長不好，除了種子本身，還要看什麼？", options: ["只看種子就好", "土壤、水分、陽光這些環境", "不用看任何東西", "看別人怎麼罵它"], answer: 1, hint: "小苗是長在環境裡的。" }, action: "point", prop: { kind: "text", text: "土壤乾旱、沒陽光", sub: "這是外在條件", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：分辨內因和外因", id: 3, caption: "種子本身的活力是內因；陽光、土壤、雨水是外因。小苗長得好不好，兩者都有影響。", action: "point", prop: { kind: "flow", steps: ["內因：種子活力", "外因：陽光土壤雨水", "一起影響生長"], active: 2 }, duration: 3600 },
    { step: "步驟 4：考試沒考好", id: 4, caption: "考試成績不理想，有人說「都我不夠努力」，也有人說「都題目太難」。", action: "think", prop: { kind: "text", text: "都怪自己？都怪題目？", sub: "兩邊都只看到一邊", tone: "warn" }, duration: 3400 },
    { step: "步驟 5：其實兩邊都有", id: 5, caption: "自己的複習方式是內因；題目難易、考場狀況是外因，結果是兩邊一起造成的。", ask: { prompt: "下列哪一項比較像「內因」？", options: ["今天的天氣", "自己的讀書習慣", "考卷難度", "考場冷氣"], answer: 1, hint: "內因是屬於自己、能調整的部分。" }, action: "point", prop: { kind: "flow", steps: ["內因：自己的準備", "外因：題目與環境", "共同決定成績"], active: 2 }, duration: 3600 },
    { step: "步驟 6：不要單方面歸因", id: 6, caption: "只把責任全攬在自己身上，或全推給環境，都是只看了一邊。", action: "think", prop: { kind: "text", text: "不只怪自己，也不只怪環境", sub: "兩邊一起看", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：先掌控能改變的", id: 7, caption: "外因很多無法控制，但自己的態度、方法是可以調整的，先把力氣放在這裡。", ask: { prompt: "成績不理想，最該先做什麼？", options: ["全部歸咎自己很笨", "檢討自己可以調整的讀書方法", "什麼都不做等運氣", "罵題目出壞了"], answer: 1, hint: "先動手改能掌控的部分。" }, action: "cheer", prop: { kind: "text", text: "先調整可控的內因", sub: "再接受不可控的外因", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：理解不是藉口", id: 8, caption: "知道有外在因素，不是用來當藉口逃避，而是幫你客觀看待事情。", action: "point", prop: { kind: "flow", steps: ["看見外因", "不藉口逃避", "調整內因"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：結果是內因外因一起造成的。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-internal-external-1", prompt: "下列哪一項比較屬於「內因」？", options: ["今天的天氣", "自己的練習態度", "考場位置", "同學的表現"], answer: 1, hints: ["內因是自己身上、能掌控的", "外在環境是外因"], explanation: "自己的態度、習慣、方法是內在條件，相對可以由自己調整。" },
    { id: "ct-internal-external-2", prompt: "下列哪一項比較屬於「外因」？", options: ["讀書計畫", "專注力", "突然下大雨影響戶外活動", "自己的筆記方式"], answer: 2, hints: ["外因來自外部環境", "不是自己能完全決定的"], explanation: "天氣、環境、他人反應這類外在條件，屬於我們很難完全掌控的外因。" },
    { id: "ct-internal-external-3", prompt: "考試成績不好，下列哪種想法比較客觀？", options: ["我就是很笨", "都怪題目太爛", "自己的準備和題目環境都有影響", "運氣差就算了"], answer: 2, hints: ["不要只看一邊", "內因外因一起考慮"], explanation: "成績是自己的準備（內因）和題目、環境（外因）共同造成的，單怪一邊都不客觀。" },
    { id: "ct-internal-external-4", prompt: "面對一件不如意的事，最該先把力氣放在哪裡？", options: ["抱怨環境", "調整自己能改變的內在條件", "等別人幫忙", "反覆自責"], answer: 1, hints: ["先做可控的事", "外因不一定改得了"], explanation: "外因常難以掌控，先把力氣放在自己能調整的態度與方法上，最實際。" },
    { id: "ct-internal-external-5", prompt: "「理解有外在因素」的正確用途是？", options: ["拿來當藉口逃避", "幫助客觀看待事情", "證明自己不用努力", "責怪環境"], answer: 1, hints: ["理解不是藉口", "是為了看清楚全貌"], explanation: "看見外因是為了客觀分析，不是用來逃避自己可以改進的部分。" },
    { id: "ct-internal-external-6", prompt: "小苗長不好，只怪種子不好，最像哪個思考錯誤？", options: ["太重視環境", "只看內因、忽略外因", "太講究證據", "過度樂觀"], answer: 1, hints: ["只盯著種子", "沒看土壤陽光"], explanation: "只怪種子（內因），忽略了陽光、土壤（外因），是單方面歸因。" },
  ],
};

/* ===================== 4. 證據與推論 ===================== */
const CT_EVIDENCE_INFERENCE: OnionLesson = {
  id: "ct-evidence-inference",
  title: "證據與推論：哪些想法有依據？",
  subject: "思辨",
  topic: "證據與推論",
  grade: "思辨入門",
  stages: ["國中"],
  desc: "窗邊有一個書包，你會推論什麼？學會分開「我看到的」和「我猜的」，別把猜想當了事實。",
  takeaways: [
    "證據：親眼看到、可以觀察的事實",
    "推論：根據證據做出的猜測，不等於事實",
    "證據越多，推論越可靠",
    "不要把腦中的猜想，直接當成已經確定的事",
  ],
  frames: [
    { step: "步驟 1：窗邊有一個書包", id: 1, caption: "你走到教室，看到窗邊放著一個書包，附近都沒有人。", action: "wave", prop: { kind: "text", text: "窗邊有一個書包", sub: "這是你看到的", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：你心裡開始猜", id: 2, caption: "腦袋馬上出現好多猜想：是誰遺忘的？主人現在在哪？待會會回來拿嗎？", ask: { prompt: "「窗邊有書包」是你看到的，它屬於？", options: ["推論", "證據", "幻想", "結論"], answer: 1, hint: "親眼看到、可以確認的是什麼。" }, action: "think", prop: { kind: "text", text: "主人是誰？會回來嗎？", sub: "這些是你的猜想", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：分開證據和推論", id: 3, caption: "「有書包」是證據；「主人遺忘了」是推論。兩者不一樣，別混在一起。", action: "point", prop: { kind: "flow", steps: ["證據：看到書包", "推論：主人遺忘了", "兩者不一樣"], active: 2 }, duration: 3600 },
    { step: "步驟 4：多一點證據", id: 4, caption: "湊近一看，書包上有名條，旁邊還有一張字條寫著「忘記帶，待會回來拿」。", action: "walk", prop: { kind: "text", text: "有名條、有待取字條", sub: "新證據出現了", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：推論跟著修正", id: 5, caption: "有了新證據，我們的推論就更準：這是同學暫放、待會回來拿的書包。", ask: { prompt: "為什麼要繼續找新證據？", options: ["為了證明自己最聰明", "讓推論更接近真相", "為了浪費時間", "不用找也可以"], answer: 1, hint: "證據越多，猜測越可靠。" }, action: "point", prop: { kind: "flow", steps: ["一開始的猜測", "補上新證據", "更準的推論"], active: 2 }, duration: 3600 },
    { step: "步驟 6：單一證據容易猜錯", id: 6, caption: "如果只靠「有書包」這一項證據，就很容易猜錯；證據太少，推論就飄在天上。", action: "think", prop: { kind: "text", text: "證據太少 → 推論容易錯", sub: "別急著下結論", tone: "warn" }, duration: 3400 },
    { step: "步驟 7：停一下，分清兩者", id: 7, caption: "下次你很確定一件事時，問自己：這是我親眼看到的證據，還是我腦子裡的推論？", ask: { prompt: "同學遲到了，下列哪個是「證據」？", options: ["他一定是偷懶", "上課鐘響後他才走進教室", "他故意搗亂", "他不喜歡這堂課"], answer: 1, hint: "證據是實際觀察到的畫面。" }, action: "think", prop: { kind: "text", text: "我看到的？還是我猜的？", sub: "停一下分清楚", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：好推論需要好證據", id: 8, caption: "好的判斷，是先累積夠多證據，再謹慎地下推論，而不是把第一個猜測當成事實。", action: "cheer", prop: { kind: "flow", steps: ["累積證據", "謹慎推論", "不下過早結論"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：證據是看到的，推論是猜到的。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-evidence-inference-1", prompt: "下列哪一項比較像「證據」？", options: ["他一定很生氣", "他把筆用力摔在桌上", "他討厭大家", "他今天運氣很差"], answer: 1, hints: ["證據是可以觀察到的", "其他都是猜測"], explanation: "「把筆摔在桌上」是看得見的行為，屬於證據；其他都是從這個行為猜出來的推論。" },
    { id: "ct-evidence-inference-2", prompt: "下列哪一項比較像「推論」？", options: ["地上有一灘水", "窗戶是開著的", "這水一定是有人打翻的", "水灘在桌子旁邊"], answer: 2, hints: ["推論是腦子裡的解釋", "其餘是看到的事實"], explanation: "「一定是有人打翻的」是對現象的解釋和猜測，屬於推論，還需要更多證據。" },
    { id: "ct-evidence-inference-3", prompt: "為什麼單靠一個證據，推論容易出錯？", options: ["因為證據都會說謊", "因為資訊太少，可能有其他解釋", "因為推論一定要很多人同意", "因為證據不能用來判斷"], answer: 1, hints: ["一個證據可能對應好多種解釋", "需要更多線索"], explanation: "單一線索往往能說好幾個故事，證據不足時，下的結論很可能是其中一種巧合。" },
    { id: "ct-evidence-inference-4", prompt: "看到新的相反證據，最好的做法是？", options: ["無視它", "修正自己本來的推論", "怪證據錯了", "馬上更生氣"], answer: 1, hints: ["推論本來就該跟著證據走", "真相比面子重要"], explanation: "推論是暫時的猜想，發現新證據就該跟著修正，而不是硬撐原本的結論。" },
    { id: "ct-evidence-inference-5", prompt: "下判斷之前，最該自問什麼？", options: ["我這樣想很酷嗎", "這是我看到的證據，還是我腦中的猜測", "大家會不會認同", "我會不會被罵"], answer: 1, hints: ["分開事實和猜想", "別把猜測當事實"], explanation: "提醒自己哪些是觀察到的事實、哪些是自己的解釋，才不會把猜想講成鐵錚錚的事實。" },
    { id: "ct-evidence-inference-6", prompt: "下列哪種行為最「危險」？", options: ["主動找更多證據", "把第一個直覺當成確定事實", "承認自己還不確定", "問別人看到的狀況"], answer: 1, hints: ["直覺常只是猜測", "未經查證就當真"], explanation: "把腦中第一個冒出来的解釋直接當成事實，最容易造成誤會和錯誤判斷。" },
  ],
};

/* ===================== 5. 相關與因果 ===================== */
const CT_CORRELATION_CAUSATION: OnionLesson = {
  id: "ct-correlation-causation",
  title: "相關與因果：一起發生就代表有因果？",
  subject: "思辨",
  topic: "相關與因果",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "冰淇淋賣越好、溺水的人越多，是冰淇淋造成溺水嗎？學會分辨「一起發生」和「真的造成」。",
  takeaways: [
    "相關：兩件事常常一起出現、同步變化",
    "因果：一件事真的會造成另一件事",
    "一起出現不代表有因果，可能有隱藏的第三因素",
    "看到相關，先問：真的是 A 造成 B 嗎？",
  ],
  frames: [
    { step: "步驟 1：兩個一起變大的數字", id: 1, caption: "夏天來了，冰淇淋賣得更多，同時溺水的紀錄也變多了。", action: "wave", prop: { kind: "text", text: "冰淇淋賣更多　溺水也變多", sub: "兩件事一起上升", tone: "warn" }, duration: 3400 },
    { step: "步驟 2：有人說冰淇淋造成溺水", id: 2, caption: "於是有人下結論：都是冰淇淋害的，叫大家別再吃冰淇淋。", ask: { prompt: "冰淇淋賣越多、溺水越多，兩件事的關係最準確的說法是？", options: ["冰淇淋一定造成溺水", "它們一起出現（相關）", "兩者毫無關係", "溺水造成冰淇淋暢銷"], answer: 1, hint: "它們是「一起變化」，不一定誰造成誰。" }, action: "think", prop: { kind: "text", text: "是冰淇淋害的嗎？", sub: "這個結論下太快", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：找出隱藏的第三因素", id: 3, caption: "真相是天氣變熱了：天一熱，買冰淇淋的人變多，去玩水的人也變多。", action: "point", prop: { kind: "flow", steps: ["天氣變熱", "買冰淇淋的人變多", "去玩水的人變多"], active: 2 }, duration: 3600 },
    { step: "步驟 4：第三因素同時影響兩者", id: 4, caption: "天氣這個隱藏因素，同時讓兩件事變多。它們只是相關，不是誰造成誰。", ask: { prompt: "這個例子告訴我們，兩件事一起出現時要小心什麼？", options: ["一定有因果", "可能有第三因素在中間", "馬上去禁止冰淇淋", "數字會說謊"], answer: 1, hint: "回想是什麼讓兩件事一起變多。" }, action: "point", prop: { kind: "text", text: "相關 ≠ 因果", sub: "中間可能有第三因素", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：早睡和成績好", id: 5, caption: "再看一個：習慣早睡的同學，成績往往比較好。那早睡一定能讓成績變好嗎？", action: "think", prop: { kind: "text", text: "早睡的人成績比較好？", sub: "兩者有關，但誰造成誰？", tone: "warn" }, duration: 3400 },
    { step: "步驟 6：可能是自律這個第三因素", id: 6, caption: "也許是「自律」這個特質，讓人既早睡、又認真讀書，而不是早睡直接帶來高分。", ask: { prompt: "下列哪個最像這裡的「第三因素」？", options: ["房間的燈光", "自律、會安排時間的習慣", "早餐吃什麼", "學校的位置"], answer: 1, hint: "什麼特質會同時讓人早睡又會讀書？" }, action: "point", prop: { kind: "flow", steps: ["自律", "早睡", "成績較好"], active: 2 }, duration: 3600 },
    { step: "步驟 7：巧合也會一起出現", id: 7, caption: "有時候兩件事一起發生只是湊巧，比如你帶傘的時候剛好沒下雨，不代表你的傘讓天氣變好。", action: "think", prop: { kind: "text", text: "有時候只是巧合", sub: "不用硬湊因果故事", tone: "warn" }, duration: 3400 },
    { step: "步驟 8：下因果結論前先停一下", id: 8, caption: "下次看到兩件事一起變化，先問：真的是 A 造成 B 嗎？有沒有第三個因素？", action: "cheer", prop: { kind: "flow", steps: ["看到相關", "尋找第三因素", "謹慎下因果結論"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：相關不等於因果。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-correlation-causation-1", prompt: "「相關」最準確的意思是？", options: ["一件事造成另一件事", "兩件事常常一起出現、同步變化", "兩件事完全無關", "兩件事一定同時發生"], answer: 1, hints: ["相關是「一起出現」", "不是誰決定誰"], explanation: "相關只表示兩個變量一起變動，至於是不是誰造成誰，還要另外驗證。" },
    { id: "ct-correlation-causation-2", prompt: "冰淇淋和溺水都變多，真正的原因比較可能是？", options: ["冰淇淋害大家溺水", "天氣變熱同時影響兩者", "溺水的人愛吃冰淇淋", "兩者剛好都在下降"], answer: 1, hints: ["夏天到了", "一個因素同時影響兩件事"], explanation: "天氣變熱同時讓吃冰淇淋和去玩水的人都變多，這是典型的第三因素。" },
    { id: "ct-correlation-causation-3", prompt: "看到 A 和 B 一起增加，最穩健的態度是？", options: ["直接認定 A 造成 B", "先懷疑可能有第三因素或只是相關", "馬上去禁止 A", "認為數字一定錯了"], answer: 1, hints: ["不要急著講因果", "多找一層原因"], explanation: "相關只是線索，不是結論；在斷定因果前，先想想有沒有其他共同原因。" },
    { id: "ct-correlation-causation-4", prompt: "「自從我帶了幸运筆，考試就進步了」，最該提醒他什麼？", options: ["幸运筆真有效", "可能只是巧合或其他因素", "以後都不能帶別的筆", "成績跟筆有關"], answer: 1, hints: ["帶筆和成績一起出現", "不代表筆造成進步"], explanation: "帶幸運筆和成績進步同時發生，可能只是巧合，真正的因素也許是考前認真複習。" },
    { id: "ct-correlation-causation-5", prompt: "下列哪個才比較像真正的「因果」？", options: ["看到冰淇淋和溺水一起增加", "用力推桌子，桌子開始滑動", "兩件事都在夏天變多", "穿紅襪那天心情好"], answer: 1, hints: ["你做的事直接造成結果", "有明確的作用過程"], explanation: "用力推是因、桌子滑動是果，兩者之間有清楚的作用過程，這才是因果。" },
    { id: "ct-correlation-causation-6", prompt: "要判斷「A 造成 B」，最需要做的是？", options: ["看大聲的人怎麼說", "找證據解釋 A 如何影響 B，並排除其他可能", "看 A 和 B 是不是同時出現", "投票表決"], answer: 1, hints: ["因果需要機制和證據", "不能只看同步"], explanation: "要證明因果，需要說明 A 透過什麼過程影響 B，並排除第三因素與巧合，而不是只看它們一起出現。" },
  ],
};

/* ===================== 6. 權衡與取舍（天平） ===================== */
const CT_BALANCE_TRADEOFF: OnionLesson = {
  id: "ct-balance-tradeoff",
  title: "權衡與取舍：沒有完美方案",
  subject: "思辨",
  topic: "權衡與取舍",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "現實選擇很少完美，每個方案都有利有弊。學會把收益和代價放上天平，再做決定。",
  takeaways: [
    "大多數選擇沒有完美答案，每個選項都有利弊",
    "權衡要同時看短期好處和長期代價",
    "不要只看吸引人的好處，忽略背後代價",
    "依自己最重視的目標做取舍，而不是追求完美",
  ],
  frames: [
    { step: "步驟 1：每個選擇都有兩面", id: 1, caption: "放學後，你想先看卡通放鬆，又想早一點寫完作業。這兩個選項都不是完美的。", action: "wave", prop: { kind: "balance", left: "先玩：當下快樂", right: "先寫：晚上輕鬆" }, duration: 3400 },
    { step: "步驟 2：先玩的代價", id: 2, caption: "先看卡通當下很快樂，但晚上可能要熬夜寫作業，明天精神變差。", ask: { prompt: "「先看卡通」這個選擇的代價是？", options: ["沒有任何代價", "晚上可能熬夜、明天很累", "功課自動消失", "成績變更好"], answer: 1, hint: "想想玩完之後呢。" }, action: "think", prop: { kind: "balance", left: "當下快樂", right: "晚上熬夜" }, duration: 3600 },
    { step: "步驟 3：先寫的代價", id: 3, caption: "先寫作業當下有點無聊，但晚上可以安心玩，隔天也有精神。", action: "point", prop: { kind: "balance", left: "當下有點無聊", right: "晚上安心玩" }, duration: 3400 },
    { step: "步驟 4：把利弊放上天平", id: 4, caption: "所謂權衡，就是把每個選項的好處和代價，都放上天平兩端一起看。", ask: { prompt: "權衡一個選擇時，最容易漏掉什麼？", options: ["好處", "背後要付出的代價", "別人的看法", "選項的名字"], answer: 1, hint: "人容易只被好處吸引。" }, action: "point", prop: { kind: "balance", left: "好處", right: "代價" }, duration: 3600 },
    { step: "步驟 5：短期和長期不同步", id: 5, caption: "有些選擇短期很舒服，長期卻有代價；要把時間拉長一起看。", action: "think", prop: { kind: "flow", steps: ["短期感受", "長遠影響", "一起權衡"], active: 2 }, duration: 3400 },
    { step: "步驟 6：不要追求完美", id: 6, caption: "世界上很少有只有好處、沒有代價的方案。與其等完美選項，不如選一個最符合目標的。", ask: { prompt: "一直等待「完美方案」，通常會怎樣？", options: ["最後一定找到", "錯過很多可以做決定的時機", "變得更快樂", "沒有任何影響"], answer: 1, hint: "完美選項幾乎不存在。" }, action: "think", prop: { kind: "text", text: "沒有完美選項，只有適合取舍", sub: "別卡在完美主義", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：先想自己最重視什麼", id: 7, caption: "做決定前先問：這次我最重視的是什麼？是快樂、成績、還是休息？依這個目標來取捨。", action: "point", prop: { kind: "balance", left: "我最重視的目標", right: "願意付出的代價" }, duration: 3400 },
    { step: "步驟 8：接受選擇的代價", id: 8, caption: "選了就代表放棄另一邊的好處。理解這點，事後就不會一直後悔。", action: "cheer", prop: { kind: "flow", steps: ["看清利弊", "依目標取舍", "接受代價"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：沒有完美方案，只有權衡後的取舍。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-balance-tradeoff-1", prompt: "「權衡與取舍」最核心的意思是？", options: ["找到完全沒有缺點的選項", "每個選項都有利弊，依目標做選擇", "哪個爽選哪個", "讓別人決定就好"], answer: 1, hints: ["沒有完美選項", "要比較好處和代價"], explanation: "現實選擇多半沒有完美答案，要把收益和代價一起放在天平上，依自己最重視的目標取舍。" },
    { id: "ct-balance-tradeoff-2", prompt: "只看一個選項「很好的那一面」最容易？", options: ["做出最明智決定", "忽略背後要付出的代價", "讓選擇變簡單", "避免後悔"], answer: 1, hints: ["人容易被好處吸引", "代價常被藏起來"], explanation: "只看亮點不看代價，事後往往要面對原本沒預料到的缺點。" },
    { id: "ct-balance-tradeoff-3", prompt: "做選擇時為什麼要把「長期」也考慮進去？", options: ["因為短期都不重要", "有些代價要很久之後才浮現", "長期一定更好", "老師規定的"], answer: 1, hints: ["小代價會累積", "今天的選擇影響未來"], explanation: "有些決定短期看起來很好，但代價會隨時間累積拉長，所以要一併評估。" },
    { id: "ct-balance-tradeoff-4", prompt: "下列哪種態度最健康？", options: ["一定要選到完美選項才行動", "承認沒有完美，選一個最符合目標的", "隨便選一個算了", "永遠不要做決定"], answer: 1, hints: ["完美選項很少見", "依目標取捨"], explanation: "等待完美往往錯失時機；看清利弊後選一個最貼近自己目標的，再接受代價，比較實際。" },
    { id: "ct-balance-tradeoff-5", prompt: "選了 A 方案，通常意味著？", options: ["A 方案一定最好", "放棄了 B 方案的某些好處", "不用付出任何代價", "以後都不用再選"], answer: 1, hints: ["取捨就是選一邊、放棄另一邊", "魚與熊掌不可兼得"], explanation: "做選擇就是同時放棄其他選項的部分好處，理解這點比較不會事後無限後悔。" },
    { id: "ct-balance-tradeoff-6", prompt: "下列哪個做法最像「理性權衡」？", options: ["憑直覺馬上決定", "列出各選項的好處與代價再決定", "跟多數人選一樣就對", "哪個看起來划算選哪個"], answer: 1, hints: ["把利弊攤開來看", "不只看一面"], explanation: "把每個選項的收益和代價都寫下來、一起比較，再依目標決定，就是理性權衡。" },
  ],
};

const CRITICAL_THINKING_LESSONS: OnionLesson[] = [
  CT_PART_WHOLE,
  CT_CHANGE_SCALE,
  CT_INTERNAL_EXTERNAL,
  CT_EVIDENCE_INFERENCE,
  CT_CORRELATION_CAUSATION,
  CT_BALANCE_TRADEOFF,
];

export default CRITICAL_THINKING_LESSONS;
