"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_TABS, type AppTabSlug } from "@/lib/landing/app-tabs";
import { UserMenu } from "@/components/auth/user-menu";
import { OsNavMenu } from "./os-nav-menu";
import type { OsUser } from "./os-shell";
import { streamerHubPath } from "@/lib/navigation/user-hub";
import { cn } from "@/lib/utils";

interface OsNavTabsProps {
  active: AppTabSlug;
  onChange: (tab: AppTabSlug) => void;
  isAuthenticated: boolean;
  user?: OsUser;
}

export function OsNavTabs({ active, onChange, isAuthenticated, user }: OsNavTabsProps) {
  const router = useRouter();
  const hubPath = streamerHubPath(user?.role);

  function openUserHub() {
    if (hubPath) {
      router.push(hubPath);
      return;
    }
    onChange("profile");
  }

  return (
    <nav className="mc-os-tabs">
      <div className="mc-os-tabs-scroll">
        {APP_TABS.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => onChange(tab.slug)}
              className={cn("mc-os-tab-btn", isActive && "mc-tab-active")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mc-os-tab-actions">
        {isAuthenticated && user?.role ? (
          <button
            type="button"
            onClick={openUserHub}
            className={cn(
              "mc-os-profile-btn",
              !hubPath && active === "profile" && "ring-1 ring-primary/50 bg-primary/10",
            )}
            title={hubPath ? "Панель стримера" : "Мой профиль"}
          >
            <UserMenu
              nickname={user.nickname}
              displayName={user.nickname}
              image={user.avatar}
              role={user.role}
              primaryProvider={user.primaryProvider}
            />
          </button>
        ) : (
          <Link
            href="/login"
            className="mc-os-btn flex h-7 items-center px-2 text-[10px] uppercase leading-none"
          >
            Войти
          </Link>
        )}
        <OsNavMenu
          isAuthenticated={isAuthenticated}
          userRole={user?.role}
          onTabChange={onChange}
        />
      </div>
    </nav>
  );
}
