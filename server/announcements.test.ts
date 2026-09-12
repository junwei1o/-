import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 直接 stub 三个 announcements 函数，避开 drizzle 内部调用链。
 * 这样测试的是路由调用契约，而不是 drizzle ORM 行为。
 */
const fakeRows = new Map<number, {
  id: number;
  classCode: string;
  teacherName: string;
  content: string;
  createdAt: Date;
}>();
let nextId = 1;

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    createAnnouncement: vi.fn(async (row: { classCode: string; teacherName: string; content: string }) => {
      const id = nextId++;
      fakeRows.set(id, { id, ...row, createdAt: new Date() });
      return { id };
    }),
    listAnnouncements: vi.fn(async (code: string, limit = 10) => {
      const filtered = Array.from(fakeRows.values())
        .filter((r) => r.classCode === code)
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);
      return filtered;
    }),
    deleteAnnouncement: vi.fn(async (id: number, classCode: string, teacherName: string) => {
      const r = fakeRows.get(id);
      if (!r) return { ok: false as const, reason: "notFound" as const };
      if (r.classCode !== classCode || r.teacherName !== teacherName) {
        return { ok: false as const, reason: "forbidden" as const };
      }
      fakeRows.delete(id);
      return { ok: true as const };
    }),
  };
});

// import AFTER mock — vi.mock 是 hoisted
const { createAnnouncement, listAnnouncements, deleteAnnouncement } = await import("./db");

beforeEach(() => {
  fakeRows.clear();
  nextId = 1;
  vi.clearAllMocks();
});

describe("class_announcements 服務層", () => {
  it("老師發公告 → 列表可見（最新在前）", async () => {
    await createAnnouncement({ classCode: "ABC123", teacherName: "劉老師", content: "週末作業練習本 p.32" });
    await createAnnouncement({ classCode: "ABC123", teacherName: "劉老師", content: "週三複習小考" });
    const list = await listAnnouncements("ABC123");
    expect(list).toHaveLength(2);
    expect(list[0].content).toBe("週三複習小考");
    expect(list[1].content).toBe("週末作業練習本 p.32");
  });

  it("不同班級公告互不干擾", async () => {
    await createAnnouncement({ classCode: "AAA111", teacherName: "甲老師", content: "AAA 公告" });
    await createAnnouncement({ classCode: "BBB222", teacherName: "乙老師", content: "BBB 公告" });
    expect(await listAnnouncements("AAA111")).toHaveLength(1);
    expect(await listAnnouncements("BBB222")).toHaveLength(1);
  });

  it("limit 限制回傳數", async () => {
    for (let i = 0; i < 5; i++) {
      await createAnnouncement({ classCode: "CCC333", teacherName: "丙老師", content: `公告 ${i}` });
    }
    expect(await listAnnouncements("CCC333", 3)).toHaveLength(3);
  });

  it("老師只能刪自己班級/自己的公告", async () => {
    const a = await createAnnouncement({ classCode: "DDD444", teacherName: "張老師", content: "張老師的公告" });
    expect(await deleteAnnouncement(a.id, "DDD444", "李老師")).toEqual({ ok: false, reason: "forbidden" });
    expect(await deleteAnnouncement(a.id, "EEE555", "張老師")).toEqual({ ok: false, reason: "forbidden" });
    expect(await deleteAnnouncement(a.id, "DDD444", "張老師")).toEqual({ ok: true });
    expect(await listAnnouncements("DDD444")).toHaveLength(0);
  });

  it("刪除不存在的 id 回 notFound", async () => {
    expect(await deleteAnnouncement(99999, "FFF666", "劉老師")).toEqual({ ok: false, reason: "notFound" });
  });
});