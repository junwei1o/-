import React, { useMemo, useState } from "react";
import { Trophy, Medal, Gift, Clock, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCloudMode } from "@/game/cloudSync";
import { addCardToCollection } from "@/game/cardCollection";
import "./HubPages.css";
import "./LeagueArena.css";

type GroupType = "bronze" | "silver" | "gold" | "diamond";

const GROUP_META: Record<GroupType, { label: string; emoji: string }> = {
  bronze: { label: "青銅組", emoji: "🟤" },
  silver: { label: "白銀組", emoji: "⚪" },
  gold: { label: "黃金組", emoji: "🟡" },
  diamond: { label: "鑽石組", emoji: "💎" },
};

function formatRemaining(endAt: number): string {
  const diff = Math.max(0, endAt - Date.now());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days} 天 ${hours} 小時`;
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours} 小時 ${minutes} 分`;
  return `${Math.max(0, Math.floor(diff / 60000))} 分`;
}

function rankRewardHint(rank: number, total: number): { coins: number; badge: string | null } {
  const rate = rank / total;
  if (rate <= 0.1) return { coins: 500, badge: "組別限定徽章" };
  if (rate <= 0.25) return { coins: 300, badge: null };
  if (rate <= 0.5) return { coins: 150, badge: null };
  return { coins: 50, badge: null };
}

