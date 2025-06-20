import { type BattleState } from "@shared/schema";
import { storage } from "../storage";
import { AISystem } from "./AISystem";

export class BattleEngine {
  private aiSystem = new AISystem();
  private battleTimers = new Map<string, NodeJS.Timeout>();

  async initializeBattle(formation1: any, formation2: any): Promise<BattleState> {
    console.log('Formation1 received:', formation1);
    console.log('Formation2 received:', formation2);
    console.log('Formation1 pilots:', formation1?.pilots);
    console.log('Formation2 pilots:', formation2?.pilots);
    
    if (!formation1 || !formation2) {
      throw new Error('Both formations are required');
    }
    
    // 실제 파일럿과 메크 데이터 기반으로 배틀 상태 초기화
    const participants = [];

    // 팀 1 (아군) 파티시펀트 생성
    if (formation1.pilots && Array.isArray(formation1.pilots)) {
      for (let i = 0; i < formation1.pilots.length; i++) {
        const formationUnit = formation1.pilots[i];
        const pilotId = formationUnit.pilotId || formationUnit.pilot?.id;
        const mechId = formationUnit.mechId || formationUnit.mech?.id;
        
        if (pilotId && mechId) {
          const pilot = await storage.getPilot(pilotId);
          const mech = await storage.getMech(mechId);
          
          if (pilot && mech) {
            participants.push({
              pilotId: pilot.id,
              mechId: mech.id,
              position: { x: 2 + i * 2, y: 7 - i },
              hp: mech.hp,
              status: 'active' as const
            });
          }
        }
      }
    }

    // 팀 2 (적군) 파티시펀트 생성
    if (formation2.pilots && Array.isArray(formation2.pilots)) {
      for (let i = 0; i < formation2.pilots.length; i++) {
        const formationUnit = formation2.pilots[i];
        const pilotId = formationUnit.pilotId || formationUnit.pilot?.id;
        const mechId = formationUnit.mechId || formationUnit.mech?.id;
        
        if (pilotId && mechId) {
          // 적군은 실제 저장된 파일럿 대신 임시 데이터 사용
          const mech = await storage.getMech(mechId);
          
          if (mech) {
            participants.push({
              pilotId: pilotId, // 이미 100번대로 설정됨
              mechId: mech.id,
              position: { x: 12 + i * 2, y: 2 + i },
              hp: mech.hp,
              status: 'active' as const
            });
          }
        }
      }
    }

    const battleState: BattleState = {
      id: `battle_${Date.now()}`,
      phase: 'preparation',
      turn: 0,
      participants,
      log: [{
        timestamp: Date.now(),
        type: 'system',
        message: '전투 준비 완료. 모든 유닛 대기 중...'
      }]
    };

    return battleState;
  }

  async runBattle(battleState: BattleState, onUpdate: (update: any) => void): Promise<void> {
    // 전투 준비 단계
    setTimeout(() => {
      battleState.phase = 'active';
      onUpdate({
        type: 'PHASE_CHANGE',
        phase: 'active',
        message: '전투 개시!'
      });
      
      // 전투 시뮬레이션 시작
      this.startBattleLoop(battleState, onUpdate);
    }, 2000);
  }

