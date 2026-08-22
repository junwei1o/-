# P1 台灣主航海圖：前端實作草圖

> **目標：** 將目前的四座知識島嶼，從卡片網格改為一張以台灣相對方位安排的主航海圖。學生先選擇一座島，再閱讀島嶼面板，最後才進入既有的學科或指定知識點練習。

本草圖**不新增假進度、假關卡或英語科入口**。島嶼亮起狀態、近期知識點與可回顧線索，全部沿用既有的 `KnowledgeIslandSnapshot` 真實資料快照。

## 1. 版面草圖

桌面版將學生船標置於台灣西側海面，四個學科區域按照台灣相對方位排列。SVG 台灣輪廓只作為低對比背景；所有可操作內容都是原生 `button`，因此不會因為 SVG 或裝飾背景而失去鍵盤與手機操作能力。

```text
┌────────────────────────────── 台灣主航海圖 ──────────────────────────────┐
│  ⛵ 我的位置 ─ ─ ─ ─ ─ ─ ─ ─ ┐                                               │
│                              ▼                                               │
│                     [ 國語・閱讀巷弄島 ]       北部／古書樓                 │
│                             │                                                │
│                 [ 數學・量測工坊城 ]          中部／量測塔                 │
│                             │                       [ 自然・觀察實驗島 ]   │
│                 [ 社會・生活地圖港 ]          南部／港口     東部／山海     │
│                                                                          │
│  點選一座島 → 顯示島嶼面板 → 開始學科練習／複習真實近期知識點             │
└──────────────────────────────────────────────────────────────────────────┘
```

| 區域 | 現有快照 ID | 顯示名稱 | 第一層只顯示 | 第二層才顯示 |
|---|---|---|---|---|
| 北部 | `language` | 國語・閱讀巷弄島 | 亮起或等待探索 | 近期知識點、朗讀、練習入口 |
| 中部 | `math` | 數學・量測工坊城 | 亮起或等待探索 | 近期知識點、朗讀、練習入口 |
| 南部 | `social` | 社會・生活地圖港 | 亮起或等待探索 | 近期知識點、朗讀、練習入口 |
| 東部 | `science` | 自然・觀察實驗島 | 亮起或等待探索 | 近期知識點、朗讀、練習入口 |

## 2. 建議的新元件：`TaiwanMainNavigationMap.tsx`

請在 `client/src/components/TaiwanMainNavigationMap.tsx` 建立下列元件。它可先取代 `StudentMap.tsx` 中的 `StudentKnowledgeIslands`；舊元件可保留至 P1 視覺驗收完成後再移除。元件直接接受現有的 `islands`、`onOpenSubject` 與 `onOpenTopic`，不自行推測學生進度。

