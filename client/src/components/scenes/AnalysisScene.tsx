import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const { setScene, pilots } = useGameStore();
  const { currentBattle, battleHistory } = useBattleStore();
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'tactics' | 'history'>('overview');

  // Fetch team battles from API
  const { data: teamBattlesData = [] } = useQuery({
    queryKey: ['/api/battles/team/1'],
    enabled: selectedTab === 'history'
  });

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
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'average': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'victory': return 'text-green-400';
      case 'defeat': return 'text-red-400';
      case 'draw': return 'text-yellow-400';
      default: return 'text-gray-400';
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
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">전투 후 분석</h2>
        <p className="text-gray-400">종합적인 전투 데이터 분석 및 전략적 통찰</p>
      </div>

      {/* Battle Result Header */}
      <div className="cyber-border p-4 bg-slate-800 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-orbitron font-semibold text-white mb-1">
              vs {battleAnalysis.enemyTeam}
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className={`font-bold text-lg ${getResultColor(battleAnalysis.result)}`}>
                {battleAnalysis.result.toUpperCase()}
              </div>
              <div className="text-gray-400">
                지속 시간: {battleAnalysis.duration}분
              </div>
              <div className="text-gray-400">
                전투 ID: {battleAnalysis.battleId}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {battleAnalysis.statistics.totalDamage}
            </div>
            <div className="text-xs text-gray-400">총 피해량</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {tabButtons.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 p-3 text-center transition-colors ${
              selectedTab === tab.id
                ? 'bg-green-400 text-black font-semibold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-4">전투 통계</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-green-400 font-bold text-2xl">
                    {battleAnalysis.statistics.totalDamage}
                  </div>
                  <div className="text-xs text-gray-400">총 피해량</div>
                </div>
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-blue-400 font-bold text-2xl">
                    {battleAnalysis.statistics.averageAccuracy}%
                  </div>
                  <div className="text-xs text-gray-400">평균 명중률</div>
                </div>
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-yellow-400 font-bold text-2xl">
                    {battleAnalysis.statistics.criticalHits}
                  </div>
                  <div className="text-xs text-gray-400">치명타</div>
                </div>
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-red-400 font-bold text-2xl">
                    {battleAnalysis.statistics.unitsLost}
                  </div>
                  <div className="text-xs text-gray-400">손실 유닛</div>
                </div>
              </div>
            </div>

            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-4">요약</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-green-400 text-sm font-semibold">승리 요인:</div>
                  <div className="text-xs text-gray-300">
                    우수한 명중률과 전술적 포지셔닝으로 결정적인 교전 승리를 달성했습니다.
                  </div>
                </div>
                <div>
                  <div className="text-yellow-400 text-sm font-semibold">핵심 순간:</div>
                  <div className="text-xs text-gray-300">
                    4분 30초 치명적인 측면 기동, AZUMA-07의 파괴적인 저격 공격.
                  </div>
                </div>
                <div>
                  <div className="text-blue-400 text-sm font-semibold">팀 시너지:</div>
                  <div className="text-xs text-gray-300">
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
              <div key={index} className="cyber-border p-4 bg-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-green-400 font-semibold text-lg">
                      {performance.pilotName}
                    </h3>
                    <div className="text-xs text-gray-400">
                      파일럿 성과 분석
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${getRatingColor(performance.rating)}`}>
                    {performance.rating.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-xl">
                      {performance.damageDealt}
                    </div>
                    <div className="text-xs text-gray-400">피해량</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold text-xl">
                      {performance.damageTaken}
                    </div>
                    <div className="text-xs text-gray-400">받은 피해</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-xl">
                      {performance.accuracy}%
                    </div>
                    <div className="text-xs text-gray-400">명중률</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-xl">
                      {performance.survivalTime}m
                    </div>
                    <div className="text-xs text-gray-400">생존 시간</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'tactics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-green-400 font-semibold mb-3">강점</h3>
              <div className="space-y-2">
                {battleAnalysis.tacticalSummary.strongPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div className="text-sm text-gray-300">{point}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-red-400 font-semibold mb-3">약점</h3>
              <div className="space-y-2">
                {battleAnalysis.tacticalSummary.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                    <div className="text-sm text-gray-300">{weakness}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-yellow-400 font-semibold mb-3">권장사항</h3>
              <div className="space-y-2">
                {battleAnalysis.tacticalSummary.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                    <div className="text-sm text-gray-300">{rec}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-4">
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-4">최근 전투</h3>
              
              {Array.isArray(teamBattlesData) && teamBattlesData.length > 0 ? (
                <div className="space-y-2">
                  {(teamBattlesData as any[]).slice(0, 10).map((battle: any, index: number) => (
                    <div key={index} className="cyber-border p-3 bg-slate-900 hover:bg-slate-700 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-semibold">
                            Battle #{battle.id}
                          </div>
                          <div className="text-xs text-gray-400">
                            Season {battle.season}, Week {battle.week}
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          battle.winnerId === 1 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {battle.winnerId === 1 ? '승리' : '패배'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="mb-2">
                    <i className="fas fa-database text-2xl"></i>
                  </div>
                  <div>전투 기록이 없습니다</div>
                </div>
              )}
            </div>

            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-4">COMMUNICATION LOG</h3>
              
              {battleHistory.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
                  {battleHistory.map((log, index) => (
                    <div key={index} className="text-gray-300">
                      <span className="text-gray-400">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      {log.speaker && (
                        <span className="text-green-400 font-semibold"> {log.speaker}:</span>
                      )}
                      <span className="ml-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <div>No communication logs available</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <CyberButton onClick={() => setScene('hub')}>
          <div className="text-center">
            <div className="text-pink-400 font-semibold mb-1">
              <i className="fas fa-home mr-2"></i>RETURN TO HUB
            </div>
            <div className="text-xs text-gray-400">Command center</div>
          </div>
        </CyberButton>

        <CyberButton onClick={() => setScene('formation')}>
          <div className="text-center">
            <div className="text-pink-400 font-semibold mb-1">
              <i className="fas fa-cogs mr-2"></i>ADJUST FORMATION
            </div>
            <div className="text-xs text-gray-400">Optimize setup</div>
          </div>
        </CyberButton>

        <CyberButton onClick={() => setScene('battle')}>
          <div className="text-center">
            <div className="text-pink-400 font-semibold mb-1">
              <i className="fas fa-redo mr-2"></i>NEW BATTLE
            </div>
            <div className="text-xs text-gray-400">Deploy again</div>
          </div>
        </CyberButton>
      </div>
    </div>
  );
}
