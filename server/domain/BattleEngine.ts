import { type BattleState } from "@shared/schema";
import { AISystem } from "./AISystem";
import type { IStorage } from "../storage";

export class BattleEngine {
  private aiSystem: AISystem;
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.aiSystem = new AISystem(storage);
    this.storage = storage;
  }

  private getTacticalFormation(tacticName: string): any {
    const formations: { [key: string]: any } = {
      'balanced': {
        name: 'balanced',
        effects: [
          { stat: 'firepower', modifier: 0 },
          { stat: 'speed', modifier: 0 },
          { stat: 'armor', modifier: 0 }
        ]
      },
      'aggressive': {
        name: 'aggressive',
        effects: [
          { stat: 'firepower', modifier: 15 },
          { stat: 'speed', modifier: 10 },
          { stat: 'armor', modifier: -5 }
        ]
      },
      'defensive': {
        name: 'defensive',
        effects: [
          { stat: 'armor', modifier: 20 },
          { stat: 'reaction', modifier: 10 },
          { stat: 'firepower', modifier: -10 }
        ]
      },
      'mobile': {
        name: 'mobile',
        effects: [
          { stat: 'speed', modifier: 25 },
          { stat: 'reaction', modifier: 15 },
          { stat: 'armor', modifier: -15 }
        ]
      }
    };
    
    return formations[tacticName] || formations['balanced'];
  }

  async initializeBattle(formation1: any, formation2: any, playerTactics?: string): Promise<BattleState> {
    const battleId = `battle_${Date.now()}`;
    const participants: any[] = [];
    
    // 플레이어 전술 정보
    const playerFormation = this.getTacticalFormation(playerTactics || 'balanced');
    
    // AI 적군 전술 선택
    const enemyFormation = this.aiSystem.selectEnemyTactics(
      playerFormation,
      formation2.pilots || [],
      formation2.pilots || []
    );

    // Team 1 participants with actual data from storage
    if (formation1.pilots && Array.isArray(formation1.pilots)) {
      for (let index = 0; index < formation1.pilots.length; index++) {
        const pilotData = formation1.pilots[index];
        const pilot = await this.storage.getPilot(pilotData.pilotId);
        const mech = await this.storage.getMech(pilotData.mechId);
        
        if (pilot && mech) {
          participants.push({
            pilotId: pilot.id,
            mechId: mech.id,
            team: "team1" as const,
            position: { x: 2, y: 2 + index * 2 },
            hp: mech.hp,
            maxHp: mech.hp,
            armor: mech.armor,
            speed: mech.speed,
            firepower: mech.firepower,
            range: mech.range,
            status: "active" as const,
            pilotStats: {
              reaction: pilot.reaction,
              accuracy: pilot.accuracy,
              tactical: pilot.tactical,
              teamwork: pilot.teamwork,
              traits: pilot.traits
            }
          });
        }
      }
    } else if (formation1.pilot1Id) {
      for (let idx = 0; idx < 3; idx++) {
        const pid = formation1[`pilot${idx + 1}Id`];
        const mid = formation1[`mech${idx + 1}Id`];
        if (pid && mid) {
          const pilot = await this.storage.getPilot(pid);
          const mech = await this.storage.getMech(mid);
          
          if (pilot && mech) {
            participants.push({
              pilotId: pilot.id,
              mechId: mech.id,
              team: "team1" as const,
              position: { x: 2, y: 2 + idx * 2 },
              hp: mech.hp,
              maxHp: mech.hp,
              armor: mech.armor,
              speed: mech.speed,
              firepower: mech.firepower,
              range: mech.range,
              status: "active" as const,
              pilotStats: {
                reaction: pilot.reaction,
                accuracy: pilot.accuracy,
                tactical: pilot.tactical,
                teamwork: pilot.teamwork,
                traits: pilot.traits
              }
            });
          }
        }
      }
    }

    // Team 2 participants with actual data from storage
    if (formation2.pilots && Array.isArray(formation2.pilots)) {
      for (let index = 0; index < formation2.pilots.length; index++) {
        const pilotData = formation2.pilots[index];
        const pilot = await this.storage.getPilot(pilotData.pilotId);
        const mech = await this.storage.getMech(pilotData.mechId);
        
        if (pilot && mech) {
          participants.push({
            pilotId: pilot.id,
            mechId: mech.id,
            team: "team2" as const,
            position: { x: 17, y: 2 + index * 2 },
            hp: mech.hp,
            maxHp: mech.hp,
            armor: mech.armor,
            speed: mech.speed,
            firepower: mech.firepower,
            range: mech.range,
            status: "active" as const,
            pilotStats: {
              reaction: pilot.reaction,
              accuracy: pilot.accuracy,
              tactical: pilot.tactical,
              teamwork: pilot.teamwork,
              traits: pilot.traits
            }
          });
        }
      }
    } else if (formation2.pilot1Id) {
      for (let idx = 0; idx < 3; idx++) {
        const pid = formation2[`pilot${idx + 1}Id`];
        const mid = formation2[`mech${idx + 1}Id`];
        if (pid && mid) {
          const pilot = await this.storage.getPilot(pid);
          const mech = await this.storage.getMech(mid);
          
          if (pilot && mech) {
            participants.push({
              pilotId: pilot.id,
              mechId: mech.id,
              team: "team2" as const,
              position: { x: 17, y: 2 + idx * 2 },
              hp: mech.hp,
              maxHp: mech.hp,
              armor: mech.armor,
              speed: mech.speed,
              firepower: mech.firepower,
              range: mech.range,
              status: "active" as const,
              pilotStats: {
                reaction: pilot.reaction,
                accuracy: pilot.accuracy,
                tactical: pilot.tactical,
                teamwork: pilot.teamwork,
                traits: pilot.traits
              }
            });
          }
        }
      }
    }

    const battleState = {
      id: battleId,
      phase: "preparation",
      turn: 0,
      participants,
      teamFormations: {
        team1: playerFormation,
        team2: enemyFormation
      },
      log: [
        {
          timestamp: Date.now(),
          type: "system",
          message: "전투 시스템 초기화 완료. 모든 유닛 대기 중.",
        },
        {
          timestamp: Date.now() + 1000,
          type: "system",
          message: `전술 분석 완료. 아군: ${playerFormation.name}, 적군: ${enemyFormation.name}`,
        },
      ],
    } as BattleState;

    console.log(`Battle initialized - Player: ${playerFormation.name}, Enemy: ${enemyFormation.name}`);
    return battleState;
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
        if (participant.status !== "destroyed") {
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
        participant.position = action.newPosition;
        battleState.log.push({ timestamp, type: "movement", message: action.dialogue, speaker: action.pilotName });
        break;
      case "ATTACK":
        const target = battleState.participants[action.targetIndex];
        if (target) {
          // 실제 파일럿 능력치와 메카 스탯을 반영한 데미지 계산
          const attackerAccuracy = participant.pilotStats?.accuracy || 70;
          const attackerFirepower = participant.firepower || 75;
          const targetArmor = target.armor || 70;
          const targetPilotReaction = target.pilotStats?.reaction || 70;
          
          // 명중률 계산 (파일럿 정확도 vs 상대 반응속도)
          const hitChance = Math.max(0.1, Math.min(0.95, (attackerAccuracy - targetPilotReaction + 50) / 100));
          
          if (Math.random() < hitChance) {
            // 데미지 계산 (화력 - 방어력)
            const baseDamage = Math.max(5, attackerFirepower - targetArmor + Math.random() * 20);
            const finalDamage = Math.floor(baseDamage);
            
            target.hp = Math.max(0, target.hp - finalDamage);
            if (target.hp === 0) target.status = "destroyed";
            else if (target.hp < target.maxHp * 0.3) target.status = "damaged";
            
            battleState.log.push({ 
              timestamp, 
              type: "attack", 
              message: `${action.dialogue} (${finalDamage} 데미지!)`, 
              speaker: action.pilotName 
            });
          } else {
            battleState.log.push({ 
              timestamp, 
              type: "attack", 
              message: `${action.dialogue} (빗나감!)`, 
              speaker: action.pilotName 
            });
          }
        }
        break;
      case "COMMUNICATE":
        battleState.log.push({ timestamp, type: "communication", message: action.dialogue, speaker: action.pilotName });
        break;
    }
  }

  private isBattleComplete(state: BattleState) {
    const team1Active = state.participants.filter((p) => p.team === "team1" && p.status !== "destroyed").length;
    const team2Active = state.participants.filter((p) => p.team === "team2" && p.status !== "destroyed").length;
    return team1Active === 0 || team2Active === 0;
  }

  private determineWinner(state: BattleState): "team1" | "team2" | "draw" {
    const t1 = state.participants.filter((p) => p.team === "team1" && p.status !== "destroyed").length;
    const t2 = state.participants.filter((p) => p.team === "team2" && p.status !== "destroyed").length;
    if (t1 > t2) return "team1";
    if (t2 > t1) return "team2";
    return "draw";
  }
} 