import React from "react";

// 結構對齊凍結契約 @/lib/studentDashboard 的 StudentDashboardData.strengths / focusAreas
type StrengthItem = {
  knowledge: string;
  confidence: number;
  attempts: number;
  status: "mastered" | "stable";
  reliable: boolean;
  message: string;
};
type FocusItem = {
  knowledge: string;
  confidence: number | null;
  attempts: number;
  status: "unstable" | "blindspot";
  reliable: boolean;
  message: string;
  hint: string;
};

/**
 * 我的強項 ＋ 需要加油。
 * 注意：措辭一律正向鼓勵——「這塊還可以再加油」，嚴禁「你很差／你不會」等負面字眼。
 * confidence 為 null（累積中）或 reliable === false 時標「建置中」。
 */
export default function StrengthsFocus({
  strengths,
  focusAreas,
}: {
  strengths: readonly StrengthItem[];
  focusAreas: readonly FocusItem[];
}) {
  return (
    <div className="sd-two-col">
      <section className="app-card sd-col" aria-labelledby="sd-strengths-title">
        <h2 className="sd-section-title" id="sd-strengths-title">我的強項</h2>
        {strengths.length === 0 ? (
          <p className="sd-empty-note">多答幾題，就會發現自己的拿手領域囉！</p>
        ) : (
          <ul className="sd-point-list">
            {strengths.map((s) => (
              <li key={s.knowledge} className="sd-point-item">
                <div className="sd-point-head">
                  <span className="sd-point-name">{s.knowledge}</span>
                  <span className="sd-chip sd-chip--moss">信心 {Math.round(s.confidence)}%</span>
                  {!s.reliable && <span className="sd-tag sd-tag--building">建置中</span>}
                </div>
                <p className="sd-point-msg">{s.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="app-card sd-col" aria-labelledby="sd-focus-title">
        <h2 className="sd-section-title" id="sd-focus-title">需要加油</h2>
        {focusAreas.length === 0 ? (
          <p className="sd-empty-note">目前每一塊都表現得很穩定，繼續保持！</p>
        ) : (
          <ul className="sd-point-list">
            {focusAreas.map((f) => {
              const building = f.confidence == null || !f.reliable;
              return (
                <li key={f.knowledge} className="sd-point-item">
                  <div className="sd-point-head">
                    <span className="sd-point-name">{f.knowledge}</span>
                    {f.confidence != null && (
                      <span className="sd-chip sd-chip--yellow">信心 {Math.round(f.confidence)}%</span>
                    )}
                    {building && <span className="sd-tag sd-tag--building">建置中</span>}
                  </div>
                  <p className="sd-point-msg">{f.message}</p>
                  {f.hint && <p className="sd-point-hint">小提示：{f.hint}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
