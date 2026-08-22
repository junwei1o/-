import React, { useCallback, useEffect, useState } from "react";
import { Compass, Map, Settings, Swords, X } from "lucide-react";
import { getOnboardingComplete, saveOnboardingComplete } from "@/utils/storage";
import { useLocation } from "wouter";

const STEPS = [
  { title: "歡迎來到 Academy Expedition", text: "這是一段把課綱知識變成冒險的學習旅程。", icon: Compass },
  { title: "探索知識島嶼", text: "從地圖上的國文、數學、英文與自然島嶼開始挑戰。", icon: Map },
  { title: "答題就是戰鬥", text: "答對會攻擊怪物，答錯會遭到反擊；連續答對 3 題可觸發暴擊。", icon: Swords },
  { title: "隨時調整設定", text: "到設定頁查看學習報告、調整音量與管理資料。", icon: Settings },
];

export default function OnboardingGuide() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(() => !getOnboardingComplete());
  const finish = useCallback(() => {
    saveOnboardingComplete(true);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const autoCompleteTimer = window.setTimeout(finish, 10_000);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(autoCompleteTimer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [finish, open]);

  if (!open) return null;
  const current = STEPS[step];
  const Icon = current.icon;
  return <div className="onboarding-backdrop" role="presentation"><section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><button type="button" className="onboarding-close" aria-label="關閉新手導覽" onClick={finish}><X size={18} /></button><span className="onboarding-icon" aria-hidden="true"><Icon size={28} /></span><p className="settings-eyebrow">新手導覽 {step + 1}/{STEPS.length}</p><h2 id="onboarding-title">{current.title}</h2><p>{current.text}</p><p className="onboarding-auto-close" role="status">若暫時無法操作，此提示會在 10 秒後自動完成並關閉。</p><div className="onboarding-dots" aria-label={`第 ${step + 1} 步，共 ${STEPS.length} 步`}>{STEPS.map((item, index) => <span key={item.title} className={index === step ? "active" : ""} />)}</div><div className="onboarding-actions">{step > 0 && <button type="button" className="settings-secondary-button" onClick={() => setStep(step - 1)}>上一步</button>}{step < STEPS.length - 1 ? <button type="button" className="settings-primary-button" onClick={() => setStep(step + 1)}>下一步</button> : <><button type="button" className="settings-secondary-button" onClick={() => { finish(); setLocation("/battle?demo=1"); }}>先體驗教學戰鬥</button><button type="button" className="settings-primary-button" onClick={finish}>開始探險</button></>}</div></section></div>;
}
