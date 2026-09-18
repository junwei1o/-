import { useCallback, useRef } from "react";

/** 我的教室遊戲共用音效：成功（上行音）、失敗（低沉音）、過關（琶音）、翻牌、滴答。 */
export function useClassroomSound(muted = false) {
  const ctxRef = useRef<AudioContext | null>(null);

  const tone = useCallback(
    (frequency: number, startAt: number, duration: number, volume = 0.06, type: OscillatorType = "sine") => {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = (ctxRef.current ??= new Ctor());
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime + startAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + duration + 0.02);
    },
    [],
  );

  const play = useCallback(
    (kind: "ok" | "no" | "win" | "flip" | "tick") => {
      if (muted) return;
      try {
        if (kind === "ok") {
          tone(620, 0, 0.12, 0.07, "triangle");
          tone(880, 0.07, 0.14, 0.06, "triangle");
        } else if (kind === "no") {
          tone(220, 0, 0.18, 0.06, "sawtooth");
          tone(160, 0.09, 0.2, 0.05, "sawtooth");
        } else if (kind === "win") {
          [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.18, 0.06, "triangle"));
        } else if (kind === "flip") {
          tone(420, 0, 0.07, 0.04, "square");
        } else {
          tone(980, 0, 0.05, 0.035, "square");
        }
      } catch {
        /* 音效失敗不影響作答 */
      }
    },
    [muted, tone],
  );

  return play;
}
