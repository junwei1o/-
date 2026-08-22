import type { RegionKey } from "@/game/rpgTypes";

export type AcademyRoute = {
  region: RegionKey;
  title: string;
  landmark: string;
  subject: "數學" | "自然" | "社會" | "國語";
  domain: string;
  questTitle: string;
  questSummary: string;
  objectives: [string, string, string];
  bossTitle: string;
  reward: string;
  gearId: string;
  color: string;
};

export type AcademyGear = {
  id: string;
  title: string;
  route: RegionKey;
  description: string;
  attackBonus: number;
  defenseBonus: number;
  captureBonus: number;
};

export const ACADEMY_ROUTES: AcademyRoute[] = [
  {
    region: "north",
    title: "潮汐算術港",
    landmark: "潮汐燈塔",
    subject: "數學",
    domain: "數與運算",
    questTitle: "修復潮汐刻度",
    questSummary: "用數感、計算與規律讀懂港灣的潮汐訊號。",
    objectives: ["完成一題任務演算", "累積 2 格答題能量", "挑戰潮線守門者"],
    bossTitle: "潮線守門者",
    reward: "答對可獲能量與精算徽記",
    gearId: "tide-abacus",
    color: "#2d8fa8",
  },
  {
    region: "central",
    title: "雲嶺實驗站",
    landmark: "風向塔",
    subject: "自然",
    domain: "科學探究",
    questTitle: "校準風向紀錄",
    questSummary: "觀察現象、提出假設，替山徑找回正確的實驗線索。",
    objectives: ["辨認一則科學線索", "完成觀察任務", "挑戰雲層守門者"],
    bossTitle: "雲層守門者",
    reward: "答對可獲能量與探究徽記",
    gearId: "wind-observer",
    color: "#609b5e",
  },
  {
    region: "east",
    title: "星海觀測原",
    landmark: "星圖平台",
    subject: "社會",
    domain: "人文與地理",
    questTitle: "拼回遷徙星圖",
    questSummary: "從地景、社群與時間線索，理解人與環境如何互相影響。",
    objectives: ["讀取一項人文線索", "完成星圖任務", "挑戰星路守門者"],
    bossTitle: "星路守門者",
    reward: "答對可獲能量與行旅徽記",
    gearId: "star-compass",
    color: "#725bb7",
  },
  {
    region: "south",
    title: "珊瑚故事灣",
    landmark: "故事貝殼館",
    subject: "國語",
    domain: "閱讀與表達",
    questTitle: "尋回散落篇章",
    questSummary: "從詞語、文本與觀點找出線索，讓島嶼故事再次被讀見。",
    objectives: ["找出一個文本線索", "完成閱讀任務", "挑戰篇章守門者"],
    bossTitle: "篇章守門者",
    reward: "答對可獲能量與閱讀徽記",
    gearId: "coral-quill",
    color: "#df785f",
  },
];

export const academyRouteFor = (region: RegionKey) =>
  ACADEMY_ROUTES.find((route) => route.region === region) ?? ACADEMY_ROUTES[0];

export const academyRouteForSubject = (subject?: string) =>
  ACADEMY_ROUTES.find((route) => route.subject === subject);

export const ACADEMY_GEAR: AcademyGear[] = [
  { id: "tide-abacus", title: "潮汐算盤徽記", route: "north", description: "穩定演算節奏，答題攻擊 +1。", attackBonus: 1, defenseBonus: 0, captureBonus: 0 },
  { id: "wind-observer", title: "風向觀測徽記", route: "central", description: "整理觀察線索，答題防禦 +1。", attackBonus: 0, defenseBonus: 1, captureBonus: 0 },
  { id: "star-compass", title: "星路羅盤徽記", route: "east", description: "辨識地景脈絡，捕捉機率 +4%。", attackBonus: 0, defenseBonus: 0, captureBonus: 4 },
  { id: "coral-quill", title: "珊瑚羽筆徽記", route: "south", description: "讀出篇章觀點，答題攻擊 +1、捕捉機率 +2%。", attackBonus: 1, defenseBonus: 0, captureBonus: 2 },
];

export const gearForRoute = (region: RegionKey) =>
  ACADEMY_GEAR.find((gear) => gear.route === region) ?? ACADEMY_GEAR[0];

export const academyGearBonuses = (gearIds: string[] = []) =>
  gearIds.reduce(
    (total, id) => {
      const gear = ACADEMY_GEAR.find((item) => item.id === id);
      return gear
        ? { attack: total.attack + gear.attackBonus, defense: total.defense + gear.defenseBonus, capture: total.capture + gear.captureBonus }
        : total;
    },
    { attack: 0, defense: 0, capture: 0 },
  );

export const academyObjectiveStatus = (correctAnswers = 0, bossVictories = 0) => [
  { label: "完成 1 題任務演算", complete: correctAnswers >= 1 },
  { label: "累積 3 題正確線索", complete: correctAnswers >= 3 },
  { label: "挑戰並突破守門者", complete: bossVictories >= 1 },
];

export const expeditionStage = (exploredCount: number) => {
  if (exploredCount >= ACADEMY_ROUTES.length) return { label: "星圖完成", detail: "四條學習路徑都已留下探索紀錄。" };
  if (exploredCount >= 2) return { label: "路徑延伸", detail: "你已能跨領域收集新的學習線索。" };
  if (exploredCount >= 1) return { label: "初次遠征", detail: "下一條路徑正等待你的觀察。" };
  return { label: "入學定位", detail: "從一條路徑開始，讓答題帶你前進。" };
};
