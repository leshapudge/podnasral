export const seasonData = {
  name: "Season I — Emerald Depths",
  slug: "emerald-depths",
  progress: 67,
  daysRemaining: 23,
  totalDays: 70,
  phase: "Mid-Season",
  status: "ACTIVE" as const,
  startDate: "2026-03-15",
  endDate: "2026-06-23",
  milestones: [
    { label: "Открытие", completed: true },
    { label: "Крафт", completed: true },
    { label: "Боссы", completed: true },
    { label: "Финал", completed: false },
  ],
};

export const osMeta = {
  version: "mineseason_v1.0.0",
};

export interface OsParticipant {
  rank: number;
  nickname: string;
  currentGame: string;
  score: number;
  power: number;
  online: boolean;
  guild?: string;
  trend?: "up" | "down" | "same";
}

export const participants: OsParticipant[] = [
  { rank: 1, nickname: "KarmikKoala", currentGame: "Pilot Brothers", score: 279, power: 48_920, online: true, guild: "Emerald Squad", trend: "up" },
  { rank: 2, nickname: "Melharucos", currentGame: "Hollow Knight", score: 265, power: 45_100, online: true, trend: "up" },
  { rank: 3, nickname: "xNestorio", currentGame: "Minecraft", score: 248, power: 43_870, online: true, guild: "Emerald Squad", trend: "same" },
  { rank: 4, nickname: "Dream", currentGame: "Subnautica", score: 220, power: 39_200, online: false, trend: "down" },
  { rank: 5, nickname: "Technoblade", score: 198, currentGame: "Terraria", power: 37_650, online: true, trend: "up" },
  { rank: 6, nickname: "Philza", currentGame: "Hardcore MC", score: 185, power: 35_400, online: true, trend: "same" },
  { rank: 7, nickname: "Tubbo", currentGame: "Stardew Valley", score: 172, power: 33_100, online: false, trend: "up" },
  { rank: 8, nickname: "Ranboo", currentGame: "Portal 2", score: 158, power: 31_800, online: true, trend: "down" },
  { rank: 9, nickname: "TommyInnit", currentGame: "GTA V", score: 142, power: 29_400, online: false, trend: "down" },
  { rank: 10, nickname: "Wilbur", currentGame: "Celeste", score: 128, power: 27_100, online: true, trend: "same" },
  { rank: 11, nickname: "Foolish", currentGame: "Raft", score: 115, power: 25_800, online: true, trend: "up" },
  { rank: 12, nickname: "Sapnap", currentGame: "Among Us", score: 101, power: 24_200, online: false, trend: "same" },
];

export const topPlayers = participants.slice(0, 8).map((p) => ({
  rank: p.rank,
  nickname: p.nickname,
  power: p.power,
  avatar: null,
  guild: p.guild ?? "—",
  trend: p.trend ?? ("same" as const),
}));

export const worldBoss = {
  name: "Wither King",
  subtitle: "Древний страж Нижнего мира",
  currentHp: 1_240_000,
  maxHp: 5_000_000,
  hpPercent: 24.8,
  status: "ACTIVE" as const,
  timeRemaining: "2д 14ч 32м",
  totalDamagers: 3_842,
  topDamagers: [
    { nickname: "xNestorio", damage: 892_400, percent: 18.2 },
    { nickname: "Dream", damage: 756_200, percent: 15.4 },
    { nickname: "Technoblade", damage: 621_000, percent: 12.7 },
  ],
};

export const recentActivity = [
  {
    id: "1",
    type: "craft" as const,
    player: "Dream",
    action: "скрафтил",
    item: "💎 Алмазный меч",
    power: "+420",
    time: "2 мин назад",
  },
  {
    id: "2",
    type: "game" as const,
    player: "xNestorio",
    action: "прошёл",
    item: "🧠 Memory Challenge",
    power: "+180",
    time: "4 мин назад",
  },
  {
    id: "3",
    type: "boss" as const,
    player: "Technoblade",
    action: "нанёс",
    item: "⚔️ 12,400 урона боссу",
    power: "",
    time: "6 мин назад",
  },
  {
    id: "4",
    type: "achievement" as const,
    player: "Philza",
    action: "получил",
    item: "🏆 Never Die",
    power: "+500",
    time: "8 мин назад",
  },
  {
    id: "5",
    type: "rank" as const,
    player: "Tubbo",
    action: "поднялся на",
    item: "📈 #5 в рейтинге",
    power: "",
    time: "12 мин назад",
  },
  {
    id: "6",
    type: "craft" as const,
    player: "Ranboo",
    action: "скрафтил",
    item: "🛡️ Незеритовая броня",
    power: "+680",
    time: "15 мин назад",
  },
];

export const statistics = [
  { label: "Игроков онлайн", value: 2_847, icon: "users", change: "+12%" },
  { label: "Игр сыграно", value: 184_320, icon: "gamepad", change: "+8%" },
  { label: "Предметов создано", value: 42_891, icon: "hammer", change: "+15%" },
  { label: "Урона боссу", value: 3_760_000, icon: "swords", change: "+24%" },
  { label: "Активных гильдий", value: 186, icon: "shield", change: "+3%" },
  { label: "Стримеров", value: 48, icon: "twitch", change: "+6%" },
];
