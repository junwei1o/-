import type { Companion, Encounter, RegionKey } from "./rpgTypes";

export const REGION_LABELS: Record<RegionKey, string> = {
  north: "北境潮汐林",
  central: "中央雲嶺",
  east: "東岸星谷",
  south: "南方珊瑚灣",
};

export type LearningZoneKey = "forest" | "snowfield" | "desert" | "volcano" | "sea" | "astronomy";
export type LearningZone = { key: LearningZoneKey; name: string; curriculumDomains: string[]; recommendedDifficulties: ("基礎" | "標準" | "挑戰")[]; description: string };

export const LEARNING_ZONES: LearningZone[] = [
  { key: "forest", name: "潮汐森林", curriculumDomains: ["自然科學", "國語文"], recommendedDifficulties: ["基礎", "標準"], description: "從觀察生物、閱讀線索與分類開始，建立穩定的學習節奏。" },
  { key: "snowfield", name: "雲嶺雪原", curriculumDomains: ["數學領域", "自然科學"], recommendedDifficulties: ["標準", "挑戰"], description: "把溫度、比例與變化連成一條清楚的推理路線。" },
  { key: "desert", name: "日輪沙漠", curriculumDomains: ["數學領域", "社會領域"], recommendedDifficulties: ["基礎", "標準"], description: "在資源有限的情境裡練習估算、比較與做決定。" },
  { key: "volcano", name: "火種火山", curriculumDomains: ["自然科學", "社會領域"], recommendedDifficulties: ["標準", "挑戰"], description: "用證據理解地質、能量與人類如何面對環境風險。" },
  { key: "sea", name: "珊瑚深海", curriculumDomains: ["自然科學", "數學領域"], recommendedDifficulties: ["標準", "挑戰"], description: "從潮汐、生態與資料圖表探索海洋系統。" },
  { key: "astronomy", name: "星際天文台／人類火種躍遷蟲洞", curriculumDomains: ["自然科學", "數學領域", "社會領域"], recommendedDifficulties: ["挑戰"], description: "把尺度、模型與世界原理轉化為可理解的科學問題。" },
];

export const zoneForRegion = (region: RegionKey): LearningZone => LEARNING_ZONES[{ north: 0, central: 1, east: 5, south: 4 }[region]];

export const STARTER_COMPANION: Companion = {
  id: "tide-scout",
  name: "潮芽獸",
  epithet: "會記錄風向的小小探勘員",
  region: "north",
  rarity: "common",
  level: 1,
  xp: 0,
  hp: 42,
  maxHp: 42,
  energyPower: 9,
  defense: 3,
  dialogue: ["今天也一起找答案吧！", "觀察、推理，再勇敢試一次。"],
  skillName: "潮汐脈衝",
  skillCost: 3,
  accent: "#2c8c91",
};

export const COMPANION_CATALOG: Companion[] = [
  STARTER_COMPANION,
  { id: "ember-guard", name: "焰甲衛", epithet: "守護求知火種的原創鎧甲夥伴", region: "central", rarity: "rare", level: 1, xp: 0, hp: 52, maxHp: 52, energyPower: 12, defense: 6, dialogue: ["知識是盾，勇氣是光。", "先看清問題，再選擇行動。"], skillName: "火種護盾", skillCost: 4, accent: "#e56d45" },
  { id: "star-runner", name: "星浪行者", epithet: "把夜空線索串成路徑的原創守望者", region: "east", rarity: "rare", level: 1, xp: 0, hp: 46, maxHp: 46, energyPower: 15, defense: 4, dialogue: ["每一顆星，都可能是一個好問題。", "沿著證據走，答案會發光。"], skillName: "星軌投射", skillCost: 5, accent: "#6f68c7" },
  { id: "milk-dragonling", name: "奶泡龍崽", epithet: "喜歡把複雜事情講成可愛比喻的原創寵物", region: "south", rarity: "legendary", level: 1, xp: 0, hp: 58, maxHp: 58, energyPower: 10, defense: 5, dialogue: ["先吃一口勇氣，再想一個方法！", "答對的能量，變成今天的閃亮力量。"], skillName: "泡泡鼓舞", skillCost: 4, accent: "#f0a4b8" },
  { id: "formosa-bear", name: "黑熊護衛", epithet: "守護山林知識的原創台灣黑熊夥伴", region: "central", rarity: "legendary", level: 1, xp: 0, hp: 62, maxHp: 62, energyPower: 13, defense: 7, dialogue: ["穩住呼吸，答案會像山徑一樣浮現。", "每一步都算數，我們一起慢慢走。"], skillName: "熊掌守護", skillCost: 4, accent: "#4a3f35" },
];

