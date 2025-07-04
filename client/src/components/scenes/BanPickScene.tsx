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
  const { setScene, mechs, pilots, setSelectedMechs } = useGameStore();
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

  // AI 자동 밴/픽 및 완료 체크
  useEffect(() => {
    if (banPickState.phase.includes('enemy') && banPickState.phase !== 'complete') {
      const timer = setTimeout(() => {
        handleEnemyAction();
      }, 1500);
      
      return () => clearTimeout(timer);
    }

    // 양팀 3기씩 선택 완료 시 자동으로 complete 전환
    if ((banPickState.selectedMechs.enemy.length === 3 && 
         banPickState.selectedMechs.player.length === 3) &&
         banPickState.phase !== 'complete') {
      const timer = setTimeout(() => {
        setBanPickState(prev => ({
          ...prev,
          phase: 'complete'
        }));
        
        // 선택된 메카 정보를 게임 스토어에 저장
        setSelectedMechs({
          player: banPickState.selectedMechs.player,
          enemy: banPickState.selectedMechs.enemy
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [banPickState.phase, banPickState.selectedMechs]);

  // Helper booleans derived from current phase
  const isPlayerTurn = banPickState.phase.includes('player');
  const isBanPhase = banPickState.phase.startsWith('ban_');
  const isComplete = banPickState.phase === 'complete';

  // 디버그 정보 로그
  useEffect(() => {
    console.log('Ban/Pick State Debug:', {
      phase: banPickState.phase,
      isComplete,
      playerMechs: banPickState.selectedMechs.player.length,
      enemyMechs: banPickState.selectedMechs.enemy.length,
      shouldShowButton: isComplete || (banPickState.selectedMechs.player.length === 3 && banPickState.selectedMechs.enemy.length === 3)
    });
  }, [banPickState, isComplete]);

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
    if (currentPhaseIndex === -1) return;

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
      
      // 다음 단계로 진행 (마지막 단계라면 complete로)
      if (currentPhaseIndex < phaseSequence.length - 1) {
        newState.phase = phaseSequence[currentPhaseIndex + 1];
      } else {
        newState.phase = 'complete';
      }
      
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

  const handleStartBattle = async () => {
    try {
      // Get the top 3 active pilots for the battle
      const activePilots = pilots.filter(p => p.isActive).slice(0, 3);
      
      if (activePilots.length < 3) {
        alert('전투를 시작하려면 최소 3명의 활성 파일럿이 필요합니다.');
        return;
      }

      if (banPickState.selectedMechs.player.length < 3) {
        alert('전투를 시작하려면 3기의 메카가 선택되어야 합니다.');
        return;
      }

      // Ensure WebSocket connection
      try {
        await wsManager.connect();
        setConnected(true);
      } catch (error) {
        console.warn('WebSocket connection failed, proceeding to battle scene with offline mode');
        setConnected(false);
      }

      // Create formation data with selected mechs and pilots
      const playerFormation = {
        pilot1Id: activePilots[0].id,
        pilot2Id: activePilots[1].id,
        pilot3Id: activePilots[2].id,
        mech1Id: banPickState.selectedMechs.player[0].id,
        mech2Id: banPickState.selectedMechs.player[1].id,
        mech3Id: banPickState.selectedMechs.player[2].id,
      };

      // 적군 파일럿-메카 매칭 로직 (메카 타입과 파일럿 특성에 따라 매칭)
      const enemyPilots = [
        { id: 101, name: "레이븐 스카이", specialty: ["Veteran", "Aggressive"] },
        { id: 102, name: "아이언 울프", specialty: ["Ace", "Analytical"] },
        { id: 103, name: "블레이즈 피닉스", specialty: ["Genius", "Aggressive"] }
      ];
      const enemyMechs = banPickState.selectedMechs.enemy;
      
      // 메카 타입별로 최적의 파일럿 매칭 (중복 방지)
      const usedPilots = new Set<number>();
      const pilotMechPairs = enemyMechs.map((mech, index) => {
        let bestPilot = enemyPilots[index % enemyPilots.length]; // 기본값 - 안전한 인덱싱
        
        // 메카 타입에 따른 파일럿 선호도
        if (mech.type === "Arbiter" && mech.variant === "Sniper") {
          // 저격형은 분석적인 파일럿 선호
          const preferredPilot = enemyPilots.find(p => p.specialty.includes("Analytical") && !usedPilots.has(p.id));
          if (preferredPilot) bestPilot = preferredPilot;
        } else if (mech.type === "River" && mech.variant === "Assault") {
          // 돌격형은 공격적인 파일럿 선호
          const preferredPilot = enemyPilots.find(p => p.specialty.includes("Aggressive") && !usedPilots.has(p.id));
          if (preferredPilot) bestPilot = preferredPilot;
        } else if (mech.type === "Knight") {
          // 나이트는 천재형 파일럿 선호
          const preferredPilot = enemyPilots.find(p => p.specialty.includes("Genius") && !usedPilots.has(p.id));
          if (preferredPilot) bestPilot = preferredPilot;
        }
        
        // 이미 사용된 파일럿이면 사용 가능한 다른 파일럿 찾기
        if (usedPilots.has(bestPilot.id)) {
          bestPilot = enemyPilots.find(p => !usedPilots.has(p.id)) || enemyPilots[index % enemyPilots.length];
        }
        
        usedPilots.add(bestPilot.id);
        
        return {
          pilotId: bestPilot.id,
          mechId: mech.id,
          mech: mech // 메카 정보도 함께 저장
        };
      });

      const enemyFormation = {
        pilot1Id: pilotMechPairs[0]?.pilotId || 101,
        pilot2Id: pilotMechPairs[1]?.pilotId || 102,
        pilot3Id: pilotMechPairs[2]?.pilotId || 103,
        mech1Id: pilotMechPairs[0]?.mechId || banPickState.selectedMechs.enemy[0].id,
        mech2Id: pilotMechPairs[1]?.mechId || banPickState.selectedMechs.enemy[1].id,
        mech3Id: pilotMechPairs[2]?.mechId || banPickState.selectedMechs.enemy[2].id,
      };

      // 서버에서 전투 상태를 생성하도록 요청
      if (wsManager.isConnected()) {
        // WebSocket을 통해 서버에서 전투 초기화
        wsManager.startBattle(playerFormation, enemyFormation);
        
        // 서버에서 전투 상태가 올 때까지 대기
        const handleBattleStarted = (data: any) => {
          setBattle(data.state);
          wsManager.off('BATTLE_STARTED', handleBattleStarted);
        };
        
        wsManager.on('BATTLE_STARTED', handleBattleStarted);
      } else {
        // 오프라인 모드: 임시 전투 상태 생성 (서버 로직과 유사하게)
        const offlineBattleState = {
          id: `offline_battle_${Date.now()}`,
          phase: 'preparation' as const,
          turn: 0,
          participants: [
            // Player team (team1)
            ...activePilots.map((pilot, index) => ({
              pilotId: pilot.id,
              mechId: banPickState.selectedMechs.player[index].id,
              team: 'team1' as const,
              position: { x: 2, y: 2 + index * 2 },
              hp: 100,
              maxHp: 100,
              armor: banPickState.selectedMechs.player[index].armor,
              speed: banPickState.selectedMechs.player[index].speed,
              firepower: banPickState.selectedMechs.player[index].firepower,
              range: banPickState.selectedMechs.player[index].range || 50,
              status: 'active' as const
            })),
            // Enemy team (team2)
            ...pilotMechPairs.map((pair, index) => ({
              pilotId: pair.pilotId,
              mechId: pair.mechId,
              team: 'team2' as const,
              position: { x: 12, y: 2 + index * 2 },
              hp: 100,
              maxHp: 100,
              armor: pair.mech.armor,
              speed: pair.mech.speed,
              firepower: pair.mech.firepower,
              range: pair.mech.range || 50,
              status: 'active' as const
            }))
          ],
          log: [{
            timestamp: Date.now(),
            type: 'system' as const,
            message: '전투 시스템 초기화 완료. 모든 유닛 대기 중.'
          }]
        };
        
        setBattle(offlineBattleState);
      }
      
      // Navigate to battle scene
      setScene('battle');
      
    } catch (error) {
      console.error('Failed to start battle:', error);
      alert('전투 시작 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="scene-transition">
      {/* Scene Header */}
      <div className="relative mb-8 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-blue-500/10 backdrop-blur-lg border border-purple-200/30 rounded-2xl p-6 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-indigo-100/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-chess text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                밴픽 전략
              </h1>
              <div className="flex items-center space-x-2 text-purple-600/80 text-sm font-medium">
                <i className="fas fa-robot text-xs"></i>
                <span>기체 제한 및 조합 구성</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="px-3 py-1 bg-purple-100/50 text-purple-700 rounded-full text-xs font-medium border border-purple-200/50">
              <i className="fas fa-chess-board mr-1"></i>
              전략 선택 모드
            </div>
            <div className="px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200/50">
              <i className="fas fa-check-circle mr-1"></i>
              TRINITAS 연결됨
            </div>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md mb-6">
        <h3 className="text-sky-600 font-semibold mb-3">현재 단계</h3>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium text-slate-800">
            {phaseNames[banPickState.phase]}
          </span>
          <span className={`px-3 py-1 rounded text-sm ${
            isPlayerTurn ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isPlayerTurn ? '아군 턴' : '적팀 턴'}
          </span>
        </div>
        
        {!isComplete && (
          <div className="text-sm text-slate-800">
            {isBanPhase ? '제한할 기체를 선택하세요' : '선택할 기체를 고르세요'}
          </div>
        )}
        
        {/* 디버그 정보 */}
        <div className="text-xs text-slate-700 mt-2">
          플레이어: {banPickState.selectedMechs.player.length}/3 | 
          적팀: {banPickState.selectedMechs.enemy.length}/3 | 
          Phase: {banPickState.phase} | 
          Complete: {isComplete.toString()}
        </div>
      </div>

      {/* Ban/Pick Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Player Side */}
        <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
          <h3 className="text-emerald-600 font-semibold mb-3">트리니티 스쿼드</h3>
          
          <div className="mb-4">
            <h4 className="text-sm text-slate-800 font-medium mb-2">밴된 기체:</h4>
            <div className="space-y-2">
              {banPickState.bannedMechs
                .filter((_, index) => index % 2 === 1) // 플레이어 밴 (홀수 인덱스)
                .map((mech, index) => (
                <div key={mech.id} className="flex items-center space-x-2 text-sm">
                  <span className="text-red-500">✕</span>
                  <span className="text-slate-800 font-medium">{mech.name}</span>
                </div>
              ))}
              {banPickState.selectedMechs.player.length < 2 && banPickState.bannedMechs.length < 4 && (
                <div className="text-slate-700 text-sm">대기 중...</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-slate-800 font-medium mb-2">선택된 기체:</h4>
            <div className="space-y-2">
              {banPickState.selectedMechs.player.map((mech, index) => (
                <div key={mech.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{mech.name}</span>
                    <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{mech.type}</span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    화력: <span className="text-orange-600 font-medium">{mech.firepower}</span> | 
                    속도: <span className="text-blue-600 font-medium">{mech.speed}</span> | 
                    장갑: <span className="text-green-600 font-medium">{mech.armor}</span>
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - banPickState.selectedMechs.player.length }).map((_, index) => (
                <div key={index} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-3">
                  <div className="text-slate-600 text-center font-medium">슬롯 {banPickState.selectedMechs.player.length + index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enemy Side */}
        <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md">
          <h3 className="text-rose-600 font-semibold mb-3">{banPickState.enemyTeamName}</h3>
          
          <div className="mb-4">
            <h4 className="text-sm text-slate-800 font-medium mb-2">밴된 기체:</h4>
            <div className="space-y-2">
              {banPickState.bannedMechs
                .filter((_, index) => index % 2 === 0) // 적팀 밴 (짝수 인덱스)
                .map((mech, index) => (
                <div key={mech.id} className="flex items-center space-x-2 text-sm">
                  <span className="text-red-500">✕</span>
                  <span className="text-slate-800 font-medium">{mech.name}</span>
                </div>
              ))}
              {banPickState.selectedMechs.enemy.length < 2 && banPickState.bannedMechs.length < 4 && (
                <div className="text-slate-700 text-sm">대기 중...</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-slate-800 font-medium mb-2">선택된 기체:</h4>
            <div className="space-y-2">
              {banPickState.selectedMechs.enemy.map((mech, index) => (
                <div key={mech.id} className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{mech.name}</span>
                    <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{mech.type}</span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    화력: <span className="text-orange-600 font-medium">{mech.firepower}</span> | 
                    속도: <span className="text-blue-600 font-medium">{mech.speed}</span> | 
                    장갑: <span className="text-green-600 font-medium">{mech.armor}</span>
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - banPickState.selectedMechs.enemy.length }).map((_, index) => (
                <div key={index} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-3">
                  <div className="text-slate-600 text-center font-medium">슬롯 {banPickState.selectedMechs.enemy.length + index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Available Mechs */}
      {!isComplete && isPlayerTurn && (
        <div className="bg-white/80 backdrop-blur-lg border border-sky-200/50 rounded-xl p-4 shadow-md mb-6">
          <h3 className="text-sky-600 font-semibold mb-3">
            {isBanPhase ? '밴할 기체 선택' : '픽할 기체 선택'}
          </h3>
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {getAvailableMechs().map((mech) => (
              <button
                key={mech.id}
                onClick={() => handleMechAction(mech)}
                className="bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg p-3 transition-all shadow-sm hover:shadow-md"
              >
                <div className="text-sm font-semibold mb-1 text-slate-800">{mech.name}</div>
                <div className="text-xs text-slate-700 mb-2 bg-slate-100 px-2 py-1 rounded">{mech.type} - {mech.variant}</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-700">화력:</span> 
                    <span className="text-orange-600 font-semibold">{mech.firepower}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">속도:</span> 
                    <span className="text-blue-600 font-semibold">{mech.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">장갑:</span> 
                    <span className="text-green-600 font-semibold">{mech.armor}</span>
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
        
        {/* 전투 시작 버튼 */}
        <div className="flex space-x-4">
          {(isComplete || (banPickState.selectedMechs.player.length === 3 && banPickState.selectedMechs.enemy.length === 3)) && (
            <CyberButton onClick={() => setScene('formation')}>
              편성 확인하기
            </CyberButton>
          )}
          
          {/* 강제 전투 시작 버튼 (디버그용) */}
          <CyberButton 
            variant="secondary" 
            onClick={() => handleStartBattle()}
          >
            강제 전투 시작 (디버그)
          </CyberButton>
        </div>
      </div>
    </div>
  );
}