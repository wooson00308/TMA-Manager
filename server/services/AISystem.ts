import { type BattleState } from "@shared/schema";
import { PilotService } from "./PilotService";

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE" | "DEFEND" | "SUPPORT" | "SCOUT" | "RETREAT" | "SPECIAL";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
  actionData?: any;
}

export class AISystem {
  makeSimpleDecision(participant: any, battleState: BattleState, team: string): AIDecision {
    // 파일럿 이름 매핑
    const pilotNames: { [key: number]: string } = {
      1: "Sasha Volkov",
      2: "Mei Chen", 
      3: "Alex Rodriguez",
      4: "Jin Watanabe",
      5: "Elena Vasquez",
      101: "Enemy Alpha",
      102: "Enemy Beta", 
      103: "Enemy Gamma"
    };

    const pilotName = pilotNames[participant.pilotId] || `Unit-${participant.pilotId}`;
    const isEnemy = participant.pilotId >= 100;
    const randomAction = Math.random();
    const isLowHP = participant.hp < 30;
    const isCriticalHP = participant.hp < 15;
    const isEarlyBattle = battleState.turn < 3;
    const isMidBattle = battleState.turn >= 3 && battleState.turn <= 7;
    const isLateBattle = battleState.turn > 7;
    
    const enemyTargets = team === "team1" 
      ? battleState.participants.filter((p: any) => p.pilotId >= 100 && p.status === 'active')
      : battleState.participants.filter((p: any) => p.pilotId < 100 && p.status === 'active');
    
    const allies = team === "team1"
      ? battleState.participants.filter((p: any) => p.pilotId < 100 && p.status === 'active')
      : battleState.participants.filter((p: any) => p.pilotId >= 100 && p.status === 'active');
    
    const damagedAllies = allies.filter((ally: any) => ally.hp < 50);
    const nearbyEnemies = enemyTargets.filter((enemy: any) => 
      Math.abs(enemy.position.x - participant.position.x) <= 2 &&
      Math.abs(enemy.position.y - participant.position.y) <= 2
    );

    // 파일럿별 성격과 대사
    const getPilotPersonality = () => {
      const personalities: { [key: number]: any } = {
        1: { // Sasha Volkov
          aggressive: 0.8,
          tactical: 0.6,
          supportive: 0.4,
          dialogues: {
            attack: ["목표 확인, 사격 개시!", "이거다!", "정확히 맞춰주마!"],
            support: ["지원 사격 준비!", "커버해줄게!", "뒤는 맡겨!"],
            retreat: ["잠시 후퇴!", "재정비가 필요해!", "포지션 변경!"],
            scout: ["정찰 나간다!", "상황 파악 중!", "적 동향 확인!"]
          }
        },
        2: { // Mei Chen
          aggressive: 0.4,
          tactical: 0.9,
          supportive: 0.8,
          dialogues: {
            attack: ["계산된 공격!", "전술적 타격!", "약점을 노린다!"],
            support: ["동료들 상태 확인!", "지원이 필요해!", "팀워크가 중요해!"],
            retreat: ["전략적 후퇴!", "재배치 필요!", "상황 분석 중!"],
            scout: ["정보 수집 중!", "적 패턴 분석!", "데이터 확인!"]
          }
        },
        3: { // Alex Rodriguez
          aggressive: 0.9,
          tactical: 0.3,
          supportive: 0.5,
          dialogues: {
            attack: ["전면 돌격!", "정면 승부다!", "밀어붙인다!"],
            support: ["같이 가자!", "힘내!", "포기하지 마!"],
            retreat: ["이런, 물러나야겠어!", "다시 기회를 노리자!", "재충전 시간!"],
            scout: ["앞장서겠어!", "길을 열어주겠어!", "돌파구를 찾자!"]
          }
        }
      };
      return personalities[participant.pilotId] || {
        aggressive: 0.5,
        tactical: 0.5,
        supportive: 0.5,
        dialogues: {
          attack: ["공격!", "사격!", "타격!"],
          support: ["지원!", "도움!", "커버!"],
          retreat: ["후퇴!", "이동!", "재배치!"],
          scout: ["정찰!", "확인!", "수색!"]
        }
      };
    };

    const personality = getPilotPersonality();
    
    const getDialogue = (actionType: string) => {
      const dialogues = personality.dialogues[actionType] || ["행동 개시!"];
      return dialogues[Math.floor(Math.random() * dialogues.length)];
    };

    // 위급 상황 우선 처리 - 체력 위험
    if (isCriticalHP) {
      if (randomAction < 0.7) {
        return {
          type: "RETREAT",
          pilotName: pilotName,
          newPosition: this.calculateRetreatPosition(participant.position, team, enemyTargets),
          dialogue: getDialogue("retreat")
        };
      } else {
        return {
          type: "COMMUNICATE",
          pilotName: pilotName,
          dialogue: "치명적 손상! 지원 요청!"
        };
      }
    }

    // 지원 행동 - 아군이 피해를 입었을 때
    if (personality.supportive > 0.6 && damagedAllies.length > 0 && randomAction < 0.3) {
      const targetAlly = damagedAllies[0];
      return {
        type: "SUPPORT",
        pilotName: pilotName,
        targetIndex: battleState.participants.findIndex((p: any) => p === targetAlly),
        dialogue: getDialogue("support"),
        actionData: { supportType: "heal", amount: 15 }
      };
    }

    // 방어 행동 - 적이 근접했을 때
    if (nearbyEnemies.length >= 2 && randomAction < 0.25) {
      return {
        type: "DEFEND",
        pilotName: pilotName,
        dialogue: "방어 태세!",
        actionData: { defenseBonus: 0.5, duration: 2 }
      };
    }

    // 정찰 행동 - 초반 및 전술적 파일럿
    if ((isEarlyBattle || personality.tactical > 0.7) && randomAction < 0.2) {
      return {
        type: "SCOUT",
        pilotName: pilotName,
        newPosition: this.calculateScoutPosition(participant.position, team, enemyTargets),
        dialogue: getDialogue("scout")
      };
    }

    // 특수 능력 사용 - 중반 이후
    if (isMidBattle && randomAction < 0.15) {
      const specialAbilities = ["오버드라이브", "정밀 조준", "일제 사격", "은폐 기동"];
      const ability = specialAbilities[Math.floor(Math.random() * specialAbilities.length)];
      return {
        type: "SPECIAL",
        pilotName: pilotName,
        dialogue: `${ability} 발동!`,
        actionData: { abilityName: ability, effect: this.getSpecialEffect(ability) }
      };
    }

    // 성격 기반 행동 결정
    const personalityWeight = randomAction;
    
    // 공격적 성격 - 공격 우선
    if (personality.aggressive > personalityWeight && enemyTargets.length > 0) {
      const target = this.selectBestTarget(enemyTargets, participant);
      const targetIndex = battleState.participants.findIndex((p: any) => p === target);
      return {
        type: "ATTACK",
        pilotName: pilotName,
        targetIndex,
        dialogue: getDialogue("attack")
      };
    }
    
    // 전술적 성격 - 포지셔닝 우선
    if (personality.tactical > personalityWeight) {
      const tacticalPosition = this.calculateTacticalPosition(participant.position, team, enemyTargets, allies);
      return {
        type: "MOVE",
        pilotName: pilotName,
        newPosition: tacticalPosition,
        dialogue: "전술적 이동!"
      };
    }

    // 지원 성격 - 팀 지원
    if (personality.supportive > personalityWeight && allies.length > 1) {
      const weakestAlly = allies.reduce((prev: any, current: any) => 
        current.hp < prev.hp ? current : prev
      );
      return {
        type: "SUPPORT",
        pilotName: pilotName,
        targetIndex: battleState.participants.findIndex((p: any) => p === weakestAlly),
        dialogue: getDialogue("support")
      };
    }

    // 기본 행동 - 상황에 따른 적응
    if (enemyTargets.length > 0 && randomAction < 0.5) {
      const target = enemyTargets[Math.floor(Math.random() * enemyTargets.length)];
      const targetIndex = battleState.participants.findIndex((p: any) => p === target);
      return {
        type: "ATTACK",
        pilotName: pilotName,
        targetIndex,
        dialogue: getDialogue("attack")
      };
    } else if (randomAction < 0.8) {
      return {
        type: "MOVE",
        pilotName: pilotName,
        newPosition: this.calculateNewPosition(participant.position, team),
        dialogue: "포지션 조정!"
      };
    }

    // 대화/상태 보고
    const statusDialogues = [
      "상황 확인 중...",
      "대기 상태.",
      "준비 완료!",
      "적 동향 주시 중.",
      "시스템 정상."
    ];
    return {
      type: "COMMUNICATE",
      pilotName: pilotName,
      dialogue: statusDialogues[Math.floor(Math.random() * statusDialogues.length)]
    };
  }

