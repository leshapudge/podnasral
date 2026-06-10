"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EVENT_BRAND, EVENT_BRAND_OS } from "@/lib/event/event-brand";
import { cn } from "@/lib/utils";

interface OsDesktopTaskbarProps {
  ready: boolean;
  isAuthenticated?: boolean;
  onOpenApp: () => void;
}

type StartMenuItem =
  | { type: "action"; label: string; sub: string }
  | { type: "link"; label: string; sub: string; href: string };

function buildStartItems(isAuthenticated: boolean): StartMenuItem[] {
  const items: StartMenuItem[] = [
    { type: "action", label: EVENT_BRAND, sub: "Открыть главное окно" },
  ];
  if (!isAuthenticated) {
    items.push({ type: "link", label: "Войти", href: "/login", sub: "Twitch OAuth" });
  }
  items.push({ type: "link", label: "Панель стримера", href: "/streamer", sub: "Кабинет" });
  return items;
}

export function OsDesktopTaskbar({
  ready,
  isAuthenticated = false,
  onOpenApp,
}: OsDesktopTaskbarProps) {
  const startItems = buildStartItems(isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const timeStr = now
    ? now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <footer ref={rootRef} className="mc-os-taskbar">
      <div className="relative">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((v) => !v)}
          className={cn("mc-os-start-btn", menuOpen && "mc-os-start-btn--active")}
        >
          <Image
            src="/assets/mc/grass-block-3d.png"
            alt=""
            width={20}
            height={20}
            className="mc-pixel-image shrink-0"
          />
          <span>Пуск</span>
        </button>

        {menuOpen && (
          <div role="menu" className="mc-os-start-menu">
            <div className="mc-os-start-menu-header">{EVENT_BRAND_OS}</div>
            {startItems.map((item) =>
              item.type === "action" ? (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={!ready}
                  className="mc-os-start-menu-item"
                  onClick={() => {
                    if (!ready) return;
                    onOpenApp();
                    setMenuOpen(false);
                  }}
                >
                  <Image
                    src="/assets/mc/grass-block-3d.png"
                    alt=""
                    width={28}
                    height={28}
                    className="mc-pixel-image shrink-0"
                  />
                  <span>
                    <span className="block font-display text-[11px] uppercase tracking-wide text-[#e8d5b0]">
                      {item.label}
                    </span>
                    <span className="block text-[10px] text-[#7a6a52]">{item.sub}</span>
                  </span>
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className="mc-os-start-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mc-os-start-menu-icon">⛏</span>
                  <span>
                    <span className="block font-display text-[11px] uppercase tracking-wide text-[#e8d5b0]">
                      {item.label}
                    </span>
                    <span className="block text-[10px] text-[#7a6a52]">{item.sub}</span>
                  </span>
                </Link>
              ),
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 truncate px-3 font-display text-[10px] uppercase tracking-wide text-[#a89070]">
        {ready ? "Старт ивента · 25 июня" : "Загрузка..."}
      </div>

      <div className="mc-os-taskbar-tray tabular-nums text-[#e8d5b0]">{timeStr}</div>
    </footer>
  );
}
