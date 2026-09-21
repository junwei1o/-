/**
 * 高中國文課程（洋蔥學院擴充計畫：三、高中新增 65 堂 → 國文 4 堂）。
 *
 * 設計原則：一步一觀念、圖解真的畫得出概念、中途提問放在卡關處、5 題由淺入深。
 * 7 幀分鏡（每幀 step／caption／action／prop／duration，至少 2 幀有 ask）
 * ＋ 5 題闖關（2 基本 → 2 應用 → 1 易錯或跨概念）＋ 3 條 takeaways。
 * 圖解建議：文言文、詩詞曲、散文、論說文多用 text／flow。
 *
 * 引文考證（寫錯就是教錯）：
 *  - 文言實例取自《世說新語·雅量》「王戎不取道旁李」。
 *  - 詩：王之渙〈登鸛雀樓〉（五言絕句）；詞：蘇軾〈水調歌頭〉；曲：馬致遠〈天淨沙·秋思〉。
 *  - 散文實例取自朱自清〈背影〉。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 國文 1：文言文閱讀策略（高一） ===================== */
const SH_CHI_CLASSICAL_READING: OnionLesson = {
  id: "sh-chi-classical-reading",
  title: "文言文閱讀策略：斷句、虛詞、人物",
  subject: "國文",
  topic: "文言文閱讀",
  grade: "高一",
  stages: ["高中"],
  desc: "文言文沒標點怎麼讀？四步策略：斷句、抓虛詞、理人物，最後翻譯成白話。",
  takeaways: ["先斷句：依語意與虛詞（之、其、而、以…）切分", "抓虛詞：之＝代詞、嘗＝曾經、走＝跑", "理人物再加翻譯：補主詞、調語序、換詞義"],
  frames: [
    { step: "步驟 1：認識文言文閱讀四步", id: 1, caption: "嗨！文言文沒有標點，要自己斷句、抓虛詞、理人物，最後才能譯成白話。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：依語意與虛詞斷句", id: 2, caption: "第一步斷句：把『王戎七歲嘗與諸小兒遊』依語意和虛詞，斷成清楚的短句再讀。", action: "point", prop: { kind: "text", text: "王戎七歲，嘗與諸小兒遊。看道邊李樹多子折枝，諸兒競走取之，唯戎不動。", sub: "先斷句：依語意與虛詞", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：圈出句中介詞與虛詞", id: 3, caption: "句子裡的虛詞要圈出來：之、其、而、以、於、乃、則、焉、乎、也，先認出它們。", ask: { prompt: "「諸兒競走取之」的「之」指代什麼？", options: ["李子（代詞）", "王戎", "道路", "小朋友"], answer: 0, hint: "「之」代替前面提到的李樹果實，是代詞。" }, action: "think", prop: { kind: "text", text: "常見虛詞：之、其、而、以、於、乃、則、焉、乎、也", sub: "之＝代詞（李子）；嘗＝曾經", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：理清誰對誰做什麼", id: 4, caption: "再理清人物關係：誰對誰做什麼？王戎和諸小兒，一個去摘、一個不動，主角是誰？", ask: { prompt: "「諸兒競走取之，唯戎不動」描述了什麼？", options: ["諸兒去摘、王戎不動", "王戎去摘、諸兒不動", "大家都去摘", "大家都不動"], answer: 0, hint: "「諸兒」爭著跑過去摘，「唯戎不動」只有王戎沒動。" }, action: "jump", prop: { kind: "text", text: "人物：王戎 ↔ 諸小兒", sub: "諸兒競走取之，唯戎不動", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：補主詞調語序譯白話", id: 5, caption: "最後翻譯三招：補上省略的主詞、調回白話語序、把文言單字換成今詞（嘗→曾經、走→跑）。", action: "point", prop: { kind: "flow", steps: ["補主詞（誰）", "調語序", "換詞義（嘗→曾經、走→跑）"], active: 2 }, duration: 3600 },
    { step: "步驟 6：記四步閱讀口訣", id: 6, caption: "口訣記起來：先斷句、再抓虛詞、理清楚人物，最後才翻譯，四步不亂。", action: "cheer", prop: { kind: "flow", steps: ["斷句", "抓虛詞", "理人物", "再翻譯"], active: 3 }, duration: 3400 },
    { step: "步驟 7：準備闖關小測驗", id: 7, caption: "四步閱讀策略都學會了？準備闖關，動手讀一段文言文吧！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chi-classical-reading-1", prompt: "「學而時習之不亦說乎」正確的斷句是？", options: ["學而時習之，不亦說乎？", "學而時，習之不亦說乎？", "學，而時習之不亦說乎？", "學而時習，之不亦說乎？"], answer: 0, hints: ["「之」是代詞，後面應停頓", "句末疑問用「不亦……乎」"], explanation: "依語意，「學而時習之」是一句，句末「不亦說乎」是疑問語氣，故斷為「學而時習之，不亦說乎？」。" },
    { id: "sh-chi-classical-reading-2", prompt: "「諸兒競走取之」的「之」是什麼詞、指什麼？", options: ["代詞，指李子", "連詞，表順接", "動詞，去", "形容詞，紅的"], answer: 0, hints: ["「之」代替前面提到的事物", "這裡指李樹上的果實"], explanation: "「之」是代詞，代替前文「李樹多子」的李子，意為孩子們爭著跑過去摘它。" },
    { id: "sh-chi-classical-reading-3", prompt: "「嘗與諸小兒遊」的「嘗」在文言文裡常是什麼意思？", options: ["曾經", "品嚐", "嘗試", "常常"], answer: 0, hints: ["文言「嘗」多作時間副詞", "表示「過去有一次」"], explanation: "文言「嘗」常作「曾經」解，表示過去曾發生，不同於今義「品嚐」。" },
    { id: "sh-chi-classical-reading-4", prompt: "文言文中「走」一般指的是？", options: ["跑（疾行）", "步行", "離開", "走路慢慢走"], answer: 0, hints: ["古義「走」是跑", "今義才是步行"], explanation: "文言「走」是「跑」的意思（如「競走」即爭著跑），今義才指步行，翻譯要用「換詞義」。" },
    { id: "sh-chi-classical-reading-5", prompt: "閱讀文言文的正確策略順序是？", options: ["斷句→抓虛詞→理人物→翻譯", "翻譯→斷句→理人物→抓虛詞", "理人物→翻譯→斷句→抓虛詞", "抓虛詞→翻譯→斷句→理人物"], answer: 0, hints: ["不先斷句就翻譯會讀不通", "先讀通再動手譯"], explanation: "正確順序是先斷句、再抓虛詞、理清人物關係，最後才逐句翻譯成白話，四步缺一不可。" },
  ],
};

/* ===================== 國文 2：詩詞曲選（高二） ===================== */
const SH_CHI_POETRY: OnionLesson = {
  id: "sh-chi-poetry",
  title: "詩詞曲選：詩、詞、曲的形式差異",
  subject: "國文",
  topic: "詩詞曲賞析",
  grade: "高二",
  stages: ["高中"],
  desc: "詩、詞、曲形式哪裡不同？從唐詩的整齊、宋詞的長短句到元曲的襯字，一眼分辨。",
  takeaways: ["詩（唐）：字數整齊，絕句四句、律詩八句", "詞（宋）：長短句，依詞牌填寫、有上下闋", "曲（元）：可加襯字、語言較口語"],
  frames: [
    { step: "步驟 1：認識詩詞曲三形式", id: 1, caption: "唐詩、宋詞、元曲都是韻文，但字數和規矩大不同，先來認識它們的長相。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：看唐詩字數整齊", id: 2, caption: "唐詩字數整齊：王之渙〈登鸛雀樓〉每句五字，白日依山盡、黃河入海流這兩句正好對仗。", action: "point", prop: { kind: "text", text: "登鸛雀樓（王之渙）", sub: "白日依山盡，黃河入海流。欲窮千里目，更上一層樓。", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：分辨絕句與律詩", id: 3, caption: "這首是絕句，只有四句；律詩則有八句還講究平仄對仗，先分清幾句很重要。", ask: { prompt: "〈登鸛雀樓〉是幾句的詩？", options: ["四句（絕句）", "八句（律詩）", "兩句", "六句"], answer: 0, hint: "它只有四句，是五言絕句。" }, action: "think", prop: { kind: "text", text: "絕句＝4句；律詩＝8句", sub: "講平仄與對仗", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：看宋詞長短句與詞牌", id: 4, caption: "宋詞是長短句，要依詞牌填寫：蘇軾〈水調歌頭〉明月幾時有，但願人長久，分上下闋。", action: "jump", prop: { kind: "text", text: "水調歌頭（蘇軾）", sub: "明月幾時有？…但願人長久，千里共嬋娟。", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：看元曲襯字與口語", id: 5, caption: "元曲更口語，還能加襯字：馬致遠〈天淨沙〉夕陽西下，斷腸人在天涯，像在說話。", ask: { prompt: "相較詩、詞，元曲多出什麼特色？", options: ["可加襯字、語言較口語", "字數嚴格整齊", "必須八句", "只用五言"], answer: 0, hint: "曲可在句式外自由加字，且偏白話。" }, action: "point", prop: { kind: "text", text: "天淨沙·秋思（馬致遠）", sub: "夕陽西下，斷腸人在天涯。", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：對照詩詞曲形式", id: 6, caption: "對照一下：詩字數齊、詞長短句、曲加襯字又口語，三種形式一眼分得出。", action: "cheer", prop: { kind: "flow", steps: ["詩：字數齊（唐）", "詞：長短句（宋）", "曲：加襯字、口語（元）"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關小測驗", id: 7, caption: "詩詞曲的形式差異都看清了？準備闖關，看你能不能一眼認出它是詩詞還是曲！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chi-poetry-1", prompt: "唐詩在字數上的主要特色是？", options: ["字數整齊（句句同長）", "長短句", "可自由加襯字", "全用口語"], answer: 0, hints: ["絕句律詩都講句式整齊", "詞才是長短句"], explanation: "唐詩字數整齊，每句長短一致；長短句是宋詞的特色，襯字口語是元曲的特色。" },
    { id: "sh-chi-poetry-2", prompt: "唐詩中的「絕句」通常由幾句組成？", options: ["四句", "八句", "兩句", "十句"], answer: 0, hints: ["絕句短小", "律詩才是八句"], explanation: "絕句通常由四句組成；律詩由八句組成並講究對仗。" },
    { id: "sh-chi-poetry-3", prompt: "宋詞填寫時要依據什麼？", options: ["詞牌", "詩題", "曲牌", "平仄自由即可"], answer: 0, hints: ["詞牌規定句式與格律", "不同的牌有不同格式"], explanation: "詞依「詞牌」填寫，詞牌決定字數、句式與押韻，並常分上下闋。" },
    { id: "sh-chi-poetry-4", prompt: "元曲相較於詩、詞，明顯的特點是？", options: ["可加襯字、語言較口語", "字數嚴格不可加字", "必須八句對仗", "只用五言"], answer: 0, hints: ["曲可在定式外加字", "曲文近白話"], explanation: "元曲可在句式外自由添加「襯字」，語言也更口語化，這是詩、詞所無的。" },
    { id: "sh-chi-poetry-5", prompt: "下列何者屬於「曲」而非詩或詞？", options: ["馬致遠〈天淨沙·秋思〉", "王之渙〈登鸛雀樓〉", "蘇軾〈水調歌頭〉", "李白〈靜夜思〉"], answer: 0, hints: ["天淨沙是曲牌", "其餘都是有名的詩或詞"], explanation: "〈天淨沙·秋思〉是元曲小令；〈登鸛雀樓〉〈靜夜思〉是詩，〈水調歌頭〉是詞。" },
  ],
};

/* ===================== 國文 3：現代散文賞析（高二） ===================== */
const SH_CHI_PROSE: OnionLesson = {
  id: "sh-chi-prose",
  title: "現代散文賞析：意象、節奏與情感",
  subject: "國文",
  topic: "現代散文",
  grade: "高二",
  stages: ["高中"],
  desc: "現代散文怎麼讀？抓意象、感節奏、分情感層次，用朱自清〈背影〉讀出作者心境。",
  takeaways: ["意象：具體物承載抽象情感", "節奏：長短句與標點像呼吸", "情感有層次：表面寫景、深層抒情"],
  frames: [
    { step: "步驟 1：認識散文賞析三鑰", id: 1, caption: "現代散文不靠韻律，而是用意象傳情、用節奏呼吸，一起學怎麼讀出作者心境。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：找出文中的意象", id: 2, caption: "先找意象：朱自清〈背影〉裡『朱紅的橘子』『黑布大馬褂』都是具體物，承載著情感。", action: "point", prop: { kind: "text", text: "意象＝具體物承載抽象情", sub: "朱紅橘子、黑布馬褂", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：讀意象下的情感", id: 3, caption: "讀意象要往下挖：朱紅橘子不只是水果，它象徵父親笨拙卻溫暖的愛，你讀到了嗎？", ask: { prompt: "〈背影〉中「朱紅的橘子」主要象徵什麼？", options: ["父愛的溫暖", "水果很好吃", "秋天的景物", "分別的地點"], answer: 0, hint: "橘子是父親爬月台買來的，代表他的愛。" }, action: "think", prop: { kind: "text", text: "朱紅橘子＝父愛的溫暖", sub: "具體物→抽象情", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：感受句子的長短節奏", id: 4, caption: "再看節奏：散文用長句鋪陳、短句頓挫，標點像呼吸，讀起來的快慢就是作者的情緒。", action: "jump", prop: { kind: "text", text: "節奏＝長短句與標點的呼吸", sub: "長句鋪陳、短句頓挫", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：分層讀出情感", id: 5, caption: "情感有層次：表面在寫父親爬月台買橘，深層卻是不捨與感恩，要分兩層來讀。", ask: { prompt: "〈背影〉表面寫父親爬月台，深層在寫什麼？", options: ["不捨與感恩", "當天天氣", "沿途風景", "橘子的價格"], answer: 0, hint: "具體動作背後是兒子對父愛的體會。" }, action: "point", prop: { kind: "flow", steps: ["表面：寫父親爬月台", "深層：不捨與感恩"], active: 1 }, duration: 3600 },
    { step: "步驟 6：記散文賞析口訣", id: 6, caption: "賞析口訣：先抓意象、再感節奏、最後分層讀情感，三步讀透一篇散文。", action: "cheer", prop: { kind: "flow", steps: ["抓意象", "感節奏", "分層讀情感"], active: 2 }, duration: 3400 },
    { step: "步驟 7：準備闖關小測驗", id: 7, caption: "意象、節奏、情感都學會了？準備闖關，讀一段散文試著讀出作者心境！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chi-prose-1", prompt: "散文賞析所說的「意象」是指？", options: ["具體物承載抽象情感", "單純寫實的物件", "一種修辭手法", "詩的題目"], answer: 0, hints: ["意象是景中有情", "具體物背後有抽象意義"], explanation: "意象是作者借具體的景物或物件，承載抽象的情感與想法，如橘子承載父愛。" },
    { id: "sh-chi-prose-2", prompt: "朱自清〈背影〉中「朱紅的橘子」象徵什麼？", options: ["父愛的溫暖", "水果的甜", "秋天的景色", "車站的混亂"], answer: 0, hints: ["橘子是父親辛苦買來的", "具體物指向情感"], explanation: "橘子是父親爬月台買給兒子的，朱紅的暖色象徵笨拙卻溫暖的父愛。" },
    { id: "sh-chi-prose-3", prompt: "散文的「節奏」主要指什麼？", options: ["長短句與標點的呼吸", "押韻是否工整", "字數是否整齊", "平仄的講究"], answer: 0, hints: ["節奏在散文中靠句式", "長句短句交錯"], explanation: "散文不像詩詞講平仄押韻，它的節奏來自長短句的交錯與標點的停頓，像呼吸一樣。" },
    { id: "sh-chi-prose-4", prompt: "讀散文時，情感層次上要注意？", options: ["表面寫景、深層抒情", "只看字面意思", "只讀標題", "只數句子長短"], answer: 0, hints: ["好散文景中有情", "要讀出深層情感"], explanation: "散文常表面寫景寫事，深層卻在抒情，賞讀時要分兩層，才讀得出作者心境。" },
    { id: "sh-chi-prose-5", prompt: "有人說「橘子只是水果，不用多想」，這忽略了什麼？", options: ["意象承載的深層情感", "作者的字跡", "文章的長度", "標點的用法"], answer: 0, hints: ["只當寫實就讀不到情", "意象須往下挖掘"], explanation: "把意象當成純寫實，會漏掉作者借橘子傳達的父愛與不捨，這正是散文賞析要看的深層。" },
  ],
};

/* ===================== 國文 4：論說文寫作（高三） ===================== */
const SH_CHI_ESSAY_WRITING: OnionLesson = {
  id: "sh-chi-essay-writing",
  title: "論說文寫作：立論、舉證、駁論、結論",
  subject: "國文",
  topic: "論說文寫作",
  grade: "高三",
  stages: ["高中"],
  desc: "論說文如何說服人？立論、舉證、駁論、結論四步，搭配總分總結構寫出條理。",
  takeaways: ["立論：明確主張＋界定範圍", "舉證：事實、數據、事例、名言", "駁論與結論：預想反方、回扣主張"],
  frames: [
    { step: "步驟 1：認識論說文四步驟", id: 1, caption: "論說文要說服讀者，靠四步驟：立論、舉證、駁論、結論，一步步把道理說清楚。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：先立論點明確主張", id: 2, caption: "第一步立論：先拋出明確主張，並界定討論範圍，讓讀者一眼知道你在說什麼。", action: "point", prop: { kind: "text", text: "立論＝明確主張＋界定範圍", sub: "先說清楚你的看法", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：用證據支持論點", id: 3, caption: "第二步舉證：用事實、數據、事例或名言來支持主張，光喊口號可說服不了人。", ask: { prompt: "要讓論點站得住，最好怎麼做？", options: ["用事實、數據等證據支持", "只喊口號", "只用感嘆", "完全不舉證"], answer: 0, hint: "證據越具體，主張越有說服力。" }, action: "think", prop: { kind: "text", text: "舉證＝事實/數據/事例/名言", sub: "用證據支持主張", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：設想反方駁論回應", id: 4, caption: "第三步駁論：先預想反方會怎麼反駁，主動回應，文章才經得起挑戰。", ask: { prompt: "「駁論」是指什麼？", options: ["預想反方意見並回應", "只說自己對", "不理會反對", "抄別人的話"], answer: 0, hint: "先想對手怎麼反駁，再化解。" }, action: "jump", prop: { kind: "text", text: "駁論＝預想反方並回應", sub: "主動化解質疑", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：下結論回扣主張", id: 5, caption: "第四步結論：回扣一開始的主張，並提出行動或展望，讓文章有收尾也有力量。", action: "point", prop: { kind: "text", text: "結論＝回扣主張＋行動/展望", sub: "收尾也有力量", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：記四段寫作口訣", id: 6, caption: "寫作結構口訣：總—分—總，或起—承—轉—合，四步對應四段，條理清楚。", action: "cheer", prop: { kind: "flow", steps: ["立論", "舉證", "駁論", "結論"], active: 3 }, duration: 3400 },
    { step: "步驟 7：準備闖關小測驗", id: 7, caption: "立論舉證駁論結論都記好了？準備闖關，動手寫一段有說服力的論說文！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "sh-chi-essay-writing-1", prompt: "論說文寫作的第一步「立論」是指？", options: ["提出明確主張並界定範圍", "舉例子證明", "批評反方", "寫結語"], answer: 0, hints: ["立論是文章的總主張", "要先說清楚立場"], explanation: "立論是提出明確的主張，並界定討論的範圍，讓讀者知道你究竟在說什麼。" },
    { id: "sh-chi-essay-writing-2", prompt: "用來支持論點的「舉證」可以包含哪些？", options: ["事實、數據、事例、名言", "只有感嘆句", "只有文章標題", "只有結論"], answer: 0, hints: ["證據要具體多元", "名言事例都算"], explanation: "舉證可用事實、數據、事例或名言等材料來支持主張，使論點更有說服力。" },
    { id: "sh-chi-essay-writing-3", prompt: "「駁論」在論說文中的作用是？", options: ["預想反方意見並回應", "完全不理反對", "只誇自己對", "刪掉不同意見"], answer: 0, hints: ["先想對手怎麼反駁", "主動化解才嚴密"], explanation: "駁論是先預想反方可能提出的質疑並主動回應，使文章論證更周延、經得起挑戰。" },
    { id: "sh-chi-essay-writing-4", prompt: "論說文的「結論」應該做到？", options: ["回扣主張並提出行動或展望", "換一個全新話題", "只重複題目", "可以省略不寫"], answer: 0, hints: ["結論要收束全文", "回扣開頭的主張"], explanation: "結論應回扣一開始的主張，並提出行動建議或未來展望，讓文章有收尾與力量。" },
    { id: "sh-chi-essay-writing-5", prompt: "寫論說文時，下列何者是最常犯的毛病？", options: ["只有立論主張，缺少舉證", "段落太多", "用字太認真", "句子寫得太長"], answer: 0, hints: ["空有主張無證據最弱", "記得舉證撐論點"], explanation: "最常見的毛病是只有主張（立論）卻不舉證，讀者無從被說服；務必用證據支撐每一個論點。" },
  ],
};

export default [
  SH_CHI_CLASSICAL_READING,
  SH_CHI_POETRY,
  SH_CHI_PROSE,
  SH_CHI_ESSAY_WRITING,
];
