export type AnimeWorldviewKey =
  | "nailong"
  | "ultraman"
  | "kamen-rider"
  | "doraemon"
  | "pokemon"
  | "anpanman"
  | "chibi-maruko"
  | "shin-chan"
  | "super-sentai"
  | "precure";

export type AnimeWorldviewQuestion = {
  id: string;
  entryKey: AnimeWorldviewKey;
  prompt: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  focus: string;
};

const NAILONG_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "nailong-q1", entryKey: "nailong", prompt: "在溫暖的日常冒險裡，遇到一件還不明白的小事，最適合先做什麼？", options: ["先仔細觀察並提出問題", "直接把責任交給別人", "不看原因就下結論", "把問題藏起來"], answer: 0, explanation: "觀察與提問能把好奇心變成可以繼續探索的線索。", focus: "國語／自然：觀察與提問" },
  { id: "nailong-q2", entryKey: "nailong", prompt: "如果要記錄今天發現的生活現象，哪一種筆記最有幫助？", options: ["只寫我覺得很酷", "記下時間、看到的變化與自己的疑問", "只畫一個沒有說明的符號", "照抄別人的猜測"], answer: 1, explanation: "具體的時間、變化和疑問，能讓之後的比較與驗證更清楚。", focus: "自然：生活觀察紀錄" },
  { id: "nailong-q3", entryKey: "nailong", prompt: "朋友在任務中遇到困難時，哪個行動最符合互助的精神？", options: ["笑他做得太慢", "不問原因就替他全部完成", "先聽他說明，再一起分配小步驟", "轉身離開不再討論"], answer: 2, explanation: "先理解需要，再把任務拆成可以合作完成的小步驟，能保留每個人的參與。", focus: "社會：合作與互助" },
  { id: "nailong-q4", entryKey: "nailong", prompt: "第一次嘗試沒有成功時，最有學習價值的下一步是什麼？", options: ["檢查哪個步驟需要調整，再試一次", "把結果改寫成成功", "認定自己永遠做不到", "不留下任何紀錄"], answer: 0, explanation: "檢查步驟、找出可調整的地方，能把失敗轉成下一次的學習線索。", focus: "學習策略：修正與再嘗試" },
  { id: "nailong-q5", entryKey: "nailong", prompt: "要把一個好奇念頭變成小小實驗，哪個安排最完整？", options: ["只猜結果，不做記錄", "先提出問題、決定觀察方法，再記錄結果", "先決定答案，遇到不同就刪掉", "請別人做完，自己不觀察"], answer: 1, explanation: "問題、方法與結果紀錄，讓好奇念頭能成為可觀察、可分享的探索。", focus: "自然：問題與驗證" },
  { id: "nailong-q6", entryKey: "nailong", prompt: "把兩次觀察結果放在一起比較時，哪種做法最清楚？", options: ["只保留比較喜歡的結果", "使用相同的觀察項目並標出差異", "把不同單位混在一起", "只說這次感覺比較好"], answer: 1, explanation: "相同的觀察項目與清楚的差異，能讓比較更公平也更容易說明。", focus: "數學／自然：比較與紀錄" },
  { id: "nailong-q7", entryKey: "nailong", prompt: "小組一起完成任務時，怎樣分配工作最能讓大家參與？", options: ["由一個人決定全部工作", "依照每個人的能力分工並約定回報時間", "只把簡單工作留給自己", "遇到問題就互相責怪"], answer: 1, explanation: "清楚分工並約定回報時間，可以讓每個人知道責任，也能及早互相幫助。", focus: "社會：分工與合作" },
  { id: "nailong-q8", entryKey: "nailong", prompt: "看到和自己想法不同的觀察結果時，第一個好習慣是什麼？", options: ["立刻說結果一定錯了", "重新檢查方法與紀錄，再提出新的問題", "刪掉不符合的資料", "要求大家只能同意自己"], answer: 1, explanation: "重新檢查方法和紀錄，能把不同結果變成修正想法的新線索。", focus: "自然／國語：檢核與修正" },
];

