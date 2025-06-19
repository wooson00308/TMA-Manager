import { BattleState } from '../../shared/schema';

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
}

export class AISystem {
  private pilotPersonalities = {
    "default": {
      name: "AI Pilot",
      dialogues: [
        "전투 준비 완료!",
        "명령을 기다리고 있습니다.",
        "시스템 정상 작동 중."
      ],
      traits: ["BALANCED"]
    },
    "Sasha Volkov": {
      name: "Sasha Volkov",
      dialogues: [
        "돌격한다! 길을 비켜!",
        "이런 식으로는 안 돼! 더 빠르게!",
        "적을 발견했다! 공격 개시!"
      ],
      traits: ["AGGRESSIVE", "RIVER"]
    },
    "Marcus Chen": {
      name: "Marcus Chen",
      dialogues: [
        "상황을 분석 중입니다.",
        "신중하게 접근하겠습니다.",
        "모든 데이터를 확인했습니다."
      ],
      traits: ["ANALYTICAL", "ARBITER"]
    },
    "Elena Rossi": {
      name: "Elena Rossi",
      dialogues: [
        "팀을 지원하겠습니다.",
        "포지션을 유지합니다.",
        "모두 준비됐나요?"
      ],
      traits: ["COOPERATIVE", "KNIGHT"]
    }
  };

  makeDecision(participant: any, battleState: BattleState, team: string): AIDecision {
    const pilotName = participant.pilotName || participant.name || "AI Pilot";
    const personality = this.pilotPersonalities[pilotName] || this.pilotPersonalities["default"];
    const randomAction = Math.random();

    // Communication decisions
    if (battleState.turn < 5 && randomAction < 0.3) {
      return {
        type: "COMMUNICATE",
        pilotName: pilotName,
        dialogue: personality.dialogues[Math.floor(Math.random() * personality.dialogues.length)]
      };
    }

    // Movement decisions
    if (randomAction < 0.4) {
      return {
        type: "MOVE",
        pilotName: pilotName,
        newPosition: this.calculateNewPosition(participant.position, team),
        dialogue: this.getMovementDialogue(personality.traits)
      };
    }

    // Attack decisions
    const enemies = battleState.participants.filter(p => 
      (team === "team1" && battleState.participants.indexOf(p) >= 3) ||
      (team === "team2" && battleState.participants.indexOf(p) < 3)
    );

    if (enemies.length > 0) {
      const targetIndex = Math.floor(Math.random() * enemies.length);
      return {
        type: "ATTACK",
        pilotName: pilotName,
        targetIndex: battleState.participants.indexOf(enemies[targetIndex]),
        dialogue: this.getAttackDialogue(personality.traits)
      };
    }

    // Default to communication
    return {
      type: "COMMUNICATE",
      pilotName: pilotName,
      dialogue: "상황을 파악 중입니다."
    };
  }

  private calculateNewPosition(currentPos: { x: number; y: number }, team: string): { x: number; y: number } {
    const deltaX = (Math.random() - 0.5) * 2;
    const deltaY = team === "team1" ? Math.random() : -Math.random();
    
    return {
      x: Math.max(0, Math.min(10, currentPos.x + deltaX)),
      y: Math.max(0, Math.min(10, currentPos.y + deltaY))
    };
  }

  private getAttackDialogue(traits: string[]): string {
    if (traits.includes("AGGRESSIVE")) {
      const messages = ["공격 개시!", "적을 제거한다!", "화력 집중!"];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    if (traits.includes("ANALYTICAL")) {
      const messages = ["타겟 분석 완료.", "최적 공격 지점 확인.", "계산된 공격."];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    return "공격합니다.";
  }

  private getMovementDialogue(traits: string[]): string {
    if (traits.includes("AGGRESSIVE")) {
      const messages = ["돌진한다!", "길을 뚫겠다!", "앞으로!"];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    if (traits.includes("ANALYTICAL")) {
      const messages = ["포지션 재조정.", "전술적 이동.", "최적 위치로."];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    return "이동 중입니다.";
  }
}