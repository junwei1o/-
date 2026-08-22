import * as React from "react";
import { BookOpen, ChevronDown, ChevronUp, MapPinned, Orbit, Swords, Trophy, X } from "lucide-react";
import { useLocation } from "wouter";

type MobileNavItem = {
  id: "home" | "learn" | "battle" | "discover" | "report";
  label: string;
  icon: typeof MapPinned;
  href: string;
};

const ITEMS: MobileNavItem[] = [
  { id: "home", label: "探險", icon: MapPinned, href: "/" },
  { id: "learn", label: "學習", icon: BookOpen, href: "/practice" },
  { id: "battle", label: "戰鬥", icon: Swords, href: "/battle" },
  { id: "discover", label: "觀測", icon: Orbit, href: "/astronomy" },
  { id: "report", label: "報告", icon: Trophy, href: "/learning-insights" },
];

const DRAG_RANGE_PX = 190;
const SNAP_THRESHOLD = 0.5;
const VELOCITY_THRESHOLD = 0.45;

type DragSession = {
  pointerId: number;
  startY: number;
  lastY: number;
  lastTime: number;
  startProgress: number;
  progress: number;
  velocity: number;
};

function getActiveItem(location: string): MobileNavItem["id"] {
  const [pathname] = location.split("?");

  if (pathname === "/battle") return "battle";
  if (pathname === "/astronomy" || pathname.startsWith("/astronomy/")) return "discover";
  if (pathname === "/practice") return "learn";
  if (pathname === "/learning-insights") return "report";
  return "home";
}

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [dragProgress, setDragProgress] = React.useState<number | null>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const dragRef = React.useRef<DragSession | null>(null);
  const suppressClickRef = React.useRef(false);
  const activeItem = getActiveItem(location);
  const visibleProgress = dragProgress ?? (isOpen ? 1 : 0);
  const isDragging = dragProgress !== null;

  const focusToggle = React.useCallback(() => {
    window.setTimeout(() => toggleRef.current?.focus(), 0);
  }, []);

  const closeSheet = React.useCallback(() => {
    setDragProgress(null);
    setIsOpen(false);
    focusToggle();
  }, [focusToggle]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSheet, isOpen]);

  const finishDrag = React.useCallback((session: DragSession) => {
    const currentProgress = session.progress;
    const shouldOpen = session.velocity > VELOCITY_THRESHOLD
      ? true
      : session.velocity < -VELOCITY_THRESHOLD
        ? false
        : currentProgress >= SNAP_THRESHOLD;
    setDragProgress(null);
    setIsOpen(shouldOpen);
    if (!shouldOpen) focusToggle();
  }, [focusToggle]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: now,
      startProgress: isOpen ? 1 : 0,
      progress: isOpen ? 1 : 0,
      velocity: 0,
    };
    suppressClickRef.current = false;
    setDragProgress(isOpen ? 1 : 0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const deltaTime = Math.max(1, now - session.lastTime);
    session.velocity = (session.lastY - event.clientY) / deltaTime;
    session.lastY = event.clientY;
    session.lastTime = now;
    const progress = clampProgress(session.startProgress + (session.startY - event.clientY) / DRAG_RANGE_PX);
    session.progress = progress;
    if (Math.abs(event.clientY - session.startY) > 6) suppressClickRef.current = true;
    setDragProgress(progress);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    finishDrag(session);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragProgress(null);
  };

  const handleToggleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setIsOpen((open) => !open);
  };

  const navigate = (href: string) => {
    setLocation(href);
    setIsOpen(false);
    setDragProgress(null);
  };

  return (
    <nav
      className={`mobile-bottom-nav ${isOpen ? "is-open" : "is-collapsed"} ${isDragging ? "is-dragging" : ""}`}
      aria-label="手機版快速導覽"
      data-sheet-progress={visibleProgress.toFixed(2)}
    >
      {isOpen && (
        <button type="button" className="mobile-bottom-nav-backdrop" aria-label="關閉快速導覽" onClick={closeSheet} />
      )}
      <div
        className="mobile-bottom-nav-sheet"
        style={{ "--mobile-bottom-nav-progress": visibleProgress } as React.CSSProperties}
      >
        <div
          className="mobile-bottom-nav-handle-row"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          role="presentation"
          aria-label="上下拖曳調整快捷入口高度"
        >
          <button
            ref={toggleRef}
            type="button"
            className="mobile-bottom-nav-toggle"
            aria-expanded={isOpen}
            aria-controls="mobile-bottom-nav-panel"
            aria-describedby="mobile-bottom-nav-drag-help"
            onClick={handleToggleClick}
          >
            <span className="mobile-bottom-nav-handle" aria-hidden="true" />
            <span>{isOpen ? "收合快捷入口" : "展開快捷入口"}</span>
            {isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
          </button>
          {isOpen && (
            <button type="button" className="mobile-bottom-nav-close" aria-label="關閉快速導覽" onClick={closeSheet}>
              <X size={17} aria-hidden="true" />
            </button>
          )}
        </div>
        <p id="mobile-bottom-nav-drag-help" className="mobile-bottom-nav-drag-help">
          可上下拖曳把手調整高度，也可使用按鈕切換
        </p>
        <div id="mobile-bottom-nav-panel" className="mobile-bottom-nav-inner" role="group" aria-label="快捷入口" aria-hidden={!isOpen}>
          {ITEMS.map(({ id, label, icon: Icon, href }) => {
            const active = activeItem === id;
            return (
              <button
                key={id}
                type="button"
                className={`mobile-bottom-nav-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                tabIndex={isOpen ? 0 : -1}
                aria-label={`前往${label}`}
                onClick={() => navigate(href)}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
