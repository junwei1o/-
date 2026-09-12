import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bug, Compass, Search } from "lucide-react";
import {
  HOME_FEATURE_GROUPS,
  normalizeFeatureQuery,
} from "@/lib/homeFeatureDirectory";
import "./FeaturesDirectory.css";

export function FeaturesDirectory() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const q = normalizeFeatureQuery(query);
    if (!q) return HOME_FEATURE_GROUPS;
    return HOME_FEATURE_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        normalizeFeatureQuery(`${group.label}${group.description}${item.label}${item.description}`).includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const totalCount = useMemo(
    () => HOME_FEATURE_GROUPS.reduce((sum, group) => sum + group.items.length, 0),
    [],
  );

  return (
    <main className="features-page" aria-labelledby="features-title">
      <div className="features-page-inner">
        <button type="button" className="features-back-button" onClick={() => setLocation("/")}>
          <ArrowLeft size={16} aria-hidden="true" /> 返回航海儀表板
        </button>

        <header className="features-page-header">
          <div className="features-page-heading">
            <span className="features-page-icon" aria-hidden="true"><Compass size={22} /></span>
            <div>
              <p className="features-eyebrow">ALL EXPEDITION FEATURES</p>
              <h1 id="features-title">全站功能總覽</h1>
            </div>
          </div>
          <p>
            寶島探險家目前提供 <strong>{totalCount}</strong> 個入口，分成 {HOME_FEATURE_GROUPS.length} 個主題。
            所有入口都會前往既有的單機學習功能，不會建立空白或重複頁面。
          </p>
        </header>

        <div className="features-search-bar">
          <label className="features-search" htmlFor="features-search-input">
            <Search size={18} aria-hidden="true" />
            <span className="visually-hidden">搜尋功能</span>
            <input
              id="features-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：戰鬥、報告、天文、設定"
              autoComplete="off"
            />
          </label>
        </div>

        {visibleGroups.length ? (
          <div className="features-groups">
            {visibleGroups.map((group) => (
              <section key={group.id} className="features-group" aria-labelledby={`features-group-${group.id}`}>
                <div className="features-group-heading">
                  <h2 id={`features-group-${group.id}`}>{group.label}</h2>
                  <p>{group.description}</p>
                </div>
                <div className="features-grid">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className="features-card"
                        onClick={() => setLocation(item.href)}
                        aria-label={`前往 ${item.label}：${item.description}`}
                      >
                        <Icon size={20} aria-hidden="true" />
                        <span><strong>{item.label}</strong><small>{item.description}</small></span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="features-empty" role="status">
            找不到「{query}」相關功能。請試試戰鬥、報告、天文或設定。
          </p>
        )}

        <button type="button" className="features-debug-entry" onClick={() => setLocation("/settings#diagnostics")}>
          <Bug size={19} aria-hidden="true" />
          <span><strong>調試參數</strong><small>前往安全診斷、儲存錯誤日誌與遮蔽後的診斷摘要；不顯示帳號、答案或機密參數。</small></span>
        </button>
      </div>
    </main>
  );
}

export default FeaturesDirectory;