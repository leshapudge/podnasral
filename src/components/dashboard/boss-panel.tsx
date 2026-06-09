export interface BossData {
  name: string;
  currentHp: number;
  maxHp: number;
  hpPercent: number;
  status: string;
  topDamagers: { nickname: string; damage: number; percent: number }[];
}

export function BossPanel({ boss }: { boss: BossData | null }) {
  if (!boss) {
    return (
      <div className="mc-panel p-4">
        <h2 className="font-bold text-lg mb-2">🐉 Босс</h2>
        <p className="text-gray-500 text-sm">Нет активного босса</p>
      </div>
    );
  }

  return (
    <div className="mc-panel p-4">
      <h2 className="font-bold text-lg mb-2">🐉 {boss.name}</h2>
      <div className="h-4 bg-[#1a1a1a] border-2 border-[#222] mb-2">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-red-600 transition-all"
          style={{ width: `${boss.hpPercent}%` }}
        />
      </div>
      <div className="text-sm text-gray-400 mb-3">
        {boss.currentHp.toLocaleString()} / {boss.maxHp.toLocaleString()} HP
        {boss.status === "DEFEATED" && " — ПОБЕЖДЁН!"}
      </div>
      <div className="space-y-1">
        {boss.topDamagers.slice(0, 5).map((d) => (
          <div key={d.nickname} className="flex justify-between text-sm">
            <span>{d.nickname}</span>
            <span className="text-gray-400">{d.damage} ({d.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
