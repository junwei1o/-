import type { CurriculumQuestion, SubjectKey } from "@/game/expeditionContent";

export const DUEL_MAX_HP = 100;
export const DUEL_QUESTIONS_PER_ROUND = 5;
export const DUEL_TIME_LIMIT_MS = 15_000;
export const DUEL_WINS_TO_MATCH = 2;

export type DuelRole = "detective" | "wolf" | "mage" | "knight";
export type StrategyCardId = "knowledge-blessing" | "lightning-chain" | "shield" | "insight" | "first-aid";
export type DuelOwner = "player" | "ai";

export type DuelRoleDefinition = {
  id: DuelRole;
  name: string;
  emoji: string;
  ability: string;
  counterText: string;
};

export type StrategyCard = {
  id: StrategyCardId;
  name: string;
  description: string;
  effect: "correct-damage" | "shield" | "insight" | "heal";
  value: number;
};

export type DuelCardUse = {
  owner: DuelOwner;
  cardId: StrategyCardId;
  enhanced: boolean;
  effective: boolean;
  effectValue: number;
  note: string;
};

export type AiStrategyInsight = {
  cardId: StrategyCardId;
  cardName: string;
  reason: string;
  outcome: string;
};

export type DuelTurn = {
  questionId: string;
  playerCorrect: boolean;
  aiCorrect: boolean;
  playerDamageToAi: number;
  aiDamageToPlayer: number;
  playerCard?: DuelCardUse;
  aiCard?: DuelCardUse;
  playerExplanation: string;
};

export type DuelRound = {
  roundNumber: number;
  playerHp: number;
  aiHp: number;
  questionIndex: number;
  playerCombo: number;
  playerCards: StrategyCardId[];
  aiCards: StrategyCardId[];
  usedCards: DuelCardUse[];
  turns: DuelTurn[];
  advancedStrategyAvailable: boolean;
  ended: boolean;
  winner: DuelOwner | "draw" | null;
};

export type DuelResolution = {
  round: DuelRound;
  turn: DuelTurn;
  highStrategyUnlocked: boolean;
};

const ROLE_CYCLE: Record<DuelRole, DuelRole> = {
  detective: "wolf",
  wolf: "mage",
  mage: "knight",
  knight: "detective",
};

export const DUEL_ROLES: Record<DuelRole, DuelRoleDefinition> = {
  detective: { id: "detective", name: "偵探", emoji: "🕵️", ability: "線索推理：答對時額外造成 4 點傷害。", counterText: "擅長拆穿狼人的偽裝。" },
  wolf: { id: "wolf", name: "狼人", emoji: "🐺", ability: "月影突襲：生命低於一半時，答對額外造成 4 點傷害。", counterText: "能壓制法師的咒語節奏。" },
  mage: { id: "mage", name: "法師", emoji: "🧙", ability: "奧術共鳴：策略卡的數值效果增加 2 點。", counterText: "可破解騎士的防線。" },
  knight: { id: "knight", name: "騎士", emoji: "🛡️", ability: "堅守：答錯時少承受 3 點傷害。", counterText: "能看破偵探的推理陷阱。" },
};

export const STRATEGY_CARDS: Record<StrategyCardId, StrategyCard> = {
  "knowledge-blessing": { id: "knowledge-blessing", name: "知識加護", description: "本題答對時額外造成 10 點傷害。", effect: "correct-damage", value: 10 },
  "lightning-chain": { id: "lightning-chain", name: "閃電連擊", description: "本題答對時額外造成 14 點傷害。", effect: "correct-damage", value: 14 },
  shield: { id: "shield", name: "護盾", description: "本題答錯時少承受 10 點傷害。", effect: "shield", value: 10 },
  insight: { id: "insight", name: "洞察", description: "本題可排除兩個錯誤選項。", effect: "insight", value: 2 },
  "first-aid": { id: "first-aid", name: "急救", description: "立即回復 15 點生命值。", effect: "heal", value: 15 },
};

