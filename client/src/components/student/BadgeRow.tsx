import React from "react";
import { Lock } from "lucide-react";
import type { DashboardBadge } from "@/lib/studentDashboard";

/**
 * 我的徽章牆：unlocked 顯示 icon＋名稱；locked 顯示 🔒＋達成條件。
 * 僅展示自己取得的徽章，不與其他同學比較。
 */
export default function BadgeRow({ badges }: { badges: readonly DashboardBadge[] }) {
  if (badges.length === 0) {
    return <p className="sd-empty-note">多練習幾次，就能解開第一枚徽章囉！</p>;
  }

  return (
    <ul className="sd-badge-grid">
      {badges.map((badge) => (
        <li
          key={badge.id}
          className={`sd-badge-card ${badge.unlocked ? "is-unlocked" : "is-locked"}`}
        >
          <span className="sd-badge-icon" aria-hidden="true">
            {badge.unlocked ? badge.icon : <Lock size={20} />}
          </span>
          <h3 className="sd-badge-name">{badge.name}</h3>
          {badge.unlocked ? (
            <p className="sd-badge-cond">已解鎖！</p>
          ) : (
            <p className="sd-badge-cond">再：{badge.condition}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
