import React from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BookOpenText,
  Brain,
  Calculator,
  Clock,
  Compass,
  Globe2,
  HeartPulse,
  Languages,
  Leaf,
  Lightbulb,
  ListChecks,
  PenLine,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  CORE_PRINCIPLE,
  GENERAL_STUDY_TIPS,
  LITERACY_TIPS,
  MINDSET_TIPS,
  SUBJECT_STUDY_TIPS,
} from "@/lib/studyTips";
import "./HubPages.css";

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  chinese: BookOpenText,
  math: Calculator,
  social: Globe2,
  science: Leaf,
  english: Languages,
};

function TipCard({
  icon: Icon,
  title,
  subtitle,
  tips,
  wide,
  variant,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tips: string[];
  wide?: boolean;
  variant?: "tide" | "coral";
}) {
  return (
    <section className={`app-card study-tip-card ${wide ? "study-tip-card--wide" : ""}`}>
      <header className="study-tip-head">
        <span className={`study-tip-icon ${variant === "coral" ? "study-tip-icon--coral" : ""}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <ul role="list">
        {tips.map((tip) => (
          <li key={tip}>
            <span className="study-tip-dot" aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  { icon: Clock, text: "作答前：先花 10 秒圈出題目的關鍵字與「正確／不正確」等判斷詞。" },
  { icon: PenLine, text: "作答中：卡住超過 2 分鐘先跳過；不會的題也寫下相關算式或重點。" },
  { icon: BookOpenText, text: "作答後：預留時間檢查答案位置、單位與錯別字，不提前交卷。" },
];

export default function StudyTips() {
  const [, setLocation] = useLocation();

  return (
    <main className="hub-page" aria-labelledby="study-tips-title">
      <button type="button" className="region-back-link" onClick={() => setLocation("/")}>
        <ArrowLeft size={16} aria-hidden="true" /> 返回航海主頁
      </button>

      <header className="hub-header">
        <p className="hub-eyebrow">STUDY STRATEGIES</p>
        <h1 className="hub-title" id="study-tips-title">
          <Lightbulb size={26} aria-hidden="true" /> 讀書技巧與應試策略
        </h1>
        <p className="hub-sub">
          把實力穩穩換成分數的方法。這些方法不分年級都適用：平時練習養成習慣，正式考試時能冷靜發揮；從審題、時間安排到各學科答題眉角，一步步練熟，遇到難題也能從容應對。
        </p>
        <p className="hub-core-tag">
          <Target size={15} aria-hidden="true" /> {CORE_PRINCIPLE}
        </p>
      </header>

      <div className="study-tips-grid">
        <TipCard icon={Compass} title="通用答題原則" subtitle="每一種考試都用得上的基本功" tips={GENERAL_STUDY_TIPS} wide />
        {SUBJECT_STUDY_TIPS.map((group) => (
          <TipCard
            key={group.id}
            icon={SUBJECT_ICONS[group.id] ?? Lightbulb}
            title={group.title}
            subtitle={group.subtitle}
            tips={group.tips}
          />
        ))}
        <TipCard icon={Brain} title="素養題這樣想" subtitle="結合情境、跨領域與開放題" tips={LITERACY_TIPS} variant="coral" />
        <TipCard icon={HeartPulse} title="考場心態與時間" subtitle="冷靜下來，實力才出得來" tips={MINDSET_TIPS} variant="coral" />
      </div>

      <section className="app-card study-steps-card" aria-labelledby="study-tips-checklist-title">
        <header>
          <span className="study-tip-icon">
            <ListChecks size={20} aria-hidden="true" />
          </span>
          <h2 id="study-tips-checklist-title">下次練習就可以試的三步驟</h2>
        </header>
        <ol className="study-steps-list" role="list">
          {STEPS.map((step, index) => (
            <li key={step.text}>
              <span className="study-step-num" aria-hidden="true">{index + 1}</span>
              <p>
                <step.icon size={15} aria-hidden="true" />
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
