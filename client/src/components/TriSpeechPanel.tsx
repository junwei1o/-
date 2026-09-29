import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import {
  formatSpeechRate,
  loadSpeechPreferences,
  saveSpeechPreferences,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  type SpeechPreferences,
} from "@/lib/speechPreferences";

type TriSpeechPanelProps = {
  /** 要朗讀的文字（通常是題目＋選項，或頁面說明）。 */
  text: string;
  /** 無障礙標籤，例如「朗讀題目」。 */
  label?: string;
  className?: string;
};

/**
 * 三軸試卷朗讀面板：播放／暫停／停止＋語速調整。
 *
 * - 播放中再次點擊主按鈕＝暫停，再點＝繼續；停止按鈕隨時回到 idle。
 * - 語速 slider（0.6–1.4）即時寫入 localStorage，下次開啟沿用。
 * - text 改變時自動停止上一句（避免題目切換後還在唸舊題）。
 * - 瀏覽器不支援時顯示降級提示，按鈕 disabled。
 */
export function TriSpeechPanel({ text, label = "朗讀內容", className = "" }: TriSpeechPanelProps) {
  const controllerRef = useRef<ReturnType<typeof createSpeechController> | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [preferences, setPreferences] = useState<SpeechPreferences>(() => loadSpeechPreferences());

  useEffect(() => {
    const controller = createSpeechController();
    controller.setPreferences(loadSpeechPreferences());
    controllerRef.current = controller;
    if (!controller.isSupported) setStatus("unsupported");
    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, []);

  // 文字改變（換題）時停掉上一句，避免唸錯題。
  const textRef = useRef(text);
  useEffect(() => {
    if (textRef.current !== text) {
      textRef.current = text;
      controllerRef.current?.stop(setStatus);
    }
  }, [text]);

  const handleToggle = () => {
    const controller = controllerRef.current;
    if (!controller || !text.trim() || status === "unsupported") return;
    if (status === "speaking") {
      controller.pause(setStatus);
      return;
    }
    if (status === "paused") {
      controller.resume(setStatus);
      return;
    }
    controller.speak(text, setStatus);
  };

  const handleStop = () => {
    controllerRef.current?.stop(setStatus);
  };

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rate = Number(event.target.value);
    setPreferences((prev) => {
      const next = { ...prev, rate };
      controllerRef.current?.setPreferences(next);
      saveSpeechPreferences(next);
      return next;
    });
  };

  const isBusy = status === "speaking" || status === "paused";
  const unsupported = status === "unsupported";

  return (
    <div className={`tri-speech ${className}`} aria-label={`${label}朗讀控制`}>
      <button
        type="button"
        className="tri-speech-btn"
        onClick={handleToggle}
        disabled={unsupported || !text.trim()}
        aria-label={unsupported ? "瀏覽器不支援朗讀" : status === "speaking" ? `暫停${label}` : status === "paused" ? `繼續${label}` : `朗讀${label}`}
        title={unsupported ? "瀏覽器不支援朗讀" : `朗讀${label}`}
      >
        {status === "speaking"
          ? <Pause size={15} aria-hidden="true" />
          : status === "paused"
            ? <Play size={15} aria-hidden="true" />
            : <Volume2 size={15} aria-hidden="true" />}
        <span>{status === "speaking" ? "暫停" : status === "paused" ? "繼續" : "朗讀"}</span>
      </button>
      {isBusy ? (
        <button
          type="button"
          className="tri-speech-btn tri-speech-btn--stop"
          onClick={handleStop}
          aria-label={`停止${label}`}
          title={`停止${label}`}
        >
          <Square size={14} aria-hidden="true" />
          <span>停止</span>
        </button>
      ) : null}
      <label className="tri-speech-rate">
        <span>語速 {formatSpeechRate(preferences.rate)}</span>
        <input
          type="range"
          min={SPEECH_RATE_MIN}
          max={SPEECH_RATE_MAX}
          step={0.05}
          value={preferences.rate}
          onChange={handleRateChange}
          disabled={unsupported}
          aria-label="朗讀語速"
        />
      </label>
      {unsupported ? (
        <p className="tri-speech-fallback" role="note">
          目前的瀏覽器不支援語音朗讀，請改用 Chrome、Edge 或 Safari。
        </p>
      ) : null}
      {status === "error" ? (
        <p className="tri-speech-fallback" role="alert">
          朗讀失敗，請重試一次。
        </p>
      ) : null}
    </div>
  );
}
