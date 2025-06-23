import type { BattleState, Pilot } from "@shared/schema";
import type { TerrainFeature, PilotInfo, BattleParticipant, TacticalFormation, TacticalEffect } from "@shared/domain/types";
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";
import { makeAIDecision } from "@shared/ai/decision";

// 전술 효과 적용 함수
function applyTacticalEffects(participant: any, formation: TacticalFormation): any {
  const modifiedParticipant = { ...participant };
  
  formation.effects.forEach(effect => {
    const currentValue = modifiedParticipant[effect.stat] || 0;
    const modifier = effect.modifier / 100; // 퍼센트를 소수로 변환
    modifiedParticipant[effect.stat] = Math.round(currentValue * (1 + modifier));
  });
  
  return modifiedParticipant;
}

// 전술 설정 함수 (BattleState에서 전술 정보를 가져오도록 변경)
export function setTeamFormation(teamId: string, formation: TacticalFormation) {
  console.log(`Setting formation for ${teamId}:`, formation);
}

function getPilotInfo(pilots: Pilot[], pilotId: number, participant?: any): PilotInfo {
  const pilot = pilots.find(p => p.id === pilotId);
  
  if (pilot) {
    return {
      id: pilot.id,
      name: pilot.name,
      callsign: pilot.callsign,
      team: participant?.team === "team2" ? "enemy" : "ally", // participant의 team 정보 사용
      initial: pilot.name.charAt(0).toUpperCase()
    };
  }
  
  // Pilot not found in data - use fallback
  console.warn(`Pilot ${pilotId} not found in pilots data`);
  return {
    id: pilotId,
    name: `Unknown Pilot ${pilotId}`,
    callsign: `PILOT-${pilotId}`,
    team: participant?.team === "team2" ? "enemy" : "ally", // participant의 team 정보 사용
    initial: "U"
  };
}

function determineAIAction(actor: any, battleState: any, pilots: Pilot[], actorInfo: PilotInfo, terrainFeatures: TerrainFeature[]) {
  // 전술 효과 적용 - BattleState에서 전술 정보 가져오기
  const formation = battleState.teamFormations?.[actor.team] || {
    name: 'balanced',
    effects: []
  };
  const enhancedActor = applyTacticalEffects(actor, formation);
  
  const enemies = battleState.participants.filter((p: any) => {
    // team 필드를 직접 사용하여 적군 구분
    const isEnemy = actorInfo.team === "ally" ? p.team === "team2" : p.team === "team1";
    return isEnemy && p.status === 'active';
  });

  const allies = battleState.participants.filter((p: any) => {
    // team 필드를 직접 사용하여 아군 구분
    const isAlly = actorInfo.team === "ally" ? p.team === "team1" : p.team === "team2";
    return isAlly && p.status === 'active' && p.pilotId !== actor.pilotId;
  });

  // 전술 효과가 적용된 스탯 사용
  const mechStats = {
    firepower: enhancedActor.firepower || 75,
    speed: enhancedActor.speed || 70,
    armor: enhancedActor.armor || 70
  };

  const randomAction = Math.random();
  const isLowHP = enhancedActor.hp < (enhancedActor.maxHp || 100) * 0.3;
  const isEarlyBattle = battleState.turn < 3;

  console.log(`${actorInfo.name} using ${formation.name} formation - Stats: F:${mechStats.firepower} S:${mechStats.speed} A:${mechStats.armor}`);

  // 적이 있으면 공격을 최우선으로 (확률을 80%로 증가)
  if (enemies.length > 0 && randomAction < 0.8) {
    // 가장 가까운 적 선택
    const closestEnemy = enemies.reduce((closest: any, enemy: any) => {
      const currentDistance = Math.abs(enhancedActor.position.x - enemy.position.x) + Math.abs(enhancedActor.position.y - enemy.position.y);
      const closestDistance = Math.abs(enhancedActor.position.x - closest.position.x) + Math.abs(enhancedActor.position.y - closest.position.y);
      return currentDistance < closestDistance ? enemy : closest;
    });
    
    const distance = Math.abs(closestEnemy.position.x - enhancedActor.position.x) + Math.abs(closestEnemy.position.y - enhancedActor.position.y);
    
    // 사거리를 더 관대하게 (실제 range 값이나 기본 100 사용)
    const effectiveRange = Math.max(enhancedActor.range || 100, 8); // 최소 8칸 사거리 보장
    
    if (distance <= effectiveRange) {
      const targetIndex = battleState.participants.findIndex((p: any) => p.pilotId === closestEnemy.pilotId);
      return {
        type: "ATTACK",
        pilotName: actorInfo.name,
        targetIndex,
        dialogue: getDialogue(actorInfo, "combat", formation.name)
      };
    }
    
    // 사거리 밖이면 적에게 접근
    const newPosition = moveTowardsTarget(enhancedActor.position, closestEnemy.position, actorInfo.team, mechStats);
    return {
      type: "MOVE",
      pilotName: actorInfo.name,
      newPosition,
      dialogue: getDialogue(actorInfo, "movement", formation.name)
    };
  }

  // Early battle communication
  if (isEarlyBattle && randomAction < 0.3) {
    return {
      type: "COMMUNICATE",
      pilotName: actorInfo.name,
      dialogue: getDialogue(actorInfo, "combat", formation.name)
    };
  }

  // Low HP reaction
  if (isLowHP && randomAction < 0.4) {
    return {
      type: "COMMUNICATE",
      pilotName: actorInfo.name,
      dialogue: getDialogue(actorInfo, "damage", formation.name)
    };
  }

  // Default movement
  if (randomAction < 0.9) {
    const newPosition = calculateNewPosition(enhancedActor.position, actorInfo.team, enemies, mechStats);
    return {
      type: "MOVE",
      pilotName: actorInfo.name,
      newPosition,
      dialogue: getDialogue(actorInfo, "movement", formation.name)
    };
  }

  // Default communication
  return {
    type: "COMMUNICATE",
    pilotName: actorInfo.name,
    dialogue: "대기 중..."
  };
}

