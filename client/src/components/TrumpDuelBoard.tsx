import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
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
import CardArt from "@/components/CardArt";
import { getPlayerData, updatePlayerData } from "@/utils/storage";
import "./TrumpDuelBoard.css";

const HAND_SIZE = 8;
const WIN_GOLD = 15;

type QuestionView = { prompt: string; options: string[]; answer: number; subject: string };

/** 勝負顯示用：與 trumpDuel 的 compareStat 同規則（我方加成 +2，高者勝，平手進公共池） */
function displayWinner(playerValue: number, aiValue: number): "player" | "ai" | "draw" {
  if (playerValue > aiValue) return "player";
  if (aiValue > playerValue) return "ai";
  return "draw";
}

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
    if (!state || state.phase !== "choose-stat" || state.turnLeader !== "ai") return;
    const stat = aiChooseStat(state.aiDeck);
    setAiThinking(true);
    const timer = setTimeout(() => {
      setState((prev) => (prev ? chooseTrumpStat(prev, stat) : prev));
      setAiThinking(false);
    }, 600);
    return () => clearTimeout(timer);
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

  const playerValue =
    state.pendingStat && playerTop ? playerTop.stats[state.pendingStat] + (state.pendingBoost ? 2 : 0) : null;
  const aiValue = state.pendingStat && aiTop ? aiTop.stats[state.pendingStat] : null;
  const winner = playerValue !== null && aiValue !== null ? displayWinner(playerValue, aiValue) : null;

  return (
    <div className="trump-board">
      {/* HUD */}
      <div className="trump-hud">
        <span>回合 {Math.min(state.round, 40)} / 40</span>
        <span className={state.turnLeader === "player" ? "is-active" : ""}>
          主動：{state.turnLeader === "player" ? "你" : "對手"}
        </span>
        <span>公共池 {state.pot.length} 張</span>
      </div>

      {/* 桌面：對手牌堆／公共池／我方牌堆 */}
      <div className="trump-stage">
        <div className={`trump-deck${state.turnLeader === "ai" ? " is-leader" : ""}`}>
          <span className="trump-deck-label">對手</span>
          <span className="trump-card-back-stack" aria-hidden="true">
            <span className="trump-card-back">⚓</span>
            {state.aiDeck.length > 1 && <span className="trump-card-back">⚓</span>}
            {state.aiDeck.length > 2 && <span className="trump-card-back">⚓</span>}
          </span>
          <span className="trump-deck-count">{state.aiDeck.length} 張</span>
        </div>

        <div className="trump-pot">
          <span className="trump-deck-label">公共池</span>
          {state.pot.length > 0 ? (
            <span className="trump-pot-pile" aria-hidden="true">
              {state.pot.slice(0, 12).map((card, i) => (
                <span key={`${card.id}-${i}`} className="trump-pot-chip" />
              ))}
            </span>
          ) : (
            <span className="trump-pot-empty">空</span>
          )}
          <span className="trump-deck-count">{state.pot.length} 張</span>
        </div>

        <div className={`trump-deck${state.turnLeader === "player" ? " is-leader" : ""}`}>
          <span className="trump-deck-label">我方</span>
          <span className="trump-card-back-stack" aria-hidden="true">
            <span className="trump-card-back">⚓</span>
            {state.playerDeck.length > 1 && <span className="trump-card-back">⚓</span>}
            {state.playerDeck.length > 2 && <span className="trump-card-back">⚓</span>}
          </span>
          <span className="trump-deck-count">{state.playerDeck.length} 張</span>
        </div>
      </div>

      {/* 選屬性 */}
      {state.phase === "choose-stat" && (
        <div className="trump-panel">
          <div className={`trump-turn ${state.turnLeader === "player" ? "is-player" : "is-ai"}`}>
            <span aria-hidden="true">{state.turnLeader === "player" ? "🎯" : "🤖"}</span>
            {state.turnLeader === "player" ? "輪到你選屬性" : "對手選屬性中…"}
          </div>
          {playerTop && state.turnLeader === "player" && (
            <div className="trump-card-preview">
              <strong>
                <CardArt cardId={playerTop.id} emoji={playerTop.emoji} name={playerTop.name} className="trump-card-art" />
                <span>
                  你的牌：{playerTop.name}
                  <small> （{playerTop.theme}）</small>
                </span>
              </strong>

              {/* 偷看情報：選屬性前就能看到對手頂牌，讓決策不再盲選 */}
              {state.peekRevealed && aiTop && (
                <div className="trump-peek-intel" role="status">
                  <span aria-hidden="true">👁️</span>
                  <div>
                    <strong>對手這輪的牌：{aiTop.name}</strong>
                    <span className="trump-peek-intel-stats">
                      {(Object.keys(STAT_LABELS) as CardStat[]).map((stat) => (
                        <em key={stat}>
                          {STAT_LABELS[stat]} {aiTop.stats[stat]}
                        </em>
                      ))}
                    </span>
                  </div>
                </div>
              )}

              <div className="trump-stat-grid">
                {(Object.keys(STAT_LABELS) as CardStat[]).map((stat) => (
                  <button key={stat} onClick={() => chooseStat(stat)}>
                    <span>{STAT_LABELS[stat]}</span>
                    <b>{playerTop.stats[stat]}</b>
                  </button>
                ))}
              </div>
            </div>
          )}
          {aiThinking && <p>對手正在盤算……</p>}
        </div>
      )}

      {/* 作答 */}
      {state.phase === "answer" && (
        <div className="trump-panel">
          {!currentQuestion ? (
            <>
              <p>回答一道「{questionTheme}」題，爭取加成！答對可選「偷看對手牌」或「屬性 +2」。</p>
              <button className="trump-primary" onClick={() => setCurrentQuestion(drawQuestion(questionTheme))}>
                抽題作答
              </button>
            </>
          ) : (
            <>
              <p className="trump-question-prompt">{currentQuestion.prompt}</p>
              <div className="trump-options">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    data-index={String.fromCharCode(65 + i)}
                    onClick={() => onAnswer(i === currentQuestion.answer, "boost")}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="trump-bonus-choices">
                <small>答對可選擇加成：</small>
                <button onClick={() => onAnswer(true, "peek")}>👁️ 偷看對手牌</button>
                <button onClick={() => onAnswer(true, "boost")}>⚡ 屬性 +2</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 揭曉 */}
      {state.phase === "reveal" && (
        <div className="trump-panel">
          <div className="trump-reveal-cards">
            <div className={`trump-reveal-card${winner === "player" ? " is-winner" : ""}`}>
              <span>我方</span>
              {playerTop && (
                <CardArt
                  cardId={playerTop.id}
                  emoji={playerTop.emoji}
                  name={playerTop.name}
                  className="trump-reveal-art"
                />
              )}
              <strong>{playerTop?.name}</strong>
              <span className="trump-reveal-value">
                {state.pendingStat ? STAT_LABELS[state.pendingStat] : ""} {playerValue ?? "?"}
              </span>
              {state.pendingBoost && <span className="trump-boost-badge">+2 加成</span>}
            </div>
            <div className={`trump-reveal-card${winner === "ai" ? " is-winner" : ""}`}>
              <span>對手</span>
              {aiTop && (
                <CardArt cardId={aiTop.id} emoji={aiTop.emoji} name={aiTop.name} className="trump-reveal-art" />
              )}
              <strong>{aiTop?.name}</strong>
              <span className="trump-reveal-value">
                {state.pendingStat ? STAT_LABELS[state.pendingStat] : ""} {aiValue ?? "?"}
              </span>
            </div>
          </div>
          {winner === "draw" && <p className="trump-draw-note">數值相同——兩張牌都進公共池，下一局贏回來！</p>}
          {state.peekRevealed && (
            <p className="trump-peek">👁️ 你已偷看情報——下一輪選屬性前，會先看到對手的牌！</p>
          )}
          <button className="trump-primary" onClick={reveal}>揭曉勝負</button>
        </div>
      )}

      {/* 結束 */}
      {state.phase === "finished" && (
        <div className="trump-finished">
          <h3>{state.result === "victory" ? "🏆 勝利！" : state.result === "defeat" ? "💔 落敗" : "🤝 平手"}</h3>
          <div className="trump-finished-actions">
            <button onClick={start}>再戰一局</button>
            <Link className="trump-back-to-study" href="/practice">回去答題</Link>
          </div>
        </div>
      )}
    </div>
  );
}
