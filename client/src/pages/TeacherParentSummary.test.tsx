// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeacherParentSummary from "./TeacherParentSummary";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/learning-summary", setLocation],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    questionBank: {
      list: {
        useQuery: () => ({
          data: [
            {
              id: "review-math",
              prompt: "一張地圖分成八等份，小芸走了其中三份。她走了全程的幾分之幾？",
              options: ["3/8", "5/8", "8/3"],
              answer: "3/8",
              explanation: "已走的三份除以全部八份，所以是 3/8。",
            },
          ],
          isLoading: false,
        }),
      },
    },
  },
}));

describe("TeacherParentSummary", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocation.mockReset();
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel: vi.fn(), speak: vi.fn() },
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class MockSpeechSynthesisUtterance {
        text: string;
        constructor(text: string) { this.text = text; }
      },
    });
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("shows an honest empty state without inventing island activity", () => {
    render(<TeacherParentSummary />);

    expect(screen.getByRole("heading", { name: "四座知識島陪讀摘要" })).toBeInTheDocument();
    expect(screen.getByText("資料只留在此裝置")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "等待第一段探險足跡" })).toBeInTheDocument();
    expect(screen.getByText("完成題目後，實際出現的知識點會在這裡留下線索。")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "各島嶼學習摘要" })).not.toBeInTheDocument();
  });

  it("routes empty-state map action and supporter readout accessibly", () => {
    render(<TeacherParentSummary />);

    fireEvent.click(screen.getByRole("button", { name: "前往我的地圖" }));
    expect(setLocation).toHaveBeenCalledWith("/map");

    setLocation.mockReset();
    fireEvent.click(screen.getByRole("button", { name: "朗讀摘要" }));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "已朗讀" })).toBeInTheDocument();
  });

  it("shows verified current-week reinforcement entries for family review and reads the journal", () => {
    const completedAt = Date.now();
    localStorage.setItem("xue-adventure.map-reinforcement-journal.v1", JSON.stringify([
      { questionId: "reinforcement-math", subject: "數學", knowledge: "分數比較", completedAt },
      { questionId: "reinforcement-science", subject: "自然", knowledge: "水循環", completedAt: completedAt - 1000 },
    ]));

    render(<TeacherParentSummary />);

    const journal = screen.getByTestId("supporter-reinforcement-journal");
    expect(journal).toHaveTextContent("本週補強小航誌");
    expect(journal).toHaveTextContent("分數比較");
    expect(journal).toHaveTextContent("水循環");
    expect(journal).toHaveTextContent("量與關係島");
    expect(journal).toHaveTextContent("觀察實驗島");
    expect(screen.getByRole("list", { name: "本週已完成的一題補強" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "朗讀本週補強小航誌" }));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "朗讀本週補強小航誌" })).toHaveTextContent("已朗讀航誌");
  });

  it("keeps the family journal empty state honest when no verified reinforcement exists this week", () => {
    render(<TeacherParentSummary />);

    const journal = screen.getByTestId("supporter-reinforcement-journal");
    expect(journal).toHaveTextContent("本週尚未留下補強紀錄");
    expect(screen.queryByRole("list", { name: "本週已完成的一題補強" })).not.toBeInTheDocument();
    expect(screen.getByTestId("supporter-reinforcement-distribution")).toHaveTextContent("過去四週尚無可驗證的補強主題紀錄");
  });

  it("lets family members switch among the current and previous three reinforcement weeks without inventing entries", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const currentWeekStart = Date.UTC(2026, 7, 17, 0, 0, 0);
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("xue-adventure.map-reinforcement-journal.v1", JSON.stringify([
      { questionId: "current-math", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1000 },
      { questionId: "last-science", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart - 1000 },
      { questionId: "three-weeks-language", subject: "國語", knowledge: "成語運用", completedAt: currentWeekStart - 20 * 24 * 60 * 60 * 1000 },
    ]));

    render(<TeacherParentSummary />);
    const journal = screen.getByTestId("supporter-reinforcement-journal");
    expect(journal).toHaveTextContent("分數比較");
    expect(screen.getByRole("button", { name: "本週" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "上週" }));
    expect(screen.getByRole("button", { name: "上週" })).toHaveAttribute("aria-pressed", "true");
    expect(journal).toHaveTextContent("水循環");
    expect(journal).not.toHaveTextContent("分數比較");
    expect(screen.getByRole("list", { name: "上週已完成的一題補強" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "前兩週" }));
    expect(journal).toHaveTextContent("前兩週尚未留下補強紀錄");
    expect(screen.queryByRole("list", { name: "前兩週已完成的一題補強" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "前三週" }));
    expect(journal).toHaveTextContent("成語運用");
    expect(localStorage.getItem("xue-adventure.supporter-reinforcement-week.v1")).toBe("3");
    fireEvent.click(screen.getByRole("button", { name: "朗讀前三週補強小航誌" }));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("shows a screen-reader-friendly four-week topic distribution from real reinforcement records and reads it", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const currentWeekStart = Date.UTC(2026, 7, 17, 0, 0, 0);
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("xue-adventure.map-reinforcement-journal.v1", JSON.stringify([
      { questionId: "fraction-current", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1_000 },
      { questionId: "fraction-last", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart - 1_000 },
      { questionId: "water-previous", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart - 8 * 24 * 60 * 60 * 1000 },
    ]));

    render(<TeacherParentSummary />);

    const distribution = screen.getByTestId("supporter-reinforcement-distribution");
    expect(distribution).toHaveTextContent("過去四週補強主題分布");
    expect(distribution).toHaveTextContent("分數比較");
    expect(distribution).toHaveTextContent("水循環");
    expect(distribution).toHaveTextContent("2 筆");
    expect(screen.getByRole("progressbar", { name: "數學科分數比較的補強紀錄數" })).toHaveAttribute("aria-valuenow", "2");

    fireEvent.click(screen.getByRole("button", { name: "朗讀過去四週補強主題分布" }));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "朗讀過去四週補強主題分布" })).toHaveTextContent("已朗讀分布");
  });

  it("shows an encouraging verified current-week comparison beside the topic distribution", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const currentWeekStart = Date.UTC(2026, 7, 17, 0, 0, 0);
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("xue-adventure.map-reinforcement-journal.v1", JSON.stringify([
      { questionId: "current-math", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1_000 },
      { questionId: "current-science", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart + 2_000 },
      { questionId: "previous-language", subject: "國語", knowledge: "成語運用", completedAt: currentWeekStart - 1_000 },
    ]));

    render(<TeacherParentSummary />);

    const trend = screen.getByRole("complementary", { name: "本週較上週補強趨勢" });
    expect(trend).toHaveTextContent("本週較上週");
    expect(trend).toHaveTextContent("本週多留下 1 筆補強足跡");
    expect(trend).toHaveTextContent("本週完成 2 筆，上週為 1 筆");
    expect(trend).toHaveTextContent("本週2 筆");
    expect(trend).toHaveTextContent("上週1 筆");

    fireEvent.click(screen.getByRole("button", { name: "朗讀過去四週補強主題分布" }));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("keeps the comparison transparent when neither week has verifiable reinforcement records", () => {
    render(<TeacherParentSummary />);

    const trend = screen.getByRole("complementary", { name: "本週較上週補強趨勢" });
    expect(trend).toHaveTextContent("等待新的補強足跡");
    expect(trend).toHaveTextContent("本週與上週都還沒有可比較的補強紀錄");
    expect(trend).toHaveTextContent("本週0 筆");
    expect(trend).toHaveTextContent("上週0 筆");
  });

  it("shows verified topic details on hover, focus, tap, and Escape without hiding the touch alternative", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const currentWeekStart = Date.UTC(2026, 7, 17, 0, 0, 0);
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("xue-adventure.map-reinforcement-journal.v1", JSON.stringify([
      { questionId: "fraction-current", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1_000 },
      { questionId: "fraction-last", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart - 1_000 },
    ]));

    render(<TeacherParentSummary />);

    const trigger = screen.getByRole("button", { name: "查看數學科分數比較的詳細補強資料" });
    const topicItem = trigger.closest("li");
    expect(topicItem).not.toBeNull();

    fireEvent.mouseEnter(topicItem!);
    expect(screen.getByRole("tooltip", { name: "分數比較的詳細補強資料" })).toHaveTextContent("數學科 · 量與關係島");
    expect(screen.getByRole("tooltip", { name: "分數比較的詳細補強資料" })).toHaveTextContent("累計完成 2 筆真實補強紀錄");
    expect(screen.getByRole("tooltip", { name: "分數比較的詳細補強資料" })).toHaveTextContent("統計範圍：UTC");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseLeave(topicItem!);
    expect(screen.queryByRole("tooltip", { name: "分數比較的詳細補強資料" })).not.toBeInTheDocument();

    fireEvent.focus(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(topicItem!, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(screen.getByRole("tooltip", { name: "分數比較的詳細補強資料" })).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole("tooltip", { name: "分數比較的詳細補強資料" })).not.toBeInTheDocument();
  });

  it("filters island cards and real attempts by island and date range, then clears", () => {
    const first = new Date(2026, 5, 1, 10).getTime();
    const second = new Date(2026, 5, 12, 10).getTime();
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts: [
      { questionId: "math-old", timestamp: first, correct: true, hintsUsed: 0, curriculumDomain: "數學", difficulty: "標準", responseMs: 9000, timeLimitMs: 25000, knowledge: ["分數與比例"] },
      { questionId: "science-new", timestamp: second, correct: true, hintsUsed: 0, curriculumDomain: "自然", difficulty: "標準", responseMs: 9000, timeLimitMs: 25000, knowledge: ["觀察證據"] },
    ] }));

    render(<TeacherParentSummary />);
    fireEvent.change(screen.getByRole("combobox", { name: "依知識島嶼篩選" }), { target: { value: "數學" } });
    expect(screen.getAllByText("分數與比例")).toHaveLength(2);
    expect(screen.queryByText("觀察證據")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("學習紀錄開始日期"), { target: { value: "2026-06-20" } });
    expect(screen.getByRole("heading", { name: "這段航線還沒有紀錄" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "清除篩選" })[0]);
    expect(screen.getAllByText("觀察證據")).toHaveLength(2);
  });

  it("renders four island cards only from real adaptive attempts", () => {
    const now = Date.now();
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({
      version: 2,
      attempts: [
        {
          questionId: "q-1",
          timestamp: now,
          correct: true,
          hintsUsed: 0,
          curriculumDomain: "數學",
          difficulty: "標準",
          responseMs: 9000,
          timeLimitMs: 25000,
          knowledge: ["分數與比例"],
        },
      ],
    }));

    render(<TeacherParentSummary />);

    expect(screen.getByRole("heading", { name: "各島嶼學習摘要" })).toBeInTheDocument();
    expect(screen.getAllByText("分數與比例")).toHaveLength(2);
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.getAllByRole("button", { name: "查看島嶼" })).toHaveLength(4);
    const resourceLinks = screen.getAllByRole("link", { name: "延伸資源" });
    expect(resourceLinks).toHaveLength(4);
    resourceLinks.forEach((link) => expect(link).toHaveAttribute("target", "_blank"));

    fireEvent.click(screen.getAllByRole("button", { name: "查看島嶼" })[0]);
    expect(setLocation).toHaveBeenCalledWith("/map?subject=%E6%95%B8%E5%AD%B8");
  });

  it("shows real cross-island attempts in chronological timeline order and follows filters", () => {
    const first = new Date(2026, 5, 2, 9).getTime();
    const second = new Date(2026, 5, 4, 11).getTime();
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts: [
      { questionId: "science-1", timestamp: second, correct: true, hintsUsed: 0, curriculumDomain: "自然", difficulty: "標準", responseMs: 9000, timeLimitMs: 25000, knowledge: ["觀察證據"] },
      { questionId: "math-1", timestamp: first, correct: true, hintsUsed: 0, curriculumDomain: "數學", difficulty: "標準", responseMs: 9000, timeLimitMs: 25000, knowledge: ["分數與比例"] },
    ] }));

    render(<TeacherParentSummary />);

    expect(screen.getByRole("heading", { name: "跨島學習時間軸" })).toBeInTheDocument();
    const timeline = screen.getByRole("list", { name: "跨島學習足跡時間軸" });
    expect(timeline.textContent).toMatch(/分數與比例[\s\S]*觀察證據/);
    expect(screen.getByRole("article", { name: /數學島，分數與比例/ })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "依知識島嶼篩選" }), { target: { value: "自然" } });
    expect(screen.getByRole("list", { name: "跨島學習足跡時間軸" }).textContent).toContain("觀察證據");
    expect(screen.queryByRole("article", { name: /數學島，分數與比例/ })).not.toBeInTheDocument();
  });

  it("opens a real question recap from a timeline node and safely explains unavailable records", () => {
    const now = new Date(2026, 6, 4, 10).getTime();
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts: [
      { questionId: "review-math", timestamp: now, correct: true, hintsUsed: 0, curriculumDomain: "數學", difficulty: "標準", responseMs: 9000, timeLimitMs: 25000, knowledge: ["分數與比例"] },
      { questionId: "missing-record", timestamp: now + 1000, correct: false, hintsUsed: 0, curriculumDomain: "自然", difficulty: "標準", responseMs: 9000, timeLimitMs: 25000, knowledge: ["觀察證據"] },
    ] }));

    render(<TeacherParentSummary />);

    const reviewButtons = screen.getAllByRole("button", { name: "查看相關題目" });
    fireEvent.click(reviewButtons[0]);
    expect(screen.getByRole("dialog", { name: "數學島的相關題目" })).toBeInTheDocument();
    expect(screen.getByText("一張地圖分成八等份，小芸走了其中三份。她走了全程的幾分之幾？")).toBeInTheDocument();
    expect(screen.getByText("學生實際選項：這份既有本機紀錄未保存選項內容，因此不推測或補寫答案。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "前往數學科分數與比例相關題目練習" }));
    expect(setLocation).toHaveBeenCalledWith("/?subject=%E6%95%B8%E5%AD%B8&reviewTopic=%E5%88%86%E6%95%B8%E8%88%87%E6%AF%94%E4%BE%8B&source=supporter-summary");
    fireEvent.click(screen.getByRole("button", { name: "關閉題目回顧" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "查看相關題目" })[1]);
    expect(screen.getByText("這筆足跡仍保留在時間軸中，但目前無法從正式題庫回查題幹，因此不顯示推測的題目內容。")).toBeInTheDocument();
  });

  it("shows a safe note instead of guessing a practice set when the attempt has no labelled knowledge point", () => {
    const now = new Date(2026, 6, 4, 10).getTime();
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts: [
      { questionId: "review-math", timestamp: now, correct: true, hintsUsed: 0, curriculumDomain: "數學", difficulty: "標準", responseMs: 9000, timeLimitMs: 25000, knowledge: [""] },
    ] }));

    render(<TeacherParentSummary />);
    fireEvent.click(screen.getByRole("button", { name: "查看相關題目" }));

    expect(screen.getByRole("status")).toHaveTextContent("目前無法找到對應的練習題組");
    expect(screen.queryByRole("button", { name: /前往.*相關題目練習/ })).not.toBeInTheDocument();
  });
});
