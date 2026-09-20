import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 國中國語 7 堂（洋蔥學院擴充計畫）
 * 設計原則：一步一觀念、圖解真的畫得出概念、中途提問、5 題由淺入深。
 * 7 幀分鏡（每幀 step／caption／action／prop／duration，至少 2 幀有 ask）
 * ＋ 5 題闖關（2 基本 → 2 應用 → 1 易錯）＋ 3 條 takeaways。
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
  takeaways: ["之＝他/它；其＝他的/那（代詞）", "而連接句子（又/卻）；以表用或因", "先判詞性再選意思，助詞「之」＝的"],
  frames: [
    { step: "步驟 1：認識四個虛字", id: 1, caption: "嗨！文言文裡「之、其、而、以」最常出現，先把這四個虛字認熟。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：學「之」「其」代詞", id: 2, caption: "「之」是「他、它」，「其」是「他的、那個」，都用來代替人或事物。", action: "point", prop: { kind: "text", text: "之＝他/它；其＝他的/那", sub: "例：學而時習之／出其不意", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：學「而」「以」連詞", id: 3, caption: "「而」連接句子（又/卻），「以」表示「用」或「因為」，意思要看上下文。", ask: { prompt: "「學而時習之」的「而」該選哪個意思？", options: ["又、而且（順接）", "卻、但是（轉折）", "用、拿", "他、它"], answer: 0, hint: "「學了又按時複習」，這裡是順接，用「又、而且」。" }, action: "think", prop: { kind: "text", text: "而＝又/卻；以＝用/因為", sub: "例：學而時習之／以牙還牙", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：試著標出虛字", id: 4, caption: "動手試：讀「子曰：學而時習之，不亦說乎」，把四個虛字圈出來吧！", ask: { prompt: "「學而時習之」一句中，下列哪一個字是「而」？", options: ["學", "而", "時", "之"], answer: 1, hint: "找連接「學」和「時習」的那個字。" }, action: "jump", prop: { kind: "flow", steps: ["學（動詞）", "而（連接）", "時習之（動詞）"], active: 1 }, duration: 3600 },
    { step: "步驟 5：四字總對照", id: 5, caption: "四字總整理：之與其都代人事物，而與以多半連接或表示工具、原因。", action: "point", prop: { kind: "balance", left: "之、其：代人/物（代詞）", right: "而、以：連接/用/因", tip: "記清詞性不混淆" }, duration: 3600 },
    { step: "步驟 6：記虛字口訣", id: 6, caption: "口訣：之是他、其是他；而連又卻、以是用因。先判詞性就不亂。", action: "cheer", prop: { kind: "flow", steps: ["之＝他/它", "其＝他的/那", "而＝又/卻", "以＝用/因"], active: 3 }, duration: 3400 },
    { step: "步驟 7：準備闖關", id: 7, caption: "四個虛字記牢了嗎？準備闖關，看你能不能一眼認出它們！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jc1", prompt: "「學而時習之」的「之」指什麼？", options: ["他、它（代詞）", "的", "但是", "因為"], answer: 0, hints: ["「之」代替前面學過的內容", "它是代詞，不是連詞"], explanation: "「之」在這裡代替前面提到的學過的知識，是代詞「他、它」。" },
    { id: "jc2", prompt: "「出其不意」的「其」是什麼意思？", options: ["他的、那個", "用、拿", "又、而且", "卻"], answer: 0, hints: ["「其」指第三人稱所有格", "它修飾後面的名詞"], explanation: "「其」是「他的、那個」，表示第三人稱，修飾後面的名詞。" },
    { id: "jc3", prompt: "「學而時習之」的「而」屬於哪種用法？", options: ["順接（又、而且）", "轉折（卻、但是）", "代詞（他）", "工具（用）"], answer: 0, hints: ["先學再複習是遞進", "遞進用順接"], explanation: "「學」與「時習」是遞進關係，「而」表順接，相當於「又、而且」。" },
    { id: "jc4", prompt: "「以牙還牙」的「以」是什麼詞義？", options: ["用、拿", "因為", "他的", "連接（又）"], answer: 0, hints: ["用牙齒去還擊", "這裡表示工具"], explanation: "「以」在這裡是「用、拿」的意思，表示動作的工具。" },
    { id: "jc5", prompt: "下列哪一個「之」是助詞「的」（不是代詞）？", options: ["學而時習之（代詞）", "齊國之美麗者也（的）", "操之過急（代詞）", "言之成理（代詞）"], answer: 1, hints: ["找「之」用在兩個名詞之間", "名詞＋之＋名詞，之常是「的」"], explanation: "「齊國之美麗者」中「之」在兩個名詞之間，是助詞「的」；其餘「之」都代詞。" },
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
  takeaways: ["絕句四句、律詩八句", "意象＝借景物傳情（月表思念、柳表送別）", "賞詩：看句數→找意象→體會情感"],
  frames: [
    { step: "步驟 1：認識唐詩兩大類", id: 1, caption: "嗨！唐詩分兩大類：絕句四句、律詩八句，先認識它們的長相。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：分辨絕句與律詩", id: 2, caption: "絕句只有四句（五言或七言），律詩有八句且講究對仗與押韻。", action: "point", prop: { kind: "text", text: "絕句＝4句；律詩＝8句", sub: "五言/七言皆可", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：學意象是什麼", id: 3, caption: "意象是詩人借景物傳情：月亮常表思念，柳枝表送別，看景就懂心情。", ask: { prompt: "唐詩裡「月亮」這個意象，常表達什麼情感？", options: ["思念、鄉愁", "生氣", "速度", "寒冷"], answer: 0, hint: "月圓人未圓，常引遊子思念。" }, action: "think", prop: { kind: "text", text: "月＝思念；柳＝送別；暮＝遲暮", sub: "景中有情", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：讀一首絕句", id: 4, caption: "讀李白〈靜夜思〉：床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。", action: "jump", prop: { kind: "text", text: "靜夜思（李白）", sub: "明月→思故鄉", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：賞析意象與格律", id: 5, caption: "這首絕句押「ang」韻，明月照出孤寂，低頭動作寫盡思鄉之情。", ask: { prompt: "〈靜夜思〉「舉頭望明月，低頭思故鄉」用了什麼手法表情？", options: ["借景抒情（意象）", "誇張", "對比數字", "議論說理"], answer: 0, hint: "用明月、低頭的動作帶出思念。" }, action: "point", prop: { kind: "flow", steps: ["明月光（起興）", "望明月（看景）", "思故鄉（抒情）"], active: 2 }, duration: 3800 },
    { step: "步驟 6：記賞析口訣", id: 6, caption: "賞詩口訣：先看幾句（絕/律）、再找意象、最後體會詩人的情感。", action: "cheer", prop: { kind: "flow", steps: ["幾句？絕句/律詩", "找意象（景）", "體會情感"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關", id: 7, caption: "絕句律詩、意象情感都記住了？準備闖關，試著賞一首唐詩！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "tp1", prompt: "唐詩的「絕句」通常由幾句組成？", options: ["四句", "八句", "兩句", "六句"], answer: 0, hints: ["絕句短小精練", "律詩才是八句"], explanation: "絕句通常由四句組成；律詩才是八句。" },
    { id: "tp2", prompt: "「律詩」比絕句長，通常由幾句組成？", options: ["八句", "四句", "十句", "三句"], answer: 0, hints: ["律詩講究對仗，篇幅較長", "絕句四句、律詩八句"], explanation: "律詩通常由八句組成，並講究中間兩聯對仗。" },
    { id: "tp3", prompt: "「柳」在唐詩中常象徵什麼？", options: ["送別、留念", "生氣", "財富", "時間快"], answer: 0, hints: ["「柳」諧音「留」", "古人折柳送行"], explanation: "「柳」諧音「留」，唐詩常以柳象徵送別、留念。" },
    { id: "tp4", prompt: "「舉頭望明月，低頭思故鄉」表達什麼？", options: ["思鄉之情", "喜慶", "描寫天氣", "批評月亮"], answer: 0, hints: ["望月引思念", "低頭動作帶出故鄉"], explanation: "詩人借明月與低頭的動作，寫出濃濃的思鄉之情。" },
    { id: "tp5", prompt: "下列何者屬於「律詩」而非絕句？", options: ["《靜夜思》（四句）", "《春望》（八句，杜甫）", "《登鸛雀樓》（四句）", "《江雪》（四句）"], answer: 1, hints: ["律詩八句、講對仗", "其他都是四句的絕句"], explanation: "杜甫〈春望〉共八句，是律詩；其餘皆為四句的絕句。" },
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
  takeaways: ["論點＝文章的主張", "論據＝支持論點的材料（事實/名言/數據）", "論證＝把論點與論據串起來的推理"],
  frames: [
    { step: "步驟 1：認識議論文目的", id: 1, caption: "嗨！議論文是要說服別人同意你的看法，關鍵在「論點」站不站得住。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：找論點（主張）", id: 2, caption: "論點是文章的主張，通常是一句清楚的話，像「閱讀讓人更寬容」。", action: "point", prop: { kind: "text", text: "論點＝文章的主張", sub: "例：閱讀讓人更寬容", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：找論據（證明）", id: 3, caption: "論據是用來支持論點的材料：舉事實、引名言、擺數據都算論據。", ask: { prompt: "「班上閱讀量前三名，作文都拿高分」這屬於哪種論據？", options: ["數據（事實）", "論點", "結論", "題目"], answer: 0, hint: "這是用統計數字來證明，屬事實資料。" }, action: "think", prop: { kind: "text", text: "論據＝支持論點的材料", sub: "事實/名言/數據", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：學論證怎連結", id: 4, caption: "論證是把論點和論據串起來的推理由：因為有證據，所以主張成立。", ask: { prompt: "「因為讀得多見識廣，所以閱讀讓人寬容」這是什麼？", options: ["論證（推論過程）", "論點", "論據", "標題"], answer: 0, hint: "它把理由和主張連起來，是推論。" }, action: "jump", prop: { kind: "flow", steps: ["提出論點", "舉出論據", "推論成立"], active: 1 }, duration: 3600 },
    { step: "步驟 5：對照三段結構", id: 5, caption: "一張圖對照：論點是「主張」，論據是「證明」，論證是「推理的橋梁」。", action: "point", prop: { kind: "balance", left: "論點：主張（觀點）", right: "論據：證明（材料）", tip: "論證＝連起兩者的推理" }, duration: 3600 },
    { step: "步驟 6：記議論文口訣", id: 6, caption: "口訣：先抓論點、再找論據、看論證怎麼推，文章就有說服力。", action: "cheer", prop: { kind: "flow", steps: ["抓論點", "找論據", "看論證"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關", id: 7, caption: "論點、論據、論證都分清楚了？準備闖關，讀一段練抓重點！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ar1", prompt: "議論文的「論點」是指什麼？", options: ["文章的主張/看法", "用來證明的例子", "推理的過程", "文章標題"], answer: 0, hints: ["論點是你要別人同意的話", "它是核心觀點"], explanation: "論點是文章想讓讀者同意的主張或看法，是議論文的核心。" },
    { id: "ar2", prompt: "「引用名人名言來支持看法」中的名言屬於？", options: ["論據（材料）", "論點", "結論", "修辭"], answer: 0, hints: ["名言是用來證明的材料", "它支持論點"], explanation: "名言是用來支持論點的證明材料，屬於論據。" },
    { id: "ar3", prompt: "把「理由」和「主張」串起來的那一步叫什麼？", options: ["論證", "論點", "論據", "引言"], answer: 0, hints: ["連接證據與主張的是推論", "它就是論證"], explanation: "論證是把論據與論點連起來、說明「為什麼成立」的推理過程。" },
    { id: "ar4", prompt: "「運動有益健康，因為研究顯示每週運動者生病少」包含了哪些要素？", options: ["論點＋論據（有論證意味）", "只有論點", "只有論據", "什麼都沒有"], answer: 0, hints: ["前半是主張", "後半是用研究證明"], explanation: "「運動有益健康」是論點，「研究顯示…」是論據，二者相連已有論證意味。" },
    { id: "ar5", prompt: "「古人說『讀書破萬卷，下筆如有神』」若用來支持「多讀書寫作好」，這句話是？", options: ["論據（引名言）", "論點", "結論", "題目"], answer: 0, hints: ["它是引用來證明的材料", "主張是「多讀書寫作好」"], explanation: "這句古語是用來支持主張的引證，屬論據；主張才是「多讀書寫作好」。" },
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
  takeaways: ["畫蛇添足：多此一舉（出自《戰國策》）", "守株待兔：不知變通（出自《韓非子》）", "亡羊補牢：出錯後趕緊補救（出自《戰國策》）"],
  frames: [
    { step: "步驟 1：成語大多有來歷", id: 1, caption: "嗨！很多成語來自歷史故事或古書，知道典故就不容易用錯。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：學「畫蛇添足」", id: 2, caption: "「畫蛇添足」出自《戰國策》：比賽畫蛇卻多畫腳，比喻多此一舉。", action: "point", prop: { kind: "text", text: "畫蛇添足", sub: "典故：畫蛇多添腳→多此一舉", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：學「守株待兔」", id: 3, caption: "「守株待兔」出自《韓非子》：農夫傻等撞樹的兔，比喻不知變通、妄想不勞而獲。", ask: { prompt: "「守株待兔」現在比喻什麼？", options: ["不知變通、傻等機會", "勤奮努力", "跑得飛快", "很有計畫"], answer: 0, hint: "農夫不種田只等兔，是不知變通。" }, action: "think", prop: { kind: "text", text: "守株待兔", sub: "典故：等撞樹的兔→不知變通", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：學「亡羊補牢」", id: 4, caption: "「亡羊補牢」出自《戰國策》：羊跑掉才修羊圈，比喻出錯後趕緊補救還不遲。", action: "jump", prop: { kind: "text", text: "亡羊補牢", sub: "典故：補羊圈→出錯快補救", tone: "ok" }, duration: 3400 },
    { step: "步驟 5：對照正確用法", id: 5, caption: "用對才加分：說「事後補救」用亡羊補牢；說「多此一舉」用畫蛇添足，別混。", ask: { prompt: "小明考完才狂補筆記，可用哪個成語？", options: ["亡羊補牢", "畫蛇添足", "守株待兔", "守口如瓶"], answer: 0, hint: "考完才補，是出錯後補救。" }, action: "point", prop: { kind: "balance", left: "亡羊補牢：事後補救", right: "畫蛇添足：多此一舉", tip: "看語境選成語" }, duration: 3800 },
    { step: "步驟 6：記典故口訣", id: 6, caption: "口訣：成語有典故，先想來歷再選詞；用錯語境就鬧笑話。", action: "cheer", prop: { kind: "flow", steps: ["想典故來歷", "看語境", "選對成語"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關", id: 7, caption: "典故和用法都記好了？準備闖關，看你能不能選對成語！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "io1", prompt: "「畫蛇添足」的意思接近？", options: ["多此一舉", "勤奮", "快速", "幸運"], answer: 0, hints: ["蛇本無腳，添腳多餘", "比喻做不必要的事"], explanation: "畫蛇添足比喻多此一舉、做不必要的動作。" },
    { id: "io2", prompt: "「守株待兔」出自哪本書？", options: ["《韓非子》", "《詩經》", "《論語》", "《孟子》"], answer: 0, hints: ["是韓非講的故事", "載於《韓非子》"], explanation: "守株待兔是《韓非子》中記載的寓言故事。" },
    { id: "io3", prompt: "「亡羊補牢」適合用在什麼情況？", options: ["出錯後趕緊補救", "事先預防", "完全沒用", "值得慶祝"], answer: 0, hints: ["羊丟了才修圈", "強調事後補救未晚"], explanation: "亡羊補牢比喻出錯後及時補救，還不算晚。" },
    { id: "io4", prompt: "比賽已結束他還一直加動作，觀眾覺得多餘，用哪個成語？", options: ["畫蛇添足", "亡羊補牢", "守株待兔", "一鳴驚人"], answer: 0, hints: ["加動作反而多餘", "對應多此一舉"], explanation: "多做的動作顯得多餘，對應「畫蛇添足」。" },
    { id: "io5", prompt: "下列成語與典故出處，哪一組配對正確？", options: ["畫蛇添足—《戰國策》", "守株待兔—《詩經》", "亡羊補牢—《論語》", "一鳴驚人—《韓非子》"], answer: 0, hints: ["畫蛇添足確實出自《戰國策》", "守株待兔出自《韓非子》"], explanation: "畫蛇添足出自《戰國策》；守株待兔出自《韓非子》；亡羊補牢出自《戰國策》，故只有第一組正確。" },
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
  takeaways: ["順敘：按時間由先到後", "倒敘：先講結果/高潮再回頭補原因", "想製造懸念用倒敘，想清楚交代理由用順敘"],
  frames: [
    { step: "步驟 1：記敘文講順序", id: 1, caption: "嗨！記敘文在說一件事，先後順序會影響氣氛，最常見是順敘和倒敘。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：認識順敘寫法", id: 2, caption: "順敘就是按時間從頭講：先發生→再發生→最後結果，清楚好懂。", action: "point", prop: { kind: "flow", steps: ["起因", "經過", "結果"], active: 0 }, duration: 3400 },
    { step: "步驟 3：認識倒敘寫法", id: 3, caption: "倒敘是先丟出結果或精彩片段，再回頭講原因，製造懸念吸引人。", ask: { prompt: "「開頭就說『他住院了』，再回憶車禍經過」是哪一種？", options: ["倒敘", "順敘", "插敘", "補敘"], answer: 0, hint: "先講結果再回頭，是倒敘。" }, action: "think", prop: { kind: "flow", steps: ["先講結果/高潮", "回頭講起因", "補完經過"], active: 0 }, duration: 3600 },
    { step: "步驟 4：對照兩種順序", id: 4, caption: "對照一下：順敘像從山腳走到山頂；倒敘像先給你山頂風景再說怎麼爬。", ask: { prompt: "想製造「為什麼會這樣」的懸念，適合用哪種？", options: ["倒敘", "順敘", "說明", "議論"], answer: 0, hint: "先給結果再補原因，讀者會好奇。" }, action: "jump", prop: { kind: "balance", left: "順敘：時間由先到後", right: "倒敘：先果後因", tip: "倒敘製造懸念" }, duration: 3600 },
    { step: "步驟 5：看效果選順序", id: 5, caption: "寫作時看目的：想清楚交代理由用順敘；想抓眼球、留懸念用倒敘。", action: "point", prop: { kind: "flow", steps: ["交代理由→順敘", "抓眼球→倒敘", "配合主題選"], active: 1 }, duration: 3600 },
    { step: "步驟 6：記順序口訣", id: 6, caption: "口訣：順敘按時間走、倒敘先結果；想懸念就倒著講。", action: "cheer", prop: { kind: "flow", steps: ["順敘：先→後", "倒敘：後→先", "看目的選"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關", id: 7, caption: "順敘倒敘都懂了？準備闖關，讀一段猜猜作者用哪種順序！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "no1", prompt: "「順敘」是指按什麼順序寫？", options: ["時間由先到後", "先結果再原因", "隨意跳動", "由後往前"], answer: 0, hints: ["順就是順著時間", "從頭講到尾"], explanation: "順敘按事件發生的時間先後（由先到後）來敘述。" },
    { id: "no2", prompt: "「倒敘」的特點是？", options: ["先講結果/高潮再回頭", "從頭按時間講", "不分先後", "只寫結尾"], answer: 0, hints: ["倒著講", "先果後因"], explanation: "倒敘先把結果或高潮擺在前面，再回頭交代起因經過。" },
    { id: "no3", prompt: "小說開頭先寫「爆炸了」，再回憶起因，這樣做主要為了？", options: ["製造懸念、吸引讀者", "把時間寫亂", "省字數", "描寫天氣"], answer: 0, hints: ["先給衝擊再補原因", "引發好奇"], explanation: "先拋出結果再補原因，能製造「為什麼會這樣」的懸念，吸引讀者。" },
    { id: "no4", prompt: "「我早上起床、吃完早餐、去上學」這段是？", options: ["順敘", "倒敘", "議論", "說明"], answer: 0, hints: ["按時間從早到晚", "由先到後"], explanation: "這段按時間先後排列，是順敘。" },
    { id: "no5", prompt: "想清楚交代「比賽怎麼輸的」，又想開頭抓人，最好？", options: ["用倒敘開頭再順敘補完", "全部倒敘不補原因", "只用議論", "不用順序"], answer: 0, hints: ["倒敘開頭抓眼球", "仍需補完經過才清楚"], explanation: "可用倒敘開頭製造懸念，再順敘把經過補完，既抓人又清楚。" },
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
  takeaways: ["補主詞：文言常省主詞，譯時補回「誰」", "調語序：倒裝句先調成白話語序", "換詞義：文言單字換白話詞（曰→說、走→跑）"],
  frames: [
    { step: "步驟 1：文言白話差在哪", id: 1, caption: "嗨！文言文常省略主詞、語序也和白話不同，翻譯有三個小訣竅。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：第一招補主詞", id: 2, caption: "第一招「補主詞」：文言常省主詞，翻時補上「他、我」才通順。", action: "point", prop: { kind: "text", text: "補主詞：省略的「誰」補回來", sub: "例：（ ）學而時習之→（我）", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：第二招調語序", id: 3, caption: "第二招「調語序」：像「不亦說乎」要調成白話的「不也很快樂嗎」。", ask: { prompt: "「不亦說乎」翻白話，第一步該先做什麼？", options: ["調整語序", "補主詞", "換成英文", "刪掉不字"], answer: 0, hint: "它是倒裝句，先調成正常語序。" }, action: "think", prop: { kind: "flow", steps: ["找出倒裝", "調成白話語序", "讀通順"], active: 1 }, duration: 3600 },
    { step: "步驟 4：第三招換詞義", id: 4, caption: "第三招「換詞義」：文言單字換白話詞，如「曰」換「說」、「食」換「吃」。", ask: { prompt: "「孔子曰」的「曰」翻白話要換成哪個字？", options: ["說", "吃", "跑", "看"], answer: 0, hint: "「曰」是「說」的意思。" }, action: "jump", prop: { kind: "text", text: "換詞義：曰→說；食→吃；走→跑", sub: "古字換今詞", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：三招一起用", id: 5, caption: "三招合用：補主詞＋調語序＋換詞義，一句文言文就變好懂的白話了。", action: "point", prop: { kind: "flow", steps: ["補主詞", "調語序", "換詞義"], active: 2 }, duration: 3600 },
    { step: "步驟 6：記翻譯口訣", id: 6, caption: "口訣：缺誰補誰、顛倒調回、古字換今詞，三步譯通文言文。", action: "cheer", prop: { kind: "flow", steps: ["缺誰補誰", "顛倒調回", "古字換今詞"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關", id: 7, caption: "三招記熟了嗎？準備闖關，動手把文言文譯成白話！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct1", prompt: "文言常省略主詞，翻譯時應該？", options: ["補上省略的「誰」", "全部刪掉主詞", "照抄", "加英文"], answer: 0, hints: ["文言多省主詞", "補主詞才通順"], explanation: "文言常省略主詞，翻譯時要補回省略的「我、他」等才通順。" },
    { id: "ct2", prompt: "「孔子曰」的「曰」翻白話是？", options: ["說", "吃", "跑", "走"], answer: 0, hints: ["曰＝說", "古字換今詞"], explanation: "「曰」是「說」的意思，翻譯時換成白話的「說」。" },
    { id: "ct3", prompt: "「不亦說乎」是倒裝，白話應調成？", options: ["不也很快樂嗎", "不亦很快樂", "說不亦乎", "亦不說乎"], answer: 0, hints: ["調回正常語序", "「不也…嗎」"], explanation: "「不亦說乎」是倒裝，調成白話語序為「不也很快樂嗎」。" },
    { id: "ct4", prompt: "翻譯「（ ）學而時習之」時，最需要先做哪招？", options: ["補主詞", "換成英文", "刪字", "加標點"], answer: 0, hints: ["句首缺主詞", "先補「我/他」"], explanation: "句首缺少主詞，應先「補主詞」，補上「我/他」再譯。" },
    { id: "ct5", prompt: "想把「走」譯對，下列哪種處理最恰當？", options: ["換詞義：走→跑（古義）", "補主詞", "調語序", "直接留「走」"], answer: 0, hints: ["文言「走」是「跑」", "要用換詞義"], explanation: "文言「走」是「跑」的意思（今義才是步行），應用「換詞義」譯成「跑」。" },
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
  takeaways: ["視覺：寫看見的（顏色/形狀/光影）", "聽覺：寫聽見的（聲音/節奏）", "觸覺：寫摸到的（冷熱/軟硬/輕重）"],
  frames: [
    { step: "步驟 1：描寫讓文章活", id: 1, caption: "嗨！好文章會讓你「看見、聽見、摸到」，這靠視覺、聽覺、觸覺三種描寫。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：學視覺描寫", id: 2, caption: "視覺描寫寫你「看見的」：顏色、形狀、光影，像「紅紅的夕陽」。", action: "point", prop: { kind: "text", text: "視覺：看見的（色/形/光）", sub: "例：紅紅的夕陽", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：學聽覺描寫", id: 3, caption: "聽覺描寫寫你「聽見的」：聲音、節奏，像「蟲鳴唧唧」、「風呼呼吹」。", ask: { prompt: "「流水潺潺」屬於哪一種描寫？", options: ["聽覺", "視覺", "觸覺", "嗅覺"], answer: 0, hint: "潺潺是水聲，用耳朵聽的。" }, action: "think", prop: { kind: "text", text: "聽覺：聽見的（聲/韻）", sub: "例：蟲鳴唧唧", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：學觸覺描寫", id: 4, caption: "觸覺描寫寫你「摸到的」：冷熱、軟硬、輕重，像「冰涼的河水」。", ask: { prompt: "「微風輕輕拂過，涼涼的」是哪一種描寫？", options: ["觸覺", "視覺", "聽覺", "味覺"], answer: 0, hint: "涼涼的是皮膚感覺，用觸覺。" }, action: "jump", prop: { kind: "text", text: "觸覺：摸到的（冷/熱/軟/硬）", sub: "例：冰涼的河水", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：三種描寫比重", id: 5, caption: "一段好的景物描寫，常同時用到三種感官；這段用了視覺3次、聽覺2次、觸覺1次。", action: "point", prop: { kind: "bars", items: [{ label: "視覺", value: 3 }, { label: "聽覺", value: 2 }, { label: "觸覺", value: 1 }], unit: "次", active: 0 }, duration: 3800 },
    { step: "步驟 6：記描寫口訣", id: 6, caption: "口訣：用眼睛寫視覺、用耳朵寫聽覺、用皮膚寫觸覺，文章就立體。", action: "cheer", prop: { kind: "flow", steps: ["看→視覺", "聽→聽覺", "摸→觸覺"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關", id: 7, caption: "三種描寫都學會了？準備闖關，讀句子猜它用了哪種感官！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ds1", prompt: "「紅紅的蘋果挂在枝頭」用了什麼描寫？", options: ["視覺", "聽覺", "觸覺", "嗅覺"], answer: 0, hints: ["紅紅的是看見的顏色", "用眼睛看"], explanation: "「紅紅的」是看見的顏色，屬視覺描寫。" },
    { id: "ds2", prompt: "「雨滴答滴答落下」屬於哪種描寫？", options: ["聽覺", "視覺", "觸覺", "味覺"], answer: 0, hints: ["滴答是聲音", "用耳朵聽"], explanation: "「滴答」是聽見的聲音，屬聽覺描寫。" },
    { id: "ds3", prompt: "「石頭又粗又冷」用了什麼描寫？", options: ["觸覺", "視覺", "聽覺", "嗅覺"], answer: 0, hints: ["粗和冷是摸到的", "皮膚感覺"], explanation: "「粗、冷」是皮膚摸到的感覺，屬觸覺描寫。" },
    { id: "ds4", prompt: "「遠遠傳來一陣笑聲」和「笑聲很溫暖」分別是？", options: ["聽覺＋觸覺", "視覺＋聽覺", "聽覺＋視覺", "觸覺＋視覺"], answer: 0, hints: ["笑聲用耳朵（聽覺）", "溫暖是感覺（觸覺）"], explanation: "「笑聲」是聽見的（聽覺），「溫暖」是感受到的（觸覺），故為聽覺＋觸覺。" },
    { id: "ds5", prompt: "下列哪一句「同時」用到視覺與聽覺？", options: ["看見閃電，聽見雷聲", "紅紅的蘋果", "石頭冷冷的", "風輕輕吹"], answer: 0, hints: ["閃電是看見（視覺）", "雷聲是聽見（聽覺）"], explanation: "「看見閃電」是視覺、「聽見雷聲」是聽覺，一句同時用了兩種感官描寫。" },
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
