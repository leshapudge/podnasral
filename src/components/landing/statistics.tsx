"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Gamepad2,
  Hammer,
  Shield,
  Swords,
  Tv,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { statistics } from "@/lib/landing/mock-data";
import { formatNumber } from "@/lib/utils";
import { SectionHeader } from "./section-header";

const iconMap = {
  users: Users,
  gamepad: Gamepad2,
  hammer: Hammer,
  swords: Swords,
  shield: Shield,
  twitch: Tv,
};

export function Statistics() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Статистика"
          title="Ивент в цифрах"
          description="Масштаб MINESEASON — тысячи игроков, сотни гильдий, миллионы действий."
          align="center"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statistics.map((stat, i) => {
            const Icon = iconMap[stat.icon as keyof typeof iconMap] ?? BarChart3;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Card className="group h-full transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(85,197,122,0.1)]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 transition-colors group-hover:bg-primary/20">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {stat.change}
                      </span>
                    </div>
                    <p className="mt-6 font-display text-4xl font-bold text-foreground">
                      {formatNumber(stat.value)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
