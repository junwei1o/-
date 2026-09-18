import React, { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import QuizRunner, { type RunnerQuestion } from "@/components/classroom/QuizRunner";
import RushRunner from "@/components/classroom/RushRunner";
import RelayMatch from "@/components/classroom/RelayMatch";
import FactorGame from "@/components/classroom/FactorGame";
import {
  TRAP_QUESTIONS,
  buildChoiceDeck,
  buildImageQuiz,
  buildTrueFalseDeck,
  loadClassroomBest,
  saveClassroomBest,
  type ClassroomBestMap,
} from "@/lib/classroomBank";
import { IMAGE_MATCHING_SETS, shuffleArray } from "@/lib/matchingBank";

/**
 * 我的教室自由玩法頁：/classroom/:gameId
 * flip 翻牌問答 / image 看圖選答 / bolt 是非閃電 / rush 限時接力 / relay 選擇配對接力 / trap 陷阱題挑戰 / factor 因數探險
 */
const GAME_META: Record<string, { title: string }> = {
  flip: { title: "翻牌問答" },
  image: { title: "看圖選答" },
  bolt: { title: "是非閃電" },
  rush: { title: "限時接力" },
  relay: { title: "選擇配對接力" },
  trap: { title: "陷阱題挑戰" },
  factor: { title: "因數探險" },
};

export default function ClassroomPlay() {
  const [match, params] = useRoute<{ gameId: string }>("/classroom/:gameId");
  const [, setLocation] = useLocation();
  const [best, setBest] = useState<ClassroomBestMap>(() => loadClassroomBest());
  const gameId = params?.gameId ?? "";
  const exit = () => setLocation("/quiz-room");

  // 進入頁面時組一次題庫；各 Runner 內部「再玩一輪」會自行重新洗牌。
  const decks = useMemo(() => {
    const choiceToRunner = (
      q: ReturnType<typeof buildChoiceDeck>[number],
    ): RunnerQuestion => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      meta: `${q.subject} · ${q.learningTopic}`,
    });

    return {
      flip: buildChoiceDeck(10, "綜合").map(choiceToRunner),
      image: IMAGE_MATCHING_SETS.flatMap((set) => buildImageQuiz(set)).map((q) => ({
        id: q.id,
        prompt: "看圖選出正確的名稱",
        img: q.img,
        options: q.options,
        answer: q.options.indexOf(q.answer),
        explanation: `這是「${q.answer}」（${q.setTitle}）。`,
        meta: q.subject,
      })),
      bolt: buildTrueFalseDeck(10).map(choiceToRunner),
      rush: buildChoiceDeck(24, "綜合").map(choiceToRunner),
      trap: shuffleArray(TRAP_QUESTIONS).slice(0, 10).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        trapNote: q.trapNote,
        category: q.category,
        meta: `${q.subject} · ${q.learningTopic}`,
      })),
    };
  }, []);

  if (!match || !GAME_META[gameId]) {
    return (
      <div className="cr-page">
        <div className="cr-start">
          <h2>找不到這個玩法</h2>
          <p>回到我的教室重新選擇一個自由玩法吧。</p>
          <button type="button" className="cr-btn sea" onClick={exit}>回我的教室</button>
        </div>
      </div>
    );
  }

  const record = best[gameId];
  const updateBest = (patch: ClassroomBestMap[string]) => {
    setBest((previous) => {
      const next = { ...previous, [gameId]: { ...previous[gameId], ...patch } };
      saveClassroomBest(next);
      return next;
    });
  };

  switch (gameId) {
    case "flip":
      return (
        <QuizRunner
          key="flip"
          variant="flip"
          emoji="🃏"
          tag="翻牌問答"
          tagClass="sea"
          startTitle="翻牌問答"
          startDesc="題目藏在卡片背面，輕點翻開後開始 30 秒倒數；憑直覺選出正確答案，答錯會立刻顯示解析。"
          rules={["一輪 10 題", "翻牌後每題 30 秒", "答錯顯示解析", "全對三顆星"]}
          questions={decks.flip}
          bestStars={record?.stars}
          onBest={(r) => updateBest({ stars: r.stars, correct: r.correct, total: r.total })}
          onExit={exit}
        />
      );
    case "image":
      return (
        <QuizRunner
          key="image"
          variant="image"
          emoji="🖼️"
          tag="看圖選答"
          tagClass="green"
          startTitle="看圖選答"
          startDesc="用配對活動的 18 張實景照片考你：地標、世界奇景、台灣動物，看一張圖選出正確名稱。"
          rules={["一輪 18 題", "每題 30 秒", "圖片都來自圖片配對", "全對三顆星"]}
          questions={decks.image}
          bestStars={record?.stars}
          onBest={(r) => updateBest({ stars: r.stars, correct: r.correct, total: r.total })}
          onExit={exit}
        />
      );
    case "trap":
      return (
        <QuizRunner
          key="trap"
          variant="trap"
          emoji="🪤"
          tag="陷阱題挑戰"
          tagClass="red"
          startTitle="陷阱題挑戰"
          startDesc="精選 10 題往年最經典、最容易踩雷的題目：量詞、單位換算、時間順序、生活安全……答錯會告訴你陷阱在哪。"
          rules={["每輪隨機 10 題", "每題 30 秒", "答錯解析陷阱", "零失誤三顆星"]}
          questions={decks.trap}
          bestStars={record?.stars}
          onBest={(r) => updateBest({ stars: r.stars, correct: r.correct, total: r.total })}
          onExit={exit}
        />
      );
    case "bolt":
      return (
        <RushRunner
          key="bolt"
          variant="tf"
          emoji="⚡"
          tag="是非閃電"
          tagClass="gold"
          startTitle="是非閃電"
          startDesc="30 秒內連續判斷對錯，只有兩顆大鍵；看清楚敘述再下手，答錯會中斷連對。"
          rules={["30 秒無限連答", "答對 +10 分", "連對每連 +5", "答錯中斷連對"]}
          questions={decks.bolt}
          bestScore={record?.score}
          onBest={(r) => updateBest({ score: r.score, maxCombo: r.maxCombo, correct: r.correct, total: r.answered })}
          onExit={exit}
        />
      );
    case "rush":
      return (
        <RushRunner
          key="rush"
          variant="choice"
          emoji="⏱️"
          tag="限時接力"
          tagClass="orange"
          startTitle="限時接力"
          startDesc="30 秒內連續作答四選一，答對馬上換題；題目循環出現，挑戰你的最高分與最長連對。"
          rules={["30 秒無限連答", "答對 +10 分", "連對每連 +5", "答錯顯示正解"]}
          questions={decks.rush}
          bestScore={record?.score}
          onBest={(r) => updateBest({ score: r.score, maxCombo: r.maxCombo, correct: r.correct, total: r.answered })}
          onExit={exit}
        />
      );
    case "relay":
      return (
        <RelayMatch
          key="relay"
          bestStars={record?.stars}
          onBest={(r) => updateBest({ stars: r.stars, correct: r.correct, total: r.total })}
          onExit={exit}
        />
      );
    case "factor":
      return (
        <FactorGame
          key="factor"
          bestStars={record?.stars}
          onBest={(r) => updateBest({ stars: r.stars, correct: r.correct, total: r.total })}
          onExit={exit}
        />
      );
    default:
      return null;
  }
}
