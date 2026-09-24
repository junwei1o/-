import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy, Timer, Clock, User, Medal, RefreshCw, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { cloudApi } from "@/game/cloudSync";
import { getPlayerName, isGuest } from "@/game/identity";
import "./HomeDashboard.css";

type BoardRecord = {
  id: number;
  name: string;
  subject: string;
  grade: number | null;
  difficulty: string | null;
  totalQuestions: number;
  correctCount: number;
  durationSec: number | null;
  createdAt: number;
};

type SortTab = "latest" | "accuracy" | "fastest";

const TABS: { id: SortTab; label: string; icon: React.ReactNode }[] = [
  { id: "latest", label: "最新答題", icon: <Clock size={15} aria-hidden="true" /> },
  { id: "accuracy", label: "正確率排行", icon: <Trophy size={15} aria-hidden="true" /> },
  { id: "fastest", label: "最快完成", icon: <Timer size={15} aria-hidden="true" /> },
];

/** 排行榜為求公平，至少答滿這個題數才列入正確率／速度排名。 */
const RANK_MIN_QUESTIONS = 5;

function formatDuration(sec: number | null | undefined): string {
  if (sec === null || sec === undefined) return "未記錄";
  if (sec < 60) return `${sec} 秒`;
  const minutes = Math.floor(sec / 60);
  const rest = sec % 60;
  return rest === 0 ? `${minutes} 分` : `${minutes} 分 ${rest} 秒`;
}

function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}/${month}/${day} ${hour}:${minute}`;
}

function accuracyRate(row: BoardRecord): number {
  return row.totalQuestions > 0 ? row.correctCount / row.totalQuestions : 0;
}

export default function AnswerLeaderboard() {
  const [, setLocation] = useLocation();
  const [records, setRecords] = useState<BoardRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<SortTab>("latest");

  const myName = useMemo(() => getPlayerName(), []);
  const guest = useMemo(() => isGuest(), []);

  const load = useCallback(() => {
    setFailed(false);
    cloudApi
      .examLeaderboard({ limit: 100 })
      .then((data) => setRecords(data.records as BoardRecord[]))
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (!records) return [];
    const list = [...records];
    if (tab === "latest") {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    if (tab === "accuracy") {
      return list
        .filter((row) => row.totalQuestions >= RANK_MIN_QUESTIONS)
        .sort((a, b) => {
          const rateGap = accuracyRate(b) - accuracyRate(a);
          if (rateGap !== 0) return rateGap;
          return b.correctCount - a.correctCount;
        });
    }
    // fastest：以「每題平均花費秒數」排序最公平，沒有計時的排除。
    return list
      .filter((row) => row.totalQuestions >= RANK_MIN_QUESTIONS && typeof row.durationSec === "number")
      .sort((a, b) => {
        const perA = (a.durationSec ?? 0) / a.totalQuestions;
        const perB = (b.durationSec ?? 0) / b.totalQuestions;
        if (perA !== perB) return perA - perB;
        return (a.durationSec ?? 0) - (b.durationSec ?? 0);
      });
  }, [records, tab]);

  return (
    <main className="answer-board-page">
      <section className="answer-board-hero">
        <p className="paper-exam-kicker"><Trophy size={16} aria-hidden="true" /> 跨艦隊排行</p>
        <h1>答題榜</h1>
        <p>
          每完成一場答題，這裡就會記下「是誰、什麼時候、用了多久、答對幾題」。不論是已取船名的航海家還是路過的遊客，都會自動列入，一起來挑戰榜首。
        </p>
      </section>

      <section className="answer-board-identity paper-exam-panel" aria-label="我的作答身分">
        <span className="answer-board-id-icon"><User size={17} aria-hidden="true" /></span>
        <p className="answer-board-id-text">
          你目前以「<strong>{myName}</strong>」的身分作答
          {guest ? <span className="answer-board-guest-tag">遊客</span> : <span className="answer-board-named-tag">已取船名</span>}
        </p>
        {guest && (
          <button type="button" className="answer-board-name-btn" onClick={() => setLocation("/")}>
            <Sparkles size={14} aria-hidden="true" /> 取一個專屬名字
          </button>
        )}
        <button type="button" className="answer-board-refresh" onClick={load} aria-label="重新整理榜單">
          <RefreshCw size={15} aria-hidden="true" />
        </button>
      </section>

      <section className="answer-board-panel paper-exam-panel" aria-label="答題榜列表">
        <div className="answer-board-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`answer-board-tab ${tab === item.id ? "is-active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        {tab !== "latest" && (
          <p className="answer-board-note">※ 為求公平，正確率與速度排行僅列答滿 {RANK_MIN_QUESTIONS} 題（含）以上的場次。</p>
        )}

        {failed ? (
          <p className="answer-board-message">榜單目前連不上，請按右上角重新整理再試一次。</p>
        ) : !records ? (
          <p className="answer-board-message">榜單載入中…</p>
        ) : rows.length === 0 ? (
          <p className="answer-board-message">
            {tab === "latest"
              ? "還沒有人完成答題。完成第一場，你就會是答題榜的開榜第一人。"
              : "這個排行還沒有符合門檻的場次，多答幾題再回來看看。"}
          </p>
        ) : (
          <div className="answer-board-table-wrap">
            <table className="answer-board-table">
              <thead>
                <tr>
                  <th scope="col">名次</th>
                  <th scope="col">是誰</th>
                  <th scope="col">科目</th>
                  <th scope="col">題數</th>
                  <th scope="col">答對</th>
                  <th scope="col">正確率</th>
                  <th scope="col">用了多久</th>
                  <th scope="col">答題時間</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isGuestRow = row.name.startsWith("遊客");
                  const rate = Math.round(accuracyRate(row) * 100);
                  return (
                    <tr key={row.id} className={row.name === myName ? "is-me" : ""}>
                      <td className="answer-board-rank">
                        <span className={`answer-board-rank-badge rank-${index + 1 <= 3 ? index + 1 : "other"}`}>
                          {index + 1 <= 3 ? <Medal size={14} aria-hidden="true" /> : null}
                          {index + 1}
                        </span>
                      </td>
                      <td className="answer-board-name">
                        {row.name}
                        {isGuestRow ? <span className="answer-board-guest-tag">遊客</span> : null}
                        {row.name === myName ? <span className="answer-board-me-tag">你</span> : null}
                      </td>
                      <td>{row.subject}</td>
                      <td>{row.totalQuestions}</td>
                      <td>{row.correctCount}</td>
                      <td>
                        <span className={`answer-board-rate rate-${rate >= 80 ? "high" : rate >= 60 ? "mid" : "low"}`}>{rate}％</span>
                      </td>
                      <td className="answer-board-duration">{formatDuration(row.durationSec)}</td>
                      <td className="answer-board-time">{formatClockTime(row.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <button className="home-dashboard-action answer-board-back" type="button" onClick={() => setLocation("/settings")}>
        <ArrowLeft size={16} aria-hidden="true" /> 返回設定
      </button>
    </main>
  );
}
