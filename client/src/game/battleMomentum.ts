export type BattleCrisisLevel = "safe" | "warning" | "critical";
export type EnemyPhase = "normal" | "enraged" | "desperate";

const CORRECT_ANSWER_LOG = /答對了！獲得 3 點能量/;
const INCORRECT_ANSWER_LOG = /答案需要再觀察一次/;

/**
 * Derives a readable safety signal without changing combat outcomes.
 * Invalid maximum HP values fall back to safe so legacy/corrupt saves do not create false alarms.
 */
export function getCrisisLevel(playerHp: number, playerMaxHp: number): BattleCrisisLevel {
  if (playerMaxHp <= 0) return "safe";
  const ratio = Math.max(0, playerHp) / playerMaxHp;
  if (ratio <= 0.3) return "critical";
  if (ratio <= 0.5) return "warning";
  return "safe";
}

/**
 * Counts the current consecutive correct curriculum answers from the battle narrative.
 * Non-answer battle messages intentionally preserve the last answer streak; an incorrect answer resets it.
 */
export function getComboCount(log: readonly string[]): number {
  return log.reduce((combo, entry) => {
    if (INCORRECT_ANSWER_LOG.test(entry)) return 0;
    if (CORRECT_ANSWER_LOG.test(entry)) return combo + 1;
    return combo;
  }, 0);
}

/**
 * Creates three stable enemy-pressure phases from existing HP only.
 * The thresholds are display-only and do not modify damage, rewards, or question selection.
 */
export function getEnemyPhase(enemyHp: number, enemyMaxHp: number): EnemyPhase {
  if (enemyMaxHp <= 0) return "normal";
  const ratio = Math.max(0, enemyHp) / enemyMaxHp;
  if (ratio <= 0.3) return "desperate";
  if (ratio <= 0.6) return "enraged";
  return "normal";
}
