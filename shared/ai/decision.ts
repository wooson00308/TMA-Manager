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
  type Position,
  type Personality,
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

  // 1) Emergency retreat when critically low HP
  if (actor.hp < 15 && rand() < 0.6) {
    return {
      type: "RETREAT",
      pilotId: actor.pilotId,
      newPosition: calculateRetreatPosition(actor.position, team, enemies),
      message: "긴급 후퇴! 재정비 필요!",
    };
  }

  // 2) Support allies when persona allows
  if (personality.supportive > 0.6 && damagedAllies.length && rand() < 0.25) {
    const target = damagedAllies[0];
    return {
      type: "SUPPORT",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message: "지원 나간다! 버텨!",
    };
  }

  // 3) Defensive stance if surrounded
  if (nearbyEnemies.length >= 2 && rand() < 0.2) {
    return {
      type: "DEFEND",
      pilotId: actor.pilotId,
      message: "방어 태세! 견고하게!",
    };
  }

  // 4) Scouting – tactical advance
  if (personality.tactical > 0.7 && rand() < 0.3) {
    return {
      type: "SCOUT",
      pilotId: actor.pilotId,
      newPosition: calculateScoutPosition(actor.position, team, enemies),
      message: "정찰 이동! 상황 파악!",
    };
  }

  // 5) Special abilities after turn 5
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

  // 6) Default – attack highest priority target
  if (enemies.length && rand() < 0.8) {
    const target = selectBestTarget(enemies, actor, personality) as Participant;
    return {
      type: "ATTACK",
      pilotId: actor.pilotId,
      targetId: target.pilotId,
      message: "타겟 확인! 공격 개시!",
    };
  }

  // 7) Tactical reposition
  return {
    type: "MOVE",
    pilotId: actor.pilotId,
    newPosition: calculateTacticalPosition(actor.position, team, enemies, allies),
    message: "포지션 조정!",
  };
} 