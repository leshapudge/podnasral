"use client";

import { motion } from "framer-motion";
import { Award, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { rarityStyles } from "@/lib/profile/profile-types";
import type { ProfileAchievement } from "@/lib/profile/profile-data.service";

interface AchievementsTabProps {
  achievements?: ProfileAchievement[];
}

export function AchievementsTab({ achievements = [] }: AchievementsTabProps) {
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);

  if (!achievements.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Достижения сезона появятся после старта ивента
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Получено <strong className="text-foreground">{unlocked.length}</strong> из{" "}
          {achievements.length}
        </p>
        <Badge variant="gold">
          +{unlocked.reduce((s, a) => s + a.powerBonus, 0)} PWR
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {unlocked.map((ach, i) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={`border ${rarityStyles[ach.rarity] ?? rarityStyles.RARE}`}>
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black/20 text-2xl">
                  {ach.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{ach.name}</p>
                    <Award className="h-4 w-4 text-hypixel-gold" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ach.unlockedAt}</p>
                </div>
                <Badge variant="default">+{ach.powerBonus}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {locked.map((ach, i) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (unlocked.length + i) * 0.06 }}
          >
            <Card className="border border-border bg-muted/30 opacity-60">
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black/30">
                  {ach.secret ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <span className="text-xl grayscale">{ach.icon}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-muted-foreground">
                    {ach.secret ? "???" : ach.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ach.secret ? "Секретное достижение" : ach.description}
                  </p>
                </div>
                <Badge variant="outline">+{ach.powerBonus}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
