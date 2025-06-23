import type { Position } from "@shared/ai/utils";

export type { Position };

export interface AttackEvent {
  type: "attack";
  attackerId: number;
  targetId: number;
  damage: number;
  weaponType?: string;
}

export interface MoveEvent {
  type: "move";
  pilotId: number;
  from: Position;
  to: Position;
}

export interface SupportEvent {
  type: "support";
  pilotId: number;
  targetId: number;
  effect: string;
  amount?: number;
}

export type GameEvent = AttackEvent | MoveEvent | SupportEvent; 