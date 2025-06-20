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

  const determineAIAction = (actor: any, battleState: any, actorInfo: PilotInfo) => {
    const isLowHP = actor.hp < 30;
    const isCriticalHP = actor.hp < 15;
    const allies = battleState.participants.filter((p: any) => {
      const info = getPilotInfo(p.pilotId);
      return info.team === actorInfo.team && p.status === 'active' && p.pilotId !== actor.pilotId;
    });
    const enemies = battleState.participants.filter((p: any) => {
      const info = getPilotInfo(p.pilotId);
      return info.team !== actorInfo.team && p.status === 'active';
    });
    
    const damagedAllies = allies.filter((ally: any) => ally.hp < 50);
    const nearbyEnemies = enemies.filter((enemy: any) => 
      Math.abs(enemy.position.x - actor.position.x) <= 2 &&
      Math.abs(enemy.position.y - actor.position.y) <= 2
    );

    const random = Math.random();
    
    const personalities: { [key: string]: any } = {
      'S': { aggressive: 0.8, tactical: 0.6, supportive: 0.4 },
      'M': { aggressive: 0.4, tactical: 0.9, supportive: 0.8 },
      'A': { aggressive: 0.9, tactical: 0.3, supportive: 0.5 },
      'E': { aggressive: 0.6, tactical: 0.5, supportive: 0.2 }
    };
    const personality = personalities[actorInfo.initial] || personalities['E'];

    if (isCriticalHP && random < 0.6) {
      const retreatPos = calculateRetreatPosition(actor.position, actorInfo.team, enemies);
      return {
        type: 'RETREAT',
        actor,
        newPosition: retreatPos,
        message: `${actorInfo.name}: "긴급 후퇴! 재정비 필요!"`
      };
    }

    if (personality.supportive > 0.6 && damagedAllies.length > 0 && random < 0.25) {
      const targetAlly = damagedAllies[0];
      return {
        type: 'SUPPORT',
        actor,
        target: targetAlly,
        message: `${actorInfo.name}: "지원 나간다! 버텨!"`
      };
    }

    if (nearbyEnemies.length >= 2 && random < 0.2) {
      return {
        type: 'DEFEND',
        actor,
        message: `${actorInfo.name}: "방어 태세! 견고하게!"`
      };
    }

    if (personality.tactical > 0.7 && random < 0.3) {
      const scoutPos = calculateScoutPosition(actor.position, actorInfo.team, enemies);
      return {
        type: 'SCOUT',
        actor,
        newPosition: scoutPos,
        message: `${actorInfo.name}: "정찰 이동! 상황 파악!"`
      };
    }

    if (battleState.turn > 5 && random < 0.15) {
      const abilities = ['오버드라이브', '정밀 조준', '일제 사격', '은폐 기동'];
      const ability = abilities[Math.floor(Math.random() * abilities.length)];
      return {
        type: 'SPECIAL',
        actor,
        ability,
        message: `${actorInfo.name}: "${ability} 발동!"`
      };
    }

    if (enemies.length > 0 && random < 0.8) {
      const target = selectBestTarget(enemies, actor, personality);
      return {
        type: 'ATTACK',
        actor,
        target,
        message: `${actorInfo.name}: "타겟 확인! 공격 개시!"`
      };
    }

    const tacticalPos = calculateTacticalPosition(actor.position, actorInfo.team, enemies);
    return {
      type: 'MOVE',
      actor,
      newPosition: tacticalPos,
      message: `${actorInfo.name}: "포지션 조정!"`
    };
  };

  const calculateRetreatPosition = (pos: any, team: string, enemies: any[]) => {
    const safeDirection = team === 'ally' ? -2 : 2;
    return {
      x: Math.max(1, Math.min(15, pos.x + safeDirection)),
      y: Math.max(1, Math.min(11, pos.y + (Math.random() > 0.5 ? -1 : 1)))
    };
  };

  const calculateScoutPosition = (pos: any, team: string, enemies: any[]) => {
    const scoutDirection = team === 'ally' ? 2 : -2;
    return {
      x: Math.max(1, Math.min(15, pos.x + scoutDirection)),
      y: Math.max(1, Math.min(11, pos.y))
    };
  };

  const calculateTacticalPosition = (pos: any, team: string, enemies: any[]) => {
    if (enemies.length === 0) {
      const direction = team === 'ally' ? 1 : -1;
      return {
        x: Math.max(1, Math.min(15, pos.x + direction)),
        y: Math.max(1, Math.min(11, pos.y + (Math.random() > 0.5 ? 1 : -1)))
      };
    }

    const nearestEnemy = enemies.reduce((prev: any, current: any) => {
      const prevDist = Math.abs(prev.position.x - pos.x) + Math.abs(prev.position.y - pos.y);
      const currDist = Math.abs(current.position.x - pos.x) + Math.abs(current.position.y - pos.y);
      return currDist < prevDist ? current : prev;
    });

    const optimalX = Math.floor((pos.x + nearestEnemy.position.x) / 2);
    const optimalY = Math.floor((pos.y + nearestEnemy.position.y) / 2);

    return {
      x: Math.max(1, Math.min(15, optimalX)),
      y: Math.max(1, Math.min(11, optimalY))
    };
  };

  const selectBestTarget = (enemies: any[], attacker: any, personality: any) => {
    if (personality.aggressive > 0.7) {
      return enemies.reduce((prev: any, current: any) => 
        current.hp < prev.hp ? current : prev
      );
    } else if (personality.tactical > 0.7) {
      return enemies.reduce((prev: any, current: any) => {
        const prevScore = prev.hp + (Math.abs(prev.position.x - attacker.position.x) + Math.abs(prev.position.y - attacker.position.y)) * 3;
        const currScore = current.hp + (Math.abs(current.position.x - attacker.position.x) + Math.abs(current.position.y - attacker.position.y)) * 3;
        return currScore < prevScore ? current : prev;
      });
    }
    return enemies.reduce((prev: any, current: any) => {
      const prevDist = Math.abs(prev.position.x - attacker.position.x) + Math.abs(prev.position.y - attacker.position.y);
      const currDist = Math.abs(current.position.x - attacker.position.x) + Math.abs(current.position.y - attacker.position.y);
      return currDist < prevDist ? current : prev;
    });
  };

  // 전투 종료 조건 확인 헬퍼 함수
  const checkVictoryCondition = (participants: BattleParticipant[]) => {
    const allies = participants.filter(p => {
      const info = getPilotInfo(p.pilotId);
      return info.team === 'ally' && p.status === 'active';
    });
    const enemies = participants.filter(p => {
      const info = getPilotInfo(p.pilotId);
      return info.team === 'enemy' && p.status === 'active';
    });

    if (allies.length === 0 || enemies.length === 0) {
      return {
        isGameOver: true,
        winner: allies.length > 0 ? '아군' : '적군',
        allyCount: allies.length,
        enemyCount: enemies.length
      };
    }

    return {
      isGameOver: false,
      winner: null,
      allyCount: allies.length,
      enemyCount: enemies.length
    };
  };

  // Canvas 애니메이션 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !battle) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationStartTime = Date.now();
    
    const drawBattleField = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createRadialGradient(320, 240, 0, 320, 240, 400);
      gradient.addColorStop(0, '#1F2937');
      gradient.addColorStop(1, '#111827');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 16; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 40, 0);
        ctx.lineTo(i * 40, 480);
        ctx.stroke();
      }
      for (let i = 0; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 40);
        ctx.lineTo(640, i * 40);
        ctx.stroke();
      }
      
      terrainFeatures.forEach(terrain => {
        const x = terrain.x * 40 + 20;
        const y = terrain.y * 40 + 20;
        
        ctx.save();
        switch (terrain.type) {
          case 'cover':
            ctx.fillStyle = '#059669';
            ctx.fillRect(terrain.x * 40 + 5, terrain.y * 40 + 5, 30, 30);
            ctx.fillStyle = '#10B981';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🛡️', x, y + 4);
            break;
          case 'elevation':
            ctx.fillStyle = '#7C3AED';
            ctx.beginPath();
            ctx.moveTo(x, y - 15);
            ctx.lineTo(x - 15, y + 10);
            ctx.lineTo(x + 15, y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#A855F7';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⬆️', x, y + 2);
            break;
          case 'obstacle':
            ctx.fillStyle = '#DC2626';
            ctx.fillRect(terrain.x * 40 + 8, terrain.y * 40 + 8, 24, 24);
            ctx.fillStyle = '#EF4444';
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
            ctx.beginPath();
            ctx.arc(currentX, currentY, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            break;
            
          case 'beam':
            ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
            ctx.lineWidth = 6;
            ctx.shadowColor = '#9333EA';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            
            ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            break;
        }
        ctx.shadowBlur = 0;
        
        if (progress > 0.6) {
          const explosionProgress = (progress - 0.6) / 0.4;
          const explosionRadius = explosionProgress * 25;
          const explosionAlpha = 1 - explosionProgress;
          
          ctx.fillStyle = `rgba(239, 68, 68, ${explosionAlpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(toX, toY, explosionRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      
      setAttackEffects(prev => prev.filter(effect => currentTime - effect.startTime < 800));
      
      (battle.participants || []).forEach(participant => {
        const pilot = getPilotInfo(participant.pilotId);
        const x = participant.position.x * 40 + 20;
        const y = participant.position.y * 40 + 20;
        
        if (animatingUnits.has(participant.pilotId)) {
          const pulseProgress = ((timestamp - animationStartTime) % 1000) / 1000;
          const pulseRadius = 20 + Math.sin(pulseProgress * Math.PI * 2) * 5;
          ctx.strokeStyle = pilot.team === 'ally' ? 
            `rgba(59, 130, 246, ${0.8 - pulseProgress * 0.6})` : 
            `rgba(239, 68, 68, ${0.8 - pulseProgress * 0.6})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        const baseSize = participant.status === 'destroyed' ? 12 : 16;
        ctx.fillStyle = pilot.team === 'ally' ? '#3B82F6' : '#EF4444';
        if (participant.status === 'destroyed') {
          ctx.fillStyle = '#6B7280';
        }
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const hexX = x + Math.cos(angle) * baseSize;
          const hexY = y + Math.sin(angle) * baseSize;
          if (i === 0) ctx.moveTo(hexX, hexY);
          else ctx.lineTo(hexX, hexY);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (participant.status !== 'destroyed') {
          const hpBarWidth = 30;
          const hpBarHeight = 4;
          const hpX = x - hpBarWidth / 2;
          const hpY = y - 28;
          
          ctx.fillStyle = '#374151';
          ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
          
          const hpWidth = (participant.hp / 100) * hpBarWidth;
          ctx.fillStyle = participant.hp > 70 ? '#10B981' : 
                         participant.hp > 30 ? '#F59E0B' : '#EF4444';
          ctx.fillRect(hpX, hpY, hpWidth, hpBarHeight);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${participant.hp}%`, x, hpY - 2);
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pilot.initial, x, y + 5);
        
        ctx.fillStyle = pilot.team === 'ally' ? '#93C5FD' : '#FCA5A5';
        ctx.font = '8px monospace';
        ctx.fillText(pilot.name, x, y + 35);
        
        if (participant.status === 'destroyed') {
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 10);
          ctx.lineTo(x + 10, y + 10);
          ctx.moveTo(x + 10, y - 10);
          ctx.lineTo(x - 10, y + 10);
          ctx.stroke();
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(drawBattleField);
    };
    
    animationFrameRef.current = requestAnimationFrame(drawBattleField);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battle, animatingUnits, attackEffects]);

  // 병렬 전투 시뮬레이션 로직 - 모든 유닛이 동시에 행동
  useEffect(() => {
    if (!battle || !isSimulating || isCountingDown) return;

    const tickInterval = setInterval(() => {
      const currentTime = Date.now();
      
      // 모든 활성 유닛들이 동시에 행동 결정
      const activeUnits = (battle.participants || []).filter((p: BattleParticipant) => p.status === 'active');
      
      if (activeUnits.length >= 1) {
        // 1초 쿨다운 시스템
        const availableUnits = activeUnits.filter((unit: BattleParticipant) => {
          const lastActionTime = unit.lastActionTime || 0;
          const cooldownTime = 1000; // 1초 쿨다운
          return currentTime - lastActionTime > cooldownTime;
        });

        // 모든 사용 가능한 유닛들이 병렬로 행동 계획 수립
        const parallelActions = availableUnits.map(actor => {
          const actorInfo = getPilotInfo(actor.pilotId);
          const aiAction = determineAIAction(actor, battle, actorInfo);
          return { actor, actorInfo, action: aiAction };
        });

        // 모든 행동을 동시에 실행 (병렬 처리)
        parallelActions.forEach(({ actor, actorInfo, action }) => {
          if (action.type === 'ATTACK' && action.target) {
            const target = action.target;
            const attacker = action.actor;
            
            const attackerTerrain = terrainFeatures.find(t => 
              t.x === attacker.position.x && t.y === attacker.position.y
            );
            const targetTerrain = terrainFeatures.find(t => 
              t.x === target.position.x && t.y === target.position.y
            );
            
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
            
            let baseDamage = Math.floor(Math.random() * 30) + 10;
            let finalDamage = baseDamage;
            
            if (attackerTerrain?.type === 'elevation') {
              finalDamage += Math.floor(baseDamage * 0.2);
            }
            
            if (targetTerrain?.type === 'cover') {
              finalDamage = Math.floor(finalDamage * 0.8);
            }
            
            if (targetTerrain?.type === 'hazard') {
              finalDamage += 5;
            }
            
            const newLog = {
              timestamp: Date.now(),
              type: 'attack' as const,
              message: `${action.message} ${finalDamage} 데미지!${
                attackerTerrain?.type === 'elevation' ? ' [고지대]' : ''
              }${targetTerrain?.type === 'cover' ? ' [엄폐]' : ''}${
                targetTerrain?.type === 'hazard' ? ' [위험지대]' : ''
              }`,
              speaker: actorInfo.name
            };
            
            addBattleLog(newLog);
            
            const updatedParticipants = battle.participants.map((p: BattleParticipant) => {
              if (p.pilotId === target.pilotId) {
                return {
                  ...p,
                  hp: Math.max(0, p.hp - finalDamage),
                  status: p.hp - finalDamage <= 0 ? 'destroyed' as const : p.status
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
              log: [...(battle.log || []), newLog]
            });

            // 공격 후 즉시 전투 종료 조건 확인
            const victoryCheck = checkVictoryCondition(updatedParticipants);
            if (victoryCheck.isGameOver) {
              setIsSimulating(false);
              const victoryLog = {
                timestamp: Date.now(),
                type: 'system' as const,
                message: `🎉 전투 종료! ${victoryCheck.winner} 승리! (${victoryCheck.allyCount}vs${victoryCheck.enemyCount})`,
              };
              addBattleLog(victoryLog);
              
              setBattle({
                ...battle,
                phase: 'completed' as const,
                participants: updatedParticipants,
                log: [...(battle.log || []), newLog, victoryLog]
              });
              return;
            }
          }
          
          else if (action.type === 'SUPPORT' && action.target) {
            const supportLog = {
              timestamp: Date.now(),
              type: 'system' as const,
              message: action.message,
              speaker: actorInfo.name
            };
            addBattleLog(supportLog);
            
            const updatedParticipants = battle.participants.map((p: BattleParticipant) => {
              if (p.pilotId === action.target.pilotId) {
                return { ...p, hp: Math.min(100, p.hp + 15) };
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
              log: [...(battle.log || []), supportLog]
            });
          }
          
          else if (action.type === 'RETREAT' || action.type === 'SCOUT' || action.type === 'MOVE') {
            setAnimatingUnits(new Set([actor.pilotId]));
            setTimeout(() => setAnimatingUnits(new Set()), 1000);
            
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
                  position: action.newPosition || p.position, 
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
          
          else {
            const actionLog = {
              timestamp: Date.now(),
              type: 'communication' as const,
              message: action.message,
              speaker: actorInfo.name
            };
            addBattleLog(actionLog);
            
            if (action.type === 'SPECIAL') {
              setAnimatingUnits(new Set([actor.pilotId]));
              setTimeout(() => setAnimatingUnits(new Set()), 2000);
            }
            
            const updatedParticipants = battle.participants.map((p: BattleParticipant) => 
              p.pilotId === actor.pilotId ? { ...p, lastActionTime: currentTime } : p
            );
            
            setBattle({
              ...battle,
              turn: battle.turn + 1,
              participants: updatedParticipants,
              log: [...(battle.log || []), actionLog]
            });
          }
        });
      }
      
      // 매 틱마다 전투 종료 조건 확인
      setCurrentTick(prev => {
        const nextTick = prev + 1;
        
        // 생존 유닛 체크
        const currentAllies = (battle.participants || []).filter(p => {
          const info = getPilotInfo(p.pilotId);
          return info.team === 'ally' && p.status === 'active';
        });
        const currentEnemies = (battle.participants || []).filter(p => {
          const info = getPilotInfo(p.pilotId);
          return info.team === 'enemy' && p.status === 'active';
        });

        // 즉시 승리 조건: 한 팀 전멸
        if (currentAllies.length === 0 || currentEnemies.length === 0) {
          setIsSimulating(false);
          const winner = currentAllies.length > 0 ? '아군' : '적군';
          const victoryLog = {
            timestamp: Date.now(),
            type: 'system' as const,
            message: `🎉 전투 종료! ${winner} 승리! (${currentAllies.length}vs${currentEnemies.length})`,
          };
          addBattleLog(victoryLog);
          
          setBattle({
            ...battle,
            phase: 'completed' as const,
            log: [...(battle.log || []), victoryLog]
          });
          return nextTick;
        }
        
        // 시간 제한 조건: 3분 후 무승부 또는 점수 승부
        if (nextTick > 180) {
          setIsSimulating(false);
          let winner;
          let message;
          
          if (currentAllies.length > currentEnemies.length) {
            winner = '아군';
            message = `⏰ 시간 종료! ${winner} 승리! (생존자 수: ${currentAllies.length}vs${currentEnemies.length})`;
          } else if (currentEnemies.length > currentAllies.length) {
            winner = '적군';
            message = `⏰ 시간 종료! ${winner} 승리! (생존자 수: ${currentAllies.length}vs${currentEnemies.length})`;
          } else {
            message = `⏰ 시간 종료! 무승부! (생존자 수: ${currentAllies.length}vs${currentEnemies.length})`;
          }
          
          const timeoutLog = {
            timestamp: Date.now(),
            type: 'system' as const,
            message,
          };
          addBattleLog(timeoutLog);
          
          setBattle({
            ...battle,
            phase: 'completed' as const,
            log: [...(battle.log || []), timeoutLog]
          });
        }
        
        return nextTick;
      });
    }, 1000); // 1초마다 틱 실행

    return () => clearInterval(tickInterval);
  }, [battle, isSimulating, addBattleLog, setBattle, terrainFeatures]);

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
      <div className="border-b border-cyan-400/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-cyan-400">실시간 전투 시뮬레이션</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              페이즈: <span className="text-cyan-400">{battle.phase}</span>
            </div>
            <div className="text-sm text-gray-300">
              시간: <span className="text-cyan-400">{currentTick}초</span>
            </div>
          </div>
        </div>
        
        {battle.phase !== 'completed' && !isSimulating && !isCountingDown && (
          <button
            onClick={startSimulation}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            실시간 시뮬레이션 시작
          </button>
        )}
        
        {isCountingDown && (
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-red-400 animate-pulse">
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
            
            {/* 카운트다운 오버레이 */}
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
              <h5 className="font-semibold text-gray-300 mb-2">지형지물</h5>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded text-center text-xs">🛡️</div>
                  <span className="text-green-300">엄폐물 (방어+20%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-600 rounded text-center text-xs">⬆️</div>
                  <span className="text-purple-300">고지대 (공격+20%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded text-center text-xs">🚫</div>
                  <span className="text-red-300">장애물 (이동차단)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-600 rounded text-center text-xs">⚠️</div>
                  <span className="text-yellow-300">위험지대 (턴당 -5HP)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-2">
            피아식별: 파일럿 이름 첫 글자로 표시 (S=Sasha, M=Mente, A=Azuma, E=Enemy)
          </div>
          
          <div className="mt-3 p-2 bg-gray-800/50 rounded">
            <h5 className="font-semibold text-gray-300 mb-2 text-xs">실시간 전투 시스템</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-yellow-400"></div>
                <span className="text-yellow-300">레이저 (정확)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-300">미사일 (추적)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-1 bg-purple-400"></div>
                <span className="text-purple-300">빔 (관통)</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              • 유닛별 1초 행동 간격 • 60% 확률로 실시간 행동 발생
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-md font-semibold text-blue-300 mb-3">아군 상태</h4>
            <div className="space-y-2">
              {(battle.participants || [])
                .filter(p => getPilotInfo(p.pilotId).team === 'ally')
                .map(participant => {
                  const pilot = getPilotInfo(participant.pilotId);
                  return (
                    <div key={participant.pilotId} className="p-3 bg-blue-900/20 rounded border border-blue-400/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-blue-200">
                            {pilot.initial} - {pilot.name}
                          </div>
                          <div className="text-xs text-blue-300">
                            위치: ({participant.position.x}, {participant.position.y})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">HP</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded h-2">
                              <div 
                                className={`h-2 rounded transition-all duration-300 ${
                                  participant.hp > 70 ? 'bg-green-500' :
                                  participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${participant.hp}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-300">{participant.hp}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-red-300 mb-3">적군 상태</h4>
            <div className="space-y-2">
              {(battle.participants || [])
                .filter(p => getPilotInfo(p.pilotId).team === 'enemy')
                .map(participant => {
                  const pilot = getPilotInfo(participant.pilotId);
                  return (
                    <div key={participant.pilotId} className="p-3 bg-red-900/20 rounded border border-red-400/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-red-200">
                            {pilot.initial} - {pilot.name}
                          </div>
                          <div className="text-xs text-red-300">
                            위치: ({participant.position.x}, {participant.position.y})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">HP</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded h-2">
                              <div 
                                className={`h-2 rounded transition-all duration-300 ${
                                  participant.hp > 70 ? 'bg-green-500' :
                                  participant.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${participant.hp}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-300">{participant.hp}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-cyan-400/20 p-4">
        <h4 className="text-md font-semibold text-gray-300 mb-3">실시간 전투 기록</h4>
        <div className="bg-gray-900 rounded max-h-32 overflow-y-auto custom-scrollbar">
          {(battle.log || []).slice(-8).map((logEntry, index) => (
            <div key={index} className="p-2 border-b border-gray-700 last:border-b-0">
              <div className={`text-sm ${
                logEntry.type === 'system' ? 'text-cyan-400' :
                logEntry.type === 'attack' ? 'text-red-300' :
                logEntry.type === 'movement' ? 'text-blue-300' :
                'text-gray-300'
              }`}>
                <span className="font-mono text-xs text-gray-500 mr-2">
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