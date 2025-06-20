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

  // Stop simulation locally when battle ends to prevent further unit actions.
  useEffect(() => {
    if (battle.phase === "completed") {
      setIsSimulating(false);
    }
  }, [battle.phase]);

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
    <div className="cyber-border bg-slate-800 h-full">
      {/* Header */}
      <div className="border-b border-cyan-400/20 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-cyan-400">전장 시뮬레이션</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              페이즈: <span className="text-cyan-400 font-semibold">{battle.phase}</span>
            </div>
            {isSimulating && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Control Panel */}
        {battle.phase !== 'completed' && !isSimulating && !isCountingDown && (
          <div className="mt-3">
            <button
              onClick={startSimulation}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
            >
              전투 시작
            </button>
          </div>
        )}
        
        {isCountingDown && (
          <div className="mt-3 flex items-center space-x-3">
            <div className="text-3xl font-bold text-red-400 animate-pulse">
              {countdown > 0 ? countdown : "START!"}
            </div>
            <div className="text-sm text-gray-300">전투 시작까지...</div>
          </div>
        )}
      </div>

      {/* Main Battle View */}
      <div className="flex h-[calc(100%-80px)]">
        {/* Battlefield */}
        <div className="flex-1 p-4">
          <div className="relative h-full bg-gray-900 rounded-lg border border-gray-600">
            <CanvasRenderer
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full rounded-lg"
            />

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                <div className="text-center">
                  <div className="text-8xl font-bold text-cyan-400 animate-pulse mb-4">
                    {countdown > 0 ? countdown : "START!"}
                  </div>
                  <div className="text-xl text-white">전투 시작 준비 중...</div>
                </div>
              </div>
            )}

            {/* Battle Stats Overlay */}
            <div className="absolute top-4 left-4 bg-black/80 rounded p-3 space-y-1">
              <div className="text-sm text-cyan-400 font-semibold">전투 상황</div>
              <div className="text-xs text-gray-300">턴: {battle.turn || 0}</div>
              <div className="text-xs text-gray-300">시간: {currentTick}초</div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-800 rounded p-3">
              <h5 className="text-sm font-semibold text-gray-300 mb-2">유닛</h5>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-blue-300">아군</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-300">적군</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <h5 className="text-sm font-semibold text-gray-300 mb-2">지형</h5>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-xs text-green-300">엄폐물</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                  <span className="text-xs text-yellow-300">위험지대</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-gray-600 flex flex-col">
          {/* Combat Log */}
          <div className="flex-1 p-4">
            <h5 className="text-sm font-semibold text-gray-300 mb-3">전투 기록</h5>
            <div
              ref={logContainerRef}
              className="bg-gray-900 rounded h-full overflow-y-auto p-2 space-y-1"
            >
              {(battle.log || []).map((logEntry, index) => (
                <div key={index} className="text-xs p-2 rounded bg-gray-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-gray-500">
                      {new Date(logEntry.timestamp).toLocaleTimeString()}
                    </span>
                    {logEntry.speaker && (
                      <span className="font-semibold text-yellow-300 text-xs">
                        {logEntry.speaker}
                      </span>
                    )}
                  </div>
                  <div
                    className={
                      logEntry.type === "system"
                        ? "text-cyan-400"
                        : logEntry.type === "attack"
                        ? "text-red-300"
                        : logEntry.type === "movement"
                        ? "text-blue-300"
                        : "text-gray-300"
                    }
                  >
                    {logEntry.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unit Status */}
          <div className="border-t border-gray-600 p-4 max-h-60 overflow-y-auto">
            <h5 className="text-sm font-semibold text-gray-300 mb-3">유닛 상태</h5>
            <div className="space-y-2">
              {(battle.participants || []).map(participant => {
                const pilot = getPilotInfo(participant.pilotId);
                const isAlly = participant.team === 'team1';
                return (
                  <div
                    key={participant.pilotId}
                    className={`p-2 rounded text-xs border ${
                      isAlly 
                        ? 'bg-blue-900/20 border-blue-400/30' 
                        : 'bg-red-900/20 border-red-400/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`font-semibold ${isAlly ? 'text-blue-200' : 'text-red-200'}`}>
                        {pilot.initial} - {pilot.name}
                      </div>
                      <div className="text-gray-400">
                        ({participant.position.x}, {participant.position.y})
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700 rounded h-1">
                        <div
                          className={`h-1 rounded transition-all ${
                            participant.hp > 70 ? 'bg-green-500' :
                            participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${participant.hp}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-300 text-xs">{participant.hp}%</span>
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