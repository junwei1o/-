import * as React from "react";
import { Award, BarChart3, BookOpenCheck, BookOpenText, CalendarDays, Clapperboard, Compass, Crown, Crosshair, Lightbulb, Map as MapIcon, Menu, Orbit, ScrollText, Search, Settings, Sparkles, Swords, Telescope, Timer, UsersRound, X, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findFeatureSearchResults } from "@/lib/featureSearch";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Path prefixes that should mark this entry as the active destination. */
  activePrefixes?: string[];
};

type NavGroup = { id: string; label: string; items: NavItem[] };

/** Desktop primary bar: the six destinations children use every day. */
const PRIMARY_ITEMS: NavItem[] = [
  { id: "home", label: "首頁", icon: Compass, href: "/", activePrefixes: ["/"] },
  { id: "practice", label: "課綱練習", icon: BookOpenCheck, href: "/practice", activePrefixes: ["/practice"] },
  { id: "map", label: "航海圖", icon: MapIcon, href: "/map", activePrefixes: ["/map", "/regions/"] },
  { id: "battle", label: "答題戰鬥", icon: Swords, href: "/battle", activePrefixes: ["/battle"] },
  { id: "camp", label: "每日營地", icon: CalendarDays, href: "/camp", activePrefixes: ["/camp"] },
  { id: "badges", label: "徽章牆", icon: Award, href: "/badges", activePrefixes: ["/badges"] },
];

/** Everything else lives behind「更多」on desktop and the hamburger on mobile. */
const MORE_ITEMS: NavItem[] = [
  { id: "duel", label: "知識決鬥", icon: Crosshair, href: "/knowledge-duel", activePrefixes: ["/knowledge-duel", "/duel"] },
  { id: "guardian", label: "守護者遠征", icon: Crown, href: "/guardian", activePrefixes: ["/guardian"] },
  { id: "challenge", label: "自我挑戰", icon: Timer, href: "/community", activePrefixes: ["/community"] },
  { id: "journal", label: "探險日誌", icon: BookOpenText, href: "/adventure-journal", activePrefixes: ["/adventure-journal"] },
  { id: "astronomy", label: "天文館", icon: Orbit, href: "/astronomy", activePrefixes: ["/astronomy"] },
  { id: "wisdom", label: "智慧故事館", icon: Sparkles, href: "/wisdom", activePrefixes: ["/wisdom"] },
  { id: "principles", label: "世界原理站", icon: Telescope, href: "/principles", activePrefixes: ["/principles"] },
  { id: "observatory", label: "影視觀測站", icon: Clapperboard, href: "/observatory", activePrefixes: ["/observatory"] },
  { id: "wrong-answers", label: "錯題複習", icon: ScrollText, href: "/wrong-answers", activePrefixes: ["/wrong-answers"] },
  { id: "tips", label: "讀書技巧", icon: Lightbulb, href: "/study-tips", activePrefixes: ["/study-tips"] },
  { id: "insights", label: "學習洞察", icon: BarChart3, href: "/learning-insights", activePrefixes: ["/learning-insights", "/learning-report"] },
  { id: "errorStats", label: "錯題統計", icon: BarChart3, href: "/error-statistics", activePrefixes: ["/error-statistics"] },
  { id: "support", label: "陪讀專區", icon: UsersRound, href: "/learning-summary", activePrefixes: ["/learning-summary"] },
  { id: "settings", label: "設定", icon: Settings, href: "/settings", activePrefixes: ["/settings"] },
];

/** Mobile hamburger groups every destination so small screens never lose an entry. */
const MOBILE_GROUPS: NavGroup[] = [
  {
    id: "learning",
    label: "學習練習",
    items: [
      PRIMARY_ITEMS[1],
      MORE_ITEMS.find((item) => item.id === "wrong-answers")!,
      MORE_ITEMS.find((item) => item.id === "tips")!,
      MORE_ITEMS.find((item) => item.id === "insights")!,
      MORE_ITEMS.find((item) => item.id === "errorStats")!,
    ],
  },
  {
    id: "expedition",
    label: "探險對戰",
    items: [
      PRIMARY_ITEMS[2],
      PRIMARY_ITEMS[3],
      PRIMARY_ITEMS[4],
      PRIMARY_ITEMS[5],
      MORE_ITEMS.find((item) => item.id === "duel")!,
      MORE_ITEMS.find((item) => item.id === "guardian")!,
      MORE_ITEMS.find((item) => item.id === "challenge")!,
      MORE_ITEMS.find((item) => item.id === "journal")!,
    ],
  },
  {
    id: "discovery",
    label: "知識探索館",
    items: [
      MORE_ITEMS.find((item) => item.id === "astronomy")!,
      MORE_ITEMS.find((item) => item.id === "wisdom")!,
      MORE_ITEMS.find((item) => item.id === "principles")!,
      MORE_ITEMS.find((item) => item.id === "observatory")!,
    ],
  },
  {
    id: "support",
    label: "支援與設定",
    items: [
      MORE_ITEMS.find((item) => item.id === "support")!,
      MORE_ITEMS.find((item) => item.id === "settings")!,
    ],
  },
];

