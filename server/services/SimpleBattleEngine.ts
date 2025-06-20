import { type BattleState } from "@shared/schema";
import { storage } from "../storage";

export class SimpleBattleEngine {
  private battleTimers = new Map<string, NodeJS.Timeout>();

  async initializeBattle(formation1: any, formation2: any): Promise<BattleState> {
    console.log('SimpleBattleEngine 초기화 시작');
    
    if (!formation1 || !formation2) {
      throw new Error('Both formations are required');
    }
    
    const participants = [];

    // 팀 1 (아군) 파티시펀트 생성
    if (formation1.pilots && Array.isArray(formation1.pilots)) {
      for (let i = 0; i < formation1.pilots.length; i++) {
        const formationUnit = formation1.pilots[i];
        const pilotId = formationUnit.pilotId || formationUnit.pilot?.id;
        const mechId = formationUnit.mechId || formationUnit.mech?.id;
        
        if (pilotId && mechId) {
          const mech = await storage.getMech(mechId);
          if (mech) {
            participants.push({
              pilotId: pilotId,
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
          const mech = await storage.getMech(mechId);
          if (mech) {
            participants.push({
              pilotId: pilotId,
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

    console.log(`SimpleBattleEngine 초기화 완료: ${participants.length}명 참가자`);
    return battleState;
  }

  async runBattle(battleState: BattleState, onUpdate: (update: any) => void): Promise<void> {
    setTimeout(() => {
      battleState.phase = 'active';
      onUpdate({
        type: 'PHASE_CHANGE',
        phase: 'active',
        message: '전투 개시!'
      });
      
      this.startSimpleBattleLoop(battleState, onUpdate);
    }, 1000);
  }

  private async startSimpleBattleLoop(battleState: BattleState, onUpdate: (update: any) => void): Promise<void> {
    const battleTimer = setInterval(async () => {
      if (battleState.phase !== 'active') {
        clearInterval(battleTimer);
        return;
      }

      // 턴 진행
      battleState.turn++;
      console.log(`간단 전투 턴 ${battleState.turn} 시작`);

      // 승리 조건 확인
      const allyCount = battleState.participants.filter(p => p.pilotId < 100 && p.status === 'active').length;
      const enemyCount = battleState.participants.filter(p => p.pilotId >= 100 && p.status === 'active').length;
      
      console.log(`생존 체크 - 아군: ${allyCount}명, 적군: ${enemyCount}명`);

      if (allyCount === 0 || enemyCount === 0) {
        battleState.phase = 'completed';
        const winner = allyCount > 0 ? 'team1' : 'team2';
        console.log(`전투 종료! 승자: ${winner}`);
        
        onUpdate({
          type: 'BATTLE_COMPLETE',
          winner,
          finalState: battleState
        });
        
        clearInterval(battleTimer);
        this.battleTimers.delete(battleState.id);
        return;
      }

      // 강제 타임아웃 (10턴)
      if (battleState.turn >= 10) {
        battleState.phase = 'completed';
        const winner = allyCount > enemyCount ? 'team1' : enemyCount > allyCount ? 'team2' : 'draw';
        console.log(`전투 타임아웃! 승자: ${winner}`);
        
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

      // 간단한 전투 진행 - 매 턴마다 하나씩 격파
      const activeAllies = battleState.participants.filter(p => p.pilotId < 100 && p.status === 'active');
      const activeEnemies = battleState.participants.filter(p => p.pilotId >= 100 && p.status === 'active');
      
      const recentLogs: any[] = [];

      // 랜덤하게 한 유닛을 격파
      if (activeAllies.length > 0 && activeEnemies.length > 0) {
        const allActive = [...activeAllies, ...activeEnemies];
        const victim = allActive[Math.floor(Math.random() * allActive.length)];
        
        victim.status = 'destroyed';
        victim.hp = 0;
        
        const pilot = await storage.getPilot(victim.pilotId);
        const victimName = pilot ? pilot.name : `Unit-${victim.pilotId}`;
        
        console.log(`${victimName} (${victim.pilotId}) 격파됨!`);
        
        recentLogs.push({
          timestamp: Date.now(),
          type: 'system',
          message: `${victimName}의 기체가 격파되었습니다!`
        });
      }

      // 업데이트 전송
      onUpdate({
        type: 'TURN_UPDATE',
        turn: battleState.turn,
        participants: battleState.participants,
        recentLogs
      });

    }, 500); // 0.5초마다 턴 진행

    this.battleTimers.set(battleState.id, battleTimer);
  }

  stopBattle(battleId: string): void {
    const timer = this.battleTimers.get(battleId);
    if (timer) {
      clearInterval(timer);
      this.battleTimers.delete(battleId);
    }
  }
}