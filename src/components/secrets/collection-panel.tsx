"use client";

import { Lock, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { useSecrets } from "./secret-context";
import { getAchievementTexture } from "@/lib/secrets/achievement-assets";
import { EVENT_BRAND } from "@/lib/event/event-brand";
import { getArtifactTexture } from "@/lib/secrets/artifact-assets";
import { MC_ASSETS } from "@/lib/landing/assets";
import { cn } from "@/lib/utils";

const RARITY_CLASS: Record<string, string> = {
  COMMON: "border-mc-stone/40 text-mc-stone",
  UNCOMMON: "border-primary/40 text-primary",
  RARE: "border-mc-diamond/40 text-mc-diamond",
  EPIC: "border-purple-500/40 text-purple-400",
  LEGENDARY: "border-hypixel-gold/40 text-hypixel-gold",
};

export function CollectionPanel() {
  const { collection } = useSecrets();
  const { achievements, artifacts, progress } = collection;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="mx-auto h-8 w-8 text-hypixel-gold" />
        <h2 className="mt-2 font-display text-xl text-[#e8d5b0]">Достижения</h2>
        <p className="text-xs text-[#7a6a52]">Коллекция наград и артефактов по всему {EVENT_BRAND}</p>
      </div>

      <div className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#7a6a52]">Общий прогресс</p>
            <p className="font-display text-3xl text-primary">{progress.totalPercent}%</p>
          </div>
          <p className="text-right text-xs text-[#7a6a52]">
            {progress.points} очков · {achievements.filter((a) => a.unlocked).length}/
            {achievements.length} достиж. · {artifacts.filter((a) => a.found).length}/
            {artifacts.length} артеф.
          </p>
        </div>
        <Progress value={progress.totalPercent} className="mt-3 h-2 bg-[#0d0a08]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 font-display text-sm text-[#a89070]">Достижения</h3>
          <ul className="space-y-2">
            {achievements.map((a, i) => (
              <motion.li
                key={a.slug}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={cn(
                    "border bg-[#1a1208]/40",
                    a.unlocked ? RARITY_CLASS[a.rarity] : "border-[#1a1208] opacity-50",
                  )}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <McItemSlot
                      src={
                        a.unlocked
                          ? getAchievementTexture(a.slug)
                          : MC_ASSETS.items.enderPearl
                      }
                      alt={a.unlocked ? a.name : "???"}
                      size="sm"
                      active={a.unlocked}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#e8d5b0]">
                        {a.unlocked ? a.name : "???"}
                      </p>
                      <p className="truncate text-[10px] text-[#7a6a52]">
                        {a.unlocked ? a.description : "Скрытое достижение"}
                      </p>
                    </div>
                    {a.unlocked ? (
                      <Badge variant="default">+{a.points}</Badge>
                    ) : (
                      <Lock className="h-4 w-4 text-[#5c4a32]" />
                    )}
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 font-display text-sm text-[#a89070]">Артефакты</h3>
          <ul className="space-y-2">
            {artifacts.map((a, i) => (
              <motion.li
                key={a.slug}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={cn(
                    "border bg-[#1a1208]/40",
                    a.found ? RARITY_CLASS[a.rarity] : "border-[#1a1208] opacity-50",
                  )}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <McItemSlot
                      src={a.found ? getArtifactTexture(a.slug) : MC_ASSETS.items.enderPearl}
                      alt={a.found ? a.name : "?"}
                      size="sm"
                      active={a.found}
                      enchanted={a.found && (a.rarity === "LEGENDARY" || a.rarity === "EPIC")}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#e8d5b0]">
                        {a.found ? a.name : "???"}
                      </p>
                      <p className="truncate text-[10px] text-[#7a6a52]">
                        {a.found ? a.description : "Где-то на сайте..."}
                      </p>
                    </div>
                    <Badge variant="outline">{a.rarity}</Badge>
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </ul>
        </section>
      </div>

      <p className="text-center text-[10px] text-[#5c4a32]">
        Подсказка: <kbd className="rounded bg-[#1a1208] px-1">/</kbd> для секретных команд
      </p>
    </div>
  );
}
