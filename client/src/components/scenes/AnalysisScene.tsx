import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBattleStore } from '@/stores/battleStore';

interface BattleAnalysis {
  battleId: string;
  result: 'victory' | 'defeat' | 'draw';
  duration: number;
  enemyTeam: string;
  playerPerformance: Array<{
    pilotId: number;
    pilotName: string;
    damageDealt: number;
    damageTaken: number;
    accuracy: number;
    survivalTime: number;
    rating: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  tacticalSummary: {
    strongPoints: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  statistics: {
    totalDamage: number;
    averageAccuracy: number;
    unitsLost: number;
    criticalHits: number;
  };
}

export function AnalysisScene() {
  const { currentBattle } = useBattleStore();
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'tactics' | 'history'>('overview');

  // Fetch team battles from API
  const { data: teamBattlesData = [] } = useQuery({
    queryKey: ['/api/battles/team/1'],
    enabled: selectedTab === 'history'
  });

  // Get battle logs from current battle
  const battleLogs = currentBattle?.log || [];

  // Mock battle analysis data - in a real app this would come from the API
  const battleAnalysis: BattleAnalysis = {
    battleId: currentBattle?.id || 'demo_battle',
    result: 'victory',
    duration: 8.5,
    enemyTeam: 'Steel Ravens',
    playerPerformance: [
      {
        pilotId: 1,
        pilotName: 'SASHA-03',
        damageDealt: 245,
        damageTaken: 123,
        accuracy: 78,
        survivalTime: 8.5,
        rating: 'excellent'
      },
      {
        pilotId: 2,
        pilotName: 'MENTE-11',
        damageDealt: 156,
        damageTaken: 67,
        accuracy: 92,
        survivalTime: 8.5,
        rating: 'good'
      },
      {
        pilotId: 3,
        pilotName: 'AZUMA-07',
        damageDealt: 321,
        damageTaken: 89,
        accuracy: 94,
        survivalTime: 8.5,
        rating: 'excellent'
      }
    ],
    tacticalSummary: {
      strongPoints: [
        'Excellent coordination between units',
        'Superior long-range engagement',
        'Effective use of terrain cover'
      ],
      weaknesses: [
        'Slow initial positioning',
        'Overextension in mid-battle',
        'Limited anti-armor capabilities'
      ],
      recommendations: [
        'Focus on early positioning drills',
        'Develop restraint protocols',
        'Consider armor-piercing loadouts'
      ]
    },
    statistics: {
      totalDamage: 722,
      averageAccuracy: 88,
      unitsLost: 0,
      criticalHits: 7
    }
  };



  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-emerald-600';
      case 'good': return 'text-sky-600';
      case 'average': return 'text-amber-600';
      case 'poor': return 'text-rose-600';
      default: return 'text-slate-600';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'victory': return 'text-emerald-600';
      case 'defeat': return 'text-rose-600';
      case 'draw': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  };

  const tabButtons = [
    { id: 'overview', label: '개요', icon: 'fas fa-chart-pie' },
    { id: 'performance', label: '성과 분석', icon: 'fas fa-user' },
    { id: 'tactics', label: '전술 분석', icon: 'fas fa-chess' },
    { id: 'history', label: '전투 기록', icon: 'fas fa-history' }
  ];

  return (
    <div className="scene-transition">
      {/* Scene Header */}
      <div className="relative mb-8 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-indigo-500/10 backdrop-blur-lg border border-sky-200/30 rounded-2xl p-6 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-100/20 to-blue-100/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-chart-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                전투 후 분석
              </h1>
              <div className="flex items-center space-x-2 text-sky-600/80 text-sm font-medium">
                <i className="fas fa-brain text-xs"></i>
                <span>종합적인 전투 데이터 분석 및 전략적 통찰</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="px-3 py-1 bg-sky-100/50 text-sky-700 rounded-full text-xs font-medium border border-sky-200/50">
              <i className="fas fa-satellite mr-1"></i>
              데이터 분석 시스템
            </div>
            <div className="px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200/50">
              <i className="fas fa-check-circle mr-1"></i>
              TRINITAS 연결됨
            </div>
          </div>
        </div>
      </div>

      {/* Battle Result Header */}
      <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-orbitron font-semibold text-slate-800 mb-1">
              vs {battleAnalysis.enemyTeam}
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className={`font-bold text-lg ${getResultColor(battleAnalysis.result)}`}>
                {battleAnalysis.result.toUpperCase()}
              </div>
              <div className="text-slate-600">
                지속 시간: {battleAnalysis.duration}분
              </div>
              <div className="text-slate-600">
                전투 ID: {battleAnalysis.battleId}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-sky-600">
              {battleAnalysis.statistics.totalDamage}
            </div>
            <div className="text-xs text-slate-600">총 피해량</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {tabButtons.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 p-3 text-center transition-all rounded-lg ${
              selectedTab === tab.id
                ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg'
                : 'bg-white/70 text-slate-600 hover:bg-sky-50 border border-sky-200'
            }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="scrollable-content">
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
              <h3 className="text-sky-600 font-semibold mb-4">전투 통계</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-center">
                  <div className="text-emerald-600 font-bold text-2xl">
                    {battleAnalysis.statistics.totalDamage}
                  </div>
                  <div className="text-xs text-slate-600">총 피해량</div>
                </div>
                <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-center">
                  <div className="text-sky-600 font-bold text-2xl">
                    {battleAnalysis.statistics.averageAccuracy}%
                  </div>
                  <div className="text-xs text-slate-600">평균 명중률</div>
                </div>
                <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-center">
                  <div className="text-amber-600 font-bold text-2xl">
                    {battleAnalysis.statistics.criticalHits}
                  </div>
                  <div className="text-xs text-slate-600">치명타</div>
                </div>
                <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-center">
                  <div className="text-rose-600 font-bold text-2xl">
                    {battleAnalysis.statistics.unitsLost}
                  </div>
                  <div className="text-xs text-slate-600">손실 유닛</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
              <h3 className="text-sky-600 font-semibold mb-4">요약</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-emerald-600 text-sm font-semibold">승리 요인:</div>
                  <div className="text-xs text-slate-700">
                    우수한 명중률과 전술적 포지셔닝으로 결정적인 교전 승리를 달성했습니다.
                  </div>
                </div>
                <div>
                  <div className="text-amber-600 text-sm font-semibold">핵심 순간:</div>
                  <div className="text-xs text-slate-700">
                    4분 30초 치명적인 측면 기동, AZUMA-07의 파괴적인 저격 공격.
                  </div>
                </div>
                <div>
                  <div className="text-sky-600 text-sm font-semibold">팀 시너지:</div>
                  <div className="text-xs text-slate-700">
                    돌격 유닛과 지원 유닛 간의 뛰어난 협조.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'performance' && (
          <div className="space-y-4">
            {battleAnalysis.playerPerformance.map((performance, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sky-600 font-semibold text-lg">
                      {performance.pilotName}
                    </h3>
                    <div className="text-xs text-slate-600">
                      파일럿 성과 분석
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${getRatingColor(performance.rating)}`}>
                    {performance.rating.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-rose-600 font-bold text-xl">
                      {performance.damageDealt}
                    </div>
                    <div className="text-xs text-slate-600">피해량</div>
                  </div>
                  <div className="text-center">
                    <div className="text-amber-600 font-bold text-xl">
                      {performance.damageTaken}
                    </div>
                    <div className="text-xs text-slate-600">받은 피해</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sky-600 font-bold text-xl">
                      {performance.accuracy}%
                    </div>
                    <div className="text-xs text-slate-600">명중률</div>
                  </div>
                  <div className="text-center">
                    <div className="text-emerald-600 font-bold text-xl">
                      {performance.survivalTime}m
                    </div>
                    <div className="text-xs text-slate-600">생존 시간</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'tactics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
              <h3 className="text-emerald-600 font-semibold mb-3">강점</h3>
              <div className="space-y-2">
                {battleAnalysis.tacticalSummary.strongPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
                    <div className="text-sm text-slate-700">{point}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
              <h3 className="text-rose-600 font-semibold mb-3">약점</h3>
              <div className="space-y-2">
                {battleAnalysis.tacticalSummary.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-rose-600 rounded-full mt-2"></div>
                    <div className="text-sm text-slate-700">{weakness}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
              <h3 className="text-amber-600 font-semibold mb-3">권장사항</h3>
              <div className="space-y-2">
                {battleAnalysis.tacticalSummary.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                    <div className="text-sm text-slate-700">{rec}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
              <h3 className="text-sky-600 font-semibold mb-4">최근 전투</h3>
              
              {Array.isArray(teamBattlesData) && teamBattlesData.length > 0 ? (
                <div className="space-y-2">
                  {(teamBattlesData as any[]).slice(0, 10).map((battle: any, index: number) => (
                    <div key={index} className="bg-sky-50 border border-sky-100 rounded-lg p-3 hover:bg-sky-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-slate-800 font-semibold">
                            Battle #{battle.id}
                          </div>
                          <div className="text-xs text-slate-600">
                            시즌 {battle.season}, 주차 {battle.week}
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          battle.winnerId === 1 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {battle.winnerId === 1 ? '승리' : '패배'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-600 py-8">
                  <div className="mb-2">
                    <i className="fas fa-database text-2xl"></i>
                  </div>
                  <div>전투 기록이 없습니다</div>
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
              <h3 className="text-sky-600 font-semibold mb-4">통신 기록</h3>
              
              {battleLogs.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
                  {battleLogs.map((log: any, index: number) => (
                    <div key={index} className="text-slate-700">
                      <span className="text-slate-500">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      {log.speaker && (
                        <span className="text-sky-600 font-semibold"> {log.speaker}:</span>
                      )}
                      <span className="ml-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-600 py-4">
                  <div>통신 기록이 없습니다</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
