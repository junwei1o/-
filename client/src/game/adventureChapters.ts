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
