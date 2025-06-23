import type { BattleState, Pilot } from "@shared/schema";
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";
import type { PilotInfo, TerrainFeature, BattleParticipant } from "@shared/domain/types";
import { makeAIDecision } from "@shared/ai/decision";

function getPilotInfo(pilots: Pilot[], pilotId: number): PilotInfo {
  const pilot = pilots.find(p => p.id === pilotId);
  if (pilot) {
    return {
      id: pilot.id,
      name: pilot.name,
      callsign: pilot.callsign,
      team: pilotId < 100 ? "ally" : "enemy",
      initial: pilot.name.charAt(0).toUpperCase()
    };
  }
  
  // Fallback for missing pilots
  const isEnemy = pilotId >= 100;
  return {
    id: pilotId,
    name: isEnemy ? `Enemy ${pilotId - 100}` : `Pilot ${pilotId}`,
    callsign: isEnemy ? `E-${pilotId - 100}` : `P-${pilotId}`,
    team: isEnemy ? "enemy" : "ally",
    initial: isEnemy ? "E" : "P"
  };
}

// 메카 스탯 데이터베이스 (클라이언트용)
const CLIENT_MECH_STATS: { [mechId: number]: { firepower: number; speed: number; armor: number } } = {
  1: { firepower: 85, speed: 60, armor: 75 }, // Knight type
  2: { firepower: 90, speed: 55, armor: 70 }, // Arbiter type
  3: { firepower: 75, speed: 90, armor: 65 }, // River type
  4: { firepower: 80, speed: 70, armor: 80 }, // Balanced type
  5: { firepower: 95, speed: 50, armor: 75 }, // Heavy artillery
  6: { firepower: 70, speed: 85, armor: 60 }, // Scout type
  7: { firepower: 88, speed: 65, armor: 78 }, // Assault type
  8: { firepower: 92, speed: 58, armor: 72 }, // Sniper type
  // 적 메카들 (100번대)
  101: { firepower: 82, speed: 68, armor: 73 },
  102: { firepower: 87, speed: 62, armor: 76 },
  103: { firepower: 78, speed: 83, armor: 68 },
};

function determineAIAction(actor: any, battleState: any, pilots: Pilot[], actorInfo: PilotInfo, terrainFeatures: TerrainFeature[]) {
  // 새로운 AI 시스템 사용
  const sharedDecision = makeAIDecision(
    {
      pilotId: actor.pilotId,
      mechId: actor.mechId,
      position: actor.position,
      hp: actor.hp,
      status: actor.status
    },
    battleState,
    actor.team,
    {
      getPilotInitial: (id: number) => {
        if (id === 1) return "S";
        if (id === 2) return "M"; 
        if (id === 3) return "A";
        return id >= 100 ? "E" : "A";
      },
      terrainFeatures: terrainFeatures,
      getMechStats: (mechId: number) => {
        return CLIENT_MECH_STATS[mechId] || { firepower: 75, speed: 70, armor: 70 };
      }
    }
  );

  // shared decision을 기존 형식으로 변환
  const enemies = battleState.participants.filter((p: any) => p.team !== actor.team && p.status === 'active');
  
  if (sharedDecision.type === 'ATTACK' && sharedDecision.targetId) {
    const target = battleState.participants.find((p: any) => p.pilotId === sharedDecision.targetId);
    return {
      type: 'ATTACK',
      actor,
      target,
      message: sharedDecision.message
    };
  }
  
  if (sharedDecision.type === 'SUPPORT' && sharedDecision.targetId) {
    const target = battleState.participants.find((p: any) => p.pilotId === sharedDecision.targetId);
    return {
      type: 'SUPPORT',
      actor,
      target,
      message: sharedDecision.message
    };
  }
  
  if (sharedDecision.newPosition) {
    return {
      type: sharedDecision.type,
      actor,
      newPosition: sharedDecision.newPosition,
      message: sharedDecision.message,
      ability: sharedDecision.ability
    };
  }
  
  return {
    type: sharedDecision.type,
    actor,
    message: sharedDecision.message,
    ability: sharedDecision.ability
  };
}

function checkVictoryCondition(participants: any[]) {
  const allies = participants.filter((p: any) => p.team === "team1" && p.status === "active");
  const enemies = participants.filter((p: any) => p.team === "team2" && p.status === "active");
   
  if (allies.length === 0 || enemies.length === 0) {
    return {
      isGameOver: true,
      winner: allies.length > 0 ? 'ally' : 'enemy',
    };
  }
 
  return { isGameOver: false, winner: null };
};