```tsx
import { Anchor, BookOpenCheck, Compass, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import type {
  KnowledgeIslandId,
  KnowledgeIslandSnapshot,
  KnowledgeIslandSubject,
} from "@/lib/studentKnowledgeIslands";
import "./TaiwanMainNavigationMap.css";

type TaiwanMainNavigationMapProps = {
  islands: KnowledgeIslandSnapshot[];
  onOpenSubject: (subject: KnowledgeIslandSubject) => void;
  onOpenTopic: (subject: KnowledgeIslandSubject, topic: string) => void;
};

type IslandPosition = { left: string; top: string; region: string };

const ISLAND_POSITIONS: Record<KnowledgeIslandId, IslandPosition> = {
  language: { left: "46%", top: "16%", region: "北部・古書樓" },
  math: { left: "49%", top: "42%", region: "中部・量測塔" },
  social: { left: "44%", top: "72%", region: "南部・生活港" },
  science: { left: "72%", top: "47%", region: "東部・山海觀察站" },
};

function islandStatus(island: KnowledgeIslandSnapshot) {
  return island.unlocked
    ? "已亮起探索航線"
    : "等待你的第一個學習線索";
}

function islandSpeechText(island: KnowledgeIslandSnapshot) {
  const recentTopics = island.recentReviewTopics.length
    ? `近期可複習的知識點有：${island.recentReviewTopics.join("、")}。`
    : "目前還沒有近期可複習的知識點。";
  const reviewCount = island.dueReviewCount
    ? `有 ${island.dueReviewCount} 個線索可依自己的步調回顧。`
    : "可以從一小段練習開始探索。";

  return `${island.title}。${island.description}。${islandStatus(island)}。${recentTopics}${reviewCount}`;
}

export function TaiwanMainNavigationMap({
  islands,
  onOpenSubject,
  onOpenTopic,
}: TaiwanMainNavigationMapProps) {
  const [activeId, setActiveId] = useState<KnowledgeIslandId | null>(null);
  const speech = useMemo(() => createSpeechController(), []);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(
    speech.isSupported ? "idle" : "unsupported",
  );
  const activeIsland = islands.find((island) => island.id === activeId) ?? null;

  useEffect(() => () => speech.stop(), [speech]);

  function selectIsland(id: KnowledgeIslandId) {
    setActiveId((current) => (current === id ? null : id));
  }

  function closePanel() {
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    setActiveId(null);
  }

  return (
    <section
      className="taiwan-navigation-map"
      aria-labelledby="taiwan-navigation-map-title"
      onKeyDown={(event) => {
        if (event.key === "Escape" && activeIsland) {
          event.preventDefault();
          closePanel();
        }
      }}
    >
      <header className="taiwan-navigation-map-heading">
        <p className="eyebrow">TAIWAN LEARNING ROUTE</p>
        <h2 id="taiwan-navigation-map-title">台灣主航海圖</h2>
        <p>選一座島看見可探索的方向，再決定這次想練習哪一個主題。</p>
      </header>

      <div className="taiwan-map-canvas" aria-label="台灣學習航海圖">
        <svg className="taiwan-map-outline" viewBox="0 0 1000 620" aria-hidden="true" focusable="false">
          <path
            d="M551 56 C596 89 610 135 599 171 C588 207 607 244 594 278 C579 313 590 347 566 381 C545 411 548 447 523 483 C498 519 460 544 433 527 C407 511 419 471 404 438 C388 405 402 366 387 332 C373 299 394 267 391 232 C389 198 414 171 424 138 C435 105 493 68 551 56 Z"
            className="taiwan-map-land"
          />
          <path d="M248 365 C328 323 380 295 444 268" className="taiwan-map-route" />
          <circle cx="248" cy="365" r="13" className="taiwan-map-boat-ring" />
          <text x="248" y="370" textAnchor="middle" className="taiwan-map-boat-mark">我</text>
        </svg>

        <p className="taiwan-map-boat-label"><Anchor size={15} aria-hidden="true" /> 我的船標</p>

        {islands.map((island) => {
          const position = ISLAND_POSITIONS[island.id];
          const isActive = island.id === activeId;
          const variables = {
            "--island-left": position.left,
            "--island-top": position.top,
          } as CSSProperties;

          return (
            <button
              key={island.id}
              type="button"
              className={`taiwan-map-island island-${island.id}${island.unlocked ? " is-unlocked" : ""}${isActive ? " is-selected" : ""}`}
              style={variables}
              aria-pressed={isActive}
              aria-controls={isActive ? `taiwan-island-panel-${island.id}` : undefined}
              aria-label={`${island.shortTitle}，${position.region}，${islandStatus(island)}`}
              onClick={() => selectIsland(island.id)}
            >
              <span className="taiwan-map-island-compass" aria-hidden="true"><Compass size={16} /></span>
              <span className="taiwan-map-island-region">{position.region}</span>
              <strong>{island.shortTitle}</strong>
              <small>{islandStatus(island)}</small>
              {island.unlocked ? <span className="taiwan-map-island-flag" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      {activeIsland ? (
        <article
          id={`taiwan-island-panel-${activeIsland.id}`}
          className="taiwan-map-panel"
          aria-labelledby={`taiwan-island-panel-title-${activeIsland.id}`}
        >
          <div className="taiwan-map-panel-copy">
            <p className="eyebrow">{ISLAND_POSITIONS[activeIsland.id].region}</p>
            <h3 id={`taiwan-island-panel-title-${activeIsland.id}`}>{activeIsland.title}</h3>
            <p>{activeIsland.description}</p>
            <p className="taiwan-map-panel-status"><Sparkles size={15} aria-hidden="true" /> {islandStatus(activeIsland)}</p>

            {activeIsland.recentReviewTopics.length ? (
              <section className="taiwan-map-panel-topics" aria-label="近期可複習知識點">
                <p>近期可複習的知識點</p>
                <ul>
                  {activeIsland.recentReviewTopics.map((topic) => (
                    <li key={topic}>
                      <button type="button" onClick={() => onOpenTopic(activeIsland.subject, topic)}>
                        複習「{topic}」
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="taiwan-map-panel-empty">還沒有近期練習紀錄也沒關係，可以從這座島開始留下第一個線索。</p>
            )}
          </div>

          <div className="taiwan-map-panel-actions">
            <button type="button" className="taiwan-map-panel-primary" onClick={() => onOpenSubject(activeIsland.subject)}>
              <BookOpenCheck size={18} aria-hidden="true" />
              {activeIsland.unlocked ? `繼續 ${activeIsland.shortTitle} 練習` : `從 ${activeIsland.shortTitle} 開始探索`}
            </button>
            <button
              type="button"
              className="taiwan-map-panel-secondary"
              disabled={!speech.isSupported}
              onClick={() => speech.speak(islandSpeechText(activeIsland), setSpeechStatus)}
            >
              {speechStatus === "speaking" ? "正在朗讀航線說明" : speechStatus === "unsupported" ? "此裝置暫不支援朗讀" : "朗讀航線說明"}
            </button>
            <button type="button" className="taiwan-map-panel-close" onClick={closePanel}>回到航海圖</button>
          </div>
        </article>
      ) : (
        <p className="taiwan-map-hint" role="status">四座島都能立即探索；亮起的航線代表你已在這裡留下真實學習線索。</p>
      )}
    </section>
  );
}
```

