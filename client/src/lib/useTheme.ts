import { useCallback, useState } from "react";

/**
 * 全站主題（data-theme 作用於 <html>）：
 * tidal 潮境（預設，無 data-theme 屬性）／festival 彩旗／exlibris 藏書票／sunny 晴光。
 * 偏好以 local-first 方式存本機；外觀只覆蓋 CSS 變數，元件自動繼承。
 */
export type ThemeId = "tidal" | "festival" | "exlibris" | "sunny";

export const THEME_STORAGE_KEY = "xue-theme-v1";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  hint: string;
  /** 切換卡用的預覽色（固定 hex，不受當前主題影響） */
  swatch: { paper: string; tidal: string; coral: string };
}

export const THEMES: ThemeMeta[] = [
  { id: "tidal", label: "潮境", hint: "潮藍海圖，安靜專注", swatch: { paper: "#EAF1F2", tidal: "#0B6E8E", coral: "#E8754A" } },
  { id: "festival", label: "彩旗", hint: "暖紙珊瑚，熱鬧明亮", swatch: { paper: "#F9F3E8", tidal: "#0B6E8E", coral: "#E8754A" } },
  { id: "exlibris", label: "藏書票", hint: "苔綠手作紙，溫潤沉靜", swatch: { paper: "#F1ECDD", tidal: "#4F6B52", coral: "#B0623A" } },
  { id: "sunny", label: "晴光", hint: "琥珀明亮，輕快有精神", swatch: { paper: "#FBF6E7", tidal: "#D0932B", coral: "#E8754A" } },
];

export function isThemeId(value: unknown): value is ThemeId {
  return value === "tidal" || value === "festival" || value === "exlibris" || value === "sunny";
}

export function applyTheme(id: ThemeId): void {
  const root = document.documentElement;
  if (id === "tidal") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
}

export function readStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(saved)) return saved;
  } catch {
    // 隱私模式或無 localStorage 時退回預設
  }
  return "tidal";
}

/** React 掛載前呼叫，儘早套用主題，避免首屏色調閃爍。 */
export function initTheme(): void {
  applyTheme(readStoredTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => readStoredTheme());

  const setTheme = useCallback((next: ThemeId) => {
    applyTheme(next);
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // 寫入失敗時仍可在本次造訪切換
    }
  }, []);

  return { theme, setTheme, themes: THEMES };
}
