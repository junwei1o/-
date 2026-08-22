import React, { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Clock3, HeartPulse, ShieldCheck, Sparkles, Swords, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { ALL_CURRICULUM_QUESTIONS, type SubjectKey } from "@/game/expeditionContent";
import {
  DEFAULT_DUEL_LOADOUT,
  DUEL_ROLES,
  DUEL_TIME_LIMIT_MS,
  DUEL_WINS_TO_MATCH,
  STRATEGY_CARDS,
  createDuelRound,
  createRolePair,
  describeAiStrategy,
  resolveDuelTurn,
  selectDuelQuestions,
  strategyEffectiveness,
  type AiStrategyInsight,
  type DuelOwner,
  type DuelCardUse,
  type DuelRole,
  type DuelRound,
  type StrategyCardId,
} from "@/game/knowledgeDuel";
import { getKnowledgeDuelRecords, getLearningRecord, saveKnowledgeDuelRecord } from "@/utils/storage";

type DuelScreen = "setup" | "question" | "round-summary" | "match-summary";
type DuelQuestion = (typeof ALL_CURRICULUM_QUESTIONS)[number];

const SUBJECT_LABELS: Record<SubjectKey, string> = { chinese: "國文", math: "數學", english: "英文", science: "自然" };
const AI_LOADOUT: StrategyCardId[] = ["lightning-chain", "insight", "shield"];

function subjectKeyForRecord(subject: string): SubjectKey | null {
  if (subject.includes("數")) return "math";
  if (subject.includes("英")) return "english";
  if (subject.includes("自") || subject.includes("科")) return "science";
  if (subject.includes("國") || subject.includes("語") || subject.includes("文")) return "chinese";
  return null;
}

function weakSubjectsFromRecords(): SubjectKey[] {
  const scores = Object.keys(SUBJECT_LABELS).reduce((result, subject) => ({ ...result, [subject]: { attempts: 0, correct: 0 } }), {} as Record<SubjectKey, { attempts: number; correct: number }>);
  getLearningRecord().forEach((record) => {
    const subject = subjectKeyForRecord(record.subject);
    if (!subject) return;
    scores[subject].attempts += 1;
    if (record.isCorrect) scores[subject].correct += 1;
  });
  const attempted = (Object.keys(scores) as SubjectKey[]).filter((subject) => scores[subject].attempts > 0);
  if (attempted.length === 0) return ["math", "chinese"];
  return [...attempted]
    .sort((a, b) => (scores[a].correct / scores[a].attempts) - (scores[b].correct / scores[b].attempts))
    .slice(0, Math.min(2, attempted.length));
}

function hpWidth(hp: number) { return `${Math.max(0, Math.min(100, hp))}%`; }

export default function KnowledgeDuel() {
  const [, setLocation] = useLocation();
  const [screen, setScreen] = useState<DuelScreen>("setup");
  const [loadout, setLoadout] = useState<StrategyCardId[]>(DEFAULT_DUEL_LOADOUT);
  const [roles, setRoles] = useState<{ playerRole: DuelRole; aiRole: DuelRole }>(() => createRolePair());
  const [questions, setQuestions] = useState<DuelQuestion[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<SubjectKey[]>([]);
  const [round, setRound] = useState<DuelRound>(() => createDuelRound(1));
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [matchUsedCards, setMatchUsedCards] = useState<DuelCardUse[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(DUEL_TIME_LIMIT_MS / 1000);
  const [selectedCard, setSelectedCard] = useState<StrategyCardId | null>(null);
  const [lastAiStrategy, setLastAiStrategy] = useState<AiStrategyInsight | null>(null);
  const [feedback, setFeedback] = useState("準備好後，將依你的學習紀錄安排本局題目。角色會在決鬥結束後揭曉。");
  const [savedMatches, setSavedMatches] = useState(() => getKnowledgeDuelRecords());

  const currentQuestion = screen === "question" ? questions[(round.roundNumber - 1) * 5 + round.questionIndex] ?? null : null;
  const currentPlayerRole = DUEL_ROLES[roles.playerRole];
  const currentAiRole = DUEL_ROLES[roles.aiRole];
  const usedPlayerCards = useMemo(() => new Set(round.usedCards.filter((card) => card.owner === "player").map((card) => card.cardId)), [round.usedCards]);
  const insightActive = selectedCard === "insight" && !usedPlayerCards.has("insight");
  const eliminatedAnswers = useMemo(() => {
    if (!insightActive || !currentQuestion) return new Set<number>();
    return new Set(currentQuestion.options.map((_, index) => index).filter((index) => index !== currentQuestion.answer).slice(0, 2));
  }, [currentQuestion, insightActive]);

  useEffect(() => {
    if (screen !== "question") return;
    if (secondsLeft <= 0) {
      answerQuestion(null, true);
      return;
    }
    const timeout = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1_000);
    return () => window.clearTimeout(timeout);
  // answerQuestion uses the latest render state and is intentionally triggered by the timeout transition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, secondsLeft]);

  function beginMatch() {
    const nextWeakSubjects = weakSubjectsFromRecords();
    setWeakSubjects(nextWeakSubjects);
    setQuestions(selectDuelQuestions(ALL_CURRICULUM_QUESTIONS, nextWeakSubjects, 15));
    setRoles(createRolePair());
    setRound(createDuelRound(1, loadout, AI_LOADOUT));
    setPlayerWins(0);
    setAiWins(0);
    setMatchUsedCards([]);
    setSelectedCard(null);
    setLastAiStrategy(null);
    setSecondsLeft(DUEL_TIME_LIMIT_MS / 1000);
    setFeedback(`本局優先練習：${nextWeakSubjects.map((subject) => SUBJECT_LABELS[subject]).join("、")}。先看題目，再決定是否使用策略卡。`);
    setScreen("question");
  }

  function answerQuestion(answer: number | null, timedOut = false) {
    if (!currentQuestion || round.ended) return;
    const resolution = resolveDuelTurn({ round, question: currentQuestion, playerRole: roles.playerRole, aiRole: roles.aiRole, playerAnswer: answer, playerCard: selectedCard });
    const nextRound = resolution.round;
    const aiStrategy = describeAiStrategy(round, currentQuestion.difficulty, resolution.turn.aiCard);
    const turnCards = [resolution.turn.playerCard, resolution.turn.aiCard].filter((card): card is DuelCardUse => Boolean(card));
    const nextMatchUsedCards = [...matchUsedCards, ...turnCards];
    setRound(nextRound);
    setMatchUsedCards(nextMatchUsedCards);
    setSelectedCard(null);
    setLastAiStrategy(aiStrategy);
    setSecondsLeft(DUEL_TIME_LIMIT_MS / 1000);
    const playerLine = resolution.turn.playerCorrect ? `答對，對手受到 ${resolution.turn.playerDamageToAi} 點傷害。` : timedOut ? `時間到，受到 ${resolution.turn.aiDamageToPlayer} 點傷害。` : `答錯，受到 ${resolution.turn.aiDamageToPlayer} 點傷害。`;
    const aiLine = resolution.turn.aiCorrect ? `AI 答對並造成 ${resolution.turn.aiDamageToPlayer} 點傷害。` : "AI 本題推理失誤。";
    const aiStrategyLine = aiStrategy ? ` 對手策略偵測：AI 使用「${aiStrategy.cardName}」，${aiStrategy.reason}${aiStrategy.outcome}` : "";
    setFeedback(`${playerLine} ${aiLine}${aiStrategyLine}${resolution.highStrategyUnlocked ? " 連續答對三題，高級策略卡已啟動！" : ""}`);
    if (!nextRound.ended) return;
    const nextPlayerWins = playerWins + (nextRound.winner === "player" ? 1 : 0);
    const nextAiWins = aiWins + (nextRound.winner === "ai" ? 1 : 0);
    setPlayerWins(nextPlayerWins);
    setAiWins(nextAiWins);
    if (nextPlayerWins >= DUEL_WINS_TO_MATCH || nextAiWins >= DUEL_WINS_TO_MATCH) {
      const winner: DuelOwner | "draw" = nextPlayerWins === nextAiWins ? "draw" : nextPlayerWins > nextAiWins ? "player" : "ai";
      setSavedMatches(saveKnowledgeDuelRecord({
        id: `duel-${Date.now()}`,
        timestamp: Date.now(),
        winner,
        playerWins: nextPlayerWins,
        aiWins: nextAiWins,
        weakSubjects: weakSubjects.map((subject) => SUBJECT_LABELS[subject]),
        usedCards: nextMatchUsedCards.filter((card) => card.owner === "player").map((card) => card.cardId),
      }));
      setScreen("match-summary");
      return;
    }
    setScreen("round-summary");
  }

  function startNextRound() {
    const nextRoundNumber = round.roundNumber + 1;
    setRound(createDuelRound(nextRoundNumber, loadout, AI_LOADOUT));
    setSelectedCard(null);
    setLastAiStrategy(null);
    setSecondsLeft(DUEL_TIME_LIMIT_MS / 1000);
    setFeedback(`第 ${nextRoundNumber} 局開始。雙方生命與策略卡已重置，角色仍保持隱藏。`);
    setScreen("question");
  }

  function toggleLoadout(cardId: StrategyCardId) {
    setLoadout((current) => current.includes(cardId)
      ? current.filter((item) => item !== cardId)
      : current.length < 3 ? [...current, cardId] : current);
  }

  function roleReveal() {
    return <div className="duel-role-reveal" aria-label="角色揭曉"><div><span>{currentPlayerRole.emoji}</span><strong>你是{currentPlayerRole.name}</strong><p>{currentPlayerRole.ability}</p></div><div><span>{currentAiRole.emoji}</span><strong>AI 是{currentAiRole.name}</strong><p>{currentAiRole.ability}</p></div></div>;
  }

  return <main className="duel-page" aria-labelledby="duel-title"><div className="duel-shell">
    <button type="button" className="settings-back-button" onClick={() => setLocation("/community")}>← 返回自我挑戰</button>
    <header className="duel-header"><p className="settings-eyebrow">單機推理答題模式</p><h1 id="duel-title"><Swords size={28} aria-hidden="true" />知識決鬥</h1><p>與可預測、會思考的 AI 進行三局兩勝制推理答題。這裡只保留你的個人學習戰績，沒有排行或社交比較。</p></header>

    {screen === "setup" && <section className="duel-panel" aria-labelledby="duel-setup-title"><div className="duel-panel-title"><BrainCircuit size={19} aria-hidden="true" /><h2 id="duel-setup-title">選擇本局策略卡</h2></div><p>每局攜帶三張策略卡，每張限用一次。連續答對三題後，下一張使用的策略卡效果會加倍。</p><div className="duel-card-grid">{Object.values(STRATEGY_CARDS).map((card) => { const selected = loadout.includes(card.id); return <button key={card.id} type="button" className={`duel-strategy-card ${selected ? "is-selected" : ""}`} aria-pressed={selected} onClick={() => toggleLoadout(card.id)}><strong>{card.name}</strong><span>{card.description}</span><small>{selected ? "已攜帶" : loadout.length >= 3 ? "已達三張上限" : "點選攜帶"}</small></button>; })}</div><div className="duel-setup-note"><ShieldCheck size={18} aria-hidden="true" /><p>雙方角色與能力在決鬥中都會以「？」隱藏；每局結束才會揭曉。本局將提高你較需要練習科目的題目比例。</p></div><button type="button" className="settings-primary-button duel-start-button" disabled={loadout.length !== 3} onClick={beginMatch}>開始知識決鬥</button>{savedMatches.length > 0 && <p className="duel-history-note">已保存 {savedMatches.length} 場個人決鬥紀錄；最近一場：{savedMatches.at(-1)?.winner === "player" ? "你獲勝" : "持續練習中"}。</p>}</section>}

    {screen === "question" && currentQuestion && <section className="duel-panel duel-battle" aria-labelledby="duel-question-title">
      <div className="duel-scoreline"><span>第 {round.roundNumber} 局 · 第 {round.questionIndex + 1}/5 題</span><strong>你 {playerWins} : {aiWins} AI</strong><span>{DUEL_WINS_TO_MATCH} 局勝利取得決鬥</span></div>
      <div className="duel-combatants"><div className="duel-combatant"><div><span aria-hidden="true">？</span><strong>你的角色</strong></div><div className="duel-hp"><i style={{ width: hpWidth(round.playerHp) }} /></div><b>{round.playerHp} HP</b></div><div className="duel-versus">VS</div><div className="duel-combatant is-ai"><div><span aria-hidden="true">？</span><strong>AI 對手</strong></div><div className="duel-hp"><i style={{ width: hpWidth(round.aiHp) }} /></div><b>{round.aiHp} HP</b></div></div>
      <div className={`duel-timer ${secondsLeft <= 5 ? "is-urgent" : ""}`}><Clock3 size={18} aria-hidden="true" /><strong>{secondsLeft}</strong><span>秒內作答</span></div>
      <div className="duel-question"><p className="settings-eyebrow">{SUBJECT_LABELS[currentQuestion.subject]} · {currentQuestion.topic}</p><h2 id="duel-question-title">{currentQuestion.prompt}</h2><div className="duel-options">{currentQuestion.options.map((option, index) => <button key={`${currentQuestion.id}-${index}`} type="button" className="settings-secondary-button" aria-label={`回答：${option}`} disabled={eliminatedAnswers.has(index)} onClick={() => answerQuestion(index)}>{eliminatedAnswers.has(index) ? "已由洞察排除" : option}</button>)}</div></div>
      <div className="duel-hand" aria-label="本局策略卡"><div><HeartPulse size={18} aria-hidden="true" /><strong>你的策略卡</strong>{round.advancedStrategyAvailable && <em>高級效果已啟動</em>}</div>{loadout.map((cardId) => { const card = STRATEGY_CARDS[cardId]; const used = usedPlayerCards.has(cardId); return <button key={cardId} type="button" className={`duel-hand-card ${selectedCard === cardId ? "is-armed" : ""}`} disabled={used} aria-pressed={selectedCard === cardId} onClick={() => setSelectedCard((current) => current === cardId ? null : cardId)}><strong>{card.name}</strong><span>{used ? "本局已用" : selectedCard === cardId ? "本題已準備" : card.description}</span></button>; })}</div>
      <p className="duel-feedback" role="status" aria-live="polite">{feedback}</p>
      {lastAiStrategy && <aside className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-slate-700 shadow-sm" aria-label="對手策略偵測" role="status" aria-live="polite"><Sparkles className="mt-0.5 shrink-0 text-sky-600" size={18} aria-hidden="true" /><div><strong className="block text-slate-900">對手策略偵測</strong><p>AI 剛使用「{lastAiStrategy.cardName}」：{lastAiStrategy.reason}</p><span className="font-medium text-sky-800">效果判讀：{lastAiStrategy.outcome}</span></div></aside>}
    </section>}

    {(screen === "round-summary" || screen === "match-summary") && <section className="duel-panel duel-summary" aria-labelledby="duel-summary-title"><div className="duel-panel-title"><Trophy size={20} aria-hidden="true" /><h2 id="duel-summary-title">{screen === "match-summary" ? "決鬥結果" : `第 ${round.roundNumber} 局回顧`}</h2></div><p className="duel-result-copy">{round.winner === "player" ? "你贏得本局：知識推理讓對手露出破綻。" : round.winner === "ai" ? "AI 贏得本局：整理解析後，下一局可以選擇更合適的策略時機。" : "本局平手：雙方生命相同，下一局繼續推理。"}</p>{roleReveal()}<div className="duel-review"><h3>{screen === "match-summary" ? "本場策略有效性回顧" : "策略有效性回顧"}</h3>{(screen === "match-summary" ? matchUsedCards : round.usedCards).length ? <ul>{(screen === "match-summary" ? matchUsedCards : round.usedCards).map((card, index) => <li key={`${card.owner}-${card.cardId}-${index}`}><b>{card.owner === "player" ? "你" : "AI"}</b>：{strategyEffectiveness(card)}</li>)}</ul> : <p>本局沒有使用策略卡；下一局可以在血量或題目難度變化時嘗試。</p>}</div><p className="duel-score-final">總比分：你 {playerWins} : {aiWins} AI</p>{screen === "match-summary" ? <button type="button" className="settings-primary-button duel-start-button" onClick={() => setScreen("setup")}>安排下一場決鬥</button> : <button type="button" className="settings-primary-button duel-start-button" onClick={startNextRound}>進入下一局</button>}</section>}
  </div></main>;
}
