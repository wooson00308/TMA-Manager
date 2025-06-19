import { type BattleState } from "@shared/schema";
import { storage } from "../storage";

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

  async makeDecision(participant: any, battleState: BattleState, team: string): Promise<AIDecision> {
    // 실제 파일럿 데이터 가져오기
    const pilot = await storage.getPilot(participant.pilotId);
    
    let personality;
    if (pilot) {
      // 실제 파일럿 정보 사용
      personality = {
        name: pilot.name,
        callsign: pilot.callsign,
        dormitory: pilot.dormitory,
        traits: pilot.traits,
        combat: this.getDialogueByTraits(pilot.traits, "combat"),
        movement: this.getDialogueByTraits(pilot.traits, "movement"),
        damage: this.getDialogueByTraits(pilot.traits, "damage"),
        victory: this.getDialogueByTraits(pilot.traits, "victory")
      };
    } else {
      // 하드코딩된 AI 적군 정보 사용
      personality = this.pilotPersonalities[participant.pilotId as keyof typeof this.pilotPersonalities] || {
        name: `Enemy-${participant.pilotId}`,
        callsign: `TARGET-${participant.pilotId}`,
        dormitory: "UNKNOWN", 
        traits: ["BALANCED"],
        combat: ["타겟 공격 중!"],
        movement: ["포지션 이동!"],
        damage: ["데미지 확인!"],
        victory: ["임무 완료!"]
      };
    }
    
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

  // 특성에 따른 대사 생성
  private getDialogueByTraits(traits: string[], situation: string): string[] {
    const dialogues: { [key: string]: { [key: string]: string[] } } = {
      combat: {
        AGGRESSIVE: ["치이! 가버려!", "내가 먼저다!", "돌격이야!", "전면 공격이다!"],
        CAUTIOUS: ["신중하게 접근한다.", "안전을 확보하고...", "상황을 파악 중."],
        ANALYTICAL: ["상황을 분석하고 있습니다.", "전술적 우위 확보.", "조율된 공격 개시."],
        COOPERATIVE: ["팀과 함께!", "협력해서 가자!", "같이 밀어붙인다!"],
        KNIGHT: ["나이트의 힘을 보여준다!", "방어에서 공격으로!", "균형잡힌 전투다!"],
        RIVER: ["리버 스타일로 간다!", "빠르게 치고 빠진다!", "물처럼 유연하게!"],
        ARBITER: ["정밀 조준 완료.", "한 발로 끝낸다.", "아비터의 정밀성이다."],
        ACE: ["에이스의 실력을 보여주지!", "이 정도는 식은 죽 먹기!", "완벽한 타이밍이다!"],
        VETERAN: ["경험이 말해주는군!", "이런 건 익숙해!", "베테랑의 직감이야!"],
        ROOKIE: ["아직 배우는 중이지만!", "열심히 해보겠어!", "신입이라고 만만히 보지 마!"]
      },
      movement: {
        AGGRESSIVE: ["앞으로!", "후퇴는 없어!", "돌진한다!"],
        CAUTIOUS: ["유리한 고지로 이동.", "안전한 루트로.", "신중하게 포지셔닝."],
        ANALYTICAL: ["최적 위치로 이동.", "대형 유지하며 전진.", "계산된 이동이다."],
        COOPERATIVE: ["팀원들과 함께!", "대형을 맞춘다!", "협조해서 움직인다!"],
        KNIGHT: ["균형잡힌 전진!", "방어진을 유지하며!", "나이트답게 움직인다!"],
        RIVER: ["빠르게 접근!", "측면 우회한다!", "흘러가듯 이동!"],
        ARBITER: ["저격 위치 선점.", "거리 확보.", "최적 사격 지점으로."],
        SCOUT: ["정찰 완료!", "새로운 루트 발견!", "앞서서 길을 연다!"]
      },
      damage: {
        AGGRESSIVE: ["아직이야!", "더 세게 와!", "이 정도로?"],
        CAUTIOUS: ["데미지 리포트. 경미함.", "시스템 정상.", "아직 문제없음."],
        ANALYTICAL: ["손상 보고. 지속 가능.", "방어막 재충전 중.", "전투 지속 가능합니다."],
        COOPERATIVE: ["아직 괜찮아!", "팀에 부담 주지 않겠어!", "계속 싸울 수 있어!"],
        KNIGHT: ["나이트의 방어력!", "이 정도론 안 쓰러져!", "방어막이 버텨준다!"],
        RIVER: ["아직 괜찮아!", "리버는 질기거든!", "더 심한 것도 견뎠어!"],
        ARBITER: ["시스템 체크 완료.", "정밀도에는 문제없음.", "아직 조준이 가능해."],
        VETERAN: ["이 정도야 뭐!", "여전히 멀쩡하다!", "더 심한 것도 견뎠어!"]
      },
      victory: {
        AGGRESSIVE: ["힘이 곧 정의다!", "압도적이었지!", "당연한 결과야!"],
        CAUTIOUS: ["예상 범위 내입니다.", "신중함이 승리했네요.", "계획대로였어요."],
        ANALYTICAL: ["계산대로입니다.", "분석이 정확했군요.", "논리적 결론이죠."],
        COOPERATIVE: ["팀워크의 승리!", "모두 함께 해냈어!", "협력의 힘이야!"],
        KNIGHT: ["나이트의 전술이 통했네요.", "균형잡힌 싸움이었어.", "기사도의 승리!"],
        RIVER: ["어떻게? 내가 이겼다고?", "역시 리버 스타일이지!", "유연함이 이겼다!"],
        ARBITER: ["정밀성의 승리죠.", "아비터다운 결과네요.", "한 치의 오차도 없었어."],
        ACE: ["역시 에이스답지!", "완벽한 승리였어!", "이게 실력 차이야!"]
      }
    };

    const situationDialogues = dialogues[situation] || {};
    let result: string[] = [];

    // 특성에 해당하는 대사들을 수집
    traits.forEach(trait => {
      if (situationDialogues[trait]) {
        result.push(...situationDialogues[trait]);
      }
    });

    // 특성별 대사가 없으면 기본 대사 사용
    if (result.length === 0) {
      const defaultDialogues = {
        combat: ["공격 개시!", "전투 준비!", "타겟 확인!"],
        movement: ["이동 중!", "포지션 변경!", "재배치!"],
        damage: ["데미지 확인!", "시스템 체크!", "전투 지속!"],
        victory: ["승리했다!", "임무 완료!", "성공이야!"]
      };
      result = defaultDialogues[situation as keyof typeof defaultDialogues] || ["..."];
    }

    return result;
  }

  private getAttackDialogue(traits: string[]): string {
    const dialogues = this.getDialogueByTraits(traits, "combat");
    return dialogues[Math.floor(Math.random() * dialogues.length)];
  }
}