  private calculateNewPosition(currentPos: { x: number; y: number }, team: string): { x: number; y: number } {
    const movement = team === "team1" ? 1 : -1;
    return {
      x: Math.max(1, Math.min(15, currentPos.x + movement)),
      y: Math.max(1, Math.min(11, currentPos.y + (Math.random() > 0.5 ? 1 : -1)))
    };
  }

  private calculateRetreatPosition(currentPos: { x: number; y: number }, team: string, enemies: any[]): { x: number; y: number } {
    // 적들로부터 최대한 멀어지는 방향으로 이동
    const safeDirection = team === "team1" ? -2 : 2;
    return {
      x: Math.max(1, Math.min(15, currentPos.x + safeDirection)),
      y: Math.max(1, Math.min(11, currentPos.y + (Math.random() > 0.5 ? -1 : 1)))
    };
  }

  private calculateScoutPosition(currentPos: { x: number; y: number }, team: string, enemies: any[]): { x: number; y: number } {
    // 적 진영 쪽으로 정찰 이동
    const scoutDirection = team === "team1" ? 2 : -2;
    return {
      x: Math.max(1, Math.min(15, currentPos.x + scoutDirection)),
      y: Math.max(1, Math.min(11, currentPos.y))
    };
  }

  private calculateTacticalPosition(currentPos: { x: number; y: number }, team: string, enemies: any[], allies: any[]): { x: number; y: number } {
    // 아군과 적의 중간 지점으로 전술적 포지셔닝
    if (enemies.length === 0) return this.calculateNewPosition(currentPos, team);
    
    const nearestEnemy = enemies.reduce((prev: any, current: any) => {
      const prevDist = Math.abs(prev.position.x - currentPos.x) + Math.abs(prev.position.y - currentPos.y);
      const currDist = Math.abs(current.position.x - currentPos.x) + Math.abs(current.position.y - currentPos.y);
      return currDist < prevDist ? current : prev;
    });

    const optimalX = Math.floor((currentPos.x + nearestEnemy.position.x) / 2);
    const optimalY = Math.floor((currentPos.y + nearestEnemy.position.y) / 2);

    return {
      x: Math.max(1, Math.min(15, optimalX)),
      y: Math.max(1, Math.min(11, optimalY))
    };
  }

  private selectBestTarget(enemies: any[], attacker: any): any {
    // 가장 약한 적을 우선 타겟으로 선택
    return enemies.reduce((prev: any, current: any) => {
      const prevScore = prev.hp + (Math.abs(prev.position.x - attacker.position.x) + Math.abs(prev.position.y - attacker.position.y)) * 5;
      const currScore = current.hp + (Math.abs(current.position.x - attacker.position.x) + Math.abs(current.position.y - attacker.position.y)) * 5;
      return currScore < prevScore ? current : prev;
    });
  }

  private getSpecialEffect(abilityName: string): any {
    const effects: { [key: string]: any } = {
      "오버드라이브": { damage: 1.5, duration: 3 },
      "정밀 조준": { accuracy: 1.3, criticalChance: 0.3 },
      "일제 사격": { areaAttack: true, targets: 3 },
      "은폐 기동": { dodge: 0.5, stealth: true }
    };
    return effects[abilityName] || { bonus: 1.2 };
  }
}