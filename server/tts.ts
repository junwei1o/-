import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * 朗讀合成（Edge TTS）。
 *
 * 為什麼是 Edge TTS：免費、免 API Key、音質接近真人，且有台灣腔聲音
 * （zh-TW-HsiaoChen / HsiaoYu / YunJhe），遠優於瀏覽器內建語音包。
 * 服務端以子程序呼叫 python `edge_tts` 模組，結果落磁碟快取——
 * 同一段文字第二次朗讀零網路、零等待。
 *
 * 失敗策略：任何一步失敗都回傳 null，由前端退回瀏覽器內建 Web Speech API，
 * 所以離線時朗讀功能不會壞，只是音質回到本機語音包。
 * 連續失敗會啟動熔斷（5 分鐘內直接回 null），避免離線時每次點擊都白等一次逾時。
 */

const MAX_TEXT_LENGTH = 600;
const SYNTH_TIMEOUT_MS = 12_000;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 5 * 60_000;

/** 對外可選聲音（白名單，避免任意字串注入 CLI 參數）。 */
export const EDGE_TTS_VOICES = {
  hsiaochen: "zh-TW-HsiaoChenNeural", // 台灣腔女聲（預設）
  hsiaoyu: "zh-TW-HsiaoYuNeural", // 台灣腔女聲
  yunjhe: "zh-TW-YunJheNeural", // 台灣腔男聲
  xiaoxiao: "zh-CN-XiaoxiaoNeural", // 普通話女聲（溫暖自然）
} as const;

export type EdgeTtsVoiceKey = keyof typeof EDGE_TTS_VOICES;

const CACHE_DIR = path.join(os.tmpdir(), "hdmx-tts-cache");

/**
 * python 直譯器候選：優先環境變數指定，其次本機 venv（裝了 edge-tts），
 * 最後試 PATH 與系統 python。逐個嘗試 `python -m edge_tts`，模組不存在就換下一個。
 */
function pythonCandidates(): string[] {
  return [
    process.env.EDGE_TTS_PYTHON,
    "/Users/g/.workbuddy/binaries/python/envs/default/bin/python3",
    "python3",
    "/usr/bin/python3",
  ].filter((candidate): candidate is string => Boolean(candidate));
}

/** 前端語速（倍率 0.6–1.4）→ edge-tts 速率（百分比字串，如 "-8%"）。 */
export function toEdgeRate(rate: number): string {
  const safe = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1;
  const percent = Math.round((safe - 1) * 100);
  return `${percent >= 0 ? "+" : ""}${percent}%`;
}

let consecutiveFailures = 0;
let brokenUntil = 0;

function runEdgeTts(python: string, voice: string, rate: string, text: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 注意：--rate 必須用「=」連接（值可能是 "-8%"，分開寫會被 argparse 當成未知選項）
    const child = spawn(python, ["-m", "edge_tts", "--voice", voice, `--rate=${rate}`, "--text", text, "--write-media", outPath], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderr.length < 2_000) stderr += chunk.toString();
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`edge-tts timeout after ${SYNTH_TIMEOUT_MS}ms`));
    }, SYNTH_TIMEOUT_MS);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && existsSync(outPath)) resolve();
      else reject(new Error(`edge-tts exited ${code}: ${stderr.slice(0, 300)}`));
    });
  });
}

async function synthesizeToCache(text: string, voice: string, rate: string, cachePath: string): Promise<void> {
  let lastError: unknown = null;
  for (const python of pythonCandidates()) {
    try {
      await runEdgeTts(python, voice, rate, text, cachePath);
      return;
    } catch (error) {
      lastError = error;
      rmSync(cachePath, { force: true }); // 清掉半截輸出
    }
  }
  throw lastError ?? new Error("no python candidate available");
}

export type SpeechSynthesisInput = {
  text: string;
  voice?: string;
  rate?: number;
};

/** 回傳 mp3 音訊；不可用（離線／未裝 edge-tts／熔斷中）回傳 null。 */
export async function synthesizeSpeech({ text, voice, rate }: SpeechSynthesisInput): Promise<Buffer | null> {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > MAX_TEXT_LENGTH) return null;
  if (Date.now() < brokenUntil) return null;

  const voiceKey = (voice ?? "hsiaochen") as EdgeTtsVoiceKey;
  const voiceId = EDGE_TTS_VOICES[voiceKey] ?? EDGE_TTS_VOICES.hsiaochen;
  const rateArg = toEdgeRate(rate ?? 1);

  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const hash = createHash("sha256").update(`${voiceId}|${rateArg}|${normalized}`).digest("hex").slice(0, 32);
    const cachePath = path.join(CACHE_DIR, `${hash}.mp3`);
    if (!existsSync(cachePath) || statSize(cachePath) === 0) {
      const pendingPath = `${cachePath}.${process.pid}.tmp`;
      await synthesizeToCache(normalized, voiceId, rateArg, pendingPath);
      // 先寫暫存檔再更名，避免併發請求讀到半截檔案
      rmSync(cachePath, { force: true });
      renameSync(pendingPath, cachePath);
    }
    const audio = readFileSync(cachePath);
    consecutiveFailures = 0;
    return audio;
  } catch {
    consecutiveFailures += 1;
    if (consecutiveFailures >= BREAKER_THRESHOLD) brokenUntil = Date.now() + BREAKER_COOLDOWN_MS;
    return null;
  }
}

function statSize(filePath: string): number {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}
