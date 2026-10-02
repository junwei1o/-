// 我的探險與成長：頭像與主題色、三十天探險日誌牆、探險家圖鑑、稱號展示櫃。
import React, { useEffect, useMemo, useState } from "react";
import { BookMarked, Crown, Palette, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  getLimitedTitles,
  getPlayerProfile,
  getRareMonsterDefeats,
  getSelectedTitle,
  PLAYER_AVATARS,
  PLAYER_THEME_COLORS,
  savePlayerProfile,
  saveSelectedTitle,
  type PlayerAvatarId,
  type PlayerThemeColor,
} from "@/utils/storage";
import { getRareMonsters } from "@/game/expeditionContent";
import { getJournalEntries } from "@/game/adventureJournal";
import { SettingsSection, ChoiceRadioGroup, type ChoiceOption } from "./ui";
import { formatTimestamp, titleLabel } from "./settingsLogic";

const RARE_CODEX = (["chinese", "math", "english", "science"] as const).flatMap((subject) => getRareMonsters(subject));
const THEME_LABELS: Record<string, string> = { ocean: "海洋藍", sunset: "夕陽橘", forest: "森林綠" };
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_TITLE_KEY = "__default__";

export function GrowthSections() {
  const [rareDefeats, setRareDefeats] = useState(() => getRareMonsterDefeats());
  const [limitedTitles, setLimitedTitles] = useState(() => getLimitedTitles());
  const [selectedTitle, setSelectedTitle] = useState(() => getSelectedTitle());
  const [playerProfile, setPlayerProfile] = useState(() => getPlayerProfile());
  const journalEntries = useMemo(
    () => getJournalEntries().filter((entry) => entry.date >= Date.now() - THIRTY_DAYS_MS),
    [],
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === "xue-adventure-rare-monster-defeats-v1"
        || event.key === "xue-adventure-limited-titles-v1"
        || event.key === "xue-adventure-selected-title-v1"
        || event.key === null
      ) {
        setRareDefeats(getRareMonsterDefeats());
        setLimitedTitles(getLimitedTitles());
        setSelectedTitle(getSelectedTitle());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleTitleSelection = (title: string | null) => {
    const saved = saveSelectedTitle(title);
    setSelectedTitle(saved);
    toast.success(saved ? `已展示「${titleLabel(saved)}」稱號` : "已改回預設航海階級");
  };

  const handleProfileUpdate = (update: Partial<typeof playerProfile>) => {
    const saved = savePlayerProfile(update);
    setPlayerProfile(saved);
    document.documentElement.dataset.playerTheme = saved.themeColor;
    toast.success("個人化外觀已更新");
  };

  const avatarOptions: ChoiceOption[] = PLAYER_AVATARS.map((avatar) => ({
    key: avatar.id,
    content: <>{avatar.emoji} {avatar.label}</>,
  }));

  const themeOptions: ChoiceOption[] = PLAYER_THEME_COLORS.map((theme) => ({
    key: theme,
    className: `theme-choice-${theme}`,
    content: (<><Palette size={14} aria-hidden="true" />{THEME_LABELS[theme] ?? theme}</>),
  }));

  const titleOptions: ChoiceOption[] = [
    { key: DEFAULT_TITLE_KEY, content: "預設航海階級" },
    ...limitedTitles.map((title) => ({ key: title, content: titleLabel(title) })),
  ];

  return (
    <>
      <SettingsSection
        className="settings-showcase-card"
        icon={<UserRound size={20} />}
        eyebrow="我的探險檔案"
        title="頭像與主題色"
        titleId="profile-customization-title"
        description="外觀只儲存在這台裝置，可隨時調整成最符合自己的探險風格。"
      >
        <ChoiceRadioGroup
          label="選擇學生頭像"
          options={avatarOptions}
          selectedKey={playerProfile.avatar}
          onSelect={(key) => handleProfileUpdate({ avatar: key as PlayerAvatarId })}
        />
        <div className="settings-choice-gap" aria-hidden="true" />
        <ChoiceRadioGroup
          label="選擇主題色"
          options={themeOptions}
          selectedKey={playerProfile.themeColor}
          onSelect={(key) => handleProfileUpdate({ themeColor: key as PlayerThemeColor })}
        />
      </SettingsSection>

      <SettingsSection
        className="settings-showcase-card"
        icon={<BookMarked size={20} />}
        eyebrow="我的成長"
        title="三十天探險日誌牆"
        titleId="growth-journal-title"
      >
        {journalEntries.length ? (
          <ol className="settings-log-list" aria-label="最近三十天的探險日誌">
            {journalEntries.slice(0, 30).map((entry) => (
              <li className="settings-log-item" key={entry.id}>
                <span className="settings-log-item-icon" aria-hidden="true">📜</span>
                <div className="settings-log-item-content">
                  <strong>{entry.subject}・{entry.sessionType === "battle" ? "對戰航線" : "練習航線"}</strong>
                  <time>{formatTimestamp(entry.date)}</time>
                  <p>{entry.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="settings-showcase-empty" role="status">
            最近三十天尚無探險日誌；完成答題後，這裡會記錄你的真實成長足跡。
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        className="settings-showcase-card"
        icon={<BookMarked size={20} />}
        eyebrow="稀有遭遇"
        title="探險家圖鑑"
        titleId="codex-title"
        description="稀有守門者會在連續答對至少 10 題後才有機會出現。遇見並完成知識挑戰後可收藏限定稱號；圖鑑僅顯示本機探險紀錄。"
      >
        <ul className="settings-codex-grid" aria-label="十二種稀有怪物圖鑑">
          {RARE_CODEX.map((monster) => {
            const defeats = rareDefeats[monster.id] ?? 0;
            const unlocked = defeats > 0;
            return (
              <li key={monster.id} className={`settings-codex-entry${unlocked ? " is-unlocked" : ""}`}>
                <span className="settings-codex-emoji" aria-hidden="true">{monster.emoji}</span>
                <div>
                  <strong>{monster.name}</strong>
                  <p>{monster.description}</p>
                  <small>限定稱號：{titleLabel(monster.title ?? monster.name)}</small>
                </div>
                <b aria-label={`${monster.name} 擊敗 ${defeats} 次`}>{unlocked ? `擊敗 ${defeats}` : "尚未發現"}</b>
              </li>
            );
          })}
        </ul>
      </SettingsSection>

      <SettingsSection
        className="settings-showcase-card"
        icon={<Crown size={20} />}
        eyebrow="個人展示"
        title="稱號展示櫃"
        titleId="title-showcase-title"
        description="選擇已解鎖的限定稱號，它會顯示在首頁的探險狀態列。"
      >
        <ChoiceRadioGroup
          label="選擇首頁展示稱號"
          options={titleOptions}
          selectedKey={selectedTitle ?? DEFAULT_TITLE_KEY}
          onSelect={(key) => handleTitleSelection(key === DEFAULT_TITLE_KEY ? null : key)}
        />
        {limitedTitles.length === 0 ? (
          <p className="settings-showcase-empty" role="status">
            尚未解鎖限定稱號。保持連續答對，尋找稀有守門者吧。
          </p>
        ) : null}
      </SettingsSection>
    </>
  );
}
