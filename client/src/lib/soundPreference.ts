/**
 * 全域音效（SFX）總開關：持久化的 master switch。
 *
 * 為什麼存在（2026-09-30 音效巡檢）：
 * - 設計早已預留「教室全域靜音」（OnionAcademyGame 的 muted prop 註解），
 *   但 ClassRoomPlay／QuizRoom 從未接線——教室遊戲實際上無法靜音；
 * - 只有 MatchingPage 有一個頁內開關，且 useState(false) 不持久化、
 *   換頁即失效，其他頁面聽得到但關不掉。
 *
 * 邊界（重要）：這個開關只管**合成音效（AudioContext 振盪器 SFX）**，
 * 不管朗讀（speechSynthesis／Edge TTS）。朗讀是使用者主動按下才發生的
 * 功能，被靜音變成啞鈕反而誤導；朗讀另有自己的語速/音量偏好。
 *
 * 反應式：useSoundEnabled() 走 useSyncExternalStore，任何頁面切換開關
 * → 全站已掛載的開關 UI 即時重渲染；播放路徑用 isSoundEnabled() 在
 * 呼叫當下判斷（無需重渲染即可生效）。
 */
import { useSyncExternalStore } from "react";
import { readStoredValue, writeStoredValue } from "@/utils/storage";

export const SOUND_ENABLED_KEY = "xue.sound.enabled";

function readEnabled(): boolean {
  return readStoredValue(SOUND_ENABLED_KEY, "true") !== "false";
}

let enabled = readEnabled();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** 播放路徑用：呼叫當下是否允許發聲（含跨分頁同步）。 */
export function isSoundEnabled(): boolean {
  return enabled;
}

function normalize(next: boolean | ((prev: boolean) => boolean)): boolean {
  return typeof next === "function" ? next(enabled) : next;
}

/** 設定開關：寫入 localStorage 並通知所有訂閱者。 */
export function setSoundEnabled(next: boolean | ((prev: boolean) => boolean)): void {
  const value = normalize(next);
  if (value === enabled) return;
  enabled = value;
  writeStoredValue(SOUND_ENABLED_KEY, value ? "true" : "false");
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 元件用：訂閱全域開關（支援 setSoundEnabled(fn) 函數式更新）。 */
export function useSoundEnabled(): [boolean, (next: boolean | ((prev: boolean) => boolean)) => void] {
  const value = useSyncExternalStore(subscribe, isSoundEnabled, () => true);
  return [value, setSoundEnabled];
}

// 跨分頁同步：其他分頁切換靜音時本分頁跟著走（與站內 storage 事件慣例一致）。
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== SOUND_ENABLED_KEY) return;
    const next = readEnabled();
    if (next !== enabled) {
      enabled = next;
      notify();
    }
  });
}
