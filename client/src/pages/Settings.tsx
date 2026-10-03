import React from "react";
import { useLocation } from "wouter";
import {
  BarChart3,
  Download,
  School,
  Settings as SettingsIcon,
  UserRound,
} from "lucide-react";
import BackupPanel from "@/components/bx/BackupPanel";
import PrefsPanel from "@/components/bx/PrefsPanel";
import { CloudSyncSettings } from "@/components/CloudModePrompt";
import { PinCloudSyncPanel } from "@/components/PinCloudSyncPanel";
import ParentLearningView from "@/components/ParentLearningView";
import { LogoutButton } from "@/components/AuthGate";
import BackupButton from "@/components/BackupButton";
import { getSession } from "@/game/session";
import { SettingsSection, SettingsGroup, SettingsNav, BackToTop } from "./settings/ui";
import { CompanionSection } from "./settings/CompanionSection";
import { DiagnosticsSection } from "./settings/DiagnosticsSection";
import { GrowthSections } from "./settings/GrowthSections";
import {
  AccessibilitySection,
  AppearanceSection,
  LearningSection,
  PrivacySection,
} from "./settings/PlaybackSections";
import "./settings/settings.css";

// 測試與其他模組從 ./Settings 具名匯入；重新匯出以維持公開 API。
export { buildDiagnosticSummary } from "./settings/settingsLogic";

const NAV_GROUPS = [
  { id: "group-play", label: "遊玩與外觀" },
  { id: "group-companion", label: "伴讀與隱私" },
  { id: "group-backup", label: "備份與同步" },
  { id: "group-growth", label: "探險與成長" },
  { id: "group-school", label: "親師與班級" },
  { id: "group-advanced", label: "帳號與進階" },
];

function AccountSection() {
  const session = getSession();
  return (
    <SettingsSection
      className="settings-account-card"
      icon={<UserRound size={20} />}
      eyebrow="帳號"
      title="帳號"
      titleId="account-title"
      description="登出後會回到登入頁。本機學習進度會保留，下次登入同名帳號即可接回。"
    >
      <p className="settings-account-current">
        目前登入：<strong>{session?.name ?? "未登入"}</strong>
        {session?.role === "teacher" ? "（老師）" : ""}
      </p>
      <div className="cloud-actions cloud-actions-left">
        <LogoutButton className="settings-secondary-button">
          登出並切換帳號
        </LogoutButton>
      </div>
    </SettingsSection>
  );
}

function SourceBackupSection() {
  return (
    <SettingsSection
      className="settings-backup-card"
      icon={<Download size={20} />}
      eyebrow="離線架站"
      title="一鍵備份全站"
      titleId="backup-title"
      description="下載完整原始碼 ZIP 到本機，解壓後依 README 步驟即可離線架站。包含前端、後端、題庫、遷移腳本與所有設定檔，不含 node_modules。與上方「我的航海日誌備份」（只備份學習資料）不同，這裡備份的是整個網站程式。"
    >
      <div className="cloud-actions cloud-actions-left">
        <BackupButton className="settings-secondary-button" />
      </div>
    </SettingsSection>
  );
}

export default function Settings() {
  const [, setLocation] = useLocation();

  return (
    <main className="settings-page" aria-labelledby="settings-title">
      <div className="settings-page-inner">
        <button type="button" className="settings-back-button" onClick={() => setLocation("/")}>
          ← 返回航海儀表板
        </button>

        <header className="settings-page-header">
          <div className="settings-page-heading">
            <span className="settings-page-icon" aria-hidden="true"><SettingsIcon size={22} /></span>
            <div>
              <p className="settings-eyebrow">資料與安全</p>
              <h1 id="settings-title">設定</h1>
            </div>
          </div>
          <p>調整外觀、學習難度與無障礙，管理隱私、備份同步與帳號；家長與老師可在最下方「船長室」查看本機診斷紀錄。多數設定只保存在這台裝置，不會上傳到伺服器。</p>
        </header>

        <SettingsNav groups={NAV_GROUPS} />

        <SettingsGroup id="group-play" label="遊玩與外觀" hint="主題配色、內容等級、難度、無障礙與顯示偏好">
          <AppearanceSection />
          <LearningSection />
          <AccessibilitySection />
          <PrefsPanel />
        </SettingsGroup>

        <SettingsGroup id="group-companion" label="伴讀與隱私" hint="深度伴讀的 AI 代理、匿名學習數據">
          <CompanionSection />
          <PrivacySection />
        </SettingsGroup>

        <SettingsGroup id="group-backup" label="備份與同步" hint="本機備份、雲端船籍與 PIN 雲端備份">
          <BackupPanel />
          <CloudSyncSettings />
          <PinCloudSyncPanel />
        </SettingsGroup>

        <SettingsGroup id="group-growth" label="我的探險與成長" hint="頭像主題、探險日誌、圖鑑與稱號">
          <GrowthSections />
        </SettingsGroup>

        <SettingsGroup id="group-school" label="親師與班級" hint="學習報告、教室、家長視角">
          <SettingsSection
            className="settings-report-link-card"
            icon={<BarChart3 size={20} />}
            eyebrow="學習成效"
            title="學習分析報告"
            titleId="learning-report-link-title"
            description="查看各科正確率、弱項標籤、每日答題量，設定本週目標並列印學習報告。"
          >
            <button type="button" className="settings-primary-button" onClick={() => setLocation("/learning-report")}>開啟學習報告</button>
          </SettingsSection>

          <SettingsSection
            className="settings-report-link-card"
            icon={<School size={20} />}
            eyebrow="班級"
            title="教室"
            titleId="classroom-link-title"
            description="老師可建立班級、指派作業並查看班級報表；學生用班級碼加入並完成作業。答題榜則記錄每場答題的時間、花費時間與作答者（含遊客）。"
          >
              <div className="settings-cloud-actions">
                <button type="button" className="settings-primary-button" onClick={() => setLocation("/class")}>我的教室（學生）</button>
                <button type="button" className="settings-secondary-button" onClick={() => setLocation("/answer-board")}>答題榜（含遊客）</button>
              </div>
            </SettingsSection>

            <ParentLearningView />
        </SettingsGroup>

        <SettingsGroup id="group-advanced" label="帳號與進階" hint="帳號、離線架站、家長／老師除錯工具">
          <AccountSection />
          <SourceBackupSection />
          <DiagnosticsSection />
        </SettingsGroup>
      </div>

      <BackToTop />
    </main>
  );
}
