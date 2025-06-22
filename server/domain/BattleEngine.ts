import { type BattleState } from "@shared/schema";
import { AISystem } from "./AISystem";
import { TERRAIN_FEATURES } from "@shared/terrain/config";

export class BattleEngine {
  private aiSystem: AISystem;

  constructor() {
    this.aiSystem = new AISystem();
  }

  async initializeBattle(formation1: any, formation2: any): Promise<BattleState> {
    const battleId = `battle_${Date.now()}`;
    const participants: any[] = [];

    if (formation1.pilots && Array.isArray(formation1.pilots)) {
      formation1.pilots.forEach((pilot: any, index: number) => {
        participants.push({
          pilotId: pilot.pilotId,
          mechId: pilot.mechId,
          team: "team1" as const,
          position: { x: 2, y: 2 + index * 2 },
          hp: 100,
          status: "active" as const,
        });
      });
    } else if (formation1.pilot1Id) {
      [0, 1, 2].forEach((idx) => {
        const pid = formation1[`pilot${idx + 1}Id`];
        const mid = formation1[`mech${idx + 1}Id`];
        if (pid && mid) {
          participants.push({
            pilotId: pid,
            mechId: mid,
            team: "team1" as const,
            position: { x: 2, y: 2 + idx * 2 },
            hp: 100,
            status: "active" as const,
          });
        }
      });
    }

    if (formation2.pilots && Array.isArray(formation2.pilots)) {
      formation2.pilots.forEach((pilot: any, index: number) => {
        participants.push({
          pilotId: pilot.pilotId,
          mechId: pilot.mechId,
          team: "team2" as const,
          position: { x: 17, y: 2 + index * 2 },
          hp: 100,
          status: "active" as const,
        });
      });
    } else if (formation2.pilot1Id) {
      [0, 1, 2].forEach((idx) => {
        const pid = formation2[`pilot${idx + 1}Id`];
        const mid = formation2[`mech${idx + 1}Id`];
        if (pid && mid) {
          participants.push({
            pilotId: pid,
            mechId: mid,
            team: "team2" as const,
            position: { x: 17, y: 2 + idx * 2 },
            hp: 100,
            status: "active" as const,
          });
        }
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
        },
      ],
    } as BattleState;
  }

  async runBattle(battleState: BattleState, onUpdate: (update: any) => void): Promise<void> {
    battleState.phase = "active";
    onUpdate({ type: "PHASE_CHANGE", phase: "active" });

    const maxTurns = 50;
    let turn = 0;

    const interval = setInterval(() => {
      if (turn >= maxTurns || this.isBattleComplete(battleState)) {
        clearInterval(interval);
        battleState.phase = "completed";
        onUpdate({ type: "BATTLE_COMPLETE", winner: this.determineWinner(battleState) });
        return;
      }

      turn++;
      battleState.turn = turn;

      battleState.participants.forEach((participant) => {
        if (participant.status === "active") {
          const decision = this.aiSystem.makeSimpleDecision(
            participant,
            battleState,
            participant.team,
          );
          this.executeAction(participant, decision, battleState);
        }
      });

      onUpdate({ type: "TURN_UPDATE", turn, participants: battleState.participants, recentLogs: battleState.log.slice(-3) });
    }, 2000);
  }

