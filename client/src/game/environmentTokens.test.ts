import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("environment design tokens", () => {
  it("exposes the mood-board palette and material tokens", () => {
    for (const token of [
      "--env-canvas:",
      "--env-paper:",
      "--env-tidal:",
      "--env-fern:",
      "--env-clay:",
      "--env-sun:",
      "--env-rare:",
      "--env-focus:",
      "--env-shadow:",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("applies environment tokens to exploration and arena surfaces", () => {
    expect(css).toContain(".hero-band { background:var(--env-paper); }");
    expect(css).toMatch(/\.arena-habitat-picker\s*\{\s*border-color:var\(--env-outline\);/);
    expect(css).toMatch(/\.battle-scene\s*\{\s*background:/);
    expect(css).toMatch(/\.arena-capture-outcome\.success\s*\{\s*border-color:var\(--env-fern-bright\);/);
  });

  it("keeps token-driven interaction motion optional", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".arena-habitat-card,.arena-result-actions button { transition:none; }");
  });

  it("gates battle tension motion and keeps a reduced-motion fallback", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain(".battle-hp-bar.ally.is-critical { animation:battle-crisis-pulse");
    expect(css).toMatch(/\.battle-hp-bar\.ally\.is-critical,\.battle-momentum\.is-charged,[^{]+\{ animation:none; \}/);
    expect(css).toContain(".duel-character.battle-dash-forward");
    expect(css).toContain(".duel-character.battle-hit-flash-ally::after");
  });

  it("defines subject-coded gamebook cards and a non-flashing motion fallback", () => {
    for (const token of ["--subject-nature:", "--subject-math:", "--subject-humanities:", "--subject-language:"]) {
      expect(css).toContain(token);
    }
    expect(css).toContain(".battle-scene-question.question-theme-nature");
    expect(css).toContain(".battle-scene-question.question-theme-math");
    expect(css).toContain(".battle-character-idle .battle-scene-orb { animation:fieldbook-idle");
    expect(css).toContain(".battle-character-idle .battle-scene-orb,.battle-scene-result.victory .arena-loot-icon,.casual-question-card.is-correct,.casual-question-card.is-wrong,.battle-hp-frame .battle-hp-bar .battle-hp-ghost");
    expect(css).toContain(".animate-shake,.animate-combo,.animate-float,.battle-momentum.is-active strong,.academy-shell .growth-companion-showcase .companion-orb.large.animate-float { animation:none; }");
  });

  it("keeps the RPG lobby atmospheric while providing a static motion-safe fallback", () => {
    expect(css).toContain(".rpg-lobby-stage { position:relative;");
    expect(css).toContain(".rpg-companion-showcase { position:relative;");
    expect(css).toContain(".rpg-start-button,.rpg-lobby-secondary");
    expect(css).toContain("@media (prefers-reduced-motion:reduce) { .rpg-lobby-stage *, .rpg-lobby-stage:after { animation:none!important;");
    expect(css).toContain("@media (max-width:760px) { .rpg-lobby-stage { grid-template-columns:1fr;");
  });

  it("keeps HUD value feedback readable, low-stimulation, and motion-optional", () => {
    expect(css).toContain(".rpg-hud-number { display:inline-block; min-inline-size:2ch; font-variant-numeric:tabular-nums;");
    expect(css).toContain(".rpg-hud-number.is-increase { color:#fff8c7;");
    expect(css).toContain(".rpg-hud-number.is-increase { animation:rpg-hud-value-rise 360ms var(--ease-out);");
    expect(css).toContain("@media (prefers-reduced-motion:reduce) { .rpg-lobby-stage *, .rpg-lobby-stage:after { animation:none!important;");
  });

  it("keeps deep-sea wormhole motion optional and its navigation layers presentational", () => {
    expect(css).toContain("@media (prefers-reduced-motion:no-preference){.wormhole-vortex-aura{animation:wormhole-vortex-aura");
    expect(css).toContain(".wormhole-fibonacci-arm");
    expect(css).toContain(".wormhole-anchor-array");
    expect(css).toContain(".wormhole-plasma-bolt");
    expect(css).toContain(".wormhole-vortex-particle{animation:wormhole-bubble-rise");
  });

  it("keeps wormhole principle guidance motion optional and offers a static fallback", () => {
    expect(css).toContain("@media (prefers-reduced-motion:no-preference){.principle-guide-domain,.principle-guide-option{transition:transform");
    expect(css).toContain(".principle-guide-status{animation:principle-guide-breathe");
    expect(css).toContain(".principle-guide-domain,.principle-guide-option{transition:none!important}");
    expect(css).toContain(".principle-guide-status{animation:none!important}");
  });
});
