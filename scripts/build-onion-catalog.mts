#!/usr/bin/env tsx
/**
 * 產生洋蔥課程「輕量目錄」client/src/game/onionLessonCatalog.gen.ts。
 *
 * 為什麼需要：完整的 ONION_LESSONS（200 堂，含 7 幀分鏡＋5 題）約 580KB，首頁
 * 「今日推薦微課」只需要每堂的 id／標題／學科／年級／學段／一句話介紹。若首頁
 * 直接 import 完整課程，會把全部動畫課文打進首屏主 bundle，拖慢第一次開啟。
 *
 * 這支腳本掃描與 App 相同的課程來源（CORE_LESSONS ＋ onion/lessons/*.ts，
 * 邏輯必須與 qc-onion-lessons.mts 一致），只抽出輕量欄位輸出成獨立檔，讓首屏
 * 只載入目錄；完整課程則留到「我的教室」lazy 載入。
 *
 * 課程有新增／修改後請重跑：pnpm catalog:onion
 * 若忘記重跑，onionLessonCatalog.test.ts 的一致性測試會轉紅提醒。
 */
import { writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CORE_LESSONS, type OnionLesson } from "../client/src/game/onionAcademyLessons";

async function loadAllLessons(): Promise<OnionLesson[]> {
  const dir = join(process.cwd(), "client/src/game/onion/lessons");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".ts"))
    .sort();
  const extra: OnionLesson[] = [];
  for (const file of files) {
    const mod = (await import(join(dir, file))) as { default?: OnionLesson[] };
    extra.push(...(mod.default ?? []));
  }
  return [...CORE_LESSONS, ...extra];
}

const lessons = await loadAllLessons();

const summaries = lessons.map((lesson) => ({
  id: lesson.id,
  title: lesson.title,
  subject: lesson.subject,
  topic: lesson.topic,
  grade: lesson.grade,
  stages: lesson.stages,
  desc: lesson.desc,
}));

const output = `// GENERATED FILE — 由 scripts/build-onion-catalog.mts 自動產生，請勿手動編輯。
// 僅含每堂課的輕量目錄資訊（首頁推薦／選課清單使用）；完整分鏡與闖關題目留在
// onionAcademyLessons.ts，只在「我的教室」lazy 載入，避免塞爆首屏主 bundle。
// 課程有增改後請重跑：pnpm catalog:onion（測試會檢查此檔與完整課程是否一致）。
import type { OnionStage } from "@/game/onionAcademyLessons";

export interface OnionLessonSummary {
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade: string;
  stages: OnionStage[];
  desc: string;
}

export const ONION_LESSON_CATALOG: OnionLessonSummary[] = ${JSON.stringify(summaries, null, 2)};
`;

const outPath = join(process.cwd(), "client/src/game/onionLessonCatalog.gen.ts");
writeFileSync(outPath, output, "utf-8");
console.log(`onion catalog generated: ${summaries.length} lessons -> ${outPath}`);
