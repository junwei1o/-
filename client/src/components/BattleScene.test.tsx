// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BattleScene } from "./BattleScene";

describe("BattleScene", () => {
  it("renders both HP meters and floating damage during an attack", () => {
    render(<BattleScene phase="attack" correct critical combo={3} damage={45} playerHp={100} enemyHp={55} />);
    expect(screen.getByRole("meter", { name: "玩家 HP 100/100" })).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "怪物 HP 55/100" })).toBeInTheDocument();
    expect(screen.getByText("-45 HP")).toBeInTheDocument();
    expect(screen.getByText("🔥 暴擊！")).toBeInTheDocument();
  });
});
