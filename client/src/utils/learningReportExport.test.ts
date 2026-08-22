import { describe, expect, it } from "vitest";
import { buildPrintableTeacherReportHtml, buildTeacherReportCsv } from "./learningReportExport";

const summary = { generatedAt: 1_700_000_000_000, totalAttempts: 12, totalCorrect: 9, activeDays: 3, averagePlayMs: 360_000, subjectRows: [{ subject: "數學", attempts: 8, accuracy: 75, averageResponseMs: 4200 }], weakTags: [{ label: "觀念", count: 2 }], recommendations: ["加強數學的概念辨識"] };

describe("learningReportExport", () => {
  it("creates a BOM-prefixed CSV with escaped local learning data", () => {
    const csv = buildTeacherReportCsv(summary, [{ questionId: "m,1", subject: "數學", isCorrect: false, errorType: "concept", timestamp: 1_700_000_000_000, flagged: false }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"m,1"');
    expect(csv).toContain("加強數學的概念辨識");
  });

  it("creates printable HTML without injecting recommendation markup", () => {
    const html = buildPrintableTeacherReportHtml({ ...summary, recommendations: ["<script>bad</script>"] });
    expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
    expect(html).not.toContain("<script>bad</script>");
  });
});
