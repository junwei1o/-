import { calculateEnemyDamage, rollEnemyDisrupt } from "./battleCalculator";
import { BattlePhase, createBattleDispatcher, type BattleResolution } from "./battleState";
import { ENCOUNTERS, STARTER_COMPANION } from "@/game/rpgData";
import { applyBattleAction, applyBattleAnswer, beginBattleQuestion, createBattle } from "@/game/rpgBattle";
import { calculateBattlePerformance } from "@/game/rpgQuestionCombat";
import { tryDropHealthPotion } from "@/game/inventoryService";
import type { BattleState, Encounter } from "@/game/rpgTypes";

export const DEFAULT_BATTLE_SIMULATION_COUNT = 100;
const MAX_PLAYER_TURNS_PER_SIMULATION = 16;
const SKILL_COST = 3;
const SKILL_POWER = 9;

export type BattleSimulationMode = "steady" | "recovery" | "defeat-check";

export type BattleSimulationRecord = Readonly<{
  id: string;
  mode: BattleSimulationMode;
  result: "victory" | "defeat";
  playerTurns: number;
  enemyTurns: number;
  correctAnswers: number;
  potionDropChecks: number;
  healthPotionsDropped: number;
  playerHp: number;
  enemyHp: number;
  criticalHits: number;
  guardianDisruptions: number;
  finalMachinePhase: BattlePhase;
  integrityIssues: readonly string[];
}>;

export type BattleSimulationReport = Readonly<{
  requestedBattles: number;
  completedBattles: number;
  victories: number;
  defeats: number;
  criticalHits: number;
  guardianDisruptions: number;
  averagePlayerTurns: number;
  totalCorrectAnswers: number;
  totalPotionDropChecks: number;
  totalHealthPotionsDropped: number;
  longestVictoryStreak: number;
  longestDefeatStreak: number;
  integrityIssues: readonly string[];
  records: readonly BattleSimulationRecord[];
}>;

function resolutionFor(result: BattleState["result"]): BattleResolution {
  return result === "victory" || result === "defeat" ? result : "ongoing";
}

function modeFor(index: number): BattleSimulationMode {
  if (index % 10 === 9) return "defeat-check";
  return index % 4 === 0 ? "recovery" : "steady";
}

function answerIsCorrect(mode: BattleSimulationMode, battleIndex: number, playerTurn: number): boolean {
  if (mode === "defeat-check") return false;
  if (mode === "recovery") return (battleIndex + playerTurn) % 3 !== 0;
  return true;
}

function encounterForSimulation(index: number, mode: BattleSimulationMode): Encounter {
  if (mode === "steady") return ENCOUNTERS[ENCOUNTERS.length - 1];
  return ENCOUNTERS[index % ENCOUNTERS.length];
}

function finishMachine(dispatcher: ReturnType<typeof createBattleDispatcher>, actor: "player" | "enemy", resolution: BattleResolution) {
  dispatcher.dispatch(actor === "player" ? { type: "PLAYER_TURN_RESOLVED", resolution } : { type: "ENEMY_TURN_RESOLVED", resolution });
  const animationState = dispatcher.getState();
  if (animationState.phase !== BattlePhase.ANIMATING) return animationState;

  const afterAnimation = dispatcher.dispatch({ type: "ANIMATION_FINISHED" });
  if (afterAnimation.phase !== BattlePhase.RESULT) return afterAnimation;
  dispatcher.dispatch({ type: "ACKNOWLEDGE_RESULT" });
  return dispatcher.dispatch({ type: "COLLECT_REWARD" });
}

