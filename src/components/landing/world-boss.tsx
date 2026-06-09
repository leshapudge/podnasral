"use client";

import { motion } from "framer-motion";
import { Flame, Shield, Skull, Swords, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { worldBoss } from "@/lib/landing/mock-data";
import { formatNumber } from "@/lib/utils";
import { SectionHeader } from "./section-header";
import Link from "next/link";

export function WorldBoss() {
  return (
    <section id="boss" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Boss atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-boss/10 blur-[150px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-mc-redstone/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Мировой босс"
          title={worldBoss.name}
          description={worldBoss.subtitle}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden border-boss/30 bg-gradient-to-br from-card via-boss/5 to-mc-redstone/10">
              <CardContent className="p-0">
                <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-boss/20 to-transparent p-10 sm:p-16">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-8xl sm:text-9xl drop-shadow-[0_0_40px_rgba(255,107,53,0.5)]"
                  >
                    💀
                  </motion.div>
                  <Badge variant="live" className="mt-4">
                    <Flame className="mr-1 h-3 w-3" />
                    {worldBoss.status}
                  </Badge>
                </div>

                <div className="p-8">
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">
                        Здоровье босса
                      </p>
                      <p className="font-display text-3xl font-bold text-boss">
                        {formatNumber(worldBoss.currentHp)}
                        <span className="text-lg text-muted-foreground font-normal">
                          {" "}/ {formatNumber(worldBoss.maxHp)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm">{worldBoss.timeRemaining}</span>
                    </div>
                  </div>

                  <Progress
                    value={worldBoss.hpPercent}
                    className="h-5 bg-mc-redstone/20"
                    indicatorClassName="bg-gradient-to-r from-mc-redstone via-boss to-hypixel-gold"
                  />
                  <p className="mt-2 text-right text-sm font-semibold text-boss">
                    {worldBoss.hpPercent}% осталось
                  </p>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <Button asChild variant="default" size="lg">
                      <Link href="/login">
                        <Swords className="h-5 w-5" />
                        Атаковать босса
                      </Link>
                    </Button>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{formatNumber(worldBoss.totalDamagers)}</strong> участников
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-4"
          >
            <Card className="border-boss/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Skull className="h-5 w-5 text-boss" />
                  <h3 className="font-bold">Топ урон</h3>
                </div>
                <div className="space-y-4">
                  {worldBoss.topDamagers.map((d, i) => (
                    <div key={d.nickname} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          <span className="text-muted-foreground mr-2">#{i + 1}</span>
                          {d.nickname}
                        </span>
                        <span className="text-boss font-semibold">{formatNumber(d.damage)}</span>
                      </div>
                      <Progress
                        value={d.percent * 5}
                        className="h-1.5"
                        indicatorClassName="bg-boss"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-hypixel-gold/10 to-transparent border-hypixel-gold/20">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Награда за победу</p>
                <p className="mt-1 font-display text-xl font-bold text-gradient-gold">
                  Legendary Loot Pool
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Уникальные предметы сезона для всех участников
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
