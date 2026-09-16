import type { Rarity } from "./rpgTypes";

export type CardTheme = "國語" | "數學" | "社會" | "自然" | "聯盟";
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
  // 國語（擴充）
  { id: "ch-06", name: "成語故事", theme: "國語", rarity: "common", stats: { power: 4, wisdom: 6, speed: 5, charm: 5 }, emoji: "🎭", flavor: "四個字，濃縮一段智慧。" },
  { id: "ch-07", name: "臺灣童謠", theme: "國語", rarity: "common", stats: { power: 3, wisdom: 5, speed: 8, charm: 6 }, emoji: "🧸", flavor: "搖啊搖，搖到外婆橋。" },
  { id: "ch-08", name: "寓言故事", theme: "國語", rarity: "common", stats: { power: 5, wisdom: 7, speed: 4, charm: 6 }, emoji: "🦊", flavor: "龜兔賽跑，教我們持之以恆。" },
  { id: "ch-09", name: "神話傳說", theme: "國語", rarity: "rare", stats: { power: 8, wisdom: 7, speed: 5, charm: 8 }, emoji: "🐉", flavor: "后羿射日，夸父追日。" },
  { id: "ch-10", name: "書法之美", theme: "國語", rarity: "legendary", stats: { power: 6, wisdom: 10, speed: 4, charm: 9 }, emoji: "✒️", flavor: "一筆一畫，氣韻生動。" },
  { id: "ch-11", name: "新詩朗讀", theme: "國語", rarity: "legendary", stats: { power: 5, wisdom: 9, speed: 7, charm: 9 }, emoji: "🎤", flavor: "把日常，讀成一首詩。" },
  // 數學（擴充）
  { id: "math-06", name: "質數", theme: "數學", rarity: "common", stats: { power: 6, wisdom: 8, speed: 4, charm: 4 }, emoji: "🔢", flavor: "只能被 1 和自己整除的數。" },
  { id: "math-07", name: "負數", theme: "數學", rarity: "common", stats: { power: 7, wisdom: 6, speed: 5, charm: 3 }, emoji: "➖", flavor: "比零還小的數字世界。" },
  { id: "math-08", name: "對稱圖形", theme: "數學", rarity: "common", stats: { power: 6, wisdom: 7, speed: 6, charm: 6 }, emoji: "🔷", flavor: "左右鏡像的完美平衡。" },
  { id: "math-09", name: "統計圖表", theme: "數學", rarity: "rare", stats: { power: 5, wisdom: 8, speed: 6, charm: 7 }, emoji: "📊", flavor: "把資料畫成會說話的圖。" },
  { id: "math-10", name: "體積單位", theme: "數學", rarity: "rare", stats: { power: 6, wisdom: 9, speed: 4, charm: 7 }, emoji: "🧊", flavor: "一立方公分的水，重一公克。" },
  { id: "math-11", name: "機率", theme: "數學", rarity: "legendary", stats: { power: 4, wisdom: 10, speed: 8, charm: 9 }, emoji: "🎲", flavor: "機會有多大，用數字說清楚。" },
  // 社會（擴充）
  { id: "soc-06", name: "日月潭", theme: "社會", rarity: "common", stats: { power: 4, wisdom: 6, speed: 6, charm: 8 }, emoji: "🌙", flavor: "台灣最大的天然湖泊。" },
  { id: "soc-07", name: "老街巡禮", theme: "社會", rarity: "common", stats: { power: 5, wisdom: 5, speed: 6, charm: 7 }, emoji: "🏘️", flavor: "紅磚與巴洛克，記憶老時光。" },
  { id: "soc-08", name: "媽祖信仰", theme: "社會", rarity: "common", stats: { power: 4, wisdom: 6, speed: 5, charm: 9 }, emoji: "⛩️", flavor: "海上守護神，庇佑漁民。" },
  { id: "soc-09", name: "平溪天燈", theme: "社會", rarity: "rare", stats: { power: 4, wisdom: 7, speed: 7, charm: 9 }, emoji: "🏮", flavor: "滿天許願，冉冉升空。" },
  { id: "soc-10", name: "故宮博物院", theme: "社會", rarity: "legendary", stats: { power: 7, wisdom: 10, speed: 5, charm: 9 }, emoji: "🏛️", flavor: "翠玉白菜，巧奪天工。" },
  { id: "soc-11", name: "原住民音樂", theme: "社會", rarity: "legendary", stats: { power: 5, wisdom: 8, speed: 6, charm: 10 }, emoji: "🎶", flavor: "歌謠與舞蹈，傳唱千年。" },
  // 自然（擴充）
  { id: "nat-06", name: "螢火蟲", theme: "自然", rarity: "common", stats: { power: 3, wisdom: 5, speed: 7, charm: 9 }, emoji: "✨", flavor: "夏夜裡一閃一閃的小燈籠。" },
  { id: "nat-07", name: "珊瑚礁", theme: "自然", rarity: "common", stats: { power: 4, wisdom: 6, speed: 5, charm: 8 }, emoji: "🪸", flavor: "海底的熱帶雨林。" },
  { id: "nat-08", name: "候鳥遷徙", theme: "自然", rarity: "common", stats: { power: 5, wisdom: 7, speed: 10, charm: 7 }, emoji: "🕊️", flavor: "千里迢迢，只為度過寒冬。" },
  { id: "nat-09", name: "地震", theme: "自然", rarity: "rare", stats: { power: 9, wisdom: 7, speed: 3, charm: 5 }, emoji: "🌍", flavor: "板塊擠壓的能量釋放。" },
  { id: "nat-10", name: "月亮盈虧", theme: "自然", rarity: "rare", stats: { power: 4, wisdom: 9, speed: 6, charm: 8 }, emoji: "🌗", flavor: "初一新月，十五滿月。" },
  { id: "nat-11", name: "四季變化", theme: "自然", rarity: "legendary", stats: { power: 5, wisdom: 8, speed: 7, charm: 10 }, emoji: "🌸", flavor: "春耕夏耘，秋收冬藏。" },
  // 聯盟限定卡（無屬性相克，中立；聯盟賽組別前 10% 限定）
  { id: "league-bronze", name: "青銅守護者", theme: "聯盟", rarity: "legendary", stats: { power: 8, wisdom: 6, speed: 5, charm: 6 }, emoji: "🛡️", flavor: "守護青銅組的榮耀。" },
  { id: "league-silver", name: "白銀艦隊", theme: "聯盟", rarity: "legendary", stats: { power: 7, wisdom: 7, speed: 8, charm: 7 }, emoji: "⚓", flavor: "乘風破浪的白銀船隊。" },
  { id: "league-gold", name: "黃金探險家", theme: "聯盟", rarity: "legendary", stats: { power: 8, wisdom: 8, speed: 7, charm: 9 }, emoji: "🏅", flavor: "揮灑汗水的黃金傳說。" },
  { id: "league-diamond", name: "鑽石王冠", theme: "聯盟", rarity: "legendary", stats: { power: 9, wisdom: 9, speed: 8, charm: 10 }, emoji: "💠", flavor: "聯盟之巔，王者加冕。" },
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
