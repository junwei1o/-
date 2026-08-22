import type { BattleTactics } from "./battleTactics";
import type { BattleState } from "./rpgTypes";

type DefeatQuestion = {
  id?: string;
  subject?: string;
  learningTopic?: string;
  prompt?: string;
};

export type BattleDefeatReflection = Readonly<{
  title: string;
  strategy: string;
  readout: string;
  practice: { status: "available"; label: string; ariaLabel: string; readout: string } | { status: "unavailable"; message: string; readout: string };
}>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Produces a calm, evidence-based review from the final battle state without inventing progress or questions. */
export function buildBattleDefeatReflection(input: { battle: Pick<BattleState, "performance">; question: DefeatQuestion | null; tactics: Pick<BattleTactics, "actions"> | null }): BattleDefeatReflection {
  const topic = text(input.question?.learningTopic);
  const subject = text(input.question?.subject);
  const questionId = text(input.question?.id);
  const skill = input.tactics?.actions.find((action) => action.id === "skill");
  const actionHint = skill?.unavailable ? "先用基礎攻擊觀察節奏，累積能量後再啟動技能。" : skill ? `下次可先找關鍵線索，再決定是否啟動「${skill.label}」。` : "下次可先用基礎攻擊觀察節奏，再安排答題行動。";
  const performance = input.battle.performance;

  const strategy = performance?.correct
    ? topic ? `你已完成一次「${topic}」答題嘗試，並把答題守備帶進這場探索。${actionHint}` : `你已完成本場可驗證的答題嘗試。${actionHint}`
    : performance
      ? topic ? `你已為「${topic}」留下可回看的答題線索。先完成一題補強，再把題幹關鍵詞帶回下一場。` : `本場答題線索已保留在遠征紀錄。${actionHint}`
      : topic ? `這場準備題聚焦「${topic}」。先完成一題補強，再帶著熟悉線索回到競技場。` : `本場戰況已保留在遠征紀錄。${actionHint}`;

  if (!questionId || !subject || !topic) {
    const message = "目前尚無可驗證的本場題目可進行一題補強；你可以先重新整理線索，再回到下一次探索。";
    return { title: "把線索帶往下一場", strategy, readout: `${strategy} ${message}`, practice: { status: "unavailable", message, readout: message } };
  }

  const label = `進行「${topic}」一題補強`;
  return {
    title: "把線索帶往下一場",
    strategy,
    readout: `${strategy} 可以進行${subject}的${topic}一題補強。`,
    practice: { status: "available", label, ariaLabel: `開始${subject}的${topic}一題補強測驗`, readout: `現在開始${subject}的${topic}一題補強測驗。` },
  };
}
