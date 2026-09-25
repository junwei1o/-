/**
 * 思辨（批判性思考）系列第二批課程（critical-thinking-add2.ts）
 *
 * 對應 BD 系列分鏡腳本：自我認知（BD-003）、選擇的代價（BD-004）、
 * 觀點與立場（BD-006）、刻板印象（BD-008）、抽樣與樣本（BD-010）、
 * 數字與圖表（BD-011）。
 *
 * 設計原則與第一批相同：9 幀分鏡、至少 3 幀中途提問、6 題闖關、
 * 4 條以上 takeaways，繁體中文，subject="思辨"，stages=["國中"]。
 * prop 以 text/flow/cycle/balance/none 為主，避開數字一致性陷阱。
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
    { step: "步驟 1：先寫下我是誰", id: 1, caption: "拿出一張紙，寫下三個形容自己的詞：你覺得自己是什麼樣的人？", action: "wave", prop: { kind: "text", text: "我是……", sub: "寫下三個形容詞", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：別人眼中的我", id: 2, caption: "再想想：同學眼中的你、家人眼中的你，寫出來的詞會一樣嗎？", ask: { prompt: "自己寫的形容詞，和別人寫的形容詞，最可能是？", options: ["一定完全一樣", "可能不一樣，因為看的視角不同", "別人一定不準", "自己的一定錯"], answer: 1, hint: "每個人看到你的面向不同。" }, action: "think", prop: { kind: "text", text: "我眼中的我　vs　別人眼中的我", sub: "兩邊對照看看", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：兩種視角都有盲點", id: 3, caption: "自己最了解內心的想法，卻看不見自己給人的印象；別人看得到行為，卻猜不到你的心情。", action: "point", prop: { kind: "balance", left: "自己：懂內心", right: "別人：看得見行為" }, duration: 3600 },
    { step: "步驟 4：心情會改變答案", id: 4, caption: "今天被稱讚，你覺得自己很棒；明天考砸了，你可能覺得自己什麼都不行。", ask: { prompt: "同樣是自己，為什麼答案會變？", options: ["因為人會變來變去", "心情和當下事件影響了自我評價", "因為評價不準", "因為別人亂說"], answer: 1, hint: "想想考試前後的心情。" }, action: "think", prop: { kind: "cycle", nodes: ["被稱讚→覺得很棒", "考砸→覺得不行", "情緒影響評價"], active: 2 }, duration: 3600 },
    { step: "步驟 5：把兩邊合起來看", id: 5, caption: "把「自己說的」和「別人觀察到的」合在一起對照，會得到更立體的自己。", action: "point", prop: { kind: "flow", steps: ["自己的說法", "別人的觀察", "合起來更立體"], active: 2 }, duration: 3400 },
    { step: "步驟 6：回饋不是批評", id: 6, caption: "別人的回饋不是用來打擊自己，而是提供一面你看不見自己的鏡子。", ask: { prompt: "收到和自己認知不同的回饋時，最好的反應是？", options: ["馬上反駁", "先聽完，想想有沒有道理", "記恨對方", "當作沒聽到"], answer: 1, hint: "回饋是鏡子，不是攻擊。" }, action: "think", prop: { kind: "text", text: "回饋是另一面鏡子", sub: "先聽，再想想", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：認識自己在改變", id: 7, caption: "你去年很內向，今年可能變開朗了。自我認知要跟著更新，不是小學寫完就固定。", action: "walk", prop: { kind: "flow", steps: ["去年的我", "今年的我", "持續更新"], active: 2 }, duration: 3400 },
    { step: "步驟 8：接受不完美的自己", id: 8, caption: "認識自己，不是為了變成完美的人，而是知道自己哪裡強、哪裡可以慢慢調整。", action: "cheer", prop: { kind: "text", text: "知道強項，也接受弱點", sub: "慢慢調整就好", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：自己與別人兩個視角合起來，才是更完整的你。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-self-awareness-1", prompt: "為什麼「自己眼中的我」和「別人眼中的我」常常不一樣？", options: ["因為其中一邊一定說謊", "自己懂內心，別人看得見行為，視角不同", "因為人會分身", "因為大家都隨便說"], answer: 1, hints: ["兩種視角看到的不同", "各有所長"], explanation: "自己最清楚內心的想法，別人則能觀察到外在行為，兩邊拼起來才完整。" },
    { id: "ct-self-awareness-2", prompt: "同樣是自己，為什麼今天覺得很棒、明天覺得不行？", options: ["因為評價系統壞了", "情緒和當下事件影響了自我評價", "因為人沒有固定性格", "因為明天比較笨"], answer: 1, hints: ["想想心情的影響", "單一事件不能代表全部"], explanation: "自我評價很容易被當下的心情、成敗影響，所以要小心別用單一事件定義自己。" },
    { id: "ct-self-awareness-3", prompt: "聽到和自己認知不同的回饋，比較好的做法是？", options: ["立刻反駁回去", "先聽完，想想有沒有道理", "以後不理那個人", "照單全收"], answer: 1, hints: ["回饋是參考不是命令", "先消化再判斷"], explanation: "先聽完並思考，再決定要採納還是忽略，而不是急著反駁或全盤接受。" },
    { id: "ct-self-awareness-4", prompt: "「自我認知」最接近哪個意思？", options: ["對自己認識的了解與看法", "別人對我的評價", "老師打的成績", "父母給的名字"], answer: 0, hints: ["是自己對自己的看法", "包含但不限於別人評價"], explanation: "自我認知是自己對自己能力、性格、價值的整體了解，會隨經驗持續調整。" },
    { id: "ct-self-awareness-5", prompt: "認識自己最好的方式是？", options: ["只聽自己想聽的", "自己的反思加上別人的回饋互相對照", "整天想就好", "只看成績單"], answer: 1, hints: ["需要內外兩種資訊", "單一來源容易偏"], explanation: "自己反思＋旁人觀察，兩邊對照才能補上各自盲點，認識更完整。" },
    { id: "ct-self-awareness-6", prompt: "關於認識自己，下列哪個想法最健康？", options: ["一次定案，永遠不用改", "接受自己有強項也有弱點，持續調整", "只記住缺點", "只記住優點"], answer: 1, hints: ["人會改變", "接納不完美"], explanation: "認識自己是動態過程：承認缺點、也肯定強項，並隨著成長持續更新。" },
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
    { step: "步驟 1：週末只能選一個", id: 1, caption: "週末你有兩個想去的地方：圖書館看書，或和同學去遊樂園。時間不夠，只能選一個。", action: "wave", prop: { kind: "balance", left: "圖書館", right: "遊樂園" }, duration: 3400 },
    { step: "步驟 2：選了遊樂園", id: 2, caption: "如果你選了遊樂園，你就放棄了在圖書館安靜看書的那個下午。", ask: { prompt: "選了遊樂園，真正的代價是什麼？", options: ["門票錢", "放棄了去圖書館能得到的收穫", "沒有代價", "同學會生氣"], answer: 1, hint: "代價是沒選的那條路。" }, action: "think", prop: { kind: "balance", left: "遊樂園的快樂", right: "圖書館的收穫" }, duration: 3600 },
    { step: "步驟 3：這叫機會成本", id: 3, caption: "經濟學把「為了選擇 A 而放棄的次佳選項」叫做機會成本。", action: "point", prop: { kind: "text", text: "機會成本＝放棄的次佳選項", sub: "看不見，但確實存在", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：時間也是成本", id: 4, caption: "玩手機兩小時，不只是花時間，還放棄了可以用來打球、閱讀、陪家人的兩小時。", ask: { prompt: "滑手機兩小時，除了時間，還放棄了什麼？", options: ["什麼都沒放棄", "做其他事能得到的收穫", "手機電量", "沒有影響"], answer: 1, hint: "那兩小時原本可以拿來做別的事。" }, action: "think", prop: { kind: "text", text: "滑手機 2 小時", sub: "同時放棄了其他可能", tone: "warn" }, duration: 3600 },
    { step: "步驟 5：比較兩邊的收穫", id: 5, caption: "聰明做選擇，不是只看選的那邊有多好，也要想：另一邊到底有多好？", action: "point", prop: { kind: "balance", left: "選 A 的收穫", right: "放棄 B 的收穫" }, duration: 3400 },
    { step: "步驟 6：代價小不代表划算", id: 6, caption: "免費的活動也可能讓你的時間成本很高；便宜不等於划算，要看放棄了什麼。", ask: { prompt: "「免費但很花時間」的活動，怎麼看它的代價？", options: ["免費就沒有代價", "時間成本很高，代價不小", "一定划算", "免費的都要去"], answer: 1, hint: "代價不限於金錢。" }, action: "think", prop: { kind: "text", text: "免費 ≠ 沒有代價", sub: "時間也是成本", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：先想清楚自己要什麼", id: 7, caption: "先問自己這次最想要的是什麼，再比較哪個選擇更符合目標，放棄時才不會一直後悔。", action: "cheer", prop: { kind: "flow", steps: ["想清楚目標", "比較兩邊收穫", "決定並接受放棄"], active: 2 }, duration: 3400 },
    { step: "步驟 8：後悔沒有意義", id: 8, caption: "選了就別一直想「早知道」，把精力放在把選的路走好，比後悔更有用。", action: "walk", prop: { kind: "text", text: "選了就好好走", sub: "與其後悔，不如努力", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：每個選擇都有看不見的代價。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-choice-cost-1", prompt: "「機會成本」指的是？", options: ["選項本身的價格", "為了選 A 而放棄的次佳選項", "所有的花費加總", "運氣不好時的損失"], answer: 1, hints: ["重點是沒選的那條路", "是隱藏成本"], explanation: "機會成本是選擇 A 時，放棄的下一個最好選項能帶來的好處。" },
    { id: "ct-choice-cost-2", prompt: "週末選了遊樂園，你的機會成本比較可能是？", options: ["遊樂園的門票", "去圖書館看書能得到的收穫", "來回的車錢", "同學的午餐"], answer: 1, hints: ["沒選的那邊", "它原本能帶來什麼"], explanation: "你放棄了去圖書館的那個下午及其可能帶來的收穫，這就是機會成本。" },
    { id: "ct-choice-cost-3", prompt: "為什麼「免費」的活動也可能代價很高？", options: ["因為免費通常有詐", "它可能占用大量時間，放棄其他機會", "免費的一定品質差", "沒有為什麼"], answer: 1, hints: ["代價不限於金錢", "時間也是成本"], explanation: "即使不用花錢，花掉的時間也排擠了其他活動，時間成本就是代價。" },
    { id: "ct-choice-cost-4", prompt: "做選擇前，比較兩個選項時該看什麼？", options: ["只看哪個比較便宜", "同時看選的那邊的收穫和放棄那邊的收穫", "只看哪個比較好玩", "讓別人決定"], answer: 1, hints: ["兩邊都要看", "別只看單面"], explanation: "理性權衡要同時比較「選它得到什麼」與「放棄它失去什麼」。" },
    { id: "ct-choice-cost-5", prompt: "選完之後一直想「早知道選另一個」，比較好的做法是？", options: ["繼續後悔", "把精力放在把當前選擇做好", "馬上重選一次", "怪別人"], answer: 1, hints: ["後悔不改變結果", "投入當前選擇"], explanation: "過去的選擇無法重來，專注把現在的路走好，才是對自己有利的做法。" },
    { id: "ct-choice-cost-6", prompt: "下列哪個決定最明顯有機會成本？", options: ["睡覺時做夢", "用週末兩小時練琴，放棄看喜歡的節目", "呼吸新鮮空氣", "喝水"], answer: 1, hints: ["看有沒有放棄別的事", "有排擠效果"], explanation: "練琴占用了本來可以看節目的時間，放棄的娛樂就是機會成本。" },
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
    { step: "步驟 1：同一個關鍵判決", id: 1, caption: "球賽最後一球，裁判喊犯規。主隊球迷說裁判英明，客隊球迷說裁判瞎了。", action: "wave", prop: { kind: "balance", left: "主隊：判得對", right: "客隊：判錯了" }, duration: 3400 },
    { step: "步驟 2：立場影響看法", id: 2, caption: "兩邊球迷看的是同一球，為什麼結論完全相反？因為立場不同，各自希望自己球隊贏。", ask: { prompt: "兩隊球迷看同一球卻結論相反，最可能的原因是？", options: ["其中一邊眼睛有問題", "立場和期望影響了判斷", "裁判真的瞎了", "球有問題"], answer: 1, hint: "想想他們各自希望誰贏。" }, action: "think", prop: { kind: "text", text: "立場不同 → 看法不同", sub: "期望會影響判斷", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：資訊不同也會不同", id: 3, caption: "除了立場，每個人看到的資訊也不一樣：有人看到正面，有人只看到側面。", action: "point", prop: { kind: "flow", steps: ["立場", "經驗", "資訊", "合成看法"], active: 3 }, duration: 3400 },
    { step: "步驟 4：看法不同不代表有人錯", id: 4, caption: "先別急著說對方錯，試著問：他是從什麼立場、看到什麼資訊，才會這樣想？", ask: { prompt: "面對不同意見，第一步最好做什麼？", options: ["證明對方錯", "先理解對方為什麼這樣想", "大聲壓過對方", "直接封鎖"], answer: 1, hint: "先聽懂，再判斷。" }, action: "think", prop: { kind: "text", text: "先問：他為什麼這樣想？", sub: "理解在前，判斷在後", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：換位思考練習", id: 5, caption: "試著站在對方立場，重講一次他的論點，講到他點頭，才是真的聽懂。", action: "point", prop: { kind: "flow", steps: ["聽對方說", "重述他的論點", "他點頭＝聽懂"], active: 2 }, duration: 3400 },
    { step: "步驟 6：不同意也可以尊重", id: 6, caption: "聽懂了不代表要同意。你可以清楚說出自己哪裡不同意，同時尊重對方有不同看法。", ask: { prompt: "聽懂對方論點之後，可以怎麼做？", options: ["只能完全同意", "可以不同意，但尊重並說明理由", "必須吵架", "假裝同意"], answer: 1, hint: "理解與同意是兩回事。" }, action: "cheer", prop: { kind: "text", text: "理解 ≠ 同意", sub: "可以尊重地不同意", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：補上自己缺的資訊", id: 7, caption: "如果發現自己資訊不足，就去補資料；立場不同，也別忘了用證據說話。", action: "walk", prop: { kind: "flow", steps: ["發現資訊不足", "找資料補齊", "再用證據討論"], active: 2 }, duration: 3400 },
    { step: "步驟 8：好的討論長這樣", id: 8, caption: "好的討論不是比誰大聲，而是雙方都能說清楚自己的理由，也聽得懂對方。", action: "cheer", prop: { kind: "balance", left: "說清楚理由", right: "聽懂對方" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：先理解立場，再討論對錯。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-perspective-stance-1", prompt: "兩隊球迷看同一球判決卻結論相反，最主要原因是？", options: ["有人眼睛不好", "立場與期望影響了判斷", "球場燈光問題", "裁判偏心"], answer: 1, hints: ["各自希望誰贏", "立場影響解讀"], explanation: "立場和期望會影響我們怎麼解讀同一件事，這是正常的心理現象。" },
    { id: "ct-perspective-stance-2", prompt: "看法不同時，第一步比較好的做法是？", options: ["直接說對方錯", "先理解對方為什麼這樣想", "找人公審", "拒絕討論"], answer: 1, hints: ["理解在前", "判斷在後"], explanation: "先弄清楚對方的立場和資訊來源，才能知道分歧點在哪裡，討論才有意義。" },
    { id: "ct-perspective-stance-3", prompt: "「聽懂對方」最好的證明是？", options: ["複誦對方論點到他點頭", "大聲說自己贏了", "記住對方名字", "保持安靜"], answer: 0, hints: ["能重述才算懂", "對方確認才算數"], explanation: "能把對方的論點完整、準確地重述出來，甚至讓對方認同，才代表真的聽懂。" },
    { id: "ct-perspective-stance-4", prompt: "理解對方之後，可以？", options: ["只能同意對方", "不同意，但尊重並說明自己的理由", "開始人身攻擊", "假裝同意"], answer: 1, hints: ["理解與同意分開", "尊重不同意見"], explanation: "理解不是投降，你可以清楚表達不同意，同時保持對人的尊重。" },
    { id: "ct-perspective-stance-5", prompt: "為什麼不同意見不一定只有一個對？", options: ["因為大家都不想輸", "不同立場與資訊下，各有可能看到不同面向", "因為沒有標準答案", "因為大家都對"], answer: 1, hints: ["立場資訊都不同", "各自有依據"], explanation: "當雙方掌握不同資訊、站在不同立場時，各自的看法可能都有依據，未必只有一方正確。" },
    { id: "ct-perspective-stance-6", prompt: "好的討論最像哪一種？", options: ["比誰講話大聲", "雙方說清楚理由，也聽得懂對方", "誰先停誰輸", "只講自己想講的"], answer: 1, hints: ["雙方都要表達", "也要互相理解"], explanation: "好討論是雙向的：清楚表達自己的理由，同時認真聽懂對方的理由。" },
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
    { step: "步驟 1：一句熟悉的話", id: 1, caption: "有人說：「男生都很愛運動啦！」聽起來很熟，但真的每個男生都這樣嗎？", action: "wave", prop: { kind: "text", text: "男生都很愛運動", sub: "這是真的嗎？", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：班上的反例", id: 2, caption: "班上就有男生喜歡畫畫、跳舞，也有人不愛運動。一句話根本裝不下所有男生。", ask: { prompt: "「男生都很愛運動」這句話的問題在？", options: ["說得太準了", "用一句話概括一整群不一樣的人", "太少人聽到", "運動不重要"], answer: 1, hint: "想想班上每個男生都一樣嗎。" }, action: "point", prop: { kind: "text", text: "每個人都不一樣", sub: "標籤裝不下所有人", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：這叫刻板印象", id: 3, caption: "把一群人用一個簡單標籤概括，而且忽略個別差異，就是刻板印象。", action: "point", prop: { kind: "text", text: "刻板印象＝用標籤概括一群人", sub: "忽略個別差異", tone: "warn" }, duration: 3400 },
    { step: "步驟 4：標籤怎麼來的", id: 4, caption: "標籤常常來自少數例子、電視劇情、或聽來的傳聞，不一定反映真實。", ask: { prompt: "刻板印象最常從哪裡來？", options: ["長期仔細觀察每個人", "少數例子、劇情、傳聞", "科學實驗", "每個人的成長紀錄"], answer: 1, hint: "想想電視和傳聞。" }, action: "think", prop: { kind: "flow", steps: ["少數例子", "劇情傳聞", "變成標籤"], active: 2 }, duration: 3600 },
    { step: "步驟 5：標籤會傷人", id: 5, caption: "被貼上標籤的人，可能被誤解、被拒絕，甚至開始懷疑自己。標籤的傷害很真實。", action: "think", prop: { kind: "text", text: "標籤的傷害很真實", sub: "被誤解、被拒絕", tone: "warn" }, duration: 3400 },
    { step: "步驟 6：先認識眼前的人", id: 6, caption: "與其問「男生都怎樣」，不如問「眼前這個人他喜歡什麼、擅長什麼」。", ask: { prompt: "認識一個新同學，比較好的做法是？", options: ["先問他是哪個群體然後下結論", "認識他本人，看他實際的表現與喜好", "用電視劇情猜他", "照他的姓猜"], answer: 1, hint: "看具體的人，不是看標籤。" }, action: "cheer", prop: { kind: "flow", steps: ["放下標籤", "認識眼前的人", "看實際表現"], active: 2 }, duration: 3600 },
    { step: "步驟 7：標籤也會騙自己", id: 7, caption: "標籤不只誤傷別人，也會讓我們看不到真實世界，以為世界真的那麼簡單。", action: "think", prop: { kind: "text", text: "標籤讓我們看不見真實", sub: "世界比標籤複雜", tone: "warn" }, duration: 3200 },
    { step: "步驟 8：用開放的心認識", id: 8, caption: "把每個人都當成獨一無二的人來認識，世界會比想像中豐富很多。", action: "cheer", prop: { kind: "text", text: "每個人都是獨一無二", sub: "別讓標籤擋住眼睛", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：先認識人，再下判斷，不要急著貼標籤。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-stereotype-1", prompt: "「刻板印象」最接近下列哪個意思？", options: ["仔細認識每一個人", "用一個簡單標籤概括一整群人", "觀察到的具體事實", "科學統計結果"], answer: 1, hints: ["忽略個別差異", "把一群人當成一種人"], explanation: "刻板印象是用單一標籤涵蓋整群人的簡化想法，常忽略個別差異。" },
    { id: "ct-stereotype-2", prompt: "刻板印象最常來自哪裡？", options: ["長期仔細觀察", "少數例子、劇情、傳聞", "嚴謹的調查", "每個人的自述"], answer: 1, hints: ["想想它怎麼傳開的", "通常不是嚴謹證據"], explanation: "標籤常源於少數例子、影視劇情或口耳相傳，樣本不足也不具代表性。" },
    { id: "ct-stereotype-3", prompt: "「全班男生都很愛運動」這句話的主要問題是？", options: ["說得太正確", "用一句話概括了每個人都不一樣的群體", "運動很重要", "沒提到女生"], answer: 1, hints: ["班上的男生都一樣嗎", "個別差異被忽略"], explanation: "它把一個多樣化的群體壓成單一形象，忽略了每個人的實際差異。" },
    { id: "ct-stereotype-4", prompt: "被貼上標籤的人，可能受到什麼影響？", options: ["完全沒影響", "被誤解、被拒絕，甚至懷疑自己", "變得更強", "自動獲得特權"], answer: 1, hints: ["標籤會影響他人看待", "傷害很真實"], explanation: "標籤可能導致誤解與排擠，長期下來也會影響一個人對自己的看法。" },
    { id: "ct-stereotype-5", prompt: "認識新同學時，比較好的做法是？", options: ["先套用群體標籤", "認識他本人，看實際表現與喜好", "用電視劇情猜測", "憑姓氏猜性格"], answer: 1, hints: ["看具體的人", "別用標籤代替認識"], explanation: "每個人都是獨特的，應該透過實際互動認識對方，而不是先入為主套標籤。" },
    { id: "ct-stereotype-6", prompt: "發現自己也有刻板印象時，可以怎麼做？", options: ["覺得很正常不用管", "覺察它，並用具體的個人經驗來修正", "更用力相信標籤", "不敢再認識別人"], answer: 1, hints: ["先覺察", "用真實經驗校正"], explanation: "覺察自己的標籤，並透過認識具體的人、累積真實經驗，慢慢修正看法。" },
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
    { step: "步驟 1：調查全班喜歡什麼", id: 1, caption: "你想知道全班最喜歡的點心，於是問了坐在隔壁的三個同學。", action: "wave", prop: { kind: "text", text: "問 3 個人", sub: "代表全班 30 人？", tone: "warn" }, duration: 3200 },
    { step: "步驟 2：三個人都說巧克力", id: 2, caption: "三個人剛好都說巧克力，於是你興奮宣布：全班最愛巧克力！", ask: { prompt: "只問三個人，就說全班都喜歡巧克力，問題在？", options: ["樣本太小，不能代表全班", "巧克力一定最受歡迎", "三個人就夠了", "問題沒問題"], answer: 0, hint: "想想 30 個人 vs 3 個人。" }, action: "think", prop: { kind: "text", text: "3 人說巧克力 → 全班都愛？", sub: "樣本太小了", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：樣本要夠大", id: 3, caption: "樣本越大、越接近全體，結論越可靠；只問幾個人，很容易剛好問到特別的一群。", action: "point", prop: { kind: "flow", steps: ["樣本小", "剛好問到同類", "結論偏差"], active: 2 }, duration: 3400 },
    { step: "步驟 4：樣本要夠平均", id: 4, caption: "如果你只問愛吃甜的同學，結果當然偏向甜食。樣本不平均，結論就歪了。", ask: { prompt: "只問愛吃甜的同學，得到的結論會？", options: ["完全準確", "偏向甜食，不能代表全班", "一定最好", "沒有影響"], answer: 1, hint: "問的人本身就不平均。" }, action: "think", prop: { kind: "flow", steps: ["只問愛吃甜的", "結果偏向甜食", "不能代表全班"], active: 2 }, duration: 3600 },
    { step: "步驟 5：抽樣要隨機", id: 5, caption: "比較好的做法是隨機抽樣：每個人被問到的機會都一樣，結果才比較能代表全體。", action: "point", prop: { kind: "text", text: "隨機抽樣", sub: "每個人機會均等", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：新聞裡的民調", id: 6, caption: "新聞常說「民調顯示」，你要問：樣本多少人？怎麼抽的？有沒有可能只問到特定的人？", ask: { prompt: "看到「民調顯示」時，最該先注意什麼？", options: ["直接相信數字", "樣本多大、怎麼抽的、問誰", "數字一定準", "不用管"], answer: 1, hint: "先看樣本品質。" }, action: "think", prop: { kind: "text", text: "樣本多大？怎麼抽的？", sub: "先檢查再相信", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：小故事不代表大數據", id: 7, caption: "一個人考上台大，不能證明所有人讀書都會成功；個案是故事，不是統計。", action: "walk", prop: { kind: "flow", steps: ["個案故事", "不等於", "整體統計"], active: 2 }, duration: 3400 },
    { step: "步驟 8：下結論前先檢查", id: 8, caption: "下次聽到「大家都說」，先問：樣本夠大嗎？夠平均嗎？是隨機的嗎？", action: "cheer", prop: { kind: "flow", steps: ["夠大？", "夠平均？", "隨機？"], active: 2 }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：樣本要夠大、夠平均，結論才可靠。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-sampling-1", prompt: "「樣本」指的是什麼？", options: ["全部的每一個人", "用來代表全體的一小群人", "問題的答案", "統計圖表"], answer: 1, hints: ["是抽出來的那部分", "用來推測全體"], explanation: "樣本是從全體中抽出一部分人來觀察，用來推測全體的情況。" },
    { id: "ct-sampling-2", prompt: "只問三個人就說全班都喜歡巧克力，主要問題是？", options: ["樣本太小，不代表全班", "巧克力一定最好吃", "三個人剛好都是對的", "人數不是問題"], answer: 0, hints: ["30 人的全班 vs 3 人", "樣本要夠大"], explanation: "樣本太小，很容易剛好問到特別的一群人，推論全班就會出錯。" },
    { id: "ct-sampling-3", prompt: "抽樣時只問愛吃甜的同學，會造成？", options: ["結論一定準", "樣本不平均，結論偏向甜食", "大家都開心", "沒有影響"], answer: 1, hints: ["問的人本身就偏了", "結果跟著偏"], explanation: "樣本不平均時，結果只反映特定一群人的想法，不能代表全體。" },
    { id: "ct-sampling-4", prompt: "「隨機抽樣」的優點是？", options: ["每個人被抽到的機會都一樣，結果較能代表全體", "結果一定正確", "比較便宜", "只問熟人"], answer: 0, hints: ["減少人為偏差", "更接近全體"], explanation: "隨機抽樣讓每個人機會均等，能減少偏見，讓結果更能代表全體。" },
    { id: "ct-sampling-5", prompt: "看到「民調顯示七成民眾支持」時，應該？", options: ["完全相信", "先檢查樣本多大、怎麼抽的、問誰", "覺得是假的", "馬上轉發"], answer: 1, hints: ["民調品質看樣本", "先查再信"], explanation: "民調的可信度取決於樣本大小、抽樣方式和訪問對象，不能只看一個數字。" },
    { id: "ct-sampling-6", prompt: "「有一個人靠這個方法考上台大，所以大家都能」這句話的問題是？", options: ["把個案當成整體統計", "台大不好", "方法沒用", "人太少聽"], answer: 0, hints: ["個案是故事", "不能代表所有人"], explanation: "單一個案不能推論到全體，需要更大、更平均的樣本才能下結論。" },
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
    { step: "步驟 1：同一份成績", id: 1, caption: "小華上次考八十分，這次考八十一分，進步了一分。", action: "wave", prop: { kind: "text", text: "80 → 81 分", sub: "只進步 1 分", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：兩張不同的圖", id: 2, caption: "一張圖從零開始畫，進步看起來很小；另一張圖從七十九分開始畫，進步看起來超大。", ask: { prompt: "同一份數據，為什麼兩張圖看起來差很多？", options: ["數據不同", "圖表的起點刻度不同", "其中一張是假的", "分數會變"], answer: 1, hint: "想想縱軸從哪裡開始。" }, action: "point", prop: { kind: "text", text: "起點不同 → 視覺差距不同", sub: "數據其實一樣", tone: "warn" }, duration: 3600 },
    { step: "步驟 3：刻度會放大感受", id: 3, caption: "把縱軸起點拉高，小小差異就會被放大，看起來像巨大變化。這是常見的圖表把戲。", action: "think", prop: { kind: "text", text: "拉高起點 → 放大差異", sub: "看清楚再下結論", tone: "warn" }, duration: 3400 },
    { step: "步驟 4：範圍也會騙人", id: 4, caption: "只看「最近三天」的曲線，和看「一整年」的曲線，結論可能完全相反。", ask: { prompt: "看統計圖表時，為什麼時間範圍很重要？", options: ["範圍不影響", "只看一小段可能誤導結論", "時間越短越好", "範圍越大越假"], answer: 1, hint: "想想只截一段會怎樣。" }, action: "think", prop: { kind: "flow", steps: ["只看三天", "看一整年", "結論可能相反"], active: 2 }, duration: 3600 },
    { step: "步驟 5：平均數的陷阱", id: 5, caption: "「全班平均九十分」聽起來很棒，但可能有人滿分、有人不及格，平均數藏住了差異。", ask: { prompt: "全班平均九十分，能代表每個人都考很好嗎？", options: ["能，平均就是每個人的分數", "不能，平均可能藏住極端差異", "代表全班都滿分", "一定有人作弊"], answer: 1, hint: "想想有人考很高有人很低的情況。" }, action: "point", prop: { kind: "text", text: "平均數藏住差異", sub: "要看分布才完整", tone: "warn" }, duration: 3600 },
    { step: "步驟 6：比較要對齊條件", id: 6, caption: "比較兩班成績，一個班級人數不同、考卷不同，直接比平均就不公平。", action: "think", prop: { kind: "text", text: "比較前先檢查條件", sub: "人數、考卷、時間要對齊", tone: "warn" }, duration: 3400 },
    { step: "步驟 7：圖表背後的樣本", id: 7, caption: "別忘了問：這份數據抽樣多少人？問誰？樣本差，圖再漂亮也不可信。", action: "walk", prop: { kind: "flow", steps: ["看圖表", "查樣本", "查起點刻度", "再下結論"], active: 3 }, duration: 3400 },
    { step: "步驟 8：把圖表看仔細", id: 8, caption: "下次看到嚇人的圖表，先檢查：起點在哪？刻度均勻嗎？範圍完整嗎？樣本夠嗎？", action: "cheer", prop: { kind: "text", text: "起點？刻度？範圍？樣本？", sub: "四個都檢查再相信", tone: "ok" }, duration: 3200 },
    { step: "步驟 9：準備闖關", id: 9, caption: "記住：數字會說話，但也要先聽清楚它怎麼說。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2600 },
  ],
  questions: [
    { id: "ct-numbers-charts-1", prompt: "同一份數據畫成兩張圖卻看起來差很多，最可能是？", options: ["其中一張造假", "圖表起點或刻度不同", "數據被換掉", "眼睛有問題"], answer: 1, hints: ["想想縱軸起點", "刻度影響視覺"], explanation: "縱軸起點不同會放大或縮小視覺差異，數據本身可能完全一樣。" },
    { id: "ct-numbers-charts-2", prompt: "為什麼有人要把圖表的縱軸起點拉高？", options: ["為了讓圖更清楚", "為了放大差距，讓變化看起來很大", "因為數字太多", "因為這樣比較美"], answer: 1, hints: ["視覺效果會變", "目的常是影響感受"], explanation: "拉高起點會讓小差距在視覺上變巨大，常被用來強調某種結論。" },
    { id: "ct-numbers-charts-3", prompt: "只看「最近三天」的數據曲線，可能？", options: ["一定準確", "誤導我們錯判整體趨勢", "比看一整年更完整", "完全沒影響"], answer: 1, hints: ["時間範圍太短", "看不到長期趨勢"], explanation: "時間範圍過短時，短期波動會被誤以為是長期趨勢，結論容易失準。" },
    { id: "ct-numbers-charts-4", prompt: "「全班平均九十分」為什麼可能誤導人？", options: ["平均一定等於每個人", "平均數可能藏住高分與低分的差異", "九十分太高了", "平均數不重要"], answer: 1, hints: ["有人滿分有人不及格時", "平均只是一個數字"], explanation: "平均數只看整體，看不到個別差異，極端高分和低分可能同時存在。" },
    { id: "ct-numbers-charts-5", prompt: "比較兩班成績時，下列哪個條件要先檢查？", options: ["兩班人數、考卷難度是否可比", "誰是班長", "教室大小", "上課時間"], answer: 0, hints: ["條件要對齊", "否則比較不公平"], explanation: "人數、考卷、評分標準不同時，直接比較平均分數會得到不公平的結論。" },
    { id: "ct-numbers-charts-6", prompt: "判斷一份統計圖表可不可信，最後也別忘了檢查？", options: ["圖的顏色", "樣本多大、怎麼抽的", "作者名字好不好記", "字體大小"], answer: 1, hints: ["樣本決定品質", "圖再美樣本差也沒用"], explanation: "圖表背後的樣本大小與抽樣方式，決定了數據能不能代表真實全體。" },
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
