import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CyberButton } from '@/components/ui/CyberButton';

export function ReconScene() {
  const [selectedTeam, setSelectedTeam] = useState<number>(2);

  const { data: reconData, isLoading } = useQuery({
    queryKey: [`/api/recon/${selectedTeam}`],
    enabled: !!selectedTeam,
  });

  const enemyTeams = [
    { id: 2, name: 'Steel Ravens', threat: 'High' },
    { id: 3, name: 'Void Hunters', threat: 'Critical' },
    { id: 4, name: 'Crimson Lance', threat: 'Medium' },
    { id: 5, name: 'Ghost Protocol', threat: 'Low' },
  ];

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'Critical': return 'text-red-400';
      case 'High': return 'text-orange-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="scene-transition flex items-center justify-center h-96">
        <div className="text-green-400 font-orbitron">ANALYZING ENEMY INTELLIGENCE...</div>
      </div>
    );
  }

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">RECONNAISSANCE</h2>
        <p className="text-gray-400">Intelligence gathering and enemy team analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enemy Team Selection */}
        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-4">TARGET SELECTION</h3>
          
          <div className="space-y-2">
            {enemyTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`w-full text-left p-3 cyber-border transition-colors ${
                  selectedTeam === team.id ? 'bg-blue-900' : 'hover:bg-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white font-semibold">{team.name}</div>
                    <div className="text-xs text-gray-400">Intelligence Available</div>
                  </div>
                  <div className={`text-sm font-semibold ${getThreatColor(team.threat)}`}>
                    {team.threat}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 cyber-border p-3 bg-slate-900">
            <h4 className="text-green-400 text-sm font-semibold mb-2">RECON PROTOCOL</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Analyze recent battle patterns</div>
              <div>• Identify pilot weaknesses</div>
              <div>• Study mech preferences</div>
              <div>• Plan counter-strategies</div>
            </div>
          </div>
        </div>

        {/* Intelligence Report */}
        <div className="lg:col-span-2">
          {reconData && (
            <>
              <div className="cyber-border p-4 bg-slate-800 mb-4">
                <h3 className="text-pink-400 font-semibold mb-3">INTELLIGENCE REPORT: {reconData.teamName}</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="cyber-border p-3 bg-slate-900 text-center">
                    <div className="text-green-400 font-bold text-xl">{reconData.recentWins}</div>
                    <div className="text-xs text-gray-400">Recent Wins</div>
                  </div>
                  <div className="cyber-border p-3 bg-slate-900 text-center">
                    <div className="text-red-400 font-bold text-xl">{reconData.recentLosses}</div>
                    <div className="text-xs text-gray-400">Recent Losses</div>
                  </div>
                  <div className="cyber-border p-3 bg-slate-900 text-center">
                    <div className="text-yellow-400 font-bold text-xl">
                      {Math.round((reconData.recentWins / (reconData.recentWins + reconData.recentLosses)) * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Win Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-green-400 font-semibold mb-2">PREFERRED COMPOSITION</h4>
                    <div className="space-y-1">
                      {reconData.preferredComposition.map((comp, index) => (
                        <div key={index} className="cyber-border p-2 bg-slate-900 text-sm">
                          {comp}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-red-400 font-semibold mb-2">IDENTIFIED WEAKNESSES</h4>
                    <div className="space-y-1">
                      {reconData.weaknesses.map((weakness, index) => (
                        <div key={index} className="cyber-border p-2 bg-slate-900 text-sm text-red-300">
                          • {weakness}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cyber-border p-4 bg-slate-800">
                <h4 className="text-pink-400 font-semibold mb-3">CORE PILOT ANALYSIS</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reconData.corePilots.map((pilot, index) => (
                    <div key={index} className="cyber-border p-3 bg-slate-900">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-green-400 font-semibold">{pilot.name}</div>
                          <div className="text-xs text-gray-400">Core Pilot</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 font-bold">
                            {Math.round(pilot.winRate * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">Win Rate</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {pilot.traits.map((trait, traitIndex) => (
                          <span key={traitIndex} className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <CyberButton>
                  <div className="text-center">
                    <div className="text-pink-400 font-semibold mb-1">
                      <i className="fas fa-download mr-2"></i>EXPORT REPORT
                    </div>
                    <div className="text-xs text-gray-400">Save intelligence data</div>
                  </div>
                </CyberButton>

                <CyberButton>
                  <div className="text-center">
                    <div className="text-pink-400 font-semibold mb-1">
                      <i className="fas fa-chess mr-2"></i>PLAN COUNTER
                    </div>
                    <div className="text-xs text-gray-400">Develop strategy</div>
                  </div>
                </CyberButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
