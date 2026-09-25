/**
 * 思辨（批判性思考）系列第二批課程（critical-thinking-add2.ts）
 *
 * 對應 BD 系列分鏡腳本：自我認知（BD-003）、選擇的代價（BD-004）、
 * 觀點與立場（BD-006）、刻板印象（BD-008）、抽樣與樣本（BD-010）、
 * 數字與圖表（BD-011）。
 *
 * 設計原則：9 幀分鏡、至少 3 幀中途提問、6 題闖關、4 條以上 takeaways，
 * 繁體中文，subject="思辨"，stages=["國中"]。教具依概念選用
 * text／flow／cycle／balance／bars／numberLine，並保持圖解一致。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 7. 自我認知：我以為的我 ===================== */
const CT_SELF_AWARENESS: OnionLesson = {
  id: "ct-self-awareness",
  title: "我以為的我：認識自己的視角",
  subject: "思辨",
  topic: "自我認知",
  grade: "思辨入門",
  stages: ["國中"],
  desc: "你怎麼描述自己？別人又怎麼看你？兩邊不一定一樣，把兩邊合起來，才能更認識自己。",
  takeaways: [
    "自己眼中的自己，和別人眼中的自己常常不同",
    "自我認知可能受心情、習慣、他人評價影響",
    "多聽不同人的回饋，可以補上自己看不到的部分",
    "認識自己是一段持續調整的過程，不是一次定案",
  ],
  frames: [
    { step: "步驟 1：寫下三個形容詞", id: 1, caption: "拿出一張紙，寫下三個形容自己的詞：你覺得自己平常是什麼樣的人？", action: "wave", prop: { kind: "text", text: "我是……", sub: "寫下三個形容詞", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：對照兩邊的看法", id: 2, caption: "再想想：同學眼中的你、家人眼中的你，寫出來的詞會和你自己一樣嗎？", ask: { prompt: "自己寫的形容詞，和別人寫的形容詞，最可能是？", options: ["兩邊一定完全相同", "可能不同，因為看到的面向不同", "別人的看法一定不準", "自己的看法才是對的"], answer: 1, hint: "每個人看到你的面向本來就不同。" }, action: "think", prop: { kind: "balance", left: "我眼中的我", right: "別人眼中的我" }, duration: 3600 },
    { step: "步驟 3：看自我分數的起伏", id: 3, caption: "被稱讚時你可能給自己打 8 分，考砸後卻掉到 3 分，同一個人分數起伏很大。", action: "point", prop: { kind: "numberLine", from: 0, to: 10, cursor: 5, marks: [{ at: 3, label: "考砸後 3 分", tone: "warn" }, { at: 8, label: "被稱讚 8 分", tone: "ok" }] }, duration: 3600 },
    { step: "步驟 4：拆解心情影響循環", id: 4, caption: "心情和剛發生的事，會像這樣一圈一圈影響你對自己的看法。", ask: { prompt: "同樣是自己，為什麼今天覺得很棒、明天覺得不行？", options: ["因為評價系統壞掉了", "人本來就沒有固定性格", "明天的自己特別厲害", "情緒和當下事件影響了自我評價"], answer: 3, hint: "想想考試前後的心情差別。" }, action: "think", prop: { kind: "cycle", nodes: ["被稱讚→覺得很棒", "考砸→覺得不行", "情緒循環影響評價"], active: 2 }, duration: 3600 },
    { step: "步驟 5：把兩種說法疊在一起", id: 5, caption: "把自己說的和別人觀察到的合在一起對照，才會得到更立體的自己。", action: "point", prop: { kind: "flow", steps: ["自己的說法", "別人的觀察", "合起來更立體"], active: 2 }, duration: 3400 },
    { step: "步驟 6：收下不同的回饋", id: 6, caption: "別人的回饋不是打擊你，而是提供一面你看不到自己的鏡子。", ask: { prompt: "收到和自己認知不同的回饋，最好的反應是？", options: ["先聽完，想想有沒有道理", "馬上反駁回去保護自己", "牢牢記住對方的口氣", "當作沒聽到就好"], answer: 0, hint: "回饋是鏡子，不是攻擊。" }, action: "think", prop: { kind: "text", text: "回饋是另一面鏡子", sub: "先聽，再想想", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：看自己怎樣慢慢改變", id: 7, caption: "去年你很內向，今年可能變開朗；自我認知要跟著更新，不是一次定案。", action: "walk", prop: { kind: "flow", steps: ["去年的我", "今年的我", "持續更新"], active: 2 }, duration: 3400 },
    { step: "步驟 8：接納強項與弱點", id: 8, caption: "認識自己不是要變完美，而是知道哪裡強、哪裡可以慢慢調整就好。", action: "cheer", prop: { kind: "text", text: "知道強項，也接受弱點", sub: "慢慢調整就好", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：兩個視角合起來", id: 9, caption: "記住：自己與別人兩個視角合起來，才是更完整的你。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ct-self-awareness-1", prompt: "為什麼「自己眼中的我」和「別人眼中的我」常常不一樣？", options: ["因為其中一邊一定在說謊", "因為大家其實都隨便猜你", "自己懂內心、別人看行為，視角本來就不同", "因為每個人都很會偽裝"], answer: 2, hints: ["兩種視角看到的東西不同", "各有擅長看到的面向"], explanation: "自己最清楚內心想法，別人能觀察外在行為，兩邊拼起來才完整。" },
    { id: "ct-self-awareness-2", prompt: "同樣是自己，為什麼今天覺得很棒、明天覺得不行？", options: ["情緒和當下成敗會影響自我評價", "因為人根本沒有固定的性格", "代表自我評價系統壞掉了", "明天的表現一定比今天差"], answer: 0, hints: ["想想心情的影響", "單一事件不能代表全部"], explanation: "自我評價容易被當下心情和成敗帶著走，別用單一事件就定義自己。" },
    { id: "ct-self-awareness-3", prompt: "聽到和自己認知不同的回饋，比較好的做法是？", options: ["立刻反駁回去，保護自己", "為了不得罪對方而照單全收", "以後完全不理這個人", "先聽完，再想想有沒有道理"], answer: 3, hints: ["回饋是參考不是命令", "先消化再判斷"], explanation: "先聽完並思考，再決定採納或忽略，不必急著反駁或全盤接受。" },
    { id: "ct-self-awareness-4", prompt: "「自我認知」最接近哪個意思？", options: ["老師和同學幫你打的成績", "自己對能力、性格與價值的了解和看法", "爸媽幫你取的名字和期待", "網路上別人對你的留言"], answer: 1, hints: ["是自己對自己的看法", "別人評價只是其中一部分"], explanation: "自我認知是自己對自己整體的了解，會隨經驗持續調整。" },
    { id: "ct-self-awareness-5", prompt: "認識自己最好的方式是？", options: ["只看成績單上的分數", "只聽自己想聽的話", "自己的反思加上別人的回饋互相對照", "什麼都不想，靠直覺就好"], answer: 2, hints: ["需要內外兩種資訊", "單一來源容易偏"], explanation: "自己反思加上旁人觀察互相對照，才能補上各自的盲點。" },
    { id: "ct-self-awareness-6", prompt: "關於認識自己，下列哪個想法最健康？", options: ["接受自己有強項也有弱點，持續調整", "小學認定一次，以後都不用改", "只記住缺點，才會一直進步", "只記住優點，心情才會好"], answer: 0, hints: ["人會改變", "接納不完美"], explanation: "認識自己是動態過程：肯定強項、也承認弱點，並隨著成長更新。" },
  ],
};

/* ===================== 8. 選擇的代價：機會成本 ===================== */
const CT_CHOICE_COST: OnionLesson = {
  id: "ct-choice-cost",
  title: "選擇的代價：看不見的成本",
  subject: "思辨",
  topic: "選擇的代價",
  grade: "思辨入門",
  stages: ["國中"],
  desc: "選了 A，就等於放棄 B 可能帶來的好處。這個「放棄掉的好處」，就是選擇的真正代價。",
  takeaways: [
    "每個選擇都會放棄另一條路的可能",
    "選擇真正的代價，是放棄掉的那個次佳選項",
    "比較代價時，要同時想清楚兩邊各自會得到什麼",
    "先想清楚自己要什麼，再決定放棄什麼",
  ],
  frames: [
    { step: "步驟 1：面對兩個想去的地方", id: 1, caption: "週末你有兩個想去的地方：圖書館看書，或和同學去遊樂園，時間不夠只能選一個。", action: "wave", prop: { kind: "balance", left: "圖書館看書", right: "遊樂園同樂" }, duration: 3400 },
    { step: "步驟 2：算出選到與放棄", id: 2, caption: "如果你選了遊樂園，就同時放棄了在圖書館安靜看書的那個下午。", ask: { prompt: "選了遊樂園，真正的代價是什麼？", options: ["放棄了去圖書館能得到的收穫", "買門票花掉的錢", "其實一點代價都沒有", "同學會不會因此生氣"], answer: 0, hint: "代價是沒選的那條路。" }, action: "think", prop: { kind: "balance", left: "選到的快樂", right: "放棄的收穫" }, duration: 3600 },
    { step: "步驟 3：認識機會成本", id: 3, caption: "經濟學把「為了選擇 A 而放棄的次佳選項」，叫做機會成本。", action: "point", prop: { kind: "text", text: "機會成本＝放棄的次佳選項", sub: "看不見，但確實存在", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：看一筆錢的兩種花法", id: 4, caption: "你存了 500 元：買遊戲片，就不能買那本你需要的參考書。", ask: { prompt: "這 500 元買了遊戲片，被放棄的是？", options: ["遊戲片帶來的樂趣", "500 元這個數目本身", "用 500 元買參考書得到的幫助", "沒有任何人受到損失"], answer: 2, hint: "想想沒買的那樣東西能帶來什麼。" }, action: "think", prop: { kind: "bars", items: [{ label: "遊戲片", value: 500 }, { label: "參考書", value: 500 }], unit: "元" }, duration: 3600 },
    { step: "步驟 5：看時間怎麼被排擠", id: 5, caption: "滑手機兩小時，不只花掉時間，還放棄了本來能打球、閱讀、陪家人的時光。", action: "point", prop: { kind: "flow", steps: ["兩小時滑手機", "放棄打球與閱讀", "時間也是成本"], active: 2 }, duration: 3400 },
    { step: "步驟 6：重估免費的代價", id: 6, caption: "免費的活動也可能很花時間，便宜不一定划算，要看放棄了什麼。", ask: { prompt: "「免費但很花時間」的活動，它的代價其實？", options: ["既然免費，就什麼代價都沒有", "時間成本很高，放棄了其他機會", "一定比付費活動更划算", "代表這個活動品質不好"], answer: 1, hint: "代價不限於金錢。" }, action: "think", prop: { kind: "text", text: "免費 ≠ 沒有代價", sub: "時間也是成本", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：先想清楚自己要什麼", id: 7, caption: "先問自己這次最想要什麼，再比較哪個選擇更符合目標，放棄時才不會一直後悔。", action: "cheer", prop: { kind: "flow", steps: ["想清楚目標", "比較兩邊收穫", "決定並接受放棄"], active: 2 }, duration: 3400 },
    { step: "步驟 8：把選的路走好", id: 8, caption: "選了就別一直想「早知道」，把精力放在把這條路走好，比後悔更有用。", action: "walk", prop: { kind: "text", text: "選了就好好走", sub: "與其後悔，不如努力", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：每個選擇都有代價", id: 9, caption: "記住：每個選擇都有看不見的代價。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ct-choice-cost-1", prompt: "「機會成本」指的是？", options: ["選擇本身要付的價錢", "花出去的每一分錢加總", "運氣不好時賠掉的錢", "為了選 A 而放棄的次佳選項"], answer: 3, hints: ["重點是沒選的那條路", "它是一種隱藏成本"], explanation: "機會成本是選 A 時，放棄的下一個最好選項能帶來的好處。" },
    { id: "ct-choice-cost-2", prompt: "週末選了遊樂園，你的機會成本比較可能是？", options: ["遊樂園的門票錢", "去圖書館看書能得到的收穫", "來回搭車的車資", "和同學共進午餐的錢"], answer: 1, hints: ["沒選的那邊", "它原本能帶來什麼"], explanation: "你放棄了去圖書館的下午及其收穫，這才是機會成本；門票車錢是會計花費。" },
    { id: "ct-choice-cost-3", prompt: "為什麼「免費」的活動也可能代價很高？", options: ["它占用大量時間，排擠了其他機會", "因為免費的東西通常品質很差", "天下沒有白吃午餐，一定有詐", "其實沒有特別的原因"], answer: 0, hints: ["代價不限於金錢", "時間也是成本"], explanation: "即使不花錢，花掉的時間也排擠了別的活動，時間成本就是代價。" },
    { id: "ct-choice-cost-4", prompt: "做選擇前比較兩個選項時，應該看什麼？", options: ["只看哪一個比較便宜", "只看哪一個比較好玩", "同時看選到的收穫和放棄那邊的收穫", "交給別人決定就好"], answer: 2, hints: ["兩邊都要看", "別只看單面"], explanation: "理性權衡要同時比較「選它得到什麼」與「放棄它失去什麼」。" },
    { id: "ct-choice-cost-5", prompt: "選完之後一直想「早知道選另一個」，比較好的做法是？", options: ["不斷後悔，才能證明自己委屈", "設法立刻重選一次", "把責任推給別人", "把精力放在把當前這個選擇做好"], answer: 3, hints: ["後悔改變不了結果", "投入當前的選擇"], explanation: "過去的選擇無法重來，專注把現在的路走好，才對自己有利。" },
    { id: "ct-choice-cost-6", prompt: "下列哪個決定最明顯有機會成本？", options: ["依規定參加學校朝會", "用週末兩小時練琴，放棄看喜歡的節目", "搭固定路線的校車上學", "準時吃學校營養午餐"], answer: 1, hints: ["看有沒有放棄別的事", "有沒有排擠效果"], explanation: "練琴占用了本來可以看節目的時間，放棄的娛樂就是機會成本。" },
  ],
};

/* ===================== 9. 觀點與立場：為什麼看法不同 ===================== */
const CT_PERSPECTIVE_STANCE: OnionLesson = {
  id: "ct-perspective-stance",
  title: "觀點與立場：為什麼我們看法不同",
  subject: "思辨",
  topic: "觀點與立場",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "同一場球賽，兩邊球迷說法完全不一樣。立場不同、資訊不同，看法自然不同，不代表有人一定錯。",
  takeaways: [
    "立場、經驗、資訊不同，都會造成看法不同",
    "先聽懂對方為什麼這樣想，再決定要不要同意",
    "不同意見不一定只有一個對、一個錯",
    "能說出對方論點最強的地方，才是真的聽懂了",
  ],
  frames: [
    { step: "步驟 1：看同樣一球的兩種反應", id: 1, caption: "球賽最後一球，裁判喊犯規。主隊球迷說裁判英明，客隊球迷直說誤判。", action: "wave", prop: { kind: "balance", left: "主隊：判得對", right: "客隊：判錯了" }, duration: 3400 },
    { step: "步驟 2：比較兩邊的滿意分數", id: 2, caption: "同一個判決，主隊球迷滿意度高達 9 分，客隊球迷卻只有 2 分，差這麼多。", ask: { prompt: "兩隊球迷看同一球卻結論相反，最可能的原因是？", options: ["其中一邊的眼睛有問題", "立場和期望影響了對判決的解讀", "裁判當下真的看錯了", "那顆球本身有問題"], answer: 1, hint: "想想他們各自希望誰贏。" }, action: "think", prop: { kind: "bars", items: [{ label: "主隊球迷", value: 9 }, { label: "客隊球迷", value: 2 }], unit: "分" }, duration: 3600 },
    { step: "步驟 3：拆解看法怎麼形成", id: 3, caption: "除了立場，每個人看到的資訊也不同：有人看正面，有人只看到側面。", action: "point", prop: { kind: "flow", steps: ["立場", "過去經驗", "掌握的資訊", "合成看法"], active: 3 }, duration: 3400 },
    { step: "步驟 4：先問對方為什麼這樣想", id: 4, caption: "先別急著說對方錯，試著問：他站在什麼立場、看到什麼資訊？", ask: { prompt: "面對不同意見，第一步最好做什麼？", options: ["想辦法證明對方是錯的", "大聲一點把對方壓過去", "先封鎖對方的意見", "先理解對方為什麼這樣想"], answer: 3, hint: "先聽懂，再判斷。" }, action: "think", prop: { kind: "text", text: "先問：他為什麼這樣想？", sub: "理解在前，判斷在後", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：練習重述對方的話", id: 5, caption: "試著站在對方立場重講一次他的論點，講到他點頭，才算真的聽懂。", action: "point", prop: { kind: "flow", steps: ["聽對方說", "重述他的論點", "他點頭＝聽懂"], active: 2 }, duration: 3400 },
    { step: "步驟 6：尊重地表達不同意", id: 6, caption: "聽懂不代表要同意；你可以說出哪裡不同意，同時尊重對方的看法。", ask: { prompt: "聽懂對方論點之後，可以怎麼做？", options: ["只能選擇完全同意對方", "當場開始翻臉吵架", "可以不同意，但尊重並說明理由", "假裝同意把對方打發掉"], answer: 2, hint: "理解與同意是兩回事。" }, action: "cheer", prop: { kind: "text", text: "理解 ≠ 同意", sub: "可以尊重地不同意", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：補齊自己缺的資訊", id: 7, caption: "發現自己資訊不足就去補資料；立場不同，也別忘了用證據說話。", action: "walk", prop: { kind: "flow", steps: ["發現資訊不足", "找資料補齊", "再用證據討論"], active: 2 }, duration: 3400 },
    { step: "步驟 8：好討論的雙向樣子", id: 8, caption: "好的討論不是比誰大聲，而是雙方都說得清理由，也聽得懂對方。", action: "cheer", prop: { kind: "balance", left: "說清楚理由", right: "聽懂對方" }, duration: 3200 },
    { step: "步驟 9：先理解再談對錯", id: 9, caption: "記住：先理解立場，再討論對錯。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ct-perspective-stance-1", prompt: "兩隊球迷看同一球判決卻結論相反，最主要原因是？", options: ["球場燈光讓其中一邊看不清楚", "裁判永遠都偏心", "立場與期望影響了對判決的解讀", "有人眼睛天生比較不好"], answer: 2, hints: ["各自希望誰贏", "立場會影響解讀"], explanation: "立場和期望會影響我們怎麼解讀同一件事，這是常見的心理現象。" },
    { id: "ct-perspective-stance-2", prompt: "看法不同時，第一步比較好的做法是？", options: ["先理解對方為什麼這樣想", "直接宣告對方錯了", "找其他人來公審對方", "拒絕繼續討論"], answer: 0, hints: ["理解在前", "判斷在後"], explanation: "先弄清楚對方的立場與資訊來源，才知道分歧點在哪，討論才有意義。" },
    { id: "ct-perspective-stance-3", prompt: "「聽懂對方」最好的證明是？", options: ["大聲宣布自己贏了", "牢牢記住對方的名字", "全程保持安靜不說話", "把對方論點重述到他點頭認同"], answer: 3, hints: ["能重述才算懂", "對方確認才算數"], explanation: "能完整準確重述對方論點、甚至讓對方認同，才代表真的聽懂。" },
    { id: "ct-perspective-stance-4", prompt: "理解對方之後，可以？", options: ["因為理解了就必須同意", "不同意，但尊重並說明自己的理由", "開始批評對方這個人", "假裝同意來打發對方"], answer: 1, hints: ["理解與同意分開", "尊重不同意見"], explanation: "理解不是投降，你可以清楚表達不同意，同時保持對人的尊重。" },
    { id: "ct-perspective-stance-5", prompt: "為什麼不同意見不一定只有一個對？", options: ["因為大家都輸不起", "因為這世上根本沒有標準答案", "不同立場與資訊下，各自可能看到不同面向", "因為每個人其實都對"], answer: 2, hints: ["立場資訊都不同", "各自有依據"], explanation: "當雙方掌握不同資訊、站在不同立場時，各自看法可能都有依據，未必只有一方正確。" },
    { id: "ct-perspective-stance-6", prompt: "好的討論最像哪一種？", options: ["雙方說清楚理由，也聽得懂對方", "比誰說話的聲音比較大", "誰先開口誰就輸了", "只輪到自己想講的那部分"], answer: 0, hints: ["雙方都要表達", "也要互相理解"], explanation: "好討論是雙向的：清楚表達自己理由，也認真聽懂對方理由。" },
  ],
};

/* ===================== 10. 刻板印象：貼標籤的危險 ===================== */
const CT_STEREOTYPE: OnionLesson = {
  id: "ct-stereotype",
  title: "刻板印象：別急著貼標籤",
  subject: "思辨",
  topic: "刻板印象",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "「男生都很……」「女生都喜歡……」這些話聽起來很熟，但把一群人用一句話概括，常常會誤傷人。",
  takeaways: [
    "刻板印象是用一個標籤概括一整群人",
    "群體裡每個人都不一樣，標籤常常不準",
    "標籤會讓我們看不見眼前這個人真正的樣子",
    "先認識具體的人，再形成看法，而不是先貼標籤",
  ],
  frames: [
    { step: "步驟 1：聽到一句熟悉的話", id: 1, caption: "有人說：「男生都很愛運動啦！」聽起來很熟，但班上真的每個男生都這樣嗎？", action: "wave", prop: { kind: "text", text: "男生都很愛運動？", sub: "這是真的嗎？", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：看男生的興趣分布", id: 2, caption: "班上 20 個男生興趣很分散：愛運動 8 人、愛畫畫 5 人、愛音樂 4 人、愛跳舞 3 人。", ask: { prompt: "「男生都很愛運動」這句話最大的問題在？", options: ["用一句話概括興趣其實很分散的一群人", "運動這個主題太重要了", "知道這句話的人實在太少", "它完全沒有提到女生"], answer: 0, hint: "看看這四種興趣各有多少人。" }, action: "point", prop: { kind: "bars", items: [{ label: "愛運動", value: 8 }, { label: "愛畫畫", value: 5 }, { label: "愛音樂", value: 4 }, { label: "愛跳舞", value: 3 }], unit: "人" }, duration: 3600 },
    { step: "步驟 3：認識刻板印象", id: 3, caption: "把一群人用一個簡單標籤概括，又忽略個別差異，這就是刻板印象。", action: "point", prop: { kind: "text", text: "刻板印象＝用標籤概括一群人", sub: "忽略個別差異", tone: "warn" }, duration: 3400 },
    { step: "步驟 4：追蹤標籤怎麼來", id: 4, caption: "標籤常來自少數例子、電視劇情或聽來的傳聞，不一定反映真實的多數。", ask: { prompt: "刻板印象最常從哪裡來？", options: ["長期仔細觀察每個人", "設計良好的科學實驗", "少數例子、劇情和口耳相傳", "每個人的成長紀錄"], answer: 2, hint: "想想電視和同學間的傳聞。" }, action: "think", prop: { kind: "flow", steps: ["少數例子", "劇情與傳聞", "變成標籤"], active: 2 }, duration: 3600 },
    { step: "步驟 5：看標籤怎麼傷人", id: 5, caption: "被貼標籤的人可能被誤解、被拒絕，甚至開始懷疑自己，傷害很真實。", action: "think", prop: { kind: "text", text: "標籤的傷害很真實", sub: "被誤解、被拒絕", tone: "warn" }, duration: 3400 },
    { step: "步驟 6：轉向眼前這個人", id: 6, caption: "與其問「男生都怎樣」，不如問眼前這個人喜歡什麼、擅長什麼。", ask: { prompt: "認識一個新同學，比較好的做法是？", options: ["先問他屬於哪個群體就下結論", "認識他本人，看他實際的表現與喜好", "用電視劇的情節來猜他", "照他的姓氏猜他的性格"], answer: 1, hint: "看具體的人，不是看標籤。" }, action: "cheer", prop: { kind: "flow", steps: ["放下標籤", "認識眼前的人", "看實際表現"], active: 2 }, duration: 3600 },
    { step: "步驟 7：發現標籤也會騙自己", id: 7, caption: "標籤不只誤傷別人，也會讓我們自己看不見真實世界，以為一切很簡單。", action: "think", prop: { kind: "text", text: "標籤讓我們看不見真實", sub: "世界比標籤複雜", tone: "warn" }, duration: 3200 },
    { step: "步驟 8：把每個人當獨特個體", id: 8, caption: "把每個人都當成獨特的個體來認識，世界會比想像中豐富很多。", action: "cheer", prop: { kind: "text", text: "每個人都是獨一無二", sub: "別讓標籤擋住眼睛", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：先認識人再下判斷", id: 9, caption: "記住：先認識人，再下判斷，不要急著貼標籤。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ct-stereotype-1", prompt: "「刻板印象」最接近下列哪個意思？", options: ["仔細認識每一個人之後的看法", "用一個簡單標籤概括一整群人", "親身觀察到的具體事實", "抽樣得宜的科學統計"], answer: 1, hints: ["忽略個別差異", "把一群人當成同一種人"], explanation: "刻板印象是用單一標籤涵蓋整群人的簡化想法，常忽略個別差異。" },
    { id: "ct-stereotype-2", prompt: "刻板印象最常來自哪裡？", options: ["長期而仔細的觀察", "設計嚴謹的科學調查", "每個人的自我描述", "少數例子、劇情與口耳相傳"], answer: 3, hints: ["想想它怎麼傳開的", "通常不是嚴謹證據"], explanation: "標籤常源於少數例子、影視劇情或口耳相傳，樣本不足也不具代表性。" },
    { id: "ct-stereotype-3", prompt: "「全班男生都很愛運動」這句話主要的問題是？", options: ["用一句話概括了每個人都不一樣的群體", "它把運動說得太重要了", "它講得實在太正確了", "它忘了順便提到女生"], answer: 0, hints: ["班上男生都一樣嗎", "個別差異被忽略"], explanation: "它把多樣化的群體壓成單一形象，忽略了每個人的實際差異。" },
    { id: "ct-stereotype-4", prompt: "被貼上標籤的人，可能受到什麼影響？", options: ["完全不會有任何影響", "反而會因此獲得特殊特權", "被誤解、被拒絕，甚至開始懷疑自己", "立刻就會變得更厲害"], answer: 2, hints: ["標籤會影響他人看待", "傷害很真實"], explanation: "標籤可能造成誤解與排擠，長期下來也會影響一個人對自己的看法。" },
    { id: "ct-stereotype-5", prompt: "認識新同學時，比較好的做法是？", options: ["先套用群體的標籤再說", "認識他本人，看實際表現與喜好", "用電視劇情來猜測他", "憑他的姓氏猜性格"], answer: 1, hints: ["看具體的人", "別用標籤代替認識"], explanation: "每個人都是獨特的，應透過實際互動認識對方，而不是先入為主套標籤。" },
    { id: "ct-stereotype-6", prompt: "發現自己心裡也有刻板印象時，可以怎麼做？", options: ["很正常，完全不用理會", "更用力地相信那個標籤", "從此不敢再認識別人", "覺察它，並用具體的個人經驗來修正"], answer: 3, hints: ["先覺察", "用真實經驗校正"], explanation: "覺察自己的標籤，再透過認識具體的人、累積真實經驗，慢慢修正看法。" },
  ],
};

/* ===================== 11. 抽樣與樣本：少數能代表全部嗎 ===================== */
const CT_SAMPLING: OnionLesson = {
  id: "ct-sampling",
  title: "抽樣與樣本：問三個人就夠了嗎",
  subject: "思辨",
  topic: "抽樣與樣本",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "問了三個人就說全班都喜歡，對嗎？樣本太小、又不平均，結論就容易歪掉。",
  takeaways: [
    "樣本是用來代表全體的一小群人",
    "樣本太小，結果容易偏差",
    "樣本不平均（只問同一類人）也不準",
    "下結論前先問：這個樣本代表誰？夠不夠？",
  ],
  frames: [
    { step: "步驟 1：比對樣本和全班人數", id: 1, caption: "全班有 30 人，你想知道最愛的點心，於是只先問了坐在隔壁的 3 個同學。", action: "wave", prop: { kind: "bars", items: [{ label: "全班人數", value: 30 }, { label: "你問的人", value: 3 }], unit: "人" }, duration: 3200 },
    { step: "步驟 2：看清 3 票的份量", id: 2, caption: "這 3 個人剛好都說巧克力，其他 27 人還沒問，你就想宣布全班最愛巧克力？", ask: { prompt: "只問三個人就說全班都喜歡巧克力，問題在哪？", options: ["巧克力一定是全班最愛的", "樣本太小，不能代表全班", "三個人說的就算數", "這樣調查完全沒問題"], answer: 1, hint: "想想 30 人裡你只問了 3 人。" }, action: "think", prop: { kind: "bars", items: [{ label: "說巧克力", value: 3 }, { label: "其他同學", value: 27 }], unit: "人" }, duration: 3600 },
    { step: "步驟 3：看樣本太小會怎樣", id: 3, caption: "樣本越大、越接近全體，結論越可靠；只問幾個人，很容易剛好問到同一類。", action: "point", prop: { kind: "flow", steps: ["樣本小", "剛好問到同類", "結論偏差"], active: 2 }, duration: 3400 },
    { step: "步驟 4：檢查樣本平不平均", id: 4, caption: "你訪問的都是愛吃甜點的同學，其中 8 個支持巧克力、2 個不支持，結果當然偏甜食。", ask: { prompt: "只問愛吃甜點的同學，得到的結論會？", options: ["完全準確地代表全班", "因為人數夠多所以最好", "對全班一點影響都沒有", "偏向甜食，不能代表全班"], answer: 3, hint: "你問的人本身就不平均。" }, action: "think", prop: { kind: "bars", items: [{ label: "支持巧克力", value: 8 }, { label: "不支持", value: 2 }], unit: "人" }, duration: 3600 },
    { step: "步驟 5：認識隨機抽樣", id: 5, caption: "比較好的做法是隨機抽樣：每個人被問到的機會都一樣，結果才比較能代表全體。", action: "point", prop: { kind: "text", text: "隨機抽樣：機會均等", sub: "每個人都可能被問到", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：拆新聞裡的民調", id: 6, caption: "新聞常說「民調顯示」，你要問：樣本多少人？怎麼抽的？有沒有只問到特定的人？", ask: { prompt: "看到「民調顯示」時，最該先注意什麼？", options: ["看到數字就直接相信", "數字看起來一定是對的", "樣本多大、怎麼抽的、問了誰", "根本不用管它怎麼來的"], answer: 2, hint: "先檢查樣本品質。" }, action: "think", prop: { kind: "text", text: "樣本多大？怎麼抽的？", sub: "先檢查再相信", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：分辨個案和統計", id: 7, caption: "一個人靠這方法考上好大學，不能證明它對大家都有效；個案是故事，不是統計。", action: "walk", prop: { kind: "flow", steps: ["個案故事", "不等於", "整體統計"], active: 2 }, duration: 3400 },
    { step: "步驟 8：下結論前三個檢查", id: 8, caption: "下次聽到「大家都說」，先問三件事：樣本夠大嗎？夠平均嗎？是隨機的嗎？", action: "cheer", prop: { kind: "flow", steps: ["夠大？", "夠平均？", "隨機？"], active: 2 }, duration: 3200 },
    { step: "步驟 9：樣本好結論才可靠", id: 9, caption: "記住：樣本要夠大、夠平均，結論才可靠。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ct-sampling-1", prompt: "「樣本」指的是什麼？", options: ["全部的每一個人", "問卷上寫的問題", "從全體抽出來代表它的一小群人", "最後統計用的圖表"], answer: 2, hints: ["是抽出來的那部分", "用來推測全體"], explanation: "樣本是從全體中抽出一部分人觀察，用來推測全體的情況。" },
    { id: "ct-sampling-2", prompt: "只問三個人就說全班都喜歡巧克力，主要問題是？", options: ["樣本太小，容易剛好問到同一類人", "巧克力一定最好吃", "三個人的答案永遠是對的", "人數多根本不是重點"], answer: 0, hints: ["30 人的全班 vs 3 人", "樣本要夠大"], explanation: "樣本太小很容易剛好問到特別的一群，直接推論全班就會出錯。" },
    { id: "ct-sampling-3", prompt: "抽樣時只問愛吃甜點的同學，會造成？", options: ["結論一定比誰都準", "全班每個人都會開心", "對結果完全沒有影響", "樣本不平均，結論偏向甜食"], answer: 3, hints: ["問的人本身就偏了", "結果跟著偏"], explanation: "樣本不平均時，結果只反映特定一群人的想法，不能代表全體。" },
    { id: "ct-sampling-4", prompt: "「隨機抽樣」的主要優點是？", options: ["花的錢一定最便宜", "每個人被抽到機會均等，結果較能代表全體", "結果保證百分之百正確", "可以只問自己認識的人"], answer: 1, hints: ["減少人為偏差", "更接近全體"], explanation: "隨機抽樣讓每個人機會均等，能減少偏見，結果更能代表全體。" },
    { id: "ct-sampling-5", prompt: "看到「民調顯示七成民眾支持」時，應該？", options: ["毫不懷疑地完全相信", "覺得它一定是捏造的", "先檢查樣本多大、怎麼抽、問了誰", "立刻轉發給所有朋友"], answer: 2, hints: ["民調品質看樣本", "先查再信"], explanation: "民調可信度取決於樣本大小、抽樣方式和訪問對象，不能只看一個數字。" },
    { id: "ct-sampling-6", prompt: "「有一個人靠這方法考上台大，所以大家都能」問題在？", options: ["把單一個案當成整體統計", "台大其實一點都不難考", "這個方法根本沒有任何用處", "聽到的人數實在太少"], answer: 0, hints: ["個案是故事", "不能代表所有人"], explanation: "單一個案不能推論到全體，需要更大、更平均的樣本才能下結論。" },
  ],
};

/* ===================== 12. 數字與圖表：圖表會騙人嗎 ===================== */
const CT_NUMBERS_CHARTS: OnionLesson = {
  id: "ct-numbers-charts",
  title: "數字與圖表：眼見不一定為憑",
  subject: "思辨",
  topic: "數字與圖表",
  grade: "思辨進階",
  stages: ["國中"],
  desc: "同一份數據，換個刻度、砍掉起點，看起來就完全不同。看懂圖表背後的把戲，才不會被數字帶著走。",
  takeaways: [
    "圖表的刻度可以放大或縮小差距",
    "從零開始的圖表，比較不容易騙人",
    "只看部分時間範圍，可能誤導結論",
    "看圖表前先檢查：起點、刻度、範圍、樣本",
  ],
  frames: [
    { step: "步驟 1：看兩次的成績", id: 1, caption: "小華上次考 80 分，這次考 81 分，其實只進步了 1 分而已。", action: "wave", prop: { kind: "bars", items: [{ label: "上次", value: 80 }, { label: "這次", value: 81 }], unit: "分" }, duration: 3200 },
    { step: "步驟 2：比對兩張圖的起點", id: 2, caption: "數據其實都是 80 和 81，但第二張圖把縱軸起點拉到 79 分，看起來就差很多。", ask: { prompt: "同一份數據，為什麼兩張圖看起來差很多？", options: ["圖表的縱軸起點和刻度不同", "其中一張圖的數據是假的", "分數自己會忽然改變", "看圖的人眼睛有問題"], answer: 0, hint: "想想縱軸是從幾分開始畫的。" }, action: "point", prop: { kind: "bars", items: [{ label: "上次", value: 80 }, { label: "這次", value: 81 }], unit: "分" }, duration: 3600 },
    { step: "步驟 3：看懂起點把差距放大", id: 3, caption: "把縱軸起點拉高，小小 1 分的差異就被放大，看起來像巨大的進步。", action: "think", prop: { kind: "text", text: "拉高起點 → 放大差異", sub: "看清楚再下結論", tone: "warn" }, duration: 3400 },
    { step: "步驟 4：留意看的時間範圍", id: 4, caption: "只看最近三天的曲線，和看一整年的曲線，得到的結論可能完全相反。", ask: { prompt: "看統計圖表時，時間範圍為什麼很重要？", options: ["範圍大小根本不影響結論", "時間軸越短，圖表越可信", "只截一小段，容易誤導整體趨勢", "範圍拉得越大越不可信"], answer: 2, hint: "想想只挑其中一段會怎樣。" }, action: "think", prop: { kind: "flow", steps: ["只看三天", "看一整年", "結論可能相反"], active: 2 }, duration: 3600 },
    { step: "步驟 5：看穿平均數的藏拙", id: 5, caption: "全班平均 90 分聽起來很棒，但有人考 100 分、也有人只考 60 分。", ask: { prompt: "全班平均 90 分，能代表每個人都考很好嗎？", options: ["能，平均就是每個人的分數", "不能，平均可能藏住極端差異", "代表全班每個人都滿分", "代表一定有人作弊"], answer: 1, hint: "想想有人考 100、有人考 60。" }, action: "point", prop: { kind: "bars", items: [{ label: "最高", value: 100 }, { label: "平均", value: 90 }, { label: "最低", value: 60 }], unit: "分" }, duration: 3600 },
    { step: "步驟 6：比較前先對齊條件", id: 6, caption: "兩班人數、考卷難度不同時，直接把平均拿來比並不公平，要先對齊條件。", action: "think", prop: { kind: "text", text: "比較前先對齊條件", sub: "人數、考卷、時間要對齊", tone: "warn" }, duration: 3400 },
    { step: "步驟 7：追問圖表背後的樣本", id: 7, caption: "別忘了問：這份數據抽樣多少人、問了誰？樣本差，圖再漂亮也不可信。", action: "walk", prop: { kind: "flow", steps: ["看圖表", "查樣本", "查起點刻度", "再下結論"], active: 3 }, duration: 3400 },
    { step: "步驟 8：養成四步檢查習慣", id: 8, caption: "下次看到嚇人的圖表，先檢查：起點在哪、刻度均勻嗎、範圍完整嗎、樣本夠嗎。", action: "cheer", prop: { kind: "text", text: "起點？刻度？範圍？樣本？", sub: "四個都檢查再相信", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：先聽清楚數字怎麼說", id: 9, caption: "記住：數字會說話，但也要先聽清楚它怎麼說。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "ct-numbers-charts-1", prompt: "同一份數據畫成兩張圖卻看起來差很多，最可能是？", options: ["其中一張圖一定造假", "原來的數據被偷偷換掉", "看圖的人視力有問題", "圖表的縱軸起點或刻度不同"], answer: 3, hints: ["想想縱軸從哪開始", "刻度會影響視覺"], explanation: "縱軸起點不同會放大或縮小視覺差異，數據本身可能完全一樣。" },
    { id: "ct-numbers-charts-2", prompt: "為什麼有人要把圖表的縱軸起點拉高？", options: ["為了讓圖表更美觀", "為了放大差距，讓小變化看起來很大", "因為數字實在太多", "因為這樣閱讀比較舒服"], answer: 1, hints: ["視覺效果會改變", "目的常是影響感受"], explanation: "拉高起點會讓小差距在視覺上變巨大，常用來強調某種結論。" },
    { id: "ct-numbers-charts-3", prompt: "只看「最近三天」的數據曲線，可能？", options: ["誤導我們錯判整體的長期趨勢", "一定比看一整年更準確", "看到的結論最完整", "對判斷完全沒有影響"], answer: 0, hints: ["時間範圍太短", "看不到長期趨勢"], explanation: "時間範圍過短時，短期波動容易被誤以為是長期趨勢，結論易失準。" },
    { id: "ct-numbers-charts-4", prompt: "「全班平均 90 分」為什麼可能誤導人？", options: ["平均就等於每個人的分數", "90 分這個數字太高了", "平均數可能藏住高分與低分的落差", "平均數其實一點都不重要"], answer: 2, hints: ["有人滿分有人不及格時", "平均只是一個數字"], explanation: "平均數只看整體，看不到個別差異，極端高分和低分可能同時存在。" },
    { id: "ct-numbers-charts-5", prompt: "比較兩班成績時，哪個條件要先檢查？", options: ["兩班的教室誰比較大間", "誰當上了該班的班長", "兩班的上課時間誰比較早", "兩班人數、考卷難度是否真的可比"], answer: 3, hints: ["條件要對齊", "否則比較不公平"], explanation: "人數、考卷、評分標準不同時，直接比較平均會得到不公平的結論。" },
    { id: "ct-numbers-charts-6", prompt: "判斷一份統計圖表可不可信，最後也別忘了檢查？", options: ["圖用了什麼顏色", "背後樣本多大、怎麼抽的", "作者名字好不好記", "圖上的字體夠不夠大"], answer: 1, hints: ["樣本決定品質", "圖再美樣本差也沒用"], explanation: "圖表背後的樣本大小與抽樣方式，決定數據能不能代表真實全體。" },
  ],
};

const CRITICAL_THINKING_LESSONS_2: OnionLesson[] = [
  CT_SELF_AWARENESS,
  CT_CHOICE_COST,
  CT_PERSPECTIVE_STANCE,
  CT_STEREOTYPE,
  CT_SAMPLING,
  CT_NUMBERS_CHARTS,
];

export default CRITICAL_THINKING_LESSONS_2;