export const ENCOUNTERS: Encounter[] = [
  { id: "moss-mote", name: "苔光小靈", region: "north", habitatId: "tidal-grove", rarity: "common", level: 1, hp: 24, maxHp: 24, defense: 1, captureCost: 4, description: "躲在潮濕葉脈裡，會用微光提示觀察方向。", accent: "#6f9e68" },
  { id: "tide-wisp", name: "潮影靈", region: "north", habitatId: "tidal-grove", rarity: "rare", level: 2, hp: 31, maxHp: 31, defense: 2, captureCost: 6, description: "只在足夠的觀測紀錄引導下，沿著潮紋留下稀有微光。", accent: "#54b3a5" },
  { id: "cloud-shell", name: "雲殼獸", region: "central", habitatId: "cloud-shelf", rarity: "common", level: 2, hp: 35, maxHp: 35, defense: 3, captureCost: 6, description: "背著像雲一樣的殼，喜歡聽人解釋自然現象。", accent: "#8a9cb2" },
  { id: "ember-ibis", name: "焰羽鷺", region: "central", habitatId: "cloud-shelf", rarity: "rare", level: 3, hp: 44, maxHp: 44, defense: 4, captureCost: 8, description: "會在雲層散開時留下暖色羽跡，只回應完成突破的探索者。", accent: "#e56d45" },
  { id: "star-fin", name: "星鰭魚", region: "east", habitatId: "star-current", rarity: "common", level: 2, hp: 30, maxHp: 30, defense: 2, captureCost: 7, description: "在夜色中留下星點水痕，擅長辨認方向與比例。", accent: "#5c86bd" },
  { id: "orbit-koi", name: "環軌錦鯉", region: "east", habitatId: "star-current", rarity: "rare", level: 3, hp: 40, maxHp: 40, defense: 3, captureCost: 9, description: "只在答對挑戰題後浮現，會把星點排列成穩定軌跡。", accent: "#8675d6" },
  { id: "coral-sprout", name: "珊芽獸", region: "south", habitatId: "coral-shallows", rarity: "common", level: 3, hp: 42, maxHp: 42, defense: 4, captureCost: 9, description: "守護潮間帶的小生物，對合作與耐心特別敏感。", accent: "#e98265" },
  { id: "glow-jelly", name: "瑩光水母", region: "south", habitatId: "coral-shallows", rarity: "rare", level: 4, hp: 36, maxHp: 36, defense: 2, captureCost: 7, description: "夜晚會沿著洋流點起螢光，用柔和的節奏引導觀測者。", accent: "#7fd4c1" },
  { id: "reef-warden", name: "礁語守望者", region: "south", habitatId: "coral-shallows", rarity: "legendary", level: 4, hp: 54, maxHp: 54, defense: 5, captureCost: 12, description: "在多次守門突破後才會現身，用潮聲考驗探索者的耐心與理解。", accent: "#df78a5" },
  { id: "tide-firefly", name: "夜潮螢", region: "north", habitatId: "tidal-grove", rarity: "legendary", level: 5, hp: 60, maxHp: 60, defense: 6, captureCost: 14, description: "只在完整整理一整天的觀測紀錄後現身，用螢光寫下潮汐密碼。", accent: "#1f8f7a" },
  { id: "cloud-deer", name: "雲嶺水鹿", region: "central", habitatId: "cloud-shelf", rarity: "legendary", level: 5, hp: 58, maxHp: 58, defense: 7, captureCost: 15, description: "在高山雲霧中守護水脈的傳奇，回應願意把難題一步一步走完的探索者。", accent: "#7d8c4a" },
  { id: "star-whale", name: "星谷鯨靈", region: "east", habitatId: "star-current", rarity: "legendary", level: 5, hp: 62, maxHp: 62, defense: 5, captureCost: 16, description: "沿著東岸星光洄游的巨影，只在多次挑戰題突破後浮出星海。", accent: "#4a6cc7" },
];

export function encounterForRegion(region: RegionKey, ownedIds?: string[]) {
  const pool = ENCOUNTERS.filter((item) => item.region === region);
  if (pool.length === 0) return ENCOUNTERS[0];
  if (!ownedIds || ownedIds.length === 0) return pool[0];
  const owned = new Set(ownedIds);
  const unowned = pool.filter((item) => !owned.has(item.id));
  // 先遇見低階未捕捉夥伴；該區全數捕捉後，回傳最高階供再次挑戰。
  if (unowned.length > 0) return unowned.sort((a, b) => a.level - b.level)[0];
  return [...pool].sort((a, b) => b.level - a.level)[0];
}
