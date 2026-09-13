import React, { type PointerEvent as ReactPointerEvent } from "react";
import { motion, type Transition } from "framer-motion";
import { Minus, X } from "lucide-react";
import type { CardThemeId, ReflectionCard } from "@/game/reflectionWorkspace";
import { MIN_H, MIN_W } from "@/game/reflectionWorkspace";
import { useBxVersion } from "@/components/bx/useBx";
import { bxStore } from "@/game/bxStore";

/**
 * 各主題「差異化」的進場動畫：
 * - light 晨光：標準淡入＋輕微縮放
 * - dark 夜航：更快、只上移淡入
 * - glass 毛玻璃：亮度收斂＋微縮（配合 backdrop-filter）
 * - soft 暈染：彈性過衝
 * - mono 極簡黑白：僅透明度，完全不位移／縮放
 * - custom 自訂：同晨光，色調由 CSS 變數帶入
 * 尊重「減少動畫」偏好：一律只做極短淡入。
 */
type EnterAnim = {
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Transition;
};

const THEME_ENTER: Record<CardThemeId, EnterAnim> = {
  light: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.24, ease: "easeOut" },
  },
  dark: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.16, ease: "easeOut" },
  },
  glass: {
    initial: { opacity: 0, scale: 0.98, filter: "brightness(1.5)" },
    animate: { opacity: 1, scale: 1, filter: "brightness(1)" },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  soft: {
    initial: { opacity: 0, scale: 0.9, y: 14 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: "spring", stiffness: 320, damping: 18 },
  },
  mono: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.18, ease: "linear" },
  },
  custom: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.24, ease: "easeOut" },
  },
};

const REDUCED_ENTER: EnterAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.01 },
};

type StackedCardProps = {
  card: ReflectionCard;
  theme: CardThemeId;
  onFocus: () => void;
  onClose: () => void;
  onToggleMinimize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  children: React.ReactNode;
};

export function StackedCard({
  card,
  theme,
  onFocus,
  onClose,
  onToggleMinimize,
  onMove,
  onResize,
  children,
}: StackedCardProps) {
  useBxVersion();
  const reduceMotion = bxStore.get<boolean>("prefs.reduceMotion", false) ?? false;
  const anim = reduceMotion ? REDUCED_ENTER : THEME_ENTER[theme];

  // 拖拽：標題列 pointer 起拖，全程以原始座標回寫 store，位置只由 store 控制。
  function handleDragStart(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    onFocus();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = card.x;
    const originY = card.y;
    let raf = 0;
    let nextX = originX;
    let nextY = originY;
    const move = (ev: PointerEvent) => {
      nextX = originX + ev.clientX - startX;
      nextY = originY + ev.clientY - startY;
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        onMove(nextX, nextY);
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (raf) window.cancelAnimationFrame(raf);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // 縮放：右下角把手，最小寬高由 store 常量限制。
  function handleResizeStart(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation();
    onFocus();
    const startX = event.clientX;
    const startY = event.clientY;
    const originW = card.w;
    const originH = card.h;
    let raf = 0;
    const move = (ev: PointerEvent) => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        onResize(
          Math.max(MIN_W, originW + ev.clientX - startX),
          Math.max(MIN_H, originH + ev.clientY - startY),
        );
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (raf) window.cancelAnimationFrame(raf);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <motion.section
      className={`rc-card rc-theme-${theme} ${card.minimized ? "is-minimized" : ""}`}
      style={{
        left: card.x,
        top: card.y,
        width: card.w,
        height: card.minimized ? "auto" : card.h,
        zIndex: card.z,
      }}
      initial={anim.initial}
      animate={anim.animate}
      transition={anim.transition}
      onPointerDown={onFocus}
      role="dialog"
      aria-label={card.title}
    >
      <header className="rc-card-head" onPointerDown={handleDragStart}>
        <span className="rc-card-title" title={card.question}>
          {card.title}
        </span>
        <div className="rc-card-head-actions">
          <button
            type="button"
            className="rc-card-icon-btn"
            onClick={onToggleMinimize}
            aria-label={card.minimized ? "展開卡片" : "最小化卡片"}
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="rc-card-icon-btn"
            onClick={onClose}
            aria-label="關閉這張深度伴讀卡片"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </header>
      {!card.minimized ? <div className="rc-card-body">{children}</div> : null}
      {!card.minimized ? (
        <span
          className="rc-card-resize"
          onPointerDown={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="拖曳調整卡片大小"
        />
      ) : null}
    </motion.section>
  );
}

export default StackedCard;
