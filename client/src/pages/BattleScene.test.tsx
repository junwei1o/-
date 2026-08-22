// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BattleScene from "./BattleScene";
import { defaultRpgState, RPG_STORAGE_KEY } from "@/game/rpgStorage";
import { loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { MAP_REINFORCEMENT_REWARD_STORAGE_KEY } from "@/game/mapReinforcementReward";
import { getInventory } from "@/game/inventoryService";
import { getJournalEntries } from "@/game/adventureJournal";
import { BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY } from "@/lib/battleRageSkillTutorial";

vi.mock("@/lib/trpc", () => ({ trpc: { questionBank: { list: { useQuery: () => ({ data: { questions: [{ id: "q1", subject: "自然", grade: 5, prompt: "哪一個是水循環的一部分？", options: ["凝結", "燃燒"], answer: 0, explanation: "凝結會形成雲。", learningTopic: "水循環" }] }, isLoading: false, error: null }) } } } }));

const setLocation = vi.fn();
const storage = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
vi.mock("wouter", () => ({ useLocation: () => ["/battle", setLocation] }));

async function advanceBattleTimer(milliseconds: number) {
  await act(async () => {
    vi.advanceTimersByTime(milliseconds);
  });
}

describe("standalone battle scene", () => {
  beforeEach(() => {
    storage.clear();
    setLocation.mockReset();
  });
  afterEach(() => cleanup());

  const questionPool = [{ id: "q1", subject: "自然", grade: 5, prompt: "哪一個是水循環的一部分？", options: ["凝結", "燃燒"], answer: 0, explanation: "凝結會形成雲。", learningTopic: "水循環" }];
  const mobileQuestionPool = [{ id: "q-mobile", subject: "自然", grade: 5, prompt: "請從四個較長的敘述中選出正確的水循環線索。", options: ["水氣冷卻後凝結成雲", "所有水都會立刻變成冰", "燃燒可以製造降雨", "雲只會出現在海面上"], answer: 0, explanation: "水氣冷卻凝結會形成雲。", learningTopic: "水循環" }];

  it("renders the duel arena with a direct basic attack before a curriculum question is needed", () => {
    render(<BattleScene questionPool={questionPool} />);
    expect(screen.getByRole("heading", { name: "潮汐競技場" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /潮汐苔林：可探索/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /雲嶺岩棚：尚需答對 3 題/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
    expect(screen.getByRole("button", { name: /基礎攻擊.*免答題/ })).toBeInTheDocument();
    expect(screen.queryByText("哪一個是水循環的一部分？")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "本回合戰術預覽" })).toBeInTheDocument();
    expect(screen.getByText("下一個戰況訊號")).toBeInTheDocument();
    expect(screen.getByText("立即應對")).toBeInTheDocument();
    expect(screen.getByText("課綱增幅")).toBeInTheDocument();
    expect(screen.getByText("策略突破")).toBeInTheDocument();
    expect(screen.getByTestId("battle-enemy-phase")).toHaveTextContent("守門者階段觀測階段");
    expect(screen.getByTestId("battle-momentum")).toHaveTextContent("等待第一道答題動能");
    expect(screen.getAllByLabelText(/生命值/)).toHaveLength(2);
    expect(screen.getByRole("button", { name: /基礎攻擊.*免答題/ })).toHaveClass("battle-action-card");
  });

  it("shows the short rage-skill tutorial once and lets the learner dismiss it without leaving the battle flow", () => {
    render(<BattleScene questionPool={questionPool} />);
    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));

    const tutorial = screen.getByTestId("battle-rage-tutorial");
    expect(tutorial).toHaveTextContent("策略先選，再答題結算");
    expect(tutorial).toHaveTextContent("精準打擊");
    expect(tutorial).toHaveTextContent("防護壁壘");
    expect(tutorial).toHaveTextContent("緊急包紮");
    fireEvent.click(screen.getByRole("button", { name: "知道策略技能提示了，關閉提示" }));
    expect(screen.queryByTestId("battle-rage-tutorial")).not.toBeInTheDocument();
    expect(JSON.parse(storage.get(BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY) ?? "{}")).toMatchObject({ version: 1, seen: true });
    expect(screen.getByRole("button", { name: /基礎攻擊.*免答題/ })).toBeInTheDocument();
  });

  it("routes battle-page interaction through dispatcher phases and announces the current learning step", async () => {
    vi.useFakeTimers();
    try {
      render(<BattleScene questionPool={questionPool} />);

      const phaseStatus = screen.getByTestId("battle-machine-status");
      expect(phaseStatus).toHaveAttribute("data-battle-phase", "IDLE");
      expect(phaseStatus).toHaveTextContent("準備探索");

      fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
      expect(phaseStatus).toHaveAttribute("data-battle-phase", "PLAYER_TURN");
      expect(phaseStatus).toHaveTextContent("戰鬥準備中");
      await advanceBattleTimer(420);
      expect(phaseStatus).toHaveTextContent("輪到你規劃行動");

      const basicAttack = screen.getByRole("button", { name: /基礎攻擊.*免答題/ });
      fireEvent.click(basicAttack);
      expect(phaseStatus).toHaveAttribute("data-battle-phase", "ANIMATING");
      expect(phaseStatus).toHaveTextContent("正在呈現這回合效果");
      expect(basicAttack).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("pauses the question timer and locks battle actions while offline, then resumes after reconnecting", async () => {
    vi.useFakeTimers();
    const originalOnline = navigator.onLine;
    try {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
      render(<BattleScene questionPool={questionPool} />);
      fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
      await advanceBattleTimer(420);
      fireEvent.click(screen.getByRole("button", { name: /潮汐脈衝.*答題啟動/ }));
      const answerButton = screen.getByRole("button", { name: /凝結/ });
      const timerBeforeOffline = screen.getByText(/限時 \d+ 秒/).textContent;

      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
      fireEvent(window, new Event("offline"));
      expect(screen.getByText("目前處於離線狀態")).toBeInTheDocument();
      expect(answerButton).toBeDisabled();
      await advanceBattleTimer(5_000);
      expect(screen.getByText(/限時 \d+ 秒/).textContent).toBe(timerBeforeOffline);

      Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
      fireEvent(window, new Event("online"));
      expect(screen.queryByText("目前處於離線狀態")).not.toBeInTheDocument();
      expect(answerButton).toBeEnabled();
    } finally {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: originalOnline });
      vi.useRealTimers();
    }
  });

  it("supports closing the modal and gates a special skill behind a curriculum answer", async () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      render(<BattleScene modal onClose={onClose} questionPool={questionPool} />);
      fireEvent.click(screen.getByRole("button", { name: /返回探險地圖/ }));
      expect(onClose).toHaveBeenCalledOnce();

      fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
      fireEvent.click(screen.getByRole("button", { name: /潮汐脈衝.*答題啟動/ }));
      expect(screen.getByText("哪一個是水循環的一部分？")).toBeInTheDocument();
      expect(screen.getByText("哪一個是水循環的一部分？").closest(".battle-scene-question")).toHaveClass("question-theme-nature");
      fireEvent.click(screen.getByRole("button", { name: /凝結/ }));
      expect(screen.getByText(/答對了！技能已獲得課綱增幅。 怒氣 \+10。/)).toBeInTheDocument();
      await advanceBattleTimer(620);
      expect(screen.getByTestId("battle-machine-status")).toHaveAttribute("data-battle-phase", "ENEMY_TURN");
      await advanceBattleTimer(260);
      expect(screen.getByTestId("battle-machine-status")).toHaveAttribute("data-battle-phase", "ANIMATING");
      await advanceBattleTimer(620);
      expect(screen.getByTestId("battle-machine-status")).toHaveAttribute("data-battle-phase", "PLAYER_TURN");
      expect(screen.getByRole("button", { name: /基礎攻擊.*免答題/ })).toBeInTheDocument();
      expect(screen.getByTestId("battle-momentum")).toHaveTextContent("連答 1 題！");
      fireEvent.click(screen.getByRole("button", { name: /潮汐脈衝.*答題啟動/ }));
      expect(screen.getByRole("button", { name: /凝結/ })).toBeEnabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders low-stimulation battle impact feedback after a correct curriculum answer", () => {
    render(<BattleScene questionPool={questionPool} />);
    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
    fireEvent.click(screen.getByRole("button", { name: /潮汐脈衝.*答題啟動/ }));
    fireEvent.click(screen.getByRole("button", { name: /凝結/ }));
    expect(screen.getByText(/-\d+ HP!/)).toHaveClass("battle-damage-float-enemy");
    expect(document.querySelector(".duel-character.ally")).toHaveClass("battle-dash-forward");
    expect(document.querySelector(".duel-character.enemy")).toHaveClass("battle-hit-flash-enemy");
    expect(document.querySelectorAll(".battle-hp-ghost")).toHaveLength(2);
    expect(document.querySelectorAll(".battle-hp-fill")).toHaveLength(2);
    expect(document.querySelectorAll(".battle-hp-number")).toHaveLength(2);
  });

  it("layers habitat atmosphere, combat pause motion and live status feedback onto real battle results", () => {
    render(<BattleScene questionPool={questionPool} />);
    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
    fireEvent.click(screen.getByRole("button", { name: /基礎攻擊.*免答題/ }));

    const board = document.querySelector(".battle-scene-board");
    const ally = document.querySelector(".duel-character.ally");
    const enemy = document.querySelector(".duel-character.enemy");
    expect(board).toHaveClass("habitat-tidal-grove");
    expect(ally).toHaveClass("battle-combatant", "is-attacking");
    expect(enemy).toHaveClass("battle-combatant", "is-taking-hit");
    expect(document.querySelector(".battle-live-status-float.is-enemy")).toBeInTheDocument();
  });

  it("clears sprint and hit feedback at the dispatcher animation boundary", async () => {
    vi.useFakeTimers();
    try {
      render(<BattleScene questionPool={questionPool} />);
      fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
      fireEvent.click(screen.getByRole("button", { name: /基礎攻擊.*免答題/ }));
      expect(document.querySelector(".duel-character.ally")).toHaveClass("battle-dash-forward");
      expect(document.querySelector(".duel-character.enemy")).toHaveClass("battle-hit-flash-enemy");

      await advanceBattleTimer(620);
      expect(document.querySelector(".duel-character.ally")).not.toHaveClass("battle-dash-forward");
      expect(document.querySelector(".duel-character.enemy")).not.toHaveClass("battle-hit-flash-enemy");
      expect(screen.getByTestId("battle-machine-status")).toHaveAttribute("data-battle-phase", "ENEMY_TURN");
    } finally {
      vi.useRealTimers();
    }
  });

  it("carries a guardian rhythm cue into the next curriculum question without bypassing the player turn", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      render(<BattleScene questionPool={questionPool} />);
      fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
      fireEvent.click(screen.getByRole("button", { name: /基礎攻擊.*免答題/ }));
      await advanceBattleTimer(620);
      expect(screen.getByTestId("battle-machine-status")).toHaveAttribute("data-battle-phase", "ENEMY_TURN");
      await advanceBattleTimer(260);
      await advanceBattleTimer(620);
      expect(screen.getByTestId("battle-machine-status")).toHaveAttribute("data-battle-phase", "PLAYER_TURN");

      fireEvent.click(screen.getByRole("button", { name: /潮汐脈衝.*答題啟動/ }));
      expect(screen.getByTestId("guardian-rhythm-cue")).toHaveTextContent("守門者節奏提示");
      expect(screen.getByTestId("guardian-rhythm-cue")).toHaveTextContent("20 秒");
      expect(screen.getByRole("button", { name: "朗讀守門者節奏提示" })).toBeInTheDocument();
      expect(screen.getByText("哪一個是水循環的一部分？")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  it("keeps four long answer choices reachable in the declared two-column mobile layout at 375px", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    render(<BattleScene questionPool={mobileQuestionPool} />);

    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
    fireEvent.click(screen.getByRole("button", { name: /潮汐脈衝.*答題啟動/ }));

    const options = screen.getByTestId("battle-question-options");
    expect(options).toHaveAttribute("data-layout", "two-columns");
    expect(screen.getAllByRole("button", { name: /水|雲|燃燒/ })).toHaveLength(4);
    expect(screen.getByRole("button", { name: /水氣冷卻後凝結成雲/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /雲只會出現在海面上/ })).toBeEnabled();
  });

  it("offers a positive, focus-managed one-question reinforcement after defeat and records the real attempt", async () => {
    vi.useFakeTimers();
    try {
      storage.set(RPG_STORAGE_KEY, JSON.stringify({
        ...defaultRpgState,
        energy: 0,
        companions: defaultRpgState.companions.map((companion) => ({ ...companion, hp: 1, maxHp: 1 })),
      }));
      render(<BattleScene questionPool={questionPool} />);

      fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
      fireEvent.click(screen.getByRole("button", { name: /基礎攻擊.*免答題/ }));
      await advanceBattleTimer(620);
      await advanceBattleTimer(260);
      await advanceBattleTimer(620);

      expect(screen.getByTestId("battle-machine-status")).toHaveAttribute("data-battle-phase", "RESULT");
      expect(screen.getByTestId("battle-defeat-reflection")).toHaveTextContent("水循環");
      const practiceButton = screen.getByRole("button", { name: "開始自然的水循環一題補強測驗" });
      fireEvent.click(practiceButton);
      expect(screen.getByTestId("battle-defeat-practice")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "練習：水循環" })).toHaveFocus();
      expect(screen.getByTestId("battle-reinforcement-options")).toHaveAttribute("data-layout", "two-columns");

      fireEvent.click(screen.getByRole("button", { name: /凝結/ }));
      expect(screen.getByRole("heading", { name: "一題補強已完成" })).toBeInTheDocument();
      expect(loadAdaptiveProfile().attempts.some((attempt) => attempt.questionId === "q1" && attempt.correct)).toBe(true);
      expect(JSON.parse(storage.get(MAP_REINFORCEMENT_REWARD_STORAGE_KEY) ?? "{}")).toMatchObject({ questionId: "q1", subject: "自然", knowledge: "水循環" });
      fireEvent.click(screen.getByRole("button", { name: "查看航海圖上的一題補強記錄" }));
      expect(setLocation).toHaveBeenCalledWith("/map");
      fireEvent.click(screen.getByRole("button", { name: "回到策略回顧" }));
      await advanceBattleTimer(0);
      expect(practiceButton).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("offers a curriculum-gated capture after victory and saves the companion with a loot summary", async () => {
    vi.useFakeTimers();
    try {
      storage.set(RPG_STORAGE_KEY, JSON.stringify({ ...defaultRpgState, energy: 12 }));
      vi.spyOn(Math, "random").mockReturnValue(0);
      render(<BattleScene questionPool={questionPool} />);
      fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
      fireEvent.click(screen.getAllByRole("button", { name: /答題啟動/ })[1]);
      fireEvent.click(screen.getByRole("button", { name: /凝結/ }));
      await advanceBattleTimer(620);
      expect(getInventory()).toHaveLength(1);
      expect(getJournalEntries()).toHaveLength(0);
      expect(screen.getByRole("button", { name: /課綱捕捉/ })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /課綱捕捉/ }));
      expect(screen.getByText("哪一個是水循環的一部分？")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /凝結/ }));
      expect(screen.getByText(/已回應你的觀測邀請/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /查看戰利品結算/ }));
      expect(screen.getByRole("heading", { name: "新夥伴已加入圖鑑" })).toBeInTheDocument();
      expect(screen.getByTestId("battle-treasure-reveal")).toHaveClass("is-revealed");
      expect(screen.getByRole("heading", { name: "寶箱已溫柔開啟" })).toBeInTheDocument();
      expect(screen.getByTestId("battle-treasure-reveal")).toHaveTextContent("苔光小靈 已加入夥伴圖鑑");
      expect(screen.getByRole("button", { name: "朗讀勝利寶藏" })).toBeInTheDocument();
      expect(JSON.parse(storage.get(RPG_STORAGE_KEY) ?? "{}").companions.some((item: { id: string }) => item.id === "arena-moss-mote")).toBe(true);
      expect(getJournalEntries()).toEqual([expect.objectContaining({ sessionType: "battle", subject: "自然", topicCount: 1, correctCount: 1 })]);
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});


describe("battle visual feedback", () => {
  beforeEach(() => {
    storage.clear();
  });
  afterEach(() => cleanup());

  it("exposes the current day/night environment and non-interactive lighting layer", () => {
    const hourSpy = vi.spyOn(Date.prototype, "getHours").mockReturnValue(21);
    try {
      render(<BattleScene questionPool={[{ id: "visual-q", subject: "自然", grade: 5, prompt: "夜間觀測題", options: ["甲", "乙"], answer: 0, explanation: "", learningTopic: "觀測" }]} />);
      const scene = document.querySelector(".standalone-battle");
      expect(scene).toHaveAttribute("data-environment-period", "night");
      expect(scene).toHaveClass("battle-environment-night");
      expect(document.querySelector(".battle-environment-light")).toBeInTheDocument();
      expect(document.querySelector(".battle-environment-light")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByLabelText("目前環境：夜間觀測")).toBeInTheDocument();
    } finally {
      hourSpy.mockRestore();
    }
  });
});
