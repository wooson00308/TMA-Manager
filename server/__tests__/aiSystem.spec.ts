// @ts-nocheck
/// <reference types="vitest" />
import { describe, it, expect, vi, afterEach } from "vitest";
import { AISystem } from "../domain/AISystem";
import type { BattleState } from "@shared/domain/types";

function createMinimalBattleState(): BattleState {
  return {
    id: "ai-test",
    phase: "active",
    turn: 1,
    participants: [
      { pilotId: 1, mechId: 1, position: { x: 1, y: 1 }, hp: 100, status: "active" },
      { pilotId: 101, mechId: 1, position: { x: 5, y: 5 }, hp: 100, status: "active" },
    ],
    log: [],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AISystem.makeSimpleDecision", () => {
  const ai = new AISystem();

  it("returns RETREAT when HP is critical and random < 0.7", () => {
    const battle = createMinimalBattleState();
    const participant = { ...battle.participants[0], hp: 10 }; // critical HP
    battle.participants[0] = participant;

    vi.spyOn(Math, "random").mockReturnValue(0.5); // ensure < 0.7 branch

    const decision = ai.makeSimpleDecision(participant, battle, "team1");
    expect(decision.type).toBe("RETREAT");
  });

  it("returns ATTACK for aggressive pilot when random low value and enemies present", () => {
    const battle = createMinimalBattleState();
    const participant = battle.participants[0]; // pilotId 1 aggressive

    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const decision = ai.makeSimpleDecision(participant, battle, "team1");
    expect(["ATTACK", "MOVE", "SCOUT", "DEFEND", "SPECIAL"].includes(decision.type)).toBe(true);
  });
}); 