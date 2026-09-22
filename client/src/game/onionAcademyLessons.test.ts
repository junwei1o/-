import { describe, expect, it } from "vitest";
import {
  CHINESE_DE_LESSON,
  FRACTION_LESSON,
  LINEAR_EQUATION_LESSON,
  NEGATIVE_NUMBER_LESSON,
  ONION_CELL_LESSON,
  ONION_LESSONS,
  PHOTOSYNTHESIS_LESSON,
  TRIANGLE_AREA_LESSON,
  WATER_CYCLE_LESSON,
  getOnionLesson,
  gradeOnionLesson,
  type OnionAction,
  type OnionProp,
} from "./onionAcademyLessons";

describe("onion lesson grading", () => {
  it("gives 3 stars and bonus coins for a perfect run", () => {
    const r = gradeOnionLesson(5, 5);
    expect(r.stars).toBe(3);
    expect(r.coins).toBe(70); // 5*10 + 20 全對加成
  });

  it("gives 2 stars at 70% threshold", () => {
    const r = gradeOnionLesson(4, 5); // 80% → 2
    expect(r.stars).toBe(2);
    expect(r.coins).toBe(40); // 無全對加成
  });

  it("gives 1 star at 40% threshold and stays 1 below 70%", () => {
    expect(gradeOnionLesson(2, 5).stars).toBe(1); // 40% 邊界 → 1
    expect(gradeOnionLesson(3, 5).stars).toBe(1); // 60% 仍 < 70% → 1
  });

  it("gives 0 stars below 40%", () => {
    const r = gradeOnionLesson(1, 5); // 20%
    expect(r.stars).toBe(0);
    expect(r.coins).toBe(10);
  });

  it("handles zero-total safely", () => {
    expect(gradeOnionLesson(0, 0).stars).toBe(0);
  });
});

