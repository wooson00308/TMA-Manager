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

  // 사용 가능한 메크 조회
  const { data: availableMechs = [] } = useQuery({
    queryKey: ['/api/mechs/available'],
    enabled: true
  });

  // 팀 데이터 조회
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    enabled: true
  });

  useEffect(() => {
    if (teams.length > 0 && !matchState.enemyTeam) {
      const randomEnemyTeam = teams[Math.floor(Math.random() * teams.length)];
      setMatchState(prev => ({ ...prev, enemyTeam: randomEnemyTeam }));
    }
  }, [teams, matchState.enemyTeam]);

  // 밴픽 단계 시작 시 첫 적군 턴 자동 실행
  useEffect(() => {
    if (matchState.currentStep === 'banpick' && banPickPhase === 'ban_enemy_1' && availableMechs.length > 0) {
      setTimeout(() => {
        handleEnemyBanPick('ban_enemy_1');
      }, 1500);
    }
  }, [matchState.currentStep, banPickPhase, availableMechs]);

  const stepTitles = {
    roster: 'Step 1: 로스터 선택',
    banpick: 'Step 2: 밴픽 단계',
    swap: 'Step 3: 파일럿 배치',
    strategy: 'Step 4: 전략 선택',
    simulation: 'Step 5: 전투 시뮬레이션'
  };

  const strategies = [
    { id: 'aggressive', name: '공격적 전술', description: '적극적인 공세로 빠른 승부' },
    { id: 'defensive', name: '방어적 전술', description: '안정적인 수비에서 기회 포착' },
    { id: 'balanced', name: '균형 전술', description: '상황에 따른 유연한 대응' }
  ];

  const handleSelectPilot = (pilot: Pilot) => {
    if (matchState.selectedRoster.length < 3 && !matchState.selectedRoster.some(p => p.id === pilot.id)) {
      setMatchState(prev => ({
        ...prev,
        selectedRoster: [...prev.selectedRoster, pilot]
      }));
    }
  };

  const handleRemovePilot = (pilotId: number) => {
    setMatchState(prev => ({
      ...prev,
      selectedRoster: prev.selectedRoster.filter(p => p.id !== pilotId)
    }));
  };

  const handleMechAction = (mech: Mech) => {
    const isBanPhase = banPickPhase.includes('ban');
    const isPlayerTurn = banPickPhase.includes('player');

    if (isBanPhase) {
      if (!matchState.bannedMechs.some(m => m.id === mech.id)) {
        setMatchState(prev => ({
          ...prev,
          bannedMechs: [...prev.bannedMechs, mech]
        }));
        advanceBanPickPhase();
      }
    } else {
      if (isPlayerTurn) {
        if (matchState.pickedMechs.player.length < 3) {
          setMatchState(prev => ({
            ...prev,
            pickedMechs: {
              ...prev.pickedMechs,
              player: [...prev.pickedMechs.player, mech]
            }
          }));
          advanceBanPickPhase();
        }
      }
    }
  };

  const advanceBanPickPhase = () => {
    const phaseOrder: BanPickPhase[] = [
      'ban_enemy_1', 'ban_player_1', 'ban_player_2', 'ban_enemy_2',
      'pick_player_1', 'pick_enemy_1', 'pick_enemy_2', 'pick_player_2',
      'pick_player_3', 'pick_enemy_3', 'complete'
    ];
    
    const currentIndex = phaseOrder.indexOf(banPickPhase);
    if (currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1];
      setBanPickPhase(nextPhase);
      
      if (nextPhase.includes('enemy')) {
        setTimeout(() => {
          handleEnemyBanPick(nextPhase);
        }, 1000);
      }
      
      if (nextPhase === 'complete') {
        goToStep('swap');
      }
    }
  };

  const handleEnemyBanPick = (phase: BanPickPhase) => {
    const availableForAction = (availableMechs as Mech[]).filter(mech => 
      !matchState.bannedMechs.some(banned => banned.id === mech.id) &&
      !matchState.pickedMechs.player.some(picked => picked.id === mech.id) &&
      !matchState.pickedMechs.enemy.some(picked => picked.id === mech.id)
    );

    if (availableForAction.length > 0) {
      const randomMech = availableForAction[Math.floor(Math.random() * availableForAction.length)];
      
      if (phase.includes('ban')) {
        setMatchState(prev => ({
          ...prev,
          bannedMechs: [...prev.bannedMechs, randomMech]
        }));
      } else {
        setMatchState(prev => ({
          ...prev,
          pickedMechs: {
            ...prev.pickedMechs,
            enemy: [...prev.pickedMechs.enemy, randomMech]
          }
        }));
      }
      
      setTimeout(() => {
        advanceBanPickPhase();
      }, 800);
    }
  };

  const handleAssignMech = (pilotId: number, mech: Mech) => {
    setMatchState(prev => ({
      ...prev,
      pilotMechAssignments: {
        ...prev.pilotMechAssignments,
        [pilotId]: mech
      }
    }));
  };

  const goToStep = (step: MatchStep) => {
    setMatchState(prev => ({ ...prev, currentStep: step }));
    
    // 밴픽 단계로 이동할 때 첫 적군 턴 자동 시작
    if (step === 'banpick') {
      setBanPickPhase('ban_enemy_1');
      setTimeout(() => {
        handleEnemyBanPick('ban_enemy_1');
      }, 1000);
    }
  };

  const handleStartBattle = () => {
    const formation = {
      pilots: matchState.selectedRoster.map(pilot => ({
        pilot,
        mech: matchState.pilotMechAssignments[pilot.id] || matchState.pickedMechs.player[0]
      }))
    };
    
    const enemyFormation = {
      pilots: matchState.pickedMechs.enemy.slice(0, 3).map((mech, index) => ({
        pilot: { id: 100 + index, name: `Enemy Pilot ${index + 1}`, callsign: `적기${index + 1}` },
        mech
      }))
    };

    setTimeout(() => {
      wsManager.startBattle(formation, enemyFormation);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* 상단 헤더 - 고정형 진행 표시 */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-cyan-400/30 p-4">
        <div className="max-w-7xl mx-auto">
          {/* 단계 진행 바 - 모바일 최적화 */}
          <div className="flex items-center justify-between mb-2 overflow-x-auto custom-scrollbar">
            {Object.entries(stepTitles).map(([step, title], index) => {
              const isCompleted = Object.keys(stepTitles).indexOf(matchState.currentStep) > index;
              const isCurrent = matchState.currentStep === step;
              
              return (
                <div key={step} className="flex items-center flex-1 min-w-0">
                  <div className="flex items-center min-w-0">
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${
                        isCurrent
                          ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/50 progress-glow'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="ml-2 md:ml-3 min-w-0">
                      <div className={`text-xs md:text-sm font-medium truncate ${
                        isCurrent ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        <span className="hidden md:inline">{title.split(': ')[1]}</span>
                        <span className="md:hidden">{title.split(': ')[1].split(' ')[0]}</span>
                      </div>
                      <div className="text-xs text-gray-500 hidden md:block">
                        {isCurrent ? '진행 중' : isCompleted ? '완료' : '대기'}
                      </div>
                    </div>
                  </div>
                  
                  {index < Object.keys(stepTitles).length - 1 && (
                    <div className="flex-1 mx-2 md:mx-4 min-w-[20px]">
                      <div className={`h-0.5 md:h-1 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-700'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* 현재 단계 설명 */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-cyan-400">
              {stepTitles[matchState.currentStep as keyof typeof stepTitles]}
            </h2>
          </div>
        </div>
      </div>
      
      {/* 메인 컨텐츠 영역 */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* 로스터 선택 */}
        {matchState.currentStep === 'roster' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">선택된 파일럿 ({matchState.selectedRoster.length}/3)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {matchState.selectedRoster.map((pilot, index) => (
                  <div key={pilot.id} className="relative">
                    <PilotCard 
                      pilot={pilot} 
                      onClick={() => {}} 
                      selected={true}
                    />
                    <button
                      onClick={() => handleRemovePilot(pilot.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <h4 className="text-md font-semibold text-gray-300 mb-3">사용 가능한 파일럿</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {(availablePilots as Pilot[]).map(pilot => {
                  const isSelected = matchState.selectedRoster.some(selected => selected.id === pilot.id);
                  return (
                    <PilotCard
                      key={pilot.id}
                      pilot={pilot}
                      onClick={() => handleSelectPilot(pilot)}
                      selected={isSelected}
                      disabled={isSelected || matchState.selectedRoster.length >= 3}
                    />
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-6">
                <CyberButton
                  onClick={() => goToStep('banpick')}
                  disabled={matchState.selectedRoster.length !== 3}
                  className="px-8 py-3"
                >
                  다음 단계: 밴픽
                </CyberButton>
              </div>
            </div>
          </div>
        )}

        {/* 밴픽 단계 */}
        {matchState.currentStep === 'banpick' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-cyan-400">밴픽 단계</h3>
                <div className="text-sm text-gray-300">
                  vs {matchState.enemyTeam?.name || '적팀'}
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-cyan-900/20 rounded border border-cyan-400/30">
                <div className="text-center">
                  <div className="text-cyan-300 font-bold">
                    현재: {banPickPhase.includes('ban') ? '밴' : '픽'} 단계 - {banPickPhase.includes('player') ? '플레이어' : '적팀'} 턴
                  </div>
                  {!banPickPhase.includes('player') && banPickPhase !== 'complete' && (
                    <div className="flex items-center justify-center mt-2 space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-red-300 text-sm">적팀이 선택 중...</span>
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-semibold text-red-300 mb-3">밴된 메크 ({matchState.bannedMechs.length})</h4>
                  <div className="grid grid-cols-2 gap-2 min-h-[100px] p-3 bg-red-900/20 rounded border border-red-400/30">
                    {matchState.bannedMechs.map((mech, index) => (
                      <div key={`banned-${mech.id}-${index}`} className="text-xs p-2 bg-red-800/50 rounded text-red-200">
                        {mech.name}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-green-300 mb-3">
                    선택된 메크 - 플레이어: {matchState.pickedMechs.player.length}/3, 적팀: {matchState.pickedMechs.enemy.length}/3
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-900/20 rounded border border-blue-400/30">
                      <div className="text-sm text-blue-300 mb-1">플레이어</div>
                      <div className="grid grid-cols-1 gap-1">
                        {matchState.pickedMechs.player.map((mech, index) => (
                          <div key={`player-pick-${mech.id}-${index}`} className="text-xs p-1 bg-blue-800/50 rounded text-blue-200">
                            {mech.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-red-900/20 rounded border border-red-400/30">
                      <div className="text-sm text-red-300 mb-1">적팀</div>
                      <div className="grid grid-cols-1 gap-1">
                        {matchState.pickedMechs.enemy.map((mech, index) => (
                          <div key={`enemy-pick-${mech.id}-${index}`} className="text-xs p-1 bg-red-800/50 rounded text-red-200">
                            {mech.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {banPickPhase.includes('player') && banPickPhase !== 'complete' && (
                <div>
                  <h4 className="text-md font-semibold text-gray-300 mb-3">
                    {banPickPhase.includes('ban') ? '밴할' : '선택할'} 메크를 클릭하세요
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(availableMechs as Mech[]).filter(mech => 
                      !matchState.bannedMechs.some(banned => banned.id === mech.id) &&
                      !matchState.pickedMechs.player.some(picked => picked.id === mech.id) &&
                      !matchState.pickedMechs.enemy.some(picked => picked.id === mech.id)
                    ).map((mech, index) => (
                      <button
                        key={`selectable-${mech.id}-${index}`}
                        onClick={() => handleMechAction(mech)}
                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded border border-gray-500 text-left transition-colors"
                      >
                        <div className="font-semibold text-sm">{mech.name}</div>
                        <div className="text-xs text-gray-400">{mech.type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!banPickPhase.includes('player') && banPickPhase !== 'complete' && (
                <div className="text-center py-8">
                  <div className="text-cyan-300">적팀이 선택 중...</div>
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mt-2"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 파일럿 배치 */}
        {matchState.currentStep === 'swap' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">파일럿-메크 배치</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-300 mb-3">선택된 파일럿</h4>
                  <div className="space-y-3">
                    {matchState.selectedRoster.map((pilot, index) => (
                      <div key={pilot.id} className="p-3 bg-gray-700 rounded border border-gray-500">
                        <div className="font-semibold">{pilot.name}</div>
                        <div className="text-sm text-gray-400">{pilot.callsign}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          배치된 메크: {matchState.pilotMechAssignments[pilot.id]?.name || '미배치'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-gray-300 mb-3">사용 가능한 메크</h4>
                  <div className="space-y-2">
                    {matchState.pickedMechs.player.map(mech => {
                      const isAssigned = Object.values(matchState.pilotMechAssignments).some(assigned => assigned?.id === mech.id);
                      const assignedPilot = Object.entries(matchState.pilotMechAssignments).find(([pilotId, assignedMech]) => assignedMech?.id === mech.id);
                      
                      return (
                        <div key={mech.id} className="p-3 bg-gray-700 rounded border border-gray-500">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{mech.name}</div>
                              <div className="text-sm text-gray-400">{mech.type}</div>
                              {isAssigned && assignedPilot && (
                                <div className="text-xs text-cyan-400 mt-1">
                                  배치됨: {matchState.selectedRoster.find(p => p.id === parseInt(assignedPilot[0]))?.name}
                                </div>
                              )}
                            </div>
                            {!isAssigned && (
                              <select
                                onChange={(e) => handleAssignMech(parseInt(e.target.value), mech)}
                                className="bg-gray-600 text-white rounded px-2 py-1 text-sm"
                                defaultValue=""
                              >
                                <option value="">파일럿 선택</option>
                                {matchState.selectedRoster.filter(pilot => !matchState.pilotMechAssignments[pilot.id]).map(pilot => (
                                  <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <CyberButton
                  onClick={() => goToStep('banpick')}
                  variant="secondary"
                  className="px-6 py-2"
                >
                  이전
                </CyberButton>
                <CyberButton
                  onClick={() => goToStep('strategy')}
                  disabled={Object.keys(matchState.pilotMechAssignments).length !== 3}
                  className="px-6 py-2"
                >
                  다음: 전략 선택
                </CyberButton>
              </div>
            </div>
          </div>
        )}

        {/* 전략 선택 */}
        {matchState.currentStep === 'strategy' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">전투 전략 선택</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {strategies.map(strategy => (
                  <button
                    key={strategy.id}
                    onClick={() => setMatchState(prev => ({ ...prev, selectedStrategy: strategy.id }))}
                    className={`p-4 rounded border-2 transition-all ${
                      matchState.selectedStrategy === strategy.id
                        ? 'border-cyan-400 bg-cyan-900/30'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold text-lg">{strategy.name}</div>
                    <div className="text-sm text-gray-400 mt-2">{strategy.description}</div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between">
                <CyberButton
                  onClick={() => goToStep('swap')}
                  variant="secondary"
                  className="px-6 py-2"
                >
                  이전
                </CyberButton>
                <CyberButton
                  onClick={() => goToStep('simulation')}
                  disabled={!matchState.selectedStrategy}
                  className="px-6 py-2"
                >
                  최종 확인
                </CyberButton>
              </div>
            </div>
          </div>
        )}

        {/* 시뮬레이션 단계 */}
        {matchState.currentStep === 'simulation' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">전투 준비 완료</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-semibold text-blue-300 mb-3">아군 편성</h4>
                  <div className="space-y-2">
                    {matchState.selectedRoster.map((pilot, index) => {
                      const assignedMech = matchState.pilotMechAssignments[pilot.id];
                      return (
                        <div key={pilot.id} className="p-3 bg-blue-900/20 rounded border border-blue-400/30">
                          <div className="font-semibold text-blue-200">{pilot.name}</div>
                          <div className="text-sm text-blue-300">{assignedMech?.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-red-300 mb-3">적군 편성</h4>
                  <div className="space-y-2">
                    {matchState.pickedMechs.enemy.map((mech, index) => (
                      <div key={mech.id} className="p-3 bg-red-900/20 rounded border border-red-400/30">
                        <div className="font-semibold text-red-200">Enemy Pilot {index + 1}</div>
                        <div className="text-sm text-red-300">{mech.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-cyan-900/20 p-4 rounded border border-cyan-400/30 mb-6">
                <div className="text-center text-cyan-300">
                  <div className="font-semibold">선택된 전략: {strategies.find(s => s.id === matchState.selectedStrategy)?.name}</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <CyberButton
                  onClick={() => goToStep('strategy')}
                  variant="secondary"
                  className="px-6 py-2"
                >
                  이전
                </CyberButton>
                <CyberButton
                  onClick={handleStartBattle}
                  className="px-8 py-3 text-lg"
                >
                  전투 시작!
                </CyberButton>
              </div>
            </div>
          </div>
        )}

        {/* 전투 진행 중일 때 */}
        {currentBattle && (
          <div className="mt-8">
            <BattleSimulation battle={currentBattle} />
          </div>
        )}
      </div>
    </div>
  );
}