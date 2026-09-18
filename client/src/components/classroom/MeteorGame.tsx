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

type Flash = { text: string; kind: "ok" | "no" } | null;

const SCORE_PER_HIT = 10;
const HIT_ENERGY = 1;
const WRONG_COST = 1;
const MISS_COST = 2;
const TICK_MS = 200;

/**
 * 倍數防衛戰：隕石帶著數字落下，快速點擊「目標倍數」攔截（+10 分、回 1 能量），
 * 誤觸非倍數 −1 能量、漏接目標隕石 −2 能量；基地能量耗盡就結束。
 * 三波：2 的倍數 → 5 的倍數 → 同時是 2 和 5 的倍數（10 的倍數），波次結束揭曉個位數特徵。
 */
export default function MeteorGame({ muted = false, onExit, onBest, bestStars, bestScore }: Props) {
  const [waves, setWaves] = useState<MeteorWave[]>(() => buildMeteorWaves(3));
  const [phase, setPhase] = useState<Phase>("start");
  const [waveIndex, setWaveIndex] = useState(0);
  const [active, setActive] = useState<ActiveMeteor[]>([]);
  const [energy, setEnergy] = useState(METEOR_ENERGY_MAX);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(METEOR_WAVE_TIME);
  const [flash, setFlash] = useState<Flash>(null);
  const [lost, setLost] = useState(false);
  const [newBest, setNewBest] = useState(false);

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

  useEffect(() => {
    wavesRef.current = waves;
  }, [waves]);

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

  const tap = useCallback(
    (meteor: ActiveMeteor) => {
      if (phase !== "play") return;
      meteorsRef.current = meteorsRef.current.filter((m) => m.id !== meteor.id);
      setActive([...meteorsRef.current]);
      if (meteor.isTarget) {
        hitsRef.current += 1;
        setHits(hitsRef.current);
        scoreRef.current += SCORE_PER_HIT;
        setScore(scoreRef.current);
        energyRef.current = Math.min(METEOR_ENERGY_MAX, energyRef.current + HIT_ENERGY);
        setEnergy(energyRef.current);
        play("ok");
        showFlash(`+${SCORE_PER_HIT} 分，攔截成功！`, "ok");
      } else {
        mistakesRef.current += 1;
        setMistakes(mistakesRef.current);
        energyRef.current -= WRONG_COST;
        setEnergy(Math.max(0, energyRef.current));
        play("no");
        showFlash(`${meteor.value} 不是 ${wavesRef.current[waveIndexRef.current].multipleOf} 的倍數，−1 能量`, "no");
        if (energyRef.current <= 0) finish(true);
      }
    },
    [finish, phase, play, showFlash],
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

      // 落地判定：目標隕石漏接 −2 能量，干擾隕石落地無事。
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
        showFlash(`漏接目標隕石，−${MISS_COST} 能量`, "no");
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

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">☄️</span>
          <h2>倍數防衛戰</h2>
          <p>
            帶著數字的隕石正朝基地飛來！看清楚每一波的任務，隕石上是目標的「倍數」就趕快點它攔截下來；
            不是倍數的隕石不用管，讓它安全落地。誤觸會傷基地、漏接目標隕石更傷，守住 15 格能源撐完三波！
          </p>
          <div className="cr-rules">
            <span className="cr-rule-chip">共 3 波</span>
            <span className="cr-rule-chip">每波 42 秒</span>
            <span className="cr-rule-chip">點倍數攔截 +10 分</span>
            <span className="cr-rule-chip">能源歸零就結束</span>
          </div>
          <p className="md-start-tip">
            小技巧：2 的倍數個位是 0、2、4、6、8；5 的倍數個位是 0 或 5——用個位數特徵攔截最快！
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
              <p className="cr-result-sub">這次獲得了 {score} 分。別灰心，用個位數特徵再試一次！</p>
            </>
          ) : (
            <>
              <h2 className="cr-result-title">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</h2>
              <p className="cr-result-sub">
                三波全撐完，攔截 {hits} / {totalTargets} 顆目標隕石，獲得 {score} 分
                {mistakes > 0 ? `，共 ${mistakes} 次失誤` : "，全程零失誤！"}
              </p>
            </>
          )}
          <p className="cr-result-metric">2 的倍數看個位 0/2/4/6/8，5 的倍數看個位 0/5，同時是 2 和 5 的倍數個位必是 0</p>
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
            本波任務「{wave.label}」：攔截 {hits} 顆、失誤 {mistakes} 次、目前 {score} 分。
          </p>
          <div className="md-hint-box" aria-label="教學註記">
            <p className="md-hint-title">💡 個位數特徵小筆記</p>
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

      <div className="md-field">
        {flash && (
          <span className={`md-flash ${flash.kind === "ok" ? "is-ok" : "is-no"}`} role="status">{flash.text}</span>
        )}
        {active.map((meteor) => {
          const progress = Math.min(1, (Date.now() - meteor.spawnedAt) / meteor.durationMs);
          return (
            <button
              type="button"
              key={meteor.id}
              className="md-meteor"
              style={{ left: `${meteor.x}%`, top: `${6 + progress * 78}%` }}
              aria-label={`隕石 ${meteor.value}`}
              onClick={() => tap(meteor)}
            >
              {meteor.value}
            </button>
          );
        })}
        <span className="md-base" aria-hidden="true">🛡 倍數防衛基地（點擊目標倍數攔截隕石）</span>
      </div>
    </div>
  );
}
