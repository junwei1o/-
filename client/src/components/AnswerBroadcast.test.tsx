// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnswerBroadcast from "@/components/AnswerBroadcast";

afterEach(() => {
  cleanup();
});

const speak = vi.fn();
const stop = vi.fn();
const setPreferences = vi.fn();

vi.mock("@/lib/speechSynthesis", () => ({
  createSpeechController: () => ({
    isSupported: true,
    speak,
    stop,
    setPreferences,
  }),
}));

describe("AnswerBroadcast", () => {
  beforeEach(() => {
    speak.mockClear();
    stop.mockClear();
    setPreferences.mockClear();
  });

  it("shows the fifth-answer celebration and can replay or close it", () => {
    const onClose = vi.fn();
    render(<AnswerBroadcast answerCount={5} soundEnabled onClose={onClose} />);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/第 5 題/)).toBeTruthy();
    expect(screen.getByText(/每答對五題/)).toBeTruthy();
    expect(speak).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "再播一次" }));
    expect(speak).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports muting the current broadcast and stopping speech on unmount", () => {
    const onClose = vi.fn();
    const { unmount } = render(<AnswerBroadcast answerCount={10} soundEnabled onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "靜音本次彩蛋" }));
    expect(screen.getByRole("button", { name: "開啟本次語音" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "再播一次" }).hasAttribute("disabled")).toBe(true);

    unmount();
    expect(stop).toHaveBeenCalled();
  });
});
