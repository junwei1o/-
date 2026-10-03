import { spawn } from "node:child_process";

/**
 * 朗讀合成（Edge TTS）— 獨立服務客戶端（v2，2026-10-04）。
 *
 * edge-tts 已拆成獨立 Python 服務（見 tts-service/），主應用不再需要
 * Python 環境，合成改以 HTTP 呼叫 `TTS_SERVICE_URL`（Render 上為 xue-tts）。
 * 合成結果的磁碟快取由獨立服務負責，主應用不落盤、不 spawn python。
 *
 * 失敗策略：服務未設定、逾時、非 2xx、連續失敗（熔斷 5 分鐘）一律回傳 null，
 * 由前端退回瀏覽器內建 Web Speech API——朗讀按鈕永遠有聲音，只是音質不同。
 * 連續失敗會啟動熔斷，避免服務掛掉時每次點擊都白等一次逾時。
 *
 * 保留的維運面（自 v1 遷移，admin 後台依賴）：
 * - resetSpeechBreaker：站長手動重設熔斷器。
 * - probeEdgeTtsSupply／tts.health：供應鏈診斷（python 候選探測 +
 *   熔斷狀態）。v2 合成不再使用 python，但端點仍提供伺服器環境可視性。
 */

const MAX_TEXT_LENGTH = 600;
const REQUEST_TIMEOUT_MS = 12_000;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 5 * 60_000;

/** 對外可選聲音（白名單，與獨立服務一致）。 */
export const EDGE_TTS_VOICES = {
  hsiaochen: "zh-TW-HsiaoChenNeural", // 台灣腔女聲（預設）
  hsiaoyu: "zh-TW-HsiaoYuNeural", // 台灣腔女聲
  yunjhe: "zh-TW-YunJheNeural", // 台灣腔男聲
  xiaoxiao: "zh-CN-XiaoxiaoNeural", // 普通話女聲（溫暖自然）
} as const;

export type EdgeTtsVoiceKey = keyof typeof EDGE_TTS_VOICES;

/** 前端語速（倍率 0.5–2.0）→ edge-tts 速率（百分比字串，如 "-8%"）。 */
export function toEdgeRate(rate: number): string {
  const safe = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1;
  const percent = Math.round((safe - 1) * 100);
  return `${percent >= 0 ? "+" : ""}${percent}%`;
}

let consecutiveFailures = 0;
let brokenUntil = 0;

/**
 * 重設朗讀熔斷器（站長後台維運操作）。
 *
 * 用途：遠端朗讀連續失敗達門檻後會熔斷 5 分鐘；若站長剛修好供應鏈
 * （例如獨立服務恢復了），不必等冷卻結束——可直接手動重設立即恢復。
 * 只動計數與冷卻時間，**不改變任何合成行為**。
 */
export function resetSpeechBreaker(): { failures: number; brokenForMs: number } {
  consecutiveFailures = 0;
  brokenUntil = 0;
  return { failures: consecutiveFailures, brokenForMs: 0 };
}

export type SpeechSynthesisInput = {
  text: string;
  voice?: string;
  rate?: number;
};

/** 回傳 mp3 音訊；不可用（未設定服務／逾時／熔斷中）回傳 null。 */
export async function synthesizeSpeech({ text, voice, rate }: SpeechSynthesisInput): Promise<Buffer | null> {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > MAX_TEXT_LENGTH) return null;
  const serviceUrl = process.env.TTS_SERVICE_URL?.trim();
  if (!serviceUrl) return null;
  if (Date.now() < brokenUntil) return null;

  const voiceKey = (voice ?? "hsiaochen") as EdgeTtsVoiceKey;
  if (!(voiceKey in EDGE_TTS_VOICES)) return null;

  try {
    const url = new URL(`${serviceUrl.replace(/\/+$/, "")}/synthesize`);
    url.searchParams.set("text", normalized);
    url.searchParams.set("voice", voiceKey);
    url.searchParams.set("rate", String(rate ?? 1));
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`tts service responded ${response.status}`);
    const audio = Buffer.from(await response.arrayBuffer());
    if (audio.length === 0) throw new Error("tts service returned empty body");
    consecutiveFailures = 0;
    return audio;
  } catch (error) {
    consecutiveFailures += 1;
    // 只在「首次失敗」與「觸發熔斷」各記一條：Render 日誌可診斷且不被刷屏。
    if (consecutiveFailures === 1 || consecutiveFailures >= BREAKER_THRESHOLD) {
      console.warn(
        "[tts] Edge 合成失敗（退回瀏覽器語音）:",
        error instanceof Error ? error.message : String(error),
      );
    }
    if (consecutiveFailures >= BREAKER_THRESHOLD) brokenUntil = Date.now() + BREAKER_COOLDOWN_MS;
    return null;
  }
}

/**
 * python 直譯器候選（僅供 tts.health 診斷探測用；v2 合成不再 spawn python）。
 * 註（2026-09-30 音效巡檢）：移除開發機個人 venv 絕對路徑——本機路徑
 * 隨提交帶上生產只會走到 fallback 分支，且屬個人資訊外洩（M12）。
 */
