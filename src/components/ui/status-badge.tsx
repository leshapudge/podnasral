import { cn } from "@/lib/utils/cn";

const STATUS_LABELS: Record<string, string> = {
  IDLE: "Выбирает игру",
  AUCTIONING: "Аукцион",
  AWAITING_DIFFICULTY: "Бросок сложности",
  PLAYING: "Играет",
  PAUSED: "Пауза",
  COMPLETED: "Завершил",
  DROPPED: "Дропнул",
  CASINO: "Казино",
};

const STATUS_COLORS: Record<string, string> = {
  IDLE: "bg-gray-600",
  AUCTIONING: "bg-purple-600",
  AWAITING_DIFFICULTY: "bg-yellow-600",
  PLAYING: "bg-green-600",
  PAUSED: "bg-orange-600",
  COMPLETED: "bg-blue-600",
  DROPPED: "bg-red-600",
  CASINO: "bg-emerald-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white",
        STATUS_COLORS[status] ?? "bg-gray-600",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
