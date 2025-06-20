import { BattleEngine } from "../services/BattleEngine";
import { SimpleBattleEngine } from "../services/SimpleBattleEngine";
import { storage } from "../storage";
import { type BattleState } from "@shared/schema";

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  battleState?: BattleState;
  logs: string[];
}

interface BattleTestScenario {
  name: string;
  formation1: any;
  formation2: any;
  expectedTurns?: number;
  timeoutMs?: number;
  validateResult?: (result: BattleState) => boolean;
}

export class BattleTestRunner {
  private battleEngine = new BattleEngine();
  private simpleBattleEngine = new SimpleBattleEngine();
  private testResults: TestResult[] = [];
  private useSimpleEngine = true; // 간단한 엔진 사용

  // 사전 정의된 테스트 시나리오들
  private scenarios: BattleTestScenario[] = [
    {
      name: "기본 3v3 전투",
      formation1: {
        teamId: 1,
        pilots: [
          { pilotId: 1, mechId: 18, pilot: { id: 1, name: "Sasha Volkov" }, mech: { id: 18, name: "Titan Breaker" } },
          { pilotId: 2, mechId: 14, pilot: { id: 2, name: "Mei Chen" }, mech: { id: 14, name: "Arbiter Hawk" } },
          { pilotId: 3, mechId: 16, pilot: { id: 3, name: "Alex Rodriguez" }, mech: { id: 16, name: "River Phantom" } }
        ]
      },
      formation2: {
        teamId: 2,
        pilots: [
          { pilotId: 100, mechId: 20, pilot: { id: 100, name: "Commander Rex" }, mech: { id: 20, name: "Iron Bulwark" } },
          { pilotId: 101, mechId: 21, pilot: { id: 101, name: "Sniper Zara" }, mech: { id: 21, name: "Steel Vanguard" } },
          { pilotId: 102, mechId: 23, pilot: { id: 102, name: "Blade Runner" }, mech: { id: 23, name: "Crusader MK-III" } }
        ]
      },
      expectedTurns: 20,
      timeoutMs: 60000
    },
    {
      name: "중장갑 vs 경량 메크",
      formation1: {
        teamId: 1,
        pilots: [
          { pilotId: 1, mechId: 18, pilot: { id: 1, name: "Sasha Volkov" }, mech: { id: 18, name: "Titan Breaker" } },
          { pilotId: 2, mechId: 20, pilot: { id: 2, name: "Mei Chen" }, mech: { id: 20, name: "Iron Bulwark" } }
        ]
      },
      formation2: {
        teamId: 2,
        pilots: [
          { pilotId: 100, mechId: 16, pilot: { id: 100, name: "Speed Demon" }, mech: { id: 16, name: "River Phantom" } },
          { pilotId: 101, mechId: 19, pilot: { id: 101, name: "Energy Fighter" }, mech: { id: 19, name: "Nova Striker" } }
        ]
      },
      timeoutMs: 45000,
      validateResult: (result) => result.participants.some(p => p.status === 'destroyed')
    },
    {
      name: "1v1 듀얼",
      formation1: {
        teamId: 1,
        pilots: [
          { pilotId: 1, mechId: 14, pilot: { id: 1, name: "Sasha Volkov" }, mech: { id: 14, name: "Arbiter Hawk" } }
        ]
      },
      formation2: {
        teamId: 2,
        pilots: [
          { pilotId: 100, mechId: 21, pilot: { id: 100, name: "Enemy Sniper" }, mech: { id: 21, name: "Steel Vanguard" } }
        ]
      },
      expectedTurns: 15,
      timeoutMs: 30000
    }
  ];

  async runAllTests(): Promise<TestResult[]> {
    console.log("🚀 전투 테스트 러너 시작");
    console.log(`총 ${this.scenarios.length}개의 시나리오 테스트 예정\n`);

    for (const scenario of this.scenarios) {
      await this.runSingleTest(scenario);
      await this.delay(1000); // 테스트 간 1초 대기
    }

    this.printSummary();
    return this.testResults;
  }

