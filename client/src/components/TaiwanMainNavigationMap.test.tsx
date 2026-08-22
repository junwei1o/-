// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { islandVisualState, learningRouteSegments, mapReinforcementJournalReadout, TaiwanMainNavigationMap } from "@/components/TaiwanMainNavigationMap";
import { MAP_ROUTE_FIRST_USE_HINT_STORAGE_KEY } from "@/lib/mapRouteFirstUseHint";
import { MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY } from "@/lib/mapSupplyStrategyPreference";
import type { KnowledgeIslandSnapshot } from "@/lib/studentKnowledgeIslands";
import { getInventory, INVENTORY_STORAGE_KEY } from "@/game/inventoryService";

const testResource = { title: "課綱資源", provider: "教育機構", url: "https://example.edu.tw", kind: "課綱入口" as const };
const islands: KnowledgeIslandSnapshot[] = [
  { id: "math", subject: "數學", title: "量與關係島", shortTitle: "數學", description: "把數字、圖形和規律連成可走的路。", curriculumFocus: "數與量、幾何、關係與資料。", learningDirections: ["從資料找規律"], resources: [testResource], attemptCount: 2, accuracy: 0.5, observedKnowledge: ["分數比較"], recentReviewTopics: ["小數運算", "分數比較"], dueReviewCount: 1, unlocked: true },
  { id: "science", subject: "自然", title: "觀察實驗島", shortTitle: "自然", description: "從現象、證據和變化找到線索。", curriculumFocus: "探究與實作。", learningDirections: ["用證據說明"], resources: [testResource], attemptCount: 0, accuracy: null, observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false },
  { id: "social", subject: "社會", title: "生活與地方島", shortTitle: "社會", description: "看看人、地方和規則如何互相影響。", curriculumFocus: "地理、歷史與公民。", learningDirections: ["讀懂地方資料"], resources: [testResource], attemptCount: 4, accuracy: 1, observedKnowledge: ["地方生活"], recentReviewTopics: ["地方生活"], dueReviewCount: 0, unlocked: true },
  { id: "language", subject: "國語", title: "閱讀表達島", shortTitle: "國語", description: "從文字裡找線索，也把想法說清楚。", curriculumFocus: "閱讀理解與表達。", learningDirections: ["找出關鍵詞"], resources: [testResource], attemptCount: 0, accuracy: null, observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false },
];

