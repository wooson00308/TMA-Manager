import { storage } from "../storage";
import { type Pilot } from "@shared/schema";

export class PilotService {
  // 파일럿 정보와 대사 통합 관리
  private static pilotDialogues: { [key: string]: any } = {
    "AGGRESSIVE": {
      combat: ["돌격이야!", "치이! 가버려!", "전면 공격이다!"],
      movement: ["앞으로!", "돌진한다!", "빠르게 접근!"],
      damage: ["아직이야!", "더 세게 와!", "이 정도로?"],
      victory: ["당연한 결과야!", "압도적이었지!"]
    },
    "ANALYTICAL": {
      combat: ["상황을 분석하고 있습니다.", "전술적 우위 확보.", "조율된 공격 개시."],
      movement: ["최적 위치로 이동.", "계산된 이동이다.", "대형 유지하며 전진."],
      damage: ["손상 보고. 지속 가능.", "방어막 재충전 중.", "전투 지속 가능합니다."],
      victory: ["계산대로입니다.", "분석이 정확했군요."]
    },
    "COOPERATIVE": {
      combat: ["팀과 함께!", "협력해서 가자!", "같이 밀어붙인다!"],
      movement: ["팀원들과 함께!", "대형을 맞춘다!", "협조해서 움직인다!"],
      damage: ["아직 괜찮아!", "팀에 부담 주지 않겠어!", "계속 싸울 수 있어!"],
      victory: ["팀워크의 승리!", "모두 함께 해냈어!"]
    },
    "VETERAN": {
      combat: ["경험이 말해주는군!", "이런 건 익숙해!", "베테랑의 직감이야!"],
      movement: ["오래된 경험으로!", "안전한 길로!", "이런 상황은 여러 번 봤지!"],
      damage: ["이 정도야 뭐!", "여전히 멀쩡하다!", "더 심한 것도 견뎠어!"],
      victory: ["역시 경험의 차이지!", "젊은 것들아, 더 배워라!"]
    },
    "ACE": {
      combat: ["에이스의 실력을 보여주지!", "완벽한 타이밍이다!", "이 정도는 식은 죽 먹기!"],
      movement: ["에이스답게 움직인다!", "완벽한 포지셔닝!", "최고의 기동력!"],
      damage: ["에이스가 이 정도로?", "아직 본실력도 안 보였는데!", "진짜 실력은 지금부터!"],
      victory: ["역시 에이스답지!", "완벽한 승리였어!", "이게 실력 차이야!"]
    }
  };

  // 적군 대사
  private static enemyDialogues = {
    combat: ["타겟 공격!", "전면 공격이다!", "격파한다!"],
    movement: ["포지션 이동!", "재배치!", "우회한다!"],
    damage: ["데미지 확인!", "시스템 체크!", "아직 괜찮다!"],
    victory: ["임무 완료!", "목표 달성!", "성공이다!"]
  };

  static async getPilotInfo(pilotId: number) {
    // 실제 DB에서 파일럿 정보 조회
    const pilot = await storage.getPilot(pilotId);
    
    if (pilot) {
      return {
        id: pilot.id,
        name: pilot.name,
        callsign: pilot.callsign,
        dormitory: pilot.dormitory,
        traits: pilot.traits,
        isEnemy: false
      };
    }
    
    // 적군 정보 (ID 100 이상)
    if (pilotId >= 100) {
      const enemyData: { [key: number]: { name: string; callsign: string } } = {
        101: { name: "레이븐 스카이", callsign: "RAVEN-01" },
        102: { name: "아이언 울프", callsign: "WOLF-02" },
        103: { name: "블레이즈 피닉스", callsign: "BLAZE-03" },
        104: { name: "스톰 라이더", callsign: "STORM-04" },
        105: { name: "섀도우 헌터", callsign: "SHADOW-05" },
        106: { name: "피닉스 윙", callsign: "PHOENIX-06" },
      };
      
      const enemy = enemyData[pilotId];
      if (enemy) {
        return {
          id: pilotId,
          name: enemy.name,
          callsign: enemy.callsign,
          dormitory: "UNKNOWN",
          traits: ["BALANCED"],
          isEnemy: true
        };
      }
      
      // 기본 적군 정보
      return {
        id: pilotId,
        name: `Enemy ${String.fromCharCode(65 + (pilotId - 101))}`, // Enemy A, B, C
        callsign: `TARGET-${pilotId}`,
        dormitory: "UNKNOWN",
        traits: ["BALANCED"],
        isEnemy: true
      };
    }
    
    return null;
  }