/** Fixed bottom quick entries on phones; the hamburger still reaches every feature. */
const MOBILE_PRIORITY_ITEMS: NavItem[] = [PRIMARY_ITEMS[0], PRIMARY_ITEMS[1], PRIMARY_ITEMS[2], PRIMARY_ITEMS[3]];

function isItemActive(item: NavItem, pathname: string) {
  if (item.href === "/") return pathname === "/" || pathname === "";
  return (item.activePrefixes ?? [item.href]).some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`) || pathname.startsWith(prefix));
}

function findActiveItem(pathname: string): NavItem | null {
  const all = [...PRIMARY_ITEMS, ...MORE_ITEMS];
  return all.find((item) => isItemActive(item, pathname)) ?? null;
}

export default function TopNavigation() {
  const [location, setLocation] = useLocation();
  const pathname = location.split("?")[0];
  const activeItem = findActiveItem(pathname);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const morePanelRef = React.useRef<HTMLDivElement>(null);
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

  React.useEffect(() => {
    if (!moreOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (morePanelRef.current && !morePanelRef.current.contains(event.target as Node)) setMoreOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreOpen]);

  function go(href: string) {
    setMoreOpen(false);
    setMobileMenuOpen(false);
    setLocation(href);
  }

  function openFeatureSearch() {
    setSearchQuery("");
    setSearchOpen(true);
  }

  const moreActive = Boolean(activeItem && !PRIMARY_ITEMS.some((item) => item.id === activeItem.id));

  return (
    <header className="global-top-nav">
      <div className="global-top-nav-inner">
        <button type="button" className="global-top-brand" aria-label="寶島探險家：回首頁" onClick={() => go("/")}>
          <span className="global-top-brand-mark" aria-hidden="true">
            <Compass size={20} strokeWidth={2.3} />
          </span>
          <span className="global-top-brand-copy">
            <b>寶島探險家</b>
            <small>台灣學習航海日誌</small>
          </span>
        </button>
        <nav className="global-top-nav-links" aria-label="主要功能選單" data-active-route={activeItem?.id ?? ""}>
          {PRIMARY_ITEMS.map(({ id, label, icon: Icon, href }) => {
            const active = activeItem?.id === id;
            return (
              <button
                key={id}
                type="button"
                className={`global-top-nav-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                title={label}
                onClick={() => go(href)}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.9} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
          <div className="global-top-nav-more" ref={morePanelRef}>
            <button
              type="button"
              className={`global-top-nav-item global-top-nav-more-trigger ${moreActive ? "is-active" : ""}`}
              aria-label="更多功能"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((open) => !open)}
            >
              <Menu size={17} strokeWidth={1.9} aria-hidden="true" />
              <span>更多</span>
            </button>
            {moreOpen ? (
              <div className="global-top-nav-more-panel" role="menu" aria-label="更多功能選單">
                {MORE_ITEMS.map(({ id, label, icon: Icon, href }) => {
                  const active = activeItem?.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      className={`global-top-nav-more-item ${active ? "is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => go(href)}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
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
        <button
          type="button"
          className="global-mobile-menu-trigger"
          aria-label="開啟功能選單"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
        <nav className="global-mobile-priority-nav" aria-label="手機版核心入口">
          {MOBILE_PRIORITY_ITEMS.map(({ id, label, icon: Icon, href }) => {
            const active = activeItem?.id === id;
            return (
              <button
                key={id}
                type="button"
                className={`global-mobile-priority-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => go(href)}
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
                        onSelect={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          setLocation(item.href);
                        }}
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
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="global-mobile-menu-dialog" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>功能選單</DialogTitle>
            <DialogDescription className="sr-only">選擇要前往的學習或探險功能。</DialogDescription>
          </DialogHeader>
          <button type="button" className="global-mobile-menu-close" aria-label="關閉功能選單" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} aria-hidden="true" />
          </button>
          <nav className="global-mobile-menu-groups" aria-label="全部功能">
            {MOBILE_GROUPS.map((group) => (
              <section key={group.id} className="global-mobile-menu-group">
                <h2>{group.label}</h2>
                <div className="global-mobile-menu-items">
                  {group.items.map(({ id, label, icon: Icon, href }) => {
                    const active = activeItem?.id === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`global-mobile-menu-item ${active ? "is-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => go(href)}
                      >
                        <Icon size={18} aria-hidden="true" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
}
