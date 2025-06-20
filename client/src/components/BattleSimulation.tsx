import { useState, useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';

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

  const pilots: PilotInfo[] = [
    { id: 1, name: "Sasha", callsign: "볼코프", team: "ally", initial: "S" },
    { id: 2, name: "Mente", callsign: "스톰", team: "ally", initial: "M" },
    { id: 3, name: "Azuma", callsign: "레이븐", team: "ally", initial: "A" },
    { id: 4, name: "Luna", callsign: "문영", team: "ally", initial: "L" },
    { id: 7, name: "Jin", callsign: "진", team: "ally", initial: "J" },
    { id: 101, name: "Enemy Alpha", callsign: "타겟-α", team: "enemy", initial: "E" },
    { id: 102, name: "Enemy Beta", callsign: "타겟-β", team: "enemy", initial: "E" },
    { id: 103, name: "Enemy Gamma", callsign: "타겟-γ", team: "enemy", initial: "E" },
  ];

  const getPilotInfo = (pilotId: number): PilotInfo => {
    const found = pilots.find(p => p.id === pilotId);
    if (found) return found;
    
    const isEnemy = pilotId >= 100;
    return {
      id: pilotId,
      name: isEnemy ? `Enemy ${pilotId}` : `Pilot ${pilotId}`,
      callsign: isEnemy ? `E${pilotId}` : `P${pilotId}`,
      team: isEnemy ? 'enemy' : 'ally',
      initial: isEnemy ? 'E' : String.fromCharCode(65 + (pilotId % 26))
    };
  };

  const manhattanDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  };

  // 서버 AI 시스템을 통한 행동 결정
  const getAIAction = async (actor: BattleParticipant) => {
    const actorInfo = getPilotInfo(actor.pilotId);
    const team = actorInfo.team === 'ally' ? 'team1' : 'team2';
    
    try {
      const response = await fetch('/api/ai/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant: actor,
          battleState: battle,
          team: team
        }),
      });
      
      if (response.ok) {
        const { decision } = await response.json();
        return {
          type: decision.type,
          actor,
          target: decision.target,
          newPosition: decision.newPosition,
          message: decision.dialogue || `${actorInfo.name}: "${decision.type}"`
        };
      }
    } catch (error) {
      console.error('AI decision error:', error);
    }
    
    // 폴백: 기본 AI 로직
    const enemies = (battle.participants || []).filter((p: BattleParticipant) => {
      const info = getPilotInfo(p.pilotId);
      return info.team !== actorInfo.team && p.status === 'active';
    });
    
    const randomFactor = Math.random();
    
    if (actor.hp < 25) {
      // 후퇴
      const retreatDirection = actorInfo.team === 'ally' ? -1 : 1;
      return {
        type: 'MOVE',
        actor,
        newPosition: {
          x: Math.max(0, Math.min(14, actor.position.x + retreatDirection)),
          y: Math.max(0, Math.min(9, actor.position.y + (Math.random() > 0.5 ? 1 : -1)))
        },
        message: `${actorInfo.name}: "후퇴!"`
      };
    } else if (enemies.length > 0) {
      const closestEnemy = enemies.reduce((closest, enemy) => {
        const distToClosest = manhattanDistance(actor.position, closest.position);
        const distToEnemy = manhattanDistance(actor.position, enemy.position);
        return distToEnemy < distToClosest ? enemy : closest;
      });
      
      const distance = manhattanDistance(actor.position, closestEnemy.position);
      
      if (distance <= 3 && randomFactor < 0.5) {
        return {
          type: 'ATTACK',
          actor,
          target: closestEnemy,
          message: `${actorInfo.name}: "공격!"`
        };
      } else {
        // 이동
        const dx = closestEnemy.position.x - actor.position.x;
        const dy = closestEnemy.position.y - actor.position.y;
        const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
        const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
        
        return {
          type: 'MOVE',
          actor,
          newPosition: {
            x: Math.max(0, Math.min(14, actor.position.x + stepX)),
            y: Math.max(0, Math.min(9, actor.position.y + stepY))
          },
          message: `${actorInfo.name}: "접근 중!"`
        };
      }
    } else {
      // 순찰
      const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
      ];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      
      return {
        type: 'MOVE',
        actor,
        newPosition: {
          x: Math.max(0, Math.min(14, actor.position.x + randomDirection.x)),
          y: Math.max(0, Math.min(9, actor.position.y + randomDirection.y))
        },
        message: `${actorInfo.name}: "순찰 중"`
      };
    }
  };

  // 병렬 전투 시뮬레이션 로직
  useEffect(() => {
    if (!battle || !isSimulating || isCountingDown) return;

    const tickInterval = setInterval(async () => {
      const currentTime = Date.now();
      
      const activeUnits = (battle.participants || []).filter((p: BattleParticipant) => p.status === 'active');
      
      if (activeUnits.length >= 1) {
        // 80% 확률로 행동
        const availableUnits = activeUnits.filter((unit: BattleParticipant) => {
          const lastActionTime = unit.lastActionTime || 0;
          const cooldownTime = 800;
          const hasPassedCooldown = currentTime - lastActionTime > cooldownTime;
          const actionChance = Math.random() < 0.8;
          return hasPassedCooldown && actionChance;
        });

        if (availableUnits.length === 0) return;

        // 병렬 행동 처리
        for (const actor of availableUnits) {
          const action = await getAIAction(actor);
          const actorInfo = getPilotInfo(actor.pilotId);

          if (action.type === 'ATTACK' && action.target) {
            const target = action.target;
            const attacker = action.actor;
            
            setAnimatingUnits(new Set([attacker.pilotId]));
            setTimeout(() => setAnimatingUnits(new Set()), 1500);
            
            const attackTypes: ('laser' | 'missile' | 'beam')[] = ['laser', 'missile', 'beam'];
            let weaponType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
            
            if (actorInfo.initial === 'S') weaponType = 'laser';
            else if (actorInfo.initial === 'M') weaponType = 'missile';
            else if (actorInfo.initial === 'A') weaponType = 'beam';
            
            const attackEffect: AttackEffect = {
              id: `${Date.now()}-${Math.random()}`,
              from: attacker.position,
              to: target.position,
              startTime: Date.now(),
              type: weaponType
            };
            setAttackEffects(prev => [...prev, attackEffect]);
            
            // 데미지 계산
            const baseDamage = Math.floor(15 + Math.random() * 20);
            const finalDamage = Math.max(1, baseDamage);
            
            const attackLog = {
              timestamp: Date.now(),
              type: 'attack' as const,
              message: `${actorInfo.name}이(가) ${getPilotInfo(target.pilotId).name}에게 ${finalDamage} 데미지!`,
              speaker: actorInfo.name
            };
            addBattleLog(attackLog);
            
            const updatedParticipants = battle.participants.map((p: BattleParticipant) => {
              if (p.pilotId === target.pilotId) {
                const newHp = Math.max(0, p.hp - finalDamage);
                return { 
                  ...p, 
                  hp: newHp, 
                  status: newHp <= 0 ? 'destroyed' as const : p.status 
                };
              }
              if (p.pilotId === actor.pilotId) {
                return { ...p, lastActionTime: currentTime };
              }
              return p;
            });
            
            setBattle({
              ...battle,
              turn: battle.turn + 1,
              participants: updatedParticipants,
              log: [...(battle.log || []), attackLog]
            });
          }
          
          else if (action.type === 'MOVE') {
            setAnimatingUnits(new Set([actor.pilotId]));
            setTimeout(() => setAnimatingUnits(new Set()), 800);
            
            // 유연한 위치 검증
            const newPosition = action.newPosition || actor.position;
            let finalPosition = {
              x: Math.max(0, Math.min(14, newPosition.x)),
              y: Math.max(0, Math.min(9, newPosition.y))
            };
            
            // 위치 겹침 체크 - 겹치면 근처 빈 공간 찾기
            const isPositionOccupied = battle.participants.some((p: BattleParticipant) => 
              p.pilotId !== actor.pilotId && p.status === 'active' &&
              p.position.x === finalPosition.x && p.position.y === finalPosition.y
            );
            
            if (isPositionOccupied) {
              const directions = [
                {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1},
                {x: 1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}
              ];
              
              for (const dir of directions) {
                const altPosition = {
                  x: Math.max(0, Math.min(14, finalPosition.x + dir.x)),
                  y: Math.max(0, Math.min(9, finalPosition.y + dir.y))
                };
                
                const isAltOccupied = battle.participants.some((p: BattleParticipant) => 
                  p.pilotId !== actor.pilotId && p.status === 'active' &&
                  p.position.x === altPosition.x && p.position.y === altPosition.y
                );
                
                if (!isAltOccupied) {
                  finalPosition = altPosition;
                  break;
                }
              }
            }
            
            const moveLog = {
              timestamp: Date.now(),
              type: 'movement' as const,
              message: action.message,
              speaker: actorInfo.name
            };
            addBattleLog(moveLog);
            
            const updatedParticipants = battle.participants.map((p: BattleParticipant) => {
              if (p.pilotId === actor.pilotId) {
                return { 
                  ...p, 
                  position: finalPosition, 
                  lastActionTime: currentTime 
                };
              }
              return p;
            });
            
            setBattle({
              ...battle,
              turn: battle.turn + 1,
              participants: updatedParticipants,
              log: [...(battle.log || []), moveLog]
            });
          }
        }
      }

      // 전투 종료 조건 확인
      const alliesAlive = activeUnits.some(p => getPilotInfo(p.pilotId).team === 'ally');
      const enemiesAlive = activeUnits.some(p => getPilotInfo(p.pilotId).team === 'enemy');
      
      if (!alliesAlive || !enemiesAlive) {
        setCurrentTick(prev => prev + 1);
        setIsSimulating(false);
        addBattleLog({
          type: 'system',
          message: alliesAlive ? '아군 승리!' : '적군 승리!',
          timestamp: Date.now()
        });
      }
    }, 1500);

    return () => clearInterval(tickInterval);
  }, [battle, isSimulating, isCountingDown, addBattleLog, setBattle]);

  // Canvas 애니메이션
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !battle) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 그리드 그리기
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 15; x++) {
        ctx.beginPath();
        ctx.moveTo(x * 40, 0);
        ctx.lineTo(x * 40, 400);
        ctx.stroke();
      }
      for (let y = 0; y <= 10; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * 40);
        ctx.lineTo(600, y * 40);
        ctx.stroke();
      }
      
      // 지형 그리기
      terrainFeatures.forEach(terrain => {
        const x = terrain.x * 40;
        const y = terrain.y * 40;
        
        ctx.fillStyle = terrain.type === 'cover' ? '#4CAF50' :
                       terrain.type === 'elevation' ? '#8BC34A' :
                       terrain.type === 'obstacle' ? '#9E9E9E' : '#FF5722';
        ctx.fillRect(x + 5, y + 5, 30, 30);
      });
      
      // 유닛 그리기
      battle.participants.forEach(participant => {
        if (participant.status === 'destroyed') return;
        
        const pilotInfo = getPilotInfo(participant.pilotId);
        const x = participant.position.x * 40 + 20;
        const y = participant.position.y * 40 + 20;
        
        // 유닛 원
        ctx.fillStyle = pilotInfo.team === 'ally' ? '#2196F3' : '#F44336';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // 애니메이션 효과
        if (animatingUnits.has(participant.pilotId)) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        // 이니셜
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pilotInfo.initial, x, y);
        
        // HP 바
        const hpBarWidth = 30;
        const hpBarHeight = 4;
        const hpPercentage = participant.hp / 100;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x - hpBarWidth/2, y - 25, hpBarWidth, hpBarHeight);
        
        ctx.fillStyle = hpPercentage > 0.6 ? '#4CAF50' : 
                       hpPercentage > 0.3 ? '#FF9800' : '#F44336';
        ctx.fillRect(x - hpBarWidth/2, y - 25, hpBarWidth * hpPercentage, hpBarHeight);
      });
      
      // 공격 효과 그리기
      const currentTime = Date.now();
      setAttackEffects(prev => prev.filter(effect => {
        const elapsed = currentTime - effect.startTime;
        if (elapsed > 1000) return false;
        
        const fromX = effect.from.x * 40 + 20;
        const fromY = effect.from.y * 40 + 20;
        const toX = effect.to.x * 40 + 20;
        const toY = effect.to.y * 40 + 20;
        
        ctx.strokeStyle = effect.type === 'laser' ? '#00FF00' :
                         effect.type === 'missile' ? '#FF6600' : '#9C27B0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        return true;
      }));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battle, animatingUnits, attackEffects, terrainFeatures]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* 카운트다운 오버레이 */}
      {isCountingDown && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-6xl font-bold animate-pulse">
            {countdown > 0 ? countdown : "START!"}
          </div>
        </div>
      )}
      
      {/* 전투 정보 헤더 */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">배틀 시뮬레이션</h3>
          <p className="text-sm text-gray-300">턴 {battle.turn} | 상태: {isSimulating ? '진행 중' : '대기'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm">
            아군: {battle.participants.filter(p => getPilotInfo(p.pilotId).team === 'ally' && p.status === 'active').length} / 
            적군: {battle.participants.filter(p => getPilotInfo(p.pilotId).team === 'enemy' && p.status === 'active').length}
          </p>
        </div>
      </div>
      
      {/* 캔버스 */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="border border-gray-300 bg-white"
        />
      </div>
      
      {/* 지형 정보 */}
      <div className="bg-gray-100 p-4">
        <h4 className="font-semibold mb-2">지형 효과</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {terrainFeatures.map((terrain, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-4 h-4 ${
                terrain.type === 'cover' ? 'bg-green-500' :
                terrain.type === 'elevation' ? 'bg-lime-500' :
                terrain.type === 'obstacle' ? 'bg-gray-500' : 'bg-red-500'
              }`}></div>
              <span>({terrain.x}, {terrain.y}) - {terrain.effect}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}