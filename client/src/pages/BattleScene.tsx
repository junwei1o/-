import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Eye, Gift, HeartPulse, ShieldCheck, Sparkles, Swords, Target, Volume2, VolumeX, WandSparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedHudValue } from "@/components/AnimatedHudValue";
import { applyBattleAction, applyBattleAnswer, beginBattleQuestion, createBattle, healBattleHp, RAGE_SKILL_DEFINITIONS } from "@/game/rpgBattle";
import { calculateBattlePerformance } from "@/game/rpgQuestionCombat";
import { combatStyleForCompanion } from "@/game/companionCombatStyles";
import { loadRpgState, recordRpgAnswer, saveRpgState } from "@/game/rpgStorage";
import { academyGearBonuses } from "@/game/academyQuestData";
import { resolveArenaCapture, settleArenaLoot, type ArenaCaptureOutcome, type ArenaLoot } from "@/game/arenaRewards";
import { arenaHabitatStatuses, encounterForArenaHabitat, selectArenaHabitat, selectedArenaHabitat } from "@/game/arenaHabitats";
import { getBattleTactics } from "@/game/battleTactics";
import { buildBattleDefeatReflection } from "@/game/battleDefeatReflection";
import { queueMapReinforcementReward, recordMapReinforcementJournalEntry, type MapReinforcementReward } from "@/game/mapReinforcementReward";
import { battleBackgroundForHabitat, battlePortraitForCompanion, battlePortraitForEncounter } from "@/game/battleVisuals";
import { getCombatFeedback, playCombatSfx } from "@/game/rpgCombatFeedback";
import { getComboCount, getCrisisLevel, getEnemyPhase } from "@/game/battleMomentum";
import { recordMapVictory } from "@/game/mapVictoryProgress";
import { getSpacedReviewSummary, loadAdaptiveProfile, recordAdaptiveAttempt, saveAdaptiveProfile, selectSpacedReviewQuestion, type AdaptiveDifficulty, type AdaptiveProfile } from "@/game/adaptiveLearning";
import { tryDropSpecialty } from "@/game/inventoryService";
import { formatJournalSummary, saveJournalEntry } from "@/game/adventureJournal";
import { worldStateForTime } from "@/game/academyExpansion";
import { COMBO_MILESTONE_DISPLAY_MS, comboMilestoneFor, type ComboMilestone } from "@/game/comboMilestones";
import type { ArenaHabitatKey, BattleRageSkill, BattleState, Companion, Encounter } from "@/game/rpgTypes";
import { advanceBattleRageSkillCooldowns, BATTLE_RAGE_SKILL_CAST_HIGHLIGHT_MS, createBattleRageSkillCooldowns, getBattleRageSkillCooldownProgress, isBattleRageSkillHighlighted, loadBattleRageSkillTutorial, markBattleRageSkillTutorialSeen, RAGE_SKILL_COOLDOWN_TURNS, RAGE_SKILL_TUTORIAL_COPY, startBattleRageSkillCooldown } from "@/lib/battleRageSkillTutorial";
import { useLocation } from "wouter";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { applyAccessibilityPrefs, getAccessibilityPrefs, readStoredValue, recordRareMonsterDefeat, saveBattleRecap, unlockLimitedTitle, writeStoredValue } from "@/utils/storage";
import { trpc } from "@/lib/trpc";
import { BattlePhase, createBattleDispatcher, type BattleAction, type BattleMachineState, type BattleResolution } from "@/game-engine/battleState";
import { DEFAULT_QUESTION_TIME_LIMIT_MS, calculateCritical, calculateEnemyDamage, rollEnemyDisrupt, type EnemyDisruptAction } from "@/game-engine/battleCalculator";
import "./BattleSceneStatus.css";

type BattleQuestion = { id: string; subject: string; grade: number; prompt: string; options: string[]; answer: number; explanation: string; learningTopic: string; curriculumDomain?: string; difficulty?: string };

type Props = { questionPool?: BattleQuestion[]; onClose?: () => void; modal?: boolean; soundEnabled?: boolean };
type VictoryStage = "offer" | "capture-question" | "capture-result" | "settlement";
type ImpactTarget = "ally" | "enemy";
type BattleImpact = { target: ImpactTarget; value: number; key: number };
type BattleStatusFloat = { target: ImpactTarget; label: string; tone: "hit" | "guard" | "heal" | "critical"; key: number };
type HpBuffer = { value: number; key: number };
type BattleMotion = { actor: "player" | "enemy"; target: ImpactTarget; key: number };
type ReinforcementPractice = { stage: "answering" | "complete"; correct?: boolean };
type BattleReview = { maxCombo: number; strategyUses: number; partBreakTriggered: boolean };

const TIME_LIMIT = DEFAULT_QUESTION_TIME_LIMIT_MS;
const RAGE_CAP = 100;
const COOLDOWN_RING_RADIUS = 15;
const COOLDOWN_RING_CIRCUMFERENCE = 2 * Math.PI * COOLDOWN_RING_RADIUS;

function CooldownRing({ skill, remainingTurns }: { skill: BattleRageSkill; remainingTurns: number }) {
  if (remainingTurns <= 0) return null;
  const progress = getBattleRageSkillCooldownProgress(remainingTurns);
  const dashOffset = COOLDOWN_RING_CIRCUMFERENCE * (1 - progress / 100);
  return <span className="battle-skill-cooldown-ring" data-testid={`battle-skill-cooldown-ring-${skill}`} aria-hidden="true"><svg viewBox="0 0 36 36" focusable="false"><circle className="battle-skill-cooldown-ring-track" cx="18" cy="18" r={COOLDOWN_RING_RADIUS} /><circle className="battle-skill-cooldown-ring-fill" cx="18" cy="18" r={COOLDOWN_RING_RADIUS} style={{ strokeDasharray: COOLDOWN_RING_CIRCUMFERENCE, strokeDashoffset: dashOffset }} /></svg><span>{remainingTurns}</span></span>;
}

function ComboMilestoneOverlay({ milestone, particleCount }: { milestone: ComboMilestone; particleCount: number }) {
  return <div className={`battle-combo-milestone tone-${milestone.tone}`} role="status" aria-live="assertive" aria-label={milestone.headline} data-testid={`battle-combo-milestone-${milestone.combo}`}>
    <span className="battle-combo-milestone-rim" aria-hidden="true" />
    <span className="battle-combo-milestone-particles" aria-hidden="true">{Array.from({ length: particleCount }, (_, index) => <i key={index} style={{ "--milestone-particle": index } as React.CSSProperties} />)}</span>
    <div><span className="eyebrow">COMBO MILESTONE · 答題計時已暫停</span><strong>{milestone.headline}</strong><p>{milestone.detail}</p><b>{milestone.reward}</b></div>
  </div>;
}

function titleForRareEncounter(encounter: Encounter) {
  return `${encounter.name}觀測者`;
}

const BATTLE_PHASE_COPY: Record<BattlePhase, { label: string; detail: string }> = {
  IDLE: { label: "準備探索", detail: "選好棲息地後，就能開始這次學習對戰。" },
  PLAYER_TURN: { label: "輪到你規劃行動", detail: "可以選擇行動，或先回答課綱題讓技能獲得增幅。" },
  ANIMATING: { label: "正在呈現這回合效果", detail: "先看看行動帶來的變化，再接著安排下一步。" },
  ENEMY_TURN: { label: "守門者正在回應", detail: "觀察守門者的反應，下一回合再調整你的策略。" },
  RESULT: { label: "這場探索暫告一段落", detail: "可以先看看結果，再決定接下來的收穫。" },
  REWARD: { label: "正在整理探險收穫", detail: "把這次的觀察收進遠征檔案，帶到下一次挑戰。" },
};

function HpBar({ value, max, tone, crisis = "safe", buffer }: { value: number; max: number; tone: "ally" | "enemy"; crisis?: "safe" | "warning" | "critical"; buffer?: number }) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const bufferPercentage = Math.max(0, Math.min(100, ((buffer ?? value) / max) * 100));
  const crisisLabel = tone === "ally" && crisis !== "safe" ? `，${crisis === "critical" ? "危急" : "警戒"}狀態` : "";
  const hpLabel = tone === "ally" ? "夥伴生命值" : "守門者生命值";
  return <div className={`battle-hp-frame ${tone}`}><div className={`battle-hp-bar ${tone} ${tone === "ally" && crisis !== "safe" ? `is-${crisis}` : ""}`} role="meter" aria-label={`${hpLabel} ${value}/${max}${crisisLabel}`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.max(0, Math.ceil(value))}><span>HP</span><i className="battle-hp-ghost" aria-hidden="true" style={{ width: `${bufferPercentage}%` }} /><i className="battle-hp-fill" aria-hidden="true" style={{ width: `${percentage}%` }} /></div><span className="battle-hp-readout"><AnimatedHudValue value={Math.max(0, Math.ceil(value))} label={hpLabel} className="battle-hp-number" /><span aria-hidden="true"> / {max}</span></span></div>;
}

