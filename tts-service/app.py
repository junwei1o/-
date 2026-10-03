#!/usr/bin/env python3
"""獨立 Edge TTS 服務：朗讀合成 + 磁碟快取。

為何獨立：edge-tts 是 Python 庫。主應用（Node/Express）原本得在 Node 容器裡
spawn Python 子程序，部署環境難維護；拆成本服務後，主應用不再需要 Python，
改以 HTTP 呼叫本服務，前端行為完全不變（失敗時自動退回瀏覽器內建語音）。

端點：
  GET /health                      → {"ok": true}
  GET /synthesize?text=...&voice=hsiaochen&rate=0.92 → audio/mpeg（mp3）

參數：
  text  必填，1–600 字元
  voice 白名單（與主應用 tts router 一致）：
        hsiaochen（預設，台灣腔女聲）/ hsiaoyu（台灣腔女聲）
        yunjhe（台灣腔男聲）/ xiaoxiao（普通話女聲）
  rate  0.5–2.0 語速倍率（預設 1.0）

快取：以 sha256(voice|rate|text) 為鍵落磁碟（TTS_CACHE_DIR，預設 /tmp/tts-cache），
      同一段文字第二次合成零網路、零等待。

部署：Render Python runtime。startCommand 為 `python tts-service/app.py`，
      Render 會注入 PORT 環境變數；healthCheckPath 指向 /health。
"""

import asyncio
import hashlib
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import edge_tts

MAX_TEXT_LENGTH = 600
VOICES = {
    "hsiaochen": "zh-TW-HsiaoChenNeural",  # 台灣腔女聲（預設）
    "hsiaoyu": "zh-TW-HsiaoYuNeural",  # 台灣腔女聲
    "yunjhe": "zh-TW-YunJheNeural",  # 台灣腔男聲
    "xiaoxiao": "zh-CN-XiaoxiaoNeural",  # 普通話女聲（溫暖自然）
}
CACHE_DIR = Path(os.environ.get("TTS_CACHE_DIR", "/tmp/tts-cache"))
PORT = int(os.environ.get("PORT", "8300"))
SYNTH_TIMEOUT_SECONDS = 20


def to_edge_rate(rate: float) -> str:
    """語速倍率（0.5–2.0）→ edge-tts 速率字串（如 "-8%"）；夾限後四捨五入。"""
    rate = min(2.0, max(0.5, rate))
    percent = round((rate - 1) * 100)
    return f"{'+' if percent >= 0 else ''}{percent}%"


async def synthesize(text: str, voice_key: str, rate: float) -> bytes:
    """合成 mp3；命中快取則直接回檔，否則呼叫 edge-tts 並原子落盤。"""
    voice = VOICES[voice_key]
    rate_arg = to_edge_rate(rate)
    cache_key = f"{voice}|{rate_arg}|{text}"
    cache_path = CACHE_DIR / f"{hashlib.sha256(cache_key.encode('utf-8')).hexdigest()[:32]}.mp3"
    if cache_path.exists() and cache_path.stat().st_size > 0:
        return cache_path.read_bytes()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = cache_path.with_name(f"{cache_path.name}.{os.getpid()}.tmp")
    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate_arg)
        await asyncio.wait_for(communicate.save(str(tmp_path)), timeout=SYNTH_TIMEOUT_SECONDS)
        if not tmp_path.exists() or tmp_path.stat().st_size == 0:
            raise RuntimeError("edge-tts 產出空檔")
        os.replace(tmp_path, cache_path)  # 原子更名，併發請求不會讀到半截檔
        return cache_path.read_bytes()
    finally:
        tmp_path.unlink(missing_ok=True)


class Handler(BaseHTTPRequestHandler):
    server_version = "XueTTS/1.0"

    def log_message(self, fmt, *args):  # 靜音預設 request log
        pass

    def _send(self, code: int, body: bytes, content_type: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        url = urlparse(self.path)
        if url.path == "/health":
            self._send(200, b'{"ok": true}', "application/json")
            return
        if url.path != "/synthesize":
            self._send(404, b'{"error":"not found"}', "application/json")
            return

        params = parse_qs(url.query)
        text = (params.get("text", [""])[0] or "").strip()
        voice_key = params.get("voice", ["hsiaochen"])[0]
        try:
            rate = float(params.get("rate", ["1"])[0])
        except ValueError:
            rate = 1.0

        if not text or len(text) > MAX_TEXT_LENGTH:
            self._send(400, '{"error":"text 必須為 1-600 字元"}'.encode("utf-8"), "application/json")
            return
        if voice_key not in VOICES:
            self._send(400, '{"error":"voice 不在白名單"}'.encode("utf-8"), "application/json")
            return

        try:
            audio = asyncio.run(synthesize(text, voice_key, rate))
        except Exception as exc:  # noqa: BLE001 - 邊緣錯誤統一回 500，主應用會熔斷降級
            self._send(500, f'{{"error":"synthesize failed: {exc}"}}'.encode("utf-8"), "application/json")
            return
        self._send(200, audio, "audio/mpeg")


def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"xue-tts listening on :{PORT} (cache: {CACHE_DIR})", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
