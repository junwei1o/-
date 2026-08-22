import { BookOpen, Compass, Orbit, Radio, Sparkles, Telescope } from "lucide-react";
import React, { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import type { StudentLivingConnection, StudentLivingConnections, StudentRelationNodeKey } from "@/lib/studentLivingConnections";

type StudentRelationMapProps = {
  studentName: string;
  level: number;
  completedCount: number;
  progress: number;
  companionName: string;
  livingConnections?: StudentLivingConnections;
  onOpenExam: () => void;
  onOpenAstronomy: () => void;
  onOpenPrinciples: () => void;
  onOpenCompanion: () => void;
  onOpenInsights: () => void;
  onOpenObservatory: () => void;
};

type RelationNodeProps = {
  nodeKey: StudentRelationNodeKey;
  className: string;
  label: string;
  title: string;
  relation: string;
  icon: ReactNode;
  onClick: () => void;
  connection?: StudentLivingConnection;
  isTooltipActive: boolean;
  onOpenTooltip: (nodeKey: StudentRelationNodeKey, source: "hover" | "focus" | "tap") => void;
  onCloseTooltip: (nodeKey: StudentRelationNodeKey, source?: "hover" | "focus" | "escape") => void;
};

function RelationNode({ nodeKey, className, label, title, relation, icon, onClick, connection, isTooltipActive, onOpenTooltip, onCloseTooltip }: RelationNodeProps) {
  const tooltipId = `student-living-connection-${nodeKey}`;
  const speech = useMemo(() => createSpeechController(), []);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(speech.isSupported ? "idle" : "unsupported");
  const canShowTooltip = Boolean(connection?.lifeExamples.length);

  useEffect(() => () => speech.stop(), [speech]);

  const handleReadExample = () => {
    if (!connection) return;
    speech.speak(`${title}的生活連結。${connection.subject}。${connection.lifeExamples.join(" ")}`, setSpeechStatus);
  };

  return (
    <article
      className={`student-relation-node ${className}${isTooltipActive ? " is-tooltip-active" : ""}`}
      data-testid={`student-relation-node-${nodeKey}`}
      onMouseEnter={() => canShowTooltip && onOpenTooltip(nodeKey, "hover")}
      onMouseLeave={() => canShowTooltip && onCloseTooltip(nodeKey, "hover")}
      onFocus={() => canShowTooltip && onOpenTooltip(nodeKey, "focus")}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onCloseTooltip(nodeKey, "focus");
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isTooltipActive) return;
        event.preventDefault();
        onCloseTooltip(nodeKey, "escape");
        event.currentTarget.querySelector<HTMLButtonElement>(".student-relation-node-launch")?.focus();
      }}
    >
      <button
        type="button"
        className="student-relation-node-launch"
        aria-label={`${title}：${relation}`}
        aria-expanded={canShowTooltip ? isTooltipActive : undefined}
        aria-describedby={canShowTooltip && isTooltipActive ? tooltipId : undefined}
        onClick={onClick}
      >
        <span className="student-relation-icon" aria-hidden="true">{icon}</span>
        <span className="student-relation-label">{label}</span>
        <strong>{title}</strong>
        <small>{relation}</small>
        <span className="student-relation-open" aria-hidden="true">前往探索</span>
      </button>
      {canShowTooltip ? (
        <button
          type="button"
          className="student-relation-tooltip-toggle"
          aria-controls={tooltipId}
          aria-expanded={isTooltipActive}
          onClick={() => isTooltipActive ? onCloseTooltip(nodeKey) : onOpenTooltip(nodeKey, "tap")}
        >
          {isTooltipActive ? "收起生活實例" : "查看生活實例"}
        </button>
      ) : <span className="student-relation-empty-link">完成練習後，這裡會出現你的生活連結。</span>}
      {canShowTooltip && isTooltipActive && connection ? (
        <aside id={tooltipId} className="student-relation-tooltip" role="tooltip" aria-label={`${title}的生活連結`}>
          <p className="student-relation-tooltip-subject">{connection.subject}</p>
          <p className="student-relation-tooltip-source">{connection.sourceLabel}</p>
          <ul>
            {connection.lifeExamples.map((example) => <li key={example}>{example}</li>)}
          </ul>
          <button type="button" className="student-relation-tooltip-speech" onClick={handleReadExample} disabled={!speech.isSupported}>
            {speechStatus === "speaking" ? "正在朗讀生活實例" : speechStatus === "unsupported" ? "此裝置暫不支援朗讀" : "朗讀生活實例"}
          </button>
        </aside>
      ) : null}
    </article>
  );
}

