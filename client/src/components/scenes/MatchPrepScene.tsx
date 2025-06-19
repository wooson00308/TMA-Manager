import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { PilotCard } from '@/components/ui/PilotCard';
import { BattleSimulation } from '@/components/BattleSimulation';
import { Pilot, Mech, Team } from '@shared/schema';
import { wsManager } from '@/lib/websocket';

type MatchStep = 'roster' | 'banpick' | 'swap' | 'strategy' | 'simulation';

type BanPickPhase = 'ban_enemy_1' | 'ban_player_1' | 'ban_player_2' | 'ban_enemy_2' | 
                    'pick_player_1' | 'pick_enemy_1' | 'pick_enemy_2' | 'pick_player_2' | 
                    'pick_player_3' | 'pick_enemy_3' | 'complete';

interface MatchState {
  currentStep: MatchStep;
  selectedRoster: Pilot[];
  bannedMechs: Mech[];
  pickedMechs: {
    player: Mech[];
    enemy: Mech[];
  };
  pilotMechAssignments: { [pilotId: number]: Mech | null };
  selectedStrategy: string;
  enemyTeam: Team | null;
}

export function MatchPrepScene() {
  const { pilots, mechs, enemyTeams } = useGameStore();
  const { currentBattle, setBattle, setConnected } = useBattleStore();
  
  const [matchState, setMatchState] = useState<MatchState>({
    currentStep: 'roster',
    selectedRoster: [],
    bannedMechs: [],
    pickedMechs: { player: [], enemy: [] },
    pilotMechAssignments: {},
    selectedStrategy: '',
    enemyTeam: null
  });

  const [banPickPhase, setBanPickPhase] = useState<BanPickPhase>('ban_enemy_1');

  // 사용 가능한 파일럿 조회
  const { data: availablePilots = [] } = useQuery({
    queryKey: ['/api/pilots/active'],
    enabled: true
  });

  // 사용 가능한 메카 조회
  const { data: availableMechs = [] } = useQuery({
    queryKey: ['/api/mechs/available'],
    enabled: true
  });

  useEffect(() => {
    // 랜덤 적팀 선택
    if (enemyTeams.length > 0 && !matchState.enemyTeam) {
      const randomEnemy = enemyTeams[Math.floor(Math.random() * enemyTeams.length)];
      setMatchState(prev => ({ ...prev, enemyTeam: randomEnemy }));
    }
  }, [enemyTeams, matchState.enemyTeam]);

  // WebSocket 연결 및 이벤트 리스너 설정
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        await wsManager.connect();
        setConnected(true);
        
        // 전투 상태 업데이트 리스너
        const handleBattleUpdate = (data: any) => {
          console.log('Battle update received:', data);
          console.log('Update keys:', Object.keys(data));
          if (data.update) {
            console.log('Setting battle state from update:', data.update);
            setBattle(data.update);
          }
        };

        // 전투 시작 리스너
        const handleBattleStart = (data: any) => {
          console.log('Battle started:', data);
          console.log('Start keys:', Object.keys(data));
          if (data.state) {
            console.log('Setting battle state from start:', data.state);
            setBattle(data.state);
          }
        };

        wsManager.on('BATTLE_UPDATE', handleBattleUpdate);
        wsManager.on('BATTLE_STARTED', handleBattleStart);

        return () => {
          wsManager.off('BATTLE_UPDATE', handleBattleUpdate);
          wsManager.off('BATTLE_STARTED', handleBattleStart);
        };
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setConnected(false);
      }
    };

    setupWebSocket();
  }, [setBattle, setConnected]);

  const stepTitles = {
    roster: '1단계: 출전 로스터 선택',
    banpick: '2단계: 스네이크 밴픽',
    swap: '3단계: 픽 스왑',
    strategy: '4단계: 전략 설정',
    simulation: '5단계: 시뮬레이션'
  };

  const strategies = [
    { id: 'aggressive', name: '공격적 전술', description: '화력 +15%, 방어 -10%' },
    { id: 'defensive', name: '수비적 전술', description: '방어 +20%, 속도 -5%' },
    { id: 'balanced', name: '균형 전술', description: '모든 능력치 +5%' },
    { id: 'formation_rush', name: '진형 돌파', description: '속도 +25%, HP -10%' }
  ];

  // 1단계: 로스터 선택
  const handleSelectPilot = (pilot: Pilot) => {
    if (matchState.selectedRoster.length >= 3) return;
    
    setMatchState(prev => ({
      ...prev,
      selectedRoster: [...prev.selectedRoster, pilot]
    }));
  };

  const handleRemovePilot = (pilotId: number) => {
    setMatchState(prev => ({
      ...prev,
      selectedRoster: prev.selectedRoster.filter(p => p.id !== pilotId)
    }));
  };

  // 2단계: 밴픽 처리
  const handleMechAction = (mech: Mech) => {
    const isBanPhase = banPickPhase.includes('ban');
    
    if (isBanPhase) {
      // 밴 처리
      setMatchState(prev => ({
        ...prev,
        bannedMechs: [...prev.bannedMechs, mech]
      }));
    } else {
      // 픽 처리
      const isPlayerPick = banPickPhase.includes('player');
      setMatchState(prev => ({
        ...prev,
        pickedMechs: {
          ...prev.pickedMechs,
          [isPlayerPick ? 'player' : 'enemy']: [
            ...prev.pickedMechs[isPlayerPick ? 'player' : 'enemy'],
            mech
          ]
        }
      }));
    }

    // 다음 페이즈로 진행
    const phases: BanPickPhase[] = [
      'ban_enemy_1', 'ban_player_1', 'ban_player_2', 'ban_enemy_2',
      'pick_player_1', 'pick_enemy_1', 'pick_enemy_2', 'pick_player_2',
      'pick_player_3', 'pick_enemy_3', 'complete'
    ];
    
    const currentIndex = phases.indexOf(banPickPhase);
    if (currentIndex < phases.length - 1) {
      setBanPickPhase(phases[currentIndex + 1]);
    }
  };

  // AI 적팀 자동 선택
  useEffect(() => {
    const isEnemyTurn = banPickPhase.includes('enemy') && banPickPhase !== 'complete';
    if (isEnemyTurn && Array.isArray(availableMechs) && availableMechs.length > 0) {
      const selectableMechs = availableMechs.filter((mech: any) => 
        !matchState.bannedMechs.some(banned => banned.id === mech.id) &&
        !matchState.pickedMechs.player.some(picked => picked.id === mech.id) &&
        !matchState.pickedMechs.enemy.some(picked => picked.id === mech.id)
      );

      if (selectableMechs.length > 0) {
        // AI 선택 로직: 높은 firepower 우선
        const selectedMech = selectableMechs.reduce((best, current) => 
          current.firepower > best.firepower ? current : best
        );

        // 1초 후 자동 선택
        setTimeout(() => {
          handleMechAction(selectedMech);
        }, 1000);
      }
    }
  }, [banPickPhase, availableMechs, matchState.bannedMechs, matchState.pickedMechs]);

  // 3단계: 픽 스왑
  const handleAssignMech = (pilotId: number, mech: Mech) => {
    setMatchState(prev => ({
      ...prev,
      pilotMechAssignments: {
        ...prev.pilotMechAssignments,
        [pilotId]: mech
      }
    }));
  };

  // 단계 이동
  const goToStep = (step: MatchStep) => {
    setMatchState(prev => ({ ...prev, currentStep: step }));
  };

  const canProceedToNext = () => {
    switch (matchState.currentStep) {
      case 'roster':
        return matchState.selectedRoster.length === 3;
      case 'banpick':
        return banPickPhase === 'complete';
      case 'swap':
        return matchState.selectedRoster.every(pilot => 
          matchState.pilotMechAssignments[pilot.id]
        );
      case 'strategy':
        return matchState.selectedStrategy !== '';
      default:
        return false;
    }
  };

  const handleStartSimulation = () => {
    // 포메이션 데이터 구성
    const formation = {
      pilots: matchState.selectedRoster.map((pilot, index) => ({
        pilotId: pilot.id,
        mechId: matchState.pilotMechAssignments[pilot.id]?.id || 0,
        position: { x: index * 2, y: 0 }
      })),
      strategy: matchState.selectedStrategy
    };

    // 적팀 포메이션 (픽된 메카 사용)
    const enemyFormation = {
      pilots: matchState.pickedMechs.enemy.map((mech, index) => ({
        pilotId: 100 + index, // 임시 적팀 파일럿 ID
        mechId: mech.id,
        position: { x: index * 2, y: 5 }
      })),
      strategy: 'balanced'
    };

    console.log('Starting battle with formations:', { formation, enemyFormation });
    console.log('WebSocket connected:', wsManager.isConnected());
    
    // 시뮬레이션 단계로 이동 후 배틀 시작
    goToStep('simulation');
    
    // 약간의 지연 후 배틀 시작 (UI 업데이트 완료 후)
    setTimeout(() => {
      wsManager.startBattle(formation, enemyFormation);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      {/* 진행 단계 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Object.entries(stepTitles).map(([step, title], index) => (
            <div
              key={step}
              className={`flex items-center ${
                matchState.currentStep === step ? 'text-cyan-400' : 'text-gray-500'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  matchState.currentStep === step
                    ? 'bg-cyan-400 text-black'
                    : 'bg-gray-700'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 text-sm">{title}</span>
              {index < Object.keys(stepTitles).length - 1 && (
                <div className="w-12 h-0.5 bg-gray-600 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 현재 단계별 컨텐츠 */}
      <div className="flex-1">
        {matchState.currentStep === 'roster' && (
          <RosterSelection
            availablePilots={availablePilots as Pilot[]}
            selectedRoster={matchState.selectedRoster}
            onSelectPilot={handleSelectPilot}
            onRemovePilot={handleRemovePilot}
          />
        )}

        {matchState.currentStep === 'banpick' && (
          <BanPickPhase
            availableMechs={availableMechs as Mech[]}
            bannedMechs={matchState.bannedMechs}
            pickedMechs={matchState.pickedMechs}
            currentPhase={banPickPhase}
            enemyTeam={matchState.enemyTeam}
            onMechAction={handleMechAction}
          />
        )}

        {matchState.currentStep === 'swap' && (
          <PilotMechSwap
            selectedRoster={matchState.selectedRoster}
            pickedMechs={matchState.pickedMechs.player}
            assignments={matchState.pilotMechAssignments}
            onAssignMech={handleAssignMech}
          />
        )}

        {matchState.currentStep === 'strategy' && (
          <StrategySelection
            strategies={strategies}
            selectedStrategy={matchState.selectedStrategy}
            onSelectStrategy={(strategy) => 
              setMatchState(prev => ({ ...prev, selectedStrategy: strategy }))
            }
          />
        )}

        {matchState.currentStep === 'simulation' && (
          <SimulationDisplay 
            selectedRoster={matchState.selectedRoster}
            pilotMechAssignments={matchState.pilotMechAssignments}
            enemyPicks={matchState.pickedMechs.enemy}
            strategy={matchState.selectedStrategy}
          />
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-between mt-8">
        <CyberButton
          variant="secondary"
          onClick={() => {
            const steps: MatchStep[] = ['roster', 'banpick', 'swap', 'strategy', 'simulation'];
            const currentIndex = steps.indexOf(matchState.currentStep);
            if (currentIndex > 0) {
              goToStep(steps[currentIndex - 1]);
            }
          }}
          disabled={matchState.currentStep === 'roster'}
        >
          이전 단계
        </CyberButton>

        {matchState.currentStep !== 'simulation' && (
          <CyberButton
            variant="primary"
            onClick={() => {
              if (matchState.currentStep === 'strategy') {
                handleStartSimulation();
              } else {
                const steps: MatchStep[] = ['roster', 'banpick', 'swap', 'strategy', 'simulation'];
                const currentIndex = steps.indexOf(matchState.currentStep);
                if (currentIndex < steps.length - 1) {
                  goToStep(steps[currentIndex + 1]);
                }
              }
            }}
            disabled={!canProceedToNext()}
          >
            {matchState.currentStep === 'strategy' ? '시뮬레이션 시작' : '다음 단계'}
          </CyberButton>
        )}
      </div>
    </div>
  );
}

// 개별 단계 컴포넌트들
function RosterSelection({ 
  availablePilots, 
  selectedRoster, 
  onSelectPilot, 
  onRemovePilot 
}: {
  availablePilots: Pilot[];
  selectedRoster: Pilot[];
  onSelectPilot: (pilot: Pilot) => void;
  onRemovePilot: (pilotId: number) => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">출전할 파일럿 3명을 선택하세요 ({selectedRoster.length}/3)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 선택된 로스터 */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-cyan-400">선택된 로스터</h4>
          <div className="space-y-3">
            {selectedRoster.map((pilot, index) => (
              <div key={pilot.id} className="flex items-center justify-between bg-cyan-900/30 p-3 rounded border border-cyan-400/50">
                <div>
                  <span className="font-bold text-cyan-300">{index + 1}번</span>
                  <span className="ml-2">{pilot.name} ({pilot.callsign})</span>
                </div>
                <CyberButton
                  variant="danger"
                  onClick={() => onRemovePilot(pilot.id)}
                  className="text-xs px-2 py-1"
                >
                  제거
                </CyberButton>
              </div>
            ))}
          </div>
        </div>

        {/* 사용 가능한 파일럿 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">사용 가능한 파일럿</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availablePilots
              .filter(pilot => !selectedRoster.some(selected => selected.id === pilot.id))
              .map(pilot => (
                <PilotCard
                  key={pilot.id}
                  pilot={pilot}
                  onClick={() => onSelectPilot(pilot)}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BanPickPhase({
  availableMechs,
  bannedMechs,
  pickedMechs,
  currentPhase,
  enemyTeam,
  onMechAction
}: {
  availableMechs: Mech[];
  bannedMechs: Mech[];
  pickedMechs: { player: Mech[]; enemy: Mech[] };
  currentPhase: BanPickPhase;
  enemyTeam: Team | null;
  onMechAction: (mech: Mech) => void;
}) {
  const isBanPhase = currentPhase.includes('ban');
  const isPlayerTurn = currentPhase.includes('player');
  
  const getPhaseText = () => {
    if (currentPhase === 'complete') return '밴픽 완료!';
    const action = isBanPhase ? '밴' : '픽';
    const team = isPlayerTurn ? '우리 팀' : `${enemyTeam?.name || '적팀'}`;
    return `${team} ${action} 차례`;
  };

  const selectableMechs = availableMechs.filter(mech => 
    !bannedMechs.some(banned => banned.id === mech.id) &&
    !pickedMechs.player.some(picked => picked.id === mech.id) &&
    !pickedMechs.enemy.some(picked => picked.id === mech.id)
  );

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{getPhaseText()}</h3>
      
      {/* 밴픽 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <h4 className="text-lg font-semibold mb-3 text-red-400">밴된 메카</h4>
          <div className="space-y-2">
            {bannedMechs.map(mech => (
              <div key={mech.id} className="bg-red-900/30 p-2 rounded border border-red-400/50">
                {mech.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3 text-cyan-400">우리 팀 픽</h4>
          <div className="space-y-2">
            {pickedMechs.player.map(mech => (
              <div key={mech.id} className="bg-cyan-900/30 p-2 rounded border border-cyan-400/50">
                {mech.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3 text-orange-400">적팀 픽</h4>
          <div className="space-y-2">
            {pickedMechs.enemy.map(mech => (
              <div key={mech.id} className="bg-orange-900/30 p-2 rounded border border-orange-400/50">
                {mech.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 선택 가능한 메카 */}
      {currentPhase !== 'complete' && isPlayerTurn && (
        <div>
          <h4 className="text-lg font-semibold mb-3">
            {isBanPhase ? '밴할 메카를 선택하세요' : '픽할 메카를 선택하세요'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectableMechs.map(mech => (
              <div
                key={mech.id}
                onClick={() => onMechAction(mech)}
                className="bg-gray-800 p-4 rounded border border-gray-600 hover:border-cyan-400 cursor-pointer transition-colors"
              >
                <div className="font-bold">{mech.name}</div>
                <div className="text-sm text-gray-400">{mech.type}</div>
                <div className="text-xs mt-2">
                  HP: {mech.hp} | 공격: {mech.firepower}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isPlayerTurn && currentPhase !== 'complete' && (
        <div className="text-center py-8">
          <div className="text-lg">상대방이 선택 중...</div>
          <div className="mt-2 text-gray-400">잠시만 기다려주세요</div>
        </div>
      )}
    </div>
  );
}

function PilotMechSwap({
  selectedRoster,
  pickedMechs,
  assignments,
  onAssignMech
}: {
  selectedRoster: Pilot[];
  pickedMechs: Mech[];
  assignments: { [pilotId: number]: Mech | null };
  onAssignMech: (pilotId: number, mech: Mech) => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">파일럿과 메카를 매칭하세요</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {selectedRoster.map((pilot, index) => (
          <div key={pilot.id} className="bg-gray-800 p-4 rounded border border-gray-600">
            <h4 className="font-bold text-cyan-400 mb-3">
              {index + 1}번: {pilot.name}
            </h4>
            
            <div className="mb-4">
              <div className="text-sm text-gray-400">현재 배정:</div>
              <div className="text-white">
                {assignments[pilot.id]?.name || '미배정'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">선택 가능한 메카:</div>
              <div className="space-y-2">
                {pickedMechs
                  .filter(mech => 
                    !Object.values(assignments).some(assigned => assigned?.id === mech.id) ||
                    assignments[pilot.id]?.id === mech.id
                  )
                  .map(mech => (
                    <button
                      key={mech.id}
                      onClick={() => onAssignMech(pilot.id, mech)}
                      className={`w-full text-left p-2 rounded border transition-colors ${
                        assignments[pilot.id]?.id === mech.id
                          ? 'bg-cyan-900/50 border-cyan-400'
                          : 'bg-gray-700 border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">{mech.name}</div>
                      <div className="text-xs text-gray-400">
                        {mech.type} | HP: {mech.hp}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategySelection({
  strategies,
  selectedStrategy,
  onSelectStrategy
}: {
  strategies: Array<{ id: string; name: string; description: string }>;
  selectedStrategy: string;
  onSelectStrategy: (strategy: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">전투 전략을 선택하세요</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map(strategy => (
          <div
            key={strategy.id}
            onClick={() => onSelectStrategy(strategy.id)}
            className={`p-6 rounded border cursor-pointer transition-colors ${
              selectedStrategy === strategy.id
                ? 'bg-cyan-900/50 border-cyan-400'
                : 'bg-gray-800 border-gray-600 hover:border-gray-400'
            }`}
          >
            <h4 className="font-bold text-lg mb-2">{strategy.name}</h4>
            <p className="text-gray-400">{strategy.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimulationDisplay({
  selectedRoster,
  pilotMechAssignments,
  enemyPicks,
  strategy
}: {
  selectedRoster: Pilot[];
  pilotMechAssignments: { [pilotId: number]: Mech | null };
  enemyPicks: Mech[];
  strategy: string;
}) {
  const { currentBattle } = useBattleStore();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">전투 시뮬레이션</h3>
        <div className="text-lg text-cyan-400">전략: {strategy}</div>
      </div>

      {/* 팀 구성 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-cyan-900/30 p-4 rounded border border-cyan-400/50">
          <h4 className="text-lg font-bold text-cyan-400 mb-3">우리 팀</h4>
          <div className="space-y-2">
            {selectedRoster.map((pilot, index) => {
              const assignedMech = pilotMechAssignments[pilot.id];
              return (
                <div key={pilot.id} className="flex justify-between text-sm">
                  <span>{index + 1}. {pilot.name}</span>
                  <span className="text-cyan-300">{assignedMech?.name || '미배정'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-red-900/30 p-4 rounded border border-red-400/50">
          <h4 className="text-lg font-bold text-red-400 mb-3">적팀</h4>
          <div className="space-y-2">
            {enemyPicks.map((mech, index) => (
              <div key={mech.id} className="flex justify-between text-sm">
                <span>{index + 1}. AI 파일럿</span>
                <span className="text-red-300">{mech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 실시간 전투 시뮬레이션 */}
      {currentBattle ? (
        <BattleSimulation battle={currentBattle} />
      ) : (
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="text-lg mb-2">전투 시작 준비 중...</div>
            <div className="text-gray-400">잠시만 기다려주세요</div>
            <div className="text-xs text-gray-500 mt-4">
              Debug: currentBattle = {currentBattle ? 'exists' : 'null'}
              <br />
              WebSocket: {wsManager.isConnected() ? 'connected' : 'disconnected'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}