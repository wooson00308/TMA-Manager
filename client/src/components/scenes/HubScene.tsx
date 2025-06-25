import { useGameStore } from '@/stores/gameStore';
import { CyberButton } from '@/components/ui/CyberButton';

export function HubScene() {
  const { setScene, playerTeam, currentSeason, currentWeek } = useGameStore();

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
    <div className="scene-transition p-8">
      {/* Scene Header */}
      <div className="relative mb-8 bg-gradient-to-r from-slate-500/10 via-gray-500/5 to-zinc-500/10 backdrop-blur-lg border border-slate-200/30 rounded-2xl p-6 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100/20 to-gray-100/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-gray-500 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-satellite-dish text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
                대시보드
              </h1>
              <div className="flex items-center space-x-2 text-slate-600/80 text-sm font-medium">
                <i className="fas fa-chart-pie text-xs"></i>
                <span>시즌 현황 및 전략 지휘 센터</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="px-3 py-1 bg-slate-100/50 text-slate-700 rounded-full text-xs font-medium border border-slate-200/50">
              <i className="fas fa-home mr-1"></i>
              중앙 명령센터
            </div>
            <div className="px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200/50">
              <i className="fas fa-check-circle mr-1"></i>
              TRINITAS 연결됨
            </div>
          </div>
        </div>
      </div>

      {/* Season Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-2xl p-6 shadow-lg shadow-sky-100/50">
          <h3 className="text-sky-600 font-semibold mb-4 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-calendar-alt text-white text-sm"></i>
            </div>
            시즌 진행도
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">{currentWeek}주차 / 12주</span>
                <span className="text-sky-600 font-semibold">{Math.round((currentWeek / 12) * 100)}%</span>
              </div>
              <div className="w-full bg-sky-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-sky-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out shadow-md" 
                  style={{ width: `${(currentWeek / 12) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-slate-500 bg-sky-50 rounded-lg p-3">
              다음 매치: <span className="text-slate-800 font-semibold">스틸 레이븐스</span><br/>
              경기장: <span className="text-slate-800 font-semibold">넥서스 아레나 베타</span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-2xl p-6 shadow-lg shadow-sky-100/50">
          <h3 className="text-sky-600 font-semibold mb-4 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-trophy text-white text-sm"></i>
            </div>
            리그 순위
          </h3>
          <div className="space-y-3 text-sm">
            {leagueStandings.map((standing) => (
              <div 
                key={standing.rank}
                className={`flex justify-between items-center p-2 rounded-lg ${
                  standing.highlight 
                    ? 'bg-gradient-to-r from-sky-100 to-blue-100 border-l-4 border-sky-400 text-sky-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                    standing.highlight ? 'bg-sky-400 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {standing.rank}
                  </span>
                  {standing.team}
                </span>
                <span className={standing.highlight ? 'text-sky-600 font-bold' : 'text-slate-600'}>
                  {standing.record}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-2xl p-6 shadow-lg shadow-sky-100/50">
          <h3 className="text-sky-600 font-semibold mb-4 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-chart-line text-white text-sm"></i>
            </div>
            최근 성과
          </h3>
          <div className="space-y-3">
            {recentMatches.map((match, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    match.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}></div>
                  <span className="text-slate-600 text-sm">vs {match.opponent}</span>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  match.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {match.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions (without Match Find) */}
      <div className="bg-white/60 backdrop-blur-lg border border-sky-200/50 rounded-2xl p-8 shadow-lg shadow-sky-100/50">
        <h3 className="text-xl font-orbitron font-semibold text-slate-800 mb-6">빠른 작업</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CyberButton onClick={() => setScene('scouting')} variant="secondary" className="h-auto py-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-user-astronaut text-sky-600 text-2xl"></i>
              </div>
              <div className="font-semibold mb-2 text-lg text-slate-700">스쿼드 관리</div>
              <div className="text-sm text-slate-600">영입 및 훈련</div>
            </div>
          </CyberButton>
          
          <CyberButton onClick={() => setScene('analysis')} variant="default" className="h-auto py-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-chart-line text-2xl"></i>
              </div>
              <div className="font-semibold mb-2 text-lg">전투 분석</div>
              <div className="text-sm opacity-90">성과 및 통계</div>
            </div>
          </CyberButton>
        </div>
      </div>
    </div>
  );
}
