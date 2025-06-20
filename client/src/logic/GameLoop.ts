import type { BattleState } from "@shared/schema";

/**
 * Placeholder for the central game-loop logic.  During Phase B we will migrate
 * this file into a dedicated Web Worker. For now it simply returns the input
 * state unchanged so that early refactor commits compile without requiring the
 * full behavioural move.
 */
export function processGameTick(state: BattleState): BattleState {
  // TODO: Move and unit-test the full tick logic from BattleSimulation.
  return state;
} 