const ULTRAMAN_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "ultraman-q1", entryKey: "ultraman", prompt: "在巨大英雄守護城市的想像中，要比較兩個物體的大小，哪個方法最可靠？", options: ["只看誰的名字比較威風", "找共同參考物並記錄比例", "用感覺猜一個答案", "只看畫面顏色"], answer: 1, explanation: "共同參考物和比例能讓尺度比較更有依據。", focus: "數學：尺度與比例" },
  { id: "ultraman-q2", entryKey: "ultraman", prompt: "想研究光能不能照亮遠處目標時，哪一個問題最容易驗證？", options: ["光是不是最勇敢", "不同距離下，目標表面的亮度如何變化", "英雄一定會不會贏", "城市是不是永遠安全"], answer: 1, explanation: "把距離與亮度變化連起來，就能設計觀察與比較。", focus: "自然：光與可驗證問題" },
  { id: "ultraman-q3", entryKey: "ultraman", prompt: "遇到城市中的突發危機，最有效的守護行動通常需要什麼？", options: ["一個人不告訴任何人就行動", "依照分工傳遞資訊並保護民眾", "先追求最華麗的畫面", "只等待危機自己消失"], answer: 1, explanation: "公共安全需要資訊、分工與保護行動彼此配合。", focus: "社會：公共安全與分工" },
  { id: "ultraman-q4", entryKey: "ultraman", prompt: "面對來自未知宇宙的訊號，哪種做法最像負責任的觀測者？", options: ["立刻把猜測當成事實", "蒐集線索、比較資料，再提出暫時解釋", "只相信最令人害怕的說法", "不記錄就直接轉述"], answer: 1, explanation: "先蒐集與比較證據，再說明暫時解釋，可以減少誤判。", focus: "自然／國語：證據與推論" },
  { id: "ultraman-q5", entryKey: "ultraman", prompt: "守護城市與自然環境同時發生衝突時，哪個選擇較完整？", options: ["只追求速度，不管後果", "評估風險、減少傷害並和相關的人合作", "把所有問題交給最強的人", "先破壞環境再慢慢想"], answer: 1, explanation: "守護不只看眼前勝負，也要評估風險、減少傷害並協調合作。", focus: "社會／自然：責任與環境" },
  { id: "ultraman-q6", entryKey: "ultraman", prompt: "要判斷兩次光線觀測是否真的不同，哪項資料最有幫助？", options: ["只記得哪一次看起來更亮", "記錄相同時間、距離與測量結果", "挑一張最漂亮的照片", "只聽旁觀者的印象"], answer: 1, explanation: "固定觀測條件並留下測量結果，才能減少誤差並比較光線變化。", focus: "自然：觀測條件與資料" },
  { id: "ultraman-q7", entryKey: "ultraman", prompt: "收到可能影響城市安全的訊息時，哪種傳遞方式最負責任？", options: ["先加上誇張內容再轉發", "標出已確認與待確認的部分，再通知適合的單位", "只傳給最要好的朋友", "完全不說明來源"], answer: 1, explanation: "分清已確認與待確認資訊，並交給適合處理的人，能降低錯誤訊息造成的風險。", focus: "國語／社會：資訊判讀" },
  { id: "ultraman-q8", entryKey: "ultraman", prompt: "保護陌生生物棲地時，哪個行動最符合永續的守護？", options: ["為了看清楚而靠得越近越好", "保持距離、減少干擾並記錄觀察", "把生物帶回家研究", "只拍照不遵守場域規定"], answer: 1, explanation: "保持距離與減少干擾，才能在學習觀察的同時保護棲地與生物。", focus: "自然／社會：生態與永續" },
];

