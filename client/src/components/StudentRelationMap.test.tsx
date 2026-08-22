// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentRelationMap } from "@/components/StudentRelationMap";
import type { StudentLivingConnections } from "@/lib/studentLivingConnections";

const realLivingConnections: StudentLivingConnections = {
  exam: {
    nodeKey: "exam",
    subject: "自然科學",
    sourceLabel: "來自你最近的實際練習",
    lifeExamples: ["你最近練習的「影子的變化」，可以在觀察校園的天氣、影子或天空時，先找找和它有關的線索。"],
  },
};

const renderMap = (livingConnections?: StudentLivingConnections) => {
  const onOpenExam = vi.fn();
  const onOpenAstronomy = vi.fn();
  const onOpenPrinciples = vi.fn();
  const onOpenCompanion = vi.fn();
  const onOpenInsights = vi.fn();
  const onOpenObservatory = vi.fn();
  render(
    <StudentRelationMap
      studentName="小林"
      level={3}
      completedCount={12}
      progress={24}
      companionName="星芽"
      livingConnections={livingConnections}
      onOpenExam={onOpenExam}
      onOpenAstronomy={onOpenAstronomy}
      onOpenPrinciples={onOpenPrinciples}
      onOpenCompanion={onOpenCompanion}
      onOpenInsights={onOpenInsights}
      onOpenObservatory={onOpenObservatory}
    />,
  );
  return { onOpenExam, onOpenAstronomy, onOpenPrinciples, onOpenCompanion, onOpenInsights, onOpenObservatory };
};

describe("StudentRelationMap", () => {
  afterEach(() => cleanup());

  it("places the student progress at the center and describes the local-only boundary", () => {
    renderMap();
    expect(screen.getByRole("heading", { name: "以我為中心的學習拼圖" })).toBeInTheDocument();
    expect(screen.getByLabelText("小林的學習中心，目前第 3 級，已完成 12 題，整體進度 24%")).toBeInTheDocument();
    expect(screen.getByText("這張地圖只呈現此裝置上的學習進度；不會公開個人資料。")).toBeInTheDocument();
  });

  it("opens the correct learning destination from each relationship puzzle", () => {
    const actions = renderMap();
    fireEvent.click(screen.getByRole("button", { name: /常規試卷/ }));
    fireEvent.click(screen.getByRole("button", { name: /天文館/ }));
    fireEvent.click(screen.getByRole("button", { name: /世界原理/ }));
    fireEvent.click(screen.getByRole("button", { name: /夥伴遠征/ }));
    fireEvent.click(screen.getByRole("button", { name: /學習洞察/ }));
    fireEvent.click(screen.getByRole("button", { name: /動漫觀測/ }));

    expect(actions.onOpenExam).toHaveBeenCalledOnce();
    expect(actions.onOpenAstronomy).toHaveBeenCalledOnce();
    expect(actions.onOpenPrinciples).toHaveBeenCalledOnce();
    expect(actions.onOpenCompanion).toHaveBeenCalledOnce();
    expect(actions.onOpenInsights).toHaveBeenCalledOnce();
    expect(actions.onOpenObservatory).toHaveBeenCalledOnce();
  });

  it("keeps life examples hidden until the student asks for a real learning connection", () => {
    renderMap(realLivingConnections);

    expect(screen.queryByRole("tooltip", { name: "常規試卷的生活連結" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /常規試卷/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the supplied life example on hover and closes it when the pointer leaves", () => {
    renderMap(realLivingConnections);
    const node = screen.getByTestId("student-relation-node-exam");

    fireEvent.mouseEnter(node);
    expect(screen.getByRole("tooltip", { name: "常規試卷的生活連結" })).toHaveTextContent("影子的變化");
    expect(screen.getByRole("tooltip", { name: "常規試卷的生活連結" })).toHaveTextContent("來自你最近的實際練習");

    fireEvent.mouseLeave(node);
    expect(screen.queryByRole("tooltip", { name: "常規試卷的生活連結" })).not.toBeInTheDocument();
  });

  it("shows the life example on keyboard focus with matching ARIA state and Escape closes it", () => {
    renderMap(realLivingConnections);
    const launchButton = screen.getByRole("button", { name: /常規試卷/ });

    fireEvent.focus(launchButton);
    expect(launchButton).toHaveAttribute("aria-expanded", "true");
    expect(launchButton).toHaveAttribute("aria-describedby", "student-living-connection-exam");
    expect(screen.getByRole("tooltip", { name: "常規試卷的生活連結" })).toBeInTheDocument();

    fireEvent.keyDown(launchButton, { key: "Escape" });
    expect(launchButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("tooltip", { name: "常規試卷的生活連結" })).not.toBeInTheDocument();
  });

  it("lets a touch-oriented student toggle the life example without navigating away", () => {
    const actions = renderMap(realLivingConnections);
    const toggle = screen.getByRole("button", { name: "查看生活實例" });

    fireEvent.click(toggle);
    expect(screen.getByRole("tooltip", { name: "常規試卷的生活連結" })).toHaveTextContent("影子的變化");
    expect(actions.onOpenExam).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "收起生活實例" })).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: "收起生活實例" }));
    expect(screen.queryByRole("tooltip", { name: "常規試卷的生活連結" })).not.toBeInTheDocument();
  });

  it("does not invent a life example when no student data was supplied", () => {
    renderMap();

    expect(screen.queryByRole("button", { name: "查看生活實例" })).not.toBeInTheDocument();
    expect(screen.getAllByText("完成練習後，這裡會出現你的生活連結。")).toHaveLength(6);
  });
});
