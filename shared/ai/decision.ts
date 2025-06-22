// --------------- shared/ai/decision.ts ---------------
// Shared AI decision-making module utilised by both client-side and server-side runtime.
// All heuristics are *pure* – no side-effects, no I/O – so that they can be executed
// in browsers (WebWorker) and on the server deterministically.

import type { BattleState } from "@shared/schema";
import { isEnemyPilot, normalizeTeamName, type TeamIdentifier } from "@shared/types/battle";
import {
  calculateRetreatPosition,
  calculateScoutPosition,
  calculateTacticalPosition,
  selectBestTarget,
  evaluateTerrainAdvantage,
  isInRange,
  hasLineOfSight,
  type Position,
  type Personality,
  type TerrainFeature,
} from "./utils";

// Narrow participant interface required by the AI.
export interface Participant {
  pilotId: number;
  position: Position;
  hp: number;
  status: "active" | "damaged" | "destroyed";
}

export interface AIDecision {
  type:
    | "MOVE"
    | "ATTACK"
    | "COMMUNICATE"
    | "DEFEND"
    | "SUPPORT"
    | "SCOUT"
    | "RETREAT"
    | "SPECIAL";
  pilotId: number;
  /** Human-readable name if available. Optional to keep the function pure */
  pilotName?: string;
  newPosition?: Position;
  targetId?: number;
  ability?: string;
  message: string;
}

// Lightweight personality presets that can be shared between environments.
const PERSONALITY_PRESETS: Record<string, Personality> = {
  S: { aggressive: 0.8, tactical: 0.6, supportive: 0.4 },
  M: { aggressive: 0.4, tactical: 0.9, supportive: 0.8 },
  A: { aggressive: 0.9, tactical: 0.3, supportive: 0.5 },
  E: { aggressive: 0.6, tactical: 0.5, supportive: 0.2 },
};

export interface MakeDecisionOptions {
  /**
   * Returns a human-readable pilot initial used to lookup personality presets.
   * This keeps the shared module agnostic from any global pilot roster.
   */
  getPilotInitial: (pilotId: number) => string;
  /**
   * Optional random function injection for deterministic testing.
   */
  random?: () => number;
  /**
   * Terrain features for tactical positioning
   */
  terrainFeatures?: TerrainFeature[];
}

// Enhanced contextual dialogue system
const CONTEXTUAL_DIALOGUES = {
  aggressive_attack: ["정면 돌파!", "밀어붙인다!", "전면 공격!"],
  tactical_attack: ["계산된 타격!", "약점 노린다!", "전술적 공격!"],
  supportive_attack: ["지원 사격!", "커버 공격!", "동료를 위해!"],
  
  aggressive_retreat: ["재정비 후 복귀!", "잠시 물러선다!", "다시 돌아온다!"],
  tactical_retreat: ["전략적 후퇴!", "상황 재분석!", "포지션 재조정!"],
  supportive_retreat: ["팀 안전 우선!", "동료들 보호!", "재집결 필요!"],
  
  aggressive_move: ["전진!", "돌격 루트 확보!", "앞으로!"],
  tactical_move: ["최적 위치 이동!", "전략적 재배치!", "계산된 이동!"],
  supportive_move: ["팀 지원 위치로!", "동료 근처로!", "연계 포지션!"],
  
  aggressive_support: ["힘내라!", "같이 밀어붙이자!", "포기하지 마!"],
  tactical_support: ["지원 완료!", "상황 개선!", "효율적 지원!"],
  supportive_support: ["도와줄게!", "함께 버텨!", "지원 나간다!"],
  
  aggressive_defend: ["맞서 싸운다!", "정면승부!", "버텨낸다!"],
  tactical_defend: ["방어 태세 완료!", "견고한 방어!", "계산된 방어!"],
  supportive_defend: ["팀 보호!", "동료 엄호!", "방어선 구축!"],
  
  aggressive_scout: ["적진 돌파!", "정찰 강행!", "길을 뚫겠다!"],
  tactical_scout: ["정보 수집!", "상황 파악!", "전술 정찰!"],
  supportive_scout: ["팀을 위한 정찰!", "안전 확인!", "동료 지원 정찰!"],
  
  elevation_advantage: ["고지 확보!", "시야 확보 완료!", "유리한 위치!"],
  cover_defense: ["엄폐 완료!", "방어 태세!", "견고한 방어선!"],
  hazard_warning: ["위험 지역 감지!", "주의 필요!", "안전거리 확보!"],
  
  no_line_of_sight: ["시야 확보 필요!", "장애물 우회!", "포지션 변경!"],
  range_optimal: ["사거리 내 진입!", "교전 거리 확보!", "공격 준비!"],
  formation_maintain: ["대형 유지!", "팀워크 중시!", "연계 작전!"]
};

