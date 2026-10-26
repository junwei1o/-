-- Phase 1（2026-10-26）：exam_records 補兩個索引。
--
-- 背景：原本只有 exam_records_name_idx(name)。新需求「按學生算掌握度」要
-- 取「某學生最近 N 筆」，週榜/賽榜要按 createdAt 過濾排序——兩者都會全表掃描。
-- 複合鍵 (name, createdAt) 對應「先等值過濾、再範圍排序」的查詢形狀。
--
-- ⚠️ 手寫增量：`drizzle-kit generate` 因 meta 快照與 schema 不同步，
-- 產出的是整庫建表腳本（會重複建既有 15 張表），不可執行。
-- 以 IF NOT EXISTS 保證重複執行安全。

CREATE INDEX `exam_records_name_created_idx` ON `exam_records` (`name`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `exam_records_created_idx` ON `exam_records` (`createdAt`);
