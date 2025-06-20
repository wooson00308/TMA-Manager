import { type BattleState } from "@shared/schema";
import { PilotService } from "../services/PilotService";
import { calculateRetreatPosition as sharedCalculateRetreatPosition, calculateScoutPosition as sharedCalculateScoutPosition, calculateTacticalPosition as sharedCalculateTacticalPosition, selectBestTarget as sharedSelectBestTarget } from "@shared/ai/utils";

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE" | "DEFEND" | "SUPPORT" | "SCOUT" | "RETREAT" | "SPECIAL";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
  actionData?: any;
}

// The core AI decision-making logic resides in the domain layer so that it is
// completely framework-agnostic and free of side-effects.  External concerns
// such as persistence or transport are delegated to the application layer.
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
      103: "Enemy Gamma",
    };

    const pilotName = pilotNames[participant.pilotId] || `Unit-${participant.pilotId}`;
    const randomAction = Math.random();
    const isCriticalHP = participant.hp < 15;
    const isEarlyBattle = battleState.turn < 3;
    const isMidBattle = battleState.turn >= 3 && battleState.turn <= 7;

    const enemyTargets = team === "team1"
      ? battleState.participants.filter((p: any) => p.pilotId >= 100 && p.status === "active")
      : battleState.participants.filter((p: any) => p.pilotId < 100 && p.status === "active");

    const allies = team === "team1"
      ? battleState.participants.filter((p: any) => p.pilotId < 100 && p.status === "active")
      : battleState.participants.filter((p: any) => p.pilotId >= 100 && p.status === "active");

    const damagedAllies = allies.filter((ally: any) => ally.hp < 50);
    const nearbyEnemies = enemyTargets.filter((enemy: any) =>
      Math.abs(enemy.position.x - participant.position.x) <= 2 &&
      Math.abs(enemy.position.y - participant.position.y) <= 2,
    );

    const personality = this.getPilotPersonality(participant.pilotId);
    const getDialogue = (type: string) => {
      const dialogues = personality.dialogues[type] || ["..."];
      return dialogues[Math.floor(Math.random() * dialogues.length)];
    };

    if (isCriticalHP && randomAction < 0.7) {
      return {
        type: "RETREAT",
        pilotName,
        newPosition: this.calculateRetreatPosition(participant.position, team, enemyTargets),
        dialogue: getDialogue("retreat"),
      };
    }

    if (personality.supportive > 0.6 && damagedAllies.length && randomAction < 0.3) {
      const targetAlly = damagedAllies[0];
      return {
        type: "SUPPORT",
        pilotName,
        targetIndex: battleState.participants.findIndex((p: any) => p === targetAlly),
        dialogue: getDialogue("support"),
        actionData: { supportType: "heal", amount: 15 },
      };
    }

    if (nearbyEnemies.length >= 2 && randomAction < 0.25) {
      return {
        type: "DEFEND",
        pilotName,
        dialogue: "방어 태세!",
        actionData: { defenseBonus: 0.5, duration: 2 },
      };
    }

    if ((isEarlyBattle || personality.tactical > 0.7) && randomAction < 0.2) {
      return {
        type: "SCOUT",
        pilotName,
        newPosition: this.calculateScoutPosition(participant.position, team, enemyTargets),
        dialogue: getDialogue("scout"),
      };
    }

    if (isMidBattle && randomAction < 0.15) {
      const abilities = ["오버드라이브", "정밀 조준", "일제 사격", "은폐 기동"];
      const ability = abilities[Math.floor(Math.random() * abilities.length)];
      return {
        type: "SPECIAL",
        pilotName,
        dialogue: `${ability} 발동!`,
        actionData: { abilityName: ability, effect: this.getSpecialEffect(ability) },
      };
    }

    const personalityWeight = randomAction;
    if (personality.aggressive > personalityWeight && enemyTargets.length) {
      const target = this.selectBestTarget(enemyTargets, participant);
      return {
        type: "ATTACK",
        pilotName,
        targetIndex: battleState.participants.findIndex((p: any) => p === target),
        dialogue: getDialogue("attack"),
      };
    }

    if (personality.tactical > personalityWeight) {
      return {
        type: "MOVE",
        pilotName,
        newPosition: this.calculateTacticalPosition(participant.position, team, enemyTargets, allies),
        dialogue: "전술적 이동!",
      };
    }

    if (personality.supportive > personalityWeight && allies.length > 1) {
      const weakestAlly = allies.reduce((prev: any, curr: any) => (curr.hp < prev.hp ? curr : prev));
      return {
        type: "SUPPORT",
        pilotName,
        targetIndex: battleState.participants.findIndex((p: any) => p === weakestAlly),
        dialogue: getDialogue("support"),
      };
    }

    if (enemyTargets.length && randomAction < 0.5) {
      const target = enemyTargets[Math.floor(Math.random() * enemyTargets.length)];
      return {
        type: "ATTACK",
        pilotName,
        targetIndex: battleState.participants.findIndex((p: any) => p === target),
        dialogue: getDialogue("attack"),
      };
    }

    return {
      type: "MOVE",
      pilotName,
      newPosition: this.calculateNewPosition(participant.position, team),
      dialogue: "포지션 조정!",
    };
  }

  // Personality helper
  private getPilotPersonality(pilotId: number) {
    const personalities: { [key: number]: any } = {
      1: {
        aggressive: 0.8,
        tactical: 0.6,
        supportive: 0.4,
        dialogues: {
          attack: ["목표 확인, 사격 개시!", "이거다!", "정확히 맞춰주마!"],
          support: ["지원 사격 준비!", "커버해줄게!", "뒤는 맡겨!"],
          retreat: ["잠시 후퇴!", "재정비가 필요해!", "포지션 변경!"],
          scout: ["정찰 나간다!", "상황 파악 중!", "적 동향 확인!"]
        },
      },
      2: {
        aggressive: 0.4,
        tactical: 0.9,
        supportive: 0.8,
        dialogues: {
          attack: ["계산된 공격!", "전술적 타격!", "약점을 노린다!"],
          support: ["동료들 상태 확인!", "지원이 필요해!", "팀워크가 중요해!"],
          retreat: ["전략적 후퇴!", "재배치 필요!", "상황 분석 중!"],
          scout: ["정보 수집 중!", "적 패턴 분석!", "데이터 확인!"]
        },
      },
      3: {
        aggressive: 0.9,
        tactical: 0.3,
        supportive: 0.5,
        dialogues: {
          attack: ["전면 돌격!", "정면 승부다!", "밀어붙인다!"],
          support: ["같이 가자!", "힘내!", "포기하지 마!"],
          retreat: ["이런, 물러나야겠어!", "다시 기회를 노리자!", "재충전 시간!"],
          scout: ["앞장서겠어!", "길을 열어주겠어!", "돌파구를 찾자!"]
        },
      },
    };
    return personalities[pilotId] || {
      aggressive: 0.5,
      tactical: 0.5,
      supportive: 0.5,
      dialogues: {
        attack: ["공격!", "사격!", "타격!"],
        support: ["지원!", "도움!", "커버!"],
        retreat: ["후퇴!", "이동!", "재배치!"],
        scout: ["정찰!", "확인!", "수색!"]
      },
    };
  }

  // Position helpers
  private calculateNewPosition(current: { x: number; y: number }, team: string) {
    const dx = team === "team1" ? 1 : -1;
    return { x: Math.max(1, Math.min(15, current.x + dx)), y: current.y };
  }

  private calculateRetreatPosition(current: { x: number; y: number }, team: string, enemies: any[]) {
    return sharedCalculateRetreatPosition(current, team, enemies);
  }

  private calculateScoutPosition(current: { x: number; y: number }, team: string, enemies: any[]) {
    return sharedCalculateScoutPosition(current, team, enemies);
  }

  private calculateTacticalPosition(current: { x: number; y: number }, team: string, enemies: any[], allies: any[]) {
    return sharedCalculateTacticalPosition(current, team, enemies, allies);
  }

  private selectBestTarget(enemies: any[], attacker: any) {
    return sharedSelectBestTarget(enemies, attacker, { aggressive: 0.5, tactical: 0.5, supportive: 0.5 });
  }

  private getSpecialEffect(ability: string) {
    switch (ability) {
      case "오버드라이브":
        return { attackMultiplier: 1.5, duration: 2 };
      case "정밀 조준":
        return { accuracyBonus: 0.3, duration: 3 };
      case "일제 사격":
        return { multiTarget: true, damageModifier: 0.7 };
      case "은폐 기동":
        return { evasionBonus: 0.4, duration: 2 };
      default:
        return {};
    }
  }
} 