export interface FeedItem {
  id: string;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  GAME_COMPLETED: "✅",
  GAME_DROPPED: "❌",
  AUCTION_WON: "🎰",
  BOSS_HIT: "⚔️",
  BOSS_DEFEATED: "🏆",
  LOOT: "🎁",
  CRAFT: "🔨",
};

export function FeedPanel({ items }: { items: FeedItem[] }) {
  return (
    <div className="mc-panel p-4">
      <h2 className="font-bold text-lg mb-3">📡 Лента ивента</h2>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.length === 0 && <p className="text-gray-500 text-sm">Пока тихо...</p>}
        {items.map((item) => (
          <div key={item.id} className="text-sm border-b border-[#3a3a3a] pb-2">
            <span className="mr-1">{TYPE_ICONS[item.type] ?? "•"}</span>
            <span className="font-semibold">{item.actor}</span>
            <span className="text-gray-400 ml-1">
              {formatFeedMessage(item)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatFeedMessage(item: FeedItem): string {
  const p = item.payload;
  switch (item.type) {
    case "GAME_COMPLETED":
      return `прошёл ${p.gameTitle} (+${p.score})`;
    case "GAME_DROPPED":
      return `дропнул ${p.gameTitle} (${p.penalty})`;
    case "AUCTION_WON":
      return `выиграл ${p.gameTitle}`;
    case "BOSS_HIT":
      return `нанёс ${p.damage} урона боссу`;
    case "BOSS_DEFEATED":
      return "босс повержен!";
    case "LOOT":
      return "получил лут";
    case "CRAFT":
      return `скрафтил ${p.result}`;
    default:
      return item.type;
  }
}
