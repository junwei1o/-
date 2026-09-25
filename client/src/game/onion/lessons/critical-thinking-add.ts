/**
 * 思辨（批判性思考）系列第一批課程（critical-thinking-add.ts）
 *
 * 設計理念：對應「寶島探險家 BD 系列」分鏡腳本。
 *  - 每堂課 9 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 3 幀有 ask）
 *  - 6 題闖關（含 2 級提示與詳解）＋ 4 條以上 takeaways。
 *  - 教具多元：text 字卡、flow 流程、cycle 循環、balance 天平、bars 長條、
 *    pie 圓餅、numberLine 數線，把抽象思辨概念具象化，並嚴守圖解一致。
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
    { step: "步驟 1：一張局部的照片", id: 1, caption: "你有過這種經驗嗎？只看到事情的一小段，就急著下定論，結果常常出錯。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：盲人摸到象鼻", id: 2, caption: "從前有個盲人摸到長長的象鼻，他很確定：原來大象就像一條會動的水管。", action: "point", prop: { kind: "text", text: "象鼻＝水管？", sub: "他只摸到這一段", tone: "warn" }, duration: 3400 },
    { step: "步驟 3：另一人摸到象耳", id: 3, caption: "沒想到另一個人摸到大大的象耳，他卻說：大象根本是一把打開的扇子啊。", ask: { prompt: "兩個人講的完全相反，最合理的解釋是什麼？", options: ["一定有一個人在說謊", "大象一下變水管一下變扇子", "兩人的記性都不太好", "兩人站的位置、摸到的部位不同"], answer: 3, hint: "想想他們各自碰到的身體部位本來就不一樣。" }, action: "think", prop: { kind: "text", text: "象耳＝扇子？", sub: "看到的片段不同", tone: "warn" }, duration: 3600 },
    { step: "步驟 4：把四個片段拼起來", id: 4, caption: "把象鼻、象耳、象腿、象尾一個個拼在一起，這才慢慢長出一頭完整的大象。", action: "walk", prop: { kind: "flow", steps: ["象鼻", "象耳", "象腿", "象尾", "整頭象"], active: 4 }, duration: 3600 },
    { step: "步驟 5：每人只看四分之一", id: 5, caption: "其實每個人只摸到整頭象的一小部分，大約就是全部的 1/4 左右。", ask: { prompt: "這個圓餅想告訴我們什麼？", options: ["局部只是整體的一小部分", "摸到的那塊就是全部", "整頭象等於象耳加象鼻", "盲人摸象是因為看不到顏色"], answer: 0, hint: "四個片段各占一點，加起來才是全部。" }, action: "point", prop: { kind: "pie", a: 1, b: 4, label: "1/4" }, duration: 3600 },
    { step: "步驟 6：整體不是片段相加", id: 6, caption: "注意哦，整體不是把片段硬湊起來；片段之間怎麼連結、怎麼互相影響，也很關鍵。", action: "think", prop: { kind: "flow", steps: ["片段 A", "片段 B", "兩者的關係"], active: 2 }, duration: 3400 },
    { step: "步驟 7：下判斷前先暫停", id: 7, caption: "看到熱門新聞先別急著轉發，問自己一句：我看到的是全貌，還只是其中一段？", ask: { prompt: "看到一段短片就想罵人，第一步該做什麼？", options: ["馬上留言罵個痛快", "跟著大家一起轉發", "想想還有沒有其他角度的畫面", "誰聲音大就聽誰的"], answer: 2, hint: "提醒自己也許有沒看到的片段。" }, action: "think", prop: { kind: "text", text: "我看見全貌了嗎？", sub: "先問自己這句話", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：多找幾個角度", id: 8, caption: "多問幾個在現場的人、多看幾段不同畫面，互相對照，才會更接近事情的真相。", action: "cheer", prop: { kind: "flow", steps: ["這個片段", "那個片段", "拼出全貌"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備接受挑戰", id: 9, caption: "記住：局部拼起來才接近整體。預備好了嗎？準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct-part-whole-1", prompt: "盲人摸象的故事，最主要想告訴我們什麼？", options: ["摸到的那塊就代表全部", "每個人都只看到局部的一小段", "大象其實沒有固定形狀", "盲人說話都不可相信"], answer: 1, hints: ["四人摸到的部位不同", "片段要拼起來才完整"], explanation: "每個人只摸到大象的一部分，各自對了一半，把大家的片段拼起來才是完整的大象。" },
    { id: "ct-part-whole-2", prompt: "「只見樹木不見森林」最接近哪個意思？", options: ["只看局部，忽略了更大的整體", "樹木比整片森林還要重要", "森林裡面其實一棵樹都沒有", "爬山時要先數清楚有幾棵樹"], answer: 0, hints: ["樹木是小片段", "森林代表全貌"], explanation: "樹木比喻細小的局部，森林比喻完整的全貌，這句話就是提醒人別只見小處、不見大局。" },
    { id: "ct-part-whole-3", prompt: "只看過一段十秒短片，就斷定整件事的對錯，最容易犯什麼錯？", options: ["看得太仔細、太鑽研細節", "用了太多不同角度的證據", "拿單一片段就概括整件事", "變得太客觀、太過冷靜"], answer: 2, hints: ["短片只是事件的一部份", "不能代表整個過程"], explanation: "十秒短片只是事件的一個片段，拿它代表整個事件，就犯了以偏概全的毛病。" },
    { id: "ct-part-whole-4", prompt: "想真正看懂一件事，下列哪個做法最可靠？", options: ["只問你最先遇到的那個人", "相信自己第一眼的直覺就對", "越快下決定的人越厲害", "多收集不同片段，再互相對照"], answer: 3, hints: ["不同角度有不同片段", "對照拼圖才完整"], explanation: "幾個角度、幾段片段互相對照拼起來，才會拼出比較完整的全貌，而不是靠單一印象。" },
    { id: "ct-part-whole-5", prompt: "下列哪一項最像「整體」，而不是局部？", options: ["整片森林", "地上撿到的一片落葉", "畫布角落的一個顏料點", "樂團裡的一把小提琴"], answer: 0, hints: ["局部是被組成的小部分", "整體是全部加起來"], explanation: "森林由許多樹組成，是完整的全體；落葉、顏料點、一把琴都只是它的一小部分。" },
    { id: "ct-part-whole-6", prompt: "兩個同學對同一件事說法差很多，最合理的看法是？", options: ["一定有一個人在說謊", "這件事根本沒有真相", "兩人站的位置、看到的片段不同", "誰的聲音比較大誰就對"], answer: 2, hints: ["每個人視角不同", "看到的片段不一樣"], explanation: "立場和位置不同，看到的片段就不同，說法自然有差異，不一定是有人故意說謊。" },
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
    { step: "步驟 1：每天多背一個單字", id: 1, caption: "你每天只多背一個英文單字，第一天回頭看，根本察覺不出有什麼改變。", action: "wave", prop: { kind: "text", text: "每天＋1 個單字", sub: "第一天沒什麼感覺", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：累積的字數慢慢變多", id: 2, caption: "一星期後是 7 個，一個月後 30 個，半年下來已經累積到 180 個，量愈來愈大。", action: "point", prop: { kind: "bars", items: [{ label: "一星期", value: 7 }, { label: "一個月", value: 30 }, { label: "半年", value: 180 }], unit: "個單字", active: 2 }, duration: 3600 },
    { step: "步驟 3：忽然能讀懂短文", id: 3, caption: "持續好幾個月，有一天你忽然發現，以前看不懂的英文短文，現在居然讀得懂了。", ask: { prompt: "從「每天一個字」到「能讀短文」，中間到底發生了什麼？", options: ["突然發生了奇蹟", "小改變累積到一個程度", "本來就會，只是忘記", "剛好那天運氣很好"], answer: 1, hint: "改變不是一天突然冒出來的。" }, action: "think", prop: { kind: "numberLine", from: 0, to: 100, marks: [{ at: 60, label: "臨界點", tone: "ok" }], cursor: 60 }, duration: 3600 },
    { step: "步驟 4：這就是量變到質變", id: 4, caption: "一點一滴的小改變叫量變；跨過臨界點出現全新能力，這就是大家說的質變。", action: "point", prop: { kind: "flow", steps: ["每天小改變", "不斷累積", "臨界點", "全新樣貌"], active: 3 }, duration: 3600 },
    { step: "步驟 5：壞習慣也在累積", id: 5, caption: "反過來看，每天拖延十分鐘、耍廢一下，一開始都沒感覺，久了差距卻很嚇人。", ask: { prompt: "每天偷懶一點、拖一點，久了最可能怎麼樣？", options: ["完全不會有任何影響", "成績還會自動越來越好", "同學根本不會發現", "小問題累積成大問題"], answer: 3, hint: "小事會一天一天疊加上去。" }, action: "think", prop: { kind: "text", text: "小壞習慣 × 很多天", sub: "也會帶來大改變", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：時間是個放大鏡", id: 6, caption: "時間就像放大鏡，今天很小的選擇，被時間一再放大，最後差距大到看得見。", action: "walk", prop: { kind: "flow", steps: ["今天的小選擇", "很多天之後", "巨大的差距"], active: 2 }, duration: 3400 },
    { step: "步驟 7：撐到臨界點之後", id: 7, caption: "很多人在快看到成果時放棄，其實質變常常就躲在再撐一下的後面等你。", ask: { prompt: "努力一陣子都沒看到改變，最好的態度是什麼？", options: ["理解累積還沒到臨界點，再堅持看看", "一定是方法錯了，馬上放棄", "我根本不是讀書的料", "在家等成果自己上門"], answer: 0, hint: "回頭算算自己累積了多少。" }, action: "cheer", prop: { kind: "text", text: "堅持到臨界點", sub: "改變常在最後出現", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：把時間拉長看", id: 8, caption: "把視野拉到一年、兩年，今天這個小小的決定，意義就完全不一樣了。", action: "point", prop: { kind: "cycle", nodes: ["今天", "三個月", "一年", "兩年後"], active: 3 }, duration: 3200 },
    { step: "步驟 9：準備接受挑戰", id: 9, caption: "記住：小改變累積久了，會長成大大的不同。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct-change-scale-1", prompt: "「量變引起質變」最貼切的意思是？", options: ["任何改變都是一瞬間發生的", "數字越大的人就越厲害", "小改變長期累積，會帶來大變化", "東西的品質好壞決定一切"], answer: 2, hints: ["重點在累積", "一開始小、後來變大"], explanation: "點點滴滴的小改變累積到臨界點，就會出現明顯、不一樣的新狀態，這就是所謂的質變。" },
    { id: "ct-change-scale-2", prompt: "每天只進步一點，為什麼拉長時間差這麼多？", options: ["每天的進步會一直疊加累積", "因為剛好老師特別疼他", "因為同學都沒有在讀書", "純粹是他天生運氣很好"], answer: 0, hints: ["一天一點，很多天就很多", "時間把它放大了"], explanation: "每天的小進步像滾雪球般一直疊加，拉長時間看，彼此的差距就愈來愈明顯。" },
    { id: "ct-change-scale-3", prompt: "下列哪個最像真正的「質變」？", options: ["今天比平常多喝了一口水", "今天比平常早起十分鐘", "今天比平常多寫了一行字", "終於能跑完好以前放棄的操場"], answer: 3, hints: ["是能力或狀態的明顯躍升", "不是單次的小動作"], explanation: "能跑完以前跑不完的操場，是能力出現階段性的躍升，才算質變；其他都只是單次小動作。" },
    { id: "ct-change-scale-4", prompt: "關於壞習慣，哪個說法才對？", options: ["偶爾一次，絕對不會怎樣", "小壞習慣累積久了也變大問題", "壞習慣根本不會影響成績", "年紀到了自然就會改好"], answer: 1, hints: ["壞習慣也會量變累積", "不要輕視小處"], explanation: "壞習慣和好習慣一樣會一天天累積，久了同樣造成明顯的壞影響，千萬不能輕忽。" },
    { id: "ct-change-scale-5", prompt: "努力很久還沒看到成果，最合理的想法是？", options: ["累積可能還沒到臨界點，再堅持看看", "我大概根本不是讀書的料", "一定是其他同學都在作弊", "算了，乾脆全部放棄"], answer: 0, hints: ["質變需要時間", "臨界點前看不到明顯變化"], explanation: "臨界點之前改變看起來都很小，持續累積下去，才可能等到那個突然的躍升。" },
    { id: "ct-change-scale-6", prompt: "這個概念提醒我們，看待日常小事要怎麼想？", options: ["小事反正都不重要，隨便做", "只要盯住今天的成績就好", "把時間拉長，看每天小選擇的長遠影響", "未來還很遠，完全不用管"], answer: 2, hints: ["時間是放大鏡", "今天的選擇有意義"], explanation: "拉長時間視野，每天的小選擇、小累積都會在後面發揮作用，所以別輕視任何一天。" },
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
    { step: "步驟 1：一株長不好的小苗", id: 1, caption: "操場邊一株小苗長得又矮又黃，你第一個念頭是：這粒種子一定很差勁吧。", action: "wave", prop: { kind: "text", text: "小苗長不好", sub: "先怪種子？", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：低頭看看四周", id: 2, caption: "可是蹲下一看：土壤乾得硬邦邦，很久沒下雨，陽光也被旁邊大樓擋住了。", ask: { prompt: "小苗長不好，除了種子本身，還該一起看什麼？", options: ["不用看，直接宣判種子爛", "土壤、水分、陽光這些環境", "站遠一點大聲罵它", "什麼都不看最省事"], answer: 1, hint: "小苗是長在環境裡的喔。" }, action: "point", prop: { kind: "text", text: "土壤乾旱、被擋光", sub: "這是外在條件", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：分清內因和外因", id: 3, caption: "種子本身的活力是內因；陽光、土壤、雨水是外因，小苗要長得好，兩邊都得顧到。", action: "point", prop: { kind: "flow", steps: ["內因：種子活力", "外因：陽光土壤雨水", "一起影響生長"], active: 2 }, duration: 3600 },
    { step: "步驟 4：考試成績不理想", id: 4, caption: "換個校園例子：成績不理想時，有人怪自己不夠努力，有人怪題目太難，其實兩邊都有。", action: "think", prop: { kind: "balance", left: "自己的準備", right: "題目與環境" }, duration: 3400 },
    { step: "步驟 5：判斷哪個是內因", id: 5, caption: "你來分分看：天氣、考卷難度是外因；自己的讀書習慣，則是你可以動手調整的內因。", ask: { prompt: "下列哪一項最像「內因」？", options: ["考場今天的冷氣強不強", "這張考卷出得難不難", "放學後會不會下大雨", "自己的讀書計畫與習慣"], answer: 3, hint: "內因是屬於你自己、能調整的部分。" }, action: "point", prop: { kind: "flow", steps: ["內因：自己的準備", "外因：題目與環境", "共同決定成績"], active: 0 }, duration: 3600 },
    { step: "步驟 6：別單方面歸因", id: 6, caption: "只把錯全攬在自己身上，或全推給環境，其實都只看了事情的其中一邊而已。", action: "think", prop: { kind: "text", text: "不只怪自己，也不只怪環境", sub: "兩邊一起看", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：先動手改可控的", id: 7, caption: "外在環境常常沒辦法控制，但你的態度和方法可以，先把力氣花在這裡最實際。", ask: { prompt: "成績不理想，最該先做哪件事？", options: ["反覆責備自己根本很笨", "翻開考卷大罵出題老師", "檢討自己可以調整的讀書方法", "什麼都不做，等下次運氣"], answer: 2, hint: "先動手改你掌控得了的部分。" }, action: "cheer", prop: { kind: "text", text: "先調整可控的內因", sub: "再接受不可控的外因", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：理解不是藉口", id: 8, caption: "看見外在因素，不是拿來當藉口逃避，而是幫你客觀地把事情看清楚。", action: "point", prop: { kind: "flow", steps: ["看見外因", "不藉口逃避", "調整內因"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備接受挑戰", id: 9, caption: "記住：結果是內因外因一起造成的。預備好了，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct-internal-external-1", prompt: "下列哪一項最屬於「內因」？", options: ["自己平時的練習態度", "考場今天的位置在哪", "放學後會不會下大雨", "隔壁同學表現得怎麼樣"], answer: 0, hints: ["內因是自己身上、能掌控的", "外在環境屬於外因"], explanation: "態度、習慣、方法是自己的內在條件，相對可以由自己決定和調整，屬於內因。" },
    { id: "ct-internal-external-2", prompt: "下列哪一項最屬於「外因」？", options: ["你規畫的讀書計畫", "你做重點整理的方式", "突如其來的大雨打斷戶外活動", "你念書時的專注程度"], answer: 2, hints: ["外因來自外部環境", "不是自己能完全決定"], explanation: "天氣、環境、他人反應這類外在條件，是我們很難完全掌控的外因。" },
    { id: "ct-internal-external-3", prompt: "考試成績不好，哪個想法最客觀？", options: ["我就是天生很笨，認識了", "都要怪題目出得太爛", "運氣差，這科就算了", "自己的準備和題目環境都有關係"], answer: 3, hints: ["不要只看一邊", "內因外因一起考慮"], explanation: "成績是自己的準備（內因）和題目、環境（外因）共同造成的，單怪任何一邊都不客觀。" },
    { id: "ct-internal-external-4", prompt: "面對不如意的事，力氣最該先放在哪裡？", options: ["拼命抱怨這個爛環境", "調整自己能改變的條件", "反覆自責到心情很差", "坐在那裡等別人來救"], answer: 1, hints: ["先做可控的事", "外因不一定改得了"], explanation: "外因常難以掌控，先把力氣放在自己能調整的態度與方法上，最實際也最有效。" },
    { id: "ct-internal-external-5", prompt: "「理解有外在因素」最正當的用途是？", options: ["幫助自己客觀看清事情", "拿來當藉口逃避努力", "證明自己根本不用讀書", "順便把環境罵一頓"], answer: 0, hints: ["理解不是藉口", "是為了看清楚全貌"], explanation: "看見外因是為了客觀分析，而不是拿來放棄自己可以改進的部分。" },
    { id: "ct-internal-external-6", prompt: "小苗長不好，卻一口咬定都是種子的錯，最像哪個思考毛病？", options: ["太重視環境、忽略了種子", "講究到過度追求證據", "只看內因、漏掉了外因", "對未來太過度樂觀"], answer: 2, hints: ["只盯著種子看", "沒看土壤和陽光"], explanation: "只怪種子（內因），忽略了土壤、陽光（外因），是典型的單方面歸因。" },
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
    { step: "步驟 1：窗邊的一個書包", id: 1, caption: "你走進空無一人的教室，看見窗邊放著一個書包，桌上還壓著半杯沒喝完的水。", action: "wave", prop: { kind: "text", text: "窗邊有一個書包", sub: "這是你看到的", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：腦袋開始猜", id: 2, caption: "你心裡馬上冒出一堆問題：是誰的書包？主人跑哪去了？待會會不會回來拿？", ask: { prompt: "「窗邊有一個書包」這句話，屬於哪一類？", options: ["你親眼看到的證據", "你腦子裡做出的推論", "你自己幻想的劇情", "你已經下定的結論"], answer: 0, hint: "這是你眼睛實際看到的畫面。" }, action: "think", prop: { kind: "text", text: "主人是誰？會回來嗎？", sub: "這些是你的猜想", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：分開兩種東西", id: 3, caption: "看，「有書包」是證據；「主人遺忘了」是你的推論，這兩種東西千萬別混在一起。", action: "point", prop: { kind: "flow", steps: ["證據：看到書包", "推論：主人遺忘了", "兩者不一樣"], active: 2 }, duration: 3600 },
    { step: "步驟 4：新證據一條條出現", id: 4, caption: "湊近一看：書包縫著名條、旁邊還壓著字條，新證據一口氣又多出兩條。", action: "walk", prop: { kind: "bars", items: [{ label: "一開始", value: 1 }, { label: "看到名條", value: 2 }, { label: "看到字條", value: 3 }], unit: "條證據", active: 2 }, duration: 3400 },
    { step: "步驟 5：推論跟著修正", id: 5, caption: "證據變多，你的猜測就更準：這是同學暫放、待會回來拿的書包，不是掉在這的。", ask: { prompt: "為什麼我們要一直主動找新證據？", options: ["為了證明自己比別人聰明", "反正沒事做，打發時間", "根本不用找，憑猜就對了", "讓自己的推論更接近真相"], answer: 3, hint: "證據越多，猜測越可靠。" }, action: "point", prop: { kind: "flow", steps: ["一開始的猜測", "補上新證據", "更準的推論"], active: 2 }, duration: 3600 },
    { step: "步驟 6：證據太少容易飄", id: 6, caption: "如果只靠「有書包」這一條線索就斷言，很容易猜錯；證據不足時，結論就會飄在天上。", action: "think", prop: { kind: "text", text: "證據太少 → 推論容易錯", sub: "別急著下結論", tone: "warn" }, duration: 3400 },
    { step: "步驟 7：停一下分清兩者", id: 7, caption: "下次你很確定一件事時，先問自己：這是我看到的，還是我腦子裡偷偷加上去的？", ask: { prompt: "同學上課鐘響才走進來，下列哪個才是「證據」？", options: ["他一定是故意偷懶", "鐘響後他才踏進教室門", "他根本討厭這堂課", "他想給老師難看"], answer: 1, hint: "證據是實際看到的畫面。" }, action: "think", prop: { kind: "text", text: "我看到的？還是我猜的？", sub: "停一下分清楚", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：好判斷需要好證據", id: 8, caption: "聰明的做法，是先累積夠多證據，再謹慎下推論，而不是把第一個直覺當成事實。", action: "cheer", prop: { kind: "flow", steps: ["累積證據", "謹慎推論", "不下過早結論"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備接受挑戰", id: 9, caption: "記住：證據是看到的，推論是猜到的。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct-evidence-inference-1", prompt: "下列哪一項最像「證據」？", options: ["他今天心情一定很差", "這個人八成討厭大家", "他把筆用力摔在桌面上", "他今天的運氣特別不好"], answer: 2, hints: ["證據是可以觀察到的", "其他都是腦內的猜測"], explanation: "把筆摔在桌上是看得見的動作，屬於證據；心情差、討厭人、運氣差都是從這個動作猜的。" },
    { id: "ct-evidence-inference-2", prompt: "下列哪一項最像「推論」？", options: ["地上有一灘透明的水", "教室的窗戶是打開著的", "水灘剛好就在桌子旁邊", "這灘水一定是有人打翻的"], answer: 3, hints: ["推論是腦子裡的解釋", "其餘都是看到的事實"], explanation: "「一定是有人打翻」是對現象的解釋和猜測，還需要更多線索才能真的確定。" },
    { id: "ct-evidence-inference-3", prompt: "為什麼單靠一個證據，推論特別容易出錯？", options: ["同一個線索往往能有很多種解釋", "因為證據本身一定會說謊", "因為推論要很多人同意才算", "因為證據根本不能拿來判斷"], answer: 0, hints: ["一個線索能說好幾個故事", "需要更多旁證"], explanation: "單一線索常能對應好幾種可能，證據不足時選中的解釋，很可能只是其中一種巧合。" },
    { id: "ct-evidence-inference-4", prompt: "發現一個和自己想法相反的新證據，最好怎麼做？", options: ["假裝沒看到，繼續硬撐", "反過來怪新證據是錯的", "修正自己本來的推論", "更生氣地堅持己見"], answer: 2, hints: ["推論本來就該跟著證據走", "真相比面子重要"], explanation: "推論只是暫時的猜想，發現新證據就該跟著調整，而不是為了面子硬撐原本的結論。" },
    { id: "ct-evidence-inference-5", prompt: "下判斷之前，最該先問自己哪一句？", options: ["我這樣想會不會很酷", "這是我看到的證據，還是我猜的", "大家會不會認同我", "我這樣講會不會被罵"], answer: 1, hints: ["分開事實和猜想", "別把猜測當事實"], explanation: "提醒自己哪些是觀察到的事實、哪些是自己的解釋，才不會把猜測講成鐵錚錚的事實。" },
    { id: "ct-evidence-inference-6", prompt: "下列哪種習慣最「危險」？", options: ["把腦中第一個直覺當成確定事實", "主動多找幾個旁證", "大方承認自己還不確定", "問問別人看到的狀況"], answer: 0, hints: ["直覺常只是猜測", "未經查證就當真"], explanation: "把腦中第一個冒出來的解釋直接當成事實，最容易造成誤會和錯誤的判斷。" },
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
    { step: "步驟 1：一起變大的兩個數字", id: 1, caption: "你看，夏天一到，冰淇淋賣得更多了，同一時間，溺水的紀錄也跟著一起變多。", action: "wave", prop: { kind: "bars", items: [{ label: "春天", value: 3 }, { label: "初夏", value: 8 }, { label: "盛夏", value: 10 }], unit: "相對量", active: 2 }, duration: 3400 },
    { step: "步驟 2：有人怪罪冰淇淋", id: 2, caption: "於是有人義正辭嚴：都是冰淇淋害的，叫大家以後都不准再吃冰淇淋了。", ask: { prompt: "冰淇淋賣越多、溺水也越多，這兩件事最準確的關係是什麼？", options: ["冰淇淋一定會造成溺水", "兩件事剛好完全無關", "兩件事一起出現、同步變化", "溺水的人特別愛吃冰淇淋"], answer: 2, hint: "它們是一起變化，不一定誰造成誰。" }, action: "think", prop: { kind: "text", text: "是冰淇淋害的嗎？", sub: "這個結論下太快", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：藏著的第三因素", id: 3, caption: "真相其實是天氣變熱：天一熱，買冰淇淋的人變多，跑去玩水的人也跟著變多。", action: "point", prop: { kind: "flow", steps: ["天氣變熱", "買冰淇淋的人變多", "去玩水的人變多"], active: 2 }, duration: 3600 },
    { step: "步驟 4：第三因素同時影響兩者", id: 4, caption: "天氣這個藏起來的因素，同時讓兩件事變多；它們只是相關，不是誰害了誰。", ask: { prompt: "這個例子提醒我們，兩件事一起出現時要小心什麼？", options: ["背後可能藏著共同的第三因素", "那就馬上去禁止冰淇淋", "數字會不會根本在說謊", "一定是 A 直接造成了 B"], answer: 0, hint: "回想是什麼讓兩件事一起變多。" }, action: "point", prop: { kind: "text", text: "相關 ≠ 因果", sub: "中間可能有第三因素", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：早睡的人成績好？", id: 5, caption: "再看一組：習慣早睡的同學，成績往往比較好。那早睡就一定能讓成績變好嗎？", action: "think", prop: { kind: "text", text: "早睡的人成績比較好？", sub: "有關，但誰造成誰？", tone: "warn" }, duration: 3400 },
    { step: "步驟 6：也許是自律在作怪", id: 6, caption: "也許真正的推手是自律：自律的人既早睡、又認真讀書，而不是早睡直接帶來高分。", ask: { prompt: "這裡的「第三因素」最可能是哪個？", options: ["他房間檯燈夠不夠亮", "他今天早餐吃了什麼", "他的學校位在什麼路段", "會規畫時間、很自律的習慣"], answer: 3, hint: "什麼特質會讓人既早睡又會讀書？" }, action: "point", prop: { kind: "flow", steps: ["自律", "早睡", "成績較好"], active: 0 }, duration: 3600 },
    { step: "步驟 7：有時只是湊巧", id: 7, caption: "還有些時候只是純巧合：你帶傘那天剛好沒下雨，不代表是你的傘把太陽請出來的。", action: "think", prop: { kind: "text", text: "有時候只是巧合", sub: "不用硬湊因果故事", tone: "warn" }, duration: 3400 },
    { step: "步驟 8：下因果結論前先停", id: 8, caption: "下次看到兩件事一起變化，先停一下問：真的是 A 造成 B 嗎？中間有沒有第三因素？", action: "cheer", prop: { kind: "flow", steps: ["看到相關", "尋找第三因素", "謹慎下因果結論"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備接受挑戰", id: 9, caption: "記住：相關不等於因果。預備好了，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct-correlation-causation-1", prompt: "「相關」最準確的意思是？", options: ["一件事真的造成另一件事", "兩件事常常一起出現、同步變化", "兩件事之間完全沒有關係", "兩件事一定每秒同時發生"], answer: 1, hints: ["相關是一起出現", "不是誰決定誰"], explanation: "相關只表示兩個變數一起變動，至於是不是誰造成誰，還要另外驗證才行。" },
    { id: "ct-correlation-causation-2", prompt: "冰淇淋和溺水都變多，真正的原因比較可能是？", options: ["冰淇淋害大家不小心溺水", "溺水的人特別愛吃冰淇淋", "天氣變熱同時影響了兩者", "其實兩者都正在下降"], answer: 2, hints: ["夏天到了", "一個因素同時影響兩件事"], explanation: "天氣變熱同時讓吃冰淇淋和去玩水的人都變多，這是典型的共同第三因素。" },
    { id: "ct-correlation-causation-3", prompt: "看到 A 和 B 一起增加，最穩健的態度是？", options: ["先懷疑可能有第三因素，或只是相關", "直接斷定就是 A 害了 B", "趕快去禁止危險的 A", "一定是統計數字出錯"], answer: 0, hints: ["不要急著講因果", "多找一層原因"], explanation: "相關只是線索不是結論；斷定因果前，先想想有沒有其他共同原因或純屬巧合。" },
    { id: "ct-correlation-causation-4", prompt: "「自從我帶幸運筆，考試就進步了」，最該提醒他什麼？", options: ["那以後都不能換別的筆", "幸運筆的功效真的很強", "成績進步果然跟筆有關", "可能只是巧合，或另有其他因素"], answer: 3, hints: ["帶筆和成績一起出現", "不代表筆造成進步"], explanation: "帶筆和成績同時發生可能只是巧合，真正原因也許是這次考前確實認真複習了。" },
    { id: "ct-correlation-causation-5", prompt: "下列哪個才比較像真正的「因果」？", options: ["看到冰淇淋和溺水一起變多", "穿紅襪子那天心情特別好", "用力推桌子，桌子開始滑動", "兩件事都在夏天變多"], answer: 2, hints: ["你做的事直接造成結果", "有清楚的作用過程"], explanation: "用力推是因、桌子滑動是果，兩者之間有清楚的作用過程，這才是真正的因果。" },
    { id: "ct-correlation-causation-6", prompt: "要認真判斷「A 造成 B」，最需要做的是？", options: ["說明 A 透過什麼過程影響 B，並排除其他可能", "看誰的聲音最大就聽誰", "只要 A 和 B 同時出現就好", "全班投票表決看看"], answer: 0, hints: ["因果需要機制和證據", "不能只看同步"], explanation: "證明因果要解釋 A 如何影響 B，並排除第三因素與巧合，而不是只看兩者剛好一起出現。" },
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
    { step: "步驟 1：放學後的兩難", id: 1, caption: "放學鐘一響，你好想先看卡通，又想早點把作業寫完；這兩個選項，其實都不是完美的。", action: "wave", prop: { kind: "balance", left: "先玩：當下快樂", right: "先寫：晚上輕鬆" }, duration: 3400 },
    { step: "步驟 2：先玩要付的代價", id: 2, caption: "先看卡通當下是很爽，但晚上可能得熬夜趕作業，明天上課就精神濟濟？不，是精神渙散。", ask: { prompt: "「先看卡通」這個選擇，背後的代價是什麼？", options: ["功課會自己憑空消失", "成績還會因此變更好", "其實半點代價都沒有", "晚上可能熬夜，明天很累"], answer: 3, hint: "想想玩完之後會怎樣。" }, action: "think", prop: { kind: "balance", left: "當下快樂", right: "晚上熬夜" }, duration: 3600 },
    { step: "步驟 3：先寫的另一面", id: 3, caption: "先寫作業當下有點無聊，可是晚上能安心玩，隔天上課也比較有精神。", action: "point", prop: { kind: "balance", left: "當下有點無聊", right: "晚上安心玩" }, duration: 3400 },
    { step: "步驟 4：把利弊都放上天平", id: 4, caption: "所謂權衡，就是把每個選項的好處和代價，全部搬到天平兩端一起看，不要只看一邊。", ask: { prompt: "權衡一個選擇時，人最容易漏掉哪一邊？", options: ["背後要付出的代價", "這個選項的名字", "它吸引人的好處", "旁邊同學的看法"], answer: 0, hint: "人常常只被好處吸引過去。" }, action: "point", prop: { kind: "balance", left: "好處", right: "代價" }, duration: 3600 },
    { step: "步驟 5：短期和長期分開看", id: 5, caption: "有些選擇現在很爽、以後很痛；把短期好處和長期代價攤開，差距就看得出來了。", action: "think", prop: { kind: "bars", items: [{ label: "先玩的當下爽", value: 8 }, { label: "先玩的明天累", value: 6 }, { label: "先寫的晚上鬆", value: 7 }], unit: "相對分數", active: 0 }, duration: 3400 },
    { step: "步驟 6：別卡在追求完美", id: 6, caption: "世界上很少有只有好處、沒有代價的選項；一直等完美，只會錯過可以決定的時機。", ask: { prompt: "一直堅持要等到「完美方案」才行動，通常會怎樣？", options: ["最後一定找到完美解答", "錯過很多可以做決定的時機", "整個人變得更快樂", "對選擇完全沒有影響"], answer: 1, hint: "完美選項幾乎不存在。" }, action: "think", prop: { kind: "text", text: "沒有完美選項，只有適合取舍", sub: "別卡在完美主義", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：先想自己最重視什麼", id: 7, caption: "做決定前先問：這次我最重視的是什麼？是快樂、成績，還是休息？依這個目標來取捨。", action: "point", prop: { kind: "balance", left: "我最重視的目標", right: "願意付出的代價" }, duration: 3400 },
    { step: "步驟 8：接受選擇的代價", id: 8, caption: "選了一邊，就等於放棄另一邊的好處；想通這點，事後就不會一直無限後悔。", action: "cheer", prop: { kind: "flow", steps: ["看清利弊", "依目標取舍", "接受代價"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備接受挑戰", id: 9, caption: "記住：沒有完美方案，只有權衡後的取舍。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct-balance-tradeoff-1", prompt: "「權衡與取捨」最核心的意思是？", options: ["每個選項都有利弊，依目標做選擇", "要找到完全沒有缺點的選項", "哪個看起來最爽就選哪個", "反正交給別人決定最省事"], answer: 0, hints: ["沒有完美選項", "要比較好處和代價"], explanation: "現實選擇多半沒有完美答案，要把收益和代價一起放上天平，再依自己最重視的目標取舍。" },
    { id: "ct-balance-tradeoff-2", prompt: "只死盯著一個選項「很好的那一面」，最容易怎樣？", options: ["做出全場最明智的決定", "讓整個選擇變得很單純", "忽略背後要付出的代價", "從此以後完全不後悔"], answer: 2, hints: ["人容易被好處吸引", "代價常被藏起來"], explanation: "只看亮點不看代價，事後往往得面對當初沒預料到的缺點，後悔來得特別快。" },
    { id: "ct-balance-tradeoff-3", prompt: "做選擇時，為什麼要把「長期」也一起考慮？", options: ["因為短期的感受都不重要", "有些代價要很久之後才浮現", "因為長期看起來一定更好", "因為這是老師規定要做"], answer: 1, hints: ["小代價會慢慢累積", "今天的選擇影響未來"], explanation: "有些決定短期看起來很好，但代價會隨時間累積，所以評估時一定要把長期也算進去。" },
    { id: "ct-balance-tradeoff-4", prompt: "下列哪種態度最健康、最實際？", options: ["沒選到完美選項絕對不行動", "隨便亂選一個，算了", "既然很難選，就永遠不決定", "承認沒有完美，選最貼近目標的"], answer: 3, hints: ["完美選項很少見", "依目標取捨"], explanation: "等完美往往錯失時機；看清利弊後選一個最貼近自己目標的，再接受它的代價，最實際。" },
    { id: "ct-balance-tradeoff-5", prompt: "你選了 A 方案，通常同時意味著什麼？", options: ["放棄了 B 方案的某些好處", "代表 A 方案絕對最好", "不用付出任何代價", "以後都不用再做選擇"], answer: 0, hints: ["取捨是選一邊、放棄另一邊", "魚與熊掌不可兼得"], explanation: "做選擇就是同時放棄其他選項的部分好處，想通這點，事後就不會無限上綱地後悔。" },
    { id: "ct-balance-tradeoff-6", prompt: "下列哪個做法最像「理性權衡」？", options: ["憑當下直覺馬上決定", "跟著多數人選一樣就對", "列出各選項的好處與代價再決定", "哪個看起來划算就選哪個"], answer: 2, hints: ["把利弊攤開來看", "不只看一面"], explanation: "把每個選項的收益和代價都寫下來一起比較，再依目標決定，這就是理性權衡。" },
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
