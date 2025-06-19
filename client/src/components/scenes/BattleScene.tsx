import { useState, useEffect } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { CyberButton } from '@/components/ui/CyberButton';

interface BattleSceneProps {
  setScene: (scene: string) => void;
}

export function BattleScene({ setScene }: BattleSceneProps) {
  const { currentBattle, setBattle, addBattleLog, clearBattleHistory } = useBattleStore();
  const [battleStatus, setBattleStatus] = useState<'preparing' | 'active' | 'completed'>('preparing');
  const [winner, setWinner] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState(1);

  useEffect(() => {
    // Clear previous battle history and start new offline battle
    clearBattleHistory();
    
    const startOfflineBattle = () => {
      // Create mock battle state for offline mode
      const mockBattleState = {
        id: `offline_battle_${Date.now()}`,
        phase: 'active' as const,
        turn: 1,
        participants: [
          {
            pilotId: 1,
            mechId: 12,
            position: { x: 1, y: 1 },
            hp: 100,
            status: 'active' as const
          },
          {
            pilotId: 2,
            mechId: 13,
            position: { x: 1, y: 2 },
            hp: 100,
            status: 'active' as const
          },
          {
            pilotId: 3,
            mechId: 14,
            position: { x: 1, y: 3 },
            hp: 100,
            status: 'active' as const
          },
          {
            pilotId: 101,
            mechId: 15,
            position: { x: 8, y: 1 },
            hp: 100,
            status: 'active' as const
          },
          {
            pilotId: 102,
            mechId: 16,
            position: { x: 8, y: 2 },
            hp: 100,
            status: 'active' as const
          },
          {
            pilotId: 103,
            mechId: 17,
            position: { x: 8, y: 3 },
            hp: 100,
            status: 'active' as const
          }
        ],
        log: [
          {
            timestamp: Date.now(),
            type: 'system' as const,
            message: '오프라인 전투 시뮬레이션이 시작되었습니다.',
          }
        ]
      };
      
      setBattle(mockBattleState);
      setBattleStatus('active');
      addBattleLog({
        timestamp: Date.now(),
        type: 'system',
        message: 'Trinity Squad vs Enemy Team - 전투 개시!',
      });
      
      // Start offline battle simulation
      simulateOfflineBattle();
    };
    
    setTimeout(startOfflineBattle, 1000);
  }, [setBattle, addBattleLog, clearBattleHistory]);

  const simulateOfflineBattle = () => {
    const battleActions = [
      { type: 'movement' as const, pilot: 'Sasha', message: 'Knight 기체로 전진 개시!' },
      { type: 'communication' as const, pilot: 'Mei', message: '적 기체 3시 방향에서 확인!' },
      { type: 'attack' as const, pilot: 'Alex', message: 'River 기체로 화력 지원!' },
      { type: 'movement' as const, pilot: 'Enemy Alpha', message: '측면 기동으로 우회 공격!' },
      { type: 'attack' as const, pilot: 'Sasha', message: '근접 전투 개시! 타격 성공!' },
      { type: 'communication' as const, pilot: 'Enemy Beta', message: '타겟 변경, 집중 공격!' },
      { type: 'attack' as const, pilot: 'Mei', message: 'Arbiter 시스템으로 정밀 사격!' },
      { type: 'movement' as const, pilot: 'Alex', message: '포지션 재조정 중...' },
      { type: 'attack' as const, pilot: 'Enemy Gamma', message: '반격 개시!' },
      { type: 'communication' as const, pilot: 'Sasha', message: '대형 유지하며 밀어붙여!' },
      { type: 'attack' as const, pilot: 'Mei', message: '적 핵심 기체 타격!' },
      { type: 'communication' as const, pilot: 'Alex', message: '승리가 보인다!' },
      { type: 'system' as const, pilot: '', message: 'Trinity Squad 승리!' }
    ];
    
    let actionIndex = 0;
    
    const executeNextAction = () => {
      if (actionIndex >= battleActions.length || battleStatus === 'completed') {
        // Battle completed
        setBattleStatus('completed');
        setWinner('Trinity Squad');
        addBattleLog({
          timestamp: Date.now(),
          type: 'system',
          message: '전투 완료! Trinity Squad이 승리했습니다!',
        });
        return;
      }
      
      const action = battleActions[actionIndex];
      
      addBattleLog({
        timestamp: Date.now(),
        type: action.type,
        message: action.message,
        speaker: action.pilot || undefined,
      });
      
      setCurrentTurn(Math.floor(actionIndex / 2) + 1);
      actionIndex++;
      
      // Schedule next action
      setTimeout(executeNextAction, 1500 + Math.random() * 1000);
    };
    
    // Start simulation after initial delay
    setTimeout(executeNextAction, 2000);
  };

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
        <p className="text-gray-400">오프라인 전투 관찰 및 전술 분석</p>
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
                <div className="text-sm text-gray-400">
                  Turn {currentTurn}
                </div>
              )}
            </div>
            {winner && (
              <div className="text-green-400 font-bold mt-1">
                Winner: {winner}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Trinity Squad vs Enemy Team</div>
            <div className="text-xs text-gray-500">오프라인 모드</div>
          </div>
        </div>
      </div>

      {/* Battle Grid */}
      {currentBattle && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Participants Status */}
          <div className="cyber-border p-4 bg-slate-800">
            <h3 className="text-lg font-bold text-green-400 mb-3">Unit Status</h3>
            <div className="space-y-2">
              {currentBattle.participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-mono">
                      {participant.pilotId < 100 ? 'Trinity' : 'Enemy'} #{participant.pilotId}
                    </div>
                    <div className="text-xs text-gray-400">
                      Mech {participant.mechId}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">HP: {participant.hp}%</div>
                    <div className={`text-sm ${getStatusColor(participant.status)}`}>
                      {participant.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Battle Log */}
          <div className="cyber-border p-4 bg-slate-800">
            <h3 className="text-lg font-bold text-green-400 mb-3">Combat Log</h3>
            <div className="h-64 overflow-y-auto space-y-1">
              {useBattleStore.getState().battleHistory.slice(-10).map((log, index) => (
                <div key={index} className="text-sm p-2 bg-slate-700 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {log.speaker && (
                        <span className="font-bold text-blue-400">[{log.speaker}] </span>
                      )}
                      <span className={getLogTypeColor(log.type)}>
                        {log.message}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <CyberButton variant="secondary" onClick={handleReturnToHub}>
          사령부로 돌아가기
        </CyberButton>
        
        {battleStatus === 'completed' && (
          <CyberButton onClick={handleViewAnalysis}>
            전투 분석 보기
          </CyberButton>
        )}
        
        {battleStatus === 'active' && (
          <div className="cyber-border px-4 py-2 bg-green-900">
            <div className="text-green-400 font-bold">전투 진행 중...</div>
          </div>
        )}
      </div>
    </div>
  );
}