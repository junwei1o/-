import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { loadRpgState } from "@/game/rpgStorage";
import { affectionLevel } from "@/game/companionGrowth";
import type { Rarity } from "@/game/rpgTypes";

const RARITY_LABEL: Record<Rarity, string> = {
  common: "普通",
  rare: "稀有",
  legendary: "傳說",
};

const RARITY_EMOJI: Record<Rarity, string> = {
  common: "🐾",
  rare: "🌟",
  legendary: "👑",
};

export function TavernCompanion() {
  const [, setLocation] = useLocation();
  const state = useMemo(() => loadRpgState(), []);
  const companions = state.companions ?? [];
  if (companions.length === 0) {
    return (
      <div className="tavern-empty">
        壁爐邊還有空位……去答題戰鬥招募第一位夥伴吧！
        <div>
          <button className="tavern-link-button" onClick={() => setLocation("/battle")}>前往戰鬥</button>
        </div>
      </div>
    );
  }
  return (
    <div className="tavern-companion-list">
      {companions.map((c) => (
        <div key={c.id} className="tavern-companion-card">
          <div className="tavern-companion-avatar">{RARITY_EMOJI[c.rarity] ?? "🐾"}</div>
          <strong>{c.name}</strong>
          <small>{c.epithet}</small>
          <span>Lv.{c.level}　{RARITY_LABEL[c.rarity]}</span>
          <span>親密度 Lv.{affectionLevel(c.affection ?? 0)}</span>
          <span>HP {c.hp}/{c.maxHp}</span>
        </div>
      ))}
    </div>
  );
}
