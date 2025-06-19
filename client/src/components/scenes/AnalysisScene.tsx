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

  const { data: teamBattles } = useQuery({
    queryKey: ['/api/battles/team/1'],
  });

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
    { id: 'overview', label: 'OVERVIEW', icon: 'fas fa-chart-pie' },
    { id: 'performance', label: 'PERFORMANCE', icon: 'fas fa-user' },
    { id: 'tactics', label: 'TACTICS', icon: 'fas fa-chess' },
    { id: 'history', label: 'HISTORY', icon: 'fas fa-history' }
  ];

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">POST-BATTLE ANALYSIS</h2>
        <p className="text-gray-400">Comprehensive battle data analysis and strategic insights</p>
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
                Duration: {battleAnalysis.duration} minutes
              </div>
              <div className="text-gray-400">
                Battle ID: {battleAnalysis.battleId}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {battleAnalysis.statistics.totalDamage}
            </div>
            <div className="text-xs text-gray-400">Total Damage</div>
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
              <h3 className="text-pink-400 font-semibold mb-4">BATTLE STATISTICS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-green-400 font-bold text-2xl">
                    {battleAnalysis.statistics.totalDamage}
                  </div>
                  <div className="text-xs text-gray-400">Total Damage</div>
                </div>
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-blue-400 font-bold text-2xl">
                    {battleAnalysis.statistics.averageAccuracy}%
                  </div>
                  <div className="text-xs text-gray-400">Avg Accuracy</div>
                </div>
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-yellow-400 font-bold text-2xl">
                    {battleAnalysis.statistics.criticalHits}
                  </div>
                  <div className="text-xs text-gray-400">Critical Hits</div>
                </div>
                <div className="cyber-border p-3 bg-slate-900 text-center">
                  <div className="text-red-400 font-bold text-2xl">
                    {battleAnalysis.statistics.unitsLost}
                  </div>
                  <div className="text-xs text-gray-400">Units Lost</div>
                </div>
              </div>
            </div>

            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-pink-400 font-semibold mb-4">QUICK SUMMARY</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-green-400 text-sm font-semibold">Victory Factors:</div>
                  <div className="text-xs text-gray-300">
                    Superior accuracy and tactical positioning led to decisive engagement victory.
                  </div>
                </div>
                <div>
                  <div className="text-yellow-400 text-sm font-semibold">Key Moments:</div>
                  <div className="text-xs text-gray-300">
                    Critical flanking maneuver at 4:30, devastating sniper shots from AZUMA-07.
                  </div>
                </div>
                <div>
                  <div className="text-blue-400 text-sm font-semibold">Team Synergy:</div>
                  <div className="text-xs text-gray-300">
                    Excellent coordination between assault and support units.
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
                      Pilot Performance Analysis
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
                    <div className="text-xs text-gray-400">Damage Dealt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold text-xl">
                      {performance.damageTaken}
                    </div>
                    <div className="text-xs text-gray-400">Damage Taken</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-xl">
                      {performance.accuracy}%
                    </div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-xl">
                      {performance.survivalTime}m
                    </div>
                    <div className="text-xs text-gray-400">Survival Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'tactics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="cyber-border p-4 bg-slate-800">
              <h3 className="text-green-400 font-semibold mb-3">STRONG POINTS</h3>
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
              <h3 className="text-red-400 font-semibold mb-3">WEAKNESSES</h3>
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
              <h3 className="text-yellow-400 font-semibold mb-3">RECOMMENDATIONS</h3>
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
              <h3 className="text-pink-400 font-semibold mb-4">RECENT BATTLES</h3>
              
              {teamBattles && teamBattles.length > 0 ? (
                <div className="space-y-2">
                  {teamBattles.slice(0, 10).map((battle: any, index: number) => (
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
                          {battle.winnerId === 1 ? 'VICTORY' : 'DEFEAT'}
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
                  <div>No battle history available</div>
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
