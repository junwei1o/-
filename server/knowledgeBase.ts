import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 知識庫讀取層（2026-10-02）。
 *
 * ## 為什麼知識要放在 repo 裡的 markdown，而不是寫死在前端
 *
 * 站長頁要能讀到「本機做过什麼、為什麼這樣做、踩過哪些坑」，而同一份內容
 * 必須**同時**被三種讀者消費：
 *   1. 站長 —— 在瀏覽器裡看 /admin
 *   2. 之後的 agent（包含我自己）—— 直接讀檔、grep、修
 *   3. 站長自己 —— 用任何編輯器看
 *
 * 如果把內容寫成前端 TS 常數，第 2、3 種讀者就看不到，內容會變成只有
 * 「改程式才能更新」的孤島。所以**markdown 檔是唯一真實來源**，
 * 後台只是把它讀出來顯示。
 *
 * 另一個後果是：**檔案必須在 repo 裡**。Render 部署的是 repo，
 * 讀不到本機 WorkBuddy 目錄——所以記憶要先落成 repo 內的檔案才上得了站。
 *
 * ## 安全邊界
 *
 * 這是站長專屬端點，但仍然擋掉路徑穿越：
 *   - 只走「目錄清單產生的 id」，呼叫端**無法傳入任意路徑**
 *   - id 必須命中清單；命中後仍重新驗證解析後的路徑仍在允許根目錄內
 *   - 僅 `.md`、僅允許根目錄內、單檔上限 `MAX_DOC_BYTES`
 *   - 檔案不存在／讀不到就跳過（不讓一份壞檔讓整個目錄掛掉）
 */

/** 知識庫根目錄（本站自己寫的、給 agent 與站長看的操作文件）。 */
export const KNOWLEDGE_DIR = "docs/knowledge-base";

/**
 * 專案既有文件目錄。刻意**只列允許的子目錄**而不是遞迴整個 docs/：
 * `docs/superpowers/plans/` 底下有 60 KB 級的計劃稿，逐一攤開在後台
 * 只會淹掉真正該被讀到的那幾份。
 */
export const REFERENCE_DIRS = ["docs"] as const;

/** 單檔上限：超過就不收，避免把意外產生的巨大檔案塞進回應。 */
export const MAX_DOC_BYTES = 160 * 1024;

/**
 * 一個檔案是否值得收進目錄。
 *
 * 抽成純函式是為了能直接測邊界——用「在 repo 裡真的生一個 160 KB 檔」
 * 來測會污染工作樹，而這條規則將來很可能要調，測試不該綁死數字。
 */
export function acceptsDocFile(name: string, bytes: number): boolean {
  if (!name.toLowerCase().endsWith(".md")) return false;
  if (name.startsWith("_")) return false; // `_` 前綴＝暫存，不上架
  if (bytes <= 0) return false;
  return bytes <= MAX_DOC_BYTES;
}

/** 目錄清單快取（秒）。部署後檔案不會常變，不需要每次都走磁碟。 */
const INDEX_TTL_MS = 60_000;

export type KnowledgeDoc = {
  /** 穩定識別碼：`knowledge/01-xxx` 或 `docs/xxx.md`，由清單決定、不可自訂。 */
  id: string;
  /** 顯示用的標題（取檔案第一個 `#` 標題，沒有就用檔名）。 */
  title: string;
  /** 分類：`知識庫` 或 `專案文件`。 */
  category: "知識庫" | "專案文件";
  /** 檔案大小（bytes），供站長快速判斷要不要點開。 */
  bytes: number;
  /** 檔案敘述（取第一段非標題文字）。 */
  summary: string;
};

type Index = { docs: KnowledgeDoc[]; builtAt: number };

let cache: Index | null = null;

function repoRoot(): string {
  // 向上找 package.json，而不是猜「repo 根 = 模組的上一層」。
  // 猜的話會在打包後出錯：dev 時模組在 `server/`，但 production bundle 在
  // `dist/index.js`——兩者對 repo 根的相對深度看起來一樣，其實是巧合。
  // 找 package.json 則兩種情況都對，往後搬目錄也不會壞。
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // 找不到就退回啟動目錄（Render 的啟動目錄就是 repo 根）
  return process.cwd();
}

/**
 * id 前綴 → 真實目錄。
 *
 * ⚠️ 這張表存在的理由（2026-10-02 實測踩到）：id 前綴 `knowledge/` 只是
 * **命名空間**，不是路徑。真實目錄是 `docs/knowledge-base/`。
 * 第一版用 `path.resolve(root, entry.id)` 去還原路徑，結果把
 * `knowledge/README.md` 解析成 `<root>/knowledge/README.md`——
 * 一個不存在的地方，於是**每一份知識庫文件都讀不到**（但 `docs/` 開頭的正常，
 * 所以看起來像「只有中文檔名有問題」，其實是整組都壞）。
 */
