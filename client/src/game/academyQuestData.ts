import type { RegionKey } from "@/game/rpgTypes";

export type AcademyRoute = {
  region: RegionKey;
  title: string;
  landmark: string;
  subject: "數學" | "自然" | "社會" | "國語";
  domain: string;
  questTitle: string;
  questSummary: string;
  color: string;
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
    color: "#df785f",
  },
];

export const academyRouteFor = (region: RegionKey) =>
  ACADEMY_ROUTES.find((route) => route.region === region) ?? ACADEMY_ROUTES[0];

export const academyRouteForSubject = (subject?: string) =>
  ACADEMY_ROUTES.find((route) => route.subject === subject);

export const expeditionStage = (exploredCount: number) => {
  if (exploredCount >= ACADEMY_ROUTES.length) return { label: "星圖完成", detail: "四條學習路徑都已留下探索紀錄。" };
  if (exploredCount >= 2) return { label: "路徑延伸", detail: "你已能跨領域收集新的學習線索。" };
  if (exploredCount >= 1) return { label: "初次遠征", detail: "下一條路徑正等待你的觀察。" };
  return { label: "入學定位", detail: "從一條路徑開始，讓答題帶你前進。" };
};
