export type ObservatoryCategory = "親子動畫" | "特攝英雄";

export type ObservatoryEntry = {
  key: string;
  title: "我是奶龍" | "奧特曼" | "假面騎士";
  category: ObservatoryCategory;
  era: string;
  palette: string;
  shortDescription: string;
  observation: string;
  learning: string;
  worldviewTitle: string;
  worldview: string;
  learningPaths: string[];
  officialSourceUrl: string;
  officialLabel: string;
};

/**
 * 觀測站只保存原創摘要與學習提示，不儲存劇照、台詞、劇情逐字稿或非授權媒體。
 */
export const OBSERVATORY_ENTRIES: ObservatoryEntry[] = [
  {
    key: "nailong",
    title: "我是奶龍",
    category: "親子動畫",
    era: "日常成長觀測",
    palette: "yellow",
    shortDescription: "從溫暖日常、好奇提問與朋友互動出發，觀察一件小事如何成為成長的冒險。",
    observation: "留意角色怎麼說出感受、怎麼向朋友求助，以及如何從失敗裡再試一次。",
    learning: "擴展知識：情緒表達、生活觀察、互助與勇敢提問。",
    worldviewTitle: "把小日子變成好奇實驗室",
    worldview: "這是一個從日常情境出發的溫暖想像世界。當角色遇到疑問、挫折或新朋友時，可以用提問、陪伴與嘗試，把原本不確定的小事變成一起完成的任務。",
    learningPaths: ["國語：用三個詞說清楚今天遇到的問題。", "社會：想想朋友、家人與社區如何互相照顧。", "自然：從食物、天氣或生活小現象練習觀察。"],
    officialSourceUrl: "https://www.nailoong.com/ipStar/Nailong/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "ultraman",
    title: "奧特曼",
    category: "特攝英雄",
    era: "巨大英雄觀測",
    palette: "coral",
    shortDescription: "從巨大化、光與城市防衛的想像，觀察英雄如何面對未知威脅與守護選擇。",
    observation: "留意尺度變化、城市空間、隊伍分工與保護他人的選擇。",
    learning: "擴展知識：尺度、能量、公共安全與環境想像。",
    worldviewTitle: "從遙遠宇宙到共同守護的城市",
    worldview: "這個世界以宇宙探索、未知來訪與城市防衛作為想像舞台。英雄不只是力量的象徵，也讓人思考面對危機時，資訊、合作與保護他人的行動如何連在一起。",
    learningPaths: ["自然：用能量與光的概念提出一個可驗證的問題。", "數學：比較巨大尺度、距離與地圖上的位置。", "社會：討論公共安全需要哪些分工與準備。"],
    officialSourceUrl: "https://www.ultramanconnection.com/pages/universe/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "kamen-rider",
    title: "假面騎士",
    category: "特攝英雄",
    era: "變身英雄觀測",
    palette: "tidal",
    shortDescription: "以變身、裝備與夥伴關係，拆解英雄身份、代價與責任的故事語法。",
    observation: "比較不同形態的功能、限制與角色在關鍵時刻的選擇。",
    learning: "擴展知識：科技設計、責任、選擇與公共守護。",
    worldviewTitle: "科技裝備與責任選擇",
    worldview: "這個世界把裝備、技術與身份轉變放在一起思考：當工具讓人更有能力時，也需要面對限制、後果與如何使用力量的選擇。",
    learningPaths: ["自然：從材料、能量與功能推測一項裝備的設計目的。", "社會：討論能力、權利與責任如何互相平衡。", "國語：區分作品明示的線索與自己的推論。"],
    officialSourceUrl: "https://www.kamen-rider-official.com/series/",
    officialLabel: "官方作品資訊",
  },
];

export const OBSERVATORY_CATEGORIES: Array<ObservatoryCategory | "全部"> = ["全部", "親子動畫", "特攝英雄"];

export function getObservatoryEntry(key: string | undefined) {
  return OBSERVATORY_ENTRIES.find((entry) => entry.key === key) ?? null;
}
