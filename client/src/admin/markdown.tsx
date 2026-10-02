import React from "react";

/**
 * 一個「剛好夠用」的 markdown 渲染器（2026-10-02）。
 *
 * ## 為什麼不用現成的函式庫
 *
 * 兩個理由，第二個是決定性的：
 *
 * 1. `pnpm add` 會改 `pnpm-lock.yaml`，而 Render 用 `pnpm install --frozen-lockfile`
 *    —— 不小心就會讓**部署直接失敗**。為了一個渲染器承擔這個風險不划算。
 * 2. 現成函式庫（`marked`、`react-markdown`…）幾乎都走
 *    `dangerouslySetInnerHTML`。本站是讓**學生與站長**讀的頁面，
 *    把 repo 內的 markdown 當 HTML 注入等於留一個 XSS 入口。
 *
 * ## 所以這個檔案怎麼做
 *
 * **不產生任何 HTML 字串**——每一行都變成 React element。
 * 文字節點由 React 自行跳脫，結構由我們決定，攻擊者沒有可注入的字串。
 * 連結也只允許 `https:`／`http:`／站內相對路徑擋掉 `javascript:`。
 *
 * 支援的語法（刻意保守，涵蓋知識庫實際用到的）：
 *   `#`～`####` 標題、`-`／`*` 無序清單、`1.` 有序清單、
 *   `>` 引用、``` 程式碼區塊、``` 表格、`---` 分隔線、
 *   行內 `**粗**`／`*斜*`／`` `等寬` ``／`[文字](連結)`。
 *
 * 超出範圍的語法會**原樣顯示成文字**而不是壞掉——
 * 寧可顯示得醜一點，也不要渲染出錯誤的結構。
 */

/**
 * 連結安全判定。
 *
 * 判斷依���是「**有無 scheme**」，而不是「看起來像不像路徑」——
 * 第一版只放行 `/`、`./`、`../` 開頭，結果把 `01-專案總覽.md` 這種
 * 知識庫裡最常見的相對連結也擋掉了。
 *
 * 規則：
 *   - 帶 scheme → 只允許 http / https（擋掉 `javascript:`、`data:`、`vbscript:`…）
 *   - 沒有 scheme → 視為站內相對路徑，放行；但要擋掉協定相對的 `//evil.com`
 */
function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//")) return false; // 協定相對，會跳到外部網域
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed);
  if (!scheme) return true; // 沒有 scheme → 站內相對路徑
  return scheme[1].toLowerCase() === "http" || scheme[1].toLowerCase() === "https";
}

/** 把一行文字（含行內格式）轉成 React node 陣列。 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // 一次掃描一個標記，避免巢狀 regex 互相干擾。
  const pattern = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\((?:[^()\s]|\([^)]*\))+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${index}`;
    index += 1;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code className="admin-md-code" key={key}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const split = token.indexOf("](");
      const label = token.slice(1, split);
      const href = token.slice(split + 2, -1);
      if (isSafeHref(href)) {
        const external = /^https?:/i.test(href);
        nodes.push(
          <a
            key={key}
            href={href}
            {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
          >
            {label}
          </a>
        );
      } else {
        // 不安全的連結退回純文字——不要讓它變成可點的攻擊面
        nodes.push(label);
      }
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const isTableDivider = (line: string) => /^\s*\|?[\s:-]*-[-\s:|]*\|?\s*$/.test(line) && line.includes("-");

/**
 * 把 markdown 轉成 React element。
 *
 * 回傳 `<div>` 而非 fragment 陣列，讓呼叫端可以直接當區塊內容放進卡片。
 */
export function renderMarkdown(source: string): React.ReactElement {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let key = 0;
  const nextKey = () => `md-${key++}`;

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    // 空白
    if (!line.trim()) {
      index += 1;
      continue;
    }

    // 程式碼區塊
    if (line.trimStart().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1; // 跳過收尾的 ```
      out.push(
        <pre className="admin-md-pre" key={nextKey()}>
          {language ? <span className="admin-md-pre-lang">{language}</span> : null}
          <code>{body.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // 分隔線
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr className="admin-md-hr" key={nextKey()} />);
      index += 1;
      continue;
    }

    // 標題
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length + 2, 6); // h1→h3，避免和頁面主標題打架
      const Tag = `h${level}` as "h3" | "h4" | "h5" | "h6";
      out.push(
        <Tag className={`admin-md-h admin-md-h${heading[1].length}`} key={nextKey()}>
          {renderInline(heading[2], nextKey())}
        </Tag>
      );
      index += 1;
      continue;
    }

    // 表格（目前列數 2–4 夠用了，超過就退回純文字段落）
    if (line.trim().startsWith("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const header = splitTableRow(line);
      const bodyRows: string[][] = [];
      let cursor = index + 2;
      while (cursor < lines.length && lines[cursor].trim().startsWith("|")) {
        bodyRows.push(splitTableRow(lines[cursor]));
        cursor += 1;
      }
      if (header.length >= 2 && header.length <= 4) {
        out.push(
          <div className="admin-md-table-wrap" key={nextKey()}>
            <table className="admin-md-table">
              <thead>
                <tr>
                  {header.map((cell, i) => (
                    <th key={`th-${i}`}>{renderInline(cell, `th${i}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, r) => (
                  <tr key={`tr-${r}`}>
                    {header.map((_, c) => (
                      <td key={`td-${r}-${c}`}>{row[c] ? renderInline(row[c], `td${r}${c}`) : "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        index = cursor;
        continue;
      }
    }

    // 引用
    if (line.trimStart().startsWith(">")) {
      const body: string[] = [];
      while (index < lines.length && lines[index].trimStart().startsWith(">")) {
        body.push(lines[index].trimStart().replace(/^>\s?/, ""));
        index += 1;
      }
      out.push(
        <blockquote className="admin-md-quote" key={nextKey()}>
          {body.map((item, i) => (
            <p key={`q-${i}`}>{renderInline(item, `q${i}`)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 清單（無序／有序）
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (bullet || ordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      while (index < lines.length) {
        const m = isOrdered ? /^\s*\d+\.\s+(.*)$/.exec(lines[index]) : /^\s*[-*+]\s+(.*)$/.exec(lines[index]);
        if (!m) break;
        items.push(m[1]);
        index += 1;
      }
      const ListTag = isOrdered ? "ol" : "ul";
      out.push(
        <ListTag className="admin-md-list" key={nextKey()}>
          {items.map((item, i) => (
            <li key={`li-${i}`}>{renderInline(item, `li${i}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    // 段落（連續非空行合併）
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s/.test(lines[index]) &&
      !lines[index].trimStart().startsWith("```") &&
      !lines[index].trimStart().startsWith(">") &&
      !/^\s*[-*+]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith("|")
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    out.push(<p key={nextKey()}>{renderInline(paragraph.join(" "), nextKey())}</p>);
  }

  return <div className="admin-md">{out}</div>;
}
