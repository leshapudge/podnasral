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

interface MineseasonHomeProps {
  isAuthenticated: boolean;
  user?: OsUser;
}

export function MineseasonHome({ isAuthenticated, user }: MineseasonHomeProps) {
  const [homeData, setHomeData] = useState<HomePageData | null>(null);
  const [profileData, setProfileData] = useState<ProfilePageData | null>(null);
  const [inventoryGrid, setInventoryGrid] = useState<InventoryGrid | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [event, leaderboard, boss, feedRes] = await Promise.all([
        api.getEvent(),
        api.getLeaderboard(),
        api.getBoss(),
        api.getFeed(30),
      ]);

      setHomeData(
        buildHomePageData({
          event,
          leaderboard: leaderboard ?? [],
          boss,
          feed: feedRes?.items ?? [],
        }),
      );

      if (isAuthenticated) {
        try {
          const me = await api.getMe();
          setProfileData(buildProfileFromMe(me, event?.name));
          setInventoryGrid(inventoryGridFromMe(me));
        } catch {
          setProfileData(null);
          setInventoryGrid(null);
        }
      }
    } catch (e) {
      console.error("[home]", e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    const disconnect = connectLive((ev) => {
      if (["leaderboard.patch", "boss.hp", "feed.item"].includes(ev.type)) {
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
      user={user}
    />
  );
}
