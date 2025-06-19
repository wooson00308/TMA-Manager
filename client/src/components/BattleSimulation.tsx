import { useState, useEffect } from 'react';
import { useBattleStore } from '@/stores/battleStore';

interface BattleParticipant {
  pilotId: number;
  mechId: number;
  position: { x: number; y: number };
  hp: number;
  status: 'active' | 'damaged' | 'destroyed';
}

interface BattleState {
  id: string;
  phase: 'preparation' | 'active' | 'completed';
  turn: number;
  participants: BattleParticipant[];
  log: Array<{
    timestamp: number;
    type: 'movement' | 'attack' | 'communication' | 'system';
    message: string;
    speaker?: string;
  }>;
}

interface BattleSimulationProps {
  battle: BattleState;
}

export function BattleSimulation({ battle }: BattleSimulationProps): JSX.Element {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const { addBattleLog, setBattle } = useBattleStore();

  const pilots = [
    { id: 1, name: "사샤", callsign: "볼코프" },
    { id: 2, name: "멘테", callsign: "스톰" },
    { id: 3, name: "아즈마", callsign: "레이븐" },
    { id: 101, name: "적기Alpha", callsign: "타겟-α" },
    { id: 102, name: "적기Beta", callsign: "타겟-β" },
    { id: 103, name: "적기Gamma", callsign: "타겟-γ" },
  ];

  const getPilotName = (pilotId: number) => {
    return pilots.find(p => p.id === pilotId)?.name || `파일럿-${pilotId}`;
  };

  const getCallsign = (pilotId: number) => {
    return pilots.find(p => p.id === pilotId)?.callsign || `Unit-${pilotId}`;
  };

  // 시뮬레이션 진행 함수
  const progressSimulation = () => {
    if (!battle || battle.phase === 'completed') return;

    const newTurn = currentTurn + 1;
    setCurrentTurn(newTurn);

    // 새로운 배틀 상태 생성
    const updatedBattle = { ...battle };
    updatedBattle.turn = newTurn;

    // 랜덤 이벤트 생성
    const activeParticipants = updatedBattle.participants.filter((p: BattleParticipant) => p.status === 'active');
    if (activeParticipants.length > 0) {
      const randomParticipant = activeParticipants[Math.floor(Math.random() * activeParticipants.length)];
      const pilotName = getPilotName(randomParticipant.pilotId);
      const callsign = getCallsign(randomParticipant.pilotId);
      const isPlayerTeam = randomParticipant.pilotId < 100;

      // 다양한 전투 이벤트
      const events = [
        {
          type: 'movement' as const,
          messages: [
            `${callsign}: "포지션 변경, ${isPlayerTeam ? '3' : '9'}시 방향으로 이동 중"`,
            `${callsign}: "엄폐물 확보. 새로운 사격 포인트로 이동"`,
            `${callsign}: "적기 추적 중. 기동 패턴 분석 중..."`,
          ]
        },
        {
          type: 'attack' as const,
          messages: [
            `${callsign}: "타겟 록온! 사격 개시!"`,
            `${callsign}: "적기에 명중! 데미지 확인됨!"`,
            `${callsign}: "빗나갔다... 재조준 중!"`,
            `${callsign}: "연속 사격! 압박을 가하겠다!"`,
          ]
        },
        {
          type: 'communication' as const,
          messages: [
            `${callsign}: "적기 발견! ${isPlayerTeam ? '동료' : '적'}들 주의!"`,
            `${callsign}: "상황 보고 - 현재 교전 중"`,
            `${callsign}: "지원 요청! 집중포화 받고 있음!"`,
            `${callsign}: "좋은 기회다. 지금이야!"`,
          ]
        }
      ];

      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const randomMessage = randomEvent.messages[Math.floor(Math.random() * randomEvent.messages.length)];

      // 위치 업데이트 (이동 이벤트인 경우)
      if (randomEvent.type === 'movement') {
        const newX = Math.max(0, Math.min(14, randomParticipant.position.x + (Math.random() > 0.5 ? 1 : -1)));
        const newY = Math.max(0, Math.min(7, randomParticipant.position.y + (Math.random() > 0.5 ? 1 : -1)));
        randomParticipant.position = { x: newX, y: newY };
      }

      // HP 변화 (공격 이벤트인 경우)
      if (randomEvent.type === 'attack' && Math.random() > 0.3) {
        const targets = activeParticipants.filter((p: BattleParticipant) => 
          (randomParticipant.pilotId < 100) !== (p.pilotId < 100) // 다른 팀만 타겟
        );
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          const damage = Math.floor(Math.random() * 25) + 10;
          target.hp = Math.max(0, target.hp - damage);
          if (target.hp <= 0) {
            target.status = 'destroyed';
            addBattleLog({
              timestamp: Date.now(),
              type: 'system',
              message: `${getPilotName(target.pilotId)} 기체 격파됨!`,
            });
          }
        }
      }

      // 로그 추가
      addBattleLog({
        timestamp: Date.now(),
        type: randomEvent.type,
        message: randomMessage,
        speaker: pilotName,
      });

      // 전투 종료 조건 확인
      const playerAlive = updatedBattle.participants.filter((p: BattleParticipant) => p.pilotId < 100 && p.status === 'active').length;
      const enemyAlive = updatedBattle.participants.filter((p: BattleParticipant) => p.pilotId >= 100 && p.status === 'active').length;

      if (playerAlive === 0 || enemyAlive === 0 || newTurn >= 30) {
        updatedBattle.phase = 'completed';
        setIsSimulating(false);
        
        const winner = playerAlive > enemyAlive ? 'Trinity Squad' : enemyAlive > playerAlive ? 'Enemy Team' : 'Draw';
        addBattleLog({
          timestamp: Date.now(),
          type: 'system',
          message: `전투 종료! 결과: ${winner} 승리`,
        });
      }

      // 배틀 상태 업데이트
      setBattle(updatedBattle);
    }
  };

  // 자동 시뮬레이션 시작
  useEffect(() => {
    if (battle && battle.phase === 'preparation') {
      const timer = setTimeout(() => {
        setBattle({ ...battle, phase: 'active' });
        setIsSimulating(true);
        addBattleLog({
          timestamp: Date.now(),
          type: 'system',
          message: '전투 시작! 모든 유닛 교전 개시!'
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [battle]);

  // 시뮬레이션 진행 타이머
  useEffect(() => {
    if (isSimulating && battle?.phase === 'active') {
      const timer = setInterval(() => {
        progressSimulation();
      }, 2000);

      return () => clearInterval(timer);
    }
  }, [isSimulating, battle, currentTurn]);

  // 고급 ASCII 전장 렌더링 (사이버코드 온라인 스타일)
  const renderBattlefield = () => {
    if (!battle) return null;

    const width = 20;
    const height = 12;
    const field = Array(height).fill(null).map(() => Array(width).fill('░'));
    
    // 지형 요소 추가
    // 중앙 엄폐물
    for (let i = 8; i <= 11; i++) {
      for (let j = 4; j <= 7; j++) {
        field[j][i] = '█';
      }
    }
    
    // 측면 엄폐물
    for (let i = 2; i <= 4; i++) {
      field[2][i] = '█';
      field[9][i] = '█';
      field[2][width-1-i] = '█';
      field[9][width-1-i] = '█';
    }

    // 참가자 위치 표시 (안전 체크)
    if (battle.participants && Array.isArray(battle.participants)) {
      battle.participants.forEach((participant: BattleParticipant) => {
        const { x, y } = participant.position;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          let symbol = '░';
          if (participant.status === 'destroyed') {
            symbol = '💥';
          } else if (participant.pilotId < 100) {
            // 아군: 나이트, 리버, 아비터 스타일로 구분
            const mechType = participant.mechId % 3;
            if (participant.hp > 70) {
              symbol = mechType === 0 ? '🛡️' : mechType === 1 ? '⚡' : '🎯';
            } else if (participant.hp > 30) {
              symbol = '🟨';
            } else {
              symbol = '🟧';
            }
          } else {
            // 적군
            symbol = participant.hp > 70 ? '🔴' : participant.hp > 30 ? '🟪' : '⬛';
          }
          field[y][x] = symbol;
        }
      });
    }

    return (
      <div className="bg-black/80 p-4 rounded border border-cyan-400/50 font-mono text-xs">
        <div className="text-center text-cyan-300 mb-3 font-bold">
          ╔═══════════ TRINITY BATTLEFIELD ═══════════╗
        </div>
        <div className="bg-gray-900/50 p-2 rounded">
          {field.map((row, y) => (
            <div key={y} className="flex justify-center">
              {row.map((cell, x) => (
                <span 
                  key={x} 
                  className={`inline-block w-4 h-4 text-center leading-4 ${
                    cell === '█' ? 'text-gray-600' : 
                    cell === '💥' ? 'text-red-500' :
                    cell === '🛡️' ? 'text-blue-400' :
                    cell === '⚡' ? 'text-yellow-400' :
                    cell === '🎯' ? 'text-green-400' :
                    cell === '🔴' ? 'text-red-400' : ''
                  }`}
                  style={{ fontSize: '12px' }}
                >
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="text-center text-cyan-300 mt-3 font-bold">
          ╚═══════════════════════════════════════════╝
        </div>
        
        {/* 개선된 범례 */}
        <div className="mt-4 text-xs text-gray-300 space-y-1 bg-gray-900/30 p-2 rounded">
          <div className="text-cyan-400 font-bold mb-2">▼ LEGEND</div>
          <div>🛡️ Knight (균형형) ⚡ River (돌격형) 🎯 Arbiter (저격형)</div>
          <div>🟨 손상 🟧 위험 🔴 적군 💥 격파 █ 엄폐물</div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* 전장 표시 (왼쪽) */}
      <div className="lg:col-span-2 space-y-4">
        {/* 전투 상태 표시 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold text-cyan-400">Turn {currentTurn}</span>
            {isSimulating && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">ACTIVE</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-400">
            Phase: {battle?.phase?.toUpperCase() || 'STANDBY'}
          </div>
        </div>

        {/* 전장 표시 */}
        {renderBattlefield()}

        {/* 수동 진행 버튼 (디버그용) */}
        {battle?.phase === 'active' && (
          <div className="flex justify-center">
            <button
              onClick={progressSimulation}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm"
            >
              Next Turn (Manual)
            </button>
          </div>
        )}
      </div>

      {/* 실시간 통신 로그 (오른쪽) */}
      <div className="lg:col-span-1">
        <div className="bg-black/80 p-4 rounded border border-cyan-400/50 h-full font-mono">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-cyan-300 font-bold text-sm">
              ═══ TRINITY COMM ═══
            </h4>
            <div className="text-xs text-gray-400">
              Turn {battle?.turn || 0}
            </div>
          </div>
          
          <div className="h-80 overflow-y-auto space-y-2 text-xs">
            {battle?.log && battle.log.length > 0 ? (
              battle.log.slice(-25).map((entry, index) => {
                const timeStr = new Date(entry.timestamp).toLocaleTimeString('ko-KR', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                });
                
                return (
                  <div key={index} className="flex">
                    <span className="text-gray-500 mr-2 font-mono text-xs">
                      [{timeStr}]
                    </span>
                    <div className="flex-1">
                      {entry.speaker ? (
                        <div className={`${
                          entry.type === 'communication' ? 'text-cyan-300' :
                          entry.type === 'attack' ? 'text-red-300' :
                          entry.type === 'movement' ? 'text-yellow-300' :
                          'text-green-300'
                        }`}>
                          <span className="font-bold text-white">
                            {entry.speaker}
                          </span>
                          <span className="text-gray-400 mx-1">▸</span>
                          <span className="text-sm">{entry.message}</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-sm">
                          ● {entry.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 italic py-8">
                <div className="mb-2">📡</div>
                <div>≫ 통신 대기 중 ≪</div>
                <div className="text-xs mt-2">전투 시작 시 실시간 로그가 표시됩니다</div>
              </div>
            )}
          </div>
          
          {/* 스크롤 표시기 */}
          <div className="flex justify-center mt-3 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-500">
              ▼ 실시간 통신 ▼
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}