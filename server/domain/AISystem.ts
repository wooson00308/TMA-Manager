import { type BattleState } from "@shared/schema";
import { PilotService } from "../services/PilotService";
import { calculateRetreatPosition as sharedCalculateRetreatPosition, calculateScoutPosition as sharedCalculateScoutPosition, calculateTacticalPosition as sharedCalculateTacticalPosition, selectBestTarget as sharedSelectBestTarget } from "@shared/ai/utils";
import { makeAIDecision } from "@shared/ai/decision";
import type { IStorage } from "../storage";

interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE" | "DEFEND" | "SUPPORT" | "SCOUT" | "RETREAT" | "SPECIAL";
  pilotName: string;
  dialogue?: string;
  newPosition?: { x: number; y: number };
  targetIndex?: number;
  actionData?: any;
}

// 하드코딩된 지형 데이터 (추후 동적 로딩)
const DEFAULT_TERRAIN_FEATURES = [
  { x: 4, y: 3, type: "cover" as const, effect: "방어력 +20%" },
  { x: 8, y: 5, type: "elevation" as const, effect: "사거리 +1" },
  { x: 12, y: 7, type: "obstacle" as const, effect: "이동 제한" },
  { x: 6, y: 9, type: "hazard" as const, effect: "턴당 HP -5" },
  { x: 10, y: 2, type: "cover" as const, effect: "방어력 +20%" },
];

// The core AI decision-making logic resides in the domain layer so that it is
// completely framework-agnostic and free of side-effects.  External concerns
// such as persistence or transport are delegated to the application layer.
export class AISystem {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  makeSimpleDecision(participant: any, battleState: BattleState, team: string): AIDecision {
    // Delegate to the shared deterministic AI engine. We inject a lightweight
    // helper that maps pilotId → initial required by the personality presets.

    const sharedDecision = makeAIDecision(participant, battleState, team, {
      getPilotInitial: (id: number) => {
        if (id === 1) return "S";
        if (id === 2) return "M";
        if (id === 3) return "A";
        return id >= 100 ? "E" : "A";
      },
      // 지형 정보 추가
      terrainFeatures: DEFAULT_TERRAIN_FEATURES,
      // 메카 스탯 조회 함수 - 실제 participant에서 가져오기
      getMechStats: (mechId: number) => {
        // participant에 이미 메카 스탯이 포함되어 있으므로 그것을 사용
        return {
          firepower: participant.firepower || 75,
          speed: participant.speed || 70,
          armor: participant.armor || 70
        };
      },
    });

    // Map shared decision -> server domain decision structure
    const pilotNames: { [key: number]: string } = {
      1: "사샤 볼코프",
      2: "헬레나 파아라", 
      3: "아즈마",
      4: "하나",
      5: "파우스트",
      6: "멘테",
      101: "레이븐 스카이",
      102: "아이언 울프",
      103: "블레이즈 피닉스",
      104: "스톰 라이더",
      105: "섀도우 헌터",
      106: "피닉스 윙",
    };

    const pilotName = pilotNames[participant.pilotId] || `Unit-${participant.pilotId}`;

    return {
      type: sharedDecision.type,
      pilotName,
      dialogue: sharedDecision.message,
      newPosition: sharedDecision.newPosition,
      targetIndex: sharedDecision.targetId !== undefined
        ? battleState.participants.findIndex((p: any) => p.pilotId === sharedDecision.targetId)
        : undefined,
      actionData: sharedDecision.ability ? { abilityName: sharedDecision.ability } : undefined,
    } as AIDecision;
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