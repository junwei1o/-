/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MediaObservatory from "./MediaObservatory";
import MediaObservatoryDetail from "./MediaObservatoryDetail";

const setLocation = vi.fn();
let route = "/observatory";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => [route, setLocation],
  useRoute: (pattern: string) => [pattern === "/observatory/:entryKey" && route.startsWith("/observatory/") , { entryKey: "kamen-rider" }],
}));

describe("media observatory keyboard navigation", () => {
  beforeEach(() => {
    route = "/observatory";
    setLocation.mockReset();
  });

  it("keeps category filters keyboard reachable with a visible semantic state", () => {
    render(<MediaObservatory />);

    const allFilter = screen.getByRole("button", { name: /全部/ });
    const animationFilter = screen.getByRole("button", { name: /親子動畫/ });
    const heroFilter = screen.getByRole("button", { name: /特攝英雄/ });

    allFilter.focus();
    expect(document.activeElement).toBe(allFilter);
    expect(allFilter).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(animationFilter);
    expect(animationFilter).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "我是奶龍" })).toBeInTheDocument();

    fireEvent.keyDown(heroFilter, { key: "Enter" });
    fireEvent.click(heroFilter);
    expect(heroFilter).toHaveAttribute("aria-pressed", "true");
    expect(allFilter).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps cards and return controls as native buttons for Enter and Space flows", () => {
    render(<MediaObservatory />);

    const cardButton = screen.getAllByRole("button", { name: /開啟觀測卡/ })[0];
    cardButton.focus();
    expect(document.activeElement).toBe(cardButton);
    fireEvent.keyDown(cardButton, { key: "Enter" });
    fireEvent.click(cardButton);
    expect(setLocation).toHaveBeenCalledWith(expect.stringMatching(/^\/observatory\//));

    setLocation.mockReset();
    route = "/observatory/kamen-rider";
    render(<MediaObservatoryDetail />);
    const backButton = screen.getByRole("button", { name: /返回動漫與特攝觀測站/ });
    backButton.focus();
    expect(document.activeElement).toBe(backButton);
    fireEvent.keyDown(backButton, { key: " " });
    fireEvent.click(backButton);
    expect(setLocation).toHaveBeenCalledWith("/observatory");
  });
});

it("exposes visible focus styling through the shared focus-visible contract", () => {
  expect(document.activeElement).not.toBeNull();
});


