// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import KnowledgeDuel from "./KnowledgeDuel";

describe("KnowledgeDuel", () => {
  afterEach(() => cleanup());

  it("renders a local-only strategy setup without social or ranking UI", () => {
    render(<KnowledgeDuel />);

    expect(screen.getByRole("heading", { name: "知識決鬥" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "選擇本局策略卡" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "開始知識決鬥" })).toBeTruthy();
    expect(screen.queryByText(/好友|排行榜|排名/)).toBeNull();
  });

  it("starts a hidden-role duel with a 15-second timer after choosing a three-card loadout", () => {
    render(<KnowledgeDuel />);
    fireEvent.click(screen.getByRole("button", { name: /知識加護/ }));
    fireEvent.click(screen.getByRole("button", { name: /閃電連擊/ }));

    expect(screen.getByRole("button", { name: "開始知識決鬥" }).getAttribute("disabled")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "開始知識決鬥" }));

    expect(screen.getByText("你的角色")).toBeTruthy();
    expect(screen.getAllByText("？")).toHaveLength(2);
    expect(screen.getByText("秒內作答")).toBeTruthy();
    expect(screen.getByLabelText("本局策略卡")).toBeTruthy();
  });

  it("shows the AI card, strategy reason, and effect reading after a turn", () => {
    render(<KnowledgeDuel />);
    fireEvent.click(screen.getByRole("button", { name: /知識加護/ }));
    fireEvent.click(screen.getByRole("button", { name: /閃電連擊/ }));
    fireEvent.click(screen.getByRole("button", { name: "開始知識決鬥" }));

    fireEvent.click(screen.getAllByRole("button", { name: /^回答：/ })[0]!);

    const insight = screen.getByLabelText("對手策略偵測");
    expect(insight.textContent).toContain("AI 剛使用");
    expect(insight.textContent).toContain("效果判讀");
  });
});
