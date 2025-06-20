import { type BattleState } from "@shared/schema";
import { AISystem } from "./AISystem";

interface GameAction {
  type: "MOVE" | "ATTACK" | "COMMUNICATE" | "DEFEND" | "SUPPORT" | "SCOUT" | "RETREAT" | "SPECIAL" | "ADVANCE";
  pilotId: number;
  targetId?: number;
  newPosition?: { x: number; y: number };
  message?: string;
}

interface GameResult {
  success: boolean;
  battleState: BattleState;
  effects: Array<{
    type: 'damage' | 'heal' | 'move' | 'animation';
    participantId: number;
    value?: number;
    position?: { x: number; y: number };
    effectType?: string;
  }>;
  gameOver?: {
    winner: 'team1' | 'team2' | 'draw';
    reason: string;
  };
}

interface TerrainFeature {
  x: number;
  y: number;
  type: 'cover' | 'obstacle' | 'elevation' | 'hazard';
}

export class GameEngine {
  private aiSystem: AISystem;
  private terrainFeatures: TerrainFeature[] = [
    { x: 4, y: 3, type: 'cover' },
    { x: 8, y: 5, type: 'elevation' },
    { x: 12, y: 7, type: 'obstacle' },
    { x: 6, y: 9, type: 'hazard' },
    { x: 10, y: 2, type: 'cover' }
  ];

  constructor() {
    this.aiSystem = new AISystem();
  }

  // 서버가 모든 게임 액션을 처리
  processAction(action: GameAction, battleState: BattleState): GameResult {
    const actor = battleState.participants.find(p => p.pilotId === action.pilotId);
    if (!actor || actor.status !== 'active') {
      return { success: false, battleState, effects: [] };
    }

    const effects: any[] = [];
    let updatedState = { ...battleState };

    switch (action.type) {
      case 'ATTACK':
        return this.processAttack(action, updatedState);
      
      case 'MOVE':
      case 'RETREAT':
      case 'SCOUT':
        return this.processMovement(action, updatedState);
      
      case 'SUPPORT':
        return this.processSupport(action, updatedState);
      
      case 'COMMUNICATE':
        return this.processCommunication(action, updatedState);
      
      default:
        return { success: false, battleState, effects: [] };
    }
  }

  private processAttack(action: GameAction, battleState: BattleState): GameResult {
    const actor = battleState.participants.find(p => p.pilotId === action.pilotId)!;
    const target = battleState.participants.find(p => p.pilotId === action.targetId);
    
    if (!target || target.status !== 'active') {
      return { success: false, battleState, effects: [] };
    }

    // 거리 확인
    const distance = this.manhattanDistance(actor.position, target.position);
    const maxRange = this.getMechRange(actor.mechId);
    
    if (distance > maxRange) {
      return { success: false, battleState, effects: [] };
    }

    // 스탯 기반 데미지 계산 (서버에서 처리)
    const attackerStats = this.getPilotStats(actor.pilotId);
    const attackerMechStats = this.getMechStats(actor.mechId);
    const targetMechStats = this.getMechStats(target.mechId);

    const accuracyModifier = Math.max(0.3, Math.min(0.95, 
      (attackerStats.accuracy / 100) - (distance * 0.1) + (Math.random() * 0.2 - 0.1)
    ));

    let baseDamage = Math.floor(attackerMechStats.firepower * accuracyModifier);
    let finalDamage = Math.max(1, baseDamage - Math.floor(targetMechStats.armor * 0.3));

    // 지형 효과 적용 (서버에서 처리)
    const attackerTerrain = this.getTerrainAt(actor.position);
    const targetTerrain = this.getTerrainAt(target.position);

    if (attackerTerrain?.type === 'elevation') {
      finalDamage += Math.floor(finalDamage * 0.25);
    }
    if (targetTerrain?.type === 'cover') {
      finalDamage = Math.floor(finalDamage * 0.7);
    }
    if (targetTerrain?.type === 'hazard') {
      finalDamage += Math.floor(finalDamage * 0.1);
    }

    finalDamage = Math.max(1, finalDamage);

    // 상태 업데이트
    const updatedParticipants = battleState.participants.map(p => {
      if (p.pilotId === target.pilotId) {
        const newHp = Math.max(0, p.hp - finalDamage);
        return {
          ...p,
          hp: newHp,
          status: newHp <= 0 ? 'destroyed' as const : (newHp < 30 ? 'damaged' as const : 'active' as const)
        };
      }
      return p;
    });

    const updatedState: BattleState = {
      ...battleState,
      participants: updatedParticipants,
      turn: battleState.turn + 1,
      log: [...battleState.log, {
        timestamp: Date.now(),
        type: 'attack',
        message: `${this.getPilotName(actor.pilotId)}: 공격! ${finalDamage} 데미지!`,
        speaker: this.getPilotName(actor.pilotId)
      }]
    };

    const effects = [
      {
        type: 'damage' as const,
        participantId: target.pilotId,
        value: finalDamage
      },
      {
        type: 'animation' as const,
        participantId: actor.pilotId,
        effectType: 'attack'
      }
    ];

    // 승리 조건 확인 (서버에서 처리)
    const gameOver = this.checkGameOver(updatedState);

    return {
      success: true,
      battleState: updatedState,
      effects,
      gameOver
    };
  }

