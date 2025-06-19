import { useGameStore } from '@/stores/gameStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { PilotCard } from '@/components/ui/PilotCard';

export function HubScene() {
  const { setScene, playerTeam, pilots, currentSeason, currentWeek } = useGameStore();

  const recentMatches = [
    { opponent: 'Ghost Protocol', result: 'WIN', type: 'success' },
    { opponent: 'Neon Spartans', result: 'WIN', type: 'success' },
    { opponent: 'Crimson Lance', result: 'LOSS', type: 'danger' },
  ];

  const leagueStandings = [
    { rank: 1, team: 'Void Hunters', record: '15-2', highlight: false },
    { rank: 2, team: 'Crimson Lance', record: '13-4', highlight: false },
    { rank: 3, team: 'Trinity Squad', record: playerTeam ? `${playerTeam.wins}-${playerTeam.losses}` : '12-5', highlight: true },
    { rank: 4, team: 'Steel Ravens', record: '10-7', highlight: false },
    { rank: 5, team: 'Ghost Protocol', record: '8-9', highlight: false },
  ];

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">COMMAND HUB</h2>
        <p className="text-gray-400">Season overview and strategic command center</p>
      </div>

      {/* Season Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-3">SEASON PROGRESS</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Week {currentWeek} of 12</span>
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
              Next Match: <span className="text-white">Steel Ravens</span><br/>
              Venue: <span className="text-white">Nexus Arena Beta</span>
            </div>
          </div>
        </div>

        <div className="cyber-border p-4 bg-slate-800">
          <h3 className="text-pink-400 font-semibold mb-3">LEAGUE STANDINGS</h3>
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
          <h3 className="text-pink-400 font-semibold mb-3">RECENT PERFORMANCE</h3>
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
        <CyberButton onClick={() => setScene('formation')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-play mr-2"></i>START MATCH
          </div>
          <div className="text-xs text-gray-400">Begin pre-match sequence</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('scouting')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-users mr-2"></i>MANAGE PILOTS
          </div>
          <div className="text-xs text-gray-400">Training & development</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('analysis')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-history mr-2"></i>BATTLE LOGS
          </div>
          <div className="text-xs text-gray-400">Review past engagements</div>
        </CyberButton>
        
        <CyberButton onClick={() => setScene('analysis')}>
          <div className="text-pink-400 font-semibold mb-2">
            <i className="fas fa-chart-bar mr-2"></i>STATISTICS
          </div>
          <div className="text-xs text-gray-400">Performance analytics</div>
        </CyberButton>
      </div>
    </div>
  );
}
