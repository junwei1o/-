/**
 * variantOf 家族解析（單一真相模組）。
 *
 * 背景：`variantOf` 自 2026-10-25 起存在於前端精簡題庫
 * （`data/runtime_bank_elementary.json`，由 build-runtime-bank 白名單放行
 * ＋引用清洗保證零懸空）。兩種消費端都要讀它：
 * - `game/adaptiveScheduler.ts`（串接調度：答錯→同家族換外皮）
 * - `lib/targetedPractice.ts`（錯題備用題層 0：同家族變體優先）
 * 兩處若各寫一份解析，改一處漏一處（審查協議型 4：語意/實作矛盾
 * 的實證——同一 bug 曾在同構的兩處以不同方式潛伏）。故抽成共用模組。
 *
 * 欄位形状（老實說，全部來源只有兩種）：
 *   anchor 題：{ role:"anchor", kind:"variant", members:string[], groupSize:number, visibleSize?:number }
 *   variant 題：{ role:"variant", kind:"variant", anchor:string }
 * 其餘形状一律視為無家族（回傳空陣列）——髒資料不拋錯，優雅降級。
 */

/**
 * variantOf 標記的兩種合法形狀（S5 schema）。
 *
 * ⚠️ 與 `targetedPractice.ts` 的 `TargetedPracticeItem.variantOf`（string|null，
 * 語意是「這題是誰的變體」）**同名不同義**——備用庫欄位不可直接餵給
 * 本模組型別；解析函式有防呆，混用會被當成無家族而不是崩潰。
 */
export type VariantMarker =
  | { role: "anchor"; kind?: string; members: string[]; groupSize?: number; visibleSize?: number }
  | { role: "variant"; kind?: string; anchor: string };

export type VariantLike = { id: string; variantOf?: unknown };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/**
 * 解析出「該題的家族其他成員 id」（不含自己、只含 byId 查得到的）。
 *
 * - anchor 題 → members 清單（build 階段已裁剪為庫內可見者）。
 * - variant 題 → 錨點 ＋ 錨點 members 裡的兄弟（不含自己）。
 *   錨點優先排在最前：錨點是家族的「概念母題」，重練時它最正統。
 */
export function familySiblingIds(question: VariantLike, byId: ReadonlyMap<string, VariantLike>): string[] {
  const marker = asRecord(question.variantOf);
  if (!marker) return [];
  const isKnownId = (value: unknown): value is string => typeof value === "string" && byId.has(value);
  if (marker.role === "anchor" && Array.isArray(marker.members)) {
    return marker.members.filter(isKnownId);
  }
  if (marker.role === "variant" && isKnownId(marker.anchor)) {
    const anchorId = marker.anchor;
    const anchor = byId.get(anchorId)!;
    const anchorMarker = asRecord(anchor.variantOf);
    const siblings = Array.isArray(anchorMarker?.members) ? anchorMarker!.members.filter(isKnownId) : [];
    return [anchorId, ...siblings.filter((id) => id !== question.id)];
  }
  return [];
}

/** 題目是否帶可解析的家族標記（供呼叫端決定走家族路徑或降級）。 */
export function hasVariantFamily(question: VariantLike, byId: ReadonlyMap<string, VariantLike>): boolean {
  return familySiblingIds(question, byId).length > 0;
}
