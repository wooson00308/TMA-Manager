import { useState, useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { useQuery } from '@tanstack/react-query';
import { type Pilot, type Mech } from '@shared/schema';

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
  type: 'cover' | 'elevation' | 'obstacle' | 'hazard';
  effect: string;
}

export default function BattleSimulation({ battle }: BattleSimulationProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [currentTick, setCurrentTick] = useState(0);
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

  // 실제 파일럿 데이터 조회
  const { data: allPilots = [] } = useQuery<Pilot[]>({
    queryKey: ['/api/pilots/active'],
    enabled: true
  });

  // 실제 메크 데이터 조회
  const { data: allMechs = [] } = useQuery<Mech[]>({
    queryKey: ['/api/mechs/available'],
    enabled: true
  });

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

  const getPilotInfo = (pilotId: number): PilotInfo => {
    // 실제 파일럿 데이터에서 찾기
    const pilot = allPilots.find(p => p.id === pilotId);
    
    if (pilot) {
      const isEnemy = pilotId >= 100;
      return {
        id: pilot.id,
        name: pilot.name,
        callsign: pilot.callsign,
        team: isEnemy ? 'enemy' : 'ally',
        initial: pilot.name.charAt(0).toUpperCase()
      };
    }
    
    // 데이터가 없을 경우 기본값
    const isEnemy = pilotId >= 100;
    return {
      id: pilotId,
      name: isEnemy ? `Enemy ${pilotId}` : `Pilot ${pilotId}`,
      callsign: isEnemy ? `E${pilotId}` : `P${pilotId}`,
      team: isEnemy ? 'enemy' : 'ally',
      initial: isEnemy ? 'E' : String.fromCharCode(65 + (pilotId % 26))
    };
  };

  const getMechInfo = (mechId: number) => {
    return allMechs.find(m => m.id === mechId);
  };

  const getHPPercentage = (participant: BattleParticipant) => {
    const mechInfo = getMechInfo(participant.mechId);
    const maxHP = mechInfo?.hp || 100;
    return (participant.hp / maxHP) * 100;
  };

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawBattleField = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 격자 배경
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 16; x++) {
        ctx.beginPath();
        ctx.moveTo(x * 40, 0);
        ctx.lineTo(x * 40, 480);
        ctx.stroke();
      }
      for (let y = 0; y <= 12; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * 40);
        ctx.lineTo(640, y * 40);
        ctx.stroke();
      }
      
      // 지형 특징 렌더링
      terrainFeatures.forEach(feature => {
        const x = feature.x * 40 + 20;
        const y = feature.y * 40 + 20;
        
        ctx.save();
        switch (feature.type) {
          case 'cover':
            ctx.fillStyle = '#6B7280';
            ctx.fillRect(x - 15, y - 15, 30, 30);
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🛡️', x, y + 4);
            break;
          case 'elevation':
            ctx.fillStyle = '#92400E';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#D97706';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⛰️', x, y + 4);
            break;
          case 'obstacle':
            ctx.fillStyle = '#1F2937';
            ctx.fillRect(x - 15, y - 15, 30, 30);
            ctx.fillStyle = '#374151';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🚫', x, y + 4);
            break;
          case 'hazard':
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#FBBF24';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️', x, y + 4);
            break;
        }
        ctx.restore();
      });
      
      const currentTime = Date.now();
      attackEffects.forEach(effect => {
        const elapsed = currentTime - effect.startTime;
        const duration = 800;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) return;
        
        const fromX = effect.from.x * 40 + 20;
        const fromY = effect.from.y * 40 + 20;
        const toX = effect.to.x * 40 + 20;
        const toY = effect.to.y * 40 + 20;
        
        const alpha = 1 - progress;
        ctx.shadowBlur = 0;
        
        switch (effect.type) {
          case 'laser':
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FBBF24';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            break;
            
          case 'missile':
            const missileProgress = progress * (toX - fromX);
            const currentX = fromX + missileProgress;
            const currentY = fromY + progress * (toY - fromY);
            
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(currentX, currentY, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // 미사일 궤적
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            break;
            
          case 'beam':
            const beamAlpha = alpha * (0.5 + 0.5 * Math.sin(Date.now() * 0.01));
            ctx.strokeStyle = `rgba(147, 51, 234, ${beamAlpha})`;
            ctx.lineWidth = 6;
            ctx.shadowColor = '#9333EA';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            break;
        }
        ctx.shadowBlur = 0;
      });
      
      // 유닛 렌더링
      battle.participants.forEach(participant => {
        const x = participant.position.x * 40 + 20;
        const y = participant.position.y * 40 + 20;
        const pilotInfo = getPilotInfo(participant.pilotId);
        const mechInfo = getMechInfo(participant.mechId);
        const isAnimating = animatingUnits.has(participant.pilotId);
        
        ctx.save();
        
        if (isAnimating) {
          const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
          ctx.globalAlpha = pulse;
        }
        
        // 상태에 따른 색상
        let unitColor = pilotInfo.team === 'ally' ? '#10B981' : '#EF4444';
        if (participant.status === 'destroyed') {
          unitColor = '#6B7280';
          ctx.globalAlpha = 0.5;
        } else if (participant.status === 'damaged') {
          unitColor = '#F59E0B';
        }
        
        // 유닛 원
        ctx.fillStyle = unitColor;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, 2 * Math.PI);
        ctx.fill();
        
        // HP 바
        if (participant.status !== 'destroyed') {
          const hpPercentage = getHPPercentage(participant);
          const barWidth = 30;
          const barHeight = 4;
          
          ctx.fillStyle = '#374151';
          ctx.fillRect(x - barWidth/2, y - 28, barWidth, barHeight);
          
          const hpColor = hpPercentage > 60 ? '#10B981' : hpPercentage > 30 ? '#F59E0B' : '#EF4444';
          ctx.fillStyle = hpColor;
          ctx.fillRect(x - barWidth/2, y - 28, (barWidth * hpPercentage) / 100, barHeight);
        }
        
        // 파일럿 이니셜
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pilotInfo.initial, x, y + 4);
        
        // 메크 타입 표시
        if (mechInfo) {
          ctx.fillStyle = pilotInfo.team === 'ally' ? '#A3E635' : '#F87171';
          ctx.font = '8px monospace';
          ctx.fillText(mechInfo.type[0], x, y + 32);
        }
        
        ctx.restore();
      });
    };
    
    animationFrameRef.current = requestAnimationFrame(drawBattleField);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battle, animatingUnits, attackEffects]);

  // SimpleBattleEngine 결과만 표시 (프론트엔드 AI 비활성화)
  useEffect(() => {
    if (!battle || !isSimulating || isCountingDown) return;

    // WebSocket에서 받은 업데이트만 처리하고 별도 AI 시뮬레이션 비활성화
    const tickInterval = setInterval(() => {
      // 전투 종료 조건만 확인
      const currentAllies = (battle.participants || []).filter(p => {
        const info = getPilotInfo(p.pilotId);
        return info.team === 'ally' && p.status === 'active';
      });
      const currentEnemies = (battle.participants || []).filter(p => {
        const info = getPilotInfo(p.pilotId);
        return info.team === 'enemy' && p.status === 'active';
      });

      if (currentAllies.length === 0 || currentEnemies.length === 0) {
        setIsSimulating(false);
        const winner = currentAllies.length > 0 ? 'ally' : 'enemy';
        addBattleLog({
          type: 'system',
          message: `전투 종료! ${winner === 'ally' ? '아군' : '적군'} 승리!`,
          timestamp: Date.now()
        });
      }
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [battle, isSimulating, isCountingDown, addBattleLog, getPilotInfo]);

  // 공격 효과 정리
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setAttackEffects(prev => 
        prev.filter(effect => Date.now() - effect.startTime < 1000)
      );
    }, 500);

    return () => clearInterval(cleanupInterval);
  }, []);

  if (!battle) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="text-center text-slate-400">
          전투 데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      {/* 카운트다운 오버레이 */}
      {isCountingDown && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl font-bold text-pink-400 mb-4">
              {countdown}
            </div>
            <div className="text-xl text-slate-300">
              전투 시작까지...
            </div>
          </div>
        </div>
      )}

      {/* 전투 필드 */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="bg-slate-800"
        />
        
        {/* 아군 정보 패널 */}
        <div className="absolute top-4 left-4 bg-slate-800 bg-opacity-90 rounded p-3 min-w-[200px]">
          <h3 className="text-green-400 font-semibold mb-2">아군</h3>
          {battle.participants
            .filter(p => {
              const info = getPilotInfo(p.pilotId);
              return info.team === 'ally';
            })
            .map(participant => {
              const info = getPilotInfo(participant.pilotId);
              const hpPercent = getHPPercentage(participant);
              return (
                <div key={participant.pilotId} className="mb-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className={participant.status === 'destroyed' ? 'text-gray-500 line-through' : 'text-white'}>
                      {info.name}
                    </span>
                    <span className={`text-xs ${
                      hpPercent > 60 ? 'text-green-400' : 
                      hpPercent > 30 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {participant.hp}HP
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        hpPercent > 60 ? 'bg-green-400' : 
                        hpPercent > 30 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* 적군 정보 패널 */}
        <div className="absolute top-4 right-4 bg-slate-800 bg-opacity-90 rounded p-3 min-w-[200px]">
          <h3 className="text-red-400 font-semibold mb-2">적군</h3>
          {battle.participants
            .filter(p => {
              const info = getPilotInfo(p.pilotId);
              return info.team === 'enemy';
            })
            .map(participant => {
              const info = getPilotInfo(participant.pilotId);
              const hpPercent = getHPPercentage(participant);
              return (
                <div key={participant.pilotId} className="mb-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className={participant.status === 'destroyed' ? 'text-gray-500 line-through' : 'text-white'}>
                      {info.name}
                    </span>
                    <span className={`text-xs ${
                      hpPercent > 60 ? 'text-green-400' : 
                      hpPercent > 30 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {participant.hp}HP
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        hpPercent > 60 ? 'bg-green-400' : 
                        hpPercent > 30 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 전투 로그 */}
      <div className="h-32 bg-slate-800 border-t border-slate-700 p-4 overflow-y-auto">
        <div className="space-y-1 text-sm">
          {(battle.log || []).slice(-8).map((logEntry, index) => (
            <div key={index} className="text-slate-300">
              <span className="text-slate-500">
                {new Date(logEntry.timestamp).toLocaleTimeString()}
              </span>
              {logEntry.speaker && (
                <span className="text-pink-400 ml-2">
                  [{logEntry.speaker}]
                </span>
              )}
              <span className="ml-2">{logEntry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}