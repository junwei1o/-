import { Compass, Sparkles, UsersRound } from "lucide-react";
import { currentExpeditionObservation } from "@/game/expeditionObservations";
import type { RpgState } from "@/game/rpgTypes";

type Props = { state: RpgState };

export default function ExpeditionObservationCard({ state }: Props) {
  const observation = currentExpeditionObservation(state);
  const unlockLabel = observation.unlockTarget === 0
    ? "起始觀測地已開放"
    : `答對 ${observation.correctAnswers} / ${observation.unlockTarget} 題`;

  return <section className="academy-observation-card" aria-labelledby="academy-observation-title">
    <div className="academy-observation-head">
      <div><span className="academy-kicker">FIELD NOTE · NEXT CLUE</span><h2 id="academy-observation-title">{observation.habitatName}</h2></div>
      <span className={`academy-observation-status ${observation.rareEligible ? "is-ready" : ""}`}>{observation.rareEligible ? "稀有訊號就緒" : observation.unlocked ? "可繼續觀測" : "等待解鎖"}</span>
    </div>
    <p>{observation.regionLabel}的目前觀測回顧，只根據這台裝置已保存的答題與夥伴資料。</p>
    <div className="academy-observation-meter" aria-label={`${observation.habitatName}解鎖進度 ${observation.progressPercent}%`}><i style={{ width: `${observation.progressPercent}%` }} /></div>
    <div className="academy-observation-facts">
      <span><Compass size={15} aria-hidden="true" /><b>主線</b>{unlockLabel}</span>
      <span><UsersRound size={15} aria-hidden="true" /><b>同行</b>{observation.companions} 位夥伴紀錄</span>
      <span><Sparkles size={15} aria-hidden="true" /><b>訊號</b>{observation.rareProgressLabel}</span>
    </div>
    <small>{observation.nextStep}</small>
  </section>;
}
