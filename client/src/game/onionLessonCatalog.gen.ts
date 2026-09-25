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
    "id": "negative-number",
    "title": "負數與數線：零下的世界",
    "subject": "數學",
    "topic": "負數與數線",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "「零下 3 度」是什麼意思？洋蔥開著小船在數線上航向零下的世界，負數的大小一次搞懂。"
  },
  {
    "id": "linear-equation",
    "title": "一元一次方程式：天平上的 x",
    "subject": "數學",
    "topic": "一元一次方程式",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "方程式就是一座天平！洋蔥用砝碼讓你親眼看著 x＋3＝8 怎麼一步步解開，移項變號不再是死背。"
  },
  {
    "id": "onion-cell",
    "title": "洋蔥表皮細胞：顯微鏡下的大世界",
    "subject": "自然",
    "topic": "細胞構造",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "由洋蔥親自介紹洋蔥表皮細胞！顯微鏡視野一格一格，細胞壁、細胞膜、細胞核、液泡一次認齊。"
  },
  {
    "id": "pythagorean",
    "title": "畢氏定理：兩杯水倒進大杯子",
    "subject": "數學",
    "topic": "畢氏定理",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "直角三角形三邊各蓋一個正方形，兩個小杯子的水倒進大杯子剛好滿——這就是畢氏定理。"
  },
  {
    "id": "quadratic",
    "title": "二次函數：會轉彎的拋物線",
    "subject": "數學",
    "topic": "二次函數",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "一次函數畫出來是直線，二次函數畫出來會轉彎——洋蔥帶你認識拋物線的開口、頂點與平移。"
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
    "id": "photosynthesis-junior",
    "title": "光合作用（國中版）：葉綠體裡的兩條生產線",
    "subject": "自然",
    "topic": "光合作用",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "國小只看過整座工廠，現在要拆開葉綠體：光反應把水拆開、暗反應把二氧化碳組起來，兩條生產線缺一不可。"
  },
  {
    "id": "chemical-change",
    "title": "物理變化 vs 化學變化：有沒有新物質？",
    "subject": "自然",
    "topic": "物質變化",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "冰塊融化是物理變化，鐵生鏽是化學變化——差別在哪？洋蔥給你一個萬用判斷法：有沒有產生新物質。"
  },
  {
    "id": "cell-division",
    "title": "細胞分裂：一套變兩套的複製術",
    "subject": "自然",
    "topic": "細胞分裂",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "一個細胞怎麼變成兩個，而且染色體還不能少給？洋蔥用循環圖带你走完複製→排隊→分裂四步驟。"
  },
  {
    "id": "speed-rate",
    "title": "速度與速率：誰跑得比較快？",
    "subject": "自然",
    "topic": "速度與速率",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "跑 100 公尺花 12 秒，到底是快還是慢？洋蔥教你用「距離 ÷ 時間」把感覺變成數字。"
  },
  {
    "id": "plate-tectonics",
    "title": "板塊運動與地震：地板其實在動",
    "subject": "自然",
    "topic": "板塊運動",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "腳下的地殼不是一整塊，而是好幾片會慢慢移動的板塊。洋蔥帶你看它們怎麼擠出山脈、又怎麼引發地震。"
  },
  {
    "id": "english-tense",
    "title": "現在簡單式 vs 現在進行式",
    "subject": "英語",
    "topic": "動詞時態",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "I eat 跟 I am eating 差在哪裡？洋蔥用「習慣」和「正在做」兩個關鍵字，一次分清楚。"
  },
  {
    "id": "electric-circuit",
    "title": "電流與電路：通路、斷路、短路",
    "subject": "自然",
    "topic": "電流與電路",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "電燈為什麼亮？通路、斷路、短路差在哪？洋蔥用流程圖與天平帶你看串聯並聯和 V=IR。"
  },
  {
    "id": "force-balance",
    "title": "力與平衡：什麼時候不動？",
    "subject": "自然",
    "topic": "力與平衡",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "力會改變形狀或運動，但合力為零就平衡。洋蔥用天平講兩力平衡，用流程圖講靜止與等速。"
  },
  {
    "id": "taiwan-climate",
    "title": "台灣的氣候特色",
    "subject": "社會",
    "topic": "台灣的氣候",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "低緯度讓台灣偏熱，夏吹西南、冬吹東北季風，迎風坡多雨、背風坡少雨。洋蔥帶你看氣候。"
  },
  {
    "id": "factoring",
    "title": "提出公因式與因式分解",
    "subject": "數學",
    "topic": "因式分解",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "把乘法分配律反過來用，就是因式分解。洋蔥用天平提公因式，用流程圖講十字交乘。"
  },
  {
    "id": "passive-voice",
    "title": "英語被動語態：be + p.p.",
    "subject": "英語",
    "topic": "被動語態",
    "grade": "九",
    "stages": [
      "國中"
    ],
    "desc": "英文「被……」怎麼講？公式 be + p.p.，by 引出原主詞，be 動詞還要隨時態變。洋蔥帶你練。"
  },
  {
    "id": "linear-system",
    "title": "二元一次聯立方程式：兩式同解",
    "subject": "數學",
    "topic": "二元一次聯立方程式",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "x 和 y 同時未知，一個方程式不夠！洋蔥用天平組合帶你用代入法和加減法解出二元一次聯立。"
  },
  {
    "id": "acid-base-ph",
    "title": "酸鹼與 pH 值：越小越酸",
    "subject": "自然",
    "topic": "酸鹼與 pH 值",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "檸檬酸、肥皂鹼——洋蔥用 pH 尺帶你看懂 0 到 14 的酸鹼刻度，pH7 是中性，越小越酸、越大越鹼。"
  },
  {
    "id": "taiwan-industry",
    "title": "台灣的產業變遷：農→工→服務",
    "subject": "社會",
    "topic": "台灣的產業變遷",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "阿公種田、爸爸進工廠、我開咖啡廳——洋蔥用長條圖帶你看台灣從農業、工業到服務業的產業變遷。"
  },
  {
    "id": "present-perfect",
    "title": "現在完成式：have/has + p.p.",
    "subject": "英語",
    "topic": "現在完成式",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "「我已經吃過了」英文怎麼講？洋蔥用 have/has + 過去分詞，帶你看現在完成式和過去式的差別。"
  },
  {
    "id": "ct-part-whole",
    "title": "看不見的整體：局部與關係",
    "subject": "思辨",
    "topic": "局部與整體",
    "grade": "思辨入門",
    "stages": [
      "國中"
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
      "國中"
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
      "國中"
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
      "國中"
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
      "國中"
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
      "國中"
    ],
    "desc": "現實選擇很少完美，每個方案都有利有弊。學會把收益和代價放上天平，再做決定。"
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
  },
  {
    "id": "jh-chi-classical-intro",
    "title": "文言文入門：之、其、而、以怎麼用？",
    "subject": "國語",
    "topic": "文言文虛字",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "文言文四個最常見的虛字：之、其、而、以。洋蔥用字卡帶你一眼認出它們的詞性與用法。"
  },
  {
    "id": "jh-chi-tang-poem",
    "title": "唐詩賞析：絕句、律詩與意象",
    "subject": "國語",
    "topic": "唐詩賞析",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "絕句、律詩怎麼分？意象怎麼讀？洋蔥帶你賞一首唐詩，學會看句數、找意象、體會情感。"
  },
  {
    "id": "jh-chi-argument",
    "title": "議論文的論點與論據",
    "subject": "國語",
    "topic": "議論文三要素",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "議論文靠論點、論據、論證三要素說服人。洋蔥用對照卡帶你一眼抓出文章的主張與證明。"
  },
  {
    "id": "jh-chi-idiom-origin",
    "title": "成語典故：來歷與正確用法",
    "subject": "國語",
    "topic": "成語典故",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "成語大多有典故與正確語境。洋蔥講「畫蛇添足、守株待兔、亡羊補牢」的來歷與用法。"
  },
  {
    "id": "jh-chi-narrative-order",
    "title": "記敘文的順敘與倒敘",
    "subject": "國語",
    "topic": "記敘順序",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "記敘文順敘按時間、倒敘先結果。洋蔥用流程圖帶你看兩種順序的效果與選法。"
  },
  {
    "id": "jh-chi-classical-translate",
    "title": "文言翻譯技巧：補、調、換",
    "subject": "國語",
    "topic": "文言翻譯",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "文言翻譯三招：補主詞、調語序、換詞義。洋蔥一步步把文言文譯成好懂的白話。"
  },
  {
    "id": "jh-chi-description",
    "title": "描寫手法：視覺、聽覺、觸覺",
    "subject": "國語",
    "topic": "描寫手法",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "視覺、聽覺、觸覺三種描寫讓文章立體。洋蔥帶你讀句子、辨感官、記手法。"
  },
  {
    "id": "jh-eng-past",
    "title": "過去簡單式：昨天發生的事",
    "subject": "英語",
    "topic": "過去簡單式",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "把時間調到昨天，動詞要跟著變身。規則動詞加 -ed、不規則動詞要背，否定和問句交給 did。"
  },
  {
    "id": "jh-eng-future",
    "title": "未來式：will 與 be going to",
    "subject": "英語",
    "topic": "未來式",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "兩句都講未來，但一個是「當下決定」、一個是「早就計畫好」。搞清楚差別，英文就不會用錯。"
  },
  {
    "id": "jh-eng-comparative",
    "title": "比較級與最高級：誰比誰高？",
    "subject": "英語",
    "topic": "比較級與最高級",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "兩個人比用比較級＋than，三個以上選第一用最高級＋the。短音節加 -er/-est，長音節用 more/most。"
  },
  {
    "id": "jh-eng-gerund",
    "title": "動名詞與不定詞：to V 還是 V-ing？",
    "subject": "英語",
    "topic": "動名詞與不定詞",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "有些動詞後面只能接 to V，有些只能接 V-ing，還有些兩個都可以。用一張分類表把它記牢。"
  },
  {
    "id": "jh-eng-relative",
    "title": "關係子句：用 who 和 which 加補充",
    "subject": "英語",
    "topic": "關係子句",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "把兩句合成一句：人用 who、事物用 which／that。學會之後，句子可以又短又清楚。"
  },
  {
    "id": "jh-eng-conjunction",
    "title": "連接詞：because、when、if",
    "subject": "英語",
    "topic": "連接詞與副詞子句",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "一句話不夠用的時候，就用連接詞把原因、時間、條件接上去。位置放前面或後面都行。"
  },
  {
    "id": "jh-eng-reading-skill",
    "title": "閱讀測驗技巧：先找主題句",
    "subject": "英語",
    "topic": "閱讀理解技巧",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "看不懂全部單字也能答題：先讀題目、再找主題句與關鍵字，答案通常就在那兩句附近。"
  },
  {
    "id": "jh-eng-email",
    "title": "英文書信與 e-mail",
    "subject": "英語",
    "topic": "書信與 e-mail 寫作",
    "grade": "九下",
    "stages": [
      "國中"
    ],
    "desc": "寫英文信有固定格式：稱謂、開頭問候、正文、結尾、署名。順序對了，看起來就專業。"
  },
  {
    "id": "jh-math-integer-ops",
    "title": "整數的四則運算：負數怎麼算？",
    "subject": "數學",
    "topic": "整數四則運算",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "負數加減乘除與括號一次搞懂：數線走路想運算，負負得正不再怕。"
  },
  {
    "id": "jh-math-fraction-ops",
    "title": "分數的四則運算：通分與約分",
    "subject": "數學",
    "topic": "分數四則運算",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "分數通分、約分與乘除，用切披薩的方式看懂，分數四則從此不卡關。"
  },
  {
    "id": "jh-math-inequality",
    "title": "一元一次不等式：乘除負數要變號",
    "subject": "數學",
    "topic": "一元一次不等式",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "一元一次不等式：移項、乘除負數變號，把大於小於畫在數線上。"
  },
  {
    "id": "jh-math-square-root",
    "title": "平方根與根號化簡：√ 是什麼？",
    "subject": "數學",
    "topic": "平方根與根號化簡",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "平方根的意義、根號化簡與估算範圍，√ 不再是神祕符號。"
  },
  {
    "id": "jh-math-poly-formula",
    "title": "乘法公式：完全平方與平方差",
    "subject": "數學",
    "topic": "乘法公式與多項式",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "完全平方公式與平方差公式，展開因式一看就懂，多項式運算好上手。"
  },
  {
    "id": "jh-math-quadratic-formula",
    "title": "一元二次方程式公式解",
    "subject": "數學",
    "topic": "一元二次方程式公式解",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "一元二次方程式公式解：先算判別式，再套公式，解 x 有標準步驟。"
  },
  {
    "id": "jh-math-congruence",
    "title": "三角形全等：SSS、SAS、ASA",
    "subject": "數學",
    "topic": "三角形全等與幾何證明",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "三角形全等 SSS／SAS／ASA／AAS：對應邊角比一比，證明有依據。"
  },
  {
    "id": "jh-math-circle",
    "title": "圓的性質：弦、切線、圓心角",
    "subject": "數學",
    "topic": "圓的性質",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "圓的弦、切線與圓心角、圓周角：看弧想角度，圓的性質一次理清。"
  },
  {
    "id": "jh-math-statistics",
    "title": "統計圖表與資料分析",
    "subject": "數學",
    "topic": "統計圖表與資料分析",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "平均數、中位數、眾數、全距：用長條圖讀資料，統計不再霧煞煞。"
  },
  {
    "id": "jh-math-probability-tree",
    "title": "樹狀圖與機率：列出所有情形",
    "subject": "數學",
    "topic": "樹狀圖與機率",
    "grade": "九下",
    "stages": [
      "國中"
    ],
    "desc": "樹狀圖列出所有情形，再算機率：拋硬幣、抽球機率一看就懂。"
  },
  {
    "id": "jh-math-similar",
    "title": "相似三角形：對應邊成比例",
    "subject": "數學",
    "topic": "相似三角形",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "相似三角形：對應角相等、對應邊成比例，借一邊算出全部邊長。"
  },
  {
    "id": "jh-math-linear-function",
    "title": "函數與直線圖形：y＝ax＋b",
    "subject": "數學",
    "topic": "函數與直線圖形",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "一次函數 y＝ax＋b 的圖形與斜率：代 x 算 y，連點畫出直線。"
  },
  {
    "id": "jh-sci-measurement",
    "title": "測量與單位：長度、體積、質量怎麼量？",
    "subject": "自然",
    "topic": "測量與單位",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "長度、體積、質量各用什麼工具？單位怎麼換？洋蔥帶你一次搞懂。"
  },
  {
    "id": "jh-sci-microscope",
    "title": "顯微鏡操作：對光、調焦距、看倍率",
    "subject": "自然",
    "topic": "顯微鏡操作",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "從對光到調出清晰影像，再搞懂放大倍率怎麼算，洋蔥一步步教你。"
  },
  {
    "id": "jh-sci-digestion",
    "title": "消化與營養：食物怎麼變成養分？",
    "subject": "自然",
    "topic": "消化與營養",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "跟著食物走完消化道，認識酵素和均衡飲食，洋蔥帶你消化全身。"
  },
  {
    "id": "jh-sci-circulation",
    "title": "血液循環與呼吸：血液怎麼跑？",
    "subject": "自然",
    "topic": "血液循環與呼吸",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "體循環送養分到全身、肺循環做氣體交換，洋蔥帶你看懂兩條路線。"
  },
  {
    "id": "jh-sci-plant-transport",
    "title": "植物的運輸：水往上、養分往全身",
    "subject": "自然",
    "topic": "植物的運輸",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "木質部把水送上葉子、韌皮部把養分送到各處，蒸散拉著水往上跑。"
  },
  {
    "id": "jh-sci-optics",
    "title": "光的反射與折射：光為什麼拐彎？",
    "subject": "自然",
    "topic": "光的反射與折射",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "反射角等於入射角、折射讓筷子看起來彎，洋蔥用圖帶你看光怎麼拐。"
  },
  {
    "id": "jh-sci-heat",
    "title": "溫度與熱量：比熱是什麼？",
    "subject": "自然",
    "topic": "溫度與熱量",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "同樣加熱，水比鐵升得慢？比熱解釋這現象，洋蔥帶你算熱量與熱平衡。"
  },
  {
    "id": "jh-sci-chemical-reaction",
    "title": "化學反應與質量守恆：原子沒消失",
    "subject": "自然",
    "topic": "化學反應與質量守恆",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "反應前後原子數不變，所以質量守恆；洋蔥教你把反應式係數配平。"
  },
  {
    "id": "jh-sci-electromagnet",
    "title": "電磁鐵與電磁感應：電和磁會變身",
    "subject": "自然",
    "topic": "電磁鐵與電磁感應",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "通電的線圈變磁鐵，磁場變化又能生電，洋蔥帶你看電磁如何互變。"
  },
  {
    "id": "jh-sci-weather-front",
    "title": "天氣與鋒面：冷空氣撞暖空氣",
    "subject": "自然",
    "topic": "天氣與鋒面",
    "grade": "九上",
    "stages": [
      "國中"
    ],
    "desc": "冷鋒、暖鋒、滯留鋒各帶不同天氣，洋蔥帶你看鋒面怎麼帶來降雨。"
  },
  {
    "id": "jh-soc-ancient-china",
    "title": "中國古代文明與朝代：誰接替誰？",
    "subject": "社會",
    "topic": "中國古代文明與朝代",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "跟著洋蔥從夏商周到明清，看朝代如何更替與四大發明的世界影響。"
  },
  {
    "id": "jh-soc-taiwan-japanese",
    "title": "日治時期的臺灣：建設與抗爭",
    "subject": "社會",
    "topic": "日治時期的臺灣",
    "grade": "七下",
    "stages": [
      "國中"
    ],
    "desc": "日治時期（1895–1945）：基礎建設與社會抗爭並存的雙面歷史。"
  },
  {
    "id": "jh-soc-taiwan-river",
    "title": "臺灣的河流與水文：短又急的河",
    "subject": "社會",
    "topic": "臺灣的河流與水文",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "臺灣河川短而急、夏多冬少，看水庫如何調節寶貴的水資源。"
  },
  {
    "id": "jh-soc-population",
    "title": "人口分布與都市化：人為什麼聚在一起？",
    "subject": "社會",
    "topic": "人口分布與都市化",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "人口密度西密東疏，工作機會聚人成都市、形成都市化現象。"
  },
  {
    "id": "jh-soc-china-region",
    "title": "中國的地理環境與區域：西高東低",
    "subject": "社會",
    "topic": "中國的地理環境與區域",
    "grade": "七上",
    "stages": [
      "國中"
    ],
    "desc": "中國西高東低三階梯，南暖北冷，地形氣候造成明顯的區域差異。"
  },
  {
    "id": "jh-soc-world-climate",
    "title": "世界氣候與文化分區：環境定生活",
    "subject": "社會",
    "topic": "世界氣候與文化分區",
    "grade": "八下",
    "stages": [
      "國中"
    ],
    "desc": "從熱帶到寒帶，氣候如何影響各地的生活方式與文化分區？"
  },
  {
    "id": "jh-soc-constitution",
    "title": "憲法與人民權利：權利與義務",
    "subject": "社會",
    "topic": "憲法與人民權利",
    "grade": "八上",
    "stages": [
      "國中"
    ],
    "desc": "憲法是根本大法，保障人民基本權利，也規定應盡的義務。"
  },
  {
    "id": "jh-soc-trade",
    "title": "市場經濟與國際貿易：供需與比較利益",
    "subject": "社會",
    "topic": "市場經濟與國際貿易",
    "grade": "九下",
    "stages": [
      "國中"
    ],
    "desc": "供需決定價格，比較利益促進分工，全球化連結各國貿易。"
  },
  {
    "id": "sh-bio-cell",
    "title": "細胞的構造與功能：胞器分工與膜運輸",
    "subject": "生物",
    "topic": "細胞的構造與功能",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "細胞是一座分工精密的工廠：核指揮、粒線體發電，膜還會選擇誰進誰出。"
  },
  {
    "id": "sh-bio-genetics",
    "title": "孟德爾遺傳：顯隱性與棋盤方格",
    "subject": "生物",
    "topic": "孟德爾遺傳",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "顯性蓋過隱性，單雜交得 3:1、雙雜交得 9:3:3:1，棋盤方格一眼看清。"
  },
  {
    "id": "sh-bio-dna",
    "title": "DNA 與基因表現：複製、轉錄、轉譯",
    "subject": "生物",
    "topic": "DNA 與基因表現",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "DNA 半保留複製、轉錄出 mRNA、轉譯成蛋白質，密碼子三鹼基對一胺基酸。"
  },
  {
    "id": "sh-bio-evolution",
    "title": "演化：天擇、適應與共同祖先",
    "subject": "生物",
    "topic": "演化",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "變異先存在、天擇來篩選，適者遺傳；同源構造與化石訴說共同祖先。"
  },
  {
    "id": "sh-bio-ecology",
    "title": "生態系與能量流動：食物網與能量塔",
    "subject": "生物",
    "topic": "生態系與能量流動",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "生產者打底、消費者取食、分解者回收；能量塔每傳一層只剩約 10%。"
  },
  {
    "id": "sh-bio-plant-physiology",
    "title": "植物生理：光合作用、蒸散與激素",
    "subject": "生物",
    "topic": "植物生理",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "光反應供能、碳反應固碳；蒸散拉水上升；生長素讓莖朝光彎曲。"
  },
  {
    "id": "sh-bio-human-body",
    "title": "人體生理整合：神經、內分泌與恆定",
    "subject": "生物",
    "topic": "人體生理整合",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "神經快而短效、內分泌慢而持久，負回饋把體溫血糖拉回設定點。"
  },
  {
    "id": "sh-bio-biotech",
    "title": "生物科技：PCR、基因轉殖與倫理",
    "subject": "生物",
    "topic": "生物科技",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "PCR 反覆放大 DNA、基因轉殖植入新性狀；效益與風險並存需審慎評估。"
  },
  {
    "id": "sh-chem-atom",
    "title": "原子結構與週期表",
    "subject": "化學",
    "topic": "原子與元素週期表",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "原子序等於質子數也等於電子數；同位素差在中子。同週期由左到右半徑變小、電負度與游離能變大。"
  },
  {
    "id": "sh-chem-bond",
    "title": "化學鍵：離子、共價、金屬",
    "subject": "化學",
    "topic": "化學鍵與物質性質",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "金屬配非金屬形成離子鍵（電子轉移）；非金屬間是共價鍵（電子共用）；金屬本身是金屬鍵（電子海）。鍵越強熔點越高。"
  },
  {
    "id": "sh-chem-stoichiometry",
    "title": "化學計量：莫耳與計算",
    "subject": "化學",
    "topic": "化學計量與反應計算",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "莫耳是化學計數單位（6×10²³ 個）；莫耳數 n ＝ m/M；反應式的係數比就是莫耳比，產量由限量試劑決定。"
  },
  {
    "id": "sh-chem-acid-base",
    "title": "酸鹼與中和",
    "subject": "化學",
    "topic": "酸鹼概念與中和反應",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "pH ＝ −log[H⁺]，7 為中性；酸釋出 H⁺、鹼釋出 OH⁻，兩者中和生成水。指示劑在固定範圍變色，強弱看電離程度。"
  },
  {
    "id": "sh-chem-redox",
    "title": "氧化還原反應",
    "subject": "化學",
    "topic": "氧化數與電子轉移",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "氧化數：單質 0、氧 −2、氫 +1。氧化＝氧化數上升＝失電子；氧化劑本身被還原。鐵生鏽、燃燒、電池都是氧化還原。"
  },
  {
    "id": "sh-chem-organic",
    "title": "有機化合物",
    "subject": "化學",
    "topic": "有機化學基礎",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "烷 CₙH₂ₙ₊₂、烯 CₙH₂ₙ、炔 CₙH₂ₙ₋₂，同系物差 CH₂。官能基決定性質：醇 –OH、醛 –CHO、酮 C=O、羧酸 –COOH、酯 –COO–。"
  },
  {
    "id": "sh-chem-equilibrium",
    "title": "化學平衡與勒沙特列",
    "subject": "化學",
    "topic": "化學平衡與平衡移動",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "可逆反應達平衡時正逆速率相等、濃度不變。平衡常數 K 看濃度冪次；勒沙特列說平衡會朝抵抗擾動的方向移動。"
  },
  {
    "id": "sh-chem-solution",
    "title": "溶液與濃度",
    "subject": "化學",
    "topic": "溶液濃度與稀釋",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "莫耳濃度 M ＝ 溶質莫耳數 mol ÷ 溶液體積 L；稀釋前後溶質不變：M₁V₁ ＝ M₂V₂。重量百分濃度＝溶質重÷溶液總重×100%。"
  },
  {
    "id": "sh-chi-classical-reading",
    "title": "文言文閱讀策略：斷句、虛詞、人物",
    "subject": "國文",
    "topic": "文言文閱讀",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "文言文沒標點怎麼讀？四步策略：斷句、抓虛詞、理人物，最後翻譯成白話。"
  },
  {
    "id": "sh-chi-poetry",
    "title": "詩詞曲選：詩、詞、曲的形式差異",
    "subject": "國文",
    "topic": "詩詞曲賞析",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "詩、詞、曲形式哪裡不同？從唐詩的整齊、宋詞的長短句到元曲的襯字，一眼分辨。"
  },
  {
    "id": "sh-chi-prose",
    "title": "現代散文賞析：意象、節奏與情感",
    "subject": "國文",
    "topic": "現代散文",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "現代散文怎麼讀？抓意象、感節奏、分情感層次，用朱自清〈背影〉讀出作者心境。"
  },
  {
    "id": "sh-chi-essay-writing",
    "title": "論說文寫作：立論、舉證、駁論、結論",
    "subject": "國文",
    "topic": "論說文寫作",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "論說文如何說服人？立論、舉證、駁論、結論四步，搭配總分總結構寫出條理。"
  },
  {
    "id": "sh-civ-democracy",
    "title": "民主政治與憲政：主權在民、權力分立",
    "subject": "公民",
    "topic": "民主政治與憲政",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "從一張選票出發，看民主如何靠主權在民、五權分立與相互制衡來運作。"
  },
  {
    "id": "sh-civ-economics",
    "title": "經濟學基礎：機會成本、供需與市場",
    "subject": "公民",
    "topic": "經濟學基礎",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "從機會成本到供需均衡，看價格如何調節市場，以及失靈時政府怎麼介入。"
  },
  {
    "id": "sh-civ-law",
    "title": "法律與生活：民法、刑法與救濟",
    "subject": "公民",
    "topic": "法律與生活",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "民法管私人權利義務、刑法管犯罪與刑罰，權利受損還有不同的救濟途徑。"
  },
  {
    "id": "sh-civ-global-org",
    "title": "國際組織與全球化：合作與張力",
    "subject": "公民",
    "topic": "國際組織與全球化",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "聯合國、WTO、區域組織如何促成國際合作，以及主權讓渡帶來的討論。"
  },
  {
    "id": "sh-civ-media-literacy",
    "title": "媒體識讀：看穿假訊息",
    "subject": "公民",
    "topic": "媒體識讀",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "辨認假訊息的四種手法，學會查證來源、看時間戳，並跳出同溫層。"
  },
  {
    "id": "sh-earth-structure",
    "title": "地球的構造與板塊：殼、函、核與三種邊界",
    "subject": "地球科學",
    "topic": "地球的構造與板塊",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "從地震與火山說起，認識地殼、地函、地核，以及張裂、聚合、錯動三種板塊邊界如何塑造地表。"
  },
  {
    "id": "sh-earth-quake",
    "title": "地震與地震波：P 波、S 波與規模震度",
    "subject": "地球科學",
    "topic": "地震與地震波",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "P 波、S 波誰快誰慢？S 波為什麼穿不過外核？規模和震度到底差在哪？一次講清楚。"
  },
  {
    "id": "sh-earth-atmosphere",
    "title": "大氣與天氣系統：分層、氣壓與風",
    "subject": "地球科學",
    "topic": "大氣與天氣系統",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "對流層到增溫層怎麼分？為什麼風從高壓吹向低壓？科氏力又如何讓風轉彎？"
  },
  {
    "id": "sh-earth-ocean",
    "title": "海洋與洋流：黑潮、潮汐與聖嬰",
    "subject": "地球科學",
    "topic": "海洋與洋流",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "表層洋流被風與科氏力推著跑，黑潮經過臺灣東側；潮汐一天兩次滿潮，聖嬰讓東太平洋異常偏暖。"
  },
  {
    "id": "sh-earth-astronomy",
    "title": "天文與星系：行星、恆星演化與光年",
    "subject": "地球科學",
    "topic": "天文與星系",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "太陽系有類地與類木行星之別；恆星從星雲走到主序星、紅巨星，結局看質量；光年是距離不是時間。"
  },
  {
    "id": "sh-earth-geologic-time",
    "title": "地質時間：相對與絕對定年、化石",
    "subject": "地球科學",
    "topic": "地質時間",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "用地層疊置律、化石層序、切割律做相對定年；用放射性同位素半衰期做絕對定年，化石記錄生命演化。"
  },
  {
    "id": "sh-eng-tenses",
    "title": "時態總整理：12 個時態怎麼用",
    "subject": "英文",
    "topic": "時態總整理",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "英文動詞隨時間變化。時間三線（過去、現在、未來）乘四種看法，共 12 時態，每個都給你正確例句。"
  },
  {
    "id": "sh-eng-subjunctive",
    "title": "假設語氣：if 子句怎麼退一層",
    "subject": "英文",
    "topic": "假設語氣",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "和事實相反或純想像時用假設語氣。現在用 were、過去用 had been、未來用現在式，動詞都要退一層。"
  },
  {
    "id": "sh-eng-participle",
    "title": "分詞與分詞構句：簡化副詞子句",
    "subject": "英文",
    "topic": "分詞與分詞構句",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "現在分詞表主動進行、過去分詞表被動完成。分詞構句可簡化副詞子句，但主詞須與主句一致，否則成懸垂分詞。"
  },
  {
    "id": "sh-eng-reading-writing",
    "title": "閱讀與寫作整合：抓重點、寫段落、會轉述",
    "subject": "英文",
    "topic": "閱讀與寫作整合",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "會讀才會寫。抓主題句與轉折詞讀懂文章，照主題句→細節→結論寫段落，轉述要改寫不照抄。"
  },
  {
    "id": "sh-geo-gis",
    "title": "地圖與地理資訊：看懂地圖在說什麼",
    "subject": "地理",
    "topic": "地圖與地理資訊",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "經緯度定位、等高線看高低與陡緩、比例尺算距離，再用 GIS 圖層分析空間資訊。"
  },
  {
    "id": "sh-geo-climate-type",
    "title": "氣候類型：用氣溫與雨量分類",
    "subject": "地理",
    "topic": "氣候類型",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "氣候是「氣溫×雨量」的組合；成因要看緯度、距海遠近、洋流、地形與盛行風。"
  },
  {
    "id": "sh-geo-globalization",
    "title": "世界經濟與全球化：一條看不見的供應鏈",
    "subject": "地理",
    "topic": "世界經濟與全球化",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "比較利益促成國際分工，供應鏈串起各國；機會是效率與多元，風險是關鍵環節中斷。"
  },
  {
    "id": "sh-geo-taiwan-region",
    "title": "臺灣區域發展：北金融、中精密、南重工",
    "subject": "地理",
    "topic": "臺灣區域發展",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "北部的金融服務、中部的精密機械、南部的石化重工、東部的觀光農業，產業正從代工轉向研發。"
  },
  {
    "id": "sh-geo-urban",
    "title": "都市與人口：都市化與人口轉型",
    "subject": "地理",
    "topic": "都市與人口",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "人口往都市集中形成都市化與機能分區；人口轉型走向低低低，台灣正面臨少子化與高齡化。"
  },
  {
    "id": "sh-geo-hazard",
    "title": "自然災害與調適：颱風、地震、洪水",
    "subject": "地理",
    "topic": "自然災害與調適",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "颱風帶豪雨暴潮、地震源自板塊、洪水土石流看地形；調適靠工程與非工程手段並用。"
  },
  {
    "id": "sh-hist-east-asia",
    "title": "東亞史的變遷：中原與周邊的互動",
    "subject": "歷史",
    "topic": "東亞文化交流圈",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "認識古代中原王朝與遊牧民族、朝鮮、日本、越南的互動與文化交流。"
  },
  {
    "id": "sh-hist-taiwan-modern",
    "title": "臺灣近現代史：清領、日治到戰後",
    "subject": "歷史",
    "topic": "臺灣近現代變遷",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "以臺灣課綱分期，認識清領、日治與戰後三階段的統治、建設與社會變遷。"
  },
  {
    "id": "sh-hist-renaissance",
    "title": "文藝復興到工業革命：思想、科學與技術變革",
    "subject": "歷史",
    "topic": "近代歐洲的變革",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "從文藝復興、科學革命、啟蒙運動到工業革命，看歐洲如何走向近代。"
  },
  {
    "id": "sh-hist-world-wars",
    "title": "兩次世界大戰：起因、經過與影響",
    "subject": "歷史",
    "topic": "二十世紀的世界大戰",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "認識兩次世界大戰的起因、經過與影響，包含凡爾賽條約與聯合國成立。"
  },
  {
    "id": "sh-hist-cold-war",
    "title": "冷戰與兩極體系：圍堵、代理戰爭與解體",
    "subject": "歷史",
    "topic": "戰後的美蘇對抗",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "認識二次大戰後美蘇兩極對抗：圍堵政策、馬歇爾計畫、柏林危機、代理戰爭與蘇聯解體。"
  },
  {
    "id": "sh-hist-global-now",
    "title": "當代世界：全球化、區域整合與挑戰",
    "subject": "歷史",
    "topic": "冷戰後的世界",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "認識冷戰後的全球化、區域整合（如歐盟）、恐怖主義、數位時代與全球挑戰。"
  },
  {
    "id": "sh-math-polynomial",
    "title": "多項式函數：次數決定長相",
    "subject": "數學",
    "topic": "多項式函數",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "多項式的次數決定圖形長什麼樣：一次是直線、二次是拋物線、三次會轉兩個彎。"
  },
  {
    "id": "sh-math-exp-log",
    "title": "指數與對數：一體兩面",
    "subject": "數學",
    "topic": "指數與對數",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "指數問「幾個底相乘」，對數問「要乘幾次」。看懂這層互逆關係，log 就不再是背公式。"
  },
  {
    "id": "sh-math-trig",
    "title": "三角函數：從直角三角形出發",
    "subject": "數學",
    "topic": "三角函數",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "sin、cos、tan 只是「邊的比值」。先從直角三角形記住定義，再談廣義角與正弦定理。"
  },
  {
    "id": "sh-math-line-circle",
    "title": "直線與圓：距離決定關係",
    "subject": "數學",
    "topic": "直線與圓",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "圓與直線的關係只有三種：相交兩點、相切一點、不相交。關鍵是「圓心到直線的距離」。"
  },
  {
    "id": "sh-math-sequence",
    "title": "數列與級數：規律的力量",
    "subject": "數學",
    "topic": "數列與級數",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "等差是「每次加同一個數」，等比是「每次乘同一個數」。把規律寫成公式，就能算很遠的項。"
  },
  {
    "id": "sh-math-permutation",
    "title": "排列組合：先問「順序要不要緊」",
    "subject": "數學",
    "topic": "排列與組合",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "排隊拍照要看順序（排列），選便當菜色不看順序（組合）。分清楚，就不會多算。"
  },
  {
    "id": "sh-math-probability",
    "title": "機率與統計：用數字描述不確定",
    "subject": "數學",
    "topic": "機率與統計",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "機率是「長期下來會發生的比例」，期望值是「平均會拿到的數」。算清楚，做決定就有依據。"
  },
  {
    "id": "sh-math-matrix",
    "title": "矩陣：把資料排成表格",
    "subject": "數學",
    "topic": "矩陣",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "矩陣只是「有規則的數字表格」。看懂列與行，就能一次處理很多筆資料與線性關係。"
  },
  {
    "id": "sh-math-vector",
    "title": "向量：有方向的量",
    "subject": "數學",
    "topic": "向量與內積",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "向量同時有「大小」與「方向」。內積可以算出夾角、判斷垂直，是空間問題的萬用工具。"
  },
  {
    "id": "sh-math-calculus-intro",
    "title": "微積分初步：切線與面積",
    "subject": "數學",
    "topic": "微積分初步",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "微分求「瞬間的變化率」（切線斜率），積分求「累積的總量」（曲線下的面積），兩者互為反向操作。"
  },
  {
    "id": "sh-phy-kinematics",
    "title": "運動學：位移、速度與 v-t 圖",
    "subject": "物理",
    "topic": "運動學",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "分清位移與路程，學會用 v-t 圖：斜率是加速度、下方面積是位移。"
  },
  {
    "id": "sh-phy-newton",
    "title": "牛頓運動定律：慣性、F＝ma、作用反作用",
    "subject": "物理",
    "topic": "力與運動",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "用推車與煞車講清慣性、合力等於質量乘加速度，以及為何作用反作用不能抵銷。"
  },
  {
    "id": "sh-phy-work-energy",
    "title": "功與能量：動能、位能與能量守恆",
    "subject": "物理",
    "topic": "功與能量",
    "grade": "高一",
    "stages": [
      "高中"
    ],
    "desc": "用推箱子、拋球與落體講清 W＝Fd、Ek＝½mv²、U＝mgh，以及能量如何守恆。"
  },
  {
    "id": "sh-phy-momentum",
    "title": "動量與碰撞：動量守恆與彈性碰撞",
    "subject": "物理",
    "topic": "動量與碰撞",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "用撞球講清 p＝mv、系統動量守恆，以及彈性與非彈性碰撞的差別。"
  },
  {
    "id": "sh-phy-circular",
    "title": "圓周運動與萬有引力：向心力與衛星",
    "subject": "物理",
    "topic": "圓周運動與萬有引力",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "用繞圈與衛星軌道講清向心力 F＝mv²/r、萬有引力 F＝GMm/r²。"
  },
  {
    "id": "sh-phy-wave",
    "title": "波動：波長、頻率、干涉與繞射",
    "subject": "物理",
    "topic": "波動",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "用聲波與光波講清 v＝fλ，以及干涉、繞射和兩種波的本質差異。"
  },
  {
    "id": "sh-phy-thermo",
    "title": "熱學：比熱、熱平衡與熱力學定律",
    "subject": "物理",
    "topic": "熱學",
    "grade": "高二",
    "stages": [
      "高中"
    ],
    "desc": "用加熱水與鐵、冷熱水混合講清 Q＝mcΔT、熱平衡與熱力學兩大定律。"
  },
  {
    "id": "sh-phy-circuit",
    "title": "電流與電路：歐姆定律、串並聯與電功率",
    "subject": "物理",
    "topic": "電流與電路",
    "grade": "高三",
    "stages": [
      "高中"
    ],
    "desc": "用燈泡與電池講清 V＝IR、串聯並聯的差別，以及電功率 P＝IV。"
  }
];
