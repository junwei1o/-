import React, { type ReactNode } from "react";
import { Link } from "wouter";
import { bxStore, type BxState } from "@/game/bxStore";
import { useBxVersion } from "./useBx";

/**
 * BX.Empty — 空狀態與「第一盞燈」破冰任務使用的插圖與文案。
 * 由 js/bx-emptystates.js 移植，路由改為站內真實路徑（/practice、/camp）。
 */

export type BxEmptyArtKey = "calmSea" | "blankLog" | "badgeRack" | "backpack";
export type BxEmptyStyle = "adventure" | "data" | "parrot";
export type BxSlotKey = "footprint" | "weekly" | "badges" | "backpack";

const PRACTICE = "/practice";
const SHOP = "/camp";

interface CopyRow {
  art: BxEmptyArtKey;
  title: string;
  body: string;
  cta: string;
  route: string;
}

const COPY: Record<BxSlotKey, Record<BxEmptyStyle, CopyRow>> = {
  footprint: {
    adventure: { art: "calmSea", title: "🌊 海面還很平靜", body: "昨天沒有留下航行紀錄。今天的風向不錯，適合出發——答對第一題，航海圖就會亮起第一盞燈。", cta: "立刻起航 →", route: PRACTICE },
    data: { art: "calmSea", title: "📊 0 → 1 的距離", body: "只要 1 題，這裡就會出現你的第一筆數據。平均只需要 30 秒。", cta: "30 秒開始 →", route: PRACTICE },
    parrot: { art: "calmSea", title: "🦜 海鸚鵡歪著頭看你", body: "「嘎？昨天都沒出海嗎？今天一起去嘛！我幫你看著舵，你只要答題就好。」", cta: "好，出發 →", route: PRACTICE },
  },
  weekly: {
    adventure: { art: "blankLog", title: "📜 日誌還是空白的", body: "還沒有需要補強的地方。等你開始答題，這裡會自動記錄你不熟悉的知識點。", cta: "去找題練練 →", route: PRACTICE },
    data: { art: "blankLog", title: "🎯 尚未鎖定弱項", body: "系統需要至少 5 題作答紀錄，才能分析出你最需要補強的地方。", cta: "答 5 題解鎖分析 →", route: PRACTICE },
    parrot: { art: "blankLog", title: "🦜 「空白也是一種紀錄！」", body: "海鸚鵡用翅膀拍了拍日誌：「嘎！沒有弱項代表你還沒開始冒險啦，快去！」", cta: "去冒險 →", route: PRACTICE },
  },
  badges: {
    adventure: { art: "badgeRack", title: "🏅 徽章架空蕩蕩的", body: "第一枚徽章通常最難拿到，也最值得炫耀。答對 1 題就能解鎖「啟航者」。", cta: "挑戰第一題 →", route: PRACTICE },
    data: { art: "badgeRack", title: "🏅 0 / 42 已收集", body: "全部 42 枚徽章中，最容易拿到的是「啟航者」——只需答對 1 題。", cta: "解鎖第一枚 →", route: PRACTICE },
    parrot: { art: "badgeRack", title: "🧭 老船長摸摸鬍子", body: "「孩子，每個偉大的航海士，都是從一枚小小的徽章開始的。去拿你的第一枚吧。」", cta: "是，船長！ →", route: PRACTICE },
  },
  backpack: {
    adventure: { art: "backpack", title: "🎒 背包裡只有海風", body: "去商店看看，金幣可以換到很有用的航海道具——提示卡、護盾，甚至新的船標。", cta: "逛逛商店 →", route: SHOP },
    data: { art: "backpack", title: "🎒 道具數量：0", body: "__COINTEXT__", cta: "開始累積 →", route: PRACTICE },
    parrot: { art: "backpack", title: "🦜 「背包空空的！」", body: "海鸚鵡鑽進背包又飛出來：「嘎——裡面什麼都沒有！我們去商店逛逛好不好？」", cta: "走，去商店 →", route: SHOP },
  },
};

