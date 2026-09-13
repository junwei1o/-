// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import OnboardingTour from "./OnboardingTour";
import { bxStore } from "@/game/bxStore";

function decidePrivacy() {
  bxStore.update((s) => {
    s.privacy.ts = Date.now();
    s.privacy.accepted = false;
  });
}

beforeEach(() => {
  localStorage.clear();
  bxStore.reset();
  document.body.className = "";
});

afterEach(() => cleanup());

describe("新手導覽 OnboardingTour", () => {
  it("隱私尚未決定前不顯示", () => {
    render(<OnboardingTour />);
    expect(screen.queryByRole("dialog", { name: "新手導覽" })).not.toBeInTheDocument();
  });

  it("隱私決定後顯示第一步，含步驟計數且第一步沒有上一步", async () => {
    decidePrivacy();
    render(<OnboardingTour />);
    await waitFor(() =>
      expect(screen.getByText("歡迎登船，學習是自己的航行")).toBeInTheDocument(),
    );
    expect(screen.getByText(/新手導覽 1 \/ 6/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "上一步" })).not.toBeInTheDocument();
  });

  it("下一步會推進、上一步可回頭，且全程不被強制阻擋", async () => {
    decidePrivacy();
    render(<OnboardingTour />);
    await waitFor(() => screen.getByText("歡迎登船，學習是自己的航行"));

    act(() => fireEvent.click(screen.getByRole("button", { name: "下一步" })));
    expect(screen.getByText("航海圖，就是你的學習地圖")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();

    act(() => fireEvent.click(screen.getByRole("button", { name: "下一步" })));
    expect(screen.getByText("照自己的步調選島練習")).toBeInTheDocument();

    act(() => fireEvent.click(screen.getByRole("button", { name: "上一步" })));
    expect(screen.getByText("航海圖，就是你的學習地圖")).toBeInTheDocument();
  });

  it("任何步驟都可跳過，跳過後寫入狀態並關閉", async () => {
    decidePrivacy();
    render(<OnboardingTour />);
    await waitFor(() => screen.getByText("歡迎登船，學習是自己的航行"));
    act(() => fireEvent.click(screen.getByRole("button", { name: "下一步" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: /跳過導覽/ })));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "新手導覽" })).not.toBeInTheDocument(),
    );
    expect(bxStore.get<boolean>("onboarding.skipped", false)).toBe(true);
    expect(bxStore.get<boolean>("onboarding.completed", false)).toBe(true);
  });

  it("走完最後一步顯示開始探險，完成後不再顯示", async () => {
    decidePrivacy();
    render(<OnboardingTour />);
    await waitFor(() => screen.getByText("歡迎登船，學習是自己的航行"));
    for (let i = 0; i < 5; i++) {
      act(() => fireEvent.click(screen.getByRole("button", { name: "下一步" })));
    }
    expect(screen.getByText("每天進步一點點")).toBeInTheDocument();
    const start = screen.getByRole("button", { name: /開始探險/ });
    expect(start).toBeInTheDocument();
    act(() => fireEvent.click(start));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "新手導覽" })).not.toBeInTheDocument(),
    );
    expect(bxStore.get<boolean>("onboarding.completed", false)).toBe(true);
    expect(bxStore.get<boolean>("onboarding.skipped", false)).toBe(false);
  });

  it("導覽內容包含 AI 服務商隱私說明，與隱私條款一致", async () => {
    decidePrivacy();
    render(<OnboardingTour />);
    await waitFor(() => screen.getByText("歡迎登船，學習是自己的航行"));
    for (let i = 0; i < 4; i++) {
      act(() => fireEvent.click(screen.getByRole("button", { name: "下一步" })));
    }
    expect(screen.getByText("深度伴讀：引導你自己想通")).toBeInTheDocument();
    expect(screen.getByText(/送往 AI 服務商產生導讀/)).toBeInTheDocument();
  });
});