  private processMovement(action: GameAction, battleState: BattleState): GameResult {
    const actor = battleState.participants.find(p => p.pilotId === action.pilotId)!;
    
    if (!action.newPosition) {
      return { success: false, battleState, effects: [] };
    }

    // 이동 유효성 검사 (서버에서 처리)
    if (!this.isValidMove(actor.position, action.newPosition)) {
      return { success: false, battleState, effects: [] };
    }

    const updatedParticipants = battleState.participants.map(p => 
      p.pilotId === actor.pilotId ? { ...p, position: action.newPosition! } : p
    );

    const updatedState: BattleState = {
      ...battleState,
      participants: updatedParticipants,
      turn: battleState.turn + 1,
      log: [...battleState.log, {
        timestamp: Date.now(),
        type: 'movement',
        message: action.message || `${this.getPilotName(actor.pilotId)}: 이동 중`,
        speaker: this.getPilotName(actor.pilotId)
      }]
    };

    return {
      success: true,
      battleState: updatedState,
      effects: [{
        type: 'move' as const,
        participantId: actor.pilotId,
        position: action.newPosition
      }]
    };
  }

  private processSupport(action: GameAction, battleState: BattleState): GameResult {
    const actor = battleState.participants.find(p => p.pilotId === action.pilotId)!;
    const target = battleState.participants.find(p => p.pilotId === action.targetId);
    
    if (!target) {
      return { success: false, battleState, effects: [] };
    }

    const healAmount = 15;
    const updatedParticipants = battleState.participants.map(p => 
      p.pilotId === target.pilotId ? { ...p, hp: Math.min(100, p.hp + healAmount) } : p
    );

    const updatedState: BattleState = {
      ...battleState,
      participants: updatedParticipants,
      turn: battleState.turn + 1,
      log: [...battleState.log, {
        timestamp: Date.now(),
        type: 'communication',
        message: `${this.getPilotName(actor.pilotId)}: 지원 실행!`,
        speaker: this.getPilotName(actor.pilotId)
      }]
    };

    return {
      success: true,
      battleState: updatedState,
      effects: [{
        type: 'heal' as const,
        participantId: target.pilotId,
        value: healAmount
      }]
    };
  }

