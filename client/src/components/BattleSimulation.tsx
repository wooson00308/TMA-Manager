import React, { useState, useEffect, useRef } from "react";
import type { AttackEffect, BattleEvent } from "@shared/domain/types";
import { useBattleStore } from "@/stores/battleStore";
import { useGameStore } from "@/stores/gameStore";
import CanvasRenderer from "@/presentation/CanvasRenderer";
import { useGameLoopWorker } from "@/hooks/useGameLoopWorker";
import { useBattleRender } from "@/hooks/useBattleRender";
import { useAnimationQueue } from "@/hooks/useAnimationQueue";
import { type PilotInfo } from "@shared/domain/types";
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";

// getPilotInfoWithBattle helper function
function getPilotInfoWithBattle(pilotId: number, participants: any[] | undefined): PilotInfo {
  const { pilots, enemyPilots } = useGameStore.getState();
  const participant = participants?.find(p => p.pilotId === pilotId);
  const team = participant?.team === 'team2' ? 'enemy' : 'ally';
  
  // Find pilot in both arrays
  const pilot = [...pilots, ...enemyPilots].find(p => p.id === pilotId);
  
  if (pilot) {
    return {
      id: pilot.id,
      name: pilot.name,
      callsign: pilot.callsign,
      team,
      initial: pilot.name.charAt(0).toUpperCase()
    };
  }
  
  // Fallback if pilot not found
  return {
    id: pilotId,
    name: `Unknown Pilot ${pilotId}`,
    callsign: `PILOT-${pilotId}`,
    team,
    initial: "U"
  };
}

