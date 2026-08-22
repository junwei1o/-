// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./button";

afterEach(() => cleanup());

describe("Button", () => {
  it("renders the shared primary action as a capsule with visual feedback", () => {
    render(<Button>開始探索</Button>);

    const button = screen.getByRole("button", { name: "開始探索" });
    expect(button).toHaveClass("rounded-full");
    expect(button).toHaveClass("shadow-[0_8px_18px_rgba(11,110,142,0.18)]");
    expect(button).toHaveClass("active:scale-[.97]");
    expect(button).toHaveClass("focus-visible:ring-[3px]");
  });

  it("keeps capsule shape and reduced-motion fallback at compact sizes", () => {
    render(<Button size="sm">繼續挑戰</Button>);

    const button = screen.getByRole("button", { name: "繼續挑戰" });
    expect(button).toHaveClass("rounded-full");
    expect(button).not.toHaveClass("rounded-md");
    expect(button).toHaveClass("motion-reduce:transition-none");
  });
});
