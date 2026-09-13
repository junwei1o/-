// 伴小星「雙腦」客戶端：
// ・規則腦：完全離線、零成本，用蘇格拉底式提問引導，永不直接給答案。
// ・LLM 腦：使用者在設定頁自填 OpenAI 相容代理（base/key/model），實際呼叫由後端
//   aiCompanion.reflect 代理（避開瀏覽器 CORS、做每分鐘限額）；任何失敗都降級規則腦。
// 代理設定只存本機 localStorage，不進雲端存檔、不夾帶姓名/學校/班級。
import { readStoredJson } from "@/utils/storage";

export type CompanionProxyConfig = {
  base: string;
  key: string;
  model: string;
};

const COMPANION_CONFIG_KEY = "companion-brain-config-v1";
export const DEFAULT_COMPANION_MODEL = "gpt-4o-mini";

export function loadCompanionConfig(): CompanionProxyConfig | null {
  const raw = readStoredJson<CompanionProxyConfig | null>(COMPANION_CONFIG_KEY, null);
  if (!raw || typeof raw !== "object") return null;
  const base = typeof raw.base === "string" ? raw.base.trim().replace(/\/+$/, "") : "";
  const key = typeof raw.key === "string" ? raw.key.trim() : "";
  if (!base || !key) return null;
  return {
    base,
    key,
    model: typeof raw.model === "string" ? raw.model.trim() : "",
  };
}

export function saveCompanionConfig(config: CompanionProxyConfig): void {
  localStorage.setItem(COMPANION_CONFIG_KEY, JSON.stringify({
    base: config.base.trim().replace(/\/+$/, ""),
    key: config.key.trim(),
    model: (config.model ?? "").trim(),
  }));
}

export function clearCompanionConfig(): void {
  localStorage.removeItem(COMPANION_CONFIG_KEY);
}

/** 規則腦反思所需的題目上下文（刻意不含任何學生個人資料）。 */
export type RuleReflectionInput = {
  question: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
  subject: string;
  learningTopic?: string;
  turn: "first" | "more";
};

type Template = (input: RuleReflectionInput) => string;

// 答錯・第一輪：對準「他選的」與「正解」的差異找線索。
const WRONG_FIRST_TEMPLATES: Template[] = [
  (i) => `先不急著看解答——你當初會選「${i.selectedAnswer}」，是注意到題目哪一句話呢？`,
  (i) => `我們一起比一比：「${i.correctAnswer}」和你選的「${i.selectedAnswer}」，你覺得最大差別在哪？`,
  () => `請你把題目從頭再讀一次，哪一個詞其實已經在偷偷提示你方向了？`,
  (i) => `如果要從選項裡先刪掉一個「最不可能」的，你會刪哪個？說說你的理由。`,
];

// 答對・第一輪：引導他說出自己的推理，把「猜對」變「真的會」。
const RIGHT_FIRST_TEMPLATES: Template[] = [
  () => `答對了！你能不能用自己的話說說看，為什麼這個選項是對的？`,
  () => `很好——這題你是抓住哪個關鍵才判斷出來的？說一個理由就好。`,
  () => `那你覺得出題老師放其他選項，是想誘導大家誤會什麼呢？`,
];

// 答錯・追問：換一個角度再深入一層。
const WRONG_MORE_TEMPLATES: Template[] = [
  () => `換個角度想：如果題目裡的一個條件改掉，你覺得答案會怎麼變？`,
  (i) => `回到「${i.correctAnswer}」，它必須滿足題目的哪個要求才會成立？`,
  () => `你能不能試著把這題的意思，用生活裡的例子講一遍給我聽？`,
];

// 答對・追問：遷移與類化。
const RIGHT_MORE_TEMPLATES: Template[] = [
  () => `如果把這題換個說法、數字換掉，你還會用同一個方法嗎？為什麼？`,
  () => `能不能舉一個生活中會用到這個觀念的狀況？`,
];

function stableIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function pickTemplate(templates: Template[], input: RuleReflectionInput): string {
  // 以題目＋輪次做穩定挑選：同一題同一輪每次出現一致的提問，不會亂跳。
  const index = stableIndex(`${input.subject}|${input.question}|${input.turn}`, templates.length);
  return templates[index]!(input);
}

/** 離線規則腦：回傳一句蘇格拉底提問（不給答案）。 */
export function buildRuleReflection(input: RuleReflectionInput): string {
  if (input.turn === "more") {
    return pickTemplate(input.correct ? RIGHT_MORE_TEMPLATES : WRONG_MORE_TEMPLATES, input);
  }
  return pickTemplate(input.correct ? RIGHT_FIRST_TEMPLATES : WRONG_FIRST_TEMPLATES, input);
}

export type CompanionBrainSource = "rule" | "proxy" | "builtin";

export const BRAIN_SOURCE_LABEL: Record<CompanionBrainSource, string> = {
  rule: "規則腦・離線",
  proxy: "你的 AI 代理",
  builtin: "內建學習模型",
};