export function BattleSimulation(): JSX.Element {
  const [currentTick, setCurrentTick] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [lastEventIndex, setLastEventIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { currentBattle, addBattleLog, eventBuffer } = useBattleStore();
  const terrainFeatures = useGameStore(state => state.terrainFeatures);

  // Use the animation queue system
  const {
    attackEffects,
    animatingUnits,
    addAnimation,
    createAnimationFromEvent,
    clearQueue,
    updateParticipants
  } = useAnimationQueue({
    maxConcurrent: 3,
    defaultDuration: 1500
  });

  // Update participants in animation queue when battle changes
  useEffect(() => {
    if (currentBattle?.participants) {
      updateParticipants(currentBattle.participants);
    }
  }, [currentBattle?.participants, updateParticipants]);

  // 3초 카운트다운 및 자동 시작 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isCountingDown) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(prev => prev - 1);
        }, 1000);
      } else {
        // 카운트다운 종료
        setIsCountingDown(false);
        setIsSimulating(true);
        
        // 시작 메시지 추가
        addBattleLog({
          timestamp: Date.now(),
          type: 'system',
          message: '전투 시작!'
        });
      }
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [countdown, isCountingDown, addBattleLog]);

  // Canvas 애니메이션 렌더링 -> migrated to useBattleRender hook
  useBattleRender({
    canvasRef,
    battle: currentBattle,
    animatingUnits,
    attackEffects,
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

  // Process battle events from eventBuffer using animation queue
  useEffect(() => {
    const newEvents = eventBuffer.slice(lastEventIndex);
    if (newEvents.length === 0) return;
    
    setLastEventIndex(eventBuffer.length);
    
    newEvents.forEach((event) => {
      console.log('Processing event:', event);
      
      // Create animation item from event
      const animationItem = createAnimationFromEvent(event, currentBattle?.participants);
      
      if (animationItem) {
        // For attack events, we need to update the positions in the attack effect
        if (event.type === "UNIT_ATTACK" && currentBattle?.participants) {
          const { attackerId, targetId } = event.data;
          const attacker = currentBattle.participants.find(p => p.pilotId === attackerId);
          const target = currentBattle.participants.find(p => p.pilotId === targetId);
          
          if (attacker && target) {
            // We'll need to pass positions through the animation system
            // For now, the positions are handled in the queue processor
          }
        }
        
        // Add animation to queue
        addAnimation(animationItem);
      }
    });
  }, [eventBuffer, lastEventIndex, currentBattle?.participants, createAnimationFromEvent, addAnimation]);

  // Clear animation queue when battle ends
  useEffect(() => {
    if (currentBattle?.phase === "completed") {
      clearQueue();
    }
  }, [currentBattle?.phase, clearQueue]);

  // Auto-scroll combat log to the bottom whenever a new entry is added.
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [currentBattle?.log]);

  const startSimulation = () => {
    setCurrentTick(0);
    setIsSimulating(true);
  };

  // Test animation function
  const testAnimation = () => {
    if (!currentBattle?.participants || currentBattle.participants.length < 2) return;
    
    const attacker = currentBattle.participants[0];
    const target = currentBattle.participants[currentBattle.participants.length - 1];
    
    console.log('Test animation - Attacker:', attacker.pilotId, 'Target:', target.pilotId);
    
    // Create a test attack event
    const testEvent: BattleEvent = {
      type: "UNIT_ATTACK",
      timestamp: Date.now(),
      data: {
        attackerId: attacker.pilotId,
        attackerName: getPilotInfoWithBattle(attacker.pilotId, currentBattle.participants).name,
        targetId: target.pilotId,
        targetName: getPilotInfoWithBattle(target.pilotId, currentBattle.participants).name,
        damage: 10,
        weaponType: "missile",
        hitResult: "hit"
      }
    };
    
    // Create animation item from event
    const animationItem = createAnimationFromEvent(testEvent, currentBattle.participants);
    
    if (animationItem) {
      addAnimation(animationItem);
    }
  };

  if (!currentBattle) {
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
      {/* Top Status Bar - RTS Style */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-2 border-cyan-400/50 p-2">
        <div className="flex items-center justify-between">
          {/* Team 1 Score */}
          <div className="flex items-center space-x-4 bg-blue-900/30 border border-blue-400/50 rounded px-4 py-2">
            <div className="text-2xl font-bold text-blue-400">
              {(currentBattle.participants || []).filter(p => p.team === 'team1' && p.hp > 0).length}
            </div>
            <div className="text-sm text-blue-300">아군</div>
          </div>

          {/* Center Battle Info */}
          <div className="flex items-center space-x-6">
            {currentBattle.phase !== 'completed' && !isSimulating && !isCountingDown && (
              <button
                onClick={startSimulation}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg"
              >
                전투 시작
              </button>
            )}
            
            {isCountingDown && (
              <div className="flex items-center space-x-3 bg-red-900/30 border border-red-400/50 rounded px-4 py-2">
                <div className="text-3xl font-bold text-red-400 animate-pulse tabular-nums">
                  {countdown > 0 ? countdown : "START!"}
                </div>
              </div>
            )}

            {isSimulating && (
              <div className="flex items-center space-x-2 bg-green-900/30 border border-green-400/50 rounded px-4 py-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold">LIVE</span>
                <span className="text-white font-mono">{currentTick}초</span>
              </div>
            )}

            {/* Animation Test Button */}
            {currentBattle.participants && currentBattle.participants.length >= 2 && (
              <button
                onClick={testAnimation}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-bold transition-colors"
              >
                애니메이션 테스트
              </button>
            )}
          </div>

          {/* Team 2 Score */}
          <div className="flex items-center space-x-4 bg-red-900/30 border border-red-400/50 rounded px-4 py-2">
            <div className="text-sm text-red-300">적군</div>
            <div className="text-2xl font-bold text-red-400">
              {(currentBattle.participants || []).filter(p => p.team === 'team2' && p.hp > 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Player Panel */}
        <div className="w-64 bg-gradient-to-b from-blue-900/20 to-blue-800/20 border-r-2 border-blue-400/30 flex flex-col">
          <div className="bg-blue-900/50 border-b border-blue-400/30 p-3">
            <h3 className="text-blue-300 font-bold text-center">아군 부대</h3>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            {(currentBattle.participants || [])
              .filter(p => p.team === 'team1')
              .map(participant => {
                const pilot = getPilotInfoWithBattle(participant.pilotId, currentBattle.participants);
                const isDestroyed = participant.status === 'destroyed';
                return (
                  <div key={participant.pilotId} className={`bg-blue-900/30 border border-blue-400/40 rounded-lg p-3 transition-opacity ${isDestroyed ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isDestroyed ? 'bg-gray-600' : 'bg-blue-500'}`}>
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
                            isDestroyed ? 'bg-gray-500' :
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
          <div className="relative flex-1 bg-gradient-to-br from-amber-900/20 via-orange-800/20 to-red-900/20 flex items-center justify-center">
            <CanvasRenderer
              ref={canvasRef}
              width={640}
              height={480}
              className="border border-gray-600/50 rounded-lg shadow-2xl"
            />

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="text-center bg-gray-900/90 rounded-2xl p-12 border-2 border-cyan-400/50">
                  <div className="text-9xl font-bold text-cyan-400 animate-pulse mb-6 tabular-nums">
                    {countdown > 0 ? countdown : "START!"}
                  </div>
                  <div className="text-2xl text-white font-bold">전투 시작 준비 중...</div>
                  <div className="mt-6 flex justify-center">
                    <div className="w-48 h-2 bg-gray-600 rounded-full">
                      <div 
                        className="h-2 bg-cyan-400 rounded-full transition-all duration-1000"
                        style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Battle Stats HUD - positioned relative to canvas */}
            <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-cyan-400/50 z-10">
              <div className="text-cyan-400 font-bold mb-2">전투 상황</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">경과시간:</span>
                  <span className="text-white font-mono">{currentTick}초</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">페이즈:</span>
                  <span className={`font-bold ${
                    currentBattle.phase === 'active' ? 'text-green-400' :
                    currentBattle.phase === 'completed' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {currentBattle.phase?.toUpperCase() || 'PREPARING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Battle Log */}
          <div className="h-32 bg-black/50 border-t-2 border-gray-600/50 p-3">
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
              className="h-20 overflow-y-auto custom-scrollbar space-y-1"
            >
              {(currentBattle.log || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-sm">전투 기록 대기 중...</div>
                </div>
              ) : (
                (currentBattle.log || []).slice(-10).map((logEntry, index) => (
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

        {/* Right Enemy Panel */}
        <div className="w-64 bg-gradient-to-b from-red-900/20 to-red-800/20 border-l-2 border-red-400/30 flex flex-col">
          <div className="bg-red-900/50 border-b border-red-400/30 p-3">
            <h3 className="text-red-300 font-bold text-center">적군 부대</h3>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            {(currentBattle.participants || [])
              .filter(p => p.team === 'team2')
              .map(participant => {
                const pilot = getPilotInfoWithBattle(participant.pilotId, currentBattle.participants);
                const isDestroyed = participant.status === 'destroyed';
                return (
                  <div key={participant.pilotId} className={`bg-red-900/30 border border-red-400/40 rounded-lg p-3 transition-opacity ${isDestroyed ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isDestroyed ? 'bg-gray-600' : 'bg-red-500'}`}>
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
                            isDestroyed ? 'bg-gray-500' :
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
  );
}