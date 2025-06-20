# Trinity Mecha Academy - Battle System Architecture Analysis

## 핵심 타입 구조 (Core Type Structure)

### 1. BattleState (shared/schema.ts:147-164)
전투 상태의 최상위 타입으로 실시간 전투 진행을 관리합니다.

```typescript
export type BattleState = {
  id: string;                    // 전투 고유 식별자
  phase: "preparation" | "active" | "completed";  // 전투 단계
  turn: number;                  // 현재 턴 수
  participants: Array<{          // 참가자 배열
    pilotId: number;
    mechId: number;
    position: { x: number; y: number };
    hp: number;
    status: "active" | "damaged" | "destroyed";
  }>;
  log: Array<{                   // 전투 로그
    timestamp: number;
    type: "movement" | "attack" | "communication" | "system";
    message: string;
    speaker?: string;
  }>;
};
```

### 2. AIDecision (server/services/AISystem.ts:4-11)
AI 의사결정을 위한 액션 타입입니다.

```typescript
interface AIDecision {
  type: "MOVE" | "ATTACK" | "COMMUNICATE" | "DEFEND" | "SUPPORT" | "SCOUT" | "RETREAT" | "SPECIAL";
  pilotName: string;
  dialogue?: string;             // AI 대화/반응
  newPosition?: { x: number; y: number };
  targetIndex?: number;          // 공격 대상 인덱스
  actionData?: any;              // 추가 액션 데이터
}
```

### 3. 파일럿/메크 관련 타입들
```typescript
// Pilot 관련 특성
export type PilotTrait = 
  | "AGGRESSIVE" | "CAUTIOUS" | "ANALYTICAL" | "COOPERATIVE" | "INDEPENDENT"
  | "ASSAULT" | "DEFENSIVE" | "SUPPORT" | "SNIPER" | "SCOUT"
  | "KNIGHT" | "RIVER" | "ARBITER"
  | "ACE" | "VETERAN" | "ROOKIE" | "GENIUS";

// 기본 Pilot 타입 (shared/schema.ts)
export type Pilot = {
  id: number;
  name: string;
  callsign: string;
  dormitory: string;            // Knight/River/Arbiter
  rating: number;
  reaction: number;
  accuracy: number;
  tactical: number;
  teamwork: number;
  traits: string[];             // PilotTrait 배열
  isActive: boolean;
  experience: number;
  wins: number;
  losses: number;
  trainingUntil: Date | null;
  trainingType: string | null;
  fatigue: number;
  morale: number;
};

// Mech 타입
export type Mech = {
  id: number;
  name: string;
  type: string;                 // Knight/River/Arbiter/Custom
  variant: string;
  hp: number;
  armor: number;
  speed: number;
  firepower: number;
  range: number;
  specialAbilities: string[];
  isAvailable: boolean;
};
```

## 데이터 플로우 분석 (Data Flow Analysis)

### 1. 전투 초기화 과정
```
NewMatchPrepScene.tsx → POST /api/battle/start → BattleEngine.initializeBattle()
```

1. **클라이언트 요청 데이터 구조:**
```typescript
{
  formation1: {
    teamId: 1,
    pilots: [
      { pilotId: 1, mechId: 16, pilot: Pilot객체, mech: Mech객체 },
      { pilotId: 2, mechId: 15, pilot: Pilot객체, mech: Mech객체 },
      { pilotId: 3, mechId: 14, pilot: Pilot객체, mech: Mech객체 }
    ]
  },
  formation2: {
    teamId: 2,
    pilots: [
      { pilotId: 100, mechId: 36, pilot: 적군파일럿, mech: Mech객체 },
      { pilotId: 101, mechId: 21, pilot: 적군파일럿, mech: Mech객체 },
      { pilotId: 102, mechId: 30, pilot: 적군파일럿, mech: Mech객체 }
    ]
  }
}
```

2. **서버측 데이터 변환:**
- BattleEngine에서 formation 데이터를 BattleState로 변환
- 실제 파일럿/메크 데이터를 storage에서 조회
- 적군은 100번대 ID 오프셋 사용 (100, 101, 102)

### 2. 실시간 전투 진행
```
BattleEngine.runBattle() → WebSocket Updates → 클라이언트 상태 업데이트
```

1. **AI 결정 생성 (3초마다):**
```typescript
// 모든 활성 참가자에 대해 병렬 AI 결정 생성
const aiDecisions = await Promise.all(
  activeParticipants.map(async (participant) => {
    const team = participant.pilotId < 100 ? 'ally' : 'enemy';
    return await this.aiSystem.makeSimpleDecision(participant, battleState, team);
  })
);
```

2. **AI 결정 실행:**
- ATTACK: 실제 메크 화력, 파일럿 정확도, 방어력 계산
- MOVE/RETREAT/SCOUT/SUPPORT: 위치 이동
- COMMUNICATE: 대화 로그 추가

