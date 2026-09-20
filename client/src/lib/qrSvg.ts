/**
 * 本機產生 QR code（SVG data URI）
 *
 * 舊做法是把 LINE ID 丟給第三方服務 `api.qrserver.com` 換圖：
 * ① 學校網路擋外部域名的時候 QR 會整塊空白；② 老師的 LINE ID 會外洩給第三方。
 * 改為在本機以 `qrcode-generator` 直接畫成 SVG，離線可用、不外送資料。
 */
import qrcodeFactory from "qrcode-generator";

/** 產出可直接放進 <img src> 的 SVG data URI。 */
export function buildQrDataUri(text: string, options?: { scale?: number; margin?: number }): string {
  if (!text) return "";
  const scale = options?.scale ?? 6;
  const margin = options?.margin ?? 2;
  try {
    const qr = qrcodeFactory(0, "M"); // 0 = 自動選擇版本
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const size = (count + margin * 2) * scale;
    const rects: string[] = [];
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) {
          rects.push(`<rect x="${(col + margin) * scale}" y="${(row + margin) * scale}" width="${scale}" height="${scale}"/>`);
        }
      }
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">` +
      `<rect width="${size}" height="${size}" fill="#fff"/>` +
      `<g fill="#111">${rects.join("")}</g>` +
      `</svg>`;
    // encodeURIComponent 處理中文與特殊字元（LINE 網址通常為純 ASCII，仍保險處理）
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return "";
  }
}
