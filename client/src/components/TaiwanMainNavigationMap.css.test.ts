import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./TaiwanMainNavigationMap.css", import.meta.url), "utf8");

describe("TaiwanMainNavigationMap 三色節點樣式", () => {
  it("keeps the three observed-data color tiers and a neutral first-exploration mist state", () => {
    expect(css).toContain(".taiwan-map-island.island-visual-gold");
    expect(css).toContain("#c69500");
    expect(css).toContain(".taiwan-map-island.island-visual-green");
    expect(css).toContain("#2e5a4c");
    expect(css).toContain(".taiwan-map-island.island-visual-orange");
    expect(css).toContain("#ca5528");
    expect(css).toContain(".taiwan-map-island.island-visual-mist");
  });

  it("only permits the optional unlocked glow outside the neutral mist state and reduced-motion mode", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain(".taiwan-map-island.is-unlocked:not(.is-selected):not(.island-visual-mist)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".taiwan-map-island,");
  });

  it("uses a stroke-dashoffset drawing animation while keeping a static reduced-motion fallback", () => {
    expect(css).toContain(".taiwan-map-route-animated");
    expect(css).toContain("animation: taiwan-route-draw");
    expect(css).toContain("@keyframes taiwan-route-draw");
    expect(css).toContain("stroke-dashoffset: 0;");
  });
});