  private processCommunication(action: GameAction, battleState: BattleState): GameResult {
    const actor = battleState.participants.find(p => p.pilotId === action.pilotId)!;
    
    const updatedState: BattleState = {
      ...battleState,
      turn: battleState.turn + 1,
      log: [...battleState.log, {
        timestamp: Date.now(),
        type: 'communication',
        message: action.message || `${this.getPilotName(actor.pilotId)}: 통신 중`,
        speaker: this.getPilotName(actor.pilotId)
      }]
    };

    return {
      success: true,
      battleState: updatedState,
      effects: []
    };
  }

  // AI 턴 처리 (서버에서만 실행)
  processAITurn(battleState: BattleState): GameResult[] {
    const results: GameResult[] = [];
    
    battleState.participants.forEach((participant, index) => {
      if (participant.status === 'active' && participant.pilotId >= 100) { // AI 유닛
        const team = index < 3 ? "team1" : "team2";
        const aiDecision = this.aiSystem.makeAdvancedDecision(participant, battleState, team);
        
        const actionType = aiDecision.type === 'ADVANCE' ? 'MOVE' : aiDecision.type;
        const action: GameAction = {
          type: actionType,
          pilotId: participant.pilotId,
          targetId: aiDecision.target?.pilotId,
          newPosition: aiDecision.newPosition,
          message: aiDecision.message
        };

        const result = this.processAction(action, battleState);
        if (result.success) {
          battleState = result.battleState; // 상태 업데이트
          results.push(result);
        }
      }
    });

    return results;
  }

  // 유틸리티 메서드들
  private getPilotStats(pilotId: number) {
    return {
      rating: 75 + (pilotId % 25),
      accuracy: 65 + (pilotId % 35)
    };
  }

  private getMechStats(mechId: number) {
    return {
      firepower: 60 + (mechId % 40),
      armor: 65 + (mechId % 35),
      range: 3 + (mechId % 3)
    };
  }

  private getMechRange(mechId: number): number {
    return 3 + (mechId % 3);
  }

  private getTerrainAt(position: { x: number; y: number }): TerrainFeature | null {
    return this.terrainFeatures.find(t => t.x === position.x && t.y === position.y) || null;
  }

  private manhattanDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  private isValidMove(from: { x: number; y: number }, to: { x: number; y: number }): boolean {
    // 기본 이동 거리 제한
    const distance = this.manhattanDistance(from, to);
    if (distance > 2) return false;

    // 장애물 체크
    const obstacle = this.terrainFeatures.find(t => 
      t.x === to.x && t.y === to.y && t.type === 'obstacle'
    );
    if (obstacle) return false;

    // 맵 경계 체크
    return to.x >= 0 && to.x < 20 && to.y >= 0 && to.y < 12;
  }

  private checkGameOver(battleState: BattleState): { winner: 'team1' | 'team2' | 'draw'; reason: string } | undefined {
    const team1Active = battleState.participants.filter(p => p.pilotId < 100 && p.status === 'active').length;
    const team2Active = battleState.participants.filter(p => p.pilotId >= 100 && p.status === 'active').length;

    if (team1Active === 0 && team2Active === 0) {
      return { winner: 'draw', reason: '양팀 전멸' };
    }
    if (team1Active === 0) {
      return { winner: 'team2', reason: '아군 전멸' };
    }
    if (team2Active === 0) {
      return { winner: 'team1', reason: '적군 전멸' };
    }
    if (battleState.turn >= 50) {
      return { 
        winner: team1Active > team2Active ? 'team1' : team2Active > team1Active ? 'team2' : 'draw',
        reason: '시간 초과'
      };
    }

    return undefined;
  }

  private getPilotName(pilotId: number): string {
    const names: { [key: number]: string } = {
      1: "Sasha Volkov",
      2: "Mei Chen",
      3: "Alex Rodriguez",
      4: "Jin Watanabe",
      5: "Elena Vasquez",
      101: "Enemy Alpha",
      102: "Enemy Beta",
      103: "Enemy Gamma"
    };
    return names[pilotId] || `Unit-${pilotId}`;
  }
}