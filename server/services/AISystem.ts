import { type BattleState } from "@shared/schema";
import { PilotService } from "./PilotService";

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
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
    const isLowHP = participant.hp < 50;
    const isEarlyBattle = battleState.turn < 3;
    const enemyTargets = team === "team1" 
      ? battleState.participants.filter((p: any) => p.pilotId >= 100 && p.status === 'active')
      : battleState.participants.filter((p: any) => p.pilotId < 100 && p.status === 'active');

    // 대사 선택
    const getCombatDialogue = () => {
      if (isEnemy) {
        return ["타겟 공격!", "전면 공격이다!", "격파한다!"][Math.floor(Math.random() * 3)];
      } else {
        return ["돌격이야!", "나가자!", "공격 개시!"][Math.floor(Math.random() * 3)];
      }
    };

    const getMovementDialogue = () => {
      if (isEnemy) {
        return ["포지션 이동!", "재배치!", "우회한다!"][Math.floor(Math.random() * 3)];
      } else {
        return ["이동한다!", "포지션 체인지!", "좌표 이동!"][Math.floor(Math.random() * 3)];
      }
    };

    const getDamageDialogue = () => {
      if (isEnemy) {
        return ["데미지 확인!", "시스템 체크!", "아직 괜찮다!"][Math.floor(Math.random() * 3)];
      } else {
        return ["아직 괜찮아!", "이 정도론!", "더 세게 와!"][Math.floor(Math.random() * 3)];
      }
    };

    // 초반 전투 시 커뮤니케이션 증가
    if (isEarlyBattle && randomAction < 0.4) {
      return {
        type: "COMMUNICATE",
        pilotName: pilotName,
        dialogue: getCombatDialogue()
      };
    }

    // 체력이 낮을 때 대사 반응
    if (isLowHP && randomAction < 0.3) {
      return {
        type: "COMMUNICATE",
        pilotName: pilotName,
        dialogue: getDamageDialogue()
      };
    }

    // 일반적인 행동 결정
    if (randomAction < 0.4 && enemyTargets.length > 0) {
      const targetIndex = battleState.participants.findIndex((p: any) => p === enemyTargets[0]);
      return {
        type: "ATTACK",
        pilotName: pilotName,
        targetIndex,
        dialogue: getCombatDialogue()
      };
    } else if (randomAction < 0.7) {
      const newPosition = this.calculateNewPosition(participant.position, team);
      return {
        type: "MOVE",
        pilotName: pilotName,
        newPosition,
        dialogue: getMovementDialogue()
      };
    }

    // 기본 커뮤니케이션
    return {
      type: "COMMUNICATE",
      pilotName: pilotName,
      dialogue: "대기 중..."
    };
  }

  private calculateNewPosition(currentPos: { x: number; y: number }, team: string): { x: number; y: number } {
    const movement = team === "team1" ? 1 : -1;
    return {
      x: Math.max(1, Math.min(18, currentPos.x + movement)),
      y: Math.max(1, Math.min(10, currentPos.y + (Math.random() > 0.5 ? 1 : -1)))
    };
  }
}