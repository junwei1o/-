/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrincipleGuideQuiz from "./PrincipleGuideQuiz";
import {
  createWormholeGuideSession,
  getWorldPrinciple,
  getWormholeQuestionGuidance,
  getWormholeGuideQuestions,
  WORMHOLE_GUIDE_DOMAINS,
  WORMHOLE_GUIDE_QUESTIONS,
} from "@/lib/worldPrinciples";
import { SCENARIO_FAVORITES_STORAGE_KEY } from "@/lib/scenarioFavorites";
import { PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY } from "@/lib/principleGuideFirstUseTips";
import { STUDENT_GRADE_PREFERENCE_STORAGE_KEY } from "@/lib/studentGradePreference";

describe("人類火種躍遷蟲洞原理引導問答", () => {
  it("以五類可驗證世界原理組成天文與科學邊界清楚的題庫", () => {
    expect(WORMHOLE_GUIDE_DOMAINS).toEqual(["gravity", "light", "energy", "spacetime", "observation"]);
    expect(WORMHOLE_GUIDE_QUESTIONS.length).toBeGreaterThanOrEqual(15);

    WORMHOLE_GUIDE_DOMAINS.forEach((domain) => {
      const questions = getWormholeGuideQuestions(domain);
      expect(questions.length).toBeGreaterThanOrEqual(3);
      expect(questions.every((question) => question.domain === domain)).toBe(true);
      expect(questions.every((question) => question.options.length === 4)).toBe(true);
      expect(questions.every((question) => question.correctIndex >= 0 && question.correctIndex < question.options.length)).toBe(true);
      expect(questions.every((question) => question.principleKeys.length > 0 && question.hint.length > 0 && question.explanation.length > 0)).toBe(true);
    });
  });

  it("為同一原理層建立穩定的固定題組，不混入其他層級", () => {
    const firstSession = createWormholeGuideSession("gravity");
    const secondSession = createWormholeGuideSession("gravity");

    expect(firstSession.map((question) => question.id)).toEqual(secondSession.map((question) => question.id));
    expect(firstSession.every((question) => question.domain === "gravity")).toBe(true);
  });

  it("為每題提供不揭示選項或正解的關鍵詞、推理與迷思學習支架", () => {
    WORMHOLE_GUIDE_QUESTIONS.forEach((question) => {
      const guidance = getWormholeQuestionGuidance(question);

      expect(guidance.keywords.length).toBeGreaterThanOrEqual(3);
      expect(guidance.reasoningSteps).toHaveLength(3);
      expect(guidance.reasoningSteps.every((step) => step.title.length > 0 && step.detail.length > 10)).toBe(true);
      expect(guidance.keywordPrompt.length).toBeGreaterThan(12);
      expect(guidance.misconception.length).toBeGreaterThan(20);
      expect(guidance.visualProbe.signals).toHaveLength(3);
      expect(guidance.optionCheckPrompt.length).toBeGreaterThan(20);
      expect(guidance.relatedPrincipleKeys.length).toBeGreaterThan(0);
      expect(guidance.relatedPrincipleKeys.every((key) => getWorldPrinciple(key) !== undefined)).toBe(true);
      expect(guidance.reflection.choices).toHaveLength(3);
      expect(guidance.ttsText).toContain("原理引導補強");
      expect(guidance.ttsText).not.toContain(question.options[question.correctIndex]);
      expect(guidance.ttsText).not.toContain(question.explanation);
      expect(guidance.visualProbe.prompt).not.toContain(question.options[question.correctIndex]);
      expect(guidance.optionCheckPrompt).not.toContain(question.options[question.correctIndex]);
      expect(guidance.reflection.prompt).not.toContain(question.options[question.correctIndex]);
    });
  });

  it("作答後保留解析，只有明確操作下一題才會前進", () => {
    render(<PrincipleGuideQuiz />);

    const initialQuestion = screen.getByRole("heading", { level: 3 }).textContent;
    fireEvent.click(screen.getByRole("button", { name: /先看線索/ }));
    expect(screen.getByText(/觀測提示：/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /行星的重力持續拉向中心/ }));
    expect(screen.getByText("線索對上了")).toBeTruthy();
    expect(screen.getByText(/重力會使物體互相吸引/)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(initialQuestion);

    fireEvent.click(screen.getByRole("button", { name: /下一題/ }));
    expect(screen.getByRole("heading", { level: 3 }).textContent).not.toBe(initialQuestion);
  });

  it("在作答前呈現可朗讀的關鍵詞、推理與迷思卡，並隨主題切換更新", () => {
    cleanup();
    render(<PrincipleGuideQuiz />);

    expect(screen.getByText("關鍵詞拆解")).toBeTruthy();
    expect(screen.getByText("三步驟推理卡")).toBeTruthy();
    expect(screen.getByText("容易混淆的地方")).toBeTruthy();
    expect(screen.getByText("物體運動")).toBeTruthy();
    expect(screen.getByText("辨識現象")).toBeTruthy();
    expect(screen.getByText("朗讀引導")).toBeTruthy();
    expect(screen.queryByText(/重力會使物體互相吸引/)).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /光/ }));

    expect(screen.getByText("訊號來源")).toBeTruthy();
    expect(screen.getByText("辨識訊號")).toBeTruthy();
    expect(screen.queryByText("物體運動")).toBeNull();
  });

  it("提供不計分的生活地圖情境與可操作遷移選擇，並在下一題重設選擇", () => {
    cleanup();
    render(<PrincipleGuideQuiz />);

    expect(screen.getByText("生活／地圖情境")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "東岸潮線探測任務" })).toBeTruthy();
    expect(screen.getByText(/不計分，也沒有標準選項/)).toBeTruthy();

    const transferChoice = screen.getByRole("button", { name: "標出移動方向與和地標的距離" });
    expect(transferChoice.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(transferChoice);
    expect(transferChoice.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/方向與距離能讓下一輪觀測/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /行星的重力持續拉向中心/ }));
    fireEvent.click(screen.getByRole("button", { name: /下一題/ }));
    expect(screen.getByRole("button", { name: "標出移動方向與和地標的距離" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText(/你的遷移筆記：/)).toBeNull();
  });

  it("在作答前提供可展開的圖像線索與既有原理卡知識連結，不提示答案", () => {
    cleanup();
    render(<PrincipleGuideQuiz />);

    expect(screen.getByText("圖像化微互動")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "軌道線索盤" })).toBeTruthy();
    expect(screen.getByText("知識連結")).toBeTruthy();
    const visualTrigger = screen.getByRole("button", { name: "展開圖像線索" });
    const knowledgeTrigger = screen.getByRole("button", { name: /展開 \d+ 張原理概念卡/ });
    const visualTip = screen.getByText(/展開後可點選一個想先觀察的線索/);
    const knowledgeTip = screen.getByText(/可在新頁查看概念卡/);
    expect(visualTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(knowledgeTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(visualTip.getAttribute("role")).toBe("tooltip");
    expect(knowledgeTip.getAttribute("role")).toBe("tooltip");
    expect(visualTrigger.getAttribute("aria-describedby")).toBe(visualTip.id);
    expect(knowledgeTrigger.getAttribute("aria-describedby")).toBe(knowledgeTip.id);

    fireEvent.click(visualTrigger);
    fireEvent.click(knowledgeTrigger);
    expect(visualTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(knowledgeTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("link").some((link) => link.getAttribute("href")?.startsWith("/principles/"))).toBe(true);

    const visualChoice = screen.getByRole("button", { name: "路徑" });
    fireEvent.click(visualChoice);
    expect(visualChoice.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/先觀察「路徑」/)).toBeTruthy();
    expect(screen.queryByText(/重力會使物體互相吸引/)).toBeNull();
  });

  it("只在兩張卡片各自首次展開時顯示可關閉的如何使用提示，並在重載後維持已看過紀錄", () => {
    cleanup();
    localStorage.clear();
    const firstRender = render(<PrincipleGuideQuiz />);
    const visualTrigger = screen.getByRole("button", { name: "展開圖像線索" });

    fireEvent.click(visualTrigger);
    expect(screen.getByText("如何使用")).toBeTruthy();
    expect(screen.getByText(/先選一個想觀察的線索/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY) ?? "{}")).toEqual({ version: 1, visual: true, knowledge: false });
    fireEvent.click(screen.getByRole("button", { name: "知道了" }));
    expect(screen.queryByText("如何使用")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "收合圖像線索" }));
    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    expect(screen.queryByText("如何使用")).toBeNull();

    const knowledgeTrigger = screen.getByRole("button", { name: /展開 \d+ 張原理概念卡/ });
    fireEvent.click(knowledgeTrigger);
    expect(screen.getByText(/開啟一張概念卡/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "知道了" }));
    expect(JSON.parse(localStorage.getItem(PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY) ?? "{}")).toEqual({ version: 1, visual: true, knowledge: true });

    firstRender.unmount();
    render(<PrincipleGuideQuiz />);
    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    expect(screen.queryByText("如何使用")).toBeNull();
    expect(screen.queryByRole("status")?.textContent).not.toContain("行星的重力持續拉向中心");
  });

  it("會依既有學生年級設定調整首次展開提示的語言層次，且仍不揭示答案", () => {
    cleanup();
    localStorage.clear();
    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: 3 }));
    const lowerGradeRender = render(<PrincipleGuideQuiz />);

    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    expect(screen.getByText(/先選一個你想看的線索/)).toBeTruthy();
    expect(screen.getByText(/自然觀察策略：先看發生什麼/)).toBeTruthy();
    expect(screen.queryByText(/可驗證的圖像線索/)).toBeNull();
    const lowerGradeTip = screen.getAllByRole("status").find((element) => element.textContent?.includes("如何使用"));
    expect(lowerGradeTip).toBeTruthy();
    expect(lowerGradeTip?.textContent).not.toContain("行星的重力持續拉向中心");

    lowerGradeRender.unmount();
    localStorage.clear();
    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: 6 }));
    render(<PrincipleGuideQuiz />);
    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    expect(screen.getByText(/先選擇一項可驗證的圖像線索/)).toBeTruthy();
    expect(screen.getByText(/自然觀察策略：先區分現象、條件與證據/)).toBeTruthy();
    expect(screen.queryByText(/先選一個你想看的線索/)).toBeNull();
    const upperGradeTip = screen.getAllByRole("status").find((element) => element.textContent?.includes("如何使用"));
    expect(upperGradeTip).toBeTruthy();
    expect(upperGradeTip?.textContent).not.toContain("行星的重力持續拉向中心");
  });

  it("會依原理引導領域提供專屬的自然探究策略，且策略不揭示答案", () => {
    cleanup();
    localStorage.clear();
    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: 6 }));
    render(<PrincipleGuideQuiz />);

    fireEvent.click(screen.getByRole("tab", { name: /觀測/ }));
    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    const tip = screen.getAllByRole("status").find((element) => element.textContent?.includes("如何使用"));
    expect(tip?.textContent).toContain("自然探究策略：先辨識變因、可量測資料與重複觀測的需要");
    expect(tip?.textContent).not.toContain("行星的重力持續拉向中心");
  });

  it("只在作答後顯示選項檢核與小型反思，並以不計分互動回顧方法", () => {
    cleanup();
    render(<PrincipleGuideQuiz />);

    expect(screen.queryByText("選項檢核")).toBeNull();
    expect(screen.queryByText("小型反思")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /行星的重力持續拉向中心/ }));

    expect(screen.getByText("選項檢核")).toBeTruthy();
    expect(screen.getByText("小型反思")).toBeTruthy();
    const check = screen.getByRole("button", { name: /回看條件/ });
    fireEvent.click(check);
    expect(check.getAttribute("aria-pressed")).toBe("true");
    const reflection = screen.getByRole("button", { name: "標出方向與參考點" });
    fireEvent.click(reflection);
    expect(reflection.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/你的下一步線索：/)).toBeTruthy();
    expect(screen.getByText(/不會改變本題結果/)).toBeTruthy();
  });

  it("在完成作答後正向回顧已使用的觀察策略，且不依正誤評分", () => {
    cleanup();
    localStorage.clear();
    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: 6 }));
    render(<PrincipleGuideQuiz />);

    expect(screen.queryByText("觀察策略回顧")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    fireEvent.click(screen.getByRole("button", { name: /行星的重力持續拉向中心/ }));

    const recap = screen.getByText("觀察策略回顧").closest("section");
    expect(recap?.textContent).toContain("把剛才的觀察帶到下一題");
    expect(recap?.textContent).toContain("你剛剛運用了圖像線索來整理想法");
    expect(recap?.textContent).toContain("自然觀察策略：先區分現象、條件與證據");
    expect(recap?.textContent).toContain("不會依答對或答錯評分");
    expect(recap?.textContent).not.toContain("表現分數");
  });

  it("在下一題與主題切換時重設圖像、檢核與反思狀態", () => {
    cleanup();
    render(<PrincipleGuideQuiz />);

    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    fireEvent.click(screen.getByRole("button", { name: /展開 \d+ 張原理概念卡/ }));
    const path = screen.getByRole("button", { name: "路徑" });
    fireEvent.click(path);
    fireEvent.click(screen.getByRole("button", { name: /行星的重力持續拉向中心/ }));
    fireEvent.click(screen.getByRole("button", { name: /回看條件/ }));
    fireEvent.click(screen.getByRole("button", { name: "標出方向與參考點" }));
    fireEvent.click(screen.getByRole("button", { name: /下一題/ }));

    expect(screen.getByRole("button", { name: "展開圖像線索" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: /展開 \d+ 張原理概念卡/ }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("選項檢核")).toBeNull();
    expect(screen.queryByText("觀察策略回顧")).toBeNull();
    expect(screen.queryByText(/你的下一步線索：/)).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /光/ }));
    fireEvent.click(screen.getByRole("button", { name: "展開圖像線索" }));
    const source = screen.getByRole("button", { name: "來源" });
    fireEvent.click(source);
    expect(source.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: /重力/ }));
    fireEvent.click(screen.getByRole("tab", { name: /光/ }));
    expect(screen.getByRole("button", { name: "展開圖像線索" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("可收藏情境、在重載後恢復，並從快速複習回到對應原理題", () => {
    cleanup();
    localStorage.clear();
    const firstRender = render(<PrincipleGuideQuiz />);

    const saveButton = screen.getByRole("button", { name: /收藏東岸潮線探測任務/ });
    fireEvent.click(saveButton);
    expect(saveButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/已收藏「東岸潮線探測任務」/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(SCENARIO_FAVORITES_STORAGE_KEY) ?? "{}").questionIds).toEqual(["wormhole-gravity-orbit"]);

    firstRender.unmount();
    render(<PrincipleGuideQuiz />);
    expect(screen.getByRole("button", { name: /^東岸潮線探測任務/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /光/ }));
    fireEvent.click(screen.getByRole("button", { name: /^東岸潮線探測任務/ }));
    expect(screen.getByRole("heading", { name: "東岸潮線探測任務" })).toBeTruthy();
    expect(screen.getByText(/已開啟「東岸潮線探測任務」/)).toBeTruthy();
  });

  it("可取消收藏，且無收藏時提供清楚的快速複習空狀態", () => {
    cleanup();
    localStorage.clear();
    render(<PrincipleGuideQuiz />);

    expect(screen.getByText(/尚未收藏情境/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /收藏東岸潮線探測任務/ }));
    fireEvent.click(screen.getByRole("button", { name: /取消收藏東岸潮線探測任務/ }));
    expect(screen.getByText(/尚未收藏情境/)).toBeTruthy();
    expect(localStorage.getItem(SCENARIO_FAVORITES_STORAGE_KEY)).toContain("questionIds");
  });

  it("可依學科領域與主題篩選收藏情境，並能清除條件回到全部筆記", () => {
    cleanup();
    localStorage.setItem(SCENARIO_FAVORITES_STORAGE_KEY, JSON.stringify({
      version: 1,
      questionIds: ["wormhole-gravity-orbit", "wormhole-light-spectrum", "wormhole-energy-source"],
    }));
    render(<PrincipleGuideQuiz />);

    const gravityTitle = getWormholeQuestionGuidance(WORMHOLE_GUIDE_QUESTIONS.find((entry) => entry.id === "wormhole-gravity-orbit")!).scenario.title;
    const lightTitle = getWormholeQuestionGuidance(WORMHOLE_GUIDE_QUESTIONS.find((entry) => entry.id === "wormhole-light-spectrum")!).scenario.title;
    const energyTitle = getWormholeQuestionGuidance(WORMHOLE_GUIDE_QUESTIONS.find((entry) => entry.id === "wormhole-energy-source")!).scenario.title;
    const domainFilter = screen.getByLabelText("學科領域");
    const topicFilter = screen.getByLabelText("主題");

    fireEvent.change(domainFilter, { target: { value: "light" } });
    expect(screen.getByRole("button", { name: new RegExp(`^${lightTitle}`) })).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(`^${gravityTitle}`) })).toBeNull();
    expect(screen.queryByRole("button", { name: new RegExp(`^${energyTitle}`) })).toBeNull();

    fireEvent.change(domainFilter, { target: { value: "gravity" } });
    fireEvent.change(topicFilter, { target: { value: "quantum" } });
    expect(screen.getByText(/目前沒有符合篩選條件的收藏情境/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "清除篩選" }));
    expect(screen.getByRole("button", { name: new RegExp(`^${gravityTitle}`) })).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(`^${lightTitle}`) })).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(`^${energyTitle}`) })).toBeTruthy();
  });
});
