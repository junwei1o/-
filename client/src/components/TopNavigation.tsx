import * as React from "react";
import { BarChart3, BookOpenCheck, Compass, LogOut, Map as MapIcon, Menu, Search, Settings, X, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findFeatureSearchResults } from "@/lib/featureSearch";
import { getSession } from "@/game/session";
import { logout } from "@/game/session";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Path prefixes that should mark this entry as the active destination. */
  activePrefixes?: string[];
};

type NavGroup = { id: string; label: string; items: NavItem[] };

/**
 * 頂層導航（22 入口 → 7 → 5，設計稿 P1 問題10 收斂）。
 * 「今日遠征」為每日作答任務，併入我的教室；「知識展廳」為探索收集內容，併入藏寶圖。
 * 被收斂頁面的路由全部保留，並在對應 Hub 頁提供入口卡，不再各自佔一個頂層入口。
 */
const PRIMARY_ITEMS: NavItem[] = [
  { id: "home", label: "首頁", icon: Compass, href: "/", activePrefixes: ["/map", "/regions/"] },
  { id: "quiz-room", label: "我的教室", icon: BookOpenCheck, href: "/quiz-room", activePrefixes: ["/quiz-room", "/classroom", "/weekly-quiz", "/practice", "/wrong-answers", "/review-hub", "/community", "/expedition", "/camp"] },
  { id: "learning", label: "學習歷程", icon: BarChart3, href: "/learning", activePrefixes: ["/learning", "/learning-insights", "/learning-report", "/error-statistics", "/learning-summary", "/adventure-journal"] },
  { id: "treasure", label: "藏寶圖", icon: MapIcon, href: "/treasure", activePrefixes: ["/treasure", "/badges", "/gallery", "/wisdom", "/astronomy", "/principles", "/observatory", "/safety", "/study-tips"] },
  { id: "settings", label: "設定", icon: Settings, href: "/settings", activePrefixes: ["/settings", "/teacher", "/class", "/features"] },
];

/** 手機版選單：直接展示五個頂層入口（Hub 頁內再展開細節）。 */
const MOBILE_GROUPS: NavGroup[] = [
  { id: "main", label: "主選單", items: PRIMARY_ITEMS },
];

/** 手機底部固定快捷：最常用的四個（首頁／我的教室／學習歷程／藏寶圖）。 */
const MOBILE_PRIORITY_ITEMS: NavItem[] = [PRIMARY_ITEMS[0], PRIMARY_ITEMS[1], PRIMARY_ITEMS[2], PRIMARY_ITEMS[3]];

function isItemActive(item: NavItem, pathname: string) {
  if (item.href === "/") {
    return pathname === "/" || pathname === "" || (item.activePrefixes ?? []).some((prefix) => pathname === prefix || pathname.startsWith(prefix));
  }
  return (item.activePrefixes ?? [item.href]).some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`) || pathname.startsWith(prefix));
}

function findActiveItem(pathname: string): NavItem | null {
  return PRIMARY_ITEMS.find((item) => isItemActive(item, pathname)) ?? null;
}

export default function TopNavigation() {
  const [location, setLocation] = useLocation();
  const pathname = location.split("?")[0];
  const activeItem = findActiveItem(pathname);
  const session = getSession();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
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

  function go(href: string) {
    setMobileMenuOpen(false);
    setLocation(href);
  }

  function openFeatureSearch() {
    setSearchQuery("");
    setSearchOpen(true);
  }

  return (
    <>
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
          className="global-account-trigger"
          aria-label={`帳號：${session?.name ?? "未登入"}，點擊登出`}
          title={`帳號：${session?.name ?? "未登入"}`}
          onClick={() => {
            logout();
            setLocation("/");
            window.location.reload();
          }}
        >
          <span className="global-account-name">{session?.name ?? "未登入"}</span>
          <LogOut size={14} aria-hidden="true" />
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
              placeholder="搜尋演練、錯題、遠征…"
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
                <p className="global-feature-search-empty" role="status">找不到「{searchQuery}」；可嘗試「演練」、「錯題」或「遠征」。</p>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="global-mobile-menu-dialog" showCloseButton={false} aria-describedby={undefined}>
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
            <Icon size={20} strokeWidth={active ? 2.5 : 1.9} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
    </>
  );
}
