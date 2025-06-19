import { type BattleState, type Formation, type Pilot, type Mech } from "@shared/schema";
import { AISystem } from "./AISystem";

export class BattleEngine {
  private aiSystem: AISystem;

  constructor() {
    this.aiSystem = new AISystem();
  }

  async initializeBattle(formation1: any, formation2: any): Promise<BattleState> {
    const battleId = `battle_${Date.now()}`;
    
    const participants: Array<{
      pilotId: number;
      mechId: number;
      position: { x: number; y: number };
      hp: number;
      status: "active" | "damaged" | "destroyed";
    }> = [];
    
    // Team 1 (아군) - formation1.pilots 배열 사용
    if (formation1.pilots && Array.isArray(formation1.pilots)) {
      formation1.pilots.forEach((pilot: any, index: number) => {
        participants.push({
          pilotId: pilot.pilotId,
          mechId: pilot.mechId,
          position: { x: 2, y: 2 + (index * 2) },
          hp: 100,
          status: "active" as const
        });
      });
    }
    
    // Team 2 (적군) - formation2.pilots 배열 사용
    if (formation2.pilots && Array.isArray(formation2.pilots)) {
      formation2.pilots.forEach((pilot: any, index: number) => {
        participants.push({
          pilotId: pilot.pilotId,
          mechId: pilot.mechId,
          position: { x: 17, y: 2 + (index * 2) },
          hp: 100,
          status: "active" as const
        });
      });
    }

    return {
      id: battleId,
      phase: "preparation",
      turn: 0,
      participants,
      log: [
        {
          timestamp: Date.now(),
          type: "system",
          message: "전투 시스템 초기화 완료. 모든 유닛 대기 중.",
        },
        {
          timestamp: Date.now() + 1000,
          type: "system", 
          message: "전술 분석 시작. 교전 준비 완료.",
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

      // Process AI decisions for each active participant (simplified)
      battleState.participants.forEach((participant, index) => {
        if (participant.status === "active") {
          const aiDecision = this.aiSystem.makeSimpleDecision(participant, battleState, index < 3 ? "team1" : "team2");
          this.executeAction(participant, aiDecision, battleState);
        }
      });

      // Send complete battle state update
      onUpdate({
        type: "TURN_UPDATE",
        battleState: {
          ...battleState,
          log: battleState.log // 전체 로그 포함
        }
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
          message: action.dialogue || `포지션 이동 중`,
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
          message: action.dialogue || `공격 실행`,
          speaker: action.pilotName
        });
        break;

      case "COMMUNICATE":
        battleState.log.push({
          timestamp,
          type: "communication",
          message: action.dialogue || `통신 중`,
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
