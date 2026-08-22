import { calculateKnowledgeHeatmap, getSpacedReviewSummary, type AdaptiveProfile } from "@/game/adaptiveLearning";

export type KnowledgeIslandId = "math" | "science" | "social" | "language";
export type KnowledgeIslandSubject = "數學" | "自然" | "社會" | "國語";

export type KnowledgeIslandResource = {
  title: string;
  provider: string;
  url: string;
  kind: "課綱入口" | "互動學習" | "閱讀工具" | "探究資源";
};

export type KnowledgeIslandSnapshot = {
  id: KnowledgeIslandId;
  subject: KnowledgeIslandSubject;
  title: string;
  shortTitle: string;
  description: string;
  curriculumFocus: string;
  learningDirections: string[];
  resources: KnowledgeIslandResource[];
  attemptCount: number;
  /** 只由已觀察到的作答紀錄推導；尚無資料時保留 null，供地圖作非數字化視覺提示。 */
  accuracy: number | null;
  observedKnowledge: string[];
  recentReviewTopics: string[];
  dueReviewCount: number;
  unlocked: boolean;
};

const ISLAND_DEFINITIONS: ReadonlyArray<Omit<KnowledgeIslandSnapshot, "attemptCount" | "accuracy" | "observedKnowledge" | "recentReviewTopics" | "dueReviewCount" | "unlocked">> = [
  {
    id: "math",
    subject: "數學",
    title: "量與關係島",
    shortTitle: "數學",
    description: "把數字、圖形和規律連成可走的路。",
    curriculumFocus: "數與量、幾何、關係與資料：從生活情境讀懂數量，選擇表示與解題方法。",
    learningDirections: ["用估算與運算檢查結果", "從圖形特徵描述位置與變化", "整理資料並說出看見的規律"],
    resources: [
      { title: "子由數學小學堂", provider: "國立中央大學", url: "https://emath.math.ncu.edu.tw/e_school/", kind: "互動學習" },
      { title: "數學領域課程與教學資源", provider: "教育部 CIRN", url: "https://cloud.edu.tw/webpages/category.php?id=CD78753D-AC81-4FAC-B974-B5653ABA6E9D&page=1&num=12", kind: "課綱入口" },
      { title: "均一教育平台", provider: "均一教育平台", url: "https://www.junyiacademy.org/", kind: "互動學習" },
    ],
  },
  {
    id: "science",
    subject: "自然",
    title: "觀察實驗島",
    shortTitle: "自然",
    description: "從現象、證據和變化找到線索。",
    curriculumFocus: "探究與實作、物質與能量、生命與環境、地球與太空：先觀察，再提出可檢驗的想法。",
    learningDirections: ["區分觀察到的現象與自己的推論", "設計公平、可重複的比較", "用證據修正或支持解釋"],
    resources: [
      { title: "國小自然科學實驗數位平台", provider: "教育部教學資源網", url: "https://teachernet.moe.edu.tw/ele/page/6e0O7qYAKLDr", kind: "探究資源" },
      { title: "科學學習中心", provider: "國立自然科學博物館", url: "https://slc.nstm.gov.tw/home.aspx", kind: "探究資源" },
      { title: "自然科學領域課程與教學資源", provider: "教育部教育雲", url: "https://cloud.edu.tw/webpages/category.php?id=54BF066E-ACF3-4F61-8CE6-6EE260B51815&page=1&num=12", kind: "課綱入口" },
    ],
  },
  {
    id: "social",
    subject: "社會",
    title: "生活與地方島",
    shortTitle: "社會",
    description: "看看人、地方和規則如何互相影響。",
    curriculumFocus: "地理、歷史與公民：從臺灣地方生活理解人與環境的互動、時間脈絡與公共參與。",
    learningDirections: ["用地圖與資料描述地方特色", "把事件放回時間與脈絡理解", "聆聽不同觀點並提出有根據的想法"],
    resources: [
      { title: "社會領域課程與教學資源", provider: "教育部教育雲", url: "https://cloud.edu.tw/webpages/category.php?id=4BDB8B5A-A399-41C9-8AA0-BEAC52C5B680&page=1&num=12", kind: "課綱入口" },
      { title: "十二年國教課程綱要", provider: "國家教育研究院", url: "https://www.naer.edu.tw/PageSyllabus?fid=52", kind: "課綱入口" },
      { title: "教育雲數位學習入口", provider: "教育部教育雲", url: "https://cloud.edu.tw/", kind: "探究資源" },
    ],
  },
  {
    id: "language",
    subject: "國語",
    title: "閱讀表達島",
    shortTitle: "國語",
    description: "從文字裡找線索，也把想法說清楚。",
    curriculumFocus: "閱讀理解、寫作與口語表達：掌握文本訊息、觀點與證據，練習清楚回應真實情境。",
    learningDirections: ["找出段落主旨與關鍵詞", "分辨事實、感受與作者觀點", "用完整句子說明理由與連結"],
    resources: [
      { title: "教育部國語小字典", provider: "教育部", url: "https://dict.mini.moe.edu.tw/", kind: "閱讀工具" },
      { title: "國字筆順學習網", provider: "教育部國語推動委員會", url: "https://stroke-order.learningweb.moe.edu.tw/", kind: "閱讀工具" },
      { title: "臺灣台語語料庫應用檢索系統", provider: "國家教育研究院", url: "https://tggl.naer.edu.tw/", kind: "閱讀工具" },
    ],
  },
];