describe("TaiwanMainNavigationMap", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("renders all four curriculum islands with positive real-data states", () => {
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "台灣主航海圖" })).toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-island-math")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("taiwan-map-island-math")).not.toHaveAttribute("aria-controls");
    expect(screen.getByTestId("taiwan-map-island-math")).toHaveTextContent("探索中");
    expect(screen.getByTestId("taiwan-map-island-science")).toHaveTextContent("啟航");
    expect(screen.getByTestId("taiwan-map-island-social")).toHaveTextContent("穩定航行");
    expect(screen.getByTestId("taiwan-map-island-social")).not.toHaveTextContent("%");
    expect(screen.queryByText("分數比較")).not.toBeInTheDocument();
  });

  it("derives three node colors only from observed accuracy while keeping student text percentage-free", () => {
    expect(islandVisualState({ ...islands[2], attemptCount: 5, accuracy: 0.8 })).toBe("gold");
    expect(islandVisualState({ ...islands[0], attemptCount: 5, accuracy: 0.5 })).toBe("green");
    expect(islandVisualState({ ...islands[0], attemptCount: 5, accuracy: 0.49 })).toBe("orange");
    expect(islandVisualState({ ...islands[1], attemptCount: 0, accuracy: null })).toBe("mist");

    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    expect(screen.getByTestId("taiwan-map-island-math")).toHaveAttribute("data-visual-state", "green");
    expect(screen.getByTestId("taiwan-map-island-math")).toHaveClass("island-visual-green");
    expect(screen.getByTestId("taiwan-map-island-social")).toHaveAttribute("data-visual-state", "gold");
    expect(screen.getByTestId("taiwan-map-island-science")).toHaveAttribute("data-visual-state", "mist");
    expect(screen.getByTestId("taiwan-map-island-social")).not.toHaveTextContent("100%");
  });

  it("shows a calm one-question reward only for its matching island and allows immediate dismissal", () => {
    render(
      <TaiwanMainNavigationMap
        islands={islands}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
        reinforcementReward={{ questionId: "q-water", subject: "自然", knowledge: "水循環", completedAt: 1_700_000_000_000 }}
      />,
    );

    expect(screen.getByTestId("taiwan-map-reinforcement-reward")).toHaveTextContent("已完成一題");
    expect(screen.getByTestId("taiwan-map-reinforcement-reward")).toHaveTextContent("水循環");
    expect(screen.getByTestId("taiwan-map-island-science")).toHaveAttribute("data-reinforcement-rewarded", "true");
    expect(screen.getByTestId("taiwan-map-island-math")).toHaveAttribute("data-reinforcement-rewarded", "false");

    fireEvent.keyDown(screen.getByTestId("taiwan-navigation-map"), { key: "Escape" });
    expect(screen.queryByTestId("taiwan-map-reinforcement-reward")).not.toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-island-science")).toHaveAttribute("data-reinforcement-rewarded", "false");
  });

  it("lights the matching route after a verified random adventure and allows Escape to close its non-modal feedback", () => {
    render(
      <TaiwanMainNavigationMap
        islands={islands}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
        randomAdventureRouteReward={{ eventId: "random-1", questionId: "q-fraction", subject: "數學", completedAt: 1_700_000_000_000 }}
      />,
    );

    expect(screen.getByTestId("taiwan-map-random-route-reward")).toHaveTextContent("隨機冒險完成");
    expect(screen.getByTestId("taiwan-map-route-math")).toHaveAttribute("data-route-random-adventure-lit", "true");
    fireEvent.keyDown(screen.getByTestId("taiwan-navigation-map"), { key: "Escape" });
    expect(screen.queryByTestId("taiwan-map-random-route-reward")).not.toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-route-math")).toHaveAttribute("data-route-random-adventure-lit", "false");
  });

  it("renders the weekly reinforcement log from supplied real entries and keeps an encouraging empty state", () => {
    const { rerender } = render(
      <TaiwanMainNavigationMap
        islands={islands}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
        reinforcementJournal={[
          { questionId: "q-water", subject: "自然", knowledge: "水循環", completedAt: Date.UTC(2026, 7, 19, 8, 15) },
          { questionId: "q-fraction", subject: "數學", knowledge: "分數比較", completedAt: Date.UTC(2026, 7, 18, 9, 20) },
        ]}
      />,
    );

    expect(screen.getByTestId("taiwan-map-reinforcement-journal")).toHaveTextContent("本週補強小航誌");
    expect(screen.getByTestId("taiwan-map-reinforcement-journal")).toHaveTextContent("水循環");
    expect(screen.getByTestId("taiwan-map-reinforcement-journal")).toHaveTextContent("分數比較");
    expect(screen.getByRole("button", { name: "朗讀本週補強小航誌" })).toBeInTheDocument();
    expect(mapReinforcementJournalReadout([{ questionId: "q-water", subject: "自然", knowledge: "水循環", completedAt: 1 }])).toContain("自然的水循環");

    rerender(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} reinforcementJournal={[]} />);
    expect(screen.getByTestId("taiwan-map-reinforcement-journal")).toHaveTextContent("本週尚未留下補強紀錄");
  });

  it("shows the real local specialty inventory in a non-modal backpack that Escape can close", () => {
    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({
      version: 1,
      awardedIds: ["earned-item"],
      items: [{ id: "bubble-tea-earned-item", name: "珍珠奶茶", emoji: "🧋", category: "台灣特產", acquiredAt: 1_700_000_000_000, source: "battle-victory" }],
    }));
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByTestId("taiwan-map-backpack-trigger"));
    expect(screen.getByTestId("taiwan-map-backpack-panel")).toHaveTextContent("珍珠奶茶");
    fireEvent.keyDown(screen.getByTestId("taiwan-navigation-map"), { key: "Escape" });
    expect(screen.queryByTestId("taiwan-map-backpack-panel")).not.toBeInTheDocument();
  });

  it("reveals the typhoon story without blocking map exploration and grants its small reward once", () => {
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByTestId("taiwan-map-easter-egg-trigger"));
    expect(screen.getByTestId("taiwan-map-easter-egg-panel")).toHaveTextContent("颱風的海上來信");
    expect(screen.getByTestId("taiwan-map-island-math")).toBeEnabled();
    expect(getInventory()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "關閉颱風故事" }));
    fireEvent.click(screen.getByTestId("taiwan-map-easter-egg-trigger"));
    expect(getInventory()).toHaveLength(1);
  });

  it("only draws route segments for islands with real practice footprints", () => {
    expect(learningRouteSegments(islands).map((segment) => segment.id)).toEqual(["math", "social"]);

    const { rerender } = render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);
    expect(screen.getByTestId("taiwan-map-route-math")).toHaveAttribute("pathLength", "1");
    expect(screen.getByTestId("taiwan-map-route-social")).toHaveClass("taiwan-map-route-animated");
    expect(screen.queryByTestId("taiwan-map-route-language")).not.toBeInTheDocument();
    expect(screen.queryByTestId("taiwan-map-route-science")).not.toBeInTheDocument();

    rerender(<TaiwanMainNavigationMap islands={islands.map((island) => ({ ...island, attemptCount: 0, accuracy: null }))} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);
    expect(document.querySelectorAll("[data-testid^='taiwan-map-route-']")).toHaveLength(0);
  });

  it("opens only supplied recent topics and connects both topic and subject practice", () => {
    const onOpenSubject = vi.fn();
    const onOpenTopic = vi.fn();
    const onOpenWrongAnswers = vi.fn();
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={onOpenSubject} onOpenTopic={onOpenTopic} onOpenWrongAnswers={onOpenWrongAnswers} />);

    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    expect(screen.getByTestId("taiwan-map-island-math")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("taiwan-map-island-math")).toHaveAttribute("aria-controls", "taiwan-island-panel-math");
    expect(screen.getByLabelText("近期可複習知識點")).toHaveTextContent("小數運算");
    expect(screen.getByLabelText("近期可複習知識點")).toHaveTextContent("分數比較");

    fireEvent.click(screen.getByRole("button", { name: "複習「小數運算」" }));
    expect(onOpenTopic).toHaveBeenCalledWith("數學", "小數運算");
    expect(screen.getByTestId("taiwan-island-progress-math")).toHaveTextContent("已累積 2 次練習");
    expect(screen.getByTestId("taiwan-island-progress-math")).not.toHaveTextContent("50%");
    fireEvent.click(screen.getByRole("button", { name: "繼續挑戰 數學" }));
    expect(onOpenSubject).toHaveBeenCalledWith("數學");
    fireEvent.click(screen.getByRole("button", { name: "錯題重練 數學" }));
    expect(onOpenWrongAnswers).toHaveBeenCalledWith("數學");
  });

  it("keeps empty islands encouraging and closes the expanded panel with Escape", () => {
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    const scienceIsland = screen.getByTestId("taiwan-map-island-science");
    fireEvent.click(scienceIsland);
    expect(screen.getByText("還沒有近期練習紀錄也沒關係，可以從這座島開始留下第一個線索。")).toBeInTheDocument();
    expect(screen.queryByLabelText("近期可複習知識點")).not.toBeInTheDocument();

    fireEvent.keyDown(scienceIsland, { key: "Escape" });
    expect(screen.queryByText("還沒有近期練習紀錄也沒關係，可以從這座島開始留下第一個線索。")).not.toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-island-science")).toHaveAttribute("aria-pressed", "false");
  });

  it("renders an accessible Taiwan landscape icon set for each curriculum island", () => {
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    const landscapeExpectations = [
      { id: "language", label: "國語", icons: ["古城牆", "毛筆", "詩詞卷軸"] },
      { id: "math", label: "數學", icons: ["幾何建築", "齒輪", "量尺"] },
      { id: "social", label: "社會", icons: ["帆船", "燈塔", "世界地圖"] },
      { id: "science", label: "自然", icons: ["山林", "海浪", "顯微鏡"] },
    ] as const;

    for (const landscape of landscapeExpectations) {
      fireEvent.click(screen.getByTestId(`taiwan-map-island-${landscape.id}`));
      const iconList = screen.getByLabelText(`${landscape.label}的台灣地景圖示`);
      landscape.icons.forEach((icon) => expect(iconList).toHaveTextContent(icon));
    }
  });

  it("renders only the supplied victory route and supply marker with accessible text", () => {
    render(
      <TaiwanMainNavigationMap
        islands={islands.map((island) => ({ ...island, attemptCount: 0, accuracy: null }))}
        unlockedRouteIds={["victory-route-east"]}
        supplyMarkerIds={["supply-east"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    expect(screen.getByTestId("taiwan-map-route-science")).toBeInTheDocument();
    expect(screen.queryByTestId("taiwan-map-route-math")).not.toBeInTheDocument();
    expect(screen.getByLabelText("自然已出現學習補給標記")).toBeInTheDocument();
    expect(screen.queryByLabelText("數學已出現學習補給標記")).not.toBeInTheDocument();
  });

  it("shows supply learning entries only for the island with a real supply marker", () => {
    const onOpenSubject = vi.fn();
    render(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central"]}
        onOpenSubject={onOpenSubject}
        onOpenTopic={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    const strategyButton = screen.getByRole("button", { name: "查看數學的學習策略" });
    expect(strategyButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "再練一題：開始數學的同科練習" })).toBeInTheDocument();

    fireEvent.click(strategyButton);
    expect(strategyButton).toHaveAttribute("aria-expanded", "true");
    const strategyPanel = screen.getByTestId("taiwan-map-supply-strategy");
    expect(strategyPanel).toHaveTextContent("數學準備提示");
    expect(strategyPanel).toHaveTextContent("先寫下已知的量和單位");
    expect(strategyPanel).toHaveTextContent(/朗讀策略|此裝置暫不支援朗讀/);

    fireEvent.click(screen.getByRole("button", { name: "再練一題：開始數學的同科練習" }));
    expect(onOpenSubject).toHaveBeenLastCalledWith("數學");

    expect(screen.getByTestId("taiwan-map-supply-strategy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "關閉補給策略摘要" }));
    expect(screen.queryByTestId("taiwan-map-supply-strategy")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查看數學的學習策略" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByTestId("taiwan-map-supply-strategy")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("taiwan-map-island-science"));
    expect(screen.queryByRole("button", { name: "查看自然的學習策略" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "再練一題：開始自然的同科練習" })).not.toBeInTheDocument();
  });

  it("restores the last expanded strategy preference when the student re-enters the map", () => {
    const props = {
      islands,
      supplyMarkerIds: ["supply-central"],
      onOpenSubject: vi.fn(),
      onOpenTopic: vi.fn(),
    };
    const firstVisit = render(<TaiwanMainNavigationMap {...props} />);
    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    fireEvent.click(screen.getByRole("button", { name: "查看數學的學習策略" }));
    expect(window.localStorage.getItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY)).toContain('"math":true');
    expect(screen.getByTestId("taiwan-map-supply-strategy")).toBeInTheDocument();

    firstVisit.unmount();
    vi.useFakeTimers();
    render(<TaiwanMainNavigationMap {...props} />);
    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    expect(screen.getByTestId("taiwan-map-supply-strategy")).toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-restored-preference")).toHaveTextContent("已恢復上次閱讀狀態");


    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.queryByTestId("taiwan-map-restored-preference")).not.toBeInTheDocument();
  });

  it("announces a restored collapsed preference without opening the strategy panel", () => {
    const props = {
      islands,
      supplyMarkerIds: ["supply-central"],
      onOpenSubject: vi.fn(),
      onOpenTopic: vi.fn(),
    };
    window.localStorage.setItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY, JSON.stringify({
      version: 2,
      expandedByIsland: { math: false },
    }));

    render(<TaiwanMainNavigationMap {...props} />);
    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));

    expect(screen.getByTestId("taiwan-map-restored-preference")).toBeInTheDocument();
    expect(screen.queryByTestId("taiwan-map-supply-strategy")).not.toBeInTheDocument();
  });

  it("does not announce a restore when the island has no saved preference", () => {
    render(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    expect(screen.queryByTestId("taiwan-map-restored-preference")).not.toBeInTheDocument();
  });

  it("remembers a collapsed strategy preference on the next map entry", () => {
    const props = {
      islands,
      supplyMarkerIds: ["supply-central"],
      onOpenSubject: vi.fn(),
      onOpenTopic: vi.fn(),
    };
    const firstVisit = render(<TaiwanMainNavigationMap {...props} />);
    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    fireEvent.click(screen.getByRole("button", { name: "查看數學的學習策略" }));
    fireEvent.click(screen.getByRole("button", { name: "關閉補給策略摘要" }));
    expect(window.localStorage.getItem(MAP_SUPPLY_STRATEGY_PREFERENCE_STORAGE_KEY)).toContain('"math":false');

    firstVisit.unmount();
    render(<TaiwanMainNavigationMap {...props} />);
    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    expect(screen.queryByTestId("taiwan-map-supply-strategy")).not.toBeInTheDocument();
  });

  it("animates a newly completed supply marker and its matching route, then clears the feedback", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={[]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    rerender(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    expect(screen.getByTestId("taiwan-map-supply-marker-math")).toHaveAttribute("data-supply-completing", "true");
    expect(screen.getByTestId("taiwan-map-supply-marker-math")).toHaveClass("is-supply-completing");
    expect(screen.getByTestId("taiwan-map-route-math")).toHaveAttribute("data-route-glowing", "true");
    expect(screen.getByTestId("taiwan-map-route-math")).toHaveClass("is-route-glowing");

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.getByTestId("taiwan-map-supply-marker-math")).toHaveAttribute("data-supply-completing", "false");
    expect(screen.getByTestId("taiwan-map-route-math")).toHaveAttribute("data-route-glowing", "false");
  });

  it("shows a short first-use route hint only while a new supply route is glowing", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={[]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    rerender(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    expect(screen.getByTestId("taiwan-map-route-hint")).toHaveTextContent("微光航線可以點一下，查看補給策略");
    expect(screen.getByTestId("taiwan-map-route-hint-compass")).toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-route-hint-compass")).toHaveAttribute("aria-hidden", "true");
    expect(window.localStorage.getItem(MAP_ROUTE_FIRST_USE_HINT_STORAGE_KEY)).toContain('"seen":true');

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.queryByTestId("taiwan-map-route-hint")).not.toBeInTheDocument();

    rerender(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central", "supply-south"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("taiwan-map-route-hint")).not.toBeInTheDocument();
  });

  it("dismisses the route hint when the student opens the matching strategy", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={[]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    rerender(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("taiwan-map-route-math"));
    expect(screen.queryByTestId("taiwan-map-route-hint")).not.toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-supply-strategy")).toBeInTheDocument();
  });

  it("opens the matching supply strategy when the glowing route is clicked", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={[]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    rerender(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    const glowingRoute = screen.getByTestId("taiwan-map-route-math");
    expect(glowingRoute).toHaveAttribute("role", "button");
    expect(glowingRoute).toHaveAttribute("tabindex", "0");
    expect(glowingRoute).toHaveAttribute("aria-label", "開啟數學的補給策略");

    fireEvent.click(glowingRoute);

    expect(document.getElementById("taiwan-island-panel-math")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看數學的學習策略" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("taiwan-map-supply-strategy")).toHaveTextContent("數學準備提示");
  });

  it("opens the glowing route strategy with Space and keeps ordinary routes non-interactive", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={[]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    rerender(
      <TaiwanMainNavigationMap
        islands={islands}
        supplyMarkerIds={["supply-central"]}
        onOpenSubject={vi.fn()}
        onOpenTopic={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByTestId("taiwan-map-route-math"), { key: " " });
    expect(screen.getByTestId("taiwan-map-supply-strategy")).toBeInTheDocument();
    expect(screen.getByTestId("taiwan-map-route-math")).toHaveAttribute("data-route-interactive", "true");
    expect(screen.getByTestId("taiwan-map-route-social")).toHaveAttribute("data-route-interactive", "false");
    expect(screen.getByTestId("taiwan-map-route-social")).not.toHaveAttribute("role");
  });

  it("applies the glass panel and capsule action button classes without changing speech controls", () => {
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByTestId("taiwan-map-island-math"));
    expect(screen.getByRole("article")).toHaveClass("taiwan-island-panel");
    expect(screen.getByRole("button", { name: "繼續挑戰 數學" })).toHaveClass("taiwan-island-btn");
    expect(screen.getByRole("button", { name: "錯題重練 數學" })).toHaveClass("taiwan-island-btn", "taiwan-map-panel-wrong");
    expect(screen.getByRole("button", { name: /朗讀航線說明|此裝置暫不支援朗讀/ })).toHaveClass("taiwan-island-btn");
    expect(screen.getByRole("button", { name: "回到航海圖" })).toHaveClass("taiwan-island-btn");
  });
});
