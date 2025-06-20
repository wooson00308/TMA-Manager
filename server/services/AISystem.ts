import { type BattleState, type Pilot, type Mech } from "@shared/schema";
import { storage } from "../storage";
import { PathfindingService } from "./PathfindingService";

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE" | "DEFEND" | "SUPPORT" | "SCOUT" | "RETREAT" | "SPECIAL";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
  actionData?: any;
}

export class AISystem {
  private pathfinding = new PathfindingService();

  async makeSimpleDecision(participant: any, battleState: BattleState, team: string): Promise<AIDecision> {
    // 실제 파일럿 데이터 조회 (적군은 ID - 100으로 조회)
    const pilotLookupId = participant.pilotId >= 100 ? participant.pilotId - 100 : participant.pilotId;
    const pilot = await storage.getPilot(pilotLookupId);
    const mech = await storage.getMech(participant.mechId);
    
    const pilotName = pilot ? pilot.name : `Unit-${participant.pilotId}`;
    const isEnemy = participant.pilotId >= 100;
    const randomAction = Math.random();
    const isLowHP = participant.hp < 30;

    // 아군과 적군 구분
    const allies = battleState.participants.filter(p => {
      const isAlly = p.pilotId < 100;
      return isEnemy ? !isAlly : isAlly;
    }).filter(p => p.status === 'active' && p.pilotId !== participant.pilotId);

    const enemies = battleState.participants.filter(p => {
      const isAlly = p.pilotId < 100;
      return isEnemy ? isAlly : !isAlly;
    }).filter(p => p.status === 'active');

    // 모든 점유된 위치 (아군 + 적군)
    const occupiedPositions = battleState.participants
      .filter(p => p.status === 'active' && p.pilotId !== participant.pilotId)
      .map(p => p.position);
    
    const enemyPositions = enemies.map(e => e.position);

    // 근처 적 확인
    const nearbyEnemies = enemies.filter(enemy =>
      Math.abs(enemy.position.x - participant.position.x) <= 2 &&
      Math.abs(enemy.position.y - participant.position.y) <= 2
    );

    // 실제 파일럿 데이터 기반 성격 계산
    const getPilotPersonality = () => {
      if (!pilot) {
        return {
          aggressive: 0.6,
          tactical: 0.5,
          supportive: 0.3,
          dialogues: {
            attack: ["타겟 확인!", "공격 개시!"],
            support: ["지원한다!"],
            retreat: ["후퇴!"],
            scout: ["정찰 나간다!", "상황 파악 중!", "적 동향 확인!"]
          }
        };
      }

      // 실제 파일럿 스탯과 특성 기반 성격 계산
      const aggressive = pilot.traits.includes('AGGRESSIVE') ? 0.9 : 
                        pilot.traits.includes('CAUTIOUS') ? 0.3 : 
                        (pilot.reaction + pilot.accuracy) / 200;
      
      const tactical = pilot.traits.includes('ANALYTICAL') ? 0.9 : 
                      pilot.tactical / 100;
      
      const supportive = pilot.traits.includes('COOPERATIVE') ? 0.9 : 
                        pilot.traits.includes('INDEPENDENT') ? 0.2 : 
                        pilot.teamwork / 100;

      // 기숙사별 대사 스타일
      const getDialogues = () => {
        if (pilot.dormitory === 'Knight') {
          return {
            attack: [`${pilot.name}: "정의를 위해!"`, `${pilot.name}: "나이트의 명예로!"`, `${pilot.name}: "수호하겠다!"`],
            support: [`${pilot.name}: "동료를 지키겠다!"`, `${pilot.name}: "후방 지원!"`, `${pilot.name}: "버텨라!"`],
            retreat: [`${pilot.name}: "전략적 후퇴!"`, `${pilot.name}: "재정비 필요!"`, `${pilot.name}: "일시 후퇴!"`],
            scout: [`${pilot.name}: "정찰 임무 수행!"`, `${pilot.name}: "전방 확인!"`, `${pilot.name}: "적 위치 파악!"`]
          };
        } else if (pilot.dormitory === 'River') {
          return {
            attack: [`${pilot.name}: "흐름을 읽었다!"`, `${pilot.name}: "기회다!"`, `${pilot.name}: "정확히!"`],
            support: [`${pilot.name}: "지원 사격!"`, `${pilot.name}: "커버한다!"`, `${pilot.name}: "도와주마!"`],
            retreat: [`${pilot.name}: "물러난다!"`, `${pilot.name}: "흐름이 안 좋아!"`, `${pilot.name}: "재기를 노린다!"`],
            scout: [`${pilot.name}: "정찰 개시!"`, `${pilot.name}: "상황 파악!"`, `${pilot.name}: "적 동향 확인!"`]
          };
        } else { // Arbiter
          return {
            attack: [`${pilot.name}: "심판을 내린다!"`, `${pilot.name}: "균형을 맞추겠다!"`, `${pilot.name}: "정확한 판단!"`],
            support: [`${pilot.name}: "균형 지원!"`, `${pilot.name}: "조화를 이루자!"`, `${pilot.name}: "안정화!"`],
            retreat: [`${pilot.name}: "재평가 필요!"`, `${pilot.name}: "상황 분석!"`, `${pilot.name}: "신중히!"`],
            scout: [`${pilot.name}: "상황 분석!"`, `${pilot.name}: "정보 수집!"`, `${pilot.name}: "데이터 확인!"`]
          };
        }
      };

      return {
        aggressive,
        tactical,
        supportive,
        dialogues: getDialogues()
      };
    };

    const personality = getPilotPersonality();

    // 상황별 AI 결정
    if (isLowHP && randomAction < 0.7) {
      // 체력이 낮으면 후퇴 - A* 패스파인딩으로 안전한 경로 찾기
      const retreatPosition = this.pathfinding.findTacticalPosition(
        participant.position,
        enemyPositions,
        allies.map(a => a.position),
        true // 엄폐물 우선
      );
      
      const retreatDialogue = personality.dialogues.retreat[Math.floor(Math.random() * personality.dialogues.retreat.length)];
      return {
        type: "RETREAT",
        pilotName,
        dialogue: retreatDialogue,
        newPosition: retreatPosition
      };
    }

    // 테스트용: 적이 있으면 거리 상관없이 무조건 공격
    if (enemies.length > 0 && randomAction < 0.8) {
      const target = this.selectBestTarget(enemies, participant);
      if (target) {
        const attackDialogue = personality.dialogues.attack[Math.floor(Math.random() * personality.dialogues.attack.length)];
        const targetIndex = battleState.participants.findIndex(p => p.pilotId === target.pilotId);
        if (targetIndex !== -1) {
          return {
            type: "ATTACK",
            pilotName,
            dialogue: attackDialogue,
            targetIndex
          };
        }
      }
    }

    if (allies.some(ally => ally.hp < 30) && randomAction < personality.supportive) {
      // 지원적 성향과 동료가 위험하면 지원 - 부상당한 동료에게 최적 경로로 이동
      const injuredAlly = allies.find(ally => ally.hp < 30);
      if (injuredAlly) {
        const supportPath = this.pathfinding.findPath(
          participant.position,
          injuredAlly.position,
          occupiedPositions,
          enemyPositions,
          3
        );
        
        const supportPosition = supportPath.length > 0 ? supportPath[0] : 
          this.pathfinding.findTacticalPosition(participant.position, enemyPositions, allies.map(a => a.position), false);
        
        const supportDialogue = personality.dialogues.support[Math.floor(Math.random() * personality.dialogues.support.length)];
        return {
          type: "SUPPORT",
          pilotName,
          dialogue: supportDialogue,
          newPosition: supportPosition
        };
      }
    }

    if (randomAction < personality.tactical) {
      // 전술적 성향이면 정찰 - 적에게 가까운 고지대나 엄폐물로 이동
      const scoutPosition = this.pathfinding.findTacticalPosition(
        participant.position,
        enemyPositions,
        allies.map(a => a.position),
        false // 고지대 우선
      );
      
      const scoutDialogue = personality.dialogues.scout[Math.floor(Math.random() * personality.dialogues.scout.length)];
      return {
        type: "SCOUT",
        pilotName,
        dialogue: scoutDialogue,
        newPosition: scoutPosition
      };
    }

    // 적이 있으면 무조건 공격 (테스트용)
    if (enemies.length > 0) {
      const target = this.selectBestTarget(enemies, participant);
      if (target) {
        const targetIndex = battleState.participants.findIndex(p => p.pilotId === target.pilotId);
        if (targetIndex !== -1) {
          return {
            type: "ATTACK",
            pilotName,
            dialogue: `${pilotName}: "공격!!"`,
            targetIndex
          };
        }
      }
    }

    // 기본 이동 - A* 패스파인딩으로 전술적 위치 찾기
    const tacticalPosition = this.pathfinding.findTacticalPosition(
      participant.position,
      enemyPositions,
      allies.map(a => a.position),
      false
    );
    
    return {
      type: "MOVE",
      pilotName,
      newPosition: tacticalPosition
    };
  }

  // 기존 랜덤 기반 위치 계산 메서드들을 A* 패스파인딩으로 대체
  // PathfindingService에서 모든 이동 로직 처리

  private selectBestTarget(enemies: any[], attacker: any): any {
    return enemies.reduce((best, enemy) => {
      const dist = Math.abs(enemy.position.x - attacker.position.x) + Math.abs(enemy.position.y - attacker.position.y);
      const bestDist = Math.abs(best.position.x - attacker.position.x) + Math.abs(best.position.y - attacker.position.y);
      return enemy.hp < best.hp || (enemy.hp === best.hp && dist < bestDist) ? enemy : best;
    });
  }

  private getSpecialEffect(abilityName: string): any {
    const effects: { [key: string]: any } = {
      "정밀사격": { damage: 1.5, accuracy: 0.9, description: "정밀한 사격으로 높은 데미지" },
      "방어태세": { damageReduction: 0.5, counterAttack: true, description: "방어력 상승 및 반격" },
      "지원사격": { teamBonus: 0.2, areaEffect: true, description: "팀 전체 능력 향상" }
    };
    return effects[abilityName as keyof typeof effects] || null;
  }
}