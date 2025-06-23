// --------------- shared/ai/decision.ts ---------------
// Shared AI decision-making module utilised by both client-side and server-side runtime.
// All heuristics are *pure* – no side-effects, no I/O – so that they can be executed
// in browsers (WebWorker) and on the server deterministically.

import type { BattleState } from "@shared/schema";
import {
  calculateRetreatPosition,
  calculateScoutPosition,
  calculateTacticalPosition,
  selectBestTarget,
  canAttack,
  getTerrainAt,
  getTerrainAttackBonus,
  getTerrainDefenseBonus,
  type Position,
  type Personality,
  type TerrainFeature,
  type MechStats,
} from "./utils";

// Narrow participant interface required by the AI.
export interface Participant {
  pilotId: number;
  mechId?: number;
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
   * Terrain features for tactical decision making
   */
  terrainFeatures?: TerrainFeature[];
  /**
   * Mech stats lookup function
   */
  getMechStats?: (mechId: number) => MechStats;
}

/**
 * 지형 기반 전술적 우선순위 계산
 */
function calculateTerrainTacticalPriority(
  actor: Participant,
  terrainFeatures: TerrainFeature[],
  enemies: Participant[],
  mechStats?: MechStats
): { priority: string; bonus: number } {
  const currentTerrain = getTerrainAt(actor.position, terrainFeatures);
  
  // 현재 지형 분석
  if (currentTerrain?.type === 'elevation') {
    // 고지대에 있으면 유지하려고 함 (특히 장거리 메카)
    if (mechStats && mechStats.firepower >= 85) {
      return { priority: 'HOLD_POSITION', bonus: 0.4 };
    }
    return { priority: 'ATTACK', bonus: 0.3 }; // 고지대에서 공격 보너스
  }
  
  if (currentTerrain?.type === 'cover') {
    // 엄폐물에 있으면 방어적 행동 선호
    return { priority: 'DEFEND', bonus: 0.2 };
  }
  
  if (currentTerrain?.type === 'hazard') {
    // 위험지대에 있으면 즉시 이탈
    return { priority: 'RETREAT', bonus: 0.6 };
  }
  
  // 주변 지형 탐색: 고지대가 있는지 확인
  const nearbyElevation = terrainFeatures.find(t => 
    t.type === 'elevation' && 
    Math.abs(t.x - actor.position.x) <= 2 && 
    Math.abs(t.y - actor.position.y) <= 2
  );
  
  if (nearbyElevation && mechStats?.firepower && mechStats.firepower >= 70) {
    // 장거리 메카는 고지대로 이동하려고 함
    return { priority: 'MOVE_TO_ELEVATION', bonus: 0.3 };
  }
  
  return { priority: 'NORMAL', bonus: 0 };
}

/**
 * 사거리 기반 행동 결정
 */