export function pickEmptyStyle(state: BxState): BxEmptyStyle {
  if (state.stats.total_answers >= 30) return "data";
  return state.prefs.grade === 3 ? "parrot" : "adventure";
}

function Art({ art }: { art: BxEmptyArtKey }) {
  const common = { className: "bx-empty__art", viewBox: "0 0 120 120", "aria-hidden": true as const };
  if (art === "calmSea") {
    return (
      <svg {...common}>
        <defs><linearGradient id="bxg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE3F5" /><stop offset="1" stopColor="#5FA8D3" /></linearGradient></defs>
        <circle cx="60" cy="60" r="52" fill="url(#bxg1)" opacity=".22" />
        <path d="M12 76 Q30 68 48 76 T84 76 T120 76" stroke="#5FA8D3" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M12 90 Q30 82 48 90 T84 90 T120 90" stroke="#5FA8D3" strokeWidth="3" fill="none" opacity=".55" strokeLinecap="round" />
        <g className="bx-float"><path d="M60 38 L60 62 M48 62 L72 62 L67 72 L53 72 Z" stroke="#2C3E50" strokeWidth="2.5" fill="#F5A623" strokeLinejoin="round" /><path d="M62 40 L80 54 L62 56 Z" fill="#FFF" stroke="#2C3E50" strokeWidth="2" strokeLinejoin="round" /></g>
      </svg>
    );
  }
  if (art === "blankLog") {
    return (
      <svg {...common}>
        <rect x="26" y="18" width="68" height="86" rx="6" fill="#FFF6E0" stroke="#C9A227" strokeWidth="3" />
        <path d="M38 40 h44 M38 55 h44 M38 70 h28" stroke="#D9C58A" strokeWidth="3" strokeLinecap="round" />
        <circle cx="86" cy="88" r="17" fill="#F5A623" opacity=".92" />
        <path d="M79 88 l5 5 l10 -12" stroke="#FFF" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".4" />
      </svg>
    );
  }
  if (art === "badgeRack") {
    return (
      <svg {...common}>
        <rect x="16" y="52" width="88" height="10" rx="5" fill="#C9A227" />
        <circle cx="36" cy="36" r="15" fill="#EDEDED" stroke="#C4C4C4" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="60" cy="36" r="15" fill="#EDEDED" stroke="#C4C4C4" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="84" cy="36" r="15" fill="#EDEDED" stroke="#C4C4C4" strokeWidth="2" strokeDasharray="4 3" />
        <text x="60" y="96" textAnchor="middle" fontSize="26">🏅</text>
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M34 46 Q34 26 60 26 Q86 26 86 46 L86 96 Q86 106 76 106 L44 106 Q34 106 34 96 Z" fill="#6BAED6" stroke="#2C3E50" strokeWidth="3" />
      <rect x="46" y="58" width="28" height="22" rx="5" fill="#FFF" opacity=".9" />
      <path d="M50 34 Q60 26 70 34" stroke="#2C3E50" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text x="60" y="75" textAnchor="middle" fontSize="15" fill="#6BAED6">～</text>
    </svg>
  );
}

export function BxEmptyState({ slot, filled }: { slot: BxSlotKey; filled?: ReactNode }) {
  useBxVersion();
  const state = bxStore.all();
  if (filled && bxStore.derived.hasAnyData()) {
    return <>{filled}</>;
  }
  const style = pickEmptyStyle(state);
  const row = COPY[slot][style];
  let body = row.body;
  if (body.includes("__COINTEXT__")) {
    body = `目前金幣 ${bxStore.get<number>("coins", 0) ?? 0} 枚。答對 1 題可獲得 3–8 金幣。`;
  }
  return (
    <div className="bx-empty-host">
      <div className="bx-empty">
        <Art art={row.art} />
        <h4 className="bx-empty__title">{row.title}</h4>
        <p className="bx-empty__body">{body}</p>
        <Link className="bx-btn bx-btn--outline" href={row.route}>{row.cta}</Link>
      </div>
    </div>
  );
}