const KAMEN_RIDER_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "kamen-rider-q1", entryKey: "kamen-rider", prompt: "設計一件變身裝備時，除了力量，還應優先確認什麼？", options: ["外觀是否最複雜", "功能、限制與使用安全", "能不能讓所有人害怕", "是否完全不需要練習"], answer: 1, explanation: "好的設計要同時考慮功能、限制與安全，而不只是看起來強大。", focus: "自然：功能與限制" },
  { id: "kamen-rider-q2", entryKey: "kamen-rider", prompt: "擁有能幫助大家的科技工具時，最負責任的使用方式是什麼？", options: ["想用就用，不管別人", "先了解規則、風險與可能影響", "把工具借給陌生人試玩", "隱瞞所有限制"], answer: 1, explanation: "理解規則、風險與影響，才能讓能力真正服務於保護與合作。", focus: "社會：科技倫理" },
  { id: "kamen-rider-q3", entryKey: "kamen-rider", prompt: "故事中看到一個線索時，哪一句最能區分事實與推論？", options: ["我看到指示燈變紅，這是事實", "所以敵人一定在附近，這是事實", "大家猜什麼就當作答案", "只要很像就不需要證據"], answer: 0, explanation: "直接觀察到的指示燈顏色是事實；敵人是否在附近則仍需要證據推論。", focus: "國語：事實與推論" },
  { id: "kamen-rider-q4", entryKey: "kamen-rider", prompt: "要知道新裝備是否真的能降低危險，哪個測試設計較公平？", options: ["只測一次最順利的情況", "在相同條件下多次比較有無裝備的結果", "只問設計者覺得如何", "先選好結論再挑資料"], answer: 1, explanation: "相同條件、多次比較，才能更公平地觀察裝備是否產生效果。", focus: "自然：公平測試" },
  { id: "kamen-rider-q5", entryKey: "kamen-rider", prompt: "當英雄能力變強、可以影響更多人時，最重要的思考是什麼？", options: ["只要贏就不用解釋", "能力越大，越要思考權利、責任與後果", "把所有決定交給裝備", "永遠不聽夥伴的意見"], answer: 1, explanation: "能力擴大也代表影響擴大，需要一起思考權利、責任與行動後果。", focus: "社會：權利與責任" },
  { id: "kamen-rider-q6", entryKey: "kamen-rider", prompt: "設計科技工具時，哪一項最能幫助使用者避免誤用？", options: ["只增加外觀裝飾", "加入清楚的操作提示與安全限制", "把警告文字全部刪除", "讓工具永遠自動決定"], answer: 1, explanation: "清楚提示與安全限制能幫助使用者理解工具，降低不小心誤用的機會。", focus: "自然／科技：設計與安全" },
  { id: "kamen-rider-q7", entryKey: "kamen-rider", prompt: "團隊要選擇一個行動方案時，哪種討論方式最公平？", options: ["只讓聲音最大的人決定", "先列出證據、風險與不同意見，再共同決定", "不聽取少數人的擔心", "先投票再找理由"], answer: 1, explanation: "先整理證據、風險與不同觀點，能讓團隊決定更透明，也更容易承擔結果。", focus: "社會：民主討論與決策" },
  { id: "kamen-rider-q8", entryKey: "kamen-rider", prompt: "完成一次任務後想知道下次如何做得更好，最有用的回顧是什麼？", options: ["只記住最後誰獲勝", "記錄有效做法、遇到的問題與下一步調整", "把所有失誤歸咎於別人", "只保留最精彩的片段"], answer: 1, explanation: "同時記錄有效做法、問題與調整方向，才能把任務經驗轉成下一次的策略。", focus: "學習策略：反思與改進" },
];

const DORAEMON_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "doraemon-q1", entryKey: "doraemon", prompt: "遇到麻煩時，最接近「先想清楚再找工具」的做法是什麼？", options: ["先確認問題真正卡在哪，再找適合的方法", "看到道具就拿，後果再說", "把麻煩全部丟給別人處理", "假裝問題不存在"], answer: 0, explanation: "先分析問題，才知道需要什麼工具；不解問題就找工具，常會製造新麻煩。", focus: "國語／生活：問題分析" },
  { id: "doraemon-q2", entryKey: "doraemon", prompt: "一個方便的工具帶來意想不到的壞結果時，最有學習力的反應是什麼？", options: ["從此拒用任何工具", "回想操作步驟與影響，收拾並記取教訓", "把結果全部怪到工具上", "偷偷藏起來不讓人知道"], answer: 1, explanation: "回顧因果、承擔後果並修正，能把失誤變成下次的經驗。", focus: "學習策略：因果與反省" },
  { id: "doraemon-q3", entryKey: "doraemon", prompt: "把「如果有任意門」這種奇想變成可探討的問題，哪個問法最容易驗證？", options: ["任意門是不是最棒的發明", "距離縮短後，通勤時間與體力會怎麼改變", "主角為什麼這麼幸運", "道具的顏色好不好看"], answer: 1, explanation: "把距離、時間與體力的改變當作觀察重點，就能進行比較與驗證。", focus: "自然／數學：可驗證的問題" },
  { id: "doraemon-q4", entryKey: "doraemon", prompt: "使用新工具前先想「會不會影響到別人」，這是哪一種能力？", options: ["同理心與責任感", "記憶力比賽", "依賴道具的表現", "浪費時間"], answer: 0, explanation: "評估工具對他人的影響，是負責任使用科技的開始。", focus: "社會：影響評估" },
  { id: "doraemon-q5", entryKey: "doraemon", prompt: "故事裡道具常讓小事變大事，用因果鏈記錄時，最正確的順序是什麼？", options: ["結果→感覺→結果", "做了什麼動作→發生什麼→再影響什麼", "結局→開頭→結局", "誰最壞→誰最可憐"], answer: 1, explanation: "「動作→結果→後續影響」能把事件的因果順序理清楚。", focus: "國語：因果結構" },
  { id: "doraemon-q6", entryKey: "doraemon", prompt: "哪一種進步最能留在自己身上？", options: ["靠最強道具永遠拿滿分", "靠練習理解觀念，分數慢慢進步", "不用準備考試自然會過", "把作業都交給別人寫"], answer: 1, explanation: "理解與練習得來的能力不會消失；只靠外力，下次仍不會。", focus: "學習策略：能力與依賴" },
  { id: "doraemon-q7", entryKey: "doraemon", prompt: "聽到「吃一錠就能瞬間學會所有知識」的宣稱，用批判思考該先質疑什麼？", options: ["顆數會不會太少", "知識如何進入大腦、有沒有證據與副作用", "包裝夠不夠酷", "能不能帶去學校"], answer: 1, explanation: "誇大宣稱要先查證據、原理與可能風險，而不是立刻相信。", focus: "自然／媒體識讀：宣稱與證據" },
  { id: "doraemon-q8", entryKey: "doraemon", prompt: "朋友說「作業借我抄就好」，最支持他的回應是什麼？", options: ["直接給他抄，朋友最大", "陪他一起搞懂不會的部分，練習自己完成", "跟老師說他很懶", "假裝沒看到訊息"], answer: 1, explanation: "陪伴理解能真正解決問題；直接給抄只是讓難題往後累積。", focus: "社會：互助與取代的界線" },
];

