// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AstronomyHall from "./AstronomyHall";
import AstronomyDetail from "./AstronomyDetail";
import WorldPrinciples from "./WorldPrinciples";

const setLocation = vi.fn();
let route = "/astronomy";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => [route, setLocation],
  useParams: () => ({ key: route.split("/").pop() }),
}));

describe("astronomy hall", () => {
  afterEach(() => cleanup());
  beforeEach(() => { route = "/astronomy"; setLocation.mockReset(); });

  it("renders the observatory entry from the wormhole page", () => {
    render(<WorldPrinciples />);
    expect(screen.getByRole("link", { name: /進入天文館/ })).toHaveAttribute("href", "/astronomy");
  });

  it("renders all eight exhibits and routes with click, Enter, and Space", () => {
    render(<AstronomyHall />);
    expect(screen.getByRole("heading", { name: /把夜空變成問題/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(9);
    const solar = screen.getAllByRole("button").find((button) => button.querySelector("h3")?.textContent === "太陽系");
    if (!solar) throw new Error("太陽系展區按鈕不存在");
    fireEvent.click(solar);
    expect(setLocation).toHaveBeenCalledWith("/astronomy/solar-system");
    setLocation.mockClear();
    fireEvent.keyDown(solar, { key: "Enter" });
    expect(setLocation).toHaveBeenCalledWith("/astronomy/solar-system");
    setLocation.mockClear();
    fireEvent.keyDown(solar, { key: " " });
    expect(setLocation).toHaveBeenCalledWith("/astronomy/solar-system");
  });

  it("opens an astronomy-only quiz that remains on the answered question until next is chosen", () => {
    render(<AstronomyHall />);
    fireEvent.click(screen.getByRole("button", { name: /選擇天文難度/ }));
    expect(screen.getByRole("heading", { name: /天文知識.*觀測問答/ })).toBeInTheDocument();
    expect(screen.getByText(/行星、星系、太空任務與觀測工具四個難度層級/)).toBeInTheDocument();
    expect(screen.queryByText(/特攝動漫/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: /行星入門/ })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /太空任務/ }));
    expect(document.querySelector(".astronomy-quiz-meta span")).toHaveTextContent("太空任務");

    const firstOption = screen.getAllByRole("button").find((button) => button.getAttribute("aria-pressed") === "false");
    if (!firstOption) throw new Error("天文題目選項不存在");
    const questionHeading = document.querySelector(".astronomy-quiz-card h2");
    if (!(questionHeading instanceof HTMLHeadingElement)) throw new Error("天文題卡標題不存在");
    const promptBeforeAnswer = questionHeading.textContent;
    fireEvent.click(firstOption);
    expect(document.querySelector(".astronomy-quiz-card h2")).toHaveTextContent(promptBeforeAnswer ?? "");
    expect(screen.getByText(/本題已結算；請閱讀解析後/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /下一題/ })).toBeInTheDocument();
  });

  it("renders detail content and supports the next exhibit keyboard action", () => {
    route = "/astronomy/solar-system";
    render(<AstronomyDetail />);
    expect(screen.getByRole("heading", { level: 1, name: "太陽系" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /返回天文館/ })).toHaveAttribute("href", "/astronomy");
    expect(screen.getByRole("link", { name: "人類火種躍遷蟲洞" })).toHaveAttribute("href", "/principles");
    expect(screen.getByRole("link", { name: "天文館" })).toHaveAttribute("href", "/astronomy");
    expect(screen.getByText(/太陽系以太陽為中心/)).toBeInTheDocument();
    const next = screen.getByRole("button", { name: /下一站：地球與月球/ });
    next.focus();
    fireEvent.keyDown(next, { key: "Enter" });
    expect(setLocation).toHaveBeenCalledWith("/astronomy/earth-moon");
  });
});
