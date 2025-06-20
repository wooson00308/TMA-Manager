import { useState, useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { useGameStore } from '@/stores/gameStore';
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";
import CanvasRenderer from "@/presentation/CanvasRenderer";
import { useBattleRender } from "@/hooks/useBattleRender";
import { useGameLoopWorker } from "@/hooks/useGameLoopWorker";
import type { BattleState, Pilot } from '@shared/schema';
import type { AttackEffect, PilotInfo, TerrainFeature } from '@shared/domain/types';

interface BattleSimulationProps {
  battle: BattleState;
}

export function BattleSimulation({ battle }: BattleSimulationProps): JSX.Element {
  const [currentTick, setCurrentTick] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [animatingUnits, setAnimatingUnits] = useState<Set<number>>(new Set());
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [lastLogCount, setLastLogCount] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { addBattleLog } = useBattleStore();
  const terrainFeatures = useGameStore(state => state.terrainFeatures);
  const getPilotInfo = useGameStore(state => state.getPilotInfo);

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
    battle,
    animatingUnits,
    attackEffects,
    setAttackEffects,
    terrainFeatures,
    getPilotInfo,
  });

  // Phase B: leverage Web Worker for game loop when simulation is active
  useGameLoopWorker(battle, isSimulating && !isCountingDown);

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
    if (battle.phase === "completed") {
      setIsSimulating(false);
    }
  }, [battle.phase]);

  // Trigger attack effects when new combat events occur
  useEffect(() => {
    if (!battle.log || battle.log.length === 0) return;
    
    const newLogs = battle.log.slice(lastLogCount);
    setLastLogCount(battle.log.length);
    
    newLogs.forEach((log) => {
      console.log('Battle log entry:', log); // Debug log
      
      // Look for any combat action (attack, movement, damage)
      if (log.type === 'attack' || log.message.includes('공격') || log.message.includes('피해') || log.message.includes('데미지')) {
        
        // Try to find participants involved in the action
        const participants = battle.participants || [];
        let attacker: any = null;
        let target: any = null;
        
        // Find attacker - look for pilot names in the message
        for (const participant of participants) {
          const pilotInfo = getPilotInfo(participant.pilotId);
          if (log.message.includes(pilotInfo.name) || log.message.includes(pilotInfo.callsign)) {
            if (!attacker && (log.message.includes('공격') || log.message.includes('사격'))) {
              attacker = participant;
            }
          }
        }
        
        // Find target - look for "~에게" or "~를" patterns
        const targetPatterns = [/(\S+)에게/, /(\S+)를/, /(\S+)이/];
        for (const pattern of targetPatterns) {
          const match = log.message.match(pattern);
          if (match) {
            const targetName = match[1];
            target = participants.find(p => {
              const info = getPilotInfo(p.pilotId);
              return info.name.includes(targetName) || info.callsign.includes(targetName);
            });
            if (target) break;
          }
        }
        
        // If we still don't have both, use random participants for demo
        if (!attacker && participants.length > 0) {
          attacker = participants[0];
        }
        if (!target && participants.length > 1) {
          target = participants[participants.length - 1];
        }
        
        if (attacker && target && attacker !== target) {
          console.log('Creating attack effect:', { attacker: getPilotInfo(attacker.pilotId).name, target: getPilotInfo(target.pilotId).name });
          
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
          
          // Animate attacking unit
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
          }, 1500);
        }
      }
    });
  }, [battle.log, lastLogCount, battle.participants, getPilotInfo]);

  // Auto-scroll combat log to the bottom whenever a new entry is added.
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battle.log]);

  const startSimulation = () => {
    setCurrentTick(0);
    setIsSimulating(true);
  };

  // Test animation function
  const testAnimation = () => {
    if (!battle.participants || battle.participants.length < 2) return;
    
    const attacker = battle.participants[0];
    const target = battle.participants[battle.participants.length - 1];
    
    const testEffect: AttackEffect = {
      id: `test-${Date.now()}`,
      from: attacker.position,
      to: target.position,
      startTime: Date.now(),
      type: "missile"
    };
    
    setAttackEffects(prev => [...prev, testEffect]);
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
    }, 1500);
  };

  if (!battle) {
    return (
      <div className="cyber-border p-6 bg-slate-800">
        <div className="text-center text-gray-400">
          전투 데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Mobile Portrait Layout */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Mobile Top Status Bar */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-2 border-cyan-400/50 p-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Team Scores Compact */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 bg-blue-900/30 border border-blue-400/50 rounded px-2 py-1">
                <div className="text-lg font-bold text-blue-400">
                  {(battle.participants || []).filter(p => p.team === 'team1' && p.hp > 0).length}
                </div>
                <div className="text-xs text-blue-300">아군</div>
              </div>
              
              <div className="flex items-center space-x-1 bg-red-900/30 border border-red-400/50 rounded px-2 py-1">
                <div className="text-xs text-red-300">적군</div>
                <div className="text-lg font-bold text-red-400">
                  {(battle.participants || []).filter(p => p.team === 'team2' && p.hp > 0).length}
                </div>
              </div>
            </div>

            {/* Center Action */}
            <div className="flex items-center">
              {battle.phase !== 'completed' && !isSimulating && !isCountingDown && (
                <button
                  onClick={startSimulation}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-sm"
                >
                  전투 시작
                </button>
              )}
              
              {isCountingDown && (
                <div className="text-2xl font-bold text-red-400 animate-pulse">
                  {countdown > 0 ? countdown : "START!"}
                </div>
              )}

              {isSimulating && (
                <div className="flex items-center space-x-2 bg-green-900/30 border border-green-400/50 rounded px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-bold text-sm">LIVE</span>
                  <span className="text-white font-mono text-sm">{currentTick}초</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Battlefield Area */}
        <div className="flex-1 flex flex-col">
          {/* Compact Allied Units */}
          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-b border-blue-400/30 p-2">
            <div className="flex space-x-2 overflow-x-auto">
              {(battle.participants || [])
                .filter(p => p.team === 'team1')
                .map(participant => {
                  const pilot = getPilotInfo(participant.pilotId);
                  return (
                    <div key={participant.pilotId} className="bg-blue-900/30 border border-blue-400/40 rounded p-2 min-w-20 flex-shrink-0">
                      <div className="text-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs mx-auto mb-1">
                          {pilot.initial}
                        </div>
                        <div className="text-blue-200 font-semibold text-xs truncate">{pilot.name}</div>
                        <div className="text-white font-bold text-xs">{participant.hp}%</div>
                        <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                          <div
                            className={`h-1 rounded-full ${
                              participant.hp > 70 ? 'bg-green-500' :
                              participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(participant.hp, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Mobile Battlefield Canvas */}
          <div className="flex-1 bg-gradient-to-br from-amber-900/20 via-orange-800/20 to-red-900/20 flex items-center justify-center p-2 relative">
            <CanvasRenderer
              ref={canvasRef}
              width={640}
              height={480}
              className="border border-gray-600/50 rounded-lg shadow-2xl w-full max-h-60 object-contain"
            />

            {/* Mobile Battle Info Overlay */}
            <div className="absolute top-2 right-2 bg-black/70 border border-gray-500 rounded p-2 text-xs">
              <div className="text-gray-300">경과: {currentTick}초</div>
              <div className={`font-bold ${
                battle.phase === 'active' ? 'text-green-400' :
                battle.phase === 'completed' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {battle.phase?.toUpperCase() || 'PREPARING'}
              </div>
            </div>

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-6xl font-bold text-red-400 animate-pulse">
                  {countdown > 0 ? countdown : "START!"}
                </div>
              </div>
            )}
          </div>

          {/* Compact Enemy Units */}
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border-t border-red-400/30 p-2">
            <div className="flex space-x-2 overflow-x-auto">
              {(battle.participants || [])
                .filter(p => p.team === 'team2')
                .map(participant => {
                  const pilot = getPilotInfo(participant.pilotId);
                  return (
                    <div key={participant.pilotId} className="bg-red-900/30 border border-red-400/40 rounded p-2 min-w-20 flex-shrink-0">
                      <div className="text-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs mx-auto mb-1">
                          {pilot.initial}
                        </div>
                        <div className="text-red-200 font-semibold text-xs truncate">{pilot.name}</div>
                        <div className="text-white font-bold text-xs">{participant.hp}%</div>
                        <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                          <div
                            className={`h-1 rounded-full ${
                              participant.hp > 70 ? 'bg-green-500' :
                              participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(participant.hp, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Mobile Battle Log */}
          <div className="bg-black/50 border-t border-gray-600/50 p-2 max-h-16 overflow-y-auto">
            <div className="text-xs space-y-1">
              {(battle.log || []).slice(-3).map((logEntry, index) => (
                <div key={index} className="flex items-start space-x-1">
                  <span className="font-mono text-gray-500 text-xs">
                    {new Date(logEntry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-gray-300 text-xs truncate">
                    {logEntry.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout (Unchanged) */}
      <div className="hidden lg:block h-full">
      {/* Top Status Bar - RTS Style */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-2 border-cyan-400/50 p-2">
        <div className="flex items-center justify-between">
          {/* Team 1 Score */}
          <div className="flex items-center space-x-2 md:space-x-4 bg-blue-900/30 border border-blue-400/50 rounded px-2 md:px-4 py-1 md:py-2">
            <div className="text-lg md:text-2xl font-bold text-blue-400">
              {(battle.participants || []).filter(p => p.team === 'team1' && p.hp > 0).length}
            </div>
            <div className="text-xs md:text-sm text-blue-300">아군</div>
          </div>

          {/* Center Battle Info */}
          <div className="flex items-center space-x-2 md:space-x-6">
            {battle.phase !== 'completed' && !isSimulating && !isCountingDown && (
              <button
                onClick={startSimulation}
                className="mobile-button md:px-6 md:py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg"
              >
                <span className="hidden sm:inline">전투 시작</span>
                <span className="sm:hidden">시작</span>
              </button>
            )}
            
            {isCountingDown && (
              <div className="flex items-center space-x-2 md:space-x-3 bg-red-900/30 border border-red-400/50 rounded px-2 md:px-4 py-1 md:py-2">
                <div className="text-xl md:text-3xl font-bold text-red-400 animate-pulse tabular-nums">
                  {countdown > 0 ? countdown : "START!"}
                </div>
              </div>
            )}

            {isSimulating && (
              <div className="flex items-center space-x-1 md:space-x-2 bg-green-900/30 border border-green-400/50 rounded px-2 md:px-4 py-1 md:py-2">
                <div className="w-2 md:w-3 h-2 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold text-xs md:text-sm">LIVE</span>
                <span className="text-white font-mono text-xs md:text-sm">{currentTick}초</span>
              </div>
            )}

            {/* Animation Test Button - Hidden on mobile */}
            {battle.participants && battle.participants.length >= 2 && (
              <button
                onClick={testAnimation}
                className="hidden md:block px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-bold transition-colors"
              >
                애니메이션 테스트
              </button>
            )}
          </div>

          {/* Team 2 Score */}
          <div className="flex items-center space-x-2 md:space-x-4 bg-red-900/30 border border-red-400/50 rounded px-2 md:px-4 py-1 md:py-2">
            <div className="text-xs md:text-sm text-red-300">적군</div>
            <div className="text-lg md:text-2xl font-bold text-red-400">
              {(battle.participants || []).filter(p => p.team === 'team2' && p.hp > 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden mobile-battle-layout">
        {/* Mobile Top Allied Panel */}
        <div className="lg:hidden bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-b-2 border-blue-400/30 mobile-unit-panel">
          <div className="bg-blue-900/50 border-b border-blue-400/30 p-1 mobile-status-bar">
            <h3 className="text-blue-300 font-bold text-center text-xs">아군 부대</h3>
          </div>
          <div className="p-1 overflow-x-auto">
            <div className="flex space-x-2">
              {(battle.participants || [])
                .filter(p => p.team === 'team1')
                .map(participant => {
                  const pilot = getPilotInfo(participant.pilotId);
                  return (
                    <div key={participant.pilotId} className="bg-blue-900/30 border border-blue-400/40 rounded p-1.5 min-w-24 flex-shrink-0">
                      <div className="flex items-center space-x-1 mb-1">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {pilot.initial}
                        </div>
                        <div className="text-blue-200 font-semibold text-xs truncate">{pilot.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-300">HP</span>
                          <span className="text-white font-bold">{participant.hp}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              participant.hp > 70 ? 'bg-green-500' :
                              participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(participant.hp, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Desktop Left Player Panel */}
        <div className="hidden lg:flex w-64 bg-gradient-to-b from-blue-900/20 to-blue-800/20 border-r-2 border-blue-400/30 flex-col">
          <div className="bg-blue-900/50 border-b border-blue-400/30 p-3">
            <h3 className="text-blue-300 font-bold text-center">아군 부대</h3>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            {(battle.participants || [])
              .filter(p => p.team === 'team1')
              .map(participant => {
                const pilot = getPilotInfo(participant.pilotId);
                return (
                  <div key={participant.pilotId} className="bg-blue-900/30 border border-blue-400/40 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {pilot.initial}
                      </div>
                      <div>
                        <div className="text-blue-200 font-semibold text-sm">{pilot.name}</div>
                        <div className="text-blue-300 text-xs">({participant.position.x}, {participant.position.y})</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-blue-300">HP</span>
                        <span className="text-white font-bold">{participant.hp}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            participant.hp > 70 ? 'bg-green-500' :
                            participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(participant.hp, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Center Battlefield */}
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 bg-gradient-to-br from-amber-900/20 via-orange-800/20 to-red-900/20 flex items-center justify-center p-2 lg:p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            <CanvasRenderer
              ref={canvasRef}
              width={640}
              height={480}
              className="battlefield-canvas border border-gray-600/50 rounded-lg shadow-2xl"

            />

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-8xl font-bold text-red-400 animate-pulse tabular-nums">
                  {countdown > 0 ? countdown : "START!"}
                </div>
              </div>
            )}

            {/* Battle Status HUD */}
            <div className="absolute top-4 left-4 bg-black/70 border border-gray-500 rounded-lg p-3 min-w-48">
              <div className="text-cyan-300 font-bold mb-2 text-sm">전투 상황</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">경과시간:</span>
                  <span className="text-white font-mono">{currentTick}초</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">페이즈:</span>
                  <span className={`font-bold ${
                    battle.phase === 'active' ? 'text-green-400' :
                    battle.phase === 'completed' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {battle.phase?.toUpperCase() || 'PREPARING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Battle Log */}
          <div className="h-20 lg:h-32 md:h-24 sm:h-16 bg-black/50 border-t-2 border-gray-600/50 p-1 lg:p-3 battle-log-mobile">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h4 className="text-gray-200 font-bold text-sm">전투 기록</h4>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                  <span className="text-green-300">엄폐물: 방어+20%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                  <span className="text-purple-300">고지대: 공격+20%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500"></div>
                  <span className="text-red-300">장애물: 차단</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-300">독성: -5HP</span>
                </div>
              </div>
            </div>
            <div
              ref={logContainerRef}
              className="h-12 lg:h-20 overflow-y-auto custom-scrollbar space-y-1"
            >
              {(battle.log || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-sm">전투 기록 대기 중...</div>
                </div>
              ) : (
                (battle.log || []).slice(-10).map((logEntry, index) => (
                  <div key={index} className="text-xs flex items-start space-x-2 p-1">
                    <span className="font-mono text-gray-500 flex-shrink-0">
                      {new Date(logEntry.timestamp).toLocaleTimeString()}
                    </span>
                    {logEntry.speaker && (
                      <span className="text-yellow-300 font-semibold flex-shrink-0">
                        [{logEntry.speaker}]
                      </span>
                    )}
                    <span
                      className={`${
                        logEntry.type === "system"
                          ? "text-cyan-300"
                          : logEntry.type === "attack"
                          ? "text-red-300"
                          : logEntry.type === "movement"
                          ? "text-blue-300"
                          : "text-gray-300"
                      }`}
                    >
                      {logEntry.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Desktop Right Enemy Panel */}
        <div className="hidden lg:flex w-64 bg-gradient-to-b from-red-900/20 to-red-800/20 border-l-2 border-red-400/30 flex-col">
          <div className="bg-red-900/50 border-b border-red-400/30 p-3">
            <h3 className="text-red-300 font-bold text-center">적군 부대</h3>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            {(battle.participants || [])
              .filter(p => p.team === 'team2')
              .map(participant => {
                const pilot = getPilotInfo(participant.pilotId);
                return (
                  <div key={participant.pilotId} className="bg-red-900/30 border border-red-400/40 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {pilot.initial}
                      </div>
                      <div>
                        <div className="text-red-200 font-semibold text-sm">{pilot.name}</div>
                        <div className="text-red-300 text-xs">({participant.position.x}, {participant.position.y})</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-red-300">HP</span>
                        <span className="text-white font-bold">{participant.hp}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            participant.hp > 70 ? 'bg-green-500' :
                            participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(participant.hp, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Enemy Panel */}
      <div className="lg:hidden bg-gradient-to-r from-red-900/20 to-red-800/20 border-t-2 border-red-400/30 mobile-unit-panel">
        <div className="bg-red-900/50 border-b border-red-400/30 p-1 mobile-status-bar">
          <h3 className="text-red-300 font-bold text-center text-xs">적군 부대</h3>
        </div>
        <div className="p-1 overflow-x-auto">
          <div className="flex space-x-2">
            {(battle.participants || [])
              .filter(p => p.team === 'team2')
              .map(participant => {
                const pilot = getPilotInfo(participant.pilotId);
                return (
                  <div key={participant.pilotId} className="bg-red-900/30 border border-red-400/40 rounded p-1.5 min-w-24 flex-shrink-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {pilot.initial}
                      </div>
                      <div className="text-red-200 font-semibold text-xs truncate">{pilot.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-red-300">HP</span>
                        <span className="text-white font-bold">{participant.hp}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            participant.hp > 70 ? 'bg-green-500' :
                            participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(participant.hp, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}