/**
 * 國中社會 8 堂（junior-social-add.ts）
 *
 * 課程表來自 docs/onion-200-plan.md →「社會 8 堂」（id: jh-soc-*）。
 * 每堂課 9 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 3 幀有 ask）
 * ＋ 6 題闖關（含 2 級提示與詳解）＋ 4 條 takeaways。
 * 圖解依各課核心概念選用 flow（朝代更替、制度流程、產業演變）、
 * bars（河長、雨量、人口密度比較）、text（定義與對照）、balance（供需平衡）。
 * 歷史與政治敘述保持中立、客觀，符合臺灣課綱。傳統中文書寫、全形標點。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 1. 七上 — 中國古代文明與朝代 ===================== */
const JH_SOC_ANCIENT_CHINA: OnionLesson = {
  id: "jh-soc-ancient-china",
  title: "中國古代文明與朝代：誰接替誰？",
  subject: "社會",
  topic: "中國古代文明與朝代",
  grade: "七上",
  stages: ["國中"],
  desc: "跟著洋蔥從夏商周到明清，看朝代如何更替與四大發明的世界影響。",
  takeaways: [
    "朝代依序更替：夏、商、周、秦、漢……一代接一代",
    "秦統一文字與度量衡、漢開拓絲路，讓文明更緊密",
    "四大發明（造紙、印刷、火藥、指南針）沿絲路影響世界",
    "早期文明多發源於黃河、長江等大河流域；四大發明經絲路西傳，深刻改變世界文明進程",
  ],
  frames: [
    { step: "步驟 1：打開古文明時間軸", id: 1, caption: "你想想看，中國有好幾千年的文明，我們就從最早的朝代，一站一站認識起。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：把朝代排成長線", id: 2, caption: "把朝代排成一條長線：夏、商、周、秦、漢，再接唐、宋、明、清，一代接著一代。", action: "point", prop: { kind: "flow", steps: ["夏", "商", "周", "秦", "漢", "唐", "宋", "明", "清"], active: 0 }, duration: 3600 },
    { step: "步驟 3：文明為何聚在大河邊", id: 3, caption: "記得哦，早期文明多在黃河、長江邊，水源夠、能種田，人口才慢慢聚集起來。", action: "point", prop: { kind: "text", text: "大河流域 → 農耕 → 文明", sub: "水源與農業是基礎", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：看懂改朝換代", id: 4, caption: "舊朝代結束了、新朝代接手統治，這就是歷史上說的改朝換代，你有概念了嗎？", action: "think", prop: { kind: "flow", steps: ["舊朝代結束", "新朝代建立", "改朝換代"], active: 2 }, duration: 3600, ask: { prompt: "「改朝換代」指的是下列哪一種情形？", options: ["舊朝結束、新朝建立", "同一個皇帝一直延續到底", "只換年號國號、政權沒變", "改朝換代就等於文明消失"], answer: 0, hint: "想想是誰來接替上一個朝代的統治者。" } },
    { step: "步驟 5：秦漢怎麼整合天下", id: 5, caption: "秦統一文字和度量衡，漢開拓絲路，各地的交流從此變得更緊密了。", action: "jump", prop: { kind: "text", text: "秦：統一度量衡、文字", sub: "漢：開拓絲路", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：點名四大發明", id: 6, caption: "中國古代有四大發明：造紙術、印刷術、火藥、指南針，每一項都影響深遠。", action: "point", prop: { kind: "text", text: "四大發明：造紙／印刷／火藥／指南針", sub: "古代重要發明", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項「不是」中國四大發明？", options: ["造紙術", "地動儀", "指南針", "火藥"], answer: 1, hint: "回想古代中國的四大發明清單，剩下那項是用來測地震的。" } },
    { step: "步驟 7：發明沿絲路西傳", id: 7, caption: "這些發明沿著絲路往西傳，一項一項改變了世界各地發展的腳步。", action: "walk", prop: { kind: "flow", steps: ["中國發明", "絲路傳出", "影響世界"], active: 2 }, duration: 3600 },
    { step: "步驟 8：各發明各有什麼用", id: 8, caption: "你想想看，指南針幫航海定向、火藥改變戰爭、印刷術讓知識傳得更快。", action: "think", prop: { kind: "text", text: "指南針→航海　火藥→戰爭　印刷→傳播", sub: "改變世界的進程", tone: "ok" }, duration: 3600, ask: { prompt: "指南針西傳後，對下列哪一件事的幫助最大？", options: ["遠洋航海時辨別方向", "讓士兵在戰場火力更強", "讓書籍印刷得更快", "提高農田的灌溉效率"], answer: 0, hint: "指南針能指示方向，哪件事最需要認路？" } },
    { step: "步驟 9：背朝代發明口訣", id: 9, caption: "記住口訣：夏商周秦漢，四大發明傳向世界。預備好了嗎？準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-ancient-china-1", prompt: "下列哪一項「不是」中國的四大發明？", options: ["造紙術", "印刷術", "地動儀", "火藥"], answer: 2, hints: ["四大發明是造紙、印刷、火藥、指南針", "地動儀是張衡用來測地震的儀器"], explanation: "四大發明為造紙術、印刷術、火藥、指南針；地動儀是東漢張衡發明、用來偵測地震，並不在四大發明之內。" },
    { id: "jh-soc-ancient-china-2", prompt: "「改朝換代」的意思最接近下列哪一項？", options: ["同一個家族一直統治下去", "只換年號國號、政權沒變", "只有被外族打敗才會發生", "舊朝代結束、新朝代建立"], answer: 3, hints: ["是政權的替換", "舊的不在、新的接手"], explanation: "改朝換代指舊朝代結束、新朝代建立，是政權的更替，未必只是改個名號，也不一定等於文明消失。" },
    { id: "jh-soc-ancient-china-3", prompt: "秦統一文字與度量衡，對當時有什麼好處？", options: ["讓各地溝通與交易更方便", "只是方便皇帝控制，和百姓無關", "反而讓各地人更難互相了解", "主要是為了增加徵兵與稅收"], answer: 0, hints: ["統一了規格", "溝通與交易更方便"], explanation: "統一文字、度量衡讓各地溝通與交易更有共通標準，有助於國家整合，不只是統治者的事。" },
    { id: "jh-soc-ancient-china-4", prompt: "中國的許多發明常沿著什麼路線傳到其他地區？", options: ["靠科舉考試制度向外流傳", "沿著絲路等中西貿易通道傳出", "走萬里長城的守軍路線運送", "經鄭和下西洋才傳到西方"], answer: 1, hints: ["是連接東西方的通道", "古代重要的貿易路線"], explanation: "許多發明沿著絲路等貿易路線西傳，促進各地交流；科舉是選官制度、長城是防衛設施，都不是傳播發明的路線。" },
    { id: "jh-soc-ancient-china-5", prompt: "關於朝代更替，下列說法何者最合適？", options: ["一建立就永遠不再改變", "改朝換代代表文明完全中斷", "朝代因各種原因更替，是常見現象", "只有外來勢力入侵才會改朝換代"], answer: 2, hints: ["歷史上曾多次改朝", "更替不代表文明斷絕"], explanation: "歷史上朝代常因各種原因更替，這是文明發展中常見的現象；更替並不代表文明消失，也不只限於外族入侵。" },
    { id: "jh-soc-ancient-china-6", prompt: "中國早期文明主要發源於下列哪一種地理環境？", options: ["地勢高聳的青藏高原", "遠離河流的乾燥草原", "終年冰封的高山凍原", "黃河、長江等大河流域"], answer: 3, hints: ["需要水源", "適合農耕"], explanation: "大河流域水源充足、土壤肥沃、適合農耕，人口才容易聚集，早期文明多發源於此，而不是高寒或乾燥之地。" },
  ],
};

/* ===================== 2. 七下 — 日治時期的臺灣 ===================== */
const JH_SOC_TAIWAN_JAPANESE: OnionLesson = {
  id: "jh-soc-taiwan-japanese",
  title: "日治時期的臺灣：建設與抗爭",
  subject: "社會",
  topic: "日治時期的臺灣",
  grade: "七下",
  stages: ["國中"],
  desc: "日治時期（1895–1945）：基礎建設與社會抗爭並存的雙面歷史。",
  takeaways: [
    "1895 年後日本統治臺灣，興建鐵路、港口、自來水等公共建設",
    "同時發展糖、樟腦等產業，作為出口賺取資金的來源",
    "統治也帶來差別待遇，引發如霧社事件等社會抗爭",
    "日治時期推動教育與國語運動，但臺灣人升學與待遇仍受限制；建設多為殖民地經濟需求服務",
  ],
  frames: [
    { step: "步驟 1：拉近日治這段歷史", id: 1, caption: "你知道嗎，1895 到 1945 年這段期間，臺灣由日本統治，歷史上稱為日治時期。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：統治從哪年開始", id: 2, caption: "1895 年簽下馬關條約，臺灣從此被劃入日本統治，日治時期正式展開。", action: "point", prop: { kind: "text", text: "1895：馬關條約", sub: "日治時期開始", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：看當時蓋了哪些建設", id: 3, caption: "日本在臺灣蓋了鐵路、港口、自來水，交通與公共設施明顯進步。", action: "think", prop: { kind: "flow", steps: ["鐵路", "港口", "自來水", "公共建設"], active: 2 }, duration: 3600, ask: { prompt: "日治時期興建的基礎建設，不包括下列哪一項？", options: ["高鐵系統", "鐵路", "港口", "自來水"], answer: 0, hint: "想想哪一種是戰後才有的現代設施。" } },
    { step: "步驟 4：認識兩樣出口產業", id: 4, caption: "當時大力發展製糖和樟腦，把產品賣到外地，賺取統治需要的資金。", action: "jump", prop: { kind: "text", text: "重要產業：糖、樟腦", sub: "出口賺取資金", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：教育與差別待遇並存", id: 5, caption: "日治也設學校、推國語運動，不過臺灣人升學和就業待遇，仍然受到限制。", action: "point", prop: { kind: "text", text: "設校／國語運動／待遇受限", sub: "同化政策與差別待遇並存", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：不滿怎麼累積起來", id: 6, caption: "你想想看，差別待遇看久了，部分臺灣人感到不公平，開始起來抗爭。", action: "walk", prop: { kind: "flow", steps: ["差別待遇", "感到不公平", "社會抗爭"], active: 2 }, duration: 3600 },
    { step: "步驟 7：認識霧社事件", id: 7, caption: "像霧社事件，就是原住民不滿統治而發起的一場知名抗爭。", action: "point", prop: { kind: "text", text: "霧社事件：原住民抗爭", sub: "爭取公平對待", tone: "warn" }, duration: 3600, ask: { prompt: "「霧社事件」主要是哪一群人的抗爭行動？", options: ["漢人移民的武裝反抗", "原住民對統治的抗爭", "日本官員之間的內鬨", "海商與外商的武裝衝突"], answer: 1, hint: "事件發生在山地的原住民部落。" } },
    { step: "步驟 8：建設背後的真正目的", id: 8, caption: "這些建設和產業，主要是供應殖民地經濟的需求，不是只為了臺灣人好。", action: "think", prop: { kind: "text", text: "建設服務殖民地經濟", sub: "雙面性要客觀看", tone: "warn" }, duration: 3600, ask: { prompt: "日治時期雖興建建設、設校，整體而言主要為了誰的利益？", options: ["殖民母國的資源與經濟需求", "以臺灣本地人福祉為最優先", "為了幫助原住民現代化", "完全是為了觀光發展"], answer: 0, hint: "建設與產業多半為殖民地統治服務。" } },
    { step: "步驟 9：記日治雙面口訣", id: 9, caption: "記住：建設與統治並存、抗爭為了公平。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-taiwan-japanese-1", prompt: "日治時期大致是從哪一年到哪一年？", options: ["1800–1850", "1945–1990", "1895–1945", "1700–1750"], answer: 2, hints: ["和馬關條約的年份有關", "結束於二次大戰後"], explanation: "日治時期指 1895 年馬關條約後到 1945 年二次大戰結束，日本統治臺灣的這段期間。" },
    { id: "jh-soc-taiwan-japanese-2", prompt: "日治時期興建的基礎建設，下列何者有助於交通進步？", options: ["高速公路", "都會捷運系統", "國際機場航廈", "鐵路與港口"], answer: 3, hints: ["當時重點在鐵道與港埠", "另外三項是更晚才出現"], explanation: "日治時期興建鐵路、港口、自來水等公共建設，其中鐵路與港口大幅改善了當時的交通運輸。" },
    { id: "jh-soc-taiwan-japanese-3", prompt: "日治時期大力發展糖、樟腦等產業，主要目的是什麼？", options: ["出口外銷賺取資金", "全部免費送給母國", "為了讓農地休耕養地", "做來作為學校標本"], answer: 0, hints: ["是當時重要的經濟活動", "產品多向外出口"], explanation: "當時發展糖、樟腦等產業並出口，是為了賺取資金、支撐殖民地的經濟，而不是無償送人或作為展示。" },
    { id: "jh-soc-taiwan-japanese-4", prompt: "關於霧社事件，下列說法何者正確？", options: ["漢人的農民抗稅事件", "原住民不滿統治的抗日行動", "發生在海上的一場海戰", "與殖民統治完全無關"], answer: 1, hints: ["事件主角是原住民", "起因和統治的不滿有關"], explanation: "霧社事件是原住民因對統治不滿而發起的抗爭行動，反映日治時期的社會衝突。" },
    { id: "jh-soc-taiwan-japanese-5", prompt: "下列哪一項最能說明日治時期的「雙面」特質？", options: ["只有建設、沒有任何衝突", "只有抗爭、毫無建設進步", "建設進步與社會抗爭同時存在", "十年間完全沒有任何改變"], answer: 2, hints: ["題目強調雙面", "一邊建設、一邊也有不滿"], explanation: "日治時期一方面有鐵路、公共設施等建設進步，另一方面也有差別待遇引發的抗爭，兩者並存才是全貌。" },
    { id: "jh-soc-taiwan-japanese-6", prompt: "日治時期臺灣人雖有機會就學，但升學與就業上仍可能遇到什麼情形？", options: ["完全和日本人平起平坐", "根本不能進學校讀書", "學校全部都被關閉", "升學與工作上仍受限別待遇"], answer: 3, hints: ["並非完全平等", "差別待遇仍存在"], explanation: "日治時期雖推動教育，但在升學機會與工作待遇上仍有差別待遇，這也是部分臺灣人不滿的來源之一。" },
  ],
};

/* ===================== 3. 七上 — 臺灣的河流與水文 ===================== */
const JH_SOC_TAIWAN_RIVER: OnionLesson = {
  id: "jh-soc-taiwan-river",
  title: "臺灣的河流與水文：短又急的河",
  subject: "社會",
  topic: "臺灣的河流與水文",
  grade: "七上",
  stages: ["國中"],
  desc: "臺灣河川短而急、夏多冬少，看水庫如何調節寶貴的水資源。",
  takeaways: [
    "山高坡陡、距海近，臺灣河川大多短而急、水量變化大",
    "夏季颱風帶雨、水量大增；冬季較少，年內變化明顯",
    "興建水庫可儲水防洪、調節水量，並要節約與保護水質",
    "河短急不利航運但坡陡流急、水力豐富；水庫攔沙有限，保護上游集水區與水土保持才能永續供水",
  ],
  frames: [
    { step: "步驟 1：先看臺灣的山勢", id: 1, caption: "你有沒有發現，臺灣山高坡又陡，離海也很近，所以河流大多又短又急。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：記住河川三個字", id: 2, caption: "坡陡又離海近，河流短而急，不好走大船，可是水力資源很豐富。", action: "point", prop: { kind: "text", text: "河川特色：短、急、水量變化大", sub: "坡陡、距海近", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：比三條河的長度", id: 3, caption: "濁水溪最長約 186 公里，高屏溪約 171 公里，淡水河約 159 公里。", action: "think", prop: { kind: "bars", items: [{ label: "濁水溪", value: 186 }, { label: "高屏溪", value: 171 }, { label: "淡水河", value: 159 }], unit: "公里", active: 0 }, duration: 3800, ask: { prompt: "臺灣最長的河川是下列哪一條？", options: ["濁水溪", "高屏溪", "淡水河", "曾文溪"], answer: 0, hint: "看長條圖中最長的那一條是哪條河。" } },
    { step: "步驟 4：短急的缺點與優點", id: 4, caption: "短急不利大船航行，但水流又快又急，反而很適合蓋水力發電廠。", action: "point", prop: { kind: "balance", left: "短急：不利航運", right: "流急：利水力發電", tip: "缺點也能變優點" }, duration: 3600 },
    { step: "步驟 5：水量夏多冬少", id: 5, caption: "夏天颱風帶來大雨，河水暴漲；冬天雨水少，水位就下降，變化很大。", action: "jump", prop: { kind: "flow", steps: ["夏季多雨", "河川水量大", "冬季少雨", "水量變小"], active: 1 }, duration: 3600 },
    { step: "步驟 6：用水庫把水存起來", id: 6, caption: "為了存水防洪，我們蓋水庫，把豐水期多餘的水，留到枯水期再用。", action: "point", prop: { kind: "text", text: "水庫：存水、防洪、調節", sub: "豐水期存、枯水期用", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：想想水庫在做什麼", id: 7, caption: "水庫是在調節水量，不是把河變長哦。節約用水、保護水質，水才夠用。", action: "walk", prop: { kind: "flow", steps: ["節約用水", "保護水質", "水才夠用"], active: 2 }, duration: 3600, ask: { prompt: "興建水庫最主要的目的，不包括下列哪一項？", options: ["攔下豐水期多餘的水", "改變河流的長度與走向", "在枯水期穩定供水", "減輕下游的洪水威脅"], answer: 1, hint: "水庫管理的是水量，並不會動到河流的長度。" } },
    { step: "步驟 8：水庫要顧好上游", id: 8, caption: "水庫要長久供水，得保護上游集水區、做好水土保持，不然容易被土石淤滿。", action: "think", prop: { kind: "text", text: "保護集水區＋水土保持", sub: "水庫才能長久使用", tone: "warn" }, duration: 3600, ask: { prompt: "水庫雖然能調節水量，但要長久發揮功能，還必須做好什麼？", options: ["保護集水區、做好水土保持", "把上游的樹木全部砍光", "只把壩體加高就不會淤積", "限制下游用水就沒問題"], answer: 0, hint: "上游水土流失會慢慢淤積水庫。" } },
    { step: "步驟 9：記河川水資源口訣", id: 9, caption: "記住：河短又急、夏多冬少、水庫調節、節約用水。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-taiwan-river-1", prompt: "臺灣的河川大多具有下列哪一個特色？", options: ["又長又平緩", "全年乾涸無水", "短而湍急", "每一條都能通航"], answer: 2, hints: ["想想山高坡陡", "離海也很近"], explanation: "臺灣山高坡陡、距海近，河川大多短而急、水量變化大，不易航行但水力強。" },
    { id: "jh-soc-taiwan-river-2", prompt: "臺灣河川的水量在一年當中，通常是怎樣變化？", options: ["全年雨量一樣多", "冬天多、夏天少", "只有春天有水", "夏天多、冬天少"], answer: 3, hints: ["夏天常有颱風", "冬天降雨較少"], explanation: "夏季颱風帶來大量雨水，河川水量大增；冬季降雨少，水量較小，年內變化明顯。" },
    { id: "jh-soc-taiwan-river-3", prompt: "興建水庫的主要功用，不包括下列哪一項？", options: ["讓河川變長", "把豐水期的水存起來", "在洪水期攔水減災", "調節枯水期的水量"], answer: 0, hints: ["水庫管理的是水量", "不會改變河流長度"], explanation: "水庫可儲水、防洪、調節水量，把豐水期的水留到枯水期使用，但不會讓河流變長。" },
    { id: "jh-soc-taiwan-river-4", prompt: "為什麼我們需要節約用水？", options: ["水用也用不完", "水資源有限且分布不均", "水庫永遠裝不滿", "臺灣的河都特別長"], answer: 1, hints: ["河川短急、水量變化大", "可供利用的水其實有限"], explanation: "因河川短急、水量夏多冬少且水資源有限，節約用水才能在枯水期穩定供應。" },
    { id: "jh-soc-taiwan-river-5", prompt: "關於臺灣河川的利用，下列說法何者最合適？", options: ["全都適合大船長途航行", "冬天水量比夏天還多", "因短急不利航運但可發電", "根本不需要興建水庫"], answer: 2, hints: ["短急代表坡度大", "坡度大水力資源強"], explanation: "臺灣河川短而急，坡度大不利航運，但水力資源強可用來發電；水庫則幫忙調節水量。" },
    { id: "jh-soc-taiwan-river-6", prompt: "水庫會逐漸被泥沙淤積而減少容量，最主要與下列哪件事有關？", options: ["水質太乾淨", "天氣太熱蒸發太快", "下雨次數實在太多", "上游水土保持不良"], answer: 3, hints: ["泥沙從哪來", "上游山坡地"], explanation: "上游山坡地若水土保持不良，下雨時泥沙被沖刷進水庫造成淤積，因此做好集水區保育才能延長水庫壽命。" },
  ],
};

/* ===================== 4. 八上 — 人口分布與都市化 ===================== */
const JH_SOC_POPULATION: OnionLesson = {
  id: "jh-soc-population",
  title: "人口分布與都市化：人為什麼聚在一起？",
  subject: "社會",
  topic: "人口分布與都市化",
  grade: "八上",
  stages: ["國中"],
  desc: "人口密度西密東疏，工作機會聚人成都市、形成都市化現象。",
  takeaways: [
    "臺灣人口集中西部平原、密度高；東部山地多、密度較低",
    "工作、交通、醫療、教育集中，吸引人口聚集成都市",
    "越來越多人住進都市的趨勢叫都市化，也帶來塞車等問題",
    "人口密度＝人口數÷面積；都市化帶來塞車空污等問題，要靠大眾運輸與合理規劃來因應",
  ],
  frames: [
    { step: "步驟 1：認識人口密度", id: 1, caption: "你聽過人口密度嗎？它是算「每單位面積住了多少人」，用來看哪裡比較擠。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：看人擠在哪一邊", id: 2, caption: "臺灣人多集中在西部平原，密度很高；東部山多，人口密度就低很多。", action: "point", prop: { kind: "bars", items: [{ label: "西部平原", value: 600 }, { label: "東部山地", value: 100 }], unit: "人/平方公里", active: 0 }, duration: 3800, ask: { prompt: "臺灣人口與都市主要集中在本島的哪一邊？", options: ["西部平原地帶", "東部狹長山區", "北部的離島海洋", "全島平均分布"], answer: 0, hint: "平原多、適合居住的地方，人口密度才高。" } },
    { step: "步驟 3：動手算一次密度", id: 3, caption: "人口密度＝人口數÷面積：20000 人÷100 平方公里＝200 人/平方公里。", action: "point", prop: { kind: "balance", left: "20000 人 ÷ 100 km²", right: "200 人/km²", tip: "密度＝人口除以面積" }, duration: 3600 },
    { step: "步驟 4：人怎麼聚成都市", id: 4, caption: "工廠、商店、學校集中，工作機會變多，人口就慢慢地聚成都市。", action: "think", prop: { kind: "flow", steps: ["工作機會多", "人口聚集", "形成都市"], active: 2 }, duration: 3600 },
    { step: "步驟 5：都市憑什麼吸引人", id: 5, caption: "都市有就業、交通、醫療、教育，愈是方便，就有愈多人想搬進來住。", action: "jump", prop: { kind: "text", text: "都市功能：就業／交通／醫療／教育", sub: "吸引人口移入", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：看懂什麼叫都市化", id: 6, caption: "你想想看，愈來愈多人住進都市，這種人口往都市集中的趨勢，就叫都市化。", action: "walk", prop: { kind: "flow", steps: ["人口移入", "都市擴大", "都市化"], active: 2 }, duration: 3600, ask: { prompt: "「都市化」指的是下列哪一種現象？", options: ["人口從都市回流到農村", "人口逐漸往都市集中", "都市數量一直維持不變", "鄉村人口不斷增加"], answer: 1, hint: "注意「都市」這個關鍵字，是人口往哪裡移動。" } },
    { step: "步驟 7：都市太大也有煩惱", id: 7, caption: "都市太大也會塞車、空氣差、房價高，這些問題都需要好好規劃。", action: "point", prop: { kind: "text", text: "都市問題：塞車／空污／高房價", sub: "需要妥善規劃", tone: "warn" }, duration: 3600 },
    { step: "步驟 8：想想對策是什麼", id: 8, caption: "完善大眾運輸、鼓勵共乘，再配合合理的土地規劃，都市病才會慢慢緩解。", action: "think", prop: { kind: "text", text: "大眾運輸＋合理規劃", sub: "紓解都市病", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項最能有效紓解都市塞車與空氣汙染？", options: ["完善大眾運輸、鼓勵共乘", "鼓勵大家開私人轎車代步", "禁止所有人開車也不搭車", "把市區工廠全部強制歇業"], answer: 0, hint: "減少私人小客車的使用量最有效。" } },
    { step: "步驟 9：記人口都市口訣", id: 9, caption: "記住：西密東疏、工作聚人、都市化要規劃。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-population-1", prompt: "人口密度是指什麼？", options: ["城市裡的高樓總數", "河川的總長度", "每單位面積住多少人", "山脈的平均高度"], answer: 2, hints: ["和「面積」與「人數」有關", "用來看哪裡比較擠"], explanation: "人口密度是每單位面積居住的人口數，用來表示一個地方擁擠的程度，和高樓、河長無關。" },
    { id: "jh-soc-population-2", prompt: "臺灣人口與都市主要集中在本島的哪一邊？", options: ["東部沿岸", "外海島嶼", "全島平均分布", "西部平原地帶"], answer: 3, hints: ["西部平原多", "平原適合居住與耕種"], explanation: "臺灣西部多平原、適合居住與發展，因此人口與都市主要集中在西部，而非均勻分布。" },
    { id: "jh-soc-population-3", prompt: "都市能吸引人口移入，最主要的原因是什麼？", options: ["工作機會多、資源集中", "山比較高、空氣好", "河流特別長又寬", "冬天比較冷又舒服"], answer: 0, hints: ["都市集中了什麼", "人就會為了工作聚集"], explanation: "都市集中了就業、交通、醫療、教育等資源，工作機會多，因此吸引人口移入。" },
    { id: "jh-soc-population-4", prompt: "「都市化」會帶來下列哪一個現象？", options: ["人口全部搬回農村", "人口逐漸往都市集中", "都市漸漸變成空城", "河流因此改道"], answer: 1, hints: ["是人口移動的趨勢", "和都市的發展有關"], explanation: "都市化是指人口逐漸向都市集中、都市範圍擴大的趨勢，而不是人口回流農村。" },
    { id: "jh-soc-population-5", prompt: "關於都市化帶來的問題，下列說法何者正確？", options: ["空氣一定愈來愈好", "完全沒有任何缺點", "可能造成塞車與高房價", "人口會立刻全部減少"], answer: 2, hints: ["人多會帶來什麼", "交通與居住是常見困擾"], explanation: "都市過度集中會帶來塞車、空氣污染、高房價等問題，需要妥善的都市規劃。" },
    { id: "jh-soc-population-6", prompt: "某區域面積 100 平方公里、居住人口 20000 人，人口密度是多少？", options: ["20 人/平方公里", "2000 人/平方公里", "2 人/平方公里", "200 人/平方公里"], answer: 3, hints: ["密度＝人口÷面積", "20000 ÷ 100"], explanation: "人口密度 ＝ 人口數 ÷ 面積 ＝ 20000 ÷ 100 ＝ 200 人/平方公里，數別算錯位數。" },
  ],
};

/* ===================== 5. 七上 — 中國的地理環境與區域 ===================== */
const JH_SOC_CHINA_REGION: OnionLesson = {
  id: "jh-soc-china-region",
  title: "中國的地理環境與區域：西高東低",
  subject: "社會",
  topic: "中國的地理環境與區域",
  grade: "七上",
  stages: ["國中"],
  desc: "中國西高東低三階梯，南暖北冷，地形氣候造成明顯的區域差異。",
  takeaways: [
    "地形像三級階梯：西邊高（青藏）、東邊低（平原）",
    "南方暖濕、北方乾冷，緯度與距海遠近造成氣候差異",
    "地形氣候影響作物與生活，形成不同的區域特色",
    "地勢西高東低使大河多向東流；南稻北麥是雨量與緯度差異所造成的區域生活特色",
  ],
  frames: [
    { step: "步驟 1：打開中國地形圖", id: 1, caption: "你看過中國地形圖嗎？它西邊高、東邊低，看起來就像三級階梯一樣。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：認識三級階梯", id: 2, caption: "第一階梯是青藏高原，第二是黃土高原，第三階梯才是東部的大平原。", action: "point", prop: { kind: "text", text: "地形三階梯：青藏／黃土／東部平原", sub: "西高東低", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：看河為何向東流", id: 3, caption: "地勢西高東低，水往低處流，所以許多大河都從西向東，最後流入海。", action: "point", prop: { kind: "flow", steps: ["西邊高", "東邊低", "河流向東", "東流入海"], active: 2 }, duration: 3600 },
    { step: "步驟 4：比一比南北氣候", id: 4, caption: "南方溫暖又多雨，北方比較乾冷，這和緯度高低、離海遠近有關。", action: "think", prop: { kind: "flow", steps: ["南方：暖濕", "北方：乾冷", "南北差異"], active: 2 }, duration: 3600, ask: { prompt: "造成中國南方與北方氣候差異的主因，不包括哪一項？", options: ["各地說的語言不同", "緯度高低", "距海遠近", "地形高低"], answer: 0, hint: "想想自然地理的因素有哪些。" } },
    { step: "步驟 5：用長條圖看雨量", id: 5, caption: "南方年雨量約 1500 毫米，北方大約 500 毫米，兩邊雨量差很多。", action: "jump", prop: { kind: "bars", items: [{ label: "南方", value: 1500 }, { label: "北方", value: 500 }], unit: "毫米", active: 0 }, duration: 3800 },
    { step: "步驟 6：看南北吃什麼作物", id: 6, caption: "南方雨水多種水稻，北方乾一點種小麥，地形氣候深深影響生活。", action: "point", prop: { kind: "text", text: "南稻北麥：地形氣候定生活", sub: "區域差異", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：比一比東西發展", id: 7, caption: "東部靠海、發展得早；西部是內陸、地形高，發展就比較慢一點。", action: "walk", prop: { kind: "flow", steps: ["東部：沿海發展", "西部：內陸較慢", "東西差異"], active: 2 }, duration: 3600, ask: { prompt: "關於中國的區域差異，下列說法何者正確？", options: ["南方乾冷、北方暖濕", "南方種稻、北方種麥", "北方雨量比南方更多", "東部多高原、西部多平原"], answer: 1, hint: "回想南方與北方分別種什麼作物。" } },
    { step: "步驟 8：想通南稻北麥", id: 8, caption: "為什麼南稻北麥？因為南方水多適合稻、北方乾冷適合麥，雨量決定了主食。", action: "think", prop: { kind: "text", text: "南方多雨→稻　北方乾冷→麥", sub: "雨量決定作物", tone: "ok" }, duration: 3600, ask: { prompt: "南方多種水稻、北方多種小麥，最主要受哪一因素影響？", options: ["雨量多寡與氣候冷暖", "各地使用的貨幣不同", "南北說的語言不一樣", "官方規定百姓種什麼"], answer: 0, hint: "水多適合稻、水少適合麥。" } },
    { step: "步驟 9：記地形氣候口訣", id: 9, caption: "記住：西高東低三階梯、南暖北冷雨不同。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-china-region-1", prompt: "中國的地勢大致呈現什麼樣的分布？", options: ["東高西低", "整個國土一樣平", "西高東低，像三級階梯", "中間高、四周低"], answer: 2, hints: ["想想西部的高原", "東部多平原"], explanation: "中國地勢西高東低，從青藏高原到東部平原，形似三級階梯，所以大河多向東流。" },
    { id: "jh-soc-china-region-2", prompt: "中國南方與北方氣候差異，主要受哪些因素影響？", options: ["使用的語言文字", "流通的貨幣種類", "過的節日習慣", "緯度高低與距海遠近"], answer: 3, hints: ["是自然地理的因素", "南北緯度不同"], explanation: "南方與北方氣候差異主要來自緯度高低與距海遠近，造成暖濕與乾冷的不同，和語言、貨幣無關。" },
    { id: "jh-soc-china-region-3", prompt: "從長條圖看，南方與北方的年雨量有什麼不同？", options: ["南方比北方多雨很多", "北方比南方多雨", "兩邊雨量完全一樣", "兩邊幾乎都不下雨"], answer: 0, hints: ["南方暖濕", "北方較乾冷"], explanation: "南方年雨量約 1500 毫米，北方約 500 毫米，南方明顯比北方多雨，這也是南稻北麥的由來。" },
    { id: "jh-soc-china-region-4", prompt: "地形氣候如何影響中國人的生活方式？", options: ["對生活完全沒有影響", "決定作物與衣食住行", "只影響過什麼節慶", "只影響說什麼語言"], answer: 1, hints: ["南稻北麥就是例子", "環境塑造生活"], explanation: "地形與氣候影響作物（如南稻北麥），進而影響人們的飲食、居住等生活方式。" },
    { id: "jh-soc-china-region-5", prompt: "關於中國東西部發展，下列說法何者正確？", options: ["西部靠海、發展較早", "東西發展完全一樣", "東部靠海、發展較早", "西部比東部更發達"], answer: 2, hints: ["東部鄰海", "西部多內陸山地"], explanation: "中國東部靠海、發展較早；西部多內陸、地形高，發展相對較慢，形成區域差異。" },
    { id: "jh-soc-china-region-6", prompt: "中國許多大河多從西向東流入海，主要原因是？", options: ["東邊下雨特別多", "西邊地形最平坦", "由冬夏季風向決定", "地勢西高東低"], answer: 3, hints: ["水往低處流", "西邊高原、東邊平原"], explanation: "地勢西高東低，水往低處流，因此許多大河順著地勢由西向東流入海。" },
  ],
};

/* ===================== 6. 八下 — 世界氣候與文化分區 ===================== */
const JH_SOC_WORLD_CLIMATE: OnionLesson = {
  id: "jh-soc-world-climate",
  title: "世界氣候與文化分區：環境定生活",
  subject: "社會",
  topic: "世界氣候與文化分區",
  grade: "八下",
  stages: ["國中"],
  desc: "從熱帶到寒帶，氣候如何影響各地的生活方式與文化分區？",
  takeaways: [
    "從赤道到兩極可分熱帶、溫帶、寒帶，溫度一路變冷",
    "氣候影響衣食住：熱帶衣薄通風、溫帶四季分明",
    "長久適應環境形成不同的文化分區與生活習慣",
    "緯度越高太陽斜射、熱量分散而越冷；乾燥區居民穿長袍擋風沙、住厚牆屋，節省用水",
  ],
  frames: [
    { step: "步驟 1：打開世界氣候圖", id: 1, caption: "你有注意過嗎？世界各地氣候差很多，熱帶、溫帶、寒帶，感覺完全不一樣。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：看三帶怎麼排", id: 2, caption: "從赤道往兩極走：先是熱帶、再來溫帶、最後寒帶，溫度一路慢慢變冷。", action: "point", prop: { kind: "flow", steps: ["熱帶", "溫帶", "寒帶"], active: 1 }, duration: 3600 },
    { step: "步驟 3：逛一逛熱帶", id: 3, caption: "熱帶常年又熱又多雨，衣服穿得輕薄，房子強調通風，好散熱。", action: "think", prop: { kind: "text", text: "熱帶：炎熱多雨、衣薄通風", sub: "適應高溫", tone: "ok" }, duration: 3600, ask: { prompt: "熱帶地區的傳統房屋，通常會有什麼特色？", options: ["屋頂高、注重通風散熱", "厚牆小窗、注重保暖", "地下穴居、避免日曬", "緊鄰河岸、方便取水"], answer: 0, hint: "想想當地又熱又濕，房子要怎麼蓋才舒服。" } },
    { step: "步驟 4：感受溫帶四季", id: 4, caption: "溫帶春夏秋冬很分明，人們隨季節加減衣服，農作也跟著多樣。", action: "jump", prop: { kind: "text", text: "溫帶：四季分明、農作多樣", sub: "順應季節", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：想通愈兩極愈冷", id: 5, caption: "緯度越高，太陽光愈是斜射、熱量被分散，所以愈靠近兩極就愈冷。", action: "point", prop: { kind: "text", text: "太陽斜射→熱量分散→越冷", sub: "緯度決定氣溫", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：看看寒帶與乾燥區", id: 6, caption: "寒帶很冷、乾燥區少雨，人們只好住得分散，用水也得特別節省。", action: "walk", prop: { kind: "flow", steps: ["寒帶：嚴寒", "乾燥區：少雨", "適應環境"], active: 2 }, duration: 3600 },
    { step: "步驟 7：看氣候怎麼塑造文化", id: 7, caption: "你想想看，氣候影響吃穿住，久了就形成不同的文化分區和習慣。", action: "point", prop: { kind: "text", text: "氣候→生活方式→文化分區", sub: "環境塑造文化", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項主要是受「氣候」影響而形成的？", options: ["數學的計算公式", "飲食、衣著等生活習慣", "錢幣面額的大小", "國家政體與法律"], answer: 1, hint: "氣候會影響人們的吃、穿、住。" } },
    { step: "步驟 8：走進沙漠看生活", id: 8, caption: "沙漠又熱又少雨，人穿長袍擋風沙、住厚牆屋隔熱，水要特別珍惜。", action: "think", prop: { kind: "text", text: "長袍擋沙、厚牆隔熱、節水", sub: "適應乾燥環境", tone: "warn" }, duration: 3600, ask: { prompt: "沙漠地區的傳統服飾與房屋，主要是為了適應哪一種環境？", options: ["炎熱乾燥、風沙大", "終年低溫、積雪不化", "高溫潮濕、經常下雨", "四季溫和、降雨平均"], answer: 0, hint: "又熱又少雨、風沙大。" } },
    { step: "步驟 9：記氣候文化口訣", id: 9, caption: "記住：熱溫寒三帶、衣食住隨氣候、文化分區。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-world-climate-1", prompt: "從赤道往兩極走，氣候帶大致依什麼順序變化？", options: ["寒帶→溫帶→熱帶", "三地氣候全都一樣", "熱帶→溫帶→寒帶", "路上只有熱帶"], answer: 2, hints: ["越靠近兩極越冷", "赤道最熱"], explanation: "從赤道到兩極，氣溫遞減，依次為熱帶、溫帶、寒帶，而不是反過來。" },
    { id: "jh-soc-world-climate-2", prompt: "熱帶地區的傳統房屋，通常會設計成什麼樣子？", options: ["厚牆小窗注重保暖", "房子蓋在結冰地上", "幾乎都不開窗戶", "強調通風散熱排濕"], answer: 3, hints: ["當地又熱又濕", "要讓空氣流通"], explanation: "熱帶常年炎熱多雨，傳統房屋多強調通風散熱、排濕，而不是厚牆保暖——那是寒冷地區的做法。" },
    { id: "jh-soc-world-climate-3", prompt: "溫帶地區的生活有什麼特色？", options: ["四季分明、農作多樣", "全年都很炎熱", "終年冰天雪地", "一整年幾乎不下雨"], answer: 0, hints: ["溫帶有春夏秋冬", "農作隨季節變化"], explanation: "溫帶四季分明，人們隨季節增減衣物，農作也因季節而多樣，不像熱帶全年炎熱或寒帶終年冰凍。" },
    { id: "jh-soc-world-climate-4", prompt: "氣候會如何影響一個地方的文化？", options: ["對文化完全沒有影響", "影響吃穿住、形成文化分區", "只會影響數學程度", "只會影響貨幣面額"], answer: 1, hints: ["環境塑造生活方式", "久而久之成習慣"], explanation: "氣候影響人們的飲食、衣著、居住，長久適應後形成不同的文化分區與習慣。" },
    { id: "jh-soc-world-climate-5", prompt: "關於寒帶與乾燥區，下列說法何者正確？", options: ["到處都擠滿了人", "完全不需要用到水", "環境嚴苛、人居分散", "氣候跟溫帶沒兩樣"], answer: 2, hints: ["當地冷或少雨", "不利大量聚居"], explanation: "寒帶嚴寒、乾燥區少雨，環境較嚴苛，人口往往分散居住，用水等資源也要節省。" },
    { id: "jh-soc-world-climate-6", prompt: "從赤道往兩極走愈來愈冷，最主要原因是？", options: ["離海洋太遠", "山特別高聳", "風特別大", "緯度高、太陽光斜射熱量分散"], answer: 3, hints: ["太陽角度變小", "熱量被分散"], explanation: "緯度愈高，太陽光愈斜射、單位面積分到的熱量愈少，因此愈靠近兩極氣溫愈低。" },
  ],
};

/* ===================== 7. 八上 — 憲法與人民權利 ===================== */
const JH_SOC_CONSTITUTION: OnionLesson = {
  id: "jh-soc-constitution",
  title: "憲法與人民權利：權利與義務",
  subject: "社會",
  topic: "憲法與人民權利",
  grade: "八上",
  stages: ["國中"],
  desc: "憲法是根本大法，保障人民基本權利，也規定應盡的義務。",
  takeaways: [
    "憲法地位最高，是國家根本大法，其他法律不能牴觸它",
    "憲法保障人民基本權利，如言論、宗教、受教等自由",
    "有權利也有義務，如守法、納稅、接受基本教育",
    "權利的行使有界線，不得侵犯他人；憲法同時規範政府權力、保障人民基本權利",
  ],
  frames: [
    { step: "步驟 1：認識憲法是什麼", id: 1, caption: "你想想看，憲法是國家最根本的法律，就像一棟大廈最重要的地基。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：記住憲法的地位", id: 2, caption: "憲法地位最高，其他法律都不能和它牴觸，所以才叫根本大法。", action: "point", prop: { kind: "text", text: "憲法：根本大法、地位最高", sub: "其他法律不能牴觸", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：看人民有哪些權利", id: 3, caption: "憲法保障人民基本權利，比如言論自由、宗教自由，還有受教育的權利。", action: "think", prop: { kind: "text", text: "基本權利：言論／宗教／受教", sub: "受憲法保障", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項屬於憲法保障的人民基本權利？", options: ["言論自由", "納稅與接受國教", "不受任何規範的自由", "隨身攜帶武器的自由"], answer: 0, hint: "基本權利是受保障的正當權利，別把義務混進來。" } },
    { step: "步驟 4：自由其實有界線", id: 4, caption: "不過言論自由也有界線，不能侮辱、誹謗別人，自由並不是為所欲為。", action: "point", prop: { kind: "text", text: "言論自由≠可以侮辱他人", sub: "權利行使有界線", tone: "warn" }, duration: 3600 },
    { step: "步驟 5：權利之外還有義務", id: 5, caption: "有權利也有義務，像遵守法律、繳納稅金、接受基本教育，都得盡到。", action: "jump", prop: { kind: "flow", steps: ["權利：受保障", "義務：守法納稅", "權利義務並重"], active: 2 }, duration: 3600 },
    { step: "步驟 6：權利義務要平衡", id: 6, caption: "你想想看，行使權利不能侵犯別人，也該盡好自己的義務，這樣才公平。", action: "point", prop: { kind: "text", text: "行使權利不侵權、盡義務", sub: "權利義務平衡", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：權利被侵害怎麼辦", id: 7, caption: "如果權利被侵犯，可以走法律途徑求救濟，請求國家出面保護。", action: "walk", prop: { kind: "flow", steps: ["權利受侵", "依法救濟", "請求保護"], active: 2 }, duration: 3600, ask: { prompt: "權利被侵犯時，最恰當的做法是下列哪一項？", options: ["找對方私下算帳", "依法提出訴訟求救濟", "忍下來假裝沒發生", "在網路上公審對方"], answer: 1, hint: "用法律途徑解決，而不是私下報復。" } },
    { step: "步驟 8：看懂憲法雙重角色", id: 8, caption: "憲法一方面規範政府的權力，一方面保障人民權利，是國家的根本約定。", action: "think", prop: { kind: "text", text: "規範政府＋保障人民", sub: "根本大法的雙重角色", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一種行為，仍在言論自由的合法界線之內？", options: ["針對公共事務理性表達意見", "公開侮辱誹謗他人", "散播不實謠言", "恐嚇威脅他人"], answer: 0, hint: "理性表達公共事務是受保障的。" } },
    { step: "步驟 9：記憲法權利口訣", id: 9, caption: "記住：憲法最根本、權利受保障、義務也要盡。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-constitution-1", prompt: "憲法在國家法律體系中的地位是什麼？", options: ["和普通法律位階相同", "可以隨便修改更動", "根本大法、地位最高", "對國家沒有約束力"], answer: 2, hints: ["像大廈的地基", "其他法律不能牴觸它"], explanation: "憲法是國家根本大法，地位最高，其他法律都不得與它相牴觸，也不能隨意修改。" },
    { id: "jh-soc-constitution-2", prompt: "下列哪一項是憲法保障的人民基本權利？", options: ["可以隨意闖紅燈", "可以拒絕上學", "可以拿別人的東西", "言論自由"], answer: 3, hints: ["是受保障的正當權利", "其他幾項都違法"], explanation: "憲法保障人民的基本權利，如言論、宗教、受教等自由；闖紅燈、偷拿東西都是違法行為，不在此列。" },
    { id: "jh-soc-constitution-3", prompt: "人民除了享有權利，還要盡哪些義務？", options: ["守法、納稅、受基本教育", "只享權利、不盡義務", "可以隨意違反法律", "可以都不繳稅"], answer: 0, hints: ["權利義務是並重的", "想想對國家的責任"], explanation: "人民有權利也有義務，例如遵守法律、繳納稅金、接受基本教育等，兩者缺一不可。" },
    { id: "jh-soc-constitution-4", prompt: "行使權利時，應該注意什麼才公平？", options: ["想做什麼就做什麼", "不侵犯他人、盡好義務", "只顧自己就好", "完全不用理會別人"], answer: 1, hints: ["權利義務要平衡", "自由有其界線"], explanation: "行使權利時不能侵犯他人權利，也要盡到自己的義務，這樣才公平合理。" },
    { id: "jh-soc-constitution-5", prompt: "如果人民的基本權利被侵犯，可以怎麼辦？", options: ["用暴力對付回去", "自己私下報復", "依法請求救濟與保護", "乾脆放棄這個權利"], answer: 2, hints: ["走法律途徑", "不是私下解決"], explanation: "權利受侵害時，可依法提出救濟、請求國家保護，而非以違法手段自行報復或放棄權利。" },
    { id: "jh-soc-constitution-6", prompt: "憲法被稱為「根本大法」，主要是因為它？", options: ["字數寫得最多", "可以隨便修改", "只管警察這件事", "地位最高、其他法律不能牴觸它"], answer: 3, hints: ["位階最高", "所有法律都要符合它"], explanation: "憲法在法律體系中地位最高，其他法律都不得與憲法牴觸，因此被稱為國家的根本大法。" },
  ],
};

/* ===================== 8. 九下 — 市場經濟與國際貿易 ===================== */
const JH_SOC_TRADE: OnionLesson = {
  id: "jh-soc-trade",
  title: "市場經濟與國際貿易：供需與比較利益",
  subject: "社會",
  topic: "市場經濟與國際貿易",
  grade: "九下",
  stages: ["國中"],
  desc: "供需決定價格，比較利益促進分工，全球化連結各國貿易。",
  takeaways: [
    "價格由供需決定：供不應求漲、供過於求跌",
    "比較利益：各國專精所長、互相交易，大家都能得益",
    "交通與網路讓各國更緊密，形成全球化貿易",
    "供過於求價跌、供不應求價漲；全球化帶來選擇與就業，也帶來國際競爭的挑戰",
  ],
  frames: [
    { step: "步驟 1：走進市場看價格", id: 1, caption: "你有想過嗎？市場經濟裡，東西賣多少錢，是由買賣雙方的供需來決定的。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：供需怎麼定價", id: 2, caption: "東西少、想要的人多，價格就漲；東西太多賣不完，價格就會掉下來。", action: "point", prop: { kind: "balance", left: "需求多、供給少", right: "價格上升", tip: "供需決定價格" }, duration: 3600 },
    { step: "步驟 3：看颱風後的菜價", id: 3, caption: "颱風讓蔬菜變少，大家還是爭著買，菜價自然就跟著漲了上去。", action: "think", prop: { kind: "balance", left: "蔬菜變少（供給↓）", right: "菜價上漲", tip: "供給減少→價格上升" }, duration: 3600, ask: { prompt: "當某商品「供給減少、需求不變」時，價格通常會？", options: ["價格上升", "價格下降", "價格維持不變", "價格先漲後跌"], answer: 0, hint: "東西變少、大家還想買，價格就會漲。" } },
    { step: "步驟 4：供過於求會怎樣", id: 4, caption: "反過來，東西生產太多、供過於求，價格就下跌；等需求回來，又會再漲。", action: "point", prop: { kind: "balance", left: "供過於求（供給↑）", right: "價格下跌", tip: "東西太多→價格跌" }, duration: 3600 },
    { step: "步驟 5：認識比較利益", id: 5, caption: "各國專做自己最拿手、成本最低的東西，再互相交換，大家都能得利。", action: "jump", prop: { kind: "text", text: "比較利益：專精所長、互相交易", sub: "分工互利", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：為何要進出口", id: 6, caption: "自己做便宜的就出口出去，自己做不划算的就進口回來，資源才活用。", action: "walk", prop: { kind: "flow", steps: ["專精所長", "出口所長", "進口所缺", "互利"], active: 3 }, duration: 3600 },
    { step: "步驟 7：看全球化縮小世界", id: 7, caption: "船運和網路讓各國愈來愈緊密，商品和資訊很快就能跨國流動。", action: "point", prop: { kind: "flow", steps: ["交通發達", "網路連結", "商品跨國", "全球化"], active: 3 }, duration: 3600, ask: { prompt: "「全球化」主要是指下列哪一種情形？", options: ["各國儘量減少往來", "各國經貿與交流更緊密", "只和本國廠商交易", "每國都自給自足"], answer: 1, hint: "注意「全球」代表世界連成一體。" } },
    { step: "步驟 8：想全球化的好與壞", id: 8, caption: "全球化讓商品便宜、選擇變多、也創造就業，但本國廠商要面對外來競爭。", action: "think", prop: { kind: "text", text: "利多：便宜、多選擇、就業　挑戰：國際競爭", sub: "一體兩面", tone: "warn" }, duration: 3600, ask: { prompt: "某水果大豐收、市場上供過於求，價格通常會？", options: ["價格下跌", "價格上漲", "價格固定不變", "價格先跌後立刻漲回"], answer: 0, hint: "東西太多賣不完，價格就會下跌。" } },
    { step: "步驟 9：記供需貿易口訣", id: 9, caption: "記住：供需定價格、比較利益分工、全球化連結。預備，闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-soc-trade-1", prompt: "在市場經濟中，商品的價格主要由什麼決定？", options: ["老闆的心情好壞", "今天天氣好不好", "買賣雙方的供需", "完全隨機決定"], answer: 2, hints: ["和「供給」「需求」有關", "這是市場機制"], explanation: "市場經濟中價格由供需決定：需求大於供給會漲價，供過於求則跌價，不是看老闆心情或天氣。" },
    { id: "jh-soc-trade-2", prompt: "當「供給減少、需求不變」時，價格通常會怎樣？", options: ["價格下降", "價格不變", "價格歸零", "價格上升"], answer: 3, hints: ["東西變少了", "想要的人還是一樣多"], explanation: "供給減少而需求不變，商品變得稀有，大家搶著買，價格通常會上升而不是下降。" },
    { id: "jh-soc-trade-3", prompt: "「比較利益」的主要想法是什麼？", options: ["各國專精所長、互相交易", "每樣都自己生產", "都不跟外國交易", "只出口絕不進口"], answer: 0, hints: ["專做自己拿手的", "交換讓大家得益"], explanation: "比較利益主張各國專精於自己相對擅長的生產並互相交易，使整體資源更有效利用、彼此互利。" },
    { id: "jh-soc-trade-4", prompt: "國際貿易中，進口與出口的用意是什麼？", options: ["只進口、不出口", "進口所缺、出口所長", "只出口、不進口", "完全不買也不賣"], answer: 1, hints: ["自己便宜的往外賣", "自己貴的向外買"], explanation: "各國出口自己具比較利益（便宜）的產品，進口自己不具優勢（較貴）的產品，讓資源更活用。" },
    { id: "jh-soc-trade-5", prompt: "關於「全球化」，下列說法何者最合適？", options: ["各國完全不相往來", "把國界全部關閉", "交通網路讓各國更緊密", "只在本國範圍交易"], answer: 2, hints: ["船運與網路的作用", "商品資訊跨境流動"], explanation: "全球化指交通與網路發達，使商品、資訊與資本快速跨國流動，各國聯繫更緊密，而非彼此關閉。" },
    { id: "jh-soc-trade-6", prompt: "全球化雖帶來便宜商品與多樣選擇，但本國廠商也可能面臨什麼挑戰？", options: ["完全沒有任何競爭", "商品一定變得更貴", "大家都不用再工作", "國際外來競爭"], answer: 3, hints: ["別國商品也進來", "市場更開放"], explanation: "全球化使各國商品在同一市場競爭，本國廠商雖有機會外銷，也必須面臨外來商品的競爭壓力。" },
  ],
};

export default [
  JH_SOC_ANCIENT_CHINA,
  JH_SOC_TAIWAN_JAPANESE,
  JH_SOC_TAIWAN_RIVER,
  JH_SOC_POPULATION,
  JH_SOC_CHINA_REGION,
  JH_SOC_WORLD_CLIMATE,
  JH_SOC_CONSTITUTION,
  JH_SOC_TRADE,
];