export function StudentRelationMap({
  studentName,
  level,
  completedCount,
  progress,
  companionName,
  livingConnections = {},
  onOpenExam,
  onOpenAstronomy,
  onOpenPrinciples,
  onOpenCompanion,
  onOpenInsights,
  onOpenObservatory,
}: StudentRelationMapProps) {
  const [activeTooltip, setActiveTooltip] = useState<{ nodeKey: StudentRelationNodeKey; source: "hover" | "focus" | "tap" } | null>(null);
  const suppressedFocusNode = useRef<StudentRelationNodeKey | null>(null);
  const activeTooltipNode = activeTooltip?.nodeKey ?? null;
  const openTooltip = (nodeKey: StudentRelationNodeKey, source: "hover" | "focus" | "tap") => {
    if (source === "focus" && suppressedFocusNode.current === nodeKey) return;
    setActiveTooltip({ nodeKey, source });
  };
  const closeTooltip = (nodeKey: StudentRelationNodeKey, source?: "hover" | "focus" | "escape") => {
    if (source === "escape") suppressedFocusNode.current = nodeKey;
    if (source === "focus") suppressedFocusNode.current = null;
    setActiveTooltip((current) => current?.nodeKey === nodeKey && (source === "escape" || !source || current.source === source) ? null : current);
  };

  return (
    <section className="student-relation-map" aria-labelledby="student-relation-map-title">
      <div className="student-relation-heading">
        <div>
          <p className="eyebrow">MY LEARNING CONSTELLATION</p>
          <h2 id="student-relation-map-title">以我為中心的學習拼圖</h2>
          <p>每一塊拼圖都和我有關：我練習、觀察、思考，也和夥伴一起把學到的知識用在冒險裡。</p>
        </div>
        <div className="student-relation-key" aria-label="關係拼圖說明">
          <span aria-hidden="true" /> 滑過、聚焦或查看生活實例，找出知識和我的連結。
        </div>
      </div>

      <div className="student-relation-network">
        <svg className="student-relation-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path className={activeTooltipNode === "exam" ? "is-active" : undefined} d="M50 49 L18 20" />
          <path className={activeTooltipNode === "astronomy" ? "is-active" : undefined} d="M50 49 L82 20" />
          <path className={activeTooltipNode === "principles" ? "is-active" : undefined} d="M50 49 L18 79" />
          <path className={activeTooltipNode === "companion" ? "is-active" : undefined} d="M50 49 L50 10" />
          <path className={activeTooltipNode === "insights" ? "is-active" : undefined} d="M50 49 L82 79" />
          <path className={activeTooltipNode === "observatory" ? "is-active" : undefined} d="M50 49 L50 89" />
          <circle cx="50" cy="49" r="2.3" />
        </svg>

        <RelationNode nodeKey="exam" className="relation-exam" label="我每天練習" title="常規試卷" relation="四個學科，幫我把基礎打穩。" icon={<BookOpen size={20} />} onClick={onOpenExam} connection={livingConnections.exam} isTooltipActive={activeTooltipNode === "exam"} onOpenTooltip={openTooltip} onCloseTooltip={closeTooltip} />
        <RelationNode nodeKey="astronomy" className="relation-astronomy" label="我抬頭觀察" title="天文館" relation="從星空認識自然與宇宙。" icon={<Telescope size={20} />} onClick={onOpenAstronomy} connection={livingConnections.astronomy} isTooltipActive={activeTooltipNode === "astronomy"} onOpenTooltip={openTooltip} onCloseTooltip={closeTooltip} />
        <RelationNode nodeKey="principles" className="relation-principles" label="我想知道為什麼" title="世界原理" relation="用光、力與能量理解身邊的事。" icon={<Orbit size={20} />} onClick={onOpenPrinciples} connection={livingConnections.principles} isTooltipActive={activeTooltipNode === "principles"} onOpenTooltip={openTooltip} onCloseTooltip={closeTooltip} />
        <RelationNode nodeKey="companion" className="relation-companion" label="我和夥伴一起" title="夥伴遠征" relation={`和${companionName}把知識變成冒險行動。`} icon={<Sparkles size={20} />} onClick={onOpenCompanion} connection={livingConnections.companion} isTooltipActive={activeTooltipNode === "companion"} onOpenTooltip={openTooltip} onCloseTooltip={closeTooltip} />
        <RelationNode nodeKey="insights" className="relation-insights" label="我看見自己的進步" title="學習洞察" relation="找到已熟練與下一步要複習的地方。" icon={<Compass size={20} />} onClick={onOpenInsights} connection={livingConnections.insights} isTooltipActive={activeTooltipNode === "insights"} onOpenTooltip={openTooltip} onCloseTooltip={closeTooltip} />
        <RelationNode nodeKey="observatory" className="relation-observatory" label="我用作品想像" title="動漫觀測" relation="從日常、宇宙與科技理解不同世界觀。" icon={<Radio size={20} />} onClick={onOpenObservatory} connection={livingConnections.observatory} isTooltipActive={activeTooltipNode === "observatory"} onOpenTooltip={openTooltip} onCloseTooltip={closeTooltip} />

        <article className="student-relation-center" aria-label={`${studentName}的學習中心，目前第 ${level} 級，已完成 ${completedCount} 題，整體進度 ${progress}%`}>
          <span className="student-center-orbit student-center-orbit-one" aria-hidden="true" />
          <span className="student-center-orbit student-center-orbit-two" aria-hidden="true" />
          <div className="student-center-avatar" aria-hidden="true">我</div>
          <p>我是小學生</p>
          <h3>{studentName}</h3>
          <span className="student-center-level">Lv.{level} 學習探險員</span>
          <dl>
            <div><dt>完成</dt><dd>{completedCount} 題</dd></div>
            <div><dt>拼圖</dt><dd>{progress}%</dd></div>
          </dl>
        </article>
      </div>
      <p className="student-relation-caption">這張地圖只呈現此裝置上的學習進度；不會公開個人資料。</p>
    </section>
  );
}
