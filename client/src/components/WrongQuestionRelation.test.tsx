/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

/**
 * 錯題知識關聯（2026-10-26 Phase 1）— 三層優雅降級回歸鎖。
 *
 * 實測事實（決定測試怎麼寫）：
 * - `strongDistractor` 在 real runtime_bank 的覆蓋率是 **0/3175 = 0%**
 * - `variantOf` 覆蓋率 16.6%（526/3175）
 * 所以「為什麼錯」在真實資料下永遠走降級文案；這裡同時鎖住
 * 「有資料要正確顯示」與「沒資料要優雅降級」兩條路徑。
 */

const mockBank: unknown[] = [];

vi.mock("@/lib/questionBank", () => ({
  useQuestionBank: () => ({ questions: mockBank }),
}));
vi.mock("wouter", () => ({ useLocation: () => ["/wrong-answers", vi.fn()] }));

import WrongQuestionRelation from "./WrongQuestionRelation";

afterEach(() => {
  cleanup();
  mockBank.length = 0;
});

function q(over: Record<string, unknown>) {
  return {
    id: "q1",
    grade: 4,
    subject: "數學",
    questionType: "選擇題",
    difficulty: "標準",
    curriculumDomain: "數學領域",
    learningTopic: "分數比較",
    prompt: "題幹",
    options: ["甲", "乙", "丙", "丁"],
    answer: 0,
    explanation: "解",
    knowledge: ["分數比較"],
    ...over,
  };
}

describe("知識點區塊", () => {
  it("有 knowledge 時逐個顯示標籤", () => {
    mockBank.push(q({ id: "q1" }));
    render(<WrongQuestionRelation questionId="q1" knowledge={["分數比較", "約分"]} subject="數學" />);
    expect(screen.getByText("分數比較")).toBeInTheDocument();
    expect(screen.getByText("約分")).toBeInTheDocument();
  });

  it("沒有 knowledge 時顯示明確降級文案，不空白", () => {
    mockBank.push(q({ id: "q1" }));
    render(<WrongQuestionRelation questionId="q1" knowledge={[]} subject="數學" />);
    expect(screen.getByText(/未標註知識點/)).toBeInTheDocument();
  });
});

describe("為什麼錯（strongDistractor）", () => {
  it("有 strongDistractor 時顯示干擾項分析", () => {
    mockBank.push(q({ id: "q1", strongDistractor: { optionIndex: 2, note: "把比較方向讀反了" } }));
    render(<WrongQuestionRelation questionId="q1" knowledge={["分數比較"]} subject="數學" />);
    expect(screen.getByText("把比較方向讀反了")).toBeInTheDocument();
  });

  it("沒有 strongDistractor 時優雅降級（真實題庫 100% 走這條）", () => {
    mockBank.push(q({ id: "q1" }));
    render(<WrongQuestionRelation questionId="q1" knowledge={["分數比較"]} subject="數學" />);
    expect(screen.getByText(/暫無選項級解析/)).toBeInTheDocument();
  });
});

describe("關聯題目", () => {
  it("variantOf 同家族時優先列出家族成員（且優先於同知識點鄰居）", () => {
    mockBank.push(
      q({ id: "a", variantOf: { role: "anchor", kind: "variant", members: ["v1", "v2"] } }),
      q({ id: "v1", prompt: "家族變體一", variantOf: { role: "variant", kind: "variant", anchor: "a" } }),
      q({ id: "v2", prompt: "家族變體二", variantOf: { role: "variant", kind: "variant", anchor: "a" } }),
      // 同知識點鄰居：不該擠掉家族成員（家族 >= 2 時直接回傳家族）
      q({ id: "n1", prompt: "同知識點鄰居", knowledge: ["分數比較"] }),
    );
    render(<WrongQuestionRelation questionId="a" knowledge={["分數比較"]} subject="數學" />);
    expect(screen.getByText("家族變體一")).toBeInTheDocument();
    expect(screen.getByText("家族變體二")).toBeInTheDocument();
    // 關鍵斷言：家族齊備時，同知識點鄰居不得入列（否則家族優先就形同虛設）
    expect(screen.queryByText("同知識點鄰居")).not.toBeInTheDocument();
  });

  it("無 variantOf 時降級用 knowledge 找同知識點題", () => {
    mockBank.push(
      q({ id: "q1" }),
      q({ id: "q2", prompt: "同知識點鄰居", knowledge: ["分數比較"] }),
    );
    render(<WrongQuestionRelation questionId="q1" knowledge={["分數比較"]} subject="數學" />);
    expect(screen.getByText("同知識點鄰居")).toBeInTheDocument();
  });

  it("完全找不到關聯時不渲染該區塊（不留空殼）", () => {
    mockBank.push(q({ id: "q1", knowledge: ["獨門知識"] }));
    render(<WrongQuestionRelation questionId="q1" knowledge={["獨門知識"]} subject="數學" />);
    expect(screen.queryByText(/立刻鞏固/)).not.toBeInTheDocument();
  });

  it("每題都有練習按鈕（可一鍵進該知識點）", () => {
    mockBank.push(
      q({ id: "q1" }),
      q({ id: "q2", prompt: "鄰居", knowledge: ["分數比較"] }),
    );
    render(<WrongQuestionRelation questionId="q1" knowledge={["分數比較"]} subject="數學" />);
    expect(screen.getAllByRole("button", { name: /練習/ }).length).toBeGreaterThanOrEqual(1);
  });
});
