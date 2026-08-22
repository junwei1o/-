import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { getAnswerBroadcast, type AnswerBroadcast } from "@/lib/answerBroadcasts";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import type { SpeechPreferences } from "@/lib/speechPreferences";

type AnswerBroadcastProps = {
  answerCount: number;
  soundEnabled: boolean;
  speechPreferences?: SpeechPreferences;
  onClose: () => void;
};

export default function AnswerBroadcast({ answerCount, soundEnabled, speechPreferences, onClose }: AnswerBroadcastProps) {
  const item = getAnswerBroadcast(answerCount);
  const controllerRef = useRef<ReturnType<typeof createSpeechController> | null>(null);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>("idle");
  const [muted, setMuted] = useState(!soundEnabled);

  const speak = useCallback((broadcast: AnswerBroadcast) => {
    if (muted || !soundEnabled) return;
    controllerRef.current?.speak(broadcast.text, setSpeechStatus);
  }, [muted, soundEnabled]);

  useEffect(() => {
    controllerRef.current = createSpeechController();
    if (speechPreferences) controllerRef.current.setPreferences(speechPreferences);
    if (item) speak(item);
    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, [item, speak, speechPreferences]);

  useEffect(() => {
    if (speechPreferences) controllerRef.current?.setPreferences(speechPreferences);
  }, [speechPreferences]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!item) return null;
  const unsupported = controllerRef.current?.isSupported === false;

  return <div className="answer-broadcast-backdrop" role="presentation">
    <section className="answer-broadcast-dialog" role="dialog" aria-modal="true" aria-labelledby="answer-broadcast-title" aria-describedby="answer-broadcast-text">
      <button type="button" className="answer-broadcast-close" aria-label="關閉播報彩蛋" onClick={onClose}><X size={18} /></button>
      <p className="eyebrow accent">ANSWER MILESTONE / 第 {answerCount} 題</p>
      <h2 id="answer-broadcast-title">{item.title}</h2>
      <p id="answer-broadcast-text" className="answer-broadcast-text">「{item.text}」</p>
      <p className="answer-broadcast-kind">每答對五題，收聽一則學習彩蛋。</p>
      <div className="answer-broadcast-actions" aria-live="polite">
        <button type="button" className="btn primary small" onClick={() => speak(item)} disabled={muted || !soundEnabled || unsupported}>
          {muted || !soundEnabled || unsupported ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {unsupported ? "瀏覽器不支援語音" : speechStatus === "speaking" ? "正在播報" : speechStatus === "paused" ? "從頭播報" : "再播一次"}
        </button>
        {(speechStatus === "speaking" || speechStatus === "paused") && <button type="button" className="text-btn" onClick={() => {
          if (speechStatus === "speaking") controllerRef.current?.pause(setSpeechStatus);
          else controllerRef.current?.resume(setSpeechStatus);
        }}>
          {speechStatus === "speaking" ? "暫停朗讀" : "繼續朗讀"}
        </button>}
        <button type="button" className="text-btn" onClick={() => setMuted((value) => !value)} aria-pressed={muted}>
          {muted ? "開啟本次語音" : "靜音本次彩蛋"}
        </button>
        <button type="button" className="text-btn" onClick={onClose}>繼續答題</button>
      </div>
    </section>
  </div>;
}
