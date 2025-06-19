import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { HubScene } from './scenes/HubScene';
import { ScoutingScene } from './scenes/ScoutingScene';
import { FormationScene } from './scenes/FormationScene';
import { ReconScene } from './scenes/ReconScene';
import { BanPickScene } from './scenes/BanPickScene';
import { BattleScene } from './scenes/BattleScene';
import { AnalysisScene } from './scenes/AnalysisScene';
import { StatusPanel } from './ui/StatusPanel';

const sceneComponents = {
  hub: HubScene,
  scouting: ScoutingScene,
  formation: FormationScene,
  recon: ReconScene,
  banpick: BanPickScene,
  battle: BattleScene,
  analysis: AnalysisScene,
};

export function GameShell() {
  const { currentScene, setScene, playerTeam, currentSeason, currentWeek, initializePlayerTeam } = useGameStore();
  const { isConnected } = useBattleStore();

  // Initialize player team on component mount
  React.useEffect(() => {
    if (!playerTeam) {
      initializePlayerTeam();
    }
  }, [playerTeam, initializePlayerTeam]);

  const CurrentSceneComponent = sceneComponents[currentScene];

  const navigationItems = [
    { id: 'hub', icon: 'fas fa-home', label: 'COMMAND HUB', description: 'Season overview & team status' },
    { id: 'scouting', icon: 'fas fa-search', label: 'PILOT SCOUTING', description: 'Recruit & analyze pilots' },
    { id: 'formation', icon: 'fas fa-cogs', label: 'FORMATION', description: 'Mech-pilot combinations' },
    { id: 'recon', icon: 'fas fa-eye', label: 'RECONNAISSANCE', description: 'Enemy team analysis' },
    { id: 'banpick', icon: 'fas fa-chess', label: 'BAN/PICK PHASE', description: 'Strategic mech selection' },
    { id: 'battle', icon: 'fas fa-crosshairs', label: 'BATTLE SIM', description: 'Real-time combat observation' },
    { id: 'analysis', icon: 'fas fa-chart-line', label: 'POST-ANALYSIS', description: 'Battle data & strategy' },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header Terminal */}
      <header className="status-panel cyber-border border-t-0 border-l-0 border-r-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="ascii-art text-green-400 text-sm">
              ████╗  ████╗   ██╗<br/>
              ╚══██╗██╔══██╗███║<br/>
              &nbsp;&nbsp;&nbsp;██║██║  ██║╚██║<br/>
              ██╔══╝██║  ██║ ██║<br/>
              ╚██████╔╝  ██║ ██║<br/>
              &nbsp;╚═════╝   ╚═╝ ╚═╝
            </div>
            <div>
              <h1 className="text-xl font-orbitron font-bold text-green-400">TRINITY MECHA ACADEMY</h1>
              <p className="text-xs text-gray-400">COMMAND & CONTROL INTERFACE v2.1</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-pink-400 font-semibold">SEASON {currentSeason}</div>
              <div className="text-xs text-gray-400">Week {currentWeek}/12</div>
            </div>
            
            <div className="cyber-border p-2 bg-slate-800">
              <div className="text-xs text-gray-400">OPERATOR</div>
              <div className="text-green-400 font-semibold">NEXUS-07</div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 status-panel cyber-border border-t-0 border-b-0 border-l-0 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setScene(item.id as any)}
                className={`w-full text-left p-3 cyber-border transition-colors group ${
                  currentScene === item.id ? 'bg-slate-800' : 'hover:bg-blue-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <i className={`${item.icon} ${
                    currentScene === item.id ? 'text-green-400' : 'text-gray-400 group-hover:text-pink-400'
                  }`}></i>
                  <span className={currentScene === item.id ? 'font-semibold' : ''}>{item.label}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{item.description}</div>
              </button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <StatusPanel />
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="max-h-full">
            <CurrentSceneComponent />
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="status-panel cyber-border border-b-0 border-l-0 border-r-0 p-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">SYS STATUS:</span>
            <span className="text-green-400">OPTIMAL</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400">LATENCY:</span>
            <span className="text-green-400">12ms</span>
          </div>
          
          <div className="text-center">
            <span className="text-gray-400">TMA Command Interface • Build 2.1.7 • Neural Link Active</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">PILOT COUNT:</span>
            <span className="text-white">{playerTeam ? `${playerTeam.wins + playerTeam.losses}/8` : '0/8'}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400">NEXT MATCH:</span>
            <span className="text-yellow-400">47:23:15</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