  static getDialogue(traits: string[], situation: string, isEnemy: boolean = false): string {
    if (isEnemy) {
      const dialogues = this.enemyDialogues[situation as keyof typeof this.enemyDialogues] || ["..."];
      return dialogues[Math.floor(Math.random() * dialogues.length)];
    }

    // 특성별 대사 수집
    let availableDialogues: string[] = [];
    
    traits.forEach(trait => {
      const traitDialogues = this.pilotDialogues[trait];
      if (traitDialogues && traitDialogues[situation]) {
        availableDialogues.push(...traitDialogues[situation]);
      }
    });

    // 특성별 대사가 없으면 기본 대사
    if (availableDialogues.length === 0) {
      const defaultDialogues = {
        combat: ["공격 개시!", "전투 준비!", "타겟 확인!"],
        movement: ["이동 중!", "포지션 변경!", "재배치!"],
        damage: ["데미지 확인!", "시스템 체크!", "전투 지속!"],
        victory: ["승리했다!", "임무 완료!", "성공이야!"]
      };
      availableDialogues = defaultDialogues[situation as keyof typeof defaultDialogues] || ["..."];
    }

    return availableDialogues[Math.floor(Math.random() * availableDialogues.length)];
  }

  static async generateAIDecision(participant: any, battleState: any, team: string) {
    const pilotInfo = await this.getPilotInfo(participant.pilotId);
    if (!pilotInfo) return null;

    const randomAction = Math.random();
    const isLowHP = participant.hp < 50;
    const isEarlyBattle = battleState.turn < 3;
    const enemyTargets = team === "team1" 
      ? battleState.participants.filter((p: any) => p.team === 'team2' && p.status === 'active')
      : battleState.participants.filter((p: any) => p.team === 'team1' && p.status === 'active');

    // 초반 전투 시 커뮤니케이션
    if (isEarlyBattle && randomAction < 0.4) {
      return {
        type: "COMMUNICATE",
        pilotName: pilotInfo.name,
        dialogue: this.getDialogue(pilotInfo.traits, "combat", pilotInfo.isEnemy)
      };
    }

    // 체력 낮을 때 반응
    if (isLowHP && randomAction < 0.3) {
      return {
        type: "COMMUNICATE", 
        pilotName: pilotInfo.name,
        dialogue: this.getDialogue(pilotInfo.traits, "damage", pilotInfo.isEnemy)
      };
    }

    // 일반적인 행동
    if (randomAction < 0.4 && enemyTargets.length > 0) {
      const targetIndex = battleState.participants.findIndex((p: any) => p === enemyTargets[0]);
      return {
        type: "ATTACK",
        pilotName: pilotInfo.name,
        targetIndex,
        dialogue: this.getDialogue(pilotInfo.traits, "combat", pilotInfo.isEnemy)
      };
    } else if (randomAction < 0.7) {
      const newPosition = this.calculateNewPosition(participant.position, team);
      return {
        type: "MOVE",
        pilotName: pilotInfo.name,
        newPosition,
        dialogue: this.getDialogue(pilotInfo.traits, "movement", pilotInfo.isEnemy)
      };
    }

    return {
      type: "COMMUNICATE",
      pilotName: pilotInfo.name,
      dialogue: "대기 중..."
    };
  }

  private static calculateNewPosition(currentPos: { x: number; y: number }, team: string): { x: number; y: number } {
    const movement = team === "team1" ? 1 : -1;
    return {
      x: Math.max(1, Math.min(18, currentPos.x + movement)),
      y: Math.max(1, Math.min(10, currentPos.y + (Math.random() > 0.5 ? 1 : -1)))
    };
  }
}