  private executeAction(participant: any, action: any, battleState: BattleState) {
    const timestamp = Date.now();

    switch (action.type) {
      case "MOVE":
        if (action.newPosition) {
          participant.position = action.newPosition;
          battleState.log.push({ 
            timestamp, 
            type: "movement", 
            message: `${action.pilotName}이(가) ${action.dialogue}`, 
            speaker: action.pilotName 
          });
        }
        break;
        
      case "ATTACK":
        const target = battleState.participants[action.targetIndex];
        if (target) {
          // Enhanced damage calculation with terrain
          let baseDamage = Math.floor(Math.random() * 25) + 15;
          
          // Attacker terrain bonus
          const attackerTerrain = TERRAIN_FEATURES.find(t => 
            t.x === participant.position.x && t.y === participant.position.y
          );
          if (attackerTerrain?.type === "elevation") {
            baseDamage = Math.floor(baseDamage * 1.2); // 20% attack bonus
          }
          
          // Target terrain defense
          const targetTerrain = TERRAIN_FEATURES.find(t => 
            t.x === target.position.x && t.y === target.position.y
          );
          if (targetTerrain?.type === "cover") {
            baseDamage = Math.floor(baseDamage * 0.8); // 20% damage reduction
          }
          
          target.hp = Math.max(0, target.hp - baseDamage);
          if (target.hp === 0) target.status = "destroyed";
          else if (target.hp < 30) target.status = "damaged";
          
          battleState.log.push({ 
            timestamp, 
            type: "attack", 
            message: `${action.pilotName}이(가) ${baseDamage} 피해를 입혔습니다! ${action.dialogue}`, 
            speaker: action.pilotName 
          });
        }
        break;
        
      case "SUPPORT":
        const ally = battleState.participants.find(p => p.pilotId === action.targetId);
        if (ally) {
          const healAmount = Math.floor(Math.random() * 15) + 10;
          ally.hp = Math.min(100, ally.hp + healAmount);
          if (ally.status === "damaged" && ally.hp >= 30) ally.status = "active";
          
          battleState.log.push({ 
            timestamp, 
            type: "support", 
            message: `${action.pilotName}이(가) 아군을 지원하여 ${healAmount} 회복시켰습니다!`, 
            speaker: action.pilotName 
          });
        }
        break;
        
      case "DEFEND":
        battleState.log.push({ 
          timestamp, 
          type: "defense", 
          message: `${action.pilotName}: ${action.dialogue}`, 
          speaker: action.pilotName 
        });
        break;
        
      case "SCOUT":
        if (action.newPosition) {
          participant.position = action.newPosition;
          battleState.log.push({ 
            timestamp, 
            type: "scout", 
            message: `${action.pilotName}: ${action.dialogue}`, 
            speaker: action.pilotName 
          });
        }
        break;
        
      case "SPECIAL":
        battleState.log.push({ 
          timestamp, 
          type: "special", 
          message: `${action.pilotName}: ${action.dialogue}`, 
          speaker: action.pilotName 
        });
        break;
        
      case "COMMUNICATE":
        battleState.log.push({ 
          timestamp, 
          type: "communication", 
          message: `${action.pilotName}: ${action.dialogue}`, 
          speaker: action.pilotName 
        });
        break;
    }
    
    // Apply hazard damage at end of turn
    const hazard = TERRAIN_FEATURES.find(t => 
      t.x === participant.position.x && 
      t.y === participant.position.y && 
      t.type === "hazard"
    );
    if (hazard && participant.status === "active") {
      participant.hp = Math.max(0, participant.hp - 5);
      if (participant.hp === 0) participant.status = "destroyed";
      
      battleState.log.push({ 
        timestamp: timestamp + 100, 
        type: "environment", 
        message: `${action.pilotName}이(가) 위험지대에서 5 피해를 받았습니다!`, 
        speaker: "시스템" 
      });
    }
  }

  private isBattleComplete(state: BattleState) {
    const team1Active = state.participants.filter((p) => p.team === "team1" && p.status === "active").length;
    const team2Active = state.participants.filter((p) => p.team === "team2" && p.status === "active").length;
    return team1Active === 0 || team2Active === 0;
  }

  private determineWinner(state: BattleState): "team1" | "team2" | "draw" {
    const t1 = state.participants.filter((p) => p.team === "team1" && p.status === "active").length;
    const t2 = state.participants.filter((p) => p.team === "team2" && p.status === "active").length;
    if (t1 > t2) return "team1";
    if (t2 > t1) return "team2";
    return "draw";
  }
} 