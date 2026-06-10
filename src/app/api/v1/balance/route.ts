import { jsonError } from "@/lib/api/errors";
import { getActiveEventOrNull } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";

export async function GET() {
  try {
    const event = await getActiveEventOrNull();
    const config = parseEventConfig(event?.config);

    return Response.json({
      rules: {
        scoring: {
          base: `${config.pointsPerHour} очков за каждый час HLTB игры`,
          time: "Быстрее HLTB — бонус до +20%; сильный перерасход времени — штраф до −20%",
          difficulty: config.difficultyMultipliers,
          modifierCap: `${Math.round(config.modifierScoreMultMin * 100)}%–${Math.round(config.modifierScoreMultMax * 100)}% от стака модификаторов`,
        },
        catchUp: config.catchUp,
        leaderSoftCap: config.leaderSoftCap,
        drop: {
          ratio: config.dropPenaltyRatio,
          note: "Штраф зависит от времени в игре; очки не уходят ниже нуля",
        },
        boss: config.boss,
        auction: {
          maxModifiers: config.maxModifiersPerAuction,
          droppedGamesExcluded: true,
        },
        loot: {
          note: "После игры — спины в слоте наград; дроп только оттуда. Аутсайдеры +1 спин; «Звёздный осколок Незера» +2",
        },
      },
      config,
    });
  } catch (e) {
    return jsonError(e);
  }
}
