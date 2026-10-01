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
  // 註（2026-09-30 音效巡檢）：移除開發機個人 venv 絕對路徑——本機路徑
  // 隨提交帶上生產只會走到 fallback 分支，且屬個人資訊外洩（M12）。
  // 本機開發請用 EDGE_TTS_PYTHON 指向自己的 venv。
  return [
    process.env.EDGE_TTS_PYTHON,
    "python3",
    "/usr/bin/python3",
  ].filter((candidate): candidate is string => Boolean(candidate));
}

/** 要安裝的 edge-tts 版本範圍（避免未釘版本的供應鏈風險，同時保留補丁升級）。 */
const EDGE_TTS_SPEC = "edge-tts>=6.1.9,<8";

/** 每個行程式最多嘗試一次背景安裝。 */
let installStarted = false;
let installing = false;
/** 安裝結果/進度摘要——Render 日誌外部不可見，經 tts.health 遠端診斷用。 */
let installNote: string | null = null;

function runInstall(python: string, args: string[], onDone: (ok: boolean, note: string) => void): void {
  try {
    const child = spawn(python, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderr.length < 500) stderr += chunk.toString();
    });
    child.on("error", (error) => onDone(false, String(error)));
    child.on("close", (code) => {
      onDone(code === 0, code === 0 ? "" : stderr.slice(0, 300) || `exit ${code}`);
    });
  } catch (error) {
    onDone(false, String(error));
  }
}

function runInstallAsync(python: string, args: string[]): Promise<{ ok: boolean; note: string }> {
  return new Promise((resolve) => runInstall(python, args, (ok, note) => resolve({ ok, note })));
}

/**
 * 分類 pip 安裝失敗的原因，決定後續恢復分支（2026-09-30 覆核修正）：
 * - blocked：PEP 668 externally-managed-environment（新版 Debian/Ubuntu
 *   系統 Python 保護，連 --user 也擋）→ 加 --break-system-packages 重試
 * - missing：pip 本體不存在 → ensurepip／get-pip 引導
 * - oldPip：pip 不認識 --break-system-packages（<23.0.1）→ 不帶旗標重試
 * - other：其餘錯誤（網路、磁碟…），直接回報
 * 舊鏈把「任何失敗」都當 pip 缺失去跳 ensurepip——在 Render 上屬誤判
 *（實測 pip:true、失敗原因正是 blocked，ensurepip 因而白白 exit 1）。
 */
function classifyPipFailure(stderr: string): "blocked" | "missing" | "oldPip" | "other" {
  const s = stderr.toLowerCase();
  if (s.includes("externally-managed-environment") || s.includes("externally managed")) return "blocked";
  if (s.includes("no module named pip") || s.includes("pip: not found")) return "missing";
  if (s.includes("no such option") && s.includes("break-system-packages")) return "oldPip";
  return "other";
}

const GET_PIP_URL = "https://bootstrap.pypa.io/get-pip.py";
const GET_PIP_PATH = path.join(os.tmpdir(), "get-pip.py");

/**
 * 運行期自癒安裝（2026-09-30 Edge 全接入）。
 *
 * 實測供應鏈：Render 映像有 python3、有 pip、但無 edge_tts 模組，
 * 且屬 PEP 668 externally-managed 環境（pip install 連 --user 都被擋）。
 * 安裝鏈（依 classifyPipFailure 路由，只對「真正缺 pip」走引導）：
 *   1. pip install --user --break-system-packages  —— 可拋棄執行個體上
 *      破壞系統 Python 正是正確做法（保留 --user 避開 /usr/lib）
 *   2. pip install --user（不帶旗標）—— 舊 pip 不認識旗標時
 *   3. ensurepip 補 pip 後重試 —— 僅在分類為 missing 時
 *   4. get-pip.py 引導安裝 —— ensurepip 也不可用時（官方 PyPA HTTPS）
 * 本次請求照常退位瀏覽器語音；裝好後下次合成即成功。
 * 結果寫入 installNote 供 tts.health 遠端讀取（Render 日誌外部不可見）。
 */
