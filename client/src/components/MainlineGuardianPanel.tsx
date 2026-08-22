import React from "react";
import { LockKeyhole, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_GUARDIANS, canChallengeGuardian, guardianCompletionRatio } from "@/game/mainlineFeatures";
import type { SubjectKey } from "@/game/expeditionContent";
import { getMainlineProgress } from "@/utils/storage";

type Props = {
  regularDefeatsBySubject: Partial<Record<SubjectKey, number>>;
  currentSubject: SubjectKey;
  onChallenge: (subject: SubjectKey) => void;
};

export default function MainlineGuardianPanel({ regularDefeatsBySubject, currentSubject, onChallenge }: Props) {
  const saved = getMainlineProgress();
  return <section className="mainline-guardian-panel" aria-label="主線區域最終守護者">
    <div className="mainline-heading"><div><span className="eyebrow">MAINLINE EXPEDITION · 區域守護者</span><h2>解放四座知識區域</h2><p>完成區域普通怪物試煉後，才能挑戰最終守護者。</p></div><Sparkles size={20} aria-hidden="true" /></div>
    <div className="mainline-guardian-grid">{AREA_GUARDIANS.map((guardian) => {
      const defeated = regularDefeatsBySubject[guardian.subject] ?? 0;
      const ready = canChallengeGuardian(guardian, defeated);
      const liberated = saved.liberatedSubjects.includes(guardian.subject);
      const percent = Math.round(guardianCompletionRatio(guardian, defeated) * 100);
      return <article key={guardian.id} className={`mainline-guardian-card ${guardian.subject === currentSubject ? "is-current" : ""} ${liberated ? "is-liberated" : ""}`}>
        <div className="mainline-guardian-art" aria-hidden="true">{liberated ? "✦" : guardian.emoji}</div><div className="mainline-guardian-copy"><span className="eyebrow">{guardian.areaLabel}</span><h3>{guardian.name}</h3><p>{liberated ? "區域已解放，金色航線持續閃耀。" : guardian.lore}</p></div>
        <div className="mainline-guardian-progress" aria-label={`${guardian.areaLabel}普通怪物進度 ${defeated} / ${guardian.requiredRegularDefeats}`}><div><span>普通怪物</span><b>{defeated} / {guardian.requiredRegularDefeats}</b></div><i><em style={{ width: `${percent}%` }} /></i></div>
        <div className="mainline-guardian-reward"><span>{guardian.reward.legendaryTitle}</span><small>造型：{guardian.reward.outfitLabel} · +{guardian.reward.gold} 金幣 · +{guardian.reward.exp} 經驗</small></div>
        <Button className="wide-action" variant={ready ? "default" : "outline"} disabled={!ready || liberated} onClick={() => onChallenge(guardian.subject)}>{liberated ? "區域已解放" : ready ? <><Swords size={16} /> 挑戰最終守護者</> : <><LockKeyhole size={15} /> 完成普通怪物試煉</>}</Button>
      </article>;
    })}</div>
  </section>;
}
