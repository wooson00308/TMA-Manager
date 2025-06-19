import { type BattleState } from "@shared/schema";

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
}

export class AISystem {
  private pilotPersonalities = {
    1: { 
      name: "사샤", callsign: "SASHA-03", dormitory: "RIVER", 
      traits: ["AGGRESSIVE", "RIVER", "돌입선호"],
      combat: ["치이! 가버려!", "내가 먼저다!", "돌격이야!"],
      movement: ["이쪽으로 밀고 나간다!", "빠르게 접근!", "측면 우회한다!"],
      damage: ["아직 괜찮아!", "이 정도론 안 죽어!", "더 세게 와!"],
      victory: ["어떻게? 내가 이겼다고?", "역시 리버 스타일이지!"]
    },
    2: { 
      name: "멘테", callsign: "MENTE-11", dormitory: "KNIGHT", 
      traits: ["ANALYTICAL", "KNIGHT", "분석적"],
      combat: ["상황을 분석하고 있습니다.", "전술적 우위 확보.", "조율된 공격 개시."],
      movement: ["최적 위치로 이동.", "대형 유지하며 전진.", "안전한 루트로 우회."],
      damage: ["손상 보고. 지속 가능.", "방어막 재충전 중.", "전투 지속 가능합니다."],
      victory: ["계산대로입니다.", "나이트의 전술이 통했네요."]
    },
    3: { 
      name: "아즈마", callsign: "AZUMA-07", dormitory: "ARBITER", 
      traits: ["CAUTIOUS", "ARBITER", "정밀사격"],
      combat: ["타겟 스캔 완료.", "정밀 조준 중.", "한 발로 끝낸다."],
      movement: ["유리한 고지로 이동.", "저격 위치 선점.", "거리 확보."],
      damage: ["데미지 리포트. 경미함.", "시스템 정상.", "아직 문제없음."],
      victory: ["예상 범위 내입니다.", "아비터의 정밀성이죠."]
    },
    101: { 
      name: "마커스", callsign: "MARCUS-AI", dormitory: "UNKNOWN", 
      traits: ["VETERAN", "경험풍부"],
      combat: ["경험이 말해주는군!", "이런 건 익숙해!", "베테랑의 직감이야!"],
      movement: ["오래된 경험으로!", "이런 상황은 여러 번 봤지!", "안전한 길로!"],
      damage: ["이 정도야 뭐!", "여전히 멀쩡하다!", "더 심한 것도 견뎠어!"],
      victory: ["역시 경험의 차이지!", "젊은 것들아, 더 배워라!"]
    },
    102: { 
      name: "레이븐", callsign: "RAVEN-AI", dormitory: "UNKNOWN", 
      traits: ["TACTICAL", "전술적"],
      combat: ["각도 계산 완료.", "커버 파이어!", "재배치 중."],
      movement: ["전술적 이동.", "우위 확보 중.", "포지션 체인지."],
      damage: ["데미지 어세스먼트.", "시스템 체크.", "전투 지속."],
      victory: ["전술의 승리다.", "계획대로야."]
    },
    103: { 
      name: "스틸", callsign: "STEEL-AI", dormitory: "UNKNOWN", 
      traits: ["AGGRESSIVE", "공격적"],
      combat: ["와라!", "자비는 없다!", "전면 공격이다!"],
      movement: ["앞으로!", "후퇴는 없어!", "돌진한다!"],
      damage: ["아직이야!", "더 세게 와!", "이 정도로?"],
      victory: ["힘이 곧 정의다!", "압도적이었지!"]
    }
  };

