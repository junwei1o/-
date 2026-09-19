import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";
import {
  buildMeteorWaves,
  METEOR_ENERGY_MAX,
  METEOR_MODE_INFO,
  METEOR_WAVE_TIME,
  meteorStars,
  type MeteorMode,
  type MeteorSpec,
  type MeteorWave,
} from "@/lib/classroomBank";
import "./classroom.css";

type Props = {
  muted?: boolean;
  onExit: () => void;
  onBest?: (record: { stars: number; score: number; correct: number; total: number }) => void;
  bestStars?: number;
  bestScore?: number;
};

type Phase = "start" | "tutorial" | "play" | "waveEnd" | "result";

type ActiveMeteor = MeteorSpec & { spawnedAt: number };

type Fragment = {
  id: string;
  x: number;
  top: number;
  value: number;
  isBomb: boolean;
  side: "l" | "r";
  dx: number;
  dy: number;
  rot: number;
};

type Flash = { text: string; kind: "ok" | "no" } | null;

const SCORE_PER_HIT = 10;
const CHAIN_BONUS_STEP = 5;
const HIT_ENERGY = 1;
const WRONG_COST = 1;
const MISS_COST = 2;
const BOMB_DRAG_COST = 3;
const TICK_MS = 200;
const TUTORIAL_KEY = "xue-meteor-tutorial-v1";

/**
 * 倍數防衛戰（四模式版）：關關換模式——點擊／劃切（漂浮隕石）、拖拽（把目標倍數拖進基地回收槽，
 * 拖錯會爆炸、拖到炸彈大爆炸）、混合（空中用點／切＋底部要拖）。同一刀連斬多顆有加成；
 * 漂浮隕石藏炸彈，切到／點到直接結束。附新手教學關（點擊→劃切→拖拽三步實作講解）。
 */