export const DEFAULT_DUEL_LOADOUT: StrategyCardId[] = ["knowledge-blessing", "shield", "first-aid"];

function clampHp(value: number) { return Math.max(0, Math.min(DUEL_MAX_HP, Math.round(value))); }

export function roleCounters(attacker: DuelRole, defender: DuelRole) {
  return ROLE_CYCLE[attacker] === defender;
}

export function createRolePair(random: () => number = Math.random): { playerRole: DuelRole; aiRole: DuelRole } {
  const roleOrder = Object.keys(DUEL_ROLES) as DuelRole[];
  const first = roleOrder[Math.max(0, Math.min(roleOrder.length - 1, Math.floor(random() * roleOrder.length)))] ?? "detective";
  const second = ROLE_CYCLE[first];
  return random() < 0.5 ? { playerRole: first, aiRole: second } : { playerRole: second, aiRole: first };
}

export function isValidLoadout(cards: StrategyCardId[]) {
  return cards.length === 3 && new Set(cards).size === 3 && cards.every((card) => card in STRATEGY_CARDS);
}

export function createDuelRound(roundNumber: number, playerCards: StrategyCardId[] = DEFAULT_DUEL_LOADOUT, aiCards: StrategyCardId[] = DEFAULT_DUEL_LOADOUT): DuelRound {
  if (!isValidLoadout(playerCards) || !isValidLoadout(aiCards)) throw new Error("每位決鬥者需要三張不重複的策略卡");
  return {
    roundNumber,
    playerHp: DUEL_MAX_HP,
    aiHp: DUEL_MAX_HP,
    questionIndex: 0,
    playerCombo: 0,
    playerCards: [...playerCards],
    aiCards: [...aiCards],
    usedCards: [],
    turns: [],
    advancedStrategyAvailable: false,
    ended: false,
    winner: null,
  };
}

function unusedCards(round: DuelRound, owner: DuelOwner) {
  const selected = owner === "player" ? round.playerCards : round.aiCards;
  const used = new Set(round.usedCards.filter((card) => card.owner === owner).map((card) => card.cardId));
  return selected.filter((card) => !used.has(card));
}

/** AI 依血量、玩家連擊與題目難度選卡；同一局已用過的卡不會再次選擇。 */
export function chooseAiCard(round: DuelRound, questionDifficulty: number): StrategyCardId | null {
  const available = unusedCards(round, "ai");
  if (available.length === 0) return null;
  if (round.aiHp <= 45 && available.includes("first-aid")) return "first-aid";
  if (round.playerCombo >= 2 && available.includes("shield")) return "shield";
  if (questionDifficulty >= 3 && available.includes("insight")) return "insight";
  if (available.includes("knowledge-blessing")) return "knowledge-blessing";
  return available[0] ?? null;
}

/** 將既有 AI 選卡規則轉為可閱讀回饋，不洩漏隱藏角色，也不改變決鬥數值。 */
export function describeAiStrategy(round: DuelRound, questionDifficulty: number, aiCard: DuelCardUse | undefined): AiStrategyInsight | null {
  if (!aiCard || aiCard.owner !== "ai") return null;
  const card = STRATEGY_CARDS[aiCard.cardId];
  const reason = aiCard.cardId === "first-aid" && round.aiHp <= 45
    ? "生命值偏低，優先恢復續戰空間。"
    : aiCard.cardId === "shield" && round.playerCombo >= 2
      ? "偵測到你已連續答對，先預備防線減少可能的反擊。"
      : aiCard.cardId === "insight" && questionDifficulty >= 3
        ? "本題難度較高，先降低推理的不確定性。"
        : aiCard.cardId === "knowledge-blessing" || aiCard.cardId === "lightning-chain"
          ? "目前攻防壓力較小，選擇以額外傷害建立優勢。"
          : "依目前手牌與局勢採取保守策略。";
  const outcome = aiCard.effective ? aiCard.note : `${card.name} 本題未能發揮效果。`;
  return { cardId: aiCard.cardId, cardName: card.name, reason, outcome };
}

