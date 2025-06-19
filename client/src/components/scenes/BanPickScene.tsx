import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { wsManager } from '@/lib/websocket';
import type { Mech } from '@shared/schema';

type BanPickPhase = 'ban_enemy_1' | 'ban_player_1' | 'ban_player_2' | 'ban_enemy_2' | 
                    'pick_player_1' | 'pick_enemy_1' | 'pick_enemy_2' | 'pick_player_2' | 
                    'pick_player_3' | 'pick_enemy_3' | 'complete';

interface BanPickState {
  phase: BanPickPhase;
  bannedMechs: Mech[];
  selectedMechs: {
    player: Mech[];
    enemy: Mech[];
  };
  enemyTeamName: string;
}

const phaseSequence: BanPickPhase[] = [
  'ban_enemy_1', 'ban_player_1', 'ban_player_2', 'ban_enemy_2',
  'pick_player_1', 'pick_enemy_1', 'pick_enemy_2', 'pick_player_2', 
  'pick_player_3', 'pick_enemy_3', 'complete'
];

const phaseNames = {
  'ban_enemy_1': '적팀 1밴',
  'ban_player_1': '아군 1밴',
  'ban_player_2': '아군 2밴',
  'ban_enemy_2': '적팀 2밴',
  'pick_player_1': '아군 1픽',
  'pick_enemy_1': '적팀 1픽',
  'pick_enemy_2': '적팀 2픽',
  'pick_player_2': '아군 2픽',
  'pick_player_3': '아군 3픽',
  'pick_enemy_3': '적팀 3픽',
  'complete': '완료'
};

