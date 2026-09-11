// 閱讀字號控制：只放大「答題頁」需要閱讀的文字（題目 / 選項 / 解析 / 提示）。
//
// 做法：在 <html> 上切換 data-reading-scale 屬性，再由 CSS 以相對單位（em）放大，
// 例如  html[data-reading-scale="large"] .paper-question-prompt { font-size: 1.15em }
//
// 絕對不能改 document.documentElement.style.fontSize：
// 本專案 CSS 以 px 為主（rem 只佔約 24%），改 root 字級只會放大少數 rem 元素，
// 造成大小不一致，還可能撐破手機版（專案曾修過手機橫向溢位的 bug）。

export type ReadingScale = "none" | "large" | "xlarge";

export const READING_SCALE_VALUES: readonly ReadingScale[] = ["none", "large", "xlarge"];

export const READING_SCALE_FACTORS: Record<ReadingScale, number> = {
  none: 1,
  large: 1.15,
  xlarge: 1.3,
};

const STORAGE_KEY = "xue-reading-scale-v1";
const DEFAULT_SCALE: ReadingScale = "none";

/** 讀取已儲存的檔位；遇到非法值或無法讀取時回退預設（none）。 */
export function getReadingScale(): ReadingScale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ReadingScale | null;
    if (saved && (READING_SCALE_VALUES as readonly ReadingScale[]).includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage 不可用（隱私模式等）時，維持預設
  }
  return DEFAULT_SCALE;
}

/** 套用檔位到 <html>，並寫入本機設定。 */
export function setReadingScale(scale: ReadingScale): void {
  try {
    if (scale === "none") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, scale);
    }
  } catch {
    // 無法寫入時，本次造訪仍會透過 applyReadingScale 生效
  }
  applyReadingScale(scale);
}

/** 只在 <html> 上切換 data-reading-scale 屬性（none 時移除屬性）。 */
export function applyReadingScale(scale: ReadingScale): void {
  if (typeof document === "undefined") return;
  if (scale === "none") {
    document.documentElement.removeAttribute("data-reading-scale");
  } else {
    document.documentElement.setAttribute("data-reading-scale", scale);
  }
}

/** 應用程式啟動時呼叫一次，讓儲存的字號在第一畫面就生效，避免閃爍。 */
export function initReadingScale(): void {
  applyReadingScale(getReadingScale());
}
