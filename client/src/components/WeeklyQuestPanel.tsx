import { Check, Coins, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeeklyQuest, WeeklyQuestProgress } from "@/game/mainlineFeatures";
import { getWeeklyQuestProgress, isWeeklyQuestComplete } from "@/game/mainlineFeatures";
import type { StoredWeeklyQuest } from "@/utils/storage";

type Props = {
  quests: WeeklyQuest[];
  progress: WeeklyQuestProgress;
  stored: StoredWeeklyQuest[];
  onClaim: (quest: WeeklyQuest) => void;
};

export default function WeeklyQuestPanel({ quests, progress, stored, onClaim }: Props) {
  return (
    <section className="mainline-card weekly-quest-panel" aria-labelledby="weekly-quest-title">
      <div className="mainline-card-heading">
        <div>
          <p className="eyebrow-label"><Target size={14} aria-hidden="true" /> 本週主線任務</p>
          <h2 id="weekly-quest-title">把學習航線推進到下一章</h2>
        </div>
        <span className="mainline-status-badge"><Sparkles size={14} aria-hidden="true" /> 每週更新</span>
      </div>
      <div className="weekly-quest-list">
        {quests.map((quest) => {
          const current = Math.min(quest.target, Math.max(0, getWeeklyQuestProgress(quest, progress)));
          const complete = isWeeklyQuestComplete(quest, progress);
          const saved = stored.find((item) => item.id === quest.id && item.weekKey === quest.weekKey);
          const claimed = saved?.claimed === true;
          const percent = quest.target > 0 ? Math.round((current / quest.target) * 100) : 0;
          return (
            <article className={`weekly-quest-item${complete ? " is-complete" : ""}`} key={quest.id}>
              <div className="weekly-quest-copy">
                <div className="weekly-quest-title-row">
                  <h3>{quest.title}</h3>
                  {complete && <span className="weekly-quest-complete"><Check size={13} aria-hidden="true" /> 已完成</span>}
                </div>
                <p>{quest.description}</p>
              </div>
              <div className="weekly-quest-progress" aria-label={`${quest.title} 進度 ${current} / ${quest.target}`}>
                <div className="weekly-quest-progress-track"><span style={{ width: `${percent}%` }} /></div>
                <span>{current} / {quest.target}</span>
              </div>
              <div className="weekly-quest-reward"><Coins size={14} aria-hidden="true" /> 金幣 +{quest.reward.gold} · 經驗 +{quest.reward.exp}</div>
              {complete && !claimed && <Button size="sm" onClick={() => onClaim(quest)} aria-label={`領取${quest.title}獎勵`}>領取獎勵</Button>}
              {claimed && <span className="weekly-quest-claimed">已領取</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
