import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuestionBank } from "@/lib/questionBank";
import { ALL_CARDS, STAT_LABELS, type CardStat } from "@/game/trumpCardData";
import {
  aiAnswerCorrect,
  aiChooseStat,
  applyTrumpAnswer,
  beginTrumpDuel,
  buildDeckFromCollection,
  chooseTrumpStat,
  settleTrumpRound,
  type AnswerChoice,
  type TrumpState,
} from "@/game/trumpDuel";
import { getCardCollection, maybeDropUnownedCard, recordCardDuelResult } from "@/game/cardCollection";
import { getPlayerData, updatePlayerData } from "@/utils/storage";

const HAND_SIZE = 8;
const WIN_GOLD = 15;

type QuestionView = { prompt: string; options: string[]; answer: number; subject: string };

export default function TrumpDuelBoard() {
  const { questions } = useQuestionBank();
  const [state, setState] = useState<TrumpState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionView | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  function start() {
    const owned = getCardCollection().ownedCardIds;
    const playerDeck = buildDeckFromCollection(owned, ALL_CARDS, HAND_SIZE);
    const aiDeck = buildDeckFromCollection(
      ALL_CARDS.map((c) => c.id),
      ALL_CARDS,
      HAND_SIZE,
    );
    if (playerDeck.length < 3) {
      toast.warning("收藏的卡牌不足，先去卡包抽幾張吧！");
      return;
    }
    setState(beginTrumpDuel(playerDeck, aiDeck));
    setCurrentQuestion(null);
  }

  // AI 自動選屬性（輪到 AI 主動時）
  useEffect(() => {
    if (!state || state.phase !== "choose-stat" || state.turnLeader !== "player") return;
    if (state.turnLeader === "ai") {
      const stat = aiChooseStat(state.aiDeck);
      setAiThinking(true);
      const timer = setTimeout(() => {
        setState((prev) => (prev ? chooseTrumpStat(prev, stat) : prev));
        setAiThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state]);

  function drawQuestion(theme: string) {
    const pool = questions.filter((q) => q.subject === theme);
    if (pool.length === 0) return null;
    const q = pool[Math.floor(Math.random() * pool.length)];
    return { prompt: q.prompt, options: q.options, answer: q.answer, subject: q.subject };
  }

  function chooseStat(stat: CardStat) {
    if (!state) return;
    setState(chooseTrumpStat(state, stat));
  }

  function onAnswer(correct: boolean, choice: AnswerChoice) {
    if (!state) return;
    setState(applyTrumpAnswer(state, correct, choice));
    setCurrentQuestion(null);
  }

  function reveal() {
    if (!state) return;
    const next = settleTrumpRound(state);
    setState(next);
    if (next.result !== "active") {
      recordCardDuelResult(next.result);
      if (next.result === "victory") {
        updatePlayerData({ gold: getPlayerData().gold + WIN_GOLD });
        const dropped = maybeDropUnownedCard();
        toast.success(dropped ? `獲勝！獲得 ${WIN_GOLD} 金幣與新卡「${dropped.name}」` : `獲勝！獲得 ${WIN_GOLD} 金幣`);
      } else if (next.result === "draw") {
        toast.message("平手，不分軒輊。");
      } else {
        toast.message("落敗了，再試一次！");
      }
    }
  }

  if (!state) {
    return (
      <div className="trump-start">
        <h2>🃏 潮汐牌局</h2>
        <p>選屬性比大小，答對獲得「偷看對手牌」或「屬性 +2」。贏走對方的卡！</p>
        <button onClick={start}>開始對戰</button>
      </div>
    );
  }

  const playerTop = state.playerDeck[0];
  const aiTop = state.aiDeck[0];
  const leaderTop = state.turnLeader === "player" ? playerTop : aiTop;
  const questionTheme = leaderTop?.theme ?? "自然";

  return (
    <div className="trump-board">
      <div className="trump-hud">
        <span>回合 {Math.min(state.round, 40)} / 40</span>
        <span>我方 {state.playerDeck.length} 張｜對手 {state.aiDeck.length} 張</span>
        {state.pot.length > 0 && <span>公共池 {state.pot.length} 張</span>}
        <span>主動：{state.turnLeader === "player" ? "你" : "對手"}</span>
      </div>

      {state.phase === "choose-stat" && (
        <div className="trump-choose">
          <p>{state.turnLeader === "player" ? "你來選屬性" : aiThinking ? "對手選屬性中…" : "對手選屬性中…"}</p>
          {playerTop && state.turnLeader === "player" && (
            <div className="trump-card-preview">
              <strong>你的牌：{playerTop.emoji} {playerTop.name}</strong>
              <div className="trump-stat-grid">
                {(Object.keys(STAT_LABELS) as CardStat[]).map((stat) => (
                  <button key={stat} onClick={() => chooseStat(stat)}>
                    {STAT_LABELS[stat]}：{playerTop.stats[stat]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {state.phase === "answer" && (
        <div className="trump-answer">
          {!currentQuestion ? (
            <div className="trump-question-pick">
              <p>回答一道「{questionTheme}」題，爭取加成！</p>
              <button onClick={() => setCurrentQuestion(drawQuestion(questionTheme))}>抽題作答</button>
            </div>
          ) : (
            <>
              <p className="trump-question-prompt">{currentQuestion.prompt}</p>
              <div className="trump-options">
                {currentQuestion.options.map((opt, i) => (
                  <button key={i} onClick={() => onAnswer(i === currentQuestion.answer, "boost")}>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="trump-bonus-choices">
                <small>答對可選擇加成：</small>
                <button onClick={() => onAnswer(true, "peek")}>偷看對手牌</button>
                <button onClick={() => onAnswer(true, "boost")}>屬性 +2</button>
              </div>
            </>
          )}
        </div>
      )}

      {state.phase === "reveal" && (
        <div className="trump-reveal">
          <div className="trump-reveal-cards">
            <div className="trump-reveal-card">
              <span>我方</span>
              <strong>{playerTop?.emoji} {playerTop?.name}</strong>
              <span>{state.pendingStat ? STAT_LABELS[state.pendingStat] : ""}：{state.pendingStat ? playerTop?.stats[state.pendingStat] : "?"}{state.pendingBoost ? " +2" : ""}</span>
            </div>
            <div className="trump-reveal-card">
              <span>對手</span>
              <strong>{aiTop?.emoji} {aiTop?.name}</strong>
              <span>{state.pendingStat ? STAT_LABELS[state.pendingStat] : ""}：{state.pendingStat ? aiTop?.stats[state.pendingStat] : "?"}</span>
            </div>
          </div>
          {state.peekRevealed && <p className="trump-peek">👁️ 你偷看了對方的牌！</p>}
          <button onClick={reveal}>揭曉勝負</button>
        </div>
      )}

      {state.phase === "finished" && (
        <div className="trump-finished">
          <h3>{state.result === "victory" ? "🏆 勝利！" : state.result === "defeat" ? "💔 落敗" : "🤝 平手"}</h3>
          <button onClick={start}>再戰一局</button>
        </div>
      )}
    </div>
  );
}