function TreasureReveal({ encounterName, loot, onSpeak }: { encounterName: string; loot: ArenaLoot | null; onSpeak: (message: string) => void }) {
  const revealMessage = loot
    ? `寶箱已開啟。${loot.lines.join("；")}`
    : `${encounterName} 的勝利寶箱已出現。完成戰利品結算後，這場真實獎勵會顯示在這裡。`;
  return <section className={`battle-treasure-reveal ${loot ? "is-revealed" : "is-ready"}`} aria-labelledby="battle-treasure-title" data-testid="battle-treasure-reveal" role="status" aria-live="polite">
    <span className="battle-treasure-glow" aria-hidden="true"><Gift size={24} /></span>
    <div className="battle-treasure-copy"><span className="eyebrow">VICTORY CACHE / 勝利寶藏</span><h3 id="battle-treasure-title">{loot ? "寶箱已溫柔開啟" : "勝利寶箱已準備好"}</h3><p>{loot ? "這次探索的真實收穫已整理完成，慢慢查看即可。" : "先完成結算，再查看本場探索實際記錄的收穫。"}</p>{loot && <ul>{loot.lines.map((line) => <li key={line}>{line}</li>)}</ul>}</div>
    {loot && <Button type="button" variant="outline" onClick={() => onSpeak(revealMessage)} aria-label="朗讀勝利寶藏"><Volume2 size={15} aria-hidden="true" /> 朗讀寶藏</Button>}
  </section>;
}

function subjectTheme(subject: string) {
  if (subject.includes("自然") || subject.includes("天文")) return "nature";
  if (subject.includes("數學")) return "math";
  if (subject.includes("社會")) return "humanities";
  if (subject.includes("國語")) return "language";
  return "general";
}

function reviewDifficulty(value?: string): AdaptiveDifficulty {
  return value === "挑戰" || value === "標準" ? value : "基礎";
}

function islandIdForSubject(subject?: string): "language" | "math" | "social" | "science" | null {
  if (subject === "國語") return "language";
  if (subject === "數學") return "math";
  if (subject === "社會") return "social";
  if (subject === "自然") return "science";
  return null;
}

