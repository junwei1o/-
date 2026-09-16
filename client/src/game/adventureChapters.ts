import type { CardTheme } from "./trumpCardData";

export type AdventureNodeType = "narrative" | "choice" | "check" | "ending";
export type AdventureEnding = "good" | "bad" | "neutral";

export type AdventureChoice = { label: string; nextNodeId: string };

export type AdventureNode = {
  id: string;
  text: string;
  type: AdventureNodeType;
  choices?: AdventureChoice[];
  check?: { subject: CardTheme; nextCorrectId: string; nextWrongId: string };
  reward?: { gold?: number; card?: boolean; title?: string };
  ending?: AdventureEnding;
};

export type AdventureChapter = {
  id: string;
  title: string;
  summary: string;
  icon: string;
  cost: number;
  startNodeId: string;
  nodes: Record<string, AdventureNode>;
};

export const ALL_CHAPTERS: readonly AdventureChapter[] = [
  {
    id: "lighthouse-call",
    title: "燈塔的呼喚",
    summary: "酒館老闆託你送補給到燈塔，途中認識潮汐、方位與海岸生態。",
    icon: "🗼",
    cost: 0,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "傍晚的酒館，老闆遞來一個包袱：「拜託把這批補給送到海邊的燈塔，守塔人等著用。」", type: "choice", choices: [
        { label: "收下包袱，沿著海岸出發", nextNodeId: "coast" },
        { label: "先問問路線危險嗎", nextNodeId: "ask" },
      ]},
      ask: { id: "ask", text: "老闆笑了：「漲潮時礁石會淹沒，記得看潮水。去吧，孩子。」", type: "narrative", choices: [{ label: "出發", nextNodeId: "coast" }]},
      coast: { id: "coast", text: "來到海岸，遠方燈塔閃著光。前方一片礁石，潮水正在上漲。", type: "check", check: { subject: "自然", nextCorrectId: "safe", nextWrongId: "wet" }},
      safe: { id: "safe", text: "你記得漲潮知識，繞過高處岩徑，順利抵達燈塔。守塔人熱情接待，講述星象導航的故事。", type: "check", check: { subject: "社會", nextCorrectId: "tower-good", nextWrongId: "tower-mid" }},
      wet: { id: "wet", text: "沒注意潮水，鞋襪全濕了，狼狽抵達燈塔。守塔人讓你烤火取暖。", type: "narrative", choices: [{ label: "聽守塔人說故事", nextNodeId: "tower-mid" }]},
      "tower-good": { id: "tower-good", text: "你用方位知識協助校正了燈塔的記錄，守塔人大為感動，贈予一枚燈塔徽章。", type: "ending", ending: "good", reward: { gold: 20, title: "燈塔嚮導" }},
      "tower-mid": { id: "tower-mid", text: "平安完成送貨任務，守塔人致謝並給了些小費。", type: "ending", ending: "neutral", reward: { gold: 10 }},
    },
  },
  {
    id: "lost-classic",
    title: "失落的古籍",
    summary: "傳聞山中有一本失傳的古籍，你踏上尋找之旅，途中考驗語文與數理。",
    icon: "📖",
    cost: 30,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "酒館傳來消息：山林深處的古廟裡，藏著一本失傳已久的古籍。你決定前去一探究竟。", type: "choice", choices: [
        { label: "帶著地圖與口糧出發", nextNodeId: "forest" },
        { label: "先找老學者請教", nextNodeId: "scholar" },
      ]},
      scholar: { id: "scholar", text: "老學者捻鬚：「古籍藏在廟中，須解文字之謎方能取。」他贈你一卷字訣。", type: "narrative", choices: [{ label: "前往山林", nextNodeId: "forest" }]},
      forest: { id: "forest", text: "山林茂密，岔路紛呈。一塊石碑刻著古文，似是指引方向。", type: "check", check: { subject: "國語", nextCorrectId: "temple", nextWrongId: "lost" }},
      lost: { id: "lost", text: "辨錯文字，在林中繞了許久，最後憑記憶摸回小徑。", type: "narrative", choices: [{ label: "繼續找古廟", nextNodeId: "temple" }]},
      temple: { id: "temple", text: "古廟出現眼前，廟前石階刻著幾何圖形，似是機關。", type: "check", check: { subject: "數學", nextCorrectId: "inner", nextWrongId: "blocked" }},
      inner: { id: "inner", text: "解開幾何機關，廟門應聲而開。古籍靜靜躺在供桌上。", type: "ending", ending: "good", reward: { gold: 40, card: true, title: "古籍尋跡者" }},
      blocked: { id: "blocked", text: "機關未解，廟門緊閉。你只能遺憾折返，但這趟旅程已讓你成長。", type: "ending", ending: "bad", reward: { gold: 15 }},
    },
  },
  {
    id: "salt-field",
    title: "鹽田的滋味",
    summary: "南臺灣鹽田迎來豐收季，你跟著鹽工學習曬鹽、認識產業與海風的默契。",
    icon: "🧂",
    cost: 40,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "鹽田老闆揮汗笑道：「日頭正好，敢不敢下田學曬鹽？」你看著雪白的鹽堆，點了點頭。", type: "choice", choices: [
        { label: "跟著老師傅學曬鹽", nextNodeId: "learn" },
        { label: "先問鹽田為什麼在南部", nextNodeId: "why-south" },
      ]},
      "why-south": { id: "why-south", text: "老師傅解釋：南部日照長、雨量少，最適合鹽田曝曬。他指著遠方：「記住了，太陽就是我們的老闆。」", type: "narrative", choices: [{ label: "開始學曬鹽", nextNodeId: "learn" }]},
      learn: { id: "learn", text: "鹽田中，海水引入一格格的結晶池。師傅考你：「什麼時候該收鹽？」", type: "check", check: { subject: "自然", nextCorrectId: "harvest", nextWrongId: "rain" }},
      rain: { id: "rain", text: "你以為下雨前收鹽就好，卻忘了鹽怕水。傍晚雲起，一批鹽結晶受了損，你懊惱不已。", type: "narrative", choices: [{ label: "向師傅道歉，繼續學習", nextNodeId: "harvest" }]},
      harvest: { id: "harvest", text: "你學會看天氣收鹽，鹽堆像小山一樣雪白。老闆拍拍你的肩：「鹽稅、鹽路，可都是老故事了。」", type: "check", check: { subject: "社會", nextCorrectId: "good-end", nextWrongId: "mid-end" }},
      "good-end": { id: "good-end", text: "你把鹽業歷史與現代製鹽說得頭頭是道，老闆大悅，送你一包特級海鹽與鹽田徽章。", type: "ending", ending: "good", reward: { gold: 45, title: "鹽田小達人" }},
      "mid-end": { id: "mid-end", text: "鹽收成了，老闆謝謝你的幫忙，給了一筆工錢。", type: "ending", ending: "neutral", reward: { gold: 25 }},
    },
  },
  {
    id: "railway-math",
    title: "鐵道上的數學",
    summary: "縱貫鐵路的時刻表出現差錯，你帶著計算本上車，幫站長校對班次與里程。",
    icon: "🚂",
    cost: 45,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "車站廣播響起：「北上列車時刻表疑似印錯，請小幫手協助校對！」你自告奮勇。", type: "choice", choices: [
        { label: "到月台量測列車間距", nextNodeId: "platform" },
        { label: "先看時刻表找規律", nextNodeId: "schedule" },
      ]},
      schedule: { id: "schedule", text: "你攤開時刻表，發現北上列車每 15 分鐘一班，正在計算下一班到站時間。", type: "narrative", choices: [{ label: "到月台實測", nextNodeId: "platform" }]},
      platform: { id: "platform", text: "月台上，站長問：「兩站之間距離 120 公里，列車時速 60 公里，要開多久？」", type: "check", check: { subject: "數學", nextCorrectId: "correct", nextWrongId: "wrong" }},
      wrong: { id: "wrong", text: "你一時算錯，列車進站時匆忙修正。站長沒怪你，把正確算法又講了一遍。", type: "narrative", choices: [{ label: "重新校對時刻表", nextNodeId: "correct" }]},
      correct: { id: "correct", text: "你算對了！站長又問：「如果是 90 公里的路程，時速 45 公里呢？」你信心滿滿。", type: "check", check: { subject: "數學", nextCorrectId: "good-end", nextWrongId: "mid-end" }},
      "good-end": { id: "good-end", text: "時刻表修正完畢，列車準點出發。站長送你一張紀念車票與「鐵道數學家」稱號。", type: "ending", ending: "good", reward: { gold: 50, title: "鐵道數學家" }},
      "mid-end": { id: "mid-end", text: "雖然繞了點路，你還是幫站長完成了校對，獲得小費與掌聲。", type: "ending", ending: "neutral", reward: { gold: 30 }},
    },
  },
  {
    id: "night-market",
    title: "夜市的祕密",
    summary: "夜市攤位出現一連串文字謎題，據說解開謎底就能找到傳說中的隱藏小吃。",
    icon: "🏮",
    cost: 35,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "夜市燈火通明，賣糖葫蘆的阿婆遞來一張紙條：「解開招牌上的字謎，隱藏攤位就會現身。」", type: "choice", choices: [
        { label: "先逛逛攤位找線索", nextNodeId: "wander" },
        { label: "直接研究紙條字謎", nextNodeId: "riddle" },
      ]},
      riddle: { id: "riddle", text: "紙條上寫著一句成語，拆開偏旁正是攤位名稱的提示。你恍然大悟。", type: "narrative", choices: [{ label: "循線找到攤位", nextNodeId: "wander" }]},
      wander: { id: "wander", text: "走過蚵仔煎、臭豆腐攤，終於找到字謎所指的招牌。老闆笑道：「答對我的題目，免費請你吃。」", type: "check", check: { subject: "國語", nextCorrectId: "correct", nextWrongId: "wrong" }},
      wrong: { id: "wrong", text: "你猜錯了字謎，老闆仍請你吃一份小點心，並提示謎底和「偏旁」有關。", type: "narrative", choices: [{ label: "再試一次", nextNodeId: "correct" }]},
      correct: { id: "correct", text: "字謎解開！老闆又出一道題：「三份小吃共 120 元，一份多少錢？」", type: "check", check: { subject: "數學", nextCorrectId: "good-end", nextWrongId: "mid-end" }},
      "good-end": { id: "good-end", text: "你連答兩題，老闆端出傳說中的隱藏小吃，還送你夜市紀念徽章。", type: "ending", ending: "good", reward: { gold: 40, card: true, title: "夜市尋寶王" }},
      "mid-end": { id: "mid-end", text: "你吃到了隱藏小吃，心滿意足地結束夜市之旅。", type: "ending", ending: "neutral", reward: { gold: 20 }},
    },
  },
  {
    id: "alishan-whisper",
    title: "阿里山的密語",
    summary: "高山森林裡流傳著鄒族的古老傳說，你循著鳥鳴與雲霧，尋找會說話的老樹。",
    icon: "🌲",
    cost: 50,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "山徑被雲霧圍繞，嚮導說：「老樹只在誠實的旅人面前開口。」你握緊筆記本出發。", type: "choice", choices: [
        { label: "沿著溪流小徑前進", nextNodeId: "stream" },
        { label: "先聽嚮導講鄒族傳說", nextNodeId: "legend" },
      ]},
      legend: { id: "legend", text: "嚮導講起天神與巨木的故事，說樹會用年輪記錄每一場風雨。", type: "narrative", choices: [{ label: "繼續往森林深處走", nextNodeId: "stream" }]},
      stream: { id: "stream", text: "溪水旁立著一棵巨木，樹皮紋路像一張老臉。它低聲問：「山裡什麼生物會用翅膀傳遞花粉？」", type: "check", check: { subject: "自然", nextCorrectId: "answer", nextWrongId: "mistake" }},
      mistake: { id: "mistake", text: "老樹搖搖頭：「再想想。」一片葉子飄落，彷彿在提醒你觀察昆蟲與花朵的關係。", type: "narrative", choices: [{ label: "再回答一次", nextNodeId: "answer" }]},
      answer: { id: "answer", text: "「是昆蟲！」老樹笑了，樹皮浮現一行古文字：「用你們的話說——山林共好。」", type: "check", check: { subject: "國語", nextCorrectId: "good-end", nextWrongId: "mid-end" }},
      "good-end": { id: "good-end", text: "你讀懂了密語，老樹贈你一截發光的樹枝，說這是森林的祝福。嚮導驚嘆：「你是山林解密者！」", type: "ending", ending: "good", reward: { gold: 55, card: true, title: "山林解密者" }},
      "mid-end": { id: "mid-end", text: "老樹沒有完全現身，但你帶回了滿滿的森林筆記。", type: "ending", ending: "neutral", reward: { gold: 35 }},
    },
  },
];

export function getChapterById(id: string): AdventureChapter | null {
  return ALL_CHAPTERS.find((chapter) => chapter.id === id) ?? null;
}

export function validateChapter(chapter: AdventureChapter): void {
  const nodeIds = Object.keys(chapter.nodes);
  nodeIds.forEach((nodeId) => {
    const node = chapter.nodes[nodeId];
    if (!node) throw new Error(`章節 ${chapter.id} 節點 ${nodeId} 不存在`);
    node.choices?.forEach((choice) => {
      if (!chapter.nodes[choice.nextNodeId]) {
        throw new Error(`章節 ${chapter.id} 節點 ${nodeId} 指向不存在的 ${choice.nextNodeId}`);
      }
    });
    if (node.type === "check" && node.check) {
      if (!chapter.nodes[node.check.nextCorrectId] || !chapter.nodes[node.check.nextWrongId]) {
        throw new Error(`章節 ${chapter.id} check 節點 ${nodeId} 分支無效`);
      }
    }
  });
  if (!chapter.nodes[chapter.startNodeId]) {
    throw new Error(`章節 ${chapter.id} 起始節點 ${chapter.startNodeId} 不存在`);
  }
}
