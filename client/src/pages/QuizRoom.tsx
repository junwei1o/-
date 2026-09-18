import React from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  Compass,
  Crosshair,
  Image as ImageIcon,
  Layers,
  Link2,
  RotateCcw,
  Swords,
  Telescope,
  Timer,
  Zap,
} from "lucide-react";
import { loadClassroomBest, type ClassroomBestMap } from "@/lib/classroomBank";
import "./HubPages.css";
import "@/components/classroom/classroom.css";

/**
 * 我的教室（原答題室）：
 * 上區是六種自由玩法（選擇題變體，成績留在自己裝置）；
 * 下區保留原本的八種答題模式（自由練習、潮汐戰鬥、週測等）。
 */
export default function QuizRoom() {
  const [, setLocation] = useLocation();
  const best: ClassroomBestMap = loadClassroomBest();

  const starLabel = (stars?: number) => (stars ? `最佳 ${stars}★` : "尚無紀錄");
  const scoreLabel = (score?: number) => (score !== undefined ? `最佳 ${score} 分` : "尚無紀錄");

  const plays = [
    {
      id: "flip",
      label: "翻牌問答",
      desc: "題目藏在卡片背面，翻開才開始 30 秒倒數，憑直覺作答。",
      href: "/classroom/flip",
      icon: Layers,
      color: "#2f7d8f",
      tilt: "mc-tilt-l",
      best: starLabel(best.flip?.stars),
    },
    {
      id: "image",
      label: "看圖選答",
      desc: "用圖片配對的 18 張實景照片，看一張圖選出正確名稱。",
      href: "/classroom/image",
      icon: ImageIcon,
      color: "#5b8a4b",
      tilt: "mc-tilt-r",
      best: starLabel(best.image?.stars),
    },
    {
      id: "bolt",
      label: "是非閃電",
      desc: "30 秒無限連判對錯，兩顆大鍵，訓練又快又準的手感。",
      href: "/classroom/bolt",
      icon: Zap,
      color: "#d9a441",
      tilt: "mc-tilt-l",
      best: scoreLabel(best.bolt?.score),
    },
    {
      id: "rush",
      label: "限時接力",
      desc: "30 秒四選一連續接力，連對愈久加分愈多，挑戰最高分。",
      href: "/classroom/rush",
      icon: Timer,
      color: "#e8843a",
      tilt: "mc-tilt-r",
      best: scoreLabel(best.rush?.score),
    },
    {
      id: "relay",
      label: "選擇配對接力",
      desc: "先答選擇題取得線索，再解鎖一盤迷你配對，連過三關。",
      href: "/classroom/relay",
      icon: Link2,
      color: "#7c6bb5",
      tilt: "mc-tilt-l",
      best: starLabel(best.relay?.stars),
    },
    {
      id: "trap",
      label: "陷阱題挑戰",
      desc: "往年最經典、最容易踩雷的題目，答錯立刻解析陷阱。",
      href: "/classroom/trap",
      icon: AlertTriangle,
      color: "#c8553d",
      tilt: "mc-tilt-r",
      best: starLabel(best.trap?.stars),
    },
  ];

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
    <main className="mc-page" aria-labelledby="my-classroom-title">
      <div className="mc-garland" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => <i key={i} />)}
      </div>

      <header className="mc-hero">
        <p className="mc-hero-eyebrow">MY CLASSROOM · 自由玩法大本營</p>
        <h1 id="my-classroom-title">我的<u>教室</u>，隨你玩</h1>
        <p className="mc-sub">
          這裡沒有分數排名、沒有無止盡的考卷。想翻牌就翻牌、想跟時間賽跑就衝刺，
          答錯也不會有人笑你——每個玩法都會告訴你正確答案。成績只留在你自己的裝置，儘管釋放自我！
        </p>
        <div className="mc-hero-stickers" aria-label="教室守則">
          <span className="mc-sticker">⏱ 每題 <b>30 秒</b></span>
          <span className="mc-sticker">🔊 答對答錯都有<b>音效回饋</b></span>
          <span className="mc-sticker">💾 紀錄<b>只存這台裝置</b></span>
          <span className="mc-sticker">🔁 玩幾次都可以</span>
        </div>
      </header>

      <h2 className="mc-section-title">
        <span className="mc-doodle" aria-hidden="true"><Layers size={18} /></span>
        自由玩法（6 種新玩法）
      </h2>
      <div className="mc-play-grid">
        {plays.map(({ id, label, desc, href, icon: Icon, color, tilt, best: bestText }) => (
          <button
            key={id}
            type="button"
            className={`mc-play-card ${tilt}`}
            onClick={() => setLocation(href)}
          >
            <span className="mc-play-icon" style={{ background: color }} aria-hidden="true">
              <Icon size={23} />
            </span>
            <h3>{label}</h3>
            <p>{desc}</p>
            <span className="mc-play-go">
              <span className="mc-play-best">{bestText}</span>
              <span>開始玩 →</span>
            </span>
          </button>
        ))}
      </div>

      <h2 className="mc-section-title">
        <span className="mc-doodle" aria-hidden="true"><BookOpenCheck size={18} /></span>
        經典答題模式
      </h2>
      <div className="mc-mode-grid">
        {modes.map(({ id, label, desc, href, icon: Icon }) => (
          <button key={id} type="button" className="mc-mode-card" onClick={() => setLocation(href)}>
            <span className="mc-mode-icon" aria-hidden="true"><Icon size={19} /></span>
            <span>
              <h3>{label}</h3>
              <p>{desc}</p>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
