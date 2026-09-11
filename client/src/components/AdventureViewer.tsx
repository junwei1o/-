import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useQuestionBank } from "@/lib/questionBank";
import { ALL_CHAPTERS, getChapterById, type AdventureChapter } from "@/game/adventureChapters";
import {
  advanceAdventure,
  beginAdventure,
  currentNode,
  settleAdventureEnding,
  type AdventureState,
} from "@/game/adventureEngine";
import { getPlayerData, unlockLimitedTitle, updatePlayerData } from "@/utils/storage";
import { addCardToCollection, getCardCollection } from "@/game/cardCollection";
import { getRandomUnownedCard } from "@/game/trumpCardData";

type QuestionView = { prompt: string; options: string[]; answer: number };

export default function AdventureViewer() {
  const { questions } = useQuestionBank();
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [state, setState] = useState<AdventureState | null>(null);
  const [checkQuestion, setCheckQuestion] = useState<QuestionView | null>(null);

  const chapter = useMemo(() => (chapterId ? getChapterById(chapterId) : null), [chapterId]);

  function startChapter(ch: AdventureChapter) {
    if (ch.cost > 0) {
      const player = getPlayerData();
      if (player.gold < ch.cost) {
        toast.warning("金幣不足");
        return;
      }
      updatePlayerData({ gold: player.gold - ch.cost });
    }
    setChapterId(ch.id);
    setState(beginAdventure(ch));
    setCheckQuestion(null);
  }

  function handleChoice(index: number) {
    if (!state || !chapter) return;
    setState(advanceAdventure(state, chapter, { kind: "choice", choiceIndex: index }));
  }

  function handleAnswer(correct: boolean) {
    if (!state || !chapter) return;
    setState(advanceAdventure(state, chapter, { kind: "answer", correct }));
    setCheckQuestion(null);
  }

  function handleCheck() {
    if (!state || !chapter) return;
    const node = currentNode(state, chapter);
    if (node.type !== "check" || !node.check) return;
    const pool = questions.filter((q) => q.subject === node.check!.subject);
    if (pool.length === 0) {
      // 題庫沒有該科目題目，直接當作答對通過
      handleAnswer(true);
      return;
    }
    const q = pool[Math.floor(Math.random() * pool.length)];
    setCheckQuestion({ prompt: q.prompt, options: q.options, answer: q.answer });
  }

  function handleEnding() {
    if (!state || !chapter) return;
    const reward = settleAdventureEnding(state, chapter);
    if (reward.gold > 0) updatePlayerData({ gold: getPlayerData().gold + reward.gold });
    if (reward.card) {
      const dropped = getRandomUnownedCard(getCardCollection().ownedCardIds);
      if (dropped) addCardToCollection(dropped.id);
    }
    if (reward.title) unlockLimitedTitle(reward.title);
    const msg = reward.title
      ? `冒險結束！獲得 ${reward.gold} 金幣與稱號「${reward.title}」`
      : `冒險結束！獲得 ${reward.gold} 金幣`;
    toast.success(msg);
    setState(null);
    setChapterId(null);
  }

  if (!chapter || !state) {
    return (
      <div className="adventure-chapters">
        <h2>📜 文字冒險</h2>
        <p>從酒館佈告欄接任務，出發闖蕩敘事章節。答題通過考驗，揭開結局！</p>
        <p className="adventure-back-to-study"><Link href="/practice">返回學習區</Link></p>
        <div className="adventure-chapter-list">
          {ALL_CHAPTERS.map((ch) => (
            <button key={ch.id} className="adventure-chapter" onClick={() => startChapter(ch)}>
              <span className="adventure-icon">{ch.icon}</span>
              <strong>{ch.title}</strong>
              <small>{ch.summary}</small>
              <span className="adventure-cost">{ch.cost === 0 ? "免費" : `${ch.cost} 金幣`}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const node = currentNode(state, chapter);

  return (
    <div className="adventure-viewer">
      <h3>{chapter.icon} {chapter.title}</h3>
      <div className="adventure-text">{node.text}</div>

      {node.type === "check" && !checkQuestion && (
        <button onClick={handleCheck}>接受考驗</button>
      )}
      {node.type === "check" && checkQuestion && (
        <div className="adventure-check">
          <p className="adventure-question">{checkQuestion.prompt}</p>
          <div className="adventure-options">
            {checkQuestion.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(i === checkQuestion.answer)}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {(node.type === "narrative" || node.type === "choice") && node.choices?.map((choice, i) => (
        <button key={i} className="adventure-choice" onClick={() => handleChoice(i)}>{choice.label}</button>
      ))}

      {node.type === "ending" && (
        <div className="adventure-ending">
          <p>結局：{node.ending === "good" ? "✨ 美滿" : node.ending === "bad" ? "😔 遺憾" : "🙂 平淡"}</p>
          <button onClick={handleEnding}>領取獎勵</button>
        </div>
      )}
    </div>
  );
}
