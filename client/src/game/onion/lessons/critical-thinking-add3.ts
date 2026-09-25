/**
 * 思辨（批判性思考）系列第三批課程（critical-thinking-add3.ts）
 *
 * 對應 BD 系列分鏡腳本：網路謠言（BD-012）、邏輯謬誤（BD-013）、
 * 框架暗示（BD-014）、可信度（BD-015）、認知偏誤（BD-016）、
 * 價值判斷（BD-017）、同理心（BD-019）、集體決策（BD-020）。
 *
 * 至此 BD-001～BD-020 二十個主題全數落地。設計原則與前兩批相同：
 * 9 幀分鏡、至少 3 幀中途提問、6 題闖關、4 條以上 takeaways，
 * 繁體中文，subject="思辨"，stages=["國中"]。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 13. 網路謠言：先查證再轉發 ===================== */
const CT_ONLINE_RUMOR: OnionLesson = {
  id: "ct-online-rumor",
  title: "網路謠言：轉發之前先查證",
  subject: "思辨",
  topic: "網路謠言",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "群組傳來「緊急！吃這個會中毒」，嚇得大家馬上轉發。可是，這是真的嗎？",
  takeaways: [
    "越驚悚、越緊急的訊息，越要小心",
    "先找原始來源，再決定要不要相信",
    "轉發之前先查證，你也是訊息把關者",
    "看到訊息先問：誰發的？證據在哪？多久以前？",
  ],
  frames: [
    { step: "步驟 1：群組傳來緊急訊息", id: 1, caption: "手機群組跳出：「緊急！某零食含毒，快轉給家人！」訊息還附了一張嚇人的照片。", action: "wave", prop: { kind: "text", text: "緊急！快轉發！", sub: "越緊急越要冷靜", tone: "warn" }, duration: 3400 },
    { step: "步驟 2：謠言長得很像真的", id: 2, caption: "謠言常常寫得很具體：有時間、有地點、有照片，看起來就像真的新聞。", ask: { prompt: "訊息寫得很具體，就代表是真的嗎？", options: ["是，詳細就是真的", "不一定，具體可能是裝出來的", "有照片就一定真", "大家轉發就是真的"], answer: 1, hint: "想想造假也可以很詳細。" }, action: "think", prop: { kind: "text", text: "具體 ≠ 真實", sub: "細節可以編造", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：誰發的？原始來源？", id: 3, caption: "先問：誰發的？原始來源在哪？是政府、學校公告，還是來路不明的帳號？", action: "point", prop: { kind: "flow", steps: ["誰發的", "原始來源", "是不是可信機構"], active: 2 }, duration: 3400 },
    { step: "步驟 4：查證再相信", id: 4, caption: "上網搜尋關鍵字，看看有沒有官方澄清，或權威媒體的報導可以對照。", ask: { prompt: "收到可疑訊息，第一步最好的做法是？", options: ["馬上轉發", "搜尋查證、找官方說法", "只相信標題", "問第一個看到的人"], answer: 1, hint: "動手查，不要動手轉。" }, action: "think", prop: { kind: "text", text: "動手查證，不要動手轉發", sub: "搜尋關鍵字＋官方說法", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：時間也會出賣謠言", id: 5, caption: "很多訊息其實是好幾年前的舊聞，被重新貼出來嚇人。記得看發布時間。", action: "point", prop: { kind: "flow", steps: ["舊聞重貼", "看起來像新的", "查時間戳記"], active: 2 }, duration: 3400 },
    { step: "步驟 6：轉發的責任", id: 6, caption: "你轉發出去的訊息，朋友會相信。轉發前多查一下，就是在保護身邊的人。", ask: { prompt: "為什麼轉發前要查證？", options: ["因為轉發會花時間", "因為你轉的訊息會影響別人", "因為手機容量", "因為不用查"], answer: 1, hint: "想想你轉出去會發生什麼。" }, action: "cheer", prop: { kind: "text", text: "你是訊息把關者", sub: "轉發前多查一下", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：謠言會造成真實傷害", id: 7, caption: "假的食品謠言可能害店家生意倒閉，假災難訊息可能造成恐慌。謠言傷人。", action: "think", prop: { kind: "text", text: "謠言傷害真實的人", sub: "不是按按轉發而已", tone: "warn" }, duration: 3400 },
    { step: "步驟 8：收到謠言這樣做", id: 8, caption: "不轉發、不驚慌，先查證；如果確定是假的，可以提醒傳給你的人。", action: "cheer", prop: { kind: "flow", steps: ["不轉發", "先查證", "提醒身邊的人"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：先查證，再轉發。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-online-rumor-1", prompt: "為什麼「很緊急、快轉發」的訊息特別可疑？", options: ["緊急訊息一定是真的", "緊張情緒會讓我們跳過查證", "緊急訊息比較短", "轉發越快越好"], answer: 1, hints: ["情緒影響判斷", "緊急是常見話術"], explanation: "製造急迫感是謠言常見手法，讓人來不及查證就先轉發。" },
    { id: "ct-online-rumor-2", prompt: "訊息寫得很具體、有時間有照片，代表？", options: ["一定是真的", "不一定，細節可以編造", "有照片就鐵證如山", "大家都信就是真的"], answer: 1, hints: ["細節可以造假", "要看原始來源"], explanation: "具體細節不等於真實，關鍵是原始來源和權威機構的查證。" },
    { id: "ct-online-rumor-3", prompt: "收到可疑訊息，第一步最好？", options: ["馬上轉發給更多人", "搜尋查證、找官方說法", "只相信標題", "刪掉就好"], answer: 1, hints: ["動手查", "找權威來源對照"], explanation: "用關鍵字搜尋並對照官方與權威媒體的說法，才能判斷真假。" },
    { id: "ct-online-rumor-4", prompt: "為什麼要檢查訊息發布時間？", options: ["因為時間不重要", "很多謠言是舊聞重貼，看起來像新的", "時間越新越假", "只要看時間就好"], answer: 1, hints: ["舊聞會被重貼", "時間戳記洩漏真相"], explanation: "查時間可以發現訊息是不是被重新包裝的舊聞，避免被誤導。" },
    { id: "ct-online-rumor-5", prompt: "轉發不實訊息可能造成？", options: ["完全沒影響", "誤導他人、傷害店家或造成恐慌", "讓自己更受歡迎", "讓訊息變真"], answer: 1, hints: ["訊息會影響讀的人", "謠言有真實傷害"], explanation: "假訊息可能誤導判斷、傷害被波及的人，甚至造成群體恐慌。" },
    { id: "ct-online-rumor-6", prompt: "確定收到的是謠言時，可以怎麼做？", options: ["繼續轉發", "不轉發並提醒傳給你的人", "改寫後再轉", "大聲嘲笑對方"], answer: 1, hints: ["停止傳播", "善意提醒"], explanation: "停止轉發、善意提醒來源者，是負責任的訊息公民做法。" },
  ],
};

/* ===================== 14. 邏輯謬誤：話裡的漏洞 ===================== */
const CT_LOGICAL_FALLACY: OnionLesson = {
  id: "ct-logical-fallacy",
  title: "邏輯謬誤：話裡的漏洞在哪裡",
  subject: "思辨",
  topic: "邏輯謬誤",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "「大家都這樣做，所以我也要！」「不聽我的話就是笨蛋！」這些話聽起來很強，其實邏輯有漏洞。",
  takeaways: [
    "邏輯謬誤是看似有理、其實站不住腳的推論",
    "「大家都這樣」不代表「這樣是對的」",
    "人身攻擊不能當作反對的理由",
    "發現謬誤，是為了好好討論，不是為了吵架贏",
  ],
  frames: [
    { step: "步驟 1：大家都這樣做", id: 1, caption: "有人說：「班上大家都在抄作業，所以抄作業沒關係。」這句話哪裡怪？", action: "wave", prop: { kind: "text", text: "大家都這樣＝對的？", sub: "多數不等於正確", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：多數人做不代表對", id: 2, caption: "很多人做的事，不代表就是對的。以前很多人相信地球是平的，事實還是會改變。", ask: { prompt: "「大家都這樣做，所以是對的」這種說法？", options: ["完全正確", "多數不等於正確，是邏輯漏洞", "人越多越對", "沒人反對就是對"], answer: 1, hint: "想想多數人做錯事的可能。" }, action: "point", prop: { kind: "text", text: "從眾 ≠ 正確", sub: "人云亦云要小心", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：人身攻擊", id: 3, caption: "「你連字都寫不好，你的意見不用聽！」罵人寫字醜，跟意見對不對沒有關係。", ask: { prompt: "「你成績差，所以你說的話都是錯的」問題在哪？", options: ["說得很對", "攻擊人，而不是討論意見本身", "成績差就是錯", "沒有問題"], answer: 1, hint: "焦點從意見跑到人身上了。" }, action: "think", prop: { kind: "text", text: "罵人 ≠ 反駁意見", sub: "要針對觀點討論", tone: "warn" }, duration: 3600 },
    { step: "步驟 4：滑坡謬誤", id: 4, caption: "「今天不整理書包，以後就會變廢人！」把小事直接連到最壞結果，跳了好幾步。", action: "point", prop: { kind: "flow", steps: ["今天不整理書包", "以後變廢人？", "中間跳了好幾步"], active: 2 }, duration: 3400 },
    { step: "步驟 5：非黑即白", id: 5, caption: "「不是完全支持，就是完全反對！」其實很多事都有中間地帶，不是只有兩邊。", ask: { prompt: "「你不幫我就是敵人」這句話的問題是？", options: ["把人分成兩邊，忽略中間地帶", "說得很清楚", "敵人定義正確", "完全沒問題"], answer: 0, hint: "除了朋友敵人，還有其他可能。" }, action: "think", prop: { kind: "text", text: "不是只有黑與白", sub: "中間還有好多可能", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：循環論證", id: 6, caption: "「因為我是對的，所以我說的都是對的。」用自己證明自己，繞了一圈什麼都沒證明。", action: "point", prop: { kind: "cycle", nodes: ["我對", "所以說的都對", "因為我對"], active: 2 }, duration: 3400 },
    { step: "步驟 7：發現謬誤之後", id: 7, caption: "發現對方話裡有漏洞，重點是好好說明哪裡有問題，而不是嘲笑對方。", ask: { prompt: "發現別人話裡有邏輯漏洞時，比較好的做法是？", options: ["嘲笑他笨", "指出漏洞並好好討論", "不理他", "大聲罵回去"], answer: 1, hint: "目的是討論，不是吵架。" }, action: "cheer", prop: { kind: "text", text: "指出漏洞，好好討論", sub: "不是為了贏吵架", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：自己也要檢查", id: 8, caption: "不只檢查別人的話，也要檢查自己的話：我有沒有也在用這些漏洞？", action: "walk", prop: { kind: "flow", steps: ["檢查別人", "也檢查自己", "一起變清楚"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：話裡有漏洞，要看出來，也要說清楚。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-logical-fallacy-1", prompt: "「大家都這樣做，所以這樣是對的」屬於？", options: ["正確推理", "用多數人來證明正確的邏輯漏洞", "科學證據", "嚴謹論證"], answer: 1, hints: ["多數不等於正確", "以前也有多數人錯"], explanation: "群體多數不代表真理，用「大家都這樣」來證明對錯是常見謬誤。" },
    { id: "ct-logical-fallacy-2", prompt: "「你成績差，你的意見不用聽」的問題是？", options: ["人身攻擊代替討論意見", "成績差的人真的不能發言", "很有道理", "邏輯嚴謹"], answer: 0, hints: ["焦點跑到人身上", "意見本身沒被討論"], explanation: "攻擊對方個人特質，而不是討論意見本身，是人身攻擊謬誤。" },
    { id: "ct-logical-fallacy-3", prompt: "「今天不整理書包，以後一定變廢人」用了什麼手法？", options: ["滑坡謬誤：把小事直接連到最壞結果", "正確的因果推論", "科學實驗", "換位思考"], answer: 0, hints: ["中間跳了好多步", "小事件誇大結果"], explanation: "滑坡謬誤把一件小事直接推到極端後果，忽略中間許多環節。" },
    { id: "ct-logical-fallacy-4", prompt: "「你不幫我就是敵人」這句話忽略了？", options: ["中間地帶的存在", "敵人的定義", "朋友的好處", "沒有忽略什麼"], answer: 0, hints: ["不是只有兩邊", "還有中立選擇"], explanation: "非黑即白謬誤把複雜世界簡化成兩個對立選項，忽略中間可能。" },
    { id: "ct-logical-fallacy-5", prompt: "「我是對的，因為我說的都對」屬於？", options: ["循環論證", "證據充分", "邏輯嚴謹", "客觀事實"], answer: 0, hints: ["繞圈圈", "用自己證明自己"], explanation: "循環論證用結論證明結論，繞了一圈沒有提供任何新證據。" },
    { id: "ct-logical-fallacy-6", prompt: "發現別人話裡有謬誤時，比較好的做法是？", options: ["嘲笑對方笨", "指出漏洞，好好討論", "直接封鎖", "跟著一起錯"], answer: 1, hints: ["目的是把話說清楚", "不是為了贏"], explanation: "發現謬誤的價值在於促進清楚的討論，而不是為了證明自己比較厲害。" },
  ],
};

/* ===================== 15. 框架暗示：說法會影響判斷 ===================== */
const CT_FRAMING: OnionLesson = {
  id: "ct-framing",
  title: "框架暗示：同一件事不同說法",
  subject: "思辨",
  topic: "框架暗示",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "「這杯飲料有九成的人喜歡」和「有一成的人不喜歡」，說的是同一杯飲料，感受卻完全不同。",
  takeaways: [
    "同一件事，換個說法就會改變感受",
    "「九成喜歡」和「一成不喜歡」是一樣的數據",
    "廣告和新聞常選擇對自己有利的說法",
    "聽到說法時，試著自己換個框架再看一次",
  ],
  frames: [
    { step: "步驟 1：同一杯飲料", id: 1, caption: "廣告說：「這杯飲料九成的人喝了都喜歡！」聽起來超棒。", action: "wave", prop: { kind: "text", text: "九成的人喜歡", sub: "聽起來很棒", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：換個說法", id: 2, caption: "同一杯飲料，換成：「一成的人喝了不喜歡。」聽起來好像很差。", ask: { prompt: "「九成喜歡」和「一成不喜歡」的數據？", options: ["完全不同", "其實是同一件事的兩種說法", "後者比較準", "前者比較準"], answer: 1, hint: "想想 9 成和 1 成的關係。" }, action: "point", prop: { kind: "text", text: "九成喜歡 ＝ 一成不喜歡", sub: "數據相同，感受不同", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：這叫框架效應", id: 3, caption: "用不同的說法包裝同一件事，影響你的感受和判斷，這叫框架效應。", action: "point", prop: { kind: "text", text: "框架效應", sub: "說法改變感受", tone: "warn" }, duration: 3400 },
    { step: "步驟 4：廣告最會用", id: 4, caption: "廣告只講「九成喜歡」，不會強調「一成不喜歡」，因為它想讓你覺得它很好。", ask: { prompt: "為什麼廣告要選「九成喜歡」這個說法？", options: ["因為比較公平", "因為對自己有利，讓你感覺更好", "因為九成比較好算", "因為沒別的說法"], answer: 1, hint: "想想廣告想達成什麼。" }, action: "think", prop: { kind: "text", text: "廣告挑有利的說法", sub: "不是故意騙你，但會影響你", tone: "warn" }, duration: 3600 },
    { step: "步驟 5：新聞也會選框架", id: 5, caption: "同一場比賽，說「惜敗」和「慘敗」，感覺完全不同，但事實一樣。", action: "point", prop: { kind: "balance", left: "惜敗", right: "慘敗" }, duration: 3400 },
    { step: "步驟 6：換個框架再看", id: 6, caption: "聽到一個說法，試著自己換個框架：把「九成喜歡」換成「一成不喜歡」，感覺還一樣嗎？", ask: { prompt: "想識破框架，最好的練習是？", options: ["照單全收", "自己換個說法再看同一件事", "只看標題", "相信廣告"], answer: 1, hint: "把說法翻過來看。" }, action: "cheer", prop: { kind: "flow", steps: ["聽到說法", "換個框架", "再看一次"], active: 2 }, duration: 3600 },
    { step: "步驟 7：數字一樣，重點不同", id: 7, caption: "九成喜歡，也可能代表十個人裡有一個不喜歡。說法沒變，但你要看完整。", action: "think", prop: { kind: "text", text: "看完整，不只聽標語", sub: "問：另一邊呢？", tone: "warn" }, duration: 3400 },
    { step: "步驟 8：善用框架溝通", id: 8, caption: "自己說話時，也可以選擇更清楚的框架，讓對方真的聽懂你想表達的重點。", action: "cheer", prop: { kind: "text", text: "會識破框架，也會善用框架", sub: "把話說清楚", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：同一件事，換個說法感覺就不同。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-framing-1", prompt: "「九成喜歡」和「一成不喜歡」的關係是？", options: ["完全不同的數據", "同一件事的兩種說法", "後者比較準", "前者比較準"], answer: 1, hints: ["九成一成互補", "數字其實相同"], explanation: "兩個說法描述同一份數據，只是從不同方向呈現，感受卻不同。" },
    { id: "ct-framing-2", prompt: "「框架效應」指的是？", options: ["用不同說法包裝同一件事，影響判斷", "把話說得更長", "增加更多數據", "改變事實"], answer: 0, hints: ["說法影響感受", "事實沒變"], explanation: "框架效應是同一件事因呈現方式不同，而改變人的感受與選擇。" },
    { id: "ct-framing-3", prompt: "廣告為什麼要挑「九成喜歡」這種說法？", options: ["為了公平", "選擇對自己有利的框架，讓你感覺更好", "因為比較好念", "因為沒別的數字"], answer: 1, hints: ["廣告想影響你", "挑有利方向呈現"], explanation: "廣告會挑選對商品最有利的框架來呈現，讓消費者感覺更正面。" },
    { id: "ct-framing-4", prompt: "「惜敗」和「慘敗」說的是？", options: ["完全不同的比賽", "同一場比賽的不同說法", "前者贏了", "後者贏了"], answer: 1, hints: ["事實一樣", "感受不同"], explanation: "比賽結果相同，但「惜敗」聽起來遺憾中帶肯定，「慘敗」聽起來一敗塗地。" },
    { id: "ct-framing-5", prompt: "想識破框架，最好的練習是？", options: ["照單全收標語", "自己換個說法再看同一件事", "只看廣告", "不要聽別人說話"], answer: 1, hints: ["翻轉說法", "比較感受差異"], explanation: "主動把說法換個方向重述，能幫助你看出框架如何影響感受。" },
    { id: "ct-framing-6", prompt: "聽到「九成喜歡」時，比較完整的理解是？", options: ["全部人都喜歡", "也可能有一成不喜歡，要看完整數據", "九成就是全部", "不用管另一邊"], answer: 1, hints: ["還有剩下一成", "問：另一邊呢"], explanation: "理解框架後，要提醒自己補上沒被強調的另一面，才不會被單一說法帶著走。" },
  ],
};

/* ===================== 16. 可信度：誰的話可以信 ===================== */
const CT_CREDIBILITY: OnionLesson = {
  id: "ct-credibility",
  title: "可信度：誰的話比較可以信",
  subject: "思辨",
  topic: "可信度",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "「我表哥說」「新聞說」「醫生說」，同樣一句話，從不同人嘴裡說出來，可信度不一樣。",
  takeaways: [
    "判斷訊息先看來源：專業、經驗、動機",
    "專業相關的人，話比較有分量",
    "有利害關係的人，話要打折",
    "來源不明時，先保留，不要急著相信",
  ],
  frames: [
    { step: "步驟 1：同樣一句話", id: 1, caption: "有人說跑步傷膝蓋，有人說跑步護膝蓋。你該聽誰的？", action: "wave", prop: { kind: "balance", left: "跑步傷膝蓋", right: "跑步護膝蓋" }, duration: 3200 },
    { step: "步驟 2：看來源的專業", id: 2, caption: "運動醫學的醫生和研究報告，會比路人的感覺更可信，因為他們有專業背景。", ask: { prompt: "判斷「跑步傷不傷膝蓋」，誰的話比較可信？", options: ["隔壁路人", "運動醫學專家與研究", "網路上不認識的人", "賣鞋的老闆"], answer: 1, hint: "看誰有專業知識。" }, action: "point", prop: { kind: "text", text: "專業背景增加可信度", sub: "專家＋研究報告", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：看有沒有利害關係", id: 3, caption: "賣鞋的老闆說「穿我們的鞋跑步絕對不傷膝蓋」，他的話要打折，因為他靠賣鞋賺錢。", ask: { prompt: "賣鞋老闆說自家鞋最好，為什麼要打折聽？", options: ["因為他不懂鞋", "他有利害關係，可能偏袒自己", "因為鞋不好", "因為他太忙"], answer: 1, hint: "想想他從中獲得什麼。" }, action: "think", prop: { kind: "text", text: "有利害關係 → 話要打折", sub: "看動機", tone: "warn" }, duration: 3600 },
    { step: "步驟 4：經驗也是一種來源", id: 4, caption: "親身經歷過的人，他的經驗值得參考，但只能代表他一個人，不能代表全部。", action: "point", prop: { kind: "text", text: "經驗有參考價值", sub: "但不等於普遍事實", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：多人一致也不一定真", id: 5, caption: "很多人一起傳的訊息，來源可能都是同一個錯誤源頭。多人說不代表來源可靠。", ask: { prompt: "很多人轉發同一則訊息，代表？", options: ["一定是真的", "可能都來自同一個錯誤來源", "人越多越準", "不用查了"], answer: 1, hint: "想想源頭只有一個的情況。" }, action: "think", prop: { kind: "text", text: "多人轉發 ≠ 來源可靠", sub: "可能同一個源頭", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：來源不明先保留", id: 6, caption: "不知道誰寫的、沒寫時間、沒寫出處的訊息，先保留，不要急著當真。", action: "walk", prop: { kind: "flow", steps: ["來源不明", "先保留", "找到來源再判斷"], active: 2 }, duration: 3400 },
    { step: "步驟 7：多方對照", id: 7, caption: "把不同來源的資訊對照，如果方向一致，可信度就比較高。", ask: { prompt: "想確認一個說法可不可信，可以？", options: ["只聽一個人", "找多個獨立來源對照", "相信第一個看到的", "不查了"], answer: 1, hint: "多比對幾家。" }, action: "cheer", prop: { kind: "flow", steps: ["來源一", "來源二", "對照後判斷"], active: 2 }, duration: 3600 },
    { step: "步驟 8：自己也可以更可信", id: 8, caption: "自己說話時，說得出來源和理由，別人也會更願意相信你。", action: "cheer", prop: { kind: "text", text: "說得出來源，話才有分量", sub: "對自己也要求可信度", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：先看來源，再決定信不信。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-credibility-1", prompt: "判斷訊息可信度，最該先看什麼？", options: ["誰說的、他的專業與動機", "訊息長不長", "有沒有驚嘆號", "多少人按讚"], answer: 0, hints: ["來源決定可信度", "看專業和動機"], explanation: "來源的專業背景與利害關係，是判斷訊息可不可信的重要依據。" },
    { id: "ct-credibility-2", prompt: "為什麼賣鞋老闆的話要打折聽？", options: ["他不懂鞋", "他有利害關係，可能偏袒自家產品", "他太忙", "他說話小聲"], answer: 1, hints: ["想想他從中獲利什麼", "動機影響客觀"], explanation: "有利益關係的人可能無意中偏袒自己，因此說法要謹慎看待。" },
    { id: "ct-credibility-3", prompt: "「我表哥說這樣會生病」為什麼不能直接相信？", options: ["表哥一定錯", "單一個人經驗不代表普遍事實", "表哥不可信", "生病很嚴重"], answer: 1, hints: ["個人經驗有限", "不等於科學結論"], explanation: "單一親友的經驗只是個案，缺乏代表性與驗證，不能當作普遍結論。" },
    { id: "ct-credibility-4", prompt: "很多人轉發同一則訊息，可能？", options: ["代表一定真", "全部來自同一個錯誤源頭", "人越多越可信", "不需要查證"], answer: 1, hints: ["源頭可能只有一個", "轉發數不等於正確"], explanation: "轉發者多不代表來源可靠，源頭可能只是同一個錯誤訊息。" },
    { id: "ct-credibility-5", prompt: "來源不明的訊息，比較好的態度是？", options: ["直接相信", "先保留，找到來源再判斷", "馬上轉發", "改一改再發"], answer: 1, hints: ["不知道誰寫的", "先存疑"], explanation: "查不到來源時應保持保留態度，等找到可靠來源再決定。" },
    { id: "ct-credibility-6", prompt: "多個獨立來源說法一致時，代表？", options: ["一定完全正確", "可信度比較高", "一定錯誤", "沒意義"], answer: 1, hints: ["獨立來源互相印證", "比單一來源可靠"], explanation: "獨立來源互相印證，能降低單一來源偏差，可信度相對提高。" },
  ],
};

/* ===================== 17. 認知偏誤：大腦的捷徑會出錯 ===================== */
const CT_COGNITIVE_BIAS: OnionLesson = {
  id: "ct-cognitive-bias",
  title: "認知偏誤：大腦的捷徑",
  subject: "思辨",
  topic: "認知偏誤",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "大腦為了省力，常常走捷徑做判斷。這些捷徑大部分時候很好用，但有時候會讓我們看走眼。",
  takeaways: [
    "大腦會走捷徑，幫我們快速判斷",
    "捷徑大部分時候好用，有時會讓我們出錯",
    "例如：只記住印象深刻的例子（鮮明效應）",
    "知道自己可能偏誤，就會更謹慎檢查",
  ],
  frames: [
    { step: "步驟 1：大腦很忙", id: 1, caption: "每天要決定好多事，大腦為了省力，常常用捷徑快速判斷，而不是慢慢分析。", action: "wave", prop: { kind: "text", text: "大腦的捷徑", sub: "快，但不一定準", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：鮮明的例子最難忘", id: 2, caption: "新聞一直播飛機事故，你就覺得飛機很危險，其實開車的風險高多了。", ask: { prompt: "新聞常播飛機事故，讓你覺得飛機危險，這可能是？", options: ["飛機真的最危險", "鮮明的例子影響了判斷", "新聞最準", "開車很安全"], answer: 1, hint: "印象深刻不等於常見。" }, action: "think", prop: { kind: "text", text: "記得住的 ≠ 最常發生", sub: "鮮明例子誤導判斷", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：這叫鮮明效應", id: 3, caption: "印象深刻的例子容易被記住，讓我們高估它的發生機率，這叫鮮明效應（可得性偏誤）。", action: "point", prop: { kind: "text", text: "鮮明效應", sub: "容易記住的被高估", tone: "warn" }, duration: 3400 },
    { step: "步驟 4：先入為主", id: 4, caption: "先聽到「他是轉學生」，之後他做什麼都被你用「轉學生」解釋，這是先入為主。", ask: { prompt: "先入為主的標籤，之後會？", options: ["完全沒影響", "影響你之後怎麼解讀他的行為", "讓他變厲害", "自動消失"], answer: 1, hint: "第一個印象會主導後續。" }, action: "think", prop: { kind: "flow", steps: ["先入為主的標籤", "之後的行為", "都被標籤解釋"], active: 2 }, duration: 3600 },
    { step: "步驟 5：只聽想聽的", id: 5, caption: "喜歡一個球星，就只記住他的好球、忽略他的失誤，這叫確認偏誤。", ask: { prompt: "「只記得自己支持的球星的好球」屬於？", options: ["客觀觀察", "只找支持自己看法的證據", "很公平", "統計方法"], answer: 1, hint: "大腦自動挑選證據。" }, action: "think", prop: { kind: "text", text: "只聽想聽的", sub: "確認偏誤", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：偏誤不是笨", id: 6, caption: "有偏誤不代表你笨，這是大腦的正常運作方式。重點是知道它存在，然後多檢查一步。", action: "cheer", prop: { kind: "text", text: "有偏誤很正常", sub: "多檢查一步就好", tone: "ok" }, duration: 3400 },
    { step: "步驟 7：用數字校正感覺", id: 7, caption: "感覺飛機危險時，去查真實統計數字，用數據校正被鮮明例子帶偏的印象。", ask: { prompt: "感覺被鮮明例子帶偏時，最好的做法是？", options: ["相信感覺", "查真實數據校正", "繼續害怕", "問朋友"], answer: 1, hint: "用客觀數字代替印象。" }, action: "walk", prop: { kind: "flow", steps: ["感覺被帶偏", "查真實數據", "校正印象"], active: 2 }, duration: 3600 },
    { step: "步驟 8：故意找相反證據", id: 8, caption: "當你非常確定一件事時，試著故意找找反對的證據，看看自己是不是漏看了什麼。", action: "cheer", prop: { kind: "text", text: "太確定時，找找反證", sub: "幫自己踩剎車", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：捷徑會出錯，多檢查一步。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-cognitive-bias-1", prompt: "「認知偏誤」指的是？", options: ["大腦運作完全正常", "大腦走捷徑快速判斷，有時會出錯", "人的記性太差", "眼睛有問題"], answer: 1, hints: ["是捷徑", "快但不一定準"], explanation: "認知偏誤是大腦為省力而走的判斷捷徑，多數時候好用，但特定情況下會出錯。" },
    { id: "ct-cognitive-bias-2", prompt: "新聞常播飛機事故，讓人覺得飛機很危險，這是？", options: ["飛機真的最危險", "鮮明效應：容易記住的例子被高估", "新聞一定準", "開車很安全"], answer: 1, hints: ["印象深刻不等於常見", "高估發生機率"], explanation: "鮮明、聳動的例子容易被記住，使人高估其發生機率，而忽略統計事實。" },
    { id: "ct-cognitive-bias-3", prompt: "「只記得自己支持的球星的好球」屬於？", options: ["確認偏誤：只找支持自己的證據", "客觀分析", "公平比較", "數據統計"], answer: 0, hints: ["自動篩選證據", "忽略相反資訊"], explanation: "確認偏誤讓我們傾向注意與自己看法一致的資訊，忽略相反證據。" },
    { id: "ct-cognitive-bias-4", prompt: "有認知偏誤代表？", options: ["我很笨", "大腦正常的省力機制，知道後多檢查就好", "我沒救了", "我特別聰明"], answer: 1, hints: ["人人都有", "重點是覺察"], explanation: "偏誤是每個人都有的正常機制，覺察它並多檢查一步，就能減少出錯。" },
    { id: "ct-cognitive-bias-5", prompt: "感覺被鮮明例子帶偏時，比較好的做法是？", options: ["相信第一感覺", "查真實數據校正印象", "繼續害怕", "問身邊朋友就好"], answer: 1, hints: ["用數據代替印象", "客觀校正"], explanation: "當感覺與數據衝突時，用可靠統計數據來校正，而不是被鮮明例子牽著走。" },
    { id: "ct-cognitive-bias-6", prompt: "太確定一件事時，可以怎麼幫自己煞車？", options: ["更加確定", "故意找找反對的證據", "不想了", "找人吵架"], answer: 1, hints: ["找反證", "檢查漏看的部分"], explanation: "主動尋找反對證據，能打破只看到單邊資訊的慣性，讓判斷更完整。" },
  ],
};

/* ===================== 18. 價值判斷：事實與好壞要分開 ===================== */
const CT_VALUE_JUDGMENT: OnionLesson = {
  id: "ct-value-judgment",
  title: "價值判斷：事實與好壞要分開",
  subject: "思辨",
  topic: "價值判斷",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "「這支手機賣一萬元」是事實，「賣一萬元太貴了」是好壞判斷。兩者常常被混在一起。",
  takeaways: [
    "事實描述：可以驗證、客觀的陳述",
    "價值判斷：個人認為好壞、應不應該",
    "價值判斷沒有對錯，但要有理由",
    "先分開事實與評價，討論才不會打結",
  ],
  frames: [
    { step: "步驟 1：一支手機", id: 1, caption: "「這支手機賣一萬元。」這是一句可以查證的事實陳述。", action: "wave", prop: { kind: "text", text: "手機賣一萬元", sub: "這是事實陳述", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：太貴了？", id: 2, caption: "「賣一萬元太貴了！」這是你對它的好壞判斷，不同人可能有不同答案。", ask: { prompt: "「這手機一萬元太貴了」屬於？", options: ["事實", "價值判斷", "科學定律", "測量結果"], answer: 1, hint: "「太貴」是好壞感受。" }, action: "point", prop: { kind: "text", text: "「太貴」是價值判斷", sub: "因人而異", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：分開兩者", id: 3, caption: "「手機賣一萬元」是事實；「太貴了」是評價。先分清楚，討論才不會打結。", action: "point", prop: { kind: "balance", left: "事實：賣一萬元", right: "評價：太貴了" }, duration: 3400 },
    { step: "步驟 4：評價要給理由", id: 4, caption: "說「太貴」可以，但要說理由：「因為我預算只有五千，而且別家同規格更便宜。」", ask: { prompt: "價值判斷要怎麼說才比較有說服力？", options: ["不用理由", "說出自己的標準和理由", "大聲說就好", "跟著大家說"], answer: 1, hint: "理由讓判斷可以討論。" }, action: "think", prop: { kind: "flow", steps: ["價值判斷", "說出理由", "讓討論可以進行"], active: 2 }, duration: 3600 },
    { step: "步驟 5：新聞也會混在一起", id: 5, caption: "新聞標題「可憐的流浪狗」就有評價；「收容所現有三百隻狗」才是事實。", action: "point", prop: { kind: "text", text: "「可憐」是評價　「三百隻」是事實", sub: "看新聞要分開", tone: "warn" }, duration: 3400 },
    { step: "步驟 6：廣告最愛用評價", id: 6, caption: "「史上最好喝的奶茶」是評價，不是事實。廣告用評價讓你感覺非買不可。", ask: { prompt: "「史上最好喝」這句話是？", options: ["可以查證的事實", "主觀評價，無法驗證", "科學數據", "法律規定"], answer: 1, hint: "「最好喝」因人而異。" }, action: "think", prop: { kind: "text", text: "「史上最好喝」無法驗證", sub: "是主觀評價", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：評價沒有對錯，但有優劣", id: 7, caption: "價值判斷沒有標準答案，但有理由、有根據的判斷，比隨口說的更有討論價值。", action: "walk", prop: { kind: "flow", steps: ["沒有標準答案", "有理由的更好", "可以好好討論"], active: 2 }, duration: 3400 },
    { step: "步驟 8：先說事實再談評價", id: 8, caption: "討論事情時，先確認雙方對事實有共識，再談好壞，就不容易各說各話。", action: "cheer", prop: { kind: "text", text: "事實先對齊，再談好壞", sub: "討論更順", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：事實與好壞要分開，評價要給理由。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-value-judgment-1", prompt: "「這本書有三百頁」屬於？", options: ["事實陳述", "價值判斷", "個人感受", "廣告用語"], answer: 0, hints: ["可以查證", "客觀描述"], explanation: "「三百頁」是可以數、可以查證的客觀描述，屬於事實陳述。" },
    { id: "ct-value-judgment-2", prompt: "「這本書太厚了」屬於？", options: ["事實", "價值判斷", "測量結果", "科學事實"], answer: 1, hints: ["「太厚」是好壞感受", "因人而異"], explanation: "「太厚」表達個人對厚度的好惡，不同讀者感受不同，是價值判斷。" },
    { id: "ct-value-judgment-3", prompt: "為什麼價值判斷要說理由？", options: ["因為不說會被罵", "有理由才能讓別人理解並討論", "因為規定", "不需要理由"], answer: 1, hints: ["理由讓判斷可交流", "不然只是各說各話"], explanation: "說出理由與標準，別人才知道你的判斷從何而來，討論才有交集。" },
    { id: "ct-value-judgment-4", prompt: "「史上最好喝的奶茶」是？", options: ["可以驗證的事實", "主觀評價", "科學數據", "法律標準"], answer: 1, hints: ["「最好喝」無法客觀測量", "因人而異"], explanation: "「最好喝」是主觀感受，無法用客觀方法驗證，屬於廣告式的價值判斷。" },
    { id: "ct-value-judgment-5", prompt: "價值判斷有沒有對錯？", options: ["有標準答案", "沒有標準答案，但有理由的判斷更值得討論", "一定是錯的", "一定是對的"], answer: 1, hints: ["好壞因人而異", "理由決定品質"], explanation: "價值判斷沒有唯一標準答案，但依據理由與證據的判斷，討論價值更高。" },
    { id: "ct-value-judgment-6", prompt: "討論事情時，比較好的順序是？", options: ["先談好壞再談事實", "先確認事實，再談評價", "只談評價", "只談事實"], answer: 1, hints: ["事實是基礎", "評價在後"], explanation: "先讓雙方對事實有一致理解，再討論好壞，能避免雞同鴨講。" },
  ],
};

/* ===================== 19. 同理心：換上別人的鞋子 ===================== */
const CT_EMPATHY: OnionLesson = {
  id: "ct-empathy",
  title: "同理心：穿上別人的鞋子",
  subject: "思辨",
  topic: "同理心",
  grade: "思辨入門",
  stages: ["國中"],
  desc: "同學遲交作業，是偷懶還是家裡有事？先別急著罵，試著想想他經歷了什麼。",
  takeaways: [
    "同理心是想像別人的感受與處境",
    "了解原因，比急著責備更能解決問題",
    "「我理解你」和「我同意你」是兩回事",
    "同理心讓溝通更順，也讓判斷更完整",
  ],
  frames: [
    { step: "步驟 1：同學遲交作業", id: 1, caption: "小組作業，小美一直沒交，組長很生氣：「她就是偷懶！」", action: "wave", prop: { kind: "text", text: "她一定在偷懶", sub: "急著下結論？", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：先想想她的處境", id: 2, caption: "後來才知道，小美這週都在醫院照顧生病的奶奶，根本沒時間碰電腦。", ask: { prompt: "知道小美的處境後，原先的「偷懶」判斷？", options: ["還是對的", "太早下結論，沒看到她的處境", "更確定了", "沒影響"], answer: 1, hint: "資訊多了，判斷要更新。" }, action: "think", prop: { kind: "text", text: "不知道的事還很多", sub: "別急著貼標籤", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：這就是同理心", id: 3, caption: "試著站在別人的位置，想像他的感受和處境，這就叫同理心。", action: "point", prop: { kind: "text", text: "同理心＝站在對方位置想", sub: "想像他的處境與感受", tone: "ok" }, duration: 3400 },
    { step: "步驟 4：理解不等於同意", id: 4, caption: "理解小美遲交的原因，不代表同意小組可以不交作業，而是知道該怎麼一起解決。", ask: { prompt: "「理解對方」等於「完全同意對方」嗎？", options: ["等於", "不等於，理解是了解，同意是認同", "一定要同意", "不能理解"], answer: 1, hint: "兩個是不同層次。" }, action: "point", prop: { kind: "text", text: "理解 ≠ 同意", sub: "了解原因，還是可以討論", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：同理心讓判斷更完整", id: 5, caption: "知道原因後，組長才知道該怎麼幫忙：先分工接手，等奶奶好一點再補進度。", action: "walk", prop: { kind: "flow", steps: ["了解處境", "知道怎麼幫", "一起解決"], active: 2 }, duration: 3400 },
    { step: "步驟 6：急著責備的代價", id: 6, caption: "如果當初直接開罵，小美可能更沮喪，問題也沒解決，還傷了友誼。", ask: { prompt: "不先了解就直接責備，最可能？", options: ["問題自動解決", "傷了關係，問題也沒解決", "大家變團結", "沒有影響"], answer: 1, hint: "想想被罵的人會怎樣。" }, action: "think", prop: { kind: "text", text: "責備不解決問題", sub: "還可能傷關係", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：說出理解", id: 7, caption: "「我聽懂你最近很辛苦」這句話，就能讓對方感覺被看見，溝通變順。", action: "cheer", prop: { kind: "text", text: "我理解你最近的辛苦", sub: "一句話讓溝通變順", tone: "ok" }, duration: 3200 },
    { step: "步驟 8：同理心可以練習", id: 8, caption: "先聽完、再想想他的處境、最後才回應，同理心是可以每天練習的能力。", action: "cheer", prop: { kind: "flow", steps: ["先聽完", "想他的處境", "再回應"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：先穿上別人的鞋子，再說話。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-empathy-1", prompt: "「同理心」最接近哪個意思？", options: ["站在對方位置想像他的感受與處境", "同意對方所有行為", "可憐對方", "模仿對方"], answer: 0, hints: ["換位感受", "不是同意"], explanation: "同理心是設身處地理解別人的感受與處境，但不代表認同對方的一切。" },
    { id: "ct-empathy-2", prompt: "同學沒交作業就先罵「他偷懶」，可能？", options: ["一定正確", "太早下結論，沒看到他的處境", "讓他更努力", "問題解決"], answer: 1, hints: ["資訊不足", "處境可能不同"], explanation: "沒了解情況就貼標籤，容易誤解別人，也可能錯過真正需要幫助的地方。" },
    { id: "ct-empathy-3", prompt: "「我理解你」和「我同意你」的關係是？", options: ["完全一樣", "理解是了解處境，同意是認同行為，兩回事", "一定要先同意", "不能理解"], answer: 1, hints: ["了解 ≠ 認同", "可以理解但不同意"], explanation: "理解是明白對方為什麼這樣，同意是認為對方做得對，兩者可以分開。" },
    { id: "ct-empathy-4", prompt: "急著責備而不先了解，最可能造成？", options: ["問題自動解決", "關係受傷，問題也沒解決", "大家變團結", "沒影響"], answer: 1, hints: ["被罵的人會受傷", "真正的問題被忽略"], explanation: "責備讓對方防衛或沮喪，真正的問題反而沒被處理，關係也受損。" },
    { id: "ct-empathy-5", prompt: "「我聽懂你最近很辛苦」這句話的作用是？", options: ["讓對方感覺被理解，溝通更順", "表示對方做得對", "結束對話", "責備對方"], answer: 0, hints: ["被看見的感受", "打開溝通"], explanation: "表達理解能讓對方感到被尊重，雙方的對話才有辦法繼續。" },
    { id: "ct-empathy-6", prompt: "練習同理心的步驟比較像是？", options: ["先罵再問", "先聽完、想對方處境、再回應", "只講自己想講的", "不理對方"], answer: 1, hints: ["順序很重要", "先理解後回應"], explanation: "先完整聽、再試著理解處境，最後才回應，是同理心的練習順序。" },
  ],
};

/* ===================== 20. 集體決策：一個人聰明，一群人？ ===================== */
const CT_GROUP_DECISION: OnionLesson = {
  id: "ct-group-decision",
  title: "集體決策：一群人怎麼做決定",
  subject: "思辨",
  topic: "集體決策",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "小組討論要選主題，有人怕得罪人就跟著舉手，結果選了大家都不滿意的方案。這就是集體決策的陷阱。",
  takeaways: [
    "一群人決策，不保證比一個人聰明",
    "怕得罪人而跟風，會讓想法被埋沒",
    "先各自表達，再討論，決策品質更好",
    "鼓勵說出不一樣的意見，是團隊的責任",
  ],
  frames: [
    { step: "步驟 1：小組選主題", id: 1, caption: "小組要選報告主題，小明先喊「海洋」，大家怕麻煩就跟著舉手，其實很多人不想要。", action: "wave", prop: { kind: "text", text: "跟著舉手就好？", sub: "很多人不想要但不敢說", tone: "warn" }, duration: 3400 },
    { step: "步驟 2：這是從眾效應", id: 2, caption: "因為怕得罪人、怕被笑，就跟著多數人走，自己的真實想法被藏起來，叫從眾效應。", ask: { prompt: "小組討論時，明明不贊成卻跟著舉手，這是？", options: ["誠實表達", "從眾：為了合群隱藏真實想法", "領導力", "理性判斷"], answer: 1, hint: "想想為什麼跟著舉手。" }, action: "think", prop: { kind: "text", text: "從眾效應", sub: "為了合群藏起想法", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：沉默的多數", id: 3, caption: "第一個人說 A，其他人就算想要 B，也容易不好意思反對，A 就這樣通過了。", action: "point", prop: { kind: "flow", steps: ["有人先提 A", "其他人不好意思反對", "A 被誤以為大家都同意"], active: 2 }, duration: 3400 },
    { step: "步驟 4：先各自寫下來", id: 4, caption: "更好的做法：大家先把想法寫下來、各自表達，再一起討論，而不是先看別人眼色。", ask: { prompt: "避免從眾，比較好的第一步是？", options: ["讓最會說話的人先講", "各自先寫下自己的想法", "直接投票", "聽班長就好"], answer: 1, hint: "先讓每個人獨立思考。" }, action: "cheer", prop: { kind: "flow", steps: ["各自寫想法", "輪流表達", "再一起討論"], active: 2 }, duration: 3600 },
    { step: "步驟 5：不一樣的意見很珍貴", id: 5, caption: "敢說「我不同意」的人，常常能幫團隊發現漏看的問題。異議不是搗蛋。", ask: { prompt: "團隊裡有人提出不同意見，應該？", options: ["叫他閉嘴", "聽聽看，可能發現漏看的問題", "嘲笑他", "以後不找他"], answer: 1, hint: "異議可能是寶藏。" }, action: "think", prop: { kind: "text", text: "異議不是搗蛋", sub: "可能是團隊的救命索", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：避免團體迷思", id: 6, caption: "團隊為了維持和諧，不敢挑戰大家的共識，做出糟糕決定，這叫團體迷思。", action: "point", prop: { kind: "text", text: "團體迷思", sub: "太和諧反而危險", tone: "warn" }, duration: 3400 },
    { step: "步驟 7：指定一個唱反調的人", id: 7, caption: "有些團隊會指定一個人專門負責找漏洞，確保沒人想到的風險也被討論到。", action: "walk", prop: { kind: "flow", steps: ["指定唱反調者", "專找漏洞", "補上盲點"], active: 2 }, duration: 3400 },
    { step: "步驟 8：好的決策長這樣", id: 8, caption: "每個人敢說真話、異議被接住、理由被討論，最後的決定才會比較穩。", action: "cheer", prop: { kind: "balance", left: "敢說真話", right: "討論理由" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：一群人要更好，就要讓每個人說真話。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-group-decision-1", prompt: "「從眾效應」指的是？", options: ["為了合群而隱藏自己的真實想法", "獨立思考後表達意見", "領導團隊", "統計結果"], answer: 0, hints: ["怕被笑、怕得罪人", "跟多數走"], explanation: "從眾是為了融入群體而放棄表達真實想法，跟著多數人走。" },
    { id: "ct-group-decision-2", prompt: "小組討論時，先各自寫下想法的好處是？", options: ["讓最會說話的人主導", "讓每個人先獨立思考，不被別人影響", "節省時間", "不用討論"], answer: 1, hints: ["避免被帶風向", "獨立思考在先"], explanation: "先各自寫想法，能降低第一個發言者對其他人的影響，想法更多元。" },
    { id: "ct-group-decision-3", prompt: "團隊裡有人提出不同意見，比較好的態度是？", options: ["叫他閉嘴", "聽聽看，可能發現漏看的問題", "嘲笑他", "排除他"], answer: 1, hints: ["異議有價值", "可能補上盲點"], explanation: "異議常能指出團隊沒注意到的風險，尊重並討論它對決策有益。" },
    { id: "ct-group-decision-4", prompt: "「團體迷思」是？", options: ["團隊思考特別快", "為了維持和諧而不敢挑戰共識，做出爛決定", "大家意見很多", "討論很熱烈"], answer: 1, hints: ["過度和諧", "不敢挑戰"], explanation: "團體迷思是成員太在意和諧、不敢提異議，導致共識建立在沒被檢驗的假設上。" },
    { id: "ct-group-decision-5", prompt: "「指定一個人唱反調」的目的是？", options: ["找人吵架", "確保風險和漏洞也被討論到", "浪費時間", "欺負人"], answer: 1, hints: ["專找問題", "補上盲點"], explanation: "指定唱反調者，是刻意讓團隊裡有聲音挑戰共識，把風險攤開來檢視。" },
    { id: "ct-group-decision-6", prompt: "什麼樣的團隊決策品質比較好？", options: ["大家都不敢反對", "每個人敢說真話，異議被討論", "最快決定就好", "聽最大聲的人"], answer: 1, hints: ["真話被接住", "理由被討論"], explanation: "當成員能自由表達異議、理由被認真討論時，決策品質才會提升。" },
  ],
};

const CRITICAL_THINKING_LESSONS_3: OnionLesson[] = [
  CT_ONLINE_RUMOR,
  CT_LOGICAL_FALLACY,
  CT_FRAMING,
  CT_CREDIBILITY,
  CT_COGNITIVE_BIAS,
  CT_VALUE_JUDGMENT,
  CT_EMPATHY,
  CT_GROUP_DECISION,
];

export default CRITICAL_THINKING_LESSONS_3;
