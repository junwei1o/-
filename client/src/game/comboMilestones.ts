export type ComboMilestoneId = 5 | 10 | 15 | 20;

export type ComboMilestone = {
  combo: ComboMilestoneId;
  headline: string;
  detail: string;
  reward: string;
  tone: "blue" | "gold" | "rainbow" | "star";
};

export const COMBO_MILESTONE_DISPLAY_MS = 1_150;

const milestones: Record<ComboMilestoneId, ComboMilestone> = {
  5: { combo: 5, headline: "⚡ 5 連擊！氣勢如虹！", detail: "專注節奏讓本回合傷害提升。", reward: "本回合傷害 +10%", tone: "blue" },
  10: { combo: 10, headline: "🔥 10 連擊！無可匹敵！", detail: "穩定的理解化成了守護力量。", reward: "生命值 +10", tone: "gold" },
  15: { combo: 15, headline: "🌈 15 連擊！傳說降臨！", detail: "你的學習韌性足以照亮整片航線。", reward: "解鎖稱號：連擊大師", tone: "rainbow" },
  20: { combo: 20, headline: "⭐ 20 連擊！永恆傳說！", detail: "這段探索已留下閃耀的遠征紀錄。", reward: "金幣 +50", tone: "star" },
};

export function comboMilestoneFor(combo: number): ComboMilestone | null {
  return combo === 5 || combo === 10 || combo === 15 || combo === 20 ? milestones[combo] : null;
}