function getContextualDialogue(
  actionType: string,
  personality: Personality,
  context: {
    hasElevation?: boolean;
    inCover?: boolean;
    inHazard?: boolean;
    hasLineOfSight?: boolean;
    inRange?: boolean;
  }
): string {
  const dialogues: string[] = [];
  
  // Terrain-based dialogues
  if (context.hasElevation) dialogues.push(...CONTEXTUAL_DIALOGUES.elevation_advantage);
  if (context.inCover) dialogues.push(...CONTEXTUAL_DIALOGUES.cover_defense);
  if (context.inHazard) dialogues.push(...CONTEXTUAL_DIALOGUES.hazard_warning);
  if (!context.hasLineOfSight) dialogues.push(...CONTEXTUAL_DIALOGUES.no_line_of_sight);
  if (context.inRange) dialogues.push(...CONTEXTUAL_DIALOGUES.range_optimal);
  
  // Personality-based action dialogues
  const personalityKey = personality.aggressive > 0.7 ? 'aggressive' : 
                        personality.tactical > 0.7 ? 'tactical' : 'supportive';
  
  const actionKey = `${personalityKey}_${actionType}` as keyof typeof CONTEXTUAL_DIALOGUES;
  if (CONTEXTUAL_DIALOGUES[actionKey]) {
    dialogues.push(...CONTEXTUAL_DIALOGUES[actionKey]);
  }
  
  return dialogues.length > 0 ? 
    dialogues[Math.floor(Math.random() * dialogues.length)] :
    "행동 개시!";
}

/**
 * Shared AI behaviour engine.  Consumed by both `/server/domain/AISystem.ts` and the
 * client Battle Simulation.
 */
