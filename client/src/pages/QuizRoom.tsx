import React from "react";
import { useLocation } from "wouter";
import { BookOpenCheck, CalendarDays, Compass, Crosshair, RotateCcw, Swords, Telescope, Timer } from "lucide-react";
import "./HubPages.css";

/**
 * 答題室：同一個答題引擎、七種外殼，收編原本分散的答題入口。
 * 自由練習／潮汐戰鬥／卡牌決鬥／錯題本／專題觀測／限時挑戰／本週週測。
 */
export default function QuizRoom() {
  const [, setLocation] = useLocation();

  const modes = [
    { id: "free", label: "自由練習", desc: "依科目與進度開始答題，沒有戰鬥、沒有壓力。", href: "/practice", icon: BookOpenCheck },
    { id: "battle", label: "潮汐戰鬥", desc: "答對就攻擊潮芽獸，答錯牠咬你。", href: "/battle", icon: Swords },
    { id: "duel", label: "卡牌決鬥", desc: "三局兩勝，答對連擊會加倍傷害。", href: "/knowledge-duel", icon: Crosshair },
    { id: "wrong", label: "錯題本", desc: "今日複習中心＋錯題魔王，整理真實弱點。", href: "/review-hub", icon: RotateCcw },
    { id: "topic", label: "專題觀測", desc: "天文／科學／生活安全，一次只鑽一個主題。", href: "/gallery", icon: Telescope },
    { id: "timed", label: "限時挑戰", desc: "十題自我挑戰，留下個人最佳紀錄。", href: "/community?mode=timed", icon: Timer },
    { id: "weekly", label: "本週週測", desc: "每週五自動出 10 題回顧本週學習，完成有成就。", href: "/weekly-quiz", icon: CalendarDays },
    { id: "expedition", label: "今日遠征", desc: "每日三線任務，答題收集線索、修復學習星圖。", href: "/expedition", icon: Compass },
  ];

  return (
    <main className="hub-page" aria-labelledby="quiz-room-title">
      <header className="hub-header">
        <p className="hub-eyebrow">QUIZ ROOM</p>
        <h1 className="hub-title" id="quiz-room-title">📝 答題室</h1>
        <p className="hub-sub">同一個答題引擎，七種外殼。選模式就好，不用開七個頁面。</p>
      </header>
      <div className="hub-grid">
        {modes.map(({ id, label, desc, href, icon: Icon }) => (
          <button key={id} type="button" className="hub-card" onClick={() => setLocation(href)}>
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
