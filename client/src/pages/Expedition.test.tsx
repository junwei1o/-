// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Expedition from "./Expedition";

const setLocation = vi.fn();

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

describe("Expedition 今日遠征", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  it("把簽到、今日任務與四科定位收進同一面板", () => {
    render(<Expedition />);
    expect(screen.getByRole("heading", { name: /今日遠征/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /每日簽到/ }));
    expect(setLocation).toHaveBeenCalledWith("/camp");
    setLocation.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /今日任務/ }));
    expect(setLocation).toHaveBeenCalledWith("/battle");
    setLocation.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /數學/ }));
    expect(setLocation).toHaveBeenCalledWith("/practice?subject=%E6%95%B8%E5%AD%B8&source=expedition");
  });
});