  makeDecision(participant: any, battleState: BattleState, team: string): AIDecision {
    const personality = this.pilotPersonalities[participant.pilotId as keyof typeof this.pilotPersonalities] || {
      name: "Unknown Pilot",
      callsign: "UNKNOWN",
      dormitory: "UNKNOWN", 
      traits: ["BALANCED"],
      combat: ["Engaging target!"],
      movement: ["Moving to position!"],
      damage: ["Taking damage!"],
      victory: ["Mission complete!"]
    };
    
    const randomAction = Math.random();
    const isLowHP = participant.hp < 50;
    const isEarlyBattle = battleState.turn < 3;
    const enemyTargets = team === "team1" 
      ? battleState.participants.filter((p: any) => p.pilotId >= 100 && p.status === 'active')
      : battleState.participants.filter((p: any) => p.pilotId < 100 && p.status === 'active');

    // 특성에 따른 행동 확률 조정
    const isAggressive = personality.traits.includes("AGGRESSIVE");
    const isCautious = personality.traits.includes("CAUTIOUS");
    const isAnalytical = personality.traits.includes("ANALYTICAL");

    // 초반 전투 시 커뮤니케이션 증가
    if (isEarlyBattle && randomAction < 0.4) {
      return {
        type: "COMMUNICATE",
        pilotName: personality.name,
        dialogue: personality.combat[Math.floor(Math.random() * personality.combat.length)]
      };
    }

    // 체력이 낮을 때 대사 반응
    if (isLowHP && randomAction < 0.3) {
      return {
        type: "COMMUNICATE",
        pilotName: personality.name,
        dialogue: personality.damage[Math.floor(Math.random() * personality.damage.length)]
      };
    }

    // 공격적 성향일 때 공격 우선
    if (isAggressive && enemyTargets.length > 0 && randomAction < 0.6) {
      const targetIndex = battleState.participants.findIndex((p: any) => p === enemyTargets[0]);
      return {
        type: "ATTACK",
        pilotName: personality.name,
        targetIndex,
        dialogue: personality.combat[Math.floor(Math.random() * personality.combat.length)]
      };
    }

    // 신중한 성향일 때 이동 우선
    if (isCautious && randomAction < 0.5) {
      const newPosition = this.calculateNewPosition(participant.position, team);
      return {
        type: "MOVE",
        pilotName: personality.name,
        newPosition,
        dialogue: personality.movement[Math.floor(Math.random() * personality.movement.length)]
      };
    }

    // 일반적인 행동 결정
    if (randomAction < 0.4 && enemyTargets.length > 0) {
      const targetIndex = battleState.participants.findIndex((p: any) => p === enemyTargets[0]);
      return {
        type: "ATTACK",
        pilotName: personality.name,
        targetIndex,
        dialogue: personality.combat[Math.floor(Math.random() * personality.combat.length)]
      };
    } else if (randomAction < 0.7) {
      const newPosition = this.calculateNewPosition(participant.position, team);
      return {
        type: "MOVE",
        pilotName: personality.name,
        newPosition,
        dialogue: personality.movement[Math.floor(Math.random() * personality.movement.length)]
      };
    }

    // 기본 커뮤니케이션
    return {
      type: "COMMUNICATE",
      pilotName: personality.name,
      dialogue: isAnalytical ? "상황 분석 중..." : "대기 중입니다."
    };
  }

  private calculateNewPosition(currentPos: { x: number; y: number }, team: string): { x: number; y: number } {
    const movement = team === "team1" ? 1 : -1;
    return {
      x: Math.max(1, Math.min(14, currentPos.x + movement)),
      y: Math.max(1, Math.min(8, currentPos.y + (Math.random() > 0.5 ? 1 : -1)))
    };
  }

  private getAttackDialogue(traits: string[]): string {
    if (traits.includes("AGGRESSIVE")) {
      return ["Take this!", "No escape!", "Full power!"][Math.floor(Math.random() * 3)];
    }
    if (traits.includes("ANALYTICAL")) {
      return ["Calculated strike.", "Precision attack.", "Target confirmed."][Math.floor(Math.random() * 3)];
    }
    if (traits.includes("CAUTIOUS")) {
      return ["Careful shot.", "Taking aim...", "Steady..."][Math.floor(Math.random() * 3)];
    }
    return ["Engaging target!", "Fire!", "Attack!"][Math.floor(Math.random() * 3)];
  }
}
