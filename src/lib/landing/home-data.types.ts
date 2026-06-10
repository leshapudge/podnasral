export interface HomeSeasonData {
  name: string;
  slug: string;
  status: string;
  progress: number;
  daysRemaining: number;
  daysUntilStart: number;
  totalDays: number;
  phase: string;
  startDate: string;
  startDateLong: string;
  endDate: string;
  isUpcoming: boolean;
  milestones: { label: string; completed: boolean }[];
}

export interface HomeLeaderboardEntry {
  rank: number;
  nickname: string;
  power: number;
  avatar: string | null;
  guild: string;
  trend: "up" | "down" | "same";
}

export interface HomeBossData {
  slug: string;
  name: string;
  subtitle: string;
  currentHp: number;
  maxHp: number;
  hpPercent: number;
  status: string;
  timeRemaining: string;
  totalDamagers: number;
  topDamagers: { nickname: string; damage: number; percent: number }[];
}

export interface HomeStat {
  label: string;
  value: string | number;
  icon: string;
  change?: string;
}

export interface HomePageData {
  season: HomeSeasonData | null;
  stats: HomeStat[];
  leaderboard: HomeLeaderboardEntry[];
  featuredBoss: HomeBossData | null;
  bosses: HomeBossData[];
}
