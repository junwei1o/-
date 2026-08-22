// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MobileBottomNav from "@/components/MobileBottomNav";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/practice", setLocation],
}));

describe("MobileBottomNav", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  it("exposes the five mobile-first destinations with an accessible current state", () => {
    render(<MobileBottomNav />);

    const nav = screen.getByRole("navigation", { name: "手機版快速導覽" });
    expect(nav).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "展開快捷入口" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "前往學習" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "前往戰鬥" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("group", { name: "快捷入口" })).toHaveAttribute("aria-hidden", "false");
  });

  it("navigates through a large touch target without changing game state", () => {
    render(<MobileBottomNav />);

    fireEvent.click(screen.getByRole("button", { name: "展開快捷入口" }));
    fireEvent.click(screen.getByRole("button", { name: "前往戰鬥" }));
    expect(setLocation).toHaveBeenCalledWith("/battle");
  });
});


describe("MobileBottomNav drag gestures", () => {
  afterEach(() => cleanup());

  it("expands from an upward drag and exposes the navigation destinations", () => {
    render(<MobileBottomNav />);

    const toggle = screen.getByRole("button", { name: "展開快捷入口" });
    const handleRow = document.querySelector(".mobile-bottom-nav-handle-row");
    if (!handleRow) throw new Error("Bottom Sheet handle row was not rendered");
    fireEvent.pointerDown(handleRow, { pointerId: 1, pointerType: "touch", clientY: 700 });
    fireEvent.pointerMove(handleRow, { pointerId: 1, pointerType: "touch", clientY: 590 });
    fireEvent.pointerUp(handleRow, { pointerId: 1, pointerType: "touch", clientY: 590 });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "快捷入口" })).toHaveAttribute("aria-hidden", "false");
  });

  it("collapses from a downward drag without navigating or activating a child action", () => {
    render(<MobileBottomNav />);

    fireEvent.click(screen.getByRole("button", { name: "展開快捷入口" }));
    const handleRow = document.querySelector(".mobile-bottom-nav-handle-row");
    if (!handleRow) throw new Error("Bottom Sheet handle row was not rendered");
    fireEvent.pointerDown(handleRow, { pointerId: 2, pointerType: "touch", clientY: 500 });
    fireEvent.pointerMove(handleRow, { pointerId: 2, pointerType: "touch", clientY: 650 });
    fireEvent.pointerUp(handleRow, { pointerId: 2, pointerType: "touch", clientY: 650 });

    expect(screen.getByRole("button", { name: "展開快捷入口" })).toHaveAttribute("aria-expanded", "false");
    expect(setLocation).not.toHaveBeenCalled();
  });

  it("keeps a short handle touch as a normal toggle click", () => {
    render(<MobileBottomNav />);

    const toggle = screen.getByRole("button", { name: "展開快捷入口" });
    const handleRow = document.querySelector(".mobile-bottom-nav-handle-row");
    if (!handleRow) throw new Error("Bottom Sheet handle row was not rendered");
    fireEvent.pointerDown(handleRow, { pointerId: 3, pointerType: "touch", clientY: 700 });
    fireEvent.pointerUp(handleRow, { pointerId: 3, pointerType: "touch", clientY: 700 });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
