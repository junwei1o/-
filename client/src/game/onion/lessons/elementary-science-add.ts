/**
 * 國小自然補充課程（洋蔥學院 200 堂擴充計畫：一、國小新增 50 堂／自然 12 堂）。
 *
 * 對照 docs/onion-200-plan.md 的「自然 12 堂」工作表，依 id、年級、核心概念與圖解建議撰寫；
 * 每堂 9 幀分鏡（step 步驟標籤、caption、action、prop、duration，至少 3 幀含 ask）＋
 * 6 題闖關（含 2 級提示與詳解）＋ 4 條 takeaways，資料形狀與現有課程一致。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 1. 磁鐵的奧祕（三下） ===================== */
const EL_SCI_MAGNET: OnionLesson = {
  id: "el-sci-magnet",
  title: "磁鐵的奧祕：同極相斥、異極相吸",
  subject: "自然",
  topic: "磁鐵",
  grade: "三下",
  stages: ["國小"],
  desc: "洋蔥帶你用磁鐵玩遊戲，搞懂同極相斥、異極相吸，還有磁力隔空作用。",
  takeaways: ["磁鐵有 N 極和 S 極兩個磁極", "同極相斥、異極相吸", "磁力不必接觸就能作用，主要吸鐵、鎳、鈷", "磁力有一定作用範圍，太遠就吸不到；磁鐵切開後每段仍同時有 N、S 兩極"],
  frames: [
    { id: 1, step: "步驟 1：認識磁鐵兩端", caption: "嗨！磁鐵有兩端叫磁極，分別是 N 極和 S 極唷！", action: "wave", prop: { kind: "text", text: "N 極 ↔ S 極", sub: "磁鐵的兩個磁極", tone: "ok" }, duration: 3000 },
    { id: 2, step: "步驟 2：看同極相斥", caption: "把兩個 N 極靠在一起，它們會互相推開，叫做同極相斥。", action: "point", prop: { kind: "text", text: "N 極 對 N 極：推開！", sub: "相同的極會互相推開", tone: "warn" }, duration: 3400 },
    { id: 3, step: "步驟 3：看異極相吸", caption: "換成 N 極對 S 極，就會吸在一起，這叫異極相吸！", ask: { prompt: "N 極和 S 極靠近，會發生什麼？", options: ["互相吸引", "互相推開", "沒反應", "一起變熱"], answer: 0, hint: "不同的極（N 和 S）會吸在一起，叫做異極相吸。" }, action: "think", prop: { kind: "text", text: "N 極 對 S 極：吸住！", sub: "不同的極會互相吸引", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：磁力隔空作用", caption: "有趣的是，不用碰到，隔一段距離磁鐵就能把迴紋針吸過來！", action: "point", prop: { kind: "text", text: "隔空吸住迴紋針", sub: "磁力能穿過空氣", tone: "ok" }, duration: 3400 },
    { id: 5, step: "步驟 5：磁力有作用範圍", caption: "不過磁力不是無限遠——迴紋針放太遠，磁鐵就吸不到它了喔！", ask: { prompt: "把迴紋針拿得離磁鐵很遠，會怎樣？", options: ["永遠都吸得到", "磁力太弱吸不到", "越遠吸力越大", "迴紋針會發光"], answer: 1, hint: "磁力有作用範圍，距離太遠就吸不到了。" }, action: "point", prop: { kind: "text", text: "磁力有範圍：太遠吸不到", sub: "靠近才吸得住", tone: "warn" }, duration: 3400 },
    { id: 6, step: "步驟 6：分辨磁鐵與鐵", caption: "不是所有金屬都會吸喔——銅和鋁就不會被磁鐵吸住。", ask: { prompt: "下列哪一種不會被磁鐵吸住？", options: ["鋁罐", "鐵釘", "迴紋針", "鐵尺"], answer: 0, hint: "磁鐵主要吸鐵、鎳、鈷；鋁和銅不會被吸住。" }, action: "jump", prop: { kind: "text", text: "會吸：鐵、鎳、鈷", sub: "不會吸：鋁、銅、金", tone: "ok" }, duration: 3600 },
    { id: 7, step: "步驟 7：生活裡的磁鐵", caption: "冰箱貼、教室門的吸扣、指南針裡，都有磁鐵在幫忙！", action: "walk", prop: { kind: "text", text: "生活應用：冰箱貼、指南針", sub: "磁鐵就在身邊", tone: "ok" }, duration: 3400 },
    { id: 8, step: "步驟 8：易錯點提醒", caption: "小提醒：把磁鐵切成兩段，每一段還是同時有 N 極和 S 極，磁極分不開喔！", action: "jump", prop: { kind: "text", text: "切開的磁鐵仍有兩極", sub: "N、S 極無法單獨存在", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "口訣：同極相斥、異極相吸，磁力還能隔空作用！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-sci-magnet-1", prompt: "磁鐵一共有幾個磁極？", options: ["1 個", "3 個", "2 個", "4 個"], answer: 2, hints: ["想想 N 極和 S 極", "磁鐵分 N 極和 S 極兩端"], explanation: "磁鐵有 N 極和 S 極兩個磁極，分別在兩端。" },
    { id: "el-sci-magnet-2", prompt: "把兩個 N 極靠在一起，會發生什麼？", options: ["吸在一起", "熔化成液體", "沒有變化", "互相推開"], answer: 3, hints: ["這個現象叫『同極相斥』", "相同的極會互相推開"], explanation: "相同的磁極（如 N 對 N）會互相推開，稱為同極相斥。" },
    { id: "el-sci-magnet-3", prompt: "N 極和 S 極靠近時，會怎麼樣？", options: ["吸在一起", "互相推開", "都變成 N 極", "完全沒反應"], answer: 0, hints: ["不同的極會互相吸引", "這叫異極相吸"], explanation: "不同的磁極（N 對 S）會互相吸引，稱為異極相吸。" },
    { id: "el-sci-magnet-4", prompt: "下列哪一種金屬不會被磁鐵吸住？", options: ["鐵釘", "鋁罐", "鎳幣", "迴紋針"], answer: 1, hints: ["磁鐵主要吸鐵、鎳、鈷", "鋁不是鐵系金屬"], explanation: "磁鐵主要吸引鐵、鎳、鈷；鋁和銅等金屬不會被吸住。" },
    { id: "el-sci-magnet-5", prompt: "指南針能指出南北方向，是因為地球像一個大什麼？", options: ["大電池", "大鏡子", "大磁鐵", "大喇叭"], answer: 2, hints: ["磁針會轉向南北", "地球本身具有磁性"], explanation: "地球本身像一個大磁鐵，使指南針的磁針指向南北方向。" },
    { id: "el-sci-magnet-6", prompt: "把一條長磁鐵從中間切成兩段，每一段會變成什麼？", options: ["只剩 N 極", "只剩 S 極", "兩段都沒有磁性了", "每段仍各有 N 極和 S 極"], answer: 3, hints: ["磁極不能單獨存在", "切開後各自還是完整的小磁鐵"], explanation: "磁鐵不論切多小，每一塊都同時有 N 極和 S 極，磁極無法單獨存在。" },
  ],
};

/* ===================== 2. 光與影子（四上） ===================== */
const EL_SCI_LIGHT_SHADOW: OnionLesson = {
  id: "el-sci-light-shadow",
  title: "光與影子：光直線前進形成影子",
  subject: "自然",
  topic: "光與影子",
  grade: "四上",
  stages: ["國小"],
  desc: "光為什麼直直走？不透明的東西怎麼變出影子？洋蔥一次講清楚。",
  takeaways: ["光沿直線前進，不會拐彎", "不透明的東西擋住光，後面形成影子", "透明的東西讓光穿過，影子很淡", "影子會隨光源位置移動；影子的存在正好證明光沿直線前進、不會轉彎"],
  frames: [
    { id: 1, step: "步驟 1：觀察影子", caption: "大太陽下你走過操場，地上總跟著一團黑黑的影子！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：光直線前進", caption: "光會沿著直直的線往前跑，這叫做「光直線前進」。", action: "point", prop: { kind: "text", text: "光 → 直直前進", sub: "光走直線，不會轉彎", tone: "ok" }, duration: 3200 },
    { id: 3, step: "步驟 3：被擋住就變暗", caption: "當不透明的東西擋在光前面，光過不去，後面就暗暗的。", action: "think", prop: { kind: "shape", shape: "rect", base: 6, height: 8, label: "擋光物" }, duration: 3400 },
    { id: 4, step: "步驟 4：影子位置會移動", caption: "早上、中午太陽位置不同，地上的影子也會跟著移動位置喔！", ask: { prompt: "太陽移動時，地上的影子會怎樣？", options: ["跟著移動位置", "固定不動", "忽然變成彩色", "完全消失"], answer: 0, hint: "光直線前進，光源動了，影子位置也跟著改變。" }, action: "point", prop: { kind: "text", text: "光源動→影子位置跟著動", sub: "影子會移動", tone: "ok" }, duration: 3400 },
    { id: 5, step: "步驟 5：影子怎麼形成", caption: "那團暗暗的區域，就是我們用眼睛看到的「影子」！", ask: { prompt: "影子是怎麼來的？", options: ["光憑空消失", "光被擋住", "眼睛閉起來", "太陽下山了"], answer: 1, hint: "不透明的東西擋住光，後面照不到光就成影子。" }, action: "think", prop: { kind: "shape", shape: "rect", base: 6, height: 8, label: "光被擋→影子" }, duration: 3600 },
    { id: 6, step: "步驟 6：透明不擋光", caption: "玻璃是透明的，光穿得過去，所以玻璃後面幾乎沒有影子。", ask: { prompt: "為什麼玻璃後面影子很淡？", options: ["玻璃透明，光穿得過", "玻璃會自己發光", "玻璃太重了", "玻璃是黑色的"], answer: 0, hint: "透明的東西讓光通過，所以影子不明顯。" }, action: "jump", prop: { kind: "text", text: "透明：光穿過，影子淡", sub: "不透明才會有清楚影子", tone: "ok" }, duration: 3600 },
    { id: 7, step: "步驟 7：生活裡的應用", caption: "電影院的布幕、古時候的日晷，都用了光直線前進的原理！", action: "walk", prop: { kind: "text", text: "日晷：用影子看時間", sub: "光直線前進的應用", tone: "ok" }, duration: 3400 },
    { id: 8, step: "步驟 8：深化一下", caption: "其實影子就是『光走直線』最好的證明——如果光會轉彎，影子就不會那麼清楚囉！", action: "jump", prop: { kind: "text", text: "影子＝光直線前進的證據", sub: "光不會繞過物體", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：光直直走，被擋住就變成影子！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-sci-light-shadow-1", prompt: "光在空氣中是怎麼前進的？", options: ["繞著圈圈", "隨便飄動", "沿著直線", "往回倒著走"], answer: 2, hints: ["光的路徑是直的", "光走直線，不會轉彎"], explanation: "光在均勻介質中沿直線前進，稱為光直線前進。" },
    { id: "el-sci-light-shadow-2", prompt: "地上的影子是怎麼形成的？", options: ["光整個消失", "眼睛壞掉了", "天氣變冷了", "光被東西擋住"], answer: 3, hints: ["不透明物體擋在光前面", "光過不去的地方就暗"], explanation: "不透明的物體擋住光，光照射不到的區域就形成影子。" },
    { id: "el-sci-light-shadow-3", prompt: "為什麼玻璃後面幾乎看不到影子？", options: ["玻璃透明讓光穿過", "玻璃是黑色的", "玻璃會吸光", "玻璃太薄了"], answer: 0, hints: ["透明的東西光穿得過去", "透明物不會擋住光"], explanation: "玻璃是透明的，光可以穿過，所以後面照樣有光，影子很淡。" },
    { id: "el-sci-light-shadow-4", prompt: "下列哪一樣擋住光會形成清楚的影子？", options: ["透明的玻璃", "不透明的石頭", "乾淨的水", "空氣"], answer: 1, hints: ["要選不透明的東西", "不透明才擋得住光"], explanation: "不透明的物體才會擋住光形成清楚影子；透明物與空氣讓光通過。" },
    { id: "el-sci-light-shadow-5", prompt: "古人用的日晷，是利用什麼來看時間的？", options: ["水的流動", "風的方向", "影子的位置", "溫度的高低"], answer: 2, hints: ["和光、影子有關", "太陽照出影子，影子會移動"], explanation: "日晷利用太陽照射物體所形成的影子位置變化來判讀時間，原理是光直線前進。" },
    { id: "el-sci-light-shadow-6", prompt: "中午和早上的影子比起來，通常中午影子會怎樣？", options: ["比較長", "變成彩色", "完全不見", "比較短"], answer: 3, hints: ["中午太陽高", "光從頭頂直下影子就短"], explanation: "中午太陽較高、光線接近垂直照下，影子比早上太陽斜射時來得短。" },
  ],
};

/* ===================== 3. 聲音的產生與傳播（四上） ===================== */
const EL_SCI_SOUND: OnionLesson = {
  id: "el-sci-sound",
  title: "聲音的產生與傳播：振動與介質",
  subject: "自然",
  topic: "聲音",
  grade: "四上",
  stages: ["國小"],
  desc: "拍手為什麼有聲音？洋蔥用振動和介質，帶你聽懂聲音的小祕密。",
  takeaways: ["物體振動會產生聲音", "聲音需要介質（空氣、水、固體）才能傳播", "真空沒有介質，聲音傳不出去", "在發聲體上撒紙碎等小物能把看不見的振動看見；關門窗阻隔空氣會讓聲音變小"],
  frames: [
    { id: 1, step: "步驟 1：聲音從哪來", caption: "你拍手、敲鼓會聽到聲音，到底是什麼在發出聲音呢？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：振動產生聲音", caption: "物體快速來回動叫做「振動」，聲音就是這樣被做出來的！", action: "point", prop: { kind: "text", text: "敲鼓 → 鼓面振動 → 聲音", sub: "振動產生聲音", tone: "ok" }, duration: 3200 },
    { id: 3, step: "步驟 3：看見振動", caption: "在鼓面撒一些紙碎，敲下去紙碎會跳起來——這就是我們看見的振動！", ask: { prompt: "敲鼓時鼓面上的紙碎跳起，說明了什麼？", options: ["鼓面在振動", "紙碎自己會跳", "鼓會吸東西", "風把它吹起"], answer: 0, hint: "物體來回振動才把紙碎彈起來。" }, action: "point", prop: { kind: "text", text: "撒紙碎→鼓面振動跳起", sub: "把振動『看見』", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：摸摸振動的物體", caption: "把手放在響的琴弦上，會感到它在抖，那就是振動。", ask: { prompt: "我們聽到的聲音是怎麼產生的？", options: ["空氣變熱", "物體振動", "光線照射", "水蒸發了"], answer: 1, hint: "物體快速來回動（振動）才會發出聲音。" }, action: "think", prop: { kind: "text", text: "摸琴弦 → 感覺抖動", sub: "振動就是來回抖動", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：聲音靠介質傳", caption: "聲音靠介質傳：空氣每秒 340、水 1500、鐵 5000 公尺，固體最快！", action: "jump", prop: { kind: "bars", items: [{ label: "空氣", value: 340 }, { label: "水", value: 1500 }, { label: "鐵", value: 5000 }], unit: "公尺/秒" }, duration: 3800 },
    { id: 6, step: "步驟 6：沒有介質聽不到", caption: "太空幾乎真空，沒有空氣幫忙傳，所以在太空喊叫誰也聽不到！", action: "walk", prop: { kind: "text", text: "太空：沒介質 → 聽不到", sub: "聲音需要介質", tone: "warn" }, duration: 3400 },
    { id: 7, step: "步驟 7：聲音傳播的過程", caption: "來回想：聲音從振動開始，靠介質送過去，最後才進到耳朵！", ask: { prompt: "聲音要傳出去，一定需要什麼？", options: ["介質（如空氣）", "完全的真空", "一片黑暗", "一塊磁鐵"], answer: 0, hint: "聲音需要空氣、水或固體等介質才能傳播。" }, action: "think", prop: { kind: "flow", steps: ["聲源振動", "介質傳送", "耳朵接收"], active: 1 }, duration: 3600 },
    { id: 8, step: "步驟 8：生活對照", caption: "關上窗門外面就變小聲，因為玻璃和牆擋住、削弱了空氣傳過來的聲音！", action: "walk", prop: { kind: "text", text: "關門窗→聲音變小", sub: "阻隔空氣就削弱傳聲", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：振動產生聲音，還要介質才能傳到耳朵！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-sci-sound-1", prompt: "我們聽到的聲音是怎麼產生的？", options: ["水蒸發", "光線照射", "物體振動", "空氣變冷"], answer: 2, hints: ["想想敲鼓時鼓面會抖", "快速來回動叫做振動"], explanation: "物體振動（快速來回運動）會推動周圍介質，因而產生聲音。" },
    { id: "el-sci-sound-2", prompt: "下列什麼地方聲音傳不出去？", options: ["水裡", "空氣中", "桌子裡", "真空（沒空氣）"], answer: 3, hints: ["需要有東西幫忙傳", "沒有介質就傳不了"], explanation: "真空沒有空氣等介質，聲音無法傳播，所以聽不到聲音。" },
    { id: "el-sci-sound-3", prompt: "聲音傳播的速度，下列哪個最快？", options: ["鐵（固體）", "空氣", "水", "三個一樣快"], answer: 0, hints: ["固體粒子靠得近，傳得快", "回想 340、1500、5000 的比較"], explanation: "聲音在固體中最快、液體次之、氣體最慢；鐵等固體傳聲比空氣快。" },
    { id: "el-sci-sound-4", prompt: "為什麼把耳朵貼在鐵軌上能更早聽到火車？", options: ["鐵軌會發光", "固體傳聲比空氣快", "火車比較大聲", "空氣會擋住聲音"], answer: 1, hints: ["比較固體和氣體的傳聲速度", "固體傳聲更快"], explanation: "固體（鐵軌）傳聲比空氣快，所以貼著鐵軌能更早聽到遠處火車的聲音。" },
    { id: "el-sci-sound-5", prompt: "在月球上（沒有空氣），兩個太空人靠說話能直接聽到嗎？", options: ["可以，聲音到處傳", "要看誰比較大聲", "不行，沒有空氣當介質", "可以，因為有重力"], answer: 2, hints: ["月球表面幾乎是真空", "聲音需要介質才能傳"], explanation: "月球表面沒有空氣這種介質，聲音無法直接在兩人之間傳播，必須靠無線電。" },
    { id: "el-sci-sound-6", prompt: "敲鑼後立刻用手按住鑼面，聲音為什麼馬上停了？", options: ["手把聲音吸走", "鑼變冷了", "耳朵忽然聽不到", "按住讓振動停止"], answer: 3, hints: ["聲音來自振動", "振動一停聲音就停"], explanation: "聲音由物體振動產生，按住鑼面使振動立刻停止，聲音也就隨之停止。" },
  ],
};

/* ===================== 4. 水的三態（三上） ===================== */
const EL_SCI_WATER_STATES: OnionLesson = {
  id: "el-sci-water-states",
  title: "水的三態：固態、液態、氣態",
  subject: "自然",
  topic: "水的三態",
  grade: "三上",
  stages: ["國小"],
  desc: "冰、水、水蒸氣到底是什麼？洋蔥用三態循環帶你看水的變身秀。",
  takeaways: ["固態（冰）、液態（水）、氣態（水蒸氣）是水的三種樣子", "加熱使水從固態→液態→氣態", "冷卻使水從氣態→液態→固態", "真正的水蒸氣透明看不見；燒開水看到的『白霧』是遇冷凝結的小水滴"],
  frames: [
    { id: 1, step: "步驟 1：水會變身", caption: "水不只一種樣子喔！它會變身成冰、水和看不見的水蒸氣。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：認識固態的冰", caption: "冷的時候，水結成硬硬的冰，這是固態的水。", action: "point", prop: { kind: "cycle", nodes: ["冰（固態）", "水（液態）", "水蒸氣（氣態）"], active: 0 }, duration: 3200 },
    { id: 3, step: "步驟 3：認識液態的水", caption: "平常喝的水會流動，這是液態，是我們最熟悉的水。", action: "think", prop: { kind: "cycle", nodes: ["冰（固態）", "水（液態）", "水蒸氣（氣態）"], active: 1 }, duration: 3200 },
    { id: 4, step: "步驟 4：生活中的三態", caption: "冰箱結凍的冰塊是固態、自來水是液態、煮開冒出的蒸氣就是氣態喔！", ask: { prompt: "冰箱裡結凍的冰塊，屬於水的哪一態？", options: ["固態", "液態", "氣態", "電態"], answer: 0, hint: "硬硬、有固定形狀的冰塊是固態。" }, action: "point", prop: { kind: "cycle", nodes: ["冰箱結冰", "自來水", "煮開的蒸氣"], active: 0 }, duration: 3600 },
    { id: 5, step: "步驟 5：加熱變氣態", caption: "加熱到滾，水變成看不見的水蒸氣飄走，這是氣態。", ask: { prompt: "水加熱變成看不見的氣體，叫做什麼？", options: ["冰", "水蒸氣", "雲", "雨"], answer: 1, hint: "液態的水受熱變成氣體，叫做水蒸氣。" }, action: "jump", prop: { kind: "cycle", nodes: ["冰（固態）", "水（液態）", "水蒸氣（氣態）"], active: 2 }, duration: 3600 },
    { id: 6, step: "步驟 6：冷卻反向變回", caption: "冷下來，水蒸氣又變回水（凝結），水再凍成冰（凝固）。", action: "walk", prop: { kind: "text", text: "加熱：冰→水→水蒸氣", sub: "冷卻：反過來變回去", tone: "ok" }, duration: 3400 },
    { id: 7, step: "步驟 7：三態互相變化", caption: "固態冰、液態水、氣態水蒸氣，三者會互相變來變去！", ask: { prompt: "水結成冰，是從什麼狀態變成固態？", options: ["液態", "氣態", "固態", "沒有變化"], answer: 0, hint: "平常的水（液態）遇冷才會結成冰（固態）。" }, action: "think", prop: { kind: "cycle", nodes: ["冰（固態）", "水（液態）", "水蒸氣（氣態）"], active: 0 }, duration: 3600 },
    { id: 8, step: "步驟 8：易錯點提醒", caption: "小提醒：水蒸氣其實是透明看不見的！你看到煮開冒的『白煙』，其實是小水滴喔。", action: "jump", prop: { kind: "text", text: "白煙＝小水滴，不是水蒸氣", sub: "水蒸氣本身看不見", tone: "warn" }, duration: 3600 },
    { id: 9, step: "步驟 9：記住口訣", caption: "口訣：冰是固態、水是液態、水蒸氣是氣態，加熱變氣、冷卻變固！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-water-states-1", prompt: "冰是水的哪一種狀態？", options: ["液態", "氣態", "固態", "電態"], answer: 2, hints: ["冰是硬硬、有固定形狀的", "固態是有固定形狀的"], explanation: "冰是水在低溫下的固態，有固定的形狀。" },
    { id: "el-sci-water-states-2", prompt: "看不見、飄在空中的水是什麼？", options: ["冰", "水", "雲朵", "水蒸氣"], answer: 3, hints: ["它是氣體狀態的水", "受熱的水變成的氣體"], explanation: "水受熱變成氣體，看不見地飄在空中，叫做水蒸氣（氣態）。" },
    { id: "el-sci-water-states-3", prompt: "水加熱到沸騰，會變成什麼？", options: ["水蒸氣", "冰", "更冰的水", "完全消失"], answer: 0, hints: ["加熱讓水從液態變氣態", "液態受熱變氣體"], explanation: "水加熱到沸點會從液態變成氣態（水蒸氣）。" },
    { id: "el-sci-water-states-4", prompt: "冬天氣溫很低，路上的水坑會怎麼變？", options: ["變成水蒸氣", "結成冰（固態）", "完全消失", "變成雲"], answer: 1, hints: ["低溫讓液態水結成固態", "冷卻使水凝固"], explanation: "低溫（冷卻）使液態水結成固態的冰，這個過程叫做凝固。" },
    { id: "el-sci-water-states-5", prompt: "水蒸氣遇冷會變回小水珠，這個過程叫什麼？", options: ["蒸發", "沸騰", "凝結", "融化"], answer: 2, hints: ["氣體遇冷變回液體", "和蒸發正好相反"], explanation: "水蒸氣（氣態）遇冷變回液態的小水珠，叫做凝結，例如雲和霧的形成。" },
    { id: "el-sci-water-states-6", prompt: "燒開水時壺口冒出的『白煙』，其實是什麼？", options: ["看不見的水蒸氣", "空氣中的灰塵", "燒壺的煙", "遇冷凝結的小水滴"], answer: 3, hints: ["水蒸氣本身透明看不到", "白霧是白白的小水珠"], explanation: "水蒸氣透明看不見，壺口的白霧是高溫水蒸氣遇冷空氣凝結成的細小水滴。" },
  ],
};

/* ===================== 5. 空氣與風（三上） ===================== */
const EL_SCI_AIR_WIND: OnionLesson = {
  id: "el-sci-air-wind",
  title: "空氣與風：空氣佔空間、流動成風",
  subject: "自然",
  topic: "空氣與風",
  grade: "三上",
  stages: ["國小"],
  desc: "看不見的空氣其實佔空間又會流動，洋蔥帶你弄懂風是怎麼來的。",
  takeaways: ["空氣會佔據空間，也會被壓縮", "空氣會從多處流向少處而流動", "空氣的流動就是我們感覺到的風", "吹氣球會鼓正是空氣進去佔了空間；人類利用風來吹風車、揚帆、發電"],
  frames: [
    { id: 1, step: "步驟 1：空氣在哪裡", caption: "你看不見空氣，但它其實到處都是，還會佔據空間呢！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：空氣佔空間", caption: "把空杯子倒扣壓進水裡，水進不去，因為空氣先佔住了杯子裡的空間。", action: "point", prop: { kind: "text", text: "空氣佔空間", sub: "倒扣壓水，水進不去", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：吹氣球看空氣", caption: "把氣球吹脹，其實是空氣跑進去、佔住了氣球裡的空間，它才鼓起來的！", ask: { prompt: "氣球會被吹脹，主要是因為什麼？", options: ["空氣跑進去佔了空間", "氣球自己會發胖", "熱氣把它燒大", "水灌進去"], answer: 0, hint: "吹進去的空氣佔據空間，把氣球撐大。" }, action: "point", prop: { kind: "text", text: "吹氣球＝空氣進去佔空間", sub: "空氣有體積", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：擠壓空氣看看", caption: "捏空的寶特瓶會扁掉，說明空氣被擠壓、佔著空間也會被壓縮。", ask: { prompt: "為什麼倒扣的空杯子壓入水中，水進不去？", options: ["杯子太重", "空氣佔住了杯內空間", "水會怕杯子", "杯子本來有蓋子"], answer: 1, hint: "杯裡已經有空氣佔據空間，把水擋在外面。" }, action: "think", prop: { kind: "text", text: "空氣有體積，可被壓縮", sub: "擠壓寶特瓶會變扁", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：空氣會流動", caption: "空氣不是死的，它會從多的地方流到少的地方，這就是流動。", action: "jump", prop: { kind: "text", text: "空氣會流動", sub: "從多處流向少處", tone: "ok" }, duration: 3200 },
    { id: 6, step: "步驟 6：太陽製造風", caption: "太陽曬熱地面，熱空氣往上跑，旁邊冷空氣補過來，就形成了風！", action: "walk", prop: { kind: "flow", steps: ["太陽曬熱空氣", "熱空氣上升", "冷空氣補位", "形成風"], active: 2 }, duration: 3600 },
    { id: 7, step: "步驟 7：風是空氣在動", caption: "所以風其實是空氣在移動，不是憑空出現的喔！", ask: { prompt: "我們感覺到的風，是怎麼形成的？", options: ["空氣流動", "地球轉動", "月亮吸引", "星星眨眼"], answer: 0, hint: "空氣從一處流向另一處，就是我們感覺到的風。" }, action: "think", prop: { kind: "flow", steps: ["太陽加熱", "空氣流動", "風產生"], active: 1 }, duration: 3600 },
    { id: 8, step: "步驟 8：風的利用", caption: "風是空氣流動，人類用它來吹風車、揚帆船、轉風力發電機，好處可多了！", action: "walk", prop: { kind: "flow", steps: ["吹風車", "揚帆船", "風力發電"], active: 2 }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：空氣佔空間，還會流動；空氣流動就變成風！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-sci-air-wind-1", prompt: "空氣會佔據空間嗎？", options: ["不會", "只看得到才會", "會", "永遠不會"], answer: 2, hints: ["倒扣杯子入水，水進不去", "空氣先佔住了位置"], explanation: "空氣雖然看不見，但會佔據空間，例如倒扣的杯子壓入水中水進不去。" },
    { id: "el-sci-air-wind-2", prompt: "為什麼捏空的寶特瓶會扁掉？", options: ["瓶子壞掉了", "手有磁力", "瓶子本來是軟的", "裡面的空氣被擠壓"], answer: 3, hints: ["瓶內有空氣佔空間", "空氣可以被壓縮"], explanation: "寶特瓶裡的空氣佔據空間，用力捏時空氣被壓縮，瓶子就扁了。" },
    { id: "el-sci-air-wind-3", prompt: "風是什麼造成的？", options: ["空氣流動", "水結成冰", "石頭滾動", "太陽變暗"], answer: 0, hints: ["空氣從一處移到另一處", "空氣移動就是風"], explanation: "風是空氣流動的現象，空氣從高壓處流向低壓處就形成風。" },
    { id: "el-sci-air-wind-4", prompt: "太陽曬熱地面後，附近的空氣會怎樣？", options: ["變重往下掉", "受熱上升", "結成冰", "消失不見"], answer: 1, hints: ["熱空氣比較輕", "熱空氣上升、冷空氣補位形成風"], explanation: "太陽加熱使空氣受熱變輕而上升，周圍冷空氣補位，形成空氣流動（風）。" },
    { id: "el-sci-air-wind-5", prompt: "下列哪個現象和「空氣佔空間」最有關？", options: ["影子變長", "石頭沉到水底", "倒扣杯子入水水進不去", "水變甜了"], answer: 2, hints: ["回想杯子實驗", "有空氣擋住水的地方"], explanation: "倒扣空杯子入水、水卻進不去，正是因為杯內空氣佔據了空間，這最直接說明空氣佔空間。" },
    { id: "el-sci-air-wind-6", prompt: "把吸滿空氣的針筒出口堵住，再壓活塞會壓不到底，是因為什麼？", options: ["活塞壞了", "針筒有磁性", "手太用力", "裡面空氣被封住、可被壓縮卻壓不光"], answer: 3, hints: ["針筒裡有空氣", "空氣佔空間又可被壓縮"], explanation: "堵住出口時，針筒內的空氣被封住、佔據空間，只能被壓縮一點，無法完全壓到底。" },
  ],
};

/* ===================== 6. 天氣觀測（四下） ===================== */
const EL_SCI_WEATHER_WATCH: OnionLesson = {
  id: "el-sci-weather-watch",
  title: "天氣觀測：氣溫、雨量、風向",
  subject: "自然",
  topic: "天氣觀測",
  grade: "四下",
  stages: ["國小"],
  desc: "氣溫、雨量、風向怎麼量？洋蔥教你用溫度計、雨量計和旗子觀測天氣。",
  takeaways: ["氣溫用溫度計測量，單位是 °C", "雨量用雨量計測量，單位是毫米 mm", "風向是風「從哪來」，看旗子飄的反方向", "量氣溫要選陰涼通風、避免日曬處；天氣要長期記錄才看得出變化趨勢"],
  frames: [
    { id: 1, step: "步驟 1：記錄天氣", caption: "天氣每天都不一樣！我們用幾個工具，把天氣好好記錄下來。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：用量溫度計", caption: "溫度計量氣溫，數字越高代表越熱，單位是 °C（攝氏）。", action: "point", prop: { kind: "text", text: "溫度計量氣溫", sub: "單位：°C（攝氏）", tone: "ok" }, duration: 3200 },
    { id: 3, step: "步驟 3：溫度計擺哪才準", caption: "量氣溫要放在陰涼通風、不要給太陽直曬的地方，量出來才準喔！", ask: { prompt: "量氣溫時，溫度計最好放在哪裡？", options: ["陰涼通風處", "太陽直曬的地方", "密閉車子裡", "放進熱鍋"], answer: 0, hint: "太陽直曬或太熱的地方，量出來會偏高。" }, action: "point", prop: { kind: "text", text: "陰涼通風處量才準", sub: "避免日曬烘烤", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：比較氣溫", caption: "看這三天的氣溫：周一 22、周二 28、周三 18 度，周二最熱！", ask: { prompt: "這三天裡，哪一天氣溫最高？", options: ["周一 22°C", "周二 28°C", "周三 18°C", "三天一樣高"], answer: 1, hint: "看數字最大的那一個，28 比 22 和 18 都大。" }, action: "think", prop: { kind: "bars", items: [{ label: "周一", value: 22 }, { label: "周二", value: 28 }, { label: "周三", value: 18 }], unit: "°C" }, duration: 3600 },
    { id: 5, step: "步驟 5：量雨量多少", caption: "雨量計收集雨水，量出下了多少毫米（mm），雨下得多數字就大。", action: "jump", prop: { kind: "text", text: "雨量計量雨量", sub: "單位：毫米 mm", tone: "ok" }, duration: 3200 },
    { id: 6, step: "步驟 6：看雨量大小", caption: "用小雨 5、中雨 20、大雨 50 毫米，來區分雨下得大還是小。", action: "walk", prop: { kind: "bars", items: [{ label: "小雨", value: 5 }, { label: "中雨", value: 20 }, { label: "大雨", value: 50 }], unit: "毫米" }, duration: 3400 },
    { id: 7, step: "步驟 7：判斷風向", caption: "風向是「風從哪邊來」；看旗子飄的反方向，就知道風從哪來。", ask: { prompt: "旗子往東邊飄，表示風是從哪裡來的？", options: ["西邊", "東邊", "南邊", "沒有風"], answer: 0, hint: "旗子往東飄，代表風把旗子往東吹，所以風從西邊來。" }, action: "think", prop: { kind: "text", text: "風向：風從哪來", sub: "看旗子飄的反方向", tone: "ok" }, duration: 3600 },
    { id: 8, step: "步驟 8：天天記錄才看得到規律", caption: "氣溫、雨量、風向天天記，連續記一週以上，才看得出天氣怎麼變化喔！", action: "walk", prop: { kind: "text", text: "長期觀測→看出趨勢", sub: "單一天不夠代表", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：氣溫看溫度計、雨量看雨量計、風向看旗子飄的反方向！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-weather-watch-1", prompt: "測量氣溫要用什麼工具？", options: ["雨量計", "尺", "溫度計", "天平"], answer: 2, hints: ["量冷熱的儀器", "單位是 °C"], explanation: "氣溫用溫度計測量，單位是攝氏度（°C）。" },
    { id: "el-sci-weather-watch-2", prompt: "雨下得多少，要用什麼來量？", options: ["溫度計", "時鐘", "放大鏡", "雨量計"], answer: 3, hints: ["收集雨水來量的工具", "單位是毫米 mm"], explanation: "雨量用雨量計收集並測量，單位是毫米（mm）。" },
    { id: "el-sci-weather-watch-3", prompt: "周一 22、周二 28、周三 18 度，哪一天最熱？", options: ["周二", "周一", "周三", "一樣熱"], answer: 0, hints: ["數字越大越熱", "28 是三個裡最大的"], explanation: "28°C 大於 22°C 和 18°C，所以周二最熱。" },
    { id: "el-sci-weather-watch-4", prompt: "旗子往南邊飄，表示風是從哪裡來的？", options: ["南邊", "北邊", "東邊", "沒有風"], answer: 1, hints: ["旗子飄的反方向就是風來的方向", "風把旗子往南吹"], explanation: "旗子往南飄，表示風把旗子吹向南，所以風從北邊來（北風）。" },
    { id: "el-sci-weather-watch-5", prompt: "雨量 50 毫米和 5 毫米比起來，哪個雨下得大？", options: ["一樣大", "5 毫米較大", "50 毫米較大", "看溫度才知道"], answer: 2, hints: ["數字越大雨越多", "雨量計數字大代表雨多"], explanation: "雨量計數字越大代表下的雨越多，50 毫米是大雨，比 5 毫米的小雨大很多。" },
    { id: "el-sci-weather-watch-6", prompt: "氣象站測雨量時，雨量計最好放在哪裡？", options: ["樹冠下擋雨處", "室內窗邊", "放進冰箱", "空曠無遮蔽處"], answer: 3, hints: ["要接到全部的雨", "被擋住雨就量不準"], explanation: "雨量計要放在空曠、不被樹或建築擋住的地方，才能正確接到降下的雨量。" },
  ],
};

/* ===================== 7. 月相的變化（四下） ===================== */
const EL_SCI_MOON_PHASE: OnionLesson = {
  id: "el-sci-moon-phase",
  title: "月相的變化：農曆初一十五的規律",
  subject: "自然",
  topic: "月相",
  grade: "四下",
  stages: ["國小"],
  desc: "月亮為什麼有圓有缺？洋蔥用月相循環帶你記住初一十五的規律。",
  takeaways: ["農曆初一朔（幾乎看不見）、十五滿月（最圓）", "初八上弦、廿三下弦，各亮半邊", "月相約 29.5 天循環一次", "月球不自己發光，月相只是看到的亮面多寡不同；不同月相出現時段也不同"],
  frames: [
    { id: 1, step: "步驟 1：月亮變化叫月相", caption: "月亮每天晚上的樣子都不一樣，這叫做「月相」的變化。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：初一朔看不見", caption: "農曆初一叫「朔」，月亮幾乎看不見，因為亮的那面背對我們。", action: "point", prop: { kind: "cycle", nodes: ["朔(初一)", "上弦(初八)", "滿月(十五)", "下弦(廿三)"], active: 0 }, duration: 3200 },
    { id: 3, step: "步驟 3：十五滿月最圓", caption: "到了農曆十五叫「滿月」，圓圓的月亮整夜都看得到！", action: "think", prop: { kind: "cycle", nodes: ["朔(初一)", "上弦(初八)", "滿月(十五)", "下弦(廿三)"], active: 2 }, duration: 3200 },
    { id: 4, step: "步驟 4：月亮為什麼會有圓缺", caption: "月球繞著地球轉，它永遠只有半邊被太陽照亮；我們看到亮的部分不同，才有圓缺！", ask: { prompt: "月亮本身會自己發光、變來變去嗎？", options: ["不會，它反射太陽光，只是看到的亮面不同", "會，月亮自己亮", "月亮會自己跑來跑去", "月亮會吃東西"], answer: 0, hint: "月亮不會自己發光，是反射太陽光。" }, action: "point", prop: { kind: "text", text: "月相＝看到的亮面不同", sub: "月球反射太陽光", tone: "ok" }, duration: 3800 },
    { id: 5, step: "步驟 5：初八上弦月", caption: "初八左右是「上弦月」，只看到右邊半個亮亮的月亮。", ask: { prompt: "農曆十五的月亮叫什麼？", options: ["朔", "滿月", "上弦月", "下弦月"], answer: 1, hint: "十五前後月亮最圓，叫做滿月。" }, action: "jump", prop: { kind: "cycle", nodes: ["朔(初一)", "上弦(初八)", "滿月(十五)", "下弦(廿三)"], active: 1 }, duration: 3600 },
    { id: 6, step: "步驟 6：廿三下弦月", caption: "廿三左右是「下弦月」，這次換左邊半個亮，和初八剛好相反。", action: "walk", prop: { kind: "cycle", nodes: ["朔(初一)", "上弦(初八)", "滿月(十五)", "下弦(廿三)"], active: 3 }, duration: 3400 },
    { id: 7, step: "步驟 7：月相輪流一圈", caption: "月相會一直輪流：朔→上弦→滿月→下弦→又回到朔，約 29.5 天一圈。", ask: { prompt: "農曆初一幾乎看不到月亮，這時叫什麼？", options: ["朔", "滿月", "上弦月", "殘月"], answer: 0, hint: "初一月亮被照亮面背對我們，叫做朔。" }, action: "think", prop: { kind: "cycle", nodes: ["朔(初一)", "上弦(初八)", "滿月(十五)", "下弦(廿三)"], active: 0 }, duration: 3600 },
    { id: 8, step: "步驟 8：何時看到什麼月", caption: "小秘訣：上弦月傍晚出現在東南方、滿月入夜後東昇，下弦月則要深夜才出來喔！", action: "walk", prop: { kind: "text", text: "上弦傍晚、滿月入夜、下弦深夜", sub: "不同月相出現時間不同", tone: "ok" }, duration: 3600 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：初一朔、十五滿月、初八上弦、廿三下弦，約 30 天輪一回！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-moon-phase-1", prompt: "農曆十五的圓圓月亮叫什麼？", options: ["朔", "上弦月", "滿月", "新月"], answer: 2, hints: ["十五前後月亮最圓", "整夜都看得到的圓月"], explanation: "農曆十五前後月亮被照亮面正對我們，看起來最圓，叫做滿月。" },
    { id: "el-sci-moon-phase-2", prompt: "農曆初一幾乎看不到月亮，這時叫什麼？", options: ["滿月", "上弦月", "下弦月", "朔（新月）"], answer: 3, hints: ["初一月亮照亮面背對我們", "幾乎看不見的時候"], explanation: "農曆初一叫做朔（新月），月球被照亮的一面向背對地球，幾乎看不見。" },
    { id: "el-sci-moon-phase-3", prompt: "初八左右看到的月亮，通常亮哪一半？", options: ["右半邊", "整個圓", "左半邊", "都不亮"], answer: 0, hints: ["初八是上弦月", "上弦月亮右半邊"], explanation: "農曆初八是上弦月，我們看到月球右半邊被照亮。" },
    { id: "el-sci-moon-phase-4", prompt: "月相從朔開始，繞一圈再回到朔，大約要幾天？", options: ["7 天", "約 29.5 天", "15 天", "365 天"], answer: 1, hints: ["比一個月略短", "接近一個農曆月"], explanation: "月相變化週期約 29.5 天（一個朔望月），之後重複同樣的變化。" },
    { id: "el-sci-moon-phase-5", prompt: "廿三的下弦月和初八的上弦月，差別在哪裡？", options: ["都亮整個圓", "下弦月看不見", "亮的方向相反（左／右）", "兩者完全一樣"], answer: 2, hints: ["一個亮右、一個亮左", "回想兩者的亮面位置"], explanation: "上弦月（初八）亮右半邊，下弦月（廿三）亮左半邊，兩者亮的半邊方向相反。" },
    { id: "el-sci-moon-phase-6", prompt: "為什麼有時白天也能看到淡淡的月亮？", options: ["月亮晚上才存在", "那是別的星球", "看錯了", "月亮白天也反射太陽光、只是太陽光太亮"], answer: 3, hints: ["月球反射太陽光", "白天天空亮比較難看到"], explanation: "月亮本身不發光，白天它仍反射太陽光掛在天上，只是太陽光太強、天空太亮，比較不容易看見。" },
  ],
};

/* ===================== 8. 太陽與竿影（五上） ===================== */
const EL_SCI_SUN_SHADOW: OnionLesson = {
  id: "el-sci-sun-shadow",
  title: "太陽與竿影：影子長短和太陽高度的關係",
  subject: "自然",
  topic: "太陽與竿影",
  grade: "五上",
  stages: ["國小"],
  desc: "同樣一根竹竿，影子為什麼時長時短？洋蔥帶你看太陽高度的關係。",
  takeaways: ["太陽越高，物體的影子越短；太陽越低，影子越長", "正午太陽最高，竿影最短", "影子長短能反映太陽高度（仰角）", "同時刻太陽角度相同，物體越高影子越長；影子永遠在太陽反方向"],
  frames: [
    { id: 1, step: "步驟 1：竿影會變長短", caption: "操場上立一根竹竿，你會發現影子長短一天都在變，為什麼呢？", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：太陽高影子短", caption: "太陽在天空越高，竹竿的影子就越短；太陽越低，影子就越長。", action: "point", prop: { kind: "text", text: "太陽越高，影子越短", sub: "正午影子最短", tone: "ok" }, duration: 3200 },
    { id: 3, step: "步驟 3：同時量兩根竹竿", caption: "同一時間量兩根長短不同的竹竿，越高的竹竿影子也越長，成比例喔！", ask: { prompt: "同一時間，較高的竹竿影子通常怎樣？", options: ["比較長", "比較短", "和矮的一樣", "沒有影子"], answer: 0, hint: "同一時刻太陽角度相同，物體越高影子越長。" }, action: "point", prop: { kind: "bars", items: [{ label: "矮竿", value: 2 }, { label: "高竿", value: 4 }], unit: "公尺" }, duration: 3600 },
    { id: 4, step: "步驟 4：比較竿影長短", caption: "看竿影長度：早晨 8 公尺、正午 2 公尺、傍晚 9 公尺，正午最短！", ask: { prompt: "一天中竹竿的影子最短是在什麼時候？", options: ["早晨", "正午", "傍晚", "半夜"], answer: 1, hint: "正午太陽最高，所以影子最短。" }, action: "think", prop: { kind: "bars", items: [{ label: "早晨", value: 8 }, { label: "正午", value: 2 }, { label: "傍晚", value: 9 }], unit: "公尺" }, duration: 3600 },
    { id: 5, step: "步驟 5：認識太陽高度", caption: "「太陽高度」就是太陽離地平線的角度；角度越大，代表太陽越高。", action: "jump", prop: { kind: "text", text: "太陽高度＝仰角", sub: "太陽離地平線的角度", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：高度影子相反", caption: "規律很簡單：太陽升高→影子變短；太陽降低→影子變長，兩者相反。", action: "walk", prop: { kind: "flow", steps: ["太陽升高", "影子變短", "太陽降低", "影子變長"], active: 0 }, duration: 3600 },
    { id: 7, step: "步驟 7：用影子看太陽", caption: "所以測量影子長短，還能反過來知道太陽到底有多高喔！", ask: { prompt: "太陽高度和影子長短有什麼關係？", options: ["太陽越高影子越短", "太陽越高影子越長", "兩者沒有關係", "太陽越高影子不見"], answer: 0, hint: "太陽越高，光越直直照下來，影子就越短。" }, action: "think", prop: { kind: "flow", steps: ["早晨太陽低", "影子長", "正午太陽高", "影子短"], active: 3 }, duration: 3600 },
    { id: 8, step: "步驟 8：影子方向也跟著轉", caption: "不只長短，影子方向也會變：太陽從東邊出來，影子就朝西，慢慢跟著轉一圈！", action: "walk", prop: { kind: "text", text: "日出東→影朝西", sub: "影子永遠在太陽反方向", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：太陽高→影子短、太陽低→影子長，正午影子最短！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-sun-shadow-1", prompt: "一天中影子最短大約在什麼時候？", options: ["早晨", "傍晚", "正午", "半夜"], answer: 2, hints: ["那時太陽在天空最高", "回想竿影 2 公尺最短"], explanation: "正午時太陽高度最大，竹竿的影子最短。" },
    { id: "el-sci-sun-shadow-2", prompt: "「太陽高度」指的是什麼？", options: ["太陽離地多遠", "太陽有多大顆", "太陽的溫度", "太陽離地平線的角度"], answer: 3, hints: ["它是一個角度", "太陽在天空中的位置高低"], explanation: "太陽高度是太陽光線與地平線之間的夾角，角度越大表示太陽越高。" },
    { id: "el-sci-sun-shadow-3", prompt: "早晨太陽剛升起時，影子通常比較怎樣？", options: ["很長", "很短", "不見了", "和正午一樣"], answer: 0, hints: ["早晨太陽低", "太陽低影子就長"], explanation: "早晨太陽高度小（離地平線近），所以物體的影子比較長。" },
    { id: "el-sci-sun-shadow-4", prompt: "如果影子突然變得很長，表示太陽怎麼了？", options: ["升得更高了", "變低了", "消失不見", "變成滿月"], answer: 1, hints: ["影子長代表太陽低", "兩者剛好相反"], explanation: "影子變長表示太陽高度變小、太陽位置變低（例如接近傍晚）。" },
    { id: "el-sci-sun-shadow-5", prompt: "古人用「立竿見影」來判斷時間，是運用了什麼關係？", options: ["影子的顏色", "風的方向", "影子長短反映太陽高度", "月相的變化"], answer: 2, hints: ["影子長短和太陽高度有關", "正午影子最短"], explanation: "立竿見影利用影子長短會隨太陽高度改變的規律來估算時間，太陽越高影子越短。" },
    { id: "el-sci-sun-shadow-6", prompt: "早上太陽在東邊時，操場上籃球架的影子大約朝哪一邊？", options: ["東邊", "南邊", "正下方", "西邊"], answer: 3, hints: ["影子在太陽的反方向", "太陽在東影子就朝西"], explanation: "影子永遠出現在物體背離太陽那一側；早上太陽在東邊，籃球架的影子就朝向西邊。" },
  ],
};

/* ===================== 9. 讓燈泡亮起來（四上） ===================== */
const EL_SCI_SIMPLE_CIRCUIT: OnionLesson = {
  id: "el-sci-simple-circuit",
  title: "讓燈泡亮起來：通路與斷路",
  subject: "自然",
  topic: "簡單電路",
  grade: "四上",
  stages: ["國小"],
  desc: "手電筒為什麼會亮？洋蔥用通路和斷路，帶你接出第一個會亮的電路。",
  takeaways: ["電路要有電池、導線、燈泡三要素", "接成完整的一圈（通路）燈才亮", "導線斷開或沒接好（斷路）燈就不亮", "導線金屬端要接電池正負極；不可只用一條線把正負極直接相連（短路）"],
  frames: [
    { id: 1, step: "步驟 1：電在跑一圈", caption: "小小手電筒為什麼會亮？其實是電在裡面跑了一圈喔！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：認識三零件", caption: "要讓燈泡亮，需要三樣：電池（供電）、導線（接線）、燈泡（發光）。", action: "point", prop: { kind: "text", text: "零件：電池、導線、燈泡", sub: "三樣缺一不可", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：導線要接對地方", caption: "接電路時，導線兩端的金屬部分要分別貼緊電池正極和負極，才接得牢喔！", ask: { prompt: "導線接在塑膠外殼上，電路會通嗎？", options: ["不會，塑膠不導電要接金屬端", "會，塑膠也導電", "會，只要碰到就好", "不知道"], answer: 0, hint: "電要透過金屬部分傳，塑膠外殼不導電。" }, action: "point", prop: { kind: "text", text: "導線金屬端接正負極", sub: "塑膠外殼不導電", tone: "warn" }, duration: 3600 },
    { id: 4, step: "步驟 4：接成通路", caption: "把電池、導線、燈泡接成一圈，電才跑得通，這叫「通路」。", ask: { prompt: "讓燈泡亮起來，下面哪一樣不是必須的？", options: ["電池", "石頭", "導線", "燈泡"], answer: 1, hint: "電池供電、導線連接、燈泡發光，石頭不在電路裡。" }, action: "think", prop: { kind: "flow", steps: ["電池", "導線", "燈泡", "形成通路"], active: 2 }, duration: 3600 },
    { id: 5, step: "步驟 5：斷路不亮", caption: "如果導線斷掉或沒接好，電跑不完一圈，叫做「斷路」，燈泡就不亮。", action: "jump", prop: { kind: "text", text: "斷路：線斷了不亮", sub: "電跑不完一圈", tone: "warn" }, duration: 3400 },
    { id: 6, step: "步驟 6：電怎麼跑一圈", caption: "電從電池正極出發，經導線到燈泡，再回到負極，跑完一圈燈才亮。", action: "walk", prop: { kind: "flow", steps: ["電池正極", "導線接燈泡", "燈泡亮", "電回負極"], active: 3 }, duration: 3600 },
    { id: 7, step: "步驟 7：加開關控制", caption: "加上開關，打開就接通成通路、關閉就斷路，燈泡就能控制亮滅。", ask: { prompt: "燈泡不亮，最可能的原因是什麼？", options: ["導線斷開（斷路）", "形成通路", "電池太新", "燈泡太大顆"], answer: 0, hint: "電跑不完一圈（斷路）時，燈泡就不亮。" }, action: "think", prop: { kind: "text", text: "開關＝通路的開關", sub: "打開接通、關閉斷路", tone: "ok" }, duration: 3600 },
    { id: 8, step: "步驟 8：易錯點：小心短路", caption: "小提醒：別只用一條導線直接把電池正、負極接在一起，那叫『短路』，電池會很快變燙沒電！", action: "jump", prop: { kind: "text", text: "正負極直接相接＝短路", sub: "電池會發燙、很快沒電", tone: "warn" }, duration: 3600 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：電池＋導線＋燈泡接成通路，燈才亮；斷路就不亮！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-simple-circuit-1", prompt: "讓燈泡亮起來，下列哪一樣不是必須的？", options: ["電池", "導線", "石頭", "燈泡"], answer: 2, hints: ["電池供電、導線連接、燈泡發光", "石頭不導電也不供電"], explanation: "電路三要素是電池、導線、燈泡；石頭不在電路中，不是必須的。" },
    { id: "el-sci-simple-circuit-2", prompt: "電流從電池的哪一極出發？", options: ["負極（−）", "兩極一起出發", "不需要出發", "正極（＋）"], answer: 3, hints: ["電從正極流出", "正極標 ＋ 號"], explanation: "電流從電池正極（＋）出發，經導線、燈泡，再回到負極（−），形成通路。" },
    { id: "el-sci-simple-circuit-3", prompt: "導線不小心斷成兩截，燈泡會怎樣？", options: ["不亮", "變得更亮", "變成別的顏色", "只是閃爍一下"], answer: 0, hints: ["電跑不完一圈", "這叫斷路"], explanation: "導線斷開使電路不完整（斷路），電跑不完一圈，燈泡就不亮。" },
    { id: "el-sci-simple-circuit-4", prompt: "在電池和燈泡間加一個開關，關掉時會發生什麼？", options: ["燈變更亮", "形成斷路燈不亮", "電池沒電了", "燈泡變大顆"], answer: 1, hints: ["開關關閉＝切斷通路", "通路斷開就是斷路"], explanation: "開關關閉時切斷電路（斷路），電流無法通過，燈泡就不亮。" },
    { id: "el-sci-simple-circuit-5", prompt: "為什麼電要「回到電池負極」燈才會一直亮？", options: ["負極會自己發光", "不回去也比較亮", "電要跑完整圈才持續", "回去會漏電"], answer: 2, hints: ["電路必須是封閉的一圈", "通路要完整"], explanation: "電路必須是封閉的回路：電從正極出發、經燈泡、回到負極，不斷循環燈才持續亮；少了任何一段就斷路。" },
    { id: "el-sci-simple-circuit-6", prompt: "直接用一條導線把電池正極和負極接在一起，會發生什麼？", options: ["燈泡超亮", "電池變更大", "沒有任何反應", "短路，電池很快發熱沒電"], answer: 3, hints: ["這叫短路", "電不走燈泡直接繞回去"], explanation: "正負極直接相連形成短路，電流不經過燈泡直接循環，電池會快速發熱、很快沒電，很危險。" },
  ],
};

/* ===================== 10. 種子的旅行與發芽（五上） ===================== */
const EL_SCI_SEED: OnionLesson = {
  id: "el-sci-seed",
  title: "種子的旅行與發芽：傳播與發芽條件",
  subject: "自然",
  topic: "種子",
  grade: "五上",
  stages: ["國小"],
  desc: "種子怎麼去遠方？又要什麼條件才發芽？洋蔥帶你看生命的旅行。",
  takeaways: ["種子靠風、動物、水流、彈射等方式傳播", "發芽需要水、空氣和適當溫度", "種子先長根再長芽，生命週期不斷循環", "種子外形常配合傳播方式；條件不足時會休眠等待適當時機"],
  frames: [
    { id: 1, step: "步驟 1：種子去旅行", caption: "果實裡藏著種子，它們要離開媽媽，去別的地方長大！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：種子傳播妙招", caption: "種子旅行各有妙招：風吹、動物黏走、自己彈射、隨水流漂。", action: "point", prop: { kind: "flow", steps: ["風傳（蒲公英）", "動物帶走（蒼耳）", "彈射（鳳仙花）", "水流（椰子）"], active: 0 }, duration: 3600 },
    { id: 3, step: "步驟 3：形狀配合旅行方式", caption: "有絨毛才能隨風飛、有鉤刺才能鉤住動物，種子的長相正好配合它的旅行方式！", ask: { prompt: "蒲公英種子長滿細毛，主要是為了什麼？", options: ["幫助隨風飄送傳播", "好看", "防水", "嚇走小鳥"], answer: 0, hint: "細毛像小降落傘，讓種子隨風飛。" }, action: "point", prop: { kind: "text", text: "形狀＝旅行工具", sub: "絨毛隨風、鉤刺附動物", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：發芽三要件", caption: "種子要發芽，需要三件寶：水、空氣和適當的溫度，缺一不可！", ask: { prompt: "種子發芽不需要下面哪一個？", options: ["水", "火焰", "空氣", "適當溫度"], answer: 1, hint: "發芽需要水、空氣和適溫；火焰會傷害種子。" }, action: "think", prop: { kind: "flow", steps: ["水", "空氣", "適溫", "發芽"], active: 2 }, duration: 3600 },
    { id: 5, step: "步驟 5：先長根再長芽", caption: "種子喝飽水會脹大，先冒出白色的根往下扎，再長出芽往上冒。", action: "jump", prop: { kind: "text", text: "泡水膨脹 → 先長根", sub: "根往下、芽往上", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：發芽不一定要光", caption: "有趣的是，剛發芽時不一定要有光，水和溫度才是關鍵。", action: "walk", prop: { kind: "text", text: "發芽不一定要有光", sub: "水與適溫才是關鍵", tone: "ok" }, duration: 3400 },
    { id: 7, step: "步驟 7：生命週期循環", caption: "種子長成植物，開花結果又生出新的種子，生命就這樣一直輪流！", ask: { prompt: "種子發芽時，通常先長出什麼？", options: ["根", "葉子", "花朵", "果實"], answer: 0, hint: "種子喝飽水後先長根往下扎，再長芽。" }, action: "think", prop: { kind: "cycle", nodes: ["種子", "發芽", "幼苗", "開花結果", "新種子"], active: 1 }, duration: 3600 },
    { id: 8, step: "步驟 8：種子會耐心等待", caption: "條件不對時，種子會睡著不發芽（休眠），等到水和溫度都對了才醒過來！", action: "walk", prop: { kind: "text", text: "休眠：等到條件對才發芽", sub: "不會馬上都發芽", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：種子靠風、動物、水、彈射去旅行；有水、空氣、適溫才發芽！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-seed-1", prompt: "蒲公英的種子主要靠什麼傳播？", options: ["水流", "動物", "風", "火焰"], answer: 2, hints: ["蒲公英有絨毛小傘", "會隨風飄走"], explanation: "蒲公英種子帶絨毛，輕輕一吹就隨風飄走，靠風傳播。" },
    { id: "el-sci-seed-2", prompt: "種子發芽一定需要下列哪一個？", options: ["強烈的光", "肥料", "音樂", "水"], answer: 3, hints: ["發芽三要件之一", "水和空氣、適溫才是關鍵"], explanation: "種子發芽需要水、空氣和適當溫度；許多種子發芽時不一定需要光。" },
    { id: "el-sci-seed-3", prompt: "蒼耳的果實會黏在動物皮毛上，這是為了什麼？", options: ["讓動物帶走種子", "裝飾動物", "把動物吃掉", "讓動物變慢"], answer: 0, hints: ["種子要離開媽媽", "動物幫忙搬家"], explanation: "蒼耳果實有鉤刺，黏在動物皮毛上被帶到遠處，幫助種子傳播。" },
    { id: "el-sci-seed-4", prompt: "把綠豆放在乾燥又冰冷的地方，會發芽嗎？", options: ["會", "不會，缺水又太冷", "會長得更快", "只看有沒有光"], answer: 1, hints: ["發芽需要水和適溫", "乾冷兩個條件都不夠"], explanation: "發芽需要水、空氣和適當溫度；乾燥缺水又溫度太低，綠豆不會發芽。" },
    { id: "el-sci-seed-5", prompt: "種子發芽時，通常先長出什麼構造？", options: ["葉子", "花朵", "根", "果實"], answer: 2, hints: ["先往下扎的白色部分", "根先出來吸收水"], explanation: "種子吸水膨脹後通常先長出根（往下扎固定並吸水），之後才長芽和葉。" },
    { id: "el-sci-seed-6", prompt: "下列哪一種組合，綠豆最容易發芽？", options: ["乾燥冰冷、完全沒空氣", "泡在滾燙熱水裡", "放在太陽下曬乾", "有水、有空氣、溫度適中"], answer: 3, hints: ["發芽三要件：水、空氣、適溫", "太熱太冷太乾都不行"], explanation: "種子發芽需要水、空氣和適當溫度；適中條件三者都具備，綠豆才容易發芽。" },
  ],
};

/* ===================== 11. 動物的構造與適應（六上） ===================== */
const EL_SCI_ANIMAL_ADAPT: OnionLesson = {
  id: "el-sci-animal-adapt",
  title: "動物的構造與適應：構造配合環境",
  subject: "自然",
  topic: "動物適應",
  grade: "六上",
  stages: ["國小"],
  desc: "為什麼啄木鳥喙尖尖、鴨子腳有蹼？洋蔥帶你看構造如何配合環境。",
  takeaways: ["動物的構造配合牠的環境和食物（如尖喙啄蟲）", "蹼足、保護色都是適應環境的構造", "構造配合功能，幫動物覓食、活動和躲避敵人", "適應構造是動物長久生活在環境中逐漸累積而來，並非一朝一夕"],
  frames: [
    { id: 1, step: "步驟 1：構造配合環境", caption: "動物的身體構造，常常剛好適合牠住的地方和吃的食物！", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：尖喙配合覓食", caption: "啄木鳥有尖又硬的喙，能敲開樹皮、把蟲勾出來吃，構造配合覓食。", action: "point", prop: { kind: "text", text: "啄木鳥：尖硬喙啄蟲", sub: "構造配合覓食", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：長頸鹿的長脖子", caption: "長頸鹿脖子特長，能夠到別的動物吃不到的高處樹葉，也是構造配合食物！", ask: { prompt: "長頸鹿的長脖子最主要幫助牠做什麼？", options: ["看得遠、吃到高處的葉子", "游泳", "挖洞", "發聲音"], answer: 0, hint: "高處樹葉別的草食動物吃不到。" }, action: "point", prop: { kind: "text", text: "長頸鹿：長頸吃高處葉", sub: "構造配合食物來源", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：蹼足配合游泳", caption: "鴨子的腳有蹼，像小船槳一樣，在水裡划得又快又穩。", ask: { prompt: "鴨子腳上的蹼主要用來做什麼？", options: ["飛行", "在水中划水", "挖洞", "聽聲音"], answer: 1, hint: "蹼像槳，幫助牠在水裡划水游泳。" }, action: "think", prop: { kind: "text", text: "鴨子：蹼足划水", sub: "腳像槳", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：保護色躲敵人", caption: "變色龍、枯葉蝶有保護色，身體顏色和環境很像，敵人就很難發現牠們。", action: "jump", prop: { kind: "text", text: "保護色：和環境同色", sub: "不容易被發現", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：三類適應構造", caption: "動物靠三類構造適應：覓食、運動、防衛，我們各舉 1 個例子。", action: "walk", prop: { kind: "bars", items: [{ label: "覓食", value: 1 }, { label: "運動", value: 1 }, { label: "防衛", value: 1 }], unit: "類" }, duration: 3200 },
    { id: 7, step: "步驟 7：構造配合功能", caption: "所以動物的每個構造都不是亂長的，都是為了在環境裡好好生存！", ask: { prompt: "動物的構造和什麼最有關係？", options: ["牠的環境和食物", "牠取的名字", "牠喜歡的顏色", "隨機亂長的"], answer: 0, hint: "構造是為了配合居住環境和覓食方式而來的。" }, action: "think", prop: { kind: "text", text: "構造配合功能", sub: "不是隨便長的", tone: "ok" }, duration: 3600 },
    { id: 8, step: "步驟 8：適應是慢慢累積的", caption: "這些巧妙的構造不是一兩天長出來的，而是動物長久生活在環境中慢慢適應、留下來的喔！", action: "walk", prop: { kind: "text", text: "適應＝長久累積的結果", sub: "不是突然變出來", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：動物的喙、腳、保護色等構造，都配合環境幫牠生存！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-animal-adapt-1", prompt: "啄木鳥尖又硬的喙，主要用來做什麼？", options: ["飛行", "游泳", "啄開樹皮吃蟲", "聽聲音"], answer: 2, hints: ["和覓食有關", "樹皮裡藏著蟲"], explanation: "啄木鳥尖又硬的喙用來敲開樹皮、勾出裡面的蟲，構造配合覓食。" },
    { id: "el-sci-animal-adapt-2", prompt: "鴨子的腳有蹼，主要是為了什麼？", options: ["飛得更高", "挖土", "發光", "在水中划水"], answer: 3, hints: ["蹼像槳", "幫助游泳"], explanation: "鴨子的蹼足像槳一樣，幫助牠在水中划水、游泳。" },
    { id: "el-sci-animal-adapt-3", prompt: "變色龍、枯葉蝶身體顏色和環境很像，這叫做什麼？", options: ["保護色", "保溫層", "偽裝成石頭", "會發光"], answer: 0, hints: ["顏色和環境一樣", "用來躲敵人"], explanation: "保護色是動物體色與環境相似，不容易被敵人或獵物發現，是一種適應。" },
    { id: "el-sci-animal-adapt-4", prompt: "下列哪一個不是動物適應環境的例子？", options: ["鳥的尖喙啄食", "石頭的形狀", "魚的鰓呼吸水中氧", "北極熊白毛偽裝"], answer: 1, hints: ["石頭不是生物", "沒有為了適應而長出的構造"], explanation: "石頭是非生物，沒有為了適應環境而演化出的構造；其他都是動物配合環境的構造。" },
    { id: "el-sci-animal-adapt-5", prompt: "為什麼說動物的構造「配合功能」？", options: ["構造是隨機長的", "構造只為了好看", "每種構造都幫牠在環境中生存", "構造和環境無關"], answer: 2, hints: ["構造是為了覓食、活動、防衛", "例如喙、腳、保護色"], explanation: "動物的構造（如喙、腳、保護色）都是為了配合居住環境和生活方式，幫助牠覓食、活動與躲避敵人，這就是構造配合功能。" },
    { id: "el-sci-animal-adapt-6", prompt: "北極熊全身白色的毛，主要對牠有什麼幫助？", options: ["好看", "比較會游泳", "會發光取暖", "在雪地裡不容易被獵物發現"], answer: 3, hints: ["白色和雪地融在一起", "這是保護色"], explanation: "北極熊白毛與雪地環境相近，形成保護色，狩獵時不易被海豹發現，有利生存。" },
  ],
};

/* ===================== 12. 生態系與環境保護（六下） ===================== */
const EL_SCI_ECOSYSTEM: OnionLesson = {
  id: "el-sci-ecosystem",
  title: "生態系與環境保護：生物與環境互相影響",
  subject: "自然",
  topic: "生態系",
  grade: "六下",
  stages: ["國小"],
  desc: "森林池塘裡生物和環境怎麼互相影響？洋蔥帶你認識生態系與保護。",
  takeaways: ["生態系包含生物與非生物，彼此互相影響", "生產者、消費者、分解者讓物質循環", "破壞棲地會讓生物失去家園，要好好保護", "生態系像一張食物網，少了一種生物常會連帶影響其他相依存的物種"],
  frames: [
    { id: 1, step: "步驟 1：認識生態系", caption: "森林、池塘都是「生態系」：裡面的生物和陽光、水、土壤互相影響。", action: "wave", prop: { kind: "none" }, duration: 2800 },
    { id: 2, step: "步驟 2：生產者消費者", caption: "生態系裡，植物是生產者，動物是消費者，真菌細菌是分解者。", action: "point", prop: { kind: "cycle", nodes: ["生產者(植物)", "消費者(動物)", "分解者(真菌)"], active: 0 }, duration: 3400 },
    { id: 3, step: "步驟 3：能量這樣傳", caption: "草等植物是生產者，兔子吃草，能量就從植物傳到動物身上！", ask: { prompt: "生態系中，綠色植物扮演什麼角色？", options: ["生產者", "消費者", "分解者", "非生物"], answer: 0, hint: "植物自己製造養分，叫做生產者。" }, action: "think", prop: { kind: "cycle", nodes: ["生產者(植物)", "消費者(動物)", "分解者(真菌)"], active: 0 }, duration: 3600 },
    { id: 4, step: "步驟 4：食物網舉例", caption: "草被兔子吃、兔子被老鷹吃，一連串『誰吃誰』就像一張網，互相牽連！", ask: { prompt: "草→兔子→老鷹，在這條食物關係裡，老鷹是什麼？", options: ["生產者", "消費者", "分解者", "非生物"], answer: 1, hint: "老鷹吃兔子，是消費者。" }, action: "point", prop: { kind: "flow", steps: ["草(生產者)", "兔子(消費)", "老鷹(消費)"], active: 2 }, duration: 3600 },
    { id: 5, step: "步驟 5：分解者回收", caption: "落葉和動物屍體被真菌、細菌分解成養分，又回到土壤給植物用。", action: "jump", prop: { kind: "cycle", nodes: ["生產者(植物)", "消費者(動物)", "分解者(真菌)"], active: 2 }, duration: 3400 },
    { id: 6, step: "步驟 6：破壞棲地後果", caption: "如果人類砍樹、污染河川，棲地被破壞，動物就會失去家園、生態失衡。", action: "walk", prop: { kind: "flow", steps: ["人類砍樹", "棲地變少", "動物沒家", "生態失衡"], active: 2 }, duration: 3600 },
    { id: 7, step: "步驟 7：我們可以保護", caption: "我們可以種樹、減少污染、不亂丟，一起守護動物的家！", ask: { prompt: "破壞棲地（如砍樹）會造成什麼？", options: ["動物失去家園、生態失衡", "動物家園變多", "植物長得更好", "完全沒有影響"], answer: 0, hint: "棲地被破壞，依賴它的生物就失去生存環境。" }, action: "think", prop: { kind: "flow", steps: ["減少污染", "種樹護棲地", "不亂丟", "保護生態"], active: 1 }, duration: 3600 },
    { id: 8, step: "步驟 8：牽一髮動全身", caption: "生態系像一張網：少了一種生物，會連帶影響靠牠吃、被牠吃的其他生物喔！", action: "walk", prop: { kind: "text", text: "少一種→連環影響", sub: "彼此環環相扣", tone: "warn" }, duration: 3400 },
    { id: 9, step: "步驟 9：記住口訣", caption: "記住：生物和環境互相影響；保護棲地，就是保護生生不息的生態系！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "el-sci-ecosystem-1", prompt: "生態系裡，綠色植物被稱為什麼？", options: ["消費者", "分解者", "生產者", "捕食者"], answer: 2, hints: ["植物自己製造養分", "用陽光做出食物"], explanation: "綠色植物能自行製造養分，是生態系中的生產者。" },
    { id: "el-sci-ecosystem-2", prompt: "真菌和細菌在生態系中扮演什麼角色？", options: ["生產者", "消費者", "非生物", "分解者"], answer: 3, hints: ["牠們把落葉屍體分解", "養分回到土壤"], explanation: "真菌和細菌把動植物遺體分解為養分，稱為分解者，讓物質循環。" },
    { id: "el-sci-ecosystem-3", prompt: "兔子吃草，能量從草傳到兔子，這說明了什麼？", options: ["生物之間會互相影響", "生物互不相干", "草會自己走動", "兔子不需要草"], answer: 0, hints: ["吃與被吃是互相影響", "生態系裡生物彼此關聯"], explanation: "兔子吃草顯示生態系中生物之間會互相影響，能量沿食物關係傳遞。" },
    { id: "el-sci-ecosystem-4", prompt: "人類大量砍樹，最先直接受害的是誰？", options: ["石頭", "依賴樹林的動物", "雲", "太陽"], answer: 1, hints: ["樹林是動物的家", "棲地消失了"], explanation: "砍樹破壞棲地，依賴樹林生存的動物首先失去家和食物來源。" },
    { id: "el-sci-ecosystem-5", prompt: "為什麼說「保護棲地就能保護整個生態系」？", options: ["棲地只影響一種生物", "棲地和生態系無關", "棲地是許多生物的家，彼此互相影響", "保護棲地只為了好看"], answer: 2, hints: ["生物和環境互相影響", "一種生物消失會連帶影響其他"], explanation: "棲地提供許多生物生存所需的環境，生物彼此又互相影響；保護棲地能維持整個生態系的平衡，一種生物消失常會連帶影響其他生物。" },
    { id: "el-sci-ecosystem-6", prompt: "池塘裡的青蛙大量減少，最可能先影響到什麼？", options: ["石頭的數量", "月亮的形狀", "太陽亮度", "本來被青蛙吃掉的蟲變多"], answer: 3, hints: ["青蛙吃蟲", "食物網會連動"], explanation: "青蛙是消費者、以昆蟲為食；青蛙減少，被牠捕食的昆蟲失去天敵會先增加，食物網隨之改變。" },
  ],
};

export default [
  EL_SCI_MAGNET,
  EL_SCI_LIGHT_SHADOW,
  EL_SCI_SOUND,
  EL_SCI_WATER_STATES,
  EL_SCI_AIR_WIND,
  EL_SCI_WEATHER_WATCH,
  EL_SCI_MOON_PHASE,
  EL_SCI_SUN_SHADOW,
  EL_SCI_SIMPLE_CIRCUIT,
  EL_SCI_SEED,
  EL_SCI_ANIMAL_ADAPT,
  EL_SCI_ECOSYSTEM,
];