function longestRun(records: readonly BattleSimulationRecord[], result: BattleSimulationRecord["result"]) {
  let longest = 0;
  let current = 0;
  for (const record of records) {
    current = record.result === result ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

/**
 * Runs deterministic engine-only battles. It shares the production RPG reducer and strict
 * dispatcher, but does not mount React or schedule browser timers, so it can repeatedly
 * verify numerical and terminal-state safety in Vitest.
 */
export function runBattleSimulations(requestedBattles = DEFAULT_BATTLE_SIMULATION_COUNT): BattleSimulationReport {
  const safeCount = Math.max(1, Math.floor(Number.isFinite(requestedBattles) ? requestedBattles : DEFAULT_BATTLE_SIMULATION_COUNT));
  const records: BattleSimulationRecord[] = [];
  let cumulativeCorrectAnswers = 0;
  const potionStorage = new Map<string, string>();
  const storage = {
    getItem: (key: string) => potionStorage.get(key) ?? null,
    setItem: (key: string, value: string) => { potionStorage.set(key, value); },
  };

  for (let index = 0; index < safeCount; index += 1) {
    const mode = modeFor(index);
    const encounter = encounterForSimulation(index, mode);
    const dispatcher = createBattleDispatcher();
    dispatcher.dispatch({ type: "START", battleId: `stage-five-${index}` });
    let battle = {
      ...createBattle(STARTER_COMPANION, encounter, `stage-five-question-${index}`),
      energy: mode === "defeat-check" ? 0 : 6,
      playerHp: mode === "defeat-check" ? 8 : STARTER_COMPANION.maxHp,
    };
    let playerTurns = 0;
    let enemyTurns = 0;
    let correctAnswers = 0;
    let potionDropChecks = 0;
    let healthPotionsDropped = 0;
    let comboCount = 0;
    let criticalHits = 0;
    let guardianDisruptions = 0;
    const integrityIssues: string[] = [];

    while (battle.result === "active" && playerTurns < MAX_PLAYER_TURNS_PER_SIMULATION) {
      if (battle.turn === "player") {
        playerTurns += 1;
        const correct = answerIsCorrect(mode, index, playerTurns);
        if (correct) {
          correctAnswers += 1;
          cumulativeCorrectAnswers += 1;
          if (cumulativeCorrectAnswers % 5 === 0) {
            potionDropChecks += 1;
            const roll = ((index * 17 + cumulativeCorrectAnswers * 13) % 100) / 100;
            if (tryDropHealthPotion(cumulativeCorrectAnswers, storage, () => roll)) healthPotionsDropped += 1;
          }
        }
        const canUseQuestionSkill = mode !== "defeat-check" && battle.energy >= SKILL_COST;

        if (canUseQuestionSkill) {
          const questionId = `stage-five-${index}-${playerTurns}`;
          const pending = beginBattleQuestion(battle, { type: "skill", cost: SKILL_COST, power: SKILL_POWER, label: "潮汐脈衝" }, questionId);
          comboCount = correct ? comboCount + 1 : 0;
          const performance = {
            ...calculateBattlePerformance({ questionId, correct, responseMs: correct ? 1_800 : 9_000, streak: comboCount }),
            comboCount,
            criticalHit: comboCount >= 3,
          };
          battle = pending.phase === "question" ? applyBattleAnswer(pending, performance) : pending;
          if (correct && comboCount >= 3) criticalHits += 1;
        } else {
          comboCount = 0;
          battle = applyBattleAction(battle, { type: "basic", power: mode === "defeat-check" ? 1 : 4, label: "基礎觀察擊" });
        }

        finishMachine(dispatcher, "player", resolutionFor(battle.result));
        continue;
      }

      if (battle.turn === "enemy") {
        enemyTurns += 1;
        if (rollEnemyDisrupt(() => (index + enemyTurns) % 3 === 0 ? 0 : 0.9)) guardianDisruptions += 1;
        const enemyAttack = mode === "defeat-check" ? 10 : 5 + encounter.level;
        const defense = battle.performance?.defensePower ?? 0;
        const damage = calculateEnemyDamage(enemyAttack, defense);
        battle = applyBattleAction(battle, { type: "enemy", damage }, `stage-five-next-${index}-${enemyTurns}`);
        finishMachine(dispatcher, "enemy", resolutionFor(battle.result));
        continue;
      }

      integrityIssues.push("戰鬥在非玩家或敵方回合時未結束。");
      break;
    }

    if (battle.result === "active") integrityIssues.push("戰鬥在安全回合上限前未完成。");
    if (battle.playerHp < 0 || battle.enemyHp < 0) integrityIssues.push("生命值低於零。");
    if (!Number.isFinite(battle.playerHp) || !Number.isFinite(battle.enemyHp)) integrityIssues.push("生命值不是有限數字。");
    if (battle.result !== "active" && dispatcher.getState().phase !== BattlePhase.IDLE) integrityIssues.push("終局後狀態機未回到 IDLE。");

    records.push(Object.freeze({
      id: `stage-five-${index}`,
      mode,
      result: battle.result === "defeat" ? "defeat" : "victory",
      playerTurns,
      enemyTurns,
      correctAnswers,
      potionDropChecks,
      healthPotionsDropped,
      playerHp: battle.playerHp,
      enemyHp: battle.enemyHp,
      criticalHits,
      guardianDisruptions,
      finalMachinePhase: dispatcher.getState().phase,
      integrityIssues: Object.freeze([...integrityIssues]),
    }));
  }

  const victories = records.filter((record) => record.result === "victory").length;
  const defeats = records.length - victories;
  const integrityIssues = records.flatMap((record) => record.integrityIssues.map((issue) => `${record.id}：${issue}`));
  return Object.freeze({
    requestedBattles: safeCount,
    completedBattles: records.length,
    victories,
    defeats,
    criticalHits: records.reduce((sum, record) => sum + record.criticalHits, 0),
    guardianDisruptions: records.reduce((sum, record) => sum + record.guardianDisruptions, 0),
    averagePlayerTurns: Number((records.reduce((sum, record) => sum + record.playerTurns, 0) / records.length).toFixed(2)),
    totalCorrectAnswers: records.reduce((sum, record) => sum + record.correctAnswers, 0),
    totalPotionDropChecks: records.reduce((sum, record) => sum + record.potionDropChecks, 0),
    totalHealthPotionsDropped: records.reduce((sum, record) => sum + record.healthPotionsDropped, 0),
    longestVictoryStreak: longestRun(records, "victory"),
    longestDefeatStreak: longestRun(records, "defeat"),
    integrityIssues: Object.freeze(integrityIssues),
    records: Object.freeze(records),
  });
}