const POKEMON_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "pokemon-q1", entryKey: "pokemon", prompt: "做一本「生物觀察圖鑑」時，哪一筆紀錄最完整？", options: ["很可愛", "有尾巴", "在草地出沒、體重約 5 公斤、喜歡陽光，並記下日期地點", "超強的"], answer: 2, explanation: "具體的特徵、地點、時間與數值，讓觀察可以被比較與查證。", focus: "自然：觀察紀錄" },
  { id: "pokemon-q2", entryKey: "pokemon", prompt: "生物的外觀構造和生活環境關係密切，哪個推論比較合理？", options: ["厚毛皮的生物適合寒冷環境", "顏色純粹是為了好看", "任何生物都能住在任何地方", "棲地不會影響生物構造"], answer: 0, explanation: "構造與環境互相配合；厚毛皮有助於在寒冷環境保持體溫。", focus: "自然：構造與環境" },
  { id: "pokemon-q3", entryKey: "pokemon", prompt: "想照顧一個夥伴（或寵物）之前，最需要先知道什麼？", options: ["牠最喜歡什麼顏色", "牠的需求、習性與安全界線", "誰的夥伴最稀有", "能不能馬上變強"], answer: 1, explanation: "了解需求與安全界線，才能給予合適照顧而不是造成傷害。", focus: "社會／自然：照顧責任" },
  { id: "pokemon-q4", entryKey: "pokemon", prompt: "要分類比較多種生物時，哪種紀錄方式最清楚？", options: ["用感覺分成喜歡和討厭", "訂出特徵欄位（屬性、體型、棲地）逐項填寫", "全部放一起憑印象", "只記最強的一種"], answer: 1, explanation: "固定欄位與一致標準，能讓分類與比較公平又清楚。", focus: "數學：分類與表格" },
  { id: "pokemon-q5", entryKey: "pokemon", prompt: "在戶外遇到陌生野生生物時，最安全的做法是什麼？", options: ["立刻靠過去摸看看", "保持距離觀察、查資料，不隨意餵食", "把牠帶回家養", "用東西丟看看反應"], answer: 1, explanation: "保持距離與不干擾，能保護自己也保護野生生物。", focus: "自然／安全：尊重野生生物" },
  { id: "pokemon-q6", entryKey: "pokemon", prompt: "夥伴在競賽中輸了、非常沮喪，最支持的做法是什麼？", options: ["笑牠太弱了", "一起檢討剛才的策略並安排練習", "以後都不要比賽了", "全部換成最強的夥伴"], answer: 1, explanation: "把失敗當成線索，一起調整與練習，是成長型的支持。", focus: "社會／學習：成長型回饋" },
  { id: "pokemon-q7", entryKey: "pokemon", prompt: "對於「收服就等於擁有」的想法，哪個修正比較好？", options: ["本來就是我的東西", "照顧與尊重關係比占有更重要", "越稀有的越要搶", "全部放生才是唯一方法"], answer: 1, explanation: "生命不是收藏品；責任、照顧與尊重才是關係的重點。", focus: "社會：生命教育" },
  { id: "pokemon-q8", entryKey: "pokemon", prompt: "看到廣告宣稱「某道具保證讓任何生物立刻變最強」，合理的判斷是什麼？", options: ["趕快買就對了", "聽起來有條件限制，先查證內容與來源", "電視說的就是真的", "同學都買了所以我也要買"], answer: 1, explanation: "「保證立刻見效」是誇大宣稱的常見訊號，查證來源與內容再決定。", focus: "媒體識讀：宣稱與查證" },
];