export function makeAIDecision(
  actor: Participant,
  battleState: BattleState,
  team: string,
  options: MakeDecisionOptions,
): AIDecision {
  const rand = options.random ?? Math.random;
  const terrainFeatures = options.terrainFeatures || [];
  const normalizedTeam = normalizeTeamName(team);

  const pilotInitial = options.getPilotInitial(actor.pilotId);
  const personality = PERSONALITY_PRESETS[pilotInitial] ?? PERSONALITY_PRESETS["E"];

  // Use consistent team identification
  const enemies = battleState.participants.filter((p: any) => {
    return isEnemyPilot(p.pilotId, normalizedTeam) && p.status === "active";
  }) as Participant[];

  const allies = battleState.participants.filter((p: any) => {
    return !isEnemyPilot(p.pilotId, normalizedTeam) && p.status === "active" && p.pilotId !== actor.pilotId;
  }) as Participant[];

  // Enhanced context analysis
  const currentTerrain = evaluateTerrainAdvantage(actor.position, terrainFeatures);
  const inCover = currentTerrain < 1.0;
  const hasElevation = currentTerrain > 1.0;
  const inHazard = terrainFeatures.some(t => 
    t.x === actor.position.x && t.y === actor.position.y && t.type === 'hazard'
  );

  // Analyze nearby threats and opportunities
  const nearbyEnemies = enemies.filter(
    (e) => Math.abs(e.position.x - actor.position.x) <= 3 && 
           Math.abs(e.position.y - actor.position.y) <= 3
  );

  const enemiesInRange = enemies.filter(enemy => 
    isInRange(actor.position, enemy.position, 3) &&
    hasLineOfSight(actor.position, enemy.position, terrainFeatures)
  );

  const damagedAllies = allies.filter((a) => a.hp < 50);

  // Priority 1: Emergency retreat from hazards or when critically low HP
  if (inHazard && rand() < 0.8) {
    return {
      type: "RETREAT",
      pilotId: actor.pilotId,
      newPosition: calculateRetreatPosition(actor.position, normalizedTeam, enemies),
      message: getContextualDialogue("retreat", personality, { inHazard: true }),
    };
  }

  if (actor.hp < 15 && rand() < 0.7) {
    return {
      type: "RETREAT",
      pilotId: actor.pilotId,
      newPosition: calculateRetreatPosition(actor.position, normalizedTeam, enemies),
      message: getContextualDialogue("retreat", personality, { inCover }),
    };
  }

  // Priority 2: Support allies when persona allows and tactically sound
  if (personality.supportive > 0.6 && damagedAllies.length && rand() < 0.3) {
    const target = damagedAllies[0];
    const hasLineToAlly = hasLineOfSight(actor.position, target.position, terrainFeatures);
    if (hasLineToAlly) {
      return {
        type: "SUPPORT",
        pilotId: actor.pilotId,
        targetId: target.pilotId,
        message: getContextualDialogue("support", personality, { hasLineOfSight: hasLineToAlly }),
      };
    }
  }

  // Priority 3: Defensive stance if surrounded or in good cover
  if (nearbyEnemies.length >= 2 && (inCover || rand() < 0.3)) {
    return {
      type: "DEFEND",
      pilotId: actor.pilotId,
      message: getContextualDialogue("defend", personality, { inCover, hasElevation }),
    };
  }

  // Priority 4: Optimal attack when targets available and conditions favorable
  if (enemiesInRange.length > 0 && rand() < 0.85) {
    const target = selectBestTarget(enemiesInRange, actor, personality, terrainFeatures) as Participant;
    const targetLineOfSight = hasLineOfSight(actor.position, target.position, terrainFeatures);
    
    return {
      type: "ATTACK",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message: getContextualDialogue("attack", personality, { 
        hasElevation, 
        inRange: true, 
        hasLineOfSight: targetLineOfSight 
      }),
    };
  }

  // Priority 5: Scouting for tactical advantage
  if (personality.tactical > 0.7 && !hasElevation && rand() < 0.4) {
    return {
      type: "SCOUT",
      pilotId: actor.pilotId,
      newPosition: calculateScoutPosition(actor.position, normalizedTeam, enemies),
      message: getContextualDialogue("scout", personality, { hasElevation: false }),
    };
  }

  // Priority 6: Special abilities when tactically advantageous
  if (battleState.turn > 5 && (hasElevation || inCover) && rand() < 0.2) {
    const abilities = ["오버드라이브", "정밀 조준", "일제 사격", "은폐 기동"] as const;
    const ability = abilities[Math.floor(rand() * abilities.length)];
    return {
      type: "SPECIAL",
      pilotId: actor.pilotId,
      ability,
      message: `${ability} 발동!`,
    };
  }

  // Priority 7: Attack any available target (even out of optimal range)
  if (enemies.length && rand() < 0.7) {
    const target = selectBestTarget(enemies, actor, personality, terrainFeatures) as Participant;
    const targetLineOfSight = hasLineOfSight(actor.position, target.position, terrainFeatures);
    
    return {
      type: "ATTACK",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message: getContextualDialogue("attack", personality, { 
        hasLineOfSight: targetLineOfSight,
        inRange: false
      }),
    };
  }

  // Priority 8: Tactical repositioning with terrain awareness
  return {
    type: "MOVE",
    pilotId: actor.pilotId,
    newPosition: calculateTacticalPosition(actor.position, normalizedTeam, enemies, allies, terrainFeatures),
    message: getContextualDialogue("move", personality, { hasElevation, inCover }),
  };
} 