## 3. 對應樣式：`TaiwanMainNavigationMap.css`

此樣式採用既有的羊皮紙、海洋藍與森林綠視覺語言。SVG 與海面紋理皆設為不可點擊；學生只會與可聚焦的島嶼按鈕及面板控制互動。

```css
.taiwan-navigation-map {
  border: 1px solid rgba(43, 83, 82, 0.18);
  border-radius: 1.5rem;
  padding: clamp(1rem, 3vw, 1.75rem);
  background: linear-gradient(145deg, #f8f0d8 0%, #d7eadf 100%);
  box-shadow: 0 18px 42px rgba(41, 79, 77, 0.12);
}

.taiwan-navigation-map-heading {
  max-width: 42rem;
}

.taiwan-navigation-map-heading h2,
.taiwan-map-panel h3 {
  margin: 0.2rem 0 0.45rem;
  color: #123d44;
}

.taiwan-map-canvas {
  position: relative;
  isolation: isolate;
  width: min(100%, 60rem);
  aspect-ratio: 16 / 9;
  margin: 1rem auto;
  overflow: hidden;
  border: 1px solid rgba(21, 81, 96, 0.22);
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at 16% 48%, rgba(251, 239, 170, 0.5), transparent 18rem),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.14) 0 1px, transparent 1px 12px),
    #6ca5ac;
}

.taiwan-map-outline {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.taiwan-map-land {
  fill: rgba(246, 223, 161, 0.82);
  stroke: rgba(102, 75, 43, 0.48);
  stroke-width: 8;
}

.taiwan-map-route {
  fill: none;
  stroke: #f8dc74;
  stroke-linecap: round;
  stroke-width: 7;
  stroke-dasharray: 11 13;
}

.taiwan-map-boat-ring {
  fill: #fae998;
  stroke: #173d4a;
  stroke-width: 4;
}

.taiwan-map-boat-mark {
  fill: #173d4a;
  font-size: 18px;
  font-weight: 800;
}

.taiwan-map-boat-label {
  position: absolute;
  left: 20%;
  top: 61%;
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  margin: 0;
  color: #173d4a;
  font-size: 0.8rem;
  font-weight: 800;
}

.taiwan-map-island {
  position: absolute;
  z-index: 1;
  left: var(--island-left);
  top: var(--island-top);
  display: grid;
  min-width: clamp(6.6rem, 15vw, 9.25rem);
  padding: 0.65rem 0.75rem;
  border: 2px solid rgba(27, 76, 78, 0.65);
  border-radius: 1rem;
  transform: translate(-50%, -50%);
  text-align: left;
  color: #143f43;
  background: rgba(249, 241, 210, 0.95);
  box-shadow: 0 8px 0 rgba(31, 82, 85, 0.16);
  cursor: pointer;
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 180ms cubic-bezier(0.23, 1, 0.32, 1), background-color 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.taiwan-map-island:hover,
.taiwan-map-island:focus-visible,
.taiwan-map-island.is-selected {
  transform: translate(-50%, -54%);
  outline: none;
  box-shadow: 0 12px 0 rgba(31, 82, 85, 0.2), 0 0 0 4px rgba(248, 220, 116, 0.7);
}

.taiwan-map-island:active {
  transform: translate(-50%, -49%) scale(0.97);
}

.taiwan-map-island.is-unlocked {
  border-color: #26766d;
  background: #e8f5db;
}

.taiwan-map-island-compass,
.taiwan-map-island-flag {
  color: #bf6e2c;
}

.taiwan-map-island-region,
.taiwan-map-island small {
  margin-top: 0.12rem;
  color: #3d635c;
  font-size: 0.68rem;
}

.taiwan-map-island strong {
  margin-top: 0.08rem;
  font-size: 1rem;
}

.taiwan-map-island-flag {
  position: absolute;
  right: 0.6rem;
  top: 0.55rem;
  width: 0.58rem;
  height: 0.86rem;
  background: currentColor;
  clip-path: polygon(0 0, 100% 24%, 0 48%);
}

.taiwan-map-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid rgba(29, 83, 79, 0.2);
  border-radius: 1rem;
  background: rgba(255, 252, 238, 0.85);
}

.taiwan-map-panel-copy p {
  margin: 0.35rem 0;
}

.taiwan-map-panel-status {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  color: #276957;
  font-weight: 800;
}

.taiwan-map-panel-topics ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0;
  margin: 0.5rem 0 0;
  list-style: none;
}

.taiwan-map-panel-topics button,
.taiwan-map-panel-secondary,
.taiwan-map-panel-close {
  border: 1px solid #6a8177;
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  color: #1f5450;
  background: #fff9de;
}

.taiwan-map-panel-actions {
  display: grid;
  gap: 0.55rem;
  min-width: min(100%, 12.5rem);
}

.taiwan-map-panel-primary {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.8rem;
  padding: 0.72rem 0.9rem;
  color: white;
  background: #1f6f68;
}

.taiwan-map-hint,
.taiwan-map-panel-empty {
  color: #49645f;
}

@media (max-width: 560px) {
  .taiwan-map-canvas {
    min-height: 29rem;
    aspect-ratio: 3 / 4;
  }

  .taiwan-map-island {
    min-width: 6rem;
    padding: 0.5rem;
  }

  .taiwan-map-island small {
    line-height: 1.25;
  }

  .taiwan-map-boat-label {
    left: 12%;
    top: 66%;
  }

  .taiwan-map-panel {
    grid-template-columns: 1fr;
  }

  .taiwan-map-panel-actions {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .taiwan-map-island {
    transition: none;
  }

  .taiwan-map-island:hover,
  .taiwan-map-island:focus-visible,
  .taiwan-map-island.is-selected,
  .taiwan-map-island:active {
    transform: translate(-50%, -50%);
  }
}
```

