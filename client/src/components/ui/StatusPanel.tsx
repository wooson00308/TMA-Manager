import { useGameStore } from '@/stores/gameStore';

export function StatusPanel() {
  const { playerTeam } = useGameStore();

  if (!playerTeam) return null;

  return (
    <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md shadow-sky-100/50">
      <h3 className="text-sky-600 font-semibold mb-3 text-sm flex items-center">
        <i className="fas fa-chart-bar mr-2"></i>
        팀 현황
      </h3>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 flex items-center">
            <i className="fas fa-trophy mr-2 text-amber-500"></i>
            리그 순위:
          </span>
          <span className="text-sky-600 font-semibold">#{playerTeam.leagueRank}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600 flex items-center">
            <i className="fas fa-crosshairs mr-2 text-green-500"></i>
            승/패 기록:
          </span>
          <span className="text-slate-800 font-semibold">{playerTeam.wins}-{playerTeam.losses}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600 flex items-center">
            <i className="fas fa-user-astronaut mr-2 text-blue-500"></i>
            활성 파일럿:
          </span>
          <span className="text-emerald-600 font-semibold">6/8</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600 flex items-center">
            <i className="fas fa-clock mr-2 text-purple-500"></i>
            다음 경기:
          </span>
          <span className="text-amber-600 font-semibold">2일 후</span>
        </div>
      </div>
    </div>
  );
}
