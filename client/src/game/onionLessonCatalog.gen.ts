// GENERATED FILE — 由 scripts/build-onion-catalog.mts 自動產生，請勿手動編輯。
// 僅含每堂課的輕量目錄資訊（首頁推薦／選課清單使用）；完整分鏡與闖關題目留在
// onionAcademyLessons.ts，只在「我的教室」lazy 載入，避免塞爆首屏主 bundle。
// 課程有增改後請重跑：pnpm catalog:onion（測試會檢查此檔與完整課程是否一致）。
import type { OnionStage } from "@/game/onionAcademyLessons";

export interface OnionLessonSummary {
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade: string;
  stages: OnionStage[];
  desc: string;
}

export const ONION_LESSON_CATALOG: OnionLessonSummary[] = [
  {
    "id": "fraction-add",
    "title": "分數加減：同分母怎麼加？",
    "subject": "數學",
    "topic": "分數加減",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "洋蔥帶你用一塊披薩搞懂「分母相同」的分數加法，動畫拆解＋互動演示，看完立刻闖關。"
  },
  {
    "id": "de-usage",
    "title": "「的、得、地」怎麼分？",
    "subject": "國語",
    "topic": "的字用法",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "三個讀音一樣的字，用法卻不同。洋蔥用字卡帶你記住：的接名詞、得接動詞後、地接動詞前。"
  },
  {
    "id": "water-cycle",
    "title": "水循環：水在天上地下怎麼轉？",
    "subject": "自然",
    "topic": "水循環",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "水從來不會消失，只是不停旅行。洋蔥用循環圖帶你看懂蒸發、凝結、降水三個階段。"
  },
  {
    "id": "triangle-area",
    "title": "三角形面積：底×高÷2 怎麼來？",
    "subject": "數學",
    "topic": "三角形面積",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "三角形面積公式不是死記的！洋蔥帶你用「兩個三角形拼一拼」搞懂為什麼是底×高÷2。"
  },
  {
    "id": "photosynthesis",
    "title": "光合作用：葉子裡的綠色工廠",
    "subject": "自然",
    "topic": "光合作用",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "植物不會吃飯，怎麼長大？洋蔥帶你走進葉子的綠色工廠，看陽光、水、二氧化碳怎麼變成養分和氧氣。"
  },
  {
    "id": "unit-conversion",
    "title": "長度單位換算：公里、公尺、公分",
    "subject": "數學",
    "topic": "長度單位換算",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "1 公里到底有多長？洋蔥用長條圖讓你「看見」單位的大小，再記住大換小用乘、小換大用除。"
  },
  {
    "id": "factor-multiple",
    "title": "因數與倍數：誰能整除誰？",
    "subject": "數學",
    "topic": "因數與倍數",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "12 顆糖果要平分給幾個人剛好分完？洋蔥用「整除」帶你一次搞懂因數和倍數這對雙胞胎。"
  },
  {
    "id": "fraction-multiply",
    "title": "分數乘以整數：幾份的 3 倍是多少？",
    "subject": "數學",
    "topic": "分數乘法",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "1/4 塊蛋糕有 3 個，一共是幾塊？洋蔥用圓餅一片一片疊給你看，分數乘法其實就是「重複加好幾次」。"
  },
  {
    "id": "punctuation",
    "title": "標點符號：句子的紅綠燈",
    "subject": "國語",
    "topic": "標點符號",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "一句話寫完要停一下還是要結束？洋蔥把逗號、句號、問號、驚嘆號變成紅綠燈，讓你一看就知道該放哪一個。"
  },
  {
    "id": "food-chain",
    "title": "食物鏈：誰吃誰？",
    "subject": "自然",
    "topic": "食物鏈",
    "grade": "五下",
    "stages": [
      "國小"
    ],
    "desc": "草被兔子吃、兔子被老鷹吃——這條「誰吃誰」的線就是食物鏈。洋蔥帶你追一次能量的旅行。"
  },
  {
    "id": "stat-chart",
    "title": "統計圖表：長條圖怎麼看？",
    "subject": "數學",
    "topic": "統計圖表",
    "grade": "五下",
    "stages": [
      "國小"
    ],
    "desc": "班上同學最喜歡哪種水果？洋蔥把答案畫成長條圖，教你三步驟讀出「最多、最少、差多少」。"
  },
  {
    "id": "circle-area",
    "title": "圓面積與圓周率：π 是怎麼來的？",
    "subject": "數學",
    "topic": "圓周率與圓面積",
    "grade": "六下",
    "stages": [
      "國小"
    ],
    "desc": "不管圓多大，周長除以直徑都是 3.14…這個神奇的數字就是 π。洋蔥用它推出圓面積公式。"
  },
  {
    "id": "ba-bei",
    "title": "把字句與被字句：主角換人做做看",
    "subject": "國語",
    "topic": "句型轉換",
    "grade": "四下",
    "stages": [
      "國小"
    ],
    "desc": "「我吃掉了蛋糕」改成「我把蛋糕吃掉了」和「蛋糕被我吃掉了」，主角換了，意思卻一樣。"
  },
  {
    "id": "time-telling",
    "title": "認識時刻與時間計算",
    "subject": "數學",
    "topic": "認識時刻與時間計算",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "短針看時、長針看分，1 小時是 60 分。洋蔥教你讀幾點幾分，再算經過多久。"
  },
  {
    "id": "angle-types",
    "title": "角度的種類：銳角、直角、鈍角",
    "subject": "數學",
    "topic": "角度的種類",
    "grade": "四下",
    "stages": [
      "國小"
    ],
    "desc": "角其實有名字：小於 90 度是銳角、等於 90 是直角、介於 90~180 是鈍角。洋蔥用量角器幫你分。"
  },
  {
    "id": "plant-parts",
    "title": "植物的根莖葉：各司其職",
    "subject": "自然",
    "topic": "植物的根莖葉",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "根是腳、莖是水管、葉是食物工廠。洋蔥帶你看植物怎麼分工合作長大。"
  },
  {
    "id": "taiwan-geo",
    "title": "台灣的位置與地形",
    "subject": "社會",
    "topic": "台灣的位置與地形",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "台灣在東亞島鏈、北回歸線穿過，有五大地形，而且山地多、平原少。洋蔥用地圖帶你認識。"
  },
  {
    "id": "synonym-antonym",
    "title": "近義詞與反義詞",
    "subject": "國語",
    "topic": "近義詞與反義詞",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "意思相近叫近義詞（開心／高興），意思相反叫反義詞（冷／熱）。洋蔥教你從上下文判斷。"
  },
  {
    "id": "decimal-add",
    "title": "小數的加減：小數點要對齊",
    "subject": "數學",
    "topic": "小數的加減",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "3.5 元加 2.1 元是多少？洋蔥用數線和方格帶你對齊小數點，先把小數位「疊好」再像整數一樣加減。"
  },
  {
    "id": "cuboid-volume",
    "title": "長方體的體積與容積",
    "subject": "數學",
    "topic": "長方體的體積與容積",
    "grade": "五下",
    "stages": [
      "國小"
    ],
    "desc": "一個鞋盒能裝多少？洋蔥用堆小 cube 的方式，帶你從「長×寬×高」推出體積，再區分體積和容積。"
  },
  {
    "id": "ct-part-whole",
    "title": "看不見的整體：局部與關係",
    "subject": "思辨",
    "topic": "局部與整體",
    "grade": "思辨入門",
    "stages": [
      "國小"
    ],
    "desc": "盲人摸象的故事告訴我們：只看到一小段，就以為看見全部，容易誤判。學會把不同片段拼起來。"
  },
  {
    "id": "ct-change-scale",
    "title": "量變引起質變：小改變的累積",
    "subject": "思辨",
    "topic": "量變與質變",
    "grade": "思辨入門",
    "stages": [
      "國小"
    ],
    "desc": "每天進步一點點，看似沒什麼，累積到一個程度，就會產生讓人驚訝的大變化。"
  },
  {
    "id": "ct-internal-external",
    "title": "內因與外因：改變的力量來自哪裡",
    "subject": "思辨",
    "topic": "內因與外因",
    "grade": "思辨入門",
    "stages": [
      "國小"
    ],
    "desc": "一件事的結果，是自己內在條件和外在環境一起造成的。不要只怪自己，也不要只怪環境。"
  },
  {
    "id": "ct-evidence-inference",
    "title": "證據與推論：哪些想法有依據？",
    "subject": "思辨",
    "topic": "證據與推論",
    "grade": "思辨入門",
    "stages": [
      "國小"
    ],
    "desc": "窗邊有一個書包，你會推論什麼？學會分開「我看到的」和「我猜的」，別把猜想當了事實。"
  },
  {
    "id": "ct-correlation-causation",
    "title": "相關與因果：一起發生就代表有因果？",
    "subject": "思辨",
    "topic": "相關與因果",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "冰淇淋賣越好、溺水的人越多，是冰淇淋造成溺水嗎？學會分辨「一起發生」和「真的造成」。"
  },
  {
    "id": "ct-balance-tradeoff",
    "title": "權衡與取舍：沒有完美方案",
    "subject": "思辨",
    "topic": "權衡與取舍",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "現實選擇很少完美，每個方案都有利有弊。學會把收益和代價放上天平，再做決定。"
  },
  {
    "id": "ct-self-awareness",
    "title": "我以為的我：認識自己的視角",
    "subject": "思辨",
    "topic": "自我認知",
    "grade": "思辨入門",
    "stages": [
      "國小"
    ],
    "desc": "你怎麼描述自己？別人又怎麼看你？兩邊不一定一樣，把兩邊合起來，才能更認識自己。"
  },
  {
    "id": "ct-choice-cost",
    "title": "選擇的代價：看不見的成本",
    "subject": "思辨",
    "topic": "選擇的代價",
    "grade": "思辨入門",
    "stages": [
      "國小"
    ],
    "desc": "選了 A，就等於放棄 B 可能帶來的好處。這個「放棄掉的好處」，就是選擇的真正代價。"
  },
  {
    "id": "ct-perspective-stance",
    "title": "觀點與立場：為什麼我們看法不同",
    "subject": "思辨",
    "topic": "觀點與立場",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "同一場球賽，兩邊球迷說法完全不一樣。立場不同、資訊不同，看法自然不同，不代表有人一定錯。"
  },
  {
    "id": "ct-stereotype",
    "title": "刻板印象：別急著貼標籤",
    "subject": "思辨",
    "topic": "刻板印象",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "「男生都很……」「女生都喜歡……」這些話聽起來很熟，但把一群人用一句話概括，常常會誤傷人。"
  },
  {
    "id": "ct-sampling",
    "title": "抽樣與樣本：問三個人就夠了嗎",
    "subject": "思辨",
    "topic": "抽樣與樣本",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "問了三個人就說全班都喜歡，對嗎？樣本太小、又不平均，結論就容易歪掉。"
  },
  {
    "id": "ct-numbers-charts",
    "title": "數字與圖表：眼見不一定為憑",
    "subject": "思辨",
    "topic": "數字與圖表",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "同一份數據，換個刻度、砍掉起點，看起來就完全不同。看懂圖表背後的把戲，才不會被數字帶著走。"
  },
  {
    "id": "ct-online-rumor",
    "title": "網路謠言：轉發之前先查證",
    "subject": "思辨",
    "topic": "網路謠言",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "群組傳來「緊急！吃這個會中毒」，嚇得大家馬上轉發。可是，這是真的嗎？"
  },
  {
    "id": "ct-logical-fallacy",
    "title": "邏輯謬誤：話裡的漏洞在哪裡",
    "subject": "思辨",
    "topic": "邏輯謬誤",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "「大家都這樣做，所以我也要！」「不聽我的話就是笨蛋！」這些話聽起來很強，其實邏輯有漏洞。"
  },
  {
    "id": "ct-framing",
    "title": "框架暗示：同一件事不同說法",
    "subject": "思辨",
    "topic": "框架暗示",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "「這杯飲料有九成的人喜歡」和「有一成的人不喜歡」，說的是同一杯飲料，感受卻完全不同。"
  },
  {
    "id": "ct-credibility",
    "title": "可信度：誰的話比較可以信",
    "subject": "思辨",
    "topic": "可信度",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "「我表哥說」「新聞說」「醫生說」，同樣一句話，從不同人嘴裡說出來，可信度不一樣。"
  },
  {
    "id": "ct-cognitive-bias",
    "title": "認知偏誤：大腦的捷徑",
    "subject": "思辨",
    "topic": "認知偏誤",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "大腦為了省力，常常走捷徑做判斷。這些捷徑大部分時候很好用，但有時候會讓我們看走眼。"
  },
  {
    "id": "ct-value-judgment",
    "title": "價值判斷：事實與好壞要分開",
    "subject": "思辨",
    "topic": "價值判斷",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "「這支手機賣一萬元」是事實，「賣一萬元太貴了」是好壞判斷。兩者常常被混在一起。"
  },
  {
    "id": "ct-empathy",
    "title": "同理心：穿上別人的鞋子",
    "subject": "思辨",
    "topic": "同理心",
    "grade": "思辨入門",
    "stages": [
      "國小"
    ],
    "desc": "同學遲交作業，是偷懶還是家裡有事？先別急著罵，試著想想他經歷了什麼。"
  },
  {
    "id": "ct-group-decision",
    "title": "集體決策：一群人怎麼做決定",
    "subject": "思辨",
    "topic": "集體決策",
    "grade": "思辨進階",
    "stages": [
      "國小"
    ],
    "desc": "小組討論要選主題，有人怕得罪人就跟著舉手，結果選了大家都不滿意的方案。這就是集體決策的陷阱。"
  },
  {
    "id": "el-chi-idiom",
    "title": "成語的運用：看情境選對成語",
    "subject": "國語",
    "topic": "成語運用",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "成語不能只按字面猜！洋蔥帶你看情境，學會選對成語、不再望文生義。"
  },
  {
    "id": "el-chi-rhetoric",
    "title": "譬喻與擬人：把話說得活靈活現",
    "subject": "國語",
    "topic": "修辭：譬喻與擬人",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "譬喻把 A 比作 B，擬人把物當人寫。洋蔥用對照卡帶你分辨兩種修辭。"
  },
  {
    "id": "el-chi-poem-rhythm",
    "title": "詩歌的節奏：押韻與朗讀的抑揚",
    "subject": "國語",
    "topic": "詩歌節奏",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "詩歌為什麼讀起來順口？洋蔥帶你聽押韻、找停頓、學朗讀的語氣。"
  },
  {
    "id": "el-chi-structure",
    "title": "段落的總分總：文章的好骨架",
    "subject": "國語",
    "topic": "段落結構",
    "grade": "五下",
    "stages": [
      "國小"
    ],
    "desc": "總說開頭、分說舉例、總結收尾。洋蔥帶你用總分總把文章寫得有條理。"
  },
  {
    "id": "el-chi-letter",
    "title": "書信與便條：寫給人的小紙條",
    "subject": "國語",
    "topic": "書信格式",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "稱謂頂格、問候空兩格、署名日期在右下。洋蔥帶你寫一封得體的信。"
  },
  {
    "id": "el-chi-typo",
    "title": "形近字與錯別字：看部首認清楚",
    "subject": "國語",
    "topic": "字形辨識",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "己已巳長很像？用部首和字義來分辨，洋蔥帶你不再寫錯字。"
  },
  {
    "id": "el-chi-main-idea",
    "title": "找出文章主旨：文章的靈魂",
    "subject": "國語",
    "topic": "閱讀理解",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "主旨藏在關鍵句和重複的概念裡。洋蔥教你三步抓出文章在講什麼。"
  },
  {
    "id": "el-chi-quotation",
    "title": "引號的用法：把話圈起來",
    "subject": "國語",
    "topic": "標點：引號",
    "grade": "五下",
    "stages": [
      "國小"
    ],
    "desc": "引號用來標示別人說的話和特別指稱。洋蔥用對照卡帶你用對引號。"
  },
  {
    "id": "el-eng-phonics",
    "title": "字母與自然發音：聽音拼字",
    "subject": "英語",
    "topic": "自然發音",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "字母都有常見發音，a 像 apple、b 像 ball。洋蔥帶你聽音拼字，自然發音輕鬆學。"
  },
  {
    "id": "el-eng-greeting",
    "title": "問候與自我介紹：說 Hello",
    "subject": "英語",
    "topic": "日常問候",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "Hello! 怎麼打招呼、介紹自己？洋蔥帶你學 Hello / My name is / Nice to meet you。"
  },
  {
    "id": "el-eng-numbers",
    "title": "數字與年齡：數到二十",
    "subject": "英語",
    "topic": "數字與年齡",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "one 到 twenty 怎麼數？How old are you 問年齡。洋蔥帶你數數又問年齡。"
  },
  {
    "id": "el-eng-colors-shapes",
    "title": "顏色與形狀：紅圓藍方",
    "subject": "英語",
    "topic": "顏色與形狀",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "紅色 red、圓形 circle。洋蔥帶你學顏色形容詞放名詞前：a red circle。"
  },
  {
    "id": "el-eng-family",
    "title": "家庭成員：father, mother…",
    "subject": "英語",
    "topic": "家庭與所有格",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "father、mother、brother 怎麼說？洋蔥帶你認識家人，再用 's 表示『誰的』。"
  },
  {
    "id": "el-eng-routine",
    "title": "日常作息與時間：What time…",
    "subject": "英語",
    "topic": "日常作息",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "幾點做什麼？What time do you… 問時間。洋蔥帶你說出一天的作息。"
  },
  {
    "id": "el-math-decimal-multiply",
    "title": "小數的乘法：先當整數再點小數點",
    "subject": "數學",
    "topic": "小數的乘法",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "小數乘法先當整數算，再數小數位點小數點，洋蔥用長條圖帶你一眼看懂。"
  },
  {
    "id": "el-math-decimal-divide",
    "title": "小數的除法：除數變整數再除",
    "subject": "數學",
    "topic": "小數的除法",
    "grade": "五下",
    "stages": [
      "國小"
    ],
    "desc": "除數是小數時，先把它放大成整數再除，洋蔥用天平與流程圖教你秘訣。"
  },
  {
    "id": "el-math-fraction-divide",
    "title": "分數除以整數：分成幾份就好",
    "subject": "數學",
    "topic": "分數除以整數",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "分數除以整數就是平均分成幾份，洋蔥用圓餅切一切，告訴你其實等於乘以 1/n。"
  },
  {
    "id": "el-math-percent",
    "title": "百分比與打折：每一百有幾個",
    "subject": "數學",
    "topic": "百分比與打折",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "百分率就是「每一百裡有幾個」，打折就是原價乘折扣，洋蔥用長條圖算得清清楚楚。"
  },
  {
    "id": "el-math-ratio",
    "title": "比與比值：前項除以後項",
    "subject": "數學",
    "topic": "比與比值",
    "grade": "六下",
    "stages": [
      "國小"
    ],
    "desc": "比就像天平兩邊的重量，洋蔥用天平教你前項、後項和比值，一看就懂誰比誰多。"
  },
  {
    "id": "el-math-polygon-area",
    "title": "平行四邊形與梯形面積",
    "subject": "數學",
    "topic": "平行四邊形與梯形面積",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "把平行四邊形變長方形、梯形變兩個三角形，洋蔥用幾何形告訴你面積公式怎麼來。"
  },
  {
    "id": "el-math-scale-drawing",
    "title": "比例尺與縮放圖：圖上 1 代表多少",
    "subject": "數學",
    "topic": "比例尺與縮放圖",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "比例尺 1：100 就是圖上 1 公分代表實際 100 公分，洋蔥用流程圖教你放大縮小不迷路。"
  },
  {
    "id": "el-math-calendar",
    "title": "年月日與日期計算：算相差幾天",
    "subject": "數學",
    "topic": "年月日與日期計算",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "一三五七八十臘，三十一天永不差！洋蔥用歌訣和流程圖教你算日期相差幾天。"
  },
  {
    "id": "el-math-weight-capacity",
    "title": "重量與容量：公斤公克、公升毫升",
    "subject": "數學",
    "topic": "重量與容量",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "1 公斤等於 1000 公克，1 公升等於 1000 毫升，洋蔥用長條圖讓單位換算一目了然。"
  },
  {
    "id": "el-math-money",
    "title": "錢幣與找錢：付剛好與算找零",
    "subject": "數學",
    "topic": "錢幣與找錢",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "買東西怎麼付錢最剛好、怎麼算找錢？洋蔥用長條圖和字卡教你錢幣的加減。"
  },
  {
    "id": "el-math-triangle-angles",
    "title": "三角形的角度和：永遠 180 度",
    "subject": "數學",
    "topic": "三角形的角度和",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "把三角形的三個角剪下來拼成一個平角，剛好 180 度！洋蔥用圖形和長條圖證明給你看。"
  },
  {
    "id": "el-math-symmetry",
    "title": "線對稱圖形：對摺重合就對稱",
    "subject": "數學",
    "topic": "線對稱圖形",
    "grade": "四下",
    "stages": [
      "國小"
    ],
    "desc": "對摺後兩邊完全重合的圖形叫線對稱，洋蔥用蝴蝶和幾何形教你找對稱軸。"
  },
  {
    "id": "el-math-average",
    "title": "平均數：總和除以筆數",
    "subject": "數學",
    "topic": "平均數",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "平均數是把多筆資料「拉平」成同樣高，洋蔥用長條圖教你總和除以個數。"
  },
  {
    "id": "el-math-two-step",
    "title": "兩步驟應用問題：先算什麼再算什麼",
    "subject": "數學",
    "topic": "兩步驟應用問題",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "一題要算兩次？洋蔥教你把題目拆成「先算…再算…」，用流程圖一步步解決。"
  },
  {
    "id": "el-sci-magnet",
    "title": "磁鐵的奧祕：同極相斥、異極相吸",
    "subject": "自然",
    "topic": "磁鐵",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "洋蔥帶你用磁鐵玩遊戲，搞懂同極相斥、異極相吸，還有磁力隔空作用。"
  },
  {
    "id": "el-sci-light-shadow",
    "title": "光與影子：光直線前進形成影子",
    "subject": "自然",
    "topic": "光與影子",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "光為什麼直直走？不透明的東西怎麼變出影子？洋蔥一次講清楚。"
  },
  {
    "id": "el-sci-sound",
    "title": "聲音的產生與傳播：振動與介質",
    "subject": "自然",
    "topic": "聲音",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "拍手為什麼有聲音？洋蔥用振動和介質，帶你聽懂聲音的小祕密。"
  },
  {
    "id": "el-sci-water-states",
    "title": "水的三態：固態、液態、氣態",
    "subject": "自然",
    "topic": "水的三態",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "冰、水、水蒸氣到底是什麼？洋蔥用三態循環帶你看水的變身秀。"
  },
  {
    "id": "el-sci-air-wind",
    "title": "空氣與風：空氣佔空間、流動成風",
    "subject": "自然",
    "topic": "空氣與風",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "看不見的空氣其實佔空間又會流動，洋蔥帶你弄懂風是怎麼來的。"
  },
  {
    "id": "el-sci-weather-watch",
    "title": "天氣觀測：氣溫、雨量、風向",
    "subject": "自然",
    "topic": "天氣觀測",
    "grade": "四下",
    "stages": [
      "國小"
    ],
    "desc": "氣溫、雨量、風向怎麼量？洋蔥教你用溫度計、雨量計和旗子觀測天氣。"
  },
  {
    "id": "el-sci-moon-phase",
    "title": "月相的變化：農曆初一十五的規律",
    "subject": "自然",
    "topic": "月相",
    "grade": "四下",
    "stages": [
      "國小"
    ],
    "desc": "月亮為什麼有圓有缺？洋蔥用月相循環帶你記住初一十五的規律。"
  },
  {
    "id": "el-sci-sun-shadow",
    "title": "太陽與竿影：影子長短和太陽高度的關係",
    "subject": "自然",
    "topic": "太陽與竿影",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "同樣一根竹竿，影子為什麼時長時短？洋蔥帶你看太陽高度的關係。"
  },
  {
    "id": "el-sci-simple-circuit",
    "title": "讓燈泡亮起來：通路與斷路",
    "subject": "自然",
    "topic": "簡單電路",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "手電筒為什麼會亮？洋蔥用通路和斷路，帶你接出第一個會亮的電路。"
  },
  {
    "id": "el-sci-seed",
    "title": "種子的旅行與發芽：傳播與發芽條件",
    "subject": "自然",
    "topic": "種子",
    "grade": "五上",
    "stages": [
      "國小"
    ],
    "desc": "種子怎麼去遠方？又要什麼條件才發芽？洋蔥帶你看生命的旅行。"
  },
  {
    "id": "el-sci-animal-adapt",
    "title": "動物的構造與適應：構造配合環境",
    "subject": "自然",
    "topic": "動物適應",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "為什麼啄木鳥喙尖尖、鴨子腳有蹼？洋蔥帶你看構造如何配合環境。"
  },
  {
    "id": "el-sci-ecosystem",
    "title": "生態系與環境保護：生物與環境互相影響",
    "subject": "自然",
    "topic": "生態系",
    "grade": "六下",
    "stages": [
      "國小"
    ],
    "desc": "森林池塘裡生物和環境怎麼互相影響？洋蔥帶你認識生態系與保護。"
  },
  {
    "id": "el-soc-family",
    "title": "家庭與我",
    "subject": "社會",
    "topic": "家庭與我",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "家裡有哪些人？大家怎麼分工？洋蔥帶你認識家庭成員和家庭樹。"
  },
  {
    "id": "el-soc-school-rules",
    "title": "校園生活與規則",
    "subject": "社會",
    "topic": "校園生活與規則",
    "grade": "三上",
    "stages": [
      "國小"
    ],
    "desc": "為什麼學校要有規則？遵守規則能讓大家安心學習、平安上課。"
  },
  {
    "id": "el-soc-community",
    "title": "社區與家鄉",
    "subject": "社會",
    "topic": "社區與家鄉",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "家裡附近有哪些公共設施？公園、圖書館、市場怎麼幫助生活？"
  },
  {
    "id": "el-soc-map-direction",
    "title": "地圖與方位",
    "subject": "社會",
    "topic": "地圖與方位",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "地圖怎麼看？上北下南、比例尺算距離、圖例認符號，洋蔥教你讀圖。"
  },
  {
    "id": "el-soc-taiwan-early",
    "title": "臺灣早期的開發",
    "subject": "社會",
    "topic": "臺灣早期的開發",
    "grade": "四上",
    "stages": [
      "國小"
    ],
    "desc": "臺灣很早就有誰來開發？原住民、荷西、明鄭到清領，洋蔥說給你聽。"
  },
  {
    "id": "el-soc-festivals",
    "title": "臺灣的節慶習俗",
    "subject": "社會",
    "topic": "臺灣的節慶習俗",
    "grade": "三下",
    "stages": [
      "國小"
    ],
    "desc": "臺灣有哪些節慶？春節、端午、中秋和原住民祭典，各有什麼習俗？"
  },
  {
    "id": "el-soc-government",
    "title": "政府的角色與選舉",
    "subject": "社會",
    "topic": "政府的角色與選舉",
    "grade": "六上",
    "stages": [
      "國小"
    ],
    "desc": "政府在做什麼？修橋鋪路、辦學校、保護我們，人民也能投票選代表。"
  },
  {
    "id": "el-soc-consumption",
    "title": "消費與理財",
    "subject": "社會",
    "topic": "消費與理財",
    "grade": "六下",
    "stages": [
      "國小"
    ],
    "desc": "買東西前先想：這是需要還是想要？記帳和儲蓄讓錢用得更聰明。"
  },
  {
    "id": "el-soc-global",
    "title": "世界大不同與國際交流",
    "subject": "社會",
    "topic": "世界大不同與國際交流",
    "grade": "六下",
    "stages": [
      "國小"
    ],
    "desc": "世界各國文化不同：語言、食物、服飾都不一樣，互相尊重就能好好交流。"
  },
  {
    "id": "el-soc-transport",
    "title": "交通與通訊的演變",
    "subject": "社會",
    "topic": "交通與通訊的演變",
    "grade": "四下",
    "stages": [
      "國小"
    ],
    "desc": "交通和通訊怎麼進步？從走路、火車到高鐵，從書信到手機網路，洋蔥帶你看。"
  }
];
