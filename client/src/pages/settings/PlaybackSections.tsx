// 遊玩體驗相關分區：外觀主題、學習設定、無障礙、匿名數據。
import React, { useEffect, useState } from "react";
import { Accessibility, BarChart3, GraduationCap, Palette } from "lucide-react";
import { toast } from "sonner";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { ReadingScaleControl } from "@/components/ReadingScaleControl";
import { useSoundEnabled } from "@/lib/soundPreference";
import {
  getAccessibilityPrefs,
  getAnalyticsConsent,
  getAnalyticsSummary,
  saveAnalyticsConsent,
  saveAccessibilityPrefs,
  type AccessibilityPrefs,
} from "@/utils/storage";
import {
  loadUserPreferences,
  saveUserPreferences,
  MIN_GRADE,
  MAX_GRADE,
  type UserDifficultyPreference,
  type UserGradeLevel,
} from "@/game/adaptiveLearning";
import { SettingsSection, ToggleRow } from "./ui";

const INTENSITY_LABEL: Record<AccessibilityPrefs["effectIntensity"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};
const INTENSITY_VALUE: Record<AccessibilityPrefs["effectIntensity"], number> = {
  low: 1,
  medium: 2,
  high: 3,
};
const INTENSITY_ORDER: Array<AccessibilityPrefs["effectIntensity"]> = ["low", "medium", "high"];

export function AppearanceSection() {
  return (
    <SettingsSection
      className="settings-appearance-card"
      icon={<Palette size={20} />}
      eyebrow="個人化外觀"
      title="外觀主題"
      titleId="appearance-title"
      description="選擇整套配色與紙張氛圍，設定會立即套用並保存在這台裝置。"
    >
      <ThemeSwitcher />
    </SettingsSection>
  );
}

export function LearningSection() {
  const [prefs, setPrefs] = useState(() => loadUserPreferences());

  function handleGradeChange(grade: UserGradeLevel) {
    const next = { ...prefs, gradeLevel: grade };
    setPrefs(next);
    saveUserPreferences(next);
    toast.success(`已將內容等級設為${grade}年級，題目與動畫會以這個程度為主。`);
  }

  function handleDifficultyChange(pref: UserDifficultyPreference) {
    const next = { ...prefs, difficultyPreference: pref };
    setPrefs(next);
    saveUserPreferences(next);
    toast.success(`已切換為「${pref}」模式，試卷難度會自動調整。`);
  }

  return (
    <SettingsSection
      className="settings-learning-card"
      icon={<GraduationCap size={20} />}
      eyebrow="學習航線"
      title="學習設定"
      titleId="learning-settings-title"
      description="調整內容等級與難度偏好，讓題目與動畫課以這個程度為主。設定會保存在這台裝置，下次回來還會記得。"
    >
      <p className="settings-log-description settings-learning-note">
        內容等級決定題目與動畫的內容範圍，上限為六年級；它和玩家等級（Lv.）不同，請依學生目前就讀年級選擇。
      </p>
      <div className="settings-learning-grid">
        <label className="settings-learning-item" htmlFor="settings-grade-select">
          <span>內容等級</span>
          <select
            id="settings-grade-select"
            value={prefs.gradeLevel}
            onChange={(event) => handleGradeChange(Number(event.target.value) as UserGradeLevel)}
            className="home-setting-select"
          >
            {Array.from({ length: MAX_GRADE - MIN_GRADE + 1 }, (_, index) => MIN_GRADE + index).map((grade) => (
              <option key={grade} value={grade}>{grade} 年級</option>
            ))}
          </select>
        </label>
        <label className="settings-learning-item" htmlFor="settings-difficulty-select">
          <span>難度偏好</span>
          <select
            id="settings-difficulty-select"
            value={prefs.difficultyPreference}
            onChange={(event) => handleDifficultyChange(event.target.value as UserDifficultyPreference)}
            className="home-setting-select"
          >
            <option value="簡單優先">簡單優先（避開太難）</option>
            <option value="均衡混合">均衡混合（推薦）</option>
            <option value="挑戰優先">挑戰優先（避開太簡單）</option>
          </select>
        </label>
      </div>
    </SettingsSection>
  );
}

