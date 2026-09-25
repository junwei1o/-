import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 國中國語 7 堂（洋蔥學院擴充計畫）
 * 設計原則：一步一觀念、圖解真的畫得出概念、中途提問、5 題由淺入深。
 * 9 幀分鏡（每幀 step／caption／action／prop／duration，至少 3 幀有 ask）
 * ＋ 7 題闖關（2 基本 → 2 應用 → 1 易錯 → 2 加深）＋ 4 條 takeaways。
 * 圖解建議：文言文、成語、唐詩、議論、描寫多用 text／flow／balance／bars。
 * ======================================================================== */

/* ===================== 國語 1：文言文入門（七上） ===================== */
const JH_CHI_CLASSICAL_INTRO: OnionLesson = {
  id: "jh-chi-classical-intro",
  title: "文言文入門：之、其、而、以怎麼用？",
  subject: "國語",
  topic: "文言文虛字",
  grade: "七上",
  stages: ["國中"],
  desc: "文言文四個最常見的虛字：之、其、而、以。洋蔥用字卡帶你一眼認出它們的詞性與用法。",
  takeaways: ["之＝他/它；其＝他的/那（代詞）", "而連接句子（又/卻）；以表用或因", "先判詞性再選意思，助詞「之」＝的", "「之」兼代詞與助詞：名詞＋之＋名詞之間，「之」多半譯「的」"],
  frames: [
    { step: "步驟 1：認識四個虛字", id: 1, caption: "嗨！文言文裡「之、其、而、以」最常出現，先把這四個虛字認熟。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：學「之」「其」代詞", id: 2, caption: "「之」是「他、它」，「其」是「他的、那個」，都用來代替人或事物。", action: "point", prop: { kind: "text", text: "之＝他/它；其＝他的/那", sub: "例：學而時習之／出其不意", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：「之」還有「的」的意思", id: 3, caption: "易混點提醒：「之」有時候不是代詞，而是助詞「的」，看它站在哪裡就知道。", action: "think", prop: { kind: "balance", left: "名詞＋之＋名詞：之＝的", right: "動詞＋之：之＝他/它", tip: "位置不同，意思不同" }, duration: 3600 },
    { step: "步驟 4：學「而」「以」連詞", id: 4, caption: "「而」連接句子（又/卻），「以」表示「用」或「因為」，意思要看上下文。", ask: { prompt: "「學而時習之」的「而」該選哪個意思？", options: ["又、而且（順接）", "卻、但是（轉折）", "用、拿", "他、它"], answer: 0, hint: "「學了又按時複習」，這裡是順接，用「又、而且」。" }, action: "think", prop: { kind: "text", text: "而＝又/卻；以＝用/因為", sub: "例：學而時習之／以牙還牙", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：試著標出虛字", id: 5, caption: "動手試：讀「子曰：學而時習之，不亦說乎」，把四個虛字圈出來吧！", ask: { prompt: "「學而時習之」一句中，下列哪一個字是「而」？", options: ["學", "而", "時", "之"], answer: 1, hint: "找連接「學」和「時習」的那個字。" }, action: "jump", prop: { kind: "flow", steps: ["學（動詞）", "而（連接）", "時習之（動詞）"], active: 1 }, duration: 3600 },
    { step: "步驟 6：再練「以」的兩種意思", id: 6, caption: "再動手：「以」可當「用」也可當「因為」，看上下文判斷它是哪個意思。", ask: { prompt: "「不以物喜，不以己悲」的「以」是什麼意思？", options: ["因為（表原因）", "用、拿", "他的", "又、而且"], answer: 0, hint: "「不因外物而喜」，這裡是表原因。" }, action: "think", prop: { kind: "balance", left: "以＋工具：以牙還牙（用）", right: "以＋原因：不以物喜（因為）", tip: "看後面接的是工具還是原因" }, duration: 3800 },
    { step: "步驟 7：四字總對照", id: 7, caption: "四字總整理：之與其都代人事物，而與以多半連接或表示工具、原因。", action: "point", prop: { kind: "balance", left: "之、其：代人/物（代詞）", right: "而、以：連接/用/因", tip: "記清詞性不混淆" }, duration: 3600 },
    { step: "步驟 8：記虛字口訣", id: 8, caption: "口訣：之是他、其是他；而連又卻、以是用因。先判詞性就不亂。", action: "cheer", prop: { kind: "flow", steps: ["之＝他/它", "其＝他的/那", "而＝又/卻", "以＝用/因"], active: 3 }, duration: 3400 },
    { step: "步驟 9：準備闖關", id: 9, caption: "四個虛字記牢了嗎？準備闖關，看你能不能一眼認出它們！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-chi-classical-intro-1", prompt: "「學而時習之」的「之」指什麼？", options: ["的", "他、它（代詞）", "但是", "因為"], answer: 1, hints: ["「之」代替前面學過的內容", "它是代詞，不是連詞"], explanation: "「之」在這裡代替前面提到的學過的知識，是代詞「他、它」。" },
    { id: "jh-chi-classical-intro-2", prompt: "「出其不意」的「其」是什麼意思？", options: ["用、拿", "又、而且", "他的、那個", "卻"], answer: 2, hints: ["「其」指第三人稱所有格", "它修飾後面的名詞"], explanation: "「其」是「他的、那個」，表示第三人稱，修飾後面的名詞。" },
    { id: "jh-chi-classical-intro-3", prompt: "「學而時習之」的「而」屬於哪種用法？", options: ["轉折（卻、但是）", "代詞（他）", "工具（用）", "順接（又、而且）"], answer: 3, hints: ["先學再複習是遞進", "遞進用順接"], explanation: "「學」與「時習」是遞進關係，「而」表順接，相當於「又、而且」。" },
    { id: "jh-chi-classical-intro-4", prompt: "「以牙還牙」的「以」是什麼詞義？", options: ["用、拿", "因為", "他的", "連接（又）"], answer: 0, hints: ["用牙齒去還擊", "這裡表示工具"], explanation: "「以」在這裡是「用、拿」的意思，表示動作的工具。" },
    { id: "jh-chi-classical-intro-5", prompt: "下列哪一個「之」是助詞「的」（不是代詞）？", options: ["學而時習之（代詞）", "齊國之美麗者也（的）", "操之過急（代詞）", "言之成理（代詞）"], answer: 1, hints: ["找「之」用在兩個名詞之間", "名詞＋之＋名詞，之常是「的」"], explanation: "「齊國之美麗者」中「之」在兩個名詞之間，是助詞「的」；其餘「之」都代詞。" },
    { id: "jh-chi-classical-intro-6", prompt: "「水陸草木之花，可愛者甚蕃」的「之」應解為？", options: ["他、它（代詞）", "卻（轉折）", "的（助詞）", "因為"], answer: 2, hints: ["「草木」與「花」都是名詞", "兩個名詞之間的「之」多半是「的」"], explanation: "「草木之花」是「草木的花」，「之」在兩個名詞之間，是助詞「的」。" },
    { id: "jh-chi-classical-intro-7", prompt: "「不以物喜，不以己悲」的「以」最接近哪個意思？", options: ["用、拿", "他的", "又、而且", "因為"], answer: 3, hints: ["句子在說「不因為外物而喜」", "它引出原因，不是工具"], explanation: "這句出自岳陽樓記，「以」引出原因，相當於「因為」，不是「用、拿」。" },
  ],
};

/* ===================== 國語 2：唐詩賞析（八上） ===================== */
const JH_CHI_TANG_POEM: OnionLesson = {
  id: "jh-chi-tang-poem",
  title: "唐詩賞析：絕句、律詩與意象",
  subject: "國語",
  topic: "唐詩賞析",
  grade: "八上",
  stages: ["國中"],
  desc: "絕句、律詩怎麼分？意象怎麼讀？洋蔥帶你賞一首唐詩，學會看句數、找意象、體會情感。",
  takeaways: ["絕句四句、律詩八句", "意象＝借景物傳情（月表思念、柳表送別）", "賞詩：看句數→找意象→體會情感", "絕句、律詩各分五言（每句五字）與七言（每句七字）；押韻句尾同韻"],
  frames: [
    { step: "步驟 1：認識唐詩兩大類", id: 1, caption: "嗨！唐詩分兩大類：絕句四句、律詩八句，先認識它們的長相。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：分辨絕句與律詩", id: 2, caption: "絕句只有四句（五言或七言），律詩有八句且講究對仗與押韻。", action: "point", prop: { kind: "text", text: "絕句＝4句；律詩＝8句", sub: "五言/七言皆可", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：五言與七言", id: 3, caption: "每句的字數也有講究：每句五字叫五言，每句七字叫七言，兩者讀起來節奏不同。", action: "point", prop: { kind: "balance", left: "五言：每句五字", right: "七言：每句七字", tip: "絕句、律詩都可分五言或七言" }, duration: 3400 },
    { step: "步驟 4：學意象是什麼", id: 4, caption: "意象是詩人借景物傳情：月亮常表思念，柳枝表送別，看景就懂心情。", ask: { prompt: "唐詩裡「月亮」這個意象，常表達什麼情感？", options: ["思念、鄉愁", "生氣", "速度", "寒冷"], answer: 0, hint: "月圓人未圓，常引遊子思念。" }, action: "think", prop: { kind: "text", text: "月＝思念；柳＝送別；暮＝遲暮", sub: "景中有情", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：讀一首絕句", id: 5, caption: "讀李白〈靜夜思〉：床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。", action: "jump", prop: { kind: "text", text: "靜夜思（李白）", sub: "明月→思故鄉", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：找一找押韻的字", id: 6, caption: "押韻是把句尾同韻母的字排在一起唸起來順口；〈靜夜思〉的「光、霜、鄉」都押 ang 韻。", ask: { prompt: "〈靜夜思〉押韻的字不包括下列哪一個？", options: ["光", "明月", "霜", "鄉"], answer: 1, hint: "找句尾讀起來押 ang 韻的字。" }, action: "think", prop: { kind: "flow", steps: ["床前明月光（guāng）", "疑是地上霜（shuāng）", "低頭思故鄉（xiāng）"], active: 2 }, duration: 3800 },
    { step: "步驟 7：賞析意象與格律", id: 7, caption: "這首絕句押「ang」韻，明月照出孤寂，低頭動作寫盡思鄉之情。", ask: { prompt: "〈靜夜思〉「舉頭望明月，低頭思故鄉」用了什麼手法表情？", options: ["借景抒情（意象）", "誇張", "對比數字", "議論說理"], answer: 0, hint: "用明月、低頭的動作帶出思念。" }, action: "point", prop: { kind: "flow", steps: ["明月光（起興）", "望明月（看景）", "思故鄉（抒情）"], active: 2 }, duration: 3800 },
    { step: "步驟 8：記賞析口訣", id: 8, caption: "賞詩口訣：先看幾句（絕/律）、再找意象、最後體會詩人的情感。", action: "cheer", prop: { kind: "flow", steps: ["幾句？絕句/律詩", "找意象（景）", "體會情感"], active: 2 }, duration: 3400 },
    { step: "步驟 9：準備闖關", id: 9, caption: "絕句律詩、意象情感都記住了？準備闖關，試著賞一首唐詩！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-chi-tang-poem-1", prompt: "唐詩的「絕句」通常由幾句組成？", options: ["八句", "四句", "兩句", "六句"], answer: 1, hints: ["絕句短小精練", "律詩才是八句"], explanation: "絕句通常由四句組成；律詩才是八句。" },
    { id: "jh-chi-tang-poem-2", prompt: "「律詩」比絕句長，通常由幾句組成？", options: ["四句", "十句", "八句", "三句"], answer: 2, hints: ["律詩講究對仗，篇幅較長", "絕句四句、律詩八句"], explanation: "律詩通常由八句組成，並講究中間兩聯對仗。" },
    { id: "jh-chi-tang-poem-3", prompt: "「柳」在唐詩中常象徵什麼？", options: ["生氣", "財富", "時間快", "送別、留念"], answer: 3, hints: ["「柳」諧音「留」", "古人折柳送行"], explanation: "「柳」諧音「留」，唐詩常以柳象徵送別、留念。" },
    { id: "jh-chi-tang-poem-4", prompt: "「舉頭望明月，低頭思故鄉」表達什麼？", options: ["思鄉之情", "喜慶", "描寫天氣", "批評月亮"], answer: 0, hints: ["望月引思念", "低頭動作帶出故鄉"], explanation: "詩人借明月與低頭的動作，寫出濃濃的思鄉之情。" },
    { id: "jh-chi-tang-poem-5", prompt: "下列何者屬於「律詩」而非絕句？", options: ["《靜夜思》（四句）", "《春望》（八句，杜甫）", "《登鸛雀樓》（四句）", "《江雪》（四句）"], answer: 1, hints: ["律詩八句、講對仗", "其他都是四句的絕句"], explanation: "杜甫〈春望〉共八句，是律詩；其餘皆為四句的絕句。" },
    { id: "jh-chi-tang-poem-6", prompt: "「白日依山盡，黃河入海流。欲窮千里目，更上一層樓。」每句五字，這是？", options: ["七言絕句", "五言律詩", "五言絕句", "七言律詩"], answer: 2, hints: ["四句是絕句", "每句五字是五言"], explanation: "全詩四句、每句五字，是五言絕句。" },
    { id: "jh-chi-tang-poem-7", prompt: "律詩哪裡最講究對仗？", options: ["第一句", "最後一句", "題目", "中間兩聯（頷聯、頸聯）"], answer: 3, hints: ["對仗在中間最常見", "頭尾兩聯不要求對仗"], explanation: "律詩的頷聯（三、四句）與頸聯（五、六句）要求字詞相對，是對仗的重點。" },
  ],
};

/* ===================== 國語 3：議論文的論點與論據（八下） ===================== */
const JH_CHI_ARGUMENT: OnionLesson = {
  id: "jh-chi-argument",
  title: "議論文的論點與論據",
  subject: "國語",
  topic: "議論文三要素",
  grade: "八下",
  stages: ["國中"],
  desc: "議論文靠論點、論據、論證三要素說服人。洋蔥用對照卡帶你一眼抓出文章的主張與證明。",
  takeaways: ["論點＝文章的主張", "論據＝支持論點的材料（事實/名言/數據）", "論證＝把論點與論據串起來的推理", "論點多在開頭或結尾；論據分事實論據（事例、數據）與道理論據（名言、定理）"],
  frames: [
    { step: "步驟 1：認識議論文目的", id: 1, caption: "嗨！議論文是要說服別人同意你的看法，關鍵在「論點」站不站得住。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：找論點（主張）", id: 2, caption: "論點是文章的主張，通常是一句清楚的話，像「閱讀讓人更寬容」。", action: "point", prop: { kind: "text", text: "論點＝文章的主張", sub: "例：閱讀讓人更寬容", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：論點常出現在哪", id: 3, caption: "論點最常出現在開頭（先講主張再舉例）或結尾（結論再重申一次），有時也在標題。", action: "point", prop: { kind: "flow", steps: ["開頭：先主張", "中間：舉證", "結尾：重申主張"], active: 0 }, duration: 3400 },
    { step: "步驟 4：找論據（證明）", id: 4, caption: "論據是用來支持論點的材料：舉事實、引名言、擺數據都算論據。", ask: { prompt: "「班上閱讀量前三名，作文都拿高分」這屬於哪種論據？", options: ["數據（事實）", "論點", "結論", "題目"], answer: 0, hint: "這是用統計數字來證明，屬事實資料。" }, action: "think", prop: { kind: "text", text: "論據＝支持論點的材料", sub: "事實/名言/數據", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：學論證怎連結", id: 5, caption: "論證是把論點和論據串起來的推理由：因為有證據，所以主張成立。", ask: { prompt: "「因為讀得多見識廣，所以閱讀讓人寬容」這是什麼？", options: ["論點", "論證（推論過程）", "論據", "標題"], answer: 1, hint: "它把理由和主張連起來，是推論。" }, action: "jump", prop: { kind: "flow", steps: ["提出論點", "舉出論據", "推論成立"], active: 1 }, duration: 3600 },
    { step: "步驟 6：對照三段結構", id: 6, caption: "一張圖對照：論點是「主張」，論據是「證明」，論證是「推理的橋梁」。", action: "point", prop: { kind: "balance", left: "論點：主張（觀點）", right: "論據：證明（材料）", tip: "論證＝連起兩者的推理" }, duration: 3600 },
    { step: "步驟 7：論據的兩大類", id: 7, caption: "論據可分成兩種：事實論據（事例、數據）與道理論據（名人名言、定理）。", ask: { prompt: "「愛因斯坦說：想像力比知識更重要」屬於哪種論據？", options: ["道理論據（名言）", "事實論據（數據）", "論點", "結論"], answer: 0, hint: "引用名人的話來支持主張。" }, action: "think", prop: { kind: "balance", left: "事實論據：事例、數據", right: "道理論據：名言、定理", tip: "兩者都能支持論點" }, duration: 3800 },
    { step: "步驟 8：記議論文口訣", id: 8, caption: "口訣：先抓論點、再找論據、看論證怎麼推，文章就有說服力。", action: "cheer", prop: { kind: "flow", steps: ["抓論點", "找論據", "看論證"], active: 2 }, duration: 3400 },
    { step: "步驟 9：準備闖關", id: 9, caption: "論點、論據、論證都分清楚了？準備闖關，讀一段練抓重點！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-chi-argument-1", prompt: "議論文的「論點」是指什麼？", options: ["用來證明的例子", "文章的主張/看法", "推理的過程", "文章標題"], answer: 1, hints: ["論點是你要別人同意的話", "它是核心觀點"], explanation: "論點是文章想讓讀者同意的主張或看法，是議論文的核心。" },
    { id: "jh-chi-argument-2", prompt: "「引用名人名言來支持看法」中的名言屬於？", options: ["論點", "結論", "論據（材料）", "修辭"], answer: 2, hints: ["名言是用來證明的材料", "它支持論點"], explanation: "名言是用來支持論點的證明材料，屬於論據。" },
    { id: "jh-chi-argument-3", prompt: "把「理由」和「主張」串起來的那一步叫什麼？", options: ["論點", "論據", "引言", "論證"], answer: 3, hints: ["連接證據與主張的是推論", "它就是論證"], explanation: "論證是把論據與論點連起來、說明「為什麼成立」的推理過程。" },
    { id: "jh-chi-argument-4", prompt: "「運動有益健康，因為研究顯示每週運動者生病少」包含了哪些要素？", options: ["論點＋論據（有論證意味）", "只有論點", "只有論據", "什麼都沒有"], answer: 0, hints: ["前半是主張", "後半是用研究證明"], explanation: "「運動有益健康」是論點，「研究顯示…」是論據，二者相連已有論證意味。" },
    { id: "jh-chi-argument-5", prompt: "「古人說『讀書破萬卷，下筆如有神』」若用來支持「多讀書寫作好」，這句話是？", options: ["論點", "論據（引名言）", "結論", "題目"], answer: 1, hints: ["它是引用來證明的材料", "主張是「多讀書寫作好」"], explanation: "這句古語是用來支持主張的引證，屬論據；主張才是「多讀書寫作好」。" },
    { id: "jh-chi-argument-6", prompt: "下列何者屬於「事實論據」而非道理論據？", options: ["孔子說：學而時習之", "愛因斯坦說：想像力比知識重要", "統計：班級閱讀量前三名作文都高分", "俗話說：一寸光陰一寸金"], answer: 2, hints: ["事實論據是數據、事例", "其他三項都是引用話語"], explanation: "統計數字是事實論據；引用名人、古人、俗話都屬道理論據。" },
    { id: "jh-chi-argument-7", prompt: "一篇議論文開頭就說「環成廢物分類很重要」，這通常是？", options: ["論據", "結尾", "標點符號", "論點"], answer: 3, hints: ["開頭先講主張", "它是作者要說服人的看法"], explanation: "開頭直接提出的主張就是論點，後文才會舉論據支持。" },
  ],
};

/* ===================== 國語 4：成語典故（七下） ===================== */
const JH_CHI_IDIOM_ORIGIN: OnionLesson = {
  id: "jh-chi-idiom-origin",
  title: "成語典故：來歷與正確用法",
  subject: "國語",
  topic: "成語典故",
  grade: "七下",
  stages: ["國中"],
  desc: "成語大多有典故與正確語境。洋蔥講「畫蛇添足、守株待兔、亡羊補牢」的來歷與用法。",
  takeaways: ["畫蛇添足：多此一舉（出自《戰國策》）", "守株待兔：不知變通（出自《韓非子》）", "亡羊補牢：出錯後趕緊補救（出自《戰國策》）", "成語有褒貶色彩，要看語境；事後補救≠事先預防，不可混用"],
  frames: [
    { step: "步驟 1：成語大多有來歷", id: 1, caption: "嗨！很多成語來自歷史故事或古書，知道典故就不容易用錯。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：學「畫蛇添足」", id: 2, caption: "「畫蛇添足」出自《戰國策》：比賽畫蛇卻多畫腳，比喻多此一舉。", action: "point", prop: { kind: "text", text: "畫蛇添足", sub: "典故：畫蛇多添腳→多此一舉", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：學「守株待兔」", id: 3, caption: "「守株待兔」出自《韓非子》：農夫傻等撞樹的兔，比喻不知變通、妄想不勞而獲。", ask: { prompt: "「守株待兔」現在比喻什麼？", options: ["不知變通、傻等機會", "勤奮努力", "跑得飛快", "很有計畫"], answer: 0, hint: "農夫不種田只等兔，是不知變通。" }, action: "think", prop: { kind: "text", text: "守株待兔", sub: "典故：等撞樹的兔→不知變通", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：學「亡羊補牢」", id: 4, caption: "「亡羊補牢」出自《戰國策》：羊跑掉才修羊圈，比喻出錯後趕緊補救還不遲。", action: "jump", prop: { kind: "text", text: "亡羊補牢", sub: "典故：補羊圈→出錯快補救", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：成語有褒貶色彩", id: 5, caption: "成語還有感情色彩：有的稱讚（褒義）、有的批評（貶義），用錯會鬧笑話。", action: "point", prop: { kind: "balance", left: "褒義：鼓勵、稱讚", right: "貶義：諷刺、批評", tip: "看語境選成語" }, duration: 3400 },
    { step: "步驟 6：對照正確用法", id: 6, caption: "用對才加分：說「事後補救」用亡羊補牢；說「多此一舉」用畫蛇添足，別混。", ask: { prompt: "小明考完才狂補筆記，可用哪個成語？", options: ["畫蛇添足", "亡羊補牢", "守株待兔", "守口如瓶"], answer: 1, hint: "考完才補，是出錯後補救。" }, action: "point", prop: { kind: "balance", left: "亡羊補牢：事後補救", right: "畫蛇添足：多此一舉", tip: "看語境選成語" }, duration: 3800 },
    { step: "步驟 7：易混對照", id: 7, caption: "易混點：亡羊補牢是「事後補救」，未雨綢繆是「事先準備」，兩個時間點不同。", ask: { prompt: "出門前先帶傘以防下雨，可用哪個成語？", options: ["未雨綢繆", "亡羊補牢", "畫蛇添足", "守株待兔"], answer: 0, hint: "還沒下雨就先準備，是事先預防。" }, action: "think", prop: { kind: "balance", left: "未雨綢繆：事先準備", right: "亡羊補牢：事後補救", tip: "時間點一前一後" }, duration: 3800 },
    { step: "步驟 8：記典故口訣", id: 8, caption: "口訣：成語有典故，先想來歷再選詞；用錯語境就鬧笑話。", action: "cheer", prop: { kind: "flow", steps: ["想典故來歷", "看語境", "選對成語"], active: 2 }, duration: 3400 },
    { step: "步驟 9：準備闖關", id: 9, caption: "典故和用法都記好了？準備闖關，看你能不能選對成語！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-chi-idiom-origin-1", prompt: "「畫蛇添足」的意思接近？", options: ["勤奮", "多此一舉", "快速", "幸運"], answer: 1, hints: ["蛇本無腳，添腳多餘", "比喻做不必要的事"], explanation: "畫蛇添足比喻多此一舉、做不必要的動作。" },
    { id: "jh-chi-idiom-origin-2", prompt: "「守株待兔」出自哪本書？", options: ["《詩經》", "《論語》", "《韓非子》", "《孟子》"], answer: 2, hints: ["是韓非講的故事", "載於《韓非子》"], explanation: "守株待兔是《韓非子》中記載的寓言故事。" },
    { id: "jh-chi-idiom-origin-3", prompt: "「亡羊補牢」適合用在什麼情況？", options: ["事先預防", "完全沒用", "值得慶祝", "出錯後趕緊補救"], answer: 3, hints: ["羊丟了才修圈", "強調事後補救未晚"], explanation: "亡羊補牢比喻出錯後及時補救，還不算晚。" },
    { id: "jh-chi-idiom-origin-4", prompt: "比賽已結束他還一直加動作，觀眾覺得多餘，用哪個成語？", options: ["畫蛇添足", "亡羊補牢", "守株待兔", "一鳴驚人"], answer: 0, hints: ["加動作反而多餘", "對應多此一舉"], explanation: "多做的動作顯得多餘，對應「畫蛇添足」。" },
    { id: "jh-chi-idiom-origin-5", prompt: "下列成語與典故出處，哪一組配對正確？", options: ["守株待兔—《詩經》", "畫蛇添足—《戰國策》", "亡羊補牢—《論語》", "一鳴驚人—《韓非子》"], answer: 1, hints: ["畫蛇添足確實出自《戰國策》", "守株待兔出自《韓非子》"], explanation: "畫蛇添足出自《戰國策》；守株待兔出自《韓非子》；亡羊補牢出自《戰國策》，故只有第一組正確。" },
    { id: "jh-chi-idiom-origin-6", prompt: "「未雨綢繆」最接近哪個意思？", options: ["事後趕快補救", "多此一舉", "事先做好準備", "不知變通"], answer: 2, hints: ["趁還沒下雨先修門窗", "是事先而非事後"], explanation: "未雨綢繆趁天還沒下雨先修繕窗戶，比喻事先做好準備、預防萬一。" },
    { id: "jh-chi-idiom-origin-7", prompt: "下列哪句成語用得「恰當」？", options: ["他讀書總是未雨綢繆，考前才發現沒讀完", "他做事總畫蛇添足，難怪效率很高", "守株待兔的人最後通常大成功", "成績退步才趕緊加強，也算是亡羊補牢"], answer: 3, hints: ["找那個語境跟成語意思吻合的句子", "事後補救用亡羊補牢是對的"], explanation: "成績退步後趕緊加強，正是「出錯後補救」的語境，用亡羊補牢最恰當。" },
  ],
};

/* ===================== 國語 5：記敘文的順敘與倒敘（七上） ===================== */
const JH_CHI_NARRATIVE_ORDER: OnionLesson = {
  id: "jh-chi-narrative-order",
  title: "記敘文的順敘與倒敘",
  subject: "國語",
  topic: "記敘順序",
  grade: "七上",
  stages: ["國中"],
  desc: "記敘文順敘按時間、倒敘先結果。洋蔥用流程圖帶你看兩種順序的效果與選法。",
  takeaways: ["順敘：按時間由先到後", "倒敘：先講結果/高潮再回頭補原因", "想製造懸念用倒敘，想清楚交代理由用順敘", "插敘是在主線中插入相關回憶，用完再回到主線；三種順序可混用"],
  frames: [
    { step: "步驟 1：記敘文講順序", id: 1, caption: "嗨！記敘文在說一件事，先後順序會影響氣氛，最常見是順敘和倒敘。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識順敘寫法", id: 2, caption: "順敘就是按時間從頭講：先發生→再發生→最後結果，清楚好懂。", action: "point", prop: { kind: "flow", steps: ["起因", "經過", "結果"], active: 0 }, duration: 3400 },
    { step: "步驟 3：認識插敘寫法", id: 3, caption: "插敘是在主線敘述中，插入一段相關的回憶或補充，講完再回到主線繼續。", action: "point", prop: { kind: "flow", steps: ["主線：現在", "插入：過去回憶", "回到主線：現在"], active: 1 }, duration: 3400 },
    { step: "步驟 4：認識倒敘寫法", id: 4, caption: "倒敘是先丟出結果或精彩片段，再回頭講原因，製造懸念吸引人。", ask: { prompt: "「開頭就說『他住院了』，再回憶車禍經過」是哪一種？", options: ["倒敘", "順敘", "插敘", "補敘"], answer: 0, hint: "先講結果再回頭，是倒敘。" }, action: "think", prop: { kind: "flow", steps: ["先講結果/高潮", "回頭講起因", "補完經過"], active: 0 }, duration: 3600 },
    { step: "步驟 5：對照兩種順序", id: 5, caption: "對照一下：順敘像從山腳走到山頂；倒敘像先給你山頂風景再說怎麼爬。", ask: { prompt: "想製造「為什麼會這樣」的懸念，適合用哪種？", options: ["順敘", "倒敘", "說明", "議論"], answer: 1, hint: "先給結果再補原因，讀者會好奇。" }, action: "jump", prop: { kind: "balance", left: "順敘：時間由先到後", right: "倒敘：先果後因", tip: "倒敘製造懸念" }, duration: 3600 },
    { step: "步驟 6：看效果選順序", id: 6, caption: "寫作時看目的：想清楚交代理由用順敘；想抓眼球、留懸念用倒敘。", action: "point", prop: { kind: "flow", steps: ["交代理由→順敘", "抓眼球→倒敘", "配合主題選"], active: 1 }, duration: 3600 },
    { step: "步驟 7：綜合判讀一段", id: 7, caption: "實戰：讀一段敘事，先找第一句講什麼，再判斷作者用了哪種順序。", ask: { prompt: "文章一開頭寫「這枚銅戒，是奶奶留給我的」，接著回憶奶奶，這是？", options: ["倒敘（先物/結果再回憶）", "順敘", "議論", "說明"], answer: 0, hint: "先出現物品與情感，再回頭講過去。" }, action: "think", prop: { kind: "flow", steps: ["先講現在/物品", "回憶過去", "再回到現在"], active: 1 }, duration: 3800 },
    { step: "步驟 8：記順序口訣", id: 8, caption: "口訣：順敘按時間走、倒敘先結果；想懸念就倒著講。", action: "cheer", prop: { kind: "flow", steps: ["順敘：先→後", "倒敘：後→先", "看目的選"], active: 2 }, duration: 3400 },
    { step: "步驟 9：準備闖關", id: 9, caption: "順敘倒敘都懂了？準備闖關，讀一段猜猜作者用哪種順序！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-chi-narrative-order-1", prompt: "「順敘」是指按什麼順序寫？", options: ["先結果再原因", "時間由先到後", "隨意跳動", "由後往前"], answer: 1, hints: ["順就是順著時間", "從頭講到尾"], explanation: "順敘按事件發生的時間先後（由先到後）來敘述。" },
    { id: "jh-chi-narrative-order-2", prompt: "「倒敘」的特點是？", options: ["從頭按時間講", "不分先後", "先講結果/高潮再回頭", "只寫結尾"], answer: 2, hints: ["倒著講", "先果後因"], explanation: "倒敘先把結果或高潮擺在前面，再回頭交代起因經過。" },
    { id: "jh-chi-narrative-order-3", prompt: "小說開頭先寫「爆炸了」，再回憶起因，這樣做主要為了？", options: ["把時間寫亂", "省字數", "描寫天氣", "製造懸念、吸引讀者"], answer: 3, hints: ["先給衝擊再補原因", "引發好奇"], explanation: "先拋出結果再補原因，能製造「為什麼會這樣」的懸念，吸引讀者。" },
    { id: "jh-chi-narrative-order-4", prompt: "「我早上起床、吃完早餐、去上學」這段是？", options: ["順敘", "倒敘", "議論", "說明"], answer: 0, hints: ["按時間從早到晚", "由先到後"], explanation: "這段按時間先後排列，是順敘。" },
    { id: "jh-chi-narrative-order-5", prompt: "想清楚交代「比賽怎麼輸的」，又想開頭抓人，最好？", options: ["全部倒敘不補原因", "用倒敘開頭再順敘補完", "只用議論", "不用順序"], answer: 1, hints: ["倒敘開頭抓眼球", "仍需補完經過才清楚"], explanation: "可用倒敘開頭製造懸念，再順敘把經過補完，既抓人又清楚。" },
    { id: "jh-chi-narrative-order-6", prompt: "「他走在路上，忽然想起小學那次撿到錢包的事……」這段插入屬於？", options: ["倒敘", "順敘", "插敘", "議論"], answer: 2, hints: ["在主線中插入過去的事", "用完會回到主線"], explanation: "在進行中的主線插入一段回憶，是插敘。" },
    { id: "jh-chi-narrative-order-7", prompt: "下列關於記敘順序的說明，哪一項正確？", options: ["一篇文章只能用一種順序", "倒敘就是完全不按時間", "插敘會取代主線", "順敘、倒敘、插敘可以混用"], answer: 3, hints: ["好的敘事常混合使用", "插敘是插入不是取代"], explanation: "順敘、倒敘、插敘可在一篇文章中混合使用，插敘結束仍回到主線。" },
  ],
};

/* ===================== 國語 6：文言翻譯技巧（八上） ===================== */
const JH_CHI_CLASSICAL_TRANSLATE: OnionLesson = {
  id: "jh-chi-classical-translate",
  title: "文言翻譯技巧：補、調、換",
  subject: "國語",
  topic: "文言翻譯",
  grade: "八上",
  stages: ["國中"],
  desc: "文言翻譯三招：補主詞、調語序、換詞義。洋蔥一步步把文言文譯成好懂的白話。",
  takeaways: ["補主詞：文言常省主詞，譯時補回「誰」", "調語序：倒裝句先調成白話語序", "換詞義：文言單字換白話詞（曰→說、走→跑）", "注意古今異義：「妻子」古指妻與子女，不可用今義硬譯"],
  frames: [
    { step: "步驟 1：文言白話差在哪", id: 1, caption: "嗨！文言文常省略主詞、語序也和白話不同，翻譯有三個小訣竅。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：第一招補主詞", id: 2, caption: "第一招「補主詞」：文言常省主詞，翻時補上「他、我」才通順。", action: "point", prop: { kind: "text", text: "補主詞：省略的「誰」補回來", sub: "例：（ ）學而時習之→（我）", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：第二招調語序", id: 3, caption: "第二招「調語序」：像「不亦說乎」要調成白話的「不也很快樂嗎」。", ask: { prompt: "「不亦說乎」翻白話，第一步該先做什麼？", options: ["調整語序", "補主詞", "換成英文", "刪掉不字"], answer: 0, hint: "它是倒裝句，先調成正常語序。" }, action: "think", prop: { kind: "flow", steps: ["找出倒裝", "調成白話語序", "讀通順"], active: 1 }, duration: 3600 },
    { step: "步驟 4：第三招換詞義", id: 4, caption: "第三招「換詞義」：文言單字換白話詞，如「曰」換「說」、「食」換「吃」。", ask: { prompt: "「孔子曰」的「曰」翻白話要換成哪個字？", options: ["吃", "說", "跑", "看"], answer: 1, hint: "「曰」是「說」的意思。" }, action: "jump", prop: { kind: "text", text: "換詞義：曰→說；食→吃；走→跑", sub: "古字換今詞", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：補充古今異義字", id: 5, caption: "有些字古今意思差很大：「妻子」古指妻與子女、「犧牲」古指祭祀用的牛羊，不能用現在的意思硬翻。", action: "point", prop: { kind: "balance", left: "妻子（古）＝妻＋子女", right: "犧牲（古）＝祭祀牛羊", tip: "別用今義直譯" }, duration: 3600 },
    { step: "步驟 6：三招一起用", id: 6, caption: "三招合用：補主詞＋調語序＋換詞義，一句文言文就變好懂的白話了。", action: "point", prop: { kind: "flow", steps: ["補主詞", "調語序", "換詞義"], active: 2 }, duration: 3600 },
    { step: "步驟 7：實戰翻一句", id: 7, caption: "實戰：把「友便辟，友善柔，友便佞，損矣」一步步譯成白話，先補主詞再換詞。", ask: { prompt: "「（ ）三人行，必有我師焉」翻譯第一步要做什麼？", options: ["補主詞：（幾個人）一起走", "直接刪掉「三」", "把「師」換成英文", "把句子倒著唸"], answer: 0, hint: "句首省略主詞，先補上「幾個人」。" }, action: "think", prop: { kind: "flow", steps: ["補主詞", "換關鍵字", "調語序"], active: 0 }, duration: 3800 },
    { step: "步驟 8：記翻譯口訣", id: 8, caption: "口訣：缺誰補誰、顛倒調回、古字換今詞，三步譯通文言文。", action: "cheer", prop: { kind: "flow", steps: ["缺誰補誰", "顛倒調回", "古字換今詞"], active: 2 }, duration: 3400 },
    { step: "步驟 9：準備闖關", id: 9, caption: "三招記熟了嗎？準備闖關，動手把文言文譯成白話！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-chi-classical-translate-1", prompt: "文言常省略主詞，翻譯時應該？", options: ["全部刪掉主詞", "補上省略的「誰」", "照抄", "加英文"], answer: 1, hints: ["文言多省主詞", "補主詞才通順"], explanation: "文言常省略主詞，翻譯時要補回省略的「我、他」等才通順。" },
    { id: "jh-chi-classical-translate-2", prompt: "「孔子曰」的「曰」翻白話是？", options: ["吃", "跑", "說", "走"], answer: 2, hints: ["曰＝說", "古字換今詞"], explanation: "「曰」是「說」的意思，翻譯時換成白話的「說」。" },
    { id: "jh-chi-classical-translate-3", prompt: "「不亦說乎」是倒裝，白話應調成？", options: ["不亦很快樂", "說不亦乎", "亦不說乎", "不也很快樂嗎"], answer: 3, hints: ["調回正常語序", "「不也…嗎」"], explanation: "「不亦說乎」是倒裝，調成白話語序為「不也很快樂嗎」。" },
    { id: "jh-chi-classical-translate-4", prompt: "翻譯「（ ）學而時習之」時，最需要先做哪招？", options: ["補主詞", "換成英文", "刪字", "加標點"], answer: 0, hints: ["句首缺主詞", "先補「我/他」"], explanation: "句首缺少主詞，應先「補主詞」，補上「我/他」再譯。" },
    { id: "jh-chi-classical-translate-5", prompt: "想把「走」譯對，下列哪種處理最恰當？", options: ["補主詞", "換詞義：走→跑（古義）", "調語序", "直接留「走」"], answer: 1, hints: ["文言「走」是「跑」", "要用換詞義"], explanation: "文言「走」是「跑」的意思（今義才是步行），應用「換詞義」譯成「跑」。" },
    { id: "jh-chi-classical-translate-6", prompt: "「率妻子邑人來此絕境」中，「妻子」古義是？", options: ["單指太太", "太太與小狗", "妻與子女", "太太和鄰居"], answer: 2, hints: ["「妻子」是兩個字", "文言一字一義"], explanation: "文言「妻子」是「妻」與「子女」兩人，不能只譯成現代的「太太」。" },
    { id: "jh-chi-classical-translate-7", prompt: "「犧牲玉帛，弗敢加也」的「犧牲」古義最接近？", options: ["為理想奉獻生命", "丟棄物品", "免費贈送", "祭祀用的牛羊豬"], answer: 3, hints: ["這是曹劌論戰的句子", "古代祭祀用牲"], explanation: "古語「犧牲」指祭祀所用的牛羊豬等牲禮，不是現代「為目標捨命」的意思。" },
  ],
};

/* ===================== 國語 7：描寫手法（七下） ===================== */
const JH_CHI_DESCRIPTION: OnionLesson = {
  id: "jh-chi-description",
  title: "描寫手法：視覺、聽覺、觸覺",
  subject: "國語",
  topic: "描寫手法",
  grade: "七下",
  stages: ["國中"],
  desc: "視覺、聽覺、觸覺三種描寫讓文章立體。洋蔥帶你讀句子、辨感官、記手法。",
  takeaways: ["視覺：寫看見的（顏色/形狀/光影）", "聽覺：寫聽見的（聲音/節奏）", "觸覺：寫摸到的（冷熱/軟硬/輕重）", "還有嗅覺（香臭）與味覺（酸甜苦辣），五官可綜合運用"],
  frames: [
    { step: "步驟 1：描寫讓文章活", id: 1, caption: "嗨！好文章會讓你「看見、聽見、摸到」，這靠視覺、聽覺、觸覺三種描寫。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：學視覺描寫", id: 2, caption: "視覺描寫寫你「看見的」：顏色、形狀、光影，像「紅紅的夕陽」。", action: "point", prop: { kind: "text", text: "視覺：看見的（色/形/光）", sub: "例：紅紅的夕陽", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：學聽覺描寫", id: 3, caption: "聽覺描寫寫你「聽見的」：聲音、節奏，像「蟲鳴唧唧」、「風呼呼吹」。", ask: { prompt: "「流水潺潺」屬於哪一種描寫？", options: ["聽覺", "視覺", "觸覺", "嗅覺"], answer: 0, hint: "潺潺是水聲，用耳朵聽的。" }, action: "think", prop: { kind: "text", text: "聽覺：聽見的（聲/韻）", sub: "例：蟲鳴唧唧", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：學觸覺描寫", id: 4, caption: "觸覺描寫寫你「摸到的」：冷熱、軟硬、輕重，像「冰涼的河水」。", ask: { prompt: "「微風輕輕拂過，涼涼的」是哪一種描寫？", options: ["視覺", "觸覺", "聽覺", "味覺"], answer: 1, hint: "涼涼的是皮膚感覺，用觸覺。" }, action: "jump", prop: { kind: "text", text: "觸覺：摸到的（冷/熱/軟/硬）", sub: "例：冰涼的河水", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：補充嗅覺與味覺", id: 5, caption: "除了視聽觸，還有嗅覺寫「聞到的」（花香、臭味），味覺寫「嚐到的」（酸甜苦）。", action: "point", prop: { kind: "balance", left: "嗅覺：聞到（香/臭）", right: "味覺：嚐到（酸/甜/苦）", tip: "五官都能拿來寫" }, duration: 3400 },
    { step: "步驟 6：三種描寫比重", id: 6, caption: "一段好的景物描寫，常同時用到三種感官；這段用了視覺3次、聽覺2次、觸覺1次。", action: "point", prop: { kind: "bars", items: [{ label: "視覺", value: 3 }, { label: "聽覺", value: 2 }, { label: "觸覺", value: 1 }], unit: "次", active: 0 }, duration: 3800 },
    { step: "步驟 7：綜合判斷一句", id: 7, caption: "動手判斷：一句話裡常混著多種感官，先找每個詞對應哪種感覺。", ask: { prompt: "「空氣中飄來陣陣桂花香，甜甜的」用了哪兩種描寫？", options: ["嗅覺＋味覺", "視覺＋聽覺", "觸覺＋視覺", "聽覺＋觸覺"], answer: 0, hint: "花香是聞到的，甜甜的是嚐到/想到的。" }, action: "think", prop: { kind: "balance", left: "桂花香→嗅覺", right: "甜甜的→味覺", tip: "一句可含多種感官" }, duration: 3800 },
    { step: "步驟 8：記描寫口訣", id: 8, caption: "口訣：用眼睛寫視覺、用耳朵寫聽覺、用皮膚寫觸覺，文章就立體。", action: "cheer", prop: { kind: "flow", steps: ["看→視覺", "聽→聽覺", "摸→觸覺"], active: 2 }, duration: 3400 },
    { step: "步驟 9：準備闖關", id: 9, caption: "三種描寫都學會了？準備闖關，讀句子猜它用了哪種感官！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-chi-description-1", prompt: "「紅紅的蘋果挂在枝頭」用了什麼描寫？", options: ["聽覺", "視覺", "觸覺", "嗅覺"], answer: 1, hints: ["紅紅的是看見的顏色", "用眼睛看"], explanation: "「紅紅的」是看見的顏色，屬視覺描寫。" },
    { id: "jh-chi-description-2", prompt: "「雨滴答滴答落下」屬於哪種描寫？", options: ["視覺", "觸覺", "聽覺", "味覺"], answer: 2, hints: ["滴答是聲音", "用耳朵聽"], explanation: "「滴答」是聽見的聲音，屬聽覺描寫。" },
    { id: "jh-chi-description-3", prompt: "「石頭又粗又冷」用了什麼描寫？", options: ["視覺", "聽覺", "嗅覺", "觸覺"], answer: 3, hints: ["粗和冷是摸到的", "皮膚感覺"], explanation: "「粗、冷」是皮膚摸到的感覺，屬觸覺描寫。" },
    { id: "jh-chi-description-4", prompt: "「遠遠傳來一陣笑聲」和「笑聲很溫暖」分別是？", options: ["聽覺＋觸覺", "視覺＋聽覺", "聽覺＋視覺", "觸覺＋視覺"], answer: 0, hints: ["笑聲用耳朵（聽覺）", "溫暖是感覺（觸覺）"], explanation: "「笑聲」是聽見的（聽覺），「溫暖」是感受到的（觸覺），故為聽覺＋觸覺。" },
    { id: "jh-chi-description-5", prompt: "下列哪一句「同時」用到視覺與聽覺？", options: ["紅紅的蘋果", "看見閃電，聽見雷聲", "石頭冷冷的", "風輕輕吹"], answer: 1, hints: ["閃電是看見（視覺）", "雷聲是聽見（聽覺）"], explanation: "「看見閃電」是視覺、「聽見雷聲」是聽覺，一句同時用了兩種感官描寫。" },
    { id: "jh-chi-description-6", prompt: "「空氣中飄來陣陣炭燒的焦味」屬於哪一種描寫？", options: ["視覺", "聽覺", "嗅覺", "觸覺"], answer: 2, hints: ["焦味是聞到的", "用鼻子"], explanation: "「焦味」是用鼻子聞到的氣味，屬嗅覺描寫。" },
    { id: "jh-chi-description-7", prompt: "「這顆檸檬酸得我牙都快掉下來」主要用了哪種描寫？", options: ["視覺", "聽覺", "嗅覺", "味覺"], answer: 3, hints: ["酸是嚐到的味道", "寫味覺"], explanation: "「酸」是舌頭嚐到的味道，屬味覺描寫。" },
  ],
};

export default [
  JH_CHI_CLASSICAL_INTRO,
  JH_CHI_TANG_POEM,
  JH_CHI_ARGUMENT,
  JH_CHI_IDIOM_ORIGIN,
  JH_CHI_NARRATIVE_ORDER,
  JH_CHI_CLASSICAL_TRANSLATE,
  JH_CHI_DESCRIPTION,
];
