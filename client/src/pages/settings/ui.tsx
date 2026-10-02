// 設定頁共用展示元件：統一卡殼、開關列、具方向鍵導航的單選群組、
// 分區導航（scroll-spy）、回到頂部、分組容器。刻意不引入 shadcn，以沿用全站航海設計語言。
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────── 統一卡片外殼（圖標＋eyebrow＋標題＋說明） ───────────── */

interface SettingsSectionProps {
  id?: string;
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  titleId?: string;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
  headingClassName?: string;
}

export function SettingsSection({
  id,
  icon,
  eyebrow,
  title,
  titleId,
  description,
  className,
  children,
}: SettingsSectionProps) {
  const headingId = titleId ?? (id ? `${id}-title` : undefined);
  return (
    <section
      id={id}
      className={cx("settings-audio-card", className)}
      aria-labelledby={headingId}
    >
      <div className="settings-audio-heading">
        {icon ? <span className="settings-page-icon" aria-hidden="true">{icon}</span> : null}
        <div>
          {eyebrow ? <p className="settings-eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId}>{title}</h2>
        </div>
      </div>
      {description ? <p className="settings-log-description">{description}</p> : null}
      {children}
    </section>
  );
}

/* ───────────── 開關列（role=switch，可存取名稱含標題＋說明） ───────────── */

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="settings-analytics-toggle">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

/* ───────────── 單選群組（roving tabindex＋方向鍵，符合 ARIA radiogroup） ───────────── */

export interface ChoiceOption {
  key: string;
  content: ReactNode;
  className?: string;
}

interface ChoiceRadioGroupProps {
  label: string;
  options: ChoiceOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  className?: string;
}

export function ChoiceRadioGroup({ label, options, selectedKey, onSelect, className }: ChoiceRadioGroupProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((option) => option.key === selectedKey);
  const rovingIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const move = useCallback((from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    onSelect(options[next].key);
    itemRefs.current[next]?.focus();
  }, [onSelect, options]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        move(rovingIndex, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        move(rovingIndex, -1);
        break;
      case "Home":
        event.preventDefault();
        move(rovingIndex, -rovingIndex);
        break;
      case "End":
        event.preventDefault();
        move(rovingIndex, options.length - 1 - rovingIndex);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cx("settings-title-choices", className)} role="radiogroup" aria-label={label} onKeyDown={handleKeyDown}>
      {options.map((option, index) => {
        const selected = option.key === selectedKey;
        return (
          <button
            key={option.key}
            ref={(element) => { itemRefs.current[index] = element; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === rovingIndex ? 0 : -1}
            className={cx("settings-title-choice", option.className, selected && "is-selected")}
            onClick={() => onSelect(option.key)}
          >
            {option.content}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── 分區導航（sticky chips＋IntersectionObserver scroll-spy） ───────────── */

export interface SettingsNavGroup {
  id: string;
  label: string;
}

export function SettingsNav({ groups }: { groups: SettingsNavGroup[] }) {
  const [activeId, setActiveId] = useState<string>(groups[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = groups
      .map((group) => document.getElementById(group.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.6, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [groups]);

  const jumpTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <nav className="settings-nav" aria-label="設定分區導覽">
      {groups.map((group) => (
        <button
          key={group.id}
          type="button"
          className={cx("settings-nav__chip", activeId === group.id && "is-active")}
          aria-current={activeId === group.id ? "true" : undefined}
          onClick={() => jumpTo(group.id)}
        >
          {group.label}
        </button>
      ))}
    </nav>
  );
}

/* ───────────── 回到頂部 ───────────── */

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      className="settings-back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
      aria-label="回到設定頁頂部"
    >
      ↑ 頂部
    </button>
  );
}

/* ───────────── 分組容器（role=group，視覺分區標題不進 heading 大綱） ───────────── */

export function SettingsGroup({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="settings-group" role="group" aria-label={label}>
      <div className="settings-group-head" aria-hidden="true">
        <p className="settings-group-kicker">{label}</p>
        {hint ? <p className="settings-group-hint">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
