"use client";

import { motion } from "framer-motion";
import {
  Award,
  Gamepad2,
  Hammer,
  History,
  Skull,
  Swords,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProfileHistoryEntry } from "@/lib/profile/profile-data.service";

const historyConfig = {
  CRAFT: { icon: Hammer, color: "text-mc-diamond bg-mc-diamond/10 border-mc-diamond/20" },
  GAME: { icon: Gamepad2, color: "text-primary bg-primary/10 border-primary/20" },
  BOSS: { icon: Skull, color: "text-boss bg-boss/10 border-boss/20" },
  QUEST: { icon: Swords, color: "text-hypixel-gold bg-hypixel-gold/10 border-hypixel-gold/20" },
  RANK: { icon: TrendingUp, color: "text-mc-diamond bg-mc-diamond/10 border-mc-diamond/20" },
  ACHIEVEMENT: { icon: Award, color: "text-hypixel-gold bg-hypixel-gold/10 border-hypixel-gold/20" },
  EQUIP: { icon: Hammer, color: "text-primary bg-primary/10 border-primary/20" },
};

interface HistoryTabProps {
  history?: ProfileHistoryEntry[];
}

export function HistoryTab({ history = [] }: HistoryTabProps) {
  if (!history.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        История активности пуста — сыграйте игру или завершите аукцион
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />

      <div className="space-y-4">
        {history.map((entry, i) => {
          const config = historyConfig[entry.type as keyof typeof historyConfig] ?? historyConfig.GAME;
          const Icon = config.icon;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative sm:pl-12"
            >
              <div
                className={`absolute left-3 top-4 hidden h-4 w-4 rounded-full border-2 border-background sm:flex items-center justify-center ${config.color.split(" ")[1]}`}
              >
                <div className={`h-2 w-2 rounded-full ${config.color.split(" ")[0].replace("text-", "bg-")}`} />
              </div>

              <Card className="hover:border-white/10 transition-colors">
                <CardContent className="flex gap-4 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.color}`}>
                    <Icon className={`h-5 w-5 ${config.color.split(" ")[0]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{entry.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{entry.detail}</p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {entry.timestamp}
                  </time>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <History className="h-3.5 w-3.5" />
        Показаны последние {history.length} событий
      </p>
    </div>
  );
}