const ANPANMAN_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "anpanman-q1", entryKey: "anpanman", prompt: "把食物分給飢餓的人，主要是在回應對方的什麼需求？", options: ["想玩樂的需求", "填飽肚子、恢復體力的基本需求", "想要禮物的需求", "打發時間的需求"], answer: 1, explanation: "食物滿足的是生存與體力的基本需求，是優先的照顧。", focus: "生活：需求辨識" },
  { id: "anpanman-q2", entryKey: "anpanman", prompt: "英雄幫助別人後自己會變弱、需要補充，這提醒我們什麼？", options: ["幫助人完全不用代價", "助人也要照顧自己、量力而為", "弱者才需要休息", "最好不要幫助任何人"], answer: 1, explanation: "助人有代價，先照顧好自己的安全與體力，才能持續幫忙。", focus: "社會／健康：助人與自我照顧" },
  { id: "anpanman-q3", entryKey: "anpanman", prompt: "社區裡哪一種角色最像「烤麵包的人」——在背後補充大家力量？", options: ["只在電視出現的人", "默默準備資源、讓大家能運作的人", "聲音最大的人", "從不幫忙的人"], answer: 1, explanation: "社區裡許多支援在不起眼處發生，值得被看見與感謝。", focus: "社會：社區支援網絡" },
  { id: "anpanman-q4", entryKey: "anpanman", prompt: "想表達「謝謝你幫我」，哪一句最具體真誠？", options: ["哦", "謝謝你借我衛生紙，讓我感冒時很方便", "隨便啦", "你還好嗎"], answer: 1, explanation: "具體說出對方做了什麼、幫上什麼忙，感謝才清楚有溫度。", focus: "國語：具體感謝" },
  { id: "anpanman-q5", entryKey: "anpanman", prompt: "營養午餐遇到不想吃的菜，比較好的做法是什麼？", options: ["偷偷丟到垃圾桶", "先嘗試、吃不下再說明，珍惜食物", "塞進書包裡", "全部夾給別人"], answer: 1, explanation: "珍惜食物與尊重準備者，可以先嘗試並禮貌表達。", focus: "生活：惜食與禮儀" },
  { id: "anpanman-q6", entryKey: "anpanman", prompt: "看到同學一個人吃午餐，最接近麵包超人精神的行動是什麼？", options: ["假裝沒看到", "主動關心、邀請一起或陪他聊聊", "嘲笑他沒朋友", "強迫他吃自己的東西"], answer: 1, explanation: "主動而尊重的關懷，能讓被冷落的人獲得支持。", focus: "社會：關懷與邀請" },
  { id: "anpanman-q7", entryKey: "anpanman", prompt: "食物提供我們活動的能量，哪個時段之後最需要補充體力？", options: ["睡飽起床後", "大量運動或戶外活動後", "看完電視後", "吃完點心後"], answer: 1, explanation: "運動後身體消耗能量與水分較多，適時補充最重要。", focus: "健康：營養與體力" },
  { id: "anpanman-q8", entryKey: "anpanman", prompt: "自己力氣小、能做的協助有限時，最好的選擇是什麼？", options: ["什麼都不做", "做能力內的小事，並找大人幫忙", "硬逞強造成危險", "在旁邊看熱鬧"], answer: 1, explanation: "量力而為加上及時求助，是安全又有效的助人方式。", focus: "社會：適當助人" },
];

