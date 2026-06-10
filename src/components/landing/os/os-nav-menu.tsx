"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppTabSlug } from "@/lib/landing/app-tabs";
import { signOutAction } from "@/features/auth/actions";
import { streamerHubPath } from "@/lib/navigation/user-hub";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

interface OsNavMenuProps {
  isAuthenticated: boolean;
  userRole?: UserRole;
  onTabChange: (tab: AppTabSlug) => void;
}

const TAB_LINKS: { tab: AppTabSlug; label: string }[] = [
  { tab: "kazik", label: "Казик" },
  { tab: "profile", label: "Профиль" },
  { tab: "inventory", label: "Инвентарь" },
  { tab: "items", label: "Предметы" },
  { tab: "season", label: "Сезон" },
  { tab: "boss", label: "Босс" },
  { tab: "achievements", label: "Достижения" },
];

const ROUTE_LINKS = [
  { href: "/streamer", label: "Панель стримера" },
  { href: "/admin", label: "Админ" },
];

export function OsNavMenu({ isAuthenticated, userRole, onTabChange }: OsNavMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hubPath = streamerHubPath(userRole);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Меню"
        onClick={() => setOpen((v) => !v)}
        className={cn("mc-os-menu-btn", open && "border-primary")}
        title="Меню"
      >
        ☰
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded border-2 border-[#373737] bg-[#14100c] py-1 shadow-xl"
        >
          {TAB_LINKS.map(({ tab, label }) => (
            <button
              key={tab}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left font-display text-[10px] uppercase tracking-wide text-[#e8d5b0] hover:bg-[#1a1208]"
              onClick={() => {
                if (tab === "profile" && hubPath) {
                  router.push(hubPath);
                } else {
                  onTabChange(tab);
                }
                setOpen(false);
              }}
            >
              {tab === "profile" && hubPath ? "Панель стримера" : label}
            </button>
          ))}

          <div className="my-1 border-t border-[#1a1208]" />

          {ROUTE_LINKS.filter((link) => !(hubPath && link.href === hubPath)).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="block px-3 py-2 font-display text-[10px] uppercase tracking-wide text-[#e8d5b0] hover:bg-[#1a1208]"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <div className="my-1 border-t border-[#1a1208]" />
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left font-display text-[10px] uppercase tracking-wide text-mc-redstone hover:bg-[#1a1208]"
                onClick={() => {
                  setOpen(false);
                  signOutAction();
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <div className="my-1 border-t border-[#1a1208]" />
              <Link
                href="/login?callbackUrl=%2F%3Ftab%3Dkazik"
                role="menuitem"
                className="block px-3 py-2 font-display text-[10px] uppercase tracking-wide text-primary hover:bg-[#1a1208]"
                onClick={() => setOpen(false)}
              >
                Войти
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