  private async startBattleLoop(battleState: BattleState, onUpdate: (update: any) => void): Promise<void> {
    const battleTimer = setInterval(async () => {
      if (battleState.phase !== 'active') {
        clearInterval(battleTimer);
        return;
      }

      // 강제 타임아웃 (15턴 후 종료 - 테스트용)
      if (battleState.turn >= 15) {
        battleState.phase = 'completed';
        const allyCount = battleState.participants.filter(p => p.pilotId < 100 && p.status === 'active').length;
        const enemyCount = battleState.participants.filter(p => p.pilotId >= 100 && p.status === 'active').length;
        const winner = allyCount > enemyCount ? 'team1' : enemyCount > allyCount ? 'team2' : 'draw';
        
        onUpdate({
          type: 'BATTLE_COMPLETE',
          winner,
          finalState: battleState,
          reason: 'timeout'
        });
        
        clearInterval(battleTimer);
        this.battleTimers.delete(battleState.id);
        return;
      }

      // 전투 종료 조건 확인 (destroyed가 아닌 모든 유닛 카운트)
      const allyCount = battleState.participants.filter(p => p.pilotId < 100 && p.status !== 'destroyed').length;
      const enemyCount = battleState.participants.filter(p => p.pilotId >= 100 && p.status !== 'destroyed').length;
      
      console.log(`승리 조건 체크 - 아군: ${allyCount}명, 적군: ${enemyCount}명`);
      
      // 각 참가자 상태 로깅
      battleState.participants.forEach(p => {
        console.log(`참가자 ${p.pilotId}: HP ${p.hp}, 상태 ${p.status}`);
      });

      if (allyCount === 0 || enemyCount === 0) {
        battleState.phase = 'completed';
        const winner = allyCount > 0 ? 'team1' : 'team2';
        console.log(`전투 종료! 승자: ${winner}`);
        
        onUpdate({
          type: 'BATTLE_COMPLETE',
          winner,
          finalState: battleState,
          reason: 'elimination'
        });
        
        clearInterval(battleTimer);
        this.battleTimers.delete(battleState.id);
        return;
      }

      // 턴 진행
      battleState.turn++;
      const recentLogs: any[] = [];
      
      console.log(`턴 ${battleState.turn} 시작`);

      // 모든 참가자의 AI 결정 생성 (destroyed가 아닌 모든 유닛 - damaged도 행동 가능)
      const activeParticipants = battleState.participants.filter(p => p.status !== 'destroyed');
      console.log(`행동 가능 참가자: ${activeParticipants.length}명 (destroyed 제외)`);
      
      const aiDecisions = await Promise.all(
        activeParticipants.map(async (participant) => {
          const team = participant.pilotId < 100 ? 'ally' : 'enemy';
          const decision = await this.aiSystem.makeSimpleDecision(participant, battleState, team);
          console.log(`${participant.pilotId} (${team}): ${decision.type}`);
          return decision;
        })
      );

      // AI 결정 실행
      for (let i = 0; i < activeParticipants.length; i++) {
        const participant = activeParticipants[i];
        const decision = aiDecisions[i];
        
        await this.executeAIDecision(participant, decision, battleState, recentLogs);
      }

      // 업데이트 전송
      onUpdate({
        type: 'TURN_UPDATE',
        turn: battleState.turn,
        participants: battleState.participants,
        recentLogs
      });

    }, 1000); // 1초마다 턴 진행 (테스트용)

    this.battleTimers.set(battleState.id, battleTimer);
  }

  private async executeAIDecision(
    participant: any, 
    decision: any, 
    battleState: BattleState, 
    recentLogs: any[]
  ): Promise<void> {
    const pilot = await storage.getPilot(participant.pilotId >= 100 ? participant.pilotId - 100 : participant.pilotId);
    const pilotName = pilot ? pilot.name : `Unit-${participant.pilotId}`;

    switch (decision.type) {
      case 'ATTACK':
        if (decision.targetIndex !== undefined) {
          const target = battleState.participants[decision.targetIndex];
          if (target && target.status === 'active') {
            // 실제 메크 데이터 기반 데미지 계산
            const attackerMech = await storage.getMech(participant.mechId);
            const targetMech = await storage.getMech(target.mechId);
            
            // 테스트용 치명적 데미지 (한 방에 격파)
            let damage = target.hp + 10; // 현재 HP보다 높은 데미지로 확실한 격파
            target.hp = Math.max(0, target.hp - damage);

            if (target.hp <= 0) {
              target.status = 'destroyed';
              target.hp = 0;
              const targetPilot = await storage.getPilot(target.pilotId >= 100 ? target.pilotId - 100 : target.pilotId);
              const targetName = targetPilot ? targetPilot.name : `Unit-${target.pilotId}`;
              console.log(`${targetName} (${target.pilotId}) 격파됨! HP: ${target.hp}, Status: ${target.status}`);
              recentLogs.push({
                timestamp: Date.now(),
                type: 'system',
                message: `${targetName}의 기체가 격파되었습니다!`
              });
            } 
            // damaged 상태 제거 - 전투 단순화

            recentLogs.push({
              timestamp: Date.now(),
              type: 'attack',
              message: decision.dialogue || `${pilotName}이(가) ${damage} 데미지를 입혔습니다! (타겟 HP: ${target.hp})`,
              speaker: pilotName
            });
          }
        }
        break;

      case 'MOVE':
      case 'RETREAT':
      case 'SCOUT':
      case 'SUPPORT':
        if (decision.newPosition) {
          participant.position = decision.newPosition;
        }
        
        if (decision.dialogue) {
          recentLogs.push({
            timestamp: Date.now(),
            type: 'movement',
            message: decision.dialogue,
            speaker: pilotName
          });
        }
        break;

      case 'COMMUNICATE':
        if (decision.dialogue) {
          recentLogs.push({
            timestamp: Date.now(),
            type: 'communication',
            message: decision.dialogue,
            speaker: pilotName
          });
        }
        break;
    }
  }

  stopBattle(battleId: string): void {
    const timer = this.battleTimers.get(battleId);
    if (timer) {
      clearInterval(timer);
      this.battleTimers.delete(battleId);
    }
  }
}