const CHIBI_MARUKO_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "chibi-maruko-q1", entryKey: "chibi-maruko", prompt: "想把難過的心情說清楚，哪一句表達最好？", options: ["你們都不懂我", "我覺得很難過，因為我的畫被弄髒了", "隨便啦", "哼！"], answer: 1, explanation: "說出感受加上具體原因，別人才知道怎麼理解與回應。", focus: "國語：感受表達" },
  { id: "chibi-maruko-q2", entryKey: "chibi-maruko", prompt: "長輩的嘮叨背後，通常藏著什麼？", options: ["故意找麻煩", "關心與擔心", "閒著沒事做", "想搶東西"], answer: 1, explanation: "許多重複提醒來自關心；換個角度聽，能讀出背後的心意。", focus: "社會：理解關心" },
  { id: "chibi-maruko-q3", entryKey: "chibi-maruko", prompt: "和家人發生誤會、陷入冷戰時，修復關係的第一步通常是什麼？", options: ["堅持等對方先道歉", "說出自己的感受並傾聽對方", "離家出走抗議", "永遠不說話"], answer: 1, explanation: "表達感受加上願意傾聽，才能讓關係重新靠近。", focus: "社會／情緒：修復關係" },
  { id: "chibi-maruko-q4", entryKey: "chibi-maruko", prompt: "想認識「家庭分工」，哪種紀錄最能發現每個人的貢獻？", options: ["只記誰看起來最輕鬆", "記下誰做哪些家事、大約多久一次", "憑印象覺得大人很閒", "只記自己做的事"], answer: 1, explanation: "具體記錄工作項目與頻率，才能公平看見每個人的付出。", focus: "社會：家庭角色" },
  { id: "chibi-maruko-q5", entryKey: "chibi-maruko", prompt: "寫日記反思今天時，哪種內容最有幫助？", options: ["只寫「今天很爛」", "發生什麼、我的感覺、下次可以怎麼做", "留下空白", "把聯絡簿抄一遍"], answer: 1, explanation: "事件、感受與行動調整，能讓日記成為思考的工具。", focus: "國語：反思寫作" },
  { id: "chibi-maruko-q6", entryKey: "chibi-maruko", prompt: "同學一句話讓你很不舒服，最成熟的處理是什麼？", options: ["立刻罵回去", "先深呼吸，告訴對方這句話讓我不舒服", "再也不理他", "到處說他壞話"], answer: 1, explanation: "冷靜後清楚表達界線，比當場反擊或封鎖更能解決問題。", focus: "社會：情緒與溝通" },
  { id: "chibi-maruko-q7", entryKey: "chibi-maruko", prompt: "常常三分鐘熱度，想培養持久的習慣，哪個方法最有效？", options: ["一次立志做十小時", "每天固定一小段時間並打卡紀錄", "等心情好再開始", "先買很多配備再說"], answer: 1, explanation: "小而固定的練習與紀錄，比偶爾的大決心更容易持久。", focus: "學習策略：習慣養成" },
  { id: "chibi-maruko-q8", entryKey: "chibi-maruko", prompt: "長輩講起舊時代的生活，最好的聆聽態度是什麼？", options: ["覺得無聊直接打斷", "提問並比較和現在生活的不同", "一邊滑手機一邊聽", "糾正他講的每句話"], answer: 1, explanation: "提問與比較能把長輩經驗變成理解時代變化的素材。", focus: "社會／國語：聆聽與比較" },
];

const SHIN_CHAN_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "shin-chan-q1", entryKey: "shin-chan", prompt: "卡通裡誇張的脫序行為很好笑，在真實校園應該怎麼辦？", options: ["照著做證明自己幽默", "分辨場合：表演能笑，侵犯他人的不做", "老師不在就可以做", "錄影 PO 網最有趣"], answer: 1, explanation: "虛構表演的笑點不適合直接複製；尊重他人與場地界線最重要。", focus: "生活：界線與場合" },
  { id: "shin-chan-q2", entryKey: "shin-chan", prompt: "排隊、走廊不奔跑這類規矩，主要在保護什麼？", options: ["老師的心情", "每個人的安全與公平", "沒有任何用處", "只用來處罰人"], answer: 1, explanation: "規範背後通常是安全與公平的理由，不是故意找麻煩。", focus: "社會：規範的目的" },
  { id: "shin-chan-q3", entryKey: "shin-chan", prompt: "電影裡全家遇到危機時互相保護，平時可以怎麼練習？", options: ["等危機發生再說", "熟悉避難路線、約定集合點與家人聯絡方式", "各自逃跑就好", "隱瞞危險狀況"], answer: 1, explanation: "平常演練與約定，能讓真實危機發生時不慌亂。", focus: "安全：家庭應變" },
  { id: "shin-chan-q4", entryKey: "shin-chan", prompt: "想讓同學笑又不傷人，哪種玩笑比較合適？", options: ["嘲笑別人的缺點", "誇張模仿自己糊塗的小事", "拿別人害怕的東西開玩笑", "把別人東西藏起來"], answer: 1, explanation: "以自己為題、不針對弱點的幽默，能帶來笑聲而不留傷害。", focus: "國語／社會：幽默的界線" },
  { id: "shin-chan-q5", entryKey: "shin-chan", prompt: "在賣場或戲院和家人走散了，最安全的做法是什麼？", options: ["自己衝出門去找", "留在原地或找服務台、穿制服的人員協助", "跟著陌生人走", "躲起來讓大家著急"], answer: 1, explanation: "原地等待或找現場服務人員，是走失時的安全步驟。", focus: "安全：走失處理" },
  { id: "shin-chan-q6", entryKey: "shin-chan", prompt: "胡鬧常讓媽媽崩潰，從大人的角度想，她崩潰多半因為什麼？", options: ["她天生脾氣壞", "擔心安全，加上收拾善後的辛勞", "她喜歡生氣", "沒有特別原因"], answer: 1, explanation: "許多嘮叨與生氣來自安全擔憂與辛勞，換位思考能看見原因。", focus: "社會：觀點取替" },
  { id: "shin-chan-q7", entryKey: "shin-chan", prompt: "家事分工時，最公平的方式是什麼？", options: ["全部推給媽媽", "依能力分配並輪流，完成後互相確認", "誰被抓到誰做", "要給錢才做"], answer: 1, explanation: "輪流與分工讓每個人都參與，也能看見彼此的付出。", focus: "社會：家庭分工" },
  { id: "shin-chan-q8", entryKey: "shin-chan", prompt: "看到電視裡的危險動作，正確的觀念是什麼？", options: ["演員做沒事，我也可以", "那是有安全防護與專業人員的表演，真實生活不能模仿", "越危險越酷", "找同學一起試"], answer: 1, explanation: "螢幕中的危險動作經過設計與防護，模仿可能造成真正傷害。", focus: "安全／媒體：虛擬與真實的界線" },
];

