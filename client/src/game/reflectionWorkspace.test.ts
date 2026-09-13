// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { reflectionWorkspace } from "./reflectionWorkspace";

const ctxA = {
  question: "3 + 2 = ?",
  options: ["3", "5", "6", "8"],
  selectedIndex: 2,
  answerIndex: 1,
  subject: "數學",
};
const ctxB = { ...ctxA, question: "5 - 2 = ?", selectedIndex: 0, answerIndex: 2 };

function resetStore() {
  reflectionWorkspace.closeAll();
  reflectionWorkspace.setTheme("light");
  const state = reflectionWorkspace.getState();
  [...state.layoutSnapshots].forEach((s) => reflectionWorkspace.deleteLayoutSnapshot(s.id));
  [...state.themeSnapshots].forEach((s) => reflectionWorkspace.deleteThemeSnapshot(s.id));
}

beforeEach(resetStore);
afterEach(() => window.localStorage.clear());

describe("reflectionWorkspace 多開卡片", () => {
  it("同題重複開卡只置頂、不重複新增；不同題各自一張", () => {
    const id1 = reflectionWorkspace.openCard(ctxA);
    const id1Again = reflectionWorkspace.openCard(ctxA);
    expect(id1).toBe(id1Again);
    expect(reflectionWorkspace.getState().cards).toHaveLength(1);

    reflectionWorkspace.openCard(ctxB);
    expect(reflectionWorkspace.getState().cards).toHaveLength(2);
  });

  it("focusCard 會把被點擊卡片的 z 拉到最高", () => {
    const a = reflectionWorkspace.openCard(ctxA);
    const b = reflectionWorkspace.openCard(ctxB);
    reflectionWorkspace.focusCard(a);
    const cards = reflectionWorkspace.getState().cards;
    const cardA = cards.find((c) => c.id === a)!;
    const cardB = cards.find((c) => c.id === b)!;
    expect(cardA.z).toBeGreaterThan(cardB.z);
  });

  it("moveCard/resizeCard 會夾在視窗與最小尺寸內", () => {
    const id = reflectionWorkspace.openCard(ctxA);
    reflectionWorkspace.moveCard(id, -9999, -9999);
    let card = reflectionWorkspace.getState().cards[0]!;
    expect(card.x).toBeGreaterThanOrEqual(-card.w + 80);
    expect(card.y).toBeGreaterThanOrEqual(8);

    reflectionWorkspace.resizeCard(id, 10, 10);
    card = reflectionWorkspace.getState().cards[0]!;
    expect(card.w).toBeGreaterThanOrEqual(280);
    expect(card.h).toBeGreaterThanOrEqual(300);
  });

  it("resolveTurn 補上對話、rejectTurn 以規則腦兜底", () => {
    const id = reflectionWorkspace.openCard(ctxA); // 首輪進 outbox
    const nonce = reflectionWorkspace.getState().outbox[0]!.nonce;
    reflectionWorkspace.resolveTurn(nonce, id, "你為什麼選 6？", "builtin");
    let card = reflectionWorkspace.getState().cards[0]!;
    expect(card.turns).toHaveLength(1);
    expect(card.pendingTurn).toBeNull();

    reflectionWorkspace.requestMore(id);
    const nonce2 = reflectionWorkspace.getState().outbox[0]!.nonce;
    reflectionWorkspace.rejectTurn(nonce2, id, "網路斷線");
    card = reflectionWorkspace.getState().cards[0]!;
    expect(card.turns).toHaveLength(2);
    expect(card.turns[1]!.source).toBe("rule");
    expect(card.notice).toContain("離線規則腦");
  });
});

describe("reflectionWorkspace 快照", () => {
  it("佈局快照可存、還原、刪除，且最多 5 份", () => {
    reflectionWorkspace.openCard(ctxA);
    for (let i = 0; i < 7; i++) reflectionWorkspace.saveLayoutSnapshot(`L${i}`);
    let state = reflectionWorkspace.getState();
    expect(state.layoutSnapshots).toHaveLength(5);
    expect(state.layoutSnapshots[0]!.name).toBe("L6");

    const target = state.layoutSnapshots[2]!;
    reflectionWorkspace.restoreLayoutSnapshot(target.id);
    reflectionWorkspace.deleteLayoutSnapshot(target.id);
    state = reflectionWorkspace.getState();
    expect(state.layoutSnapshots.some((s) => s.id === target.id)).toBe(false);
  });

  it("主題快照保存主題與自訂色，還原後切換", () => {
    reflectionWorkspace.setCustomAccent("#123456");
    reflectionWorkspace.saveThemeSnapshot("我的色");
    reflectionWorkspace.setTheme("mono");
    const snap = reflectionWorkspace.getState().themeSnapshots[0]!;
    expect(snap.theme).toBe("custom");
    reflectionWorkspace.restoreThemeSnapshot(snap.id);
    expect(reflectionWorkspace.getState().theme).toBe("custom");
    expect(reflectionWorkspace.getState().customAccent).toBe("#123456");
  });

  it("clearCards 清空對話但保留主題與快照", () => {
    reflectionWorkspace.openCard(ctxA);
    reflectionWorkspace.saveLayoutSnapshot("keep");
    reflectionWorkspace.clearCards();
    const state = reflectionWorkspace.getState();
    expect(state.cards).toHaveLength(0);
    expect(state.layoutSnapshots).toHaveLength(1);
  });
});
