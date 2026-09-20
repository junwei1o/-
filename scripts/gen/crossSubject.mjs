/**
 * 跨學科結合題產生器（三科結合 ＋ 五科結合，共 200 題）。
 *
 * 設計理念：**不做隨機拼貼，而是先設計「真實情境劇本」**。
 *
 * 一題跨科題要「巧妙、不硬湊」，關鍵在於情境本身是否真的同時需要那幾個科目。
 * 例如「營養午餐選在地食材」這個情境，數學負責算價差與總量、社會負責產地與運輸、
 * 自然負責碳足跡與食物里程、國語負責海報用字、英語負責雙語標示——五科各有其位，
 * 誰都拿不掉。因此本檔的每一條 recipe 都是一個這樣的情境，並具備兩個特徵：
 *
 *   1. 情境的資料（價格、雨量、人數…）由程式隨機產生，答案由程式算出，
 *      所以「數字一定對」；同一條 recipe 每次參數不同，就會長出不同的題目。
 *   2. 選項一律是「數據 ＋ 學科判斷」的組合，學生必須同時算對、也判斷對。
 *      錯誤選項都是學生真的會犯的錯（算錯、把因果顛倒、用錯字或英文）。
 *
 * 每題的 `knowledge` 會列出各科對應的知識點，`learningTopic` 標成「跨科結合：…」，
 * 讓題庫既能被單科篩選到，也看得出它結合了哪些科目。
 */
import { randInt, pick, shuffle, makeQuestion } from "./common.mjs";

/** 把正解與干擾項洗牌後回傳 { options, answer }。 */
function assemble(rng, correct, wrongs) {
  const options = shuffle(rng, [correct, ...wrongs]);
  return { options, answer: options.indexOf(correct) };
}

/* ==========================================================================
 * 三科結合劇本（數學 ＋ 其中兩科）
 * ========================================================================== */

