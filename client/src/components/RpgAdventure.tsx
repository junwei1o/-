import React, { useEffect, useMemo, useRef, useState } from "react";
import { Backpack, BookOpen, Coins, Compass, Heart, LockKeyhole, Sparkles, Swords, WandSparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyBattleAction, applyBattleAnswer, beginBattleQuestion, createBattle } from "@/game/rpgBattle";
import { calculateBattlePerformance } from "@/game/rpgQuestionCombat";
import { getCombatFeedback, playCombatSfx, type CombatFeedback } from "@/game/rpgCombatFeedback";
import { guardianCeremonyNarration, playGuardianCeremonySfx } from "@/game/guardianCeremonyFeedback";
import { combatStyleForCompanion } from "@/game/companionCombatStyles";
import { evolveCompanion, evolutionStageFor, nextEvolutionFor } from "@/game/companionEvolution";
import { companionById, completeAcademyBoss, loadRpgState, saveRpgState } from "@/game/rpgStorage";
import { answerAdaptiveBoss, bossPhaseLabel, bossVisualEvent, createAdaptiveBoss, retryAdaptiveBoss, type AdaptiveBossState, type BossVisualEvent } from "@/game/adaptiveBoss";
import { affectionLevel, affectionProgress, equippedSkillLabels, GROWTH_ACHIEVEMENTS, growthForAnswer, trainCompanion, type GrowthAction } from "@/game/companionGrowth";
import { COMPANION_CATALOG, encounterForRegion, REGION_LABELS } from "@/game/rpgData";
import type { RegionKey, RpgState } from "@/game/rpgTypes";
import type { SubjectKey } from "@/game/expeditionContent";
import { academyGearBonuses, academyObjectiveStatus, academyRouteFor, expeditionStage, gearForRoute, ACADEMY_GEAR } from "@/game/academyQuestData";
import { academyDayKey, dailyExpeditionForDate } from "@/game/academyDaily";
import { academyOnboardingStatus } from "@/game/academyOnboarding";
import { activeStoryQuests, claimStoryQuest, storyQuestStatus } from "@/game/academyStory";
import { missionForChapter, REGION_MISSIONS } from "@/game/regionMissionRewards";
import { activeHabitatDailyStatus, habitatDailyStatuses } from "@/game/habitatDailyMissions";
import ExpeditionObservationCard from "@/components/ExpeditionObservationCard";
import MainlineGuardianPanel from "@/components/MainlineGuardianPanel";
import { getBattleVolume, getMainlineProgress, recordGuardianDefeat } from "@/utils/storage";
import { createSpeechController, type SpeechController } from "@/lib/speechSynthesis";
import { loadSpeechPreferences } from "@/lib/speechPreferences";
import { getAreaGuardian } from "@/game/mainlineFeatures";
import { getSpacedReviewSummary, loadAdaptiveProfile, recordAdaptiveAttempt, saveAdaptiveProfile, selectSpacedReviewQuestion, type AdaptiveProfile } from "@/game/adaptiveLearning";
import { addGearFragment, baseAttributes, craftGear, createWorldEvent, equipmentBonuses, eventIsActive, GEAR_CATALOG, spendTalentPoint, TALENT_CATALOG, worldStateForTime, type TalentId, type WorldEventKind } from "@/game/academyExpansion";
import "./GuardianCeremony.css";

type BattleQuestion = { id: string; area: string | null; subject: string; grade: number; difficulty: "基礎" | "標準" | "挑戰"; prompt: string; options: string[]; answer: number; explanation: string; learningTopic: string; curriculumDomain: string };
type GrowthPending = { action: GrowthAction | "evolve"; questionId: string; startedAt: number };
type GuardianCeremony = { phase: "entrance" | "victory"; guardianId: string; guardianName: string; guardianEmoji: string; areaLabel: string; subject: SubjectKey; regionColor: "gold" | "silver" | "blue" | "green"; liberationText: string };
type Props = { onOpenChallenge?: (subject?: "數學" | "自然" | "社會" | "國語") => void; questionPool?: BattleQuestion[]; soundEnabled?: boolean };
const regionKeys: RegionKey[] = ["north", "central", "east", "south"];
const MAINLINE_SUBJECT_BY_REGION: Record<RegionKey, SubjectKey> = { north: "chinese", central: "math", east: "science", south: "english" };
const BATTLE_TIME_LIMIT_MS = 25_000;
const GUARDIAN_REGION_COLORS: Record<SubjectKey, GuardianCeremony["regionColor"]> = { chinese: "gold", math: "silver", english: "blue", science: "green" };
const GUARDIAN_ENTRANCE_DURATION_MS = 2_500;
const GUARDIAN_VICTORY_DURATION_MS = 2_100;

function GuardianCeremonyOverlay({ ceremony }: { ceremony: GuardianCeremony }) {
  const isEntrance = ceremony.phase === "entrance";
  return <section
    className={`guardian-ceremony-overlay is-${ceremony.phase}`}
    data-region-color={ceremony.regionColor}
    aria-live="assertive"
    aria-label={isEntrance ? `${ceremony.guardianName} 入場` : `${ceremony.areaLabel} 區域解放`}
  >
    <div className="guardian-ceremony-darkness" aria-hidden="true" />
    <div className="guardian-ceremony-stage">
      <span className="guardian-ceremony-rift guardian-ceremony-rift-a" aria-hidden="true" />
      <span className="guardian-ceremony-rift guardian-ceremony-rift-b" aria-hidden="true" />
      <div className="guardian-ceremony-particles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => <i key={index} style={{ "--particle-index": index } as React.CSSProperties} />)}
      </div>
      <div className="guardian-ceremony-figure" aria-hidden="true">{ceremony.guardianEmoji}</div>
      {isEntrance ? <div className="guardian-ceremony-copy">
        <span>GUARDIAN AWAKENS · {ceremony.areaLabel}</span>
        <strong>{ceremony.guardianName} · {ceremony.areaLabel}的墮落守護者</strong>
        <p>知識封印正在震動。用每一道正確線索，重新點亮這片土地。</p>
      </div> : <div className="guardian-liberation-copy">
        <span>SEAL RELEASED · {ceremony.areaLabel}</span>
        <strong>區域解放！</strong>
        <p>{ceremony.liberationText}</p>
      </div>}
    </div>
  </section>;
}

