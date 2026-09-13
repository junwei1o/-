import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { bxStore } from "@/game/bxStore";
import { useBxVersion } from "./useBx";

/**
 * BX.Onboarding — 隱私約定完成（同意或略過皆可）後的六步驟聚光燈導覽。
 * 設計原則：
 * 1) 只做「說明」，不強制點擊、不代為簽到或發放獎勵，使用者每一步都可上一步／跳過／退出；
 * 2) 主題強調教育與自我進步：看見學習軌跡、照自己的步調、答錯不懲罰、長期累積；
 * 3) 沿用既有 bx-* 設計語彙（金幣色、圓角卡片、聚光錨點、圓點進度）。
 * 標記 [data-tour="map|islands|coins|checkin"] 為聚光錨點；無錨點的步驟置中顯示。
 */

interface Step {
  id: string;
  title: string;
  body: string;
  target: string | null;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "歡迎登船，學習是自己的航行",
    body: "在這裡答題不是為了跟別人比，而是<strong>看見自己哪裡懂、哪裡還要練習</strong>。花 30 秒認識你的學習航海圖，隨時都可以跳過。",
    target: null,
  },
  {
    id: "map",
    title: "航海圖，就是你的學習地圖",
    body: "四座知識島嶼對應國文、數學、社會、自然課綱；<strong>亮起來的地方，就是你努力過的軌跡</strong>。",
    target: '[data-tour="map"]',
  },
  {
    id: "islands",
    title: "照自己的步調選島練習",
    body: "每座島都由淺入深安排題目。想從哪裡開始都可以，<strong>慢慢進步，也是一種進步</strong>。",
    target: '[data-tour="islands"]',
  },
  {
    id: "growth",
    title: "金幣與經驗，記錄每一次努力",
    body: "答對會獲得金幣與經驗；<strong>答錯不會被懲罰</strong>，只會留下錯題線索，之後再挑戰就好。",
    target: '[data-tour="coins"]',
  },
  {
    id: "reflect",
    title: "深度伴讀：引導你自己想通",
    body: "答題後可以找學伴「伴小星」深度反思，它不會直接給答案，而是一次問你一個問題。<strong>此功能會把題目送往 AI 服務商產生導讀，不含姓名、學校、班級。</strong>",
    target: null,
  },
  {
    id: "checkin",
    title: "每天進步一點點",
    body: "每日簽到與學習報告，會幫你看見長期的累積；任何時候都能從「設定」匯出或清除自己的資料。準備好了就出發吧！",
    target: '[data-tour="checkin"]',
  },
];

interface CardPos {
  center: boolean;
  top?: number;
  left?: number;
}

function computePos(target: Element | null, card: HTMLElement | null): CardPos {
  if (!target || !card) return { center: true };
  const r = target.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return { center: true };
  const cw = card.offsetWidth;
  const ch = card.offsetHeight;
  let top = r.bottom + 16;
  let left = r.left + r.width / 2 - cw / 2;
  if (top + ch > window.innerHeight - 12) top = Math.max(12, r.top - ch - 16);
  left = Math.max(12, Math.min(left, window.innerWidth - cw - 12));
  return { center: false, top, left };
}

const ENTRY_DELAY_MS = 340; // 等隱私橫幅滑出後再進場，避免兩個彈層重疊。

