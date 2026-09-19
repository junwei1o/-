// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  FRACTION_COURSE,
  completedLayerCount,
  courseProgress,
  courseTotalStars,
  isLayerUnlocked,
  layerStars,
  loadOnionProgress,
  rankTitle,
  saveOnionProgress,
  type LayerProgress,
  type OnionProgressMap,
} from "./onionLessons";

const doneLayer = (stars: number, mistakes = 0, firstTry = 2): LayerProgress => ({
  done: true,
  stars,
  mistakes,
  firstTry,
  completedAt: Date.now(),
});

describe("分數工坊課程資料", () => {
  it("切成 4 層知識點，每層都有動畫分鏡與測驗", () => {
    expect(FRACTION_COURSE.layers).toHaveLength(4);
    for (const layer of FRACTION_COURSE.layers) {
      expect(layer.scenes.length).toBeGreaterThanOrEqual(2);
      expect(layer.quiz.length).toBeGreaterThanOrEqual(1);
      expect(layer.goal.length).toBeGreaterThan(0);
    }
  });

  it("每題的正解索引合法、選項 3 個、提示正好 3 級", () => {
    for (const layer of FRACTION_COURSE.layers) {
      for (const q of layer.quiz) {
        expect(q.options.length).toBe(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.hints).toHaveLength(3);
        expect(q.explain.length).toBeGreaterThan(0);
      }
    }
  });

  it("分鏡只使用支援的場景型別，wheel/bar 都給了份數", () => {
    const kinds = new Set(["uneven", "wheel", "bar", "frac", "equiv"]);
    for (const layer of FRACTION_COURSE.layers) {
      for (const scene of layer.scenes) {
        expect(kinds.has(scene.kind)).toBe(true);
        if (scene.kind === "wheel" || scene.kind === "bar") {
          expect(scene.parts).toBeGreaterThan(1);
        }
      }
    }
  });
});

describe("分層解鎖邏輯", () => {
  it("第一層永遠開放，後一層要前一層完成才解鎖", () => {
    expect(isLayerUnlocked(FRACTION_COURSE, 0, {})).toBe(true);
    expect(isLayerUnlocked(FRACTION_COURSE, 1, {})).toBe(false);
    expect(isLayerUnlocked(FRACTION_COURSE, 2, {})).toBe(false);

    const firstDone: Record<string, LayerProgress> = {
      [FRACTION_COURSE.layers[0].id]: doneLayer(3),
    };
    expect(isLayerUnlocked(FRACTION_COURSE, 1, firstDone)).toBe(true);
    expect(isLayerUnlocked(FRACTION_COURSE, 2, firstDone)).toBe(false);
  });
});

describe("星等與頭銜", () => {
  it("單層星等：零失誤 3 星、錯 1 次 2 星、錯 2 次以上 1 星", () => {
    expect(layerStars(0)).toBe(3);
    expect(layerStars(1)).toBe(2);
    expect(layerStars(2)).toBe(1);
    expect(layerStars(9)).toBe(1);
  });

  it("整輪未完成沒有總星等，全 3 星給 3 星，參差給 2 星", () => {
    expect(courseTotalStars(FRACTION_COURSE, {})).toBe(0);

    const allThree: Record<string, LayerProgress> = {};
    FRACTION_COURSE.layers.forEach((l) => {
      allThree[l.id] = doneLayer(3);
    });
    expect(courseTotalStars(FRACTION_COURSE, allThree)).toBe(3);

    const mixed: Record<string, LayerProgress> = {};
    FRACTION_COURSE.layers.forEach((l, i) => {
      mixed[l.id] = doneLayer(i % 2 === 0 ? 3 : 1);
    });
    expect(courseTotalStars(FRACTION_COURSE, mixed)).toBe(2);
  });

  it("完成層數與學習頭銜一起成長", () => {
    expect(completedLayerCount(FRACTION_COURSE, {})).toBe(0);
    const partial: Record<string, LayerProgress> = {
      [FRACTION_COURSE.layers[0].id]: doneLayer(3),
      [FRACTION_COURSE.layers[1].id]: doneLayer(2),
    };
    expect(completedLayerCount(FRACTION_COURSE, partial)).toBe(2);
    expect(rankTitle(0, 4)).toBe("新手洋蔥");
    expect(rankTitle(1, 4)).toBe("剝皮助手");
    expect(rankTitle(2, 4)).toBe("分數學徒");
    expect(rankTitle(3, 4)).toBe("概念行家");
    expect(rankTitle(4, 4)).toBe("分數小達人");
  });
});

describe("local-first 進度", () => {
  beforeEach(() => localStorage.clear());

  it("存進去後能讀回同一門課的各層進度", () => {
    const map: OnionProgressMap = {
      fractions: { layers: { [FRACTION_COURSE.layers[0].id]: doneLayer(3, 0, 2) } },
    };
    saveOnionProgress(map);
    const read = loadOnionProgress();
    expect(courseProgress(read, "fractions")[FRACTION_COURSE.layers[0].id]?.stars).toBe(3);
    expect(courseProgress(read, "fractions")[FRACTION_COURSE.layers[0].id]?.firstTry).toBe(2);
    expect(courseProgress(read, "other")).toEqual({});
  });

  it("沒有資料時回空物件而不是噴錯", () => {
    expect(loadOnionProgress()).toEqual({});
  });
});