export default function RpgAdventure({ onOpenChallenge, questionPool = [], soundEnabled = true }: Props) {
  const [state, setState] = useState<RpgState>(() => loadRpgState());
  const [rosterOpen, setRosterOpen] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [combatFeedback, setCombatFeedback] = useState<CombatFeedback | null>(null);
  const [boss, setBoss] = useState<AdaptiveBossState | null>(null);
  const [bossVisual, setBossVisual] = useState<{ event: Exclude<BossVisualEvent, null>; key: number } | null>(null);
  const [guardianCeremony, setGuardianCeremony] = useState<GuardianCeremony | null>(null);
  const [growthPending, setGrowthPending] = useState<GrowthPending | null>(null);
  const [adaptiveProfile, setAdaptiveProfile] = useState<AdaptiveProfile>(() => loadAdaptiveProfile());
  const previousBattleRef = useRef<RpgState["battle"]>(null);
  const previousBossRef = useRef<AdaptiveBossState | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const bossVisualTimerRef = useRef<number | null>(null);
  const guardianCeremonyTimerRef = useRef<number | null>(null);
  const guardianSpeechRef = useRef<SpeechController | null>(null);
  if (!guardianSpeechRef.current) guardianSpeechRef.current = createSpeechController();
  const active = useMemo(() => state.companions.find((item) => item.id === state.activeCompanionId) ?? state.companions[0], [state]);
  const activeRoute = academyRouteFor(state.currentRegion);
  const routeProgress = state.academyProgress?.[activeRoute.region] ?? { correctAnswers: 0, bossVictories: 0 };
  const routeObjectives = academyObjectiveStatus(routeProgress.correctAnswers, routeProgress.bossVictories);
  const gearBonuses = useMemo(() => academyGearBonuses(state.academyGearIds), [state.academyGearIds]);
  const expansionGearBonuses = useMemo(() => equipmentBonuses(state.expansionProgress ?? { talentPoints: 0, talents: {}, equippedGearIds: [], fragments: {} }), [state.expansionProgress]);
  const expedition = expeditionStage(state.explored.length);
  const dailyExpedition = useMemo(() => dailyExpeditionForDate(academyDayKey()), []);
  const dailyProgress = state.academyDaily?.dayKey === dailyExpedition.dayKey
    ? state.academyDaily
    : { dayKey: dailyExpedition.dayKey, correctAnswers: 0, rewarded: false };
  const habitatDaily = activeHabitatDailyStatus(state, dailyExpedition.dayKey);
  const unlockedHabitatDailies = habitatDailyStatuses(state, dailyExpedition.dayKey).filter((item) => item.unlocked);
  const onboarding = academyOnboardingStatus(state.academyOnboarding);
  const storyQuests = useMemo(() => activeStoryQuests(state.currentRegion), [state.currentRegion]);
  const regionMission = useMemo(() => missionForChapter(state.currentRegion), [state.currentRegion]);
  const regionMissionProgress = regionMission ? state.regionMissionProgress?.[regionMission.id] ?? { correct: 0, completed: false, claimed: false } : null;
  const missionPercent = regionMission ? Math.min(100, Math.round((regionMissionProgress!.correct / regionMission.targetCorrect) * 100)) : 0;
  const allMissions = useMemo(() => REGION_MISSIONS.map((mission) => ({ mission, progress: state.regionMissionProgress?.[mission.id] ?? { correct: 0, completed: false, claimed: false } })), [state.regionMissionProgress]);
  const mainlineProgress = getMainlineProgress();
  const worldState = useMemo(() => worldStateForTime(now, (new Date(now).getDate() % 10) / 10), [now]);
  const expansionProgress = state.expansionProgress ?? { talentPoints: 0, talents: {}, equippedGearIds: [], fragments: {}, journalSummaries: [], activeWorldEvents: [], worldEventDayKey: "", worldEventsTriggeredToday: 0 };
  const activeWorldEvents = expansionProgress.activeWorldEvents.filter((event) => eventIsActive(event, now));
  const regionLiberated = mainlineProgress.liberatedSubjects.includes(activeRoute.subject);
  const playerAttributes = useMemo(() => {
    const base = baseAttributes(active?.level ?? 1);
    const gear = equipmentBonuses(expansionProgress);
    return { attack: base.attack + gear.attack, defense: base.defense + gear.defense, luck: base.luck + gear.rareEncounterRate };
  }, [active?.level, expansionProgress]);
  const knowledgeNodes = useMemo(() => regionKeys.map((region) => {
    const route = academyRouteFor(region);
    const correctAnswers = state.academyProgress?.[region]?.correctAnswers ?? 0;
    return { id: region, subject: route.subject, domain: route.domain, correctAnswers, lit: correctAnswers >= 3 };
  }), [state.academyProgress]);
  const companionVisualStage = !active || active.level < 10
    ? { label: "星芽階段", detail: "Lv.10 解鎖耀光外觀提示", stage: "sprout" }
    : active.level < 25
      ? { label: "耀光階段", detail: "Lv.25 解鎖星核外觀提示", stage: "radiant" }
      : { label: "星核階段", detail: "已達最高等級視覺階段", stage: "core" };
  const encounter = state.encounter;
  const routeQuestions = useMemo(() => {
    const matching = questionPool.filter((item) => item.subject === activeRoute.subject);
    return matching.length > 0 ? matching : questionPool;
  }, [activeRoute.subject, questionPool]);
  const reviewSummary = useMemo(() => getSpacedReviewSummary(adaptiveProfile, new Set(routeQuestions.map((item) => item.id))), [adaptiveProfile, routeQuestions]);
  const bossQuestion = useMemo(() => {
    if (!boss || routeQuestions.length === 0) return null;
    return routeQuestions.find((item) => item.difficulty === boss.questionDifficulty) ?? routeQuestions[0];
  }, [boss, routeQuestions]);
  const battleQuestion = useMemo(() => {
    if (!state.battle || questionPool.length === 0) return null;
    return questionPool.find((item) => item.id === state.battle?.questionId) ?? questionPool[0];
  }, [questionPool, state.battle]);
  const growthQuestion = useMemo(() => {
    if (!growthPending || questionPool.length === 0) return null;
    return questionPool.find((item) => item.id === growthPending.questionId) ?? questionPool[0];
  }, [growthPending, questionPool]);
  const battleQuestionIsDueReview = Boolean(battleQuestion && (adaptiveProfile.spacedReviews ?? []).some((item) => item.questionId === battleQuestion.id && item.dueAt <= Date.now()));

  const announceGuardianCeremony = (ceremony: GuardianCeremony) => {
    playGuardianCeremonySfx(ceremony.subject, ceremony.phase, soundEnabled);
    const speech = guardianSpeechRef.current;
    if (!soundEnabled || !speech) {
      speech?.stop();
      return;
    }
    const preferences = loadSpeechPreferences();
    const narrationVolume = Math.min(preferences.volume, getBattleVolume());
    if (narrationVolume <= 0) {
      speech.stop();
      return;
    }
    speech.setPreferences({ ...preferences, volume: narrationVolume });
    speech.speak(guardianCeremonyNarration(ceremony.subject, ceremony.phase));
  };

  useEffect(() => saveRpgState(state), [state]);
  useEffect(() => saveAdaptiveProfile(adaptiveProfile), [adaptiveProfile]);
  useEffect(() => {
    const previous = previousBattleRef.current;
    const next = state.battle;
    const feedback = getCombatFeedback(previous, next, active);
    previousBattleRef.current = next;
    if (!feedback) return;
    setCombatFeedback(feedback);
    playCombatSfx(feedback.event, soundEnabled, active);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setCombatFeedback(null), 1_100);
  }, [active, soundEnabled, state.battle]);
  useEffect(() => {
    const event = bossVisualEvent(previousBossRef.current, boss);
    previousBossRef.current = boss;
    if (!event) return;
    setBossVisual({ event, key: Date.now() });
    if (bossVisualTimerRef.current !== null) window.clearTimeout(bossVisualTimerRef.current);
    bossVisualTimerRef.current = window.setTimeout(() => setBossVisual(null), event === "phase-transition" || event === "victory" ? 1800 : 1000);
  }, [boss]);
  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    if (bossVisualTimerRef.current !== null) window.clearTimeout(bossVisualTimerRef.current);
    if (guardianCeremonyTimerRef.current !== null) window.clearTimeout(guardianCeremonyTimerRef.current);
    guardianSpeechRef.current?.stop();
  }, []);
  useEffect(() => {
    setQuestionStartedAt(Date.now());
    setNow(Date.now());
    if (state.battle?.phase !== "question") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [state.battle?.phase, state.battle?.questionId]);

  const announce = (notice: string) => setState((current) => ({ ...current, notice }));
  const nextQuestionId = (currentId: string, profile = adaptiveProfile) => {
    if (routeQuestions.length < 2) return currentId;
    const candidates = routeQuestions.filter((item) => item.id !== currentId);
    return selectSpacedReviewQuestion(candidates, profile).question?.id ?? candidates[0]?.id ?? currentId;
  };
  const spendTalent = (id: TalentId) => setState((current) => { const currentExpansion = current.expansionProgress ?? expansionProgress; const nextGrowth = spendTalentPoint(currentExpansion, id); return { ...current, expansionProgress: { ...currentExpansion, ...nextGrowth }, notice: `天賦「${TALENT_CATALOG.find((item) => item.id === id)?.label ?? id}」已提升。` }; });
  const craftExpansionGear = (gearId: string) => setState((current) => { const currentExpansion = current.expansionProgress ?? expansionProgress; const nextGrowth = craftGear(currentExpansion, gearId); return { ...current, expansionProgress: { ...currentExpansion, ...nextGrowth }, notice: `已嘗試合成 ${GEAR_CATALOG.find((item) => item.id === gearId)?.label ?? "裝備"}。` }; });
  const triggerWorldEvent = (kind: WorldEventKind) => {
    if (expansionProgress.worldEventsTriggeredToday >= 3) return announce("今日的世界事件已達 3 次；明天再來尋找新的線索。");
    const event = createWorldEvent({ kind, region: state.currentRegion, now });
    setState((current) => ({ ...current, expansionProgress: { ...(current.expansionProgress ?? expansionProgress), activeWorldEvents: [...(current.expansionProgress?.activeWorldEvents ?? []), event].slice(-3), worldEventsTriggeredToday: (current.expansionProgress?.worldEventsTriggeredToday ?? 0) + 1, worldEventDayKey: new Date(now).toISOString().slice(0, 10) }, notice: `${event.label}出現在${REGION_LABELS[state.currentRegion]}！` }));
  };
  const explore = (region: RegionKey) => {
    const found = encounterForRegion(region);
    const route = academyRouteFor(region);
    setState((current) => ({ ...current, currentRegion: region, explored: current.explored.includes(region) ? current.explored : [...current.explored, region], mode: "encounter", encounter: found, battle: null, notice: `已抵達${route.title}：${route.questTitle}正等待你的解題線索。` }));
  };
  const enterBattle = () => {
    if (!encounter || !active) return;
    const selected = selectSpacedReviewQuestion(routeQuestions, adaptiveProfile);
    setState((current) => ({ ...current, mode: "battle", battle: { ...createBattle(active, encounter, selected.question?.id), energy: current.energy }, notice: selected.isReview ? `到期複習線索已優先安排；${active.name} 會陪你重新整理這一題。` : `${active.name} 站到前方；普通行動可直接使用；施放必殺與超必殺時回答課綱題。` }));
  };
  const learnForEnergy = () => onOpenChallenge?.();
  const startHabitatDaily = () => {
    if (!habitatDaily?.unlocked) return;
    const next = { ...state, currentRegion: habitatDaily.mission.region, notice: `前往${habitatDaily.mission.title}：完成 ${habitatDaily.mission.subject} 題目即可推進棲息地線索。` } as RpgState;
    saveRpgState(next);
    setState(next);
    onOpenChallenge?.(habitatDaily.mission.subject);
  };
  const startBoss = (guardianSubject?: SubjectKey) => {
    const guardian = guardianSubject ? getAreaGuardian(guardianSubject) : null;
    if (!guardian) {
      setBoss(createAdaptiveBoss(activeRoute.bossTitle));
      return;
    }
    if (guardianCeremonyTimerRef.current !== null) window.clearTimeout(guardianCeremonyTimerRef.current);
    const ceremony: GuardianCeremony = {
      phase: "entrance",
      guardianId: guardian.id,
      guardianName: guardian.name,
      guardianEmoji: guardian.emoji,
      areaLabel: guardian.areaLabel,
      subject: guardian.subject,
      regionColor: GUARDIAN_REGION_COLORS[guardian.subject],
      liberationText: `${guardian.areaLabel}的知識之光重新點亮，${guardian.lore}`,
    };
    setBoss(null);
    setGuardianCeremony(ceremony);
    announceGuardianCeremony(ceremony);
    guardianCeremonyTimerRef.current = window.setTimeout(() => {
      guardianSpeechRef.current?.stop();
      setGuardianCeremony(null);
      setBoss(createAdaptiveBoss(guardian.name, { kind: "guardian", baseHp: 30 }));
      guardianCeremonyTimerRef.current = null;
    }, GUARDIAN_ENTRANCE_DURATION_MS);
  };
  const claimStoryReward = (questId: string) => setState((current) => claimStoryQuest(current, questId));
  const answerBoss = (option: number) => {
    if (!boss || !bossQuestion || boss.outcome !== "active" || guardianCeremony) return;
    const nextBoss = answerAdaptiveBoss(boss, option === bossQuestion.answer);
    setBoss(nextBoss);
    if (nextBoss.outcome !== "victory") return;
    if (nextBoss.kind !== "guardian") {
      setState((current) => completeAcademyBoss(current, activeRoute.region));
      return;
    }
    const guardian = getAreaGuardian(MAINLINE_SUBJECT_BY_REGION[activeRoute.region]);
    if (guardianCeremonyTimerRef.current !== null) window.clearTimeout(guardianCeremonyTimerRef.current);
    const ceremony: GuardianCeremony = {
      phase: "victory",
      guardianId: guardian.id,
      guardianName: guardian.name,
      guardianEmoji: guardian.emoji,
      areaLabel: guardian.areaLabel,
      subject: guardian.subject,
      regionColor: GUARDIAN_REGION_COLORS[guardian.subject],
      liberationText: `${guardian.areaLabel}的封印已消散。${guardian.reward.legendaryTitle}與${guardian.reward.outfitLabel}已加入你的遠征紀錄。`,
    };
    setGuardianCeremony(ceremony);
    announceGuardianCeremony(ceremony);
    guardianCeremonyTimerRef.current = window.setTimeout(() => {
      guardianSpeechRef.current?.stop();
      recordGuardianDefeat(guardian.id, guardian.subject, guardian.reward.outfitId);
      setState((current) => completeAcademyBoss(current, activeRoute.region));
      setGuardianCeremony(null);
      guardianCeremonyTimerRef.current = null;
    }, GUARDIAN_VICTORY_DURATION_MS);
  };
  const updateBattle = (next: RpgState["battle"]) => setState((current) => ({ ...current, battle: next, mode: next?.result === "victory" ? "victory" : next?.result === "defeat" ? "defeat" : "battle", energy: Math.max(0, next?.energy ?? current.energy) }));
  const answerBattleQuestion = (option: number) => {
    if (!state.battle || !battleQuestion || state.battle.phase !== "question" || state.battle.turn !== "player") return;
    const responseMs = Date.now() - questionStartedAt;
    const correct = option === battleQuestion.answer;
    const nextProfile = recordAdaptiveAttempt(adaptiveProfile, { questionId: battleQuestion.id, curriculumDomain: battleQuestion.curriculumDomain, knowledge: [battleQuestion.learningTopic], difficulty: battleQuestion.difficulty, correct, responseMs, timeLimitMs: BATTLE_TIME_LIMIT_MS });
    setAdaptiveProfile(nextProfile);
    const precisionTalentRate = (expansionProgress.talents.precision ?? 0) * 0.02;
    const resilienceTalentDefense = (expansionProgress.talents.resilience ?? 0) * 2;
    const performance = calculateBattlePerformance({ questionId: battleQuestion.id, correct, responseMs, streak: state.battle.performance?.correct ? 1 : 0, basePower: (active?.energyPower ?? 8) + (playerAttributes.attack - 10) + gearBonuses.attack, passiveSkillIds: active?.passiveSkillIds ?? [], defenseBonus: playerAttributes.defense + gearBonuses.defense + resilienceTalentDefense, captureBonus: gearBonuses.capture, criticalRate: expansionGearBonuses.criticalRate + precisionTalentRate, attackMultiplier: worldState.battleAttackMultiplier });
    const next = applyBattleAnswer(state.battle, performance);
    updateBattle(next);
    enemyResponse(next, nextProfile);
  };
  const enemyResponse = (next: RpgState["battle"], profile = adaptiveProfile) => {
    if (!next || next.turn !== "enemy" || next.result !== "active") return;
    window.setTimeout(() => updateBattle(applyBattleAction(next, { type: "enemy", damage: Math.max(1, (encounter?.level ?? 1) + 1 - (next.performance?.defensePower ?? 0)) }, nextQuestionId(next.questionId, profile))), 260);
  };
  const skill = () => {
    if (!state.battle || !active || (state.battle.phase !== "ready" && state.battle.phase !== "action") || questionPool.length === 0) return;
    const next = beginBattleQuestion(state.battle, { type: "skill", cost: active.skillCost, power: active.energyPower, label: active.skillName }, nextQuestionId(state.battle.questionId));
    updateBattle(next);
  };
  const ultimate = () => {
    if (!state.battle || !active || (state.battle.phase !== "ready" && state.battle.phase !== "action") || state.battle.ultimateUsed || questionPool.length === 0) return;
    const cost = Math.max(8, active.skillCost * 2);
    const next = beginBattleQuestion(state.battle, { type: "ultimate", cost, power: active.energyPower + 6, label: combatStyleForCompanion(active).ultimateName }, nextQuestionId(state.battle.questionId));
    updateBattle(next);
  };
  const basicAttack = () => {
    if (!state.battle || !active || (state.battle.phase !== "ready" && state.battle.phase !== "action")) return;
    const next = applyBattleAction(state.battle, { type: "basic", power: Math.max(2, Math.round(active.energyPower / 2)), label: "基礎攻擊" });
    updateBattle(next);
    enemyResponse(next);
  };
  const capture = () => {
    if (!state.battle || !encounter || (state.battle.phase !== "ready" && state.battle.phase !== "action")) return;
    const weakenedBonus = state.battle.enemyHp <= Math.ceil(state.battle.enemyMaxHp * 0.45) ? 20 : 0;
    const success = Math.random() * 100 < Math.min(90, 35 + state.battle.energy * 3 + gearBonuses.capture + weakenedBonus);
    const next = applyBattleAction(state.battle, { type: "capture", cost: encounter.captureCost, success });
    updateBattle(next);
    enemyResponse(next);
    if (success) setState((current) => ({ ...current, companions: current.companions.some((item) => item.id === encounter.id) ? current.companions : [...current.companions, { ...companionById("tide-scout"), id: encounter.id, name: encounter.name, epithet: encounter.description, region: encounter.region, rarity: "common", accent: encounter.accent, dialogue: ["我會把今天看到的線索記下來！"], skillName: "新芽回應", skillCost: 3, energyPower: 8, hp: 34, maxHp: 34 }], notice: `${encounter.name} 加入了你的島嶼圖鑑！` }));
  };
  const beginGrowthQuestion = (action: GrowthAction | "evolve") => {
    if (!active || questionPool.length === 0) return;
    if (action === "feed" && state.coins < 5) return announce("金幣不足；完成題目可以補充金幣。");
    if (action !== "feed" && action !== "evolve" && (active.trainingPoints ?? 0) < 2) return announce("訓練點不足；完成正確答題與課綱成就即可取得更多訓練點。");
    const question = routeQuestions[0] ?? questionPool[0];
    setGrowthPending({ action, questionId: question.id, startedAt: Date.now() });
    setQuestionStartedAt(Date.now());
  };
  const answerGrowthQuestion = (option: number) => {
    if (!growthPending || !growthQuestion || !active) return;
    const correct = option === growthQuestion.answer;
    const answered = growthForAnswer(active, { correct, curriculumDomain: growthQuestion.curriculumDomain, learningTopic: growthQuestion.learningTopic, responseMs: Date.now() - growthPending.startedAt });
    if (!correct) {
      setGrowthPending(null);
      return setState((current) => ({ ...current, companions: current.companions.map((item) => item.id === active.id ? answered : item), notice: `這次養成題尚未答對；${active.name} 等你整理線索後再試。` }));
    }
    if (growthPending.action === "evolve") {
      const result = evolveCompanion(answered, state.energy);
      setGrowthPending(null);
      if (!result) return setState((current) => ({ ...current, companions: current.companions.map((item) => item.id === active.id ? answered : item), notice: `目前能量或進化條件不足，${active.name} 先保留在目前階段。` }));
      return setState((current) => ({ ...current, energy: result.energy, companions: current.companions.map((item) => item.id === active.id ? result.companion : item), notice: `${result.companion.name} 完成進化，解鎖：${result.stage.passiveLabels.join("、") || "新的成長外觀"}！` }));
    }
    if (growthPending.action === "feed") {
      const gainedXp = 10;
      const nextLevel = answered.xp + gainedXp >= 30;
      const fed = { ...answered, xp: answered.xp + gainedXp, level: answered.level + (nextLevel ? 1 : 0), maxHp: answered.maxHp + (nextLevel ? 4 : 0), hp: answered.maxHp + (nextLevel ? 4 : 0) };
      setState((current) => ({ ...current, coins: current.coins - 5, companions: current.companions.map((item) => item.id === active.id ? fed : item), notice: `${active.name} 吃飽了，獲得養成經驗與默契。` }));
    } else {
      const trained = trainCompanion(answered, growthPending.action);
      if (!trained) {
        setGrowthPending(null);
        return announce("訓練點不足；完成更多正確答題即可繼續訓練。");
      }
      setState((current) => ({ ...current, companions: current.companions.map((item) => item.id === active.id ? trained : item), notice: `${active.name} 完成${growthPending.action === "train-focus" ? "專注" : growthPending.action === "train-guard" ? "守護" : "捕捉觀測"}訓練！` }));
    }
    setGrowthPending(null);
  };
  const trainActive = (action: "train-focus" | "train-guard" | "train-capture") => beginGrowthQuestion(action);
  const toggleSkill = (skillId: string) => {
    if (!active) return;
    setState((current) => ({ ...current, companions: current.companions.map((item) => {
      if (item.id !== active.id) return item;
      const equipped = item.equippedSkillIds ?? [];
      const next = equipped.includes(skillId) ? equipped.filter((id) => id !== skillId) : equipped.length < 2 ? [...equipped, skillId] : equipped;
      return { ...item, equippedSkillIds: next, notice: next.length === equipped.length && !equipped.includes(skillId) ? "最多配置兩個技能；先卸下現有技能再切換。" : `${item.name} 的技能配置已更新。` };
    }) }));
  };
  const evolveActive = () => {
    if (!active) return;
    if (!nextEvolutionFor(active) || state.energy < nextEvolutionFor(active)!.requiredEnergy) return announce(`再累積答題能量即可進化；下一階需要 ${nextEvolutionFor(active)?.requiredEnergy ?? "更多"} 能量。`);
    beginGrowthQuestion("evolve");
  };

  return <main className="rpg-shell academy-shell" aria-label="寶島學苑學習 RPG">
    {guardianCeremony && <GuardianCeremonyOverlay ceremony={guardianCeremony} />}
    <header className="rpg-header"><div><p className="eyebrow">TREASURE ISLAND ACADEMY / ANSWER TO EXPLORE</p><h1>寶島學苑：今日遠征</h1><p className="rpg-subtitle">每一次理解，都會點亮下一段路。選擇任務、回答課綱題，和夥伴一起修復學習星圖。</p></div><div className="rpg-header-ledger" aria-label="本日遠征導覽"><span>FIELD NOTE</span><strong>{activeRoute.subject} · {REGION_LABELS[state.currentRegion]}</strong><small>下一步：收集一則正確線索</small></div><div className="rpg-resources" aria-label="學習資源"><span><Zap size={16} aria-hidden /> {state.energy} 能量</span><span><Coins size={16} aria-hidden /> {state.coins} 金幣</span></div></header>
    <section className="academy-command-deck" aria-label="今日遠征總覽">
      <div className={`academy-world-state-card ${worldState.period === "night" ? "is-night" : ""} ${worldState.rainy ? "is-rainy" : ""}`}>
        <div><span className="academy-kicker">LIVING WORLD · {worldState.period === "night" ? "夜間航行" : "白日航行"}</span><strong>{worldState.rainy ? "雨季線索活躍" : "島嶼天氣平穩"}</strong><small>{worldState.period === "night" ? "怪物攻擊力 +10%" : "正常戰鬥狀態"}{worldState.rainy ? " · 補血藥水掉落率 +15%" : ""}{worldState.festival ? ` · ${worldState.festival}` : ""}</small></div>
        <div className="academy-world-event-actions" aria-label="觸發世界事件"><Button size="sm" variant="outline" onClick={() => triggerWorldEvent("knowledge-storm")} disabled={expansionProgress.worldEventsTriggeredToday >= 3}>知識風暴</Button><Button size="sm" variant="outline" onClick={() => triggerWorldEvent("wandering-merchant")} disabled={expansionProgress.worldEventsTriggeredToday >= 3}>流浪商人</Button><Button size="sm" variant="outline" onClick={() => triggerWorldEvent("mystery-chest")} disabled={expansionProgress.worldEventsTriggeredToday >= 3}>神秘寶箱</Button></div>
      </div>
      {activeWorldEvents.length > 0 && <div className="academy-world-events" aria-label="進行中的世界事件">{activeWorldEvents.map((event) => <article key={event.id}><span aria-hidden="true">✦</span><div><strong>{event.label} · {REGION_LABELS[event.region]}</strong><p>{event.description}</p></div><small>剩餘 {Math.max(1, Math.ceil((event.expiresAt - now) / 60_000))} 分鐘</small></article>)}</div>}
      <div className="academy-stage-card"><span className="academy-kicker">學苑旅程 · {expedition.label}</span><strong>{expedition.detail}</strong><div className="academy-stage-meter" aria-label={`已完成 ${state.explored.length} 條學習路徑`}><i style={{ width: `${Math.min(100, (state.explored.length / 4) * 100)}%` }} /></div><small>{state.explored.length} / 4 條路徑已探索</small></div>
      <div className="academy-today-card" style={{ "--route-accent": activeRoute.color } as React.CSSProperties}><div><span className="academy-kicker">今日任務 · {activeRoute.subject}／{activeRoute.domain}</span><h2>{activeRoute.questTitle}</h2><p>{activeRoute.questSummary}</p><small>{activeRoute.reward} · 任務進度 {routeObjectives.filter((item) => item.complete).length}/3</small></div><Button onClick={learnForEnergy}><BookOpen size={16} /> 開始答題</Button></div>
      <div className={`academy-daily-card ${dailyProgress.rewarded ? "is-complete" : ""}`}><div><span className="academy-kicker">DAILY EXPEDITION · 今日三線</span><h2>{dailyExpedition.title}</h2><p>{dailyExpedition.description}</p><div className="academy-daily-meter" aria-label={`今日遠征已完成 ${dailyProgress.correctAnswers} / ${dailyExpedition.targetCorrectAnswers} 題正確線索`}><i style={{ width: `${(dailyProgress.correctAnswers / dailyExpedition.targetCorrectAnswers) * 100}%` }} /></div><small>{dailyProgress.rewarded ? "今日獎勵已領取，明天再來開啟新的遠征。" : `${dailyProgress.correctAnswers} / ${dailyExpedition.targetCorrectAnswers} 個正確線索 · ${dailyExpedition.rewardLabel}`}</small></div><Button variant="outline" onClick={learnForEnergy} disabled={dailyProgress.rewarded}>{dailyProgress.rewarded ? "已完成" : "收集線索"}</Button></div>
      {habitatDaily && <section className={`academy-habitat-daily-card ${habitatDaily.completed ? "is-complete" : ""}`} style={{ "--route-accent": academyRouteFor(habitatDaily.mission.region).color } as React.CSSProperties} aria-label="棲息地限定每日微任務"><div><span className="academy-kicker">HABITAT MICRO QUEST · {habitatDaily.mission.subject}</span><h2>{habitatDaily.mission.title}</h2><p>{habitatDaily.mission.description}</p><div className="academy-daily-meter" aria-label={`${habitatDaily.mission.title}已完成 ${habitatDaily.correctAnswers} / ${habitatDaily.mission.targetCorrectAnswers} 題正確線索`}><i style={{ width: `${(habitatDaily.correctAnswers / habitatDaily.mission.targetCorrectAnswers) * 100}%` }} /></div><small>{habitatDaily.completed ? "這座棲息地的今日線索已整理完成；明天會有新的觀測任務。" : `${habitatDaily.correctAnswers} / ${habitatDaily.mission.targetCorrectAnswers} 題正確線索 · ${habitatDaily.mission.rewardLabel}`}</small><details className="academy-habitat-daily-list"><summary>查看已解鎖棲息地任務</summary><div>{unlockedHabitatDailies.map((item) => <span key={item.mission.id} className={item.completed ? "is-complete" : ""}>{item.completed ? "✓" : "○"} {item.mission.title} · {item.correctAnswers}/{item.mission.targetCorrectAnswers}</span>)}</div></details></div><Button variant="outline" onClick={startHabitatDaily} disabled={habitatDaily.completed}>{habitatDaily.completed ? "已整理" : `前往${habitatDaily.mission.subject}`}</Button></section>}
      <div className={`academy-onboarding-card ${onboarding.completed ? "is-complete" : ""}`}><div><span className="academy-kicker">學苑新手定位 · 四科星圖</span><h2>{onboarding.completed ? "你的初步學習路徑已建立" : `點亮 ${onboarding.completedCount} / 4 科學習星圖`}</h2><p>{onboarding.completed ? "接下來系統會依你的真實作答表現調整遠征路徑與練習節奏。" : `先在四個科目各答對一題；下一站：${onboarding.next ?? "完成"}。`}</p><div className="academy-onboarding-subjects" aria-label={`新手定位已完成 ${onboarding.completedCount} / 4 個科目`}>{onboarding.subjects.map((item) => <span key={item.subject} className={item.complete ? "is-complete" : ""}>{item.complete ? "✓" : "○"} {item.subject}</span>)}</div><small>{onboarding.completed ? "已獲得初始定位獎勵。" : "完成後可獲得 2 能量與 2 金幣。"}</small></div><Button variant="outline" onClick={learnForEnergy} disabled={onboarding.completed}>{onboarding.completed ? "已定位" : "開始定位"}</Button></div>
      <div className="academy-partner-card"><span className="companion-orb academy-orb" style={{ background: active?.accent }}><WandSparkles size={19} /></span><div><span className="academy-kicker">同行夥伴</span><strong>{active?.name ?? "等待夥伴"} · Lv.{active?.level ?? 1}</strong><small>默契 Lv.{affectionLevel(active?.affection ?? 0)} · {equippedSkillLabels(active).length || 0} 個技能已配置</small></div><Button size="sm" variant="outline" onClick={() => setRosterOpen(true)}>養成</Button></div>
	    </section>
	    <ExpeditionObservationCard state={state} />
	    <section className="academy-region-mission" aria-label="區域專屬任務">
      <div className="academy-mission-heading"><div><span className="academy-kicker">REGION MISSION · 答題驅動</span><h2>{regionMission?.title ?? "學苑航線任務"}</h2><p>{regionMission?.summary ?? "完成各區域章節後，繼續用課綱題推進學苑航線。"}</p></div><span className={`academy-mission-status ${regionMissionProgress?.claimed ? "is-claimed" : regionMissionProgress?.completed ? "is-complete" : ""}`}>{regionMissionProgress?.claimed ? "獎勵已領取" : regionMissionProgress?.completed ? "可領取" : "進行中"}</span></div>
      <div className="academy-mission-progress"><div className="academy-stage-meter" aria-label={`區域任務答對 ${regionMissionProgress?.correct ?? 0} / ${regionMission?.targetCorrect ?? 0} 題`}><i style={{ width: `${missionPercent}%` }} /></div><small>{regionMissionProgress?.correct ?? 0} / {regionMission?.targetCorrect ?? 0} 題正確 · 完成後夥伴 +{regionMission?.rewardAffection ?? 0} 親密度、+{regionMission?.rewardTrainingPoints ?? 0} 訓練點</small></div>
      <div className="academy-mission-rewards" aria-label="任務獎勵"><span>✦ {regionMission?.rewardCoins ?? 0} 金幣</span><span>⚡ {regionMission?.rewardEnergy ?? 0} 能量</span><span>♡ {regionMission?.rewardAffection ?? 0} 親密度</span></div>
      <details className="academy-mission-list"><summary>查看各區域任務總覽</summary><div>{allMissions.map(({ mission, progress }) => <span key={mission.id} className={progress.claimed ? "is-claimed" : progress.completed ? "is-complete" : ""}><b>{progress.claimed ? "✓" : progress.completed ? "★" : "○"}</b>{mission.title} · {progress.correct}/{mission.targetCorrect}</span>)}</div></details>
        </section>
    <MainlineGuardianPanel regularDefeatsBySubject={mainlineProgress.regularDefeatsBySubject} currentSubject={MAINLINE_SUBJECT_BY_REGION[state.currentRegion]} onChallenge={(subject) => startBoss(subject)} />
    {regionLiberated && <section className="academy-liberation-banner" aria-live="polite"><span aria-hidden="true">✦</span><div><strong>{activeRoute.title}已解放</strong><p>守護者的封印已解除，知識之光重新照亮這條航線。</p></div><span className="academy-liberation-spark" aria-hidden="true">✧</span></section>}
    <section className="academy-route-strip" aria-label="四科學習路徑">
{regionKeys.map((region) => { const route = academyRouteFor(region); const explored = state.explored.includes(region); return <button key={region} className={`academy-route ${region === state.currentRegion ? "is-current" : ""} ${explored ? "is-explored" : ""}`} style={{ "--route-accent": route.color } as React.CSSProperties} onClick={() => explore(region)}><span>{route.subject}</span><strong>{route.title}</strong><small>{explored ? "已留下足跡" : route.landmark}</small></button>; })}</section>
    <section className="rpg-layout"><div className="rpg-map-card academy-map-card" aria-label="學苑大地圖"><div className="rpg-map-art"><div className="academy-map-illustration" style={{ backgroundImage: "url('/manus-storage/taiwan-learning-rpg-visual-target_44e2fd60.png')" }} aria-hidden="true" /><div className="map-route route-a" /><div className="map-route route-b" />{regionKeys.map((region) => <button key={region} className={`region-node region-${region} ${state.explored.includes(region) ? "is-explored" : ""} ${mainlineProgress.liberatedSubjects.includes(MAINLINE_SUBJECT_BY_REGION[region]) ? "is-liberated" : ""}`} onClick={() => explore(region)} aria-label={`探索${REGION_LABELS[region]}`}><span>{region === "north" ? "潮" : region === "central" ? "嶺" : region === "east" ? "星" : "珊"}</span><small>{academyRouteFor(region).subject} · {REGION_LABELS[region]}</small></button>)}</div><div className="map-caption"><Compass size={18} aria-hidden /><span>選擇路徑，接受 {activeRoute.questTitle} 的學習挑戰</span></div></div>
      <aside className="rpg-panel" aria-live="polite"><div className="rpg-panel-tabs"><Button variant="ghost" className={!rosterOpen ? "is-active" : ""} onClick={() => setRosterOpen(false)}><Swords size={16} /> 探險</Button><Button variant="ghost" className={rosterOpen ? "is-active" : ""} onClick={() => setRosterOpen(true)}><Backpack size={16} /> 夥伴</Button></div>
          {rosterOpen && <section className={`growth-companion-showcase stage-${companionVisualStage.stage}`} aria-label="夥伴成長視覺與知識技能樹">
            <div className="growth-companion-figure">
              <span className={`companion-orb large animate-float ${active?.appearanceClass ?? ""}`} style={{ background: active?.accent }}><WandSparkles size={27} /></span>
              <span className="growth-stage-badge">{companionVisualStage.label}</span>
            </div>
            <div className="growth-companion-copy"><span className="eyebrow">PARTNER EVOLUTION VISUAL</span><strong>{active?.name ?? "等待夥伴"} · Lv.{active?.level ?? 1}</strong><p>{companionVisualStage.detail}；實際進化仍需完成既有的課綱答題與能量條件。</p></div>
            <div className="knowledge-skill-tree" aria-label="四科知識技能樹">
              <div className="knowledge-tree-heading"><strong>知識技能樹</strong><small>每科累積答對 3 題即可點亮節點</small></div>
              <div className="knowledge-tree-nodes">{knowledgeNodes.map((node) => <span key={node.id} className={node.lit ? "is-lit" : ""}><i aria-hidden="true">{node.lit ? "✦" : "○"}</i><b>{node.subject}</b><small>{node.lit ? `${node.domain} 已點亮` : `${node.correctAnswers}/3 正確線索`}</small></span>)}</div>
            </div>
          </section>}
          {rosterOpen ? <div className="roster-view cute-growth-shell"><h2>夥伴圖鑑</h2><p className="muted">金幣可以餵養夥伴，經驗會在學習旅程中累積。</p>{COMPANION_CATALOG.map((item) => { const owned = state.companions.some((companion) => companion.id === item.id); return <button key={item.id} className={`companion-row ${owned ? "owned" : "locked"}`} disabled={!owned} onClick={() => owned && setState((current) => ({ ...current, activeCompanionId: item.id, notice: `${item.name} 成為目前夥伴。` }))}>{owned ? <span className="companion-orb" style={{ background: item.accent }} /> : <LockKeyhole size={20} />}<span><strong>{owned ? item.name : "未發現夥伴"}</strong><small>{owned ? `${item.epithet} · Lv.${item.level}` : `前往${REGION_LABELS[item.region]}探索`}</small></span></button>; })}<div className="evolution-card" aria-label="跟班進化"><div className="evolution-heading"><strong>進化培育</strong><span>答題能量 {state.energy} / {nextEvolutionFor(active)?.requiredEnergy ?? "MAX"}</span></div>{nextEvolutionFor(active) ? <><div className="evolution-meter" aria-label={`進化進度 ${Math.min(100, Math.round((state.energy / nextEvolutionFor(active)!.requiredEnergy) * 100))}%`}><i style={{ width: `${Math.min(100, Math.round((state.energy / nextEvolutionFor(active)!.requiredEnergy) * 100))}%` }} /></div><p>{nextEvolutionFor(active)!.appearanceLabel} · {nextEvolutionFor(active)!.passiveLabels.join("、")}</p><Button className="wide-action" onClick={evolveActive} disabled={!active || questionPool.length === 0 || state.energy < nextEvolutionFor(active)!.requiredEnergy}><Sparkles size={16} /> {state.energy >= nextEvolutionFor(active)!.requiredEnergy ? "進化跟班（先答題）" : `還需 ${nextEvolutionFor(active)!.requiredEnergy - state.energy} 能量`}</Button></> : <p className="muted">已達到目前可見的最高進化階段。</p>}</div><div className="growth-card" aria-label="跟班養成狀態"><div className="growth-heading"><strong>夥伴默契 Lv.{affectionLevel(active?.affection ?? 0)}</strong><span>{active?.affection ?? 0} / 100</span></div><div className="growth-meter" aria-label={`親密度 ${active?.affection ?? 0}%`}><i style={{ width: `${active?.affection ?? 0}%` }} /></div><p className="muted">{active?.personality}：{active ? (active.personality ? ({ "觀察家": "答題節奏越穩，觀測越精準。", "守護者": "整理錯題後，防守會更可靠。", "探索者": "探索新領域，訓練收穫更豐富。", "鼓舞者": "連勝時，夥伴默契成長更快。" } as const)[active.personality] : "一起學習，一起成長。") : "選擇一位夥伴開始養成。"}</p><small>訓練點 {active?.trainingPoints ?? 0} · 已裝備：{active ? equippedSkillLabels(active).join("、") || "等待解鎖" : "—"}</small><div className="training-actions"><Button size="sm" variant="outline" onClick={() => trainActive("train-focus")} disabled={!active || (active.trainingPoints ?? 0) < 2}>專注 +1</Button><Button size="sm" variant="outline" onClick={() => trainActive("train-guard")} disabled={!active || (active.trainingPoints ?? 0) < 2}>守護 +1</Button><Button size="sm" variant="outline" onClick={() => trainActive("train-capture")} disabled={!active || (active.trainingPoints ?? 0) < 2}>捕捉 -1能量</Button></div><div className="skill-config"><strong>技能配置（最多 2 個）</strong><div className="skill-config-list">{(active?.passiveSkillIds ?? []).map((skillId) => <Button key={skillId} size="sm" variant={(active?.equippedSkillIds ?? []).includes(skillId) ? "default" : "outline"} onClick={() => toggleSkill(skillId)}>{equippedSkillLabels({ ...active!, equippedSkillIds: [skillId] })[0] ?? skillId}</Button>)}</div></div><div className="growth-achievements"><strong>課綱成就</strong><span>{active?.achievementIds?.length ?? 0} / {GROWTH_ACHIEVEMENTS.length}</span></div><div className="achievement-list">{GROWTH_ACHIEVEMENTS.map((achievement) => <span key={achievement.id} className={(active?.achievementIds ?? []).includes(achievement.id) ? "is-earned" : ""}>{(active?.achievementIds ?? []).includes(achievement.id) ? "✓" : "○"} {achievement.title}</span>)}</div></div><div className="academy-gear-card" aria-label="學苑遠征徽記"><strong>遠征徽記 · {state.academyGearIds?.length ?? 0}/{ACADEMY_GEAR.length}</strong><small>已裝備加成：攻擊 +{gearBonuses.attack} · 防禦 +{gearBonuses.defense} · 捕捉 +{gearBonuses.capture}%</small><div>{ACADEMY_GEAR.map((gear) => <span key={gear.id} className={(state.academyGearIds ?? []).includes(gear.id) ? "is-earned" : ""}>{(state.academyGearIds ?? []).includes(gear.id) ? "✦" : "○"} {gear.title}</span>)}</div></div><section className="academy-expansion-card" aria-label="角色屬性與天賦"><div className="academy-expansion-heading"><strong>探險家能力</strong><small>天賦點 {expansionProgress.talentPoints}</small></div><div className="academy-attribute-grid"><span>攻擊 <b>{playerAttributes.attack}</b></span><span>防禦 <b>{playerAttributes.defense}</b></span><span>幸運 <b>{Math.round(playerAttributes.luck * 100)}%</b></span></div><div className="academy-talent-list">{TALENT_CATALOG.map((talent) => <button type="button" key={talent.id} onClick={() => spendTalent(talent.id)} disabled={expansionProgress.talentPoints <= 0 || (expansionProgress.talents[talent.id] ?? 0) >= talent.maxLevel}><strong>{talent.label} {expansionProgress.talents[talent.id] ?? 0}/{talent.maxLevel}</strong><small>{talent.description}</small></button>)}</div></section><section className="academy-expansion-card" aria-label="限定裝備收藏"><div className="academy-expansion-heading"><strong>裝備收藏</strong><small>5 片可合成並裝備</small></div><div className="academy-gear-collection">{GEAR_CATALOG.map((gear) => { const fragments = expansionProgress.fragments[gear.id] ?? 0; const equipped = expansionProgress.equippedGearIds.includes(gear.id); return <div key={gear.id} className={equipped ? "is-equipped" : ""}><span>{equipped ? "✦" : "○"} {gear.label}</span><small>{fragments}/5 碎片</small><Button size="sm" variant="outline" onClick={() => craftExpansionGear(gear.id)} disabled={fragments < 5 || equipped}>{equipped ? "已裝備" : "合成"}</Button></div>; })}</div></section><Button className="wide-action" onClick={() => beginGrowthQuestion("feed")} disabled={!active}><Sparkles size={16} /> 餵養目前夥伴（先答題 · 5 金幣）</Button></div> : <div className="adventure-view">
          <div className="active-companion"><span className={`companion-orb large ${active?.appearanceClass ?? ""}`} style={{ background: active?.accent }}><WandSparkles size={24} /></span><div><span className="eyebrow">CURRENT PARTNER</span><h2>{active?.name}</h2><p>{active?.dialogue[0]}</p></div><span className="level-pill">Lv.{active?.level} · {evolutionStageFor(active).appearanceLabel}</span></div>
          {state.mode === "encounter" && encounter && <div className="encounter-card"><span className="encounter-dot" style={{ background: encounter.accent }} /><div><span className="eyebrow">ACADEMY ENCOUNTER · {activeRoute.subject}</span><h2>{activeRoute.questTitle}</h2><p>{activeRoute.questSummary}</p>{reviewSummary.dueCount > 0 && <small className="spaced-review-callout" role="status">複習航圖：本路線有 {reviewSummary.dueCount} 題到期錯題，本次遭遇會優先安排其中一題。</small>}</div><div className="academy-objectives" aria-label={`${activeRoute.questTitle}任務目標`}>{routeObjectives.map((objective, index) => <span key={objective.label} className={objective.complete ? "is-complete" : ""}><b>{objective.complete ? "✓" : index + 1}</b>{objective.label}</span>)}</div><div className="encounter-actions"><Button onClick={enterBattle}><Swords size={16} /> 解題開路</Button><Button variant="outline" onClick={() => startBoss()}><Sparkles size={16} /> {activeRoute.bossTitle}</Button></div></div>}
          {boss && bossQuestion && <div className={`boss-card boss-phase-${boss.phase} ${bossVisual ? `has-boss-visual boss-visual-${bossVisual.event}` : ""}`} aria-live="polite">{bossVisual && <div key={bossVisual.key} className="boss-visual-burst" role="status" aria-live="assertive"><span className="boss-visual-ring" aria-hidden="true" /><strong>{bossVisual.event === "start" ? "挑戰開始" : bossVisual.event === "combo" ? `連擊 ${boss.streak}` : bossVisual.event === "phase-transition" ? `第 ${boss.phase} 階段突破` : bossVisual.event === "mistake" ? "重新整理線索" : "守門者突破"}</strong><small>{bossVisual.event === "phase-transition" ? boss.feedback : bossVisual.event === "victory" ? "三階段理解力連鎖完成" : "你的學習節奏正在推進"}</small></div>}<div className="boss-heading"><div><span className="eyebrow">ADAPTIVE BOSS / 課綱守門者</span><h2>{boss.name}</h2><p>{bossPhaseLabel(boss)}</p></div><span className="boss-phase-badge">{boss.phase} / 3</span></div><div className="boss-progress" aria-label={boss.kind === "guardian" ? `守護者生命值 ${boss.hp ?? 0} / ${boss.maxHp ?? 0}` : `Boss 階段 ${boss.phase}，連續答對 ${boss.streak} 題`}><i style={{ width: `${boss.kind === "guardian" ? Math.max(0, Math.min(100, ((boss.hp ?? 0) / (boss.maxHp ?? 1)) * 100)) : Math.min(100, (boss.streak / boss.requiredStreak) * 100)}%` }} /></div><p className="boss-feedback" role="status">{boss.feedback}</p>{boss.outcome === "active" ? <><p className="battle-prompt">{bossQuestion.prompt}</p><div className="battle-options" role="group" aria-label="Boss 課綱題目選項">{bossQuestion.options.map((option, index) => <Button key={option} variant="outline" onClick={() => answerBoss(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</Button>)}</div><small className="battle-question-meta">{bossQuestion.grade} 年級 · {bossQuestion.curriculumDomain} · {bossQuestion.learningTopic}</small></> : <div className="boss-result"><strong>{boss.outcome === "victory" ? "Boss 挑戰完成" : "再試一次"}</strong><Button onClick={() => setBoss(retryAdaptiveBoss(boss))} disabled={boss.outcome !== "victory"}>重新挑戰</Button></div>}</div>}
          {state.mode === "battle" && state.battle && <div className={`battle-card cute-battle-card ${combatFeedback ? `has-feedback feedback-${combatFeedback.event} ${combatFeedback.styleClass ?? ""}` : ""}`}><div className="battle-duel cute-battle-duel"><span className="battle-sparkle-crown" aria-hidden="true">✦</span><div><span className="battle-avatar friendly" style={{ background: active?.accent }}><WandSparkles size={24} /></span><strong>{active?.name}</strong><small><Heart size={13} /> {state.battle.playerHp}/{state.battle.playerMaxHp}</small></div><span className="versus">VS</span><div><span className="battle-avatar enemy" style={{ background: encounter?.accent }}><Sparkles size={24} /></span><strong>{state.battle.enemyName}</strong><small><Heart size={13} /> {state.battle.enemyHp}/{state.battle.enemyMaxHp}</small></div></div>
            {combatFeedback && <div className={`combat-feedback-overlay feedback-${combatFeedback.event} ${combatFeedback.styleClass ?? ""}`} role="status" aria-live="assertive"><strong>{combatFeedback.label}</strong><span>{combatFeedback.detail}</span></div>}
            <div className="battle-energy"><span><Zap size={14} /> 戰鬥能量 {state.battle.energy}</span><div className="energy-meter"><i style={{ width: `${Math.min(100, state.battle.energy * 5)}%` }} /></div></div>
            {state.battle.phase === "question" && battleQuestion ? <div className="battle-question" aria-labelledby="battle-question-title"><div className="battle-question-heading"><div><span className="eyebrow">CURRICULUM COMBAT / {battleQuestion.subject}</span><h2 id="battle-question-title">先答題，再決定特殊行動</h2></div><span className="battle-timer">{Math.max(0, Math.ceil((BATTLE_TIME_LIMIT_MS - (now - questionStartedAt)) / 1000))} 秒</span></div>{battleQuestionIsDueReview && <p className="spaced-review-callout" role="status">複習遭遇：這題曾需要再整理一次；答對後會依下一個間隔節點再次安排。</p>}<p className="battle-prompt">{battleQuestion.prompt}</p><div className="battle-options" role="group" aria-label="戰鬥題目選項">{battleQuestion.options.map((option, index) => <Button key={option} variant="outline" onClick={() => answerBattleQuestion(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</Button>)}</div><small className="battle-question-meta">{battleQuestion.grade} 年級 · {battleQuestion.curriculumDomain} · {battleQuestion.learningTopic}</small></div> : state.battle.phase === "action" && state.battle.performance ? <div className="battle-performance" role="status"><strong>{state.battle.performance.correct ? "答題成功，選擇你的特殊行動" : "先穩住節奏，使用基礎行動"}</strong><div className="performance-grid"><span>正確率 <b>{state.battle.performance.accuracy}%</b></span><span>攻擊力 <b>{state.battle.performance.attackPower}</b></span><span>防禦力 <b>{state.battle.performance.defensePower}</b></span><span>捕捉率 <b>{state.battle.performance.captureChance}%</b></span></div><p>{state.battle.performance.correct ? "答得越準、越快，夥伴越能發揮特殊技能。" : `解析：${battleQuestion?.explanation ?? "把線索重新整理，再挑戰下一回合。"}`}</p></div> : state.battle.phase === "ready" && state.battle.turn === "player" ? <div className="battle-ready-feedback" role="status"><strong>回合開始：先選擇你的行動</strong><span>基礎攻擊與捕捉可直接使用；技能、超必殺會先開啟課綱答題。</span></div> : null}
            <div className="battle-actions cute-battle-actions"><span className="battle-action-caption">基礎行動自由施放；特殊技能與超必殺需要答題</span><Button variant="outline" onClick={basicAttack} disabled={state.battle.phase !== "ready" || state.battle.turn !== "player"}><Swords size={16} /> 基礎攻擊</Button><Button onClick={skill} disabled={(state.battle.phase !== "ready" && state.battle.phase !== "action") || state.battle.turn !== "player" || state.battle.energy < (active?.skillCost ?? 99)}><Zap size={16} /> {active?.skillName} · {active?.skillCost}</Button><Button className="ultimate-action" onClick={ultimate} disabled={(state.battle.phase !== "ready" && state.battle.phase !== "action") || state.battle.turn !== "player" || state.battle.ultimateUsed || state.battle.energy < Math.max(8, (active?.skillCost ?? 4) * 2)}><Sparkles size={16} /> {active ? combatStyleForCompanion(active).ultimateName : "終極技能"} · {active ? Math.max(8, active.skillCost * 2) : 8}</Button><Button variant="outline" onClick={capture} disabled={state.battle.phase !== "ready" || state.battle.turn !== "player" || state.battle.energy < (encounter?.captureCost ?? 99)}><Sparkles size={16} /> 嘗試捕捉 · {encounter?.captureCost}</Button></div><div className="battle-log" role="log" aria-label="戰鬥紀錄">{state.battle.log.slice(-4).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div></div>}
          {(state.mode === "victory" || state.mode === "defeat") && <div className={`result-card ${state.mode} ${state.mode === "victory" ? combatStyleForCompanion(active).victoryClass : ""}`}><span className="result-icon">{state.mode === "victory" ? "✦" : "○"}</span>{state.mode === "victory" && combatFeedback && <div className={`victory-showcase ${combatFeedback.styleClass ?? ""}`} role="status" aria-live="assertive"><strong>{combatFeedback.label}</strong><span>{combatFeedback.detail}</span></div>}<h2>{state.mode === "victory" ? `${active?.name ?? "夥伴"} 勝利` : "先休息一下"}</h2><p>{state.notice}</p><Button onClick={() => setState((current) => ({ ...current, mode: "explore", encounter: null, battle: null }))}>回到地圖</Button></div>}
          {state.mode === "explore" && <div className="quest-card"><div><span className="eyebrow">LEARNING QUEST</span><h2>用一題，點亮一格能量</h2><p>答對題目可以取得能量與金幣；能量會在遭遇戰中轉成夥伴技能。</p></div><Button onClick={learnForEnergy}><BookOpen /> 前往答題</Button></div>}
          <p className="rpg-notice">{state.notice}</p>
        </div>}
      </aside>
    </section>
  </main>;
}
