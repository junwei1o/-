import React from "react";
import { X } from "lucide-react";
import { reflectionWorkspace } from "@/game/reflectionWorkspace";
import { useReflectionWorkspace } from "./useReflectionWorkspace";

/**
 * 伴小星工作台工具列（2026-09-30 簡化）：只保留「全部關閉」操作。
 * 已移除卡片主題／自訂色／排列切換／快照彈出選單——伴小星固定單一樣式，不再提供選項彈出。
 */
export function WorkspaceToolbar() {
  const ws = useReflectionWorkspace();
  if (ws.cards.length === 0) return null;

  return (
    <div className="rc-toolbar" role="toolbar" aria-label="深度伴讀卡片工作台">
      <div className="rc-toolbar-group" role="group" aria-label="卡片操作">
        <button type="button" className="rc-toolbar-btn rc-toolbar-closeall" onClick={() => reflectionWorkspace.closeAll()}>
          <X size={14} aria-hidden="true" />全部關閉（{ws.cards.length}）
        </button>
      </div>
    </div>
  );
}

export default WorkspaceToolbar;
