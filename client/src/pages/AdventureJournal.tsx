import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpenText, Volume2 } from "lucide-react";
import { useLocation } from "wouter";
import { getJournalEntries, type JournalEntry } from "@/game/adventureJournal";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import "./AdventureJournal.css";

function formatJournalTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}

function entryLabel(entry: JournalEntry) {
  return `${formatJournalTime(entry.date)}。${entry.sessionType === "battle" ? "學習對戰" : "試卷練習"}。${entry.summary}`;
}

export default function AdventureJournal() {
  const [, setLocation] = useLocation();
  const [entries] = useState(() => getJournalEntries());
  const speech = useMemo(() => createSpeechController(), []);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(speech.isSupported ? "idle" : "unsupported");
  const readout = entries.length
    ? `探險日誌共有${entries.length}筆可驗證的完成紀錄。${entries.map(entryLabel).join("。")}`
    : "探險日誌目前還沒有可驗證的完成紀錄。完成一份試卷或一場學習對戰後，新的航行足跡會出現在這裡。";

  return (
    <main className="adventure-journal-page" aria-labelledby="adventure-journal-title">
      <header className="adventure-journal-hero">
        <p className="adventure-journal-kicker"><BookOpenText size={17} aria-hidden="true" /> LEARNING EXPEDITION LOG</p>
        <h1 id="adventure-journal-title">探險日誌</h1>
        <p>每一筆內容都來自已完成的試卷或學習對戰，幫你回看自己走過的學習航線。</p>
        <div className="adventure-journal-actions">
          <button type="button" onClick={() => setLocation("/map")}><ArrowLeft size={16} aria-hidden="true" /> 回到我的地圖</button>
          <button type="button" onClick={() => speech.speak(readout, setSpeechStatus)} disabled={!speech.isSupported} aria-label="朗讀探險日誌"><Volume2 size={16} aria-hidden="true" /> {speechStatus === "speaking" ? "朗讀中" : "朗讀日誌"}</button>
        </div>
      </header>

      <section className="adventure-journal-timeline" aria-label="探險日誌時間軸" data-testid="adventure-journal-timeline">
        {entries.length ? (
          <ol>
            {entries.map((entry) => (
              <li key={entry.id}>
                <span className="adventure-journal-dot" aria-hidden="true">{entry.sessionType === "battle" ? "⚔️" : "🧭"}</span>
                <article>
                  <div className="adventure-journal-entry-heading">
                    <time dateTime={new Date(entry.date).toISOString()}>{formatJournalTime(entry.date)}</time>
                    <span>{entry.sessionType === "battle" ? "學習對戰" : "試卷練習"}</span>
                  </div>
                  <h2>{entry.subject}</h2>
                  <p>{entry.summary}</p>
                  <small>本次整理 {entry.topicCount} 個知識主題，完成 {entry.correctCount} 題。</small>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <div className="adventure-journal-empty" role="status">
            <span aria-hidden="true">🧭</span>
            <h2>下一段航線正等著你</h2>
            <p>尚未找到可驗證的完成紀錄。完成一份試卷或一場學習對戰後，這裡會留下真實的探索回顧。</p>
            <button type="button" onClick={() => setLocation("/")}>開始今日試卷</button>
          </div>
        )}
      </section>
    </main>
  );
}
