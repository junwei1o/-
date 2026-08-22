import { describe, expect, it } from "vitest";
import {
  ANIME_WORLDVIEW_QUIZZES,
  getAnimeWorldviewQuestions,
  getAnimeWorldviewResultMessage,
  scoreAnimeWorldviewQuiz,
} from "./animeWorldviewQuiz";

describe("動漫世界觀主題小測驗", () => {
  it("奶龍、奧特曼與假面騎士各有八題、四選一與完整解析", () => {
    Object.values(ANIME_WORLDVIEW_QUIZZES).forEach((questions) => {
      expect(questions).toHaveLength(8);
      expect(questions.every((question) => question.options)).toBe(true);
      expect(questions.every((question) => question.options.length === 4)).toBe(true);
      expect(questions.every((question) => question.answer >= 0 && question.answer < 4)).toBe(true);
      expect(questions.every((question) => question.explanation.length > 0 && question.focus.length > 0)).toBe(true);
    });
  });

  it("固定同一世界觀的題組順序，且不混入其他世界觀", () => {
    const first = getAnimeWorldviewQuestions("nailong");
    const second = getAnimeWorldviewQuestions("nailong");
    expect(first.map((question) => question.id)).toEqual(second.map((question) => question.id));
    expect(first.every((question) => question.entryKey === "nailong")).toBe(true);
    expect(getAnimeWorldviewQuestions("unknown")).toEqual([]);
  });

  it("正確計分並處理空題組，結果文案保持兒童友善", () => {
    const questions = getAnimeWorldviewQuestions("ultraman");
    expect(scoreAnimeWorldviewQuiz(questions, questions.map((question) => question.answer))).toEqual({ correct: 8, total: 8, percentage: 100 });
    expect(scoreAnimeWorldviewQuiz(questions, [null, 1, 0, 0, 0]).correct).toBe(1);
    expect(scoreAnimeWorldviewQuiz([], [])).toEqual({ correct: 0, total: 0, percentage: 0 });
    expect(getAnimeWorldviewResultMessage(8, 8)).toMatch(/觀測完成/);
    expect(getAnimeWorldviewResultMessage(0, 0)).toMatch(/沒有可挑戰/);
  });
});
