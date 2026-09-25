import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 國小國語 8 堂 + 國小英語 6 堂（洋蔥學院擴充計畫）
 * 設計原則：一步一觀念、圖解真的畫得出概念、中途提問、6 題由淺入深。
 * 9 幀分鏡（每幀 step／caption／action／prop／duration，至少 3 幀有 ask）
 * ＋ 6 題闖關（2 基本 → 2 應用 → 2 易錯）＋ 4 條 takeaways。
 * ======================================================================== */

/* ===================== 國語 1：成語的運用（五上） ===================== */
const EL_CHI_IDIOM: OnionLesson = {
  id: "el-chi-idiom",
  title: "成語的運用：看情境選對成語",
  subject: "國語",
  topic: "成語運用",
  grade: "五上",
  stages: ["國小"],
  desc: "成語不能只按字面猜！洋蔥帶你看情境，學會選對成語、不再望文生義。",
  takeaways: ["成語有固定意義，不能望文生義", "先看情境再選合適的成語", "用錯成語會讓意思大不同", "成語常含故事典故，認識典故才不易誤用"],
  frames: [
    { id: 1, step: "步驟 1：認識成語是固定說法", caption: "嗨！成語是古人留下的四字精華，意思固定，不能照字面亂猜喔。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：看懂成語的真正意思", caption: "「守株待兔」不是真的等兔子，而是比喻不知變通、傻等機會。", action: "point", prop: { kind: "text", text: "守株待兔", sub: "比喻不知變通、傻等機會", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：辨析形近義近的成語", caption: "「畫蛇添足」是多做反而壞事，「錦上添花」是好上加好，都有「添」字，意思卻相反。", action: "point", prop: { kind: "balance", left: "畫蛇添足：多此一舉", right: "錦上添花：好上加好", tip: "同字不同義" }, duration: 3600 },
    { id: 4, step: "步驟 4：從情境挑成語", caption: "如果同學每天努力練習、從不偷懶，該用哪個成語形容他？", ask: { prompt: "下面哪個成語形容「持之以恆、勤奮不懈」最合適？", options: ["孜孜不倦", "守株待兔", "畫蛇添足", "井底之蛙"], answer: 0, hint: "找表示勤奮、堅持不懈的成語。" }, action: "think", prop: { kind: "text", text: "孜孜不倦", sub: "勤奮努力，不知疲倦", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：避開望文生義陷阱", caption: "「朝三暮四」原指變來變去，不是早上三點晚上四點，別被字面騙了！", action: "walk", prop: { kind: "text", text: "朝三暮四 ≠ 3點和4點", sub: "原意是變來變去、反覆無常", tone: "warn" }, duration: 3600 },
    { id: 6, step: "步驟 6：對照正確與錯誤用法", caption: "他做事「三心二意」，總是做一半就換別的——這裡用得恰當嗎？", ask: { prompt: "「三心二意」可以用來形容下列哪種情形？", options: ["專心寫作業", "做事不專心、常分心", "每天運動", "認真讀書"], answer: 1, hint: "三心二意就是心意不專、容易分心。" }, action: "point", prop: { kind: "balance", left: "三心二意：不專心", right: "專心一致：很投入", tip: "意思正好相反" }, duration: 3800 },
    { id: 7, step: "步驟 7：綜合判斷成語用法", caption: "這次換你動手：下列哪一句的成語用得最恰當？", ask: { prompt: "下列哪一句的成語用法最恰當？", options: ["他畫龍點睛，一句話讓報告更精彩", "他守株待兔，每天苦讀上榜", "他畫蛇添足，把簡單的報告改得更精簡", "他井底之蛙，走遍世界各地"], answer: 0, hint: "找意思和情境相符的那一句。" }, action: "think", prop: { kind: "text", text: "畫龍點睛：關鍵處加分", sub: "用對成語才加分", tone: "ok" }, duration: 3800 },
    { id: 8, step: "步驟 8：記住選成語三步驟", caption: "選成語小三步：一看情境、二想本意、三查有沒有被字面誤導。", action: "cheer", prop: { kind: "flow", steps: ["看情境", "想本意", "防字面誤導"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關複習", caption: "口訣：成語看本意、情境來挑選，望文生義最危險。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-idiom-1", prompt: "「守株待兔」的正確意思是？", options: ["守在樹下等兔子", "養兔子的人", "比喻不知變通、傻等機會", "種樹的人"], answer: 2, hints: ["不是字面意思", "想想比喻義"], explanation: "守株待兔比喻不知變通、妄想不勞而獲，不是真的守樹等兔。" },
    { id: "el-chi-idiom-2", prompt: "下列哪個成語形容人勤奮不懈？", options: ["畫蛇添足", "守株待兔", "井底之蛙", "孜孜不倦"], answer: 3, hints: ["找表示努力不懈的", "孜孜是勤奮的樣子"], explanation: "孜孜不倦形容勤奮努力、不知疲倦，符合勤奮不懈。" },
    { id: "el-chi-idiom-3", prompt: "小明做事總是做一半就換別的，可用哪個成語？", options: ["三心二意", "一絲不苟", "持之以恆", "全神貫注"], answer: 0, hints: ["他常常分心、不專心", "找相反於專心的詞"], explanation: "三心二意形容心意不專、容易分心，符合做一半就換的情形。" },
    { id: "el-chi-idiom-4", prompt: "「朝三暮四」現在多用來形容？", options: ["時間觀念強", "反覆無常、變來變去", "早起晚睡", "很有計畫"], answer: 1, hints: ["原意是變來變去", "不是字面的三點四點"], explanation: "朝三暮四現多比喻反覆無常、變來變去，不能按字面理解。" },
    { id: "el-chi-idiom-5", prompt: "下列哪一句的成語用法正確？", options: ["他守株待兔，每天認真練習", "這題畫蛇添足，剛好不多不少", "他孜孜不倦地準備考試", "小明井底之蛙，見多識廣"], answer: 2, hints: ["檢查每個成語的意思是否相符", "孜孜不倦＝勤奮"], explanation: "孜孜不倦形容勤奮，用來說認真準備考試正確；其他句子的成語意思都相反或用錯。" },
    { id: "el-chi-idiom-6", prompt: "「畫蛇添足」和「錦上添花」的意思是？", options: ["都表示好上加好", "都表示多做反而壞事", "兩者意思完全一樣", "前者多此一舉、後者好上加好"], answer: 3, hints: ["同有『添』字，意思相反", "蛇本無腳，畫上多餘；錦上繡花更好"], explanation: "畫蛇添足比喻多此一舉反而壞事，錦上添花比喻好上加好；同有『添』字但意思相反，最容易混淆。" },
  ],
};

/* ===================== 國語 2：譬喻與擬人（五上） ===================== */
const EL_CHI_RHETORIC: OnionLesson = {
  id: "el-chi-rhetoric",
  title: "譬喻與擬人：把話說得活靈活現",
  subject: "國語",
  topic: "修辭：譬喻與擬人",
  grade: "五上",
  stages: ["國小"],
  desc: "譬喻把 A 比作 B，擬人把物當人寫。洋蔥用對照卡帶你分辨兩種修辭。",
  takeaways: ["譬喻：用「像、如、是」把 A 比作 B", "擬人：把物當人，賦予人的動作或情感", "兩者都讓描寫更生動", "譬喻要有本體、喻詞、喻體才完整"],
  frames: [
    { id: 1, step: "步驟 1：認識修辭讓句子更活", caption: "嗨！同樣說「雲很多」，有人寫得像棉花糖，這就是修辭的魔力。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：學譬喻把 A 比作 B", caption: "譬喻是用「像、好像、是」把一樣東西比成另一樣：雲像棉花糖。", action: "point", prop: { kind: "text", text: "雲 像 棉花糖", sub: "譬喻：A 像 B（本體＋喻詞＋喻體）", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：分辨譬喻三要素", caption: "「彎彎的月亮像小船」裡，被比的那個「月亮」叫做什麼？", ask: { prompt: "「彎彎的月亮像小船」中的「月亮」在譬喻裡稱為？", options: ["本體", "喻體", "喻詞", "作者"], answer: 0, hint: "被拿來比喻的那個東西叫本體。" }, action: "think", prop: { kind: "text", text: "月亮（本體）像 小船（喻體）", sub: "像＝喻詞", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：認識常見的喻詞", caption: "譬喻常用「像、好像、仿佛、如」來連接本體和喻體：他跑得像風、時間如流水。", action: "point", prop: { kind: "text", text: "像／好像／仿佛／如", sub: "都是譬喻的喻詞", tone: "ok" }, duration: 3400 },
    { id: 5, step: "步驟 5：學擬人把物當人寫", caption: "擬人則是把物當人：小花對我微笑、風兒輕輕唱歌，物有了人的動作。", action: "walk", prop: { kind: "text", text: "小花對我微笑", sub: "擬人：物 ＋ 人的動作／情感", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：對照譬喻與擬人", caption: "「太陽公公露出了笑臉」用了哪一種修辭？", ask: { prompt: "「太陽公公露出了笑臉」屬於哪種修辭？", options: ["譬喻", "擬人", "誇飾", "排比"], answer: 1, hint: "太陽被當成人，會『露笑臉』。" }, action: "point", prop: { kind: "balance", left: "譬喻：A 比作 B", right: "擬人：物當人寫", tip: "太陽公公＝把物當人" }, duration: 3800 },
    { id: 7, step: "步驟 7：動手分辨修辭", caption: "聽這句：「落葉像蝴蝶在空中跳舞」，它用了哪一種修辭？", ask: { prompt: "「落葉像蝴蝶在空中跳舞」包含哪種修辭？", options: ["譬喻與擬人都有", "只有譬喻", "只有擬人", "誇飾"], answer: 0, hint: "『像蝴蝶』是譬喻，『跳舞』是把落葉當人寫。" }, action: "think", prop: { kind: "balance", left: "像蝴蝶＝譬喻", right: "跳舞＝擬人", tip: "兩種都有" }, duration: 3800 },
    { id: 8, step: "步驟 8：一眼分辨的小訣竅", caption: "分辨口訣：有「像、如、是」比來比去是譬喻；物會笑會跑會說話是擬人。", action: "cheer", prop: { kind: "flow", steps: ["看到像/如/是→譬喻", "物會說話動作→擬人"], active: 1 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關練習", caption: "口訣：像什麼是譬喻、物做人動作是擬人。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-rhetoric-1", prompt: "下列哪一句使用了譬喻？", options: ["風兒輕輕唱歌", "星星眨眨眼", "彎月像小船", "花兒點點頭"], answer: 2, hints: ["找「像、如、是」", "把月亮比成小船"], explanation: "彎月像小船用『像』把月亮比成小船，是譬喻。" },
    { id: "el-chi-rhetoric-2", prompt: "譬喻中「被拿來比喻的東西」叫做？", options: ["喻體", "喻詞", "主詞", "本體"], answer: 3, hints: ["月亮是被比的那個", "小船才是喻體"], explanation: "本體是句子裡被比喻的對象（如月亮），喻體是用來比喻的對象（如小船）。" },
    { id: "el-chi-rhetoric-3", prompt: "「柳樹垂下長髮，靜靜地想心事」用了什麼修辭？", options: ["擬人", "譬喻", "對偶", "誇飾"], answer: 0, hints: ["柳樹被當人，會『想心事』", "有人的情感與動作"], explanation: "柳樹被賦予人的動作與情感（垂長髮、想心事），是擬人。" },
    { id: "el-chi-rhetoric-4", prompt: "下列何者同時出現譬喻的喻詞？", options: ["小草向我招手", "他跑得像風一樣快", "太陽公公笑", "鳥兒唱著歌"], answer: 1, hints: ["找『像、如、是』", "像風一樣是譬喻"], explanation: "『像風一樣』用喻詞『像』構成譬喻；其他三句是擬人。" },
    { id: "el-chi-rhetoric-5", prompt: "「書像一座迷宮，我在裡面迷路」這句包含？", options: ["只有譬喻", "只有擬人", "譬喻與擬人都有", "沒有修辭"], answer: 2, hints: ["『像迷宮』是譬喻", "『我在裡面迷路』把書當場所擬人化"], explanation: "『書像迷宮』是譬喻（喻詞『像』）；把書當成可以走進迷路的場所，帶有擬人意味，兩者皆有。" },
    { id: "el-chi-rhetoric-6", prompt: "下列哪一句使用了「隱喻」（用『是』直接說 A 是 B）？", options: ["月亮像小船", "風兒在唱歌", "星星眨眼睛", "時光是一條河流"], answer: 3, hints: ["隱喻不用『像』，直接用『是／為』", "把時光當成河流"], explanation: "『時光是一條河流』用『是』直接把時光說成河流，是隱喻；『月亮像小船』是明喻，其餘是擬人。" },
  ],
};

/* ===================== 國語 3：詩歌的節奏（四上） ===================== */
const EL_CHI_POEM_RHYTHM: OnionLesson = {
  id: "el-chi-poem-rhythm",
  title: "詩歌的節奏：押韻與朗讀的抑揚",
  subject: "國語",
  topic: "詩歌節奏",
  grade: "四上",
  stages: ["國小"],
  desc: "詩歌為什麼讀起來順口？洋蔥帶你聽押韻、找停頓、學朗讀的語氣。",
  takeaways: ["押韻：句尾字音相近，讀來順口", "停頓：依語意分句，節奏才清楚", "朗讀語氣要配合詩的情绪", "押韻看句尾韻腳，隔句押韻也能順口"],
  frames: [
    { id: 1, step: "步驟 1：感受詩歌的韻律", caption: "嗨！讀詩時是不是覺得特別順口？祕密就在押韻和節奏裡。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：認識什麼是押韻", caption: "押韻是句尾的字音相近：例如「光、香、長」都押 ang 韻，讀起來好聽。", action: "point", prop: { kind: "text", text: "光、香、長（押 ang 韻）", sub: "句尾字音相近＝押韻", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：從詩句找韻腳", caption: "「床前明月光，疑是地上霜」裡，哪兩個字押韻？", ask: { prompt: "「床前明月光，疑是地上霜」押韻的兩個字是？", options: ["光和霜", "光和月", "月和地", "前和是"], answer: 0, hint: "看句尾的字：光、霜音相近。" }, action: "think", prop: { kind: "text", text: "光 ↔ 霜（押韻）", sub: "句尾字音相近", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：認識偶句押韻", caption: "古詩常偶句押韻：「鋤禾日當午，汗滴禾下土…粒粒皆辛苦」，午、土、苦押韻。", action: "point", prop: { kind: "text", text: "午、土、苦（押 u 韻）", sub: "偶句尾字押韻", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：認識停頓讓節奏清楚", caption: "朗讀時要按語意停頓：床前／明月／光，停對地方節奏才清楚。", action: "walk", prop: { kind: "text", text: "床前／明月／光", sub: "依語意分句停頓", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：配合情緒調語氣", caption: "讀一首開心的小詩，和讀一首哀傷的小詩，語氣應該一樣嗎？", ask: { prompt: "朗讀時語氣應該怎麼配合？", options: ["都用最大聲", "配合詩的情绪調整", "念得越快越好", "每句都拖長"], answer: 1, hint: "詩有喜怒哀樂，語氣要跟著走。" }, action: "point", prop: { kind: "flow", steps: ["看詩的情绪", "決定快慢輕重", "表達出來"], active: 1 }, duration: 3800 },
    { id: 7, step: "步驟 7：把三招合在一起用", caption: "現在把三招合一：讀「床前明月光」，先找韻、再停頓，語氣該如何？", ask: { prompt: "朗讀「床前明月光」時，下列做法最恰當的是？", options: ["床前／明月／光，語氣平靜優美", "一口氣念完不停頓", "大聲吼叫", "越快越好"], answer: 0, hint: "先停頓分句，語氣配合詩的優美。" }, action: "think", prop: { kind: "flow", steps: ["找韻腳", "分停頓", "配語氣"], active: 2 }, duration: 3800 },
    { id: 8, step: "步驟 8：複習三個小重點", caption: "小整理：押韻讓順口、停頓讓清楚、語氣帶情緒，三者合一就是節奏。", action: "cheer", prop: { kind: "flow", steps: ["押韻", "停頓", "語氣"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關朗讀", caption: "口訣：尾字押韻順口、分句停頓清楚、語氣帶情。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-poem-rhythm-1", prompt: "詩歌中句尾字音相近，稱為？", options: ["對仗", "排比", "押韻", "擬人"], answer: 2, hints: ["句尾音相近才順口", "想想『光、霜』"], explanation: "句尾字音相近稱為押韻，讓詩歌讀來順口。" },
    { id: "el-chi-poem-rhythm-2", prompt: "「光、香、長」三者共同的韻是哪個？", options: ["an", "ong", "a", "ang"], answer: 3, hints: ["三個字後面都是 ang", "光 guang、香 xiang、長 chang"], explanation: "光、香、長都押 ang 韻，讀起來音韻相近。" },
    { id: "el-chi-poem-rhythm-3", prompt: "朗讀「床前／明月／光」時，斜線表示？", options: ["依語意停頓", "換氣", "該大聲", "該重複"], answer: 0, hints: ["分句是為了節奏清楚", "停對地方才好聽"], explanation: "斜線表示依語意分句停頓，讓朗讀節奏清楚。" },
    { id: "el-chi-poem-rhythm-4", prompt: "讀一首描寫歡樂生日會的詩，語氣應該？", options: ["低沉哀傷", "輕快活潑", "平淡無波", "急促緊張"], answer: 1, hints: ["內容歡樂，語氣跟著快樂", "配合詩的情绪"], explanation: "朗讀語氣要配合詩的情绪，歡樂的詩用輕快活潑的語氣。" },
    { id: "el-chi-poem-rhythm-5", prompt: "下列哪一句「沒有」押韻？", options: ["梅花朵朵開，蜜蜂陣陣來", "青山層層疊，白雲片片接", "貓在桌下睡，狗在門邊跑", "春風輕輕吹，柳枝慢慢垂"], answer: 2, hints: ["檢查每句句尾字音是否相近", "睡(shui)和跑(pao)音不近"], explanation: "『貓在桌下睡，狗在門邊跑』句尾『睡、跑』字音不相近，沒有押韻；前三句句尾都押韻。" },
    { id: "el-chi-poem-rhythm-6", prompt: "「鋤禾日當午，汗滴禾下土。誰知盤中餐，粒粒皆辛苦」中，押韻的字是？", options: ["午、禾、中", "滴、盤、粒", "知、下、皆", "午、土、苦"], answer: 3, hints: ["看偶句尾字", "午 wu、土 tu、苦 ku 音相近"], explanation: "午、土、苦都押 u 韻，是這首詩的韻腳；其他字不是句尾韻腳。" },
  ],
};

/* ===================== 國語 4：段落的總分總（五下） ===================== */
const EL_CHI_STRUCTURE: OnionLesson = {
  id: "el-chi-structure",
  title: "段落的總分總：文章的好骨架",
  subject: "國語",
  topic: "段落結構",
  grade: "五下",
  stages: ["國小"],
  desc: "總說開頭、分說舉例、總結收尾。洋蔥帶你用總分總把文章寫得有條理。",
  takeaways: ["開頭總說：點出主題", "中間分說：舉例或說明", "結尾總結：再回扣主題", "分說的例子要具體扣題，不能空泛重複總說"],
  frames: [
    { id: 1, step: "步驟 1：認識文章的骨架", caption: "嗨！寫文章像蓋房子，要有骨架才站得穩，最常用的就是總分總。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：開頭先總說點題", caption: "第一段先『總說』：用一句話告訴讀者這篇要講什麼，像是蓋地基。", action: "point", prop: { kind: "text", text: "總說：點出主題", sub: "開頭一句話定調", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：中間分說舉例", caption: "中間的『分說』應該做什麼？是用一大段還是舉例子？", ask: { prompt: "總分總的「分說」段落主要功能是？", options: ["舉例或說明來支持主題", "重複開頭", "寫結尾", "換新主題"], answer: 0, hint: "分說是用例子把總說講清楚。" }, action: "think", prop: { kind: "flow", steps: ["總說", "分說：舉例說明", "總結"], active: 1 }, duration: 3600 },
    { id: 4, step: "步驟 4：看分說怎麼舉例", caption: "例如總說『公園真熱鬧』，分說就寫：有人跑步、有人野餐、有人遛狗。", action: "walk", prop: { kind: "text", text: "分說：跑步＋野餐＋遛狗", sub: "用具體例子支持主題", tone: "ok" }, duration: 3400 },
    { id: 5, step: "步驟 5：分說要扣緊主題", caption: "分說的每個例子都要圍繞主題，不能東寫貓、西寫狗，偏題就鬆散了。", action: "point", prop: { kind: "balance", left: "扣主題：跑步/野餐/遛狗", right: "偏題：突然寫貓狗", tip: "例子要集中" }, duration: 3600 },
    { id: 6, step: "步驟 6：結尾總結收束", caption: "寫到最後，要用『總結』再回扣主題，下面哪句適合當結尾？", ask: { prompt: "總說寫『公園真熱鬧』，哪句適合當總結？", options: ["公園裡有人跑步", "公園果然是大家最愛的去處", "我喜歡安靜的圖書館", "明天要去買球"], answer: 1, hint: "總結要再扣回『熱鬧、喜愛』的主題。" }, action: "point", prop: { kind: "text", text: "總結：回扣主題", sub: "結尾再點一次", tone: "ok" }, duration: 3800 },
    { id: 7, step: "步驟 7：動手判斷段落", caption: "讀這段：「公園很熱鬧。爸爸在跑道慢跑，媽媽在樹下野餐，小狗追著皮球跑。」它屬於總分總的哪一部分？", ask: { prompt: "「公園很熱鬧。爸爸慢跑、媽媽野餐、小狗追球。」這段是總分總的？", options: ["分說", "總說", "總結", "標題"], answer: 0, hint: "有很多具體例子支持『熱鬧』。" }, action: "think", prop: { kind: "flow", steps: ["總說", "分說：舉例", "總結"], active: 1 }, duration: 3800 },
    { id: 8, step: "步驟 8：記住三段式順序", caption: "順序小整理：先總說定調、再分說舉例、最後總結回扣，三步不亂。", action: "cheer", prop: { kind: "flow", steps: ["總說", "分說", "總結"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關寫作", caption: "口訣：開頭總說、中間分說、結尾總結。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-structure-1", prompt: "總分總結構的開頭『總說』要做什麼？", options: ["舉很多例子", "寫結論", "點出文章主題", "描述細節"], answer: 2, hints: ["開頭先定調", "一句話說明要講什麼"], explanation: "總說在開頭點出主題，讓讀者知道文章方向。" },
    { id: "el-chi-structure-2", prompt: "總分總的中間『分說』主要做什麼？", options: ["重複總說", "換一個新題目", "寫結尾", "舉例或說明支持主題"], answer: 3, hints: ["用例子把主題講清楚", "分說是主體"], explanation: "分說用具體的例子或說明來支持、充實總說的主題。" },
    { id: "el-chi-structure-3", prompt: "要描寫『我的媽媽很辛苦』，分說可以寫？", options: ["媽媽早起做早餐、深夜還在加班", "再寫一次媽媽很辛苦", "換寫我的老師", "直接寫結尾"], answer: 0, hints: ["分說要舉具體例子", "用早起、加班來說明辛苦"], explanation: "分說應舉具體例子（早起做早餐、深夜加班）來說明媽媽的辛苦。" },
    { id: "el-chi-structure-4", prompt: "總結段落應該怎麼寫？", options: ["再舉新的例子", "回扣開頭的主題", "完全換主題", "越長越好"], answer: 1, hints: ["結尾要收束", "再點一次主題"], explanation: "總結要回扣開頭的主題，讓文章前後呼應、收束有力。" },
    { id: "el-chi-structure-5", prompt: "下列哪一段符合『總分總』？", options: ["只寫一大段例子", "開頭分說、結尾總說", "總說→分說→總結", "只有總說和總結"], answer: 2, hints: ["順序是總、分、總", "三段缺一不可"], explanation: "總分總是『總說→分說→總結』的順序，三者齊全才完整；其他都缺了某一段。" },
    { id: "el-chi-structure-6", prompt: "寫「我的校園很美麗」，下列哪一項最適合做分說的例子？", options: ["校園很美麗，校園真的很美", "我今天很快樂", "明天要考數學", "操場有椰林、花壇有玫瑰、圖書館有窗邊光"], answer: 3, hints: ["分說要具體、扣住『美麗』", "用操場、花壇、圖書館來呈現"], explanation: "分說要用具體且扣主題的例子（椰林、玫瑰、窗邊光），不能空泛重複『很美麗』或寫到別的事情。" },
  ],
};

/* ===================== 國語 5：書信與便條（四上） ===================== */
const EL_CHI_LETTER: OnionLesson = {
  id: "el-chi-letter",
  title: "書信與便條：寫給人的小紙條",
  subject: "國語",
  topic: "書信格式",
  grade: "四上",
  stages: ["國小"],
  desc: "稱謂頂格、問候空兩格、署名日期在右下。洋蔥帶你寫一封得體的信。",
  takeaways: ["稱謂頂格寫，後加冒號", "問候語空兩格另起", "署名和日期寫在右下角", "對不同對象，稱謂與祝賀語的用語要得體"],
  frames: [
    { id: 1, step: "步驟 1：認識書信的格式", caption: "嗨！寫信有固定格式，就像穿衣服有順序，亂放會顯得沒禮貌喔。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：開頭寫稱謂", caption: "第一行頂格寫稱謂，例如「親愛的媽媽：」，後面加冒號，不能縮排。", action: "point", prop: { kind: "text", text: "親愛的媽媽：", sub: "稱謂頂格＋冒號", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：第二行寫問候", caption: "稱謂之後，接下來通常先寫什麼？", ask: { prompt: "書信中稱謂寫完，下一個通常是？", options: ["問候語（如：您好）", "署名", "日期", "地址"], answer: 0, hint: "先打招呼、問候對方。" }, action: "think", prop: { kind: "text", text: "您好！", sub: "問候語空兩格", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：正文空兩格開始寫", caption: "問候之後，正文要空兩格再開始寫，說明你想告訴對方的話。", action: "walk", prop: { kind: "text", text: "  正文從這裡開始", sub: "正文空兩格", tone: "ok" }, duration: 3400 },
    { id: 5, step: "步驟 5：信末寫祝賀語", caption: "正文結束後，可另起一行寫祝賀語：「祝　身體健康」，再換行署名。", action: "point", prop: { kind: "text", text: "祝　身體健康", sub: "祝賀語另起一行", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：右下角署名與日期", caption: "寫完信，名字和日期要放在哪裡才合禮貌？", ask: { prompt: "書信的署名和日期應該寫在？", options: ["左上角", "右下角", "中間", "不用寫"], answer: 1, hint: "署名日期靠右、在結尾下方。" }, action: "point", prop: { kind: "balance", left: "右上？錯", right: "右下 ✓ 署名＋日期", tip: "靠右對齊" }, duration: 3800 },
    { id: 7, step: "步驟 7：動手檢查格式", caption: "小明把「小華　5月20日」寫在信的最左上方，這哪裡不對？", ask: { prompt: "署名和日期寫在左上方，主要問題是？", options: ["位置不對，應在右下角", "字寫太小", "日期應在稱謂後", "不能寫日期"], answer: 0, hint: "署名日期習慣靠右、在結尾下方。" }, action: "think", prop: { kind: "balance", left: "左上：不符合習慣", right: "右下：得體", tip: "靠右對齊" }, duration: 3800 },
    { id: 8, step: "步驟 8：便條更簡短隨意", caption: "便條比書信短：寫給誰、說什麼、是誰留的，三樣就好，不必太正式。", action: "cheer", prop: { kind: "flow", steps: ["寫給誰", "說什麼", "留條人"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關寫信", caption: "口訣：稱謂頂格、問候空格、署名日期在右下。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-letter-1", prompt: "書信第一行的稱謂應該怎麼寫？", options: ["空兩格寫", "寫在中間", "頂格寫並加冒號", "不用寫稱謂"], answer: 2, hints: ["稱謂要頂格", "後面加冒號"], explanation: "稱謂頂格書寫，後接冒號（如『親愛的媽媽：』）。" },
    { id: "el-chi-letter-2", prompt: "書信的問候語（如『您好』）應該？", options: ["頂格寫", "寫在最後", "不用問候", "空兩格後另起"], answer: 3, hints: ["問候在稱謂下一行", "縮格兩格較有禮"], explanation: "問候語在稱謂下一行，空兩格後書寫。" },
    { id: "el-chi-letter-3", prompt: "正文開始前應該？", options: ["空兩格再寫", "頂格寫", "寫在右下", "寫日期"], answer: 0, hints: ["正文也要縮格", "空兩格才整齊"], explanation: "正文從稱謂、問候之後，空兩格開始書寫。" },
    { id: "el-chi-letter-4", prompt: "下列哪個書信格式正確？", options: ["署名寫在左上", "日期和署名在右下", "稱謂寫在正中間", "問候語頂格"], answer: 1, hints: ["署名日期靠右", "在結尾下方"], explanation: "署名和日期應寫在右下角（結尾下方靠右），其餘寫法都錯。" },
    { id: "el-chi-letter-5", prompt: "便條和書信最大的不同是？", options: ["便條不用稱謂", "便條不能寫日期", "便條較簡短隨意", "便條要很正式"], answer: 2, hints: ["便條是短訊息", "三樣就夠：對象、內容、留條人"], explanation: "便條比書信簡短隨意，只要寫對象、內容、留條人即可，不必像書信那麼正式。" },
    { id: "el-chi-letter-6", prompt: "寫信給老師時，正文結束後最適合加哪一句祝賀語？", options: ["再見啦", "無所謂", "明天見", "祝　教安"], answer: 3, hints: ["祝賀語另起一行", "對老師可用『教安』一類敬語"], explanation: "信末可另起一行寫得體的祝賀語，對老師用『祝　教安』；『再見』『明天見』屬口語，不適合正式書信結尾。" },
  ],
};

/* ===================== 國語 6：形近字與錯別字（三下） ===================== */
const EL_CHI_TYPO: OnionLesson = {
  id: "el-chi-typo",
  title: "形近字與錯別字：看部首認清楚",
  subject: "國語",
  topic: "字形辨識",
  grade: "三下",
  stages: ["國小"],
  desc: "己已巳長很像？用部首和字義來分辨，洋蔥帶你不再寫錯字。",
  takeaways: ["形近字靠部首辨意思", "錯別字多半是同音或形近混淆", "查字典確認最保險", "同一個部件會牽動字義，先想部首再下筆"],
  frames: [
    { id: 1, step: "步驟 1：認識形近字", caption: "嗨！「己、已、巳」三個字長得好像，寫錯就鬧笑話，今天學分辨。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：用部首差異分辨", caption: "「己」開口、「已」半關、「巳」全關，看那個小開口就能分清楚。", action: "point", prop: { kind: "text", text: "己(開) 已(半) 巳(全)", sub: "看開口大小分辨", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：再看一組形近字", caption: "「烏」和「鳥」差一點：烏鴉全身黑得看不見眼睛，所以「烏」沒有那一點。", action: "point", prop: { kind: "balance", left: "烏：無那一點", right: "鳥：有眼睛（點）", tip: "差一點意思不同" }, duration: 3600 },
    { id: 4, step: "步驟 4：從字義記形近字", caption: "「休息」的「休」是人和木，那「體育」的「體」該看哪個部分？", ask: { prompt: "要分辨「休」和「體」，最好看什麼？", options: ["部首與部件", "讀音", "筆畫數", "隨便猜"], answer: 0, hint: "兩者部件不同，看偏旁最準。" }, action: "think", prop: { kind: "text", text: "休：亻＋木　體：骨＋豊", sub: "部件不同意思不同", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：認識常見錯別字", caption: "錯別字常因同音混淆：把「再見」寫成「在見」，音同字不同就錯了。", action: "walk", prop: { kind: "text", text: "再見 ≠ 在見", sub: "同音字要分清楚", tone: "warn" }, duration: 3400 },
    { id: 6, step: "步驟 6：對照正確與錯誤", caption: "下列哪一組是正確的寫法？", ask: { prompt: "下列哪一個沒有錯別字？", options: ["在見", "再見", "己經", "巳經"], answer: 1, hint: "再見的『再』是又一次的再。" }, action: "point", prop: { kind: "balance", left: "再見 ✓", right: "在見 ✗ 同音混淆", tip: "音同字不同" }, duration: 3800 },
    { id: 7, step: "步驟 7：動手找出錯字", caption: "「我己經把功課做完了」這句裡，哪個字最容易寫錯？", ask: { prompt: "「我己經把功課做完了」哪裡寫錯了？", options: ["己經應為已經", "我", "功課", "做完"], answer: 0, hint: "『已經』的已是半關的已，不是自己的己。" }, action: "think", prop: { kind: "text", text: "已經 ✓　己經 ✗", sub: "形近別混淆", tone: "warn" }, duration: 3800 },
    { id: 8, step: "步驟 8：三招防寫錯", caption: "防錯三招：看部首、想字義、音同要小心，拿不準就查字典最可靠。", action: "cheer", prop: { kind: "flow", steps: ["看部首", "想字義", "音同要小心"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關辨字", caption: "口訣：形近看部首、同音想字義，查字典最穩。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-typo-1", prompt: "分辨「己、已、巳」可以看什麼？", options: ["讀音高低", "筆順", "開口的大小", "顏色"], answer: 2, hints: ["看那個小開口", "己開、已半、巳全"], explanation: "三個字形近，靠開口大小分辨：己開口、已半關、巳全關。" },
    { id: "el-chi-typo-2", prompt: "「休」字由哪兩個部件組成？", options: ["亻＋體", "木＋禾", "骨＋豊", "亻＋木"], answer: 3, hints: ["人靠在樹旁休息", "亻是單人旁"], explanation: "休＝亻（人）＋木（樹），表示人倚樹休息。" },
    { id: "el-chi-typo-3", prompt: "「再見」常被誤寫成「在見」，這是哪一種錯誤？", options: ["同音字混淆", "形近字錯", "部首錯", "筆畫錯"], answer: 0, hints: ["再、在同音", "音同字不同"], explanation: "再、在讀音相同但意思不同，屬同音字混淆造成的錯別字。" },
    { id: "el-chi-typo-4", prompt: "「我已經吃完飯了」的「已」表示？", options: ["自己", "已經、已經發生", "地支", "時間"], answer: 1, hints: ["已經是已經做完", "不是自己的己"], explanation: "句中的『已』是『已經』，表示事情已發生，不是『自己』的己。" },
    { id: "el-chi-typo-5", prompt: "下列哪一句完全沒有錯別字？", options: ["他己經回家了", "我們在見吧", "我已經寫完功課了", "請你休息一下"], answer: 2, hints: ["檢查每句的形近／同音字", "已經的已、寫完都對"], explanation: "只有『我已經寫完功課了』正確；其餘『己經、在見、休息』都是錯別字。" },
    { id: "el-chi-typo-6", prompt: "「烏鴉」的「烏」和「小鳥」的「鳥」，分辨的關鍵是？", options: ["筆畫總數", "讀音高低", "寫得快慢", "有沒有中間那一點（眼睛）"], answer: 3, hints: ["烏鴉黑到看不見眼", "『鳥』有眼睛那一點"], explanation: "『烏』沒有那一點（黑得看不見眼），『鳥』有眼睛那一點；靠有無一點分辨這組形近字。" },
  ],
};

/* ===================== 國語 7：找出文章主旨（六上） ===================== */
const EL_CHI_MAIN_IDEA: OnionLesson = {
  id: "el-chi-main-idea",
  title: "找出文章主旨：文章的靈魂",
  subject: "國語",
  topic: "閱讀理解",
  grade: "六上",
  stages: ["國小"],
  desc: "主旨藏在關鍵句和重複的概念裡。洋蔥教你三步抓出文章在講什麼。",
  takeaways: ["看開頭結尾的關鍵句", "留意重複出現的概念", "用自己的話歸納主旨", "主旨要能涵蓋全文，不能只抓住單一段細節"],
  frames: [
    { id: 1, step: "步驟 1：什麼是文章主旨", caption: "嗨！每篇文章都有一個『靈魂』，就是作者最想告訴你的事——主旨。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：從關鍵句找主旨", caption: "很多文章把主旨藏在開頭或結尾的關鍵句，一眼就能抓到重點。", action: "point", prop: { kind: "text", text: "關鍵句：開頭 or 結尾", sub: "作者直接說的重點", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：從標題猜主旨", caption: "標題常直接透露主旨：題目叫『愛護水資源』，主旨多半和節約用水有關。", action: "point", prop: { kind: "text", text: "標題 → 暗示主旨", sub: "先看題目有幫助", tone: "ok" }, duration: 3400 },
    { id: 4, step: "步驟 4：抓重複出現的概念", caption: "如果全文一直提到『環保、節約、愛地球』，主旨最可能和什麼有關？", ask: { prompt: "文章反覆出現『環保、節約、愛地球』，主旨應該是？", options: ["環境保護的重要", "怎麼煮菜", "如何養貓", "星座運勢"], answer: 0, hint: "重複出現的詞就是文章重心。" }, action: "think", prop: { kind: "flow", steps: ["找關鍵句", "圈重複概念", "歸納主旨"], active: 1 }, duration: 3600 },
    { id: 5, step: "步驟 5：把內容串起來想", caption: "讀完後問自己：這篇主要在說什麼？用一句話說出來就是主旨。", action: "walk", prop: { kind: "text", text: "用一句話說出重點", sub: "自己歸納主旨", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：避開細節陷阱", caption: "找主旨時，下列哪一項最容易讓你誤判？", ask: { prompt: "找主旨時，下面哪個容易誤導你？", options: ["開頭的關鍵句", "某個有趣的細節", "結尾的總結", "重複的概念"], answer: 1, hint: "細節只是例子，不是全部重點。" }, action: "point", prop: { kind: "text", text: "細節 ≠ 主旨", sub: "例子只是支持，不是主題", tone: "warn" }, duration: 3800 },
    { id: 7, step: "步驟 7：動手歸納主旨", caption: "短文：「這株小樹淋雨、被風吹，卻還是挺直身子長大。它告訴我們要勇敢面對困難。」主旨是？", ask: { prompt: "這段短文的主旨最接近？", options: ["人要像小樹一樣勇敢堅強", "種樹的方法", "天氣很壞", "小樹會淋雨"], answer: 0, hint: "最後一句點出『勇敢面對困難』。" }, action: "think", prop: { kind: "text", text: "主旨：勇敢面對困難", sub: "關鍵句在結尾", tone: "ok" }, duration: 3800 },
    { id: 8, step: "步驟 8：三步抓主旨複習", caption: "小整理：一看關鍵句、二圈重複詞、三用自己的話歸納，主旨就現形。", action: "cheer", prop: { kind: "flow", steps: ["看關鍵句", "圈重複詞", "自己歸納"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關閱讀", caption: "口訣：關鍵句、重複詞、自己歸納，主旨抓得準。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-main-idea-1", prompt: "文章主旨指的是？", options: ["最有趣的細節", "最少出現的詞", "作者最想表達的重點", "標題本身"], answer: 2, hints: ["是文章的核心", "像靈魂一樣貫穿全文"], explanation: "主旨是作者最想傳達的核心重點，貫穿整篇文章。" },
    { id: "el-chi-main-idea-2", prompt: "關鍵句常出現在文章的哪裡？", options: ["只在中間", "只在插圖裡", "隨處都有", "開頭或結尾"], answer: 3, hints: ["作者常在首尾點題", "首尾最常直接說重點"], explanation: "關鍵句多藏在文章開頭或結尾，作者會在那裡直接點出主旨。" },
    { id: "el-chi-main-idea-3", prompt: "一篇文反覆提到『誠實、信任、說實話』，主旨可能是？", options: ["誠實的重要", "怎麼釣魚", "如何搭車", "天氣預報"], answer: 0, hints: ["重複詞是文章重心", "誠實被強調"], explanation: "重複出現的『誠實、信任』指向文章在談誠實的重要。" },
    { id: "el-chi-main-idea-4", prompt: "找主旨時，有趣的細節應該？", options: ["當成主旨", "當成支持主旨的例子", "完全不看", "放在標題"], answer: 1, hints: ["細節是例子不是主題", "用來支持主旨"], explanation: "細節是用來支持主旨的例子，不能把單一細節當成整篇主旨。" },
    { id: "el-chi-main-idea-5", prompt: "下列哪一項是抓主旨最好的做法？", options: ["只讀第一句", "挑最長的段落", "讀完用一句話歸納重點", "找最少出現的詞"], answer: 2, hints: ["自己歸納最準", "結合關鍵句與重複詞"], explanation: "讀完後用自己的話用一句話歸納，並結合關鍵句與重複概念，才是最穩的抓主旨方法。" },
    { id: "el-chi-main-idea-6", prompt: "讀完一篇名為《節省每一滴水》的文章，下列哪一項最可能是主旨？", options: ["怎樣種玫瑰花", "今天的天氣", "小明喜歡釣魚", "節約用水、愛護水資源"], answer: 3, hints: ["標題已透露主旨", "扣住『節省、水』"], explanation: "標題《節省每一滴水》直接暗示主旨是節約用水、愛護水資源；其他選項和主題無關。" },
  ],
};

/* ===================== 國語 8：引號的用法（五下） ===================== */
const EL_CHI_QUOTATION: OnionLesson = {
  id: "el-chi-quotation",
  title: "引號的用法：把話圈起來",
  subject: "國語",
  topic: "標點：引號",
  grade: "五下",
  stages: ["國小"],
  desc: "引號用來標示別人說的話和特別指稱。洋蔥用對照卡帶你用對引號。",
  takeaways: ["引號「」標示引用他人話語", "引號也標示特別或反諷的詞", "引號內的標點照原句保留", "書名、篇名用《》書名號，不可用「」引號"],
  frames: [
    { id: 1, step: "步驟 1：認識引號", caption: "嗨！看到「」這對小鉤子了嗎？它叫引號，專門把某些話或詞圈起來。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：引號標示引用的話", caption: "當你寫別人說的話，要加引號：媽媽說「快去寫功課」，這句就圈起來。", action: "point", prop: { kind: "text", text: "媽媽說「快去寫功課」", sub: "引號標示他人話語", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：引號和書名號別搞混", caption: "書名、文章名要用書名號《》：我讀《西遊記》；「」是引號，別拿來標書名。", action: "point", prop: { kind: "balance", left: "引號「」：話語／特別詞", right: "書名號《》：書名篇名", tip: "兩者不可混用" }, duration: 3600 },
    { id: 4, step: "步驟 4：分辨引用用法", caption: "下面哪一句的引號是用來引用別人說的話？", ask: { prompt: "下列哪一句的引號用於「引用話語」？", options: ["老師說「明天考試」", "他真是個「天才」", "這是一隻「貓」", "「蘋果」很好吃"], answer: 0, hint: "找『某人說＋引號內的話』。" }, action: "think", prop: { kind: "text", text: "老師說「明天考試」", sub: "引號＝引用他人話語", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：引號標示特別指稱", caption: "引號也能標示特別說法或反諷：他這個「好學生」其實常遲到，這裡是反諷。", action: "walk", prop: { kind: "text", text: "他這個「好學生」常遲到", sub: "引號＝特別／反諷指稱", tone: "warn" }, duration: 3400 },
    { id: 6, step: "步驟 6：對照兩種用法", caption: "「小心那個『朋友』」裡的引號，屬於哪種用法？", ask: { prompt: "「小心那個『朋友』」的引號是？", options: ["引用話語", "特別／反諷指稱", "書名號", "沒有用處"], answer: 1, hint: "不是某人說的話，是特別強調或反諷。" }, action: "point", prop: { kind: "balance", left: "引用話語：某人說…", right: "特別指稱：強調／反諷", tip: "這裡是反諷" }, duration: 3800 },
    { id: 7, step: "步驟 7：判斷引號是否多餘", caption: "下列哪一句根本不需要加引號？", ask: { prompt: "哪一句的引號是多餘的？", options: ["桌上放了「蘋果」和果汁", "媽媽說「早點睡」", "他是大家公認的「傻瓜」", "他這個「高手」其實常出包"], answer: 0, hint: "普通名詞不需要圈起來。" }, action: "think", prop: { kind: "text", text: "普通名詞不必加引號", sub: "只有引用或強調才用", tone: "warn" }, duration: 3800 },
    { id: 8, step: "步驟 8：引號內標點要保留", caption: "小提醒：引號裡若原本有問號或驚嘆號，要照原句留在引號內，別丟掉。", action: "cheer", prop: { kind: "text", text: "他問「你去嗎？」", sub: "引號內的標點照留", tone: "ok" }, duration: 3400 },
    { id: 9, step: "步驟 9：準備闖關用引號", caption: "口訣：別人說的話、特別的詞，圈上引號不會錯。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-chi-quotation-1", prompt: "引號「」最主要用來做什麼？", options: ["標示書名", "當作逗號", "標示引用話語或特別指稱", "標示數字"], answer: 2, hints: ["小鉤子把話圈起來", "引用或特別指稱"], explanation: "引號用來標示他人說的話，或特別、反諷的指稱。" },
    { id: "el-chi-quotation-2", prompt: "「老師說『下課了』」的引號是在？", options: ["標示書名", "標示數字", "強調名詞", "引用老師說的話"], answer: 3, hints: ["是老師說的話", "圈起來表示引用"], explanation: "這裡引號標示老師說的話『下課了』，屬於引用話語。" },
    { id: "el-chi-quotation-3", prompt: "「他真是個『好人』，把別人的東西都拿走了」的引號是？", options: ["特別／反諷指稱", "引用話語", "書名號", "沒意義"], answer: 0, hints: ["不是真的好人，是反話", "強調相反意思"], explanation: "這裡用引號表示反諷，『好人』其實是反話，屬特別指稱。" },
    { id: "el-chi-quotation-4", prompt: "引號內原本有問號時，應該？", options: ["刪掉問號", "照原句留在引號內", "改成句號", "移到引號外"], answer: 1, hints: ["引號內標點照留", "保持原句語氣"], explanation: "引號內原有的標點（如問號）應照原句保留在引號內。" },
    { id: "el-chi-quotation-5", prompt: "下列哪一句的引號用法正確？", options: ["「天空」是藍色的", "這本書叫「小說」很好看", "他說「我今天很快樂」", "他買了「三」蘋果"], answer: 2, hints: ["檢查是否為引用話語或特別指稱", "第一句是引用說的話"], explanation: "第一句引號正確標示引用的話；其他把普通名詞（天空、小說、三）不當地加上引號，用法不當。" },
    { id: "el-chi-quotation-6", prompt: "要標示一本書的名字，應該使用？", options: ["引號「」", "括號（）", "頓號、", "書名號《》"], answer: 3, hints: ["書名篇名用書名號", "《》才是書名號"], explanation: "書名、文章名用書名號《》（如《西遊記》）；引號「」用於引用話語或特別指稱，不可拿來標書名。" },
  ],
};

/* ===================== 英語 1：字母與自然發音（三上） ===================== */
const EL_ENG_PHONICS: OnionLesson = {
  id: "el-eng-phonics",
  title: "字母與自然發音：聽音拼字",
  subject: "英語",
  topic: "自然發音",
  grade: "三上",
  stages: ["國小"],
  desc: "字母都有常見發音，a 像 apple、b 像 ball。洋蔥帶你聽音拼字，自然發音輕鬆學。",
  takeaways: ["字母有對應的常見發音", "母音 a e i o u 是發音中心", "聽音節就能猜怎麼拼", "拼字時先找母音，再把前後子音連起來"],
  frames: [
    { id: 1, step: "步驟 1：認識字母和發音", caption: "嗨！英文每個字母都有它的聲音，學會發音就能聽音拼字喔。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：看字母對應的詞", caption: "A 的聲音像 apple（蘋果），B 像 ball（球），字母和詞連起來記最牢。", action: "point", prop: { kind: "text", text: "A — apple　B — ball", sub: "字母對應開頭音", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：聽音找字母", caption: "聽到 /æ/ 這個音（像 apple），你覺得是哪個字母開頭？", ask: { prompt: "The sound /æ/ in 'apple' is the sound of which letter?", options: ["A", "B", "C", "D"], answer: 0, hint: "apple 的開頭字母就是 A。" }, action: "think", prop: { kind: "text", text: "A says /æ/ as in apple", sub: "聽音找字母", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：母音是發音中心", caption: "a、e、i、o、u 五個母音是發音的中心，幾乎每個字都少不了它們。", action: "walk", prop: { kind: "text", text: "a e i o u（母音）", sub: "每個字都有母音", tone: "ok" }, duration: 3400 },
    { id: 5, step: "步驟 5：拼出簡單字", caption: "把 c、a、t 三個音連起來，會拼出哪個你熟悉的字？", ask: { prompt: "What word do the sounds /k/ /æ/ /t/ make?", options: ["cap", "cat", "cut", "cot"], answer: 1, hint: "c-a-t 連起來就是貓。" }, action: "point", prop: { kind: "flow", steps: ["/k/", "/æ/", "/t/ → cat"], active: 2 }, duration: 3800 },
    { id: 6, step: "步驟 6：多拼幾個字", caption: "換個字試試：p-e-n 是 pen（鋼筆），h-e-n 是 hen（母雞），母音 e 都唸短音。", action: "point", prop: { kind: "balance", left: "pen：鋼筆", right: "hen：母雞", tip: "e 唸 /e/" }, duration: 3600 },
    { id: 7, step: "步驟 7：動手拼一個新字", caption: "那 /b/ /e/ /d/ 會拼成哪個字？", ask: { prompt: "What word do /b/ /e/ /d/ make?", options: ["bed", "bad", "big", "bus"], answer: 0, hint: "b-e-d 連起來是床。" }, action: "think", prop: { kind: "flow", steps: ["/b/", "/e/", "/d/ → bed"], active: 2 }, duration: 3800 },
    { id: 8, step: "步驟 8：記住發音口訣", caption: "小口訣：字母有聲音、母音當中心，聽音拼字不再死背。", action: "cheer", prop: { kind: "flow", steps: ["字母有聲音", "母音是中心", "聽音拼字"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關拼讀", caption: "口訣：聽音找字母、母音當中心，自然發音起步囉。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-eng-phonics-1", prompt: "Which letter makes the sound /æ/ in 'apple'?", options: ["B", "E", "A", "O"], answer: 2, hints: ["apple 開頭是 a", "a 發 /æ/"], explanation: "/æ/ 是字母 A 的常見發音，apple 以 A 開頭。" },
    { id: "el-eng-phonics-2", prompt: "How many vowels are there in English?", options: ["3", "21", "26", "5"], answer: 3, hints: ["母音是 a e i o u", "數數看這五個"], explanation: "英文有五個母音：a、e、i、o、u。" },
    { id: "el-eng-phonics-3", prompt: "What word is made by /k/ /æ/ /t/?", options: ["cat", "dog", "sun", "red"], answer: 0, hints: ["c-a-t 連起來", "意思是貓"], explanation: "三個音 /k/ /æ/ /t/ 拼起來是 cat（貓）。" },
    { id: "el-eng-phonics-4", prompt: "Which word begins with the sound /b/?", options: ["apple", "ball", "cat", "egg"], answer: 1, hints: ["ball 開頭是 b", "b 發 /b/"], explanation: "ball 以 B 開頭，發 /b/ 音；其他分別以 a、c、e 開頭。" },
    { id: "el-eng-phonics-5", prompt: "Which group has ALL vowels?", options: ["a, b, c", "b, c, d, f", "a, e, i, o, u", "x, y, z"], answer: 2, hints: ["母音只有 a e i o u", "其他是子音"], explanation: "五個母音是 a、e、i、o、u；選項一才是完整的母音組，其餘含子音。" },
    { id: "el-eng-phonics-6", prompt: "What word is made by /p/ /e/ /n/?", options: ["pin", "pan", "put", "pen"], answer: 3, hints: ["p-e-n 連起來", "意思是鋼筆"], explanation: "三個音 /p/ /e/ /n/ 拼起來是 pen（鋼筆）。" },
  ],
};

/* ===================== 英語 2：問候與自我介紹（三上） ===================== */
const EL_ENG_GREETING: OnionLesson = {
  id: "el-eng-greeting",
  title: "問候與自我介紹：說 Hello",
  subject: "英語",
  topic: "日常問候",
  grade: "三上",
  stages: ["國小"],
  desc: "Hello! 怎麼打招呼、介紹自己？洋蔥帶你學 Hello / My name is / Nice to meet you。",
  takeaways: ["Hello / Hi 用來打招呼", "My name is… 介紹自己", "Nice to meet you 初次見面", "初次見面先打招呼、再報名字，最後說客氣話"],
  frames: [
    { id: 1, step: "步驟 1：學會開口打招呼", caption: "嗨！見面第一句話最重要，英文用 Hello 或 Hi 來打招呼。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：介紹自己的名字", caption: "想讓人認識你，就說 My name is Onion.（我的名字是洋蔥。）", action: "point", prop: { kind: "text", text: "My name is Onion.", sub: "介紹自己的名字", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：學另一組問候", caption: "想關心對方，可以說 How are you?（你好嗎？），別人常回 I'm fine, thank you.（我很好，謝謝。）", action: "point", prop: { kind: "text", text: "How are you? → I'm fine, thank you.", sub: "日常關心問候", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：練習問名字", caption: "如果你想問對方叫什麼名字，下面哪句最合適？", ask: { prompt: "Which question asks someone's name?", options: ["What is your name?", "How are you?", "My name is Tom.", "Nice to meet you."], answer: 0, hint: "問名字用 What is your name?" }, action: "think", prop: { kind: "text", text: "What is your name?", sub: "詢問對方名字", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：初次見面的客氣話", caption: "認識新朋友時說 Nice to meet you.（很高興認識你。）很有禮貌。", action: "walk", prop: { kind: "text", text: "Nice to meet you.", sub: "初次見面客氣話", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：對應回答練習", caption: "別人說 Nice to meet you，你該怎麼回禮貌？", ask: { prompt: "How do you reply to 'Nice to meet you'?", options: ["Goodbye.", "Nice to meet you, too.", "Thank you.", "My name is Ann."], answer: 1, hint: "回 too 表示『我也很高興』。" }, action: "point", prop: { kind: "flow", steps: ["Nice to meet you.", "→ Nice to meet you, too.", "打招呼完成"], active: 1 }, duration: 3800 },
    { id: 7, step: "步驟 7：動手選第一句話", caption: "你在迎新活動遇到新朋友，第一句最適合說？", ask: { prompt: "You meet a new friend on the first day. What do you say first?", options: ["Nice to meet you!", "What time is it?", "Goodbye!", "I am ten."], answer: 0, hint: "初次見面先打招呼、說很高興認識你。" }, action: "think", prop: { kind: "flow", steps: ["先打招呼", "報名字", "Nice to meet you"], active: 0 }, duration: 3800 },
    { id: 8, step: "步驟 8：整理三句常用語", caption: "小整理：Hello 打招呼、My name is 介紹、Nice to meet you 見面禮貌。", action: "cheer", prop: { kind: "flow", steps: ["Hello", "My name is…", "Nice to meet you"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關開口說", caption: "口訣：Hello 打招呼、My name is 報名字、Nice to meet you 有禮貌。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-eng-greeting-1", prompt: "How do you say 'hello' to a friend?", options: ["Goodbye", "Sorry", "Hello", "Thanks"], answer: 2, hints: ["見面打招呼用 hello", "再見才用 goodbye"], explanation: "Hello 是常見的打招呼用語；Goodbye 是再見。" },
    { id: "el-eng-greeting-2", prompt: "To tell your name, you say:", options: ["How are you?", "What is this?", "Nice to meet you.", "My name is Ann."], answer: 3, hints: ["My name is… 用來介紹自己", "後面接你的名字"], explanation: "My name is… 用來介紹自己的名字，後面接名字。" },
    { id: "el-eng-greeting-3", prompt: "When you meet someone new, you can say:", options: ["Nice to meet you.", "See you.", "I am a cat.", "What is this?"], answer: 0, hints: ["初次見面用這句", "表示很高興認識"], explanation: "初次見面時說 Nice to meet you（很高興認識你）很有禮貌。" },
    { id: "el-eng-greeting-4", prompt: "Which is the polite reply to 'Nice to meet you'?", options: ["Bye bye.", "Nice to meet you, too.", "No, thanks.", "My name is Tom."], answer: 1, hints: ["回 too 表示我也一樣", "我也很高興認識你"], explanation: "回 Nice to meet you, too. 表示『我也很高興認識你』。" },
    { id: "el-eng-greeting-5", prompt: "Which sentence is NOT a greeting?", options: ["Hello!", "Hi!", "Goodbye!", "My name is Ben."], answer: 2, hints: ["Goodbye 是再見不是打招呼", "其他都用於見面"], explanation: "Goodbye 是道別語，不是問候；Hello、Hi、My name is 都用於見面交流。" },
    { id: "el-eng-greeting-6", prompt: "Someone says 'How are you?' You can answer:", options: ["Goodbye.", "What is your name?", "See you.", "I'm fine, thank you."], answer: 3, hints: ["How are you 問你好嗎", "回答 I'm fine 並道謝"], explanation: "別人問 How are you?（你好嗎），常用 I'm fine, thank you.（我很好，謝謝。）回應。" },
  ],
};

/* ===================== 英語 3：數字與年齡（三下） ===================== */
const EL_ENG_NUMBERS: OnionLesson = {
  id: "el-eng-numbers",
  title: "數字與年齡：數到二十",
  subject: "英語",
  topic: "數字與年齡",
  grade: "三下",
  stages: ["國小"],
  desc: "one 到 twenty 怎麼數？How old are you 問年齡。洋蔥帶你數數又問年齡。",
  takeaways: ["數字 one 到 twenty 要會數", "How old are you? 問年齡", "回答用 I am … years old", "十幾 -teen 和幾十 -ty 結尾不同，念清楚才不會弄錯"],
  frames: [
    { id: 1, step: "步驟 1：數字從 one 開始", caption: "嗨！我們先從 1 數到 10：one、two、three、four、five、six、seven、eight、nine、ten。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：認識十以上的數", caption: "再往上：eleven、twelve、thirteen… 到 twenty（20）是一個重要的關卡。", action: "point", prop: { kind: "text", text: "… fifteen, twenty", sub: "10 以上到 20", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：注意 eleven 和 twelve", caption: "eleven（11）和 twelve（12）是特殊說法，要另外記；thirteen 到 nineteen 都以 -teen 結尾。", action: "point", prop: { kind: "text", text: "eleven, twelve 特殊", sub: "13–19 都 -teen 結尾", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：用長條圖看數量", caption: "我們把數量畫成長條：1、5、10、20 各有幾個點？圖上最長的是哪一個？", ask: { prompt: "Which number is the largest: 1, 5, 10, or 20?", options: ["20", "1", "5", "10"], answer: 0, hint: "二十是這些數裡最大的。" }, action: "think", prop: { kind: "bars", items: [{ label: "1", value: 1 }, { label: "5", value: 5 }, { label: "10", value: 10 }, { label: "20", value: 20 }], unit: "個", active: 3 }, duration: 3600 },
    { id: 5, step: "步驟 5：學會問年齡", caption: "想知道朋友幾歲，就問 How old are you?（你幾歲？）很有用的一句。", action: "walk", prop: { kind: "text", text: "How old are you?", sub: "詢問年齡", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：練習回答年齡", caption: "如果有人問你 How old are you，你八歲該怎麼回答？", ask: { prompt: "You are 8 years old. How do you answer?", options: ["I am 80 years old.", "I am 8 years old.", "How old are you?", "I am a boy."], answer: 1, hint: "用 I am… years old 說出年齡。" }, action: "point", prop: { kind: "text", text: "I am 8 years old.", sub: "回答自己的年齡", tone: "ok" }, duration: 3800 },
    { id: 7, step: "步驟 7：比較兩個年齡", caption: "你八歲，朋友十歲，你比他大還是小？", ask: { prompt: "Your friend is 10. Are you older or younger than him if you are 8?", options: ["我比較小", "我比較大", "一樣大", "不知道"], answer: 0, hint: "8 < 10，所以你比較小。" }, action: "think", prop: { kind: "bars", items: [{ label: "我(8)", value: 8 }, { label: "朋友(10)", value: 10 }], unit: "歲", active: 0 }, duration: 3800 },
    { id: 8, step: "步驟 8：數字與年齡小整理", caption: "小整理：one 到 twenty 會數，How old are you 會問、I am N years old 會答。", action: "cheer", prop: { kind: "flow", steps: ["數 1–20", "問年齡", "答年齡"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關數數", caption: "口訣：one 到 twenty 順口數，How old are you 問年齡。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-eng-numbers-1", prompt: "What comes after 'five'?", options: ["four", "ten", "six", "three"], answer: 2, hints: ["five 之後是 six", "5 的下一個是 6"], explanation: "five（5）之後是 six（6）。" },
    { id: "el-eng-numbers-2", prompt: "How do you ask someone's age?", options: ["What is your name?", "How are you?", "What is this?", "How old are you?"], answer: 3, hints: ["問年齡用 How old", "old 是『老／年紀』"], explanation: "How old are you? 用來詢問對方的年齡。" },
    { id: "el-eng-numbers-3", prompt: "You are 7 years old. You answer:", options: ["I am 7 years old.", "I am 17 years old.", "How old are you?", "I am seven boy."], answer: 0, hints: ["用 I am… years old", "把 7 放進去"], explanation: "七歲回答 I am 7 years old." },
    { id: "el-eng-numbers-4", prompt: "Which number is 'twenty'?", options: ["12", "20", "2", "22"], answer: 1, hints: ["twenty 是 20", "十的兩倍"], explanation: "twenty 表示 20。" },
    { id: "el-eng-numbers-5", prompt: "Which is the correct order from small to large?", options: ["ten, five, one", "twenty, ten, one", "one, ten, twenty", "five, twenty, one"], answer: 2, hints: ["從小排到大", "1 < 10 < 20"], explanation: "由小到大是 one（1）、ten（10）、twenty（20）。" },
    { id: "el-eng-numbers-6", prompt: "Which word ends with '-teen'?", options: ["twenty", "ten", "two", "thirteen"], answer: 3, hints: ["13–19 以 -teen 結尾", "thirteen = 13"], explanation: "thirteen（13）以 -teen 結尾；twenty（20）以 -ty 結尾，兩者結尾不同。" },
  ],
};

/* ===================== 英語 4：顏色與形狀（三下） ===================== */
const EL_ENG_COLORS_SHAPES: OnionLesson = {
  id: "el-eng-colors-shapes",
  title: "顏色與形狀：紅圓藍方",
  subject: "英語",
  topic: "顏色與形狀",
  grade: "三下",
  stages: ["國小"],
  desc: "紅色 red、圓形 circle。洋蔥帶你學顏色形容詞放名詞前：a red circle。",
  takeaways: ["常見顏色 red/blue/yellow/green", "常見形狀 circle/square/triangle", "顏色形容詞放在名詞前面", "單數名詞前面要加 a，中文順序和英文正好相反"],
  frames: [
    { id: 1, step: "步驟 1：認識常見顏色", caption: "嗨！red 是紅色、blue 是藍色、yellow 是黃色，先看這幾個顏色。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：認識常見形狀", caption: "形狀有 circle（圓形）、square（方形）、triangle（三角形），用圖一看就懂。", action: "point", prop: { kind: "shape", shape: "circle", base: 10, height: 10, label: "circle 圓形" }, duration: 3400 },
    { id: 3, step: "步驟 3：單數要加 a", caption: "說一個東西時，單數名詞前面要加 a：a red circle（一個紅色的圓）。", action: "point", prop: { kind: "text", text: "a + 顏色 + 名詞", sub: "a red circle", tone: "ok" }, duration: 3400 },
    { id: 4, step: "步驟 4：顏色放名詞前", caption: "英文形容詞順序：顏色要放在名詞前面，紅色的圓形要怎麼說？", ask: { prompt: "How do you say 'a red circle'?", options: ["a red circle", "a circle red", "red circle a", "circle a red"], answer: 0, hint: "顏色 red 放在 circle 前面。" }, action: "think", prop: { kind: "text", text: "a red circle", sub: "顏色＋名詞順序", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：看圖說出顏色形狀", caption: "這顆藍色的方形你能說嗎？英文是 a blue square，藍色在前、方形在後。", action: "walk", prop: { kind: "text", text: "a blue square", sub: "藍色 square 方形", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：配對練習", caption: "看到黃色的三角形，下面哪句正確？", ask: { prompt: "Which is 'a yellow triangle'?", options: ["a blue square", "a yellow triangle", "a red circle", "a green star"], answer: 1, hint: "yellow 黃色、triangle 三角形。" }, action: "point", prop: { kind: "shape", shape: "triangle", base: 10, height: 10, label: "yellow triangle" }, duration: 3800 },
    { id: 7, step: "步驟 7：動手描述圖形", caption: "你看到一個綠色的方形，該怎麼說？", ask: { prompt: "You see a green square. How do you say it?", options: ["a green square", "a square green", "green square a", "a square of green"], answer: 0, hint: "a + green + square。" }, action: "think", prop: { kind: "shape", shape: "rect", base: 10, height: 10, label: "green square" }, duration: 3800 },
    { id: 8, step: "步驟 8：顏色形狀口訣", caption: "小整理：red/blue/yellow 記顏色、circle/square 記形狀，顏色永遠放前面。", action: "cheer", prop: { kind: "flow", steps: ["記顏色", "記形狀", "顏色放名詞前"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關配對", caption: "口訣：紅藍黃記顏色、圓方三角記形狀，顏色放前面。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-eng-colors-shapes-1", prompt: "Which word means 紅色 (red)?", options: ["blue", "yellow", "red", "green"], answer: 2, hints: ["red 是紅色", "聖誕紅"], explanation: "red 表示紅色。" },
    { id: "el-eng-colors-shapes-2", prompt: "Which word means 圓形 (circle)?", options: ["square", "triangle", "star", "circle"], answer: 3, hints: ["circle 是圓", "圓圓的"], explanation: "circle 表示圓形。" },
    { id: "el-eng-colors-shapes-3", prompt: "How do you say '藍色的方形'?", options: ["a blue square", "a square blue", "a red circle", "a yellow star"], answer: 0, hints: ["顏色 blue 放 square 前", "藍色方形"], explanation: "顏色形容詞放在名詞前，藍色的方形是 a blue square。" },
    { id: "el-eng-colors-shapes-4", prompt: "Which is 'a yellow triangle'?", options: ["a blue square", "a yellow triangle", "a red circle", "a green star"], answer: 1, hints: ["yellow 黃、triangle 三角", "黃色三角形"], explanation: "a yellow triangle 是黃色的三角形。" },
    { id: "el-eng-colors-shapes-5", prompt: "In English, where does the color word go?", options: ["after the noun (circle red)", "inside the noun", "before the noun (red circle)", "nowhere"], answer: 2, hints: ["英文顏色放名詞前", "red ＋ 名詞"], explanation: "英文中顏色形容詞要放在名詞前面，所以是 red circle（而不是 circle red）。" },
    { id: "el-eng-colors-shapes-6", prompt: "Which means '一個黃色的星星' (a yellow star)?", options: ["a star yellow", "yellow a star", "star yellow a", "a yellow star"], answer: 3, hints: ["a + 顏色 + 名詞", "yellow 放 star 前面"], explanation: "單數要加 a，顏色 yellow 放在名詞 star 前面，所以是 a yellow star。" },
  ],
};

/* ===================== 英語 5：家庭成員（四上） ===================== */
const EL_ENG_FAMILY: OnionLesson = {
  id: "el-eng-family",
  title: "家庭成員：father, mother…",
  subject: "英語",
  topic: "家庭與所有格",
  grade: "四上",
  stages: ["國小"],
  desc: "father、mother、brother 怎麼說？洋蔥帶你認識家人，再用 's 表示『誰的』。",
  takeaways: ["家人：father/mother/brother/sister", "This is my… 介紹家人", "用 's 表示所有格（誰的）", "'s 只加在『擁有者』後面，不加在被擁有的東西後面"],
  frames: [
    { id: 1, step: "步驟 1：認識家人稱呼", caption: "嗨！家人英文怎麼說？father 爸爸、mother 媽媽、brother 兄弟、sister 姐妹。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：再認識長輩稱呼", caption: "爸爸的爸爸是 grandfather（祖父），口語也叫 grandpa；媽媽的媽媽是 grandmother（祖母）或 grandma。", action: "point", prop: { kind: "text", text: "grandfather／grandma", sub: "長輩家人稱呼", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：介紹我的家人", caption: "想介紹家人就說 This is my father.（這是我爸爸。）my 表示『我的』。", action: "point", prop: { kind: "text", text: "This is my father.", sub: "介紹家人", tone: "ok" }, duration: 3400 },
    { id: 4, step: "步驟 4：聽音選家人", caption: "聽到 mother 這個詞，它指的是下面哪一位家人？", ask: { prompt: "Who is 'mother'?", options: ["媽媽", "爸爸", "兄弟", "姐妹"], answer: 0, hint: "mother 是媽媽。" }, action: "think", prop: { kind: "text", text: "mother = 媽媽", sub: "家人稱呼", tone: "ok" }, duration: 3600 },
    { id: 5, step: "步驟 5：學所有格 's", caption: "要說『爸爸的車』，英文加 's：my father's car，'s 表示『誰的』。", action: "walk", prop: { kind: "text", text: "father's car（爸爸的車）", sub: "'s 表示所有格", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：練習所有格", caption: "『媽媽的書』英文要怎麼加 's？", ask: { prompt: "How do you say 'mother's book'?", options: ["mother book", "mother's book", "book mother", "mothers book"], answer: 1, hint: "在 mother 後面加 's。" }, action: "point", prop: { kind: "flow", steps: ["mother", "+ 's", "mother's book"], active: 1 }, duration: 3800 },
    { id: 7, step: "步驟 7：動手放對 's", caption: "要說『弟弟的玩具』，'s 應該加在哪個字後面？", ask: { prompt: "To say '弟弟的玩具', where do you add 's?", options: ["brother 後面", "toy 後面", "the 後面", "my 後面"], answer: 0, hint: "'s 加在擁有者『弟弟』後面。" }, action: "think", prop: { kind: "flow", steps: ["brother", "+ 's", "brother's toy"], active: 1 }, duration: 3800 },
    { id: 8, step: "步驟 8：家人與所有格整理", caption: "小整理：father/mother 記家人，'s 加在後面表示『誰的』。", action: "cheer", prop: { kind: "flow", steps: ["記家人稱呼", "This is my…", "加 's 表所有"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關認家人", caption: "口訣：father 爸爸、mother 媽媽，'s 放後面表所有。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-eng-family-1", prompt: "Who is 'father'?", options: ["媽媽", "兄弟", "爸爸", "姐妹"], answer: 2, hints: ["father 是爸爸", "家庭成員"], explanation: "father 表示爸爸。" },
    { id: "el-eng-family-2", prompt: "How do you say '這是我媽媽'?", options: ["This is my father.", "He is brother.", "My sister is.", "This is my mother."], answer: 3, hints: ["mother 是媽媽", "This is my… 介紹"], explanation: "This is my mother. 是『這是我媽媽』。" },
    { id: "el-eng-family-3", prompt: "To say '哥哥的書', you add 's after:", options: ["brother", "book", "the", "my"], answer: 0, hints: ["哥哥是 brother", "'s 加在擁有者後"], explanation: "所有格 's 加在擁有者 brother 後面：brother's book。" },
    { id: "el-eng-family-4", prompt: "Which shows possession (誰的)?", options: ["father book", "father's car", "car father", "my father"], answer: 1, hints: ["'s 表示『的』", "father's = 爸爸的"], explanation: "father's car 中的 's 表示所有格『爸爸的』。" },
    { id: "el-eng-family-5", prompt: "Which is WRONG?", options: ["This is my sister.", "mother's bag", "brother book", "father's book"], answer: 2, hints: ["缺少 's", "應為 brother's"], explanation: "brother book 缺少所有格 's，正確是 brother's book；其他都正確。" },
    { id: "el-eng-family-6", prompt: "Which means '爺爺的車'?", options: ["grandpa car", "car grandpa", "grandpas car", "grandpa's car"], answer: 3, hints: ["'s 加在擁有者後", "grandpa 的後面加 's"], explanation: "爺爺是擁有者，'s 加在 grandpa 後面，所以是 grandpa's car。" },
  ],
};

/* ===================== 英語 6：日常作息與時間（五上） ===================== */
const EL_ENG_ROUTINE: OnionLesson = {
  id: "el-eng-routine",
  title: "日常作息與時間：What time…",
  subject: "英語",
  topic: "日常作息",
  grade: "五上",
  stages: ["國小"],
  desc: "幾點做什麼？What time do you… 問時間。洋蔥帶你說出一天的作息。",
  takeaways: ["用 What time…? 問時刻", "作息用 I … at 時間", "整點說 o'clock、半點說 half past", "一天的時間有先後，依時刻早晚依序排列"],
  frames: [
    { id: 1, step: "步驟 1：說出一天的作息", caption: "嗨！每天起床、上學、吃飯都有時間，用英文把它們說出來吧。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { id: 2, step: "步驟 2：問別人幾點做", caption: "想問朋友幾點做某事，用 What time do you get up?（你幾點起床？）", action: "point", prop: { kind: "text", text: "What time do you get up?", sub: "詢問作息時間", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：時間前加 at", caption: "回答時時間前面要加 at：at 7:00（在七點）、at noon（在中午），不能漏掉。", action: "point", prop: { kind: "text", text: "at 7:00 / at noon", sub: "時間前加 at", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：用長條圖看時間點", caption: "把一天的時間點畫出來：7:00 起床、12:00 吃飯，哪個比較早？", ask: { prompt: "Which time is earlier, 7:00 or 12:00?", options: ["7:00", "12:00", "一樣早", "都不早"], answer: 0, hint: "7 點比 12 點早。" }, action: "think", prop: { kind: "bars", items: [{ label: "7:00 起床", value: 7 }, { label: "12:00 吃飯", value: 12 }], unit: "點", active: 0 }, duration: 3600 },
    { id: 5, step: "步驟 5：整點與半點的說法", caption: "七點整說 seven o'clock，七點半說 half past seven，半點用 half past。", action: "walk", prop: { kind: "text", text: "7:00 seven o'clock", sub: "7:30 half past seven", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：練習回答作息", caption: "如果有人問 What time do you eat breakfast，你七點吃該怎麼答？", ask: { prompt: "You eat breakfast at 7:00. Answer:", options: ["I eat breakfast at 12:00.", "I eat breakfast at 7:00.", "What time?", "I am seven."], answer: 1, hint: "用 I … at 時間 回答。" }, action: "point", prop: { kind: "text", text: "I eat breakfast at 7:00.", sub: "回答作息時間", tone: "ok" }, duration: 3800 },
    { id: 7, step: "步驟 7：動手排出先後", caption: "把三個時間依先後排：7:00 起床、12:00 午餐、9:00 上學。哪個排最後？", ask: { prompt: "Which happens last: 7:00 get up, 9:00 school, or 12:00 lunch?", options: ["12:00 lunch", "7:00 get up", "9:00 school", "都同時"], answer: 0, hint: "12 點比 7 點、9 點都晚。" }, action: "think", prop: { kind: "bars", items: [{ label: "7:00 起床", value: 7 }, { label: "9:00 上學", value: 9 }, { label: "12:00 午餐", value: 12 }], unit: "點", active: 2 }, duration: 3800 },
    { id: 8, step: "步驟 8：作息與時間整理", caption: "小整理：What time 問時刻、at 加時間回答、整點 o'clock 半點 half past。", action: "cheer", prop: { kind: "flow", steps: ["What time 問", "at 時間答", "o'clock / half past"], active: 2 }, duration: 3600 },
    { id: 9, step: "步驟 9：準備闖關說作息", caption: "口訣：What time 問幾點、at 加時間答，整點半點分得清。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-eng-routine-1", prompt: "How do you ask '你幾點起床'?", options: ["What is your name?", "How are you?", "What time do you get up?", "Where is the book?"], answer: 2, hints: ["問時刻用 What time", "get up 是起床"], explanation: "What time do you get up? 用來問起床的時間。" },
    { id: "el-eng-routine-2", prompt: "7:00 is said as:", options: ["half past seven", "seven thirty", "twelve o'clock", "seven o'clock"], answer: 3, hints: ["整點用 o'clock", "七點整"], explanation: "七點整說 seven o'clock。" },
    { id: "el-eng-routine-3", prompt: "7:30 is said as:", options: ["half past seven", "seven o'clock", "seven fifteen", "twelve thirty"], answer: 0, hints: ["半點用 half past", "七點半"], explanation: "七點半說 half past seven。" },
    { id: "el-eng-routine-4", prompt: "You eat lunch at 12:00. Answer:", options: ["I eat lunch at 7:00.", "I eat lunch at 12:00.", "What time?", "I am twelve."], answer: 1, hints: ["用 I … at 時間", "把 12:00 放進去"], explanation: "十二點吃午餐回答 I eat lunch at 12:00." },
    { id: "el-eng-routine-5", prompt: "Which is the correct full sentence?", options: ["What time you get up?", "I get up seven.", "I get up at seven o'clock.", "At seven I get up?"], answer: 2, hints: ["用 at 加時間", "完整句子有主詞動詞"], explanation: "正確是 I get up at seven o'clock.，用 at 接時間；其他句子缺少 at 或語序不對。" },
    { id: "el-eng-routine-6", prompt: "Which sentence uses 'at' correctly?", options: ["I get up 7:00.", "I at get up 7:00.", "I get up in 7:00.", "I get up at 7:00."], answer: 3, hints: ["時間前面用 at", "at 7:00"], explanation: "時間前面要加 at，正確是 I get up at 7:00.；其他選項漏掉或放錯 at。" },
  ],
};

export default [
  EL_CHI_IDIOM,
  EL_CHI_RHETORIC,
  EL_CHI_POEM_RHYTHM,
  EL_CHI_STRUCTURE,
  EL_CHI_LETTER,
  EL_CHI_TYPO,
  EL_CHI_MAIN_IDEA,
  EL_CHI_QUOTATION,
  EL_ENG_PHONICS,
  EL_ENG_GREETING,
  EL_ENG_NUMBERS,
  EL_ENG_COLORS_SHAPES,
  EL_ENG_FAMILY,
  EL_ENG_ROUTINE,
];