function maybeInstallEdgeTts(): void {
  if (installStarted) return;
  installStarted = true;
  const python = pythonCandidates()[0];
  if (!python) {
    installNote = "no python candidate";
    return;
  }
  installing = true;
  const fail = (note: string) => {
    installing = false;
    installNote = `fail: ${note}`.slice(0, 400);
    console.warn(`[tts] edge-tts 安裝失敗（朗讀退回瀏覽器語音）: ${installNote}`);
  };
  const succeed = (via: string) => {
    installing = false;
    installNote = `ok via ${via}`;
    console.log(`[tts] edge-tts 運行期安裝成功（${via}），遠端朗讀將於下次合成啟用`);
  };

  void (async () => {
    const USER_FLAGS = ["--user", "--no-warn-script-location"];
    // 步驟 1：現代 pip 標準路徑（PEP 668 環境以 break 旗標覆蓋保護）
    let r = await runInstallAsync(python, [
      "-m", "pip", "install", ...USER_FLAGS, "--break-system-packages", EDGE_TTS_SPEC,
    ]);
    if (r.ok) return succeed("pip --break-system-packages");

    let kind = classifyPipFailure(r.note);

    // 步驟 2：舊 pip 不認識旗標 → 不帶旗標重試
    if (kind === "oldPip") {
      r = await runInstallAsync(python, ["-m", "pip", "install", ...USER_FLAGS, EDGE_TTS_SPEC]);
      if (r.ok) return succeed("pip --user（舊 pip 無 break 旗標）");
      kind = classifyPipFailure(r.note);
    }

    // 步驟 3/4：只有「pip 真的缺失」才走引導——絕不盲目對被阻擋的安裝重試 ensurepip
    if (kind === "missing") {
      const ensure = await runInstallAsync(python, ["-m", "ensurepip", "--user"]);
      if (ensure.ok) {
        r = await runInstallAsync(python, [
          "-m", "pip", "install", ...USER_FLAGS, "--break-system-packages", EDGE_TTS_SPEC,
        ]);
        if (r.ok) return succeed("ensurepip + pip --break-system-packages");
        if (classifyPipFailure(r.note) === "oldPip") {
          r = await runInstallAsync(python, ["-m", "pip", "install", ...USER_FLAGS, EDGE_TTS_SPEC]);
          if (r.ok) return succeed("ensurepip + pip --user");
        }
      }
      // ensurepip 不可用 → 官方 get-pip.py 引導（PyPA HTTPS，可拋棄執行個體）
      const dl = await runInstallAsync(python, [
        "-c",
        "import sys,urllib.request;urllib.request.urlretrieve('https://bootstrap.pypa.io/get-pip.py', sys.argv[1])",
        GET_PIP_PATH,
      ]);
      if (dl.ok) {
        const bootstrap = await runInstallAsync(python, [GET_PIP_PATH, ...USER_FLAGS]);
        if (bootstrap.ok) {
          r = await runInstallAsync(python, [
            "-m", "pip", "install", ...USER_FLAGS, "--break-system-packages", EDGE_TTS_SPEC,
          ]);
          if (r.ok) return succeed("get-pip + pip --break-system-packages");
          r = await runInstallAsync(python, ["-m", "pip", "install", ...USER_FLAGS, EDGE_TTS_SPEC]);
          if (r.ok) return succeed("get-pip + pip --user");
          return fail(`get-pip 後仍失敗: ${r.note.slice(0, 200)}`);
        }
        return fail(`get-pip 引導失敗: ${bootstrap.note.slice(0, 150)}`);
      }
      return fail(`ensurepip 與 get-pip 皆失敗: ensurepip=${ensure.note.slice(0, 80)} | get-pip=${dl.note.slice(0, 120)}`);
    }

    fail(r.note.slice(0, 300));
  })();
}

/** 前端語速（倍率 0.6–1.4）→ edge-tts 速率（百分比字串，如 "-8%"）。 */
export function toEdgeRate(rate: number): string {
  const safe = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1;
  const percent = Math.round((safe - 1) * 100);
  return `${percent >= 0 ? "+" : ""}${percent}%`;
}

let consecutiveFailures = 0;
let brokenUntil = 0;

/**
 * 重設朗讀熔斷器（2026-10-01，站長後台維運操作）。
 *
 * 用途：遠端朗讀連續失敗達門檻後會熔斷 5 分鐘；若站長剛修好供應鏈
 * （例如 edge-tts 裝好了），不必等冷卻結束——可直接手動重設立即恢復。
 * 只動計數與冷卻時間，**不改變任何合成行為**。
 */
export function resetSpeechBreaker(): { failures: number; brokenForMs: number } {
  consecutiveFailures = 0;
  brokenUntil = 0;
  return { failures: consecutiveFailures, brokenForMs: 0 };
}

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
  } catch (error) {
    // 背景自癒：本行程式首次失敗時安裝 edge-tts（裝好後下次合成即成功）
    maybeInstallEdgeTts();
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

function statSize(filePath: string): number {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
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
  /** 本行程式是否已嘗試過背景安裝（每進程一次）。 */
  installAttempted: boolean;
  /** 背景安裝是否仍在進行。 */
  installRunning: boolean;
  /** 安裝結果摘要（ok via …／fail: …），Render 日誌外部不可見的替代診斷通道。 */
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

/** 只在「候選」層級快取（昂貴的部分）；breaker／install 狀態每次即時計算。 */
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
 * 遠端朗讀供應鏈診斷（供 tts.health 端點，2026-09-30 全接入輪新增）：
 * 逐一檢查 python 候選是否存在、pip 是否可用、能否載入 edge_tts 模組。
 * 純本地探測——不碰網路、不回傳任何機密；部署後 curl 一次即可
 * 定位「為何 synthesize 回 audio:null」（缺 python／缺 pip／缺模組／熔斷中）。
 *
 * 2026-10-01：改為 async（原 spawnSync 會阻塞整個事件迴圈，見 runProbe 註解），
 * 並對「候選探測」加 30 秒快取與併發去重——反覆呼叫不再重複 spawn python。
 */
export async function probeEdgeTtsSupply(): Promise<TtsSupplyStatus> {
  const candidates = await probeCandidatesCached();
  return {
    candidates,
    breaker: { failures: consecutiveFailures, brokenForMs: Math.max(0, brokenUntil - Date.now()) },
    installAttempted: installStarted,
    installRunning: installing,
    installNote,
  };
}
