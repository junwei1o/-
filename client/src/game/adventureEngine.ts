import type { AdventureChapter, AdventureNode } from "./adventureChapters";

export type AdventureInput =
  | { kind: "choice"; choiceIndex: number }
  | { kind: "answer"; correct: boolean }
  | { kind: "continue" };

export type AdventureEndingReward = { gold: number; card: boolean; title: string | null };

export type AdventureState = {
  chapterId: string;
  currentNodeId: string;
  history: string[];
  answered: Record<string, boolean>;
  ended: boolean;
};

export function beginAdventure(chapter: AdventureChapter): AdventureState {
  return {
    chapterId: chapter.id,
    currentNodeId: chapter.startNodeId,
    history: [chapter.startNodeId],
    answered: {},
    ended: chapter.nodes[chapter.startNodeId]?.type === "ending",
  };
}

export function currentNode(state: AdventureState, chapter: AdventureChapter): AdventureNode {
  const node = chapter.nodes[state.currentNodeId];
  if (!node) throw new Error(`節點 ${state.currentNodeId} 不存在`);
  return node;
}

export function advanceAdventure(state: AdventureState, chapter: AdventureChapter, input: AdventureInput): AdventureState {
  if (state.ended) return state;
  const node = currentNode(state, chapter);
  let nextId: string | null = null;
  const answered = { ...state.answered };

  if (node.type === "choice" || node.type === "narrative") {
    if (input.kind === "choice" && node.choices?.[input.choiceIndex]) {
      nextId = node.choices[input.choiceIndex].nextNodeId;
    } else if (input.kind === "continue" && node.choices?.[0]) {
      nextId = node.choices[0].nextNodeId;
    }
  } else if (node.type === "check" && node.check && input.kind === "answer") {
    answered[node.id] = input.correct;
    nextId = input.correct ? node.check.nextCorrectId : node.check.nextWrongId;
  }

  if (!nextId) throw new Error("無法根據當前輸入推進冒險");
  const nextNode = chapter.nodes[nextId];
  if (!nextNode) throw new Error(`目標節點 ${nextId} 不存在`);
  return {
    ...state,
    currentNodeId: nextId,
    history: [...state.history, nextId],
    answered,
    ended: nextNode.type === "ending",
  };
}

export function settleAdventureEnding(state: AdventureState, chapter: AdventureChapter): AdventureEndingReward {
  const node = currentNode(state, chapter);
  if (node.type !== "ending") throw new Error("當前節點非結局");
  return {
    gold: node.reward?.gold ?? 0,
    card: node.reward?.card ?? false,
    title: node.reward?.title ?? null,
  };
}
