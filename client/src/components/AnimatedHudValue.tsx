import React, { useEffect, useRef, useState } from "react";

type AnimatedHudValueProps = {
  value: number;
  prefix?: string;
  duration?: number;
  label?: string;
  increaseAnnouncement?: string;
  className?: string;
};

type ChangeDirection = "increase" | "decrease" | "steady";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function AnimatedHudValue({
  value,
  prefix = "",
  duration = 420,
  label,
  increaseAnnouncement,
  className = "",
}: AnimatedHudValueProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<ChangeDirection>("steady");
  const [changeKey, setChangeKey] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const previousValue = useRef(value);

  useEffect(() => {
    const from = previousValue.current;
    previousValue.current = value;

    if (from === value) return;

    const nextDirection: ChangeDirection = value > from ? "increase" : "decrease";
    setDirection(nextDirection);
    setChangeKey((current) => current + 1);

    if (label) {
      const action = nextDirection === "increase"
        ? increaseAnnouncement ?? "增加至"
        : "調整為";
      setAnnouncement(`${label}${action}${prefix}${value}`);
    }

    if (prefersReducedMotion()) {
      setDisplayValue(value);
      return;
    }

    const startedAt = performance.now();
    const requestFrame = window.requestAnimationFrame ?? ((callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 16));
    const cancelFrame = window.cancelAnimationFrame ?? window.clearTimeout;
    let frame = 0;

    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (value - from) * eased));

      if (progress < 1) {
        frame = requestFrame(update) as number;
      } else {
        setDisplayValue(value);
      }
    };

    frame = requestFrame(update) as number;
    return () => cancelFrame(frame);
  }, [value]);

  return (
    <>
      <output
        key={changeKey}
        className={`rpg-hud-number is-${direction} ${className}`.trim()}
        aria-hidden="true"
      >
        {prefix}{displayValue}
      </output>
      {label && <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>}
    </>
  );
}