const THREE_SUBJECT_SCENARIOS = [
  // ── 數學 ＋ 自然 ＋ 社會 ───────────────────────────────────────────
  {
    id: "lunch-mile",
    grade: [5, 6, 7],
    subjects: ["數學", "自然", "社會"],
    topic: "營養午餐的在地食材",
    knowledge: ["乘法與單位換算", "食物里程與碳排放", "地方產業與運輸"],
    build(rng) {
      const classes = randInt(rng, 3, 6);
      const perClass = randInt(rng, 22, 32);
      const local = randInt(rng, 26, 34);
      const remote = local - randInt(rng, 4, 8);
      const grams = 100;
      const meals = classes * perClass;
      const extra = Math.round(((local - remote) * meals * grams) / 1000);
      const far = randInt(rng, 150, 260);
      return {
        prompt: `學校 ${classes} 個班級、每班約 ${perClass} 人，午餐要用高麗菜，每人 ${grams} 公克。在地產的高麗菜每公斤 ${local} 元，外縣市的每公斤 ${remote} 元（要運送 ${far} 公里）。改用在地高麗菜，這一餐總共會多花多少元？從環境看又有什麼好處？`,
        correct: `多 ${extra} 元；運送距離短，食物里程與碳排放都比較少`,
        wrongs: [
          `多 ${extra} 元；運送距離長，蔬菜比較新鮮所以碳排也比較少`,
          `多 ${Math.round(extra * 1.5)} 元；運送距離短，食物里程與碳排放都比較少`,
          `多 ${Math.round(extra / 2)} 元；運送距離長，食物里程與碳排放都比較少`,
        ],
        explanation: `總用量 ＝ ${classes} × ${perClass} × ${grams} ÷ 1000 ＝ ${(meals * grams) / 1000} 公斤；每公斤貴 ${local - remote} 元，所以多花 ${extra} 元。運送距離從 ${far} 公里縮短為在地供應，食物里程下降、運輸碳排放也跟著減少。`,
      };
    },
  },
  {
    id: "reservoir",
    grade: [5, 6, 7, 8],
    subjects: ["數學", "自然", "社會"],
    topic: "水庫水位與限水",
    knowledge: ["減法與百分比", "水循環與降雨", "水資源政策與民生用水"],
    build(rng) {
      const capacity = pick(rng, [200, 250, 300]);
      const early = randInt(rng, 120, 170);
      const rain = randInt(rng, 15, 40);
      const use = randInt(rng, 8, 15);
      const later = early + rain - use;
      const percent = Math.round((later / capacity) * 100);
      return {
        prompt: `${capacity} 萬噸的水庫月初有 ${early} 萬噸水，這個月降下 ${rain} 萬噸的雨水、民生與農業用掉 ${use} 萬噸。月底的水量約是水庫容量的幾成？這樣的水位通常代表什麼？`,
        correct: `約 ${percent} 成；水位偏低，可能要開始宣導節水或限水`,
        wrongs: [
          `約 ${percent} 成；水位偏高，需要預防洩洪`,
          `約 ${Math.max(1, percent - 15)} 成；水位偏低，可能要開始宣導節水或限水`,
          `約 ${percent + 20} 成；水位偏低，可能要開始宣導節水或限水`,
        ],
        explanation: `月底水量 ＝ ${early} ＋ ${rain} − ${use} ＝ ${later} 萬噸，占容量 ${later} ÷ ${capacity} ≈ ${percent}%。降下的雨沒有補回用掉的水，水位偏低時政府會啟動節水宣導與限水措施。`,
      };
    },
  },
  {
    id: "quake-distance",
    grade: [6, 7, 8, 9],
    subjects: ["數學", "自然", "社會"],
    topic: "地震與防災",
    knowledge: ["距離與時間計算", "地震波與震度", "防災演練與建築安全"],
    build(rng) {
      const distance = randInt(rng, 60, 150);
      const speed = pick(rng, [4, 5, 6]);
      const seconds = Math.round(distance / speed);
      return {
        prompt: `地震發生後，P 波以每秒約 ${speed} 公里向外傳遞，距離震央 ${distance} 公里的測站約在幾秒後收到第一個訊號？收到訊號後最該做什麼？`,
        correct: `約 ${seconds} 秒；立即掩護、穩住、抓住桌腳（趴下掩護穩住）`,
        wrongs: [
          `約 ${seconds} 秒；立刻搭電梯下樓到戶外`,
          `約 ${Math.round(seconds * 2)} 秒；立即掩護、穩住、抓住桌腳（趴下掩護穩住）`,
          `約 ${Math.round(distance * speed)} 秒；先打電話確認家人都平安`,
        ],
        explanation: `時間 ＝ 距離 ÷ 波速 ＝ ${distance} ÷ ${speed} ≈ ${seconds} 秒。地震來襲時先就地掩護（趴下、掩護、穩住），不要搭電梯、也不要急著打電話，等搖晃停止再依指示疏散。`,
      };
    },
  },
  {
    id: "solar-bill",
    grade: [6, 7, 8],
    subjects: ["數學", "自然", "社會"],
    topic: "太陽能與用電",
    knowledge: ["乘法與電費計算", "太陽能與能源轉換", "能源政策與節能"],
    build(rng) {
      const kw = pick(rng, [3, 4, 5]);
      const hours = pick(rng, [3, 4]);
      const days = 30;
      const price = pick(rng, [4, 5, 6]);
      const saved = kw * hours * days * price;
      return {
        prompt: `屋頂裝了 ${kw} 瓩的太陽能板，平均每天有效發電 ${hours} 小時，每度電 ${price} 元。一個月（${days} 天）大約可省下多少電費？這對環境的意義是什麼？`,
        correct: `約 ${saved} 元；發電過程不排放二氧化碳，可減少燃煤發電`,
        wrongs: [
          `約 ${saved} 元；太陽能板會製造雨水，可增加水庫水量`,
          `約 ${Math.round(saved / 2)} 元；發電過程不排放二氧化碳，可減少燃煤發電`,
          `約 ${saved * 2} 元；太陽能可以把二氧化碳變成氧氣`,
        ],
        explanation: `省下電費 ＝ ${kw} × ${hours} × ${days} × ${price} ＝ ${saved} 元。太陽能發電不燃燒燃料，因此不會直接排放二氧化碳；但它不會造雨，也不會把二氧化碳變成氧氣（那是植物的光合作用）。`,
      };
    },
  },
  {
    id: "recycle-rate",
    grade: [5, 6, 7],
    subjects: ["數學", "自然", "社會"],
    topic: "資源回收率",
    knowledge: ["百分比計算", "資源循環與分解", "環保政策與社區行動"],
    build(rng) {
      const total = pick(rng, [40, 50, 60, 80]);
      const recycled = randInt(rng, 12, total - 10);
      const rate = Math.round((recycled / total) * 100);
      return {
        prompt: `學校這個月產生 ${total} 公斤垃圾，其中 ${recycled} 公斤進了回收桶。回收率約是多少？要提高回收率，下列哪一項做法最有效？`,
        correct: `約 ${rate}%；把回收桶標示清楚並在垃圾產生處就分類`,
        wrongs: [
          `約 ${rate}%；把所有垃圾都丟進同一個桶子再請清潔隊分類`,
          `約 ${100 - rate}%；把回收桶標示清楚並在垃圾產生處就分類`,
          `約 ${Math.round(rate / 2)}%；把回收桶標示清楚並在垃圾產生處就分類`,
        ],
        explanation: `回收率 ＝ ${recycled} ÷ ${total} ≈ ${rate}%。分類要在「丟的那一刻」就做對，事後再從混合垃圾裡挑出來既費工又容易污染其他可回收物。`,
      };
    },
  },
  // ── 數學 ＋ 自然 ＋ 國語 ───────────────────────────────────────────
  {
    id: "rain-chance",
    grade: [5, 6, 7],
    subjects: ["數學", "自然", "國語"],
    topic: "降雨機率的讀法",
    knowledge: ["機率的概念", "天氣預報與降雨", "詞語理解與語意"],
    build(rng) {
      const chance = pick(rng, [30, 40, 50, 60, 70, 80]);
      return {
        prompt: `天氣預報說「明天降雨機率 ${chance}%」。下列哪一句對這句話的解釋最恰當？`,
        correct: `在類似條件的許多天裡，大約有 ${100 - chance}% 的日子不會下雨，所以要帶傘預備`,
        wrongs: [
          `明天一定會下 ${chance} 毫米的雨`,
          `明天全臺有 ${chance}% 的土地會下雨`,
          `明天會下 ${chance} 分鐘的雨`,
        ],
        explanation: `降雨機率是「會不會下雨」的可能性，不是雨量也不是時間。${chance}% 代表在條件相似的日子裡，大約有 ${chance}% 會下雨、${100 - chance}% 不會——所以帶傘是合理的準備。`,
      };
    },
  },
  {
    id: "plant-log",
    grade: [3, 4, 5],
    subjects: ["數學", "自然", "國語"],
    topic: "植物生長紀錄",
    knowledge: ["測量與資料比較", "植物生長條件", "「的、得、地」的用法"],
    build(rng) {
      const w1 = randInt(rng, 3, 6);
      const w2 = w1 + randInt(rng, 4, 9);
      const diff = w2 - w1;
      return {
        prompt: `小安記錄綠豆的生長：第一週高 ${w1} 公分，第三週高 ${w2} 公分。下列哪一句「同時」把數據和用字都寫對了？`,
        correct: `第三週比第一週高了 ${diff} 公分，綠豆「長得」很快`,
        wrongs: [
          `第三週比第一週高了 ${diff} 公分，綠豆「長的」很快`,
          `第三週比第一週高了 ${w2} 公分，綠豆「長得」很快`,
          `第三週比第一週高了 ${w1 + w2} 公分，綠豆「長的」很快`,
        ],
        explanation: `成長量 ＝ ${w2} − ${w1} ＝ ${diff} 公分。「長得很快」的「得」接在動詞後面表示程度，所以用「得」；「的」用來修飾名詞。`,
      };
    },
  },
  {
    id: "typhoon-word",
    grade: [5, 6, 7],
    subjects: ["數學", "自然", "國語"],
    topic: "颱風警報的用語",
    knowledge: ["數據判讀", "颱風與豪雨", "新聞用語與語意強弱"],
    build(rng) {
      const rain = randInt(rng, 200, 600);
      const hours = pick(rng, [12, 24, 36]);
      const perHour = Math.round((rain / hours) * 10) / 10;
      return {
        prompt: `颱風外圍環流在 ${hours} 小時內降下 ${rain} 毫米的雨。若用一句話寫進新聞稿，下列哪一句「數據與語氣」都恰當？`,
        correct: `平均每小時約 ${perHour} 毫米，山區要留意土石鬆動（用「要留意」陳述事實）`,
        wrongs: [
          `平均每小時約 ${perHour} 毫米，山區一定會土石流（把可能說成必然）`,
          `平均每小時約 ${rain} 毫米，山區要留意土石鬆動`,
          `平均每小時約 ${hours} 毫米，山區「大概不可能」有問題`,
        ],
        explanation: `每小時平均雨量 ＝ ${rain} ÷ ${hours} ≈ ${perHour} 毫米。報導要「陳述事實、提醒風險」，把「可能」寫成「一定」會造成不必要的恐慌，也失去準確性。`,
      };
    },
  },
  // ── 數學 ＋ 社會 ＋ 國語 ───────────────────────────────────────────
  {
    id: "old-street-budget",
    grade: [4, 5, 6],
    subjects: ["數學", "社會", "國語"],
    topic: "老街一日遊的預算",
    knowledge: ["加減與乘法", "地方文化與古蹟", "記敘文的時間順序"],
    build(rng) {
      const people = randInt(rng, 4, 6);
      const fare = pick(rng, [30, 45, 60]);
      const lunch = pick(rng, [80, 95, 120]);
      const total = people * (fare + lunch);
      return {
        prompt: `${people} 個人一起去老街，來回車資每人 ${fare} 元、午餐每人 ${lunch} 元。用「先…接著…最後…」把行程與花費寫清楚，下列哪一句最好？`,
        correct: `每人共花 ${fare + lunch} 元、合計 ${total} 元；「先」參觀老街古蹟，「接著」品嘗在地小吃，「最後」搭車回家`,
        wrongs: [
          `每人共花 ${fare + lunch} 元、合計 ${total} 元；「最後」參觀老街古蹟，「先」搭車回家`,
          `每人共花 ${fare * lunch} 元、合計 ${total} 元；「先」參觀老街古蹟，「接著」品嘗在地小吃`,
          `每人共花 ${fare + lunch} 元、合計 ${people * fare} 元；「先」參觀老街古蹟，「接著」品嘗在地小吃`,
        ],
        explanation: `每人 ${fare} ＋ ${lunch} ＝ ${fare + lunch} 元，${people} 人共 ${total} 元。記敘文的時間順序詞要與事件順序相符：先到老街參觀、接著吃小吃、最後回家。`,
      };
    },
  },
  {
    id: "class-survey",
    grade: [4, 5, 6],
    subjects: ["數學", "社會", "國語"],
    topic: "班級調查與圖表標題",
    knowledge: ["長條圖與百分比", "公共議題與表意", "標題與精確用字"],
    build(rng) {
      const yes = randInt(rng, 8, 18);
      const no = randInt(rng, 5, 12);
      const total = yes + no;
      const rate = Math.round((yes / total) * 100);
      return {
        prompt: `班上 ${total} 人投票是否贊成「下課延長 10 分鐘」：贊成 ${yes} 人、不贊成 ${no} 人。做成長條圖時，下列哪一組「標題與數字」都正確？`,
        correct: `標題「班上對下課延長 10 分鐘的看法」；贊成占約 ${rate}%`,
        wrongs: [
          `標題「大家都贊成延長下課」；贊成占約 ${rate}%`,
          `標題「班上對下課延長 10 分鐘的看法」；贊成占約 ${100 - rate}%`,
          `標題「下課時間有多長」；贊成占約 ${rate}%`,
        ],
        explanation: `贊成比率 ＝ ${yes} ÷ ${total} ≈ ${rate}%。圖表標題要中性描述調查主題，不能把「多數贊成」寫成「大家都贊成」，否則就扭曲了少數人的意見。`,
      };
    },
  },
  // ── 數學 ＋ 自然 ＋ 英語 ───────────────────────────────────────────
  {
    id: "sports-unit",
    grade: [6, 7, 8],
    subjects: ["數學", "自然", "英語"],
    topic: "運動成績的單位",
    knowledge: ["除法與平均", "速度的意義", "英文單位與說法"],
    build(rng) {
      const meters = pick(rng, [100, 200, 400]);
      const seconds = randInt(rng, 14, 40);
      const speed = Math.round((meters / seconds) * 100) / 100;
      return {
        prompt: `小明跑 ${meters} 公尺花了 ${seconds} 秒。要寫進雙語成績表，下列哪一組「數字與英文」都正確？`,
        correct: `平均每秒約 ${speed} 公尺（${speed} m/s）；英文寫 "average speed"`,
        wrongs: [
          `平均每秒約 ${speed} 公尺（${speed} m/s）；英文寫 "average length"`,
          `平均每秒約 ${seconds / meters} 公尺（${seconds / meters} m/s）；英文寫 "average speed"`,
          `平均每秒約 ${meters} 公尺（${meters} m/s）；英文寫 "average time"`,
        ],
        explanation: `速率 ＝ 距離 ÷ 時間 ＝ ${meters} ÷ ${seconds} ≈ ${speed} m/s。英文的「平均速率」是 average speed；length 是長度、time 是時間，都不是速率。`,
      };
    },
  },
  {
    id: "night-market",
    grade: [5, 6, 7],
    subjects: ["數學", "社會", "英語"],
    topic: "夜市的消費",
    knowledge: ["加減與找錢", "消費與在地經濟", "英文數字與價格說法"],
    build(rng) {
      const price = pick(rng, [45, 55, 65, 75]);
      const count = randInt(rng, 2, 4);
      const paid = Math.ceil((price * count) / 100) * 100;
      const change = paid - price * count;
      return {
        prompt: `夜市一份小吃 ${price} 元，買了 ${count} 份，付 ${paid} 元。要向外國朋友說明，下列哪一組「找錢與英文」都正確？`,
        correct: `找 ${change} 元；英文說 "It costs ${price} dollars each."`,
        wrongs: [
          `找 ${change} 元；英文說 "It costs ${price} dollar each."`,
          `找 ${price * count} 元；英文說 "It costs ${price} dollars each."`,
          `找 ${change} 元；英文說 "I cost ${price} dollars each."`,
        ],
        explanation: `總價 ${price} × ${count} ＝ ${price * count} 元，付 ${paid} 元要找 ${change} 元。英文的價格用 It costs…，主詞用 It；複數價格要說 dollars。`,
      };
    },
  },
  // ── 自然 ＋ 社會 ＋ 國語／英語 ────────────────────────────────────
  {
    id: "trash-slogan",
    grade: [4, 5, 6],
    subjects: ["自然", "社會", "國語"],
    topic: "垃圾分類與標語",
    knowledge: ["資源回收與分解", "公民責任與公共環境", "標語用字與語氣"],
    build(rng) {
      const item = pick(rng, ["寶特瓶", "紙餐盒", "鋁罐"]);
      const years = pick(rng, [30, 50, 200]);
      return {
        prompt: `社區要做垃圾分類標語，主題是「${item}」。下列哪一句「事實與語氣」都恰當？`,
        correct: `${item}要沖洗後回收；標語：「隨手分類，資源不浪費」`,
        wrongs: [
          `${item}用完直接丟一般垃圾就好；標語：「隨手分類，資源不浪費」`,
          `${item}要沖洗後回收；標語：「不回收就會被罰錢，看著辦」`,
          `${item}埋在土裡約 ${years} 年就會分解，不用回收；標語：「隨手分類，資源不浪費」`,
        ],
        explanation: `回收物沖洗後才不會污染其他資源；標語要正向、具體，用威脅語氣（看著辦）或錯誤事實（把分解年數說得很短）都不恰當。`,
      };
    },
  },
  {
    id: "weather-english",
    grade: [6, 7, 8],
    subjects: ["自然", "社會", "英語"],
    topic: "雙語氣象報告",
    knowledge: ["天氣要素與季風", "觀光與生活安排", "英文天氣用語"],
    build(rng) {
      const season = pick(rng, ["summer", "winter"]);
      const temp = season === "summer" ? randInt(rng, 30, 35) : randInt(rng, 12, 18);
      return {
        prompt: `臺灣 ${season === "summer" ? "夏季吹西南季風、午後常有雷陣雨" : "冬季吹東北季風、北部濕冷"}。要用英文播報「今天 ${temp} 度、記得帶傘」，下列哪一句最合適？`,
        correct: `It is ${temp} degrees today. Don't forget your umbrella.`,
        wrongs: [
          `It is ${temp} degree today. Don't forget your umbrella.`,
          `Today is ${temp} degrees. Forget your umbrella.`,
          `It have ${temp} degrees today. Don't forget your umbrella.`,
        ],
        explanation: `英文說氣溫用 It is … degrees（複數要加 s）。提醒帶傘是 Don't forget your umbrella；忘了帶是 forget，少了 Don't 意思就相反了。`,
      };
    },
  },
  {
    id: "animal-name",
    grade: [3, 4, 5],
    subjects: ["自然", "國語", "英語"],
    topic: "動物名稱的中英對照",
    knowledge: ["動物分類", "詞語構造", "英文字彙"],
    build(rng) {
      const animal = pick(rng, [
        { zh: "鯨魚", en: "whale", kind: "哺乳類" },
        { zh: "青蛙", en: "frog", kind: "兩生類" },
        { zh: "蝙蝠", en: "bat", kind: "哺乳類" },
      ]);
      return {
        prompt: `要把「${animal.zh}」寫進雙語解說牌，並標出牠的分類。下列哪一組完全正確？`,
        correct: `${animal.zh}（${animal.en}）屬於${animal.kind}；其中「${animal.zh}」兩個字都是形聲字，合起來表示這種動物`,
        wrongs: [
          `${animal.zh}（${animal.en}）屬於魚類；其他部分正確`,
          `${animal.zh}（${animal.en}）屬於鳥類；其他部分正確`,
          `${animal.zh}（${animal.en}）屬於${animal.kind}；英文要寫成 ${animal.en}s（指單一隻時）`,
        ],
        explanation: `${animal.zh}的英文是 ${animal.en}，屬於${animal.kind}（判斷依據是牠的呼吸與生殖方式）。單一隻動物用單數名詞，不加 s。`,
      };
    },
  },
  // ── 語文 ＋ 資訊量 ────────────────────────────────────────────────
  {
    id: "reading-summary",
    grade: [6, 7, 8],
    subjects: ["數學", "國語", "英語"],
    topic: "摘要的字數與重點",
    knowledge: ["字數計算與比例", "摘要與重點擷取", "英文摘要用字"],
    build(rng) {
      const total = pick(rng, [400, 500, 600]);
      const limit = pick(rng, [100, 150]);
      const ratio = Math.round((limit / total) * 100);
      return {
        prompt: `一篇文章 ${total} 字，老師要求摘要不超過 ${limit} 字。摘要約占全文的幾成？要把摘要寫好，下列哪一項做法最關鍵？`,
        correct: `約 ${ratio}%；保留每段的主題句與結論，刪掉例子與細節`,
        wrongs: [
          `約 ${ratio}%；把全文抄一次再刪掉幾個字`,
          `約 ${100 - ratio}%；保留每段的主題句與結論，刪掉例子與細節`,
          `約 ${ratio}%；只抄第一段與最後一段，中間全部不要`,
        ],
        explanation: `${limit} ÷ ${total} ≈ ${ratio}%。摘要要抓「每段的主題句與結論」（也就是重點），例子與細節可以省略；只抄頭尾會漏掉中間的重點。`,
      };
    },
  },
];