export function BanPickScene() {
  const { setScene, mechs, pilots } = useGameStore();
  const { setBattle, setConnected } = useBattleStore();
  
  const [banPickState, setBanPickState] = useState<BanPickState>({
    phase: 'ban_enemy_1',
    bannedMechs: [],
    selectedMechs: {
      player: [],
      enemy: []
    },
    enemyTeamName: '스틸 레이븐스'
  });

  // AI 자동 밴/픽
  useEffect(() => {
    if (banPickState.phase.includes('enemy') && banPickState.phase !== 'complete') {
      const timer = setTimeout(() => {
        handleEnemyAction();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [banPickState.phase]);

  const handleEnemyAction = () => {
    const availableMechs = mechs.filter(mech => 
      !banPickState.bannedMechs.some(banned => banned.id === mech.id) &&
      !banPickState.selectedMechs.player.some(selected => selected.id === mech.id) &&
      !banPickState.selectedMechs.enemy.some(selected => selected.id === mech.id)
    );

    if (availableMechs.length === 0) return;

    // AI 전략: 강력한 기체 우선 밴/픽
    const priorityMechs = availableMechs.filter(m => m.firepower >= 85);
    const selectedMech = priorityMechs.length > 0 
      ? priorityMechs[Math.floor(Math.random() * priorityMechs.length)]
      : availableMechs[Math.floor(Math.random() * availableMechs.length)];
    
    handleMechAction(selectedMech);
  };

  const handleMechAction = (mech: Mech) => {
    const currentPhaseIndex = phaseSequence.indexOf(banPickState.phase);
    if (currentPhaseIndex === -1 || currentPhaseIndex >= phaseSequence.length - 1) return;

    setBanPickState(prev => {
      const newState = { ...prev };
      
      if (prev.phase.startsWith('ban_')) {
        newState.bannedMechs = [...prev.bannedMechs, mech];
      } else {
        if (prev.phase.includes('player')) {
          newState.selectedMechs.player = [...prev.selectedMechs.player, mech];
        } else {
          newState.selectedMechs.enemy = [...prev.selectedMechs.enemy, mech];
        }
      }
      
      newState.phase = phaseSequence[currentPhaseIndex + 1];
      return newState;
    });
  };

  const getAvailableMechs = () => {
    return mechs.filter(mech => 
      !banPickState.bannedMechs.some(banned => banned.id === mech.id) &&
      !banPickState.selectedMechs.player.some(selected => selected.id === mech.id) &&
      !banPickState.selectedMechs.enemy.some(selected => selected.id === mech.id)
    );
  };

  const isPlayerTurn = banPickState.phase.includes('player');
  const isBanPhase = banPickState.phase.startsWith('ban_');
  const isComplete = banPickState.phase === 'complete';

  const handleStartBattle = async () => {
    try {
      // Get the top 3 active pilots for the battle
      const activePilots = pilots.filter(p => p.isActive).slice(0, 3);
      
      if (activePilots.length < 3) {
        alert('전투를 시작하려면 최소 3명의 활성 파일럿이 필요합니다.');
        return;
      }

      // Create formation data with selected mechs and pilots
      const playerFormation = {
        pilot1Id: activePilots[0].id,
        pilot2Id: activePilots[1].id,
        pilot3Id: activePilots[2].id,
        mech1Id: banPickState.selectedMechs.player[0]?.id || mechs[0].id,
        mech2Id: banPickState.selectedMechs.player[1]?.id || mechs[1].id,
        mech3Id: banPickState.selectedMechs.player[2]?.id || mechs[2].id,
      };

      const enemyFormation = {
        pilot1Id: 101, // Enemy pilot IDs
        pilot2Id: 102,
        pilot3Id: 103,
        mech1Id: banPickState.selectedMechs.enemy[0]?.id || mechs[3].id,
        mech2Id: banPickState.selectedMechs.enemy[1]?.id || mechs[4].id,
        mech3Id: banPickState.selectedMechs.enemy[2]?.id || mechs[5].id,
      };

      console.log('Starting battle with formations:', { playerFormation, enemyFormation });

      // Set up one-time listener for battle start confirmation
      const handleBattleStarted = (data: any) => {
        console.log('Battle started, navigating to battle scene');
        setBattle(data.state);
        setConnected(true);
        setScene('battle');
        wsManager.off('BATTLE_STARTED', handleBattleStarted);
      };

      wsManager.on('BATTLE_STARTED', handleBattleStarted);

      // Start battle via WebSocket
      wsManager.startBattle(playerFormation, enemyFormation);
      
    } catch (error) {
      console.error('Failed to start battle:', error);
      alert('전투 시작 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="scene-transition">
      <div className="mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-green-400 mb-2">밴픽 전략</h2>
        <p className="text-gray-400">기체 제한 및 조합 구성</p>
      </div>

      {/* Phase Progress */}
      <div className="cyber-border p-4 bg-slate-800 mb-6">
        <h3 className="text-pink-400 font-semibold mb-3">현재 단계</h3>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium">
            {phaseNames[banPickState.phase]}
          </span>
          <span className={`px-3 py-1 rounded text-sm ${
            isPlayerTurn ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isPlayerTurn ? '아군 턴' : '적팀 턴'}
          </span>
        </div>
        
        {!isComplete && (
          <div className="text-sm text-gray-400">
            {isBanPhase ? '제한할 기체를 선택하세요' : '선택할 기체를 고르세요'}
          </div>
        )}
      </div>

      {/* Ban/Pick Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Player Side */}
        <div className="cyber-border p-4 bg-green-900/20 border-green-400/50">
          <h3 className="text-green-400 font-semibold mb-3">트리니티 스쿼드</h3>
          
          <div className="mb-4">
            <h4 className="text-sm text-gray-400 mb-2">밴된 기체:</h4>
            <div className="space-y-2">
              {banPickState.bannedMechs
                .filter((_, index) => index % 2 === 1) // 플레이어 밴 (홀수 인덱스)
                .map((mech, index) => (
                <div key={mech.id} className="flex items-center space-x-2 text-sm">
                  <span className="text-red-400">✕</span>
                  <span className="text-gray-300">{mech.name}</span>
                </div>
              ))}
              {banPickState.selectedMechs.player.length < 2 && banPickState.bannedMechs.length < 4 && (
                <div className="text-gray-500 text-sm">대기 중...</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-gray-400 mb-2">선택된 기체:</h4>
            <div className="space-y-2">
              {banPickState.selectedMechs.player.map((mech, index) => (
                <div key={mech.id} className="cyber-border p-3 bg-green-800/30">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{mech.name}</span>
                    <span className="text-xs text-gray-400">{mech.type}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    화력: {mech.firepower} | 속도: {mech.speed} | 장갑: {mech.armor}
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - banPickState.selectedMechs.player.length }).map((_, index) => (
                <div key={index} className="cyber-border p-3 bg-gray-800/50 border-dashed">
                  <div className="text-gray-500 text-center">슬롯 {banPickState.selectedMechs.player.length + index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enemy Side */}
        <div className="cyber-border p-4 bg-red-900/20 border-red-400/50">
          <h3 className="text-red-400 font-semibold mb-3">{banPickState.enemyTeamName}</h3>
          
          <div className="mb-4">
            <h4 className="text-sm text-gray-400 mb-2">밴된 기체:</h4>
            <div className="space-y-2">
              {banPickState.bannedMechs
                .filter((_, index) => index % 2 === 0) // 적팀 밴 (짝수 인덱스)
                .map((mech, index) => (
                <div key={mech.id} className="flex items-center space-x-2 text-sm">
                  <span className="text-red-400">✕</span>
                  <span className="text-gray-300">{mech.name}</span>
                </div>
              ))}
              {banPickState.selectedMechs.enemy.length < 2 && banPickState.bannedMechs.length < 4 && (
                <div className="text-gray-500 text-sm">대기 중...</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-gray-400 mb-2">선택된 기체:</h4>
            <div className="space-y-2">
              {banPickState.selectedMechs.enemy.map((mech, index) => (
                <div key={mech.id} className="cyber-border p-3 bg-red-800/30">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{mech.name}</span>
                    <span className="text-xs text-gray-400">{mech.type}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    화력: {mech.firepower} | 속도: {mech.speed} | 장갑: {mech.armor}
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - banPickState.selectedMechs.enemy.length }).map((_, index) => (
                <div key={index} className="cyber-border p-3 bg-gray-800/50 border-dashed">
                  <div className="text-gray-500 text-center">슬롯 {banPickState.selectedMechs.enemy.length + index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Available Mechs */}
      {!isComplete && isPlayerTurn && (
        <div className="cyber-border p-4 bg-slate-800 mb-6">
          <h3 className="text-pink-400 font-semibold mb-3">
            {isBanPhase ? '밴할 기체 선택' : '픽할 기체 선택'}
          </h3>
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {getAvailableMechs().map((mech) => (
              <button
                key={mech.id}
                onClick={() => handleMechAction(mech)}
                className="cyber-border p-3 bg-slate-700 hover:bg-slate-600 transition-all"
              >
                <div className="text-sm font-medium mb-1">{mech.name}</div>
                <div className="text-xs text-gray-400 mb-2">{mech.type} - {mech.variant}</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>화력:</span> <span className="text-orange-400">{mech.firepower}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>속도:</span> <span className="text-blue-400">{mech.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>장갑:</span> <span className="text-green-400">{mech.armor}</span>
                  </div>
                </div>
              </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <CyberButton variant="secondary" onClick={() => setScene('recon')}>
          정찰로 돌아가기
        </CyberButton>
        
        {isComplete && (
          <CyberButton onClick={() => setScene('match_prep')}>
            경기 준비
          </CyberButton>
        )}
      </div>
    </div>
  );
}