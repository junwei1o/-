import React, { useState } from "react";

type CardArtProps = {
  cardId: string;
  emoji: string;
  name: string;
  className?: string;
};

/**
 * 卡牌插畫：載入 `/cards/card-<id>.webp`（256×256，已去浮水印並壓縮）。
 * 載入失敗或離線時回退 emoji，卡面不得空白。
 */
export function CardArt({ cardId, emoji, name, className }: CardArtProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={className} role="img" aria-label={name}>
        {emoji}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={`/cards/card-${cardId}.webp`}
      alt={name}
      width={256}
      height={256}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default CardArt;