/* ==========================================================================
 * 五科結合劇本（數學 ＋ 自然 ＋ 社會 ＋ 國語 ＋ 英語都在情境裡）
 * ========================================================================== */

const FIVE_SUBJECT_SCENARIOS = [
  {
    id: "bilingual-lunch",
    grade: [5, 6, 7],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "雙語營養午餐海報",
    knowledge: ["乘法與比例", "營養均衡", "在地農業", "海報用字", "英文標示"],
    build(rng) {
      const meals = randInt(rng, 600, 900);
      const local = randInt(rng, 30, 40);
      const rate = pick(rng, [60, 70, 80]);
      const localKg = Math.round((meals * 0.1 * rate) / 100);
      return {
        prompt: `學校每天供應 ${meals} 份午餐，每份蔬菜 100 公克，其中 ${rate}% 用在地蔬菜。海報要同時寫上數據、營養提醒與英文標示。下列哪一張海報的內容全部正確？`,
        correct: `每天約用 ${localKg} 公斤在地蔬菜；提醒六大類食物要均衡；英文標示 "local vegetables"`,
        wrongs: [
          `每天約用 ${localKg} 公斤在地蔬菜；提醒「只吃蔬菜最健康」；英文標示 "local vegetables"`,
          `每天約用 ${meals} 公斤在地蔬菜；提醒六大類食物要均衡；英文標示 "local vegetables"`,
          `每天約用 ${localKg} 公斤在地蔬菜；提醒六大類食物要均衡；英文標示 "vegetables local"`,
        ],
        explanation: `在地蔬菜用量 ＝ ${meals} × 0.1 × ${rate}% ≈ ${localKg} 公斤。飲食要均衡（六大類食物都要吃），不能只吃蔬菜；英文形容詞放在名詞前面，所以是 local vegetables。`,
      };
    },
  },
  {
    id: "typhoon-day",
    grade: [6, 7, 8, 9],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "颱風停班停課的判斷",
    knowledge: ["數據判讀", "颱風與風雨", "停班停課規定", "公告用字", "英文公告"],
    build(rng) {
      const gusts = randInt(rng, 8, 12);
      const rain = randInt(rng, 200, 450);
      const day = pick(rng, ["Monday", "Tuesday"]);
      return {
        prompt: `颱風來襲，預報出現 ${gusts} 級陣風與 ${rain} 毫米累積雨量。縣市政府要發布停班停課公告。下列哪一份公告「依據、用字、英文」都恰當？`,
        correct: `依風力與雨量預報，宣布明天停班停課；公告寫「請民眾避免前往山區」，英文寫 "Schools and offices are closed ${day}."`,
        wrongs: [
          `依風力與雨量預報，宣布明天停班停課；公告寫「明天一定淹水」，英文寫 "Schools and offices are closed ${day}."`,
          `依風力與雨量預報，宣布明天停班停課；公告寫「請民眾避免前往山區」，英文寫 "School closed tomorrow maybe."`,
          `不管預報，先宣布停班停課再說；公告寫「請民眾避免前往山區」，英文寫 "Schools and offices are closed ${day}."`,
        ],
        explanation: `停班停課要看風力與雨量的預報標準，不是憑感覺；公告要陳述事實並提醒風險（避免前往山區），不能把「可能」寫成「一定」。英文公告要完整：Schools and offices are closed…。`,
      };
    },
  },
  {
    id: "field-trip",
    grade: [4, 5, 6],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "校外教學一日遊",
    knowledge: ["預算與時間計算", "天氣與穿著", "古蹟與文化", "遊記寫作", "英文問路"],
    build(rng) {
      const students = randInt(rng, 28, 36);
      const fare = pick(rng, [60, 80, 100]);
      const ticket = pick(rng, [30, 50]);
      const total = students * (fare + ticket);
      return {
        prompt: `${students} 位同學要去古蹟參觀：車資每人 ${fare} 元、門票每人 ${ticket} 元。行前通知要包含費用、天氣提醒、文化禮儀、遊記任務與英文問路句。下列哪一份通知全部正確？`,
        correct: `每人 ${fare + ticket} 元、合計 ${total} 元；提醒山區可能有午後陣雨要帶雨具；提醒古蹟內勿觸摸文物；遊記用「先…接著…最後」；英文問路 "Excuse me, how do I get to the museum?"`,
        wrongs: [
          `每人 ${fare + ticket} 元、合計 ${total} 元；提醒「今天一定下雨」；提醒古蹟內勿觸摸文物；遊記用「先…接著…最後」；英文問路 "Excuse me, how I get to the museum?"`,
          `每人 ${fare * ticket} 元、合計 ${total} 元；提醒山區可能有午後陣雨要帶雨具；提醒古蹟內勿觸摸文物；遊記用「先…接著…最後」；英文問路 "Excuse me, how do I get to the museum?"`,
          `每人 ${fare + ticket} 元、合計 ${students * fare} 元；提醒山區可能有午後陣雨要帶雨具；提醒古蹟內勿觸摸文物；遊記用「最後…先…接著」；英文問路 "Excuse me, where the museum?"`,
        ],
        explanation: `每人 ${fare} ＋ ${ticket} ＝ ${fare + ticket} 元，${students} 人共 ${total} 元。行前通知要同時顧到費用、天氣（午後陣雨用「可能」）、文化禮儀、寫作順序與正確的英文問句（how do I get to…）。`,
      };
    },
  },
  {
    id: "energy-week",
    grade: [5, 6, 7],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "校園節能減碳週",
    knowledge: ["用電量計算", "能源與發電", "節能政策", "宣導文案", "英文標語"],
    build(rng) {
      const classes = randInt(rng, 20, 30);
      const kwh = pick(rng, [2, 3, 4]);
      const days = 5;
      const saved = classes * kwh * days;
      const co2 = Math.round(saved * 0.5);
      return {
        prompt: `節能週期間，${classes} 個班級每天各關燈省下 ${kwh} 度電，共 ${days} 天。宣導要寫上省電量、減碳量、政策和雙語標語。下列哪一組全部正確？`,
        correct: `共省 ${saved} 度電、約減碳 ${co2} 公斤；政策可搭配「夏月節電獎勵」；標語「隨手關燈，地球降溫」；英文 "Turn off the lights."`,
        wrongs: [
          `共省 ${saved} 度電、約減碳 ${co2} 公斤；政策可搭配「夏月節電獎勵」；標語「隨手關燈，地球降溫」；英文 "Turn on the lights."`,
          `共省 ${classes * kwh} 度電、約減碳 ${co2} 公斤；政策可搭配「夏月節電獎勵」；標語「隨手關燈，地球降溫」；英文 "Turn off the lights."`,
          `共省 ${saved} 度電、約減碳 ${saved} 公斤；政策可搭配「夏月節電獎勵」；標語「隨手關燈，地球降溫」；英文 "Turn off the lights."`,
        ],
        explanation: `省下電量 ＝ ${classes} × ${kwh} × ${days} ＝ ${saved} 度，約減碳 ${co2} 公斤（每度電約排放 0.5 公斤二氧化碳）。標語要關燈（Turn off），開燈是 Turn on，意思正好相反。`,
      };
    },
  },
  {
    id: "fruit-export",
    grade: [6, 7, 8, 9],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "臺灣水果外銷",
    knowledge: ["產量與百分比", "果樹生長與保鮮", "國際貿易", "新聞稿用字", "英文品名"],
    build(rng) {
      const tons = pick(rng, [400, 600, 800]);
      const exportRate = pick(rng, [20, 25, 30]);
      const exported = Math.round((tons * exportRate) / 100);
      return {
        prompt: `一季的芒果產量 ${tons} 公噸，其中 ${exportRate}% 外銷。要寫一則外銷新聞，內容要包含銷量、保鮮方式、貿易對象與英文品名。下列哪一則全部正確？`,
        correct: `外銷約 ${exported} 公噸；低溫冷藏可延長保鮮；主要銷往日本、新加坡；英文 "Taiwan mangoes"`,
        wrongs: [
          `外銷約 ${exported} 公噸；常溫曝曬可延長保鮮；主要銷往日本、新加坡；英文 "Taiwan mangoes"`,
          `外銷約 ${tons} 公噸；低溫冷藏可延長保鮮；主要銷往日本、新加坡；英文 "Taiwan mangoes"`,
          `外銷約 ${exported} 公噸；低溫冷藏可延長保鮮；主要銷往日本、新加坡；英文 "Mangoes Taiwan"`,
        ],
        explanation: `外銷量 ＝ ${tons} × ${exportRate}% ≈ ${exported} 公噸。水果要靠低溫冷藏減緩後熟與腐敗（常溫曝曬只會加速腐壞）；英文的「臺灣芒果」是 Taiwan mangoes（產地放前面）。`,
      };
    },
  },
  {
    id: "earth-day",
    grade: [4, 5, 6],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "世界地球日活動",
    knowledge: ["統計與比例", "生態與環境", "公民參與", "活動文案", "英文主題"],
    build(rng) {
      const people = randInt(rng, 120, 400);
      const bags = pick(rng, [2, 3, 4]);
      const total = people * bags;
      return {
        prompt: `世界地球日活動有 ${people} 人參加，每人撿 ${bags} 袋垃圾。活動海報要包含成果、生態說明、公民行動、文案與英文主題。下列哪一張全部正確？`,
        correct: `共撿 ${total} 袋垃圾；說明垃圾會影響棲地與食物鏈；鼓勵「自己的垃圾自己帶走」；主題標語「減塑愛地球」；英文 "Earth Day"`,
        wrongs: [
          `共撿 ${total} 袋垃圾；說明垃圾會「讓植物長得更好」（把因果說反）；鼓勵「自己的垃圾自己帶走」；主題標語「減塑愛地球」；英文 "Earth Day"`,
          `共撿 ${people} 袋垃圾；說明垃圾會影響棲地與食物鏈；鼓勵「自己的垃圾自己帶走」；主題標語「減塑愛地球」；英文 "Earth Day"`,
          `共撿 ${total} 袋垃圾；說明垃圾會影響棲地與食物鏈；鼓勵「自己的垃圾自己帶走」；主題標語「減塑愛地球」；英文 "Earth's day to day"`,
        ],
        explanation: `垃圾總數 ＝ ${people} × ${bags} ＝ ${total} 袋。垃圾會破壞棲地、被動物誤食而進入食物鏈，不會讓植物長更好；「世界地球日」的英文是固定的 Earth Day。`,
      };
    },
  },
  {
    id: "school-fair",
    grade: [4, 5, 6, 7],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "園遊會攤位規劃",
    knowledge: ["成本與利潤", "食品安全與保存", "消費與交易", "叫賣用語", "英文招牌"],
    build(rng) {
      const cost = pick(rng, [10, 12, 15]);
      const price = cost + pick(rng, [5, 8, 10]);
      const sold = randInt(rng, 60, 120);
      const profit = (price - cost) * sold;
      return {
        prompt: `園遊會賣紅茶：一杯成本 ${cost} 元、賣 ${price} 元，共賣出 ${sold} 杯。攤位招牌要寫利潤、食品安全提醒、交易方式、叫賣用語與英文名稱。下列哪一個招牌全部正確？`,
        correct: `賺 ${profit} 元；提醒飲料要冰存並注意保存時間；說明只收現金、當場找零；叫賣「好喝紅茶，一杯 ${price} 元」；英文 "Black Tea"`,
        wrongs: [
          `賺 ${profit} 元；提醒飲料要放在常溫下久放才不會壞；說明只收現金、當場找零；叫賣「好喝紅茶，一杯 ${price} 元」；英文 "Black Tea"`,
          `賺 ${price * sold} 元；提醒飲料要冰存並注意保存時間；說明只收現金、當場找零；叫賣「好喝紅茶，一杯 ${price} 元」；英文 "Black Tea"`,
          `賺 ${profit} 元；提醒飲料要冰存並注意保存時間；說明只收現金、當場找零；叫賣「好喝紅茶，一杯 ${price} 元」；英文 "Tea black"`,
        ],
        explanation: `利潤 ＝（${price} − ${cost}）× ${sold} ＝ ${profit} 元（要扣掉成本，不能直接乘售價）。飲料要低溫保存以免細菌滋生；英文的「紅茶」是 black tea，形容詞放前面。`,
      };
    },
  },
  {
    id: "river-check",
    grade: [6, 7, 8, 9],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "河川水質調查",
    knowledge: ["平均與數據整理", "溶氧與水質指標", "環保法規與監督", "調查報告用字", "英文報告標題"],
    build(rng) {
      const a = randInt(rng, 4, 7);
      const b = randInt(rng, 2, 5);
      const avg = Math.round(((a + b) / 2) * 10) / 10;
      return {
        prompt: `調查河川溶氧：上游 ${a} mg/L、下游 ${b} mg/L。報告要寫平均值、水質判斷、可採取的行動與英文標題。下列哪一份報告全部正確？`,
        correct: `平均 ${avg} mg/L；下游溶氧較低，可能是排入有機廢水；可通報環保單位並持續監測；英文標題 "River Water Quality Report"`,
        wrongs: [
          `平均 ${avg} mg/L；下游溶氧較低代表水質變好；可通報環保單位並持續監測；英文標題 "River Water Quality Report"`,
          `平均 ${a + b} mg/L；下游溶氧較低，可能是排入有機廢水；可通報環保單位並持續監測；英文標題 "River Water Quality Report"`,
          `平均 ${avg} mg/L；下游溶氧較低，可能是排入有機廢水；可通報環保單位並持續監測；英文標題 "Report Water River Quality"`,
        ],
        explanation: `平均 ＝（${a} ＋ ${b}）÷ 2 ＝ ${avg} mg/L。溶氧越低表示水中的氧氣越少，通常與有機污染有關（不是水質變好）；英文標題的字序是 River Water Quality Report。`,
      };
    },
  },
  {
    id: "breakfast-choice",
    grade: [3, 4, 5],
    subjects: ["數學", "自然", "社會", "國語", "英語"],
    topic: "早餐怎麼選",
    knowledge: ["價格與預算", "營養與熱量", "消費選擇", "語詞使用", "英文食物名稱"],
    build(rng) {
      const budget = pick(rng, [60, 70, 80]);
      const a = pick(rng, [25, 30]);
      const b = pick(rng, [20, 25]);
      const left = budget - a - b;
      return {
        prompt: `早餐預算 ${budget} 元，買了 ${a} 元的蛋餅與 ${b} 元的豆漿。要寫一張「健康早餐小卡」說明剩多少錢、營養建議、消費提醒與英文名稱。下列哪一張小卡全部正確？`,
        correct: `還剩 ${left} 元；建議再補充水果，讓營養更均衡；提醒先看價格再買；英文 "egg pancake, soy milk"`,
        wrongs: [
          `還剩 ${left} 元；建議只喝豆漿就好，其他都不用吃；提醒先看價格再買；英文 "egg pancake, soy milk"`,
          `還剩 ${budget} 元；建議再補充水果，讓營養更均衡；提醒先看價格再買；英文 "egg pancake, soy milk"`,
          `還剩 ${left} 元；建議再補充水果，讓營養更均衡；提醒先看價格再買；英文 "pancake egg, milk soy"`,
        ],
        explanation: `剩餘 ＝ ${budget} − ${a} − ${b} ＝ ${left} 元。早餐要有主食、蛋白質與蔬果才均衡；英文的食物名稱不能直接把中文詞序翻過去，蛋餅是 egg pancake、豆漿是 soy milk。`,
      };
    },
  },
];

