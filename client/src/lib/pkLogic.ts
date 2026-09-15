/**
 * 異步 PK 的純邏輯：邀請碼產生、計分、勝負判定。
 * 抽到獨立模組以便單元測試，不依賴資料庫或 React。
 */

/** 邀請碼字元集：排除易混淆的 0/O、1/I。 */
const PK_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePkCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += PK_CODE_ALPHABET[Math.floor(Math.random() * PK_CODE_ALPHABET.length)];
  }
  return code;
}

/** 答對題數換成 0–100 分（四捨五入）。total 必須為正。 */
export function computePkScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export type PkOutcome = "win" | "lose" | "draw";

/** 以「我」的視角判定 PK 結果。 */
export function decidePkOutcome(
  myName: string,
  initiatorName: string,
  initiatorScore: number,
  challengerScore: number,
): PkOutcome {
  if (initiatorScore === challengerScore) return "draw";
  const mine = myName === initiatorName ? initiatorScore : challengerScore;
  const theirs = myName === initiatorName ? challengerScore : initiatorScore;
  return mine > theirs ? "win" : "lose";
}

/** 規範化邀請碼：去空白、轉大寫。 */
export function normalizePkCode(code: string): string {
  return code.trim().toUpperCase();
}
