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
    <div className="cyber-border bg-gradient-to-br from-slate-800 to-slate-900 h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-cyan-400/30 bg-slate-800/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold text-cyan-400">전장 시뮬레이션</h3>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-slate-700/50 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-sm text-gray-300">페이즈:</span>
              <span className="text-cyan-400 font-semibold capitalize">{battle.phase}</span>
            </div>
            {isSimulating && (
              <div className="flex items-center space-x-2 bg-green-900/30 border border-green-400/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Control Panel */}
        {battle.phase !== 'completed' && !isSimulating && !isCountingDown && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={startSimulation}
              className="group px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full group-hover:animate-ping"></div>
                <span>전투 시작</span>
              </div>
            </button>
          </div>
        )}
        
        {isCountingDown && (
          <div className="mt-4 flex justify-center">
            <div className="bg-black/50 rounded-lg p-6 border border-red-400/30">
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-red-400 animate-pulse tabular-nums">
                  {countdown > 0 ? countdown : "START!"}
                </div>
                <div className="text-gray-300">
                  <div className="text-sm">전투 시작까지</div>
                  <div className="w-16 h-1 bg-gray-600 rounded-full mt-1">
                    <div 
                      className="h-1 bg-red-400 rounded-full transition-all duration-1000"
                      style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Battle View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Battlefield */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="relative flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-600 shadow-2xl overflow-hidden">
            {/* Battlefield Canvas */}
            <CanvasRenderer
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full rounded-xl"
            />

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
                <div className="text-center bg-gray-900/80 rounded-2xl p-8 border border-cyan-400/30">
                  <div className="text-9xl font-bold text-cyan-400 animate-pulse mb-4 tabular-nums">
                    {countdown > 0 ? countdown : "START!"}
                  </div>
                  <div className="text-2xl text-white font-medium">전투 시작 준비 중...</div>
                  <div className="mt-4 flex justify-center">
                    <div className="w-32 h-1 bg-gray-600 rounded-full">
                      <div 
                        className="h-1 bg-cyan-400 rounded-full transition-all duration-1000"
                        style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Battle Stats Overlay */}
            <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 border border-cyan-400/30">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="text-sm text-cyan-400 font-semibold">전투 상황</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">턴:</span>
                  <span className="text-xs text-white font-mono">{battle.turn || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">시간:</span>
                  <span className="text-xs text-white font-mono">{currentTick}초</span>
                </div>
              </div>
            </div>

            {/* Battle Phase Indicator */}
            <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Phase</div>
              <div className={`text-sm font-bold ${
                battle.phase === 'active' ? 'text-green-400' :
                battle.phase === 'completed' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {battle.phase?.toUpperCase() || 'PREPARING'}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600">
              <h5 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                유닛 구분
              </h5>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30"></div>
                  <span className="text-sm text-blue-300 font-medium">아군</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/30"></div>
                  <span className="text-sm text-red-300 font-medium">적군</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600">
              <h5 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                지형 효과
              </h5>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-600 rounded shadow-lg shadow-green-600/30"></div>
                  <span className="text-sm text-green-300 font-medium">엄폐물</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-600 rounded shadow-lg shadow-yellow-600/30"></div>
                  <span className="text-sm text-yellow-300 font-medium">위험지대</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 border-l border-gray-600/50 bg-gradient-to-b from-gray-800/30 to-gray-900/30 backdrop-blur-sm flex flex-col">
          {/* Combat Log */}
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h5 className="text-sm font-semibold text-gray-200">실시간 전투 기록</h5>
            </div>
            <div
              ref={logContainerRef}
              className="bg-black/40 backdrop-blur-sm rounded-xl flex-1 overflow-y-auto p-3 space-y-2 border border-gray-700/50 custom-scrollbar"
            >
              {(battle.log || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-sm">전투 기록 대기 중...</div>
                  </div>
                </div>
              ) : (
                (battle.log || []).map((logEntry, index) => (
                  <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-gray-400">
                        {new Date(logEntry.timestamp).toLocaleTimeString()}
                      </span>
                      {logEntry.speaker && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-900/30 border border-yellow-400/30 rounded-full text-yellow-300 font-medium">
                          {logEntry.speaker}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-sm leading-relaxed ${
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unit Status */}
          <div className="border-t border-gray-600/50 p-5 flex-shrink-0">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <h5 className="text-sm font-semibold text-gray-200">유닛 상태</h5>
            </div>
            <div className="h-64 overflow-y-auto space-y-3 custom-scrollbar">
              {(battle.participants || []).map(participant => {
                const pilot = getPilotInfo(participant.pilotId);
                const isAlly = participant.team === 'team1';
                return (
                  <div
                    key={participant.pilotId}
                    className={`p-3 rounded-lg border backdrop-blur-sm transition-all hover:scale-[1.02] ${
                      isAlly 
                        ? 'bg-blue-900/20 border-blue-400/30 hover:border-blue-400/50' 
                        : 'bg-red-900/20 border-red-400/30 hover:border-red-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isAlly ? 'bg-blue-400' : 'bg-red-400'}`}></div>
                        <div className={`font-semibold text-sm ${isAlly ? 'text-blue-200' : 'text-red-200'}`}>
                          {pilot.initial} - {pilot.name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                        ({participant.position.x}, {participant.position.y})
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">체력</span>
                          <span className={`font-bold ${
                            participant.hp > 70 ? 'text-green-400' :
                            participant.hp > 30 ? 'text-yellow-400' : 'text-red-400'
                          }`}>{participant.hp}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              participant.hp > 70 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                              participant.hp > 30 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                            }`}
                            style={{ width: `${participant.hp}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full border ${
                        participant.status === 'active' ? 'bg-green-900/30 border-green-400/30 text-green-300' :
                        participant.status === 'damaged' ? 'bg-yellow-900/30 border-yellow-400/30 text-yellow-300' :
                        'bg-red-900/30 border-red-400/30 text-red-300'
                      }`}>
                        {participant.status}
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