## 4. `StudentMap.tsx` 整合片段

將既有 `StudentKnowledgeIslands` 匯入改為下列元件；`knowledgeIslands`、`onOpenSubject` 與 `onOpenTopic` 都可直接沿用，無須改動作答紀錄或試卷組卷邏輯。

```tsx
// 移除：import { StudentKnowledgeIslands } from "@/components/StudentKnowledgeIslands";
import { TaiwanMainNavigationMap } from "@/components/TaiwanMainNavigationMap";

// 以此區塊取代原本的 <StudentKnowledgeIslands ... />
<TaiwanMainNavigationMap
  islands={knowledgeIslands}
  onOpenSubject={(subject) =>
    setLocation(`/?subject=${encodeURIComponent(subject)}&source=taiwan-main-map`)
  }
  onOpenTopic={(subject, topic) =>
    setLocation(`/?subject=${encodeURIComponent(subject)}&reviewTopic=${encodeURIComponent(topic)}&source=taiwan-main-map`)
  }
/>
```

這個接線保留既有的「試卷範圍確認卡」與 `reviewTopic` 複習流程；地圖只負責導航，而不直接把學生送入未說明範圍的答題畫面。

## 5. 最小回歸測試：`TaiwanMainNavigationMap.test.tsx`

測試的重點不是像素位置，而是：島嶼按鈕能被鍵盤操作、狀態來自傳入快照、詳細面板能導向正確學科／知識點，以及沒有資料的島仍可開始探索。

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaiwanMainNavigationMap } from "./TaiwanMainNavigationMap";
import type { KnowledgeIslandSnapshot } from "@/lib/studentKnowledgeIslands";