export default function BattleScene({ questionPool = [], onClose, modal = false, soundEnabled: soundEnabledProp }: Props) {
  const [, setLocation] = useLocation();
  const { data: questionBankData, isLoading: questionBankLoading, error: questionBankError } = trpc.questionBank.list.useQuery({ limit: 500 });
  const [state, setState] = useState(() => loadRpgState());
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [encounter, setEncounter] = useState<Encounter>(() => encounterForArenaHabitat(state).encounter);
  const [rareEncounter, setRareEncounter] = useState(false);
  const [rage, setRage] = useState(0);
  const [activeRageSkill, setActiveRageSkill] = useState<BattleRageSkill | null>(null);
  const [rageSkillCooldowns, setRageSkillCooldowns] = useState(() => createBattleRageSkillCooldowns());
  const [rageSkillTutorialSeen, setRageSkillTutorialSeen] = useState(() => loadBattleRageSkillTutorial().seen);
  const [battleReview, setBattleReview] = useState<BattleReview | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState("");
  const [victoryStage, setVictoryStage] = useState<VictoryStage>("offer");
  const [captureOutcome, setCaptureOutcome] = useState<ArenaCaptureOutcome | null>(null);
  const [loot, setLoot] = useState<ArenaLoot | null>(null);
  const [damageFloat, setDamageFloat] = useState<BattleImpact | null>(null);
  const [statusFloat, setStatusFloat] = useState<BattleStatusFloat | null>(null);
  const [hitFlash, setHitFlash] = useState<{ target: ImpactTarget; key: number } | null>(null);
  const [castHighlightSkill, setCastHighlightSkill] = useState<BattleRageSkill | null>(null);
  const [battleMotion, setBattleMotion] = useState<BattleMotion | null>(null);
  const [criticalPulse, setCriticalPulse] = useState<number | null>(null);
  const [comboMilestone, setComboMilestone] = useState<ComboMilestone | null>(null);
  const [accessibilityPrefs, setAccessibilityPrefs] = useState(() => getAccessibilityPrefs());
  const [hpBuffers, setHpBuffers] = useState<Partial<Record<ImpactTarget, HpBuffer>>>({});
  const [answerLocked, setAnswerLocked] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [difficultyAssistOffered, setDifficultyAssistOffered] = useState(false);
  const [difficultyAssistApplied, setDifficultyAssistApplied] = useState(false);
  const [battlePreparing, setBattlePreparing] = useState(false);
  const preparationTimerRef = useRef<number | null>(null);
  const answerLockRef = useRef(false);
  const impactSequenceRef = useRef(0);
  const [questionTimeLimitMs, setQuestionTimeLimitMs] = useState(TIME_LIMIT);
  const [guardianCue, setGuardianCue] = useState<EnemyDisruptAction | null>(null);
  const [reinforcementPractice, setReinforcementPractice] = useState<ReinforcementPractice | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof soundEnabledProp === "boolean") return soundEnabledProp;
    if (typeof window === "undefined") return true;
    return readStoredValue("xueBattleSfxEnabled", "true") !== "false";
  });
  const previousBattleRef = useRef<BattleState | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const castHighlightTimerRef = useRef<number | null>(null);
  const criticalPulseTimerRef = useRef<number | null>(null);
  const comboMilestoneTimerRef = useRef<number | null>(null);
  const comboMilestonePausedAtRef = useRef<number | null>(null);
  const battleDispatcherRef = useRef(createBattleDispatcher());
  const mapVictoryRecordedRef = useRef<string | null>(null);
  const battleStatsRef = useRef({ maxCombo: 0, strategyUses: 0 });
  const quickPracticeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const reinforcementHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const [battleMachine, setBattleMachine] = useState<BattleMachineState>(() => battleDispatcherRef.current.getState());
  const { isOnline, isOffline } = useNetworkStatus();
  const offlineSinceRef = useRef<number | null>(null);
  const [adaptiveProfile, setAdaptiveProfile] = useState<AdaptiveProfile>(() => loadAdaptiveProfile());
  const active = useMemo<Companion | undefined>(() => state.companions.find((item) => item.id === state.activeCompanionId) ?? state.companions[0], [state]);
  const availableQuestions = useMemo(() => questionPool.length > 0 ? questionPool : (questionBankData?.questions ?? []) as BattleQuestion[], [questionBankData?.questions, questionPool]);
  const question = useMemo(() => availableQuestions.find((item) => item.id === battle?.questionId) ?? availableQuestions[0], [availableQuestions, battle?.questionId]);
  const gearBonuses = useMemo(() => academyGearBonuses(state.academyGearIds), [state.academyGearIds]);
  const habitats = useMemo(() => arenaHabitatStatuses(state), [state]);
  const habitat = useMemo(() => selectedArenaHabitat(state), [state]);
  const ultimateName = active ? combatStyleForCompanion(active).ultimateName : "終極技能";
  const tactics = useMemo(() => battle && active ? getBattleTactics({ battle, companion: active, encounter, ultimateLabel: ultimateName }) : null, [active, battle, encounter, ultimateName]);
  const defeatReflection = useMemo(() => battle?.result === "defeat" ? buildBattleDefeatReflection({ battle, question: question ?? null, tactics }) : null, [battle, question, tactics]);
  const crisisLevel = battle ? getCrisisLevel(battle.playerHp, battle.playerMaxHp) : "safe";
  const comboCount = battle ? getComboCount(battle.log) : 0;
  const comboCritical = calculateCritical(comboCount);
  const milestoneParticleCount = accessibilityPrefs.effectIntensity === "low" ? 4 : accessibilityPrefs.effectIntensity === "medium" ? 8 : 12;
  const comboNarrative = comboCritical.isCritical
    ? `🔥 連擊！已連答 ${comboCount} 題；答題增幅會以 1.5 倍呈現。`
    : comboCount > 0
      ? `已連答 ${comboCount} 題，保持觀察節奏，下一個三連擊正在累積。`
      : "先以一題一題的理解，累積自己的答題動能。";
  const enemyPhase = battle ? getEnemyPhase(battle.enemyHp, battle.enemyMaxHp) : "normal";
  const worldState = useMemo(() => worldStateForTime(now, (new Date(now).getDate() % 10) / 10), [now]);
  const environmentLabel = worldState.period === "night" ? "夜間觀測" : worldState.rainy ? "雨季觀測" : "日間觀測";
  const effectiveBaseTimeLimit = TIME_LIMIT + (difficultyAssistApplied ? 5_000 : 0);
  const enemyPhaseCopy = {
    normal: { label: "觀測階段", detail: "守門者正在讀取你的行動節奏。" },
    enraged: { label: "壓力升高", detail: "生命值低於六成，下一次反應更值得預先規劃。" },
    desperate: { label: "最後防線", detail: "生命值低於三成，守門者正集中最後的回應能量。" },
  }[enemyPhase];
  const allyPortrait = battlePortraitForCompanion(active);
  const enemyPortrait = battlePortraitForEncounter(encounter);
  const arenaBackground = battleBackgroundForHabitat(habitat.id);
  const reviewSummary = useMemo(() => getSpacedReviewSummary(adaptiveProfile, new Set(availableQuestions.map((item) => item.id))), [adaptiveProfile, availableQuestions]);
  const questionIsDueReview = Boolean(question && battle && (adaptiveProfile.spacedReviews ?? []).some((item) => item.questionId === question.id && item.dueAt <= Date.now()));
  const battlePhaseCopy = BATTLE_PHASE_COPY[battleMachine.phase];
  const playerCanAct = isOnline && battleMachine.phase === BattlePhase.PLAYER_TURN && !answerLocked && !comboMilestone;
  const battleCanAct = isOnline && Boolean(battle) && !comboMilestone;

  const dismissRageSkillTutorial = () => {
    markBattleRageSkillTutorialSeen();
    setRageSkillTutorialSeen(true);
  };

  const reduceRageSkillCooldowns = () => setRageSkillCooldowns(advanceBattleRageSkillCooldowns);

  useEffect(() => {
    if (reinforcementPractice?.stage === "answering") reinforcementHeadingRef.current?.focus();
  }, [reinforcementPractice?.stage]);

  useEffect(() => {
    if (typeof soundEnabledProp === "boolean") return;
    writeStoredValue("xueBattleSfxEnabled", String(soundEnabled));
  }, [soundEnabled, soundEnabledProp]);

  useEffect(() => {
    const syncAccessibilityPrefs = () => {
      const next = getAccessibilityPrefs();
      applyAccessibilityPrefs(next);
      setAccessibilityPrefs(next);
    };
    syncAccessibilityPrefs();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "xue-adventure-accessibility-prefs-v1" || event.key === null) syncAccessibilityPrefs();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const previous = previousBattleRef.current;
    const next = battle;
    const combatFeedback = getCombatFeedback(previous, next, active);
    previousBattleRef.current = next;
    if (!combatFeedback) return;
    playCombatSfx(combatFeedback.event, soundEnabled, active);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null;
    }, 1_100);
  }, [active, battle, soundEnabled]);

  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    if (preparationTimerRef.current !== null) window.clearTimeout(preparationTimerRef.current);
    if (castHighlightTimerRef.current !== null) window.clearTimeout(castHighlightTimerRef.current);
    if (criticalPulseTimerRef.current !== null) window.clearTimeout(criticalPulseTimerRef.current);
    if (comboMilestoneTimerRef.current !== null) window.clearTimeout(comboMilestoneTimerRef.current);
  }, []);

  const dispatchBattle = (action: BattleAction) => {
    const nextMachineState = battleDispatcherRef.current.dispatch(action);
    setBattleMachine(nextMachineState);
    return nextMachineState;
  };

  const speakBattleCue = (message: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setFeedback("此裝置目前無法朗讀提示；你仍可直接閱讀戰況卡。");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "zh-TW";
      window.speechSynthesis.speak(utterance);
    } catch {
      setFeedback("此裝置目前無法朗讀提示；你仍可直接閱讀戰況卡。");
    }
  };

  useEffect(() => {
    if (isOffline) {
      if (offlineSinceRef.current === null) offlineSinceRef.current = Date.now();
      return;
    }
    if (offlineSinceRef.current !== null) {
      const pausedMs = Math.max(0, Date.now() - offlineSinceRef.current);
      setStartedAt((current) => current + pausedMs);
      setNow(Date.now());
      offlineSinceRef.current = null;
      if (battle) setFeedback("連線已恢復，戰鬥可以繼續。剛才的離線時間不會扣除倒數。 ");
    }
  }, [isOffline, battle]);

  useEffect(() => {
    if (isOffline || comboMilestone || !battle || (battle.phase !== "question" && victoryStage !== "capture-question")) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [isOffline, comboMilestone, battle?.phase, battle?.questionId, victoryStage]);

  useEffect(() => {
    if (!battle) return;
    saveRpgState({ ...state, mode: battle.result === "victory" ? "victory" : battle.result === "defeat" ? "defeat" : "battle", encounter, battle });
  }, [battle, encounter, state]);

  useEffect(() => saveAdaptiveProfile(adaptiveProfile), [adaptiveProfile]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const startBattle = () => {
    if (isOffline || battlePreparing || !active || !question) return;
    const rolled = encounterForArenaHabitat(state, habitat.id);
    const nextEncounter = rolled.encounter;
    const selected = selectSpacedReviewQuestion(availableQuestions, adaptiveProfile);
    const next = { ...createBattle(active, nextEncounter, selected.question?.id ?? question.id), energy: state.energy };
    dispatchBattle({ type: "RESET" });
    dispatchBattle({ type: "START", battleId: `${nextEncounter.id}:${next.questionId}` });
    setEncounter(nextEncounter);
    setRareEncounter(rolled.rare);
    setRage(0);
    setActiveRageSkill(null);
    setCastHighlightSkill(null);
    if (castHighlightTimerRef.current !== null) window.clearTimeout(castHighlightTimerRef.current);
    castHighlightTimerRef.current = null;
    setRageSkillCooldowns(createBattleRageSkillCooldowns());
    setBattleReview(null);
    battleStatsRef.current = { maxCombo: 0, strategyUses: 0 };
    setBattle(next);
    setStartedAt(Date.now());
    setVictoryStage("offer");
    setCaptureOutcome(null);
    setLoot(null);
    setDamageFloat(null);
    setHitFlash(null);
    setBattleMotion(null);
    setCriticalPulse(null);
    setComboMilestone(null);
    if (comboMilestoneTimerRef.current !== null) window.clearTimeout(comboMilestoneTimerRef.current);
    comboMilestoneTimerRef.current = null;
    comboMilestonePausedAtRef.current = null;
    setWrongStreak(0);
    setDifficultyAssistOffered(false);
    setDifficultyAssistApplied(false);
    if (criticalPulseTimerRef.current !== null) window.clearTimeout(criticalPulseTimerRef.current);
    criticalPulseTimerRef.current = null;
    setHpBuffers({});
    setAnswerLocked(false);
    answerLockRef.current = false;
    setQuestionTimeLimitMs(TIME_LIMIT);
    setGuardianCue(null);
    setReinforcementPractice(null);
    mapVictoryRecordedRef.current = null;
    setBattlePreparing(true);
    if (preparationTimerRef.current !== null) window.clearTimeout(preparationTimerRef.current);
    preparationTimerRef.current = window.setTimeout(() => {
      preparationTimerRef.current = null;
      setBattlePreparing(false);
    }, 420);
    setFeedback(selected.isReview ? `到期複習線索已優先安排；${active.name} 會陪你重新整理這一題。` : rolled.rare ? `罕見訊號出現：${nextEncounter.name} 回應了你的觀測紀錄。` : `正在 ${rolled.habitat.name} 觀測 ${nextEncounter.name}；基礎攻擊可直接使用。`);
  };

  const chooseHabitat = (habitatId: ArenaHabitatKey) => {
    if (isOffline || battle || battlePreparing) return;
    const selected = selectArenaHabitat(state, habitatId);
    if (selected === state) return;
    saveRpgState(selected);
    setState(selected);
    const preview = encounterForArenaHabitat(selected, habitatId, 1);
    setEncounter(preview.encounter);
    setRareEncounter(false);
    setFeedback(`${preview.habitat.name} 已設為本次觀測棲息地。`);
  };

  const triggerImpact = (target: ImpactTarget, value: number, actor: "player" | "enemy") => {
    if (value <= 0) return;
    const key = Date.now() + ++impactSequenceRef.current;
    setDamageFloat({ target, value, key });
    const isCritical = actor === "player" && Boolean(battle?.performance?.criticalHit || comboCritical.isCritical);
    setStatusFloat({ target, key, tone: isCritical ? "critical" : "hit", label: isCritical ? `暴擊！-${value}` : `傷害 -${value}` });
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try { navigator.vibrate(isCritical ? [18, 42, 24] : 18); } catch { /* 裝置不支援震動時維持視覺回饋 */ }
    }
    setHitFlash({ target, key });
    setBattleMotion({ actor, target, key });
    window.setTimeout(() => {
      setDamageFloat((current) => current?.key === key ? null : current);
      setHitFlash((current) => current?.key === key ? null : current);
      setBattleMotion((current) => current?.key === key ? null : current);
      setStatusFloat((current) => current?.key === key ? null : current);
    }, 620);
  };

  const queueHpBuffer = (target: ImpactTarget, value: number) => {
    const key = Date.now() + ++impactSequenceRef.current;
    setHpBuffers((current) => ({ ...current, [target]: { value, key } }));
    window.setTimeout(() => setHpBuffers((current) => current[target]?.key === key ? { ...current, [target]: undefined } : current), 540);
  };

  const updateBattle = (next: BattleState, previous: BattleState | null = battle, showEnemyImpact = true, actor: "player" | "enemy" = previous?.turn === "enemy" ? "enemy" : "player") => {
    if (previous) {
      const enemyDamage = Math.max(0, previous.enemyHp - next.enemyHp);
      const allyDamage = Math.max(0, previous.playerHp - next.playerHp);
      if (enemyDamage > 0) {
        queueHpBuffer("enemy", previous.enemyHp);
        if (showEnemyImpact) triggerImpact("enemy", enemyDamage, actor);
      }
      if (allyDamage > 0) {
        queueHpBuffer("ally", previous.playerHp);
        triggerImpact("ally", allyDamage, actor);
      }
    }
    setBattle(next);
    if (next.result === "victory") {
      setVictoryStage("offer");
      setCaptureOutcome(null);
      setLoot(null);
      const victoryKey = `${encounter.id}:${next.questionId}`;
      const comboAtVictory = next.performance?.comboCount ?? getComboCount(next.log);
      const perfectKill = rareEncounter && comboAtVictory >= 5;
      const review = {
        maxCombo: Math.max(battleStatsRef.current.maxCombo, comboAtVictory),
        strategyUses: battleStatsRef.current.strategyUses,
        partBreakTriggered: perfectKill,
      };
      setBattleReview(review);
      let victoryMessage = `${active?.name ?? "夥伴"} 成功守住學習航線！地圖已留下新的航跡與補給提示。`;
      if (mapVictoryRecordedRef.current !== victoryKey) {
        const mapVictoryProgress = recordMapVictory(state.mapVictoryProgress, {
          region: encounter.region,
          habitatId: encounter.habitatId,
        });
        mapVictoryRecordedRef.current = victoryKey;
        setState((current) => ({ ...current, mapVictoryProgress, coins: current.coins + (perfectKill ? 30 : 0), notice: perfectKill ? "完美擊殺！稀有守門者的部位破壞已成立，獲得額外 30 金幣。" : "勝利航線已留下真實航跡，新的學習補給已在地圖上等你發現。" }));
        if (rareEncounter) {
          recordRareMonsterDefeat(encounter.id);
          unlockLimitedTitle(titleForRareEncounter(encounter));
        }
        saveBattleRecap({ id: victoryKey, timestamp: Date.now(), enemyId: encounter.id, enemyName: encounter.name, rare: rareEncounter, maxCombo: review.maxCombo, strategyUses: review.strategyUses, partBreakTriggered: review.partBreakTriggered });
        const specialty = tryDropSpecialty({ source: "battle-victory", awardId: `battle-victory-${victoryKey}` });
        if (specialty) victoryMessage = `${active?.name ?? "夥伴"} 成功守住學習航線！地圖已留下新的航跡；背包收進了${specialty.emoji}${specialty.name}。`;
        if (rareEncounter) victoryMessage += ` 稀有紀錄已加入圖鑑，並解鎖「${titleForRareEncounter(encounter)}」稱號。`;
        if (perfectKill) victoryMessage += " 完美擊殺成立，額外獲得 30 金幣。";
      }
      setFeedback(victoryMessage);
    }
    else if (next.result === "defeat") setFeedback("先整理線索，再從這一場重新挑戰。");

    const resolution: BattleResolution = next.result === "victory" ? "victory" : next.result === "defeat" ? "defeat" : "ongoing";
    const animationState = dispatchBattle(actor === "player"
      ? { type: "PLAYER_TURN_RESOLVED", resolution }
      : { type: "ENEMY_TURN_RESOLVED", resolution });
    if (animationState.phase !== BattlePhase.ANIMATING) return;

    window.setTimeout(() => {
      const completedState = dispatchBattle({ type: "ANIMATION_FINISHED" });
      if (completedState.phase === BattlePhase.ENEMY_TURN) {
        enemyResponse(next);
        return;
      }

      // 只有敵方回合的動畫完全結束，且純戰鬥資料已回到玩家準備階段時，
      // 才解除 UI 的答案鎖；避免下一題仍維持 disabled，或在命中動畫中提早重複送答。
      if (
        completedState.phase === BattlePhase.PLAYER_TURN
        && next.result === "active"
        && next.turn === "player"
        && next.phase === "ready"
      ) {
        answerLockRef.current = false;
        setAnswerLocked(false);
        setStartedAt(Date.now());
        setNow(Date.now());
      }
    }, 620);
  };

  const enemyResponse = (next: BattleState) => {
    if (next.result !== "active" || next.turn !== "enemy") return;
    window.setTimeout(() => {
      const disrupt = rollEnemyDisrupt(Math.random, TIME_LIMIT);
      const enemyDamage = calculateEnemyDamage(encounter.level + 1, next.performance?.defensePower ?? 0);
      const afterResponse = applyBattleAction(next, { type: "enemy", damage: enemyDamage }, question?.id ?? next.questionId);
      reduceRageSkillCooldowns();
      if (disrupt && afterResponse.result === "active") {
        setQuestionTimeLimitMs(disrupt.timeLimitMs + (difficultyAssistApplied ? 5_000 : 0));
        setGuardianCue(disrupt);
      } else {
        setQuestionTimeLimitMs(effectiveBaseTimeLimit);
        setGuardianCue(null);
      }
      updateBattle(afterResponse, next, true, "enemy");
      if (disrupt && afterResponse.result === "active") setFeedback(disrupt.message);
    }, 260);
  };

  const answer = (option: number) => {
    if (isOffline || answerLockRef.current || !playerCanAct || !battle || !active || !question || battle.phase !== "question" || battle.turn !== "player") return;
    answerLockRef.current = true;
    setAnswerLocked(true);
    const responseMs = Date.now() - startedAt;
    const correct = option === question.answer;
    const nextWrongStreak = correct ? 0 : wrongStreak + 1;
    setWrongStreak(nextWrongStreak);
    if (!correct && nextWrongStreak >= 3 && !difficultyAssistApplied) setDifficultyAssistOffered(true);
    setAdaptiveProfile(recordAdaptiveAttempt(adaptiveProfile, { questionId: question.id, curriculumDomain: question.curriculumDomain ?? question.subject, knowledge: [question.learningTopic], difficulty: reviewDifficulty(question.difficulty), correct, responseMs, timeLimitMs: questionTimeLimitMs }));
    const nextComboCount = correct ? comboCount + 1 : 0;
    const milestone = correct ? comboMilestoneFor(nextComboCount) : null;
    battleStatsRef.current.maxCombo = Math.max(battleStatsRef.current.maxCombo, nextComboCount);
    const critical = calculateCritical(nextComboCount);
    if (critical.isCritical) {
      const pulseKey = Date.now() + ++impactSequenceRef.current;
      setCriticalPulse(pulseKey);
      if (criticalPulseTimerRef.current !== null) window.clearTimeout(criticalPulseTimerRef.current);
      criticalPulseTimerRef.current = window.setTimeout(() => {
        criticalPulseTimerRef.current = null;
        setCriticalPulse((current) => current === pulseKey ? null : current);
      }, 900);
    }
    const performance = {
      ...calculateBattlePerformance({ questionId: question.id, correct, responseMs, timeLimitMs: questionTimeLimitMs, streak: battle.performance?.correct ? 1 : 0, basePower: active.energyPower, passiveSkillIds: active.passiveSkillIds ?? [], defenseBonus: 0, captureBonus: 0, attackMultiplier: milestone?.combo === 5 ? 1.1 : 1 }),
      comboCount: nextComboCount,
      criticalHit: critical.isCritical,
    };
    const answeredBattle = applyBattleAnswer(battle, performance);
    const next = milestone?.combo === 10 ? healBattleHp(answeredBattle, 10) : answeredBattle;
    const rageGain = correct ? 10 : 5;
    setRage((current) => Math.min(RAGE_CAP, current + rageGain));
    setQuestionTimeLimitMs(effectiveBaseTimeLimit);
    setGuardianCue(null);
    updateBattle(next, battle, performance.correct);
    if (milestone?.combo === 10 && next.playerHp > answeredBattle.playerHp) {
      queueHpBuffer("ally", answeredBattle.playerHp);
      setStatusFloat({ target: "ally", tone: "heal", key: Date.now() + ++impactSequenceRef.current, label: "連擊治療 +10 HP" });
    }
    if (milestone?.combo === 15) unlockLimitedTitle("連擊大師");
    if (milestone?.combo === 20) setState((current) => ({ ...current, coins: current.coins + 50, notice: "20 連擊里程碑！獲得 50 金幣。" }));
    if (milestone) {
      if (comboMilestoneTimerRef.current !== null) window.clearTimeout(comboMilestoneTimerRef.current);
      comboMilestonePausedAtRef.current = Date.now();
      setComboMilestone(milestone);
      playCombatSfx(milestone.combo >= 15 ? "victory" : "critical", soundEnabled, active);
      comboMilestoneTimerRef.current = window.setTimeout(() => {
        const pausedAt = comboMilestonePausedAtRef.current;
        if (pausedAt !== null) {
          const pausedMs = Math.max(0, Date.now() - pausedAt);
          setStartedAt((current) => current + pausedMs);
          setNow(Date.now());
        }
        comboMilestonePausedAtRef.current = null;
        comboMilestoneTimerRef.current = null;
        setComboMilestone(null);
      }, COMBO_MILESTONE_DISPLAY_MS);
    }
    const skillLabel = activeRageSkill ? RAGE_SKILL_DEFINITIONS[activeRageSkill].label : null;
    setActiveRageSkill(null);
    setFeedback(performance.correct ? critical.isCritical ? `🔥 連擊！連答 ${nextComboCount} 題，技能已獲得 1.5 倍答題增幅。怒氣 +${rageGain}。` : `${skillLabel ? `${skillLabel}已結算。` : "答對了！技能已獲得課綱增幅。"} 怒氣 +${rageGain}。` : `答錯了：${question.explanation} 怒氣 +${rageGain}。`);
  };

  const applyDifficultyAssist = () => {
    if (!battle || difficultyAssistApplied) return;
    const reducedMaxHp = Math.max(1, Math.ceil(battle.enemyMaxHp * 0.7));
    const reducedEnemyHp = Math.min(battle.enemyHp, reducedMaxHp);
    queueHpBuffer("enemy", battle.enemyHp);
    setBattle({ ...battle, enemyMaxHp: reducedMaxHp, enemyHp: reducedEnemyHp });
    setQuestionTimeLimitMs((limit) => limit + 5_000);
    setStartedAt(Date.now());
    setNow(Date.now());
    setDifficultyAssistApplied(true);
    setDifficultyAssistOffered(false);
    setWrongStreak(0);
    setFeedback("已切換為循序練習：守門者生命降低 30%，每題多 5 秒。慢慢整理線索再前進。");
  };

  const beginRageSkill = (skill: BattleRageSkill) => {
    const definition = RAGE_SKILL_DEFINITIONS[skill];
    if (isOffline || !playerCanAct || !battle || !active || !question || rageSkillCooldowns[skill] > 0 || rage < definition.cost || (battle.phase !== "ready" && battle.phase !== "action") || battle.turn !== "player") return;
    let preparedBattle = battle;
    if (skill === "heal") {
      preparedBattle = healBattleHp(battle, 20);
      queueHpBuffer("ally", battle.playerHp);
    }
    const next = beginBattleQuestion(preparedBattle, { type: definition.actionType, cost: 0, power: Math.max(2, active.energyPower), label: definition.label }, question.id);
    setRage((current) => Math.max(0, current - definition.cost));
    setRageSkillCooldowns((current) => startBattleRageSkillCooldown(current, skill));
    setActiveRageSkill(skill);
    setCastHighlightSkill(skill);
    if (castHighlightTimerRef.current !== null) window.clearTimeout(castHighlightTimerRef.current);
    castHighlightTimerRef.current = window.setTimeout(() => {
      castHighlightTimerRef.current = null;
      setCastHighlightSkill((current) => isBattleRageSkillHighlighted(skill, current) ? null : current);
    }, BATTLE_RAGE_SKILL_CAST_HIGHLIGHT_MS);
    battleStatsRef.current.strategyUses += 1;
    setBattle(next);
    setStartedAt(Date.now());
    setNow(Date.now());
    setFeedback(skill === "heal" ? "緊急包紮已完成，請回答題目繼續這一回合。" : `已啟動${definition.label}，回答課綱題來結算這個策略。`);
  };

  const basicAttack = () => {
    if (isOffline || !playerCanAct || !battle || !active || (battle.phase !== "ready" && battle.phase !== "action") || battle.turn !== "player") return;
    const next = applyBattleAction(battle, { type: "basic", power: Math.max(2, Math.round(active.energyPower / 2)), label: "基礎攻擊" });
    updateBattle(next);
  };

  const beginSkillQuestion = (type: "skill" | "ultimate") => {
    if (isOffline || !playerCanAct || !battle || !active || !question || (battle.phase !== "ready" && battle.phase !== "action") || battle.turn !== "player") return;
    const cost = type === "ultimate" ? Math.max(8, active.skillCost * 2) : active.skillCost;
    const next = beginBattleQuestion(battle, { type, cost, power: active.energyPower + (type === "ultimate" ? 6 : 0), label: type === "ultimate" ? combatStyleForCompanion(active).ultimateName : active.skillName }, question.id);
    if (next.phase === "question") {
      // 開啟課綱題只是準備本回合的技能，尚未結算攻防；維持玩家回合，
      // 讓答題選項保持可操作，直到 answer() 真正送出 PLAYER_TURN_RESOLVED。
      setBattle(next);
      answerLockRef.current = false;
      setAnswerLocked(false);
      setStartedAt(Date.now());
      setNow(Date.now());
      setFeedback(`回答課綱題，讓${type === "ultimate" ? "超必殺" : "必殺技"}獲得增幅。${questionTimeLimitMs < TIME_LIMIT ? ` 本題節奏提示為 ${Math.round(questionTimeLimitMs / 1000)} 秒，先找關鍵線索。` : ""}`);
    } else {
      setBattle(next);
      setFeedback(next.log.at(-1) ?? "能量不足，先使用基礎攻擊或完成更多學習任務。");
    }
  };

  const beginCaptureQuestion = () => {
    if (isOffline || !battle || !question || battle.result !== "victory" || state.energy < encounter.captureCost) return;
    dispatchBattle({ type: "ACKNOWLEDGE_RESULT" });
    setVictoryStage("capture-question");
    setStartedAt(Date.now());
    setNow(Date.now());
    setFeedback(`回答課綱題，決定${encounter.name}是否願意加入；本次會消耗 ${encounter.captureCost} 能量。`);
  };

  const answerCapture = (option: number) => {
    if (isOffline || !battle || !active || !question || victoryStage !== "capture-question" || battle.result !== "victory") return;
    const performance = calculateBattlePerformance({
      questionId: question.id,
      correct: option === question.answer,
      responseMs: Date.now() - startedAt,
      streak: battle.performance?.correct ? 1 : 0,
      basePower: active.energyPower,
      passiveSkillIds: active.passiveSkillIds ?? [],
      captureBonus: gearBonuses.capture,
    });
    setAdaptiveProfile(recordAdaptiveAttempt(adaptiveProfile, { questionId: question.id, curriculumDomain: question.curriculumDomain ?? question.subject, knowledge: [question.learningTopic], difficulty: reviewDifficulty(question.difficulty), correct: performance.correct, responseMs: Date.now() - startedAt, timeLimitMs: TIME_LIMIT }));
    const outcome = resolveArenaCapture({ chance: performance.captureChance, correct: performance.correct });
    const answered = recordRpgAnswer({
      eventId: `arena-capture-${encounter.id}-${startedAt}`,
      correct: performance.correct,
      curriculumDomain: question.curriculumDomain,
      difficulty: question.difficulty,
      subject: question.subject,
    });
    const afterCost = { ...answered, energy: Math.max(0, answered.energy - encounter.captureCost) };
    saveRpgState(afterCost);
    setState(afterCost);
    setCaptureOutcome(outcome);
    setVictoryStage("capture-result");
    setFeedback(outcome.success ? `觀測光環穩定下來了！${encounter.name}願意同行。` : `${encounter.name}暫時保留距離；這次的觀察已記錄下來。`);
  };

  const settleLoot = () => {
    if (isOffline || !battle || battle.result !== "victory" || loot) return;
    if (battleMachine.phase === BattlePhase.RESULT) dispatchBattle({ type: "ACKNOWLEDGE_RESULT" });
    const result = settleArenaLoot(state, encounter, captureOutcome ?? { attempted: false, success: false, chance: 0, correct: false });
    const settledLoot = battleReview?.partBreakTriggered ? { ...result.loot, lines: [...result.loot.lines, "完美擊殺・額外金幣 +30"] } : result.loot;
    saveRpgState(result.state);
    setState(result.state);
    setLoot(settledLoot);
    const journalBase = {
      id: `battle-${encounter.id}-${battle.questionId}-${startedAt}`,
      date: Date.now(),
      subject: question?.subject ?? "綜合",
      topicCount: question?.learningTopic ? 1 : 0,
      correctCount: battle.performance?.correct ? 1 : 0,
      sessionType: "battle" as const,
      islandId: islandIdForSubject(question?.subject),
    };
    saveJournalEntry({ ...journalBase, summary: formatJournalSummary(journalBase) });
    setVictoryStage("settlement");
    setFeedback("戰利品已記錄到本機遠征檔案。可以再挑戰，或返回探險地圖。 ");
  };

  const startReinforcementPractice = () => {
    if (isOffline || !battle || battle.result !== "defeat" || !question || !defeatReflection || defeatReflection.practice.status !== "available") {
      setFeedback("目前無法確認可用的一題補強內容；可以先重新整理線索。");
      return;
    }
    setStartedAt(Date.now());
    setNow(Date.now());
    setReinforcementPractice({ stage: "answering" });
    setFeedback(defeatReflection.practice.readout);
  };

  const answerReinforcementPractice = (option: number) => {
    if (isOffline || !question || reinforcementPractice?.stage !== "answering") return;
    const responseMs = Date.now() - startedAt;
    const correct = option === question.answer;
    setAdaptiveProfile((profile) => recordAdaptiveAttempt(profile, { questionId: question.id, curriculumDomain: question.curriculumDomain ?? question.subject, knowledge: [question.learningTopic], difficulty: reviewDifficulty(question.difficulty), correct, responseMs, timeLimitMs: TIME_LIMIT }));
    if (question.subject === "國語" || question.subject === "數學" || question.subject === "自然" || question.subject === "社會") {
      const completedAt = Date.now();
      const completion: MapReinforcementReward = { questionId: question.id, subject: question.subject, knowledge: question.learningTopic, completedAt };
      queueMapReinforcementReward(completion);
      recordMapReinforcementJournalEntry(completion);
    }
    setReinforcementPractice({ stage: "complete", correct });
    setFeedback(correct ? "你已完成一題補強，關鍵線索正在變得更熟悉。" : "這一題已收進複習線索；閱讀題庫解析後，再帶著關鍵詞回到下一場。");
  };

  const closeReinforcementPractice = () => {
    setReinforcementPractice(null);
    window.setTimeout(() => quickPracticeTriggerRef.current?.focus(), 0);
  };

  const close = () => {
    dispatchBattle({ type: "RESET" });
    onClose ? onClose() : setLocation("/");
  };
  if (!modal && questionBankLoading && questionPool.length === 0) return <main className="standalone-battle battle-scene-state"><span className="eyebrow accent">CURRICULUM COMBAT / LOADING</span><h1>正在整理對戰題庫</h1><p>正在載入正式課綱題目，準備你的下一回合。</p></main>;
  if (!modal && questionBankError && questionPool.length === 0) return <main className="standalone-battle battle-scene-state"><span className="eyebrow accent">CURRICULUM COMBAT / OFFLINE</span><h1>題庫暫時無法載入</h1><p>請返回探險地圖，確認網路後再重新進入戰鬥場。</p><Button onClick={close}><ArrowLeft size={16} /> 返回探險地圖</Button></main>;
  if (!question && !questionBankLoading) return <main className="standalone-battle battle-scene-state"><span className="eyebrow accent">CURRICULUM COMBAT / EMPTY</span><h1>目前沒有可用題目</h1><p>正式題庫尚未提供可用的戰鬥題目，請稍後再試。</p><Button onClick={close}><ArrowLeft size={16} /> 返回探險地圖</Button></main>;
  const seconds = Math.max(0, Math.ceil((questionTimeLimitMs - (now - startedAt)) / 1000));
  const content = <main className={`standalone-battle ${modal ? "standalone-battle-modal" : ""} battle-environment-${worldState.period} ${worldState.rainy ? "battle-environment-rainy" : ""}`} data-environment-period={worldState.period} data-environment-rainy={worldState.rainy ? "true" : "false"} aria-label="獨立對戰場景">
    <div className="battle-scene-topbar"><Button variant="ghost" onClick={close}><ArrowLeft size={17} /> 返回探險地圖</Button><span className="battle-scene-label"><Swords size={15} /> ISLAND DUEL / 學習對戰場</span><span className="battle-scene-resources"><Zap size={15} /> {state.energy} 能量 <Button type="button" variant="ghost" className="battle-sound-toggle" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-pressed={soundEnabled} aria-label={soundEnabled ? "關閉戰鬥音效" : "開啟戰鬥音效"} title={soundEnabled ? "關閉戰鬥音效" : "開啟戰鬥音效"}>{soundEnabled ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}<span className="sr-only">{soundEnabled ? "戰鬥音效已開啟" : "戰鬥音效已關閉"}</span></Button></span></div>
    <section className={`battle-scene-board battle-scene-board-art habitat-${habitat.id}`} style={arenaBackground ? ({ "--battle-arena-art": `url("${arenaBackground}")` } as React.CSSProperties) : undefined}>
      <div className="battle-environment-light" aria-hidden="true"><span className="battle-environment-sun" /><span className="battle-environment-moon" /><span className="battle-environment-rain" /></div>
      <div className="battle-environment-chip" aria-label={`目前環境：${environmentLabel}`}>{worldState.period === "night" ? "☾" : worldState.rainy ? "雨" : "☀"} {environmentLabel}</div>
      {criticalPulse !== null && <div key={criticalPulse} className="battle-critical-burst" role="status" aria-live="assertive" data-testid="critical-visual-feedback"><span className="battle-critical-rays" aria-hidden="true" /><strong>🔥 暴擊！</strong><small>答題增幅 ×1.5</small></div>}
      {comboMilestone && <ComboMilestoneOverlay milestone={comboMilestone} particleCount={milestoneParticleCount} />}
      <div className="battle-scene-heading"><div><span className="eyebrow accent">CURRICULUM COMBAT</span><h1>潮汐競技場</h1><p>把理解化成行動，在一題一回合裡守住你的學習航線。</p></div><div className="battle-scene-badge">{encounter.name}{rareEncounter && <em>罕見遭遇</em>}<small>Lv.{encounter.level} 守門者 · {habitat.name}</small></div></div>
      <div className={`battle-machine-status phase-${battleMachine.phase.toLowerCase()}`} role="status" aria-live="polite" data-testid="battle-machine-status" data-battle-phase={battleMachine.phase}><span>對戰進度</span><strong>{isOffline ? "目前處於離線狀態" : battlePreparing ? "⚔️ 戰鬥準備中..." : battlePhaseCopy.label}</strong><small>{isOffline ? "倒數與戰鬥操作已暫停；恢復連線後即可繼續。" : battlePreparing ? "正在整理題目與回合資料，請稍候。" : battlePhaseCopy.detail}</small></div>
      <div className="duel-stage">
        <div className={`duel-character ally battle-combatant battle-character-idle ${battleMotion?.actor === "player" ? "battle-dash-forward is-attacking" : "is-idle"} ${hitFlash?.target === "ally" ? "battle-hit-flash-ally animate-shake is-taking-hit" : ""}`}>
          <span className={`battle-scene-orb ${allyPortrait ? `has-portrait has-image ${allyPortrait.className}` : ""}`} style={{ background: active?.accent }}>
            {allyPortrait ? <><img className="battle-portrait-image" src={allyPortrait.imageUrl} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add("image-unavailable"); }} /><span className="battle-avatar-mark" aria-hidden="true">{allyPortrait.glyph}</span></> : <WandSparkles size={34} />}
          </span>
          <strong>{active?.name ?? "學習夥伴"}</strong><small>Lv.{active?.level ?? 1} · 夥伴</small>
          <HpBar value={battle?.playerHp ?? active?.hp ?? 1} max={battle?.playerMaxHp ?? active?.maxHp ?? 1} tone="ally" crisis={crisisLevel} buffer={hpBuffers.ally?.value} />
          {damageFloat?.target === "ally" && <span key={`damage-${damageFloat.key}`} className="battle-damage-float battle-damage-float-ally" aria-hidden="true">-{damageFloat.value} HP!</span>}
          {statusFloat?.target === "ally" && <span key={`status-${statusFloat.key}`} className={`battle-status-float battle-status-float-ally battle-live-status-float is-player is-${statusFloat.tone}`} role="status" aria-live="polite">{statusFloat.label}</span>}
        </div>
        <div className="duel-vs">VS<span>✦</span></div>
        <div className={`duel-character enemy battle-combatant battle-character-idle battle-enemy ${battleMotion?.actor === "enemy" ? "battle-dash-forward is-attacking" : "is-idle"} ${hitFlash?.target === "enemy" ? "battle-hit-flash-enemy is-taking-hit" : ""}`}>
          <span className={`battle-scene-orb ${enemyPortrait ? `has-portrait has-image ${enemyPortrait.className}` : ""}`} style={{ background: encounter.accent }}>
            {enemyPortrait ? <><img className="battle-portrait-image" src={enemyPortrait.imageUrl} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add("image-unavailable"); }} /><span className="battle-avatar-mark" aria-hidden="true">{enemyPortrait.glyph}</span></> : <Sparkles size={34} />}
          </span>
          <strong>{encounter.name}</strong><small>學習守門者</small>
          <HpBar value={battle?.enemyHp ?? encounter.maxHp} max={battle?.enemyMaxHp ?? encounter.maxHp} tone="enemy" buffer={hpBuffers.enemy?.value} />
          {damageFloat?.target === "enemy" && <span key={`damage-${damageFloat.key}`} className="battle-damage-float battle-damage-float-enemy" aria-hidden="true">-{damageFloat.value} HP!</span>}
          {statusFloat?.target === "enemy" && <span key={`status-${statusFloat.key}`} className={`battle-status-float battle-status-float-enemy battle-live-status-float is-enemy is-${statusFloat.tone}`} role="status" aria-live="polite">{statusFloat.label}</span>}
        </div>
      </div>
      {!battle ? <div className="battle-scene-start"><div className="arena-habitat-picker" aria-label="選擇探索棲息地"><div className="arena-habitat-picker-heading"><strong>選擇觀測棲息地</strong><span>答對區域題目會開啟新地點；稀有訊號需要真實的學習進度。</span></div><div className="arena-habitat-grid">{habitats.map((item) => <button key={item.id} type="button" className={`arena-habitat-card ${item.id === habitat.id ? "selected" : ""} ${!item.unlocked ? "locked" : ""}`} onClick={() => chooseHabitat(item.id)} disabled={isOffline || !item.unlocked} aria-pressed={item.id === habitat.id} aria-label={`${item.name}：${item.unlocked ? "可探索" : `尚需答對 ${item.unlockTarget} 題`}`}><span className="arena-habitat-region">{item.region === "north" ? "北境" : item.region === "central" ? "中部" : item.region === "east" ? "東岸" : "南方"}</span><strong>{item.name}</strong><p>{item.description}</p><small>{item.unlocked ? item.rareEligible ? "稀有訊號可被偵測" : item.rareProgressLabel : `答對 ${item.unlockTarget} 題即可解鎖`}</small></button>)}</div></div><p>{habitat.description}。{habitat.rareEligible ? "此地的稀有遭遇已依學習紀錄開放。" : habitat.rareCondition}</p><Button onClick={startBattle} disabled={isOffline || battlePreparing || (battleMachine.phase !== BattlePhase.IDLE && battleMachine.phase !== BattlePhase.REWARD)}><Swords size={17} /> 從 {habitat.name} 開始對戰</Button></div> : battle.result !== "active" ? <div className={`battle-scene-result ${battle.result}`} aria-live="polite">
        <span>{battle.result === "victory" ? "✦" : "○"}</span><h2>{battle.result === "victory" ? "學習航線守住了" : "暫時撤退"}</h2><p>{feedback}</p>
        {battle.result === "victory" && (victoryStage === "offer" || victoryStage === "settlement") && <TreasureReveal encounterName={encounter.name} loot={victoryStage === "settlement" ? loot : null} onSpeak={speakBattleCue} />}
        {battle.result === "victory" && battleReview && <section className={`battle-review-card ${battleReview.partBreakTriggered ? "is-perfect" : ""}`} aria-label="本場戰鬥回顧" data-testid="battle-review"><div><span className="eyebrow">BATTLE REVIEW / 戰鬥回顧</span><h3>{battleReview.partBreakTriggered ? "完美擊殺・部位破壞成立" : "航線戰術已整理"}</h3></div><ul><li><strong>{battleReview.maxCombo}</strong><span>最大連擊</span></li><li><strong>{battleReview.strategyUses}</strong><span>策略技能施放</span></li><li><strong>{battleReview.partBreakTriggered ? "+30" : "—"}</strong><span>{battleReview.partBreakTriggered ? "完美擊殺金幣" : "本場未觸發部位破壞"}</span></li></ul></section>}
        {battle.result === "victory" && victoryStage === "offer" && battleMachine.phase === BattlePhase.RESULT && <div className="arena-result-actions"><Button onClick={beginCaptureQuestion} disabled={isOffline || state.energy < encounter.captureCost}><Sparkles size={16} /> 課綱捕捉 · {encounter.captureCost} 能量</Button><Button variant="outline" onClick={settleLoot} disabled={isOffline}><Gift size={16} /> 直接結算戰利品</Button>{state.energy < encounter.captureCost && <small>能量不足時，可返回探險地圖完成學習任務後再來捕捉。</small>}</div>}
        {battle.result === "victory" && victoryStage === "capture-question" && <div className={`battle-scene-question arena-capture-question question-theme-${subjectTheme(question.subject)}`}><span className="eyebrow">捕捉觀測 · {question.grade} 年級 · {question.subject}</span><h2>{question.prompt}</h2><p>答題表現會決定捕捉成功率；目前裝備提供 +{gearBonuses.capture}% 捕捉加成。</p><div className="battle-options" data-testid="battle-question-options" data-layout="two-columns">{question.options.map((option, index) => <Button key={option} variant="outline" onClick={() => answerCapture(index)} disabled={isOffline}><b>{String.fromCharCode(65 + index)}</b>{option}</Button>)}</div><small>限時 {seconds} 秒</small></div>}
        {battle.result === "victory" && victoryStage === "capture-result" && captureOutcome && <div className={`arena-capture-outcome ${captureOutcome.success ? "success" : "miss"}`}><strong>{captureOutcome.success ? `${encounter.name} 已回應你的觀測邀請` : `${encounter.name} 暫時沒有靠近`}</strong><p>{captureOutcome.correct ? "答題判定已納入捕捉計算。" : "這次答案尚待釐清；觀測紀錄仍會幫助你下次調整策略。"} 成功率 {captureOutcome.chance}%</p><Button onClick={settleLoot} disabled={isOffline}><Gift size={16} /> 查看戰利品結算</Button></div>}
        {battle.result === "victory" && victoryStage === "settlement" && loot && <div className="arena-loot-summary"><span className="arena-loot-icon"><Gift size={24} /></span><h3>{loot.companionAdded ? "新夥伴已加入圖鑑" : loot.duplicateSample ? "重複相遇轉為樣本獎勵" : "觀測戰利品已入帳"}</h3><ul>{loot.lines.map((line) => <li key={line}>{line}</li>)}</ul><div className="arena-result-actions"><Button onClick={startBattle}><Swords size={16} /> 再挑戰一次</Button><Button variant="outline" onClick={close}><ArrowLeft size={16} /> 返回探險地圖</Button></div></div>}
        {battle.result === "defeat" && battleMachine.phase === BattlePhase.RESULT && defeatReflection && <section className="battle-defeat-reflection" aria-labelledby="battle-defeat-reflection-title" data-testid="battle-defeat-reflection"><div className="battle-defeat-reflection-heading"><span aria-hidden="true"><BookOpen size={19} /></span><div><p className="eyebrow">NEXT STEP / 下一步</p><h3 id="battle-defeat-reflection-title">{defeatReflection.title}</h3></div></div><p>{defeatReflection.strategy}</p><div className="battle-defeat-reflection-actions"><Button type="button" variant="outline" onClick={() => speakBattleCue(defeatReflection.readout)} aria-label="朗讀策略回顧"><Volume2 size={15} aria-hidden="true" /> 朗讀策略回顧</Button>{defeatReflection.practice.status === "available" ? <Button ref={quickPracticeTriggerRef} type="button" onClick={startReinforcementPractice} aria-label={defeatReflection.practice.ariaLabel}><BookOpen size={16} aria-hidden="true" /> {defeatReflection.practice.label}</Button> : <p role="status">{defeatReflection.practice.message}</p>}</div></section>}
        {battle.result === "defeat" && reinforcementPractice && question && <section className="battle-defeat-practice" aria-labelledby="battle-defeat-practice-title" data-testid="battle-defeat-practice"><div><span className="eyebrow">ONE QUESTION RESET / 一題補強</span><h3 ref={reinforcementHeadingRef} id="battle-defeat-practice-title" tabIndex={-1}>{reinforcementPractice.stage === "complete" ? "一題補強已完成" : `練習：${question.learningTopic}`}</h3><p>{reinforcementPractice.stage === "complete" ? reinforcementPractice.correct ? "你抓住了這題的關鍵線索；航海圖也會留下這次完成的一題。" : `${question.explanation} 航海圖會留下這次完成的一題，方便你看見持續練習的足跡。` : "慢慢讀題，選出你目前最相信的答案；作答後會保留真實學習紀錄。"}</p></div>{reinforcementPractice.stage === "answering" ? <div className="battle-options" data-testid="battle-reinforcement-options" data-layout="two-columns">{question.options.map((option, index) => <Button key={option} variant="outline" onClick={() => answerReinforcementPractice(index)} disabled={isOffline}><b>{String.fromCharCode(65 + index)}</b>{option}</Button>)}</div> : <div className="battle-defeat-practice-actions"><Button type="button" onClick={() => setLocation("/map")} aria-label="查看航海圖上的一題補強記錄"><Sparkles size={16} aria-hidden="true" /> 查看航海圖獎勵</Button><Button type="button" onClick={startBattle}><Swords size={16} /> 帶著線索再挑戰</Button><Button type="button" variant="outline" onClick={closeReinforcementPractice}>回到策略回顧</Button></div>}</section>}
        {battle.result === "defeat" && !reinforcementPractice && battleMachine.phase === BattlePhase.RESULT && <Button onClick={startBattle} disabled={isOffline || battlePreparing}>重新整理線索</Button>}
      </div> : <div className="battle-scene-console">
        <div className="battle-scene-status" role="status"><strong>{feedback}</strong><span>{battle.phase === "question" ? `限時 ${seconds} 秒` : `戰鬥能量 ${battle.energy}`}</span></div>
        {guardianCue && battle.phase === "question" && <section className="battle-guardian-cue" role="status" aria-live="polite" data-testid="guardian-rhythm-cue"><div><span>守門者節奏提示</span><strong>先抓住關鍵線索</strong><p>{guardianCue.message}</p></div><Button type="button" variant="outline" onClick={() => speakBattleCue(guardianCue.message)} aria-label="朗讀守門者節奏提示"><Volume2 size={15} aria-hidden="true" /> 朗讀提示</Button></section>}
        {difficultyAssistOffered && !difficultyAssistApplied && <section className="battle-difficulty-assist" role="status" aria-live="assertive" data-testid="battle-difficulty-assist"><div><span className="eyebrow">LEARNING SUPPORT / 學習協助</span><strong>已連續三題需要整理，要切換為循序練習嗎？</strong><p>守門者生命會降低 30%，每題多 5 秒；學習紀錄仍會如實保留。</p></div><div><Button type="button" onClick={applyDifficultyAssist} disabled={isOffline}>降低難度</Button><Button type="button" variant="outline" onClick={() => setDifficultyAssistOffered(false)} disabled={isOffline}>維持目前難度</Button></div></section>}
        {difficultyAssistApplied && <p className="battle-difficulty-applied" role="status" data-testid="battle-difficulty-applied">循序練習已啟用：守門者生命 -30%，每題時間 +5 秒。</p>}
        {crisisLevel !== "safe" && <div className={`battle-crisis-alert is-${crisisLevel}`} role={crisisLevel === "critical" ? "alert" : "status"} aria-live="polite" data-testid="battle-crisis-alert"><ShieldCheck size={18} aria-hidden="true" /><div><span>{crisisLevel === "critical" ? "危機預警" : "防線警戒"}</span><strong>{crisisLevel === "critical" ? "生命值低於三成：先穩住節奏，再決定下一步。" : "生命值低於五成：留意守門者的下一次回應。"}</strong></div></div>}
        {tactics && <section className="battle-tactics" aria-label="本回合戰術預覽"><div className={`battle-tactics-intent enemy-phase-${enemyPhase}`}><span><Eye size={14} /> 守門者意圖</span><strong>{tactics.intent.title}</strong><p><b>預計反應 {tactics.intent.damage} 點</b>{tactics.intent.detail}</p><div className={`battle-enemy-phase enemy-phase-${enemyPhase}`} aria-live="polite" data-testid="battle-enemy-phase"><span>守門者階段</span><strong>{enemyPhaseCopy.label}</strong><small>{enemyPhaseCopy.detail}</small></div></div><div className="battle-tactics-actions">{tactics.actions.map((item) => <article key={item.id} className={item.unavailable ? "is-unavailable" : ""}><div><span>{item.badge}</span><strong>{item.label}</strong></div><p>{item.detail}</p><small><ShieldCheck size={12} /> {item.availability}</small></article>)}</div></section>}
        {battle.phase === "question" ? <div className={`battle-scene-question question-theme-${subjectTheme(question.subject)}`}><span className="eyebrow">{question.grade} 年級 · {question.subject} · {question.learningTopic}</span><h2>{question.prompt}</h2>{activeRageSkill && <p className="battle-active-strategy" role="status">{RAGE_SKILL_DEFINITIONS[activeRageSkill].label}已啟動：{RAGE_SKILL_DEFINITIONS[activeRageSkill].description}</p>}<div className="battle-options" data-testid="battle-question-options" data-layout="two-columns">{question.options.map((option, index) => <Button key={option} variant="outline" onClick={() => answer(index)} disabled={!playerCanAct}><b>{String.fromCharCode(65 + index)}</b>{option}</Button>)}</div></div> : <div className="battle-scene-actions">
          <div className={`battle-momentum ${comboCount > 0 ? "is-active" : ""} ${comboCritical.isCritical ? "is-charged" : ""}`} aria-live="polite" data-testid="battle-momentum"><div><span>答題連段動能</span><strong>{comboCritical.isCritical ? comboNarrative : comboCount > 0 ? `連答 ${comboCount} 題！` : "等待第一道答題動能"}</strong><small>{comboCritical.isCritical ? "三連擊已形成：接下來答對特殊行動會維持 1.5 倍答題增幅。" : "答對必殺或超必殺題會累積連段；連答三題後會啟動 1.5 倍答題增幅。"}</small></div><div className="battle-momentum-actions"><div className="battle-momentum-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, comboCount * 25)}%` }} /></div><Button type="button" variant="outline" size="sm" onClick={() => speakBattleCue(comboNarrative)} aria-label="朗讀答題連段提示"><Volume2 size={14} aria-hidden="true" /> 朗讀連段</Button></div></div>
          {comboCritical.isCritical && <div className="battle-critical-cue" role="status" aria-live="polite" data-testid="battle-critical-cue"><span aria-hidden="true">🔥</span><strong>連擊！</strong><p>連答 {comboCount} 題，答題增幅以 1.5 倍呈現。</p></div>}
        <section className="battle-rage-panel" aria-label="怒氣策略技能" data-testid="battle-rage-panel"><div className="battle-rage-heading"><div><span>怒氣值</span><strong>{rage} / {RAGE_CAP}</strong><small>答對 +10、答錯 +5；上限 100。</small></div><div className="battle-rage-meter" role="meter" aria-label={`怒氣值 ${rage}/${RAGE_CAP}`} aria-valuemin={0} aria-valuemax={RAGE_CAP} aria-valuenow={rage}><i style={{ width: `${rage}%` }} /></div></div>{!rageSkillTutorialSeen && <aside className="battle-rage-tutorial" aria-labelledby="battle-rage-tutorial-title" data-testid="battle-rage-tutorial"><div><span className="eyebrow">NEW EXPLORER / 新手提示</span><h3 id="battle-rage-tutorial-title">策略先選，再答題結算</h3><p>每招施放後會冷卻 {RAGE_SKILL_COOLDOWN_TURNS} 回合；守門者每次回應後，冷卻會減少 1。</p><ul>{(Object.keys(RAGE_SKILL_TUTORIAL_COPY) as BattleRageSkill[]).map((skill) => <li key={skill}><strong>{RAGE_SKILL_DEFINITIONS[skill].label}</strong><span>{RAGE_SKILL_TUTORIAL_COPY[skill]}</span></li>)}</ul></div><Button type="button" variant="outline" size="sm" onClick={dismissRageSkillTutorial} aria-label="知道策略技能提示了，關閉提示">知道了</Button></aside>}<div className="battle-rage-actions"><Button type="button" variant="outline" className={`${rageSkillCooldowns.precise > 0 ? "is-cooling" : ""} ${isBattleRageSkillHighlighted("precise", castHighlightSkill) ? "just-cast" : ""}`} onClick={() => beginRageSkill("precise")} disabled={isOffline || !playerCanAct || rage < RAGE_SKILL_DEFINITIONS.precise.cost || rageSkillCooldowns.precise > 0} aria-label={`精準打擊：${RAGE_SKILL_TUTORIAL_COPY.precise}${rageSkillCooldowns.precise > 0 ? `，冷卻中，剩餘 ${rageSkillCooldowns.precise} 回合` : ""}`}><Target size={15} /> 精準打擊 <small>{rageSkillCooldowns.precise > 0 ? `冷卻 ${rageSkillCooldowns.precise}` : "30"}</small>{rageSkillCooldowns.precise > 0 && <><CooldownRing skill="precise" remainingTurns={rageSkillCooldowns.precise} /><span className="battle-skill-cooldown" aria-hidden="true"><i style={{ width: `${getBattleRageSkillCooldownProgress(rageSkillCooldowns.precise)}%` }} /></span></>}</Button><Button type="button" variant="outline" className={`${rageSkillCooldowns.shield > 0 ? "is-cooling" : ""} ${isBattleRageSkillHighlighted("shield", castHighlightSkill) ? "just-cast" : ""}`} onClick={() => beginRageSkill("shield")} disabled={isOffline || !playerCanAct || rage < RAGE_SKILL_DEFINITIONS.shield.cost || rageSkillCooldowns.shield > 0} aria-label={`防護壁壘：${RAGE_SKILL_TUTORIAL_COPY.shield}${rageSkillCooldowns.shield > 0 ? `，冷卻中，剩餘 ${rageSkillCooldowns.shield} 回合` : ""}`}><ShieldCheck size={15} /> 防護壁壘 <small>{rageSkillCooldowns.shield > 0 ? `冷卻 ${rageSkillCooldowns.shield}` : "25"}</small>{rageSkillCooldowns.shield > 0 && <><CooldownRing skill="shield" remainingTurns={rageSkillCooldowns.shield} /><span className="battle-skill-cooldown" aria-hidden="true"><i style={{ width: `${getBattleRageSkillCooldownProgress(rageSkillCooldowns.shield)}%` }} /></span></>}</Button><Button type="button" variant="outline" className={`${rageSkillCooldowns.heal > 0 ? "is-cooling" : ""} ${isBattleRageSkillHighlighted("heal", castHighlightSkill) ? "just-cast" : ""}`} onClick={() => beginRageSkill("heal")} disabled={isOffline || !playerCanAct || rage < RAGE_SKILL_DEFINITIONS.heal.cost || battle.playerHp >= battle.playerMaxHp || rageSkillCooldowns.heal > 0} aria-label={`緊急包紮：${RAGE_SKILL_TUTORIAL_COPY.heal}${rageSkillCooldowns.heal > 0 ? `，冷卻中，剩餘 ${rageSkillCooldowns.heal} 回合` : ""}`}><HeartPulse size={15} /> 緊急包紮 <small>{rageSkillCooldowns.heal > 0 ? `冷卻 ${rageSkillCooldowns.heal}` : "20"}</small>{rageSkillCooldowns.heal > 0 && <><CooldownRing skill="heal" remainingTurns={rageSkillCooldowns.heal} /><span className="battle-skill-cooldown" aria-hidden="true"><i style={{ width: `${getBattleRageSkillCooldownProgress(rageSkillCooldowns.heal)}%` }} /></span></>}</Button></div></section><div className="battle-performance-summary"><strong>本回合可直接基礎攻擊</strong><p>必殺與超必殺會先開啟課綱題；答題表現會影響特殊行動的威力。</p></div><Button className="battle-action-card battle-action-basic" onClick={basicAttack} disabled={isOffline || !playerCanAct}><Swords size={16} /> 基礎攻擊 · 免答題</Button><Button className="battle-action-card battle-action-skill" onClick={() => beginSkillQuestion("skill")} disabled={isOffline || !playerCanAct || battle.energy < active!.skillCost}><Zap size={16} /> {active?.skillName} · {active?.skillCost} 能量 · 答題啟動</Button><Button className="battle-action-card battle-action-ultimate ultimate-action" onClick={() => beginSkillQuestion("ultimate")} disabled={isOffline || !playerCanAct || battle.ultimateUsed || battle.energy < Math.max(8, active!.skillCost * 2)}><Sparkles size={16} /> {ultimateName} · 答題啟動</Button>
        </div>}
        <div className="battle-scene-log">{battle.log.slice(-3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </div>}
    </section>
  </main>;
  return modal ? <div className="battle-modal-backdrop" role="dialog" aria-modal="true">{content}</div> : content;
}
