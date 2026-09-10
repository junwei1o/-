import { Beer, BookOpen, BookOpenCheck, BrainCircuit, Crown, LifeBuoy, Lightbulb, Map as MapIcon, Medal, Orbit, Radar, Swords, Telescope, Tent, type LucideIcon } from "lucide-react";

export type FeatureSearchItem = {
  id: "map" | "battle" | "duel" | "tavern" | "guardian" | "wrongAnswers" | "studyTips" | "dailyCamp" | "badges" | "safetyAcademy" | "worldPrinciples" | "mediaObservatory" | "astronomy" | "wisdomStories";
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
    id: "tavern",
    label: "燈塔酒館／卡牌／冒險",
    description: "學完進酒館玩：潮汐牌局卡牌對戰、文字冒險章節、夥伴小屋。",
    href: "/tavern",
    keywords: ["酒館", "卡牌", "潮汐牌局", "文字冒險", "夥伴", "Top Trumps", "燈塔"],
    icon: Beer,
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
  {
    id: "worldPrinciples",
    label: "世界原理站",
    description: "從相對論、量子力學到槓桿、浮力、慣性、折射、機率與回授，把生活現象連上科學原理。",
    href: "/principles",
    keywords: ["世界原理", "原理", "科學原理", "相對論", "量子", "熱力學", "電磁學", "第一性原理", "不可能三角", "槓桿", "力矩", "浮力", "慣性", "牛頓", "折射", "彩虹", "透鏡", "機率", "期望值", "回授", "蟲洞"],
    icon: Orbit,
  },
  {
    id: "mediaObservatory",
    label: "影視觀測站",
    description: "用世界觀觀測表看動畫與特攝：奶龍、奧特曼、假面騎士、哆啦A夢、寶可夢等十部作品的學習提示與測驗。",
    href: "/observatory",
    keywords: ["影視觀測站", "觀測站", "動漫", "動畫", "特攝", "英雄", "世界觀", "奶龍", "奧特曼", "假面騎士", "哆啦A夢", "寶可夢", "麵包超人", "小丸子", "櫻桃小丸子", "蠟筆小新", "超級戰隊", "光之美少女"],
    icon: Radar,
  },
  {
    id: "astronomy",
    label: "天文館",
    description: "宇宙尺度、太陽系、恆星、黑洞、觀星、太空探索、流星雨與極光，十個展區加上分層觀測任務。",
    href: "/astronomy",
    keywords: ["天文", "天文館", "宇宙", "太空", "星球", "恆星", "太陽系", "行星", "月球", "黑洞", "星系", "銀河", "觀星", "星座", "太空探索", "太空人", "流星", "隕石", "流星雨", "極光", "太陽風", "光年", "外星人"],
    icon: Telescope,
  },
  {
    id: "wisdomStories",
    label: "智慧故事館",
    description: "成語新解、寓言故事、歷史典故、名人名言與真實案例，每則故事都連一個生活思考題。",
    href: "/wisdom",
    keywords: ["智慧", "故事", "故事館", "成語", "成語新解", "寓言", "歷史典故", "名人名言", "真實案例", "品格", "龜兔賽跑", "愚公移山", "畫蛇添足", "亡羊補牢", "北風與太陽", "學而不思則罔", "螞蟻"],
    icon: BookOpen,
  },
  {
    id: "safetyAcademy",
    label: "生活安全學院",
    description: "消防逃生、地震避難、燒燙傷、急救 119、用藥、洗手、防疫、防溺、食物與交通安全、視力睡眠與護脊保健等生活自保知識。",
    href: "/safety",
    keywords: ["安全", "生活安全", "安全學院", "消防", "火災", "火場逃生", "119", "地震", "避難", "趴下掩護穩住", "急救", "燒燙傷", "沖脫泡蓋送", "醫療", "生病", "發燒", "藥物", "用藥安全", "洗手", "防疫", "流感", "傳染病", "口罩", "防溺", "戲水", "溺水", "救生衣", "食物保存", "保存期限", "交通", "過馬路", "網路安全", "個資", "颱風", "雷擊", "視力", "3010", "牙齒", "睡眠", "中暑", "運動傷害", "護脊", "姿勢", "書包", "身體", "常識"],
    icon: LifeBuoy,
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
