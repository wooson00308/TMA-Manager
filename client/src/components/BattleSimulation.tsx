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
    <div className="h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Top Status Bar - RTS Style */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-2 border-cyan-400/50 p-2">
        <div className="flex items-center justify-between">
          {/* Team 1 Score */}
          <div className="flex items-center space-x-4 bg-blue-900/30 border border-blue-400/50 rounded px-4 py-2">
            <div className="text-2xl font-bold text-blue-400">
              {(battle.participants || []).filter(p => p.team === 'team1' && p.hp > 0).length}
            </div>
            <div className="text-sm text-blue-300">아군</div>
          </div>

          {/* Center Battle Info */}
          <div className="flex items-center space-x-6">
            {battle.phase !== 'completed' && !isSimulating && !isCountingDown && (
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
                <span className="text-white font-mono">{currentTick}s</span>
              </div>
            )}
          </div>

          {/* Team 2 Score */}
          <div className="flex items-center space-x-4 bg-red-900/30 border border-red-400/50 rounded px-4 py-2">
            <div className="text-sm text-red-300">적군</div>
            <div className="text-2xl font-bold text-red-400">
              {(battle.participants || []).filter(p => p.team === 'team2' && p.hp > 0).length}
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
                          style={{ width: `${participant.hp}%` }}
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
          <div className="relative flex-1 bg-gradient-to-br from-amber-900/20 via-orange-800/20 to-red-900/20">
            <CanvasRenderer
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full"
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

            {/* Battle Stats HUD */}
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-cyan-400/50">
              <div className="text-cyan-400 font-bold mb-2">전투 상황</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">턴:</span>
                  <span className="text-white font-mono">{battle.turn || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">시간:</span>
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
          <div className="h-32 bg-black/50 border-t-2 border-gray-600/50 p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h4 className="text-gray-200 font-bold text-sm">전투 기록</h4>
            </div>
            <div
              ref={logContainerRef}
              className="h-20 overflow-y-auto custom-scrollbar space-y-1"
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

        {/* Right Enemy Panel */}
        <div className="w-64 bg-gradient-to-b from-red-900/20 to-red-800/20 border-l-2 border-red-400/30 flex flex-col">
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
                          style={{ width: `${participant.hp}%` }}
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