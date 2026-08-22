import { SpeechReadButton } from "@/components/SpeechReadButton";
import type { SpeechPreferences } from "@/lib/speechPreferences";
import type { SpeechProgress } from "@/lib/speechSynthesis";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ReadableElement = "p" | "span" | "strong" | "b" | "h2" | "h3" | "em";

type SpeechReadableTextProps = {
  text: string;
  label: string;
  as?: ReadableElement;
  className?: string;
  buttonClassName?: string;
  compact?: boolean;
  preferences?: SpeechPreferences;
};

type SentenceSegment = {
  text: string;
  start: number;
  end: number;
};

function toSentenceSegments(text: string): SentenceSegment[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const segments: SentenceSegment[] = [];
  const matcher = /[^。！？!?；;\n]+[。！？!?；;\n]?/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(normalized))) {
    const value = match[0];
    if (!value.trim()) continue;
    segments.push({ text: value, start: match.index, end: match.index + value.length });
  }
  return segments.length ? segments : [{ text: normalized, start: 0, end: normalized.length }];
}

function getActiveSentenceIndex(segments: SentenceSegment[], progress: SpeechProgress | null) {
  if (!progress || !segments.length) return -1;
  const index = Math.max(0, progress.charIndex);
  const match = segments.findIndex((segment) => index >= segment.start && index < segment.end);
  return match >= 0 ? match : index >= segments.at(-1)!.end ? segments.length - 1 : 0;
}

function isOutsideComfortableViewport(element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const verticalPadding = Math.min(80, Math.max(24, viewportHeight * 0.12));
  return bounds.top < verticalPadding || bounds.bottom > viewportHeight - verticalPadding;
}

/**
 * 將可朗讀學習文字拆為句段；瀏覽器回報朗讀邊界時，只高亮當前句段。
 * 若平台未提供 boundary 事件，第一句會維持可辨識的播放中高亮，直到停止或結束。
 */
export function SpeechReadableText({
  text,
  label,
  as: Tag = "span",
  className = "",
  buttonClassName = "",
  compact = true,
  preferences,
}: SpeechReadableTextProps) {
  const segments = useMemo(() => toSentenceSegments(text), [text]);
  const [progress, setProgress] = useState<SpeechProgress | null>(null);
  const sentenceRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const activeSentenceIndex = getActiveSentenceIndex(segments, progress);

  useEffect(() => {
    if (activeSentenceIndex < 0 || typeof window === "undefined") return;
    const activeSentence = sentenceRefs.current[activeSentenceIndex];
    if (!activeSentence || !isOutsideComfortableViewport(activeSentence)) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (typeof activeSentence.scrollIntoView !== "function") return;
    activeSentence.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeSentenceIndex]);

  return (
    <>
      <Tag className={`speech-readable-content ${className}`} data-speech-readable={label}>
        {segments.map((segment, index) => (
          <span
            key={`${segment.start}-${segment.text}`}
            ref={(element) => {
              sentenceRefs.current[index] = element;
            }}
            className={`speech-readable-sentence ${activeSentenceIndex === index ? "is-active" : ""}`}
            data-speech-sentence-index={index}
            aria-current={activeSentenceIndex === index ? "true" : undefined}
          >
            {segment.text}
          </span>
        ))}
      </Tag>
      <SpeechReadButton
        text={text}
        label={label}
        compact={compact}
        className={buttonClassName}
        onProgressChange={setProgress}
        preferences={preferences}
      />
    </>
  );
}
