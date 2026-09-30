/**
 * 科目適配層（Subject Config）
 *
 * 為什麼需要：`StudentDiagnosis` 的核心演算法是通用的，但**每科的「不會」長得不一樣**——
 *   數學＝技能缺口、自然＝概念誤解、英語＝技能落差（認讀 vs 拼寫）、
 *   社會＝記憶 vs 理解、國語＝理解層次（字面 vs 推論 vs 批判）。
 * 本檔把這些差異**宣告化**，讓診斷與出題能按科目調整，而不必改核心演算法。
 *
 * ⚠️ 三個必須遵守的約束（皆為實際踩過的坑）：
 *  1. **科目字串必須與題庫一致**：`數學／自然／社會／國語／英語`
 *     （題庫與知識島都用這五個；「國語文」不是有效值，查不到）
 *  2. **不要放假的 extractor**：需要題目額外標籤的維度，標 `status: "needs-question-tags"`
 *     並寫明需要什麼標籤——**回傳 0 的佔位實作比沒有更糟**（看起來能用，實際靜默失真）
 *  3. **可自動評分的題型以 `questionTypes.ts` 為準**（見 docs/question-types.md §3 矩陣），
 *     不要在本檔重新列一份會漂移的清單
 */

import { QUESTION_TYPES, type QuestionTypeId } from "@/lib/questionTypes";

/** 站上五個科目（與題庫、知識島的 subject 字串一致）。 */
export type SubjectName = "數學" | "自然" | "社會" | "國語" | "英語";

export const SUBJECTS: readonly SubjectName[] = ["數學", "自然", "社會", "國語", "英語"] as const;

/**
 * 診斷維度：宣告「這一科除了知識點之外，還要看什麼」。
 * - `available`：資料已具備（例如由題型推導）
 * - `needs-question-tags`：需要題庫先補標籤，才能計算
 */
export type DiagnosisDimension = {
  /** 維度名稱（顯示用） */
  name: string;
  /** 這個維度要回答的問題 */
  question: string;
  /** 資料來源 */
  source: "question-type" | "question-tags";
  /** 若 source 為 question-tags，需要題庫補上哪些標籤 */
  requiredTags?: string[];
  status: "available" | "needs-question-tags";
};

export type SubjectConfig = {
  subject: SubjectName;
  /** 知識點粒度：fine＝技能/子概念可再切；medium＝概念層；coarse＝大主題 */
  knowledgeGranularity: "fine" | "medium" | "coarse";
  /** 本科可自動評分的題型（交叉引用 questionTypes 註冊表） */
  autoGradableTypes: readonly QuestionTypeId[];
  /** 是否支援部分給分（多步驟題） */
  partialCredit: boolean;
  /** 是否需要記錄錯誤類型（不只對錯） */
  errorTypeTracking: boolean;
  /** 本科特有的診斷維度（宣告式，不含假實作） */
  extraDimensions: readonly DiagnosisDimension[];
  /** 這科的「不會」長什麼樣子——給 Agent 設計題目與診斷時的一句話提醒 */
  failureShape: string;
};

/**
 * 由題型註冊表推導「現在就能自動評分的題型」——避免本檔維護第二份會漂移的清單。
 * 條件同時要求 autoGradable **且** implemented：尚未實作的題型不會有作答紀錄，
 * 列進來只會誤導（語意對齊 questionTypes 的四態：yes 才算）。
 * fill-blank 實作後會自動納入，無需改本檔。
 */
const ALL_AUTO_GRADABLE_TYPES: readonly QuestionTypeId[] = QUESTION_TYPES.filter(
  (t) => t.autoGradable && t.implemented,
).map((t) => t.id);

/** 由題型註冊表推導「可組卷題型」。 */
const PAPER_ELIGIBLE_TYPES: readonly QuestionTypeId[] = QUESTION_TYPES.filter((t) =>
  t.features.includes("組卷"),
).map((t) => t.id);

