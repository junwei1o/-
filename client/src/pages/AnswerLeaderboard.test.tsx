// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnswerLeaderboard from "./AnswerLeaderboard";

/**
 * 答題榜的載入與失敗重試。
 *
 * 為什麼要重試：Render 免費層閒置後會休眠，回訪的第一個 DB 查詢要重建
 * 連線（實測最壞 10 秒後才失敗，見 perf-audit/PERF-REPORT.md P3）。
 * 第一次失敗時連線往往隨後就建立好了 —— 自動補一次就能拿到資料，
 * 免得學生只看到「榜單目前連不上」還得自己按重新整理。
 */
const cloudApi = vi.hoisted(() => ({
  examLeaderboard: vi.fn(),
}));

vi.mock("@/game/cloudSync", () => ({ cloudApi }));
vi.mock("@/game/identity", () => ({
  getPlayerName: () => "測試船長",
  isGuest: () => false,
}));
vi.mock("wouter", () => ({ useLocation: () => ["/answer-board", vi.fn()] }));
vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

const RECORD = {
  id: 1,
  name: "同學甲",
  subject: "數學",
  grade: 5,
  difficulty: "標準",
  totalQuestions: 10,
  correctCount: 9,
  durationSec: 120,
  createdAt: Date.now(),
};

describe("AnswerLeaderboard 載入與重試", () => {
  beforeEach(() => {
    cloudApi.examLeaderboard.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("載入成功 → 顯示榜單列", async () => {
    cloudApi.examLeaderboard.mockResolvedValue({ records: [RECORD] });
    render(<AnswerLeaderboard />);
    await waitFor(() => expect(screen.getByText("同學甲")).toBeInTheDocument());
    expect(cloudApi.examLeaderboard).toHaveBeenCalledTimes(1);
  });

  it("第一次失敗後自動重試一次，重試成功即顯示榜單（不留錯誤訊息）", async () => {
    cloudApi.examLeaderboard
      .mockRejectedValueOnce(new Error("cold start"))
      .mockResolvedValueOnce({ records: [RECORD] });

    render(<AnswerLeaderboard />);

    // 第一次失敗後，畫面不該立刻宣告失敗（還在等重試）
    await vi.advanceTimersByTimeAsync(0);
    expect(screen.queryByText(/榜單目前連不上/)).toBeNull();
    expect(cloudApi.examLeaderboard).toHaveBeenCalledTimes(1);

    // 到重試時間點後補打一次
    await vi.advanceTimersByTimeAsync(1_200);
    await waitFor(() => expect(cloudApi.examLeaderboard).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText("同學甲")).toBeInTheDocument());
    expect(screen.queryByText(/榜單目前連不上/)).toBeNull();
  });

  it("兩次都失敗 → 才顯示手動重試訊息", async () => {
    cloudApi.examLeaderboard.mockRejectedValue(new Error("down"));
    render(<AnswerLeaderboard />);

    await vi.advanceTimersByTimeAsync(1_300);
    await waitFor(() => expect(screen.getByText(/榜單目前連不上/)).toBeInTheDocument());
    expect(cloudApi.examLeaderboard).toHaveBeenCalledTimes(2);
  });

  it("卸載時取消重試（不再發出請求）", async () => {
    cloudApi.examLeaderboard.mockRejectedValue(new Error("down"));
    const { unmount } = render(<AnswerLeaderboard />);
    await vi.advanceTimersByTimeAsync(0);
    expect(cloudApi.examLeaderboard).toHaveBeenCalledTimes(1);

    unmount();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(cloudApi.examLeaderboard).toHaveBeenCalledTimes(1);
  });
});
