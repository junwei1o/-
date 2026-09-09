import { BookOpenCheck, BrainCircuit, Crown, Lightbulb, Map as MapIcon, Medal, Swords, Tent, type LucideIcon } from "lucide-react";

export type FeatureSearchItem = {
  id: "map" | "battle" | "duel" | "guardian" | "wrongAnswers" | "studyTips" | "dailyCamp" | "badges";
  label: string;
  description: string;
  href: string;
  keywords: string[];
  icon: LucideIcon;
};

export const FEATURE_SEARCH_ITEMS: FeatureSearchItem[] = [
  {
    id: "map",
    label: "航海圖／學習地圖",
    description: "瀏覽知識島嶼、學習航線與每座島的星級成績。",
    href: "/map",
    keywords: ["地圖", "航海圖", "學習地圖", "島嶼", "航線", "星級", "星星"],
    icon: MapIcon,
  },
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
  {
    id: "studyTips",
    label: "讀書技巧與應試策略",
    description: "通用答題原則、各科答題眉角、素養題與考場心態調適。",
    href: "/study-tips",
    keywords: ["讀書技巧", "應試技巧", "考試技巧", "答題技巧", "備考", "會考", "讀書方法", "時間管理", "讀書"],
    icon: Lightbulb,
  },
  {
    id: "dailyCamp",
    label: "每日營地：簽到、任務與商店",
    description: "每日簽到、解任務賺金幣、在商店買體力與護身符，還能挑戰每週王。",
    href: "/camp",
    keywords: ["每日營地", "營地", "簽到", "每日任務", "任務", "金幣", "商店", "買東西", "體力", "護身符", "每週王", "boss"],
    icon: Tent,
  },
  {
    id: "badges",
    label: "徽章牆與成就",
    description: "收集探險徽章，回顧答題、簽到與戰鬥達成的各種成就。",
    href: "/badges",
    keywords: ["徽章", "徽章牆", "成就", "勳章", "稱號", "收集"],
    icon: Medal,
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
