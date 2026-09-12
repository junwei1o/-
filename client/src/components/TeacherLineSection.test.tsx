// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TeacherLineSection } from "./TeacherLineSection";

const lineMocks = vi.hoisted(() => ({
  getBinding: vi.fn(),
  sendTest: vi.fn(),
  clearBinding: vi.fn(),
  refetch: vi.fn(async () => {}),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    line: {
      getBinding: { useQuery: () => ({ data: lineMocks.getBinding(), isLoading: false, refetch: lineMocks.refetch }) },
      sendTest: { useMutation: () => ({ mutateAsync: lineMocks.sendTest, isPending: false }) },
      clearBinding: { useMutation: () => ({ mutateAsync: lineMocks.clearBinding, isPending: false }) },
    },
  },
}));

beforeEach(() => {
  lineMocks.getBinding.mockClear();
  lineMocks.sendTest.mockClear();
  lineMocks.clearBinding.mockClear();
  lineMocks.refetch.mockClear();
  lineMocks.sendTest.mockResolvedValue({ ok: true });
  lineMocks.clearBinding.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
});

describe("TeacherLineSection 督學台 LINE 通知設定", () => {
  it("金鑰未設定時顯示三步驟引導", () => {
    lineMocks.getBinding.mockReturnValue({ envReady: false, binding: null });
    render(<TeacherLineSection />);
    expect(screen.getByRole("heading", { name: "LINE 通知" })).toBeInTheDocument();
    expect(screen.getByText(/建立 LINE 機器人/)).toBeInTheDocument();
    expect(screen.getByText(/LINE_CHANNEL_ACCESS_TOKEN/)).toBeInTheDocument();
  });

  it("已啟用但未綁定時顯示綁定步驟", () => {
    lineMocks.getBinding.mockReturnValue({ envReady: true, binding: null });
    render(<TeacherLineSection />);
    expect(screen.getByText(/加入機器人/)).toBeInTheDocument();
    expect(screen.getByText(/傳任一訊息綁定/)).toBeInTheDocument();
  });

  it("已綁定群組時顯示綁定資訊，測試與解除按鈕可用", async () => {
    lineMocks.getBinding.mockReturnValue({
      envReady: true,
      binding: { recipientType: "group", recipientId: "G123", updatedAt: 1_780_000_000_000 },
    });
    render(<TeacherLineSection />);
    expect(screen.getByText("LINE 群組")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /傳送測試訊息/ }));
    await waitFor(() => expect(lineMocks.sendTest).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /解除綁定/ }));
    await waitFor(() => expect(lineMocks.clearBinding).toHaveBeenCalledTimes(1));
    expect(lineMocks.refetch).toHaveBeenCalled();
  });

  it("已綁定個人時顯示個人對話", () => {
    lineMocks.getBinding.mockReturnValue({
      envReady: true,
      binding: { recipientType: "user", recipientId: "U456", updatedAt: 1_780_000_000_000 },
    });
    render(<TeacherLineSection />);
    expect(screen.getByText("個人對話")).toBeInTheDocument();
  });
});
