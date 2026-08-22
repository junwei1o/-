import React, { useEffect, useState } from "react";

type Props = {
  phase: "idle" | "player" | "result" | "attack" | "enemy" | "reward";
  correct?: boolean;
  critical?: boolean;
  combo?: number;
  playerHp?: number;
  enemyHp?: number;
  playerMaxHp?: number;
  enemyMaxHp?: number;
  enemyName?: string;
  damage?: number;
};

function Hp({ label, value, max, tone }: { label: string; value: number; max: number; tone: "player" | "enemy" }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className="battle-quiz-hp" role="meter" aria-label={`${label} ${value}/${max}`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><div className="battle-quiz-hp-label"><span>{tone === "player" ? "♥" : "☠"} {label}</span><b>{value}/{max}</b></div><div className={`battle-quiz-hp-track ${tone}`}><i style={{ width: `${percent}%` }} /></div></div>;
}

export function BattleScene({ phase, correct = false, critical = false, combo = 0, playerHp = 100, enemyHp = 100, playerMaxHp = 100, enemyMaxHp = 100, enemyName = "👾 知識怪獸", damage = 0 }: Props) {
  const [impactKey, setImpactKey] = useState(0);
  useEffect(() => { if (damage > 0) setImpactKey((key) => key + 1); }, [damage]);
  const attacking = phase === "attack" && correct;
  const countering = phase === "enemy" || (phase === "attack" && !correct);
  return <section className={`battle-quiz-scene phase-${phase} ${critical ? "is-critical" : ""}`} aria-label="戰鬥答題場景">
    <div className="battle-quiz-combatants">
      <div className={`battle-quiz-actor player ${attacking ? "is-attacking" : ""} ${countering ? "is-hit" : ""}`}><span className="battle-quiz-sprite" aria-hidden="true">🚀</span><strong>探險家</strong><Hp label="玩家 HP" value={playerHp} max={playerMaxHp} tone="player" /></div>
      <div className="battle-quiz-versus" aria-hidden="true"><span>VS</span>{critical && <b>🔥 暴擊！</b>}{combo >= 3 && <small>COMBO {combo}</small>}</div>
      <div className={`battle-quiz-actor enemy ${attacking ? "is-hit" : ""} ${countering ? "is-attacking" : ""}`}><span className="battle-quiz-sprite" aria-hidden="true">👾</span><strong>{enemyName}</strong><Hp label="怪物 HP" value={enemyHp} max={enemyMaxHp} tone="enemy" /></div>
    </div>
    {damage > 0 && <span key={impactKey} className={`battle-quiz-damage ${countering ? "on-player" : "on-enemy"}`} role="status" aria-live="assertive">-{damage} HP</span>}
    <p className="battle-quiz-status" aria-live="polite">{phase === "player" ? "輪到你回答" : phase === "attack" && correct ? "玩家衝刺攻擊！" : countering ? "怪物反擊！" : phase === "reward" ? "戰利品已整理完成" : "觀察戰場，準備下一步"}</p>
  </section>;
}
