import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { bxStore, BX_EVENTS } from "@/game/bxStore";
import { bxToast, bxCelebrate } from "./bxRewards";
import { useBxVersion } from "./useBx";

/**
 * BX.Onboarding — 隱私接受後的四步驟聚光燈導覽。
 * 步驟：航海圖 → 選島嶼（強制點擊）→ 金幣 → 每日簽到（自動簽到一次）。
 * 標記 [data-tour="map|islands|coins|checkin"] 為聚光錨點；
 * 點擊 [data-island] 會派發 bx:tour:island-click 解鎖強制步驟。
 */

interface Step {
  id: string;
  title: string;
  body: string;
  target: string;
  forced: boolean;
  autoCheckin?: boolean;
}

const STEPS: Step[] = [
  { id: "welcome", title: "歡迎登船，見習航海士！", body: "你的任務是航行寶島四座知識島嶼，每答對一題，航海圖就會亮一點。", target: '[data-tour="map"]', forced: false },
  { id: "pick-island", title: "選一座島嶼出發", body: "北部古書樓、中部量測塔、南部生活港、東部山海觀察站——想從哪裡開始？<strong>點一下任一座島嶼試試！</strong>", target: '[data-tour="islands"]', forced: true },
  { id: "coins", title: "答題就能賺金幣", body: "答對題目會獲得金幣與經驗，金幣可以到商店換提示卡、護盾，甚至新的船標。", target: '[data-tour="coins"]', forced: false },
  { id: "checkin", title: "每天回來簽到，船隊會更強", body: "連續簽到 3 天、7 天有特殊獎勵。今天就先幫你完成第一次簽到吧！", target: '[data-tour="checkin"]', forced: false, autoCheckin: true },
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

export default function OnboardingTour() {
  const accepted = bxStore.get<boolean>("privacy.accepted", false) ?? false;
  const completed = bxStore.get<boolean>("onboarding.completed", false) ?? false;
  const skipped = bxStore.get<boolean>("onboarding.skipped", false) ?? false;
  const [active, setActive] = useState(accepted && !completed && !skipped);
  const [idx, setIdx] = useState(() => Math.min(bxStore.get<number>("onboarding.step", 0) ?? 0, STEPS.length - 1));
  const [unlocked, setUnlocked] = useState(false);
  const [pos, setPos] = useState<CardPos>({ center: true });
  const [hint, setHint] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 隱私接受（store 變化）後開啟導覽；完成或跳過後不再自動開啟。
  useBxVersion();
  useEffect(() => {
    if (accepted && !completed && !skipped) setActive(true);
  }, [accepted, completed, skipped]);

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
      s.onboarding.step = STEPS.length;
    });
    teardown();
    bxCelebrate("🎉 歡迎加入！你的第一筆金幣已入帳");
    document.dispatchEvent(new CustomEvent("bx:onboarding:done"));
  }, [teardown]);

  const skip = useCallback(() => {
    bxStore.update((s) => {
      s.onboarding.skipped = true;
      s.onboarding.completed = true;
    });
    teardown();
  }, [teardown]);

  const doCheckin = useCallback(() => {
    const r = bxStore.checkIn();
    if (r.already) {
      bxToast("⚓ 今天已經簽到過了");
      return;
    }
    bxToast(`⚓ 簽到成功！+${r.coins} 金幣（連續 ${r.streak} 天）`);
    if ((bxStore.get<number>("stats.total_answers", 0) ?? 0) === 0) {
      bxStore.update((s) => { s.coins += 10; });
    }
  }, []);

  // 強制步驟：點擊任一島嶼後解鎖。
  useEffect(() => {
    if (!active) return;
    const onIslandClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-island]")) {
        document.dispatchEvent(new CustomEvent(BX_EVENTS.tourIslandClick));
      }
    };
    document.addEventListener("click", onIslandClickCapture, true);
    return () => document.removeEventListener("click", onIslandClickCapture, true);
  }, [active]);

  // 鎖定 body 捲動。
  useEffect(() => {
    if (active) document.body.classList.add("bx-tour-open");
    return () => document.body.classList.remove("bx-tour-open");
  }, [active]);

  // 每一步：聚光燈、定位、提示、自動簽到。
  useLayoutEffect(() => {
    if (!active || !step) return;
    setUnlocked(false);
    setHint(step.forced ? "👆 請先點擊畫面中高亮的區域" : null);

    const targetEl = document.querySelector(step.target) as HTMLElement | null;
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

    if (step.forced) {
      const unlock = () => {
        setUnlocked(true);
        setHint("✅ 很好！繼續下一步");
        document.removeEventListener(BX_EVENTS.tourIslandClick, unlock);
      };
      document.addEventListener(BX_EVENTS.tourIslandClick, unlock);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
        document.removeEventListener(BX_EVENTS.tourIslandClick, unlock);
      };
    }

    let checkinTimer: number | undefined;
    if (step.autoCheckin) checkinTimer = window.setTimeout(doCheckin, 700);
    bxStore.update((s) => { s.onboarding.step = idx; });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      if (checkinTimer) window.clearTimeout(checkinTimer);
    };
  }, [active, idx, step, doCheckin]);

  const next = () => {
    if (step?.forced && !unlocked) {
      setHint("👆 請先點擊高亮區域才能繼續");
      return;
    }
    if (idx + 1 >= STEPS.length) {
      finish();
      return;
    }
    setIdx((v) => v + 1);
  };

  if (!active || !step) return null;

  return (
    <div className={`bx-tour ${leaving ? "bx-tour--out" : ""}`} role="dialog" aria-label="新手導覽">
      <div className="bx-tour__mask" />
      <div
        ref={cardRef}
        className={`bx-tour__card ${pos.center ? "bx-tour__card--center" : ""}`}
        style={pos.center ? undefined : { top: pos.top, left: pos.left }}
      >
        <button type="button" className="bx-tour__skip" onClick={skip}>跳過導覽</button>
        <h3 className="bx-tour__title">{step.title}</h3>
        <p className="bx-tour__body" dangerouslySetInnerHTML={{ __html: step.body }} />
        <div className="bx-tour__dots">
          {STEPS.map((s, i) => (
            <span key={s.id} className={`bx-dot ${i === idx ? "bx-dot--on" : ""} ${i < idx ? "bx-dot--done" : ""}`} />
          ))}
        </div>
        <div className="bx-tour__actions">
          <button
            type="button"
            className={`bx-btn bx-btn--primary ${step.forced && !unlocked ? "bx-btn--disabled" : ""}`}
            disabled={step.forced && !unlocked}
            onClick={next}
          >
            {idx === STEPS.length - 1 ? "開始探險 ⚓" : "下一步"}
          </button>
        </div>
        {hint ? <p className="bx-tour__hint">{hint}</p> : null}
      </div>
    </div>
  );
}