function getDialogue(pilotInfo: PilotInfo, situation: string, formation?: string): string {
  const formationDialogues = {
    aggressive: {
      combat: ["전력 공격!", "집중 포화!", "돌파한다!"],
      movement: ["전진!", "포지션 공격!", "압박한다!"],
      damage: ["더 세게!", "반격 개시!", "물러나지 않는다!"]
    },
    defensive: {
      combat: ["방어선 유지!", "엄호 사격!", "수비 위치!"],
      movement: ["방어선 재배치!", "안전 지대로!", "수비 강화!"],
      damage: ["방어 체제!", "엄폐 필요!", "지원 요청!"]
    },
    mobile: {
      combat: ["기동 타격!", "히트 앤 런!", "측면 공격!"], 
      movement: ["빠르게 이동!", "우회 기동!", "위치 변경!"],
      damage: ["회피 기동!", "탈출 루트!", "재정비!"]
    },
    balanced: {
      combat: ["공격 개시!", "타겟 확인!", "사격!"],
      movement: ["이동 중!", "포지션 변경!", "재배치!"],
      damage: ["데미지 확인!", "시스템 체크!", "전투 지속!"]
    }
  };

  const formationKey = formation as keyof typeof formationDialogues || 'balanced';
  const situationKey = situation as keyof typeof formationDialogues.balanced;
  const options = formationDialogues[formationKey]?.[situationKey] || formationDialogues.balanced[situationKey] || ["..."];
  
  return options[Math.floor(Math.random() * options.length)];
}

function moveTowardsTarget(
  current: { x: number; y: number },
  target: { x: number; y: number },
  team: "ally" | "enemy",
  mechStats: { firepower: number; speed: number; armor: number }
): { x: number; y: number } {
  const moveDistance = Math.max(1, Math.floor(mechStats.speed / 30));
  
  // 타겟 방향으로 이동
  const dx = target.x > current.x ? moveDistance : target.x < current.x ? -moveDistance : 0;
  const dy = target.y > current.y ? moveDistance : target.y < current.y ? -moveDistance : 0;
  
  return {
    x: Math.max(2, Math.min(17, current.x + dx)), // 맵 경계: 2~17
    y: Math.max(1, Math.min(12, current.y + dy))  // 맵 경계: 1~12
  };
}