export const SUBJECT_CONFIGS: Record<SubjectName, SubjectConfig> = {
  數學: {
    subject: "數學",
    knowledgeGranularity: "fine",
    autoGradableTypes: ALL_AUTO_GRADABLE_TYPES,
    partialCredit: true,
    errorTypeTracking: true,
    extraDimensions: [
      {
        name: "運算步驟",
        question: "錯在概念、進位、通分，還是計算疏忽？",
        source: "question-tags",
        requiredTags: ["errorType"],
        status: "needs-question-tags",
      },
    ],
    failureShape: "技能缺口——不會就是不會，可細分到步驟",
  },
  自然: {
    subject: "自然",
    knowledgeGranularity: "medium",
    autoGradableTypes: PAPER_ELIGIBLE_TYPES,
    partialCredit: false,
    errorTypeTracking: false,
    extraDimensions: [
      {
        name: "因果推理",
        question: "是記住結論，還是能推理因果？",
        source: "question-tags",
        requiredTags: ["reasoningLevel"],
        status: "needs-question-tags",
      },
    ],
    failureShape: "概念誤解——既有 knowledge 標籤已足夠描述",
  },
  社會: {
    subject: "社會",
    knowledgeGranularity: "medium",
    // 社會科目前以選擇／是非／配對為主；填空題上線後再納入
    autoGradableTypes: ["single-choice", "true-false", "matching"],
    partialCredit: false,
    errorTypeTracking: false,
    extraDimensions: [
      {
        name: "知識類型",
        question: "是事實記憶，還是概念理解？",
        source: "question-tags",
        requiredTags: ["knowledgeKind"],
        status: "needs-question-tags",
      },
    ],
    failureShape: "記憶 vs 理解——需先區分題目類型，否則診斷會混在一起",
  },
  國語: {
    subject: "國語",
    knowledgeGranularity: "fine",
    autoGradableTypes: PAPER_ELIGIBLE_TYPES,
    partialCredit: false,
    errorTypeTracking: true,
    extraDimensions: [
      {
        name: "理解層次",
        question: "是字面理解、推論理解，還是批判理解？",
        source: "question-tags",
        requiredTags: ["comprehensionLevel"],
        status: "needs-question-tags",
      },
    ],
    failureShape: "理解層次——同一道閱讀題可能同時考三種層次，不可混算",
  },
  英語: {
    subject: "英語",
    knowledgeGranularity: "medium",
    autoGradableTypes: PAPER_ELIGIBLE_TYPES,
    partialCredit: false,
    errorTypeTracking: true,
    extraDimensions: [
      {
        name: "語言技能",
        question: "認讀、拼寫，還是應用？",
        // 由題型推導：單選→認讀、填空→拼寫、簡答→應用（資料已具備，無需新標籤）
        source: "question-type",
        status: "available",
      },
    ],
    failureShape: "技能落差——認得但寫不出來是常態，單看正確率會掩蓋落差",
  },
};

/** 未知科目時的保守預設（不支援部分給分、只認已實作題型）。 */
export const DEFAULT_SUBJECT_CONFIG: SubjectConfig = {
  subject: "自然",
  knowledgeGranularity: "medium",
  autoGradableTypes: ["single-choice", "true-false", "matching"],
  partialCredit: false,
  errorTypeTracking: false,
  extraDimensions: [],
  failureShape: "未設定科目——採保守預設，請補 SUBJECT_CONFIGS",
};

/** 取得科目設定；未知科目回傳保守預設（不丟錯）。 */
export function subjectConfigFor(subject: string): SubjectConfig {
  return (SUBJECT_CONFIGS as Record<string, SubjectConfig | undefined>)[subject] ?? DEFAULT_SUBJECT_CONFIG;
}

/**
 * 某科目下，某題型是否可自動評分（可計入正確率／排行榜／診斷）。
 * 這是 docs/question-types.md §3 矩陣在「科目」維度上的落實。
 */
export function isAutoGradable(subject: string, questionType: string): boolean {
  return subjectConfigFor(subject).autoGradableTypes.includes(questionType as QuestionTypeId);
}

/** 英語的語言技能映射（由題型推導，資料已具備）。 */
export type EnglishSkill = "recognition" | "spelling" | "application";

export function englishSkillOf(questionType: string): EnglishSkill {
  if (questionType === "fill-blank") return "spelling";
  if (questionType === "short-answer" || questionType === "open-ended") return "application";
  return "recognition";
}

/** 本科尚未實作的診斷維度（設計新功能前先看這裡，避免做出算不出來的指標）。 */
export function pendingDimensions(subject: string): readonly DiagnosisDimension[] {
  return subjectConfigFor(subject).extraDimensions.filter((d) => d.status === "needs-question-tags");
}
