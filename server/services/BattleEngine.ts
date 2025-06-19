import { type BattleState, type Formation, type Pilot, type Mech } from "@shared/schema";
import { AISystem } from "./AISystem";

export class BattleEngine {
  private aiSystem: AISystem;

  constructor() {
    this.aiSystem = new AISystem();
  }

  async initializeBattle(formation1: any, formation2: any): Promise<BattleState> {
    const battleId = `battle_${Date.now()}`;
    
    const participants = [
      // Team 1
      { pilotId: formation1.pilot1Id, mechId: formation1.mech1Id, position: { x: 2, y: 2 }, hp: 100, status: "active" as const },
      { pilotId: formation1.pilot2Id, mechId: formation1.mech2Id, position: { x: 2, y: 4 }, hp: 100, status: "active" as const },
      { pilotId: formation1.pilot3Id, mechId: formation1.mech3Id, position: { x: 2, y: 6 }, hp: 100, status: "active" as const },
      // Team 2 (enemy)
      { pilotId: 101, mechId: 101, position: { x: 12, y: 2 }, hp: 100, status: "active" as const },
      { pilotId: 102, mechId: 102, position: { x: 12, y: 4 }, hp: 100, status: "active" as const },
      { pilotId: 103, mechId: 103, position: { x: 12, y: 6 }, hp: 100, status: "active" as const },
    ];

    return {
      id: battleId,
      phase: "preparation",
      turn: 0,
      participants,
      log: [
        {
          timestamp: Date.now(),
          type: "system",
          message: "Battle initialization complete. All systems online.",
        }
      ]
    };
  }

  async runBattle(battleState: BattleState, onUpdate: (update: any) => void): Promise<void> {
    battleState.phase = "active";
    onUpdate({ type: "PHASE_CHANGE", phase: "active" });

    const maxTurns = 50;
    let turn = 0;

    const battleInterval = setInterval(() => {
      if (turn >= maxTurns || this.isBattleComplete(battleState)) {
        clearInterval(battleInterval);
        battleState.phase = "completed";
        onUpdate({ type: "BATTLE_COMPLETE", winner: this.determineWinner(battleState) });
        return;
      }

      turn++;
      battleState.turn = turn;

      // Process AI decisions for each active participant
      battleState.participants.forEach((participant, index) => {
        if (participant.status === "active") {
          const aiDecision = this.aiSystem.makeDecision(participant, battleState, index < 3 ? "team1" : "team2");
          this.executeAction(participant, aiDecision, battleState);
        }
      });

      // Send battle update
      onUpdate({
        type: "TURN_UPDATE",
        turn: battleState.turn,
        participants: battleState.participants,
        recentLogs: battleState.log.slice(-3)
      });

    }, 2000); // 2 second intervals
  }

  private executeAction(participant: any, action: any, battleState: BattleState): void {
    const timestamp = Date.now();
    
    switch (action.type) {
      case "MOVE":
        participant.position = action.newPosition;
        battleState.log.push({
          timestamp,
          type: "movement",
          message: `${action.pilotName} repositioning to sector ${action.newPosition.x}-${action.newPosition.y}`,
          speaker: action.pilotName
        });
        break;

      case "ATTACK":
        const target = battleState.participants[action.targetIndex];
        const damage = Math.floor(Math.random() * 25) + 10;
        target.hp = Math.max(0, target.hp - damage);
        
        if (target.hp === 0) {
          target.status = "destroyed";
        } else if (target.hp < 30) {
          target.status = "damaged";
        }

        battleState.log.push({
          timestamp,
          type: "attack",
          message: `${action.pilotName}: "${action.dialogue}" [${damage} damage dealt]`,
          speaker: action.pilotName
        });
        break;

      case "COMMUNICATE":
        battleState.log.push({
          timestamp,
          type: "communication",
          message: `${action.pilotName}: "${action.dialogue}"`,
          speaker: action.pilotName
        });
        break;
    }
  }

  private isBattleComplete(battleState: BattleState): boolean {
    const team1Active = battleState.participants.slice(0, 3).filter(p => p.status === "active").length;
    const team2Active = battleState.participants.slice(3, 6).filter(p => p.status === "active").length;
    
    return team1Active === 0 || team2Active === 0;
  }

  private determineWinner(battleState: BattleState): "team1" | "team2" | "draw" {
    const team1Active = battleState.participants.slice(0, 3).filter(p => p.status === "active").length;
    const team2Active = battleState.participants.slice(3, 6).filter(p => p.status === "active").length;
    
    if (team1Active > team2Active) return "team1";
    if (team2Active > team1Active) return "team2";
    return "draw";
  }
}
