type LiveEvent =
  | { type: "leaderboard.patch"; data: unknown }
  | { type: "auction.tick"; data: { auctionId: string; step: number; eliminatedGameId?: string; winnerGameId?: string } }
  | { type: "boss.hp"; data: { currentHp: number; maxHp: number; status: string } }
  | { type: "feed.item"; data: unknown };

type Listener = (event: LiveEvent) => void;

class LiveBroadcaster {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: LiveEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error("[live] listener error", e);
      }
    }
  }
}

export const liveBroadcaster = new LiveBroadcaster();

export type { LiveEvent };
