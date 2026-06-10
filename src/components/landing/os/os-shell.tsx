"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { type AppTabSlug, resolveTabSlug } from "@/lib/landing/app-tabs";
import type { HomePageData } from "@/lib/landing/home-data.types";
import type { ProfilePageData } from "@/lib/profile/profile-data.service";
import type { InventoryGrid } from "@/lib/inventory/types";
import { OsNavTabs } from "./os-nav-tabs";
import { OsStatusBar } from "./os-status-bar";
import { StreamersHubPanel } from "./panels/streamers-hub-panel";
import { ProfilePanel } from "./panels/profile-panel";
import { InventoryPanel } from "./panels/inventory-panel";
import { SeasonPanel } from "./panels/season-panel";
import { BossPanel } from "./panels/boss-panel";
import { SecretsPanel } from "./panels/secrets-panel";
import { ArtifactSpawner } from "@/components/secrets/artifact-spawner";
import { ItemsEncyclopediaPanel } from "./panels/items-encyclopedia-panel";
import { ViewerArcadePanel } from "./panels/viewer-arcade-panel";
import { EVENT_BRAND } from "@/lib/event/event-brand";
import { OsWindowControls } from "./os-window-controls";

export interface OsUser {
  nickname?: string | null;
  avatar?: string | null;
  role?: UserRole;
  primaryProvider?: string | null;
}

interface OsShellProps {
  isAuthenticated: boolean;
  homeData: HomePageData;
  profileData: ProfilePageData | null;
  inventoryGrid: InventoryGrid | null;
  user?: OsUser;
  desktopMode?: boolean;
  onWindowClose?: () => void;
}

function Panel({
  tab,
  isAuthenticated,
  user,
  homeData,
  profileData,
  inventoryGrid,
  onTabChange,
}: {
  tab: AppTabSlug;
  isAuthenticated: boolean;
  user?: OsUser;
  homeData: HomePageData;
  profileData: ProfilePageData | null;
  inventoryGrid: InventoryGrid | null;
  onTabChange: (tab: AppTabSlug) => void;
}) {
  switch (tab) {
    case "kazik":
      return <ViewerArcadePanel isAuthenticated={isAuthenticated} />;
    case "overview":
      return <StreamersHubPanel season={homeData.season} />;
    case "profile":
      return (
        <ProfilePanel
          isAuthenticated={isAuthenticated}
          nickname={user?.nickname}
          avatar={user?.avatar}
          profileData={profileData}
        />
      );
    case "inventory":
      return (
        <InventoryPanel
          isAuthenticated={isAuthenticated}
          initialGrid={inventoryGrid}
        />
      );
    case "items":
      return <ItemsEncyclopediaPanel />;
    case "season":
      return <SeasonPanel season={homeData.season} />;
    case "boss":
      return (
        <BossPanel
          boss={homeData.featuredBoss}
          bosses={homeData.bosses}
          season={homeData.season}
        />
      );
    case "achievements":
      return <SecretsPanel />;
    default:
      return <StreamersHubPanel season={homeData.season} />;
  }
}

function OsShellInner({
  isAuthenticated,
  homeData,
  profileData,
  inventoryGrid,
  user,
  desktopMode = false,
  onWindowClose,
}: OsShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<AppTabSlug>(() => resolveTabSlug(tabParam));

  const setTab = useCallback(
    (slug: AppTabSlug) => {
      setActiveTab(slug);
      router.replace(`/?tab=${slug}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setActiveTab(resolveTabSlug(tabParam));
  }, [tabParam]);

  const monitor = (
    <div className={desktopMode ? "mc-os-monitor mc-os-monitor--desktop" : "mc-os-monitor"}>
          <div className="mc-os-bezel">
            <span className="mc-os-bezel-title flex-1 text-center">{EVENT_BRAND}</span>
            <OsWindowControls onClose={onWindowClose} />
          </div>

          <OsNavTabs
            active={activeTab}
            onChange={setTab}
            isAuthenticated={isAuthenticated}
            user={user}
          />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {desktopMode && <ArtifactSpawner />}
            <Panel
              tab={activeTab}
              isAuthenticated={isAuthenticated}
              user={user}
              homeData={homeData}
              profileData={profileData}
              inventoryGrid={inventoryGrid}
              onTabChange={setTab}
            />
          </div>
          <OsStatusBar season={homeData.season} />
    </div>
  );

  if (desktopMode) {
    return <div className="mc-os-wrap mc-os-wrap--desktop">{monitor}</div>;
  }

  return (
    <div className="mc-os-scene">
      <div className="mc-os-backdrop" />
      <div className="mc-os-wrap">{monitor}</div>
    </div>
  );
}

export function OsShell(props: OsShellProps) {
  return (
    <Suspense
      fallback={
        <div className="mc-os-scene" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#7a6a52" }}>
          Загрузка {EVENT_BRAND}...
        </div>
      }
    >
      <OsShellInner {...props} />
    </Suspense>
  );
}
