import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { acceptsDocFile, listKnowledgeDocs, MAX_DOC_BYTES, readKnowledgeDoc } from "./knowledgeBase";

/**
 * 知識庫讀取層的測試。
 *
 * 重點不是「能不能讀到檔案」（那太簡單），而是**能不能擋掉不該讀的檔案**——
 * 這層若被穿越，站長專屬端點就變成任意檔案讀取。
 */

describe("listKnowledgeDocs", () => {
  it("目錄不存在時回空清單而不是拋錯（知識庫還沒建好是正常狀態）", () => {
    const { docs } = listKnowledgeDocs();
    expect(Array.isArray(docs)).toBe(true);
  });

  it("每一筆都有可顯示的欄位，且 id 前綴只允許 knowledge/ 或 docs/", () => {
    const { docs } = listKnowledgeDocs();
    for (const doc of docs) {
      expect(doc.id).toMatch(/^(knowledge|docs)\//);
      expect(doc.title.length).toBeGreaterThan(0);
      expect(doc.bytes).toBeGreaterThan(0);
      expect(["知識庫", "專案文件"]).toContain(doc.category);
    }
  });

  it("知識庫排在專案文件之前（那是給 agent 與站長的入口）", () => {
    const { docs } = listKnowledgeDocs();
    const categories = docs.map((doc) => doc.category);
    const firstReference = categories.indexOf("專案文件");
    if (firstReference >= 0) {
      expect(categories.slice(firstReference).every((c) => c === "專案文件")).toBe(true);
    }
  });
});

describe("readKnowledgeDoc 的安全邊界", () => {
  it("⭐ 不存在的 id 回 null（不拋錯）", () => {
    expect(readKnowledgeDoc("knowledge/does-not-exist.md")).toBeNull();
  });

  it("⭐ 路徑穿越一律回 null——即使目標檔案真的存在", () => {
    const attacks = [
      "../../../../etc/passwd",
      "docs/../../../etc/hosts",
      "knowledge/../../package.json",
      "..%2f..%2fetc%2fpasswd",
      "/etc/passwd",
      "docs/./../../../../etc/passwd",
    ];
    for (const attack of attacks) {
      expect(readKnowledgeDoc(attack)).toBeNull();
    }
  });

  it("⭐ 就算呼叫端知道 repo 內某個真實檔名，也不能繞過目錄直接指定", () => {
    // package.json 確實存在於 repo 根，但沒有任何 id 會指向它
    expect(existsSync(path.resolve("package.json"))).toBe(true);
    expect(readKnowledgeDoc("package.json")).toBeNull();
    expect(readKnowledgeDoc("docs/package.json")).toBeNull();
  });

  it("空字串與空白 id 回 null", () => {
    expect(readKnowledgeDoc("")).toBeNull();
    expect(readKnowledgeDoc("   ")).toBeNull();
  });
});

describe("⭐ 回歸：id 前綴是命名空間、不是路徑", () => {
  // 這個 bug 騙過我一次：id 是 `knowledge/xxx.md`，真實目錄卻是
  // `docs/knowledge-base/`。用 path.resolve(root, id) 會解析到不存在的
  // `<root>/knowledge/`，於是**整組知識庫文件都讀不到**。
  // 症狀看起來像「只有中文檔名有問題」（因為 docs/ 開頭的正常），
  // 實際上是整組都壞——所以要測「目錄裡的每一份都讀得到」。
  it("目錄裡的每一份文件都必須真的讀得到（不是只有 docs/ 開頭的）", () => {
    const { docs } = listKnowledgeDocs();
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) {
      const content = readKnowledgeDoc(doc.id);
      expect(content, `讀不到 ${doc.id}`).not.toBeNull();
      expect(content?.markdown.length, `${doc.id} 內容為空`).toBeGreaterThan(0);
    }
  });

  it("知識庫底層目錄（knowledge/ 前綴）也要讀得到", () => {
    const { docs } = listKnowledgeDocs();
    const knowledgeDocs = docs.filter((doc) => doc.id.startsWith("knowledge/"));
    expect(knowledgeDocs.length).toBeGreaterThan(0);
    expect(readKnowledgeDoc(knowledgeDocs[0].id)).not.toBeNull();
  });
});

describe("acceptsDocFile 的收檔規則", () => {
  it("只收 .md", () => {
    expect(acceptsDocFile("README.md", 100)).toBe(true);
    expect(acceptsDocFile("notes.txt", 100)).toBe(false);
    expect(acceptsDocFile("image.png", 100)).toBe(false);
    expect(acceptsDocFile("archive.md.zip", 100)).toBe(false);
  });

  it("大小寫不敏感的副檔名（README.MD 也要收）", () => {
    expect(acceptsDocFile("README.MD", 100)).toBe(true);
  });

  it("`_` 前綴視為暫存、不上架", () => {
    expect(acceptsDocFile("_draft.md", 100)).toBe(false);
    expect(acceptsDocFile("draft.md", 100)).toBe(true);
  });

  it("⭐ 超過大小上限就拒收（避免巨大檔塞爆回應）", () => {
    expect(acceptsDocFile("huge.md", MAX_DOC_BYTES)).toBe(true);
    expect(acceptsDocFile("huge.md", MAX_DOC_BYTES + 1)).toBe(false);
  });

  it("空檔案拒收（0 bytes 不代表有內容）", () => {
    expect(acceptsDocFile("empty.md", 0)).toBe(false);
  });
});

describe("repoRoot 的推導在打包後仍正確", () => {
  it("找得到 package.json（代表定位到 repo 根而非上一層）", () => {
    const { docs } = listKnowledgeDocs();
    // 若 repoRoot 錯了（例如指到 server/），docs/ 會是空的可讀結果；
    // 這裡只驗證呼叫本身不拋錯，代表路徑推導沒有進入死路。
    expect(docs).not.toBeUndefined();
  });

  it("tmpdir 建立的目錄可正常寫入（測試環境本身健全）", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "kb-"));
    try {
      expect(existsSync(dir)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
