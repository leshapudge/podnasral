export type PlayerClass = "WARRIOR" | "MINER" | "ARCHER" | "MAGE" | "CRAFTER";

export const classLabels: Record<PlayerClass, { name: string; icon: string; color: string }> = {
  WARRIOR: { name: "Воин", icon: "⚔️", color: "text-mc-redstone" },
  MINER: { name: "Шахтёр", icon: "⛏️", color: "text-mc-dirt" },
  ARCHER: { name: "Лучник", icon: "🏹", color: "text-primary" },
  MAGE: { name: "Маг", icon: "✨", color: "text-mc-diamond" },
  CRAFTER: { name: "Крафтер", icon: "🔨", color: "text-hypixel-gold" },
};

export const rarityStyles: Record<string, string> = {
  COMMON: "border-mc-stone/40 bg-mc-stone/10 text-mc-stone",
  UNCOMMON: "border-primary/40 bg-primary/10 text-primary",
  RARE: "border-mc-diamond/40 bg-mc-diamond/10 text-mc-diamond",
  EPIC: "border-purple-500/40 bg-purple-500/10 text-purple-400",
  LEGENDARY: "border-hypixel-gold/40 bg-hypixel-gold/10 text-hypixel-gold",
};
