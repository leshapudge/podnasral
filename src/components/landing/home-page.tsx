"use client";

import type { HomePageData } from "@/lib/landing/home-data.types";
import type { ProfilePageData } from "@/lib/profile/profile-data.service";
import type { InventoryGrid } from "@/lib/inventory/types";
import type { StreamerRosterEntry } from "@/lib/api/client";
import { OsDesktopExperience } from "./os/os-desktop-experience";
import { OsShell, type OsUser } from "./os/os-shell";

interface HomePageProps {
  isAuthenticated: boolean;
  homeData: HomePageData;
  profileData: ProfilePageData | null;
  inventoryGrid: InventoryGrid | null;
  initialStreamers: StreamerRosterEntry[];
  user?: OsUser;
}

export function HomePage({
  isAuthenticated,
  homeData,
  profileData,
  inventoryGrid,
  initialStreamers,
  user,
}: HomePageProps) {
  return (
    <OsDesktopExperience ready isAuthenticated={isAuthenticated}>
      {({ onWindowClose }) => (
        <OsShell
          isAuthenticated={isAuthenticated}
          homeData={homeData}
          profileData={profileData}
          inventoryGrid={inventoryGrid}
          initialStreamers={initialStreamers}
          user={user}
          desktopMode
          onWindowClose={onWindowClose}
        />
      )}
    </OsDesktopExperience>
  );
}
