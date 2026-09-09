// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SafetyAcademy from "./SafetyAcademy";
import SafetyAcademyDetail from "./SafetyAcademyDetail";
import { RPG_STORAGE_KEY } from "@/game/rpgStorage";

const setLocation = vi.fn();
let route = "/safety";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useLocation: () => [route, setLocation],
  useParams: () => ({ key: route.split("/").pop() }),
}));

function readSavedState() {
  const raw = localStorage.getItem(RPG_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("生活安全學院頁面", () => {
  beforeEach(() => {
    localStorage.clear();
    route = "/safety";
    setLocation.mockReset();
  });
  afterEach(() => cleanup());

  it("列表頁呈現 20 張知識卡與安全守則，點擊卡片進入詳情", () => {
    render(<SafetyAcademy />);
    expect(screen.getByRole("heading", { name: /生活安全學院/ })).toBeInTheDocument();
    expect(screen.getByText(/安全第一守則/)).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent?.trim() === "20 張知識卡")).toBeInTheDocument();
    const cards = screen.getAllByRole("button").filter((button) => button.querySelector("h3"));
    expect(cards).toHaveLength(20);
    fireEvent.click(cards[0]);
    expect(setLocation).toHaveBeenCalledWith(expect.stringMatching(/^\/safety\//));
  });

  it("主題館篩選只顯示該館 5 張卡", () => {
    render(<SafetyAcademy />);
    fireEvent.click(screen.getByRole("button", { name: /醫療常識館/ }));
    const cards = screen.getAllByRole("button").filter((button) => button.querySelector("h3"));
    expect(cards).toHaveLength(5);
    expect(screen.getByRole("button", { name: /什麼時候請大人撥打 119/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /火場逃生/ })).not.toBeInTheDocument();
  });

  it("詳情頁答錯可重試，首次答對發放 2 金幣且只發一次", () => {
    route = "/safety/fire-evacuation";
    const { unmount } = render(<SafetyAcademyDetail />);
    expect(screen.getByRole("heading", { level: 1, name: /火場逃生/ })).toBeInTheDocument();

    // 先答錯
    fireEvent.click(screen.getByRole("button", { name: /搭電梯最快下樓/ }));
    fireEvent.click(screen.getByRole("button", { name: "送出答案" }));
    expect(screen.getByText(/再想想看/)).toBeInTheDocument();
    expect(readSavedState()?.coins).toBe(18);

    // 重試並答對
    fireEvent.click(screen.getByRole("button", { name: /再試一次/ }));
    fireEvent.click(screen.getByRole("button", { name: /先摸門把和門板判斷外面是否安全/ }));
    fireEvent.click(screen.getByRole("button", { name: "送出答案" }));
    expect(screen.getByText(/答對了/)).toBeInTheDocument();
    expect(screen.getByText(/金幣！可到每日營地商店/)).toBeInTheDocument();

    const saved = readSavedState();
    expect(saved.coins).toBe(20);
    expect(saved.safetyAcademyProgress["fire-evacuation"].completedAt).toBeGreaterThan(0);

    // 重新進入頁面：已完成卡片不再發幣
    unmount();
    render(<SafetyAcademyDetail />);
    expect(screen.getByText(/你已經完成過這張卡/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /先摸門把和門板判斷外面是否安全/ }));
    fireEvent.click(screen.getByRole("button", { name: "送出答案" }));
    expect(screen.queryByText(/金幣！可到每日營地商店/)).not.toBeInTheDocument();
    expect(readSavedState().coins).toBe(20);
  });

  it("醫療館詳情頁顯示就醫提醒", () => {
    route = "/safety/fever-care";
    render(<SafetyAcademyDetail />);
    expect(screen.getByText(/不能取代醫生的診斷/)).toBeInTheDocument();
  });

  it("未知卡片顯示找不到頁面", () => {
    route = "/safety/not-exists";
    render(<SafetyAcademyDetail />);
    expect(screen.getByRole("heading", { name: "找不到這張知識卡" })).toBeInTheDocument();
  });
});
