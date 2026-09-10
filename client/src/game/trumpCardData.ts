import type { Rarity } from "./rpgTypes";

export type CardTheme = "國語" | "數學" | "社會" | "自然";
export type CardStat = "power" | "wisdom" | "speed" | "charm";

export const STAT_LABELS: Record<CardStat, string> = {
  power: "威力",
  wisdom: "知識",
  speed: "速度",
  charm: "稀有",
};

export type CardDef = {
  id: string;
  name: string;
  theme: CardTheme;
  rarity: Rarity;
  stats: Record<CardStat, number>;
  emoji: string;
  flavor: string;
};

export const ALL_CARDS: readonly CardDef[] = [
  // 國語
  { id: "ch-01", name: "詩仙李白", theme: "國語", rarity: "legendary", stats: { power: 7, wisdom: 10, speed: 6, charm: 9 }, emoji: "🖋️", flavor: "斗酒詩百篇，長安市上酒家眠。" },
  { id: "ch-02", name: "客家山歌", theme: "國語", rarity: "common", stats: { power: 3, wisdom: 5, speed: 7, charm: 4 }, emoji: "🎵", flavor: "山謠傳唱，承載先民生活記憶。" },
  { id: "ch-03", name: "諺語智慧", theme: "國語", rarity: "common", stats: { power: 4, wisdom: 7, speed: 3, charm: 5 }, emoji: "💬", flavor: "一句老話，藏著一代經驗。" },
  { id: "ch-04", name: "現代詩", theme: "國語", rarity: "rare", stats: { power: 5, wisdom: 8, speed: 6, charm: 7 }, emoji: "📜", flavor: "以日常事物映照心靈風景。" },
  { id: "ch-05", name: "古典小說", theme: "國語", rarity: "rare", stats: { power: 8, wisdom: 6, speed: 4, charm: 8 }, emoji: "📚", flavor: "英雄豪傑，盡在章回之間。" },
  // 數學
  { id: "math-01", name: "圓周率", theme: "數學", rarity: "legendary", stats: { power: 6, wisdom: 10, speed: 5, charm: 9 }, emoji: "π", flavor: "無盡不循環的神秘數字。" },
  { id: "math-02", name: "三角形", theme: "數學", rarity: "common", stats: { power: 5, wisdom: 6, speed: 7, charm: 3 }, emoji: "🔺", flavor: "最穩定的圖形結構。" },
  { id: "math-03", name: "分數", theme: "數學", rarity: "common", stats: { power: 4, wisdom: 7, speed: 4, charm: 5 }, emoji: "➗", flavor: "把整體公平切開的方法。" },
  { id: "math-04", name: "幾何變換", theme: "數學", rarity: "common", stats: { power: 7, wisdom: 7, speed: 8, charm: 6 }, emoji: "🔄", flavor: "平移、旋轉、對稱，形狀的魔術。" },
  { id: "math-05", name: "黃金比例", theme: "數學", rarity: "rare", stats: { power: 6, wisdom: 8, speed: 5, charm: 9 }, emoji: "✨", flavor: "自然界最美的比例。" },
  // 社會
  { id: "soc-01", name: "鄭成功艦隊", theme: "社會", rarity: "legendary", stats: { power: 9, wisdom: 7, speed: 6, charm: 8 }, emoji: "⛵", flavor: "驅逐荷蘭，開墾寶島。" },
  { id: "soc-02", name: "濁水溪", theme: "社會", rarity: "common", stats: { power: 5, wisdom: 4, speed: 6, charm: 4 }, emoji: "🏞️", flavor: "台灣最長河川，孕育肥沃平原。" },
  { id: "soc-03", name: "阿美族豐年祭", theme: "社會", rarity: "rare", stats: { power: 4, wisdom: 6, speed: 5, charm: 9 }, emoji: "🌾", flavor: "歌聲與舞蹈，感謝大地賜予。" },
  { id: "soc-04", name: "民主選舉", theme: "社會", rarity: "rare", stats: { power: 5, wisdom: 9, speed: 4, charm: 7 }, emoji: "🗳️", flavor: "一人一票，決定家園方向。" },
  { id: "soc-05", name: "高鐵", theme: "社會", rarity: "common", stats: { power: 6, wisdom: 5, speed: 10, charm: 4 }, emoji: "🚄", flavor: "一日生活圈，串連南北。" },
  // 自然
  { id: "nat-01", name: "黑面琵鷺", theme: "自然", rarity: "legendary", stats: { power: 4, wisdom: 6, speed: 7, charm: 10 }, emoji: "🦤", flavor: "過境台灣的稀有嬌客。" },
  { id: "nat-02", name: "櫻花鉤吻鮭", theme: "自然", rarity: "common", stats: { power: 3, wisdom: 5, speed: 8, charm: 8 }, emoji: "🐟", flavor: "冰河時期遺留的國寶魚。" },
  { id: "nat-03", name: "大屯火山", theme: "自然", rarity: "common", stats: { power: 8, wisdom: 5, speed: 3, charm: 6 }, emoji: "🌋", flavor: "地熱與溫泉的源頭。" },
  { id: "nat-04", name: "光合作用", theme: "自然", rarity: "common", stats: { power: 5, wisdom: 9, speed: 4, charm: 5 }, emoji: "🌱", flavor: "陽光、水與空氣，變成生命。" },
  { id: "nat-05", name: "颱風", theme: "自然", rarity: "rare", stats: { power: 10, wisdom: 6, speed: 9, charm: 4 }, emoji: "🌀", flavor: "夏秋季節的強力天氣系統。" },
];

export function getCardById(id: string): CardDef | null {
  return ALL_CARDS.find((card) => card.id === id) ?? null;
}

export function getCardsByTheme(theme: CardTheme): readonly CardDef[] {
  return ALL_CARDS.filter((card) => card.theme === theme);
}

export function getRandomUnownedCard(ownedIds: readonly string[], random: () => number = Math.random): CardDef | null {
  const unowned = ALL_CARDS.filter((card) => !ownedIds.includes(card.id));
  if (unowned.length === 0) return null;
  const pick = unowned[Math.floor(random() * unowned.length)] ?? null;
  return pick;
}
