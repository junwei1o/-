import { describe, expect, it } from "vitest";
import { advanceAdventure, beginAdventure, settleAdventureEnding } from "./adventureEngine";
import { getChapterById } from "./adventureChapters";

describe("adventure engine", () => {
  it("beginAdventure 從 start 節點開始、history 含起始節點", () => {
    const chapter = getChapterById("lighthouse-call")!;
    const state = beginAdventure(chapter);
    expect(state.currentNodeId).toBe("start");
    expect(state.history).toEqual(["start"]);
    expect(state.ended).toBe(false);
  });

  it("choice 節點可依選項前進", () => {
    const chapter = getChapterById("lighthouse-call")!;
    let state = beginAdventure(chapter);
    state = advanceAdventure(state, chapter, { kind: "choice", choiceIndex: 0 });
    expect(state.currentNodeId).toBe("coast");
    expect(state.history).toEqual(["start", "coast"]);
  });

  it("check 節點答對走正確分支、答錯走錯誤分支", () => {
    const chapter = getChapterById("lighthouse-call")!;
    let state = beginAdventure(chapter);
    state = advanceAdventure(state, chapter, { kind: "choice", choiceIndex: 0 });
    state = advanceAdventure(state, chapter, { kind: "answer", correct: true });
    expect(state.currentNodeId).toBe("safe");
    state = advanceAdventure(state, chapter, { kind: "answer", correct: false });
    expect(state.currentNodeId).toBe("tower-mid");
  });

  it("ending 節點 settleAdventureEnding 回傳獎勵並標記結束", () => {
    const chapter = getChapterById("lighthouse-call")!;
    let state = beginAdventure(chapter);
    state = advanceAdventure(state, chapter, { kind: "choice", choiceIndex: 0 });
    state = advanceAdventure(state, chapter, { kind: "answer", correct: true });
    state = advanceAdventure(state, chapter, { kind: "answer", correct: true });
    expect(state.ended).toBe(true);
    const reward = settleAdventureEnding(state, chapter);
    expect(reward.gold).toBe(20);
    expect(reward.title).toBe("燈塔嚮導");
  });
});
