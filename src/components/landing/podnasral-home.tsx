"use client";

import { useCallback, useEffect, useState } from "react";
import { HomePage } from "./home-page";
import { OsDesktopExperience } from "./os/os-desktop-experience";
import { buildHomePageData } from "@/lib/landing/home-data.adapter";
import type { HomePageData } from "@/lib/landing/home-data.types";
import { buildProfileFromMe } from "@/lib/profile/profile-data.service";
import type { ProfilePageData } from "@/lib/profile/profile-data.service";
import { inventoryGridFromMe } from "@/lib/inventory/grid.adapter";
import type { InventoryGrid } from "@/lib/inventory/types";
import { api } from "@/lib/api/client";
import { connectLive } from "@/lib/api/client";
import type { OsUser } from "./os/os-shell";
import type { StreamerRosterEntry } from "@/lib/api/client";

interface PodnasralHomeProps {
  isAuthenticated: boolean;
  user?: OsUser;
}

export function PodnasralHome({ isAuthenticated, user }: PodnasralHomeProps) {
  const [homeData, setHomeData] = useState<HomePageData | null>(null);
  const [profileData, setProfileData] = useState<ProfilePageData | null>(null);
  const [inventoryGrid, setInventoryGrid] = useState<InventoryGrid | null>(null);
  const [initialStreamers, setInitialStreamers] = useState<StreamerRosterEntry[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [event, streamers, me] = await Promise.all([
        api.getEvent(),
        api.getStreamersRoster(),
        isAuthenticated ? api.getMe().catch(() => null) : Promise.resolve(null),
      ]);

      setHomeData(
        buildHomePageData({
          event,
          leaderboard: streamers ?? [],
        }),
      );
      setInitialStreamers(streamers ?? []);

      if (me) {
        setProfileData(buildProfileFromMe(me, event?.name));
        setInventoryGrid(inventoryGridFromMe(me));
      } else {
        setProfileData(null);
        setInventoryGrid(null);
      }
    } catch (e) {
      console.error("[home]", e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    const disconnect = connectLive((ev) => {
      if (ev.type === "leaderboard.patch") {
        refresh();
      }
    });
    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, [refresh]);

  if (!homeData) {
    return (
      <OsDesktopExperience ready={false} isAuthenticated={isAuthenticated}>
        {() => null}
      </OsDesktopExperience>
    );
  }

  return (
    <HomePage
      isAuthenticated={isAuthenticated}
      homeData={homeData}
      profileData={profileData}
      inventoryGrid={inventoryGrid}
      initialStreamers={initialStreamers}
      user={user}
    />
  );
}
