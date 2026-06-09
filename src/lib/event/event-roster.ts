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
    twitchLogin: "kazanfarik",
    twitchId: "566104351",
    displayName: "kazanfarik",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/d7c7f3a6-225b-44f7-9ce4-27663ce6b8df-profile_image-300x300.png",
    displayOrder: 1,
    role: "ADMIN",
  },
  {
    twitchLogin: "blindzonexgod",
    twitchId: "613410561",
    displayName: "blindzonexgod",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/14477a4b-bdd1-44c4-b9de-f0c52fc24ee7-profile_image-300x300.png",
    displayOrder: 2,
  },
  {
    twitchLogin: "kwwwinn",
    twitchId: "909325269",
    displayName: "kwwwinn",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/415c3fdd-fbbb-4354-a04e-b4c398bc343f-profile_image-300x300.png",
    displayOrder: 3,
  },
  {
    twitchLogin: "kyotowave",
    twitchId: "881403434",
    displayName: "kyotowave",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/f9bce973-c02a-4941-8780-fa801d380d34-profile_image-300x300.png",
    displayOrder: 4,
  },
  {
    twitchLogin: "xu3t",
    twitchId: "570432437",
    displayName: "xu3t",
    image:
      "https://static-cdn.jtvnw.net/jtv_user_pictures/a98bc252-66b6-4a80-95f6-439aed77d05b-profile_image-300x300.png",
    displayOrder: 5,
  },
];

export const EVENT_STREAMER_LOGINS = EVENT_STREAMERS.map((s) => s.twitchLogin);
