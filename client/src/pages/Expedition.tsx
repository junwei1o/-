import React from "react";
import { useLocation } from "wouter";
import { CalendarDays, Crown, MapPin } from "lucide-react";
import { getDailySignIn } from "@/utils/storage";
import "./HubPages.css";

/**
 * 今日遠征：簽到、今日任務、四科定位收進同一個面板。
 * 收編原本的每日營地（簽到）與守護者遠征（任務＋四科定位）。
 */
export default function Expedition() {
  const [, setLocation] = useLocation();
  const signIn = getDailySignIn();

  const subjects = [
    { subject: "國語", emoji: "📖", region: "北部 · 古書樓" },
    { subject: "數學", emoji: "⚖️", region: "中部 · 量測塔" },
    { subject: "自然", emoji: "🔭", region: "東部 · 山海觀察站" },
    { subject: "社會", emoji: "🏘️", region: "南部 · 生活港" },
  ];

  return (
    <main className="hub-page" aria-labelledby="expedition-title">
      <header className="hub-header">
        <p className="hub-eyebrow">DAILY EXPEDITION</p>
        <h1 className="hub-title" id="expedition-title">⚓ 今日遠征</h1>
        <p className="hub-sub">把簽到、每日任務、四科定位收進同一個面板，今天該做的都在這裡。</p>
      </header>

      <section className="hub-section" aria-label="每日簽到">
        <div className="hub-grid">
          <button type="button" className="hub-card" onClick={() => setLocation("/camp")}>
            <span className="hub-card-icon" aria-hidden="true"><CalendarDays size={21} /></span>
            <h3>📍 每日簽到</h3>
            <p>每天回來留下足跡，連續天數越長獎勵越厚。</p>
            <span className="hub-streak">🔥 已連續 {signIn.streak} 天</span>
            <small>前往營地 →</small>
          </button>
          <button type="button" className="hub-card" onClick={() => setLocation("/battle")}>
            <span className="hub-card-icon" aria-hidden="true"><Crown size={21} /></span>
            <h3>⚓ 今日任務</h3>
            <p>答題戰鬥：用答題擊敗知識怪物，累積足跡與獎勵。</p>
            <small>前往戰鬥 →</small>
          </button>
        </div>
      </section>

      <section className="hub-section" aria-label="四科定位">
        <div className="hub-section-head">
          <MapPin size={18} aria-hidden="true" />
          <h2>四科定位</h2>
        </div>
        <div className="hub-grid">
          {subjects.map(({ subject, emoji, region }) => (
            <button
              key={subject}
              type="button"
              className="hub-card"
              onClick={() => setLocation(`/practice?subject=${encodeURIComponent(subject)}&source=expedition`)}
            >
              <span className="hub-card-icon" aria-hidden="true">{emoji}</span>
              <h3>{subject}</h3>
              <p>{region}</p>
              <small>開始練習 →</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