function determineRangeBasedAction(
  actor: Participant,
  enemies: Participant[],
  mechStats: MechStats,
  terrainFeatures: TerrainFeature[]
): { canAttackAny: boolean; shouldAdvance: boolean; shouldRetreat: boolean } {
  if (enemies.length === 0) {
    return { canAttackAny: false, shouldAdvance: false, shouldRetreat: false };
  }
  
  const attackableEnemies = enemies.filter(enemy => 
    canAttack(actor, enemy, mechStats, terrainFeatures)
  );
  
  const nearestEnemyDistance = Math.min(
    ...enemies.map(e => 
      Math.abs(e.position.x - actor.position.x) + Math.abs(e.position.y - actor.position.y)
    )
  );
  
  // 장거리 메카 로직
  if (mechStats.firepower >= 85) {
    if (attackableEnemies.length > 0) {
      return { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };
    }
    if (nearestEnemyDistance <= 2) {
      return { canAttackAny: false, shouldAdvance: false, shouldRetreat: true }; // 너무 가까우면 후퇴
    }
    return { canAttackAny: false, shouldAdvance: true, shouldRetreat: false }; // 사거리로 이동
  }
  
  // 고속 기동 메카 로직
  if (mechStats.speed >= 80) {
    if (attackableEnemies.length > 0) {
      return { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };
    }
    return { canAttackAny: false, shouldAdvance: true, shouldRetreat: false }; // 적극적으로 접근
  }
  
  // 근접 메카 로직
  if (attackableEnemies.length > 0) {
    return { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };
  }
  return { canAttackAny: false, shouldAdvance: true, shouldRetreat: false }; // 접근 필요
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

  const pilotInitial = options.getPilotInitial(actor.pilotId);
  const personality = PERSONALITY_PRESETS[pilotInitial] ?? PERSONALITY_PRESETS["E"];
  
  // 메카 성능과 지형 정보 가져오기
  const mechStats = actor.mechId && options.getMechStats ? options.getMechStats(actor.mechId) : undefined;
  const terrainFeatures = options.terrainFeatures || [];

  const enemies = battleState.participants.filter((p: any) => {
    const isEnemy = team === "team1" || team === "ally" ? p.pilotId >= 100 : p.pilotId < 100;
    return isEnemy && p.status === "active";
  }) as Participant[];

  const allies = battleState.participants.filter((p: any) => {
    const isAlly = team === "team1" || team === "ally" ? p.pilotId < 100 : p.pilotId >= 100;
    return isAlly && p.status === "active" && p.pilotId !== actor.pilotId;
  }) as Participant[];

  const damagedAllies = allies.filter((a) => a.hp < 50);
  const nearbyEnemies = enemies.filter(
    (e) => Math.abs(e.position.x - actor.position.x) <= 2 && Math.abs(e.position.y - actor.position.y) <= 2,
  );

  // 지형 기반 전술적 우선순위 계산
  const terrainPriority = calculateTerrainTacticalPriority(actor, terrainFeatures, enemies, mechStats);
  
  // 사거리 기반 행동 분석
  const rangeAnalysis = mechStats ? 
    determineRangeBasedAction(actor, enemies, mechStats, terrainFeatures) : 
    { canAttackAny: true, shouldAdvance: false, shouldRetreat: false };

  // 1) 위험지대에 있으면 즉시 탈출
  if (terrainPriority.priority === 'RETREAT' || (actor.hp < 15 && rand() < 0.6)) {
    return {
      type: "RETREAT",
      pilotId: actor.pilotId,
      newPosition: calculateRetreatPosition(actor.position, team, enemies, terrainFeatures),
      message: actor.hp < 15 ? "긴급 후퇴! 재정비 필요!" : "위험지대 이탈!",
    };
  }
  
  // 2) 사거리 기반 후퇴 판단
  if (rangeAnalysis.shouldRetreat && rand() < 0.4) {
    return {
      type: "RETREAT",
      pilotId: actor.pilotId,
      newPosition: calculateRetreatPosition(actor.position, team, enemies, terrainFeatures),
      message: "거리 조절! 후퇴!",
    };
  }

  // 3) Support allies when persona allows
  if (personality.supportive > 0.6 && damagedAllies.length && rand() < 0.25) {
    const target = damagedAllies[0];
    return {
      type: "SUPPORT",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message: "지원 나간다! 버텨!",
    };
  }

  // 4) 고지대 유지 또는 방어
  if ((terrainPriority.priority === 'HOLD_POSITION' || terrainPriority.priority === 'DEFEND') && 
      nearbyEnemies.length >= 1 && rand() < (0.3 + terrainPriority.bonus)) {
    return {
      type: "DEFEND",
      pilotId: actor.pilotId,
      message: terrainPriority.priority === 'HOLD_POSITION' ? 
        "고지 사수! 포지션 유지!" : "방어 태세! 견고하게!",
    };
  }

  // 5) 고지대로 이동
  if (terrainPriority.priority === 'MOVE_TO_ELEVATION' && rand() < (0.25 + terrainPriority.bonus)) {
    return {
      type: "SCOUT",
      pilotId: actor.pilotId,
      newPosition: calculateScoutPosition(actor.position, team, enemies, terrainFeatures),
      message: "고지대 확보! 유리한 위치로!",
    };
  }

  // 6) Scouting – tactical advance
  if (personality.tactical > 0.7 && rand() < 0.25) {
    return {
      type: "SCOUT",
      pilotId: actor.pilotId,
      newPosition: calculateScoutPosition(actor.position, team, enemies, terrainFeatures),
      message: "정찰 이동! 상황 파악!",
    };
  }

  // 7) Special abilities after turn 5
  if (battleState.turn > 5 && rand() < 0.15) {
    const abilities = ["오버드라이브", "정밀 조준", "일제 사격", "은폐 기동"] as const;
    const ability = abilities[Math.floor(rand() * abilities.length)];
    return {
      type: "SPECIAL",
      pilotId: actor.pilotId,
      ability,
      message: `${ability} 발동!`,
    };
  }

  // 8) 사거리 내 공격 또는 접근
  if (rangeAnalysis.canAttackAny && enemies.length && rand() < 0.8) {
    const target = selectBestTarget(enemies, actor, personality, mechStats, terrainFeatures) as Participant;
    const attackBonus = getTerrainAttackBonus(actor.position, terrainFeatures);
    const message = attackBonus > 0 ? 
      "고지대에서 사격! 타겟 확인!" : 
      "타겟 확인! 공격 개시!";
    
    return {
      type: "ATTACK",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message,
    };
  }

  // 9) 사거리로 이동
  if (rangeAnalysis.shouldAdvance) {
    return {
      type: "MOVE",
      pilotId: actor.pilotId,
      newPosition: calculateTacticalPosition(actor.position, team, enemies, allies, terrainFeatures, mechStats),
      message: "사거리 확보! 포지션 이동!",
    };
  }

  // 10) Default tactical reposition
  return {
    type: "MOVE",
    pilotId: actor.pilotId,
    newPosition: calculateTacticalPosition(actor.position, team, enemies, allies, terrainFeatures, mechStats),
    message: "전술적 재배치!",
  };
} 