/* ==========================================================================
 * 產生器
 * ========================================================================== */

const PREFIX = { 數學: "math", 自然: "sci", 社會: "soc", 國語: "chi", 英語: "eng" };

/**
 * 產生跨學科結合題。
 *
 * @param rng 種子亂數
 * @param collector 去重收集器
 * @param target 目標題數
 * @param ratio 三科結合的比例（其餘為五科結合），預設 0.6（120 三科 ＋ 80 五科）
 */
export function generateCrossSubject(rng, collector, target, opts = {}) {
  const threeRatio = opts.threeRatio ?? 0.6;
  const threeTarget = Math.round(target * threeRatio);
  const fiveTarget = target - threeTarget;
  let produced = 0;
  let guard = 0;

  const run = (scenarios, count) => {
    let made = 0;
    while (made < count && guard < target * 40) {
      guard += 1;
      const scenario = pick(rng, scenarios);
      const built = scenario.build(rng);
      if (!built) continue;

      const { options, answer } = assemble(rng, built.correct, built.wrongs);
      if (new Set(options).size !== options.length) continue;

      const grade = pick(rng, scenario.grade);
      /**
       * 主科輪換：跨科題在資料庫裡只能掛一個科目，如果一律掛第一個科目，
       * 單科篩選時就會全擠在數學（曾經 184/200）。這裡在情境涉及的科目之間輪流掛，
       * 讓每一科都分到一些跨科題；完整組合仍記在 subjectCombination 與 knowledge。
       */
      const primary = scenario.subjects[made % scenario.subjects.length];
      const question = makeQuestion({
        subject: primary,
        grade,
        topic: `跨科結合：${scenario.topic}`,
        difficulty: scenario.subjects.length >= 5 ? "挑戰" : "標準",
        prompt: built.prompt,
        options,
        answer,
        explanation: built.explanation,
        knowledge: scenario.knowledge,
        subjectCombination: scenario.subjects,
      });
      if (!question) continue;
      if (collector.add(question)) {
        made += 1;
        produced += 1;
      }
    }
    return made;
  };

  const threeMade = run(THREE_SUBJECT_SCENARIOS, threeTarget);
  const fiveMade = run(FIVE_SUBJECT_SCENARIOS, fiveTarget);
  return { total: produced, three: threeMade, five: fiveMade };
}

export const CROSS_SUBJECT_RECIPES = {
  three: THREE_SUBJECT_SCENARIOS.length,
  five: FIVE_SUBJECT_SCENARIOS.length,
};
