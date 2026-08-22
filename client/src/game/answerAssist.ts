export type AnswerAssistResult = { eliminatedIndex: number; eliminatedLabel: string } | null;

export type KnowledgeWrongStreak = {
  knowledgeKey: string;
  count: number;
};

export type TutorPromptStage = "none" | "orientation" | "strategy" | "worked-example";

/**
 * 對每一題穩定選出一個非正解選項作為提示；不改寫題目、答案或選項順序。
 */
export function getEliminatedWrongOption(questionId: string, optionCount: number, correctIndex: number): AnswerAssistResult {
  if (!questionId || optionCount < 3 || correctIndex < 0 || correctIndex >= optionCount) return null;
  const candidates = Array.from({ length: optionCount }, (_, index) => index).filter((index) => index !== correctIndex);
  const checksum = Array.from(questionId).reduce((total, char) => total + char.charCodeAt(0), 0);
  const eliminatedIndex = candidates[checksum % candidates.length];
  return { eliminatedIndex, eliminatedLabel: String.fromCharCode(65 + eliminatedIndex) };
}

export function getKnowledgeKey(knowledge: readonly string[] | undefined, fallback = "未分類知識點"): string {
  const keys = (knowledge ?? []).map((item) => item.trim()).filter(Boolean);
  return keys.length > 0 ? Array.from(new Set(keys)).sort().join("｜") : fallback;
}

export function updateKnowledgeWrongStreak(current: KnowledgeWrongStreak | undefined, knowledge: readonly string[] | undefined, correct: boolean): KnowledgeWrongStreak {
  const knowledgeKey = getKnowledgeKey(knowledge);
  if (correct) return { knowledgeKey, count: 0 };
  return current?.knowledgeKey === knowledgeKey ? { knowledgeKey, count: current.count + 1 } : { knowledgeKey, count: 1 };
}

export function getTutorPromptStage(count: number): TutorPromptStage {
  if (count < 2) return "none";
  if (count === 2) return "orientation";
  if (count === 3) return "strategy";
  return "worked-example";
}

export function getTutorPromptCopy(stage: TutorPromptStage, knowledgeKey: string) {
  const topic = knowledgeKey || "這個知識點";
  if (stage === "orientation") return { title: "先停一下，重新找線索", message: `你連續兩次卡在「${topic}」。先找題目中的關鍵詞，再用自己的話說出它在問什麼。` };
  if (stage === "strategy") return { title: "換一條解題航線", message: `試著把「${topic}」拆成兩個小步驟：先辨認已知條件，再排除與條件矛盾的選項。需要時可以使用航圖透鏡。` };
  if (stage === "worked-example") return { title: "跟著一個小例子走", message: `這次先不要急著選答案。對照「${topic}」的定義，逐一檢查每個選項是否符合；完成後再回到題目作答。` };
  return { title: "學習提示", message: "先讀題，再找出最重要的線索。" };
}
