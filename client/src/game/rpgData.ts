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
];

export const ENCOUNTERS: Encounter[] = [
  { id: "moss-mote", name: "苔光小靈", region: "north", habitatId: "tidal-grove", rarity: "common", level: 1, hp: 24, maxHp: 24, defense: 1, captureCost: 4, description: "躲在潮濕葉脈裡，會用微光提示觀察方向。", accent: "#6f9e68" },
  { id: "tide-wisp", name: "潮影靈", region: "north", habitatId: "tidal-grove", rarity: "rare", level: 2, hp: 31, maxHp: 31, defense: 2, captureCost: 6, description: "只在足夠的觀測紀錄引導下，沿著潮紋留下稀有微光。", accent: "#54b3a5" },
  { id: "cloud-shell", name: "雲殼獸", region: "central", habitatId: "cloud-shelf", rarity: "common", level: 2, hp: 35, maxHp: 35, defense: 3, captureCost: 6, description: "背著像雲一樣的殼，喜歡聽人解釋自然現象。", accent: "#8a9cb2" },
  { id: "ember-ibis", name: "焰羽鷺", region: "central", habitatId: "cloud-shelf", rarity: "rare", level: 3, hp: 44, maxHp: 44, defense: 4, captureCost: 8, description: "會在雲層散開時留下暖色羽跡，只回應完成突破的探索者。", accent: "#e56d45" },
  { id: "star-fin", name: "星鰭魚", region: "east", habitatId: "star-current", rarity: "common", level: 2, hp: 30, maxHp: 30, defense: 2, captureCost: 7, description: "在夜色中留下星點水痕，擅長辨認方向與比例。", accent: "#5c86bd" },
  { id: "orbit-koi", name: "環軌錦鯉", region: "east", habitatId: "star-current", rarity: "rare", level: 3, hp: 40, maxHp: 40, defense: 3, captureCost: 9, description: "只在答對挑戰題後浮現，會把星點排列成穩定軌跡。", accent: "#8675d6" },
  { id: "coral-sprout", name: "珊芽獸", region: "south", habitatId: "coral-shallows", rarity: "common", level: 3, hp: 42, maxHp: 42, defense: 4, captureCost: 9, description: "守護潮間帶的小生物，對合作與耐心特別敏感。", accent: "#e98265" },
  { id: "reef-warden", name: "礁語守望者", region: "south", habitatId: "coral-shallows", rarity: "legendary", level: 4, hp: 54, maxHp: 54, defense: 5, captureCost: 12, description: "在多次守門突破後才會現身，用潮聲考驗探索者的耐心與理解。", accent: "#df78a5" },
];

export function encounterForRegion(region: RegionKey) {
  return ENCOUNTERS.find((item) => item.region === region) ?? ENCOUNTERS[0];
}
