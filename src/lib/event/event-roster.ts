/** Участники ивента — единый источник для seed и документации. */
export const EVENT_START_ISO = "2026-06-25T09:00:00.000Z";
export const EVENT_DURATION_DAYS = 14;

export interface EventRosterMember {
  twitchLogin: string;
  twitchId: string;
  displayName: string;
  image: string;
  displayOrder: number;
  /** Роль в БД при seed (kazanfarik — ADMIN, остальные STREAMER). */
  role?: "ADMIN" | "STREAMER";
}

export const EVENT_STREAMERS: EventRosterMember[] = [
  {
    twitchLogin: "karmikkoala",
    twitchId: "54742538",
    displayName: "KarmikKoala",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/40c080e2-1037-4501-8b88-231524cc8bc8-profile_image-300x300.png",
    displayOrder: 1,
  },
  {
    twitchLogin: "melharucos",
    twitchId: "26819117",
    displayName: "Melharucos",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/1f3d7e72-6c77-4fe7-9a08-def5ec31ed6b-profile_image-300x300.png",
    displayOrder: 2,
  },
  {
    twitchLogin: "xnestorio",
    twitchId: "46602222",
    displayName: "xNestorio",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/16145652-d585-466b-9d66-671b164084a1-profile_image-300x300.png",
    displayOrder: 3,
  },
  {
    twitchLogin: "dream",
    twitchId: "451544676",
    displayName: "Dream",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/3aaeb687-ce59-4c18-b701-69a231ef06e9-profile_image-300x300.png",
    displayOrder: 4,
  },
  {
    twitchLogin: "technoblade",
    twitchId: "32920789",
    displayName: "Technoblade",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/technoblade-profile_image-b9cdfb76fd865da2-300x300.png",
    displayOrder: 5,
  },
  {
    twitchLogin: "kazanfarik",
    twitchId: "566104351",
    displayName: "kazanfarik",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/d7c7f3a6-225b-44f7-9ce4-27663ce6b8df-profile_image-300x300.png",
    displayOrder: 6,
    role: "ADMIN",
  },
];

export const EVENT_STREAMER_LOGINS = EVENT_STREAMERS.map((s) => s.twitchLogin);
