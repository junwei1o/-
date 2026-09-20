/**
 * 國中英語補充課程（洋蔥學院 200 堂擴充計畫：二、國中新增 45 堂／英語 8 堂）。
 *
 * 內容依 docs/onion-200-plan.md 的課表撰寫；每一堂都是 7 幀步驟分鏡
 * （字幕用中文講解、英文例句內嵌）＋ 2 次中途提問 ＋ 5 題闖關。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

const JH_ENG_PAST: OnionLesson = {
  id: "jh-eng-past",
  title: "過去簡單式：昨天發生的事",
  subject: "英語",
  topic: "過去簡單式",
  grade: "七下",
  stages: ["國中"],
  desc: "把時間調到昨天，動詞要跟著變身。規則動詞加 -ed、不規則動詞要背，否定和問句交給 did。",
  takeaways: ["過去式動詞：規則加 -ed，不規則要記（go→went）", "否定用 did not ＋ 原形動詞", "問句用 Did 開頭，後面的動詞用原形"],
  frames: [
    { step: "步驟 1：把時間調到昨天", id: 1, caption: "嗨！今天做的事用現在式，昨天做的事就要用過去式：I played basketball yesterday.", action: "wave", prop: { kind: "text", text: "today: I play → yesterday: I played", sub: "時間一變，動詞就要變", tone: "ok" }, duration: 3200 },
    { step: "步驟 2：規則動詞加 ed", id: 2, caption: "規則動詞最簡單：play → played、watch → watched、study → studied，字尾加 -ed。", action: "point", prop: { kind: "flow", steps: ["play", "＋ed", "played"], active: 2 }, duration: 3200 },
    { step: "步驟 3：不規則動詞要背", id: 3, caption: "但有些動詞不受規則管：go → went、eat → ate、see → saw，這些要一個一個記下來。", ask: { prompt: "「我昨天去了學校」應該怎麼說？", options: ["I go to school yesterday.", "I went to school yesterday.", "I am going to school yesterday.", "I will go to school yesterday."], answer: 1, hint: "yesterday 是過去，go 的過去式是 went。" }, action: "think", prop: { kind: "text", text: "go → went、eat → ate、see → saw", sub: "不規則動詞靠記憶，沒有規則可推", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：否定用 did not", id: 4, caption: "要說「昨天沒做」：did not ＋ 原形動詞。I did not play basketball yesterday.", action: "walk", prop: { kind: "balance", left: "did not", right: "＋ 原形動詞", tip: "did 後面的動詞一定回到原形" }, duration: 3400 },
    { step: "步驟 5：問句用 Did 開頭", id: 5, caption: "問別人昨天做了什麼：Did you play basketball yesterday? 答句用 Yes, I did. / No, I didn't.", ask: { prompt: "「你昨天看電視了嗎？」的正確問句是？", options: ["Do you watch TV yesterday?", "Did you watch TV yesterday?", "Did you watched TV yesterday?", "Are you watch TV yesterday?"], answer: 1, hint: "Did 開頭，後面動詞用原形 watch。" }, action: "jump", prop: { kind: "flow", steps: ["Did", "＋ 主詞", "＋ 原形動詞 ?"], active: 2 }, duration: 3600 },
    { step: "步驟 6：常見的三個錯", id: 6, caption: "三個常見錯誤：did 後面又加 -ed、問句忘了用 Did、時間副詞對了卻忘了動詞要變。", action: "point", prop: { kind: "text", text: "✗ He did not played. → ✓ He did not play.", sub: "did 出現時，動詞一律回原形", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：過去式－規則加 ed、不規則要背；否定問句交給 did，動詞回原形。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jep1", prompt: "「我昨天寫了功課。」下列哪一句正確？", options: ["I write my homework yesterday.", "I wrote my homework yesterday.", "I writed my homework yesterday.", "I am writing my homework yesterday."], answer: 1, hints: ["yesterday 表示過去", "write 是不規則動詞"], explanation: "write 的過去式是不規則的 wrote，不能寫成 writed。" },
    { id: "jep2", prompt: "「他昨天沒有來學校。」應該怎麼說？", options: ["He did not came to school yesterday.", "He did not come to school yesterday.", "He not came to school yesterday.", "He doesn't come to school yesterday."], answer: 1, hints: ["did not 後面要用原形動詞", "come 的原形就是 come"], explanation: "did not 之後一律接原形動詞，所以是 did not come。" },
    { id: "jep3", prompt: "「你昨天有打電話給我嗎？」的正確問句是？", options: ["Do you called me yesterday?", "Did you call me yesterday?", "Did you called me yesterday?", "Were you call me yesterday?"], answer: 1, hints: ["過去式的問句用 Did 開頭", "Did 後面的動詞用原形"], explanation: "過去式問句為 Did ＋ 主詞 ＋ 原形動詞，所以是 Did you call me yesterday?" },
    { id: "jep4", prompt: "下列哪一個動詞的過去式「不規則」？", options: ["play", "watch", "eat", "study"], answer: 2, hints: ["規則動詞直接加 -ed", "eat 的過去式不是 eated"], explanation: "eat 的過去式是 ate，屬於不規則動詞；play/watched/studied 都是規則變化。" },
    { id: "jep5", prompt: "「They ___ to the zoo last Sunday.」空格應填入？", options: ["go", "goes", "went", "going"], answer: 2, hints: ["last Sunday 是過去時間", "go 的過去式是 went"], explanation: "last Sunday 表示過去，主詞 They 接 go 的過去式 went。" },
  ],
};

const JH_ENG_FUTURE: OnionLesson = {
  id: "jh-eng-future",
  title: "未來式：will 與 be going to",
  subject: "英語",
  topic: "未來式",
  grade: "八上",
  stages: ["國中"],
  desc: "兩句都講未來，但一個是「當下決定」、一個是「早就計畫好」。搞清楚差別，英文就不會用錯。",
  takeaways: ["will ＋ 原形動詞：當下決定、臨時起意", "be going to ＋ 原形動詞：事先計畫、有跡象", "否定：will not；問句：Will you…?"],
  frames: [
    { step: "步驟 1：未來有兩種說法", id: 1, caption: "嗨！講未來的時候，英文有兩把鑰匙：will 和 be going to，先看它們長什麼樣。", action: "wave", prop: { kind: "flow", steps: ["will ＋ 原形", "be going to ＋ 原形"], active: 0 }, duration: 3200 },
    { step: "步驟 2：will 是當下決定", id: 2, caption: "電話響了，你說 I will answer it. ——這是講話的當下才決定的，用 will。", action: "point", prop: { kind: "text", text: "I will answer it.", sub: "當下決定、臨時起意 → will", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：be going to 是早就計畫", id: 3, caption: "如果你早就排好週末要去爬山：I am going to go hiking this weekend. 用 be going to。", ask: { prompt: "「我打算下週去臺南。」哪一句最合適？", options: ["I will go to Tainan next week.", "I am going to go to Tainan next week.", "I go to Tainan next week.", "I went to Tainan next week."], answer: 1, hint: "已經計畫好的事，用 be going to。" }, action: "think", prop: { kind: "text", text: "I am going to go to Tainan.", sub: "事先計畫好的安排 → be going to", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：有跡象也用 be going to", id: 4, caption: "看到烏雲密布，你說 It is going to rain. ——有明顯跡象的時候，也用 be going to。", action: "walk", prop: { kind: "text", text: "It is going to rain.", sub: "有跡象（烏雲）→ be going to", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：否定與問句", id: 5, caption: "否定：will not（won't）／be not going to。問句：Will you come? 或 Are you going to come?", ask: { prompt: "「你不會遲到吧？」的問句應該怎麼說？", options: ["Will you be late?", "Do you be late?", "Are you late?", "Will you being late?"], answer: 0, hint: "未來問句用 Will 開頭，後面接原形動詞。" }, action: "jump", prop: { kind: "balance", left: "Will ＋ 主詞 ＋ 原形 ?", right: "won't ＋ 原形", tip: "問句與否定都保持原形動詞" }, duration: 3600 },
    { step: "步驟 6：常見的錯", id: 6, caption: "常見錯誤：will 後面又加 to 或 -s。記住 will 後面永遠是原形動詞。", action: "point", prop: { kind: "text", text: "✗ She will goes. → ✓ She will go.", sub: "will 後面的動詞不加 s、不變形", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：臨時決定用 will，計畫好或看跡象用 be going to；兩個後面都接原形動詞。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jef1", prompt: "「我打算明年學吉他。」哪一句最合適？", options: ["I will learn guitar next year.", "I am going to learn guitar next year.", "I learn guitar next year.", "I learned guitar next year."], answer: 1, hints: ["這是已經想好的計畫", "計畫好的事用 be going to"], explanation: "已經計畫好的未來安排用 be going to，所以是 I am going to learn guitar next year." },
    { id: "jef2", prompt: "「電話響了，我去接。」（當下決定）應該說？", options: ["I am going to answer it.", "I will answer it.", "I answer it.", "I answered it."], answer: 1, hints: ["這是講話當下才決定的", "臨時起意用 will"], explanation: "當下決定的未來動作使用 will，所以是 I will answer it." },
    { id: "jef3", prompt: "下列哪一句是正確的？", options: ["She will goes to Japan.", "She will go to Japan.", "She will to go to Japan.", "She wills go to Japan."], answer: 1, hints: ["will 是助動詞，後面接原形動詞", "主詞是第三人稱也不加 s"], explanation: "will 之後一律接原形動詞，不隨主詞變化，所以是 She will go to Japan." },
    { id: "jef4", prompt: "看到天空烏雲密布，最自然的說法是？", options: ["It will rain tomorrow.", "It is going to rain.", "It rains.", "It rained."], answer: 1, hints: ["有明顯跡象時用 be going to", "烏雲就是那個跡象"], explanation: "有明顯跡象（烏雲）時用 be going to，所以是 It is going to rain." },
    { id: "jef5", prompt: "「They ___ arrive at six.」（已經安排好的班機）空格應填入？", options: ["will", "are going to", "is going to", "going to"], answer: 1, hints: ["主詞 They 要接 are", "已經安排好的行程用 be going to"], explanation: "主詞 They 接 are going to，表示已經安排好的未來行程。" },
  ],
};

const JH_ENG_COMPARATIVE: OnionLesson = {
  id: "jh-eng-comparative",
  title: "比較級與最高級：誰比誰高？",
  subject: "英語",
  topic: "比較級與最高級",
  grade: "八上",
  stages: ["國中"],
  desc: "兩個人比用比較級＋than，三個以上選第一用最高級＋the。短音節加 -er/-est，長音節用 more/most。",
  takeaways: ["比較級：-er 或 more，後面常接 than", "最高級：-est 或 most，前面要加 the", "不規則變化：good→better→best"],
  frames: [
    { step: "步驟 1：先看要比幾個", id: 1, caption: "嗨！英文的「比」有兩種：兩個人在比，和三個人以上選出第一名。", action: "wave", prop: { kind: "flow", steps: ["比較級：兩個人比", "最高級：三個以上選第一"], active: 0 }, duration: 3200 },
    { step: "步驟 2：短音節加 er", id: 2, caption: "短音節的形容詞直接加 -er：tall → taller、fast → faster，後面接 than 帶出對手。", action: "point", prop: { kind: "bars", items: [{ label: "Amy 150", value: 150 }, { label: "Ben 165", value: 165 }], unit: "公分", active: 1 }, duration: 3400 },
    { step: "步驟 3：句子怎麼組", id: 3, caption: "Ben is taller than Amy. —— A 比 B 高，就是 A ＋ is ＋ 比較級 ＋ than ＋ B。", ask: { prompt: "「這本書比那本書便宜。」應該怎麼說？", options: ["This book is cheap than that one.", "This book is cheaper than that one.", "This book is cheapest than that one.", "This book is more cheap than that one."], answer: 1, hint: "cheap 是短音節形容詞，直接加 -er 就好。" }, action: "think", prop: { kind: "balance", left: "Ben", right: "taller than Amy", tip: "比較級後面用 than 帶出對手" }, duration: 3600 },
    { step: "步驟 4：長音節用 more", id: 4, caption: "音節長的形容詞不加 -er，改用 more：beautiful → more beautiful、expensive → more expensive。", action: "walk", prop: { kind: "text", text: "more beautiful / more expensive", sub: "長音節形容詞用 more ＋ 原級", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：最高級要加 the", id: 5, caption: "三個以上選第一：Ben is the tallest of the three. 最高級前面要記得加 the。", ask: { prompt: "「他是班上跑最快的。」應該怎麼說？", options: ["He is the fastest in his class.", "He is fastest than his class.", "He is faster in his class.", "He is more fast in his class."], answer: 0, hint: "最高級前面要加 the，範圍用 in his class 表示。" }, action: "jump", prop: { kind: "bars", items: [{ label: "Ben 14 秒", value: 14 }, { label: "Ken 15 秒", value: 15 }, { label: "Tom 16 秒", value: 16 }], unit: "秒", active: 0 }, duration: 3600 },
    { step: "步驟 6：不規則變化要背", id: 6, caption: "有幾個常見形容詞完全不受規則管：good → better → best、bad → worse → worst、many → more → most。", action: "point", prop: { kind: "text", text: "good → better → best", sub: "bad → worse → worst；many → more → most", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：兩人比用 -er ＋ than，三人以上用 the ＋ -est；長音節改 more／most。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jec1", prompt: "「This bag is ___ than that one.」空格應填入？", options: ["heavy", "heavier", "heaviest", "more heavy"], answer: 1, hints: ["句子裡有 than，要用比較級", "heavy 去 y 加 -ier"], explanation: "有 than 表示兩者比較，heavy 的比較級是 heavier（去 y 加 -ier）。" },
    { id: "jec2", prompt: "「它是店裡最貴的鞋。」應該怎麼說？", options: ["It is the most expensive shoes in the store.", "It is more expensive shoes in the store.", "It is expensive than the store.", "It is the expensivest shoes in the store."], answer: 0, hints: ["三個以上選第一，用最高級", "expensive 是長音節，用 most"], explanation: "最高級用 the most expensive，範圍用 in the store 表示。" },
    { id: "jec3", prompt: "下列哪一組是正確的不規則變化？", options: ["good → gooder → goodest", "good → better → best", "good → more good → most good", "good → best → better"], answer: 1, hints: ["good 的比較級不是加 -er", "這是必須背下來的變化"], explanation: "good 的比較級是 better、最高級是 best，屬於不規則變化。" },
    { id: "jec4", prompt: "「Ken runs faster ___ Tom.」空格應填入？", options: ["then", "than", "that", "as"], answer: 1, hints: ["比較級後面要帶出對手", "注意 than 與 then 拼字不同"], explanation: "比較級後面接 than（不是 then，then 是「然後」）。" },
    { id: "jec5", prompt: "三個同學比身高，要用哪一句？", options: ["Amy is taller than Ben.", "Amy is the tallest of the three.", "Amy is tall than Ben.", "Amy is more tall of the three."], answer: 1, hints: ["三個以上選第一用最高級", "最高級前面加 the，範圍用 of the three"], explanation: "三者以上比較用最高級：Amy is the tallest of the three." },
  ],
};

const JH_ENG_GERUND: OnionLesson = {
  id: "jh-eng-gerund",
  title: "動名詞與不定詞：to V 還是 V-ing？",
  subject: "英語",
  topic: "動名詞與不定詞",
  grade: "八下",
  stages: ["國中"],
  desc: "有些動詞後面只能接 to V，有些只能接 V-ing，還有些兩個都可以。用一張分類表把它記牢。",
  takeaways: ["不定詞 to ＋ 原形動詞：want to go", "動名詞 V-ing 當名詞用：enjoy swimming", "有些動詞兩種都可以：like to swim / like swimming"],
  frames: [
    { step: "步驟 1：動詞後面接什麼", id: 1, caption: "嗨！英文句子裡經常有「兩個動詞排在一起」，第二個動詞要用 to V 還是 V-ing？", action: "wave", prop: { kind: "flow", steps: ["want to go", "enjoy swimming"], active: 0 }, duration: 3200 },
    { step: "步驟 2：to V 是還沒做的事", id: 2, caption: "want、hope、plan、decide 後面接 to V：I want to go home. 通常指向還沒發生的動作。", action: "point", prop: { kind: "text", text: "want / hope / plan / decide ＋ to V", sub: "指向還沒做的動作", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：V-ing 是當名詞用", id: 3, caption: "enjoy、finish、practice、mind 後面接 V-ing：I enjoy swimming. 這裡的 swimming 像一個名詞。", ask: { prompt: "「我喜歡游泳。」哪一句正確？", options: ["I enjoy to swim.", "I enjoy swimming.", "I enjoy swim.", "I enjoy to swimming."], answer: 1, hint: "enjoy 後面只能接 V-ing。" }, action: "think", prop: { kind: "text", text: "enjoy / finish / practice ＋ V-ing", sub: "V-ing 在這裡當名詞用", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：像片語動詞要看尾字", id: 4, caption: "片語動詞後面接的也是 V-ing：give up smoking、look forward to seeing you（to 是介系詞）。", action: "walk", prop: { kind: "text", text: "look forward to seeing you", sub: "片語裡的 to 是介系詞，後面接 V-ing", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：兩個都可以的動詞", id: 5, caption: "like、love、start、begin 兩種都行：I like to swim. ＝ I like swimming. 意思差不多。", ask: { prompt: "下列哪一個動詞後面「只能」接 to V？", options: ["enjoy", "finish", "decide", "practice"], answer: 2, hint: "想想哪一個是「決定、計畫」那一類的動詞。" }, action: "jump", prop: { kind: "text", text: "like to swim ＝ like swimming", sub: "意思相同，兩種寫法都對" }, duration: 3600 },
    { step: "步驟 6：最常見的錯", id: 6, caption: "常見錯誤：enjoy 後面加了 to、want 後面用了 V-ing。記住分類，不要靠感覺。", action: "point", prop: { kind: "text", text: "✗ I enjoy to swim. → ✓ I enjoy swimming.", sub: "分類要背，不能憑語感", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：want／hope／decide 接 to V；enjoy／finish／practice 接 V-ing；like 兩種都行。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jeg1", prompt: "「我決定學日文。」應該怎麼說？", options: ["I decide learning Japanese.", "I decide to learn Japanese.", "I decide learn Japanese.", "I decide to learning Japanese."], answer: 1, hints: ["decide 後面接 to V", "to 後面要用原形動詞"], explanation: "decide 後面接不定詞 to V，所以是 decide to learn。" },
    { id: "jeg2", prompt: "「他練習彈鋼琴。」應該怎麼說？", options: ["He practices to play the piano.", "He practices playing the piano.", "He practices play the piano.", "He practices to playing the piano."], answer: 1, hints: ["practice 後面接 V-ing", "就像 enjoy 那一類"], explanation: "practice 後面接動名詞 V-ing，所以是 practices playing。" },
    { id: "jeg3", prompt: "「I look forward to ___ you.」空格應填入？", options: ["see", "seeing", "saw", "to see"], answer: 1, hints: ["look forward to 是片語，to 是介系詞", "介系詞後面接 V-ing"], explanation: "look forward to 的 to 是介系詞，後面接動名詞 seeing。" },
    { id: "jeg4", prompt: "下列哪一句是錯誤的？", options: ["I want to go home.", "I enjoy reading.", "I finished to do my homework.", "I hope to see you soon."], answer: 2, hints: ["finish 後面只能接 V-ing", "找那個動詞用錯形式的句子"], explanation: "finish 後面要接 V-ing，應改為 I finished doing my homework." },
    { id: "jeg5", prompt: "「I like ___ basketball.」哪一種說法都可以？", options: ["只能填 to play", "只能填 playing", "to play 或 playing 都可以", "只能填 play"], answer: 2, hints: ["like 屬於兩種都行的動詞", "意思差不多"], explanation: "like 後面接 to play 或 playing 都可以，意思相近。" },
  ],
};

const JH_ENG_RELATIVE: OnionLesson = {
  id: "jh-eng-relative",
  title: "關係子句：用 who 和 which 加補充",
  subject: "英語",
  topic: "關係子句",
  grade: "九上",
  stages: ["國中"],
  desc: "把兩句合成一句：人用 who、事物用 which／that。學會之後，句子可以又短又清楚。",
  takeaways: ["先行詞是人 → who；是事物 → which／that", "關係子句緊跟在先行詞後面", "關係代名詞當主詞時，後面動詞跟著先行詞變"],
  frames: [
    { step: "步驟 1：兩句變一句", id: 1, caption: "嗨！「我有一個朋友。他會彈吉他。」這兩句可以合成一句，靠的就是關係子句。", action: "wave", prop: { kind: "flow", steps: ["I have a friend.", "He can play the guitar.", "I have a friend who can play the guitar."], active: 2 }, duration: 3600 },
    { step: "步驟 2：人用 who", id: 2, caption: "先行詞是「人」的時候用 who：the boy who is running、the girl who sings well。", action: "point", prop: { kind: "text", text: "人 → who", sub: "the boy who is running", tone: "ok" }, duration: 3200 },
    { step: "步驟 3：事物用 which 或 that", id: 3, caption: "先行詞是「事物」用 which 或 that：the book which is on the desk ＝ the book that is on the desk。", ask: { prompt: "「那隻在睡覺的貓」應該怎麼說？", options: ["the cat who is sleeping", "the cat which is sleeping", "the cat which sleeping", "the cat is sleeping which"], answer: 1, hint: "貓是動物、不是人，用 which。" }, action: "think", prop: { kind: "text", text: "事物 → which / that", sub: "the book which is on the desk", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：子句緊跟在先行詞後面", id: 4, caption: "關係子句一定要緊跟在它修飾的名詞後面，位置放錯意思就變了。", action: "walk", prop: { kind: "flow", steps: ["先行詞", "＋ 關係代名詞", "＋ 子句"], active: 1 }, duration: 3400 },
    { step: "步驟 5：動詞跟著先行詞", id: 5, caption: "關係代名詞當主詞時，後面動詞要跟先行詞一致：The students who are here…（students 是複數）。", ask: { prompt: "「那個會說英文的男孩」應該怎麼說？", options: ["the boy who speak English", "the boy who speaks English", "the boy which speaks English", "the boy who speaking English"], answer: 1, hint: "先行詞是單數 boy，動詞要加 s。" }, action: "jump", prop: { kind: "balance", left: "the boy who speaks", right: "the boys who speak", tip: "動詞單複數跟著先行詞" }, duration: 3600 },
    { step: "步驟 6：常見的錯", id: 6, caption: "常見錯誤：人和事物用錯代名詞、子句裡又放了一次主詞。子句裡不需要再寫一次那個名詞。", action: "point", prop: { kind: "text", text: "✗ the man who he is tall → ✓ the man who is tall", sub: "關係子句裡不要再重複主詞", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：人 who、物 which／that；子句緊跟先行詞，動詞跟著先行詞變。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jer1", prompt: "「我認識一位住在高雄的女生。」應該怎麼說？", options: ["I know a girl which lives in Kaohsiung.", "I know a girl who lives in Kaohsiung.", "I know a girl who live in Kaohsiung.", "I know a girl she lives in Kaohsiung."], answer: 1, hints: ["先行詞 a girl 是人", "單數主詞動詞要加 s"], explanation: "人是 who，且 a girl 為單數，動詞用 lives。" },
    { id: "jer2", prompt: "「這是我昨天買的書。」應該怎麼說？", options: ["This is the book who I bought yesterday.", "This is the book which I bought yesterday.", "This is the book which I buy yesterday.", "This is the book it I bought yesterday."], answer: 1, hints: ["先行詞 the book 是事物，用 which", "yesterday 要用過去式"], explanation: "事物用 which，過去時間用 bought，所以是 the book which I bought yesterday." },
    { id: "jer3", prompt: "「The students ___ are playing basketball are my classmates.」空格應填入？", options: ["who", "which", "whose", "it"], answer: 0, hints: ["先行詞 students 是人", "複數動詞 are 已經放在子句裡"], explanation: "先行詞是人（students），關係代名詞用 who。" },
    { id: "jer4", prompt: "下列哪一句是錯誤的？", options: ["The man who is standing there is my uncle.", "The dog which is barking is mine.", "The girl who she sings well is my sister.", "The book that I read was interesting."], answer: 2, hints: ["關係子句裡不要再重複主詞", "找那個多寫了一次主詞的句子"], explanation: "who 已經代替 the girl 當主詞，不能再寫 she，應改為 The girl who sings well is my sister." },
    { id: "jer5", prompt: "「他養了一隻會說話的鳥。」應該怎麼說？", options: ["He has a bird who can talk.", "He has a bird which can talk.", "He has a bird which can talks.", "He has a bird it can talk."], answer: 1, hints: ["鳥是動物，用 which", "can 後面接原形動詞"], explanation: "動物用 which，can 後面接原形 talk，所以是 a bird which can talk." },
  ],
};

const JH_ENG_CONJUNCTION: OnionLesson = {
  id: "jh-eng-conjunction",
  title: "連接詞：because、when、if",
  subject: "英語",
  topic: "連接詞與副詞子句",
  grade: "八下",
  stages: ["國中"],
  desc: "一句話不夠用的時候，就用連接詞把原因、時間、條件接上去。位置放前面或後面都行。",
  takeaways: ["because 表原因、when 表時間、if 表條件", "副詞子句可放句首或句尾；放句首要加逗號", "副詞子句裡用「現在式」表未來"],
  frames: [
    { step: "步驟 1：一句話不夠用", id: 1, caption: "嗨！想講「因為下雨，所以我帶傘」，英文就要用連接詞把兩個句子接起來。", action: "wave", prop: { kind: "flow", steps: ["It rained.", "I took an umbrella.", "Because it rained, I took an umbrella."], active: 2 }, duration: 3600 },
    { step: "步驟 2：because 講原因", id: 2, caption: "because 帶出原因：I was late because the bus broke down. 也可以放句首，記得加逗號。", action: "point", prop: { kind: "text", text: "because ＋ 原因", sub: "Because it rained, I took an umbrella.", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：when 講時間", id: 3, caption: "when 帶出時間：When I got home, my mother was cooking. 兩個動作誰先誰後要講清楚。", ask: { prompt: "「我到家時，媽媽正在煮飯。」應該怎麼說？", options: ["When I got home, my mother was cooking.", "When I get home, my mother cooks.", "Because I got home, my mother was cooking.", "If I got home, my mother was cooking."], answer: 0, hint: "時間用 when，回家是過去發生的事。" }, action: "think", prop: { kind: "flow", steps: ["When I got home", "my mother was cooking"], active: 0 }, duration: 3600 },
    { step: "步驟 4：if 講條件", id: 4, caption: "if 帶出條件：If it rains tomorrow, we will stay home. 條件成立，結果才會發生。", action: "walk", prop: { kind: "flow", steps: ["If it rains tomorrow", "we will stay home"], active: 0 }, duration: 3400 },
    { step: "步驟 5：未來的事用現在式", id: 5, caption: "重要規則：if 和 when 的子句講未來，也要用現在式：If it rains…（不是 will rain）。", ask: { prompt: "「如果他明天來，我就會告訴他。」空格應填入？", options: ["If he will come tomorrow, I will tell him.", "If he comes tomorrow, I will tell him.", "If he came tomorrow, I will tell him.", "If he coming tomorrow, I will tell him."], answer: 1, hint: "if 子句講未來要用現在式。" }, action: "jump", prop: { kind: "balance", left: "If ＋ 現在式", right: "主要子句 ＋ will", tip: "if 子句不用 will" }, duration: 3600 },
    { step: "步驟 6：常見的錯", id: 6, caption: "常見錯誤：because 和 so 同時用、if 子句用了 will、句首放子句忘了逗號。", action: "point", prop: { kind: "text", text: "✗ Because it rained, so I took an umbrella.", sub: "because 與 so 只留一個", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：原因 because、時間 when、條件 if；子句放句首要逗號，講未來用現在式。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jej1", prompt: "「因為下雨，我帶了傘。」應該怎麼說？", options: ["Because it rained, so I took an umbrella.", "Because it rained, I took an umbrella.", "Because it rained, I take an umbrella.", "If it rained, I took an umbrella."], answer: 1, hints: ["because 和 so 不能同時出現", "過去的事要用過去式"], explanation: "because 與 so 只能留一個；帶傘是過去的事，用 took。" },
    { id: "jej2", prompt: "「如果明天是好天氣，我們就去公園。」應該怎麼說？", options: ["If it will be sunny tomorrow, we will go to the park.", "If it is sunny tomorrow, we will go to the park.", "If it was sunny tomorrow, we go to the park.", "If it sunny tomorrow, we will go to the park."], answer: 1, hints: ["if 子句講未來要用現在式", "主要子句才用 will"], explanation: "if 子句用現在式 is，主要子句用 will go。" },
    { id: "jej3", prompt: "「當我打電話給他時，他正在睡覺。」應該怎麼說？", options: ["When I called him, he was sleeping.", "When I call him, he sleeps.", "If I called him, he was sleeping.", "Because I called him, he was sleeping."], answer: 0, hints: ["時間用 when", "兩個動作都在過去，一個正在進行"], explanation: "時間子句用 when；他當時正在睡，用過去進行式 was sleeping。" },
    { id: "jej4", prompt: "副詞子句放在句首時，後面要加什麼？", options: ["句號", "逗號", "問號", "什麼都不用加"], answer: 1, hints: ["看看課本例句的標點", "子句在句首要跟主要子句分開"], explanation: "副詞子句放句首時，後面要加逗號，例如 When I got home, my mother was cooking." },
    { id: "jej5", prompt: "下列哪一句是錯誤的？", options: ["If you are free, please call me.", "When I was young, I lived in Tainan.", "Because he was tired, so he went to bed early.", "I stayed home because it was raining."], answer: 2, hints: ["注意 because 已經含有「所以」的意思", "找那個同時用了兩個連接詞的句子"], explanation: "because 與 so 不能同時使用，應改為 Because he was tired, he went to bed early." },
  ],
};

const JH_ENG_READING: OnionLesson = {
  id: "jh-eng-reading-skill",
  title: "閱讀測驗技巧：先找主題句",
  subject: "英語",
  topic: "閱讀理解技巧",
  grade: "九上",
  stages: ["國中"],
  desc: "看不懂全部單字也能答題：先讀題目、再找主題句與關鍵字，答案通常就在那兩句附近。",
  takeaways: ["先讀題目再看文章，知道要找什麼", "主題句常在段首或段尾", "問句裡的字詞就是關鍵字，回文章定位它"],
  frames: [
    { step: "步驟 1：不要從第一個字讀", id: 1, caption: "嗨！閱讀測驗最有效的方法不是把文章逐字讀完，而是先看題目在問什麼。", action: "wave", prop: { kind: "flow", steps: ["先讀題目", "再讀文章", "回文章找答案"], active: 0 }, duration: 3400 },
    { step: "步驟 2：主題句在哪裡", id: 2, caption: "每段通常有一句「主題句」，說明這一段要講什麼，最常出現在段首，也可能在段尾。", action: "point", prop: { kind: "text", text: "主題句：段首或段尾", sub: "其餘句子都在支持這一句", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：用關鍵字定位", id: 3, caption: "題目問「When did Tom start playing the piano?」，就回文章找 Tom、piano 和時間。", ask: { prompt: "題目問某件事發生的「時間」，回文章時最該注意什麼？", options: ["形容詞", "數字與時間詞（in 2019、last year）", "標點符號", "句子的長度"], answer: 1, hint: "問時間就找時間的線索。" }, action: "think", prop: { kind: "flow", steps: ["題目關鍵字", "回文章定位", "讀前後一句"], active: 1 }, duration: 3600 },
    { step: "步驟 4：上下文猜生字", id: 4, caption: "遇到生字不要慌：看它前後的字，猜它的意思。The weather was chilly, so I wore a coat. ——chilly 應該是天氣冷。", action: "walk", prop: { kind: "text", text: "The weather was chilly, so I wore a coat.", sub: "從「穿外套」回推 chilly ＝ 冷", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：轉折詞是重點", id: 5, caption: "but、however、although 後面常是作者真正的意思；because、so 帶出原因與結果。", ask: { prompt: "「I like the city, but the traffic is terrible.」作者對交通的看法是？", options: ["很喜歡", "覺得很糟", "沒有意見", "覺得很方便"], answer: 1, hint: "but 後面的才是轉折後的重點。" }, action: "jump", prop: { kind: "text", text: "but / however → 轉折後是重點", sub: "because / so → 原因與結果", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：選項的陷阱", id: 6, caption: "選項裡常出現文章有提到的字，但意思被改掉了。要選「文章真的這樣說」的那一個。", action: "point", prop: { kind: "text", text: "只選文章真的說過的", sub: "有出現同一個字不代表答案正確", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：先題目、再文章；主題句在頭尾；關鍵字定位、上下文猜字、轉折後是重點。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jerd1", prompt: "做英語閱讀測驗時，最有效的第一步是？", options: ["把文章每個單字都查完", "先讀題目，知道要找什麼", "先看選項的長度", "從最後一段倒著讀"], answer: 1, hints: ["帶著問題讀文章最有效率", "先知道要找什麼才不會白讀"], explanation: "先讀題目可以設定閱讀目標，回文章時更容易定位答案。" },
    { id: "jerd2", prompt: "「主題句」最常出現在哪裡？", options: ["段首或段尾", "標題裡", "一定是第二句", "不會出現在文章裡"], answer: 0, hints: ["它說明整段要講什麼", "作者通常會先講重點或最後總結"], explanation: "主題句說明整段主旨，最常出現在段首，也可能放在段尾作總結。" },
    { id: "jerd3", prompt: "「The soup was bland, so I added some salt.」bland 最可能是什麼意思？", options: ["很辣", "沒有味道", "很燙", "很好吃"], answer: 1, hints: ["加了鹽代表原本的味道不足", "從動作回推形容詞"], explanation: "因為加了鹽，可推測 bland 是「沒味道、清淡」。" },
    { id: "jerd4", prompt: "「I wanted to go out, but it was raining hard.」作者最後怎麼了？", options: ["出門了", "留在家裡", "去買傘", "沒提到"], answer: 1, hints: ["but 後面的才是實際情況", "下大雨通常不會出門"], explanation: "but 之後說雨下得很大，可推知作者沒有出門、留在家裡。" },
    { id: "jerd5", prompt: "選項裡出現文章提過的字，就一定是答案嗎？", options: ["一定對", "不一定，要看整句意思是否與文章一致", "一定錯", "只要字一樣就對"], answer: 1, hints: ["出題者常用同字陷阱", "要讀完整句再判斷"], explanation: "常見陷阱是把文章的字放進選項但改變意思，必須確認整句與文章相符。" },
  ],
};

const JH_ENG_EMAIL: OnionLesson = {
  id: "jh-eng-email",
  title: "英文書信與 e-mail",
  subject: "英語",
  topic: "書信與 e-mail 寫作",
  grade: "九下",
  stages: ["國中"],
  desc: "寫英文信有固定格式：稱謂、開頭問候、正文、結尾、署名。順序對了，看起來就專業。",
  takeaways: ["稱謂：Dear ＋ 名字，後面用逗號", "結尾：Best regards / Sincerely，再署名", "正文分段：一件事一段，不要全部擠在一起"],
  frames: [
    { step: "步驟 1：信有五個部分", id: 1, caption: "嗨！一封英文 e-mail 像一個小結構：稱謂、開頭問候、正文、結尾、署名共五個部分。", action: "wave", prop: { kind: "flow", steps: ["稱謂", "開頭問候", "正文", "結尾", "署名"], active: 0 }, duration: 3600 },
    { step: "步驟 2：稱謂怎麼寫", id: 2, caption: "認識的人用 Dear Amy, 不確定對方是誰用 Dear Sir or Madam, 後面一定要有逗號。", action: "point", prop: { kind: "text", text: "Dear Amy,", sub: "不確定對象：Dear Sir or Madam,", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：開頭先問好", id: 3, caption: "開頭一句問候最自然：How are you? 或 I hope you are doing well. 接著再說明寫信的目的。", ask: { prompt: "英文 e-mail 的開頭，哪一句最合適？", options: ["I am a student.", "How are you?", "Goodbye.", "Please reply."], answer: 1, hint: "開頭通常先問候對方。" }, action: "think", prop: { kind: "text", text: "How are you?", sub: "或 I hope you are doing well.", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：正文一件事一段", id: 4, caption: "正文把要說的事分段寫：先說明來意，再補充細節，最後提出請求或問題。", action: "walk", prop: { kind: "flow", steps: ["說明來意", "補充細節", "提出請求"], active: 1 }, duration: 3400 },
    { step: "步驟 5：結尾與署名", id: 5, caption: "結尾用 Best regards, / Sincerely, 然後下一行寫自己的名字；不要寫 Your friend 之後又加 Dear。", ask: { prompt: "下列哪一個是合適的結尾？", options: ["Best regards,", "Dear Amy,", "Hello!", "How are you?"], answer: 0, hint: "結尾要能接上署名。" }, action: "jump", prop: { kind: "text", text: "Best regards,", sub: "下一行署名：Kevin", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：常見的錯", id: 6, caption: "常見錯誤：稱謂忘了逗號、全文擠成一大段、署名用中文名字卻寫 Dear Mr.。", action: "point", prop: { kind: "text", text: "✗ Dear Amy（少了逗號）", sub: "✓ Dear Amy,", tone: "warn" }, duration: 3400 },
    { step: "步驟 7：口訣記起來", id: 7, caption: "口訣：稱謂問候正文結尾署名，五段到位；一件事一段，最後別忘了署名。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jem1", prompt: "英文 e-mail 的稱謂「Dear Amy」後面應該加什麼？", options: ["句號", "逗號", "問號", "什麼都不加"], answer: 1, hints: ["這是書信的固定格式", "後面接著正文，需要停頓"], explanation: "稱謂後面要加逗號，寫成 Dear Amy," },
    { id: "jem2", prompt: "下列哪一個順序是英文書信的正確結構？", options: ["署名 → 稱謂 → 正文", "稱謂 → 開頭問候 → 正文 → 結尾 → 署名", "正文 → 稱謂 → 結尾", "稱謂 → 署名 → 正文"], answer: 1, hints: ["先稱呼對方，再問候、說明事情", "最後才簽名"], explanation: "正確順序是稱謂、開頭問候、正文、結尾、署名。" },
    { id: "jem3", prompt: "信末要結束時，下列哪一句最合適？", options: ["Dear Tom,", "Best regards,", "How are you?", "I am fine."], answer: 1, hints: ["結尾語要能接上署名", "Dear 是稱謂，不是結尾"], explanation: "Best regards, 是常見的結尾語，後面接署名。" },
    { id: "jem4", prompt: "寫 e-mail 給不確定是誰的對象，稱謂最好寫？", options: ["Dear you,", "Dear Sir or Madam,", "Dear friend,", "Hi, 沒有稱謂"], answer: 1, hints: ["不知道對方姓名時的正式寫法", "Sir 與 Madam 分別指先生與女士"], explanation: "不確定收件者時用 Dear Sir or Madam," },
    { id: "jem5", prompt: "關於 e-mail 正文，下列哪一個建議最好？", options: ["全部擠成一大段最省事", "一件事一段，先說明來意再補充細節", "只寫一個字就好", "不要分段，段落是給作文用的"], answer: 1, hints: ["分段讓對方好讀", "先講目的再看細節"], explanation: "正文應該分段，先說明來意、再補充細節、最後提出請求。" },
  ],
};

export default [
  JH_ENG_PAST,
  JH_ENG_FUTURE,
  JH_ENG_COMPARATIVE,
  JH_ENG_GERUND,
  JH_ENG_RELATIVE,
  JH_ENG_CONJUNCTION,
  JH_ENG_READING,
  JH_ENG_EMAIL,
];
