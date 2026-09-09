import React, { useState } from "react";
import {
  Accessibility,
  ArrowLeft,
  ArrowUpRight,
  Bandage,
  CheckCircle2,
  CloudLightning,
  DoorOpen,
  Droplets,
  Eye,
  Flame,
  HeartPulse,
  Home as HomeIcon,
  Info,
  LifeBuoy,
  MoonStar,
  Pill,
  PlugZap,
  Salad,
  ShieldCheck,
  Siren,
  Smile,
  SunMedium,
  Thermometer,
  TrafficCone,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  SAFETY_CARDS,
  SAFETY_HALLS,
  getSafetyCardsByHall,
  type SafetyCardKey,
  type SafetyHallKey,
} from "@/lib/safetyAcademy";
import { loadRpgState } from "@/game/rpgStorage";
import { getSafetyAcademySummary, isSafetyCardCompleted } from "@/game/safetyAcademyProgress";
import "./SafetyAcademy.css";

const HALL_ICONS: Record<SafetyHallKey, LucideIcon> = {
  life: HomeIcon,
  medical: HeartPulse,
  fire: Flame,
  body: Accessibility,
};

const CARD_ICONS: Record<SafetyCardKey, LucideIcon> = {
  "food-safety": Salad,
  "traffic-safety": TrafficCone,
  "internet-safety": ShieldCheck,
  "typhoon-lightning": CloudLightning,
  "fever-care": Thermometer,
  "emergency-call": Siren,
  "medicine-safety": Pill,
  handwashing: Droplets,
  "fire-evacuation": Flame,
  "escape-drill": DoorOpen,
  "burns-first-aid": Bandage,
  "fire-prevention": PlugZap,
  "eye-care": Eye,
  "teeth-care": Smile,
  "sleep-growth": MoonStar,
  "heat-sports": SunMedium,
};

type Filter = SafetyHallKey | "all";

export default function SafetyAcademy() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<Filter>("all");
  const [progress] = useState(() => loadRpgState().safetyAcademyProgress);
  const summary = getSafetyAcademySummary(progress);

  const visibleHalls = filter === "all" ? SAFETY_HALLS : SAFETY_HALLS.filter((hall) => hall.key === filter);

  const goToCard = (key: SafetyCardKey) => setLocation(`/safety/${key}`);

  return (
    <main className="safety-shell">
      <header className="safety-topbar">
        <Link href="/" className="safety-back"><ArrowLeft size={16} /> 返回航海主頁</Link>
        <span className="safety-code">LIFE SAFETY ACADEMY</span>
      </header>

      <section className="safety-hero" aria-labelledby="safety-title">
        <div>
          <p className="eyebrow accent">課綱之外／生活自保學院</p>
          <h1 id="safety-title">生活安全學院<i>把保護自己的本領，變成身體的反射動作。</i></h1>
          <p className="safety-hero-lede">
            食物、交通、網路、天氣、生病、火災、用藥、身體保健……這裡收錄 108 課綱以外、但每天都用得到的生活安全知識。
            讀完一張知識卡、通過情境小測驗，就能獲得金幣獎勵。
          </p>
          <div className="safety-stat-row">
            <span><strong>{SAFETY_CARDS.length}</strong> 張知識卡</span>
            <span><strong>{SAFETY_HALLS.length}</strong> 個主題館</span>
            <span><strong>{summary.completedCards}/{summary.totalCards}</strong> 已完成</span>
          </div>
        </div>
        <div className="safety-hero-buoy" aria-hidden="true">🛟</div>
      </section>

      <section className="safety-pledge" aria-label="安全第一守則">
        <LifeBuoy size={22} aria-hidden="true" />
        <span>安全第一守則：遇到危險或緊急狀況，先保護好自己，再立刻找信任的大人幫忙；需要救援時，請大人撥打 119。</span>
      </section>

      <nav className="safety-tabs" aria-label="依主題館篩選">
        <button
          type="button"
          className={`safety-tab${filter === "all" ? " is-active" : ""}`}
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
        >
          全部 <span className="safety-tab-count">{SAFETY_CARDS.length}</span>
        </button>
        {SAFETY_HALLS.map((hall) => {
          const hallSummary = summary.halls.find((item) => item.hall === hall.key);
          return (
            <button
              key={hall.key}
              type="button"
              className={`safety-tab${filter === hall.key ? " is-active" : ""}`}
              onClick={() => setFilter(hall.key)}
              aria-pressed={filter === hall.key}
            >
              {hall.name} <span className="safety-tab-count">{hallSummary ? `${hallSummary.completed}/${hallSummary.total}` : getSafetyCardsByHall(hall.key).length}</span>
            </button>
          );
        })}
      </nav>

      {visibleHalls.map((hall) => {
        const HallIcon = HALL_ICONS[hall.key];
        const hallCards = getSafetyCardsByHall(hall.key);
        const hallSummary = summary.halls.find((item) => item.hall === hall.key);
        return (
          <section key={hall.key} className={`safety-hall-section safety-hall-${hall.key}`} aria-labelledby={`safety-hall-${hall.key}`}>
            <div className="safety-hall-head">
              <span className="safety-hall-icon"><HallIcon size={20} aria-hidden="true" /></span>
              <div>
                <h2 id={`safety-hall-${hall.key}`}>{hall.name} <small style={{ fontWeight: 700, color: "var(--muted)", fontSize: 12 }}>· {hall.nauticalName}</small></h2>
                <p>{hall.tagline} — {hall.description}</p>
              </div>
              <span className="safety-hall-progress"><b>{hallSummary?.completed ?? 0}</b>/{hallSummary?.total ?? hallCards.length} 已完成</span>
            </div>
            <div className="safety-grid">
              {hallCards.map((card) => {
                const CardIcon = CARD_ICONS[card.key];
                const done = isSafetyCardCompleted(progress, card.key);
                return (
                  <button
                    key={card.key}
                    type="button"
                    className={`safety-card${done ? " is-done" : ""}`}
                    onClick={() => goToCard(card.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        goToCard(card.key);
                      }
                    }}
                    aria-label={`${card.title}${done ? "（已完成）" : ""}`}
                  >
                    {done && <span className="safety-card-done"><CheckCircle2 size={14} aria-hidden="true" /> 已完成</span>}
                    <span className={`safety-card-tag safety-tag-${card.hall}`}>{hall.name}</span>
                    <span className="safety-card-icon"><CardIcon size={20} aria-hidden="true" /></span>
                    <h3>{card.title}</h3>
                    <p>{card.short}</p>
                    <span className="safety-card-link">閱讀知識卡 <ArrowUpRight size={14} aria-hidden="true" /></span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="safety-footnote">
        <Info size={17} aria-hidden="true" />
        <p>
          本學院是生活常識學習，內容依臺灣公開衛教素材原創改寫，不能取代醫生診斷、專業救護與實際防災演練。
          遇到緊急狀況，請立刻請信任的大人撥打 119；身體不舒服要及時就醫，並依照醫生與藥師的指示用藥。
        </p>
      </section>
    </main>
  );
}
