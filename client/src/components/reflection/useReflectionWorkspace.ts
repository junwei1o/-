import { useSyncExternalStore } from "react";
import { reflectionWorkspace } from "@/game/reflectionWorkspace";

/**
 * 訂閱深度伴讀卡片工作台；store 每次變動都回傳同一個 state 參考（immutable update），
 * 因此可直接作為 useSyncExternalStore 的快照。
 */
export function useReflectionWorkspace() {
  return useSyncExternalStore(
    reflectionWorkspace.subscribe,
    reflectionWorkspace.getState,
    reflectionWorkspace.getState,
  );
}
