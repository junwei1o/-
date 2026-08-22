// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/TopNavigation", () => ({ default: () => <nav aria-label="主要導覽">導覽</nav> }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./components/ErrorBoundary", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/pages/PaperExam", () => ({ default: () => <main>試卷頁</main> }));
vi.mock("@/pages/BattleScene", () => ({ default: () => <main aria-label="獨立對戰場景">戰鬥頁</main> }));
vi.mock("@/pages/RegionDetail", () => ({ default: () => <main>區域頁</main> }));
vi.mock("@/pages/MediaObservatory", () => ({ default: () => <main>觀測站</main> }));
vi.mock("@/pages/MediaObservatoryDetail", () => ({ default: () => <main>觀測站詳情</main> }));
vi.mock("@/pages/WorldPrinciples", () => ({ default: () => <main>原理引導</main> }));
vi.mock("@/pages/WorldPrincipleDetail", () => ({ default: () => <main>原理詳情</main> }));
vi.mock("@/pages/AstronomyHall", () => ({ default: () => <main>天文館</main> }));
vi.mock("@/pages/AstronomyDetail", () => ({ default: () => <main>天文詳情</main> }));
vi.mock("@/pages/WisdomHall", () => ({ default: () => <main>智慧館</main> }));
vi.mock("@/pages/WisdomStoryDetail", () => ({ default: () => <main>故事詳情</main> }));
vi.mock("@/pages/LearningInsights", () => ({ default: () => <main>學習洞察</main> }));
vi.mock("@/pages/StudentMap", () => ({ default: () => <main>我的地圖</main> }));
vi.mock("@/pages/NotFound", () => ({ default: () => <main>找不到頁面</main> }));

import App from "./App";

describe("App routing", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("renders the standalone battle scene at /battle instead of the paper exam", () => {
    window.history.replaceState({}, "", "/battle");

    render(<App />);

    expect(screen.getByRole("main", { name: "獨立對戰場景" })).toBeInTheDocument();
    expect(screen.queryByText("試卷頁")).not.toBeInTheDocument();
  });
});