function calculateNewPosition(
  current: { x: number; y: number }, 
  team: "ally" | "enemy", 
  enemies: any[], 
  mechStats: { firepower: number; speed: number; armor: number }
): { x: number; y: number } {
  // Simple movement logic based on mech speed
  const moveDistance = Math.max(1, Math.floor(mechStats.speed / 30));
  const direction = team === "ally" ? 1 : -1;
  
  return {
    x: Math.max(2, Math.min(17, current.x + direction * moveDistance)), // 수정된 경계: 2~17
    y: Math.max(1, Math.min(12, current.y + (Math.random() > 0.5 ? 1 : -1))) // 수정된 경계: 1~12
  };
}

function checkVictoryCondition(participants: any[]) {
  const allyCount = participants.filter(p => p.team === 'team1' && p.status === 'active').length;
  const enemyCount = participants.filter(p => p.team === 'team2' && p.status === 'active').length;
  
  if (allyCount === 0) return 'defeat';
  if (enemyCount === 0) return 'victory';
  return null;
}

export function processGameTick(
  battleState: BattleState,
  pilots: Pilot[],
  terrainFeatures: TerrainFeature[]
): BattleState {
  const nextParticipants = battleState.participants.map(p => ({ ...p }));
  const newLog = [...battleState.log];

  const actions = battleState.participants
    .filter(p => p.status === 'active')
    .map(participant => {
      const pilotInfo = getPilotInfo(pilots, participant.pilotId, participant);
      const action = determineAIAction(participant, battleState, pilots, pilotInfo, terrainFeatures);
      return {
        ...action,
        pilotId: participant.pilotId, 
      };
    });

  actions.forEach(action => {
    const actor = nextParticipants.find(p => p.pilotId === action.pilotId);
    if (!actor) return;
    
    switch (action.type) {
      case 'MOVE':
        if (action.newPosition) {
          actor.position = action.newPosition;
          newLog.push({ timestamp: Date.now(), type: 'movement', message: action.dialogue || "...", speaker: action.pilotName });
        }
        break;
      case 'ATTACK':
        if (action.targetIndex !== undefined) {
          const target = nextParticipants[action.targetIndex];
          if (target && target.status === 'active') {
            const attackerAccuracy = actor.pilotStats?.accuracy || 70;
            const attackerFirepower = actor.firepower || 75;
            const targetArmor = target.armor || 70;
            const targetReaction = target.pilotStats?.reaction || 70;
            
            const hitChance = Math.max(0.1, Math.min(0.95, (attackerAccuracy - targetReaction + 50) / 100));
            
            if (Math.random() < hitChance) {
              const damage = Math.max(5, attackerFirepower - targetArmor + Math.random() * 20);
              target.hp = Math.max(0, target.hp - Math.floor(damage));
              
              if (target.hp === 0) {
                target.status = 'destroyed';
              } else if (target.hp < (target.maxHp || 100) * 0.3) {
                target.status = 'damaged';
              }
              
              newLog.push({
                timestamp: Date.now(),
                type: 'attack',
                message: `${action.dialogue} (${Math.floor(damage)} 데미지!)`,
                speaker: action.pilotName
              });
            } else {
              newLog.push({
                timestamp: Date.now(),
                type: 'attack',
                message: `${action.dialogue} (빗나감!)`,
                speaker: action.pilotName
              });
            }
          }
        }
        break;
      case 'COMMUNICATE':
        newLog.push({
          timestamp: Date.now(),
          type: 'communication',
          message: action.dialogue || "...",
          speaker: action.pilotName
        });
        break;
    }
  });

  const newState = {
    ...battleState,
    participants: nextParticipants,
    log: newLog,
  };

  const victory = checkVictoryCondition(newState.participants);
  if (victory) {
    newState.phase = 'completed';
    newState.log.push({
      timestamp: Date.now(),
      type: 'system',
      message: victory === 'victory' ? '승리!' : '패배...'
    });
  }
  
  newState.turn = battleState.turn + 1;
  
  return newState;
}
