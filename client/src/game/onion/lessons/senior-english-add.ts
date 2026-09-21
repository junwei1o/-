/**
 * 高中英文補充課程（洋蔥學院 200 堂擴充計畫：三、高中新增 65 堂／英文 4 堂）。
 *
 * 內容依 docs/onion-200-plan.md 的課表撰寫；每一堂都是 7 幀步驟分鏡
 * （字幕用中文講解、英文例句內嵌）＋ 至少 2 次中途提問 ＋ 5 題闖關 ＋ 3 條 takeaways。
 * 教具以 text（句型公式與例句）與 flow（時態軸線、寫作步驟）為主。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 課程 1：英文（高中）— 時態總整理（12 時態）
 * ======================================================================== */
const SH_ENG_TENSES: OnionLesson = {
  id: "sh-eng-tenses",
  title: "時態總整理：12 個時態怎麼用",
  subject: "英文",
  topic: "時態總整理",
  grade: "高一",
  stages: ["高中"],
  desc: "英文動詞隨時間變化。時間三線（過去、現在、未來）乘四種看法，共 12 時態，每個都給你正確例句。",
  takeaways: [
    "12 時態 = 時間（過去/現在/未來）× 看法（簡單/進行/完成/完成進行）",
    "簡單式講事實與習慣；進行式講正在發生；完成式強調到目前的經驗或結果",
    "現在完成式（have + p.p.）講到目前的經驗，過去簡單式只講過去某一時點，兩者不同",
  ],
  frames: [
    { step: "步驟 1：看見十二時態", id: 1, caption: "嗨！英文有 12 個時態。時間分過去、現在、未來三條線，每條線又有四種看法，三乘四就是十二。", action: "wave", prop: { kind: "text", text: "12 時態 = 時間 × 看法", sub: "過去/現在/未來 × 簡單/進行/完成/完成進行", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：時間分三線", id: 2, caption: "先記時間三線：過去是已經發生，現在是說話當下，未來是還沒發生。動詞會隨時間改樣子。", action: "point", prop: { kind: "flow", steps: ["過去 Past：已發生", "現在 Now：當下", "未來 Future：還沒"], active: 1 }, duration: 3600 },
    { step: "步驟 3：簡單式例句", id: 3, caption: "簡單式講事實或習慣。每天吃：I eat.；昨天吃：I ate.；明天會吃：I will eat.", action: "think", prop: { kind: "text", text: "簡單式：事實、習慣", sub: "I eat. / I ate. / I will eat.", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：進行式例句", id: 4, caption: "進行式強調動作正在發生。正在吃：I am eating.；那時在吃：I was eating.；將在吃：I will be eating.", ask: { prompt: "「Look! He ___ dinner now.」空格要用？", options: ["cooks", "is cooking", "cooked", "will cook"], answer: 1, hint: "now 與 Look! 提示正在發生，用 be 動詞 + V-ing。" }, action: "point", prop: { kind: "text", text: "進行式：正在發生", sub: "I am eating. / I was eating. / I will be eating.", tone: "ok" }, duration: 3800 },
    { step: "步驟 5：完成式例句", id: 5, caption: "完成式強調到目前的經驗或結果：I have eaten（已經吃了）講經驗，和過去式 I ate（昨天吃了）只講過去時點不同。", ask: { prompt: "「我已經看過這部電影」要用哪個時態？", options: ["I saw the movie.", "I have seen the movie.", "I see the movie.", "I will see it."], answer: 1, hint: "「已經看過」強調到目前的經驗，用 have + seen。" }, action: "walk", prop: { kind: "text", text: "完成式：經驗、結果", sub: "I have eaten. / I had eaten. / I will have eaten.", tone: "ok" }, duration: 4000 },
    { step: "步驟 6：完成進行式例句", id: 6, caption: "完成進行式強調動作從過去持續到某個時間點：I have been eating.、I had been eating.、I will have been eating.", action: "think", prop: { kind: "text", text: "完成進行式：持續動作", sub: "I have been eating. / I had been eating. / I will have been eating.", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：記住十二時態", id: 7, caption: "口訣：時間三線乘四種看法等於十二時態。先看時間，再想強調什麼，準備闖關！", action: "cheer", prop: { kind: "text", text: "時間 × 看法 = 12 時態", sub: "過去/現在/未來 × 簡單/進行/完成/完成進行", tone: "ok" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-eng-tenses-1", prompt: "英文一共有幾個時態？", options: ["4", "8", "12", "16"], answer: 2, hints: ["時間有 3 條線", "每條線 4 種看法，3 × 4 = ?"], explanation: "時間（過去/現在/未來）三線，乘上四種看法（簡單/進行/完成/完成進行），共 12 個時態。" },
    { id: "sh-eng-tenses-2", prompt: "「I eat breakfast every day.」屬於哪個時態？", options: ["現在簡單式", "現在進行式", "過去式", "未來式"], answer: 0, hints: ["every day 是習慣", "簡單式講習慣或事實"], explanation: "every day 表示習慣，動詞用原形 eat，是現在簡單式。" },
    { id: "sh-eng-tenses-3", prompt: "「Look! It is raining.」用了什麼結構？", options: ["be 動詞 + V-ing", "have + p.p.", "will + 原形", "動詞原形"], answer: 0, hints: ["Look! 表示正在發生", "進行式 = be + V-ing"], explanation: "is raining 是 be 動詞 + V-ing，配合 Look! 表示此刻正在下雨，是現在進行式。" },
    { id: "sh-eng-tenses-4", prompt: "「I have finished my homework.」強調什麼？", options: ["過去某時點發生", "到目前為止已經完成", "未來才要做", "動作正在進行"], answer: 1, hints: ["have + p.p. 是完成式", "強調對現在的影響或結果"], explanation: "have finished 是現在完成式，強調到目前為止已經完成的經驗或結果。" },
    { id: "sh-eng-tenses-5", prompt: "下列哪一組比較正確？「我已經看過」對比「我昨天看過」", options: ["兩者都用 I saw", "前者 I have seen、後者 I saw", "兩者都用 I have seen", "前者 I see、後者 I saw"], answer: 1, hints: ["「已經」用完成式", "「昨天」用過去式"], explanation: "「已經看過」強調經驗用 I have seen；「昨天看過」指過去某一時點用 I saw，兩者不能混用。" },
  ],
};

/* ========================================================================
 * 課程 2：英文（高中）— 假設語氣（subjunctive mood）
 * ======================================================================== */
const SH_ENG_SUBJUNCTIVE: OnionLesson = {
  id: "sh-eng-subjunctive",
  title: "假設語氣：if 子句怎麼退一層",
  subject: "英文",
  topic: "假設語氣",
  grade: "高二",
  stages: ["高中"],
  desc: "和事實相反或純想像時用假設語氣。現在用 were、過去用 had been、未來用現在式，動詞都要退一層。",
  takeaways: [
    "與現在事實相反：if + 過去式, 主句 would + 原形（If I were you, I would take the job.）",
    "與過去事實相反：if + 過去完成式, 主句 would have + p.p.（If I had studied harder, I would have passed.）",
    "未來有可能：if + 現在式, 主句 will + 原形（If it rains, we will stay home.）",
  ],
  frames: [
    { step: "步驟 1：什麼是假設語氣", id: 1, caption: "嗨！當我們想像「如果怎樣，就會怎樣」，而且和事實相反時，就要用假設語氣。先看和現在相反。", action: "wave", prop: { kind: "text", text: "假設語氣：說「如果…就…」", sub: "談論與事實相反或假想的情況", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：與現在相反結構", id: 2, caption: "與現在事實相反：if 子句用過去式，主句用 would 加原形動詞，表示這件事現在並非如此。", action: "point", prop: { kind: "flow", steps: ["if 子句：與事實相反", "動詞用過去式", "主句用 would + 原形"], active: 1 }, duration: 3800 },
    { step: "步驟 3：記住 be 用 were", id: 3, caption: "注意 be 動詞要用 were（不分人稱）：If I were you, I would take the job. 表示與現在事實相反。", ask: { prompt: "與現在事實相反時，if 子句的 be 動詞要用？", options: ["am / is / are", "was / were（都用 were）", "will be", "be 原形"], answer: 1, hint: "假設語氣中 be 不分人稱，一律用 were。" }, action: "think", prop: { kind: "text", text: "If I were you, I would take the job.", sub: "與現在相反：if + 過去式, would + 原形", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：與過去相反結構", id: 4, caption: "與過去事實相反，要往回退一層：if 子句用過去完成式 had + p.p.，主句用 would have + p.p.", action: "point", prop: { kind: "flow", steps: ["if + 過去完成式 (had + p.p.)", "主句 would have + p.p.", "表示與過去事實相反"], active: 2 }, duration: 3800 },
    { step: "步驟 5：過去相反例句", id: 5, caption: "例如考試沒過，你後悔說：If I had studied harder, I would have passed.（要是我那時更用功，就考過了。）", action: "walk", prop: { kind: "text", text: "If I had studied harder, I would have passed.", sub: "與過去相反：if + had+p.p., would have+p.p.", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：未來可能不相反", id: 6, caption: "未來真有可能發生，就不是相反：if 子句用現在式，主句用 will 加原形。If it rains, we will stay home.", ask: { prompt: "「If it ___, we will stay home.」空格要用？", options: ["will rain", "rains", "rained", "would rain"], answer: 1, hint: "未來有可能，if 子句用現在式 rains，主句才用 will。" }, action: "think", prop: { kind: "text", text: "If it rains, we will stay home.", sub: "未來可能：if + 現在式, will + 原形", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：三種假設口訣", id: 7, caption: "口訣：與現在相反用 were，與過去相反用 had been，未來可能用現在式。記住動詞要退一層，準備闖關！", action: "cheer", prop: { kind: "text", text: "三種假設語氣", sub: "現在 were / 過去 had been / 未來 will", tone: "ok" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-eng-subjunctive-1", prompt: "與現在事實相反的假設語氣，正確結構是？", options: ["if + 現在式, will + 原形", "if + 過去式, would + 原形", "if + 過去完成式, would have + p.p.", "if + will, would"], answer: 1, hints: ["與現在相反", "if 用過去式、主句用 would"], explanation: "與現在事實相反：if 子句用過去式，主句用 would + 原形動詞。" },
    { id: "sh-eng-subjunctive-2", prompt: "「If I ___ a bird, I would fly.」空格要用？", options: ["am", "was", "were", "be"], answer: 2, hints: ["假設語氣 be 用 were", "不分人稱都用 were"], explanation: "假設語氣中 be 動詞不分人稱，一律用 were：If I were a bird." },
    { id: "sh-eng-subjunctive-3", prompt: "「If I had known it, I ___ .」空格要用？", options: ["will tell", "would tell", "would have told", "told"], answer: 2, hints: ["had known 是過去完成式", "主句用 would have + p.p."], explanation: "if 子句 had known 是過去完成式，主句要用 would have + p.p.，即 would have told。" },
    { id: "sh-eng-subjunctive-4", prompt: "「If it rains tomorrow, we ___ stay home.」空格要用？", options: ["would", "will", "would have", "had"], answer: 1, hints: ["未來真有可能發生", "主句用 will"], explanation: "這是未來有可能發生的真實條件句，if 子句用現在式 rains，主句用 will stay home。" },
    { id: "sh-eng-subjunctive-5", prompt: "下列哪一句是與過去事實相反？", options: ["If I were rich, I would travel.", "If I had been rich, I would have traveled.", "If it rains, I will stay.", "If I am you, I help."], answer: 1, hints: ["had been / would have 是退一層", "那是往回退一層的過去相反"], explanation: "If I had been rich, I would have traveled. 用 had been 與 would have traveled，表示與過去事實相反。" },
  ],
};

/* ========================================================================
 * 課程 3：英文（高中）— 分詞與分詞構句
 * ======================================================================== */
const SH_ENG_PARTICIPLE: OnionLesson = {
  id: "sh-eng-participle",
  title: "分詞與分詞構句：簡化副詞子句",
  subject: "英文",
  topic: "分詞與分詞構句",
  grade: "高二",
  stages: ["高中"],
  desc: "現在分詞表主動進行、過去分詞表被動完成。分詞構句可簡化副詞子句，但主詞須與主句一致，否則成懸垂分詞。",
  takeaways: [
    "現在分詞（V-ing）：表示主動、進行，可當形容詞或進入分詞構句",
    "過去分詞（p.p.）：表示被動、完成，可當形容詞或進入分詞構句",
    "分詞構句 = 簡化副詞子句，主詞須與主句一致，否則會形成懸垂分詞",
  ],
  frames: [
    { step: "步驟 1：兩種分詞", id: 1, caption: "嗨！分詞可以當形容詞，也能把副詞子句變短。先認識現在分詞和過去分詞的差別。", action: "wave", prop: { kind: "text", text: "分詞有兩種：現在與過去", sub: "present participle (V-ing) / past participle (p.p.)", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：現在分詞", id: 2, caption: "現在分詞是動詞加 -ing，表示「主動」或「正在進行」：The crying baby is hungry.（正在哭的寶寶餓了。）", action: "point", prop: { kind: "flow", steps: ["現在分詞 V-ing", "表主動、進行", "The crying baby..."], active: 1 }, duration: 3800 },
    { step: "步驟 3：過去分詞", id: 3, caption: "過去分詞就是 p.p.，表示「被動」或「已經完成」：The broken window was fixed.（被打破的窗戶已修好。）", action: "think", prop: { kind: "text", text: "The broken window was fixed.", sub: "過去分詞 p.p. 表被動、完成", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：分詞構句由來", id: 4, caption: "分詞構句是把副詞子句簡化：When I was walking home, I saw a dog. 可寫成 Walking home, I saw a dog.", ask: { prompt: "「___ home, I saw a dog.」開頭要用？", options: ["Walk", "Walking", "Walked", "To walk"], answer: 1, hint: "主詞 I 是「走」的主動者，用現在分詞 Walking。" }, action: "point", prop: { kind: "flow", steps: ["副詞子句 When I was walking home", "簡化成 Walking home", "主詞必須一致"], active: 1 }, duration: 4000 },
    { step: "步驟 5：主詞要一致", id: 5, caption: "分詞構句的主詞要和主句主詞相同：這裡 I 既在走又在看狗，所以可以用 Walking home 開頭。", action: "walk", prop: { kind: "text", text: "Walking home, I saw a dog.", sub: "＝ When I was walking home, I saw a dog.", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：當心懸垂分詞", id: 6, caption: "小心懸垂分詞！若寫 Walking home, a dog bit me.，會變成狗在走回家，這就叫主詞不一致。", ask: { prompt: "為什麼「Walking home, a dog bit me.」是錯的？", options: ["dog 不該用 a", "主詞 a dog 不是走的人，形成懸垂分詞", "walking 拼錯", "bit 時態錯"], answer: 1, hint: "分詞的主詞必須與主句主詞一致。" }, action: "think", prop: { kind: "text", text: "懸垂分詞：a dog 沒在走", sub: "分詞的主詞要和主句主詞一致", tone: "warn" }, duration: 3800 },
    { step: "步驟 7：分詞構句口訣", id: 7, caption: "口訣：分詞構句先找副詞子句，主詞要和主句一樣，才不會寫出懸垂分詞。準備闖關！", action: "cheer", prop: { kind: "text", text: "分詞構句三步", sub: "簡化副詞子句 → 主詞一致 → 不懸垂", tone: "ok" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-eng-participle-1", prompt: "「The ___ boy is my brother.」空格要用？", options: ["smile", "smiling", "smiled", "to smile"], answer: 1, hints: ["主動、進行用 V-ing", "正在笑的男孩"], explanation: "smiling 是現在分詞，表示主動、正在笑的男孩，作形容詞修飾 boy。" },
    { id: "sh-eng-participle-2", prompt: "「The ___ window was fixed.」空格要用？", options: ["break", "breaking", "broken", "broke"], answer: 2, hints: ["窗戶被打破，被動用 p.p.", "broken 是 break 的 p.p."], explanation: "broken 是過去分詞，表被動、已完成，意思是「被打破的窗戶」。" },
    { id: "sh-eng-participle-3", prompt: "「When I heard the news, I cried.」可簡化為？", options: ["Hearing the news, I cried.", "Heard the news, I cried.", "Hear the news, I cried.", "To hear the news, I cried."], answer: 0, hints: ["I 是 hear 的主動者", "用現在分詞 Hearing"], explanation: "I 是 hear 的主動者，副詞子句可簡化為 Hearing the news, I cried." },
    { id: "sh-eng-participle-4", prompt: "「Seen from the hill, ___ .」主詞應該是？", options: ["the city looks beautiful.", "I saw a car.", "a dog ran.", "we go home."], answer: 0, hints: ["seen 是被動，主詞要能被看", "the city 被看"], explanation: "Seen from the hill 是被動分詞構句，主詞必須是「被看」的事物，故用 the city looks beautiful." },
    { id: "sh-eng-participle-5", prompt: "下列哪一句有懸垂分詞的錯誤？", options: ["Walking in the park, I saw a flower.", "Born in Taipei, she speaks Taiwanese.", "Reading the book, a phone rang.", "Tired, he went to bed."], answer: 2, hints: ["a phone 不是讀書的人", "主詞不一致"], explanation: "Reading the book, a phone rang. 中 phone 不會讀書，形成懸垂分詞；應改為 Reading the book, I heard a phone ring." },
  ],
};

/* ========================================================================
 * 課程 4：英文（高中）— 閱讀與寫作整合
 * ======================================================================== */
const SH_ENG_READING_WRITING: OnionLesson = {
  id: "sh-eng-reading-writing",
  title: "閱讀與寫作整合：抓重點、寫段落、會轉述",
  subject: "英文",
  topic: "閱讀與寫作整合",
  grade: "高三",
  stages: ["高中"],
  desc: "會讀才會寫。抓主題句與轉折詞讀懂文章，照主題句→細節→結論寫段落，轉述要改寫不照抄。",
  takeaways: [
    "閱讀：先找主題句（常在段首），再抓關鍵字與轉折詞（however/therefore/in addition）",
    "寫作：段落 = 主題句 → supporting details → concluding sentence；摘要留主張與結論、刪例子",
    "轉述要改寫句型與詞彙，避免照抄原句",
  ],
  frames: [
    { step: "步驟 1：讀寫是一家", id: 1, caption: "嗨！高三我們把閱讀和寫作整合：會讀文章才能寫文章。先學怎麼快速抓一篇文章的重點。", action: "wave", prop: { kind: "text", text: "閱讀與寫作是一家", sub: "讀得懂，才寫得出", tone: "ok" }, duration: 3400 },
    { step: "步驟 2：找主題句", id: 2, caption: "閱讀第一步找主題句，它通常在段落開頭，點出這段在講什麼；剩下的句子都在支持它。", action: "point", prop: { kind: "flow", steps: ["找主題句 (常在段首)", "抓關鍵字", "注意轉折詞 however/therefore"], active: 0 }, duration: 3800 },
    { step: "步驟 3：抓轉折詞", id: 3, caption: "接著抓關鍵字和轉折詞：however 是轉折、therefore 是因果、in addition 是補充，它們決定句子間邏輯。", action: "think", prop: { kind: "text", text: "however 表轉折 / therefore 表因果 / in addition 表補充", sub: "轉折詞告訴你邏輯方向", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：段落寫作結構", id: 4, caption: "段落寫作有固定結構：先用主題句點題，再給 supporting details，最後用結論句收尾。", ask: { prompt: "一個標準段落的順序是？", options: ["細節→主題→結論", "主題句→細節→結論句", "結論→細節→主題", "細節→結論→主題"], answer: 1, hint: "先點題，再支持，最後收尾。" }, action: "point", prop: { kind: "flow", steps: ["topic sentence 主題句", "supporting details 細節", "concluding sentence 結論"], active: 0 }, duration: 4000 },
    { step: "步驟 5：寫摘要", id: 5, caption: "寫摘要時保留作者的主張和結論，把舉的例子和細節刪掉，用自己的話濃縮成幾句話。", action: "walk", prop: { kind: "text", text: "摘要：留主張與結論，刪例子", sub: "Summarize: keep claim & conclusion", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：學會轉述", id: 6, caption: "轉述（paraphrase）要避免照抄原句，改寫句型與替換詞彙，但意思要完全一樣，這才不算抄襲。", ask: { prompt: "轉述（paraphrase）最重要的是？", options: ["照抄原句最安全", "改寫句型與詞彙但意思相同", "只用同義詞替換", "句子越長越好"], answer: 1, hint: "不能照抄，要改寫但保持原意。" }, action: "think", prop: { kind: "text", text: "轉述：改寫句型與詞彙，不照抄", sub: "Paraphrase: change wording & structure", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：讀寫整合口訣", id: 7, caption: "口訣：讀文章先抓主題句與轉折詞，寫段落照主題→細節→結論，轉述要改寫不照抄。準備闖關！", action: "cheer", prop: { kind: "text", text: "讀寫整合三步", sub: "抓重點 → 列結構 → 轉述摘要", tone: "ok" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-eng-reading-writing-1", prompt: "文章的主題句（topic sentence）通常出現在？", options: ["段尾", "段首", "段落中間隨機", "只在標題"], answer: 1, hints: ["主題句點出重點", "常在段落開頭"], explanation: "主題句通常放在段落開頭，先點出這一段的核心觀點。" },
    { id: "sh-eng-reading-writing-2", prompt: "「however」在文中通常表示？", options: ["因果", "轉折", "舉例", "總結"], answer: 1, hints: ["however = 但是", "表示意思轉彎"], explanation: "however 是轉折詞，表示前後意思相反或轉彎，等同中文的「然而、但是」。" },
    { id: "sh-eng-reading-writing-3", prompt: "寫一個段落時，正確的結構是？", options: ["主題句→細節→結論句", "細節→結論→主題句", "結論→主題→細節", "細節→主題→結論"], answer: 0, hints: ["先點題", "再支持、最後收尾"], explanation: "標準段落為：主題句開頭點題，supporting details 提供支持，concluding sentence 收尾。" },
    { id: "sh-eng-reading-writing-4", prompt: "寫摘要時應該？", options: ["保留所有例子", "留主張與結論、刪例子", "照抄第一段", "越長越好"], answer: 1, hints: ["摘要要濃縮", "保留主張和結論"], explanation: "摘要只保留作者主張與結論，刪去例子和細節，濃縮成簡短幾句。" },
    { id: "sh-eng-reading-writing-5", prompt: "下列哪個做法符合正確的轉述？", options: ["直接複製原句", "只改幾個字但結構相同", "改寫句型與詞彙、意思不變", "翻譯成中文再翻回英文"], answer: 2, hints: ["轉述要改寫", "意思必須相同"], explanation: "正確轉述要改寫句型並替換詞彙，但意思保持不變，以避免抄襲之嫌。" },
  ],
};

export default [
  SH_ENG_TENSES,
  SH_ENG_SUBJUNCTIVE,
  SH_ENG_PARTICIPLE,
  SH_ENG_READING_WRITING,
];