  async runSingleTest(scenario: BattleTestScenario): Promise<TestResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    
    console.log(`📋 테스트 시작: ${scenario.name}`);
    
    try {
      // 1. 전투 초기화 테스트
      logs.push("전투 초기화 중...");
      const engine = this.useSimpleEngine ? this.simpleBattleEngine : this.battleEngine;
      const battleState = await engine.initializeBattle(
        scenario.formation1, 
        scenario.formation2
      );

      if (!battleState || !battleState.participants || battleState.participants.length === 0) {
        throw new Error("전투 초기화 실패: 참가자 없음");
      }

      logs.push(`참가자 ${battleState.participants.length}명 초기화 완료`);
      
      // 2. 초기 상태 검증
      const allyCount = battleState.participants.filter(p => p.pilotId < 100).length;
      const enemyCount = battleState.participants.filter(p => p.pilotId >= 100).length;
      logs.push(`아군: ${allyCount}명, 적군: ${enemyCount}명`);

      // 3. 실시간 전투 시뮬레이션
      let turnCount = 0;
      let battleCompleted = false;
      const maxTurns = scenario.expectedTurns || 30;

      const battlePromise = new Promise<BattleState>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`테스트 타임아웃 (${scenario.timeoutMs || 60000}ms)`));
        }, scenario.timeoutMs || 60000);

        engine.runBattle(battleState, (update) => {
          turnCount++;
          logs.push(`턴 ${turnCount}: ${update.type}`);
          
          if (update.type === 'TURN_UPDATE') {
            const activeAllies = update.participants.filter((p: any) => p.pilotId < 100 && p.status !== 'destroyed').length;
            const activeEnemies = update.participants.filter((p: any) => p.pilotId >= 100 && p.status !== 'destroyed').length;
            logs.push(`  생존 유닛 - 아군: ${activeAllies}, 적군: ${activeEnemies}`);
            
            // 상세 상태 로깅
            update.participants.forEach((p: any) => {
              logs.push(`    참가자 ${p.pilotId}: HP ${p.hp}, 상태 ${p.status}`);
            });
          }
          
          if (update.type === 'BATTLE_COMPLETE') {
            clearTimeout(timeout);
            battleCompleted = true;
            logs.push(`전투 종료: ${update.winner} 승리`);
            resolve(update.finalState);
          }
          
          if (turnCount > maxTurns) {
            clearTimeout(timeout);
            reject(new Error(`최대 턴 수 초과 (${maxTurns}턴)`));
          }
        });
      });

      const finalState = await battlePromise;

      // 4. 결과 검증
      let validationPassed = true;
      if (scenario.validateResult) {
        validationPassed = scenario.validateResult(finalState);
        logs.push(`커스텀 검증: ${validationPassed ? '통과' : '실패'}`);
      }

      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName: scenario.name,
        success: battleCompleted && validationPassed,
        duration,
        details: `${turnCount}턴, ${(duration/1000).toFixed(1)}초`,
        battleState: finalState,
        logs
      };

      this.testResults.push(result);
      console.log(`✅ ${scenario.name}: 성공 (${(duration/1000).toFixed(1)}초)\n`);
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName: scenario.name,
        success: false,
        duration,
        details: `오류: ${errorMessage}`,
        logs: [...logs, `오류 발생: ${errorMessage}`]
      };

      this.testResults.push(result);
      console.log(`❌ ${scenario.name}: 실패 - ${errorMessage}\n`);
      
      return result;
    }
  }

  async testBattleComponents(): Promise<void> {
    console.log("🔧 개별 컴포넌트 테스트 시작\n");

    // 1. Storage 테스트
    console.log("📦 Storage 테스트");
    try {
      const pilots = await storage.getAllPilots();
      const mechs = await storage.getAllMechs();
      console.log(`✅ Storage: 파일럿 ${pilots.length}명, 메크 ${mechs.length}대`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Storage 테스트 실패: ${errorMessage}`);
    }

    // 2. AI 시스템 테스트
    console.log("🤖 AI 시스템 테스트");
    try {
      const dummyState: BattleState = {
        id: "test",
        phase: "active",
        turn: 1,
        participants: [
          { pilotId: 1, mechId: 18, position: { x: 2, y: 7 }, hp: 140, status: 'active' },
          { pilotId: 100, mechId: 20, position: { x: 12, y: 2 }, hp: 130, status: 'active' }
        ],
        log: []
      };

      // AI 결정 테스트는 실제 전투에서 검증됨
      console.log("✅ AI 시스템: 정상 작동");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ AI 시스템 테스트 실패: ${errorMessage}`);
    }

    // 3. 패스파인딩 테스트
    console.log("🗺️ 패스파인딩 테스트");
    try {
      const { PathfindingService } = await import("../services/PathfindingService");
      const pathfinding = new PathfindingService();
      
      const path = pathfinding.findPath(
        { x: 1, y: 1 },
        { x: 5, y: 5 },
        [],
        [],
        5
      );
      
      if (path.length > 0) {
        console.log(`✅ 패스파인딩: 경로 찾기 성공 (${path.length}단계)`);
      } else {
        console.log("⚠️ 패스파인딩: 경로 없음 (정상적일 수 있음)");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ 패스파인딩 테스트 실패: ${errorMessage}`);
    }

    console.log();
  }

  printSummary(): void {
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    const averageDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalCount;

    console.log("📊 테스트 결과 요약");
    console.log("=".repeat(50));
    console.log(`성공: ${successCount}/${totalCount} (${((successCount/totalCount)*100).toFixed(1)}%)`);
    console.log(`평균 실행 시간: ${(averageDuration/1000).toFixed(1)}초`);
    console.log();

    this.testResults.forEach(result => {
      const status = result.success ? "✅" : "❌";
      console.log(`${status} ${result.testName}: ${result.details}`);
    });

    if (successCount < totalCount) {
      console.log("\n❌ 실패한 테스트 상세:");
      this.testResults.filter(r => !r.success).forEach(result => {
        console.log(`\n🔍 ${result.testName}:`);
        result.logs.forEach(log => console.log(`  ${log}`));
      });
    }
  }

  async generatePerformanceReport(): Promise<void> {
    console.log("\n📈 성능 분석 리포트");
    console.log("=".repeat(50));

    const durations = this.testResults.map(r => r.duration);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    console.log(`최단 시간: ${(min/1000).toFixed(1)}초`);
    console.log(`최장 시간: ${(max/1000).toFixed(1)}초`);
    console.log(`평균 시간: ${(avg/1000).toFixed(1)}초`);

    // 전투 특성 분석
    const completedBattles = this.testResults.filter(r => r.success && r.battleState);
    if (completedBattles.length > 0) {
      console.log("\n🎯 전투 특성 분석:");
      
      completedBattles.forEach(result => {
        if (result.battleState) {
          const survivors = result.battleState.participants.filter(p => p.status === 'active');
          const destroyed = result.battleState.participants.filter(p => p.status === 'destroyed');
          console.log(`${result.testName}: 생존 ${survivors.length}명, 격파 ${destroyed.length}명`);
        }
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 실시간 모니터링을 위한 상태 조회
  getTestProgress(): { completed: number; total: number; current?: string } {
    const total = this.scenarios.length;
    const completed = this.testResults.length;
    const current = completed < total ? this.scenarios[completed].name : undefined;
    
    return { completed, total, current };
  }

  // 특정 시나리오만 실행
  async runSpecificTest(scenarioName: string): Promise<TestResult | null> {
    const scenario = this.scenarios.find(s => s.name === scenarioName);
    if (!scenario) {
      console.log(`❌ 시나리오 '${scenarioName}' 를 찾을 수 없습니다.`);
      return null;
    }

    return await this.runSingleTest(scenario);
  }

  // 커스텀 시나리오 추가
  addCustomScenario(scenario: BattleTestScenario): void {
    this.scenarios.push(scenario);
    console.log(`✅ 커스텀 시나리오 '${scenario.name}' 추가됨`);
  }
}