const SUPER_SENTAI_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "super-sentai-q1", entryKey: "super-sentai", prompt: "隊員各有專長，任務分配最有效的依據是什麼？", options: ["誰聲音最大聽誰的", "依專長與位置分配，並保留互相支援", "大家搶著做同一件事", "永遠由隊長一個人做"], answer: 1, explanation: "依照專長分工又保留補位，團隊才能穩定運作。", focus: "社會：分工原則" },
  { id: "super-sentai-q2", entryKey: "super-sentai", prompt: "隊員意見不同時，最成熟的整合方式是什麼？", options: ["吵架吵到一方放棄", "說出理由與擔憂，找出共同目標再決定", "偷偷各做各的", "叫新人閉嘴"], answer: 1, explanation: "把理由、風險與共同目標攤開討論，決定才穩固。", focus: "社會：共識決策" },
  { id: "super-sentai-q3", entryKey: "super-sentai", prompt: "「合體」需要彼此默契，團隊默契主要來自什麼？", options: ["天生註定", "一起練習、溝通與累積信任", "制服的顏色", "口號喊得大聲"], answer: 1, explanation: "默契是反覆練習與溝通的成果，不是與生俱來。", focus: "社會：團隊建立" },
  { id: "super-sentai-q4", entryKey: "super-sentai", prompt: "巨大機器人能行動，靠許多構造互相配合；人體運動也靠什麼？", options: ["只有骨頭", "骨骼、肌肉與關節協力", "意志力", "電池"], answer: 1, explanation: "骨骼支撐、肌肉收縮、關節轉動，互相配合才能運動。", focus: "自然：身體構造" },
  { id: "super-sentai-q5", entryKey: "super-sentai", prompt: "任務失敗後的檢討會，最有價值的內容是什麼？", options: ["追究是誰的錯", "哪個環節失誤、下次如何補位", "比誰檢討得大聲", "把紀錄刪掉"], answer: 1, explanation: "針對環節與補位方法檢討，才能讓團隊下次更穩。", focus: "學習策略：復盤" },
  { id: "super-sentai-q6", entryKey: "super-sentai", prompt: "要用表格記錄隊員任務狀況，哪種最清楚？", options: ["記在腦袋裡", "日期、任務、負責人、結果逐欄填寫", "只打圈叉不寫內容", "事後用猜的補"], answer: 1, explanation: "完整欄位的紀錄能追蹤分工與結果，方便檢討。", focus: "數學／社會：資料表" },
  { id: "super-sentai-q7", entryKey: "super-sentai", prompt: "輪到自己擔任「主攻」位置時，最重要的態度是什麼？", options: ["趁機表現、不理隊友", "善用位置、保護隊友並完成共同目標", "把功勞都搶過來", "害怕就躲起來"], answer: 1, explanation: "每個位置都是為了共同目標；負責與合作比個人鋒頭重要。", focus: "社會：角色責任" },
  { id: "super-sentai-q8", entryKey: "super-sentai", prompt: "社區防災演練就像「平常的整備」，它的價值是什麼？", options: ["浪費時間", "讓危機發生時動作熟練、減少慌亂", "只有演習當天有用", "為了拍照好看"], answer: 1, explanation: "反覆演練讓正確動作變成熟練反應，真實危機時更安全。", focus: "社會／安全：準備與演練" },
];

