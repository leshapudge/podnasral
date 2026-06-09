"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gamepad2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileCompletion } from "@/lib/profile/profile-data.service";
import { formatNumber } from "@/lib/utils";

const typeColors: Record<string, string> = {
  CATALOG: "text-primary",
  QUIZ: "text-mc-diamond",
  CLICKER: "text-hypixel-gold",
  PUZZLE: "text-purple-400",
  MEMORY: "text-primary",
  REACTION: "text-mc-redstone",
};

interface CompletionsTabProps {
  completions?: ProfileCompletion[];
}

export function CompletionsTab({ completions = [] }: CompletionsTabProps) {
  if (!completions.length) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Пока нет прохождений
        </p>
        <Link
          href="/completions"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          Открыть каталог игр →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {completions.map((completion, i) => {
        const percent = Math.round((completion.score / completion.maxScore) * 100);

        return (
          <motion.div
            key={completion.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Gamepad2 className={`h-5 w-5 ${typeColors[completion.type] ?? "text-primary"}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{completion.game}</p>
                      <p className="text-xs text-muted-foreground">
                        {completion.completedAt} · {completion.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {percent >= 90 && (
                      <Star className="h-4 w-4 fill-hypixel-gold text-hypixel-gold" />
                    )}
                    <Badge variant={percent >= 80 ? "gold" : "secondary"}>
                      {formatNumber(completion.score)} pts
                    </Badge>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress
                    value={percent}
                    className="h-2"
                    indicatorClassName={
                      percent >= 90
                        ? "bg-hypixel-gold"
                        : percent >= 70
                          ? "bg-primary"
                          : "bg-mc-stone"
                    }
                  />
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Награда: <span className="text-foreground">{completion.rewards}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
