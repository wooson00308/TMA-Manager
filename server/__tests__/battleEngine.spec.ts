// @ts-nocheck
/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { BattleEngine } from "../domain/BattleEngine";
import type { BattleState } from "@shared/domain/types";

// Helper to construct a minimal BattleState with desired active/destroyed counts
function createBattleState(team1Active: number, team2Active: number): BattleState {
  const makeParticipant = (pilotId: number, active: boolean, team: "team1" | "team2") => ({
    pilotId,
    mechId: 1,
    team,
    position: { x: 0, y: 0 },
    hp: active ? 100 : 0,
    status: (active ? "active" : "destroyed") as "active" | "destroyed",
  });

  const participants = [
    makeParticipant(1, team1Active >= 1, "team1"),
    makeParticipant(2, team1Active >= 2, "team1"),
    makeParticipant(3, team1Active >= 3, "team1"),
    makeParticipant(101, team2Active >= 1, "team2"),
    makeParticipant(102, team2Active >= 2, "team2"),
    makeParticipant(103, team2Active >= 3, "team2"),
  ];

  return {
    id: "test-battle",
    phase: "active",
    turn: 1,
    participants,
    log: [],
  };
}

describe("BattleEngine.determineWinner", () => {
  const engine = new BattleEngine() as any; // cast to access private methods

  it("returns team1 when team1 has more active units", () => {
    const state = createBattleState(3, 1);
    const winner = engine.determineWinner(state);
    expect(winner).toBe("team1");
  });

  it("returns team2 when team2 has more active units", () => {
    const state = createBattleState(1, 3);
    const winner = engine.determineWinner(state);
    expect(winner).toBe("team2");
  });

  it("returns draw when both teams have equal active units", () => {
    const state = createBattleState(2, 2);
    const winner = engine.determineWinner(state);
    expect(winner).toBe("draw");
  });
}); 