const PRECURE_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "precure-q1", entryKey: "precure", prompt: "要兼顧課業、社團與其他任務時，最好的時間管理是什麼？", options: ["全部先玩再說", "排出優先順序與時段，並保留休息", "只做最有趣的", "熬夜全部塞進來"], answer: 1, explanation: "有優先順序的時段安排加上休息，才能持續而不燒掉自己。", focus: "綜合：時間安排" },
  { id: "precure-q2", entryKey: "precure", prompt: "害怕到想退縮時，真正的勇氣是什麼？", options: ["完全不害怕", "承認害怕，仍選擇做對的事", "假裝什麼事都沒有", "叫別人先上再說"], answer: 1, explanation: "勇氣不是沒有恐懼，而是帶著恐懼仍做出負責任的選擇。", focus: "社會／情緒：勇氣" },
  { id: "precure-q3", entryKey: "precure", prompt: "和好朋友吵架之後，修復友情的關鍵通常是什麼？", options: ["誰先低頭誰就輸了", "說出真實感受並傾聽對方", "找別人一起罵她", "立刻換新朋友"], answer: 1, explanation: "真誠表達加上傾聽，能讓誤會有機會被理解。", focus: "社會：衝突處理" },
  { id: "precure-q4", entryKey: "precure", prompt: "想鼓勵低潮中的朋友，哪一句最支持？", options: ["你好弱喔", "我陪你一起，我們一步一步來", "這有什麼好難過的", "不要哭了，煩死了"], answer: 1, explanation: "陪伴與具體的下一步，能帶來真正的支持力量。", focus: "國語／社會：支持語言" },
  { id: "precure-q5", entryKey: "precure", prompt: "故事裡「變身後的力量」主要來自什麼，給我們的啟發是什麼？", options: ["服裝很神奇", "平常累積的特質、練習與夥伴約定", "血統決定一切", "純粹靠運氣"], answer: 1, explanation: "關鍵時刻的表現，來自平時的累積與人與人之間的支持。", focus: "學習策略：長期累積" },
  { id: "precure-q6", entryKey: "precure", prompt: "「先照顧好自己，才能照顧別人」，哪個做法符合這句話？", options: ["熬夜追劇補充元氣", "吃飽睡好，情緒卡關時找人談", "完全不休息", "忽略身體不舒服"], answer: 1, explanation: "穩定的作息、健康與求助習慣，是持續幫助他人的基礎。", focus: "健康：自我照顧" },
  { id: "precure-q7", entryKey: "precure", prompt: "看到有人被欺負，在自身安全的前提下最合適的做法是什麼？", options: ["圍觀拍影片", "陪伴當事人並找老師或大人協助", "加入一起欺負", "叫她自己忍耐"], answer: 1, explanation: "不圍觀、不加入欺負，陪伴當事人並找可信任的大人介入最有效。", focus: "社會：見義勇為的界線" },
  { id: "precure-q8", entryKey: "precure", prompt: "想完成一學期後才看得到成果的目標（如社團發表），哪個做法最有幫助？", options: ["只在發表前一天練", "訂每週小進度，和夥伴互相提醒", "靠天分不用練", "等靈感出現再說"], answer: 1, explanation: "長期目標要拆成每週進度，靠互相提醒持續累積。", focus: "學習策略：長期目標" },
];

export const ANIME_WORLDVIEW_QUIZZES: Record<AnimeWorldviewKey, AnimeWorldviewQuestion[]> = {
  nailong: NAILONG_QUESTIONS,
  ultraman: ULTRAMAN_QUESTIONS,
  "kamen-rider": KAMEN_RIDER_QUESTIONS,
  doraemon: DORAEMON_QUESTIONS,
  pokemon: POKEMON_QUESTIONS,
  anpanman: ANPANMAN_QUESTIONS,
  "chibi-maruko": CHIBI_MARUKO_QUESTIONS,
  "shin-chan": SHIN_CHAN_QUESTIONS,
  "super-sentai": SUPER_SENTAI_QUESTIONS,
  precure: PRECURE_QUESTIONS,
};

export function getAnimeWorldviewQuestions(entryKey: string): AnimeWorldviewQuestion[] {
  if (!(entryKey in ANIME_WORLDVIEW_QUIZZES)) return [];
  return ANIME_WORLDVIEW_QUIZZES[entryKey as AnimeWorldviewKey].map((question) => ({ ...question, options: [...question.options] as AnimeWorldviewQuestion["options"] }));
}

export function scoreAnimeWorldviewQuiz(questions: AnimeWorldviewQuestion[], answers: Array<number | null>) {
  const correct = questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);
  return { correct, total: questions.length, percentage: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100) };
}

export function getAnimeWorldviewResultMessage(correct: number, total: number): string {
  if (total === 0) return "目前沒有可挑戰的題目。";
  if (correct === total) return "觀測完成！你把世界觀線索整理得很完整。";
  if (correct >= Math.ceil(total * 0.6)) return "觀測得不錯！再回看一個線索，你會發現更多連結。";
  return "每一題都是新的觀測線索，回到詳情卡再試一次也可以。";
}
