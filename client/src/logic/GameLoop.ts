import type { BattleState, Pilot } from "@shared/schema";
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";
import type { PilotInfo, TerrainFeature, BattleParticipant } from "@shared/domain/types";

function getPilotInfo(pilots: Pilot[], pilotId: number): PilotInfo {
  const found = pilots.find((p) => p.id === pilotId);

  // Determine allegiance purely by convention: IDs >= 100 belong to enemy units.
  const isEnemy = pilotId >= 100;

  if (found) {
    return {
      id: found.id,
      name: found.name,
      callsign: found.callsign,
      team: isEnemy ? "enemy" : "ally",
      initial: isEnemy ? "E" : found.name.charAt(0).toUpperCase(),
    };
  }

  // Fallback placeholder when pilot data is missing from store
  return {
    id: pilotId,
    name: isEnemy ? `Enemy ${pilotId}` : `Pilot ${pilotId}`,
    callsign: isEnemy ? `E${pilotId}` : `P${pilotId}`,
    team: isEnemy ? "enemy" : "ally",
    initial: isEnemy ? "E" : String.fromCharCode(65 + (pilotId % 26)),
  };
};

function determineAIAction(actor: any, battleState: any, pilots: Pilot[], actorInfo: PilotInfo) {
  const isLowHP = actor.hp < 30;
  const isCriticalHP = actor.hp < 15;
  const allies = battleState.participants.filter((p: any) => {
    const info = getPilotInfo(pilots, p.pilotId);
    return info.team === actorInfo.team && p.status === 'active' && p.pilotId !== actor.pilotId;
  });
  const enemies = battleState.participants.filter((p: any) => {
    const info = getPilotInfo(pilots, p.pilotId);
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

function checkVictoryCondition(participants: any[], pilots: Pilot[]) {
  const allies = participants.filter(p => {
    const info = getPilotInfo(pilots, p.pilotId);
    return info.team === 'ally' && p.status === 'active';
  });
  const enemies = participants.filter(p => {
    const info = getPilotInfo(pilots, p.pilotId);
    return info.team === 'enemy' && p.status === 'active';
  });

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
    
    const aiAction = determineAIAction(actor, newState, pilots, actorInfo);
    
    // Process action
    actor.lastActionTime = currentTime;

    if (aiAction.type === 'ATTACK' && aiAction.target) {
      const target = aiAction.target;
      const attacker = aiAction.actor;
      
      const attackerTerrain = terrainFeatures.find(t => 
        t.x === attacker.position.x && t.y === attacker.position.y
      );
      const targetTerrain = terrainFeatures.find(t => 
        t.x === target.position.x && t.y === target.position.y
      );

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

      const targetParticipant = newState.participants.find((p: BattleParticipant) => p.pilotId === target.pilotId);
      if (targetParticipant) {
        targetParticipant.hp = Math.max(0, targetParticipant.hp - finalDamage);
        if (targetParticipant.hp === 0) {
          targetParticipant.status = 'destroyed';
        }
      }

      const logMessage = `${aiAction.message} ${finalDamage} 데미지!${
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

    const victoryCheck = checkVictoryCondition(newState.participants, pilots);
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
