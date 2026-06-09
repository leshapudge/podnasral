"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Award,
  Hammer,
  Gamepad2,
  Skull,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { recentActivity } from "@/lib/landing/mock-data";
import { SectionHeader } from "./section-header";

const activityConfig = {
  craft: { icon: Hammer, color: "text-mc-diamond", bg: "bg-mc-diamond/10 border-mc-diamond/20" },
  game: { icon: Gamepad2, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  boss: { icon: Skull, color: "text-boss", bg: "bg-boss/10 border-boss/20" },
  achievement: { icon: Award, color: "text-hypixel-gold", bg: "bg-hypixel-gold/10 border-hypixel-gold/20" },
  rank: { icon: TrendingUp, color: "text-mc-diamond", bg: "bg-mc-diamond/10 border-mc-diamond/20" },
};

export function RecentActivity() {
  return (
    <section id="activity" className="relative py-24 sm:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Лента"
          title="Последняя активность"
          description="События ивента в реальном времени — крафт, игры, боссы и достижения."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Live Feed</h3>
                  <Badge variant="live" className="ml-auto">LIVE</Badge>
                </div>

                <div className="space-y-3">
                  {recentActivity.map((item, i) => {
                    const config = activityConfig[item.type];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        className={`flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-white/5 ${config.bg}`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.bg}`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-bold text-foreground">{item.player}</span>
                            {" "}{item.action}{" "}
                            <span className="text-foreground/90">{item.item}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                        </div>
                        {item.power && (
                          <Badge variant="default" className="shrink-0">
                            {item.power}
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-4"
          >
            {[
              {
                title: "Как это работает",
                steps: [
                  "Войди через Twitch или Discord",
                  "Играй в мини-игры и собирай ресурсы",
                  "Крафти предметы и набирай силу",
                  "Атакуй босса и поднимайся в рейтинге",
                ],
              },
            ].map((block) => (
              <Card key={block.title} className="flex-1 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-display text-xl font-bold mb-6">{block.title}</h3>
                  <ol className="space-y-4">
                    {block.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 font-display text-sm font-bold text-primary mc-border">
                          {i + 1}
                        </span>
                        <span className="pt-1 text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}

            <Card className="border-hypixel-gold/30 bg-gradient-to-r from-hypixel-gold/10 to-transparent">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="text-4xl">⛏️</div>
                <div>
                  <p className="font-bold text-foreground">Сезон активен</p>
                  <p className="text-sm text-muted-foreground">
                    Присоединяйся к 2,800+ игрокам прямо сейчас
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
