"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProfilePageData } from "@/lib/profile/profile-data.service";
import { AchievementsTab } from "@/components/profile/tabs/achievements-tab";
import { CompletionsTab } from "@/components/profile/tabs/completions-tab";
import { QuestsTab } from "@/components/profile/tabs/quests-tab";
import { HistoryTab } from "@/components/profile/tabs/history-tab";

const SUB_TABS = [
  { id: "achievements", label: "Достижения" },
  { id: "completions", label: "Прохождения" },
  { id: "quests", label: "Квесты" },
  { id: "history", label: "История" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

interface OsProfileTabsProps {
  profileData: ProfilePageData;
}

export function OsProfileTabs({ profileData }: OsProfileTabsProps) {
  const [active, setActive] = useState<SubTab>("achievements");

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-1 border-b border-[#1a1208] pb-2">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider transition-colors sm:text-xs",
              active === tab.id
                ? "bg-primary/20 text-primary"
                : "text-[#7a6a52] hover:text-[#c4b090]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 [&_.glass-panel]:border-[#1a1208] [&_.glass-panel]:bg-[#1a1208]/40 [&_h3]:text-[#e8d5b0]">
        {active === "achievements" && (
          <AchievementsTab achievements={profileData.achievements} />
        )}
        {active === "completions" && (
          <CompletionsTab completions={profileData.completions} />
        )}
        {active === "quests" && <QuestsTab quests={profileData.quests} />}
        {active === "history" && <HistoryTab history={profileData.history} />}
      </div>
    </div>
  );
}
