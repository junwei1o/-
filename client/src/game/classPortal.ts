/**
 * 教師作業認領狀態。
 * 學生在「我的教室」點開始作業後寫入本機，作答頁完成試卷時讀出並回報成績，
 * 讓「認領 → 作答 → 回報」能跨頁完成（學生可能中途切頁）。
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

const PENDING_KEY = "xue-pending-assignment-v1";

let client: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;
function getClient() {
  if (!client) {
    client = createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
    });
  }
  return client;
}

export interface PendingAssignment {
  assignmentId: number;
  studentName: string;
  subject: string;
  grade: number;
  questionCount: number;
}

export function setPendingAssignment(pending: PendingAssignment): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // 無痕模式或儲存額滿時靜默略過，不阻斷作答。
  }
}

export function readPendingAssignment(): PendingAssignment | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingAssignment;
    if (typeof parsed?.assignmentId !== "number" || !parsed?.studentName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingAssignment(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // 同上，靜默略過。
  }
}

/**
 * 回報作業成績給老師。網路失敗時靜默（不阻斷作答、不打擾學生），
 * 並保留認領狀態讓下次作答再補報。
 */
export async function submitAssignmentScore(input: {
  assignmentId: number;
  studentName: string;
  correctCount: number;
  totalQuestions: number;
}): Promise<boolean> {
  try {
    const result = await getClient().teacher.submitAssignment.mutate(input);
    if (result?.ok) {
      clearPendingAssignment();
      return true;
    }
  } catch {
    // 離線或伺服器忙碌：留著 pending，下次完成試卷時再補報。
  }
  return false;
}
