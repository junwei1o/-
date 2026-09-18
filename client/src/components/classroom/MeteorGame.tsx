import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";
import {
  buildMeteorWaves,
  METEOR_ENERGY_MAX,
  METEOR_WAVE_TIME,
  meteorStars,
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

type Phase = "start" | "play" | "waveEnd" | "result";

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
const TICK_MS = 200;

/**
 * 倍數防衛戰（切水果版）：手指在場上滑動即可「切割」隕石——
 * 切中目標倍數 +10 分並回 1 能源，同一刀連斬多顆每顆再加 5 分；
 * 切錯非倍數 −1 能源、漏接目標隕石 −2 能源；場上混有炸彈，切到能源直接歸零。
 * 三波隨機組合：首波考 2 或 5 的倍數（個位數特徵暖身），其餘從 3、9、同時是 2 和 5 的倍數抽出；
 * 波次結束揭曉該波特徵的教學註記。點按仍可切割（無障礙／簡單操作）。
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

  const play = useClassroomSound(muted);
  const wavesRef = useRef(waves);
  const waveIndexRef = useRef(0);
  const meteorsRef = useRef<ActiveMeteor[]>([]);
  const energyRef = useRef(METEOR_ENERGY_MAX);
  const scoreRef = useRef(0);
  const mistakesRef = useRef(0);
  const hitsRef = useRef(0);
  const spawnCursorRef = useRef(0);
  const waveStartRef = useRef(0);
  const flashTimerRef = useRef<number | null>(null);
  const reportedRef = useRef(false);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const slashingRef = useRef(false);
  const chainCountRef = useRef(0);
  const fragTimersRef = useRef<number[]>([]);

  useEffect(() => {
    wavesRef.current = waves;
  }, [waves]);

  // 卸載時清掉所有 fragment 計時器，避免測試與嚴格模式告警。
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
      const totalTargets = wavesRef.current.reduce((sum, wave) => sum + wave.meteors.filter((m) => m.isTarget).length, 0);
      const stars = didLose ? 1 : meteorStars(mistakesRef.current);
      setLost(didLose);
      setPhase("result");
      setActive([]);
      setFrags([]);
      setTrail([]);
      slashingRef.current = false;
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
    meteorsRef.current = [];
    setActive([]);
    if (waveIndexRef.current + 1 >= wavesRef.current.length) {
      finish(false);
    } else {
      setPhase("waveEnd");
      window.scrollTo({ top: 0 });
    }
  }, [finish]);

  const beginWave = useCallback((index: number) => {
    waveIndexRef.current = index;
    setWaveIndex(index);
    spawnCursorRef.current = 0;
    meteorsRef.current = [];
    setActive([]);
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

  /** 切開隕石：分裂成左右兩半飛散墜落。 */
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

  /** 切割：滑動劃過或點按都會走到這裡。 */
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

  // 遊戲主迴圈：出隕石、推進落地進度、漏接判定、波次倒數。
  useEffect(() => {
    if (phase !== "play") return;
    const wave = wavesRef.current[waveIndexRef.current];
    if (!wave) return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - waveStartRef.current;

      // 出現時刻到的隕石依腳本登場。
      while (
        spawnCursorRef.current < wave.meteors.length &&
        wave.meteors[spawnCursorRef.current].delayMs <= elapsed
      ) {
        const spec = wave.meteors[spawnCursorRef.current];
        meteorsRef.current = [...meteorsRef.current, { ...spec, spawnedAt: waveStartRef.current + spec.delayMs }];
        spawnCursorRef.current += 1;
      }

      // 落地判定：目標隕石漏接 −2 能源，干擾隕石與炸彈落地無事。
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
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase, endWave, finish, play, showFlash]);

  // ---- 滑動切割：pointer 軌跡 + 命中場上隕石 ----
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
    if (!slashingRef.current || phase !== "play") return;
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

  const onSlashEnd = () => {
    slashingRef.current = false;
    window.setTimeout(() => setTrail([]), 160);
  };

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">☄️</span>
          <h2>倍數防衛戰</h2>
          <p>
            用手指在場上<b>滑動切割</b>隕石！切中這一波目標的「倍數」+10 分、回 1 能源；
            同一刀連斬多顆有連斬加成。切錯非倍數 −1 能源、漏接目標隕石 −2；
            場上藏有<b>炸彈</b>——切到能源直接歸零，看準再出手！
          </p>
          <div className="cr-rules">
            <span className="cr-rule-chip">共 3 波</span>
            <span className="cr-rule-chip">每波 42 秒</span>
            <span className="cr-rule-chip">一刀連斬有加成</span>
            <span className="cr-rule-chip">💣 切到就結束</span>
          </div>
          <p className="md-start-tip">
            小技巧：2 的倍數看個位 0/2/4/6/8；5 的倍數看個位 0/5；3 和 9 的倍數要把每個數字加起來看總和——每輪的三波都是隨機組合，隨時保持警覺！
          </p>
          <button type="button" className="cr-btn" onClick={begin}>開始防衛</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const totalTargets = waves.reduce((sum, wave) => sum + wave.meteors.filter((m) => m.isTarget).length, 0);
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
                三波全撐完，切中 {hits} / {totalTargets} 顆目標隕石，獲得 {score} 分
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
          <span className="cr-q-meta">數學 · 五上 · 倍數與因數</span>
          <h3 className="md-wave-end-title">第 {waveIndex + 1} 波擊退！基地還剩 {energy} / {METEOR_ENERGY_MAX} 能源</h3>
          <p className="cr-hint is-ok">
            本波任務「{wave.label}」：切中 {hits} 顆、失誤 {mistakes} 次、目前 {score} 分。
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

      <div className="md-wavebanner" aria-live="polite">第 {waveIndex + 1} 波：{wave.label}</div>

      <div
        ref={fieldRef}
        className="md-field"
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
            <polyline points={trailPoints} fill="none" stroke="rgba(232,132,58,0.9)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
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
              style={{ left: `${meteor.x}%`, top: `${6 + progress * 78}%` }}
              aria-label={meteor.isBomb ? "炸彈" : `隕石 ${meteor.value}`}
              onClick={() => slice(meteor)}
            >
              {meteor.isBomb ? "" : meteor.value}
            </button>
          );
        })}
        <span className="md-base" aria-hidden="true">🛡 倍數防衛基地（滑動切割目標倍數，小心炸彈）</span>
      </div>
    </div>
  );
}
