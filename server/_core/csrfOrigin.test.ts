import { describe, expect, it, vi } from "vitest";
import { buildAllowedOrigins, createCsrfOriginGuard } from "./csrfOrigin";

type Handler = ReturnType<typeof createCsrfOriginGuard>;
const HOST = "xue-gr3a.onrender.com";

function run(guard: Handler, opts: { method: string; origin?: string }) {
  const json = vi.fn();
  // express 的 res.status() 會回傳 res 本身（可串接 .json()），mock 必須照做，
  // 否則 guard 內 res.status(403).json(...) 會讀到 undefined。
  const res: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } = {
    status: vi.fn(),
    json,
  };
  res.status.mockReturnValue(res);
  const req = {
    method: opts.method,
    headers: { host: HOST, ...(opts.origin === undefined ? {} : { origin: opts.origin }) },
  };
  const next = vi.fn();
  guard(req as never, res as never, next);
  return { status: res.status, json, next };
}

describe("buildAllowedOrigins", () => {
  it("always includes the production origin", () => {
    expect(buildAllowedOrigins(undefined).has("https://xue-gr3a.onrender.com")).toBe(true);
  });

  it("derives an https origin from the request host so custom domains work", () => {
    const set = buildAllowedOrigins("my-school.example.com");
    expect(set.has("https://my-school.example.com")).toBe(true);
  });

  it("includes local dev origins", () => {
    const set = buildAllowedOrigins("localhost:3000");
    expect(set.has("http://localhost:5173")).toBe(true);
  });
});

describe("csrfOriginGuard", () => {
  const guard = createCsrfOriginGuard();
  const HOST = "xue-gr3a.onrender.com";

  it("lets same-origin mutations through", () => {
    const { next, status } = run(guard, {
      method: "POST",
      origin: "https://xue-gr3a.onrender.com",
    });
    expect(next).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it("blocks cross-site mutations with 403", () => {
    const { next, status, json } = run(guard, {
      method: "POST",
      origin: "https://evil.example.com",
    });
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(JSON.stringify(json.mock.calls)).toContain("CSRF_ORIGIN_REJECTED");
  });

  it("never blocks reads regardless of origin", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const { next, status } = run(guard, { method, origin: "https://evil.example.com" });
      expect(next, `${method} 不應被擋`).toHaveBeenCalled();
      expect(status).not.toHaveBeenCalled();
    }
  });

  it("allows server-to-server calls that carry no Origin", () => {
    // LINE webhook 等伺服器對伺服器呼叫沒有 Origin，放行；
    // 攻擊者無法用瀏覽器偽裝成「沒有 Origin」。
    const { next, status } = run(guard, { method: "POST" });
    expect(next).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it("blocks a look-alike origin that merely contains the real host", () => {
    const { next } = run(guard, {
      method: "POST",
      origin: "https://xue-gr3a.onrender.com.evil.example.com",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks an http origin on the same host (no downgrade)", () => {
    const { next } = run(guard, { method: "POST", origin: "http://xue-gr3a.onrender.com" });
    expect(next).not.toHaveBeenCalled();
  });
});
