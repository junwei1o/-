import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { renderMarkdown } from "../markdown";
import type { AdminModule } from "../types";

/**
 * 知識與文件類模組（2026-10-02）。
 *
 * 回答一個問題：**「這站為什麼長成這樣」要去哪裡查。**
 *
 * 這批模組刻意不做成「把記憶塞進前端常數」——內容放在 repo 的
 * `docs/knowledge-base/*.md`，後台在執行期讀檔。理由見該目錄的 README：
 * 同一份內容要同時被站長（在瀏覽器看）�� agent（在本機讀檔改）消費，
 * 寫成前端常數就會變成只有「改程式才能更新」的孤島。
 */

function Loading({ label }: { label: string }) {
  return <p className="admin-muted" aria-busy="true">{label}</p>;
}

function Failed({ label }: { label: string }) {
  return <p className="admin-error" role="alert">{label}</p>;
}

const formatBytes = (bytes: number) =>
  bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;

// ── 知識文件中心 ───────────────────────────────────────────

function KnowledgeCenterModule() {
  const index = trpc.admin.knowledgeIndex.useQuery(undefined, { staleTime: 60_000, retry: false });
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const doc = trpc.admin.knowledgeDoc.useQuery(
    { id: openId ?? "" },
    { enabled: Boolean(openId), staleTime: 60_000, retry: false }
  );

  const filtered = useMemo(() => {
    const docs = index.data?.docs ?? [];
    const needle = keyword.trim().toLowerCase();
    if (!needle) return docs;
    return docs.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.summary.toLowerCase().includes(needle) ||
        item.id.toLowerCase().includes(needle)
    );
  }, [index.data, keyword]);

  if (index.isPending) return <Loading label="正在讀取知識庫目錄…" />;
  if (index.isError || !index.data) return <Failed label="目前無法取得知識庫目錄。" />;

  const knowledgeCount = index.data.docs.filter((item) => item.category === "知識庫").length;

  return (
    <>
      <p className="admin-source">
        知識庫 <strong>{knowledgeCount}</strong> 份、專案文件 <strong>{index.data.docs.length - knowledgeCount}</strong> 份，
        全部來自 repo 內的 <code>docs/</code>——<strong>和 agent 在本機讀的是同一份檔案</strong>，
        所以站長這裡看到的和 agent 查到的不會有落差。
      </p>

      <div className="admin-doc-search">
        <label className="admin-doc-search-label" htmlFor="admin-doc-keyword">
          搜尋文件
        </label>
        <input
          id="admin-doc-keyword"
          className="admin-doc-search-input"
          type="search"
          value={keyword}
          placeholder="輸入關鍵字，例如「部署」「踩坑」「角色」"
          onChange={(event) => setKeyword(event.target.value)}
        />
        {keyword && (
          <button type="button" className="admin-doc-search-clear" onClick={() => setKeyword("")}>
            清除
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="admin-muted">沒有符合「{keyword}」的文件。</p>
      ) : (
        <ul className="admin-doc-list">
          {filtered.map((item) => {
            const isOpen = item.id === openId;
            return (
              <li key={item.id} className={`admin-doc-item${isOpen ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="admin-doc-head"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                >
                  <span className="admin-doc-caret" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
                  <span className="admin-doc-headings">
                    <span className="admin-doc-title">{item.title}</span>
                    <span className="admin-doc-meta">
                      <span className={`admin-doc-tag is-${item.category === "知識庫" ? "kb" : "ref"}`}>{item.category}</span>
                      <code className="admin-doc-id">{item.id}</code>
                      <span className="admin-doc-size">{formatBytes(item.bytes)}</span>
                    </span>
                  </span>
                </button>
                {item.summary && !isOpen && <p className="admin-doc-summary">{item.summary}</p>}
                {isOpen && (
                  <div className="admin-doc-body">
                    {doc.isPending && <Loading label="正在讀取文件內容…" />}
                    {doc.isError && <Failed label="讀取失敗，文件可能剛被改名或移除。" />}
                    {doc.data && <MarkdownBody markdown={doc.data.markdown} />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/**
 * 文件內容外框。
 *
 * 刻意限制高度並可捲動：知識庫動輒上百 KB，
 * 不設高度會讓整頁被單一份文件推走，其他模組都變得難以掃描。
 */
function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="admin-doc-scroll" tabIndex={0} role="region" aria-label="文件內容">
      {renderMarkdown(markdown)}
    </div>
  );
}

export const knowledgeCenterModule: AdminModule = {
  id: "knowledge-center",
  title: "知識文件中心",
  group: "knowledge",
  summary: "全站的文件：架構決策、工作紀錄、踩坑陷阱、待辦交接——可搜尋、可就地展開閱讀。",
  order: 20,
  span: "full",
  render: () => <KnowledgeCenterModule />,
};
