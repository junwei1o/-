import { useSyncExternalStore } from "react";
import { bxStore } from "@/game/bxStore";

/**
 * 訂閱 BX 強化層資料層。回傳版本號；版本變動時元件重渲染，
 * 元件內再以 bxStore.get(...) 讀取最新欄位（避免快照參考不穩定）。
 */
export function useBxVersion(): number {
  return useSyncExternalStore(bxStore.subscribe, bxStore.getRevision);
}
