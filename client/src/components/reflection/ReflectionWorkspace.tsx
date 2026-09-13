import React, { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { getPlayerName } from "@/utils/storage";
import { loadUserPreferences } from "@/game/adaptiveLearning";
import { loadCompanionConfig } from "@/game/companionBrain";
import { reflectionWorkspace, toRuleInput } from "@/game/reflectionWorkspace";
import { useReflectionWorkspace } from "./useReflectionWorkspace";
import { StackedCard } from "./StackedCard";
import { ReflectionCardBody } from "./ReflectionCardBody";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import "./reflectionWorkspace.css";

/**
 * 深度伴讀可堆疊卡片工作台（單一實例，掛在答題頁、以 portal 覆蓋到 body）。
 * 多張卡片對應多個題目的伴讀對話，可拖拽堆疊、縮放、最小化；主題與快照由工具列控制。
 * LLM 請求全部在這裡走同域 tRPC，store 只負責排程與兜底。
 */
export function ReflectionWorkspace() {
  const ws = useReflectionWorkspace();
  const reflect = trpc.aiCompanion.reflect.useMutation();
  // 記錄已派發的 outbox nonce，避免 StrictMode 雙 effect 重複發送。
  const handledNoncesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    ws.outbox.forEach((item) => {
      if (handledNoncesRef.current.has(item.nonce)) return;
      handledNoncesRef.current.add(item.nonce);
      const card = ws.cards.find((candidate) => candidate.id === item.cardId);
      if (!card) return;
      const context = toRuleInput(card, item.turn);
      void (async () => {
        const config = loadCompanionConfig();
        const preferences = loadUserPreferences();
        try {
          const result = await reflect.mutateAsync({
            studentName: getPlayerName() || undefined,
            proxy: config
              ? { base: config.base, key: config.key, model: config.model || undefined }
              : null,
            question: context.question,
            options: context.options,
            selectedAnswer: context.selectedAnswer,
            correctAnswer: context.correctAnswer,
            correct: context.correct,
            subject: context.subject,
            learningTopic: context.learningTopic,
            grade: preferences.gradeLevel,
            turn: item.turn,
          });
          reflectionWorkspace.resolveTurn(item.nonce, item.cardId, result.text, result.source);
        } catch (error) {
          reflectionWorkspace.rejectTurn(
            item.nonce,
            item.cardId,
            error instanceof Error ? error.message : String(error),
          );
        }
      })();
    });
    // outbox 每次變更都是新陣列參考；cards 一併納入以確保開卡當下找得到卡片。
  }, [ws.outbox, ws.cards]);

  // 離開答題頁（元件卸載）清空對話卡片；主題偏好與快照保留。
  useEffect(() => () => reflectionWorkspace.clearCards(), []);

  if (typeof document === "undefined") return null;

  const rootStyle = { "--rc-accent": ws.customAccent } as CSSProperties;

  return createPortal(
    <div className="rc-workspace" data-theme={ws.theme} style={rootStyle}>
      <WorkspaceToolbar />
      {ws.cards.map((card) => (
        <StackedCard
          key={card.id}
          card={card}
          theme={ws.theme}
          onFocus={() => reflectionWorkspace.focusCard(card.id)}
          onClose={() => reflectionWorkspace.closeCard(card.id)}
          onToggleMinimize={() => reflectionWorkspace.toggleMinimize(card.id)}
          onMove={(x, y) => reflectionWorkspace.moveCard(card.id, x, y)}
          onResize={(w, h) => reflectionWorkspace.resizeCard(card.id, w, h)}
        >
          <ReflectionCardBody card={card} />
        </StackedCard>
      ))}
    </div>,
    document.body,
  );
}

export default ReflectionWorkspace;
