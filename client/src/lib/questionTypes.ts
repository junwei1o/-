/**
 * 題型註冊表（全站設計依據的程式側單一真相）
 *
 * 對應文件：docs/question-types.md（**設計任何與題目相關的功能前先讀**）
 * 用途：
 *  - 程式碼可依 `implemented` / `autoGradable` 決定 UI 與計分行為，避免默默假設「全是選擇題」
 *  - 後續 AGENT 可 import 本表取得題型清單與其約束，不需硬編字串
 *
 * 維護規則：新增／修改題型時，本檔與 docs/question-types.md **必須同步更新**。
 */

/** 站上目前可出現的題型識別碼。 */
export type QuestionTypeId =
  | "single-choice"
  | "true-false"
  | "matching"
  | "fill-blank"
  | "short-answer"
  | "open-ended"
  | "passage-group"
  | "variant";

/** 正解形式——決定評分器怎麼比對。 */
export type AnswerShape =
  | "option-index" // options 的索引（0-based）
  | "boolean-index" // 是非題：options 長度 2，answer 為 0/1
  | "pair-set" // 配對：左項 ↔ 右項集合
  | "text-normalized" // 填空：需先正規化（全半形／空白／標點）再比對
  | "keyword-set" // 簡答：關鍵詞命中
  | "human-or-ai" // 申論：不可自動評分
  | "composite"; // 題組：依子題型

/** UI 互動型態——決定前端要用哪一組元件。 */
export type UiKind =
  | "option-list" // 選項清單（單選）
  | "binary-choice" // 兩選一
  | "pairing-board" // 配對板
  | "text-input" // 文字輸入
  | "textarea" // 長文字
  | "passage-with-subquestions" // 素材＋子題

/** 功能維度（對應 docs/question-types.md §2.5 支援矩陣的功能定義）。 */
export type FeatureId =
  | "出題"
  | "組卷"
  | "自動批改"
  | "錯題整理"
  | "排行榜"
  | "進度同步"
  | "AI導讀"
  | "難度分佈";

export const FEATURES: readonly FeatureId[] = [
  "出題",
  "組卷",
  "自動批改",
  "錯題整理",
  "排行榜",
  "進度同步",
  "AI導讀",
  "難度分佈",
] as const;

/** 支援程度：yes＝現在就能依賴；planned＝schema 已規劃未實作；conditional＝有條件；no＝不應支援。 */
export type FeatureSupport = "yes" | "planned" | "conditional" | "no";

export type QuestionTypeSpec = {
  id: QuestionTypeId;
  /** 站上實際使用的題型名稱（與題庫資料的 questionType 字串一致者標註） */
  label: string;
  /** 是否已實作（false＝僅規劃，設計時必須處理「尚未支援」的降級） */
  implemented: boolean;
  /** 是否可自動評分——**只有 true 的題型可計入正確率／排行榜／錯題魔王等自動化指標** */
  autoGradable: boolean;
  answerShape: AnswerShape;
  uiKind: UiKind;
  /** 題庫資料必填欄位（相對於共用欄位之外） */
  requiredFields: string[];
  /**
   * 現在就支援的功能（可依賴）。
   * 未列於 features/plannedFeatures/conditionalFeatures 者＝不應支援（no）。
   */
  features: FeatureId[];
  /** 已規劃、schema 就緒但尚未實作的功能（矩陣中的 🟡）。 */
  plannedFeatures?: FeatureId[];
  /** 有條件支援的功能（矩陣中的 ⚠️，例如「僅關鍵詞」「僅記錄」）。 */
  conditionalFeatures?: FeatureId[];
  /** 設計時最容易踩的坑 */
  pitfalls: string[];
  /** 相關實作檔案（相對 repo 根目錄） */
  files: string[];
};

