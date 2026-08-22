import { BookOpenCheck, Calculator, FlaskConical, Map, MessagesSquare, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import type { KnowledgeIslandId, KnowledgeIslandSnapshot, KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import "./StudentKnowledgeIslandsRecent.css";

type StudentKnowledgeIslandsProps = {
  islands: KnowledgeIslandSnapshot[];
  onOpenSubject: (subject: KnowledgeIslandSubject) => void;
  onOpenTopic: (subject: KnowledgeIslandSubject, topic: string) => void;
};

const ISLAND_ICONS: Record<KnowledgeIslandId, typeof Calculator> = {
  math: Calculator,
  science: FlaskConical,
  social: Map,
  language: MessagesSquare,
};

function islandStatus(island: KnowledgeIslandSnapshot) {
  if (!island.unlocked) return "這座島正在等你的第一個學習線索。";
  return `已留下 ${island.attemptCount} 次真實練習線索。`;
}

export function StudentKnowledgeIslands({ islands, onOpenSubject, onOpenTopic }: StudentKnowledgeIslandsProps) {
  const [activeIslandId, setActiveIslandId] = useState<KnowledgeIslandId | null>(null);
  const speech = useMemo(() => createSpeechController(), []);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(speech.isSupported ? "idle" : "unsupported");
  const activeIsland = islands.find((island) => island.id === activeIslandId) ?? null;

  useEffect(() => () => speech.stop(), [speech]);

  const readIsland = () => {
    if (!activeIsland) return;
    const knowledge = activeIsland.observedKnowledge.length ? `你已留下的知識線索有：${activeIsland.observedKnowledge.join("、")}。` : "還沒有知識線索也沒關係，可以從第一份練習開始。";
    const recentTopics = activeIsland.recentReviewTopics.length ? `近期可以回顧的知識點有：${activeIsland.recentReviewTopics.join("、")}。` : "目前還沒有近期可複習的知識點。";
    const review = activeIsland.dueReviewCount ? `目前有 ${activeIsland.dueReviewCount} 個可依自己步調回顧的線索。` : "現在可以選擇一小段練習繼續探索。";
    const directions = activeIsland.learningDirections.length ? `建議的學習方向有：${activeIsland.learningDirections.join("、")}。` : "";
    speech.speak(`${activeIsland.title}。${activeIsland.description}課綱學習方向：${activeIsland.curriculumFocus}。${directions}${islandStatus(activeIsland)}${knowledge}${recentTopics}${review}`, setSpeechStatus);
  };

  return (
    <section className="student-knowledge-islands" aria-labelledby="knowledge-islands-title">
      <div className="student-knowledge-islands-heading">
        <div>
          <p className="eyebrow">KNOWLEDGE ISLANDS</p>
          <h2 id="knowledge-islands-title">選一座知識島嶼出發</h2>
          <p>島嶼會隨你真實留下的練習線索亮起；還沒出發的地方，也隨時歡迎你探索。</p>
        </div>
        <span className="student-knowledge-islands-key"><Sparkles size={16} aria-hidden="true" /> 光亮表示已留下學習線索</span>
      </div>

      <div className="student-knowledge-island-grid" aria-label="四座知識島嶼">
        {islands.map((island) => {
          const Icon = ISLAND_ICONS[island.id];
          const isActive = activeIsland?.id === island.id;
          return (
            <button
              key={island.id}
              type="button"
              className={`student-knowledge-island island-${island.id}${island.unlocked ? " is-unlocked" : ""}${isActive ? " is-selected" : ""}`}
              aria-pressed={isActive}
              aria-controls={isActive ? `knowledge-island-detail-${island.id}` : undefined}
              aria-label={`${island.title}，${islandStatus(island)}`}
              data-testid={`knowledge-island-${island.id}`}
              onClick={() => setActiveIslandId((current) => current === island.id ? null : island.id)}
            >
              <span className="student-knowledge-island-icon" aria-hidden="true"><Icon size={23} /></span>
              <span className="student-knowledge-island-subject">{island.shortTitle}</span>
              <strong>{island.title}</strong>
              <small>{island.unlocked ? "已亮起探索航線" : "等待第一次探索"}</small>
              {island.unlocked ? <span className="student-knowledge-island-glow" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      {activeIsland ? (
        <article id={`knowledge-island-detail-${activeIsland.id}`} className="student-knowledge-island-detail" aria-labelledby={`knowledge-island-detail-title-${activeIsland.id}`}>
          <div className="student-knowledge-island-detail-copy">
            <p className="eyebrow">{activeIsland.shortTitle} ISLAND</p>
            <h3 id={`knowledge-island-detail-title-${activeIsland.id}`}>{activeIsland.title}</h3>
            <p>{activeIsland.description}</p>
            <section className="student-knowledge-island-curriculum" aria-labelledby={`knowledge-island-curriculum-title-${activeIsland.id}`}>
              <p id={`knowledge-island-curriculum-title-${activeIsland.id}`}>課綱探索方向</p>
              <strong>{activeIsland.curriculumFocus}</strong>
              <ul aria-label="建議學習方向">
                {activeIsland.learningDirections.map((direction) => <li key={direction}>{direction}</li>)}
              </ul>
            </section>
            <p className="student-knowledge-island-status">{islandStatus(activeIsland)}</p>
            {activeIsland.observedKnowledge.length ? (
              <div className="student-knowledge-island-tags" aria-label="已留下的知識線索">
                <span>已留下的線索</span>
                <ul>{activeIsland.observedKnowledge.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              </div>
            ) : null}
            {activeIsland.recentReviewTopics.length ? (
              <section className="student-knowledge-island-recent" aria-label="近期可複習知識點">
                <p>近期可複習的知識點</p>
                <ul>
                  {activeIsland.recentReviewTopics.map((topic) => (
                    <li key={topic}>
                      <button type="button" onClick={() => onOpenTopic(activeIsland.subject, topic)} aria-label={`複習「${topic}」`}>{topic}</button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {activeIsland.dueReviewCount ? <p className="student-knowledge-island-review">有 {activeIsland.dueReviewCount} 個線索可在合適的時間再回顧。</p> : null}
            <section className="student-knowledge-island-resources" aria-labelledby={`knowledge-island-resources-title-${activeIsland.id}`}>
              <p id={`knowledge-island-resources-title-${activeIsland.id}`}>延伸學習資源</p>
              <ul>
                {activeIsland.resources.map((resource) => (
                  <li key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noreferrer" aria-label={`${resource.title}，${resource.provider}，開啟外部資源`}>
                      <span>{resource.title}</span><small>{resource.provider} · {resource.kind}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="student-knowledge-island-actions">
            <button type="button" className="student-knowledge-island-open" onClick={() => onOpenSubject(activeIsland.subject)}>
              <BookOpenCheck size={18} aria-hidden="true" /> {activeIsland.unlocked ? `繼續 ${activeIsland.shortTitle} 練習` : `從 ${activeIsland.shortTitle} 開始探索`}
            </button>
            <button type="button" className="student-knowledge-island-speech" onClick={readIsland} disabled={!speech.isSupported}>
              {speechStatus === "speaking" ? "正在朗讀島嶼說明" : speechStatus === "unsupported" ? "此裝置暫不支援朗讀" : "朗讀島嶼說明"}
            </button>
            <button type="button" className="student-knowledge-island-close" onClick={() => setActiveIslandId(null)}>回到四座島嶼</button>
          </div>
        </article>
      ) : (
        <p className="student-knowledge-islands-hint" role="status">從一座想探索的島嶼開始，看看它能帶你走到哪裡。</p>
      )}
    </section>
  );
}
