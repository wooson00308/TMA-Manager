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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-3">시즌 진행도</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
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
              경기장: <span className="text-white">넥서스 아레나 베타</span>
            </div>
          </div>
        </div>

        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-3">리그 순위</h3>
          <div className="space-y-2 text-sm">
            {leagueStandings.map((standing) => (
              <div 
                key={standing.rank}
                className={`flex justify-between ${
                  standing.highlight ? 'border-l-2 border-green-400 pl-2 text-green-400 font-semibold' : 'text-gray-400'
                }`}
              >
                <span>{standing.rank}. {standing.team}</span>
                <span className={standing.highlight ? 'text-green-400' : 'text-gray-300'}>
                  {standing.record}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-3">최근 성과</h3>
          <div className="space-y-2">
            {recentMatches.map((match, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  match.type === 'success' ? 'bg-green-400' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-400">vs {match.opponent}</span>
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
        <h3 className="text-xl font-orbitron font-semibold text-green-400 mb-4">ACTIVE PILOT ROSTER</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pilots.slice(0, 3).map((pilot) => (
            <PilotCard key={pilot.id} pilot={pilot} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberButton onClick={() => setScene('recon')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-play mr-2"></i>매치 시작
          </div>
          <div className="text-xs text-gray-400">사전 정찰부터 시작</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('scouting')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-users mr-2"></i>파일럿 관리
          </div>
          <div className="text-xs text-gray-400">영입 및 훈련</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('formation')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-cogs mr-2"></i>편성 관리
          </div>
          <div className="text-xs text-gray-400">기체-파일럿 조합</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('analysis')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-chart-bar mr-2"></i>전적 분석
          </div>
          <div className="text-xs text-gray-400">성과 및 통계</div>
        </CyberButton>
      </div>
    </div>
  );
}
