import {
  AlarmClock,
  BarChart3,
  Beer,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Crown,
  Dices,
  LifeBuoy,
  Medal,
  RotateCcw,
  ScrollText,
  Settings as SettingsIcon,
  ShieldAlert,
  Sparkles,
  Swords,
  Telescope,
  Tent,
  Timer,
  type LucideIcon,
} from "lucide-react";

export type HomeFeatureItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type HomeFeatureGroup = {
  id: string;
  label: string;
  description: string;
  items: HomeFeatureItem[];
};

export const HOME_FEATURE_GROUPS: HomeFeatureGroup[] = [
  {
    id: "learning",
    label: "學習與複習",
    description: "從課綱練習、錯題到學習報告。",
    items: [
      { id: "practice", label: "課綱練習", description: "依科目與進度開始答題", href: "/practice", icon: BookOpenCheck },
      { id: "review-hub", label: "今日複習中心", description: "按遺忘曲線整理到期複習", href: "/review-hub", icon: AlarmClock },
      { id: "wrong-answers", label: "錯題複習", description: "整理並補強真實錯題", href: "/wrong-answers", icon: RotateCcw },
      { id: "learning-insights", label: "學習洞察", description: "查看弱點與練習建議", href: "/learning-insights", icon: BrainCircuit },
      { id: "learning-report", label: "學習報告", description: "回顧答題與成長趨勢", href: "/learning-report", icon: BarChart3 },
    ],
  },
  {
    id: "expedition",
    label: "探險與對戰",
    description: "從主航海圖出發，解放知識島嶼。",
    items: [
      { id: "map", label: "主航海圖", description: "瀏覽島嶼與學習路線", href: "/map", icon: ScrollText },
      { id: "battle", label: "答題戰鬥", description: "運用技能迎戰知識怪物", href: "/battle", icon: Swords },
      { id: "guardian", label: "守護者遠征", description: "挑戰四位區域守護者", href: "/guardian", icon: Crown },
      { id: "tavern", label: "燈塔酒館", description: "學完進來玩：卡牌、冒險、夥伴", href: "/tavern", icon: Beer },
      { id: "self-challenge", label: "自我挑戰", description: "限時答題與個人最佳紀錄", href: "/community", icon: Timer },
      { id: "daily-camp", label: "每日營地", description: "簽到、每日任務、金幣商店與每週王", href: "/camp", icon: Tent },
      { id: "badges", label: "徽章牆", description: "收集探險徽章，點亮成就", href: "/badges", icon: Medal },
      { id: "adventure-journal", label: "探險日誌", description: "查看每日與歷史航海足跡", href: "/adventure-journal", icon: CalendarDays },
    ],
  },
  {
    id: "knowledge",
    label: "知識探索館",
    description: "用不同主題延伸好奇心與閱讀。",
    items: [
      { id: "safety", label: "生活安全學院", description: "消防、醫療、食物與身體自保知識", href: "/safety", icon: LifeBuoy },
      { id: "astronomy", label: "天文館", description: "探索星空、行星與太空任務", href: "/astronomy", icon: Telescope },
      { id: "wisdom", label: "智慧故事館", description: "閱讀故事並發現知識線索", href: "/wisdom", icon: Sparkles },
      { id: "principles", label: "世界原理站", description: "以互動方式理解科學原理", href: "/principles", icon: Dices },
      { id: "observatory", label: "影視觀測站", description: "從作品主題延伸素養觀察", href: "/observatory", icon: Telescope },
    ],
  },
  {
    id: "support",
    label: "學習支援與設定",
    description: "管理設定、分析錯誤類型與查看摘要。",
    items: [
      { id: "error-statistics", label: "錯誤類型統計", description: "辨識概念、粗心與記憶弱點", href: "/error-statistics", icon: ShieldAlert },
      { id: "learning-summary", label: "教師／家長摘要", description: "以 PIN 保護查看學習概況", href: "/learning-summary", icon: BarChart3 },
      { id: "settings", label: "設定與個人化", description: "調整主題、稱號、音效與無障礙選項", href: "/settings", icon: SettingsIcon },
    ],
  },
];

export function normalizeFeatureQuery(value: string) {
  return value.trim().toLocaleLowerCase("zh-TW").replace(/\s+/g, "");
}