### 3. WebSocket 업데이트 구조
```typescript
// 턴 업데이트
{
  type: 'TURN_UPDATE',
  turn: number,
  participants: BattleParticipant[],
  recentLogs: LogEntry[]
}

// 전투 완료
{
  type: 'BATTLE_COMPLETE',
  winner: 'team1' | 'team2',
  finalState: BattleState
}
```

## AI 시스템 상세 분석

### 1. 성격 계산 로직 (AISystem.ts:42-101)
```typescript
// 실제 파일럿 스탯 기반 성격 계산
const aggressive = pilot.traits.includes('AGGRESSIVE') ? 0.9 : 
                  pilot.traits.includes('CAUTIOUS') ? 0.3 : 
                  (pilot.reaction + pilot.accuracy) / 200;

const tactical = pilot.traits.includes('ANALYTICAL') ? 0.9 : 
                pilot.tactical / 100;

const supportive = pilot.traits.includes('COOPERATIVE') ? 0.9 : 
                  pilot.traits.includes('INDEPENDENT') ? 0.2 : 
                  pilot.teamwork / 100;
```

### 2. 기숙사별 대화 스타일
- **Knight**: "정의를 위해!", "나이트의 명예로!", "수호하겠다!"
- **River**: "흐름을 읽었다!", "기회다!", "정확히!"
- **Arbiter**: "심판을 내린다!", "균형을 맞추겠다!", "정확한 판단!"

### 3. 상황별 행동 우선순위
1. **체력 낮음 (HP < 30)**: 70% 확률로 후퇴
2. **근처 적 존재**: aggressive 수치에 따라 공격
3. **동료 위험**: supportive 수치에 따라 지원
4. **기본**: tactical 수치에 따라 정찰 또는 이동

## 데미지 계산 시스템

### 1. 기본 데미지 계산
```typescript
// 메크 화력 기반 (80-120% 변동)
let baseDamage = attackerMech.firepower * (0.8 + Math.random() * 0.4);

// 파일럿 정확도 적용 (80-120% 보정)
const accuracyMultiplier = 0.8 + (pilot.accuracy / 100) * 0.4;
baseDamage *= accuracyMultiplier;

// 타겟 방어력 적용 (1% per armor point)
const armorReduction = targetMech.armor * 0.01;
finalDamage = baseDamage * (1 - armorReduction);

// 최소 데미지 보장
finalDamage = Math.max(1, finalDamage);
```

### 2. 지형 효과 (현재 기본 구현)
- **elevation**: +20% 데미지 보너스
- **cover**: -20% 데미지 감소
- **hazard**: +5 고정 데미지

## 클라이언트 상태 관리

### 1. BattleStore (client/src/stores/battleStore.ts)
```typescript
interface BattleStoreState {
  currentBattle: BattleState | null;
  isConnected: boolean;
  battleHistory: Array<LogEntry>;  // 최대 50개 로그 유지
  
  setBattle: (battle: BattleState | null) => void;
  setConnected: (connected: boolean) => void;
  addBattleLog: (log: any) => void;
  clearBattleHistory: () => void;
}
```

### 2. WebSocket 이벤트 처리 (BattleScene.tsx)
- **BATTLE_STARTED**: 전투 시작, 상태 설정
- **BATTLE_UPDATE**: 턴 업데이트, 참가자 상태 갱신
- **BATTLE_COMPLETE**: 전투 종료, 승자 결정
- **PHASE_CHANGE**: 전투 단계 변경

## 저장소 시스템 (Storage System)

### 1. 메모리 저장소 구조
```typescript
export class MemStorage implements IStorage {
  private pilots: Map<number, Pilot>;     // 1-99: 아군, 100+: 적군
  private mechs: Map<number, Mech>;
  private teams: Map<number, Team>;
  private battles: Map<number, Battle>;
  private formations: Map<number, Formation>;
}
```

### 2. 적군 파일럿 데이터 (100, 101, 102)
- Commander Rex (Knight, AGGRESSIVE+ACE+VETERAN)
- Sniper Zara (Arbiter, ANALYTICAL+SNIPER+CAUTIOUS)  
- Blade Runner (River, AGGRESSIVE+ASSAULT+INDEPENDENT)

## 실시간 전투 렌더링

### 1. Canvas 기반 2D 시각화
- 16x10 그리드 전장
- 실시간 유닛 위치 업데이트
- 공격 이펙트 애니메이션 (laser/missile/beam)
- 지형 요소 렌더링

### 2. 공격 이펙트 시스템
```typescript
interface AttackEffect {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  startTime: number;
  type: 'laser' | 'missile' | 'beam';
}
```

## 전투 종료 조건

1. **승리 조건**: 상대편 모든 유닛 격파
2. **시간 제한**: 구현 예정 (현재는 무제한)
3. **특수 조건**: 목표 달성 등 (확장 가능)

이 분석을 통해 전체 전투 시스템이 어떻게 실제 파일럿/메크 데이터를 활용하여 데이터 기반 AI 의사결정과 전술적 전투를 구현하는지 확인할 수 있습니다.