function pythonCandidates(): string[] {
  return [
    process.env.EDGE_TTS_PYTHON,
    "python3",
    "/usr/bin/python3",
  ].filter((candidate): candidate is string => Boolean(candidate));
}

export type TtsCandidateProbe = {
  python: string;
  exists: boolean;
  edgeTts: boolean;
  pip: boolean;
  /** 使用者 site-packages 是否在 import 路徑上（--user 安裝後能被載入的前提）。 */
  userSite: boolean;
};
export type TtsSupplyStatus = {
  candidates: TtsCandidateProbe[];
  breaker: { failures: number; brokenForMs: number };
  /** 是否已嘗試過背景安裝（v2 無自癒安裝，恆 false——合成走獨立服務）。 */
  installAttempted: boolean;
  /** 背景安裝是否仍在進行（恆 false）。 */
  installRunning: boolean;
  /** 安裝結果摘要（恆 null——安裝職責在獨立服務）。 */
  installNote: string | null;
};

/**
 * 非阻塞探測單一指令是否成功。
 *
 * ⚠️ **絕對不要改回 `spawnSync`**（2026-10-01 修復）：原本四道探測都用
 * `spawnSync`，它會**同步阻塞 Node 單一事件迴圈**。線上實測單次
 * `tts.health` 耗時 ~10 秒，且**阻塞期間整個伺服器都被凍住**——
 * 同時打 `questionBank.list`（正常 ~0.1–0.3 s，且走記憶體快取）
 * 變成 9.66 秒。而 `tts.health` 是 `publicProcedure`，限流 300 次/分，
 * 因此「少量併發呼叫」即可讓全站癱瘓（DoS）。
 */
function runProbe(python: string, args: string[], timeoutMs: number): Promise<{ ok: boolean; stdout: string }> {
  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    let timer: NodeJS.Timeout | null = null;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({ ok, stdout });
    };
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(python, args, { stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      settled = true;
      resolve({ ok: false, stdout: "" });
      return;
    }
    timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* 已結束 */
      }
      done(false);
    }, timeoutMs);
    child.stdout?.on("data", (chunk: unknown) => {
      stdout += String(chunk);
    });
    child.on("error", () => done(false));
    child.on("close", (code) => done(code === 0));
  });
}

/** 探測單一 python 候選（前三道可並行，全部非阻塞）。 */
async function probeCandidate(python: string): Promise<TtsCandidateProbe> {
  const existsProbe = await runProbe(python, ["-c", "print(1)"], 4_000);
  if (!existsProbe.ok) return { python, exists: false, edgeTts: false, pip: false, userSite: false };
  const [moduleProbe, pipProbe, userSiteProbe] = await Promise.all([
    runProbe(python, ["-c", "import edge_tts"], 4_000),
    runProbe(python, ["-m", "pip", "--version"], 4_000),
    runProbe(python, ["-c", "import site;print(int(bool(site.ENABLE_USER_SITE)))"], 4_000),
  ]);
  return {
    python,
    exists: true,
    edgeTts: moduleProbe.ok,
    pip: pipProbe.ok,
    userSite: userSiteProbe.ok && userSiteProbe.stdout.trim() === "1",
  };
}

/** 候選探測結果快取：python 探測每次要數秒，短時間內反覆打不該重跑。 */
const SUPPLY_CACHE_MS = 30_000;
let supplyCandidatesCache: { at: number; value: TtsCandidateProbe[] } | null = null;
let supplyCandidatesInflight: Promise<TtsCandidateProbe[]> | null = null;

/** 只在「候選」層級快取（昂貴的部分）；breaker 狀態每次即時計算。 */
function probeCandidatesCached(): Promise<TtsCandidateProbe[]> {
  if (supplyCandidatesCache && Date.now() - supplyCandidatesCache.at < SUPPLY_CACHE_MS) {
    return Promise.resolve(supplyCandidatesCache.value);
  }
  if (supplyCandidatesInflight) return supplyCandidatesInflight;
  supplyCandidatesInflight = (async () => {
    const value = await Promise.all(pythonCandidates().map(probeCandidate));
    supplyCandidatesCache = { at: Date.now(), value };
    return value;
  })();
  return supplyCandidatesInflight.finally(() => {
    supplyCandidatesInflight = null;
  });
}

/**
 * 朗讀供應鏈診斷（供 tts.health 端點）：逐一檢查 python 候選是否存在、
 * pip 是否可用、能否載入 edge_tts 模組，並回報熔斷狀態。
 * 純本地探測——不碰網路、不回傳任何機密。
 *
 * v2 註：合成已走獨立服務（HTTP），此端點保留作為伺服器環境可視性；
 * 若需判斷「為何 synthesize 回 audio:null」，請看 breaker 狀態與
 * 獨立服務的 /health。
 */
export async function probeEdgeTtsSupply(): Promise<TtsSupplyStatus> {
  const candidates = await probeCandidatesCached();
  return {
    candidates,
    breaker: { failures: consecutiveFailures, brokenForMs: Math.max(0, brokenUntil - Date.now()) },
    installAttempted: false,
    installRunning: false,
    installNote: null,
  };
}
