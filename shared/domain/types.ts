// Domain-level shared type definitions
// These types represent runtime game state, not persisted database schema.

// Scenes available in the front-end client
export type GameScene =
  | "hub"
  | "scouting"
  | "formation"
  | "recon"
  | "banpick"
  | "battle"
  | "analysis"
  | "match_prep";

// High-level pilot personality, role and faction traits
export type PilotTrait =
  | "AGGRESSIVE"
  | "CAUTIOUS"
  | "ANALYTICAL"
  | "COOPERATIVE"
  | "INDEPENDENT"
  | "ASSAULT"
  | "DEFENSIVE"
  | "SUPPORT"
  | "SNIPER"
  | "SCOUT"
  | "KNIGHT"
  | "RIVER"
  | "ARBITER"
  | "ACE"
  | "VETERAN"
  | "ROOKIE"
  | "GENIUS";

// Basic position type
export interface Position {
  x: number;
  y: number;
}

export type BattleParticipant = {
  pilotId: number;
  mechId: number;
  /**
   * Which side this unit belongs to.  The server marks participants during
   * battle initialisation so the client no longer needs to infer allegiance
   * from the pilotId heuristic.
   */
  team: "team1" | "team2";
  position: Position;
  hp: number;
  maxHp: number;
  armor: number;
  speed: number;
  firepower: number;
  range: number;
  status: "active" | "damaged" | "destroyed";
  lastActionTime?: number;
  pilotStats?: {
    reaction: number;
    accuracy: number;
    tactical: number;
    teamwork: number;
    traits: string[];
  };
};

// Runtime battle state that is streamed between client and server
export type BattleState = {
  id: string;
  phase: "preparation" | "active" | "completed";
  turn: number;
  participants: BattleParticipant[];
  teamFormations?: {
    team1: TacticalFormation;
    team2: TacticalFormation;
  };
  log: Array<{
    timestamp: number;
    type: "movement" | "attack" | "communication" | "system";
    message: string;
    speaker?: string;
  }>;
  events?: BattleEvent[]; // New field for structured events
};

export interface PilotInfo {
  id: number;
  name: string;
  callsign: string;
  team: "ally" | "enemy";
  initial: string;
}

export interface TerrainFeature {
  x: number;
  y: number;
  type: "cover" | "obstacle" | "elevation" | "hazard";
  effect: string;
}

// Recon data passed from scouting analysis to match-prep scene
export type ReconData = {
  teamName: string;
  recentWins: number;
  recentLosses: number;
  preferredComposition: string[];
  weaknesses: string[];
  corePilots: Array<{
    name: string;
    traits: string[];
    winRate: number;
  }>;
};

// Tactical Formation types
export type TacticalFormationName = 'balanced' | 'aggressive' | 'defensive' | 'mobile';

export interface TacticalEffect {
  stat: 'firepower' | 'speed' | 'armor' | 'range' | 'accuracy' | 'reaction';
  modifier: number; // percentage modifier (e.g., 15 = +15%, -10 = -10%)
}

export interface TacticalFormation {
  name: TacticalFormationName;
  description?: string;
  effects: TacticalEffect[];
  stats?: {
    accuracy: number;
    defense: number;
    speed: number;
    firepower: number;
    cohesion: number;
  };
  positions?: {
    slot1: Position;
    slot2: Position;
    slot3: Position;
  };
  bonuses?: {
    firstStrike?: boolean;
    counterAttack?: boolean;
    areaEffect?: boolean;
  };
}

export interface TeamLoadout {
  pilots: Array<{
    pilotId: number;
    mechId: number;
    pilot: any;
    mech: any;
  }>;
  formation: TacticalFormation;
  teamId: number;
}

// Battle Event System - Fixed structure
export type BattleEventType = 
  | "UNIT_ATTACK"
  | "UNIT_DAMAGED"
  | "UNIT_MOVED"
  | "UNIT_DESTROYED"
  | "UNIT_SKILL_USED"
  | "BATTLE_START"
  | "BATTLE_END"
  | "TURN_START"
  | "TURN_END"
  | "TERRAIN_EFFECT";

export interface BattleEventBase {
  type: BattleEventType;
  timestamp: number;
}

export interface UnitAttackEvent extends BattleEventBase {
  type: "UNIT_ATTACK";
  data: {
    attackerId: number;
    attackerName: string;
    targetId: number;
    targetName: string;
    damage: number;
    weaponType: string;
    hitResult: "hit" | "miss" | "critical";
  };
}

export interface UnitDamagedEvent extends BattleEventBase {
  type: "UNIT_DAMAGED";
  data: {
    unitId: number;
    unitName: string;
    damage: number;
    remainingHp: number;
    damageSource?: number;
  };
}

export interface UnitMovedEvent extends BattleEventBase {
  type: "UNIT_MOVED";
  data: {
    unitId: number;
    unitName: string;
    from: Position;
    to: Position;
    movementType: "normal" | "dash" | "retreat";
  };
}

export interface UnitDestroyedEvent extends BattleEventBase {
  type: "UNIT_DESTROYED";
  data: {
    unitId: number;
    unitName: string;
    destroyedBy?: number;
  };
}

export interface UnitSkillUsedEvent extends BattleEventBase {
  type: "UNIT_SKILL_USED";
  data: {
    unitId: number;
    unitName: string;
    skillName: string;
    targets?: number[];
  };
}

export interface BattleStartEvent extends BattleEventBase {
  type: "BATTLE_START";
  data: {
    team1Formation: string;
    team2Formation: string;
  };
}

export interface BattleEndEvent extends BattleEventBase {
  type: "BATTLE_END";
  data: {
    result: "victory" | "defeat" | "draw";
    turn: number;
  };
}

export interface TurnStartEvent extends BattleEventBase {
  type: "TURN_START";
  data: {
    turn: number;
  };
}

export interface TurnEndEvent extends BattleEventBase {
  type: "TURN_END";
  data: {
    turn: number;
  };
}

export interface TerrainEffectEvent extends BattleEventBase {
  type: "TERRAIN_EFFECT";
  data: {
    unitId: number;
    terrainType: TerrainFeature["type"];
    effect: string;
  };
}

export type BattleEvent =
  | UnitAttackEvent
  | UnitDamagedEvent
  | UnitMovedEvent
  | UnitDestroyedEvent
  | UnitSkillUsedEvent
  | BattleStartEvent
  | BattleEndEvent
  | TurnStartEvent
  | TurnEndEvent
  | TerrainEffectEvent;

// Animation related types
export interface AttackEffect {
  id: string;
  from: Position;
  to: Position;
  startTime: number;
  type: "laser" | "missile" | "beam";
  damage?: number;
  targetHit?: boolean;
}

export interface HitEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
  type: "explosion" | "sparks" | "shield";
  damage: number;
}

export interface MuzzleFlash {
  id: string;
  x: number;
  y: number;
  startTime: number;
  angle: number;
}

// Animation Queue types
export interface AnimationQueueItem {
  id: string;
  type: "attack" | "move" | "hit" | "destroy" | "skill";
  event: BattleEvent;
  duration: number;
  priority: number;
}

export interface AnimationState {
  queue: AnimationQueueItem[];
  currentAnimation: AnimationQueueItem | null;
  isProcessing: boolean;
} 