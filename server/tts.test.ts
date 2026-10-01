import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { probeEdgeTtsSupply, toEdgeRate } from "./tts";

describe("toEdgeRate：前端語速倍率 → edge-tts 速率字串", () => {
  it("1 倍速就是原速", () => {
    expect(toEdgeRate(1)).toBe("+0%");
  });

  it("慢速為負百分比，快速為正百分比", () => {
    expect(toEdgeRate(0.92)).toBe("-8%"); // 全站預設語速
    expect(toEdgeRate(1.4)).toBe("+40%");
    expect(toEdgeRate(0.6)).toBe("-40%");
  });

  it("四捨五入到整數百分比", () => {
    expect(toEdgeRate(0.975)).toBe("-3%");
  });

  it("超出範圍時夾限（與前端夾限一致）", () => {
    expect(toEdgeRate(3)).toBe("+100%");
    expect(toEdgeRate(0.1)).toBe("-50%");
  });

  it("非數值安全回退原速", () => {
    expect(toEdgeRate(Number.NaN)).toBe("+0%");
  });
});

describe("probeEdgeTtsSupply：朗讀供應鏈診斷（tts.health 端點）", () => {
  it("回傳候選清單結構與熔斷狀態（不斷言具體值——隨執行環境而異）", async () => {
    const status = await probeEdgeTtsSupply();
    expect(Array.isArray(status.candidates)).toBe(true);
    // pythonCandidates 的字面候選（python3、/usr/bin/python3）恆存在
    expect(status.candidates.length).toBeGreaterThan(0);
    for (const candidate of status.candidates) {
      expect(typeof candidate.python).toBe("string");
      expect(candidate.python.length).toBeGreaterThan(0);
      expect(typeof candidate.exists).toBe("boolean");
      expect(typeof candidate.edgeTts).toBe("boolean");
      expect(typeof candidate.pip).toBe("boolean");
      expect(typeof candidate.userSite).toBe("boolean");
    }
    expect(typeof status.breaker.failures).toBe("number");
    expect(status.breaker.failures).toBeGreaterThanOrEqual(0);
    expect(typeof status.breaker.brokenForMs).toBe("number");
    expect(typeof status.installAttempted).toBe("boolean");
    expect(typeof status.installRunning).toBe("boolean");
    if (status.installNote !== null) expect(typeof status.installNote).toBe("string");
  });

  /**
   * 回歸鎖（2026-10-01）：`tts.health` 曾是 `spawnSync` 四連發，
   * **同步阻塞 Node 事件迴圈**——線上實測單次 ~10 秒，期間整個伺服器
   * 被凍住（無關的 questionBank.list 由 ~0.1s 變成 9.66s）。而它是
   * `publicProcedure`，限流 300 次/分 → 少量併發即可 DoS。
   *
   * 這裡用靜態檢查把「不得再出現 spawnSync」鎖住：即使是未來的重構，
   * 只要有人改回同步版本，這個測試就會紅。
   */
  it("回歸鎖：tts.ts 不得使用 spawnSync（會阻塞整個事件迴圈）", () => {
    const source = readFileSync(new URL("./tts.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/spawnSync\s*\(/);
    // 明確要求只匯入 spawn（非同步版）
    expect(source).toMatch(/import \{ spawn \} from "node:child_process";/);
  });

  it("探測期間事件迴圈仍可運作（非阻塞契約）", async () => {
    const started = Date.now();
    let timerFiredAtMs = -1;
    const timer = new Promise<void>((resolve) => {
      setTimeout(() => {
        timerFiredAtMs = Date.now() - started;
        resolve();
      }, 0);
    });
    await Promise.all([probeEdgeTtsSupply(), timer]);
    // 若是同步阻塞版，這個 0ms 計時器只會在整串 python 探測跑完後才觸發
    expect(timerFiredAtMs).toBeGreaterThanOrEqual(0);
    expect(timerFiredAtMs).toBeLessThan(1_000);
  });

  it("候選探測有快取：連續兩次呼叫不會重複 spawn（第二次應明顯較快）", async () => {
    await probeEdgeTtsSupply(); // 先確保快取已填
    const t0 = Date.now();
    await probeEdgeTtsSupply();
    const cachedMs = Date.now() - t0;
    // 快取命中時幾乎為 0（僅組裝物件）；未命中才會是數百 ms
    expect(cachedMs).toBeLessThan(200);
  });
});
