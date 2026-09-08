import React from "react";
import { useLocation } from "wouter";
import {
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
  tone,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tips: string[];
  tone: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${tone}`}>
      <header className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </header>
      <ul className="space-y-2" role="list">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2 text-[15px] leading-relaxed text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function StudyTips() {
  const [, setLocation] = useLocation();

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50" aria-labelledby="study-tips-title">
      <div className="mx-auto w-[min(100%-2rem,960px)] py-8">
        <button type="button" className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-800" onClick={() => setLocation("/")}>
          ← 返回航海儀表板
        </button>

        <header className="mb-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-7 text-white shadow-md">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium tracking-wide text-slate-300">
            <Lightbulb size={16} aria-hidden="true" /> 讀書技巧與應試策略
          </p>
          <h1 id="study-tips-title" className="text-2xl font-bold sm:text-3xl">
            把實力穩穩換成分數的方法
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-200">
            這些方法不分年級都適用：平時練習可以養成習慣，正式考試時能幫助你冷靜發揮。
            從審題、時間安排到各學科的答題眉角，一步步練熟，遇到難題也能從容應對。
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
            <Target size={16} aria-hidden="true" /> {CORE_PRINCIPLE}
          </div>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <TipCard icon={Compass} title="通用答題原則" subtitle="每一種考試都用得上的基本功" tips={GENERAL_STUDY_TIPS} tone="sm:col-span-2" />
          {SUBJECT_STUDY_TIPS.map((group) => (
            <TipCard
              key={group.id}
              icon={SUBJECT_ICONS[group.id] ?? Lightbulb}
              title={group.title}
              subtitle={group.subtitle}
              tips={group.tips}
              tone=""
            />
          ))}
          <TipCard icon={Brain} title="素養題這樣想" subtitle="結合情境、跨領域與開放題" tips={LITERACY_TIPS} tone="" />
          <TipCard icon={HeartPulse} title="考場心態與時間" subtitle="冷靜下來，實力才出得來" tips={MINDSET_TIPS} tone="" />
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="study-tips-checklist-title">
          <header className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ListChecks size={20} aria-hidden="true" />
            </span>
            <h2 id="study-tips-checklist-title" className="text-lg font-bold text-slate-900">
              下次練習就可以試的三步驟
            </h2>
          </header>
          <ol className="grid gap-3 sm:grid-cols-3" role="list">
            {[
              { icon: Clock, text: "作答前：先花 10 秒圈出題目的關鍵字與「正確／不正確」等判斷詞。" },
              { icon: PenLine, text: "作答中：卡住超過 2 分鐘先跳過；不會的題也寫下相關算式或重點。" },
              { icon: BookOpenText, text: "作答後：預留時間檢查答案位置、單位與錯別字，不提前交卷。" },
            ].map((step, index) => (
              <li key={step.text} className="flex gap-3 rounded-xl bg-slate-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-700">
                  <step.icon size={15} className="mr-1 inline-block align-[-2px] text-slate-500" aria-hidden="true" />
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
