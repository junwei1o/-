// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TreasureHub from "./TreasureHub";

const setLocation = vi.fn();

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

describe("TreasureHub 藏寶圖", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  it("把徽章、特產、卡牌收在同一頁並導向目的地", () => {
    render(<TreasureHub />);
    expect(screen.getByRole("heading", { name: /藏寶圖/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /徽章/ }));
    expect(setLocation).toHaveBeenCalledWith("/badges");
    setLocation.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /特產/ }));
    expect(setLocation).toHaveBeenCalledWith("/");
    setLocation.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /卡牌/ }));
    expect(setLocation).toHaveBeenCalledWith("/tavern");
  });
});
