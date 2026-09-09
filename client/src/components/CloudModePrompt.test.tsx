// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import CloudModePrompt, { CloudModeDialog } from "./CloudModePrompt";
import { bxStore } from "@/game/bxStore";
import { chooseLocalMode, hasChosenMode } from "@/game/cloudSync";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function acceptPrivacy() {
  bxStore.update((s) => {
    s.privacy.accepted = true;
  });
}

describe("進站儲存方式卡", () => {
  it("隱私未同意時不顯示", () => {
    render(<CloudModePrompt />);
    expect(screen.queryByText("選擇你的航行方式")).not.toBeInTheDocument();
  });

  it("隱私同意且未選過模式時顯示兩個選項", () => {
    acceptPrivacy();
    render(<CloudModePrompt />);
    expect(screen.getByText("選擇你的航行方式")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /存在這台裝置/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /雲端船籍/ })).toBeInTheDocument();
  });

  it("選「存在這台裝置」後記住選擇並關閉", () => {
    acceptPrivacy();
    render(<CloudModePrompt />);
    fireEvent.click(screen.getByRole("button", { name: /存在這台裝置/ }));
    expect(hasChosenMode()).toBe(true);
    expect(screen.queryByText("選擇你的航行方式")).not.toBeInTheDocument();
  });

  it("已選過模式就不再顯示", () => {
    acceptPrivacy();
    chooseLocalMode();
    render(<CloudModePrompt />);
    expect(screen.queryByText("選擇你的航行方式")).not.toBeInTheDocument();
  });
});

describe("雲端船籍對話框", () => {
  it("選雲端後可輸入名字，過短名字顯示錯誤", () => {
    render(<CloudModeDialog open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /雲端船籍/ }));
    const input = screen.getByLabelText("船長名字");
    fireEvent.change(input, { target: { value: "張" } });
    fireEvent.click(screen.getByRole("button", { name: /開船 \/ 回航/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("至少 2 個字");
  });

  it("名字輸入流程可返回上一步", () => {
    render(<CloudModeDialog open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /雲端船籍/ }));
    fireEvent.click(screen.getByRole("button", { name: "返回" }));
    expect(screen.getByText("選擇你的航行方式")).toBeInTheDocument();
  });
});
