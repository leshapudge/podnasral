"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { seasonData } from "@/lib/landing/mock-data";
import { SectionHeader } from "./section-header";

export function SeasonProgress() {
  return (
    <section id="season" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Сезон"
          title="Прогресс ивента"
          description="Следи за ходом сезона, открывай новые фазы и готовься к финальному боссу."
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge variant="default" className="mb-3">
                      {seasonData.status}
                    </Badge>
                    <h3 className="font-display text-2xl font-bold text-foreground">
                      {seasonData.name}
                    </h3>
                    <p className="mt-1 text-muted-foreground">{seasonData.phase}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-5xl font-bold text-gradient-emerald">
                      {seasonData.progress}%
                    </div>
                    <p className="text-sm text-muted-foreground">завершено</p>
                  </div>
                </div>

                <div className="mt-8">
                  <Progress
                    value={seasonData.progress}
                    className="h-4 bg-muted/80"
                    indicatorClassName="bg-gradient-to-r from-mc-grass-dark via-primary to-mc-diamond"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>День {seasonData.totalDays - seasonData.daysRemaining}</span>
                    <span>День {seasonData.totalDays}</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {seasonData.milestones.map((milestone, i) => (
                    <motion.div
                      key={milestone.label}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex flex-col items-center rounded-lg p-3 text-center ${
                        milestone.completed
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/50 border border-border"
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="mb-1.5 h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="mb-1.5 h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium">{milestone.label}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4 lg:col-span-2"
          >
            <Card className="flex-1 border-hypixel-gold/20 bg-gradient-to-br from-card to-hypixel-gold/5">
              <CardContent className="flex h-full flex-col justify-center p-6">
                <Clock className="mb-3 h-8 w-8 text-hypixel-gold" />
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  Осталось
                </p>
                <p className="font-display text-4xl font-bold text-hypixel-gold-light">
                  {seasonData.daysRemaining}
                </p>
                <p className="text-muted-foreground">дней до конца сезона</p>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardContent className="flex h-full flex-col justify-center p-6">
                <Calendar className="mb-3 h-8 w-8 text-mc-diamond" />
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  Период
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {seasonData.startDate} — {seasonData.endDate}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  70 дней эпического ивента
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
