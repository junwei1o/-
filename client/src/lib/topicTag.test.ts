import { describe, expect, it } from "vitest";
import curriculumSeed from "../../../data/taiwan_curriculum_500.json";
import juniorSeed from "../../../data/junior_high_bank.json";
import { TOPIC_TAG_SUBJECTS, listTopicTags, resolveTopicTag, resolveTopicTagFromAttempt } from "./topicTag";

type Row = { subject: string; knowledge: string[]; learningTopic?: string };

const rows: Row[] = [
  ...(curriculumSeed as { questions: Row[] }).questions,
  ...(juniorSeed as { questions: Row[] }).questions,
];

describe("resolveTopicTag", () => {
  it("已知科目的題目都能收斂到該科的主題桶", () => {
    for (const row of rows) {
      const tag = resolveTopicTag(row.subject, row.knowledge, row.learningTopic);
      expect(tag.length).toBeGreaterThan(0);
      if (TOPIC_TAG_SUBJECTS.includes(row.subject)) {
        expect(listTopicTags(row.subject)).toContain(tag);
      }
    }
  });

  it("中階主題數量適中：每科 5～15 個桶", () => {
    for (const subject of TOPIC_TAG_SUBJECTS) {
      const tags = listTopicTags(subject);
      expect(tags.length).toBeGreaterThanOrEqual(5);
      expect(tags.length).toBeLessThanOrEqual(15);
    }
  });

  it("聚合有效：每個主題桶至少 20 題（舊知識標籤 1049 組／1130 題，完全無法聚合）", () => {
    const buckets = new Map<string, number>();
    for (const row of rows) {
      const tag = resolveTopicTag(row.subject, row.knowledge, row.learningTopic);
      buckets.set(tag, (buckets.get(tag) ?? 0) + 1);
    }
    expect(buckets.size).toBeLessThan(40); // 遠小於 1049
    for (const [tag, count] of buckets) {
      expect(count, `主題「${tag}」只有 ${count} 題`).toBeGreaterThanOrEqual(10);
    }
  });

  it("同一概念的細標籤會被收斂到同一個桶", () => {
    expect(resolveTopicTag("數學", ["分數乘法"], "分數")).toBe("分數與小數");
    expect(resolveTopicTag("數學", ["通分"], "分數加減")).toBe("分數與小數");
    expect(resolveTopicTag("數學", ["方程式", "移項"])).toBe("代數與方程式");
    expect(resolveTopicTag("數學", ["負數", "數線"])).toBe("代數與方程式");
    expect(resolveTopicTag("自然", ["光合作用", "葉綠體"])).toBe("植物與光合作用");
    expect(resolveTopicTag("自然", ["細胞", "構造與功能"])).toBe("生物與生命");
    expect(resolveTopicTag("國語", ["擬人", "修辭手法"])).toBe("修辭與寫作");
    expect(resolveTopicTag("社會", ["人口密度概念"], "人口")).toBe("資料與圖表判讀");
    expect(resolveTopicTag("自然", ["水循環"])).toBe("地球、水與大氣");
    expect(resolveTopicTag("自然", ["颱風"])).toBe("地球、水與大氣");
    expect(resolveTopicTag("國語", ["書信"])).toBe("文體與應用文");
  });

  it("未知科目回傳科目本身（不亂套用別科規則）", () => {
    expect(resolveTopicTag("綜合活動", ["團隊合作"])).toBe("綜合活動");
  });

  it("缺少標籤時回傳該科的預設桶", () => {
    expect(resolveTopicTag("數學", [])).toBe("數與計算");
    expect(resolveTopicTag("自然", [])).toBe("科學探究與實驗");
  });
});

describe("resolveTopicTagFromAttempt", () => {
  it("優先使用 subject，其次 curriculumDomain", () => {
    expect(
      resolveTopicTagFromAttempt({ subject: "數學", curriculumDomain: "數學領域", knowledge: ["面積"] }),
    ).toBe("幾何與圖形");
    expect(
      resolveTopicTagFromAttempt({ curriculumDomain: "數學", knowledge: ["速率"] }),
    ).toBe("比例與速率");
  });

  it("完全沒資料時不會噴錯", () => {
    expect(() => resolveTopicTagFromAttempt({})).not.toThrow();
  });
});