const ID_PREFIX_TO_DIR: Record<string, string> = {
  knowledge: KNOWLEDGE_DIR,
  docs: "docs",
};

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

/** 取第一個 `# ` 標題當標題；沒有就用檔名（去掉副檔名）。 */
function titleFrom(content: string, filePath: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  if (match) return match[1].trim();
  return path.basename(filePath).replace(/\.md$/i, "");
}

/**
 * 取第一段「像說明」的文字當檔案敘述。
 * 刻意跳過標題、引用、程式碼與清單符號——那些不是摘要。
 */
function summaryFrom(content: string): string {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || trimmed.startsWith(">") || trimmed.startsWith("```")) continue;
    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) continue;
    if (trimmed.startsWith("|")) continue;
    return trimmed.replace(/[`*_]/g, "").slice(0, 110);
  }
  return "";
}

/** 走訪單一目錄（不遞迴），回傳符合條件的 md 檔。 */
function collect(dirAbs: string, category: KnowledgeDoc["category"], prefix: string): KnowledgeDoc[] {
  let entries: string[];
  try {
    entries = readdirSync(dirAbs);
  } catch {
    return []; // 目錄不存在（例如還沒建立知識庫）——不是錯誤，是正常狀態
  }

  const docs: KnowledgeDoc[] = [];
  for (const name of entries) {
    let bytes: number;
    try {
      const stat = statSync(path.join(dirAbs, name));
      if (!stat.isFile()) continue;
      bytes = stat.size;
    } catch {
      continue;
    }
    if (!acceptsDocFile(name, bytes)) continue;

    let content = "";
    try {
      content = readFileSync(path.join(dirAbs, name), "utf8");
    } catch {
      continue; // 壞檔跳過，不要讓整份清單失敗
    }

    docs.push({
      id: `${prefix}/${name}`,
      title: titleFrom(content, path.join(dirAbs, name)),
      category,
      bytes,
      summary: summaryFrom(content),
    });
  }
  return docs;
}

function buildIndex(): Index {
  const root = repoRoot();
  const docs: KnowledgeDoc[] = [
    ...collect(path.join(root, KNOWLEDGE_DIR), "知識庫", "knowledge"),
    ...collect(path.join(root, REFERENCE_DIRS[0]), "專案文件", "docs"),
  ];

  // 知識庫優先（那是給 agent 與站長的入口），同類別依檔名排序
  docs.sort((a, b) => {
    if (a.category !== b.category) return a.category === "知識庫" ? -1 : 1;
    return a.id.localeCompare(b.id, "zh-Hant");
  });

  return { docs, builtAt: Date.now() };
}

/** 全部知識庫文件的目錄（含標題、摘要、大小）。 */
export function listKnowledgeDocs(): { docs: KnowledgeDoc[]; builtAt: number; stale: boolean } {
  if (!cache || Date.now() - cache.builtAt > INDEX_TTL_MS) {
    cache = buildIndex();
  }
  return { ...cache, stale: false };
}

/**
 * 讀取單一份文件全文。
 *
 * `id` 必須命中目錄——這是刻意的：呼叫端無法夾帶路徑，
 * 因此不存在「用 `../../etc/passwd` 穿越」的輸入面。
 */
export function readKnowledgeDoc(id: string): { id: string; title: string; markdown: string } | null {
  const { docs } = listKnowledgeDocs();
  const entry = docs.find((doc) => doc.id === id);
  if (!entry) return null;

  // 用前綴→目錄的對照表還原路徑（id 前綴不是路徑，見 ID_PREFIX_TO_DIR 的說明）
  const slash = entry.id.indexOf("/");
  if (slash < 0) return null;
  const dirName = ID_PREFIX_TO_DIR[entry.id.slice(0, slash)];
  if (!dirName) return null;

  const root = repoRoot();
  const allowedRoot = path.join(root, dirName);
  const fileAbs = path.resolve(allowedRoot, entry.id.slice(slash + 1));
  // 二次防護：即使 id 命中目錄，仍確認解析後的路徑落在允許根目錄內。
  if (!isInside(allowedRoot, fileAbs)) return null;

  try {
    return { id: entry.id, title: entry.title, markdown: readFileSync(fileAbs, "utf8") };
  } catch {
    return null;
  }
}
