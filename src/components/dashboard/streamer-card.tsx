import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";

export interface StreamerCardData {
  id: string;
  rank: number;
  nickname: string;
  avatar: string | null;
  totalPoints: number;
  status: string;
  isLive: boolean;
  currentGame: {
    title: string;
    coverImage?: string | null;
    progressPct?: number;
    difficulty?: string | null;
  } | null;
}

export function StreamerCard({ streamer }: { streamer: StreamerCardData }) {
  const progress = streamer.currentGame?.progressPct ?? 0;

  return (
    <div className="mc-panel p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-14 h-14 bg-[#3a3a3a] border-2 border-[#222] overflow-hidden">
            {streamer.avatar ? (
              <Image src={streamer.avatar} alt="" width={56} height={56} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">⛏</div>
            )}
          </div>
          {streamer.isLive && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1">
              LIVE
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--mc-gold)] font-bold">#{streamer.rank}</span>
            <span className="font-bold truncate">{streamer.nickname}</span>
          </div>
          <div className="text-sm text-gray-400">{streamer.totalPoints} очков</div>
          <StatusBadge status={streamer.status} />
        </div>
      </div>

      {streamer.currentGame && (
        <div className="flex gap-2 items-center">
          {streamer.currentGame.coverImage && (
            <div className="w-10 h-14 relative shrink-0 border border-[#222]">
              <Image
                src={streamer.currentGame.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{streamer.currentGame.title}</div>
            {streamer.currentGame.difficulty && (
              <div className="text-xs text-gray-500">{streamer.currentGame.difficulty}</div>
            )}
            <div className="mt-1 h-2 bg-[#1a1a1a] border border-[#222]">
              <div
                className="h-full bg-[var(--mc-accent)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