export default function MeteorGame({ muted = false, onExit, onBest, bestStars, bestScore }: Props) {
  const [waves, setWaves] = useState<MeteorWave[]>(() => buildMeteorWaves(3));
  const [phase, setPhase] = useState<Phase>("start");
  const [waveIndex, setWaveIndex] = useState(0);
  const [active, setActive] = useState<ActiveMeteor[]>([]);
  const [frags, setFrags] = useState<Fragment[]>([]);
  const [energy, setEnergy] = useState(METEOR_ENERGY_MAX);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(METEOR_WAVE_TIME);
  const [flash, setFlash] = useState<Flash>(null);
  const [lost, setLost] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  const [fieldSize, setFieldSize] = useState({ w: 0, h: 0 });
  const [trayLeft, setTrayLeft] = useState<MeteorSpec[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [tutStep, setTutStep] = useState(0);
  const [tutSelected, setTutSelected] = useState(false);
  const [tutDrag, setTutDrag] = useState<{ dx: number; dy: number } | null>(null);
  const tutDragActiveRef = useRef(false);
  const tutDragStartRef = useRef({ x: 0, y: 0 });
  const tutMovedRef = useRef(false);
  const tutSlashRef = useRef(false);
  const [tutorialDone, setTutorialDone] = useState(() => {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === "done";
    } catch {
      return true;
    }
  });

  const play = useClassroomSound(muted);
  const wavesRef = useRef(waves);
  const waveIndexRef = useRef(0);
  const meteorsRef = useRef<ActiveMeteor[]>([]);
  const trayLeftRef = useRef<MeteorSpec[]>([]);
  const droppedRef = useRef<Set<string>>(new Set());
  const energyRef = useRef(METEOR_ENERGY_MAX);
  const scoreRef = useRef(0);
  const mistakesRef = useRef(0);
  const hitsRef = useRef(0);
  const spawnCursorRef = useRef(0);
  const waveStartRef = useRef(0);
  const flashTimerRef = useRef<number | null>(null);
  const reportedRef = useRef(false);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const slashingRef = useRef(false);
  const chainCountRef = useRef(0);
  const dragRef = useRef<{ id: string; startX: number; startY: number } | null>(null);
  const movedRef = useRef(false);
  const fragTimersRef = useRef<number[]>([]);

  useEffect(() => {
    wavesRef.current = waves;
  }, [waves]);

  useEffect(() => {
    const timers = fragTimersRef;
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const showFlash = useCallback((text: string, kind: "ok" | "no") => {
    setFlash({ text, kind });
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 900);
  }, []);

  const finish = useCallback(
    (didLose: boolean) => {
      const totalTargets = wavesRef.current.reduce(
        (sum, wave) => sum + wave.meteors.filter((m) => m.isTarget).length + wave.tray.filter((m) => m.isTarget).length,
        0,
      );
      const stars = didLose ? 1 : meteorStars(mistakesRef.current);
      setLost(didLose);
      setPhase("result");
      setActive([]);
      setFrags([]);
      setTrail([]);
      setTrayLeft([]);
      setDragOffset(null);
      setSelectedId(null);
      slashingRef.current = false;
      dragRef.current = null;
      meteorsRef.current = [];
      play(didLose ? "no" : "win");
      if (!reportedRef.current && stars > (bestStars ?? 0)) {
        reportedRef.current = true;
        setNewBest(true);
        onBest?.({ stars, score: scoreRef.current, correct: hitsRef.current, total: totalTargets });
      }
      window.scrollTo({ top: 0 });
    },
    [bestStars, onBest, play],
  );

  const endWave = useCallback(() => {
    // 拖拽／混合波：沒拖進基地的目標泡泡算漏接。
    const wave = wavesRef.current[waveIndexRef.current];
    if (wave && wave.tray.length > 0) {
      const missedTray = wave.tray.filter((m) => m.isTarget && !droppedRef.current.has(m.id));
      if (missedTray.length > 0) {
        mistakesRef.current += missedTray.length;
        setMistakes(mistakesRef.current);
        energyRef.current -= MISS_COST * missedTray.length;
        setEnergy(Math.max(0, energyRef.current));
        showFlash(`${missedTray.length} 顆目標沒拖進基地，−${MISS_COST * missedTray.length} 能源`, "no");
      }
    }
    if (energyRef.current <= 0) {
      finish(true);
      return;
    }
    meteorsRef.current = [];
    setActive([]);
    setTrayLeft([]);
    if (waveIndexRef.current + 1 >= wavesRef.current.length) {
      finish(false);
    } else {
      setPhase("waveEnd");
      window.scrollTo({ top: 0 });
    }
  }, [finish, showFlash]);

  const beginWave = useCallback((index: number) => {
    waveIndexRef.current = index;
    setWaveIndex(index);
    spawnCursorRef.current = 0;
    meteorsRef.current = [];
    setActive([]);
    droppedRef.current = new Set();
    trayLeftRef.current = [...wavesRef.current[index].tray];
    setTrayLeft([...trayLeftRef.current]);
    setSelectedId(null);
    setDragOffset(null);
    waveStartRef.current = Date.now();
    setTimeLeft(METEOR_WAVE_TIME);
    setPhase("play");
    window.scrollTo({ top: 0 });
  }, []);

  const begin = useCallback(() => {
    const fresh = buildMeteorWaves(3);
    wavesRef.current = fresh;
    setWaves(fresh);
    energyRef.current = METEOR_ENERGY_MAX;
    setEnergy(METEOR_ENERGY_MAX);
    scoreRef.current = 0;
    setScore(0);
    mistakesRef.current = 0;
    setMistakes(0);
    hitsRef.current = 0;
    setHits(0);
    setLost(false);
    setNewBest(false);
    reportedRef.current = false;
    setFlash(null);
    beginWave(0);
  }, [beginWave]);

  /** 切開漂浮隕石：分裂成左右兩半飛散墜落。 */
  const spawnFragments = useCallback((meteor: ActiveMeteor) => {
    const progress = Math.min(1, (Date.now() - meteor.spawnedAt) / meteor.durationMs);
    const top = 6 + progress * 78;
    const dx = 26 + Math.random() * 22;
    const dy = 30 + Math.random() * 26;
    const rot = 60 + Math.random() * 60;
    const pair: Fragment[] = [
      { id: `${meteor.id}-l`, side: "l", x: meteor.x, top, value: meteor.value, isBomb: meteor.isBomb, dx: -dx, dy, rot: -rot },
      { id: `${meteor.id}-r`, side: "r", x: meteor.x, top, value: meteor.value, isBomb: meteor.isBomb, dx, dy, rot },
    ];
    setFrags((previous) => [...previous, ...pair]);
    const timer = window.setTimeout(() => {
      setFrags((previous) => previous.filter((f) => f.id !== pair[0].id && f.id !== pair[1].id));
    }, 700);
    fragTimersRef.current.push(timer);
  }, []);

  /** 切割／點擊漂浮隕石。 */
  const slice = useCallback(
    (meteor: ActiveMeteor) => {
      if (phase !== "play") return;
      if (!meteorsRef.current.some((m) => m.id === meteor.id)) return;
      meteorsRef.current = meteorsRef.current.filter((m) => m.id !== meteor.id);
      setActive([...meteorsRef.current]);
      spawnFragments(meteor);

      if (meteor.isBomb) {
        play("no");
        showFlash("💀 切到炸彈了！", "no");
        finish(true);
        return;
      }
      if (meteor.isTarget) {
        chainCountRef.current += 1;
        const bonus = (chainCountRef.current - 1) * CHAIN_BONUS_STEP;
        hitsRef.current += 1;
        setHits(hitsRef.current);
        scoreRef.current += SCORE_PER_HIT + bonus;
        setScore(scoreRef.current);
        energyRef.current = Math.min(METEOR_ENERGY_MAX, energyRef.current + HIT_ENERGY);
        setEnergy(energyRef.current);
        play("ok");
        showFlash(
          bonus > 0 ? `⚡ 連斬 ×${chainCountRef.current}！+${SCORE_PER_HIT + bonus} 分` : `+${SCORE_PER_HIT} 分，切中了！`,
          "ok",
        );
      } else {
        mistakesRef.current += 1;
        setMistakes(mistakesRef.current);
        energyRef.current -= WRONG_COST;
        setEnergy(Math.max(0, energyRef.current));
        play("no");
        showFlash(`${meteor.value} 不是 ${wavesRef.current[waveIndexRef.current].multipleOf} 的倍數，−1 能源`, "no");
        if (energyRef.current <= 0) finish(true);
      }
    },
    [finish, phase, play, showFlash, spawnFragments],
  );

  /** 拖拽泡泡放進回收槽：拖對得分、拖錯爆炸、拖到炸彈大爆炸。 */
  const dropTray = useCallback(
    (meteor: MeteorSpec) => {
      if (phase !== "play") return;
      droppedRef.current.add(meteor.id);
      trayLeftRef.current = trayLeftRef.current.filter((m) => m.id !== meteor.id);
      setTrayLeft([...trayLeftRef.current]);
      setSelectedId(null);
      if (meteor.isBomb) {
        mistakesRef.current += 1;
        setMistakes(mistakesRef.current);
        energyRef.current -= BOMB_DRAG_COST;
        setEnergy(Math.max(0, energyRef.current));
        play("no");
        showFlash(`💣 炸彈爆炸！−${BOMB_DRAG_COST} 能源`, "no");
        if (energyRef.current <= 0) finish(true);
      } else if (meteor.isTarget) {
        hitsRef.current += 1;
        setHits(hitsRef.current);
        scoreRef.current += SCORE_PER_HIT;
        setScore(scoreRef.current);
        energyRef.current = Math.min(METEOR_ENERGY_MAX, energyRef.current + HIT_ENERGY);
        setEnergy(energyRef.current);
        play("ok");
        showFlash(`+${SCORE_PER_HIT} 分，拖對了！`, "ok");
      } else {
        mistakesRef.current += 1;
        setMistakes(mistakesRef.current);
        energyRef.current -= WRONG_COST;
        setEnergy(Math.max(0, energyRef.current));
        play("no");
        showFlash(`💥 爆炸！${meteor.value} 不是 ${wavesRef.current[waveIndexRef.current].multipleOf} 的倍數，−1 能源`, "no");
        if (energyRef.current <= 0) finish(true);
      }
    },
    [finish, phase, play, showFlash],
  );

  // 遊戲主迴圈：出隕石、推進落地進度、漏接判定、波次倒數（拖拽波沒有漂浮隕石，只倒數）。
  useEffect(() => {
    if (phase !== "play") return;
    const wave = wavesRef.current[waveIndexRef.current];
    if (!wave) return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - waveStartRef.current;

      while (
        spawnCursorRef.current < wave.meteors.length &&
        wave.meteors[spawnCursorRef.current].delayMs <= elapsed
      ) {
        const spec = wave.meteors[spawnCursorRef.current];
        meteorsRef.current = [...meteorsRef.current, { ...spec, spawnedAt: waveStartRef.current + spec.delayMs }];
        spawnCursorRef.current += 1;
      }

      const remaining: ActiveMeteor[] = [];
      let leaked = false;
      for (const meteor of meteorsRef.current) {
        const progress = (Date.now() - meteor.spawnedAt) / meteor.durationMs;
        if (progress < 1) remaining.push(meteor);
        else if (meteor.isTarget) {
          leaked = true;
          mistakesRef.current += 1;
          setMistakes(mistakesRef.current);
          energyRef.current -= MISS_COST;
          setEnergy(Math.max(0, energyRef.current));
        }
      }
      if (leaked) {
        play("no");
        showFlash(`漏接目標隕石，−${MISS_COST} 能源`, "no");
      }
      meteorsRef.current = remaining;
      setActive([...remaining]);
      setTimeLeft(Math.max(0, METEOR_WAVE_TIME - Math.floor(elapsed / 1000)));

      if (energyRef.current <= 0) {
        window.clearInterval(timer);
        finish(true);
        return;
      }
      if (elapsed >= METEOR_WAVE_TIME * 1000) {
        window.clearInterval(timer);
        endWave();
        return;
      }
      // 提前過波：隕石全spawn完、場上清空、托盤也處理完，不必乾等倒數。
      const allSpawned = spawnCursorRef.current >= wave.meteors.length;
      const trayCleared = wave.tray.length === 0 || trayLeftRef.current.length === 0;
      if (allSpawned && meteorsRef.current.length === 0 && trayCleared && elapsed > 2500) {
        window.clearInterval(timer);
        endWave();
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase, endWave, finish, play, showFlash]);

  // ---- 劃切：pointer 軌跡 + 命中漂浮隕石 ----
  const onSlashStart = (e: React.PointerEvent) => {
    if (phase !== "play") return;
    slashingRef.current = true;
    chainCountRef.current = 0;
    const rect = fieldRef.current?.getBoundingClientRect();
    if (rect) {
      setFieldSize({ w: rect.width, h: rect.height });
      setTrail([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
  };

  const onSlashMove = (e: React.PointerEvent) => {
    if (phase !== "play") return;
    // 正在拖拽泡泡時不做劃切判定。
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > 8) movedRef.current = true;
      setDragOffset({ id: dragRef.current.id, dx, dy });
      return;
    }
    if (!slashingRef.current) return;
    const rect = fieldRef.current?.getBoundingClientRect();
    if (rect) {
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setTrail((previous) => [...previous.slice(-30), point]);
    }
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const bubble = hit instanceof Element ? hit.closest(".md-meteor") : null;
    const mid = bubble?.getAttribute("data-mid");
    if (mid) {
      const meteor = meteorsRef.current.find((m) => m.id === mid);
      if (meteor) slice(meteor);
    }
  };

  const onSlashEnd = (e?: React.PointerEvent) => {
    if (dragRef.current && e) {
      const id = dragRef.current.id;
      const rect = slotRef.current?.getBoundingClientRect();
      const inside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      dragRef.current = null;
      setDragOffset(null);
      if (inside) {
        const meteor = trayLeftRef.current.find((m) => m.id === id);
        if (meteor) dropTray(meteor);
      }
      return;
    }
    slashingRef.current = false;
    window.setTimeout(() => setTrail([]), 160);
  };

  const onTrayPointerDown = (meteor: MeteorSpec, e: React.PointerEvent) => {
    if (phase !== "play") return;
    e.stopPropagation();
    dragRef.current = { id: meteor.id, startX: e.clientX, startY: e.clientY };
    movedRef.current = false;
    setDragOffset({ id: meteor.id, dx: 0, dy: 0 });
  };

  const onTrayClick = (meteor: MeteorSpec) => {
    if (phase !== "play" || movedRef.current) return;
    // 沒真的拖動就當成「點選」，再點回收槽放下（無障礙／不會拖的小朋友）。
    setSelectedId((previous) => (previous === meteor.id ? null : meteor.id));
  };

  const onSlotClick = () => {
    if (phase !== "play" || !selectedId) return;
    const meteor = trayLeftRef.current.find((m) => m.id === selectedId);
    if (meteor) dropTray(meteor);
  };

  // ---- 新手教學 ----
  const startTutorial = () => {
    setTutStep(0);
    setTutSelected(false);
    setTutDrag(null);
    tutDragActiveRef.current = false;
    tutMovedRef.current = false;
    tutSlashRef.current = false;
    setPhase("tutorial");
    window.scrollTo({ top: 0 });
  };

  const advanceTut = (step: number) => {
    play("ok");
    setTutStep(step);
    window.scrollTo({ top: 0 });
  };

  const finishTutorial = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, "done");
    } catch {
      /* 存不了就下次再教 */
    }
    setTutorialDone(true);
    play("win");
    setTutStep(4);
    window.scrollTo({ top: 0 });
  };

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">☄️</span>
          <h2>倍數防衛戰</h2>
          <p>
            三種操作、關關換模式：<b>點擊</b>目標倍數、用手指<b>劃切</b>隕石、把泡泡<b>拖拽</b>進基地回收槽，
            還有關卡會混合出題！切錯、拖錯會爆炸，<b>漂浮炸彈切到就結束</b>，看準再出手！
          </p>
          <div className="cr-rules">
            <span className="cr-rule-chip">4 種模式隨機抽 3 波</span>
            <span className="cr-rule-chip">每波 42 秒</span>
            <span className="cr-rule-chip">一刀連斬有加成</span>
            <span className="cr-rule-chip">💣 漂浮炸彈切到就結束</span>
          </div>
          {!tutorialDone && (
            <p className="md-start-tip">👋 第一次玩？先花 60 秒完成新手教學，學會點擊、劃切、拖拽三種操作！</p>
          )}
          <button type="button" className="cr-btn" onClick={begin}>開始防衛</button>
          <button type="button" className="cr-btn-ghost md-tutorial-btn" onClick={startTutorial}>
            🎓 新手教學{tutorialDone ? "（再看一次）" : ""}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "tutorial") {
    return (
      <div className="cr-page">
        <div className="cr-top">
          <button type="button" className="cr-back" onClick={() => setPhase("start")}>← 回開始頁</button>
          <span className="cr-tag sea">新手教學 {tutStep + 1} / 5</span>
        </div>
        {tutStep === 0 && (
          <div className="cr-q-card" role="status">
            <h3 className="md-wave-end-title">三種操作，一起學會！</h3>
            <div className="md-tut-list">
              <p>👆 <b>點擊</b>：目標倍數的泡泡出現時，快速點它一下就得分。</p>
              <p>✂️ <b>劃切</b>：用手指在場上滑過泡泡，像切水果一樣把它切開；同一刀連斬多顆更划算。</p>
              <p>🎯 <b>拖拽</b>：按住泡泡拖進「基地回收槽」；拖錯位置會爆炸，炸彈拖進去會大爆炸！</p>
              <p>💣 漂浮的炸彈千萬別切、別點，切到能源直接歸零。</p>
            </div>
            <button type="button" className="cr-btn sea md-next-wave" onClick={() => advanceTut(1)}>開始練習 →</button>
          </div>
        )}
        {tutStep > 0 && tutStep < 4 && (
          <div className="cr-q-card">
            <span className="cr-q-meta">數學 · 五上 · 倍數與因數</span>
            <p className="cr-q-prompt md-tut-ask">
              {tutStep === 1 && <>【點擊練習】任務「2 的倍數」：<b>點一下</b>下面是 2 的倍數的泡泡！</>}
              {tutStep === 2 && <>【劃切練習】任務「2 的倍數」：用手指<b>滑過</b>下面 2 的倍數的泡泡，把它切開！</>}
              {tutStep === 3 && <>【拖拽練習】任務「2 的倍數」：<b>按住</b> 2 的倍數的泡泡<b>拖進</b>基地回收槽（也可以先點泡泡、再點回收槽）。</>}
            </p>
            <div
              className="md-field md-tut-field"
              onPointerDown={(e) => {
                if (tutStep !== 2) return;
                tutSlashRef.current = true;
                void e;
              }}
              onPointerMove={(e) => {
                // 劃切練習跟正式遊戲同規則：按住（任意處）滑過泡泡就算切到。
                if (tutStep !== 2 || !tutSlashRef.current) return;
                const hit = document.elementFromPoint(e.clientX, e.clientY);
                if (hit instanceof Element && hit.closest(".md-meteor")) {
                  tutSlashRef.current = false;
                  advanceTut(3);
                }
              }}
              onPointerUp={() => { if (tutStep === 2) tutSlashRef.current = false; }}
              onPointerCancel={() => { if (tutStep === 2) tutSlashRef.current = false; }}
            >
              {tutStep === 1 && (
                <button type="button" className="md-meteor md-tut-bubble" style={{ left: "50%", top: "30%" }} aria-label="隕石 12" onClick={() => advanceTut(2)}>12</button>
              )}
              {tutStep === 2 && (
                <button
                  type="button"
                  className="md-meteor md-tut-bubble"
                  style={{ left: "50%", top: "30%" }}
                  aria-label="隕石 14"
                  onClick={() => advanceTut(3)}
                >14</button>
              )}
              {tutStep === 3 && (
                <>
                  <button
                    type="button"
                    className={`md-meteor md-tut-bubble${tutSelected ? " is-selected" : ""}`}
                    style={tutDrag ? { transform: `translate(calc(-50% + ${tutDrag.dx}px), calc(-50% + ${tutDrag.dy}px))` } : { left: "50%", top: "22%" }}
                    aria-label="隕石 20"
                    onPointerDown={(e) => {
                      // 真拖拽：按住移動，放手在回收槽上完成教學（指標捕捉讓手勢跟手）。
                      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 無 capture 就用點選後備 */ }
                      tutDragActiveRef.current = true;
                      tutMovedRef.current = false;
                      tutDragStartRef.current = { x: e.clientX, y: e.clientY };
                      setTutDrag({ dx: 0, dy: 0 });
                    }}
                    onPointerMove={(e) => {
                      if (!tutDragActiveRef.current) return;
                      const dx = e.clientX - tutDragStartRef.current.x;
                      const dy = e.clientY - tutDragStartRef.current.y;
                      if (Math.hypot(dx, dy) > 8) tutMovedRef.current = true;
                      setTutDrag({ dx, dy });
                    }}
                    onPointerUp={(e) => {
                      if (!tutDragActiveRef.current) return;
                      tutDragActiveRef.current = false;
                      const moved = tutMovedRef.current;
                      setTutDrag(null);
                      if (!moved) return; // 沒真的拖動 → 留給 onClick 當「點選」
                      const rect = slotRef.current?.getBoundingClientRect();
                      if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        finishTutorial();
                      }
                    }}
                    onPointerCancel={() => {
                      tutDragActiveRef.current = false;
                      setTutDrag(null);
                    }}
                    onClick={() => {
                      if (!tutMovedRef.current) setTutSelected((v) => !v);
                    }}
                  >20</button>
                  <div
                    ref={slotRef}
                    className={`md-slot md-tut-slot${tutSelected ? " is-active" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label="基地回收槽"
                    onClick={() => {
                      if (tutSelected) finishTutorial();
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && tutSelected) {
                        e.preventDefault();
                        finishTutorial();
                      }
                    }}
                  >🎯 基地回收槽</div>
                </>
              )}
            </div>
            {tutStep === 3 && <p className="md-start-tip">提示：把泡泡拖到回收槽上放手；或先點泡泡讓它亮起來，再點回收槽。</p>}
          </div>
        )}
        {tutStep === 4 && (
          <div className="cr-result" role="status">
            <p className="cr-result-kicker">新手教學完成</p>
            <h2 className="cr-result-title">🎓 三種操作都學會了！</h2>
            <p className="cr-result-sub">點擊、劃切、拖拽都會了，加上混合模式——去守衛基地吧！</p>
            <div className="cr-actions">
              <button type="button" className="cr-btn-ghost" onClick={() => setPhase("start")}>回開始頁</button>
              <button type="button" className="cr-btn sea" onClick={begin}>開始防衛</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === "result") {
    const totalTargets = waves.reduce(
      (sum, wave) => sum + wave.meteors.filter((m) => m.isTarget).length + wave.tray.filter((m) => m.isTarget).length,
      0,
    );
    const stars = lost ? 1 : meteorStars(mistakes);
    return (
      <div className="cr-page">
        <div className="cr-result" role="status" aria-label="倍數防衛戰結果">
          <p className="cr-result-kicker">倍數防衛戰</p>
          {lost ? (
            <>
              <h2 className="cr-result-title">💔 基地能源耗盡！</h2>
              <p className="cr-result-sub">這次獲得了 {score} 分。別灰心，用特徵再試一次！</p>
            </>
          ) : (
            <>
              <h2 className="cr-result-title">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</h2>
              <p className="cr-result-sub">
                三波全撐完，處理 {hits} / {totalTargets} 個目標，獲得 {score} 分
                {mistakes > 0 ? `，共 ${mistakes} 次失誤` : "，全程零失誤！"}
              </p>
            </>
          )}
          <p className="cr-result-metric">2 看個位（0/2/4/6/8）、5 看個位（0/5）、3 和 9 看數字和、同時是 2 和 5 的倍數個位必是 0</p>
          {newBest && <span className="cr-result-newbest">寫下新紀錄！</span>}
          <div className="cr-actions">
            <button type="button" className="cr-btn-ghost" onClick={onExit}>回我的教室</button>
            <button type="button" className="cr-btn sea" onClick={begin}>重新挑戰</button>
          </div>
        </div>
      </div>
    );
  }

  const wave = waves[waveIndex];

  if (phase === "waveEnd") {
    return (
      <div className="cr-page">
        <div className="cr-top">
          <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
          <span className="cr-tag sea">倍數防衛戰</span>
        </div>
        <div className="cr-q-card" role="status">
          <span className="cr-q-meta">數學 · 五上 · 倍數與因數｜{METEOR_MODE_INFO[wave.mode].title}</span>
          <h3 className="md-wave-end-title">第 {waveIndex + 1} 波擊退！基地還剩 {energy} / {METEOR_ENERGY_MAX} 能源</h3>
          <p className="cr-hint is-ok">
            本波任務「{wave.label}」：處理 {hits} 個目標、失誤 {mistakes} 次、目前 {score} 分。
          </p>
          <div className="md-hint-box" aria-label="教學註記">
            <p className="md-hint-title">💡 特徵小筆記</p>
            <p className="md-hint-body">{wave.hint}</p>
          </div>
          <button type="button" className="cr-btn sea md-next-wave" onClick={() => beginWave(waveIndexRef.current + 1)}>
            迎接下一波 →
          </button>
        </div>
      </div>
    );
  }

  // phase === "play"
  const trailPoints = trail.map((p) => `${p.x},${p.y}`).join(" ");
  const isDragWave = wave.mode === "drag" || wave.mode === "mixed";
  return (
    <div className="cr-page">
      <div className="cr-top">
        <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
        <span className="cr-tag sea">倍數防衛戰</span>
        <span className="cr-spacer" />
        <span className={`cr-stat cr-countdown${timeLeft <= 5 ? " is-urgent" : ""}`} role="timer">
          ⏱ {timeLeft}s
        </span>
      </div>

      <div className="cr-stats">
        <span className="cr-stat">第 <b>{waveIndex + 1}</b> / {waves.length} 波</span>
        <span className="cr-stat">分數 <b className="md-score">{score}</b></span>
        <span className="cr-stat">能源 <b className="md-energy-num">{energy}</b> / {METEOR_ENERGY_MAX}</span>
        <span className="cr-stat">失誤 <b>{mistakes}</b></span>
      </div>
      <div className="md-energybar" role="progressbar" aria-label="基地能源" aria-valuemin={0} aria-valuemax={METEOR_ENERGY_MAX} aria-valuenow={energy}>
        <i className={`md-energy-fill${energy <= 5 ? " is-low" : ""}`} style={{ width: `${(energy / METEOR_ENERGY_MAX) * 100}%` }} />
      </div>

      <div className="md-wavebanner" aria-live="polite">
        第 {waveIndex + 1} 波：{wave.label}｜{METEOR_MODE_INFO[wave.mode].title}
      </div>
      <p className="md-modehint">{METEOR_MODE_INFO[wave.mode].desc}</p>

      <div
        ref={fieldRef}
        className={`md-field${wave.mode === "drag" ? " md-field--drag" : ""}`}
        onPointerDown={onSlashStart}
        onPointerMove={onSlashMove}
        onPointerUp={onSlashEnd}
        onPointerCancel={onSlashEnd}
        onPointerLeave={onSlashEnd}
      >
        {flash && (
          <span className={`md-flash ${flash.kind === "ok" ? "is-ok" : "is-no"}`} role="status">{flash.text}</span>
        )}
        {trail.length > 1 && fieldSize.w > 0 && (
          <svg className="md-trail" viewBox={`0 0 ${fieldSize.w} ${fieldSize.h}`} aria-hidden="true">
            <polyline points={trailPoints} fill="none" stroke="rgba(232,117,74,0.9)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={trailPoints} fill="none" stroke="rgba(255,253,246,0.95)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {frags.map((f) => (
          <span
            key={f.id}
            className={`md-frag md-frag-${f.side}${f.isBomb ? " is-bomb" : ""}`}
            style={{
              left: `${f.x}%`,
              top: `${f.top}%`,
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
              "--rot": `${f.rot}deg`,
            } as React.CSSProperties}
            aria-hidden="true"
          >
            {f.isBomb ? "💣" : f.value}
          </span>
        ))}
        {active.map((meteor) => {
          const progress = Math.min(1, (Date.now() - meteor.spawnedAt) / meteor.durationMs);
          return (
            <button
              type="button"
              key={meteor.id}
              data-mid={meteor.id}
              className={`md-meteor${meteor.isBomb ? " is-bomb" : ""}`}
              style={{ left: `${meteor.x}%`, top: `${6 + progress * 70}%` }}
              aria-label={meteor.isBomb ? "炸彈" : `隕石 ${meteor.value}`}
              onClick={() => slice(meteor)}
            >
              {meteor.isBomb ? "" : meteor.value}
            </button>
          );
        })}
        {isDragWave && (
          <div className={`md-traywrap${wave.mode === "drag" ? " md-traywrap--full" : ""}`}>
            <div className="md-tray">
              {trayLeft.map((m) => {
                const isDragging = dragOffset?.id === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    data-mid={m.id}
                    className={`md-meteor md-static${m.isBomb ? " is-bomb" : ""}${selectedId === m.id ? " is-selected" : ""}`}
                    style={isDragging ? { transform: `translate(${dragOffset.dx}px, ${dragOffset.dy}px)` } : undefined}
                    aria-label={m.isBomb ? "炸彈" : `泡泡 ${m.value}`}
                    onPointerDown={(e) => onTrayPointerDown(m, e)}
                    onClick={() => onTrayClick(m)}
                  >
                    {m.isBomb ? "" : m.value}
                  </button>
                );
              })}
            </div>
            <div ref={slotRef} className={`md-slot${selectedId ? " is-active" : ""}`} role="button" aria-label="基地回收槽" onClick={onSlotClick}>
              🎯 基地回收槽{selectedId ? "（再點一下放下）" : "（把目標倍數拖進來）"}
            </div>
          </div>
        )}
        <span className="md-base" aria-hidden="true">🛡 倍數防衛基地（{METEOR_MODE_INFO[wave.mode].title}）</span>
      </div>
    </div>
  );
}
