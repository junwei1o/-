// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeechReadButton } from "./SpeechReadButton";

const controller = {
  isSupported: true,
  speak: vi.fn((_text: string, onStatus?: (status: "idle" | "speaking" | "paused" | "unsupported" | "error") => void) => {
    onStatus?.("speaking");
    return true;
  }),
  pause: vi.fn((onStatus?: (status: "idle" | "speaking" | "paused" | "unsupported" | "error") => void) => {
    onStatus?.("paused");
    return true;
  }),
  resume: vi.fn((onStatus?: (status: "idle" | "speaking" | "paused" | "unsupported" | "error") => void) => {
    onStatus?.("speaking");
    return true;
  }),
  stop: vi.fn((onStatus?: (status: "idle" | "speaking" | "paused" | "unsupported" | "error") => void) => {
    onStatus?.("idle");
  }),
};

vi.mock("@/lib/speechSynthesis", () => ({
  createSpeechController: () => controller,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SpeechReadButton", () => {
  it("does not attempt to speak empty content", () => {
    render(<SpeechReadButton text="   " label="空內容" />);
    fireEvent.click(screen.getByRole("button", { name: /朗讀：空內容/ }));
    expect(controller.speak).not.toHaveBeenCalled();
  });

  it("starts, pauses, resumes, and stops speech from touch-safe controls", () => {
    render(<SpeechReadButton text="海水為什麼是鹹的？" label="題目" compact />);

    fireEvent.click(screen.getByRole("button", { name: /朗讀：題目/ }));
    expect(controller.speak).toHaveBeenCalledWith("海水為什麼是鹹的？", expect.any(Function), undefined);
    expect(screen.getByRole("button", { name: /暫停：題目/ })).toBeInTheDocument();
    expect(screen.queryByText("朗讀中")).not.toBeInTheDocument();
    expect(screen.getByTestId("speech-state")).toHaveAttribute("data-speech-status", "speaking");
    expect(screen.getByTestId("speech-wave")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /暫停：題目/ }));
    expect(controller.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /繼續：題目/ })).toBeInTheDocument();
    expect(screen.getByTestId("speech-state")).toHaveAttribute("data-speech-status", "paused");

    fireEvent.click(screen.getByRole("button", { name: /繼續：題目/ }));
    expect(controller.resume).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /停止題目/ }));
    expect(controller.stop).toHaveBeenCalled();
  });
});
