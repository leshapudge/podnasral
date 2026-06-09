"use client";

import { motion } from "framer-motion";
import { Crown, Shield, TrendingUp, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { classLabels, playerProfile } from "@/lib/profile/mock-data";
import { formatNumber } from "@/lib/utils";

interface ProfileHeaderProps {
  nickname?: string | null;
  avatar?: string | null;
}

export function ProfileHeader({ nickname, avatar }: ProfileHeaderProps) {
  const profile = playerProfile;
  const displayName = nickname ?? profile.nickname;
  const classInfo = classLabels[profile.playerClass];
  const xpPercent = Math.round((profile.experience / profile.experienceToNext) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="p-0">
          {/* Banner */}
          <div className="relative h-28 bg-gradient-to-r from-mc-grass-dark/40 via-primary/20 to-hypixel-gold/20 sm:h-32">
            <div className="absolute inset-0 grid-pattern opacity-40" />
            {profile.rating <= 3 && (
              <Badge variant="gold" className="absolute right-4 top-4">
                <Crown className="mr-1 h-3 w-3" />
                TOP {profile.rating}
              </Badge>
            )}
          </div>

          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-12 mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg sm:h-28 sm:w-28">
                {avatar && <AvatarImage src={avatar} alt={displayName} />}
                <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-wrap gap-2 sm:mb-1">
                <Badge variant="secondary">
                  <Shield className="mr-1 h-3 w-3" />
                  {profile.guild}
                </Badge>
                <Badge variant="outline">{profile.season}</Badge>
              </div>
            </div>

            {/* Name & class */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-wide sm:text-3xl">
                {displayName}
              </h1>
              <Badge className={`${classInfo.color} border-current/30 bg-current/10`}>
                {classInfo.icon} {classInfo.name}
              </Badge>
            </div>

            {/* Level & XP */}
            <div className="mt-5 max-w-xl">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-display font-bold text-hypixel-gold">
                  Уровень {profile.level}
                </span>
                <span className="text-muted-foreground">
                  {formatNumber(profile.experience)} / {formatNumber(profile.experienceToNext)} XP
                </span>
              </div>
              <Progress
                value={xpPercent}
                className="h-3"
                indicatorClassName="bg-gradient-to-r from-hypixel-gold via-hypixel-gold-light to-hypixel-gold"
              />
            </div>

            {/* Core stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: Zap,
                  label: "Сила",
                  value: formatNumber(profile.power),
                  color: "text-primary",
                },
                {
                  icon: Crown,
                  label: "Рейтинг",
                  value: `#${profile.rating}`,
                  color: "text-hypixel-gold",
                },
                {
                  icon: TrendingUp,
                  label: "Уровень",
                  value: String(profile.level),
                  color: "text-mc-diamond",
                },
                {
                  icon: Shield,
                  label: "Класс",
                  value: classInfo.name,
                  color: classInfo.color,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-panel rounded-lg p-3 mc-border"
                >
                  <stat.icon className={`mb-1 h-4 w-4 ${stat.color}`} />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className={`font-display text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
