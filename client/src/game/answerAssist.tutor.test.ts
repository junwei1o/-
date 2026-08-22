import { describe, expect, it } from "vitest";
import {
  getKnowledgeKey,
  getTutorPromptCopy,
  getTutorPromptStage,
  updateKnowledgeWrongStreak,
} from "./answerAssist";

describe("連續答錯知識點導師提示", () => {
  it("以排序後的 knowledge key 判定同一知識點，而不是依題目索引判定", () => {
    const first = updateKnowledgeWrongStreak(undefined, ["分數", "小數"], false);
    const second = updateKnowledgeWrongStreak(first, ["小數", "分數"], false);

    expect(getKnowledgeKey(["小數", "分數", "小數"])).toBe("分數｜小數");
    expect(second).toEqual({ knowledgeKey: "分數｜小數", count: 2 });
  });

  it("只在第二次同知識點連錯後開始分段提示，並在更換知識點時重置", () => {
    expect(getTutorPromptStage(0)).toBe("none");
    expect(getTutorPromptStage(1)).toBe("none");
    expect(getTutorPromptStage(2)).toBe("orientation");
    expect(getTutorPromptStage(3)).toBe("strategy");
    expect(getTutorPromptStage(4)).toBe("worked-example");

    const first = updateKnowledgeWrongStreak(undefined, ["重力"], false);
    expect(updateKnowledgeWrongStreak(first, ["光"], false)).toEqual({ knowledgeKey: "光", count: 1 });
  });

  it("答對會清除連錯計數，提示文字保持具體但不保證答案", () => {
    const streak = { knowledgeKey: "比例", count: 3 };
    expect(updateKnowledgeWrongStreak(streak, ["比例"], true)).toEqual({ knowledgeKey: "比例", count: 0 });
    expect(getTutorPromptCopy("strategy", "比例")).toMatchObject({ title: "換一條解題航線" });
    expect(getTutorPromptCopy("worked-example", "比例").message).toContain("逐一檢查每個選項");
  });
});

