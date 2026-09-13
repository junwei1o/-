import React, { useState } from "react";
import { useLocation } from "wouter";
import { AlarmClock, BarChart3, BookOpenText, BrainCircuit, RotateCcw, ScrollText, UsersRound } from "lucide-react";
import "./HubPages.css";

type TabId = "me" | "wrong" | "parent";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "me", label: "我的成績" },
  { id: "wrong", label: "錯題本" },
  { id: "parent", label: "家長報告" },
];

/**
 * 學習歷程：同一筆本地學習資料，三個視角（學生／錯題／家長），一個頁面分 Tab。
 * 收編原本的學習洞察、學習報告、錯題複習、錯題統計、陪讀專區、探險日誌。
 */
export default function LearningHub() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<TabId>("me");

  const entries: Record<TabId, Array<{ label: string; desc: string; href: string; icon: React.ElementType }>> = {
    me: [
      { label: "學習洞察", desc: "查看弱點知識點與練習建議", href: "/learning-insights", icon: BrainCircuit },
      { label: "學習報告", desc: "回顧答題數量與成長趨勢", href: "/learning-report", icon: BarChart3 },
      { label: "探險日誌", desc: "每日與歷史航海足跡", href: "/adventure-journal", icon: BookOpenText },
    ],
    wrong: [
      { label: "今日複習中心", desc: "按遺忘曲線整理到期複習", href: "/review-hub", icon: AlarmClock },
      { label: "錯題複習", desc: "整理並補強真實錯題", href: "/wrong-answers", icon: RotateCcw },
      { label: "錯題統計", desc: "依錯誤型態看分佈與建議", href: "/error-statistics", icon: ScrollText },
    ],
    parent: [
      { label: "陪讀專區", desc: "給家長看的學習報告與聊天建議", href: "/learning-summary", icon: UsersRound },
    ],
  };

  return (
    <main className="hub-page" aria-labelledby="learning-title">
      <header className="hub-header">
        <p className="hub-eyebrow">LEARNING LOG</p>
        <h1 className="hub-title" id="learning-title">📊 學習歷程</h1>
        <p className="hub-sub">同一筆資料，三個視角：學生、錯題、家長。</p>
      </header>
      <div className="hub-tabs" role="tablist" aria-label="學習歷程視角">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`hub-tab ${tab === id ? "on" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="hub-grid" role="tabpanel">
        {entries[tab].map(({ label, desc, href, icon: Icon }) => (
          <button key={href} type="button" className="hub-card" onClick={() => setLocation(href)}>
            <span className="hub-card-icon" aria-hidden="true"><Icon size={21} /></span>
            <h3>{label}</h3>
            <p>{desc}</p>
            <small>前往 →</small>
          </button>
        ))}
      </div>
    </main>
  );
}
