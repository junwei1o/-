import React, { useEffect, useState } from "react";
import { Medal, RefreshCw } from "lucide-react";
import { cloudApi } from "@/game/cloudSync";
import { getPlayerName } from "@/game/identity";
import { formatDurationMmSs, formatFinishTime, sortTriBoard, type TriBoardRow } from "@/lib/triBoard";
import type { scoreTriAxisPaper } from "@/lib/triAxisPaper";

type TriResultBoardProps = {
  score: NonNullable<ReturnType<typeof scoreTriAxisPaper>>;
  seed: number;
};

type BoardState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; rows: ReturnType<typeof sortTriBoard> };

/**
 * 三軸結算榜：作答完成的當下自動寫入（由 TriAxisPaper 的結算 effect
 * 經 recordExamCloud 上報），這裡只負責讀取＋即時顯示。
 *
 * - 只顯示 subject === "三軸混編試卷" 的紀錄。
 * - 排序：分數高→低，同分耗時短優先（見 triBoard.sortTriBoard）。
 * - 欄位：名次／姓名／得分／試卷時間（mm:ss）／完成時間。
 * - 上榜者（本次 seed 的 sessionKey 對應紀錄）高亮。
 */
export function TriResultBoard({ score, seed }: TriResultBoardProps) {
  const [state, setState] = useState<BoardState>({ kind: "loading" });
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    cloudApi
      .examLeaderboard({ limit: 100 })
      .then((data) => {
        if (cancelled) return;
        const rows = (data.records as TriBoardRow[]).filter(
          (row) => row.subject === "三軸混編試卷",
        );
        setState({ kind: "ready", rows: sortTriBoard(rows) });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [seed, score, reloadNonce]);

  const myName = getPlayerName();

  return (
    <section className="tri-board" aria-label="三軸試卷排行榜">
      <div className="tri-board-head">
        <h3>本次排行榜</h3>
        <button
          type="button"
          className="tri-board-refresh"
          onClick={() => setReloadNonce((n) => n + 1)}
          aria-label="重新整理排行榜"
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      {state.kind === "loading" ? (
        <p className="tri-board-message" role="status">榜單載入中…</p>
      ) : state.kind === "error" ? (
        <p className="tri-board-message" role="alert">
          榜單目前連不上，請按右上角重新整理再試一次。
        </p>
      ) : state.rows.length === 0 ? (
        <p className="tri-board-message" role="status">
          榜單還沒有三軸試卷的紀錄，你就是開榜第一人。
        </p>
      ) : (
        <div className="tri-board-table-wrap">
          <table className="tri-board-table">
            <thead>
              <tr>
                <th scope="col">名次</th>
                <th scope="col">姓名</th>
                <th scope="col">得分</th>
                <th scope="col">試卷時間</th>
                <th scope="col">完成時間</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.slice(0, 20).map((row) => (
                <tr key={row.id} className={row.name === myName ? "is-me" : ""}>
                  <td>
                    <span className={`tri-board-rank rank-${row.rank <= 3 ? row.rank : "other"}`}>
                      {row.rank <= 3 ? <Medal size={13} aria-hidden="true" /> : null}
                      {row.rank}
                    </span>
                    {row.name === myName ? <span className="tri-board-me-tag">你</span> : null}
                  </td>
                  <td>{row.name}</td>
                  <td>
                    {row.correctCount} / {row.totalQuestions}
                  </td>
                  <td>{formatDurationMmSs(row.durationSec)}</td>
                  <td>{formatFinishTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