/** 所有題型的規格。設計前先查這裡，再決定 UI 與計分。 */
export const QUESTION_TYPES: readonly QuestionTypeSpec[] = [
  {
    id: "single-choice",
    label: "選擇題",
    features: ["出題", "組卷", "自動批改", "錯題整理", "排行榜", "進度同步", "AI導讀", "難度分佈"],
    implemented: true,
    autoGradable: true,
    answerShape: "option-index",
    uiKind: "option-list",
    requiredFields: ["options", "answer"],
    pitfalls: [
      "正解位置必須隨機化，且不得與上次排列相同（用 forbidden 機制，勿以 question.id 當快取鍵）",
      "干擾項要是「合理的錯」，不是隨機字串",
    ],
    files: ["client/src/lib/questionBank.ts", "client/src/lib/optionRandomizer.ts"],
  },
  {
    id: "true-false",
    label: "是非題",
    features: ["出題", "組卷", "自動批改", "錯題整理", "排行榜", "進度同步", "AI導讀", "難度分佈"],
    implemented: true,
    autoGradable: true,
    answerShape: "boolean-index",
    uiKind: "binary-choice",
    requiredFields: ["options", "answer"],
    pitfalls: [
      "不得用「一定／永遠」等絕對化措辭製造陷阱",
      "是非題不做選項洗牌（避免空轉重擲）",
    ],
    files: ["client/src/lib/questionBank.ts", "client/src/lib/optionRandomizer.ts"],
  },
  {
    id: "matching",
    label: "配對題",
    features: ["出題", "組卷", "自動批改", "錯題整理", "排行榜", "進度同步", "AI導讀", "難度分佈"],
    implemented: true,
    autoGradable: true,
    answerShape: "pair-set",
    uiKind: "pairing-board",
    requiredFields: ["left", "right"],
    pitfalls: [
      "資料 schema 與選擇題不同——勿假設 options/answer 存在",
      "配對關係必須唯一，左右項不得有第二種合理解",
    ],
    files: ["client/src/lib/matchingBank.ts"],
  },
  {
    id: "fill-blank",
    label: "填空題",
    features: ["AI導讀"],
    plannedFeatures: ["出題", "組卷", "自動批改", "錯題整理", "排行榜", "進度同步", "難度分佈"],
    implemented: false,
    autoGradable: true,
    answerShape: "text-normalized",
    uiKind: "text-input",
    requiredFields: ["blanks"],
    pitfalls: [
      "必須先正規化：全形／半形、大小寫、前後空白、標點",
      "需 acceptAlternatives 容錯（異體字如 臺／台），並提供「答對卻被判錯」回報管道",
    ],
    files: [],
  },
  {
    id: "short-answer",
    label: "簡答題",
    features: ["AI導讀"],
    plannedFeatures: ["出題", "組卷"],
    conditionalFeatures: ["自動批改", "錯題整理", "進度同步"],
    implemented: false,
    autoGradable: false,
    answerShape: "keyword-set",
    uiKind: "text-input",
    requiredFields: ["answerKeywords", "minKeywords"],
    pitfalls: [
      "自動評分只是輔助，UI 必須明確標示，且分數應為區間",
      "不懲罰錯字以外的表達差異",
    ],
    files: [],
  },
  {
    id: "open-ended",
    label: "申論・開放題",
    features: ["AI導讀"],
    plannedFeatures: ["出題"],
    conditionalFeatures: ["進度同步"],
    implemented: false,
    autoGradable: false,
    answerShape: "human-or-ai",
    uiKind: "textarea",
    requiredFields: [],
    pitfalls: [
      "**不可**出現在排行榜／限時挑戰等即時計分場景",
      "**不得**計入正確率等自動化指標（會污染數據）",
      "若送 AI 產生回饋，內容不得含姓名／學校／班級",
    ],
    files: [],
  },
  {
    id: "passage-group",
    label: "題組題",
    features: ["AI導讀"],
    conditionalFeatures: ["出題", "組卷", "自動批改", "錯題整理", "排行榜", "進度同步", "難度分佈"],
    implemented: false,
    autoGradable: true,
    answerShape: "composite",
    uiKind: "passage-with-subquestions",
    requiredFields: ["passage", "subQuestions"],
    pitfalls: [
      "子題必須可獨立作答，不依賴前一子題答案",
      "素材不得包含子題答案；組卷時同組子題不可拆散",
    ],
    files: ["client/src/lib/paperExam.ts"],
  },
  {
    id: "variant",
    label: "變體題",
    features: ["自動批改", "錯題整理", "排行榜", "進度同步", "AI導讀", "難度分佈"],
    plannedFeatures: ["出題", "組卷"],
    implemented: false,
    autoGradable: true,
    answerShape: "option-index",
    uiKind: "option-list",
    requiredFields: ["variantOf", "variantKind"],
    pitfalls: [
      "變體必須改變考察角度，不是換句話說",
      "防污染：同 variantOf 的變體不可同時出現在同一份試卷",
      "反向題（問「何者錯誤」）需明確標記",
    ],
    files: [],
  },
] as const;

/** 已實作的題型。 */
export const IMPLEMENTED_QUESTION_TYPES = QUESTION_TYPES.filter((t) => t.implemented);

/** 可計入自動化指標（正確率／排行榜／錯題本）的題型。 */
export const AUTO_GRADABLE_QUESTION_TYPES = QUESTION_TYPES.filter((t) => t.autoGradable);

export function questionTypeById(id: QuestionTypeId): QuestionTypeSpec | undefined {
  return QUESTION_TYPES.find((t) => t.id === id);
}

/** 題庫資料使用的 questionType 字串 → 註冊表 id（目前資料僅有兩種）。 */
export function questionTypeIdFromBankLabel(label: string): QuestionTypeId | undefined {
  if (label === "選擇題") return "single-choice";
  if (label === "是非題") return "true-false";
  return undefined;
}

/**
 * 查詢某題型對某功能的支援程度。
 * 設計功能時用它判斷，**不要自己重新推導支援矩陣**。
 *
 * @example
 * supportsFeature("short-answer", "排行榜") // => "no"（該題不計分，UI 須標示）
 * supportsFeature("fill-blank", "自動批改") // => "planned"（schema 已定案，尚未實作）
 */
export function supportsFeature(typeId: QuestionTypeId, feature: FeatureId): FeatureSupport {
  const spec = questionTypeById(typeId);
  if (!spec) return "no";
  if (spec.features.includes(feature)) return "yes";
  if (spec.plannedFeatures?.includes(feature)) return "planned";
  if (spec.conditionalFeatures?.includes(feature)) return "conditional";
  return "no";
}

/** 某功能現在就能支援的題型（設計功能的抽題池時使用）。 */
export function typesSupporting(feature: FeatureId): QuestionTypeId[] {
  return QUESTION_TYPES.filter((t) => t.features.includes(feature)).map((t) => t.id);
}
