// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BxEmptyState } from "./EmptyState";
import FirstLightQuest from "./FirstLightQuest";
import PrivacyBanner from "./PrivacyBanner";
import OnboardingTour from "./OnboardingTour";
import PrefsPanel from "./PrefsPanel";
import { bxStore } from "@/game/bxStore";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/", vi.fn()],
}));

beforeEach(() => {
  localStorage.clear();
  bxStore.reset();
  document.documentElement.className = "";
});

afterEach(() => cleanup());

describe("BX 空狀態", () => {
  it("新手無資料時顯示航海風空狀態與 CTA", () => {
    render(<BxEmptyState slot="footprint" filled={<div>我的足跡內容</div>} />);
    expect(screen.getByText(/海面還很平靜/)).toBeInTheDocument();
    expect(screen.getByText("立刻起航 →")).toBeInTheDocument();
    expect(screen.queryByText("我的足跡內容")).not.toBeInTheDocument();
  });

  it("有答題資料後改顯示真實內容", () => {
    bxStore.logAnswer({ subject: "math", topic: "加減法", correct: true, coinReward: 5 });
    render(<BxEmptyState slot="footprint" filled={<div>我的足跡內容</div>} />);
    expect(screen.getByText("我的足跡內容")).toBeInTheDocument();
  });
});

describe("第一盞燈任務", () => {
  it("新手顯示金色任務橫幅 0/1", () => {
    render(<FirstLightQuest />);
    expect(screen.getByText("新手任務：點亮第一盞燈")).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 1/)).toBeInTheDocument();
  });

  it("答對一題後轉為「第一盞燈亮了」階段", () => {
    bxStore.logAnswer({ subject: "chinese", topic: "字形", correct: true, coinReward: 3 });
    render(<FirstLightQuest />);
    expect(screen.getByText("第一盞燈亮了！✨")).toBeInTheDocument();
  });
});

describe("隱私橫幅", () => {
  it("接受後寫入隱私同意並關閉橫幅", async () => {
    render(<PrivacyBanner />);
    expect(screen.getByText("航海前的隱私約定")).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "好的，開始航行" }));
    });
    expect(bxStore.get<boolean>("privacy.accepted", false)).toBe(true);
    await waitFor(() => expect(screen.queryByText("航海前的隱私約定")).not.toBeInTheDocument());
  });

  it("可展開詳細隱私說明", () => {
    render(<PrivacyBanner />);
    expect(screen.queryByText(/不會收集：/)).not.toBeVisible();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /了解資料如何運作/ }));
    });
    expect(screen.getByText(/不會收集：/)).toBeVisible();
  });

  it("首訪隱私約定必須揭露 AI 服務商傳輸（合規）", () => {
    render(<PrivacyBanner />);
    expect(screen.getByText(/深度反思時，題目內容會送往 AI 服務商/)).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /了解資料如何運作/ }));
    });
    expect(screen.getByText(/AI 深度伴讀/)).toBeVisible();
  });
});

describe("隱私 → 新手導覽 整合流程", () => {
  it("尚未做隱私決定前，不顯示導覽", () => {
    render(
      <>
        <PrivacyBanner />
        <OnboardingTour />
      </>,
    );
    expect(screen.getByText("航海前的隱私約定")).toBeInTheDocument();
    expect(screen.queryByText(/歡迎登船/)).not.toBeInTheDocument();
  });

  it("略過隱私後仍會進入新手導覽", async () => {
    render(
      <>
        <PrivacyBanner />
        <OnboardingTour />
      </>,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /略過，先體驗看看/ }));
    });
    expect(bxStore.get<boolean>("privacy.accepted", false)).toBe(false);
    await waitFor(() =>
      expect(screen.getByText("歡迎登船，學習是自己的航行")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.queryByText("航海前的隱私約定")).not.toBeInTheDocument(),
    );
  });

  it("同意隱私後也會進入新手導覽", async () => {
    render(
      <>
        <PrivacyBanner />
        <OnboardingTour />
      </>,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "好的，開始航行" }));
    });
    await waitFor(() =>
      expect(screen.getByText("歡迎登船，學習是自己的航行")).toBeInTheDocument(),
    );
  });
});

describe("顯示偏好", () => {
  it("切換減少動畫會在 html 加上對應類別", () => {
    render(<PrefsPanel />);
    expect(document.documentElement.classList.contains("bx-reduce-motion")).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("checkbox", { name: /減少動畫/ }));
    });
    expect(document.documentElement.classList.contains("bx-reduce-motion")).toBe(true);
  });
});
