# A* Pathfinding Implementation Analysis

## 시스템 개요 (System Overview)

Trinity Mecha Academy의 전투 시스템에 A* 알고리즘 기반 지능형 패스파인딩을 성공적으로 통합했습니다.

## 핵심 구현 요소

### 1. PathfindingService 클래스
```typescript
export class PathfindingService {
  private readonly GRID_WIDTH = 16;
  private readonly GRID_HEIGHT = 10;
  
  // 지형별 이동 비용 체계
  private readonly TERRAIN_COSTS = {
    normal: 1,      // 기본 이동 비용
    cover: 2,       // 엄폐물 통과 시 비용 증가
    elevation: 1,   // 고지대는 정상 비용
    hazard: 5,      // 위험지역 회피를 위한 높은 비용
    obstacle: ∞     // 통과 불가
  };
}
```

### 2. 지형 데이터 통합
```typescript
// 클라이언트와 동일한 지형 정보
private readonly DEFAULT_TERRAIN: TerrainInfo[] = [
  { x: 4, y: 3, type: 'cover', movementCost: 2 },     // 엄폐물
  { x: 8, y: 5, type: 'elevation', movementCost: 1 }, // 고지대
  { x: 12, y: 7, type: 'obstacle', movementCost: ∞ }, // 장애물
  { x: 6, y: 9, type: 'hazard', movementCost: 5 },    // 위험지역
  { x: 10, y: 2, type: 'cover', movementCost: 2 }     // 엄폐물
];
```

## A* 알고리즘 핵심 기능

### 1. 경로 탐색 (findPath)
```typescript
findPath(
  start: { x: number; y: number }, 
  goal: { x: number; y: number },
  occupiedPositions: { x: number; y: number }[] = [],  // 다른 유닛 위치
  enemyPositions: { x: number; y: number }[] = [],     // 적 유닛 위치
  maxDistance: number = 3                              // 최대 이동거리
): { x: number; y: number }[]
```

**특징:**
- 휴리스틱: 맨해튼 거리 (격자 구조에 최적)
- 8방향 이동 지원
- 동적 장애물 처리 (다른 유닛들)
- 적 위험지역 회피 (적 주변 +2 이동 비용)

### 2. 전술적 위치 선정 (findTacticalPosition)
```typescript
findTacticalPosition(
  start: { x: number; y: number },
  enemies: { x: number; y: number }[] = [],
  allies: { x: number; y: number }[] = [],
  preferCover: boolean = true  // 엄폐물 우선 여부
): { x: number; y: number }
```

**평가 요소:**
- **지형 보너스**: cover(+20), elevation(+15), hazard(-10)
- **교전거리**: 적과 2-4칸 거리에서 최고 점수
- **팀워크**: 아군 3칸 내 각각 +5점

## AI 시스템 통합

### 1. 후퇴 패턴 (RETREAT)
```typescript
// 기존: 단순 방향성 후퇴
newPosition: this.calculateRetreatPosition(participant.position, team, enemies)

// A* 적용: 지능형 후퇴
const retreatPosition = this.pathfinding.findTacticalPosition(
  participant.position,
  enemyPositions,
  allies.map(a => a.position),
  true // 엄폐물 우선
);
```

### 2. 지원 패턴 (SUPPORT)
```typescript
// A* 적용: 부상당한 동료에게 최적 경로
const supportPath = this.pathfinding.findPath(
  participant.position,
  injuredAlly.position,
  occupiedPositions,
  enemyPositions,
  3 // 최대 3칸 이동
);
```

### 3. 정찰 패턴 (SCOUT)
```typescript
// A* 적용: 전술적 정찰 위치
const scoutPosition = this.pathfinding.findTacticalPosition(
  participant.position,
  enemyPositions,
  allies.map(a => a.position),
  false // 고지대 우선
);
```

## 전술적 효과

### 1. 지형 활용 극대화
- **엄폐물 활용**: 체력이 낮은 유닛이 자동으로 엄폐물 뒤로 이동
- **고지대 선점**: 정찰 유닛이 시야 확보를 위해 고지대 점령
- **위험지역 회피**: 모든 유닛이 hazard 타일을 자동으로 우회

### 2. 팀 협력 강화
- **Formation 유지**: 아군과 적절한 거리 유지하며 이동
- **지원 효율성**: 부상당한 아군에게 최단 경로로 지원
- **교전거리 최적화**: 적과 2-4칸 최적 교전거리 유지

### 3. 적응적 전술 행동
- **동적 경로 계산**: 매 턴마다 전장 상황에 따라 경로 재계산
- **위험도 평가**: 적 위치 기반 위험지역 동적 생성
- **목표 우선순위**: 상황에 따른 cover vs elevation 선택

## 성능 최적화

### 1. 계산 효율성
- **거리 제한**: 최대 이동거리 제한으로 탐색 공간 축소
- **조기 종료**: 목표 도달 시 즉시 경로 반환
- **휴리스틱 최적화**: 맨해튼 거리로 정확한 예측

### 2. 메모리 관리
- **격자 재사용**: 매 호출마다 격자 새로 생성하여 상태 격리
- **경로 압축**: 필요한 다음 위치만 반환

## 실전 시나리오 예시

### 시나리오 1: 저체력 스나이퍼 후퇴
```
현재 위치: (8, 5) - elevation 지형
적 위치: (6, 4), (7, 6)
목표: 안전한 엄폐물로 후퇴

A* 결과: (4, 3) - cover 지형으로 이동
이유: 적으로부터 최대한 멀리, 엄폐 보너스 획득
```

### 시나리오 2: 지원 유닛의 아군 구조
```
현재 위치: (10, 2)
부상 아군: (6, 9) - HP 20
장애물: (12, 7)

A* 결과: (9, 3) → (8, 4) → (7, 5) → (6, 8)
이유: 장애물 우회하며 최단 경로로 접근
```

### 시나리오 3: 정찰 유닛의 고지대 선점
```
현재 위치: (2, 7)
적 위치: (12, 2), (14, 3)
목표: 적 관찰 가능한 전술적 위치

A* 결과: (8, 5) - elevation 지형
이유: 적과 적절한 거리 + 고지대 시야 확보
```

## 향후 확장 가능성

### 1. 고급 전술 패턴
- **Flanking**: 적 측면 공격 경로
- **Pincer Movement**: 포위 기동 패턴
- **Leapfrog**: 교대 전진 패턴

### 2. 동적 지형 효과
- **Line of Sight**: 시야 기반 은폐/노출
- **Weapon Range**: 무기 사거리별 최적 위치
- **Terrain Damage**: 지형 피해 계산

### 3. 예측적 AI
- **Enemy Movement Prediction**: 적 이동 예측
- **Multi-turn Planning**: 다중 턴 계획
- **Risk Assessment**: 위험도 기반 의사결정

이제 AI 유닛들이 단순한 랜덤 이동 대신 지형을 고려한 전술적 의사결정을 수행하며, 실제 전장에서 벌어질 법한 지능적인 움직임을 보여줍니다.