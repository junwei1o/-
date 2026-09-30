import React from "react";
import { useLocation } from "wouter";
import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import type { TodayTask } from "@/lib/studentDashboard";

/**
 * 今日任務卡：依 kind 換圖示與導向路由。
 * - wrong-book → /wrong-answers（既有錯題本頁）
 * - 其餘       → /practice（PaperExam；確認過它只吃 reviewTopic / wrongOnly /
 *   reviewDue / randomQuestionId / randomBonus，不接受 subject / difficulty，故不額外帶 query）
 * reliability === "building" 的卡：明顯標「建置中」且開始鈕 disabled。
 */

const KIND_META: Record<TodayTask["kind"], { label: string; Icon: React.ElementType }> = {
  "wrong-book": { label: "錯題複習", Icon: RotateCcw },
  "subject-practice": { label: "科目練習", Icon: BookOpen },
  knowledge: { label: "知識點加強", Icon: Lightbulb },
  challenge: { label: "自我挑戰", Icon: Sparkles },
};

function taskHref(task: TodayTask): string {
  return task.kind === "wrong-book" ? "/wrong-answers" : "/practice";
}

export default function TodayTasks({ tasks }: { tasks: readonly TodayTask[] }) {
  const [, setLocation] = useLocation();

  if (tasks.length === 0) {
    return (
      <p className="sd-empty-note">今天的任務都完成囉，好好休息一下吧！</p>
    );
  }

  return (
    <ul className="sd-task-list">
      {tasks.map((task) => {
        const { label, Icon } = KIND_META[task.kind];
        const building = task.reliability === "building";
        const title = task.knowledge ?? label;
        const href = taskHref(task);

        return (
          <li key={task.id} className="sd-task-card">
            <span className="sd-task-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <div className="sd-task-body">
              <div className="sd-task-title-row">
                <h3 className="sd-task-title">{title}</h3>
                <span className="sd-tag">{label}</span>
                {task.completed && (
                  <span className="sd-tag sd-tag--done" title="已完成">
                    <CheckCircle2 size={13} aria-hidden="true" /> 已完成
                  </span>
                )}
                {building && (
                  <span className="sd-tag sd-tag--building" title="資料建置中">
                    建置中
                  </span>
                )}
              </div>
              <p className="sd-task-reason">{task.reason}</p>
              <p className="sd-task-meta">
                <span className="sd-task-count">{task.questionCount} 題</span>
                <span aria-hidden="true">・</span>
                <span className="sd-task-time">
                  <Timer size={12} aria-hidden="true" /> 約 {task.estimatedMinutes} 分鐘
                </span>
                {task.reward && (
                  <>
                    <span aria-hidden="true">・</span>
                    <span className="sd-task-reward">獎勵：{task.reward}</span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className="app-btn app-btn--primary sd-task-cta"
              disabled={task.completed || building}
              onClick={() => setLocation(href)}
            >
              {task.completed ? "已完成" : building ? "建置中" : "開始"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