const islands: KnowledgeIslandSnapshot[] = [
  {
    id: "math", subject: "數學", title: "量與關係島", shortTitle: "數學",
    description: "把數字、圖形和規律連成可走的路。", attemptCount: 2,
    observedKnowledge: ["分數比較"], recentReviewTopics: ["分數比較"],
    dueReviewCount: 1, unlocked: true,
  },
  {
    id: "science", subject: "自然", title: "觀察實驗島", shortTitle: "自然",
    description: "從現象、證據和變化找到線索。", attemptCount: 0,
    observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false,
  },
  {
    id: "social", subject: "社會", title: "生活與地方島", shortTitle: "社會",
    description: "看看人、地方和規則如何互相影響。", attemptCount: 0,
    observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false,
  },
  {
    id: "language", subject: "國語", title: "閱讀表達島", shortTitle: "國語",
    description: "從文字裡找線索，也把想法說清楚。", attemptCount: 0,
    observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false,
  },
];

describe("TaiwanMainNavigationMap", () => {
  it("選擇島嶼後顯示真實近期知識點，並可導向指定複習", async () => {
    const user = userEvent.setup();
    const onOpenSubject = vi.fn();
    const onOpenTopic = vi.fn();
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={onOpenSubject} onOpenTopic={onOpenTopic} />);

    await user.click(screen.getByRole("button", { name: /數學.*已亮起探索航線/ }));
    expect(screen.getByRole("heading", { name: "量與關係島" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "複習「分數比較」" }));
    expect(onOpenTopic).toHaveBeenCalledWith("數學", "分數比較");

    await user.click(screen.getByRole("button", { name: /繼續 數學 練習/ }));
    expect(onOpenSubject).toHaveBeenCalledWith("數學");
  });

  it("尚無紀錄的島嶼仍維持正向探索入口", async () => {
    const user = userEvent.setup();
    render(<TaiwanMainNavigationMap islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /自然.*等待你的第一個學習線索/ }));
    expect(screen.getByText(/還沒有近期練習紀錄也沒關係/)).toBeVisible();
    expect(screen.getByRole("button", { name: /從 自然 開始探索/ })).toBeEnabled();
  });
});
```

## 6. P1 驗收清單

| 驗收項目 | 預期結果 |
|---|---|
| 真實資料 | 只有 `KnowledgeIslandSnapshot` 的 `unlocked`、`recentReviewTopics` 與 `dueReviewCount` 決定顯示內容。 |
| 第一層簡潔 | 主航海圖只呈現島嶼名稱、台灣相對位置與正向狀態，不顯示分數、錯題或假關卡。 |
| 第二層可控 | 點按、Enter、Space 或鍵盤焦點可開啟島嶼面板；Escape 可回到航海圖。 |
| 練習導向 | 面板能帶入既有 `subject` 與 `reviewTopic` query，仍會經過既有的試卷確認流程。 |
| 可近用與手機 | 所有島嶼都是語意按鈕；375px 下不依賴 hover；`prefers-reduced-motion` 下移除位移效果。 |
| 朗讀降級 | 朗讀只讀島嶼說明與實際知識點；瀏覽器不支援時按鈕保持可理解的停用狀態。 |

## 7. 建議的實作順序

第一步先加入新元件與測試，但暫時保留舊版 `StudentKnowledgeIslands` 以便比較。第二步在 `StudentMap.tsx` 以新元件取代舊卡片網格，並執行完整 Vitest、production build 與桌面／375px 截圖。確認「選島 → 看面板 → 開始練習」流程穩定後，再刪除不再使用的舊元件或將其中共用的詳細面板萃取成共用子元件。
