import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { CyberButton } from '@/components/ui/CyberButton';
import { BattleSimulation } from '@/components/BattleSimulation';
import { Pilot, Mech, Team } from '@shared/schema';
import { wsManager } from '@/lib/websocket';

type MatchPhase = 'lineup' | 'champion_select' | 'pre_battle' | 'battle';

interface TeamLineup {
  pilots: Pilot[];
  formation: 'balanced' | 'aggressive' | 'defensive' | 'mobile';
}

interface ChampionSelectState {
  currentTurn: 'ban_player' | 'ban_enemy' | 'pick_player' | 'pick_enemy';
  turnCount: number;
  bannedMechs: Mech[];
  selectedMechs: {
    player: Mech[];
    enemy: Mech[];
  };
  assignments: { [pilotId: number]: Mech | null };
  playerBans: Mech[];
  enemyBans: Mech[];
}

export function NewMatchPrepScene() {
  const { pilots, mechs, enemyTeams } = useGameStore();
  const { currentBattle, setBattle, setConnected } = useBattleStore();
  
  const [currentPhase, setCurrentPhase] = useState<MatchPhase>('lineup');
  const [teamLineup, setTeamLineup] = useState<TeamLineup>({
    pilots: [],
    formation: 'balanced'
  });
  
  const [championSelect, setChampionSelect] = useState<ChampionSelectState>({
    currentTurn: 'ban_player',
    turnCount: 1,
    bannedMechs: [],
    selectedMechs: { player: [], enemy: [] },
    assignments: {},
    playerBans: [],
    enemyBans: []
  });

  const [selectedEnemyTeam, setSelectedEnemyTeam] = useState<Team | null>(null);
  const [showMechDetails, setShowMechDetails] = useState<Mech | null>(null);

  // 사용 가능한 파일럿 조회
  const { data: availablePilots = [] } = useQuery<Pilot[]>({
    queryKey: ['/api/pilots/active'],
    enabled: true
  });

  // 사용 가능한 메크 조회
  const { data: availableMechs = [] } = useQuery<Mech[]>({
    queryKey: ['/api/mechs/available'],
    enabled: true
  });

  // 적팀 목록 조회
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    enabled: true
  });

  // 챔피언 선택 턴 순서 (TFM 스타일 2밴 3픽 스네이크 드래프트)
  const championSelectSequence = [
    // 밴 단계 (각 팀 2개씩)
    { turn: 1, action: 'ban', team: 'player', description: '1차 밴' },
    { turn: 2, action: 'ban', team: 'enemy', description: '1차 밴' },
    { turn: 3, action: 'ban', team: 'enemy', description: '2차 밴' },
    { turn: 4, action: 'ban', team: 'player', description: '2차 밴' },
    
    // 픽 단계 (스네이크 드래프트: 1-1-2-2-2-1)
    { turn: 5, action: 'pick', team: 'player', description: '1픽' },
    { turn: 6, action: 'pick', team: 'enemy', description: '1픽' },
    { turn: 7, action: 'pick', team: 'enemy', description: '2픽' },
    { turn: 8, action: 'pick', team: 'player', description: '2픽' },
    { turn: 9, action: 'pick', team: 'player', description: '3픽' },
    { turn: 10, action: 'pick', team: 'enemy', description: '3픽' }
  ];

  const formations = [
    { 
      id: 'balanced', 
      name: '균형 편성', 
      description: '안정적이고 범용적인 편성',
      effects: ['모든 스탯 +5%', '안정성 높음'],
      icon: '⚖️'
    },
    { 
      id: 'aggressive', 
      name: '공격 편성', 
      description: '강력한 화력으로 압도',
      effects: ['화력 +20%', '속도 +10%', '방어력 -10%'],
      icon: '⚔️'
    },
    { 
      id: 'defensive', 
      name: '방어 편성', 
      description: '견고한 수비에서 반격',
      effects: ['방어력 +25%', 'HP +15%', '화력 -15%'],
      icon: '🛡️'
    },
    { 
      id: 'mobile', 
      name: '기동 편성', 
      description: '빠른 움직임으로 교란',
      effects: ['속도 +30%', '회피율 +20%', 'HP -20%'],
      icon: '💨'
    }
  ];

  // 라인업 단계: 파일럿 선택
  const handleSelectPilot = (pilot: Pilot) => {
    if (teamLineup.pilots.length < 3 && !teamLineup.pilots.some(p => p.id === pilot.id)) {
      setTeamLineup(prev => ({
        ...prev,
        pilots: [...prev.pilots, pilot]
      }));
    }
  };

  const handleRemovePilot = (pilotId: number) => {
    setTeamLineup(prev => ({
      ...prev,
      pilots: prev.pilots.filter(p => p.id !== pilotId)
    }));
  };

  const handleFormationChange = (formation: 'balanced' | 'aggressive' | 'defensive' | 'mobile') => {
    setTeamLineup(prev => ({ ...prev, formation }));
  };

  // 챔피언 선택 단계: 메크 밴/픽
  const handleMechAction = (mech: Mech) => {
    const currentSequence = championSelectSequence[championSelect.turnCount - 1];
    if (!currentSequence || currentSequence.team !== 'player') {
      console.log('Not player turn:', currentSequence);
      return;
    }

    // 이미 밴/픽된 메크인지 확인
    if (championSelect.playerBans.some(m => m.id === mech.id) ||
        championSelect.enemyBans.some(m => m.id === mech.id) ||
        championSelect.selectedMechs.player.some(m => m.id === mech.id) ||
        championSelect.selectedMechs.enemy.some(m => m.id === mech.id)) {
      console.log('Mech already banned/picked:', mech.name);
      return;
    }

    if (currentSequence.action === 'ban') {
      setChampionSelect(prev => ({
        ...prev,
        bannedMechs: [...prev.bannedMechs, mech],
        playerBans: [...prev.playerBans, mech],
        turnCount: prev.turnCount + 1
      }));
      console.log('Player banned:', mech.name);
    } else {
      setChampionSelect(prev => ({
        ...prev,
        selectedMechs: {
          ...prev.selectedMechs,
          player: [...prev.selectedMechs.player, mech]
        },
        turnCount: prev.turnCount + 1
      }));
      console.log('Player picked:', mech.name);
    }
  };

  // 메크 배정
  const handleAssignMech = (pilotId: number, mech: Mech) => {
    setChampionSelect(prev => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [pilotId]: mech
      }
    }));
  };

  // AI 적군 턴 처리
  useEffect(() => {
    const currentSequence = championSelectSequence[championSelect.turnCount - 1];
    
    // AI 턴인지 확인하고, 시퀀스가 끝나지 않았는지 확인
    if (currentSequence && 
        currentSequence.team === 'enemy' && 
        championSelect.turnCount <= championSelectSequence.length) {
      
      console.log('AI Turn:', currentSequence);
      
      const timer = setTimeout(() => {
        const availableForAction = (availableMechs as Mech[]).filter((mech: Mech) => 
          !championSelect.playerBans.some(banned => banned.id === mech.id) &&
          !championSelect.enemyBans.some(banned => banned.id === mech.id) &&
          !championSelect.selectedMechs.player.some(picked => picked.id === mech.id) &&
          !championSelect.selectedMechs.enemy.some(picked => picked.id === mech.id)
        );

        if (availableForAction.length > 0) {
          // AI 전략: 높은 전투력 메크 우선 선택
          const priorityMechs = availableForAction
            .sort((a: Mech, b: Mech) => (b.firepower + b.hp + b.armor) - (a.firepower + a.hp + a.armor))
            .slice(0, 3);
          
          const selectedMech = priorityMechs[Math.floor(Math.random() * priorityMechs.length)];

          if (currentSequence.action === 'ban') {
            setChampionSelect(prev => ({
              ...prev,
              bannedMechs: [...prev.bannedMechs, selectedMech],
              enemyBans: [...prev.enemyBans, selectedMech],
              turnCount: prev.turnCount + 1
            }));
            console.log('AI banned:', selectedMech.name);
          } else {
            setChampionSelect(prev => ({
              ...prev,
              selectedMechs: {
                ...prev.selectedMechs,
                enemy: [...prev.selectedMechs.enemy, selectedMech]
              },
              turnCount: prev.turnCount + 1
            }));
            console.log('AI picked:', selectedMech.name);
          }
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [championSelect.turnCount, availableMechs, championSelectSequence]);

  // 전투 시작
  const handleStartBattle = async () => {
    try {
      const formation1 = {
        teamId: 1,
        pilots: teamLineup.pilots.map(pilot => ({
          pilotId: pilot.id,
          mechId: championSelect.assignments[pilot.id]?.id || championSelect.selectedMechs.player[0]?.id,
          pilot,
          mech: championSelect.assignments[pilot.id] || championSelect.selectedMechs.player[0]
        }))
      };
      
      const formation2 = {
        teamId: 2,
        pilots: championSelect.selectedMechs.enemy.slice(0, 3).map((mech, index) => ({
          pilotId: 100 + index,
          mechId: mech.id,
          pilot: { id: 100 + index, name: `Enemy Pilot ${index + 1}`, callsign: `적기${index + 1}` },
          mech
        }))
      };

      const response = await fetch('/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formation1, formation2 }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      
      setBattle({
        id: result.battleId.toString(),
        phase: 'active',
        turn: 1,
        participants: [
          ...formation1.pilots.map((p, i) => ({
            pilotId: p.pilot.id,
            mechId: p.mech.id,
            position: { x: 2 + i * 2, y: 6 },
            hp: p.mech.hp || 100,
            status: 'active' as const
          })),
          ...formation2.pilots.map((p, i) => ({
            pilotId: p.pilot.id,
            mechId: p.mech.id,
            position: { x: 10 + i * 2, y: 6 },
            hp: p.mech.hp || 100,
            status: 'active' as const
          }))
        ],
        log: [{
          timestamp: Date.now(),
          type: 'system',
          message: '전투 시스템 초기화 완료. 전투가 시작됩니다!',
        }]
      });

      setTimeout(() => {
        wsManager.startBattle(formation1, formation2);
      }, 500);

      setCurrentPhase('battle');

    } catch (error) {
      console.error('Failed to start battle:', error);
      alert('전투 시작에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const getCurrentSequenceInfo = () => {
    const currentSequence = championSelectSequence[championSelect.turnCount - 1];
    if (!currentSequence) return { phase: 'complete', description: '챔피언 선택 완료' };
    
    const actionText = currentSequence.action === 'ban' ? '밴' : '픽';
    const teamText = currentSequence.team === 'player' ? '아군' : '적군';
    
    return {
      phase: `${currentSequence.action}_${currentSequence.team}`,
      description: `${teamText} ${currentSequence.description}`
    };
  };

  const getMechRating = (mech: Mech) => {
    return Math.round((mech.hp + mech.armor + mech.speed + mech.firepower + mech.range) / 5);
  };

  const getMechRoleIcon = (type: string) => {
    switch (type) {
      case 'Knight': return '🛡️';
      case 'River': return '⚡';
      case 'Arbiter': return '🎯';
      case 'Custom': return '⭐';
      default: return '🤖';
    }
  };

  if (currentPhase === 'battle' && currentBattle) {
    return <BattleSimulation battle={currentBattle} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-800 to-black text-white">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-cyan-400/30 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-cyan-400">경기 준비</h1>
            <div className="flex items-center space-x-4">
              {currentPhase === 'champion_select' && (
                <div className="bg-slate-700 px-4 py-2 rounded-lg border border-cyan-400/30">
                  <div className="text-sm text-gray-300">{getCurrentSequenceInfo().description}</div>
                  <div className="text-xs text-cyan-400 mt-1">
                    {championSelect.turnCount}/10 턴
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 라인업 선택 단계 */}
        {currentPhase === 'lineup' && (
          <div className="space-y-8">
            {/* 선발 라인업 */}
            <div className="tfm-panel rounded-xl p-6 phase-transition">
              <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">👥</span>
                선발 라인업 ({teamLineup.pilots.length}/3)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Array.from({ length: 3 }, (_, i) => {
                  const pilot = teamLineup.pilots[i];
                  return (
                    <div
                      key={i}
                      className={`aspect-[3/4] rounded-lg border-2 ${
                        pilot 
                          ? 'pilot-slot selected' 
                          : 'border-dashed border-gray-600 bg-slate-800/30'
                      } p-4 flex flex-col items-center justify-center relative`}
                    >
                      {pilot ? (
                        <>
                          <button
                            onClick={() => handleRemovePilot(pilot.id)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-xs transition-colors"
                          >
                            ×
                          </button>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mb-3">
                              <span className="text-2xl">👤</span>
                            </div>
                            <div className="font-bold text-cyan-400">{pilot.name}</div>
                            <div className="text-sm text-gray-400">"{pilot.callsign}"</div>
                            <div className="text-lg font-bold text-yellow-400 mt-2">{pilot.rating}</div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {pilot.traits.slice(0, 2).map((trait, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-600 text-xs rounded">
                                  {trait}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="text-4xl mb-2">+</div>
                          <div className="text-sm">파일럿 선택</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 파일럿 목록 */}
              {teamLineup.pilots.length < 3 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">사용 가능한 파일럿</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                    {(availablePilots as Pilot[])
                      .filter((pilot: Pilot) => !teamLineup.pilots.some(p => p.id === pilot.id))
                      .map((pilot: Pilot) => (
                        <button
                          key={pilot.id}
                          onClick={() => handleSelectPilot(pilot)}
                          className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg border border-gray-600 hover:border-cyan-400/50 champion-card text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-cyan-400/20 rounded-full flex items-center justify-center">
                              <span className="text-lg">👤</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">{pilot.name}</div>
                              <div className="text-sm text-gray-400">"{pilot.callsign}"</div>
                              <div className="text-lg font-bold text-yellow-400">{pilot.rating}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 편성 전술 선택 */}
            <div className="tfm-panel rounded-xl p-6 phase-transition">
              <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">⚔️</span>
                편성 전술
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {formations.map(formation => (
                  <button
                    key={formation.id}
                    onClick={() => handleFormationChange(formation.id as any)}
                    className={`p-4 rounded-lg border-2 transition-all formation-indicator champion-card ${
                      teamLineup.formation === formation.id
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-gray-600 bg-slate-700 hover:border-cyan-400/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{formation.icon}</div>
                      <div className="font-bold text-white mb-1">{formation.name}</div>
                      <div className="text-sm text-gray-400 mb-3">{formation.description}</div>
                      <div className="space-y-1">
                        {formation.effects.map((effect, idx) => (
                          <div key={idx} className="text-xs text-cyan-300 bg-slate-600/50 px-2 py-1 rounded">
                            {effect}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 다음 단계 버튼 */}
            {teamLineup.pilots.length === 3 && (
              <div className="flex justify-end">
                <CyberButton
                  onClick={() => setCurrentPhase('champion_select')}
                  className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500"
                >
                  챔피언 선택 단계로 →
                </CyberButton>
              </div>
            )}
          </div>
        )}

        {/* 챔피언 선택 단계 */}
        {currentPhase === 'champion_select' && (
          <div className="space-y-6">
            {/* 밴/픽 현황 */}
            <div className="tfm-panel rounded-xl p-6 phase-transition">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 아군 */}
                <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                    <span className="mr-2">🟦</span>
                    Trinity Squad
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">밴 ({championSelect.playerBans.length}/2)</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 2 }, (_, i) => {
                          const bannedMech = championSelect.playerBans[i];
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-lg border-2 ${
                                bannedMech 
                                  ? 'border-red-500 bg-red-500/20' 
                                  : 'border-dashed border-gray-600'
                              } p-2 flex items-center justify-center`}
                            >
                              {bannedMech ? (
                                <div className="text-center">
                                  <div className="text-lg">{getMechRoleIcon(bannedMech.type)}</div>
                                  <div className="text-xs font-bold truncate">{bannedMech.name}</div>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-2xl">🚫</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">픽 ({championSelect.selectedMechs.player.length}/3)</div>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 3 }, (_, i) => {
                          const selectedMech = championSelect.selectedMechs.player[i];
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-lg border-2 ${
                                selectedMech 
                                  ? 'border-blue-500 bg-blue-500/20' 
                                  : 'border-dashed border-gray-600'
                              } p-2 flex items-center justify-center`}
                            >
                              {selectedMech ? (
                                <div className="text-center">
                                  <div className="text-lg">{getMechRoleIcon(selectedMech.type)}</div>
                                  <div className="text-xs font-bold truncate">{selectedMech.name}</div>
                                  <div className="text-xs text-yellow-400">{getMechRating(selectedMech)}</div>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-lg">+</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 적군 */}
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center">
                    <span className="mr-2">🟥</span>
                    Steel Ravens
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">밴 ({championSelect.enemyBans.length}/2)</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 2 }, (_, i) => {
                          const bannedMech = championSelect.enemyBans[i];
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-lg border-2 ${
                                bannedMech 
                                  ? 'border-red-500 bg-red-500/20' 
                                  : 'border-dashed border-gray-600'
                              } p-2 flex items-center justify-center`}
                            >
                              {bannedMech ? (
                                <div className="text-center">
                                  <div className="text-lg">{getMechRoleIcon(bannedMech.type)}</div>
                                  <div className="text-xs font-bold truncate">{bannedMech.name}</div>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-2xl">🚫</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">픽 ({championSelect.selectedMechs.enemy.length}/3)</div>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 3 }, (_, i) => {
                          const selectedMech = championSelect.selectedMechs.enemy[i];
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-lg border-2 ${
                                selectedMech 
                                  ? 'border-red-500 bg-red-500/20' 
                                  : 'border-dashed border-gray-600'
                              } p-2 flex items-center justify-center`}
                            >
                              {selectedMech ? (
                                <div className="text-center">
                                  <div className="text-lg">{getMechRoleIcon(selectedMech.type)}</div>
                                  <div className="text-xs font-bold truncate">{selectedMech.name}</div>
                                  <div className="text-xs text-yellow-400">{getMechRating(selectedMech)}</div>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-lg">+</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 메크 선택 그리드 */}
            {championSelect.turnCount <= 10 && (
              <div className="bg-slate-800/50 rounded-xl border border-cyan-400/20 p-6">
                <h3 className="text-lg font-bold text-gray-300 mb-4">
                  사용 가능한 챔피언을 선택하세요
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
                  {(availableMechs as Mech[])
                    .filter((mech: Mech) => 
                      !championSelect.playerBans.some(banned => banned.id === mech.id) &&
                      !championSelect.enemyBans.some(banned => banned.id === mech.id) &&
                      !championSelect.selectedMechs.player.some(picked => picked.id === mech.id) &&
                      !championSelect.selectedMechs.enemy.some(picked => picked.id === mech.id)
                    )
                    .map((mech: Mech) => {
                      const currentSequence = championSelectSequence[championSelect.turnCount - 1];
                      const isPlayerTurn = currentSequence?.team === 'player';
                      const isBanTurn = currentSequence?.action === 'ban';
                      
                      return (
                        <button
                          key={mech.id}
                          onClick={() => handleMechAction(mech)}
                          onMouseEnter={() => setShowMechDetails(mech)}
                          onMouseLeave={() => setShowMechDetails(null)}
                          disabled={!isPlayerTurn}
                          className={`aspect-[3/4] rounded-lg border-2 p-3 champion-card ${
                            isPlayerTurn
                              ? isBanTurn
                                ? 'ban-turn'
                                : 'pick-turn'
                              : 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-center h-full flex flex-col justify-between">
                            <div>
                              <div className="text-2xl mb-1">{getMechRoleIcon(mech.type)}</div>
                              <div className="font-bold text-white text-sm truncate">{mech.name}</div>
                              <div className="text-xs text-gray-400">{mech.type}</div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-lg font-bold text-yellow-400">{getMechRating(mech)}</div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                <div className="bg-red-500/20 px-1 py-0.5 rounded">
                                  ⚔️ {mech.firepower}
                                </div>
                                <div className="bg-blue-500/20 px-1 py-0.5 rounded">
                                  🛡️ {mech.armor}
                                </div>
                                <div className="bg-green-500/20 px-1 py-0.5 rounded">
                                  💚 {mech.hp}
                                </div>
                                <div className="bg-yellow-500/20 px-1 py-0.5 rounded">
                                  ⚡ {mech.speed}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 메크 배정 */}
            {championSelect.selectedMechs.player.length === 3 && (
              <div className="bg-slate-800/50 rounded-xl border border-cyan-400/20 p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-4">파일럿-메크 배정</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {teamLineup.pilots.map((pilot, index) => (
                    <div key={pilot.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <div className="font-bold text-cyan-400">{pilot.name}</div>
                        <div className="text-sm text-gray-400">"{pilot.callsign}"</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-300">배정된 메크:</div>
                        {championSelect.assignments[pilot.id] ? (
                          <div className="bg-slate-600 p-3 rounded border border-cyan-400/30">
                            <div className="text-center">
                              <div className="text-xl">{getMechRoleIcon(championSelect.assignments[pilot.id]!.type)}</div>
                              <div className="font-bold text-white">{championSelect.assignments[pilot.id]!.name}</div>
                              <div className="text-sm text-yellow-400">레이팅: {getMechRating(championSelect.assignments[pilot.id]!)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4 border-2 border-dashed border-gray-600 rounded">
                            미배정
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          {championSelect.selectedMechs.player
                            .filter(mech => !Object.values(championSelect.assignments).some(assigned => assigned?.id === mech.id))
                            .map(mech => (
                              <button
                                key={mech.id}
                                onClick={() => handleAssignMech(pilot.id, mech)}
                                className="w-full p-2 bg-slate-600 hover:bg-slate-500 rounded border border-gray-500 hover:border-cyan-400/50 transition-colors text-left"
                              >
                                <div className="flex items-center space-x-2">
                                  <span>{getMechRoleIcon(mech.type)}</span>
                                  <span className="text-sm">{mech.name}</span>
                                  <span className="text-xs text-yellow-400 ml-auto">{getMechRating(mech)}</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 전투 시작 버튼 */}
                {Object.keys(championSelect.assignments).length === 3 && (
                  <div className="flex justify-end mt-6">
                    <CyberButton
                      onClick={handleStartBattle}
                      className="px-8 py-3 bg-green-600 hover:bg-green-500"
                    >
                      전투 시작! 🚀
                    </CyberButton>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 메크 상세 정보 툴팁 */}
      {showMechDetails && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-cyan-400/30 rounded-lg p-4 max-w-sm z-50">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getMechRoleIcon(showMechDetails.type)}</span>
              <div>
                <div className="font-bold text-white">{showMechDetails.name}</div>
                <div className="text-sm text-gray-400">{showMechDetails.type} - {showMechDetails.variant}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-red-500/20 p-2 rounded">
                <div className="text-red-300">화력</div>
                <div className="font-bold">{showMechDetails.firepower}</div>
              </div>
              <div className="bg-blue-500/20 p-2 rounded">
                <div className="text-blue-300">방어력</div>
                <div className="font-bold">{showMechDetails.armor}</div>
              </div>
              <div className="bg-green-500/20 p-2 rounded">
                <div className="text-green-300">체력</div>
                <div className="font-bold">{showMechDetails.hp}</div>
              </div>
              <div className="bg-yellow-500/20 p-2 rounded">
                <div className="text-yellow-300">속도</div>
                <div className="font-bold">{showMechDetails.speed}</div>
              </div>
              <div className="bg-purple-500/20 p-2 rounded col-span-2">
                <div className="text-purple-300">사거리</div>
                <div className="font-bold">{showMechDetails.range}</div>
              </div>
            </div>
            
            {showMechDetails.specialAbilities && showMechDetails.specialAbilities.length > 0 && (
              <div>
                <div className="text-sm text-cyan-300 mb-1">특수 능력</div>
                <div className="space-y-1">
                  {showMechDetails.specialAbilities.map((ability, idx) => (
                    <div key={idx} className="text-xs bg-slate-700 px-2 py-1 rounded">
                      {ability}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}