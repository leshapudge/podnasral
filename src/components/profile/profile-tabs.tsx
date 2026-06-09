"use client";

import { motion } from "framer-motion";
import {
  Backpack,
  Award,
  Gamepad2,
  History,
  Scroll,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTab } from "./tabs/inventory-tab";
import { AchievementsTab } from "./tabs/achievements-tab";
import { CompletionsTab } from "./tabs/completions-tab";
import { QuestsTab } from "./tabs/quests-tab";
import { HistoryTab } from "./tabs/history-tab";

const tabs = [
  { id: "inventory", label: "Инвентарь", icon: Backpack },
  { id: "achievements", label: "Достижения", icon: Award },
  { id: "completions", label: "Прохождения", icon: Gamepad2 },
  { id: "quests", label: "Квесты", icon: Scroll },
  { id: "history", label: "История", icon: History },
];

export function ProfileTabs() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="h-auto flex-wrap sm:flex-nowrap">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2 flex-1 sm:flex-none">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>
        <TabsContent value="achievements">
          <AchievementsTab />
        </TabsContent>
        <TabsContent value="completions">
          <CompletionsTab />
        </TabsContent>
        <TabsContent value="quests">
          <QuestsTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
