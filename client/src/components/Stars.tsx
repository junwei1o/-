/**
 * 共用星星列：★ ×n（金）＋ 暗色補滿至 3 顆。
 *
 * 專案裡原本有 4 份雷同的寫法（Home 的 Stars、Records 的 StarRow、
 * Quiz 結算、Stages 關卡卡），收斂成這一個元件。
 *
 * `zero` 只影響「0 顆星」時的外觀：
 * - hollow（預設）：顯示 ☆☆☆（首頁原本的樣式）
 * - dim：顯示三顆暗 ★（紀錄表、關卡卡、結算頁原本的樣式）
 */
export default function Stars({
  count,
  size = 'text-base',
  zero = 'hollow',
  className = '',
  ariaLabel,
}: {
  count: number;
  size?: string;
  zero?: 'hollow' | 'dim';
  className?: string;
  ariaLabel?: string;
}) {
  const n = Math.max(0, Math.min(3, Math.round(count)));
  const tone = n > 0 ? 'text-[#ffc857]' : 'text-white/25';
  const cls = `${size} ${tone} ${className}`.trim();

  if (n === 0 && zero === 'hollow') {
    return (
      <span className={cls} aria-label={ariaLabel}>
        ☆☆☆
      </span>
    );
  }

  return (
    <span className={cls} aria-label={ariaLabel}>
      {'★'.repeat(n)}
      <span className="text-white/25">{'★'.repeat(3 - n)}</span>
    </span>
  );
}
