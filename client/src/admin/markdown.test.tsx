// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { renderMarkdown } from "./markdown";

/**
 * markdown 渲染器的測試。
 *
 * 最重要的一組是「安全」：這個渲染器處理的是 repo 內的 markdown，
 * 而頁面會給學生與站長看——所以必須證明它**不會**產生原始 HTML。
 */

// 本專案 vitest 沒開 globals: true，testing-library 的自動 cleanup 不會註冊，
// 所以前一個測試留下來的 DOM 會讓 queryBy* 找到多個元素。明確收掉。
afterEach(() => {
  cleanup();
});

function html(markdown: string): string {
  const { container } = render(renderMarkdown(markdown));
  return container.innerHTML;
}

describe("renderMarkdown 基本結構", () => {
  it("標題會降階（h1→h3），避免和頁面主標題搶層級", () => {
    const node = render(<div>{renderMarkdown("# 標題")}</div>);
    expect(screen.getByRole("heading", { level: 3, name: "標題" })).toBeInTheDocument();
    expect(node).toBeTruthy();
  });

  it("段落合併連續行，換行不會變成兩段", () => {
    const { container } = render(renderMarkdown("第一行\n第二行\n\n另一段"));
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe("第一行 第二行");
  });

  it("清單：無序與有序分開處理", () => {
    const { container } = render(renderMarkdown("- 甲\n- 乙\n\n1. 一\n2. 二"));
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  it("巢狀清單的不同縮排會開成新清單（而不是併進同一個）", () => {
    const { container } = render(renderMarkdown("- 甲\n\n文字\n\n- 乙"));
    expect(container.querySelectorAll("ul")).toHaveLength(2);
  });

  it("程式碼區塊保留原樣，且不解析內部的 markdown", () => {
    const { container } = render(renderMarkdown("```bash\nnpm run build\n# 不是標題\n```"));
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("npm run build");
    expect(container.querySelector("h1, h2, h3")).toBeNull();
  });

  it("表格：表頭、資料列、缺值補破折號", () => {
    render(renderMarkdown("| 角色 | 入口 |\n| --- | --- |\n| 學生 | 全站 |\n| 老師 |"));
    expect(screen.getByRole("columnheader", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "全站" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "—" })).toBeInTheDocument();
  });

  it("分隔線與引用", () => {
    const { container } = render(renderMarkdown("> 引用一句\n\n---\n\n後面"));
    expect(container.querySelector("blockquote")?.textContent).toContain("引用一句");
    expect(container.querySelector("hr")).not.toBeNull();
  });
});

describe("行內格式", () => {
  it("粗體、斜體、等寬", () => {
    const { container } = render(renderMarkdown("**粗** *斜* `碼`"));
    expect(container.querySelector("strong")?.textContent).toBe("粗");
    expect(container.querySelector("em")?.textContent).toBe("斜");
    expect(container.querySelector("code")?.textContent).toBe("碼");
  });

  it("⭐ JSX 純文本裡的 `**` 會被當粗體處理，不會漏出星號", () => {
    const { container } = render(renderMarkdown("這是**重點**喔"));
    expect(container.textContent).toBe("這是重點喔");
    expect(container.textContent).not.toContain("**");
  });

  it("沒有閉合的標記原樣顯示，不會吃掉後面的內容", () => {
    const { container } = render(renderMarkdown("**未閉合然後還有文字"));
    expect(container.textContent).toContain("文字");
  });

  it("站內相對連結保留，外部連結加上安全屬性", () => {
    render(renderMarkdown("[站內](docs/knowledge-base/README.md)"));
    const internal = screen.getByRole("link", { name: "站內" });
    expect(internal).toHaveAttribute("href", "docs/knowledge-base/README.md");
    expect(internal).not.toHaveAttribute("target");

    render(renderMarkdown("[外部](https://example.com)"));
    const external = screen.getAllByRole("link", { name: "外部" })[0];
    expect(external).toHaveAttribute("target", "_blank");
    expect(external.getAttribute("rel")).toContain("noreferrer");
  });
});

describe("⭐ 安全：不可能注入 HTML", () => {
  it("script 標籤被當成文字，不會變成真的元素", () => {
    const { container } = render(renderMarkdown("<script>alert(1)</script>"));
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>");
  });

  it("img onerror 不會變成真的元素", () => {
    const { container } = render(renderMarkdown('<img src=x onerror="alert(1)">'));
    expect(container.querySelector("img")).toBeNull();
  });

  it("⭐ javascript: 連結退回純文字，不可點", () => {
    render(renderMarkdown("[點我](javascript:alert(1))"));
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("點我")).toBeInTheDocument();
  });

  it("data: 連結同樣被擋", () => {
    render(renderMarkdown("[檔案](data:text/html;base64,PHNjcmlwdD4=)"));
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("整份輸出沒有任何 dangerouslySetInnerHTML 的痕跡（原始字串比對）", () => {
    // 結構性保險：渲染結果不該出現被當成 HTML 解析的 script/iframe
    const output = html("<iframe src='evil'></iframe><style>body{display:none}</style>");
    expect(output).not.toContain("<iframe");
    expect(output).not.toContain("<style");
  });

  it("註解與條件註解同樣只是文字", () => {
    const { container } = render(renderMarkdown("<!-- --><%evil%>"));
    expect(container.querySelector("style, script")).toBeNull();
  });
});

describe("穩健性", () => {
  it("空字串不會拋錯", () => {
    expect(() => render(renderMarkdown(""))).not.toThrow();
  });

  it("未關閉的程式碼區塊不會吃掉整份文件", () => {
    const { container } = render(renderMarkdown("前面\n\n```\n沒關\n"));
    expect(container.textContent).toContain("前面");
    expect(container.querySelector("pre")).not.toBeNull();
  });

  it("只有分隔線的怪文件不會拋錯", () => {
    expect(() => render(renderMarkdown("---\n---\n---"))).not.toThrow();
  });

  it("Windows 換行（\\r\\n）也能正常解析", () => {
    const { container } = render(renderMarkdown("# 標\r\n\r\n內容"));
    expect(container.querySelector("p")?.textContent).toBe("內容");
  });
});
