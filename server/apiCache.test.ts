import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { apiCacheControl } from "./_core/apiCache";

/** 以最小假物件驅動中介層，回傳它寫下的 Cache-Control 與 next 是否被呼叫。 */
function run(method: string, path: string): { cache: string | undefined; nextCalled: boolean } {
  const headers: Record<string, string> = {};
  const req = { method, path } as unknown as Request;
  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
  } as unknown as Response;
  let nextCalled = false;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  apiCacheControl(req, res, next);
  return { cache: headers["Cache-Control"], nextCalled };
}

describe("apiCacheControl：tRPC 快取標頭白名單", () => {
  it("靜態題庫查詢（GET）→ public 60 秒，可進共享快取", () => {
    expect(run("GET", "/questionBank.list")).toEqual({
      cache: "public, max-age=60",
      nextCalled: true,
    });
    expect(run("GET", "/targetedPractice.list").cache).toBe("public, max-age=60");
  });

  it("純白名單批次 GET（逗號相接）→ 仍可 public", () => {
    expect(run("GET", "/questionBank.list,targetedPractice.list").cache).toBe(
      "public, max-age=60"
    );
  });

  it("混入 session 端點的批次 GET → 整批 no-store（防個資被共享快取錯發）", () => {
    expect(run("GET", "/questionBank.list,auth.me").cache).toBe("no-store");
  });

  it("個人端點一律 no-store", () => {
    expect(run("GET", "/auth.me").cache).toBe("no-store");
    expect(run("GET", "/teacher.myClasses").cache).toBe("no-store");
    expect(run("GET", "/teacher.listAnnouncements").cache).toBe("no-store");
    expect(run("GET", "/cloud.load").cache).toBe("no-store");
  });

  it("mutation 一律 no-store（即使是白名單同名 path）", () => {
    expect(run("POST", "/questionBank.list").cache).toBe("no-store");
    expect(run("POST", "/teacher.login").cache).toBe("no-store");
  });

  it("每個請求都會呼叫 next（不阻斷 tRPC 鏈）", () => {
    expect(run("GET", "/auth.me").nextCalled).toBe(true);
    expect(run("POST", "/teacher.login").nextCalled).toBe(true);
  });
});
