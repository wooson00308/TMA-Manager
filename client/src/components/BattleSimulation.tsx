import { useState, useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';

interface BattleParticipant {
  pilotId: number;
  mechId: number;
  position: { x: number; y: number };
  hp: number;
  status: 'active' | 'damaged' | 'destroyed';
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
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
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
    
    // 동적으로 파일럿 정보 생성
    const isEnemy = pilotId >= 100;
    return {
      id: pilotId,
      name: isEnemy ? `Enemy ${pilotId}` : `Pilot ${pilotId}`,
      callsign: isEnemy ? `E${pilotId}` : `P${pilotId}`,
      team: isEnemy ? 'enemy' : 'ally',
      initial: isEnemy ? 'E' : String.fromCharCode(65 + (pilotId % 26)) // A, B, C...
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
      // 캔버스 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 배경 그라데이션
      const gradient = ctx.createRadialGradient(320, 240, 0, 320, 240, 400);
      gradient.addColorStop(0, '#1F2937');
      gradient.addColorStop(1, '#111827');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 그리드 라인
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
      
      // 지형지물 렌더링
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
      
      // 공격 효과 렌더링 (유닛보다 먼저)
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
        
        // 공격 타입별 시각 효과
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
            
            // 미사일 궤적
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
            
            // 빔 코어
            ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            break;
        }
        ctx.shadowBlur = 0;
        
        // 폭발 효과
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
      
      // 공격 효과 정리
      setAttackEffects(prev => prev.filter(effect => currentTime - effect.startTime < 800));
      
      // 유닛 렌더링
      battle.participants.forEach(participant => {
        const pilot = getPilotInfo(participant.pilotId);
        const x = participant.position.x * 40 + 20;
        const y = participant.position.y * 40 + 20;
        
        // 애니메이션 효과 (펄스 링)
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
        
        // 메크 베이스 (육각형)
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
        
        // 메크 아웃라인
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // HP 바
        if (participant.status !== 'destroyed') {
          const hpBarWidth = 30;
          const hpBarHeight = 4;
          const hpX = x - hpBarWidth / 2;
          const hpY = y - 28;
          
          // HP 배경
          ctx.fillStyle = '#374151';
          ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
          
          // HP 게이지
          const hpWidth = (participant.hp / 100) * hpBarWidth;
          ctx.fillStyle = participant.hp > 70 ? '#10B981' : 
                         participant.hp > 30 ? '#F59E0B' : '#EF4444';
          ctx.fillRect(hpX, hpY, hpWidth, hpBarHeight);
          
          // HP 텍스트
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${participant.hp}%`, x, hpY - 2);
        }
        
        // 파일럿 이니셜 (중앙)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pilot.initial, x, y + 5);
        
        // 파일럿 이름 (하단)
        ctx.fillStyle = pilot.team === 'ally' ? '#93C5FD' : '#FCA5A5';
        ctx.font = '8px monospace';
        ctx.fillText(pilot.name, x, y + 35);
        
        // 상태 표시
        if (participant.status === 'destroyed') {
          // X 표시
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

  // 시뮬레이션 로직
  useEffect(() => {
    if (battle && isSimulating) {
      const interval = setInterval(() => {
        setCurrentTurn(prev => {
          const nextTurn = prev + 1;
          
          if (nextTurn <= 10) {
            // 향상된 AI 전투 시뮬레이션
            const activeUnits = battle.participants.filter(p => p.status === 'active');
            if (activeUnits.length >= 2) {
              const attacker = activeUnits[Math.floor(Math.random() * activeUnits.length)];
              const attackerInfo = getPilotInfo(attacker.pilotId);
              const targets = activeUnits.filter(p => {
                const targetInfo = getPilotInfo(p.pilotId);
                return attackerInfo.team !== targetInfo.team;
              });
              
              if (targets.length > 0) {
                // 전략적 타겟 선택 (낮은 HP 우선)
                const target = targets.reduce((prev, current) => 
                  current.hp < prev.hp ? current : prev
                );
                const targetInfo = getPilotInfo(target.pilotId);
                
                // 지형 효과 계산
                const attackerTerrain = terrainFeatures.find(t => 
                  t.x === attacker.position.x && t.y === attacker.position.y
                );
                const targetTerrain = terrainFeatures.find(t => 
                  t.x === target.position.x && t.y === target.position.y
                );
                
                // 애니메이션 효과
                setAnimatingUnits(new Set([attacker.pilotId]));
                setTimeout(() => setAnimatingUnits(new Set()), 1500);
                
                // 공격 이펙트 (파일럿 특성에 따른 무기 선택)
                const attackTypes: ('laser' | 'missile' | 'beam')[] = ['laser', 'missile', 'beam'];
                let weaponType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
                
                // 파일럿별 선호 무기
                if (attackerInfo.initial === 'S') weaponType = 'laser'; // Sasha - 레이저
                else if (attackerInfo.initial === 'M') weaponType = 'missile'; // Mente - 미사일
                else if (attackerInfo.initial === 'A') weaponType = 'beam'; // Azuma - 빔
                
                const attackEffect: AttackEffect = {
                  id: `${Date.now()}-${Math.random()}`,
                  from: attacker.position,
                  to: target.position,
                  startTime: Date.now(),
                  type: weaponType
                };
                setAttackEffects(prev => [...prev, attackEffect]);
                
                // 지형 효과가 적용된 데미지 계산
                let baseDamage = Math.floor(Math.random() * 30) + 10;
                let finalDamage = baseDamage;
                
                // 공격자 지형 보너스
                if (attackerTerrain?.type === 'elevation') {
                  finalDamage += Math.floor(baseDamage * 0.2); // 고지대에서 20% 증가
                }
                
                // 방어자 지형 보너스
                if (targetTerrain?.type === 'cover') {
                  finalDamage = Math.floor(finalDamage * 0.8); // 엄폐물에서 20% 감소
                }
                
                // 위험지대 효과
                if (targetTerrain?.type === 'hazard') {
                  finalDamage += 5; // 위험지대에서 추가 데미지
                }
                
                const newLog = {
                  timestamp: Date.now(),
                  type: 'attack' as const,
                  message: `${attackerInfo.name}이(가) ${targetInfo.name}을(를) ${weaponType === 'laser' ? '레이저' : weaponType === 'missile' ? '미사일' : '빔'}로 공격! ${finalDamage} 데미지!${
                    attackerTerrain?.type === 'elevation' ? ' [고지대 보너스]' : ''
                  }${targetTerrain?.type === 'cover' ? ' [엄폐 방어]' : ''}${
                    targetTerrain?.type === 'hazard' ? ' [위험지대 피해]' : ''
                  }`,
                  speaker: attackerInfo.name
                };
                
                addBattleLog(newLog);
                
                // HP 업데이트 및 지형 지속 효과
                const updatedParticipants = battle.participants.map(p => {
                  if (p.pilotId === target.pilotId) {
                    return {
                      ...p,
                      hp: Math.max(0, p.hp - finalDamage),
                      status: p.hp - finalDamage <= 0 ? 'destroyed' as const : p.status
                    };
                  }
                  
                  // 위험지대에 있는 모든 유닛에게 지속 피해
                  const unitTerrain = terrainFeatures.find(t => 
                    t.x === p.position.x && t.y === p.position.y
                  );
                  if (unitTerrain?.type === 'hazard' && p.status === 'active') {
                    const hazardDamage = 5;
                    const newHp = Math.max(0, p.hp - hazardDamage);
                    if (hazardDamage > 0) {
                      const hazardLog = {
                        timestamp: Date.now() + 100,
                        type: 'system' as const,
                        message: `${getPilotInfo(p.pilotId).name}이(가) 위험지대에서 ${hazardDamage} 피해를 받았습니다!`
                      };
                      setTimeout(() => addBattleLog(hazardLog), 500);
                    }
                    return {
                      ...p,
                      hp: newHp,
                      status: newHp <= 0 ? 'destroyed' as const : p.status
                    };
                  }
                  
                  return p;
                });
                
                setBattle({
                  ...battle,
                  turn: nextTurn,
                  participants: updatedParticipants,
                  log: [...battle.log, newLog]
                });
              }
            }
          } else {
            setIsSimulating(false);
            const allyUnits = battle.participants.filter(p => {
              const info = getPilotInfo(p.pilotId);
              return info.team === 'ally' && p.status === 'active';
            });
            const enemyUnits = battle.participants.filter(p => {
              const info = getPilotInfo(p.pilotId);
              return info.team === 'enemy' && p.status === 'active';
            });
            
            const winner = allyUnits.length > enemyUnits.length ? '아군' : '적군';
            const endLog = {
              timestamp: Date.now(),
              type: 'system' as const,
              message: `전투 종료! ${winner} 승리!`,
            };
            addBattleLog(endLog);
            setBattle({
              ...battle,
              phase: 'completed',
              turn: nextTurn,
              log: [...battle.log, endLog]
            });
          }
          
          return nextTurn;
        });
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [battle, isSimulating, addBattleLog, setBattle]);

  const startSimulation = () => {
    setCurrentTurn(0);
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
      {/* 전투 상태 헤더 */}
      <div className="border-b border-cyan-400/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-cyan-400">2D 전투 시뮬레이션</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              페이즈: <span className="text-cyan-400">{battle.phase}</span>
            </div>
            <div className="text-sm text-gray-300">
              턴: <span className="text-cyan-400">{battle.turn}</span>
            </div>
          </div>
        </div>
        
        {battle.phase !== 'completed' && !isSimulating && (
          <button
            onClick={startSimulation}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            시뮬레이션 시작
          </button>
        )}
        
        {isSimulating && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">실시간 전투 진행 중...</span>
          </div>
        )}
      </div>

      {/* 2D 전장 Canvas */}
      <div className="p-6">
        <div className="bg-gray-900 rounded border border-gray-600 p-4 mb-6">
          <h4 className="text-md font-semibold text-gray-300 mb-3">전장 맵 (2D 탑뷰)</h4>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="border border-gray-600 bg-gray-800 rounded"
            />
          </div>
          
          {/* 범례 */}
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
          
          {/* 무기 효과 범례 */}
          <div className="mt-3 p-2 bg-gray-800/50 rounded">
            <h5 className="font-semibold text-gray-300 mb-2 text-xs">무기 효과</h5>
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
          </div>
        </div>

        {/* 유닛 상태 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-md font-semibold text-blue-300 mb-3">아군 상태</h4>
            <div className="space-y-2">
              {battle.participants
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
              {battle.participants
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

      {/* 전투 로그 */}
      <div className="border-t border-cyan-400/20 p-4">
        <h4 className="text-md font-semibold text-gray-300 mb-3">실시간 전투 기록</h4>
        <div className="bg-gray-900 rounded max-h-32 overflow-y-auto custom-scrollbar">
          {battle.log.slice(-8).map((logEntry, index) => (
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