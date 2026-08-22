import {
  calculateAdaptiveReport,
  calculateKnowledgeHeatmap,
  getSpacedReviewSummary,
  type AdaptiveProfile,
} from "./adaptiveLearning";

export type TodayLearningGuideKind = "due-review" | "knowledge-focus" | "first-step" | "steady-practice";

export type TodayLearningGuide = {
  kind: TodayLearningGuideKind;
  eyebrow: string;
  title: string;
  description: string;
  reason: string;
  /** 僅描述完成後會實際寫入的學習足跡，不預先承諾答對或獎勵。 */
  progressPreview: string;
  actionLabel: string;
};

/**
 * 以真正的本機學習紀錄產生一個可解釋的今日起點。
 * 優先順序：已到期錯題 → 有重複觀測的待複習知識點 → 尚未作答 → 維持穩定練習。
 */
export function getTodayLearningGuide(profile: AdaptiveProfile, now = Date.now()): TodayLearningGuide {
  const reviewSummary = getSpacedReviewSummary(profile, undefined, now);
  if (reviewSummary.dueCount > 0) {
    return {
      kind: "due-review",
      eyebrow: "TODAY'S BEST START",
      title: "先收回待複習的記憶",
      description: `有 ${reviewSummary.dueCount} 題曾經答錯的題目已到複習時間。先用短短一回合把它們找回來。`,
      reason: "這是依你先前的實際作答與間隔複習排程整理，不代表能力評價。",
      progressPreview: "完成後，這張試卷的實際作答會更新複習排程；答對會延後下次複習，答錯也會重新安排。",
      actionLabel: "開始複習試卷",
    };
  }

  const heatmap = calculateKnowledgeHeatmap(profile);
  const reviewKnowledge = heatmap.find((item) => item.status === "review");
  if (reviewKnowledge) {
    return {
      kind: "knowledge-focus",
      eyebrow: "TODAY'S BEST START",
      title: `先練習「${reviewKnowledge.tag}」`,
      description: `這個知識點已累積 ${reviewKnowledge.attempts} 次實際作答，目前掌握度是 ${reviewKnowledge.mastery}%。從這裡開始，可以讓下一次更穩定。`,
      reason: "只有已觀測至少一次的作答紀錄才會形成建議；尚未練習的內容不會被當成弱項。",
      progressPreview: "完成後，這張試卷的每一題都會留下新的掌握度觀測；是否提升仍以實際作答結果決定。",
      actionLabel: "開始重點試卷",
    };
  }

  const report = calculateAdaptiveReport(profile);
  if (report.attempts === 0) {
    return {
      kind: "first-step",
      eyebrow: "TODAY'S FIRST STEP",
      title: "從一張綜合試卷開始",
      description: "先完成幾題數學、自然、社會或國語題，地圖就會慢慢辨認出你下一步最適合的方向。",
      reason: "目前還沒有本機作答紀錄，所以這是中性的起始建議，不是能力判斷。",
      progressPreview: "完成後，這張試卷的實際作答會成為地圖的第一批學習足跡，下一次建議就能更貼近你的紀錄。",
      actionLabel: "開始第一張試卷",
    };
  }

  return {
    kind: "steady-practice",
    eyebrow: "TODAY'S BEST START",
    title: "維持節奏，挑戰一張新試卷",
    description: `你已留下 ${report.attempts} 次真實作答紀錄，目前沒有到期複習題。用一張短試卷延續今天的學習節奏吧。`,
    reason: "建議會在每次重新開啟地圖時依這台裝置上的最新紀錄更新。",
    progressPreview: "完成後，這張試卷的實際作答會加入學習地圖；答對題目才會推進夥伴與探索進度。",
    actionLabel: "開始常規試卷",
  };
}
