import { useGameStore } from '@/stores/gameStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { PilotCard } from '@/components/ui/PilotCard';

export function HubScene() {
  const { setScene, playerTeam, pilots, currentSeason, currentWeek } = useGameStore();

  const recentMatches = [
    { opponent: '고스트 프로토콜', result: '승리', type: 'success' },
    { opponent: '네온 스파르탄', result: '승리', type: 'success' },
    { opponent: '크림슨 랜스', result: '패배', type: 'danger' },
  ];

  const leagueStandings = [
    { rank: 1, team: '보이드 헌터스', record: '15-2', highlight: false },
    { rank: 2, team: '크림슨 랜스', record: '13-4', highlight: false },
    { rank: 3, team: '트리니티 스쿼드', record: playerTeam ? `${playerTeam.wins}-${playerTeam.losses}` : '12-5', highlight: true },
    { rank: 4, team: '스틸 레이븐스', record: '10-7', highlight: false },
    { rank: 5, team: '고스트 프로토콜', record: '8-9', highlight: false },
  ];

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">작전 지휘부</h2>
        <p className="text-gray-400">시즌 현황 및 전략 지휘 센터</p>
      </div>

      {/* Season Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="cyber-border p-3 md:p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-3 text-sm md:text-base">시즌 진행도</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs md:text-sm mb-1">
                <span>{currentWeek}주차 / 12주</span>
                <span className="text-green-400">{Math.round((currentWeek / 12) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full cyber-glow" 
                  style={{ width: `${(currentWeek / 12) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              다음 매치: <span className="text-white">스틸 레이븐스</span><br/>
              <span className="hidden md:inline">경기장: <span className="text-white">넥서스 아레나 베타</span></span>
            </div>
          </div>
        </div>

        <div className="cyber-border p-3 md:p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-3 text-sm md:text-base">리그 순위</h3>
          <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
            {leagueStandings.slice(0, 5).map((standing) => (
              <div 
                key={standing.rank}
                className={`flex justify-between ${
                  standing.highlight ? 'border-l-2 border-green-400 pl-2 text-green-400 font-semibold' : 'text-gray-400'
                }`}
              >
                <span className="truncate">{standing.rank}. {standing.team}</span>
                <span className={`ml-2 ${standing.highlight ? 'text-green-400' : 'text-gray-300'}`}>
                  {standing.record}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="cyber-border p-3 md:p-4 bg-slate-800 md:col-span-2 lg:col-span-1">
          <h3 className="text-pink-400 font-semibold mb-3 text-sm md:text-base">최근 성과</h3>
          <div className="space-y-1 md:space-y-2">
            {recentMatches.map((match, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs md:text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  match.type === 'success' ? 'bg-green-400' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-400 truncate">vs {match.opponent}</span>
                <span className={`ml-auto ${
                  match.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {match.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pilot Status Grid */}
      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-orbitron font-semibold text-green-400 mb-4">활성 파일럿 로스터</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {pilots.slice(0, 3).map((pilot) => (
            <PilotCard key={pilot.id} pilot={pilot} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CyberButton onClick={() => setScene('match_prep')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-play mr-2"></i>경기 준비
          </div>
          <div className="text-xs text-gray-400">로스터→밴픽→전략→시뮬</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('scouting')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-users mr-2"></i>파일럿 관리
          </div>
          <div className="text-xs text-gray-400">영입 및 훈련</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('analysis')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-chart-bar mr-2"></i>전투 분석
          </div>
          <div className="text-xs text-gray-400">성과 및 통계</div>
        </CyberButton>
      </div>
    </div>
  );
}
