import type { BattleState, Pilot } from "@shared/schema";
import { makeAIDecision } from "@shared/ai/decision";
import { calculateRetreatPosition, calculateScoutPosition, calculateTacticalPosition, selectBestTarget } from "@shared/ai/utils";
import { TERRAIN_FEATURES } from "@shared/terrain/config";
import { type SafeBattleParticipant, type SafeAIAction, isEnemyPilot } from "@shared/types/battle";
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

function determineAIAction(
  actor: SafeBattleParticipant, 
  battleState: BattleState, 
  pilots: Pilot[], 
  actorInfo: PilotInfo
): SafeAIAction {
  // Use the enhanced shared AI decision system
  const sharedDecision = makeAIDecision(actor, battleState, actor.team, {
    getPilotInitial: (id: number) => actorInfo.initial,
    terrainFeatures: TERRAIN_FEATURES,
  });

  // Convert shared decision format to client format with proper type safety
  const targetActor = sharedDecision.targetId 
    ? battleState.participants.find((p: any) => p.pilotId === sharedDecision.targetId) as SafeBattleParticipant
    : undefined;

  return {
    type: sharedDecision.type,
    actor,
    target: targetActor,
    newPosition: sharedDecision.newPosition,
    ability: sharedDecision.ability,
    message: sharedDecision.message
  };
};

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
  const activeUnits = newState.participants.filter((p: BattleParticipant) => p.status === 'active') as SafeBattleParticipant[];
  
  if (activeUnits.length === 0) {
    return battleState; // no-op
  }
  
  // 1초 쿨다운 시스템
  const availableUnits = activeUnits.filter((unit: SafeBattleParticipant) => {
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
      
      const attackerTerrain = TERRAIN_FEATURES.find(t => 
        t.x === attacker.position.x && t.y === attacker.position.y
      );
      const targetTerrain = TERRAIN_FEATURES.find(t => 
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
