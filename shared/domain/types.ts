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

export type BattleParticipant = {
  pilotId: number;
  mechId: number;
  position: { x: number; y: number };
  hp: number;
  status: "active" | "damaged" | "destroyed";
  lastActionTime?: number;
};

// Runtime battle state that is streamed between client and server
export type BattleState = {
  id: string;
  phase: "preparation" | "active" | "completed";
  turn: number;
  participants: BattleParticipant[];
  log: Array<{
    timestamp: number;
    type: "movement" | "attack" | "communication" | "system";
    message: string;
    speaker?: string;
  }>;
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

export interface AttackEffect {
  id:string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  startTime: number;
  type: "laser" | "missile" | "beam";
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