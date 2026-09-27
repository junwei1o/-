import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

interface NavItem {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/', label: '島嶼地圖', match: (p) => p === '/' || p.startsWith('/island') || p.startsWith('/quiz') },
  { href: '/records', label: '學習紀錄', match: (p) => p.startsWith('/records') },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#041826]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold tracking-wide text-white transition hover:text-[#ffc857]"
          >
            <span className="bob text-2xl" aria-hidden>
              🏝️
            </span>
            <span>島嶼探險家</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.match(location);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                    active
                      ? 'bg-[#ffc857] text-[#062033]'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-6">{children}</main>

      <div className="wave-divider" aria-hidden />

      <footer className="border-t border-white/10 bg-[#041826]/80 py-6 text-center text-sm text-slate-400">
        <p>
          島嶼探險家 ｜ 國小 3–6 年級 國語・數學・自然・社會 互動學習航線
        </p>
        <p className="mt-1 text-slate-500">
          進度儲存在這台裝置的瀏覽器中，不需要註冊即可遊玩。
        </p>
      </footer>
    </div>
  );
}
