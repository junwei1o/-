import { getRareMonsters, type SubjectKey } from "./expeditionContent";

// 限定稱號目錄：集中列出所有可獲得的限定稱號與達成條件。
// 稀有遠征稱號直接從 expeditionContent 的稀有怪物資料派生，避免兩邊不同步。
// 擁有狀態與 utils/storage.ts 的 getLimitedTitles() 回傳字串比對（id 即實際儲存值）。

export type TitleCategory = "簽到成長" | "連擊挑戰" | "稀有遠征" | "潮汐牌局" | "文字冒險";

export type TitleDefinition = {
  /** 與 getLimitedTitles() 實際儲存的字串一致，做為比對 id */
  id: string;
  /** 徽章牆上展示的稱號名稱（去除「擊敗後獲得限定稱號：」前綴） */
  displayTitle: string;
  category: TitleCategory;
  condition: string;
  hint: { label: string; href: string };
};

const TITLE_SUBJECTS: ReadonlyArray<{ key: SubjectKey; label: string }> = [
  { key: "chinese", label: "國語" },
  { key: "math", label: "數學" },
  { key: "english", label: "英語" },
  { key: "science", label: "自然" },
  { key: "social", label: "社會" },
];

const RARE_TITLE_PREFIX = "擊敗後獲得限定稱號：";

export function stripTitlePrefix(rawTitle: string): string {
  return rawTitle.startsWith(RARE_TITLE_PREFIX) ? rawTitle.slice(RARE_TITLE_PREFIX.length) : rawTitle;
}

const rareExpeditionTitles: readonly TitleDefinition[] = TITLE_SUBJECTS.flatMap(({ key, label }) =>
  getRareMonsters(key).map((monster) => {
    const rawTitle = monster.title ?? `${RARE_TITLE_PREFIX}${monster.name}`;
    return {
      id: rawTitle,
      displayTitle: stripTitlePrefix(rawTitle),
      category: "稀有遠征" as const,
      condition: `在${label}遠征中連續答對 10 題後遭遇稀有怪物，並擊敗「${monster.name}」`,
      hint: { label: "去守護者遠征", href: "/guardian" },
    };
  }),
);

export const TITLE_CATALOG: readonly TitleDefinition[] = [
  {
    id: "一週探險家",
    displayTitle: "一週探險家",
    category: "簽到成長",
    condition: "在每日營地連續簽到滿 7 天",
    hint: { label: "去每日營地", href: "/camp" },
  },
  {
    id: "連擊大師",
    displayTitle: "連擊大師",
    category: "連擊挑戰",
    condition: "在答題戰鬥中達成 15 連續答對",
    hint: { label: "去答題戰鬥", href: "/battle" },
  },
  {
    id: "牌局好手",
    displayTitle: "牌局好手",
    category: "潮汐牌局",
    condition: "在潮汐牌局累計獲勝 10 場",
    hint: { label: "去潮汐牌局", href: "/tavern/cards" },
  },
  {
    id: "潮汐牌王",
    displayTitle: "潮汐牌王",
    category: "潮汐牌局",
    condition: "在潮汐牌局累計獲勝 50 場",
    hint: { label: "去潮汐牌局", href: "/tavern/cards" },
  },
  {
    id: "燈塔嚮導",
    displayTitle: "燈塔嚮導",
    category: "文字冒險",
    condition: "完成冒險《燈塔的呼喚》的美滿結局",
    hint: { label: "去文字冒險", href: "/tavern/adventure" },
  },
  {
    id: "古籍尋跡者",
    displayTitle: "古籍尋跡者",
    category: "文字冒險",
    condition: "完成冒險《失落的古籍》的美滿結局",
    hint: { label: "去文字冒險", href: "/tavern/adventure" },
  },
  ...rareExpeditionTitles,
];

export function isTitleOwned(id: string, ownedTitles: readonly string[]): boolean {
  return ownedTitles.includes(id);
}

export function countOwnedTitles(ownedTitles: readonly string[]): number {
  return TITLE_CATALOG.reduce((total, title) => total + (isTitleOwned(title.id, ownedTitles) ? 1 : 0), 0);
}
