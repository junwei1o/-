import React, { useState } from "react";
import { Camera, LayoutGrid, Layers, Trash2, X } from "lucide-react";
import {
  CARD_THEMES,
  CUSTOM_ACCENTS,
  reflectionWorkspace,
  type CardThemeId,
} from "@/game/reflectionWorkspace";
import { useReflectionWorkspace } from "./useReflectionWorkspace";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 快照彈窗：佈局或主題各自的保存／還原／刪除清單。 */
function SnapshotMenu({ kind }: { kind: "layout" | "theme" }) {
  const ws = useReflectionWorkspace();
  const [open, setOpen] = useState(false);
  const snapshots = kind === "layout" ? ws.layoutSnapshots : ws.themeSnapshots;
  const isLayout = kind === "layout";

  function save() {
    if (isLayout) reflectionWorkspace.saveLayoutSnapshot(`佈局 ${formatTime(Date.now())}`);
    else reflectionWorkspace.saveThemeSnapshot(`主題 ${formatTime(Date.now())}`);
  }
  function restore(id: string) {
    if (isLayout) reflectionWorkspace.restoreLayoutSnapshot(id);
    else reflectionWorkspace.restoreThemeSnapshot(id);
    setOpen(false);
  }
  function remove(id: string) {
    if (isLayout) reflectionWorkspace.deleteLayoutSnapshot(id);
    else reflectionWorkspace.deleteThemeSnapshot(id);
  }

  return (
    <span className="rc-toolbar-menu">
      <button
        type="button"
        className="rc-toolbar-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Camera size={14} aria-hidden="true" />
        {isLayout ? "佈局快照" : "主題快照"}
      </button>
      {open ? (
        <span className="rc-toolbar-pop" role="menu">
          <button type="button" className="rc-snap-save" role="menuitem" onClick={save}>
            儲存目前{isLayout ? "排列" : "主題"}
          </button>
          {snapshots.length === 0 ? (
            <span className="rc-snap-empty">尚無快照</span>
          ) : (
            snapshots.map((snap) => (
              <span key={snap.id} className="rc-snap-row" role="menuitem">
                <button type="button" className="rc-snap-restore" onClick={() => restore(snap.id)}>
                  {snap.name}
                </button>
                <button
                  type="button"
                  className="rc-snap-del"
                  aria-label={`刪除快照 ${snap.name}`}
                  onClick={() => remove(snap.id)}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </span>
            ))
          )}
          <small className="rc-snap-hint">最多保留 5 份，新存的會覆蓋最舊的</small>
        </span>
      ) : null}
    </span>
  );
}

/** 工作台頂部控制列：主題、排列、快照、批次關閉。只在有卡片時出現。 */
export function WorkspaceToolbar() {
  const ws = useReflectionWorkspace();
  if (ws.cards.length === 0) return null;

  return (
    <div className="rc-toolbar" role="toolbar" aria-label="深度伴讀卡片工作台">
      <div className="rc-toolbar-group" role="group" aria-label="卡片主題">
        {CARD_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`rc-theme-dot rc-theme-dot--${theme.id} ${ws.theme === theme.id ? "is-active" : ""}`}
            aria-pressed={ws.theme === theme.id}
            title={theme.label}
            onClick={() => reflectionWorkspace.setTheme(theme.id as CardThemeId)}
          >
            {theme.label}
          </button>
        ))}
        {ws.theme === "custom" ? (
          <span className="rc-accent-row" aria-label="自訂主題色">
            {CUSTOM_ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                className={`rc-accent-swatch ${ws.customAccent === color ? "is-active" : ""}`}
                style={{ background: color }}
                aria-label={`主題色 ${color}`}
                aria-pressed={ws.customAccent === color}
                onClick={() => reflectionWorkspace.setCustomAccent(color)}
              />
            ))}
            <input
              type="color"
              className="rc-accent-native"
              value={ws.customAccent}
              aria-label="自訂任意主題色"
              onChange={(e) => reflectionWorkspace.setCustomAccent(e.target.value)}
            />
          </span>
        ) : null}
      </div>
      <div className="rc-toolbar-group" role="group" aria-label="卡片排列與快照">
        <button type="button" className="rc-toolbar-btn" onClick={() => reflectionWorkspace.arrange("cascade")}>
          <Layers size={14} aria-hidden="true" />階梯排列
        </button>
        <button type="button" className="rc-toolbar-btn" onClick={() => reflectionWorkspace.arrange("grid")}>
          <LayoutGrid size={14} aria-hidden="true" />網格排列
        </button>
        <SnapshotMenu kind="layout" />
        <SnapshotMenu kind="theme" />
        <button type="button" className="rc-toolbar-btn rc-toolbar-closeall" onClick={() => reflectionWorkspace.closeAll()}>
          <X size={14} aria-hidden="true" />全部關閉（{ws.cards.length}）
        </button>
      </div>
    </div>
  );
}

export default WorkspaceToolbar;
