// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WormholeNavButton from "@/components/WormholeNavButton";

describe("WormholeNavButton", () => {
  afterEach(() => cleanup());

  it("uses an accessible sea-vortex control to open the principles route", () => {
    const onNavigate = vi.fn();
    render(<WormholeNavButton onNavigate={onNavigate} />);

    const entry = screen.getByRole("button", { name: "進入人類火種躍遷蟲洞世界原理探索" });
    expect(screen.getByRole("tooltip")).toHaveTextContent("世界原理 · 7 個觀測點");
    fireEvent.click(entry);
    expect(onNavigate).toHaveBeenCalledWith("/principles");
  });

  it("keeps the visual atmosphere presentational and outside the interaction label", () => {
    const onNavigate = vi.fn();
    const { container } = render(<WormholeNavButton onNavigate={onNavigate} />);

    expect(container.querySelector(".wormhole-vortex")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".wormhole-vortex-particle")).toHaveLength(6);
    expect(container.querySelectorAll(".wormhole-anchor")).toHaveLength(4);
    expect(container.querySelectorAll(".wormhole-plasma-bolt")).toHaveLength(2);
    expect(screen.getByRole("button")).toHaveAccessibleName("進入人類火種躍遷蟲洞世界原理探索");
  });

  it("supports Enter and Space keyboard navigation", () => {
    const onNavigate = vi.fn();
    render(<WormholeNavButton onNavigate={onNavigate} />);
    const entry = screen.getByRole("button", { name: "進入人類火種躍遷蟲洞世界原理探索" });

    fireEvent.keyDown(entry, { key: "Enter" });
    fireEvent.keyDown(entry, { key: " " });
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});
