import React, { useEffect } from "react";
import { bxStore } from "@/game/bxStore";
import { useBxVersion } from "./useBx";

/**
 * BX 顯示偏好面板：減少動畫、大字體、高對比、音效、背景音樂。
 * 將類別切換到 <html>：bx-reduce-motion / bx-large-text / bx-high-contrast，
 * 僅作用於 .bx-* 元件，不干擾站內既有字級控制。
 */

const PREF_ITEMS: Array<{ key: "reduceMotion" | "largeText" | "highContrast" | "sound" | "music"; label: string; desc: string }> = [
  { key: "reduceMotion", label: "減少動畫", desc: "降低畫面跑動、閃爍與彈跳效果" },
  { key: "largeText", label: "大字體", desc: "把介面字級放大 20%" },
  { key: "highContrast", label: "高對比", desc: "加強文字與背景對比，較容易閱讀" },
  { key: "sound", label: "音效", desc: "答題回饋與按鈕音效" },
  { key: "music", label: "背景音樂", desc: "航行時的背景音樂" },
];

const HTML_CLASS: Record<string, string> = {
  reduceMotion: "bx-reduce-motion",
  largeText: "bx-large-text",
  highContrast: "bx-high-contrast",
};

export default function PrefsPanel() {
  useBxVersion();

  // 首次載入：若系統要求減少動畫，預設開啟（尚未被使用者明確設定前）。
  useEffect(() => {
    const prefersReduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce && bxStore.get<boolean>("prefs.reduceMotion", false) === false) {
      bxStore.update((s) => { s.prefs.reduceMotion = true; });
    }
  }, []);

  // 套用類別到 <html>。
  useEffect(() => {
    const root = document.documentElement;
    PREF_ITEMS.forEach(({ key }) => {
      const cls = HTML_CLASS[key];
      if (!cls) return;
      root.classList.toggle(cls, bxStore.get<boolean>(`prefs.${key}`, false) ?? false);
    });
  });

  const toggle = (key: (typeof PREF_ITEMS)[number]["key"], value: boolean) => {
    bxStore.update((s) => { s.prefs[key] = value; });
  };

  return (
    <section className="bx-panel" id="bxPrefs">
      <h3 className="bx-panel__title">🎛️ 顯示偏好</h3>
      <div className="bx-prefs">
        {PREF_ITEMS.map((item) => (
          <label key={item.key} className="bx-check bx-check--row">
            <input
              type="checkbox"
              checked={bxStore.get<boolean>(`prefs.${item.key}`, false) ?? false}
              onChange={(e) => toggle(item.key, e.target.checked)}
            />
            <span>
              <strong>{item.label}</strong>
              <small>{item.desc}</small>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
