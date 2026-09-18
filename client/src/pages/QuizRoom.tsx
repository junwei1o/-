import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  Compass,
  Crosshair,
  Hash,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Link2,
  Palette,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Telescope,
  Timer,
  Zap,
} from "lucide-react";
import { loadClassroomBest, type ClassroomBestMap } from "@/lib/classroomBank";
import "./HubPages.css";
import "@/components/classroom/classroom.css";

/** 教室皮膚（local-first，只存這台裝置） */
type SkinId = "concise" | "memphis" | "classic";
const SKIN_STORAGE_KEY = "xue-classroom-skin-v1";
const SKINS: Array<{ id: SkinId; label: string; hint: string; dot: string }> = [
  { id: "concise", label: "極簡海", hint: "扁平漸層，安靜專注", dot: "#0B6E8E" },
  { id: "memphis", label: "孟菲斯", hint: "高飽和幾何，玩心最重", dot: "#ff5d8f" },
  { id: "classic", label: "經典海報", hint: "暖木彩帶，手作教室", dot: "#e8843a" },
];

const CHEER_TICKER = [
  "答錯不會扣分你的自信",
  "每個玩法都會告訴你正確答案",
  "30 秒，剛好專心一次",
  "成績只留在你自己的裝置",
  "玩到會，比考到會更重要",
  "這間教室，你說了算",
];

const HELPER_TIPS = [
  "今天想試試哪一種玩法？",
  "先從會的開始，手感會帶你往前。",
  "答錯的題，才是進步的關卡。",
  "30 秒做一題，等於給大腦一個小任務。",
  "休息也是學習的一部分喔。",
];

function loadSkin(): SkinId {
  try {
    const saved = localStorage.getItem(SKIN_STORAGE_KEY);
    if (saved === "concise" || saved === "memphis" || saved === "classic") return saved;
  } catch {
    // 隱私模式或無 localStorage 時退回預設皮
  }
  return "concise";
}

/**
 * 我的教室（原答題室）：
 * 上區是七種自由玩法（選擇題變體，成績留在自己裝置）；
 * 下區保留原本的八種答題模式（自由練習、潮汐戰鬥、週測等）。
 * 教室皮膚可切換：極簡海／孟菲斯／經典海報，偏好存本機。
 */
