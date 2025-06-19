import { useGameStore } from '@/stores/gameStore';

export function StatusPanel() {
  const { playerTeam } = useGameStore();

  if (!playerTeam) return null;

  return (
    <div className="mt-6 p-3 cyber-border bg-slate-900">
      <h3 className="text-green-400 text-sm font-semibold mb-2">TEAM STATUS</h3>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">League Rank:</span>
          <span className="text-pink-400">#{playerTeam.leagueRank}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">W/L Record:</span>
          <span className="text-white">{playerTeam.wins}-{playerTeam.losses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Active Pilots:</span>
          <span className="text-white">6/8</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Next Match:</span>
          <span className="text-yellow-400">2 days</span>
        </div>
      </div>
    </div>
  );
}
