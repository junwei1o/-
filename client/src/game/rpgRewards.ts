export type AnswerRewardInput = { eventId: string; correct: boolean; secondsLeft?: number; streak?: number };
export type AnswerReward = { energy: number; coins: number; label: string };

export function rewardForAnswer(input: AnswerRewardInput): AnswerReward {
  if (!input.correct) return { energy: 1, coins: 1, label: "完成觀察：獲得 1 能量與 1 金幣" };
  const speedBonus = input.secondsLeft && input.secondsLeft >= 15 ? 1 : 0;
  const streakBonus = input.streak && input.streak >= 3 ? 1 : 0;
  const energy = 3 + speedBonus + streakBonus;
  const coins = 4 + (input.streak && input.streak >= 5 ? 2 : 0);
  return { energy, coins, label: `答對獎勵：+${energy} 能量、+${coins} 金幣` };
}

export function hasRewardedEvent(answeredEventIds: string[], eventId: string) {
  return answeredEventIds.includes(eventId);
}