export default function OnboardingTour() {
  // 隱私「做過決定」（同意或略過）以 privacy.ts 是否存在為準，兩種選擇都會進入導覽。
  useBxVersion();
  const decided = bxStore.get<number | null>("privacy.ts", null) != null;
  const completed = bxStore.get<boolean>("onboarding.completed", false) ?? false;
  const skipped = bxStore.get<boolean>("onboarding.skipped", false) ?? false;

  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(() =>
    Math.min(Math.max(bxStore.get<number>("onboarding.step", 0) ?? 0, 0), STEPS.length - 1),
  );
  const [pos, setPos] = useState<CardPos>({ center: true });
  const [leaving, setLeaving] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 隱私決定後稍候開啟導覽；完成或跳過後不再自動開啟。
  useEffect(() => {
    if (!decided || completed || skipped || active) return;
    const timer = window.setTimeout(() => setActive(true), ENTRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [decided, completed, skipped, active]);

  const step = STEPS[idx];

  const teardown = useCallback(() => {
    setLeaving(true);
    document.body.classList.remove("bx-tour-open");
    document.querySelectorAll(".bx-spotlight").forEach((el) => el.classList.remove("bx-spotlight"));
    window.setTimeout(() => {
      setActive(false);
      setLeaving(false);
    }, 300);
  }, []);

  const finish = useCallback(() => {
    bxStore.update((s) => {
      s.onboarding.completed = true;
      s.onboarding.skipped = false;
      s.onboarding.step = STEPS.length;
    });
    teardown();
    document.dispatchEvent(new CustomEvent("bx:onboarding:done"));
  }, [teardown]);

  const skip = useCallback(() => {
    bxStore.update((s) => {
      s.onboarding.skipped = true;
      s.onboarding.completed = true;
    });
    teardown();
  }, [teardown]);

  // 鎖定 body 捲動；Escape 隨時退出。
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("bx-tour-open");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("bx-tour-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [active, skip]);

  // 每一步：聚光燈、定位，並記住目前步驟（中斷後可從原步驟恢復）。
  useLayoutEffect(() => {
    if (!active || !step) return;

    const targetEl = step.target ? (document.querySelector(step.target) as HTMLElement | null) : null;
    document.querySelectorAll(".bx-spotlight").forEach((el) => el.classList.remove("bx-spotlight"));
    if (targetEl) {
      targetEl.classList.add("bx-spotlight");
      try {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        // 舊瀏覽器不支援平滑捲動則忽略。
      }
    }

    const raf = requestAnimationFrame(() => setPos(computePos(targetEl, cardRef.current)));
    const reposition = () => setPos(computePos(targetEl, cardRef.current));
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    bxStore.update((s) => {
      s.onboarding.step = idx;
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [active, idx, step]);

  const back = () => setIdx((v) => Math.max(0, v - 1));
  const next = () => {
    if (idx + 1 >= STEPS.length) {
      finish();
      return;
    }
    setIdx((v) => v + 1);
  };

  if (!active || !step) return null;
  const isLast = idx === STEPS.length - 1;

  return (
    <div className={`bx-tour ${leaving ? "bx-tour--out" : ""}`} role="dialog" aria-modal="true" aria-label="新手導覽">
      <div className="bx-tour__mask" onClick={skip} />
      <div
        ref={cardRef}
        className={`bx-tour__card ${pos.center ? "bx-tour__card--center" : ""}`}
        style={pos.center ? undefined : { top: pos.top, left: pos.left }}
      >
        <button type="button" className="bx-tour__skip" onClick={skip}>跳過導覽 ✕</button>
        <p className="bx-tour__step">新手導覽 {idx + 1} / {STEPS.length}</p>
        <h3 className="bx-tour__title">{step.title}</h3>
        <p className="bx-tour__body" dangerouslySetInnerHTML={{ __html: step.body }} />
        <div className="bx-tour__dots" aria-label={`第 ${idx + 1} 步，共 ${STEPS.length} 步`}>
          {STEPS.map((s, i) => (
            <span key={s.id} className={`bx-dot ${i === idx ? "bx-dot--on" : ""} ${i < idx ? "bx-dot--done" : ""}`} />
          ))}
        </div>
        <div className="bx-tour__actions bx-tour__actions--row">
          {idx > 0 ? (
            <button type="button" className="bx-btn bx-btn--ghost bx-btn--sm" onClick={back}>上一步</button>
          ) : (
            <span />
          )}
          <button type="button" className="bx-btn bx-btn--primary bx-btn--sm" onClick={next}>
            {isLast ? "開始探險 ⚓" : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}
