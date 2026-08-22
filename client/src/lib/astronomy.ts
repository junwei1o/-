export type AstronomyKey =
  | "cosmic-scale"
  | "solar-system"
  | "earth-moon"
  | "stars"
  | "galaxies-black-holes"
  | "skywatching"
  | "space-exploration"
  | "life-in-universe";

export type AstronomyExhibit = {
  key: AstronomyKey;
  name: string;
  english: string;
  eyebrow: string;
  color: string;
  short: string;
  explanation: string;
  lifeConnection: string;
  mission: string;
  keyIdeas: string[];
  question: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type AstronomyQuizQuestion = {
  id: string;
  exhibitKey: AstronomyKey;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  tier?: AstronomyQuizTier;
};

export type AstronomyQuizTier = "planet" | "galaxy" | "mission" | "tools";

export type AstronomyQuizTierInfo = {
  id: AstronomyQuizTier;
  level: string;
  name: string;
  short: string;
  description: string;
};

export const ASTRONOMY_QUIZ_TIERS: AstronomyQuizTierInfo[] = [
  { id: "planet", level: "LEVEL 01", name: "行星入門", short: "行星與太陽系", description: "從八大行星、岩質與巨行星開始建立太陽系的觀測基礎。" },
  { id: "galaxy", level: "LEVEL 02", name: "星系探索", short: "星系、恆星與宇宙尺度", description: "讀懂銀河系、恆星、星系與遙遠宇宙留下的光學線索。" },
  { id: "mission", level: "LEVEL 03", name: "太空任務", short: "探測器與科學目標", description: "理解任務、軌道、資料傳回與太空探測器如何回答科學問題。" },
  { id: "tools", level: "LEVEL 04", name: "觀測工具", short: "望遠鏡與光譜證據", description: "透過望遠鏡、感測器與光譜，練習把觀測工具連回可檢驗的證據。" },
];

const EXHIBIT_TIER: Record<AstronomyKey, AstronomyQuizTier> = {
  "cosmic-scale": "galaxy",
  "solar-system": "planet",
  "earth-moon": "planet",
  stars: "galaxy",
  "galaxies-black-holes": "galaxy",
  skywatching: "tools",
  "space-exploration": "mission",
  "life-in-universe": "galaxy",
};

export const getAstronomyQuestionTier = (question: AstronomyQuizQuestion): AstronomyQuizTier => question.tier ?? EXHIBIT_TIER[question.exhibitKey];

export const getAstronomyQuizTier = (tier: AstronomyQuizTier) => ASTRONOMY_QUIZ_TIERS.find((item) => item.id === tier);

export const ASTRONOMY_EXHIBITS: AstronomyExhibit[] = [
  {
    key: "cosmic-scale",
    name: "宇宙尺度",
    english: "COSMIC SCALE",
    eyebrow: "第一展廳／距離",
    color: "blue",
    short: "從地球、太陽系一路放大到銀河系與可觀測宇宙。",
    explanation: "天文學常使用天文單位、光年等尺度來描述距離。光年是光在一年中走過的距離，不是時間單位；當我們看向遙遠天體，也等於看見它很久以前的樣子。",
    lifeConnection: "地圖上的一公里與從台灣到外地的距離需要不同單位；宇宙更需要用適合的尺，才能比較行星、恆星與星系之間的遠近。",
    mission: "用一張紙畫出「人、地球、太陽系、銀河系」四層尺度，並在每一層寫下一個你已知的天體。",
    keyIdeas: ["光年是距離單位", "看得越遠通常也是看得越久以前", "尺度改變會改變我們描述問題的方式"],
    question: "如果某顆星距離我們一百光年，我們今天看到的是它現在的樣子嗎？",
    sourceLabel: "NASA／Universe basics",
    sourceUrl: "https://science.nasa.gov/universe/",
  },
  {
    key: "solar-system",
    name: "太陽系",
    english: "SOLAR SYSTEM",
    eyebrow: "第二展廳／家園",
    color: "amber",
    short: "認識太陽、八大行星、矮行星、衛星、小行星與彗星。",
    explanation: "太陽系以太陽為中心，包含八大行星、矮行星、數百個衛星，以及許多小行星和彗星。行星的大小、成分、大氣與表面環境差異很大，不能只用『離太陽遠近』一個條件解釋所有現象。",
    lifeConnection: "地球適合生命與液態水、大氣、溫度和磁場等條件有關；了解其他行星，也能幫助我們珍惜地球的環境。",
    mission: "挑一個行星，列出它與地球的兩個相同點和兩個不同點，並說明你使用的資料來源。",
    keyIdeas: ["太陽系有八大行星", "行星環境差異很大", "比較需要先選定共同標準"],
    question: "為什麼『離太陽最近』不一定代表『表面最熱』？你還需要考慮哪些因素？",
    sourceLabel: "NASA／Solar System Exploration",
    sourceUrl: "https://science.nasa.gov/solar-system/",
  },
  {
    key: "earth-moon",
    name: "地球與月球",
    english: "EARTH & MOON",
    eyebrow: "第三展廳／潮汐",
    color: "teal",
    short: "從月相、日月食到潮汐，觀察地球與鄰近天體的互動。",
    explanation: "月球本身不發光，我們看到的月光是反射的太陽光；月相來自太陽、地球與月球相對位置的改變。日食與月食則需要三者排列在特定幾何關係，並不是每個月都會發生。",
    lifeConnection: "觀察月相可以連結日曆、潮汐與夜間活動；把每天看到的形狀記錄下來，比一次背誦名稱更容易發現規律。",
    mission: "連續七天在同一時段記錄月亮的方向、亮面形狀與高度，最後畫出變化趨勢。",
    keyIdeas: ["月亮反射太陽光", "月相是相對位置造成的視覺變化", "規律需要持續觀察才能被看見"],
    question: "為什麼滿月時月亮看起來最亮，卻不代表月球自己正在發光？",
    sourceLabel: "NASA／Moon and Earth",
    sourceUrl: "https://science.nasa.gov/moon/",
  },
  {
    key: "stars",
    name: "恆星生命",
    english: "STELLAR LIFECYCLES",
    eyebrow: "第四展廳／光譜",
    color: "coral",
    short: "從星雲、核融合到紅巨星、白矮星與超新星，追蹤恆星的一生。",
    explanation: "恆星以核心的核融合產生能量。質量不同的恆星，生命歷程與最後狀態也不同；有些會成為白矮星，有些大質量恆星在劇烈爆發後留下中子星或黑洞。恆星光譜還能透露溫度與成分線索。",
    lifeConnection: "太陽提供地球大部分光和熱；我們生活中的碳、氧、鐵等元素，也與恆星內部或恆星死亡時的劇烈事件有關。",
    mission: "比較兩張不同顏色的星體圖片，提出『顏色可能代表什麼』的假設，再找資料驗證。",
    keyIdeas: ["核融合提供恆星能量", "恆星質量影響生命終點", "光譜是研究遙遠天體的重要工具"],
    question: "為什麼觀察恆星顏色可以幫助天文學家推測它的表面溫度？",
    sourceLabel: "NASA／Stars",
    sourceUrl: "https://science.nasa.gov/universe/stars/",
  },
  {
    key: "galaxies-black-holes",
    name: "星系與黑洞",
    english: "GALAXIES & BLACK HOLES",
    eyebrow: "第五展廳／重力",
    color: "violet",
    short: "認識銀河系、星系中心與黑洞如何透過周邊效應被發現。",
    explanation: "星系是由恆星、氣體、塵埃與暗物質等組成的巨大系統。黑洞不是宇宙吸塵器，而是極高密度天體；它本身不發光，科學家會觀察附近恆星運動、吸積盤的高能輻射、重力透鏡與重力波來研究它。",
    lifeConnection: "看不見的事物不代表不存在；在生活中，我們也常透過影子、聲音、腳印或測量結果推斷看不見的原因。",
    mission: "設計一個『只看周邊線索』的推理題：用三種觀測證據說明某個看不見的天體可能存在。",
    keyIdeas: ["黑洞不是蟲洞", "間接證據可以支持科學推論", "重力會影響光與周圍物質"],
    question: "如果黑洞不發光，天文學家可以從哪些周邊現象找到它？",
    sourceLabel: "NASA／Black Hole Basics；ESA／Black holes",
    sourceUrl: "https://science.nasa.gov/universe/black-holes/",
  },
  {
    key: "skywatching",
    name: "觀星實驗室",
    english: "SKYWATCHING LAB",
    eyebrow: "第六展廳／觀測",
    color: "cyan",
    short: "學習如何用肉眼、星圖與簡單工具進行安全的夜空觀察。",
    explanation: "天文觀測不一定需要大型望遠鏡。先確認日期、時間、方位與天氣，再用星圖尋找容易辨認的亮星或星座。觀測紀錄要包含時間、地點、方向、天氣與看到的現象，這些欄位能讓別人重複檢查你的觀察。",
    lifeConnection: "像做自然觀察或實驗一樣，固定條件、留下紀錄、分辨看見與推測，會讓觀察更可靠。",
    mission: "在不直視太陽的前提下，完成一次夜間觀測紀錄；若天候不佳，也可以使用天文館提供的星圖模擬。",
    keyIdeas: ["觀測要記錄條件", "星圖是導航工具不是答案本身", "安全比追求罕見現象更重要"],
    question: "為什麼同一顆星在不同時間或季節，出現在天空的位置可能不同？",
    sourceLabel: "NASA／Skywatching",
    sourceUrl: "https://science.nasa.gov/solar-system/skywatching/",
  },
  {
    key: "space-exploration",
    name: "太空探索",
    english: "SPACE EXPLORATION",
    eyebrow: "第七展廳／任務",
    color: "orange",
    short: "從火箭、探測器到機器人任務，理解人類如何把問題帶到太空。",
    explanation: "太空任務通常從明確問題開始，再設計儀器、路徑、能源、通訊與風險備案。探測器不只是『去拍照』，還可能測量成分、磁場、地震、輻射或地表環境，讓科學家比較不同世界。",
    lifeConnection: "一次太空任務需要工程、數學、物理、程式、溝通與團隊合作；這與完成大型專題或社區問題解決很相似。",
    mission: "為一個月球或火星任務選出三項最重要儀器，說明每項儀器要回答什麼問題。",
    keyIdeas: ["任務由問題驅動", "儀器與資料要配合目標", "太空探索是跨領域合作"],
    question: "如果只能帶三種儀器去另一顆星球，你會如何在科學價值、重量與能源之間取捨？",
    sourceLabel: "NASA／Solar System Exploration missions",
    sourceUrl: "https://science.nasa.gov/solar-system/",
  },
  {
    key: "life-in-universe",
    name: "宇宙中的生命",
    english: "LIFE IN THE UNIVERSE",
    eyebrow: "第八展廳／想像",
    color: "green",
    short: "用證據思考生命條件、系外行星與『我們是否孤單』的問題。",
    explanation: "尋找宇宙生命需要先定義可觀測線索，例如液態水、適合的能量來源、化學元素或大氣特徵。『可能適合生命』不等於『已經發現生命』；科學推論必須區分證據、假設與想像。",
    lifeConnection: "面對網路上的驚人標題，先問『證據是什麼？有沒有其他解釋？』，這種查證習慣也能用在日常資訊判讀。",
    mission: "設計一張『生命條件檢查表』，並為每一項標示已知證據、未知資訊或需要進一步觀測的部分。",
    keyIdeas: ["宜居不等於已發現生命", "科學需要可檢驗的線索", "想像力要和證據一起前進"],
    question: "如果一顆行星有水，是否就能直接證明那裡有生命？還缺少哪些證據？",
    sourceLabel: "NASA／Exoplanets and Astrobiology",
    sourceUrl: "https://science.nasa.gov/exoplanets/",
  },
];

export const getAstronomyExhibit = (key: string) => ASTRONOMY_EXHIBITS.find((item) => item.key === key);

export const ASTRONOMY_QUIZ_ROUND_SIZE = 8;

/** 天文館獨立題庫：不引用 12 年國教通用題庫或休閒觀測題庫。 */
export const ASTRONOMY_QUIZ_QUESTIONS: AstronomyQuizQuestion[] = [
  { id: "astro-scale-lightyear", exhibitKey: "cosmic-scale", topic: "宇宙尺度", prompt: "「光年」主要用來表示什麼？", options: ["時間長度", "距離", "恆星亮度", "行星大小"], answer: 1, explanation: "光年是光在真空中一年所走過的距離，因此是距離單位。" },
  { id: "astro-scale-lookback", exhibitKey: "cosmic-scale", topic: "宇宙尺度", prompt: "我們看見距離 50 光年的恆星時，看到的是它大約何時發出的光？", options: ["50 秒前", "50 天前", "50 年前", "現在同時發出"], answer: 2, explanation: "光需要時間傳遞；距離約 50 光年，代表光約走了 50 年才抵達地球。" },
  { id: "astro-scale-units", exhibitKey: "cosmic-scale", topic: "宇宙尺度", prompt: "比較地球到太陽的距離時，最適合優先使用哪種尺度概念？", options: ["天文單位", "公分", "海里", "攝氏度"], answer: 0, explanation: "天文單位以地球到太陽的平均距離為基準，適合描述太陽系內的距離。" },
  { id: "astro-solar-eight", exhibitKey: "solar-system", topic: "太陽系", prompt: "現今太陽系被正式分類為行星的數量是？", options: ["7 顆", "8 顆", "9 顆", "12 顆"], answer: 1, explanation: "太陽系有八大行星；冥王星目前分類為矮行星。" },
  { id: "astro-solar-center", exhibitKey: "solar-system", topic: "太陽系", prompt: "太陽系中的行星主要繞著哪一個天體運行？", options: ["月球", "地球", "太陽", "銀河系中心"], answer: 2, explanation: "太陽擁有太陽系中絕大部分的質量，因此行星主要繞太陽公轉。" },
  { id: "astro-solar-venus", exhibitKey: "solar-system", topic: "太陽系", prompt: "金星比水星離太陽遠，表面卻通常更熱，最重要的原因是？", options: ["金星沒有大氣", "金星的大氣強烈保溫", "金星自轉更快", "金星的月球更多"], answer: 1, explanation: "金星濃厚的大氣造成強烈溫室效應，使熱量不容易散失。" },
  { id: "astro-moon-reflect", exhibitKey: "earth-moon", topic: "地月系統", prompt: "夜空中的月光主要來自哪裡？", options: ["月球自己發光", "月球反射太陽光", "地球反射月球光", "星星照亮月球"], answer: 1, explanation: "月球本身不會像太陽一樣發光；我們看到的是它反射的太陽光。" },
  { id: "astro-moon-phase", exhibitKey: "earth-moon", topic: "地月系統", prompt: "月相改變最主要是因為？", options: ["月球形狀每週改變", "雲遮住月球", "日、地、月相對位置改變", "月球離地球忽遠忽近"], answer: 2, explanation: "月相是我們從地球看見月球被太陽照亮部分的角度改變所致。" },
  { id: "astro-moon-eclipse", exhibitKey: "earth-moon", topic: "地月系統", prompt: "為什麼日食不會每個新月都發生？", options: ["太陽每天消失", "月球軌道與地球公轉面有傾角", "地球沒有影子", "新月沒有月球"], answer: 1, explanation: "月球軌道略有傾斜，多數新月時三者並不會剛好排成一直線。" },
  { id: "astro-stars-energy", exhibitKey: "stars", topic: "恆星生命", prompt: "像太陽這樣的恆星，主要藉由什麼產生能量？", options: ["燃燒木材", "核心核融合", "反射月光", "吸收海水"], answer: 1, explanation: "恆星核心的核融合把較輕的原子核結合，釋放能量。" },
  { id: "astro-stars-color", exhibitKey: "stars", topic: "恆星生命", prompt: "天文學家觀察恆星顏色，常可推測它的哪項性質？", options: ["表面溫度", "住了多少人", "是否有海洋", "距離地球的公路長度"], answer: 0, explanation: "不同表面溫度的恆星發出的光譜不同，顏色能提供溫度線索。" },
  { id: "astro-stars-mass", exhibitKey: "stars", topic: "恆星生命", prompt: "恆星的初始質量會顯著影響什麼？", options: ["生命歷程與最終狀態", "是否繞地球轉", "月相名稱", "白天長度"], answer: 0, explanation: "質量影響恆星消耗燃料的速率及後續可能成為白矮星、中子星或黑洞等結果。" },
  { id: "astro-galaxy-system", exhibitKey: "galaxies-black-holes", topic: "星系與黑洞", prompt: "星系通常是由哪些成分組成的巨大系統？", options: ["只有一顆行星", "恆星、氣體與塵埃等", "只有海水", "只有黑洞"], answer: 1, explanation: "星系包含大量恆星，以及氣體、塵埃與其他物質所構成的系統。" },
  { id: "astro-blackhole-evidence", exhibitKey: "galaxies-black-holes", topic: "星系與黑洞", prompt: "黑洞本身不發光時，科學家常如何研究它？", options: ["看附近天體運動與高能輻射", "直接用肉眼看黑洞表面", "只靠猜測", "量月球直徑"], answer: 0, explanation: "黑洞會影響周邊物質和光；這些間接證據可協助科學家推論其存在與特性。" },
  { id: "astro-blackhole-wormhole", exhibitKey: "galaxies-black-holes", topic: "星系與黑洞", prompt: "下列哪一項敘述較正確？", options: ["黑洞等於蟲洞", "黑洞是宇宙吸塵器", "黑洞是極高密度天體，並不等同蟲洞", "所有星系中心都沒有重力"], answer: 2, explanation: "黑洞與蟲洞是不同概念；黑洞是由重力造成的極端天體現象。" },
  { id: "astro-watch-record", exhibitKey: "skywatching", topic: "天文觀測", prompt: "一筆可靠的夜空觀測紀錄最應包含哪一組資訊？", options: ["時間、地點、方向與天氣", "只寫「很好看」", "只寫星座名字", "只記錄手機電量"], answer: 0, explanation: "記錄觀測條件有助於自己回顧，也讓其他人能檢查或重複觀察。" },
  { id: "astro-watch-safe", exhibitKey: "skywatching", topic: "天文觀測", prompt: "進行天文觀測時，哪一項安全做法正確？", options: ["用望遠鏡直接看太陽", "不使用適當濾鏡時絕不直視太陽", "在馬路中央架設望遠鏡", "為了清楚而關掉所有照明"], answer: 1, explanation: "直視太陽可能傷害眼睛；觀察太陽必須使用專業且正確的安全設備。" },
  { id: "astro-watch-seasons", exhibitKey: "skywatching", topic: "天文觀測", prompt: "同一顆星在不同季節出現在天空的位置不同，主要與什麼有關？", options: ["地球繞太陽公轉", "星星每天搬家", "月球停止自轉", "雲朵改變星星位置"], answer: 0, explanation: "地球繞太陽公轉使夜晚面向宇宙的方向隨季節改變。" },
  { id: "astro-space-instruments", exhibitKey: "space-exploration", topic: "太空探索", prompt: "設計太空探測任務時，第一個應該先釐清的是？", options: ["探測器顏色", "想回答的科學問題", "發射現場的音樂", "任務徽章圖案"], answer: 1, explanation: "任務由明確問題驅動，再依問題決定所需的儀器、路徑與資料。" },
  { id: "astro-space-probe", exhibitKey: "space-exploration", topic: "太空探索", prompt: "探測器除了拍照以外，也可能用來做什麼？", options: ["測量磁場或成分", "改變行星軌道", "讓星星熄滅", "停止地球自轉"], answer: 0, explanation: "探測器可攜帶多種儀器，測量磁場、輻射、化學成分及地表或大氣等資料。" },
  { id: "astro-space-team", exhibitKey: "space-exploration", topic: "太空探索", prompt: "太空任務通常需要哪些能力合作？", options: ["只有繪畫", "工程、科學、數學與溝通等", "只有背誦行星名稱", "只靠單一人完成所有工作"], answer: 1, explanation: "太空探索是跨領域合作，需要不同專長共同規畫、執行與解讀資料。" },
  { id: "astro-life-evidence", exhibitKey: "life-in-universe", topic: "宇宙中的生命", prompt: "發現一顆有水的系外行星時，最合理的結論是？", options: ["已直接證明有生命", "它一定和地球一樣", "它值得進一步研究生命條件", "不需要任何其他資料"], answer: 2, explanation: "水是重要線索，但不足以單獨證明生命存在；仍需更多可檢驗證據。" },
  { id: "astro-life-habitable", exhibitKey: "life-in-universe", topic: "宇宙中的生命", prompt: "「可能適合生命」與「已發現生命」最大的差異是？", options: ["沒有差異", "前者是條件推測，後者需要直接或強力證據", "前者只適用地球", "後者不需要觀測"], answer: 1, explanation: "科學必須區分可居住條件的推測與生命已被觀測到的證據。" },
  { id: "astro-life-check", exhibitKey: "life-in-universe", topic: "宇宙中的生命", prompt: "評估某個天體的生命可能性時，最好的思考方式是？", options: ["只看一張圖片就下結論", "區分已知證據、未知資訊與可檢驗假設", "先相信最驚人的標題", "忽略所有測量資料"], answer: 1, explanation: "把證據、未知與假設分開，能讓我們保留想像力，也維持科學推理的嚴謹。" },
  { id: "astro-planet-order", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "由太陽向外數，地球是第幾顆行星？", options: ["第二顆", "第三顆", "第四顆", "第五顆"], answer: 1, explanation: "地球位於水星、金星之後，是由太陽向外的第三顆行星。" },
  { id: "astro-planet-terrestrial", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "下列哪一組都是岩質行星？", options: ["水星、金星、地球、火星", "木星、土星、天王星、海王星", "地球、木星、土星、海王星", "金星、火星、天王星、海王星"], answer: 0, explanation: "內側的水星、金星、地球與火星表面主要由岩石和金屬構成。" },
  { id: "astro-planet-largest", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "太陽系中體積最大的行星是？", options: ["地球", "土星", "木星", "海王星"], answer: 2, explanation: "木星是太陽系體積最大的行星，屬於巨行星。" },
  { id: "astro-planet-giants", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "木星和土星通常會被歸為哪一類行星？", options: ["岩質行星", "氣體巨行星", "矮行星", "衛星"], answer: 1, explanation: "木星與土星以氫、氦等物質為主，通常歸為氣體巨行星。" },
  { id: "astro-planet-ice-giants", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "天王星與海王星常被稱為「冰巨星」，主要是在比較它們與哪一類行星的成分差異？", options: ["水星與金星", "木星與土星", "地球與火星", "月球與冥王星"], answer: 1, explanation: "天王星、海王星與木星、土星同為外側巨行星，但含有較多水、氨與甲烷等揮發性成分。" },
  { id: "astro-planet-saturn-rings", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "土星環主要由什麼組成？", options: ["整塊固體金屬圓盤", "許多冰與岩石碎屑", "燃燒的氣體火焰", "一條巨大的彩虹"], answer: 1, explanation: "土星環由大量大小不一的冰粒與岩石碎屑共同繞行土星。" },
  { id: "astro-planet-moons", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "下列哪兩顆行星沒有天然衛星？", options: ["水星與金星", "地球與火星", "木星與土星", "天王星與海王星"], answer: 0, explanation: "水星與金星目前沒有已知的天然衛星。" },
  { id: "astro-planet-mars", exhibitKey: "solar-system", tier: "planet", topic: "行星入門", prompt: "火星表面常呈紅色，主要與哪種物質有關？", options: ["鐵氧化物造成的紅褐色塵土", "紅色海洋的反射", "火星內部的熔岩直接照亮地表", "外星城市的燈光"], answer: 0, explanation: "火星表面的鐵氧化物塵土帶有紅褐色，因此從遠方看常被稱為紅色星球。" },
  { id: "astro-galaxy-milkyway", exhibitKey: "galaxies-black-holes", tier: "galaxy", topic: "星系探索", prompt: "太陽系位於哪一個星系？", options: ["仙女座星系", "銀河系", "大麥哲倫星系", "太陽系不在任何星系"], answer: 1, explanation: "太陽系是銀河系中的一小部分，與大量恆星共同繞著銀河系中心運行。" },
  { id: "astro-galaxy-spiral", exhibitKey: "galaxies-black-holes", tier: "galaxy", topic: "星系探索", prompt: "銀河系常被歸類為哪一種主要形態？", options: ["棒旋星系", "只有一顆星的星系", "行星環", "彗星雲"], answer: 0, explanation: "銀河系具有中央棒狀結構與旋臂，常被分類為棒旋星系。" },
  { id: "astro-galaxy-andromeda", exhibitKey: "galaxies-black-holes", tier: "galaxy", topic: "星系探索", prompt: "仙女座星系最適合被描述為什麼？", options: ["地球的衛星", "鄰近的大型星系", "太陽系中的矮行星", "一顆單獨的恆星"], answer: 1, explanation: "仙女座星系是鄰近銀河系的一個大型星系，並不是太陽系內的天體。" },
  { id: "astro-galaxy-not-solar", exhibitKey: "galaxies-black-holes", tier: "galaxy", topic: "星系探索", prompt: "星系和太陽系最大的尺度差異是什麼？", options: ["星系包含大量恆星系統，太陽系以一顆恆星為中心", "星系只包含一顆行星", "兩者完全相同", "太陽系比所有星系都大"], answer: 0, explanation: "太陽系以太陽為中心；星系則由大量恆星、氣體與塵埃組成。" },
  { id: "astro-galaxy-lookback", exhibitKey: "cosmic-scale", tier: "galaxy", topic: "星系探索", prompt: "為什麼觀測遙遠星系像是在看宇宙的過去？", options: ["望遠鏡會倒轉時間", "星系只在過去存在", "光需要很長時間才能抵達地球", "地球每天會靠近所有星系"], answer: 2, explanation: "遙遠天體的光需長時間傳到地球，因此我們看到的是它發出那束光時的樣子。" },
  { id: "astro-galaxy-starbirth", exhibitKey: "stars", tier: "galaxy", topic: "星系探索", prompt: "星系中的氣體與塵埃雲為何值得研究？", options: ["它們是恆星形成的重要原料", "它們會把所有恆星關掉", "它們只存在地球上", "它們沒有任何物質"], answer: 0, explanation: "部分氣體與塵埃雲會在重力作用下收縮，形成新的恆星與行星系統。" },
  { id: "astro-galaxy-evidence", exhibitKey: "galaxies-black-holes", tier: "galaxy", topic: "星系探索", prompt: "研究遙遠星系時，最符合科學方法的做法是？", options: ["只憑一張漂亮照片下結論", "結合影像、光譜與量測資料提出可檢驗解釋", "忽略所有誤差", "先決定答案再找資料"], answer: 1, explanation: "天文學家會整合不同觀測資料，並持續檢驗可能的解釋。" },
  { id: "astro-galaxy-redshift", exhibitKey: "cosmic-scale", tier: "galaxy", topic: "星系探索", prompt: "當天文學家比較星系光譜的位移時，主要想取得什麼線索？", options: ["星系的顏色喜好", "天體運動與宇宙尺度的資訊", "行星上的天氣預報", "望遠鏡的重量"], answer: 1, explanation: "光譜的位移可以提供天體運動等線索，是研究遙遠宇宙的重要方法。" },
  { id: "astro-mission-question", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "規畫太空任務時，最應先確定哪一件事？", options: ["要回答的科學問題", "太空船外殼的顏色", "宣傳海報風格", "觀眾席位置"], answer: 0, explanation: "科學問題決定任務需要的儀器、路徑、資料與風險規畫。" },
  { id: "astro-mission-voyager", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "航海家一號與二號任務最初的主要探索目標是？", options: ["外側巨行星系統", "地球海底", "銀河系中心的人造城市", "月球背面的農場"], answer: 0, explanation: "航海家任務曾近距離探測木星、土星以及其他外側行星系統，提供重要資料。" },
  { id: "astro-mission-webb", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "韋伯太空望遠鏡特別擅長觀測哪一類光？", options: ["紅外線", "只能看紅色可見光", "聲波", "海浪"], answer: 0, explanation: "韋伯以紅外線觀測為主，有助於研究遙遠宇宙、星際塵埃與行星大氣等。" },
  { id: "astro-mission-hubble", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "哈伯太空望遠鏡和地面望遠鏡相比，一項重要優勢是？", options: ["位於地球大氣層上方，較少受大氣擾動影響", "不需要任何資料分析", "能改變恆星運動", "只能看地球"], answer: 0, explanation: "哈伯在近地軌道運行，可避開部分地球大氣造成的觀測干擾。" },
  { id: "astro-mission-orbiter", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "如果任務需要長期反覆拍攝一顆行星的表面，哪種方式最合適？", options: ["讓探測器繞行目標天體", "只做一次快速掠過", "把資料留在地面不傳回", "停止所有量測"], answer: 0, explanation: "環繞探測器可持續繞行目標天體，進行長時間、重複的量測與影像觀測。" },
  { id: "astro-mission-data", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "太空探測器把科學資料傳回地球，主要依靠什麼？", options: ["無線電通訊", "把紙條丟回大氣層", "改變月相", "用肉眼傳訊"], answer: 0, explanation: "探測器會利用天線與無線電通訊，把影像與量測資料傳送回地球的接收站。" },
  { id: "astro-mission-instruments", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "若任務目標是分析火星岩石成分，最合理的設計原則是？", options: ["選擇能量測化學成分的儀器", "只攜帶裝飾燈", "不需要任何感測器", "只記錄任務口號"], answer: 0, explanation: "儀器必須對應科學問題；研究岩石成分需要能取得成分資料的感測與分析工具。" },
  { id: "astro-mission-team", exhibitKey: "space-exploration", tier: "mission", topic: "太空任務", prompt: "任務資料回傳後，最合適的下一步是？", options: ["由不同專長團隊檢查與解讀資料", "立刻刪除所有原始資料", "只依一人直覺宣布結論", "停止比對其他觀測"], answer: 0, explanation: "工程、科學與資料分析人員會共同檢查資料品質並解讀其科學意義。" },
  { id: "astro-tools-optical", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "一般光學望遠鏡最基本的功能是？", options: ["收集更多來自天體的光", "製造新的恆星", "改變行星大小", "讓白天變成夜晚"], answer: 0, explanation: "望遠鏡以鏡片或反射鏡收集更多光，讓暗淡或細小的天體更容易被觀測。" },
  { id: "astro-tools-reflector", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "反射式望遠鏡主要使用什麼來聚集光線？", options: ["鏡面", "聲音放大器", "磁鐵", "溫度計"], answer: 0, explanation: "反射式望遠鏡以鏡面反射並聚集光線，再將影像導向觀測或記錄設備。" },
  { id: "astro-tools-radio", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "電波望遠鏡主要接收哪一類訊號？", options: ["來自天體的無線電波", "海水的味道", "行星的固體表面", "只有人類語言"], answer: 0, explanation: "不同天體會在不同波段發出訊號；電波望遠鏡專門接收無線電波。" },
  { id: "astro-tools-spectrum", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "光譜儀把天體的光分開後，最能協助研究什麼？", options: ["成分、溫度或運動等線索", "天體的個性", "星座名稱的字數", "地球上的交通狀況"], answer: 0, explanation: "光譜含有天體成分、溫度與運動等資訊，是天文研究的重要證據。" },
  { id: "astro-tools-tripod", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "使用長時間曝光拍攝星空時，三腳架最主要的作用是？", options: ["穩定相機、減少晃動", "放大月球", "製造星光", "取代鏡頭"], answer: 0, explanation: "三腳架可降低手持造成的晃動，讓長時間曝光的影像較清楚。" },
  { id: "astro-tools-wavelength", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "為什麼天文學家常使用不同波段的望遠鏡共同觀測？", options: ["不同波段能呈現天體不同的物理線索", "一種望遠鏡永遠不能工作", "為了讓照片顏色更多", "因為可見光不存在"], answer: 0, explanation: "可見光、紅外線、電波等不同波段能揭露不同溫度、物質或能量過程。" },
  { id: "astro-tools-solar-safe", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "觀察太陽時，最安全的原則是？", options: ["使用合格太陽濾鏡並遵循安全指引", "用雙筒望遠鏡直接觀看", "用相機鏡頭直接對眼睛", "只要天空不刺眼就可以直視"], answer: 0, explanation: "直視太陽可能造成嚴重眼睛傷害；必須使用專業、合格且正確安裝的太陽觀測設備。" },
  { id: "astro-tools-record", exhibitKey: "skywatching", tier: "tools", topic: "觀測工具", prompt: "一份可重複檢查的天文觀測紀錄，除了天體名稱外還應包含？", options: ["時間、地點、方向與天氣", "觀測者最喜歡的顏色", "只有一個表情符號", "任何條件都不必記錄"], answer: 0, explanation: "記錄時間、地點、方向與天氣，有助於比對條件、重複觀測和判斷結果。" },
];

export const getAstronomyQuizQuestionsForTier = (tier: AstronomyQuizTier) => ASTRONOMY_QUIZ_QUESTIONS.filter((question) => getAstronomyQuestionTier(question) === tier);

export function createAstronomyQuizDeck(
  tierOrRoundSize: AstronomyQuizTier | number = ASTRONOMY_QUIZ_ROUND_SIZE,
  roundSizeOrRandom: number | (() => number) = ASTRONOMY_QUIZ_ROUND_SIZE,
  explicitRandom = Math.random,
) {
  const tier = typeof tierOrRoundSize === "string" ? tierOrRoundSize : undefined;
  const roundSize = typeof tierOrRoundSize === "number" ? tierOrRoundSize : typeof roundSizeOrRandom === "number" ? roundSizeOrRandom : ASTRONOMY_QUIZ_ROUND_SIZE;
  const random = typeof roundSizeOrRandom === "function" ? roundSizeOrRandom : explicitRandom;
  const source = tier ? getAstronomyQuizQuestionsForTier(tier) : ASTRONOMY_QUIZ_QUESTIONS;

  return [...source]
    .sort(() => random() - 0.5)
    .slice(0, Math.min(roundSize, source.length));
}
