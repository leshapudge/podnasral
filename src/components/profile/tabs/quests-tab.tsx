"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Scroll } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileQuest } from "@/lib/profile/profile-data.service";

const typeBadge: Record<string, "default" | "gold" | "secondary" | "outline"> = {
  DAILY: "secondary",
  WEEKLY: "default",
  SEASONAL: "gold",
  STORY: "outline",
};

const statusIcon = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: Circle,
  CLAIMED: CheckCircle2,
};

interface QuestsTabProps {
  quests?: ProfileQuest[];
}

export function QuestsTab({ quests = [] }: QuestsTabProps) {
  if (!quests.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Квесты сезона скоро появятся
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {quests.map((quest, i) => {
        const percent = Math.round((quest.progress / quest.target) * 100);
        const StatusIcon = statusIcon[quest.status as keyof typeof statusIcon] ?? Circle;
        const isDone = quest.status === "COMPLETED";

        return (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className={isDone ? "border-primary/40 bg-primary/5" : ""}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${isDone ? "bg-primary/20" : "bg-muted"}`}>
                      <StatusIcon className={`h-4 w-4 ${isDone ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{quest.name}</p>
                        <Badge variant={typeBadge[quest.type] ?? "outline"} className="text-[10px]">
                          {quest.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                        <Scroll className="h-3 w-3" />
                        Награда: {quest.reward}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {quest.expiresIn}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{quest.progress} / {quest.target}</span>
                    <span>{percent}%</span>
                  </div>
                  <Progress
                    value={percent}
                    className="h-2"
                    indicatorClassName={isDone ? "bg-primary" : "bg-hypixel-gold"}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
