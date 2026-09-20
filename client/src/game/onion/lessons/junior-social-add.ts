/**
 * 國中社會 8 堂（junior-social-add.ts）
 *
 * 課程表來自 docs/onion-200-plan.md →「社會 8 堂」（id: jh-soc-*）。
 * 每堂課 7 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 2 幀有 ask）
 * ＋ 5 題闖關（含 2 級提示與詳解）＋ 3 條 takeaways。
 * 圖解依各課核心概念選用 flow（朝代更替、制度流程、產業演變）、
 * bars（人口密度、雨量比較）、text（定義與對照）、balance（供需平衡）。
 * 歷史與政治敘述保持中立、客觀，符合臺灣課綱。傳統中文書寫。
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
  ],
  frames: [
    { step: "步驟 1：認識中國古文明", id: 1, caption: "嗨！中國有幾千年文明，我們就從最早的朝代開始認識起。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：排列朝代順序", id: 2, caption: "把朝代排成一條線：夏、商、周、秦、漢，一代接著一代走。", action: "point", prop: { kind: "flow", steps: ["夏", "商", "周", "秦", "漢", "唐", "宋", "明", "清"], active: 0 }, duration: 3600 },
    { step: "步驟 3：朝代如何更替", id: 3, caption: "舊朝代結束、新朝代建立，這就是歷史上的「改朝換代」現象。", action: "think", prop: { kind: "flow", steps: ["舊朝代結束", "新朝代建立", "改朝換代"], active: 2 }, duration: 3600, ask: { prompt: "「改朝換代」指的是下列哪一种情形？", options: ["同一朝代一直延續", "舊朝結束、新朝建立", "只是改個名字", "皇帝永遠不換"], answer: 1, hint: "想想是誰來接替上一個朝代的統治。" } },
    { step: "步驟 4：秦漢的大一統", id: 4, caption: "秦統一文字與度量衡，漢開拓絲路，讓各地連得更緊密。", action: "jump", prop: { kind: "text", text: "秦：統一度量衡、文字", sub: "漢：開拓絲路", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：認識四大發明", id: 5, caption: "中國四大發明：造紙術、印刷術、火藥、指南針，真的超厲害！", action: "point", prop: { kind: "text", text: "四大發明：造紙／印刷／火藥／指南針", sub: "古代重要發明", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項「不是」中國四大發明？", options: ["造紙術", "指南針", "蒸汽機", "火藥"], answer: 2, hint: "回想古代中國的發明清單有哪些。" } },
    { step: "步驟 6：發明傳向世界", id: 6, caption: "這些發明沿著絲路傳出去，深深影響了世界各地的發展。", action: "walk", prop: { kind: "flow", steps: ["中國發明", "絲路傳出", "影響世界"], active: 2 }, duration: 3600 },
    { step: "步驟 7：記朝代發明口訣", id: 7, caption: "口訣：夏商周秦漢、四大發明傳向世界。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ac1", prompt: "下列哪一項「不是」中國的四大發明？", options: ["造紙術", "印刷術", "火藥", "蒸汽機"], answer: 3, hints: ["四大發明是造紙、印刷、火藥、指南針", "蒸汽機是後來工業革命的產物"], explanation: "四大發明為造紙術、印刷術、火藥、指南針；蒸汽機是工業革命後才出現的發明。" },
    { id: "ac2", prompt: "「改朝換代」的意思最接近下列哪一項？", options: ["朝代永遠不變", "舊朝代結束、新朝代建立", "只是改國號", "完全沒有新皇帝"], answer: 1, hints: ["是政權的替換", "舊的不在、新的接手"], explanation: "改朝換代指舊朝代結束、新朝代建立，是政權的更替。" },
    { id: "ac3", prompt: "秦統一文字與度量衡，對當時有什麼好處？", options: ["方便各地交流", "讓戰爭變多", "減少人口", "讓山變高"], answer: 0, hints: ["統一了規格", "溝通與交易更方便"], explanation: "統一文字、度量衡讓各地溝通與交易更方便，有助於國家整合。" },
    { id: "ac4", prompt: "中國的許多發明常沿著什麼路線傳到其他地區？", options: ["絲路", "只留在國內", "海底隧道", "完全沒有外傳"], answer: 0, hints: ["是連接東西方的通道", "古代重要的貿易路線"], explanation: "許多發明沿著絲路等貿易路線傳向世界，促進了各地交流。" },
    { id: "ac5", prompt: "關於朝代更替，下列說法何者最合適？", options: ["朝代永遠不變", "更替是文明中常見的現象", "只有外國會更替", "更替代表文明消失"], answer: 1, hints: ["歷史上曾多次改朝", "更替不代表文明斷絕"], explanation: "歷史上朝代常因各種原因更替，這是文明發展中常見的現象，未必代表文明消失。" },
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
  ],
  frames: [
    { step: "步驟 1：認識日治時期", id: 1, caption: "嗨！1895 到 1945 年日本統治臺灣，這段時間叫日治時期。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：看統治的開始", id: 2, caption: "1895 年簽訂馬關條約，臺灣開始被日本統治，進入日治時期。", action: "point", prop: { kind: "text", text: "1895：馬關條約", sub: "日治時期開始", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：興建基礎建設", id: 3, caption: "日本興建鐵路、港口、自來水，讓交通與公共設施明顯進步。", action: "think", prop: { kind: "flow", steps: ["鐵路", "港口", "自來水", "公共建設"], active: 2 }, duration: 3600, ask: { prompt: "日治時期興建的基礎建設，不包括下列哪一項？", options: ["鐵路", "港口", "自來水", "高速公路"], answer: 3, hint: "想想那個時代還沒有出現的現代設施。" } },
    { step: "步驟 4：發展糖與樟腦", id: 4, caption: "當時大力發展製糖與樟腦等產業，出口到外地賺取資金。", action: "jump", prop: { kind: "text", text: "重要產業：糖、樟腦", sub: "出口賺取資金", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：社會的不滿", id: 5, caption: "統治也帶來差別待遇，讓部分臺灣人感到不公平而想反抗。", action: "walk", prop: { kind: "flow", steps: ["差別待遇", "感到不公平", "社會抗爭"], active: 2 }, duration: 3600 },
    { step: "步驟 6：認識反抗行動", id: 6, caption: "像霧社事件，就是原住民對統治的不滿所引發的一場抗爭。", action: "point", prop: { kind: "text", text: "霧社事件：原住民抗爭", sub: "爭取公平對待", tone: "warn" }, duration: 3600, ask: { prompt: "「霧社事件」主要是哪一群人的抗爭行動？", options: ["日軍", "原住民", "外國商人", "所有農民"], answer: 1, hint: "事件發生在山地的原住民部落。" } },
    { step: "步驟 7：記日治雙面口訣", id: 7, caption: "口訣：建設與統治並存、抗爭求公平。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "tj1", prompt: "日治時期大致是從哪一年到哪一年？", options: ["1895–1945", "1800–1850", "1945–1990", "1700–1750"], answer: 0, hints: ["和馬關條約的年份有關", "結束於二次大戰後"], explanation: "日治時期指 1895 年馬關條約後到 1945 年二次大戰結束，日本統治臺灣的這段期間。" },
    { id: "tj2", prompt: "日治時期興建的基礎建設，下列何者有助於交通進步？", options: ["鐵路與港口", "高速公路", "捷運系統", "機場航廈"], answer: 0, hints: ["當時重點在鐵道與港埠", "另外兩項是更晚才出現"], explanation: "日治時期興建鐵路、港口、自來水等公共建設，其中鐵路與港口大幅改善了交通。" },
    { id: "tj3", prompt: "日治時期大力發展糖、樟腦等產業，主要目的是什麼？", options: ["出口賺取資金", "送給外國", "減少耕種", "当作裝飾"], answer: 0, hints: ["是當時重要的經濟活動", "產品多向外出口"], explanation: "當時發展糖、樟腦等產業並出口，是為了賺取資金、支撐殖民地的經濟。" },
    { id: "tj4", prompt: "關於霧社事件，下列說法何者正確？", options: ["是原住民的抗日抗爭", "是農民罷工", "發生在海上", "與統治無關"], answer: 0, hints: ["事件主角是原住民", "起因和統治的不滿有關"], explanation: "霧社事件是原住民因對統治不滿而發起的抗爭行動，反映日治時期的社會衝突。" },
    { id: "tj5", prompt: "下列哪一項最能說明日治時期的「雙面」特質？", options: ["只有建設沒有衝突", "只有抗爭沒有建設", "建設進步與社會抗爭並存", "完全沒有改變"], answer: 2, hints: ["題目強調雙面", "一邊建設、一邊也有不滿"], explanation: "日治時期一方面有鐵路、公共設施等建設進步，另一方面也有差別待遇引發的抗爭，兩者並存。" },
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
  ],
  frames: [
    { step: "步驟 1：認識臺灣河川", id: 1, caption: "嗨！臺灣的山高、坡陡，所以河流大多又短又急，你發現了嗎？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：河流短而急", id: 2, caption: "坡陡又距離海岸近，河流短又急，不易航行但水力資源很強。", action: "point", prop: { kind: "text", text: "河川特色：短、急、水量變化大", sub: "坡陡、距海近", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：比較大河長度", id: 3, caption: "濁水溪最長約 186 公里，高屏溪約 171 公里，淡水河約 159 公里。", action: "think", prop: { kind: "bars", items: [{ label: "濁水溪", value: 186 }, { label: "高屏溪", value: 171 }, { label: "淡水河", value: 159 }], unit: "公里", active: 0 }, duration: 3800, ask: { prompt: "臺灣最長的河川是下列哪一條？", options: ["濁水溪", "高屏溪", "淡水河", "曾文溪"], answer: 0, hint: "看長條圖中最長的那一條是哪條河。" } },
    { step: "步驟 4：水量夏多冬少", id: 4, caption: "夏天颱風帶來雨水，河川水量大增；冬天較少，變化真的很大。", action: "jump", prop: { kind: "flow", steps: ["夏季多雨", "河川水量大", "冬季少雨", "水量變小"], active: 1 }, duration: 3600 },
    { step: "步驟 5：興建水庫調節", id: 5, caption: "為了存水與防洪，我們興建水庫，把豐水期的水留到枯水期。", action: "point", prop: { kind: "text", text: "水庫：存水、防洪、調節", sub: "豐水期存、枯水期用", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：珍惜水資源", id: 6, caption: "水資源有限，我們要節約用水並做好水質保護，才會夠用。", action: "walk", prop: { kind: "flow", steps: ["節約用水", "保護水質", "水才夠用"], active: 2 }, duration: 3600, ask: { prompt: "興建水庫最主要的目的，不包括下列哪一項？", options: ["儲存雨水", "調節水量", "防洪", "讓河流變長"], answer: 3, hint: "水庫是管理水量，並不會改變河流的長度。" } },
    { step: "步驟 7：記河川水資源口訣", id: 7, caption: "口訣：河短又急、夏多冬少、水庫調節、節約用水。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "rv1", prompt: "臺灣的河川大多具有下列哪一個特色？", options: ["短而急", "又長又平", "终年乾涸", "都能通航"], answer: 0, hints: ["想想山高坡陡", "離海也很近"], explanation: "臺灣山高坡陡、距海近，河川大多短而急、水量變化大，不易航行但水力強。" },
    { id: "rv2", prompt: "臺灣河川的水量在一年當中，通常是怎樣變化？", options: ["夏多冬少", "全年一樣", "冬多夏少", "只有春天有水"], answer: 0, hints: ["夏天常有颱風", "冬天降雨較少"], explanation: "夏季颱風帶來大量雨水，河川水量大增；冬季降雨少，水量較小，變化明顯。" },
    { id: "rv3", prompt: "興建水庫的主要功用，不包括下列哪一項？", options: ["儲存豐水期的水", "防洪", "調節水量", "讓河川變長"], answer: 3, hints: ["水庫管理的是水量", "不會改變河流長度"], explanation: "水庫可儲水、防洪、調節水量，把豐水期的水留到枯水期使用，但不會讓河流變長。" },
    { id: "rv4", prompt: "為什麼我們需要節約用水？", options: ["水資源有限且不均", "水用不完", "水庫裝不滿", "河川都很長"], answer: 0, hints: ["河川短急、水量變化大", "可供利用的水其實有限"], explanation: "因河川短急、水量夏多冬少且水資源有限，節約用水才能穩定供應。" },
    { id: "rv5", prompt: "關於臺灣河川的利用，下列說法何者最合適？", options: ["因短急不適合航運但可發電", "全都適合大船航行", "冬天水量比夏天多", "不需要水庫"], answer: 0, hints: ["短急代表坡度大", "坡度大水力資源強"], explanation: "臺灣河川短而急，坡度大不利航運，但水力資源強可用來發電；水庫則幫忙調節水量。" },
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
  ],
  frames: [
    { step: "步驟 1：認識人口密度", id: 1, caption: "嗨！人口密度是「每單位面積住多少人」，可以看出哪裡比較擠。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：西部人口多", id: 2, caption: "臺灣人口集中西部平原，密度高；東部山地多，人口密度較低。", action: "point", prop: { kind: "bars", items: [{ label: "西部平原", value: 600 }, { label: "東部山地", value: 100 }], unit: "人/平方公里", active: 0 }, duration: 3800, ask: { prompt: "臺灣人口與都市主要集中在本島的哪一邊？", options: ["西部", "東部", "北部海面", "到處一樣"], answer: 0, hint: "平原多、適合居住的地方，人口密度才高。" } },
    { step: "步驟 3：都市怎麼形成", id: 3, caption: "工廠、商店、學校集中，工作機會多，人口就慢慢聚成都市。", action: "think", prop: { kind: "flow", steps: ["工作機會多", "人口聚集", "形成都市"], active: 2 }, duration: 3600 },
    { step: "步驟 4：都市提供功能", id: 4, caption: "都市提供就業、交通、醫療與教育，吸引更多人搬進來住。", action: "jump", prop: { kind: "text", text: "都市功能：就業／交通／醫療／教育", sub: "吸引人口移入", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：都市化現象", id: 5, caption: "越來越多人住進都市，這種人口往都市集中的趨勢叫做都市化。", action: "walk", prop: { kind: "flow", steps: ["人口移入", "都市擴大", "都市化"], active: 2 }, duration: 3600, ask: { prompt: "「都市化」指的是下列哪一種現象？", options: ["人口往都市集中", "人口一直變少", "山變得更高", "河流乾涸"], answer: 0, hint: "注意「都市」這個關鍵字指的是什麼。" } },
    { step: "步驟 6：都市也有問題", id: 6, caption: "都市太大也會塞車、空氣差、房價高，需要好好規劃才行。", action: "point", prop: { kind: "text", text: "都市問題：塞車／空污／高房價", sub: "需要妥善規劃", tone: "warn" }, duration: 3600 },
    { step: "步驟 7：記人口都市口訣", id: 7, caption: "口訣：西密東疏、工作聚人、都市化、要規劃。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "pp1", prompt: "人口密度是指什麼？", options: ["每單位面積住多少人", "城市的高樓數", "河流的長度", "山的高度"], answer: 0, hints: ["和「面積」與「人數」有關", "用來看哪裡比較擠"], explanation: "人口密度是每單位面積居住的人口數，用來表示一個地方擁擠的程度。" },
    { id: "pp2", prompt: "臺灣人口與都市主要集中在本島的哪一邊？", options: ["西部", "東部", "外海", "平均分布"], answer: 0, hints: ["西部平原多", "平原適合居住與耕種"], explanation: "臺灣西部多平原、適合居住與發展，因此人口與都市主要集中在西部。" },
    { id: "pp3", prompt: "都市能吸引人口移入，最主要的原因是什麼？", options: ["工作機會多", "山比較高", "河比較長", "冬天更冷"], answer: 0, hints: ["都市集中了什麼", "人就會為了工作聚集"], explanation: "都市集中了就業、交通、醫療、教育等資源，工作機會多，因此吸引人口移入。" },
    { id: "pp4", prompt: "「都市化」會帶來下列哪一個現象？", options: ["人口往都市集中", "人口全部回農村", "都市變空城", "河流改道"], answer: 0, hints: ["是人口移動的趨勢", "和都市的發展有關"], explanation: "都市化是指人口逐漸向都市集中、都市範圍擴大的趨勢。" },
    { id: "pp5", prompt: "關於都市化帶來的問題，下列說法何者正確？", options: ["可能造成塞車與高房價", "一定讓空氣更好", "完全沒有缺點", "人口會立刻減少"], answer: 0, hints: ["人多會帶來什麼", "交通與居住是常見困擾"], explanation: "都市過度集中會帶來塞車、空氣污染、高房價等問題，需要妥善的都市規劃。" },
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
  ],
  frames: [
    { step: "步驟 1：認識中國地形", id: 1, caption: "嗨！中國很大，西邊高、東邊低，地形像三級階梯一樣喔。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：三級階梯地形", id: 2, caption: "第一階梯是青藏高原，第二是黃土高原，第三是東部的大平原。", action: "point", prop: { kind: "text", text: "地形三階梯：青藏／黃土／東部平原", sub: "西高東低", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：氣候南北差異", id: 3, caption: "南方溫暖多雨，北方較乾冷，緯度與距海遠近造成明顯差異。", action: "think", prop: { kind: "flow", steps: ["南方：暖濕", "北方：乾冷", "南北差異"], active: 2 }, duration: 3600, ask: { prompt: "造成中國南方與北方氣候差異的主因，不包括哪一項？", options: ["緯度", "距海遠近", "地形", "語言不同"], answer: 3, hint: "想想自然地理的因素有哪些。" } },
    { step: "步驟 4：用長條圖比雨量", id: 4, caption: "南方年雨量約 1500 毫米，北方約 500 毫米，兩邊差很多。", action: "jump", prop: { kind: "bars", items: [{ label: "南方", value: 1500 }, { label: "北方", value: 500 }], unit: "毫米", active: 0 }, duration: 3800 },
    { step: "步驟 5：區域生活方式", id: 5, caption: "南方種水稻、北方種小麥，地形氣候深深影響人們的生活。", action: "point", prop: { kind: "text", text: "南稻北麥：地形氣候定生活", sub: "區域差異", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：比較東西部", id: 6, caption: "東部靠海、發展早；西部內陸、地形高，發展就比較慢一些。", action: "walk", prop: { kind: "flow", steps: ["東部：沿海發展", "西部：內陸較慢", "東西差異"], active: 2 }, duration: 3600, ask: { prompt: "關於中國的區域差異，下列說法何者正確？", options: ["南稻北麥", "全國都種稻", "西高東低不存在", "北方多雨"], answer: 0, hint: "回想南方與北方分別種什麼作物。" } },
    { step: "步驟 7：記地形氣候口訣", id: 7, caption: "口訣：西高東低三階梯、南暖北冷雨不同。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "cr1", prompt: "中國的地勢大致呈現什麼樣的分布？", options: ["西高東低，像三級階梯", "東高西低", "全部一樣平", "中間高四周低"], answer: 0, hints: ["想想西部的高原", "東部多平原"], explanation: "中國地勢西高東低，從青藏高原到東部平原，形似三級階梯。" },
    { id: "cr2", prompt: "中國南方與北方氣候差異，主要受哪些因素影響？", options: ["緯度與距海遠近", "語言與文字", "貨幣種類", "節日習慣"], answer: 0, hints: ["是自然地里的因素", "南北緯度不同"], explanation: "南方與北方氣候差異主要來自緯度高低與距海遠近，造成暖濕與乾冷的不同。" },
    { id: "cr3", prompt: "從長條圖看，南方與北方的年雨量有什麼不同？", options: ["南方比北方多很多", "北方比南方多", "兩者一樣", "都沒有下雨"], answer: 0, hints: ["南方暖濕", "北方較乾冷"], explanation: "南方年雨量約 1500 毫米，北方約 500 毫米，南方明顯比北方多雨。" },
    { id: "cr4", prompt: "地形氣候如何影響中國人的生活方式？", options: ["決定作物與衣食住", "完全沒有影響", "只影響節慶", "只影響語言"], answer: 0, hints: ["南稻北麥就是例子", "環境塑造生活"], explanation: "地形與氣候影響作物（如南稻北麥），進而影響人們的飲食、居住等生活方式。" },
    { id: "cr5", prompt: "關於中國東西部發展，下列說法何者正確？", options: ["東部靠海、發展較早", "西部靠海、發展較早", "東西發展完全一樣", "西部比東部更發達"], answer: 0, hints: ["東部鄰海", "西部多內陸山地"], explanation: "中國東部靠海、發展較早；西部多內陸、地形高，發展相對較慢，形成區域差異。" },
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
  ],
  frames: [
    { step: "步驟 1：認識世界氣候", id: 1, caption: "嗨！世界各地氣候不同，熱帶、溫帶、寒帶，差別可大了。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：看氣候帶分布", id: 2, caption: "從赤道到兩極：熱帶、溫帶、寒帶，溫度會一路慢慢變冷。", action: "point", prop: { kind: "flow", steps: ["熱帶", "溫帶", "寒帶"], active: 1 }, duration: 3600 },
    { step: "步驟 3：熱帶的生活", id: 3, caption: "熱帶常年炎熱多雨，衣服輕薄，房屋通風又好散熱。", action: "think", prop: { kind: "text", text: "熱帶：炎熱多雨、衣薄通風", sub: "適應高溫", tone: "ok" }, duration: 3600, ask: { prompt: "熱帶地區的傳統房屋，通常會有什麼特色？", options: ["厚牆保暖", "通風散熱", "完全沒屋頂", "蓋在冰上"], answer: 1, hint: "想想當地又熱又濕，房子要怎麼蓋才舒服。" } },
    { step: "步驟 4：溫帶四季分明", id: 4, caption: "溫帶春夏秋冬分明，人們穿衣隨季節加減，農作也很多樣。", action: "jump", prop: { kind: "text", text: "溫帶：四季分明、農作多樣", sub: "順應季節", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：寒帶與乾燥區", id: 5, caption: "寒帶很冷、乾燥區少雨，人們住得分散，用水也要節省。", action: "walk", prop: { kind: "flow", steps: ["寒帶：嚴寒", "乾燥區：少雨", "適應環境"], active: 2 }, duration: 3600 },
    { step: "步驟 6：文化也分區", id: 6, caption: "氣候影響吃穿住，久而久之就形成不同的文化分區與習慣。", action: "point", prop: { kind: "text", text: "氣候→生活方式→文化分區", sub: "環境塑造文化", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項主要是受「氣候」影響而形成的？", options: ["文化分區與習慣", "數學公式", "字母表", "貨幣面值"], answer: 0, hint: "氣候會影響人們的吃、穿、住。" } },
    { step: "步驟 7：記氣候文化口訣", id: 7, caption: "口訣：熱溫寒三帶、衣食住隨氣候、文化分區。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "wc1", prompt: "從赤道往兩極走，氣候帶大致依什麼順序變化？", options: ["熱帶→溫帶→寒帶", "寒帶→溫帶→熱帶", "全部一樣", "只有熱帶"], answer: 0, hints: ["越靠近兩極越冷", "赤道最熱"], explanation: "從赤道到兩極，氣溫遞減，依次為熱帶、溫帶、寒帶。" },
    { id: "wc2", prompt: "熱帶地區的傳統房屋，通常會設計成什麼樣子？", options: ["通風散熱", "厚牆保暖", "蓋在冰上", "沒有窗戶"], answer: 0, hints: ["當地又熱又濕", "要讓空氣流通"], explanation: "熱帶常年炎熱多雨，傳統房屋多強調通風散熱、好排汗散熱，而不是保暖。" },
    { id: "wc3", prompt: "溫帶地區的生活有什麼特色？", options: ["四季分明、農作多樣", "全年炎熱", "終年冰凍", "完全不下雨"], answer: 0, hints: ["溫帶有春夏秋冬", "農作隨季節變化"], explanation: "溫帶四季分明，人們隨季節增減衣物，農作也因季節而多樣。" },
    { id: "wc4", prompt: "氣候會如何影響一個地方的文化？", options: ["影響吃穿住，形成文化分區", "完全沒有影響", "只影響數學", "只影響貨幣"], answer: 0, hints: ["環境塑造生活方式", "久而久之成習慣"], explanation: "氣候影響人們的飲食、衣著、居住，長久適應後形成不同的文化分區與習慣。" },
    { id: "wc5", prompt: "關於寒帶與乾燥區，下列說法何者正確？", options: ["環境嚴苛、人居分散", "到處都擠滿人", "完全不需要水", "氣候和溫帶一樣"], answer: 0, hints: ["當地冷或少雨", "不利大量聚居"], explanation: "寒帶嚴寒、乾燥區少雨，環境較嚴苛，人口往往分散居住，用水等資源也要節省。" },
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
  ],
  frames: [
    { step: "步驟 1：認識憲法", id: 1, caption: "嗨！憲法是國家最根本的法律，就像是大廈的地基一樣。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：憲法是根本", id: 2, caption: "憲法地位最高，其他法律都不能和它相牴觸，是根本大法。", action: "point", prop: { kind: "text", text: "憲法：根本大法、地位最高", sub: "其他法律不能牴觸", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：人民的權利", id: 3, caption: "憲法保障人民的基本權利，例如言論、宗教與受教育的權利。", action: "think", prop: { kind: "text", text: "基本權利：言論／宗教／受教", sub: "受憲法保障", tone: "ok" }, duration: 3600, ask: { prompt: "下列哪一項屬於憲法保障的基本權利？", options: ["言論自由", "隨意闖紅燈", "不用上學", "任意拿別人東西"], answer: 0, hint: "基本權利是受保障的正當權利。" } },
    { step: "步驟 4：也有義務", id: 4, caption: "有權利也有義務，像守法、納稅、接受基本教育都是義務。", action: "jump", prop: { kind: "flow", steps: ["權利：受保障", "義務：守法納稅", "權利義務並重"], active: 2 }, duration: 3600 },
    { step: "步驟 5：權利義務並重", id: 5, caption: "行使權利時不能侵犯別人，也要盡好自己的義務才公平。", action: "point", prop: { kind: "text", text: "行使權利不侵權、盡義務", sub: "權利義務平衡", tone: "ok" }, duration: 3600 },
    { step: "步驟 6：權利有保障", id: 6, caption: "如果權利被侵犯，可以依法律途徑救濟，請求國家保護。", action: "walk", prop: { kind: "flow", steps: ["權利受侵", "依法救濟", "請求保護"], active: 2 }, duration: 3600, ask: { prompt: "權利被侵犯時，最恰當的做法是下列哪一項？", options: ["以暴制暴", "依法請求救濟", "乾脆不管", "侵犯回去"], answer: 1, hint: "用法律途徑解決，而不是私下報復。" } },
    { step: "步驟 7：記憲法權利口訣", id: 7, caption: "口訣：憲法最根本、權利受保障、義務也要盡。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "ct1", prompt: "憲法在國家法律體系中的地位是什麼？", options: ["根本大法、地位最高", "和普通法律一樣", "可以随便改", "沒有約束力"], answer: 0, hints: ["像大廈的地基", "其他法律不能牴觸它"], explanation: "憲法是國家根本大法，地位最高，其他法律都不得與它相牴觸。" },
    { id: "ct2", prompt: "下列哪一項是憲法保障的人民基本權利？", options: ["言論自由", "闖紅燈", "拒絕上學", "拿別人東西"], answer: 0, hints: ["是受保障的正當權利", "其他幾項都違法"], explanation: "憲法保障人民的基本權利，如言論、宗教、受教等自由；違法行為不在此列。" },
    { id: "ct3", prompt: "人民除了享有權利，還要盡哪些義務？", options: ["守法、納稅、受基本教育", "只享權利不義務", "隨意違法", "不用納稅"], answer: 0, hints: ["權利義務是並重的", "想想對國家的責任"], explanation: "人民有權利也有義務，例如遵守法律、繳納稅金、接受基本教育等。" },
    { id: "ct4", prompt: "行使權利時，應該注意什麼才公平？", options: ["不侵犯他人、盡好義務", "想做就做", "只顧自己", "不用理會別人"], answer: 0, hints: ["權利義務要平衡", "自由有其界線"], explanation: "行使權利時不能侵犯他人權利，也要盡到自己的義務，這樣才公平合理。" },
    { id: "ct5", prompt: "如果人民的基本權利被侵犯，可以怎麼辦？", options: ["依法請求救濟與保護", "以暴制暴", "直接報復", "放棄權利"], answer: 0, hints: ["走法律途徑", "不是私下解決"], explanation: "權利受侵害時，可依法提出救濟、請求國家保護，而非以違法手段自行解決。" },
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
  ],
  frames: [
    { step: "步驟 1：認識市場經濟", id: 1, caption: "嗨！市場經濟裡，價格是由買賣雙方的供需來決定的喔。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：供需定價格", id: 2, caption: "東西少、想要的人多，價格就漲；供過於求，價格就下降。", action: "point", prop: { kind: "balance", left: "需求多、供給少", right: "價格上升", tip: "供需決定價格" }, duration: 3600 },
    { step: "步驟 3：試算價格漲跌", id: 3, caption: "颱風讓蔬菜變少，大家還是想買，菜價自然就漲了上去。", action: "think", prop: { kind: "balance", left: "蔬菜變少（供給↓）", right: "菜價上漲", tip: "供給減少→價格上升" }, duration: 3600, ask: { prompt: "當某商品「供給減少、需求不變」時，價格通常會？", options: ["上升", "下降", "不變", "消失"], answer: 0, hint: "東西變少、大家還想買，價格就會漲。" } },
    { step: "步驟 4：比較利益", id: 4, caption: "各國專做自己最拿手的事，互相交易，大家都能得到好處。", action: "jump", prop: { kind: "text", text: "比較利益：專精所長、互相交易", sub: "分工互利", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：為什麼要貿易", id: 5, caption: "本國做不便宜的就進口，做便宜的就出口，資源更能活用。", action: "walk", prop: { kind: "flow", steps: ["專精所長", "出口所長", "進口所缺", "互利"], active: 3 }, duration: 3600 },
    { step: "步驟 6：全球化連結", id: 6, caption: "船運、網路讓各國更緊密，商品與資訊快速跨國流動。", action: "point", prop: { kind: "flow", steps: ["交通發達", "網路連結", "商品跨國", "全球化"], active: 3 }, duration: 3600, ask: { prompt: "「全球化」主要是指下列哪一種情形？", options: ["各國更加連結", "完全不往來", "只在本國交易", "關閉國界"], answer: 0, hint: "注意「全球」代表世界連成一體。" } },
    { step: "步驟 7：記供需貿易口訣", id: 7, caption: "口訣：供需定價格、比較利益分工、全球化連結。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "tr1", prompt: "在市場經濟中，商品的價格主要由什麼決定？", options: ["買賣雙方的供需", "老闆的心情", "天氣好壞", "隨機決定"], answer: 0, hints: ["和「供給」「需求」有關", "這是市場機制"], explanation: "市場經濟中價格由供需決定：需求大於供給會漲價，供過於求則跌價。" },
    { id: "tr2", prompt: "當「供給減少、需求不變」時，價格通常會怎樣？", options: ["上升", "下降", "不變", "歸零"], answer: 0, hints: ["東西變少了", "想要的人還是一樣多"], explanation: "供給減少而需求不變，商品變得稀有，價格通常會上升。" },
    { id: "tr3", prompt: "「比較利益」的主要想法是什麼？", options: ["各國專精所長、互相交易", "什麼都自己生產", "不和外國交易", "只出口不進口"], answer: 0, hints: ["專做自己拿手的", "交換讓大家得益"], explanation: "比較利益主張各國專精於自己相對擅長的生產並互相交易，使整體資源更有效利用、互利。" },
    { id: "tr4", prompt: "國際貿易中，進口與出口的用意是什麼？", options: ["進口所缺、出口所長", "只進口不出口", "只出口不進口", "完全不買賣"], answer: 0, hints: ["自己便宜的往外賣", "自己貴的向外買"], explanation: "各國出口自己具比較利益（便宜）的產品，進口自己不具優勢（較貴）的產品，讓資源更活用。" },
    { id: "tr5", prompt: "關於「全球化」，下列說法何者最合適？", options: ["交通網路讓各國更緊密連結", "各國完全不往來", "關閉國界", "只在本國範圍交易"], answer: 0, hints: ["船運與網路的作用", "商品資訊跨境流動"], explanation: "全球化指交通與網路發達，使商品、資訊與資本快速跨國流動，各國聯繫更緊密。" },
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
