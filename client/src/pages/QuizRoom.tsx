import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  Clapperboard,
  Compass,
  Layers,
  LayoutGrid,
  Link2,
  Palette,
  RotateCcw,
  Shield,
  Sparkles,
  Telescope,
  Timer,
  Zap,
} from "lucide-react";
import { loadClassroomBest, type ClassroomBestMap } from "@/lib/classroomBank";
import { ONION_LESSONS } from "@/game/onionAcademyLessons";
import {
  FRACTION_COURSE,
  completedLayerCount,
  courseProgress,
  courseTotalStars,
  loadOnionProgress,
} from "@/lib/onionLessons";
import "./HubPages.css";
import "@/components/classroom/classroom.css";

/** 教室皮膚（local-first，只存這台裝置） */
type SkinId = "concise" | "memphis" | "classic";
const SKIN_STORAGE_KEY = "xue-classroom-skin-v1";
const SKINS: Array<{ id: SkinId; label: string; hint: string; dot: string }> = [
  { id: "concise", label: "極簡紫", hint: "紫調扁平漸層，安靜專注", dot: "#7C3AED" },
  { id: "memphis", label: "孟菲斯", hint: "高飽和幾何，玩心最重", dot: "#ff5d8f" },
  { id: "classic", label: "經典海報", hint: "暖木彩帶，手作教室", dot: "#e8843a" },
];

const CHEER_TICKER = [
  "答錯不會扣分，也不會打擊你的自信",
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
 * 下區保留原本的經典答題模式（自由練習、錯題、週測等）。
 * 教室皮膚可切換：極簡紫／孟菲斯／經典海報，偏好存本機。
 */
export default function QuizRoom() {
  const [, setLocation] = useLocation();
  const best: ClassroomBestMap = loadClassroomBest();
  const [skin, setSkin] = useState<SkinId>(loadSkin);
  const [tipIndex, setTipIndex] = useState(0);

  // 洋蔥式動畫微課進度（local-first）
  const onionLayers = courseProgress(loadOnionProgress(), FRACTION_COURSE.id);
  const onionDone = completedLayerCount(FRACTION_COURSE, onionLayers);
  const onionStars = courseTotalStars(FRACTION_COURSE, onionLayers);
  // 洋蔥學院合併後只有一張卡：優先用動畫課星等，其次顯示分數工坊的剝層進度。
  const academyState = best["onion-academy"]?.stars
    ? `最佳 ${best["onion-academy"].stars}★`
    : onionDone >= FRACTION_COURSE.layers.length
      ? `已完成 ${onionStars}★`
      : onionDone > 0
        ? `已剝 ${onionDone}/${FRACTION_COURSE.layers.length} 層 · ${onionStars}★`
        : "新課上線";

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

  // 融合玩法大本營：9 種舊玩法整併成 6 張卡（舊路由 /classroom/flip、/classroom/image 等全部保留相容）。
  const plays = [
    {
      id: "flipdex",
      label: "翻牌圖鑑",
      desc: "翻牌問答 ＋ 看圖選答混編圖鑑：翻開可能是實景照片、也可能是文字題，一輪蒐集 18 張卡。",
      href: "/classroom/flipdex",
      icon: Layers,
      color: "#0B6E8E",
      tilt: "mc-tilt-l",
      best: starLabel(best.flipdex?.stars),
    },
    {
      id: "flashrush",
      label: "閃電接力",
      desc: "是非閃電 ＋ 限時接力混合賽道：對錯大鍵和四選一輪流上場，30 秒挑戰最高分。",
      href: "/classroom/flashrush",
      icon: Zap,
      color: "#E8B84B",
      tilt: "mc-tilt-r",
      best: scoreLabel(best.flashrush?.score),
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
      id: "meteor",
      label: "倍數防衛戰",
      desc: "數學五上：滑動切割目標倍數隕石，一刀連斬有加成，小心炸彈！",
      href: "/classroom/meteor",
      icon: Shield,
      color: "#1B7082",
      tilt: "mc-tilt-l",
      best: starLabel(best.meteor?.stars),
    },
    {
      id: "duo",
      label: "因數雙重奏",
      desc: "因數探險 ＋ 長方形拼拼樂接續：同一個數先點因數、再拼長方形，雙重玩法互相印證。",
      href: "/classroom/duo",
      icon: LayoutGrid,
      color: "#d5699e",
      tilt: "mc-tilt-r",
      best: starLabel(best.duo?.stars),
    },
  ];

  const modes = [
    { id: "free", label: "自由練習", desc: "依科目與進度開始答題，沒有壓力。", href: "/practice", icon: BookOpenCheck },
    { id: "wrong", label: "錯題本", desc: "今日複習中心＋錯題魔王，整理真實弱點。", href: "/review-hub", icon: RotateCcw },
    { id: "topic", label: "專題觀測", desc: "天文／科學／生活安全，一次只鑽一個主題。", href: "/gallery", icon: Telescope },
    { id: "timed", label: "限時挑戰", desc: "十題自我挑戰，留下個人最佳紀錄。", href: "/community?mode=timed", icon: Timer },
    { id: "weekly", label: "本週週測", desc: "每週五自動出 10 題回顧本週學習，完成有成就。", href: "/weekly-quiz", icon: CalendarDays },
    { id: "expedition", label: "今日遠征", desc: "每日三線任務，答題收集線索、修復學習星圖。", href: "/expedition", icon: Compass },
  ];

  // 探索進度：六種融合玩法中，已在本機留下星等/分數紀錄的數量
  const playRecords = [best.flipdex, best.flashrush, best.relay, best.trap, best.meteor, best.duo];
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
          <span className="mm-shape mm-arch" />
          <span className="mm-shape mm-sq" />
          <span className="mm-shape mm-squiggle" />
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
              className="cs-helper-bubble" aria-live="polite"
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

      {/* 極簡紫皮專屬：即時彈幕區（LIVE 標籤＋鼓勵跑馬燈） */}
      {skin === "concise" && (
        <div className="cs-bullets-wrap" aria-hidden="true">
          <span className="cs-live"><i /> LIVE</span>
          <div className="cs-bullets">
            <div className="cs-bullets-track">
              {[...CHEER_TICKER, ...CHEER_TICKER].map((text, i) => (
                <span className="cs-bullet" key={i}>{text}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <h2 className="mc-section-title">
        <span className="mc-doodle" aria-hidden="true"><Clapperboard size={18} /></span>
        動畫微課（像洋蔥一樣分層學）
      </h2>
      <button type="button" className="mc-lesson-card" onClick={() => setLocation("/classroom/onion-academy")}>
        <span className="mc-lesson-icon" aria-hidden="true"><Clapperboard size={26} /></span>
        <span className="mc-lesson-body">
          <h3>洋蔥學院 <span className="mc-lesson-badge">{academyState}</span></h3>
          <p>同一個入口三種學法：「動畫課」多學科一堂一知識點，看完立刻闖 5 題；「題庫劇場」從 5000 題庫存抽題、洋蔥演出詳解；「分數工坊」把分數拆成四層，逐層解鎖、答錯給提示。</p>
          <span className="mc-lesson-meta">🎬 {ONION_LESSONS.length} 堂動畫課 · 🎭 題庫劇場 5000 題 · 🧅 分數 4 層 · ⭐ 星星＋金幣獎勵</span>
        </span>
        <span className="mc-lesson-go" aria-hidden="true">→</span>
      </button>

      <h2 className="mc-section-title">
        <span className="mc-doodle" aria-hidden="true"><Layers size={18} /></span>
        自由玩法（6 種融合玩法）
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
