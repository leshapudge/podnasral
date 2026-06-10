/** Стример «авторизован», если хотя бы раз входил через Twitch OAuth. */
export const authorizedStreamerUserFilter = {
  accounts: { some: { provider: "twitch" as const } },
} as const;

export function authorizedParticipantsWhere(eventId: string) {
  return {
    eventId,
    user: authorizedStreamerUserFilter,
  };
}