function roleCardBonus(role: DuelRole) { return role === "mage" ? 2 : 0; }

function correctDamage(role: DuelRole, defender: DuelRole, attackerHp: number, cardBonus: number) {
  const roleBonus = role === "detective" ? 4 : role === "wolf" && attackerHp <= 50 ? 4 : 0;
  const counterBonus = roleCounters(role, defender) ? 6 : 0;
  return 20 + roleBonus + counterBonus + cardBonus;
}

function wrongDamage(defender: DuelRole, shieldValue: number) {
  const knightReduction = defender === "knight" ? 3 : 0;
  return Math.max(0, 10 - shieldValue - knightReduction);
}

function cardUse(owner: DuelOwner, cardId: StrategyCardId | null | undefined, enhanced: boolean, role: DuelRole, answerCorrect: boolean): DuelCardUse | undefined {
  if (!cardId) return undefined;
  const card = STRATEGY_CARDS[cardId];
  const multiplier = enhanced ? 2 : 1;
  const effectValue = card.effect === "insight" ? card.value : (card.value + roleCardBonus(role)) * multiplier;
  const effective = card.effect === "heal" || card.effect === "insight" || (card.effect === "shield" ? !answerCorrect : answerCorrect);
  const note = card.effect === "heal"
    ? `回復 ${effectValue} 點生命值。`
    : card.effect === "insight"
      ? `排除 ${effectValue} 個錯誤選項。`
      : effective
        ? `${card.name} 發揮效果。`
        : `${card.name} 未能在本題發揮。`;
  return { owner, cardId, enhanced, effective, effectValue, note };
}

function aiWillAnswerCorrect(question: CurriculumQuestion, turnIndex: number) {
  // 透明且可預測的 AI 難度：基礎較容易答對，挑戰題需要更多推理；不假裝完美。
  const threshold = question.difficulty === 1 ? 4 : question.difficulty === 2 ? 3 : 2;
  const seed = Array.from(question.id).reduce((sum, char) => sum + char.charCodeAt(0), turnIndex);
  return seed % 5 < threshold;
}

function winnerForRound(playerHp: number, aiHp: number, questionIndex: number): DuelOwner | "draw" | null {
  if (playerHp <= 0 && aiHp <= 0) return "draw";
  if (aiHp <= 0) return "player";
  if (playerHp <= 0) return "ai";
  if (questionIndex >= DUEL_QUESTIONS_PER_ROUND) return playerHp === aiHp ? "draw" : playerHp > aiHp ? "player" : "ai";
  return null;
}

