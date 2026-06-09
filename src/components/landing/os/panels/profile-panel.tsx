"use client";

import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { OsProfileHeader } from "../os-profile-header";
import { OsProfileTabs } from "../os-profile-tabs";
import type { ProfilePageData } from "@/lib/profile/profile-data.service";

interface ProfilePanelProps {
  isAuthenticated: boolean;
  nickname?: string | null;
  avatar?: string | null;
  profileData: ProfilePageData | null;
}

export function ProfilePanel({
  isAuthenticated,
  nickname,
  avatar,
  profileData,
}: ProfilePanelProps) {
  return (
    <OsPanelFrame>
      <OsSectionTitle>Профиль игрока</OsSectionTitle>
      <OsProfileHeader
        isAuthenticated={isAuthenticated}
        nickname={nickname}
        avatar={avatar}
        summary={profileData?.summary ?? null}
      />
      {isAuthenticated && profileData && <OsProfileTabs profileData={profileData} />}
    </OsPanelFrame>
  );
}
