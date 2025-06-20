import { useState, useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { wsManager } from '@/lib/websocket';

interface BattleParticipant {
  pilotId: number;
  mechId: number;
  position: { x: number; y: number };
  hp: number;
  status: 'active' | 'damaged' | 'destroyed';
  lastActionTime?: number;
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

interface PilotInfo {
  id: number;
  name: string;
  callsign: string;
  team: 'ally' | 'enemy';
  initial: string;
}

interface AttackEffect {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  startTime: number;
  type: 'laser' | 'missile' | 'beam';
}

interface TerrainFeature {
  x: number;
  y: number;
  type: 'cover' | 'obstacle' | 'elevation' | 'hazard';
  effect: string;
}

export function BattleSimulation({ battle }: BattleSimulationProps): JSX.Element {
  const [currentTick, setCurrentTick] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [animatingUnits, setAnimatingUnits] = useState<Set<number>>(new Set());
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [terrainFeatures] = useState<TerrainFeature[]>([
    { x: 4, y: 3, type: 'cover', effect: '방어력 +20%' },
    { x: 8, y: 5, type: 'elevation', effect: '사거리 +1' },
    { x: 12, y: 7, type: 'obstacle', effect: '이동 제한' },
    { x: 6, y: 9, type: 'hazard', effect: '턴당 HP -5' },
    { x: 10, y: 2, type: 'cover', effect: '방어력 +20%' },
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const { addBattleLog, setBattle } = useBattleStore();

  // 3초 카운트다운
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

  const pilots: PilotInfo[] = [
    { id: 1, name: "Sasha", callsign: "볼코프", team: "ally", initial: "S" },
    { id: 2, name: "Mente", callsign: "스톰", team: "ally", initial: "M" },
    { id: 3, name: "Azuma", callsign: "레이븐", team: "ally", initial: "A" },
    { id: 4, name: "Luna", callsign: "문영", team: "ally", initial: "L" },
    { id: 7, name: "Jin", callsign: "진", team: "ally", initial: "J" },
    { id: 101, name: "Enemy Alpha", callsign: "타겟-α", team: "enemy", initial: "E" },
    { id: 102, name: "Enemy Beta", callsign: "타겟-β", team: "enemy", initial: "B" },
    { id: 103, name: "Enemy Gamma", callsign: "타겟-γ", team: "enemy", initial: "G" }
  ];

  const getPilotInfo = (pilotId: number): PilotInfo => {
    return pilots.find(p => p.id === pilotId) || {
      id: pilotId,
      name: `Unknown-${pilotId}`,
      callsign: `Unit-${pilotId}`,
      team: pilotId >= 100 ? 'enemy' : 'ally',
      initial: 'U'
    };
  };

  // WebSocket 메시지 처리
  useEffect(() => {
    const handleWebSocketMessage = (data: any) => {
      if (data.type === 'BATTLE_UPDATE') {
        // 서버에서 받은 상태로 업데이트 (UI만 처리)
        setBattle(data.state);
        
        // 시각 효과 처리
        if (data.effects) {
          data.effects.forEach((effect: any) => {
            if (effect.type === 'animation' && effect.effectType === 'attack') {
              setAnimatingUnits(new Set([effect.participantId]));
              setTimeout(() => setAnimatingUnits(new Set()), 1500);
              
              // 공격 시각 효과
              const attacker = data.state.participants.find((p: any) => p.pilotId === effect.participantId);
              if (attacker) {
                const attackEffect: AttackEffect = {
                  id: `${Date.now()}-${Math.random()}`,
                  from: attacker.position,
                  to: { x: attacker.position.x + 2, y: attacker.position.y },
                  startTime: Date.now(),
                  type: 'laser'
                };
                setAttackEffects(prev => [...prev, attackEffect]);
              }
            } else if (effect.type === 'move') {
              setAnimatingUnits(new Set([effect.participantId]));
              setTimeout(() => setAnimatingUnits(new Set()), 1000);
            }
          });
        }
        
        // 게임 종료 처리
        if (data.gameOver) {
          setIsSimulating(false);
          addBattleLog({
            type: 'system',
            message: `🎉 전투 종료! ${data.gameOver.winner === 'team1' ? '아군' : '적군'} 승리!`,
            timestamp: Date.now()
          });
        }
      }
    };

    wsManager.on('message', handleWebSocketMessage);
    return () => wsManager.off('message', handleWebSocketMessage);
  }, [setBattle, addBattleLog]);

  // 서버에 틱 업데이트 요청 (UI만 처리)
  useEffect(() => {
    if (!isSimulating || battle.phase !== 'active') return;

    const tickInterval = setInterval(() => {
      if (wsManager.isConnected()) {
        wsManager.send({
          type: 'TICK_UPDATE',
          battleId: battle.id
        });
      }
      setCurrentTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [battle, isSimulating]);

  // Canvas 렌더링 (UI만)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 격자 그리기
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 지형 특징 렌더링
      terrainFeatures.forEach(terrain => {
        const x = terrain.x * 32 + 16;
        const y = terrain.y * 32 + 16;
        
        ctx.fillStyle = terrain.type === 'cover' ? '#10b981' :
                       terrain.type === 'elevation' ? '#f59e0b' :
                       terrain.type === 'obstacle' ? '#6b7280' : '#ef4444';
        
        if (terrain.type === 'obstacle') {
          ctx.fillRect(x - 12, y - 12, 24, 24);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // 유닛 렌더링
      (battle.participants || []).forEach(participant => {
        const pilotInfo = getPilotInfo(participant.pilotId);
        const x = participant.position.x * 32 + 16;
        const y = participant.position.y * 32 + 16;
        const isAnimating = animatingUnits.has(participant.pilotId);
        
        // 상태별 색상
        const color = participant.status === 'destroyed' ? '#6b7280' :
                     participant.status === 'damaged' ? '#f59e0b' :
                     pilotInfo.team === 'ally' ? '#3b82f6' : '#ef4444';
        
        // 애니메이션 효과
        const scale = isAnimating ? 1.2 : 1;
        const radius = 12 * scale;
        
        // 유닛 원형
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // HP 바
        const hpBarWidth = 20;
        const hpBarHeight = 3;
        const hpPercent = participant.hp / 100;
        
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x - hpBarWidth/2, y - radius - 8, hpBarWidth, hpBarHeight);
        
        ctx.fillStyle = participant.hp > 60 ? '#10b981' : participant.hp > 30 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(x - hpBarWidth/2, y - radius - 8, hpBarWidth * hpPercent, hpBarHeight);
        
        // 파일럿 이니셜
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pilotInfo.initial, x, y + 4);
      });

      // 공격 효과 렌더링
      const currentTime = Date.now();
      setAttackEffects(prev => prev.filter(effect => {
        const elapsed = currentTime - effect.startTime;
        if (elapsed > 1000) return false;
        
        const progress = elapsed / 1000;
        const fromX = effect.from.x * 32 + 16;
        const fromY = effect.from.y * 32 + 16;
        const toX = effect.to.x * 32 + 16;
        const toY = effect.to.y * 32 + 16;
        
        const currentX = fromX + (toX - fromX) * progress;
        const currentY = fromY + (toY - fromY) * progress;
        
        ctx.strokeStyle = effect.type === 'laser' ? '#00ff00' :
                         effect.type === 'missile' ? '#ff6600' : '#ff00ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        return true;
      }));

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battle, animatingUnits, attackEffects, terrainFeatures]);

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
    <div className="cyber-border bg-slate-800">
      {/* 상단 상태 표시 */}
      <div className="cyber-border-bottom p-4 bg-slate-900">
        <div className="flex justify-between items-center">
          <div className="text-cyan-400 font-bold text-lg">
            TRINITY ACADEMY BATTLE SYSTEM
          </div>
          <div className="text-sm">
            Turn: {battle.turn} | Phase: {battle.phase}
          </div>
        </div>
        
        {!isSimulating && battle.phase === 'preparation' && (
          <div className="text-center mt-4">
            <button
              onClick={startSimulation}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded font-semibold"
            >
              전투 시작
            </button>
          </div>
        )}
        
        {isCountingDown && (
          <div className="text-center mt-4">
            <div className="text-4xl font-bold text-cyan-400 animate-pulse">
              {countdown > 0 ? countdown : "START!"}
            </div>
            <div className="text-sm text-gray-300">
              전투 시작까지...
            </div>
          </div>
        )}
        
        {isSimulating && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">실시간 전투 진행 중... ({currentTick}초)</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="bg-gray-900 rounded border border-gray-600 p-4 mb-6">
          <h4 className="text-md font-semibold text-gray-300 mb-3">전장 맵 (2D 탑뷰)</h4>
          <div className="flex justify-center relative">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="border border-gray-600 bg-gray-800 rounded"
            />
            
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded">
                <div className="text-center">
                  <div className="text-8xl font-bold text-cyan-400 animate-pulse mb-4">
                    {countdown > 0 ? countdown : "START!"}
                  </div>
                  <div className="text-xl text-white">
                    전투 시작 준비 중...
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
            <div>
              <h5 className="font-semibold text-gray-300 mb-2">유닛</h5>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-300">아군 (파란색)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-red-300">적군 (빨간색)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-300 mb-2">지형</h5>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-300">엄폐물</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-300">고지대</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500"></div>
                  <span className="text-gray-300">장애물</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-red-300">위험지대</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 전투 로그 */}
        <div className="bg-gray-900 rounded border border-gray-600 p-4 h-48 overflow-y-auto">
          <h4 className="text-md font-semibold text-gray-300 mb-3">전투 로그</h4>
          {(battle.log || []).slice(-10).map((logEntry, index) => (
            <div key={index} className="mb-2">
              <div className={`text-xs ${
                logEntry.type === 'system' ? 'text-cyan-300' :
                logEntry.type === 'attack' ? 'text-red-300' :
                logEntry.type === 'movement' ? 'text-blue-300' :
                'text-gray-300'
              }`}>
                <span className="text-gray-500 mr-2">
                  {new Date(logEntry.timestamp).toLocaleTimeString()}
                </span>
                {logEntry.speaker && (
                  <span className="font-semibold text-yellow-300">[{logEntry.speaker}]</span>
                )}
                {logEntry.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}