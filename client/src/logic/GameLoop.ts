import type { BattleState, Pilot } from "@shared/schema";
import type { TerrainFeature, PilotInfo, BattleParticipant } from "@shared/domain/types";
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";
import { makeAIDecision } from "@shared/ai/decision";

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

  // Use actual mech stats from participant instead of hardcoded values
  const mechStats = {
    firepower: actor.firepower || 75,
    speed: actor.speed || 70,
    armor: actor.armor || 70
  };

  const randomAction = Math.random();
  const isLowHP = actor.hp < (actor.maxHp || 100) * 0.3;
  const isEarlyBattle = battleState.turn < 3;

  // Early battle communication
  if (isEarlyBattle && randomAction < 0.3) {
    return {
      type: "COMMUNICATE",
      pilotName: actorInfo.name,
      dialogue: getDialogue(actorInfo, "combat")
    };
  }

  // Low HP reaction
  if (isLowHP && randomAction < 0.4) {
    return {
      type: "COMMUNICATE",
      pilotName: actorInfo.name,
      dialogue: getDialogue(actorInfo, "damage")
    };
  }

  // Attack if enemies in range
  if (randomAction < 0.5 && enemies.length > 0) {
    const target = enemies[0];
    const distance = Math.abs(target.position.x - actor.position.x) + Math.abs(target.position.y - actor.position.y);
    
    // Use actual range from participant
    if (distance <= (actor.range || 50)) {
      const targetIndex = battleState.participants.findIndex((p: any) => p.pilotId === target.pilotId);
      return {
        type: "ATTACK",
        pilotName: actorInfo.name,
        targetIndex,
        dialogue: getDialogue(actorInfo, "combat")
      };
    }
  }

  // Movement
  if (randomAction < 0.8) {
    const newPosition = calculateNewPosition(actor.position, actorInfo.team, enemies, mechStats);
    return {
      type: "MOVE",
      pilotName: actorInfo.name,
      newPosition,
      dialogue: getDialogue(actorInfo, "movement")
    };
  }

  // Default communication
  return {
    type: "COMMUNICATE",
    pilotName: actorInfo.name,
    dialogue: "대기 중..."
  };
}

function getDialogue(pilotInfo: PilotInfo, situation: string): string {
  const dialogues = {
    combat: ["공격 개시!", "타겟 확인!", "사격!"],
    movement: ["이동 중!", "포지션 변경!", "재배치!"],
    damage: ["데미지 확인!", "시스템 체크!", "전투 지속!"],
    victory: ["승리!", "임무 완료!", "성공!"]
  };

  const options = dialogues[situation as keyof typeof dialogues] || ["..."];
  return options[Math.floor(Math.random() * options.length)];
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
    x: Math.max(1, Math.min(18, current.x + direction * moveDistance)),
    y: Math.max(1, Math.min(10, current.y + (Math.random() > 0.5 ? 1 : -1)))
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
  const newState = { ...battleState };
  
  // Process each active participant
  newState.participants = newState.participants.map(participant => {
    if (participant.status !== 'active') return participant;
    
    const pilotInfo = getPilotInfo(pilots, participant.pilotId, participant);
    const action = determineAIAction(participant, newState, pilots, pilotInfo, terrainFeatures);
    
    // Execute action
    const newParticipant = { ...participant };
    
    switch (action.type) {
      case 'MOVE':
        if (action.newPosition) {
          newParticipant.position = action.newPosition;
        }
        break;
        
      case 'ATTACK':
        if (action.targetIndex !== undefined) {
          const target = newState.participants[action.targetIndex];
          if (target) {
            // Calculate damage using actual pilot and mech stats
            const attackerAccuracy = participant.pilotStats?.accuracy || 70;
            const attackerFirepower = participant.firepower || 75;
            const targetArmor = target.armor || 70;
            const targetReaction = target.pilotStats?.reaction || 70;
            
            // Hit chance calculation
            const hitChance = Math.max(0.1, Math.min(0.95, (attackerAccuracy - targetReaction + 50) / 100));
            
            if (Math.random() < hitChance) {
              const damage = Math.max(5, attackerFirepower - targetArmor + Math.random() * 20);
              target.hp = Math.max(0, target.hp - Math.floor(damage));
              
              if (target.hp === 0) {
                target.status = 'destroyed';
              } else if (target.hp < (target.maxHp || 100) * 0.3) {
                target.status = 'damaged';
              }
              
              newState.log.push({
                timestamp: Date.now(),
                type: 'attack',
                message: `${action.dialogue} (${Math.floor(damage)} 데미지!)`,
                speaker: action.pilotName
              });
            } else {
              newState.log.push({
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
        newState.log.push({
          timestamp: Date.now(),
          type: 'communication',
          message: action.dialogue || "...",
          speaker: action.pilotName
        });
        break;
    }
    
    return newParticipant;
  });
  
  // Check victory condition
  const victory = checkVictoryCondition(newState.participants);
  if (victory) {
    newState.phase = 'completed';
    newState.log.push({
      timestamp: Date.now(),
      type: 'system',
      message: victory === 'victory' ? '승리!' : '패배...'
    });
  }
  
  // Increment turn
  newState.turn = battleState.turn + 1;
  
  return newState;
}
