import React, { useMemo } from "react";
import { Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCloudMode } from "@/game/cloudSync";
import "./HubPages.css";

/**
 * 每週聯盟賽：全站本週作答量排行榜（每週一 00:00 重啟）。
 * 排名依本週作答題數；正確率是次要資訊，作答數相同時參考。
 */
export default function LeagueArena() {
  const query = trpc.league.weekly.useQuery(undefined, { retry: false });
  const data = query.data;

  const myName = useMemo(() => {
    const mode = getCloudMode();
    return mode.mode === "cloud" && mode.name ? mode.name : "";
  }, []);

  const rankOf = useMemo(() => {
    const map = new Map<string, number>();
    (data?.standings ?? []).forEach((entry, index) => map.set(entry.name, index + 1));
    return map;
  }, [data]);

  const myRank = myName ? rankOf.get(myName) ?? null : null;

  return (
    <main className="hub-page" aria-labelledby="league-title">
      <header className="hub-header">
        <p className="hub-eyebrow">WEEKLY LEAGUE</p>
        <h1 className="hub-title" id="league-title">🏆 每週聯盟賽</h1>
        <p className="hub-sub">
          每週一重新計分，比誰這週答最多題。正確率高的探險家會出現在榜前。
          {data ? <> 目前第 {data.weekKey} 週。</> : null}
        </p>
      </header>

      {query.isLoading ? <p className="hub-empty" role="status">讀取本週榜單中…</p> : null}
      {data && data.standings.length === 0 ? (
        <p className="hub-empty" role="status">這週還沒有人留下作答紀錄。去答幾題，讓名字登上聯盟榜吧！</p>
      ) : null}
      {data && data.standings.length > 0 ? (
        <>
          {myName && myRank ? (
            <p className="league-my-rank" role="status">
              你目前是第 <strong>{myRank}</strong> 名，本週已答 <strong>{data.standings[myRank - 1]?.totalQuestions ?? 0}</strong> 題。
            </p>
          ) : myName ? (
            <p className="league-my-rank" role="status">你本週還沒有上榜紀錄——作答會自動計入聯盟賽。</p>
          ) : null}
          <ol className="league-list" aria-label="本週聯盟排行榜">
            {data.standings.map((entry, index) => {
              const isMe = myName === entry.name;
              return (
                <li key={entry.name} className={`league-row${isMe ? " is-me" : ""}${index < 3 ? " is-top" : ""}`}>
                  <span className="league-rank" aria-label={`第 ${index + 1} 名`}>
                    {index < 3 ? ["🥇", "🥈", "🥉"][index] : index + 1}
                  </span>
                  <span className="league-name">
                    {entry.name}
                    {isMe ? <small>（你）</small> : null}
                  </span>
                  <span className="league-answers">{entry.totalQuestions} 題</span>
                  <span className="league-accuracy">{entry.accuracy}% 正確</span>
                </li>
              );
            })}
          </ol>
          <p className="hub-sub league-footnote">
            <Trophy size={13} aria-hidden="true" /> 榜單只統計本週（臺北時間週一 00:00 起）的作答紀錄；教師帳號不參賽。
          </p>
        </>
      ) : null}
      {query.isError ? <p className="hub-empty" role="alert">讀取失敗，請確認網路後再試。</p> : null}
    </main>
  );
}
