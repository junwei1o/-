import React, { type CSSProperties } from "react";
import { Check } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import "./ThemeSwitcher.css";

/**
 * 全站外觀主題切換器：潮境／彩旗／藏書票／晴光。
 * 每張卡以該主題的紙色、主色與點綴色做即時預覽，選擇即寫入本機。
 */
export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <fieldset className="theme-switcher">
      <legend className="theme-switcher-label">外觀主題</legend>
      <div className="theme-switcher-grid" role="radiogroup" aria-label="全站外觀主題">
        {themes.map((t) => {
          const active = t.id === theme;
          const vars = {
            "--tc-paper": t.swatch.paper,
            "--tc-tidal": t.swatch.tidal,
            "--tc-coral": t.swatch.coral,
          } as CSSProperties;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`theme-card ${active ? "is-active" : ""}`}
              style={vars}
              onClick={() => setTheme(t.id)}
            >
              <span className="theme-card-preview" aria-hidden="true">
                <span className="theme-card-dot theme-card-dot--main" />
                <span className="theme-card-dot theme-card-dot--accent" />
              </span>
              <span className="theme-card-name">{t.label}</span>
              <span className="theme-card-hint">{t.hint}</span>
              {active && (
                <span className="theme-card-check" aria-hidden="true">
                  <Check size={13} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
