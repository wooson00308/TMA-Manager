import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { ASCIIBattlefield } from '@/components/ui/ASCIIBattlefield';
import { CyberButton } from '@/components/ui/CyberButton';
import { wsManager } from '@/lib/websocket';

export function BattleScene() {
  const { setScene } = useGameStore();
  const { currentBattle, isConnected, battleHistory, addBattleLog, setBattle } = useBattleStore();
  
  const [battleStatus, setBattleStatus] = useState<'preparing' | 'active' | 'completed'>('preparing');
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    // Auto-start battle when entering scene if no current battle
    if (!currentBattle && battleStatus === 'preparing') {
      const autoStartBattle = () => {
        const mockFormation1 = {
          pilot1Id: 1, pilot2Id: 2, pilot3Id: 3,
          mech1Id: 12, mech2Id: 13, mech3Id: 14
        };
        const mockFormation2 = {
          pilot1Id: 101, pilot2Id: 102, pilot3Id: 103,
          mech1Id: 15, mech2Id: 16, mech3Id: 17
        };
        
        wsManager.startBattle(mockFormation1, mockFormation2);
      };
      
      setTimeout(autoStartBattle, 1000);
    }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'damaged': return 'text-yellow-400';
      case 'destroyed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'communication': return 'text-green-400';
      case 'attack': return 'text-red-400';
      case 'movement': return 'text-blue-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const handleReturnToHub = () => {
    setScene('hub');
  };

  const handleViewAnalysis = () => {
    setScene('analysis');
  };

  return (
    <div className="scene-transition">
      <div className="mb-4">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">BATTLE SIMULATION</h2>
        <p className="text-gray-400">Real-time combat observation and tactical analysis</p>
      </div>

      {/* Battle Status Header */}
      <div className="cyber-border p-4 bg-slate-800 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className={`text-lg font-bold ${
                battleStatus === 'active' ? 'text-green-400' : 
                battleStatus === 'completed' ? 'text-yellow-400' : 'text-gray-400'
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
              <div className="text-sm text-gray-400 mt-1">
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
        {/* ASCII Battlefield */}
        <div className="col-span-2">
          <ASCIIBattlefield battleState={currentBattle} />
        </div>

        {/* Combat Log */}
        <div className="cyber-border bg-slate-800 p-4">
          <h3 className="text-pink-400 font-semibold mb-3">COMM LOG</h3>
          <div className="space-y-2 text-xs overflow-auto h-64">
            {battleHistory.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div className="mb-2">
                  <i className="fas fa-radio text-2xl"></i>
                </div>
                <div>Awaiting communication...</div>
              </div>
            ) : (
              battleHistory.slice(-15).map((log, index) => (
                <div key={index} className={`${getLogTypeColor(log.type)}`}>
                  <span className="text-gray-400">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  {log.speaker && (
                    <span className="font-semibold"> {log.speaker}:</span>
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
          {currentBattle.participants.slice(0, 3).map((participant, index) => (
            <div key={index} className="cyber-border p-3 bg-slate-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-green-400 font-semibold">
                    PILOT-{index + 1}
                  </div>
                  <div className="text-xs text-gray-400">
                    Position: {participant.position.x}-{participant.position.y}
                  </div>
                </div>
                <div className={`text-sm font-bold ${getStatusColor(participant.status)}`}>
                  {participant.status.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Hull Integrity:</span>
                  <span className={`font-semibold ${
                    participant.hp > 70 ? 'text-green-400' :
                    participant.hp > 30 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {participant.hp}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded h-1">
                  <div 
                    className={`h-1 rounded transition-all duration-300 ${
                      participant.hp > 70 ? 'bg-green-400' :
                      participant.hp > 30 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${participant.hp}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CyberButton onClick={handleViewAnalysis}>
              <div className="text-center">
                <div className="text-pink-400 font-semibold mb-1">
                  <i className="fas fa-chart-line mr-2"></i>VIEW ANALYSIS
                </div>
                <div className="text-xs text-gray-400">Detailed battle report</div>
              </div>
            </CyberButton>

            <CyberButton onClick={handleReturnToHub}>
              <div className="text-center">
                <div className="text-pink-400 font-semibold mb-1">
                  <i className="fas fa-home mr-2"></i>RETURN TO HUB
                </div>
                <div className="text-xs text-gray-400">Command center</div>
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
            <p className="text-gray-400 mb-4">
              Complete formation setup and proceed through ban/pick phase to begin battle
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <CyberButton onClick={() => setScene('formation')}>
                <div className="text-center">
                  <div className="text-pink-400 font-semibold mb-1">
                    <i className="fas fa-cogs mr-2"></i>FORMATION
                  </div>
                  <div className="text-xs text-gray-400">Configure team setup</div>
                </div>
              </CyberButton>

              <CyberButton onClick={() => setScene('banpick')}>
                <div className="text-center">
                  <div className="text-pink-400 font-semibold mb-1">
                    <i className="fas fa-chess mr-2"></i>BAN/PICK
                  </div>
                  <div className="text-xs text-gray-400">Strategic selection</div>
                </div>
              </CyberButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
