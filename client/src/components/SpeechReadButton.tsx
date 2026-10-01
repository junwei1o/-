import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { createSpeechController, type SpeechProgressCallback, type SpeechStatus } from "@/lib/speechSynthesis";
import type { SpeechPreferences } from "@/lib/speechPreferences";

type SpeechReadButtonProps = {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
  onProgressChange?: SpeechProgressCallback;
  preferences?: SpeechPreferences;
  buttonText?: string;
};

const statusLabel: Record<SpeechStatus, string> = {
  idle: "朗讀",
  preparing: "準備中",
  speaking: "暫停",
  paused: "繼續",
  unsupported: "瀏覽器不支援朗讀",
  error: "朗讀失敗，請重試",
};

export function SpeechReadButton({ text, label = "朗讀內容", className = "", compact = false, onProgressChange, preferences, buttonText }: SpeechReadButtonProps) {
  const controllerRef = useRef<ReturnType<typeof createSpeechController> | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("idle");

  useEffect(() => {
    const controller = createSpeechController();
    controllerRef.current = controller;
    if (!controller.isSupported) setStatus("unsupported");
    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (preferences) controllerRef.current?.setPreferences(preferences);
  }, [preferences]);

  const handleClick = () => {
    const controller = controllerRef.current;
    if (!controller || !text.trim() || status === "unsupported") return;

    // 取音中：已在進行中的請求就不要再送一次（遠端合成要 3–6 秒，
    // 重複點擊只會浪費頻寬與伺服器 CPU）。要取消請按「停止」。
    if (status === "preparing") return;

    if (status === "speaking") {
      controller.pause(setStatus);
      return;
    }
    if (status === "paused") {
      controller.resume(setStatus);
      return;
    }
    const started = controller.speak(text, setStatus, onProgressChange);
    if (started) onProgressChange?.({ charIndex: 0, charLength: 0 });
  };

  const handleStop = () => {
    controllerRef.current?.stop(setStatus);
  };

  const isPreparing = status === "preparing";
  const isBusy = status === "speaking" || status === "paused" || isPreparing;
  const isSpeaking = status === "speaking";
  const buttonLabel = status === "unsupported" || status === "error" ? statusLabel[status] : `${statusLabel[status]}：${label}`;

  return (
    <span className={`speech-read-control speech-state-${status} ${className}`} data-speech-status={status} data-testid="speech-state">
      <button
        type="button"
        className="speech-read-button"
        onClick={handleClick}
        aria-label={buttonLabel}
        title={buttonLabel}
        disabled={status === "unsupported"}
        aria-busy={isPreparing || undefined}
      >
                {isPreparing ? <span className="speech-spinner" aria-hidden="true" data-testid="speech-spinner" /> : isSpeaking ? <span className="speech-wave" aria-hidden="true" data-testid="speech-wave"><i /><i /><i /></span> : status === "paused" ? <Play size={compact ? 15 : 17} aria-hidden="true" /> : <Volume2 size={compact ? 15 : 17} aria-hidden="true" />}
        {!compact && <span>{isPreparing ? "準備中…" : isSpeaking ? "朗讀中" : (status === "idle" || status === "unsupported") && buttonText ? buttonText : statusLabel[status]}</span>}

      </button>
      {isSpeaking && <span className="sr-only" aria-live="polite">正在朗讀：{label}</span>}
      {isPreparing && <span className="sr-only" aria-live="polite">正在準備朗讀語音：{label}</span>}
      {isBusy && (
        <button type="button" className="speech-stop-button" onClick={handleStop} aria-label={`停止${label}`} title={`停止${label}`}>
          <Square size={compact ? 14 : 15} aria-hidden="true" />
          {!compact && <span>停止</span>}
        </button>
      )}
    </span>
  );
}
