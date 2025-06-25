import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { BattleSimulation } from '@/components/BattleSimulation';
import { CyberButton } from '@/components/ui/CyberButton';
import { wsManager } from '@/lib/websocket';

export function BattleScene() {
  const { setScene } = useGameStore();
  const { currentBattle, isConnected, addBattleLog, setBattle } = useBattleStore();
  
  const [battleStatus, setBattleStatus] = useState<'preparing' | 'active' | 'completed'>('preparing');
  const [winner, setWinner] = useState<string | null>(null);
  const [returnCountdown, setReturnCountdown] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up WebSocket listeners for battle updates
    const handleBattleStarted = (data: any) => {
      setBattle(data.state);
      setBattleStatus('active');
      addBattleLog({
        timestamp: Date.now(),
        type: 'system',
        message: 'Battle commenced. All units report ready.',
      });
    };

    const handleBattleUpdate = (data: any) => {
      if (data.update.type === 'TURN_UPDATE') {
        // Update battle state
        if (currentBattle) {
          const updatedBattle = {
            ...currentBattle,
            turn: data.update.turn,
            participants: data.update.participants
          };
          setBattle(updatedBattle);
        }

        // Add recent logs
        if (data.update.recentLogs) {
          data.update.recentLogs.forEach((log: any) => addBattleLog(log));
        }
      }
    };

    const handleBattleComplete = (data: any) => {
      setBattleStatus('completed');
      setWinner(data.winner);
      addBattleLog({
        timestamp: Date.now(),
        type: 'system',
        message: `Battle concluded. Winner: ${data.winner === 'team1' ? 'Trinity Squad' : 'Enemy Forces'}`,
      });
    };

    const handlePhaseChange = (data: any) => {
      if (data.phase === 'active') {
        setBattleStatus('active');
      }
    };

    wsManager.on('BATTLE_STARTED', handleBattleStarted);
    wsManager.on('BATTLE_UPDATE', handleBattleUpdate);
    wsManager.on('BATTLE_COMPLETE', handleBattleComplete);
    wsManager.on('PHASE_CHANGE', handlePhaseChange);

    return () => {
      wsManager.off('BATTLE_STARTED', handleBattleStarted);
      wsManager.off('BATTLE_UPDATE', handleBattleUpdate);
      wsManager.off('BATTLE_COMPLETE', handleBattleComplete);
      wsManager.off('PHASE_CHANGE', handlePhaseChange);
    };
  }, [currentBattle, addBattleLog, setBattle]);

  // Auto-return countdown once battle is completed
  useEffect(() => {
    if (battleStatus === 'completed') {
      setReturnCountdown(10);
      countdownRef.current = setInterval(() => {
        setReturnCountdown(prev => {
          if (prev && prev > 1) {
            return prev - 1;
          }
          // Countdown finished -> return to hub
          if (countdownRef.current) clearInterval(countdownRef.current);
          setScene('hub');
          return null;
        });
      }, 1000);
    } else {
      // Cleanup if leaving completed state prematurely
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
    // Cleanup on unmount
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [battleStatus, setScene]);

  // Detect completion from local simulation (no websocket)
  useEffect(() => {
    if (currentBattle && currentBattle.phase === 'completed' && battleStatus !== 'completed') {
      setBattleStatus('completed');
      // Determine winner locally
      const allyAlive = currentBattle.participants.filter(p => p.team === 'team1' && p.status !== 'destroyed').length;
      const enemyAlive = currentBattle.participants.filter(p => p.team === 'team2' && p.status !== 'destroyed').length;
      setWinner(allyAlive > enemyAlive ? 'team1' : 'team2');
    }
  }, [currentBattle?.phase, battleStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'damaged': return 'text-yellow-400';
      case 'destroyed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getLogTypeColor = (type: string, speaker?: string) => {
    // Prioritise team colouring if speaker is present
    if (speaker) {
      return speaker.startsWith('Enemy') ? 'text-red-400' : 'text-green-400';
    }
    switch (type) {
      case 'communication': return 'text-green-400';
      case 'attack': return 'text-red-400';
      case 'movement': return 'text-blue-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  // Additional helper – colour-code the speaker based on allegiance
  const getSpeakerColor = (speaker?: string) => {
    if (!speaker) return 'text-gray-300';
    return speaker.startsWith('Enemy') ? 'text-red-400' : 'text-green-400';
  };

  const handleReturnToHub = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setScene('hub');
  };

  const handleViewAnalysis = () => {
    setScene('analysis');
  };

  return (
    <div className="scene-transition">
      {/* Scene Header */}
      <div className="relative mb-8 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-yellow-500/10 backdrop-blur-lg border border-red-200/30 rounded-2xl p-6 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-100/20 to-orange-100/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-crosshairs text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                BATTLE SIMULATION
              </h1>
              <div className="flex items-center space-x-2 text-red-600/80 text-sm font-medium">
                <i className="fas fa-satellite text-xs"></i>
                <span>Real-time combat observation and tactical analysis</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="px-3 py-1 bg-red-100/50 text-red-700 rounded-full text-xs font-medium border border-red-200/50">
              <i className="fas fa-crosshairs mr-1"></i>
              전투 시뮬레이션
            </div>
            <div className="px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200/50">
              <i className="fas fa-check-circle mr-1"></i>
              TRINITAS 연결됨
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="cyber-border p-4 bg-red-900/30 border-red-500/50 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-semibold">연결 오류</span>
          </div>
          <p className="text-red-300 text-sm mt-2">
            전투 시스템에 연결할 수 없습니다. 네트워크 상태를 확인하고 다시 시도하세요.
          </p>
          <CyberButton 
            variant="secondary" 
            className="mt-3"
            onClick={() => wsManager.connect()}
          >
            재연결 시도
          </CyberButton>
        </div>
      )}

      {/* Battle Status Header */}
      <div className="cyber-border p-4 bg-slate-800 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className={`text-lg font-bold ${
                battleStatus === 'active' ? 'text-green-400' : 
                battleStatus === 'completed' ? 'text-yellow-400' : 'text-slate-600'
              }`}>
                {battleStatus === 'preparing' && 'PREPARATION PHASE'}
                {battleStatus === 'active' && 'COMBAT ACTIVE'}
                {battleStatus === 'completed' && 'BATTLE CONCLUDED'}
              </div>
              {battleStatus === 'active' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              )}
            </div>
            {currentBattle && (
              <div className="text-sm text-slate-600 mt-1">
                Turn {currentBattle.turn} • Phase: {currentBattle.phase}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className={`text-right ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className="text-sm font-semibold">
                {isConnected ? 'NEURAL LINK ACTIVE' : 'CONNECTION LOST'}
              </div>
              <div className="text-xs">Battle System Status</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 h-96">
        {/* Battle Simulation */}
        <div className="col-span-2">
          {currentBattle ? (
            <BattleSimulation />
          ) : (
            <div className="cyber-border bg-slate-800 p-4 flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <div className="text-xl mb-2">⚡</div>
                <div>전투 데이터를 로딩 중...</div>
              </div>
            </div>
          )}
        </div>

        {/* Combat Log */}
        <div className="cyber-border bg-slate-800 p-4">
          <h3 className="text-pink-400 font-semibold mb-3">COMM LOG</h3>
          <div className="space-y-2 text-xs overflow-auto h-64">
            {currentBattle?.log.length === 0 ? (
              <div className="text-slate-700 text-center py-8">
                <div className="mb-2">
                  <i className="fas fa-radio text-2xl"></i>
                </div>
                <div>Awaiting communication...</div>
              </div>
            ) : (
              (currentBattle?.log || []).slice(-15).map((log, index) => (
                <div key={index} className={`${getLogTypeColor(log.type, log.speaker)}`}>
                  <span className="text-slate-600">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  {log.speaker && (
                    <span className={`font-semibold ${getSpeakerColor(log.speaker)}`}> {log.speaker}:</span>
                  )}
                  <span className="ml-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Unit Status Panel */}
      {currentBattle && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {currentBattle.participants.slice(0, 3).map((participant, index) => {
            const hpPercent = participant.maxHp > 0 ? (participant.hp / participant.maxHp) * 100 : 0;

            return (
              <div key={index} className="cyber-border p-3 bg-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-green-400 font-semibold">
                      PILOT-{index + 1}
                    </div>
                    <div className="text-xs text-slate-600">
                      Position: {participant.position.x}-{participant.position.y}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${getStatusColor(participant.status)}`}>
                    {participant.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Hull Integrity:</span>
                    <span className={`font-semibold ${
                      hpPercent > 70 ? 'text-green-400' :
                      hpPercent > 30 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(hpPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded h-1">
                    <div 
                      className={`h-1 rounded transition-all duration-300 ${
                        hpPercent > 70 ? 'bg-green-400' :
                        hpPercent > 30 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Battle Completion Actions */}
      {battleStatus === 'completed' && (
        <div className="mt-6 cyber-border p-4 bg-slate-800">
          <div className="text-center mb-4">
            <h3 className="text-2xl font-orbitron font-bold text-yellow-400 mb-2">
              BATTLE CONCLUDED
            </h3>
            {winner && (
              <div className={`text-lg font-semibold ${
                winner === 'team1' ? 'text-green-400' : 'text-red-400'
              }`}>
                {winner === 'team1' ? 'VICTORY ACHIEVED' : 'MISSION FAILED'}
              </div>
            )}
            {returnCountdown !== null && (
              <div className="text-xs text-slate-500 mt-1">
                {returnCountdown}초 후 대시보드로 자동 이동
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CyberButton onClick={handleViewAnalysis}>
              <div className="text-center">
                <div className="text-pink-400 font-semibold mb-1">
                  <i className="fas fa-chart-line mr-2"></i>VIEW ANALYSIS
                </div>
                <div className="text-xs text-slate-600">Detailed battle report</div>
              </div>
            </CyberButton>

            <CyberButton onClick={handleReturnToHub}>
              <div className="text-center">
                <div className="text-pink-400 font-semibold mb-1">
                  <i className="fas fa-home mr-2"></i>RETURN TO HUB
                </div>
                <div className="text-xs text-slate-600">Command center</div>
              </div>
            </CyberButton>
          </div>
        </div>
      )}

      {/* Preparing Phase Actions */}
      {battleStatus === 'preparing' && (
        <div className="mt-6 cyber-border p-4 bg-slate-800">
          <div className="text-center">
            <h3 className="text-lg font-orbitron font-semibold text-green-400 mb-2">
              AWAITING DEPLOYMENT
            </h3>
            <p className="text-slate-600 mb-4">
              Complete formation setup and proceed through ban/pick phase to begin battle
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <CyberButton onClick={() => setScene('formation')}>
                <div className="text-center">
                  <div className="text-pink-400 font-semibold mb-1">
                    <i className="fas fa-cogs mr-2"></i>FORMATION
                  </div>
                  <div className="text-xs text-slate-600">Configure team setup</div>
                </div>
              </CyberButton>

              <CyberButton onClick={() => setScene('banpick')}>
                <div className="text-center">
                  <div className="text-pink-400 font-semibold mb-1">
                    <i className="fas fa-chess mr-2"></i>BAN/PICK
                  </div>
                  <div className="text-xs text-slate-600">Strategic selection</div>
                </div>
              </CyberButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
