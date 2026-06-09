export type PlayerClass = "WARRIOR" | "MINER" | "ARCHER" | "MAGE" | "CRAFTER";

export const playerProfile = {
  id: "player-001",
  nickname: "xNestorio",
  avatar: null as string | null,
  level: 42,
  experience: 18_450,
  experienceToNext: 25_000,
  playerClass: "WARRIOR" as PlayerClass,
  power: 48_920,
  rating: 1,
  ratingDelta: 0,
  guild: "Emerald Squad",
  season: "Season I — Emerald Depths",
  joinedAt: "2026-03-15",
  provider: "TWITCH",
};

export const classLabels: Record<PlayerClass, { name: string; icon: string; color: string }> = {
  WARRIOR: { name: "Воин", icon: "⚔️", color: "text-mc-redstone" },
  MINER: { name: "Шахтёр", icon: "⛏️", color: "text-mc-dirt" },
  ARCHER: { name: "Лучник", icon: "🏹", color: "text-primary" },
  MAGE: { name: "Маг", icon: "✨", color: "text-mc-diamond" },
  CRAFTER: { name: "Крафтер", icon: "🔨", color: "text-hypixel-gold" },
};

export const inventoryItems = [
  { id: "1", kind: "RESOURCE" as const, name: "Железная руда", icon: "🪨", rarity: "COMMON", quantity: 248, slot: null },
  { id: "2", kind: "RESOURCE" as const, name: "Изумруд", icon: "💚", rarity: "RARE", quantity: 64, slot: null },
  { id: "3", kind: "RESOURCE" as const, name: "Алмаз", icon: "💎", rarity: "EPIC", quantity: 18, slot: null },
  { id: "4", kind: "RESOURCE" as const, name: "Незерит", icon: "🖤", rarity: "LEGENDARY", quantity: 4, slot: null },
  { id: "5", kind: "ITEM" as const, name: "Алмазный меч", icon: "🗡️", rarity: "EPIC", quantity: 1, slot: "WEAPON", power: 420, equipped: true },
  { id: "6", kind: "ITEM" as const, name: "Незеритовая кира", icon: "⛏️", rarity: "LEGENDARY", quantity: 1, slot: "TOOL", power: 380, equipped: true },
  { id: "7", kind: "ITEM" as const, name: "Изумрудный шлем", icon: "🪖", rarity: "RARE", quantity: 1, slot: "HELMET", power: 210, equipped: true },
  { id: "8", kind: "ITEM" as const, name: "Золотая броня", icon: "🛡️", rarity: "RARE", quantity: 1, slot: "ARMOR", power: 290, equipped: false },
  { id: "9", kind: "ITEM" as const, name: "Кольцо силы", icon: "💍", rarity: "EPIC", quantity: 1, slot: "ACCESSORY", power: 150, equipped: true },
];

export const achievements = [
  { id: "a1", name: "Первая кровь", description: "Пройди первую мини-игру", icon: "🎯", rarity: "COMMON", unlockedAt: "2026-03-16", powerBonus: 50, secret: false },
  { id: "a2", name: "Мастер крафта", description: "Создай 50 предметов", icon: "🔨", rarity: "RARE", unlockedAt: "2026-04-02", powerBonus: 200, secret: false },
  { id: "a3", name: "Охотник на боссов", description: "Нанеси 100,000 урона боссу", icon: "💀", rarity: "EPIC", unlockedAt: "2026-04-18", powerBonus: 500, secret: false },
  { id: "a4", name: "Топ-10", description: "Войди в топ-10 рейтинга", icon: "🏆", rarity: "EPIC", unlockedAt: "2026-05-01", powerBonus: 300, secret: false },
  { id: "a5", name: "???", description: "Секретное достижение", icon: "❓", rarity: "LEGENDARY", unlockedAt: null, powerBonus: 1000, secret: true },
  { id: "a6", name: "Скоростной демон", description: "Пройди Reaction за 10 секунд", icon: "⚡", rarity: "RARE", unlockedAt: "2026-05-12", powerBonus: 150, secret: false },
];