/** 所有課程都應通過的共用資料完整性檢查（架構通用性驗證）。 */
function lessonIntegrity(lesson: typeof FRACTION_LESSON) {
  const validActions: OnionAction[] = ["wave", "walk", "point", "jump", "think", "cheer"];

  it(`${lesson.id}: 有 7-12 幀分鏡、5-7 題闖關、至少 3 次提問、4 條重點`, () => {
    expect(lesson.frames.length).toBeGreaterThanOrEqual(7);
    expect(lesson.frames.length).toBeLessThanOrEqual(12);
    expect(lesson.questions.length).toBeGreaterThanOrEqual(5);
    expect(lesson.questions.length).toBeLessThanOrEqual(7);
    expect(lesson.frames.filter((f) => f.ask).length).toBeGreaterThanOrEqual(3);
    expect(lesson.takeaways?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it(`${lesson.id}: 每幀有合法動作、正時長、非空字幕`, () => {
    for (const f of lesson.frames) {
      expect(validActions).toContain(f.action);
      expect(f.duration).toBeGreaterThan(0);
      expect(f.caption.length).toBeGreaterThan(0);
    }
  });

  it(`${lesson.id}: 每題答案索引合法、選項≥2、有解析`, () => {
    for (const q of lesson.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it(`${lesson.id}: 每幀教具 well-formed（依 kind 分派驗證）`, () => {
    const checkProp = (p: OnionProp) => {
      if (p.kind === "none") return;
      if (p.kind === "pie") {
        expect(p.a).toBeGreaterThanOrEqual(0);
        expect(p.a).toBeLessThanOrEqual(p.b);
        expect(p.b).toBeGreaterThan(0);
      }
      if (p.kind === "pies") {
        checkProp({ kind: "pie", a: p.left.a, b: p.left.b });
        checkProp({ kind: "pie", a: p.right.a, b: p.right.b });
        if (p.result) checkProp({ kind: "pie", a: p.result.a, b: p.result.b });
      }
      if (p.kind === "text") {
        expect(p.text.length).toBeGreaterThan(0);
      }
      if (p.kind === "cycle") {
        expect(p.nodes.length).toBeGreaterThanOrEqual(2);
        if (p.active !== undefined) {
          expect(p.active).toBeGreaterThanOrEqual(0);
          expect(p.active).toBeLessThan(p.nodes.length);
        }
      }
      if (p.kind === "shape" && p.shape === "triangle") {
        expect(p.base).toBeGreaterThan(0);
        expect(p.height).toBeGreaterThan(0);
      }
    };
    for (const f of lesson.frames) checkProp(f.prop);
  });

  it(`${lesson.id}: 中途提問（ask）合法：≥2 個、答案索引正確、有提示`, () => {
    const askFrames = lesson.frames.filter((f) => f.ask);
    expect(askFrames.length).toBeGreaterThanOrEqual(2);
    for (const f of askFrames) {
      const ask = f.ask!;
      expect(ask.options.length).toBeGreaterThanOrEqual(2);
      expect(ask.answer).toBeGreaterThanOrEqual(0);
      expect(ask.answer).toBeLessThan(ask.options.length);
      expect(ask.prompt.length).toBeGreaterThan(0);
      expect(ask.hint.length).toBeGreaterThan(0);
    }
  });

  it(`${lesson.id}: 學段標記（stages）合法且與 grade 一致`, () => {
    expect(lesson.stages.length).toBeGreaterThan(0);
    for (const s of lesson.stages) expect(["國小", "國中"]).toContain(s);
    // grade 字串裡出現國中年級（七／八／九）就必須標國中，否則相反
    const hasJunior = /[七八九]上|[七八九]下/.test(lesson.grade);
    const hasElementary = /[三四五六]上|[三四五六]下/.test(lesson.grade);
    if (hasJunior) expect(lesson.stages).toContain("國中");
    if (hasElementary) expect(lesson.stages).toContain("國小");
  });

  it(`${lesson.id}: 有小結重點 4 條、每題至少 2 個提示`, () => {
    expect(lesson.takeaways).toHaveLength(4);
    for (const q of lesson.questions) {
      expect(q.hints?.length ?? 0).toBeGreaterThanOrEqual(2);
      for (const h of q.hints ?? []) expect(h.length).toBeGreaterThan(0);
    }
  });
}

describe("registry & lookup", () => {
  it("registers all lessons across every subject", () => {
    expect(ONION_LESSONS.length).toBeGreaterThanOrEqual(200);
    const subjects = new Set(ONION_LESSONS.map((l) => l.subject));
    // 擴充到 200 堂後科目橫跨國小到高中：國小五大科 ＋ 高中各科。
    // 這裡逐一列出（而不是只檢查數量），這樣漏掉一整科會被抓到。
    for (const subject of [
      "數學",
      "國語",
      "自然",
      "英語",
      "社會",
      "物理",
      "化學",
      "生物",
      "地球科學",
      "歷史",
      "地理",
      "公民",
      "英文",
      "國文",
    ]) {
      expect(subjects.has(subject), `缺少科目：${subject}`).toBe(true);
    }
    expect(subjects.size).toBeGreaterThanOrEqual(14);
  });

  it("每一堂課只屬於一個學段（國中看過的國小不會再來一遍）", () => {
    for (const lesson of ONION_LESSONS) {
      expect(lesson.stages).toHaveLength(1);
      expect(["國小", "國中", "高中"]).toContain(lesson.stages[0]);
    }
    // 知識點可以跨學段各開一堂（如光合作用），但 id 必須不同，不能同一堂掛兩邊
    const ids = ONION_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("每個學段都有足夠的課可選（不再只有個位數）", () => {
    const elementary = ONION_LESSONS.filter((l) => l.stages.includes("國小"));
    const junior = ONION_LESSONS.filter((l) => l.stages.includes("國中"));
    const senior = ONION_LESSONS.filter((l) => l.stages.includes("高中"));
    expect(elementary.length).toBeGreaterThanOrEqual(70);
    expect(junior.length).toBeGreaterThanOrEqual(65);
    expect(senior.length).toBeGreaterThanOrEqual(65);
  });

  it("國中三個年級都有動畫課（八、九年級不再是空的）", () => {
    const junior = ONION_LESSONS.filter((l) => l.stages.includes("國中"));
    const grades = new Set(junior.map((l) => l.grade));
    // 七上、八下、九上都要有課
    expect(grades.has("七上")).toBe(true);
    expect(grades.has("八下")).toBe(true);
    expect(grades.has("九上")).toBe(true);
  });

  it("國小與國中都各有課程，選課頁分流不會出現空清單", () => {
    const elementary = ONION_LESSONS.filter((l) => l.stages.includes("國小"));
    const junior = ONION_LESSONS.filter((l) => l.stages.includes("國中"));
    expect(elementary.length).toBeGreaterThanOrEqual(4);
    expect(junior.length).toBeGreaterThanOrEqual(4);
  });

  it("getOnionLesson finds by id and falls back to first", () => {
    expect(getOnionLesson("water-cycle")).toBe(WATER_CYCLE_LESSON);
    expect(getOnionLesson("nope")).toBe(FRACTION_LESSON);
  });

  it("all lesson ids are unique", () => {
    const ids = ONION_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("fraction lesson data integrity", () => {
  lessonIntegrity(FRACTION_LESSON);

  it("teaches same-denominator addition (calc answers are fractions)", () => {
    // 前 6 題是計算題，答案應為分數；第 7 題是易錯觀念題（答案為文字）
    for (const q of FRACTION_LESSON.questions.slice(0, 6)) {
      expect(q.options[q.answer]).toMatch(/^\d+\/\d+/);
    }
  });
});

describe("chinese 的得地 lesson data integrity", () => {
  lessonIntegrity(CHINESE_DE_LESSON);

  it("uses text props to show word usage", () => {
    const textFrames = CHINESE_DE_LESSON.frames.filter((f) => f.prop.kind === "text");
    expect(textFrames.length).toBeGreaterThan(0);
  });
});

describe("water cycle lesson data integrity", () => {
  lessonIntegrity(WATER_CYCLE_LESSON);

  it("uses cycle props with 4 nodes", () => {
    const cycleFrames = WATER_CYCLE_LESSON.frames.filter((f) => f.prop.kind === "cycle");
    expect(cycleFrames.length).toBeGreaterThan(0);
    for (const f of cycleFrames) {
      if (f.prop.kind === "cycle") expect(f.prop.nodes).toHaveLength(4);
    }
  });
});

describe("triangle area lesson data integrity", () => {
  lessonIntegrity(TRIANGLE_AREA_LESSON);

  it("uses triangle shape props", () => {
    const shapeFrames = TRIANGLE_AREA_LESSON.frames.filter((f) => f.prop.kind === "shape");
    expect(shapeFrames.length).toBeGreaterThan(0);
  });

  it("teaches base×height÷2 (calc answers are numeric)", () => {
    // 第 1 題問公式（含 ÷），其餘是計算題，答案應為純數字
    const calcQs = TRIANGLE_AREA_LESSON.questions.slice(1);
    expect(calcQs.length).toBeGreaterThanOrEqual(4);
    for (const q of calcQs) {
      expect(q.options[q.answer]).toMatch(/^\d+$/);
    }
  });
});

describe("photosynthesis lesson data integrity", () => {
  lessonIntegrity(PHOTOSYNTHESIS_LESSON);

  it("uses 12 frames for the fine-grained factory tour", () => {
    expect(PHOTOSYNTHESIS_LESSON.frames).toHaveLength(12);
  });

  it("covers raw materials, chloroplast, glucose and oxygen in captions", () => {
    const all = PHOTOSYNTHESIS_LESSON.frames.map((f) => f.caption).join("");
    expect(all).toContain("水");
    expect(all).toContain("二氧化碳");
    expect(all).toContain("葉綠體");
    expect(all).toContain("氧氣");
  });
});

describe("negative number lesson data integrity", () => {
  lessonIntegrity(NEGATIVE_NUMBER_LESSON);

  it("uses 12 frames and teaches number line, ordering and opposites", () => {
    expect(NEGATIVE_NUMBER_LESSON.frames).toHaveLength(12);
    const all = NEGATIVE_NUMBER_LESSON.frames.map((f) => f.caption).join("");
    expect(all).toContain("數線");
    expect(all).toContain("相反數");
  });
});

describe("linear equation lesson data integrity", () => {
  lessonIntegrity(LINEAR_EQUATION_LESSON);

  it("uses 12 frames and teaches balance, solving and 移項", () => {
    expect(LINEAR_EQUATION_LESSON.frames).toHaveLength(12);
    const all = LINEAR_EQUATION_LESSON.frames.map((f) => f.caption).join("");
    expect(all).toContain("天平");
    expect(all).toContain("移項");
  });

  it("solution of every equation question is a small integer", () => {
    // 第 5 題是「哪個方程式的解」題型，答案是式子；前 4 題答案應為整數
    for (const q of LINEAR_EQUATION_LESSON.questions.slice(0, 4)) {
      expect(q.options[q.answer]).toMatch(/^[−-]?\d+$/);
    }
  });
});

describe("onion cell lesson data integrity", () => {
  lessonIntegrity(ONION_CELL_LESSON);

  it("uses 12 frames and covers wall, membrane, nucleus, vacuole", () => {
    expect(ONION_CELL_LESSON.frames).toHaveLength(12);
    const all = ONION_CELL_LESSON.frames.map((f) => f.caption).join("");
    expect(all).toContain("細胞壁");
    expect(all).toContain("細胞膜");
    expect(all).toContain("細胞核");
    expect(all).toContain("液泡");
  });
});
