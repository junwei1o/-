/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CardArt } from "./CardArt";

describe("CardArt", () => {
  afterEach(cleanup);

  it("渲染對應卡牌 id 的插畫，並帶 lazy/async 屬性", () => {
    render(<CardArt cardId="ch-01" emoji="🖋️" name="詩仙李白" />);
    const img = screen.getByAltText("詩仙李白") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/cards/card-ch-01.webp");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
  });

  it("載入失敗時回退 emoji，卡面不空白", () => {
    render(<CardArt cardId="ch-01" emoji="🖋️" name="詩仙李白" />);
    fireEvent.error(screen.getByAltText("詩仙李白"));
    expect(screen.queryByAltText("詩仙李白")).toBeNull();
    expect(screen.getByRole("img", { name: "詩仙李白" }).textContent).toBe("🖋️");
  });
});
