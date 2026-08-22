import React, { useEffect } from "react";
import { Flame, Sparkles, Star, X } from "lucide-react";

type StreakCelebrationProps = {
  streak: number;
  onClose: () => void;
};

function tierFor(streak: number) {
  if (streak >= 12) return "dragon";
  if (streak >= 11) return "fire";
  if (streak >= 9) return "stars";
  if (streak >= 8) return "burst";
  if (streak >= 7) return "meteor";
  if (streak >= 6) return "radiant";
  return "victory";
}

function titleFor(streak: number) {
  if (streak >= 12) return "神龍降臨！";
  if (streak >= 11) return "火焰連勝！";
  if (streak >= 9) return "星河為你閃耀！";
  if (streak >= 8) return "連勝爆發！";
  if (streak >= 7) return "流星劃過天際！";
  if (streak >= 6) return "華麗連勝！";
  return "連勝啟動！";
}

function playVictorySound(streak: number) {
  if (typeof window === "undefined" || !window.AudioContext) return;
  try {
    const context = new window.AudioContext();
    const now = context.currentTime;
    const notes = streak >= 12 ? [261.63, 329.63, 392, 523.25, 659.25] : streak >= 9 ? [392, 493.88, 587.33, 783.99] : [392, 493.88, 587.33];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = streak >= 11 ? "sawtooth" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.07, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.32);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.34);
    });
    window.setTimeout(() => void context.close(), 900);
  } catch {
    // Audio is an enhancement; blocked or unavailable audio must not affect play.
  }
}

export default function StreakCelebration({ streak, onClose }: StreakCelebrationProps) {
  const tier = tierFor(streak);

  useEffect(() => {
    playVictorySound(streak);
    const closeTimer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(closeTimer);
  }, [onClose, streak]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={`streak-overlay streak-${tier}`} role="presentation">
      <div className="streak-atmosphere" aria-hidden="true">
        {tier === "meteor" && <span className="streak-meteor">✦</span>}
        {tier === "burst" && <span className="streak-burst">✹</span>}
        {tier === "stars" && Array.from({ length: 18 }, (_, index) => <Star key={index} className={`streak-star streak-star-${index % 6}`} size={index % 3 === 0 ? 19 : 12} />)}
        {tier === "fire" && <span className="streak-fire-field"><Flame size={72} /><Flame size={48} /><Flame size={36} /></span>}
        {tier === "dragon" && <span className="streak-dragon" aria-hidden="true">🐉</span>}
      </div>
      <section className="streak-dialog" role="dialog" aria-modal="true" aria-labelledby="streak-title" aria-describedby="streak-description">
        <button type="button" className="streak-close" aria-label="關閉連勝提示" onClick={onClose}><X size={18} /></button>
        <span className="streak-dialog-icon"><Sparkles size={26} /></span>
        <p className="eyebrow accent">COMBO CELEBRATION / 連勝觀測</p>
        <h2 id="streak-title">{titleFor(streak)}</h2>
        <p id="streak-description" className="streak-count"><strong>{streak}</strong> 題連續答對</p>
        <p className="streak-message">保持節奏，下一個觀測線索正在發光。</p>
        <button type="button" className="btn primary streak-continue" onClick={onClose}>繼續挑戰</button>
      </section>
    </div>
  );
}
