import { BookOpenCheck, BrainCircuit, Crown, Swords, type LucideIcon } from "lucide-react";

export type FeatureSearchItem = {
  id: "battle" | "duel" | "guardian" | "wrongAnswers";
  label: string;
  description: string;
  href: string;
  keywords: string[];
  icon: LucideIcon;
};

export const FEATURE_SEARCH_ITEMS: FeatureSearchItem[] = [
  {
    id: "battle",
    label: "戰鬥系統",
    description: "答題戰鬥、怒氣技能、連擊與怪物挑戰。",
    href: "/battle",
    keywords: ["戰鬥", "答題戰鬥", "怪物", "怒氣", "技能", "連擊"],
    icon: Swords,
  },
  {
    id: "duel",
    label: "知識決鬥／卡牌對戰",
    description: "和 AI 對手進行三局兩勝的推理答題與策略卡牌對戰。",
    href: "/knowledge-duel",
    keywords: ["知識決鬥", "決鬥", "卡牌", "卡牌對戰", "策略卡", "狼人殺", "AI 對手"],
    icon: BrainCircuit,
  },
  {
    id: "guardian",
    label: "守護者 BOSS 主線",
    description: "完成區域試煉後，挑戰四位最終守護者並解放知識島嶼。",
    href: "/guardian",
    keywords: ["守護者", "守護者BOSS", "BOSS", "主線", "區域解放", "最終守護者"],
    icon: Crown,
  },
  {
    id: "wrongAnswers",
    label: "錯題魔王與複習",
    description: "整理錯題、查看標籤並進行個人化補強練習。",
    href: "/wrong-answers",
    keywords: ["錯題", "錯題魔王", "錯題複習", "補強", "複習", "錯誤"],
    icon: BookOpenCheck,
  },
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("zh-TW").replace(/\s+/g, "");
}

export function findFeatureSearchResults(query: string) {
  const term = normalize(query);
  if (!term) return FEATURE_SEARCH_ITEMS;

  return FEATURE_SEARCH_ITEMS.filter((item) =>
    [item.label, item.description, ...item.keywords]
      .map(normalize)
      .some((candidate) => candidate.includes(term)),
  );
}
