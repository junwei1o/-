/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Tavern from "./Tavern";

const setLocation = vi.fn();
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useLocation: () => ["/tavern", setLocation],
}));

describe("Tavern page", () => {
  afterEach(() => localStorage.clear());

  it("顯示酒館標題與主要入口", () => {
    render(<Tavern />);
    expect(screen.getByRole("heading", { name: /燈塔酒館/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /潮汐牌局/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /文字冒險/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /夥伴小屋/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /稱號牆/ })).toBeTruthy();
  });
});
