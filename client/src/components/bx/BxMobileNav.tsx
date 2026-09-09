import React from "react";
import { Link, useLocation } from "wouter";

/**
 * BX 手機底部導航：< 760px 顯示，提供五大常用入口，補足漢堡選單的快速切換。
 * body 於窄屏預留 64px padding（見 index.css）。
 */
const ITEMS = [
  { href: "/map", icon: "🗺️", label: "航海" },
  { href: "/practice", icon: "📚", label: "學習" },
  { href: "/battle", icon: "⚔️", label: "挑戰" },
  { href: "/badges", icon: "🏅", label: "成就" },
  { href: "/settings", icon: "⚙️", label: "設定" },
];

export default function BxMobileNav() {
  const [location] = useLocation();
  return (
    <nav className="bx-nav" aria-label="手機快捷導航">
      {ITEMS.map((item) => {
        const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bx-nav__item ${active ? "bx-nav__item--on" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="bx-nav__ic" aria-hidden="true">{item.icon}</span>
            <span className="bx-nav__lb">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
