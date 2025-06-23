import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeAIDecision } from "@shared/ai/core";
import type { BattleState, Pilot } from "@shared/schema";
import { processGameTick, type TickResult } from "@/logic/GameLoop";
import { TERRAIN_FEATURES } from "@shared/terrain/config";

function createSimpleBattle(): { state: BattleState; pilots: Pilot[] } {
  const pilots: Pilot[] = [
    {
      id: 1,
      name: "Sasha",
      callsign: "S",
      dormitory: "Knight",
      rating: 60,
      reaction: 50,
      accuracy: 55,
      tactical: 50,
      teamwork: 50,
      traits: [],
      isActive: true,
      experience: 0,
      wins: 0,
      losses: 0,
      trainingUntil: null,
      trainingType: null,
      fatigue: 0,
      morale: 50,
    } as Pilot,
    {
      id: 101,
      name: "Enemy",
      callsign: "E",
      dormitory: "Knight",
      rating: 50,
      reaction: 50,
      accuracy: 50,
      tactical: 50,
      teamwork: 50,
      traits: [],
      isActive: true,
      experience: 0,
      wins: 0,
      losses: 0,
      trainingUntil: null,
      trainingType: null,
      fatigue: 0,
      morale: 50,
    } as Pilot,
  ];

  const state: BattleState = {
    id: "test_battle",
    phase: "active",
    turn: 1,
    participants: [
      {
        pilotId: 1,
        mechId: 1,
        team: "team1",
        position: { x: 5, y: 5 },
        hp: 100,
        status: "active",
      },
      {
        pilotId: 101,
        mechId: 2,
        team: "team2",
        position: { x: 7, y: 5 },
        hp: 100,
        status: "active",
      },
    ],
    log: [],
  } as BattleState;

  return { state, pilots };
}

describe("AI Determinism & Tick", () => {
  it("makeAIDecision returns identical results with same seed", () => {
    const { state } = createSimpleBattle();
    const actor = state.participants[0] as any;

    const d1 = makeAIDecision(actor, state, "team1", {
      getPilotInitial: () => "S",
      terrainFeatures: [...TERRAIN_FEATURES] as any,
      seed: 42,
    });
    const d2 = makeAIDecision(actor, state, "team1", {
      getPilotInitial: () => "S",
      terrainFeatures: [...TERRAIN_FEATURES] as any,
      seed: 42,
    });

    expect(d1).toEqual(d2);
  });

  it("processGameTick produces events and hp change on first turn", () => {
    const { state, pilots } = createSimpleBattle();

    // Force Math.random to a low value so attack path is chosen
    const stub = vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result: TickResult = processGameTick(state, pilots, [...TERRAIN_FEATURES] as any);

    stub.mockRestore();

    expect(result.events.length).toBeGreaterThan(0);

    const hpAfter = result.state.participants.find(p => p.pilotId === 101)?.hp ?? 100;
    expect(hpAfter).toBeLessThan(100);
  });
}); 