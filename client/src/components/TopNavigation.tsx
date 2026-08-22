import * as React from "react";
import { BarChart3, BookOpenText, BrainCircuit, ClipboardList, Compass, Orbit, Search, Settings, Swords, Telescope, UsersRound, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findFeatureSearchResults } from "@/lib/featureSearch";

type TopNavItem = {
  id: "home" | "paper" | "map" | "journal" | "astronomy" | "principles" | "insights" | "errorStats" | "support" | "settings";
  label: string;
  icon: LucideIcon;
  href: string;
};

const ITEMS: TopNavItem[] = [
  { id: "home", label: "航海儀表板", icon: Compass, href: "/" },
  { id: "paper", label: "試卷", icon: ClipboardList, href: "/practice" },
  { id: "map", label: "我的地圖", icon: Compass, href: "/map" },
  { id: "journal", label: "探險日誌", icon: BookOpenText, href: "/adventure-journal" },
  { id: "astronomy", label: "天文館", icon: Orbit, href: "/astronomy" },
  { id: "principles", label: "原理引導", icon: Telescope, href: "/principles" },
  { id: "insights", label: "洞察", icon: BrainCircuit, href: "/learning-insights" },
  { id: "errorStats", label: "錯誤統計", icon: BarChart3, href: "/error-statistics" },
  { id: "support", label: "陪讀摘要", icon: UsersRound, href: "/learning-summary" },
  { id: "settings", label: "設定", icon: Settings, href: "/settings" },
];

const MOBILE_PRIORITY_ITEMS: Array<{
  id: TopNavItem["id"] | "duel";
  label: string;
  icon: LucideIcon;
  href: string;
}> = [
  { id: "home", label: "首頁", icon: Compass, href: "/" },
  { id: "paper", label: "試卷", icon: ClipboardList, href: "/practice" },
  { id: "duel", label: "知識決鬥", icon: Swords, href: "/knowledge-duel" },
  { id: "map", label: "地圖", icon: Compass, href: "/map" },
];

function getActiveItem(location: string): TopNavItem["id"] {
  const [pathname, search = ""] = location.split("?");
  const screen = new URLSearchParams(search).get("screen");

  if (pathname === "/astronomy" || pathname.startsWith("/astronomy/")) return "astronomy";
  if (pathname === "/principles" || pathname.startsWith("/principles/")) return "principles";
  if (pathname === "/learning-insights") return "insights";
  if (pathname === "/error-statistics") return "errorStats";
  if (pathname === "/learning-summary") return "support";
  if (pathname === "/settings") return "settings";
  if (pathname === "/adventure-journal") return "journal";
  if (pathname === "/guardian") return "map";
  if (pathname === "/map") return "map";
  if (pathname === "/" || pathname === "") return "home";
  if (pathname === "/practice") return "paper";
  void screen;
  return "paper";
}

export default function TopNavigation() {
  const [location, setLocation] = useLocation();
  const activeItem = getActiveItem(location);
  const activePath = location.split("?")[0];
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchResults = React.useMemo(() => findFeatureSearchResults(searchQuery), [searchQuery]);

  React.useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function openFeatureSearch() {
    setSearchQuery("");
    setSearchOpen(true);
  }

  function navigateToFeature(href: string) {
    setSearchOpen(false);
    setSearchQuery("");
    setLocation(href);
  }

  return (
    <header className="global-top-nav">
      <div className="global-top-nav-inner">
        <div className="global-top-brand" aria-label="寶島探險家：台灣學習航海儀表板">
          <span className="global-top-brand-mark" aria-hidden="true">
            <Compass size={20} strokeWidth={2.3} />
          </span>
          <span className="global-top-brand-copy">
            <b>寶島探險家</b>
            <small>台灣學習航海儀表板</small>
          </span>
        </div>
        <nav className="global-top-nav-links" aria-label="主要功能選單" data-active-route={activeItem}>
          {ITEMS.map(({ id, label, icon: Icon, href }) => {
            const active = activeItem === id;
            return (
              <button
                key={id}
                type="button"
                className={`global-top-nav-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                title={label}
                onClick={() => setLocation(href)}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.9} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          className="global-feature-search-trigger"
          aria-label="搜尋功能"
          title="搜尋功能（Ctrl 或 Command + K）"
          onClick={openFeatureSearch}
        >
          <Search size={17} aria-hidden="true" />
          <span>搜尋功能</span>
        </button>
        <nav className="global-mobile-priority-nav" aria-label="手機版核心入口">
          {MOBILE_PRIORITY_ITEMS.map(({ id, label, icon: Icon, href }) => {
            const active = activePath === href;
            return (
              <button
                key={id}
                type="button"
                className={`global-mobile-priority-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setLocation(href)}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.9} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="global-feature-search-dialog p-0 sm:max-w-[580px]">
          <DialogHeader className="sr-only">
            <DialogTitle>搜尋學習功能</DialogTitle>
            <DialogDescription>輸入功能、玩法或學習需求的關鍵字。</DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false}>
            <CommandInput
              autoFocus
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="搜尋戰鬥、卡牌、守護者、錯題…"
              aria-label="搜尋學習功能"
            />
            <CommandList>
              {searchResults.length ? (
                <CommandGroup heading={searchQuery ? `符合「${searchQuery}」的功能` : "熱門功能入口"}>
                  {searchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => navigateToFeature(item.href)}
                        className="global-feature-search-item"
                      >
                        <span className="global-feature-search-icon"><Icon size={19} aria-hidden="true" /></span>
                        <span className="global-feature-search-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : (
                <p className="global-feature-search-empty" role="status">找不到「{searchQuery}」；可嘗試「戰鬥」、「卡牌」、「守護者」或「錯題」。</p>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </header>
  );
}