export function processGameTick(
  battleState: BattleState,
  pilots: Pilot[],
  terrainFeatures: TerrainFeature[]
): BattleState {
  // If the battle is already marked as completed, do not process further ticks.
  if (battleState.phase === "completed") {
    return battleState;
  }

  const newState = {
    ...battleState,
    log: [...battleState.log],
    participants: JSON.parse(JSON.stringify(battleState.participants)),
  };

  const currentTime = Date.now();
  const activeUnits = newState.participants.filter((p: BattleParticipant) => p.status === 'active');
  
  if (activeUnits.length === 0) {
    return battleState; // no-op
  }
  
  // 1초 쿨다운 시스템
  const availableUnits = activeUnits.filter((unit: any) => {
    const lastActionTime = unit.lastActionTime || 0;
    const cooldownTime = 1000; // 1초 쿨다운
    return currentTime - lastActionTime > cooldownTime;
  });

  if (availableUnits.length > 0 && Math.random() < 0.6) { // 60% 확률로 행동
    const actor = availableUnits[Math.floor(Math.random() * availableUnits.length)];
    const actorInfo = getPilotInfo(pilots, actor.pilotId);
    
    const aiAction = determineAIAction(actor, newState, pilots, actorInfo, terrainFeatures);
    
    // Process action
    actor.lastActionTime = currentTime;

    if (aiAction.type === 'ATTACK' && aiAction.target) {
      const target = aiAction.target;
      const attacker = aiAction.actor;
      
      // 사거리 체크
      const distance = Math.abs(attacker.position.x - target.position.x) + 
                       Math.abs(attacker.position.y - target.position.y);
      const mechStats = CLIENT_MECH_STATS[attacker.mechId] || { firepower: 75, speed: 70, armor: 70 };
      
      // 기본 사거리 계산
      let baseRange = 2;
      if (mechStats.firepower >= 85) baseRange = 4;
      else if (mechStats.firepower >= 70) baseRange = 3;
      
      // 지형 사거리 보너스
      const attackerTerrain = terrainFeatures.find(t => 
        t.x === attacker.position.x && t.y === attacker.position.y
      );
      const rangeBonus = attackerTerrain?.type === 'elevation' ? 1 : 0;
      const finalRange = baseRange + rangeBonus;
      
      // 사거리 내에 있는 경우에만 공격
      if (distance <= finalRange) {
        const targetTerrain = terrainFeatures.find(t => 
          t.x === target.position.x && t.y === target.position.y
        );

        let baseDamage = Math.floor(Math.random() * 30) + 10;
        let finalDamage = baseDamage;
        
        // 메카 화력 보너스
        if (mechStats.firepower >= 85) {
          finalDamage += Math.floor(baseDamage * 0.3); // 30% 화력 보너스
        } else if (mechStats.firepower >= 70) {
          finalDamage += Math.floor(baseDamage * 0.15); // 15% 화력 보너스
        }
        
        // 지형 공격 보너스
        if (attackerTerrain?.type === 'elevation') {
          finalDamage += Math.floor(baseDamage * 0.2);
        }
        
        // 지형 방어 보너스
        if (targetTerrain?.type === 'cover') {
          finalDamage = Math.floor(finalDamage * 0.8);
        }
        
        if (targetTerrain?.type === 'hazard') {
          finalDamage += 5;
        }

        const targetParticipant = newState.participants.find((p: BattleParticipant) => p.pilotId === target.pilotId);
        if (targetParticipant) {
          targetParticipant.hp = Math.max(0, targetParticipant.hp - finalDamage);
          if (targetParticipant.hp === 0) {
            targetParticipant.status = 'destroyed';
          }
        }

        const logMessage = `${aiAction.message} ${finalDamage} 데미지! (사거리: ${distance}/${finalRange})${
          attackerTerrain?.type === 'elevation' ? ' [고지대]' : ''
        }${targetTerrain?.type === 'cover' ? ' [엄폐]' : ''}${
          targetTerrain?.type === 'hazard' ? ' [위험지대]' : ''
        }`;
        
        newState.log.push({
          timestamp: Date.now(),
          type: 'attack',
          message: logMessage,
          speaker: actorInfo.name
        });
      } else {
        // 사거리 밖이면 공격 실패
        newState.log.push({
          timestamp: Date.now(),
          type: 'system',
          message: `${actorInfo.name}: 사거리 밖! (거리: ${distance}, 사거리: ${finalRange})`,
          speaker: actorInfo.name
        });
      }
    }
    else if (aiAction.type === 'SUPPORT' && aiAction.target) {
      const targetParticipant = newState.participants.find((p: BattleParticipant) => p.pilotId === aiAction.target.pilotId);
      if(targetParticipant) {
        targetParticipant.hp = Math.min(100, targetParticipant.hp + 15);
      }
       newState.log.push({
        timestamp: Date.now(),
        type: 'system',
        message: aiAction.message,
        speaker: actorInfo.name
      });
    }
    else if (aiAction.type === 'RETREAT' || aiAction.type === 'SCOUT' || aiAction.type === 'MOVE') {
      const actorParticipant = newState.participants.find((p: BattleParticipant) => p.pilotId === actor.pilotId);
      if(actorParticipant) {
        actorParticipant.position = aiAction.newPosition || actor.position;
      }
      newState.log.push({
        timestamp: Date.now(),
        type: 'movement',
        message: aiAction.message,
        speaker: actorInfo.name
      });
    }
    else {
       newState.log.push({
        timestamp: Date.now(),
        type: 'communication',
        message: aiAction.message,
        speaker: actorInfo.name
      });
    }

    const victoryCheck = checkVictoryCondition(newState.participants);
    if (victoryCheck.isGameOver) {
      newState.phase = 'completed';
      newState.log.push({
        timestamp: Date.now(),
        type: 'system',
        message: `🎉 전투 종료! ${victoryCheck.winner === 'ally' ? '아군' : '적군'} 승리!`,
      });
    }
  }

  newState.turn += 1;
  return newState;
}