export default function QuizRoom() {
  const [, setLocation] = useLocation();
  const best: ClassroomBestMap = loadClassroomBest();
  const [skin, setSkin] = useState<SkinId>(loadSkin);
  const [tipIndex, setTipIndex] = useState(0);

  const changeSkin = (next: SkinId) => {
    setSkin(next);
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, next);
    } catch {
      // 寫入失敗時仍可在本次造訪切換
    }
  };

  const starLabel = (stars?: number) => (stars ? `最佳 ${stars}★` : "尚無紀錄");
  const scoreLabel = (score?: number) => (score !== undefined ? `最佳 ${score} 分` : "尚無紀錄");

  const plays = [
    {
      id: "flip",
      label: "翻牌問答",
      desc: "題目藏在卡片背面，翻開才開始 30 秒倒數，憑直覺作答。",
      href: "/classroom/flip",
      icon: Layers,
      color: "#0B6E8E",
      tilt: "mc-tilt-l",
      best: starLabel(best.flip?.stars),
    },
    {
      id: "image",
      label: "看圖選答",
      desc: "用圖片配對的 18 張實景照片，看一張圖選出正確名稱。",
      href: "/classroom/image",
      icon: ImageIcon,
      color: "#6C8460",
      tilt: "mc-tilt-r",
      best: starLabel(best.image?.stars),
    },
    {
      id: "bolt",
      label: "是非閃電",
      desc: "30 秒無限連判對錯，兩顆大鍵，訓練又快又準的手感。",
      href: "/classroom/bolt",
      icon: Zap,
      color: "#E8B84B",
      tilt: "mc-tilt-l",
      best: scoreLabel(best.bolt?.score),
    },
    {
      id: "rush",
      label: "限時接力",
      desc: "30 秒四選一連續接力，連對愈久加分愈多，挑戰最高分。",
      href: "/classroom/rush",
      icon: Timer,
      color: "#E8754A",
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
    {
      id: "factor",
      label: "因數探險",
      desc: "數學五上：把神祕數字的因數全部點出來，再看因數兩兩成對。",
      href: "/classroom/factor",
      icon: Hash,
      color: "#d5699e",
      tilt: "mc-tilt-l",
      best: starLabel(best.factor?.stars),
    },
    {
      id: "meteor",
      label: "倍數防衛戰",
      desc: "數學五上：滑動切割目標倍數隕石，一刀連斬有加成，小心炸彈！",
      href: "/classroom/meteor",
      icon: Shield,
      color: "#1B7082",
      tilt: "mc-tilt-r",
      best: starLabel(best.meteor?.stars),
    },
    {
      id: "rect",
      label: "長方形拼拼樂",
      desc: "數學五上：把方格拖曳拼成長方形，長×寬就是因數對，完全平方數有正方形彩蛋。",
      href: "/classroom/rect",
      icon: LayoutGrid,
      color: "#64866D",
      tilt: "mc-tilt-l",
      best: starLabel(best.rect?.stars),
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

  // 探索進度：七種自由玩法中，已在本機留下星等/分數紀錄的數量
  const playRecords = [best.flip, best.image, best.bolt, best.rush, best.relay, best.trap, best.factor, best.meteor, best.rect];
  const doneCount = playRecords.filter((record) => Boolean(record && ((record.stars ?? 0) > 0 || (record.score ?? 0) > 0))).length;
  const progressPct = Math.round((doneCount / plays.length) * 100);
  const helperTip = HELPER_TIPS[tipIndex];

  return (
    <main className="mc-page" data-skin={skin} aria-labelledby="my-classroom-title">
      <div className="mc-skin-bg" aria-hidden="true" />
      {/* 孟菲斯皮專屬：散落的幾何裝飾 */}
      {skin === "memphis" && (
        <div className="mm-decor" aria-hidden="true">
          <span className="mm-shape mm-dot" />
          <span className="mm-shape mm-ring" />
          <span className="mm-shape mm-tri" />
          <span className="mm-shape mm-plus" />
          <span className="mm-shape mm-zig" />
          <span className="mm-shape mm-dot mm-dot-2" />
          <span className="mm-shape mm-ring mm-ring-2" />
          <span className="mm-shape mm-tri mm-tri-2" />
        </div>
      )}

      {/* 經典海報皮專屬：天花板彩帶 */}
      {skin === "classic" && (
        <div className="mc-garland" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => <i key={i} />)}
        </div>
      )}

      {/* 教室皮膚切換器 */}
      <div className="mc-skin-switch" role="group" aria-label="教室佈置切換">
        <span className="mc-skin-label"><Palette size={15} /> 教室佈置</span>
        <span className="mc-skin-options">
          {SKINS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`mc-skin-btn${skin === option.id ? " is-active" : ""}`}
              aria-pressed={skin === option.id}
              title={option.hint}
              onClick={() => changeSkin(option.id)}
            >
              <span className="mc-skin-dot" style={{ background: option.dot }} aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </span>
      </div>

      <header className="mc-hero">
        {skin === "memphis" && <span className="mm-hero-tag" aria-hidden="true">FREE PLAY</span>}
        {skin === "concise" && (
          <div className="cs-helper">
            <button
              type="button"
              className="cs-helper-avatar"
              aria-label="換一句領航員悄悄話"
              onClick={() => setTipIndex((index) => (index + 1) % HELPER_TIPS.length)}
            >
              <Compass size={26} />
            </button>
            <button
              type="button"
              className="cs-helper-bubble"
              onClick={() => setTipIndex((index) => (index + 1) % HELPER_TIPS.length)}
            >
              {helperTip}
            </button>
          </div>
        )}
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
        {skin === "concise" && (
          <div className="cs-progress" aria-label={`探索進度 ${doneCount} / ${plays.length}`}>
            <div className="cs-progress-head">
              <span><Sparkles size={14} /> 你的探索進度</span>
              <span>{doneCount} / {plays.length} 種玩法留下紀錄</span>
            </div>
            <div className="cs-progress-track">
              <div className="cs-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </header>

      {/* 極簡海皮專屬：鼓勵彈幕跑馬燈 */}
      {skin === "concise" && (
        <div className="cs-bullets" aria-hidden="true">
          <div className="cs-bullets-track">
            {[...CHEER_TICKER, ...CHEER_TICKER].map((text, i) => (
              <span className="cs-bullet" key={i}>{text}</span>
            ))}
          </div>
        </div>
      )}

      <h2 className="mc-section-title">
        <span className="mc-doodle" aria-hidden="true"><Layers size={18} /></span>
        自由玩法（9 種新玩法）
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
