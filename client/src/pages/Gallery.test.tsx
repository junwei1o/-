// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Gallery from "./Gallery";

const setLocation = vi.fn();

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

describe("Gallery 知識展廳", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  it("預設顯示文學故事分類，可切換到其他展廳分類", () => {
    render(<Gallery />);
    expect(screen.getByRole("heading", { name: /知識展廳/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /智慧故事館/ }));
    expect(setLocation).toHaveBeenCalledWith("/wisdom");
    setLocation.mockClear();

    fireEvent.click(screen.getByRole("tab", { name: /天文/ }));
    fireEvent.click(screen.getByRole("button", { name: /天文館/ }));
    expect(setLocation).toHaveBeenCalledWith("/astronomy");
    setLocation.mockClear();

    fireEvent.click(screen.getByRole("tab", { name: /科學原理/ }));
    fireEvent.click(screen.getByRole("button", { name: /世界原理站/ }));
    expect(setLocation).toHaveBeenCalledWith("/principles");
    setLocation.mockClear();

    fireEvent.click(screen.getByRole("tab", { name: /生活安全/ }));
    fireEvent.click(screen.getByRole("button", { name: /生活安全學院/ }));
    expect(setLocation).toHaveBeenCalledWith("/safety");
  });
});
