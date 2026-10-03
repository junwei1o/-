# tts-service — 獨立 Edge TTS 朗讀服務

edge-tts（微軟 Edge 的免費朗讀合成，台灣腔聲音：HsiaoChen / HsiaoYu / YunJhe）
專責服務。**主應用不再需要 Python 環境**，改以 HTTP 呼叫本服務；本服務不可用時，
主應用回 null，前端自動退回瀏覽器內建語音——朗讀功能永遠不壞，只是音質不同。

## 端點

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/health` | 存活檢查，回 `{"ok": true}` |
| GET | `/synthesize?text=…&voice=hsiaochen&rate=0.92` | 回 `audio/mpeg`（mp3） |

參數：
- `text`：必填，1–600 字元（超過回 400）
- `voice`：`hsiaochen`（預設）/ `hsiaoyu` / `yunjhe` / `xiaoxiao`
- `rate`：0.5–2.0 語速倍率（預設 1.0）

## 本地執行

```bash
cd tts-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
TTS_CACHE_DIR=/tmp/tts-cache .venv/bin/python app.py   # 預設埠 8300
```

驗證：

```bash
curl -s localhost:8300/health
curl -s -o /tmp/test.mp3 'localhost:8300/synthesize?text=今天天氣真好&voice=hsiaochen&rate=0.92'
file /tmp/test.mp3   # 應為 MPEG ADTS audio
```

## 部署（Render）

`render.yaml` 已定義 `xue-tts` 服務（Python runtime，free plan，自動部署）。
上線步驟：
1. 把 `TTS_SERVICE_URL` 設到主服務（`xue-adventure`）的 Render Environment，
   值為獨立服務的 URL（例如 `https://xue-tts.onrender.com`）。
2. push 後 Render 依 blueprint 自動建立/更新 `xue-tts` 服務，healthCheckPath `/health`。

主應用行為：
- 未設 `TTS_SERVICE_URL` → 直接回 null（前端用瀏覽器語音）
- 連續 3 次失敗 → 熔斷 5 分鐘，期間直接回 null
- 每次成功自動復位熔斷計數

## 快取

以 `sha256(voice|rate|text)` 為鍵存於 `TTS_CACHE_DIR`（預設 `/tmp/tts-cache`）。
同一段文字第二次合成零網路、零等待。Render free 實例重啟會清空（可接受，
只是重新合成一次）。臨時檔以 `.tmp` 寫入後原子更名，併發請求不會讀到半截檔。
