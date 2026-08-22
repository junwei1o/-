import React, { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";
import { toast } from "sonner";
import type { PaperQuestion } from "@/lib/paperExam";
import type { KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import { addRecord, clearBattleState, consumeStorageNotice, getBattleState, getLearningRecord, saveBattleState, getBattleTutorialComplete, saveBattleTutorialComplete, recordAnalyticsEvent, recordRareMonsterDefeat, unlockLimitedTitle } from "@/utils/storage";
import { recordRpgAnswer } from "@/game/rpgStorage";
import { playCombatSfx } from "@/game/rpgCombatFeedback";
import { BattleScene } from "@/components/BattleScene";
import { BattleState, createBattleDispatcher, type BattleMachine } from "@/engine/BattleState";
import { getCorrectStreak, getRandomSubjectMonster, type SubjectKey } from "@/game/expeditionContent";
import { tryDropHealthPotion, consumeHealthPotion, countHealthPotions } from "@/game/inventoryService";

export type QuizModalProps = { question: PaperQuestion; subject: KnowledgeIslandSubject; onClose: () => void; onCompleted: () => void };

type ScenePhase = "idle" | "player" | "result" | "attack" | "enemy" | "reward";

export function QuizModal({ question, subject, onClose, onCompleted }: QuizModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [machine, setMachine] = useState<BattleMachine>(() => createBattleDispatcher().getState());
  const [scenePhase, setScenePhase] = useState<ScenePhase>("player");
  const [correctAnswer, setCorrectAnswer] = useState(false);
  const [damage, setDamage] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [restorePrompt, setRestorePrompt] = useState<ReturnType<typeof getBattleState>>(null);
  const [enemy] = useState(() => {
    const subjectKey = ({ 國文: "chinese", 國語: "chinese", 數學: "math", 英文: "english", 英語: "english", 自然: "science" } as Record<string, SubjectKey>)[subject] ?? "chinese";
    const correctStreak = getCorrectStreak(getLearningRecord());
    return getRandomSubjectMonster(subjectKey, Math.random, correctStreak);
  });
  const [potionCount, setPotionCount] = useState(() => countHealthPotions());
  const [potionNotice, setPotionNotice] = useState("");
  const [showBattleTutorial, setShowBattleTutorial] = useState(() => !getBattleTutorialComplete());
  const closeRef = useRef<HTMLButtonElement>(null);
  const dispatcherRef = useRef(createBattleDispatcher());
  const timerRef = useRef<number[]>([]);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const snapshot = getBattleState();
    if (snapshot?.isActive) setRestorePrompt(snapshot);
    dispatcherRef.current.dispatch({ type: "START" });
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); timerRef.current.forEach(window.clearTimeout); };
  }, []);

  const answered = selectedOption !== null;
  const correct = selectedOption === question.answer;
  const locked = answered || saved;

  function answer(index: number) {
    if (locked) return;
    const isCorrect = index === question.answer;
    const nextCombo = isCorrect ? machine.combo + 1 : 0;
    const isCritical = isCorrect && nextCombo >= 3;
    const dealtDamage = isCorrect ? Math.max(8, (isCritical ? 45 : 30) - enemy.defense / 2) : enemy.attack;
    const nextPlayerHp = isCorrect ? playerHp : Math.max(0, playerHp - dealtDamage);
    const nextEnemyHp = isCorrect ? Math.max(0, enemyHp - dealtDamage) : enemyHp;
    setSelectedOption(index);
    setCorrectAnswer(isCorrect);
    setDamage(dealtDamage);
    setPlayerHp(nextPlayerHp);
    setEnemyHp(nextEnemyHp);
    saveBattleState({ playerHP: nextPlayerHp, enemyHP: nextEnemyHp, maxHP: 100, currentCombo: nextCombo, enemyId: enemy.id, questionId: question.id, questionIndex: 0, isActive: true, updatedAt: Date.now() });
    const correctAnswerCount = getLearningRecord().filter((record) => record.isCorrect).length + (isCorrect ? 1 : 0);
    const droppedPotion = isCorrect && correctAnswerCount % 5 === 0 ? tryDropHealthPotion(correctAnswerCount) : null;
    recordAnalyticsEvent({ type: "answer", subject, questionId: question.id, correct: isCorrect, timestamp: Date.now() });
    if (droppedPotion) { setPotionCount((value) => value + 1); setPotionNotice("答對累積達標，獲得補血藥水！"); }
    try {
      addRecord({ questionId: question.id, subject, isCorrect, errorType: isCorrect ? undefined : "concept", timestamp: Date.now(), flagged: false, knowledge: [question.learningTopic], difficulty: question.difficulty === "標準" || question.difficulty === "挑戰" ? question.difficulty : "基礎", responseMs: 0, timeLimitMs: 25_000 });
      recordRpgAnswer({ eventId: `island-quiz-${question.id}-${Date.now()}`, correct: isCorrect, curriculumDomain: subject, difficulty: question.difficulty, subject });
    } catch (error) { console.error("答題資料保存失敗", error); toast.warning("儲存空間不足，部分資料可能無法保存"); }
    if (isCorrect && enemy.isRare && enemy.title) recordRareMonsterDefeat(enemy.id);
    const notice = consumeStorageNotice();
    if (notice) toast.warning(notice.message);
    const result = dispatcherRef.current.dispatch({ type: "ANSWER", correct: isCorrect, critical: isCritical });
    setMachine(result); setScenePhase("result"); setSaved(true); onCompleted();
    timerRef.current.push(window.setTimeout(() => {
      const afterResult = dispatcherRef.current.dispatch({ type: "ANIMATION_DONE" });
      const actionPhase: ScenePhase = afterResult.phase === BattleState.BATTLE_ANIMATION ? "attack" : afterResult.phase === BattleState.ENEMY_TURN ? "enemy" : "reward";
      setMachine(afterResult); setScenePhase(actionPhase);
      if (isCorrect) playCombatSfx(isCritical ? "critical" : "attack", true);
      timerRef.current.push(window.setTimeout(() => {
        const pending = dispatcherRef.current.getState();
        const final = pending.phase === BattleState.BATTLE_ANIMATION
          ? dispatcherRef.current.dispatch({ type: "ANIMATION_DONE" })
          : pending.phase === BattleState.ENEMY_TURN
            ? dispatcherRef.current.dispatch({ type: "ENEMY_DONE" })
            : pending;
        setMachine(final); setScenePhase("reward");
        if (isCorrect) playCombatSfx("victory", true);
        if (isCorrect && enemy.isRare && enemy.title) {
          unlockLimitedTitle(enemy.title);
          toast.success(`限定稱號已解鎖：${enemy.title}`);
        }
        clearBattleState();
      }, 1200));
    }, 300));
  }

  return <div className="quiz-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saved) onClose(); }}>
    <section className="quiz-modal battle-quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-modal-title" aria-describedby="quiz-modal-prompt">
      <header className="quiz-modal-header"><div><p className="eyebrow">{subject}島・戰鬥遠征</p><h2 id="quiz-modal-title">留下第一個學習線索</h2></div><button ref={closeRef} type="button" className="quiz-modal-close" onClick={onClose} aria-label="關閉答題視窗"><X size={18} aria-hidden="true" /></button></header>
      {showBattleTutorial && <div className="battle-tutorial-card" role="dialog" aria-labelledby="battle-tutorial-title"><strong id="battle-tutorial-title">第一次戰鬥教學</strong><p>答對 = 攻擊怪物；答錯 = 被怪物反擊；連續答對 3 題 = 暴擊！</p><button type="button" onClick={() => { saveBattleTutorialComplete(true); setShowBattleTutorial(false); }}>知道了，開始戰鬥</button></div>}
      <BattleScene phase={scenePhase} correct={correctAnswer} critical={machine.critical} combo={machine.combo} damage={scenePhase === "result" ? 0 : damage} playerHp={playerHp} enemyHp={enemyHp} enemyName={`${enemy.emoji} ${enemy.name}`} enemyMaxHp={enemy.maxHp} />
      {restorePrompt && <div className="battle-restore-prompt" role="alertdialog" aria-labelledby="battle-restore-title"><strong id="battle-restore-title">發現未完成的戰鬥</strong><p>要繼續上次的 {restorePrompt.enemyId} 冒險嗎？目前玩家 HP {restorePrompt.playerHP}、怪物 HP {restorePrompt.enemyHP}。</p><div><button type="button" onClick={() => { setPlayerHp(restorePrompt.playerHP); setEnemyHp(restorePrompt.enemyHP); setRestorePrompt(null); }}>繼續戰鬥</button><button type="button" onClick={() => { clearBattleState(); setRestorePrompt(null); }}>放棄並重新開始</button></div></div>}
      <p className="quiz-modal-topic">遭遇：{enemy.name} · {question.learningTopic}</p>
      <div className="battle-potion-row" aria-live="polite"><span>🧪 補血藥水：{potionCount}</span><button type="button" disabled={potionCount === 0 || playerHp >= 100 || locked} onClick={() => { const potion = consumeHealthPotion(); if (!potion) return; const hpRatio = playerHp / 100; recordAnalyticsEvent({ type: "potion-use", hpRatio, timestamp: Date.now() }); setPotionCount((value) => Math.max(0, value - 1)); setPlayerHp((value) => Math.min(100, value + (potion.effect?.amount ?? 35))); setPotionNotice("補血藥水生效，HP 已恢復！"); }}>戰鬥中使用</button>{potionNotice && <span>{potionNotice}</span>}</div><p id="quiz-modal-prompt" className="quiz-modal-prompt">{question.prompt}</p>
      <div className="quiz-modal-options" role="group" aria-label="答題選項">{question.options.map((option, index) => { const isAnswer = index === question.answer; const isSelected = index === selectedOption; const optionClass = answered && isAnswer ? "is-correct" : answered && isSelected ? "is-wrong" : ""; return <button key={`${question.id}-${index}`} type="button" className={`quiz-modal-option ${optionClass}`} onClick={() => answer(index)} disabled={locked} aria-label={`選項 ${index + 1}：${option}`}><span>{index + 1}</span>{option}{answered && isAnswer ? <Check size={17} aria-hidden="true" /> : null}{answered && isSelected && !isAnswer ? <CircleAlert size={17} aria-hidden="true" /> : null}</button>; })}</div>
      {answered ? <div className={`quiz-modal-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status" aria-live="polite"><strong>{correct ? "答對了，玩家攻擊成功！" : "整理線索：怪物反擊了"}</strong><p>{question.explanation}</p>{machine.critical && <p className="battle-quiz-critical-copy">🔥 連擊 {machine.combo}：暴擊傷害 ×1.5</p>}{correct && scenePhase === "reward" ? <section className="battle-reward-list" aria-label="本次戰鬥獎勵"><strong>🎉 獲得寶藏！</strong><ul><li>金幣 +50</li><li>經驗值 +30</li><li>地圖航線已更新</li>{enemy.isRare && enemy.title ? <li>限定稱號：{enemy.title}</li> : null}</ul></section> : null}<button type="button" className="quiz-modal-done" onClick={onClose} disabled={scenePhase !== "reward"}>{scenePhase === "reward" ? (correct ? "領取寶藏並繼續探索" : "完成回顧") : "戰鬥結算中…"}</button></div> : <p className="quiz-modal-hint">選一個你目前最有把握的答案；回答後會觸發戰鬥動畫。</p>}
    </section>
  </div>;
}
