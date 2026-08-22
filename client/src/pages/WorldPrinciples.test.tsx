/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WormholeNavButton from "@/components/WormholeNavButton";
import WorldPrinciples from "./WorldPrinciples";
import WorldPrincipleDetail from "./WorldPrincipleDetail";

const setLocation = vi.fn();
let route = "/principles";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => [route, setLocation],
  useRoute: (pattern: string) => [pattern === "/principles/:key" && route.startsWith("/principles/"), { key: route.split("/").pop() }],
}));

describe("human spark wormhole", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    route = "/principles";
    setLocation.mockReset();
  });

  it("routes from the homepage wormhole entry with click, Enter, and Space", () => {
    render(<WormholeNavButton onNavigate={setLocation} />);
    const entry = screen.getByRole("button", { name: /人類火種躍遷蟲洞/ });
    entry.focus();
    expect(document.activeElement).toBe(entry);
    fireEvent.click(entry);
    expect(setLocation).toHaveBeenCalledWith("/principles");
    setLocation.mockClear();
    fireEvent.keyDown(entry, { key: "Enter" });
    expect(setLocation).toHaveBeenCalledWith("/principles");
    setLocation.mockClear();
    fireEvent.keyDown(entry, { key: " " });
    expect(setLocation).toHaveBeenCalledWith("/principles");
  });

  it("renders the principles index with all seven observation points and the wormhole guide", () => {
    render(<WorldPrinciples />);
    expect(screen.getByRole("heading", { name: /人類火種/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /選一個原理/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(12);
    expect(screen.getByRole("button", { name: /相對論/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /不可能三角/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /先抓住一條可驗證的線索/ })).toBeInTheDocument();
  });

  it("renders detail content and supports next-station navigation", () => {
    route = "/principles/relativity";
    render(<WorldPrincipleDetail />);
    expect(screen.getByRole("heading", { level: 1, name: "相對論" })).toBeInTheDocument();
    expect(screen.getByText(/手機定位需要校正/)).toBeInTheDocument();
    const next = screen.getByRole("button", { name: /前往下一站/ });
    next.focus();
    fireEvent.keyDown(next, { key: "Enter" });
    fireEvent.click(next);
    expect(setLocation).toHaveBeenCalledWith("/principles/first-principles");
  });
});
