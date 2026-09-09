import { useCallback, useState } from "react";
import { Link } from "wouter";
import { Coins, Zap, CalendarCheck, Swords, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getDailySignIn, getPlayerData } from "@/utils/storage";
import { loadRpgState } from "@/game/rpgStorage";
import {
  buyShopItem,
  claimTaskReward,
  claimWeeklyBossReward,
  getDailyTasks,
  getShopItems,
  getTodayStats,
  getWeeklyBoss,
  hasLuckyCharmPending,
  localDayKey,
  localWeekKey,
  performDailySignIn,
  type DailyTask,
  type ShopItem,
} from "@/game/dailyCamp";
import "./DailyCamp.css";

export default function DailyCamp() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  // 所有資料每次渲染都從 storage 重讀，refreshKey 用於領獎後強制重繪。
  void refreshKey;
  const player = getPlayerData();
  const rpg = loadRpgState();
  const dayKey = localDayKey();
  const weekKey = localWeekKey();
  const tasks = getDailyTasks();
  const shopItems = getShopItems();
  const boss = getWeeklyBoss();
  const stats = getTodayStats();
  const charmPending = hasLuckyCharmPending();

  const handleSignIn = () => {
    const result = performDailySignIn();
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.message(result.message);
    }
    refresh();
  };

  const handleClaimTask = (task: DailyTask) => {
    const result = claimTaskReward(task.id);
    if (result.ok) {
      toast.success(`${task.title}：${result.message}`);
    } else {
      toast.message(result.message);
    }
    refresh();
  };

  const handleBuy = (item: ShopItem) => {
    const result = buyShopItem(item.id);
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.message(result.message);
    }
    refresh();
  };

  const handleClaimBoss = () => {
    const result = claimWeeklyBossReward();
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.message(result.message);
    }
    refresh();
  };

  const doneCount = tasks.filter((task) => task.progress >= task.target).length;

  return (
    <main className="daily-camp" aria-label="每日營地">
      <header className="daily-camp-header">
        <p className="daily-camp-eyebrow">DAILY CAMP · {dayKey} · {weekKey}</p>
        <h1>每日營地</h1>
        <p>每天回來簽到、解任務賺金幣，再到商店幫船員補給，出發挑戰每週王！</p>
        <div className="daily-camp-wallet" aria-label="我的資源">
          <span className="daily-camp-wallet-item"><Coins size={16} aria-hidden="true" /> {player.gold} 金幣</span>
          <span className="daily-camp-wallet-item"><Zap size={16} aria-hidden="true" /> {rpg.energy} 體力</span>
          {charmPending ? <span className="daily-camp-wallet-item is-charm"><Sparkles size={16} aria-hidden="true" /> 護身符待戰鬥</span> : null}
        </div>
      </header>

      <section className="daily-camp-signin" aria-labelledby="daily-camp-signin-title">
        <div>
          <h2 id="daily-camp-signin-title"><CalendarCheck size={20} aria-hidden="true" /> 每日簽到</h2>
          <p>已連續簽到 <strong>{getDailySignIn().streak}</strong> 天。今天{stats.signedIn ? "已經簽到，記得去領任務獎勵" : "還沒簽到，快打卡"}。</p>
        </div>
        <button
          type="button"
          className="daily-camp-primary-action"
          onClick={handleSignIn}
          disabled={stats.signedIn}
        >
          {stats.signedIn ? "今天已簽到" : "立即簽到"}
        </button>
      </section>

      <section className="daily-camp-section" aria-labelledby="daily-camp-tasks-title">
        <div className="daily-camp-section-heading">
          <h2 id="daily-camp-tasks-title">每日任務</h2>
          <span>{doneCount} / {tasks.length} 完成</span>
        </div>
        <ul className="daily-camp-task-list">
          {tasks.map((task) => {
            const complete = task.progress >= task.target;
            return (
              <li key={task.id} className={`daily-camp-task${complete ? " is-complete" : ""}${task.claimed ? " is-claimed" : ""}`}>
                <span className="daily-camp-task-icon" aria-hidden="true">{task.icon}</span>
                <div className="daily-camp-task-copy">
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                  <div className="daily-camp-task-progress" aria-label={`進度 ${task.progress} / ${task.target}`}>
                    <span style={{ width: `${Math.round((task.progress / task.target) * 100)}%` }} />
                  </div>
                  <small>{task.progress} / {task.target} · 獎勵 {task.rewardGold} 金幣</small>
                </div>
                <button
                  type="button"
                  className="daily-camp-claim"
                  onClick={() => handleClaimTask(task)}
                  disabled={!complete || task.claimed}
                >
                  {task.claimed ? "已領取" : complete ? "領獎勵" : "未完成"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="daily-camp-section daily-camp-boss" aria-labelledby="daily-camp-boss-title">
        <div className="daily-camp-section-heading">
          <h2 id="daily-camp-boss-title"><Swords size={20} aria-hidden="true" /> 每週王：風暴海怪</h2>
          <span>{boss.weekKey}</span>
        </div>
        <p>本週答對 {boss.target} 題就能擊敗風暴海怪。到 <Link href="/battle">答題戰鬥</Link> 或 <Link href="/practice">課綱練習</Link> 作答都算數！</p>
        <div className="daily-camp-boss-bar" aria-label={`每週王進度 ${boss.progress} / ${boss.target}`}>
          <span style={{ width: `${Math.round((boss.progress / boss.target) * 100)}%` }} className={boss.defeated ? "is-defeated" : ""} />
        </div>
        <div className="daily-camp-boss-footer">
          <small>{boss.defeated ? "海怪已被擊敗！" : `海怪血量剩 ${boss.target - boss.progress} 題`} · 擊敗獎勵 40 金幣</small>
          <button
            type="button"
            className="daily-camp-primary-action"
            onClick={handleClaimBoss}
            disabled={!boss.defeated || boss.claimed}
          >
            {boss.claimed ? "本週已領賞" : boss.defeated ? "領取 40 金幣" : "繼續努力"}
          </button>
        </div>
      </section>

      <section className="daily-camp-section" aria-labelledby="daily-camp-shop-title">
        <div className="daily-camp-section-heading">
          <h2 id="daily-camp-shop-title">金幣商店</h2>
          <span><Coins size={15} aria-hidden="true" /> {player.gold} 金幣</span>
        </div>
        <ul className="daily-camp-shop-list">
          {shopItems.map((item) => (
            <li key={item.id} className="daily-camp-shop-item">
              <span className="daily-camp-task-icon" aria-hidden="true">{item.icon}</span>
              <div className="daily-camp-task-copy">
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <small>{item.priceGold} 金幣 · 今日已買 {item.boughtToday} / {item.dailyLimit}</small>
              </div>
              <button
                type="button"
                className="daily-camp-buy"
                onClick={() => handleBuy(item)}
                disabled={item.soldOut || player.gold < item.priceGold}
              >
                {item.soldOut ? "賣完了" : player.gold < item.priceGold ? "金幣不足" : "購買"}
              </button>
            </li>
          ))}
        </ul>
        <p className="daily-camp-shop-note">體力用於答題戰鬥出戰；護身符會在下次進入答題戰鬥時自動生效。</p>
      </section>
    </main>
  );
}
