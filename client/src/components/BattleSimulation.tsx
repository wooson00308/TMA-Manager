import { useState, useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { useGameStore } from '@/stores/gameStore';
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";
import CanvasRenderer from "@/presentation/CanvasRenderer";
import { useBattleRender } from "@/hooks/useBattleRender";
import { useGameLoopWorker } from "@/hooks/useGameLoopWorker";
import { CyberButton } from "@/components/ui/CyberButton";
import type { BattleState, Pilot } from '@shared/schema';
import type { AttackEffect, PilotInfo, TerrainFeature } from '@shared/domain/types';

export function BattleSimulation(): JSX.Element {
  const [currentTick, setCurrentTick] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [animatingUnits, setAnimatingUnits] = useState<Set<number>>(new Set());
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [lastLogCount, setLastLogCount] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { currentBattle, addBattleLog, setBattle } = useBattleStore();
  const terrainFeatures = useGameStore(state => state.terrainFeatures);
  const getPilotInfo = useGameStore(state => state.getPilotInfo);
  const getPilotInfoWithBattle = useGameStore(state => state.getPilotInfoWithBattle);

  // 3초 카운트다운 및 자동 시작 로직
  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      setIsSimulating(true);
      addBattleLog({
        type: 'system',
        message: '전투가 시작됩니다!',
        timestamp: Date.now()
      });
    }
  }, [countdown, isCountingDown, addBattleLog]);

  // Canvas 애니메이션 렌더링 -> migrated to useBattleRender hook
  useBattleRender({
    canvasRef,
    battle: currentBattle,
    animatingUnits,
    attackEffects,
    setAttackEffects,
    terrainFeatures,
    getPilotInfo: (pilotId: number) => getPilotInfoWithBattle(pilotId, currentBattle?.participants),
  });

  // Phase B: leverage Web Worker for game loop when simulation is active
  useGameLoopWorker(currentBattle, isSimulating && !isCountingDown);

  // Timer logic for battle time tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isSimulating && !isCountingDown) {
      timer = setInterval(() => {
        setCurrentTick(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isSimulating, isCountingDown]);

  // Stop simulation locally when battle ends to prevent further unit actions.
  useEffect(() => {
    if (currentBattle?.phase === "completed") {
      setIsSimulating(false);
    }
  }, [currentBattle?.phase]);

  // Trigger attack effects when new combat events occur
  useEffect(() => {
    if (!currentBattle?.log || currentBattle.log.length === 0) return;
    
    const newLogs = currentBattle.log.slice(lastLogCount);
    setLastLogCount(currentBattle.log.length);
    
    newLogs.forEach((log) => {
      console.log('Battle log entry:', log); // Debug log
      
      // Look for any combat action (attack, movement, damage)
      if (log.type === 'attack' || log.message.includes('공격') || log.message.includes('피해') || log.message.includes('데미지')) {
        
        // Try to find participants involved in the action
        const participants = currentBattle.participants || [];
        let attacker: any = null;
        let target: any = null;
        
        // 로그에 speaker가 있으면 그것을 우선 사용
        if (log.speaker) {
          attacker = participants.find(p => {
            const pilotInfo = getPilotInfoWithBattle(p.pilotId, participants);
            return pilotInfo.name === log.speaker || pilotInfo.callsign === log.speaker;
          });
        }
        
        // speaker가 없거나 찾지 못했으면 메시지에서 파일럿 이름 찾기
        if (!attacker) {
          for (const participant of participants) {
            const pilotInfo = getPilotInfoWithBattle(participant.pilotId, participants);
            if (log.message.includes(pilotInfo.name) || log.message.includes(pilotInfo.callsign)) {
              if (!attacker && (log.message.includes('공격') || log.message.includes('사격'))) {
                attacker = participant;
                break;
              }
            }
          }
        }
        
        // Find target - look for "~에게" or "~를" patterns
        const targetPatterns = [/(\S+)에게/, /(\S+)를/, /(\S+)이/, /(\S+)가/];
        for (const pattern of targetPatterns) {
          const match = log.message.match(pattern);
          if (match) {
            const targetName = match[1];
            target = participants.find(p => {
              const info = getPilotInfoWithBattle(p.pilotId, participants);
              return info.name.includes(targetName) || info.callsign.includes(targetName);
            });
            if (target) break;
          }
        }
        
        // 타겟을 찾지 못했으면 공격자와 다른 팀에서 가장 가까운 적 선택
        if (attacker && !target) {
          const enemyTeam = attacker.team === 'team1' ? 'team2' : 'team1';
          const enemies = participants.filter(p => p.team === enemyTeam && p.status === 'active');
          if (enemies.length > 0) {
            // 가장 가까운 적 선택
            target = enemies.reduce((closest, enemy) => {
              const attackerPos = attacker.position;
              const enemyPos = enemy.position;
              const closestPos = closest.position;
              
              const enemyDist = Math.abs(attackerPos.x - enemyPos.x) + Math.abs(attackerPos.y - enemyPos.y);
              const closestDist = Math.abs(attackerPos.x - closestPos.x) + Math.abs(attackerPos.y - closestPos.y);
              
              return enemyDist < closestDist ? enemy : closest;
            });
          }
        }
        
        // If we still don't have both, use random participants for demo
        if (!attacker && participants.length > 0) {
          attacker = participants[0];
        }
        if (!target && participants.length > 1) {
          target = participants.find(p => p !== attacker) || participants[participants.length - 1];
        }
        
        if (attacker && target && attacker !== target) {
          console.log('Creating attack effect:', { 
            attacker: getPilotInfoWithBattle(attacker.pilotId, participants).name, 
            target: getPilotInfoWithBattle(target.pilotId, participants).name,
            attackerPilotId: attacker.pilotId,
            targetPilotId: target.pilotId
          });
          
          // Determine weapon type from message
          let weaponType: "laser" | "missile" | "beam" = "laser";
          if (log.message.includes('미사일') || log.message.includes('로켓') || log.message.includes('폭발')) {
            weaponType = "missile";
          } else if (log.message.includes('빔') || log.message.includes('플라즈마') || log.message.includes('에너지')) {
            weaponType = "beam";
          }
          
          // Create attack effect
          const attackEffect: AttackEffect = {
            id: `attack-${Date.now()}-${Math.random()}`,
            from: attacker.position,
            to: target.position,
            startTime: Date.now(),
            type: weaponType
          };
          
          setAttackEffects(prev => {
            console.log('Adding attack effect:', attackEffect);
            return [...prev, attackEffect];
          });
          
          // Animate attacking unit - pilotId를 정확히 사용
          setAnimatingUnits(prev => {
            const newSet = new Set(prev);
            newSet.add(attacker.pilotId);
            console.log('Animating unit:', attacker.pilotId, 'Current animating units:', Array.from(newSet));
            return newSet;
          });
          setTimeout(() => {
            setAnimatingUnits(prev => {
              const newSet = new Set(prev);
              newSet.delete(attacker.pilotId);
              console.log('Stopped animating unit:', attacker.pilotId, 'Remaining animating units:', Array.from(newSet));
              return newSet;
            });
          }, 1500);
        }
      }
    });
  }, [currentBattle?.log, lastLogCount, getPilotInfoWithBattle, currentBattle?.participants]);

  // Auto-scroll combat log to the bottom whenever a new entry is added.
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [currentBattle?.log]);

  const startSimulation = () => {
    setIsSimulating(true);
    setIsCountingDown(false);
    addBattleLog({
      type: 'system',
      message: '전투가 시작되었습니다!',
      timestamp: Date.now()
    });
  };

  const testAnimation = () => {
    if (!currentBattle?.participants || currentBattle.participants.length < 2) return;
    
    const participants = currentBattle.participants;
    const attacker = participants[0];
    const target = participants[1];
    
    const attackEffect: AttackEffect = {
      id: `test-attack-${Date.now()}`,
      from: attacker.position,
      to: target.position,
      startTime: Date.now(),
      type: "laser"
    };
    
    setAttackEffects(prev => [...prev, attackEffect]);
    setAnimatingUnits(prev => {
      const newSet = new Set(prev);
      newSet.add(attacker.pilotId);
      return newSet;
    });
    
    setTimeout(() => {
      setAnimatingUnits(prev => {
        const newSet = new Set(prev);
        newSet.delete(attacker.pilotId);
        return newSet;
      });
    }, 1000);
  };

  if (!currentBattle) {
    return (
      <div className="scene-transition">
        <div className="bg-white/80 backdrop-blur-lg border border-red-200/50 rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <div className="text-slate-600 font-medium">전투 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-transition h-full flex flex-col overflow-hidden">
      {/* Battle Status Header */}
      <div className="relative mb-6 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-yellow-500/10 backdrop-blur-lg border border-red-200/30 rounded-2xl p-6 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-100/20 to-orange-100/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            {/* Team 1 Score */}
            <div className="bg-white/80 backdrop-blur-lg border border-blue-200/50 rounded-xl p-4 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-sm"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(currentBattle.participants || []).filter(p => p.team === 'team1' && p.hp > 0).length}
                  </div>
                  <div className="text-sm text-blue-500 font-medium">아군 생존</div>
                </div>
              </div>
            </div>

            {/* Center Battle Controls */}
            <div className="flex items-center space-x-4">
              {currentBattle.phase !== 'completed' && !isSimulating && !isCountingDown && (
                <CyberButton onClick={startSimulation} variant="primary">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-play"></i>
                    <span>전투 시작</span>
                  </div>
                </CyberButton>
              )}
              
              {isCountingDown && (
                <div className="bg-white/90 backdrop-blur-lg border border-red-200/50 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl font-bold text-red-500 animate-pulse tabular-nums">
                      {countdown > 0 ? countdown : "START!"}
                    </div>
                    <div className="text-sm text-slate-600">
                      {countdown > 0 ? '초 후 시작' : '전투 개시!'}
                    </div>
                  </div>
                </div>
              )}

              {isSimulating && (
                <div className="bg-white/90 backdrop-blur-lg border border-green-200/50 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-bold">LIVE</span>
                    <span className="text-slate-700 font-mono text-sm">{currentTick}초</span>
                  </div>
                </div>
              )}

              {/* Animation Test Button */}
              {currentBattle.participants && currentBattle.participants.length >= 2 && (
                <CyberButton onClick={testAnimation} variant="secondary">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-vial"></i>
                    <span>테스트</span>
                  </div>
                </CyberButton>
              )}
            </div>

            {/* Team 2 Score */}
            <div className="bg-white/80 backdrop-blur-lg border border-red-200/50 rounded-xl p-4 shadow-md">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {(currentBattle.participants || []).filter(p => p.team === 'team2' && p.hp > 0).length}
                  </div>
                  <div className="text-sm text-red-500 font-medium">적군 생존</div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-crosshairs text-white text-sm"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Battle Phase Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-orange-200/50">
              <div className={`w-3 h-3 rounded-full ${
                currentBattle.phase === 'active' ? 'bg-green-500 animate-pulse' :
                currentBattle.phase === 'completed' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></div>
              <span className="text-sm font-medium text-slate-700">
                페이즈: {currentBattle.phase?.toUpperCase() || 'PREPARING'}
              </span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-orange-200/50">
              <i className="fas fa-clock text-orange-500 text-sm"></i>
              <span className="text-sm font-medium text-slate-700">
                경과시간: {currentTick}초
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Allied Panel */}
        <div className="w-72 bg-white/80 backdrop-blur-lg border border-blue-200/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-b border-blue-200/30 p-4">
            <h3 className="text-blue-600 font-bold text-center flex items-center justify-center space-x-2">
              <i className="fas fa-shield-alt"></i>
              <span>아군 부대</span>
            </h3>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            {(currentBattle.participants || [])
              .filter(p => p.team === 'team1')
              .map(participant => {
                const pilot = getPilotInfoWithBattle(participant.pilotId, currentBattle.participants);
                const isDestroyed = participant.status === 'destroyed';
                const hpPercent = participant.maxHp > 0 ? (participant.hp / participant.maxHp) * 100 : 0;
                const isAnimating = animatingUnits.has(participant.pilotId);
                
                return (
                  <div
                    key={participant.pilotId}
                    className={`p-3 rounded-xl border transition-all ${
                      isDestroyed 
                        ? 'bg-slate-100 border-slate-300 opacity-50' 
                        : isAnimating
                        ? 'bg-blue-100/80 border-blue-400 shadow-md ring-2 ring-blue-300 animate-pulse'
                        : 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-blue-700 text-sm">{pilot.name}</div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          participant.status === 'active' ? 'bg-green-500' :
                          participant.status === 'damaged' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-slate-600">{participant.status}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>HP</span>
                          <span>{participant.hp}/{participant.maxHp}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              hpPercent > 70 ? 'bg-green-500' :
                              hpPercent > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${hpPercent}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        위치: ({participant.position.x}, {participant.position.y})
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Center Battle Canvas */}
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-lg border border-orange-200/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/5 border-b border-orange-200/30 p-4">
            <h3 className="text-orange-600 font-bold text-center flex items-center justify-center space-x-2">
              <i className="fas fa-crosshairs"></i>
              <span>전투 구역</span>
            </h3>
          </div>
          
          <div className="flex-1 relative p-6 flex items-center justify-center">
            <CanvasRenderer
              ref={canvasRef}
              width={640}
              height={480}
              className="border border-orange-300/50 rounded-xl shadow-lg bg-gradient-to-br from-amber-50 to-orange-50"
            />

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="text-center bg-white/95 backdrop-blur-lg rounded-3xl p-12 border-2 border-orange-300/50 shadow-2xl">
                  <div className="text-8xl font-bold text-orange-500 animate-bounce mb-6 tabular-nums">
                    {countdown > 0 ? countdown : "START!"}
                  </div>
                  <div className="text-2xl text-slate-700 font-bold mb-4">전투 시작 준비 중...</div>
                  <div className="flex justify-center">
                    <div className="w-48 h-3 bg-orange-200 rounded-full overflow-hidden">
                      <div 
                        className="h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000"
                        style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Battle Log Panel */}
          <div className="bg-gradient-to-r from-slate-500/5 to-gray-500/5 border-t border-slate-200/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h4 className="text-slate-700 font-bold text-sm">전투 기록</h4>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                  <span className="text-green-600">엄폐물</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                  <span className="text-purple-600">고지대</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500"></div>
                  <span className="text-red-600">장애물</span>
                </div>
              </div>
            </div>
            <div 
              ref={logContainerRef}
              className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/50 p-3 h-32 overflow-y-auto text-xs space-y-1"
            >
              {currentBattle?.log.length === 0 ? (
                <div className="text-slate-500 text-center py-8">
                  <div className="mb-2">
                    <i className="fas fa-radio text-2xl text-slate-400"></i>
                  </div>
                  <div>전투 기록을 대기 중...</div>
                </div>
              ) : (
                (currentBattle?.log || []).slice(-15).map((log, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-slate-500 text-[10px] mt-0.5 tabular-nums">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    {log.speaker && (
                      <span className="font-semibold text-blue-600 text-[11px]">{log.speaker}:</span>
                    )}
                    <span className="text-slate-700 text-[11px] flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Enemy Panel */}
        <div className="w-72 bg-white/80 backdrop-blur-lg border border-red-200/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/5 border-b border-red-200/30 p-4">
            <h3 className="text-red-600 font-bold text-center flex items-center justify-center space-x-2">
              <i className="fas fa-crosshairs"></i>
              <span>적군 부대</span>
            </h3>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            {(currentBattle.participants || [])
              .filter(p => p.team === 'team2')
              .map(participant => {
                const pilot = getPilotInfoWithBattle(participant.pilotId, currentBattle.participants);
                const isDestroyed = participant.status === 'destroyed';
                const hpPercent = participant.maxHp > 0 ? (participant.hp / participant.maxHp) * 100 : 0;
                const isAnimating = animatingUnits.has(participant.pilotId);
                
                return (
                  <div
                    key={participant.pilotId}
                    className={`p-3 rounded-xl border transition-all ${
                      isDestroyed 
                        ? 'bg-slate-100 border-slate-300 opacity-50' 
                        : isAnimating
                        ? 'bg-red-100/80 border-red-400 shadow-md ring-2 ring-red-300 animate-pulse'
                        : 'bg-red-50/80 border-red-200 hover:bg-red-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-red-700 text-sm">{pilot.name}</div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          participant.status === 'active' ? 'bg-green-500' :
                          participant.status === 'damaged' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-slate-600">{participant.status}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>HP</span>
                          <span>{participant.hp}/{participant.maxHp}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              hpPercent > 70 ? 'bg-green-500' :
                              hpPercent > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${hpPercent}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        위치: ({participant.position.x}, {participant.position.y})
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}