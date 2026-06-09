"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Minus, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { topPlayers } from "@/lib/landing/mock-data";
import { formatNumber } from "@/lib/utils";
import { SectionHeader } from "./section-header";

const podiumConfig = [
  { rank: 2, height: "h-28", color: "from-zinc-400/20 to-zinc-500/10", border: "border-zinc-400/30", medal: Medal },
  { rank: 1, height: "h-36", color: "from-hypixel-gold/25 to-hypixel-gold/5", border: "border-hypixel-gold/50", medal: Crown },
  { rank: 3, height: "h-24", color: "from-amber-700/20 to-amber-800/10", border: "border-amber-600/30", medal: Medal },
];

function TrendIcon({ trend }: { trend: "up" | "down" | "same" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-primary" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function TopPlayers() {
  const podium = podiumConfig.map((p) => ({
    ...p,
    player: topPlayers.find((pl) => pl.rank === p.rank)!,
  }));

  const rest = topPlayers.filter((p) => p.rank > 3);

  return (
    <section id="leaderboard" className="relative py-24 sm:py-32 bg-muted/30">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Рейтинг"
          title="Топ игроков"
          description="Лучшие игроки сезона по силе. Крафти предметы, проходи игры и поднимайся выше."
          align="center"
        />

        {/* Podium */}
        <div className="mb-12 flex items-end justify-center gap-3 sm:gap-6">
          {podium.map(({ rank, height, color, border, medal: MedalIcon, player }, i) => (
            <motion.div
              key={rank}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className={`flex w-full max-w-[200px] flex-col items-center ${rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}
            >
              <Avatar className={`mb-3 ${rank === 1 ? "h-20 w-20 border-hypixel-gold/50" : "h-16 w-16"}`}>
                <AvatarFallback className={rank === 1 ? "bg-hypixel-gold/20 text-hypixel-gold text-xl" : "text-lg"}>
                  {player.nickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-foreground truncate max-w-full text-center">
                {player.nickname}
              </p>
              <p className="text-sm text-hypixel-gold font-semibold">
                {formatNumber(player.power)} PWR
              </p>
              <div
                className={`mt-3 w-full ${height} rounded-t-xl bg-gradient-to-t ${color} border ${border} border-b-0 flex items-start justify-center pt-4`}
              >
                <MedalIcon className={`${rank === 1 ? "h-8 w-8 text-hypixel-gold" : "h-6 w-6 text-muted-foreground"}`} />
              </div>
              <div className="w-full rounded-b-xl bg-card border border-t-0 border-border py-2 text-center font-display text-2xl font-bold">
                #{rank}
              </div>
            </motion.div>
          ))}
        </div>

        {/* List 4-8 */}
        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((player, i) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="group transition-colors hover:border-primary/30 hover:bg-primary/5">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="font-display w-8 text-lg font-bold text-muted-foreground">
                    {player.rank}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{player.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{player.nickname}</p>
                    <p className="text-xs text-muted-foreground">{player.guild}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendIcon trend={player.trend} />
                    <Badge variant="gold">{formatNumber(player.power)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <a
            href="#leaderboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Trophy className="h-4 w-4" />
            Полный рейтинг — скоро
          </a>
        </motion.div>
      </div>
    </section>
  );
}
