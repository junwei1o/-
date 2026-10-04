import * as React from "react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { findFeatureSearchResults } from "@/lib/featureSearch";

type FeatureSearchPanelProps = {
  query: string;
  onQueryChange: (next: string) => void;
  onSelect: (href: string) => void;
};

/**
 * 功能搜尋面板（⌘K／Ctrl+K 開啟）。
 *
 * 本模組是 cmdk 在 graph 裡的唯一入口：由 TopNavigation 以 React.lazy 動態載入，
 * 讓 cmdk 與功能搜尋資料表的 chunk 不進首屏 entry（只在使用者開啟搜尋時才下載）。
 */
export default function FeatureSearchPanel({ query, onQueryChange, onSelect }: FeatureSearchPanelProps) {
  const searchResults = React.useMemo(() => findFeatureSearchResults(query), [query]);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        autoFocus
        value={query}
        onValueChange={onQueryChange}
        placeholder="搜尋演練、錯題、遠征…"
        aria-label="搜尋學習功能"
      />
      <CommandList>
        {searchResults.length ? (
          <CommandGroup heading={query ? `符合「${query}」的功能` : "熱門功能入口"}>
            {searchResults.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => onSelect(item.href)}
                  className="global-feature-search-item"
                >
                  <span className="global-feature-search-icon"><Icon size={19} aria-hidden="true" /></span>
                  <span className="global-feature-search-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : (
          <p className="global-feature-search-empty" role="status">找不到「{query}」；可嘗試「演練」、「錯題」或「遠征」。</p>
        )}
      </CommandList>
    </Command>
  );
}
