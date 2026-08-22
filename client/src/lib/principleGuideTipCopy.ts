import type { PrincipleGuideFirstUseTip } from "@/lib/principleGuideFirstUseTips";
import type { StudentGradePreference } from "@/lib/studentGradePreference";

export type PrincipleGuideTipSubject = "mathematics" | "science" | "science-inquiry" | "social" | "language";

type TipCopyLevel = "lower" | "upper" | "neutral";

type StrategySupport = "visual" | "knowledge";

const LOWER_GRADE_COPY: Record<PrincipleGuideFirstUseTip, string> = {
  visual: "如何使用：先選一個你想看的線索，再回題目找找看它有沒有出現。這是在整理想法，不會告訴你答案。",
  knowledge: "如何使用：先開一張概念小卡，讀一個重點，再回題目找相同的線索。概念卡不會告訴你答案。",
};

const UPPER_GRADE_COPY: Record<PrincipleGuideFirstUseTip, string> = {
  visual: "如何使用：先選擇一項可驗證的圖像線索，說明它與題幹條件的關係，再檢查自己的推論是否一致。這只協助整理證據，不會提供正確答案。",
  knowledge: "如何使用：開啟一張概念卡，辨識可連回題幹的關鍵概念，再檢查它是否符合題目條件。概念卡用於補強原理，不會提供本題正確答案。",
};

const NEUTRAL_COPY: Record<PrincipleGuideFirstUseTip, string> = {
  visual: "如何使用：先選一個想觀察的線索，再回到題幹檢查它是否有幫助。這是整理想法，不會提供正確答案。",
  knowledge: "如何使用：開啟一張概念卡，讀一個關鍵句後再回來連結題幹。概念卡不會提供本題正確答案。",
};

const SUBJECT_STRATEGIES: Record<PrincipleGuideTipSubject, Record<PrincipleGuideFirstUseTip, Record<TipCopyLevel, string>>> = {
  mathematics: {
    visual: {
      lower: "數學觀察策略：先看題目給了哪些數字、單位或圖形，再找它們怎麼互相有關。",
      upper: "數學觀察策略：先辨識已知量、單位與關係，並確認圖像表示是否符合題幹條件。",
      neutral: "數學觀察策略：先標出題目的量、單位與關係，再回到題幹核對。",
    },
    knowledge: {
      lower: "數學觀察策略：先找概念卡裡的規則，再回題目看看哪個條件可以用上。",
      upper: "數學觀察策略：先辨識概念卡中的規則與適用條件，再檢查能否連回題幹的量或關係。",
      neutral: "數學觀察策略：先讀出概念卡中的規則與條件，再連回題幹檢查。",
    },
  },
  science: {
    visual: {
      lower: "自然觀察策略：先看發生什麼，再找題目說了哪些條件或變化。",
      upper: "自然觀察策略：先區分現象、條件與證據，再檢查線索能否支持你的推論。",
      neutral: "自然觀察策略：先分開看現象、條件與證據，再回題幹核對。",
    },
    knowledge: {
      lower: "自然觀察策略：先找概念卡裡說的原因，再回題目看有沒有相同的現象。",
      upper: "自然觀察策略：先用概念卡辨識現象背後的可能機制，再用題幹中的可觀測證據回查。",
      neutral: "自然觀察策略：先把概念卡的原因和題幹現象連起來，再檢查證據。",
    },
  },
  "science-inquiry": {
    visual: {
      lower: "自然探究策略：先看要記錄什麼，再想想哪些條件要一樣、哪些可以比較。",
      upper: "自然探究策略：先辨識變因、可量測資料與重複觀測的需要，再檢查證據是否足夠。",
      neutral: "自然探究策略：先列出可量測資料與比較條件，再回題幹檢查。",
    },
    knowledge: {
      lower: "自然探究策略：先讀概念卡的觀測方法，再回題目找可以記錄或比較的地方。",
      upper: "自然探究策略：先確認概念卡中的量測、控制條件與重複檢查方式，再連回題幹資料。",
      neutral: "自然探究策略：先讀出概念卡中的量測與比較方法，再連回題幹。",
    },
  },
  social: {
    visual: {
      lower: "社會觀察策略：先分清楚誰、在哪裡、發生了什麼，再找題目給的線索。",
      upper: "社會觀察策略：先分辨角色、時間、地點與資料來源，再檢查不同觀點之間的關係。",
      neutral: "社會觀察策略：先整理人物、情境與資料來源，再回題幹核對。",
    },
    knowledge: {
      lower: "社會觀察策略：先讀概念卡的一個重點，再回題目找相同的人物或情境。",
      upper: "社會觀察策略：先辨識概念卡的背景、觀點與因果關係，再連回題幹中的資料。",
      neutral: "社會觀察策略：先讀概念卡中的背景與觀點，再回題幹比對。",
    },
  },
  language: {
    visual: {
      lower: "語文觀察策略：先找題目裡的重要詞，再看看前後句怎麼連起來。",
      upper: "語文觀察策略：先辨識關鍵詞、語境與前後文關係，再檢查推論是否有文本依據。",
      neutral: "語文觀察策略：先標出關鍵詞與前後文關係，再回題幹核對。",
    },
    knowledge: {
      lower: "語文觀察策略：先讀概念卡的一個重點，再回題目找能支持它的句子。",
      upper: "語文觀察策略：先辨識概念卡中的閱讀策略，再用題幹的字詞與句子檢查理解。",
      neutral: "語文觀察策略：先讀概念卡的閱讀重點，再回題幹找文本線索。",
    },
  },
};

const getTipCopyLevel = (grade: StudentGradePreference): TipCopyLevel => {
  if (grade === null) return "neutral";
  return grade <= 4 ? "lower" : "upper";
};

export function getPrincipleGuideFirstUseTipCopy(
  tip: PrincipleGuideFirstUseTip,
  grade: StudentGradePreference,
  subject: PrincipleGuideTipSubject = "science",
): string {
  const level = getTipCopyLevel(grade);
  const baseCopy = level === "lower" ? LOWER_GRADE_COPY[tip] : level === "upper" ? UPPER_GRADE_COPY[tip] : NEUTRAL_COPY[tip];
  return `${baseCopy} ${SUBJECT_STRATEGIES[subject][tip][level]}`;
}

export function getPrincipleGuideStrategyRecap(
  grade: StudentGradePreference,
  subject: PrincipleGuideTipSubject = "science",
  usedSupports: StrategySupport[] = [],
): { title: string; summary: string; nextStep: string } {
  const level = getTipCopyLevel(grade);
  const supports = usedSupports.length > 0 ? usedSupports : (["visual", "knowledge"] as StrategySupport[]);
  const strategyLines = supports.map((support) => SUBJECT_STRATEGIES[subject][support][level]);
  const supportLabel = usedSupports.length > 0
    ? `你剛剛運用了${usedSupports.includes("visual") ? "圖像線索" : ""}${usedSupports.length === 2 ? "和" : ""}${usedSupports.includes("knowledge") ? "原理概念卡" : ""}來整理想法。`
    : "你剛剛完成了這一輪的作答，也可以把圖像線索或原理概念卡帶到下一題。";

  return {
    title: "把剛才的觀察帶到下一題",
    summary: `${supportLabel} ${strategyLines.join(" ")}`,
    nextStep: level === "lower"
      ? "下一題也可以先找一個線索，再慢慢想一想。"
      : level === "upper"
        ? "下一題可先寫下最關鍵的條件，再用可觀察的證據檢查推論。"
        : "下一題可先標出線索，再回題幹核對自己的想法。",
  };
}