function recentKnowledge(profile: AdaptiveProfile, subject: KnowledgeIslandSubject) {
  return Array.from(new Set(
    profile.attempts
      .filter((attempt) => attempt.curriculumDomain === subject)
      .slice(-20)
      .flatMap((attempt) => attempt.knowledge.map((tag) => tag.trim()).filter(Boolean))
      .reverse(),
  )).slice(0, 3);
}

function recentReviewTopics(profile: AdaptiveProfile, subject: KnowledgeIslandSubject) {
  return Array.from(new Set(
    profile.attempts
      .filter((attempt) => attempt.curriculumDomain === subject)
      .slice()
      .sort((first, second) => second.timestamp - first.timestamp)
      .flatMap((attempt) => attempt.knowledge.map((tag) => tag.trim()).filter(Boolean)),
  )).slice(0, 3);
}

function subjectQuestionIds(profile: AdaptiveProfile, subject: KnowledgeIslandSubject) {
  return new Set(profile.attempts.filter((attempt) => attempt.curriculumDomain === subject).map((attempt) => attempt.questionId));
}

/** Converts only observed local learning records into neutral map-display data. */
export function buildKnowledgeIslandSnapshots(profile: AdaptiveProfile, now = Date.now()): KnowledgeIslandSnapshot[] {
  return ISLAND_DEFINITIONS.map((definition) => {
    const attempts = profile.attempts.filter((attempt) => attempt.curriculumDomain === definition.subject);
    const accuracy = attempts.length
      ? attempts.filter((attempt) => attempt.correct).length / attempts.length
      : null;
    const questionIds = subjectQuestionIds(profile, definition.subject);
    const dueReviewCount = getSpacedReviewSummary(profile, questionIds, now).dueCount;
    const observedKnowledge = recentKnowledge(profile, definition.subject);
    const heatmapTags = calculateKnowledgeHeatmap(profile, questionIds, 3).map((item) => item.tag);
    const recentTopics = recentReviewTopics(profile, definition.subject);

    return {
      ...definition,
      attemptCount: attempts.length,
      accuracy,
      observedKnowledge: Array.from(new Set([...observedKnowledge, ...heatmapTags])).slice(0, 3),
      recentReviewTopics: recentTopics,
      dueReviewCount,
      unlocked: attempts.length > 0,
    };
  });
}

export function subjectScopeFromSearch(search: string): KnowledgeIslandSubject | null {
  const subject = new URLSearchParams(search).get("subject");
  return ISLAND_DEFINITIONS.some((island) => island.subject === subject) ? subject as KnowledgeIslandSubject : null;
}
