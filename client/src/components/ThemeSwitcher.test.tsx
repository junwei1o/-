// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ThemeSwitcher from "./ThemeSwitcher";

describe("ThemeSwitcher 全站主題切換", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("渲染四組主題，預設潮境選中", () => {
    render(<ThemeSwitcher />);
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(4);
    expect(screen.getByText("潮境")).toBeTruthy();
    expect(screen.getByText("彩旗")).toBeTruthy();
    expect(screen.getByText("藏書票")).toBeTruthy();
    expect(screen.getByText("晴光")).toBeTruthy();
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
  });

  it("點擊彩旗後寫入 festival、設定 data-theme 並更新選中", () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText("彩旗"));
    expect(localStorage.getItem("xue-theme-v1")).toBe("festival");
    expect(document.documentElement.getAttribute("data-theme")).toBe("festival");
    const radios = screen.getAllByRole("radio");
    expect(radios[1].getAttribute("aria-checked")).toBe("true");
    expect(radios[0].getAttribute("aria-checked")).toBe("false");
  });

  it("點擊藏書票後寫入 exlibris", () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText("藏書票"));
    expect(localStorage.getItem("xue-theme-v1")).toBe("exlibris");
    expect(document.documentElement.getAttribute("data-theme")).toBe("exlibris");
  });
});