export function AccessibilitySection() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() => getAccessibilityPrefs());
  const [soundEnabled, setSoundEnabled] = useSoundEnabled();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "xue-adventure-accessibility-prefs-v1" || event.key === null) {
        setPrefs(getAccessibilityPrefs());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = (patch: Partial<AccessibilityPrefs>) => setPrefs(saveAccessibilityPrefs(patch));
  const intensityLabel = INTENSITY_LABEL[prefs.effectIntensity];

  return (
    <SettingsSection
      className="settings-accessibility-card"
      icon={<Accessibility size={20} />}
      eyebrow="舒適遊玩"
      title="無障礙設定"
      titleId="accessibility-settings-title"
      description="設定會立即套用並保存在這台裝置。若畫面效果讓你感到不適，可降低特效或開啟動畫簡化。"
    >
      <label className="settings-volume-control" htmlFor="effect-intensity">
        <span>特效強度</span>
        <output htmlFor="effect-intensity" aria-live="polite">{intensityLabel}</output>
      </label>
      <input
        id="effect-intensity"
        aria-label="特效強度"
        className="settings-volume-slider"
        type="range"
        min="1"
        max="3"
        step="1"
        value={INTENSITY_VALUE[prefs.effectIntensity]}
        onChange={(event) => update({ effectIntensity: INTENSITY_ORDER[Number(event.target.value) - 1] })}
        aria-valuetext={intensityLabel}
      />
      <ToggleRow
        title="震動回饋"
        description={prefs.vibrationEnabled ? "已啟用操作觸感回饋" : "已關閉所有觸感回饋"}
        checked={prefs.vibrationEnabled}
        onChange={(next) => update({ vibrationEnabled: next })}
      />
      <ToggleRow
        title="動畫簡化"
        description={prefs.reducedAnimation ? "特效將以短暫淡入淡出呈現" : "保留一般移動、旋轉與粒子效果"}
        checked={prefs.reducedAnimation}
        onChange={(next) => update({ reducedAnimation: next })}
      />
      <ToggleRow
        title="音效回饋"
        description={soundEnabled ? "答題與遊戲的合成音效已開啟" : "已關閉全部合成音效（不含朗讀）"}
        checked={soundEnabled}
        onChange={(next) => setSoundEnabled(next)}
      />
      <p className="settings-log-description" role="status">
        目前採用{intensityLabel}強度特效；{prefs.reducedAnimation ? "動畫已簡化。" : "一般動畫已啟用。"}
      </p>
      <div className="settings-font-size-block">
        <ReadingScaleControl />
      </div>
    </SettingsSection>
  );
}

export function PrivacySection() {
  const [consent, setConsent] = useState(() => getAnalyticsConsent());
  const [summary, setSummary] = useState(() => getAnalyticsSummary());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "xue-adventure-analytics-v1" || event.key === "xue-adventure-analytics-consent-v1" || event.key === null) {
        setConsent(getAnalyticsConsent());
        setSummary(getAnalyticsSummary());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const consentDescription = consent === "accepted"
    ? "目前已開啟本機記錄"
    : consent === "declined"
      ? "目前已關閉本機記錄"
      : "尚未選擇";

  return (
    <SettingsSection
      className="settings-analytics-card"
      icon={<BarChart3 size={20} />}
      eyebrow="隱私選擇"
      title="匿名數據分享"
      titleId="analytics-sharing-title"
      description="資料只保存在目前裝置，用於顯示每日活躍天數、平均遊玩時長、各科卡關題目與練習節奏；不會記錄姓名、答案內容，也不會上傳至伺服器。"
    >
      <ToggleRow
        title="允許匿名記錄"
        description={consentDescription}
        checked={consent === "accepted"}
        onChange={(next) => {
          const value = next ? "accepted" : "declined";
          saveAnalyticsConsent(value);
          setConsent(value);
          setSummary(getAnalyticsSummary());
        }}
      />
      <div className="settings-analytics-summary" aria-label="匿名學習數據摘要">
        <span>活躍天數 <strong>{summary.activeDays}</strong></span>
        <span>平均遊玩 <strong>{Math.round(summary.averagePlayMs / 60000)} 分鐘</strong></span>
        <span>補給使用 <strong>{summary.lowHpPotionUseRate}%</strong></span>
      </div>
    </SettingsSection>
  );
}
