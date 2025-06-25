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
import { NewMatchPrepScene } from './scenes/NewMatchPrepScene';
import { StatusPanel } from './ui/StatusPanel';
import MatchNotification from './ui/MatchNotification';
import { CyberButton } from '@/components/ui/CyberButton';

const sceneComponents = {
  hub: HubScene,
  scouting: ScoutingScene,
  formation: FormationScene,
  recon: ReconScene,
  banpick: BanPickScene,
  battle: BattleScene,
  analysis: AnalysisScene,
  match_prep: NewMatchPrepScene,
};

export function GameShell() {
  const { currentScene, setScene, playerTeam, currentSeason, currentWeek, initializePlayerTeam, matchmakingStatus, startMatchSearch, cancelMatchSearch } = useGameStore();
  const { isConnected } = useBattleStore();

  // Initialize player team on component mount
  React.useEffect(() => {
    if (!playerTeam) {
      initializePlayerTeam();
    }
  }, [playerTeam, initializePlayerTeam]);

  const CurrentSceneComponent = sceneComponents[currentScene];

  const navigationItems = [
    { id: 'hub', icon: 'fas fa-satellite-dish', label: '대시보드', description: '시즌 개요 및 팀 현황' },
    { id: 'scouting', icon: 'fas fa-users-cog', label: '스쿼드', description: '파일럿 영입 및 분석' },
    { id: 'analysis', icon: 'fas fa-chart-bar', label: '전투 분석', description: '전투 데이터 및 전략 분석' },
  ];

  const [countdown, setCountdown] = React.useState(30);

  // Manage searching countdown locally
  React.useEffect(() => {
    if (matchmakingStatus !== 'searching') {
      setCountdown(30);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [matchmakingStatus]);

  const handleMatchButton = () => {
    if (matchmakingStatus === 'idle') {
      startMatchSearch();
    } else if (matchmakingStatus === 'searching') {
      cancelMatchSearch();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Header - Academy Style */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-sky-200/50 shadow-lg shadow-sky-100/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sky-500 text-lg font-orbitron">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <div>
                  <h1 className="text-xl font-orbitron font-bold text-slate-800">TRINITY MECHA ACADEMY</h1>
                  <p className="text-xs text-slate-500">Command & Control Interface v3.0</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center Matchmaking trigger */}
          <div className="flex-1 flex justify-center">
            <CyberButton
              onClick={handleMatchButton}
              disabled={currentScene === 'match_prep' || matchmakingStatus === 'matched'}
              className={`px-5 py-2 rounded-full shadow-md transition-transform ${
                currentScene === 'match_prep' || matchmakingStatus === 'matched'
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white hover:scale-105'
              }`}
            >
              <i className="fas fa-satellite-dish mr-2"></i>
              {matchmakingStatus === 'idle' && '매치 찾기'}
              {matchmakingStatus === 'searching' && `취소 (${countdown})`}
              {matchmakingStatus === 'matched' && '매치 완료'}
            </CyberButton>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sky-600 font-semibold">시즌 {currentSeason}</div>
              <div className="text-xs text-slate-500">주차 {currentWeek}/12</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-sky-200 rounded-xl p-3 shadow-md">
                              <div className="text-xs text-slate-500">오퍼레이터</div>
                <div className="text-sky-600 font-semibold">TRINITAS</div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              <span className={`text-xs font-medium ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isConnected ? '시스템 온라인' : '연결 대기'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation - Academy Style */}
        <nav className={`w-72 bg-white/70 backdrop-blur-xl border-r border-sky-200/50 shadow-xl shadow-sky-100/20 p-6 ${currentScene === 'match_prep' ? 'pointer-events-none opacity-50' : ''}`}>
          <div className="space-y-3">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setScene(item.id as any)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 group ${
                  currentScene === item.id 
                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-400/25' 
                    : 'hover:bg-sky-50 hover:shadow-md border border-transparent hover:border-sky-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    currentScene === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-sky-100 text-sky-600 group-hover:bg-sky-200'
                  }`}>
                    <i className={item.icon}></i>
                  </div>
                  <div>
                    <div className={`font-semibold ${currentScene === item.id ? 'text-white' : 'text-slate-800'}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${currentScene === item.id ? 'text-sky-100' : 'text-slate-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Status Panel - Academy Style */}
          <div className="mt-8">
            <StatusPanel />
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
          <CurrentSceneComponent />
        </main>
      </div>

      {/* Bottom Status Bar - Academy Style */}
      <footer className="bg-white/90 backdrop-blur-lg border-t border-sky-200/50 shadow-lg shadow-sky-100/50 p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">시스템 상태:</span>
              <span className="text-emerald-600 font-semibold">최적화</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">응답 시간:</span>
              <span className="text-sky-600 font-semibold">12ms</span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-slate-500">TMA 지휘 인터페이스 • 빌드 3.0.1 • 신경망 연결 활성</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">파일럿 수:</span>
              <span className="text-slate-800 font-semibold">{playerTeam ? `${playerTeam.wins + playerTeam.losses}/8` : '0/8'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">다음 경기:</span>
              <span className="text-amber-600 font-semibold">47:23:15</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Match Notification */}
      <MatchNotification />
    </div>
  );
}