export function resolveDuelTurn(input: {
  round: DuelRound;
  question: CurriculumQuestion;
  playerRole: DuelRole;
  aiRole: DuelRole;
  playerAnswer: number | null;
  playerCard?: StrategyCardId | null;
  aiCorrect?: boolean;
}): DuelResolution {
  const { round, question, playerRole, aiRole, playerAnswer } = input;
  if (round.ended) throw new Error("這一局已結束");
  if (round.questionIndex >= DUEL_QUESTIONS_PER_ROUND) throw new Error("本局題目已完成");
  const playerCardId = input.playerCard && unusedCards(round, "player").includes(input.playerCard) ? input.playerCard : null;
  const aiCardId = chooseAiCard(round, question.difficulty);
  const playerCorrect = playerAnswer === question.answer;
  const aiCorrect = input.aiCorrect ?? aiWillAnswerCorrect(question, round.questionIndex);
  const enhanced = round.advancedStrategyAvailable && Boolean(playerCardId);
  const playerCard = cardUse("player", playerCardId, enhanced, playerRole, playerCorrect);
  const aiCard = cardUse("ai", aiCardId, false, aiRole, aiCorrect);
  const playerHeal = playerCard?.cardId === "first-aid" ? playerCard.effectValue : 0;
  const aiHeal = aiCard?.cardId === "first-aid" ? aiCard.effectValue : 0;
  const playerCardDamage = playerCorrect && playerCard?.effective && STRATEGY_CARDS[playerCard.cardId].effect === "correct-damage" ? playerCard.effectValue : 0;
  const aiCardDamage = aiCorrect && aiCard?.effective && STRATEGY_CARDS[aiCard.cardId].effect === "correct-damage" ? aiCard.effectValue : 0;
  const playerShield = !playerCorrect && playerCard?.effective && playerCard.cardId === "shield" ? playerCard.effectValue : 0;
  const aiShield = !aiCorrect && aiCard?.effective && aiCard.cardId === "shield" ? aiCard.effectValue : 0;
  const playerCorrectDamage = playerCorrect ? correctDamage(playerRole, aiRole, round.playerHp, playerCardDamage) : 0;
  const aiCorrectDamage = aiCorrect ? correctDamage(aiRole, playerRole, round.aiHp, aiCardDamage) : 0;
  const playerDamageToAi = playerCorrectDamage + (!aiCorrect ? wrongDamage(aiRole, aiShield) : 0);
  const aiDamageToPlayer = aiCorrectDamage + (!playerCorrect ? wrongDamage(playerRole, playerShield) : 0);
  const playerHp = clampHp(round.playerHp + playerHeal - aiDamageToPlayer);
  const aiHp = clampHp(round.aiHp + aiHeal - playerDamageToAi);
  const questionIndex = round.questionIndex + 1;
  const playerCombo = playerCorrect ? round.playerCombo + 1 : 0;
  const highStrategyUnlocked = playerCombo === 3;
  const winner = winnerForRound(playerHp, aiHp, questionIndex);
  const turn: DuelTurn = {
    questionId: question.id,
    playerCorrect,
    aiCorrect,
    playerDamageToAi,
    aiDamageToPlayer,
    ...(playerCard ? { playerCard } : {}),
    ...(aiCard ? { aiCard } : {}),
    playerExplanation: playerCorrect ? "答對，知識攻勢命中。" : `答錯：${question.explanation}`,
  };
  return {
    turn,
    highStrategyUnlocked,
    round: {
      ...round,
      playerHp,
      aiHp,
      questionIndex,
      playerCombo,
      advancedStrategyAvailable: highStrategyUnlocked || (round.advancedStrategyAvailable && !playerCardId),
      usedCards: [...round.usedCards, ...(playerCard ? [playerCard] : []), ...(aiCard ? [aiCard] : [])],
      turns: [...round.turns, turn],
      ended: winner !== null,
      winner,
    },
  };
}

export function selectDuelQuestions(questions: CurriculumQuestion[], weakSubjects: SubjectKey[], count = DUEL_QUESTIONS_PER_ROUND * 3, random: () => number = Math.random): CurriculumQuestion[] {
  const pool = [...questions];
  const weak = new Set(weakSubjects);
  const selected: CurriculumQuestion[] = [];
  const availableWeak = pool.filter((question) => weak.has(question.subject)).length;
  const minimumWeak = Math.min(availableWeak, Math.ceil(count * 0.6));
  let selectedWeak = 0;
  while (pool.length > 0 && selected.length < count) {
    const mustPreferWeak = selectedWeak < minimumWeak;
    const source = mustPreferWeak ? pool.filter((question) => weak.has(question.subject)) : pool;
    const weighted = source.flatMap((question) => weak.has(question.subject) ? [question, question, question] : [question]);
    const pick = weighted[Math.max(0, Math.min(weighted.length - 1, Math.floor(random() * weighted.length)))];
    if (!pick) break;
    selected.push(pick);
    if (weak.has(pick.subject)) selectedWeak += 1;
    pool.splice(pool.findIndex((question) => question.id === pick.id), 1);
  }
  return selected;
}

export function strategyEffectiveness(cardUseItem: DuelCardUse) {
  if (cardUseItem.effective) return `${STRATEGY_CARDS[cardUseItem.cardId].name}：${cardUseItem.note}`;
  return `${STRATEGY_CARDS[cardUseItem.cardId].name}：本題未生效，可嘗試在更適合的時機使用。`;
}
