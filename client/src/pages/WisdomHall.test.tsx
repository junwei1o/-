/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WisdomHall from "./WisdomHall";
import WisdomStoryDetail from "./WisdomStoryDetail";

const setLocation = vi.fn();
let route = "/wisdom";
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => [route, setLocation],
  useRoute: (pattern: string) => [pattern === "/wisdom/:key" && route.startsWith("/wisdom/"), { key: route.split("/").pop() }],
}));

describe("wisdom hall", () => {
  afterEach(() => cleanup());
  beforeEach(() => { route = "/wisdom"; setLocation.mockReset(); });

  it("renders the unified hall and filters four learning sections", () => {
    render(<WisdomHall />);
    expect(screen.getByRole("heading", { name: /智慧故事館/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "成語新解" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "寓言故事" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "歷史典故" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "名人名言" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "真實案例" }));
    expect(screen.getByText("南門國小：把受傷的樹變成一堂課")).toBeInTheDocument();
  });

  it("searches stories and navigates to a detail page", () => {
    render(<WisdomHall />);
    fireEvent.change(screen.getByRole("textbox", { name: "搜尋智慧故事" }), { target: { value: "畫蛇" } });
    expect(screen.getByText("畫蛇添足")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /閱讀故事/ }));
    expect(setLocation).toHaveBeenCalledWith("/wisdom/draw-snake-add-feet");
  });

  it("renders detail source and next-story navigation", () => {
    route = "/wisdom/south-gate-school";
    render(<WisdomStoryDetail />);
    expect(screen.getByRole("heading", { level: 1, name: /南門國小/ })).toBeInTheDocument();
    expect(screen.getByText(/桃園電子報/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /下一個展件/ }));
    expect(setLocation).toHaveBeenCalledWith("/wisdom/nanxing-kindness");
  });
});