export const gameCompletions = [
  { id: "c1", game: "Memory Challenge", type: "MEMORY", score: 9_840, maxScore: 10_000, rewards: "+120 🪨 +45 💚", completedAt: "2026-06-07 14:32", duration: "2м 14с" },
  { id: "c2", game: "Quiz Master", type: "QUIZ", score: 8_200, maxScore: 10_000, rewards: "+80 🪨 +30 💎", completedAt: "2026-06-07 12:15", duration: "4м 02с" },
  { id: "c3", game: "Clicker Rush", type: "CLICKER", score: 7_650, maxScore: 10_000, rewards: "+95 🪨", completedAt: "2026-06-06 21:40", duration: "1м 48с" },
  { id: "c4", game: "Reaction Test", type: "REACTION", score: 9_100, maxScore: 10_000, rewards: "+60 🪨 +20 💚", completedAt: "2026-06-06 18:22", duration: "0м 58с" },
  { id: "c5", game: "Block Puzzle", type: "PUZZLE", score: 6_400, maxScore: 10_000, rewards: "+70 🪨", completedAt: "2026-06-05 16:10", duration: "5м 33с" },
];

export const quests = [
  { id: "q1", name: "Ежедневный шахтёр", type: "DAILY", progress: 8, target: 10, status: "IN_PROGRESS", reward: "+50 💎", expiresIn: "6ч 12м" },
  { id: "q2", name: "Победи босса", type: "WEEKLY", progress: 1, target: 1, status: "COMPLETED", reward: "+200 PWR", expiresIn: "3д 4ч" },
  { id: "q3", name: "Скрафти 5 мечей", type: "WEEKLY", progress: 3, target: 5, status: "IN_PROGRESS", reward: "🗡️ Редкий меч", expiresIn: "3д 4ч" },
  { id: "q4", name: "Путь героя", type: "SEASONAL", progress: 12, target: 20, status: "IN_PROGRESS", reward: "+1000 PWR", expiresIn: "23д" },
  { id: "q5", name: "Пройди все игры", type: "STORY", progress: 4, target: 5, status: "IN_PROGRESS", reward: "🏆 Достижение", expiresIn: "—" },
];

export const history = [
  { id: "h1", type: "CRAFT", title: "Скрафчен Алмазный меч", detail: "-24 💎 -8 🪨 → 🗡️ +420 PWR", timestamp: "2026-06-07 15:01" },
  { id: "h2", type: "GAME", title: "Пройдена Memory Challenge", detail: "Score: 9,840 · +120 🪨 +45 💚", timestamp: "2026-06-07 14:32" },
  { id: "h3", type: "BOSS", title: "Урон боссу Wither King", detail: "-12,400 HP · +180 PWR", timestamp: "2026-06-07 13:20" },
  { id: "h4", type: "QUEST", title: "Квест «Победи босса» выполнен", detail: "Награда: +200 PWR", timestamp: "2026-06-07 11:05" },
  { id: "h5", type: "RANK", title: "Подъём в рейтинге", detail: "#3 → #1", timestamp: "2026-06-06 22:18" },
  { id: "h6", type: "ACHIEVEMENT", title: "Получено «Скоростной демон»", detail: "+150 PWR", timestamp: "2026-06-05 19:44" },
  { id: "h7", type: "EQUIP", title: "Экипировано: Незеритовая кира", detail: "+380 PWR", timestamp: "2026-06-05 17:30" },
  { id: "h8", type: "GAME", title: "Пройден Block Puzzle", detail: "Score: 6,400 · +70 🪨", timestamp: "2026-06-05 16:10" },
];

export const rarityStyles: Record<string, string> = {
  COMMON: "border-mc-stone/40 bg-mc-stone/10 text-mc-stone",
  UNCOMMON: "border-primary/40 bg-primary/10 text-primary",
  RARE: "border-mc-diamond/40 bg-mc-diamond/10 text-mc-diamond",
  EPIC: "border-purple-500/40 bg-purple-500/10 text-purple-400",
  LEGENDARY: "border-hypixel-gold/50 bg-hypixel-gold/10 text-hypixel-gold-light",
};