export default function LeagueArena() {
  const myName = useMemo(() => {
    const mode = getCloudMode();
    return mode.mode === "cloud" && mode.name ? mode.name : "";
  }, []);

  const [tab, setTab] = useState<"group" | "all" | "reward">("group");

  const seasonQuery = trpc.league.season.useQuery({ name: myName || undefined }, { retry: false });
  const weeklyQuery = trpc.league.weekly.useQuery(undefined, { retry: false });
  const rewardsQuery = trpc.league.myRewards.useQuery({ name: myName }, { retry: false, enabled: myName.length > 0 });
  const claimMutation = trpc.league.claimReward.useMutation({
    onSuccess: () => rewardsQuery.refetch(),
  });

  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const season = seasonQuery.data?.season;
  const myGroup = (seasonQuery.data?.myGroup as GroupType | null) ?? null;
  const myRank = seasonQuery.data?.myRank ?? null;
  const groupStandings = seasonQuery.data?.groupStandings ?? [];
  const weeklyStandings = weeklyQuery.data?.standings ?? [];

  const myWeeklyRank = useMemo(() => {
    const idx = weeklyStandings.findIndex((entry) => entry.name === myName);
    return idx >= 0 ? idx + 1 : null;
  }, [weeklyStandings, myName]);

  const handleClaim = async (rewardType: "participate" | "rank") => {
    if (!myName) return;
    setClaimNotice(null);
    try {
      const result = await claimMutation.mutateAsync({ name: myName, rewardType });
      // 排名獎前 10%：限定卡自動加入收藏（badge 如 league-gold-top10 → 卡 league-gold）。
      if (rewardType === "rank" && result.badge) {
        const groupKey = result.badge.replace("-top10", "");
        addCardToCollection(groupKey);
      }
      setClaimNotice(
        rewardType === "participate"
          ? `已領取參與獎：${result.coins} 金幣${result.badge ? `＋${result.title}` : ""}！`
          : `已領取排名獎（第 ${result.rank} 名）：${result.coins} 金幣${result.badge ? "＋組別限定卡已放入收藏" : ""}！`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "領取失敗，請稍後再試。";
      setClaimNotice(`⚠️ ${message}`);
    }
  };

  return (
    <main className="hub-page" aria-labelledby="league-title">
      <header className="illustration-hero" style={{ "--hero": "url(/assets/illustration/trophy.webp)" } as React.CSSProperties}>
        <div className="illustration-hero-copy">
          <p className="hub-eyebrow">LEAGUE SEASONS</p>
          <h1 className="hub-title" id="league-title">🏆 聯盟賽</h1>
          <p className="hub-sub">
            每 7 天一季。依賽季作答量分組競賽，季末前 30% 晉級、後 30% 降級；青銅不降、鑽石不升。
          </p>
        </div>
      </header>

      {seasonQuery.isLoading ? <p className="hub-empty" role="status">讀取賽季中…</p> : null}

      {season ? (
        <section className="league-season-card" aria-label="當前賽季">
          <div className="league-season-row">
            <div>
              <p className="league-season-eyebrow">SEASON {season.seasonNumber}</p>
              <h2>第 {season.seasonNumber} 賽季</h2>
              <p className="league-season-remain">
                <Clock size={14} aria-hidden="true" /> 剩餘 {formatRemaining(season.endAt)}
              </p>
            </div>
            <div className="league-my-group">
              {myGroup ? (
                <>
                  <span className={`league-group-chip league-group-${myGroup}`}>
                    {GROUP_META[myGroup].emoji} {GROUP_META[myGroup].label}
                  </span>
                  {myRank ? (
                    <p className="league-my-rank">
                      組內第 <strong>{myRank}</strong> 名
                    </p>
                  ) : (
                    <p className="league-my-rank">本季尚未留下作答紀錄</p>
                  )}
                </>
              ) : (
                <p className="league-my-rank">{myName ? "讀取分組中…" : "登入船名後會自動分組"}</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <nav className="league-tabs" aria-label="聯盟賽分頁">
        <button type="button" className={tab === "group" ? "is-active" : ""} onClick={() => setTab("group")}>
          我的組別榜
        </button>
        <button type="button" className={tab === "all" ? "is-active" : ""} onClick={() => setTab("all")}>
          全站榜
        </button>
        <button type="button" className={tab === "reward" ? "is-active" : ""} onClick={() => setTab("reward")}>
          賽季獎勵
        </button>
      </nav>

      {tab === "group" ? (
        <section aria-label="我的組別排行榜">
          {!myGroup ? (
            <p className="hub-empty" role="status">{myName ? "分組讀取中…" : "輸入船名後即可查看你的組別與組內排名。"}</p>
          ) : groupStandings.length === 0 ? (
            <p className="hub-empty" role="status">你的組別（{GROUP_META[myGroup].label}）目前還沒有上榜紀錄。去答幾題吧！</p>
          ) : (
            <ol className="league-list" aria-label={`${GROUP_META[myGroup].label}排行榜`}>
              {groupStandings.map((entry, index) => {
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
          )}
        </section>
      ) : null}

      {tab === "all" ? (
        <section aria-label="全站排行榜">
          {weeklyQuery.isLoading ? <p className="hub-empty" role="status">讀取全站榜單中…</p> : null}
          {weeklyStandings.length === 0 ? (
            <p className="hub-empty" role="status">這週還沒有人留下作答紀錄。去答幾題，讓名字登上聯盟榜吧！</p>
          ) : (
            <>
              {myName && myWeeklyRank ? (
                <p className="league-my-rank" role="status">
                  你目前是全站第 <strong>{myWeeklyRank}</strong> 名。
                </p>
              ) : null}
              <ol className="league-list" aria-label="全站排行榜">
                {weeklyStandings.map((entry, index) => {
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
            </>
          )}
        </section>
      ) : null}

      {tab === "reward" ? (
        <section className="league-rewards" aria-label="賽季獎勵">
          {!myName ? (
            <p className="hub-empty" role="status">登入船名後才能領取賽季獎勵。</p>
          ) : rewardsQuery.isLoading ? (
            <p className="hub-empty" role="status">讀取獎勵狀態中…</p>
          ) : (
            <>
              {claimNotice ? <p className="league-claim-notice" role="status">{claimNotice}</p> : null}

              <div className="league-reward-row">
                <div className="league-reward-card">
                  <div className="league-reward-icon"><Gift size={22} aria-hidden="true" /></div>
                  <div className="league-reward-body">
                    <h3>賽季參與獎</h3>
                    <p>本季完成至少 <strong>5 題</strong> 即可領取 <strong>100 金幣</strong>。</p>
                    {rewardsQuery.data?.participateClaimed ? (
                      <span className="league-reward-state is-claimed">✓ 已領取</span>
                    ) : (
                      <button type="button" className="league-claim-btn" onClick={() => handleClaim("participate")} disabled={claimMutation.isPending}>
                        {claimMutation.isPending ? "領取中…" : "領取參與獎"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="league-reward-card">
                  <div className="league-reward-icon"><Medal size={22} aria-hidden="true" /></div>
                  <div className="league-reward-body">
                    <h3>賽季排名獎</h3>
                    {myRank && groupStandings.length > 0 ? (
                      <>
                        <p>
                          你目前組內第 <strong>{myRank}</strong> 名；此獎依季末組內名次發放：
                          <strong>{rankRewardHint(myRank, groupStandings.length).coins} 金幣</strong>
                          {rankRewardHint(myRank, groupStandings.length).badge ? `＋${rankRewardHint(myRank, groupStandings.length).badge}` : ""}
                          （前 10% 500、前 25% 300、前 50% 150、其餘 50）。
                        </p>
                        {rewardsQuery.data?.rankClaimed ? (
                          <span className="league-reward-state is-claimed">✓ 已領取</span>
                        ) : (
                          <button type="button" className="league-claim-btn" onClick={() => handleClaim("rank")} disabled={claimMutation.isPending}>
                            {claimMutation.isPending ? "領取中…" : "領取排名獎"}
                          </button>
                        )}
                      </>
                    ) : (
                      <p>完成作答並進入組內榜單後，即可依名次領取金幣與限定徽章（前 10% 500 金幣＋組別限定徽章、前 25% 300、前 50% 150、其餘 50）。</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="league-promotion-hint">
                <ChevronRight size={15} aria-hidden="true" />
                季末結算：每組前 30% 晉升一級、後 30% 降級；青銅組不降級、鑽石組不晉升。下一季從新組別重新開始計分。
              </div>
            </>
          )}
        </section>
      ) : null}

      <p className="hub-sub league-footnote">
        <Trophy size={13} aria-hidden="true" /> 賽季與每週一 00:00（臺北時間）對齊；榜單只統計賽季內的作答紀錄，教師帳號不參賽。
      </p>
    </main>
  );
}
