// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CommunityHub from "./CommunityHub";

describe("CommunityHub", () => {
  it("renders a local self-challenge without social or ranking UI", () => {
    render(<CommunityHub />);
    expect(screen.getByRole("heading", { name: "自我挑戰" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "個人最佳紀錄" })).toBeTruthy();
    expect(screen.queryByText(/好友|排行榜|排名/)).toBeNull();
  });
});
