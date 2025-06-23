export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  position: Position;
  hp?: number;
  pilotId?: number;
  mechId?: number;
}

export interface Personality {
  aggressive: number;
  tactical: number;
  supportive: number;
}

export interface TerrainFeature {
  x: number;
  y: number;
  type: "cover" | "obstacle" | "elevation" | "hazard";
  effect: string;
}

export interface MechStats {
  firepower: number;
  speed: number;
  armor: number;
}

// Clamp helper to keep positions inside battlefield bounds (1-based inclusive)
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export type TeamSide = string; // e.g. "ally" | "enemy" | "team1" | "team2"

/**
 * 지형 효과 계산
 */
export function getTerrainAt(pos: Position, terrainFeatures: TerrainFeature[]): TerrainFeature | null {
  return terrainFeatures.find(t => t.x === pos.x && t.y === pos.y) || null;
}

/**
 * 지형 기반 방어 보너스 계산
 */
export function getTerrainDefenseBonus(pos: Position, terrainFeatures: TerrainFeature[]): number {
  const terrain = getTerrainAt(pos, terrainFeatures);
  if (terrain?.type === 'cover') return 0.2; // 20% 방어 보너스
  if (terrain?.type === 'elevation') return 0.1; // 10% 방어 보너스 (고지대)
  return 0;
}

/**
 * 지형 기반 공격 보너스 계산
 */
export function getTerrainAttackBonus(pos: Position, terrainFeatures: TerrainFeature[]): number {
  const terrain = getTerrainAt(pos, terrainFeatures);
  if (terrain?.type === 'elevation') return 0.2; // 20% 공격 보너스 (고지대)
  return 0;
}

/**
 * 지형 기반 사거리 보너스 계산
 */
export function getTerrainRangeBonus(pos: Position, terrainFeatures: TerrainFeature[]): number {
  const terrain = getTerrainAt(pos, terrainFeatures);
  if (terrain?.type === 'elevation') return 1; // 사거리 +1 (고지대)
  return 0;
}

/**
 * 메카 성능 기반 사거리 계산
 */
export function calculateAttackRange(mechStats: MechStats, terrainFeatures: TerrainFeature[], pos: Position): number {
  let baseRange = 2; // 기본 사거리
  
  // 화력이 높으면 사거리 증가
  if (mechStats.firepower >= 85) baseRange = 4;
  else if (mechStats.firepower >= 70) baseRange = 3;
  
  // 지형 보너스 추가
  baseRange += getTerrainRangeBonus(pos, terrainFeatures);
  
  return baseRange;
}

/**
 * 공격 가능 여부 확인 (사거리 기반)
 */
export function canAttack(
  attacker: Entity, 
  target: Entity, 
  mechStats: MechStats, 
  terrainFeatures: TerrainFeature[]
): boolean {
  const distance = Math.abs(attacker.position.x - target.position.x) + 
                   Math.abs(attacker.position.y - target.position.y);
  const range = calculateAttackRange(mechStats, terrainFeatures, attacker.position);
  return distance <= range;
}

/**
 * 지형을 고려한 최적 포지션 찾기
 */
export function findBestTacticalPosition(
  currentPos: Position,
  team: TeamSide,
  enemies: Entity[],
  allies: Entity[],
  terrainFeatures: TerrainFeature[],
  mechStats: MechStats
): Position {
  const possiblePositions: Position[] = [];
  
  // 현재 위치 주변 3x3 범위에서 이동 가능한 위치 찾기
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue; // 현재 위치 제외
      
      const newPos = {
        x: clamp(currentPos.x + dx, 1, 15),
        y: clamp(currentPos.y + dy, 1, 11)
      };
      
      // 장애물 체크
      const terrain = getTerrainAt(newPos, terrainFeatures);
      if (terrain?.type === 'obstacle') continue;
      
      // 다른 유닛과 겹치는지 체크
      const occupied = [...enemies, ...allies].some(unit => 
        unit.position.x === newPos.x && unit.position.y === newPos.y
      );
      if (occupied) continue;
      
      possiblePositions.push(newPos);
    }
  }
  
  if (possiblePositions.length === 0) return currentPos;
  
  // 각 위치의 점수 계산
  const scoredPositions = possiblePositions.map(pos => {
    let score = 0;
    
    // 지형 보너스
    const terrain = getTerrainAt(pos, terrainFeatures);
    if (terrain?.type === 'elevation') score += 30; // 고지대 선호
    if (terrain?.type === 'cover') score += 20; // 엄폐물 선호
    if (terrain?.type === 'hazard') score -= 50; // 위험지대 회피
    
    // 적과의 거리 고려
    if (enemies.length > 0) {
      const nearestEnemyDist = Math.min(
        ...enemies.map(e => 
          Math.abs(e.position.x - pos.x) + Math.abs(e.position.y - pos.y)
        )
      );
      
      // 메카 타입에 따른 거리 선호도
      if (mechStats.firepower >= 85) {
        // 장거리 메카: 거리 유지 선호
        score += nearestEnemyDist * 5;
      } else if (mechStats.speed >= 80) {
        // 고속 메카: 적당한 거리 선호
        score += nearestEnemyDist <= 3 ? nearestEnemyDist * 3 : (6 - nearestEnemyDist) * 2;
      } else {
        // 근접 메카: 가까운 거리 선호
        score += (5 - nearestEnemyDist) * 3;
      }
    }
    
    return { position: pos, score };
  });
  
  // 가장 높은 점수의 위치 선택
  return scoredPositions.reduce((best, current) => 
    current.score > best.score ? current : best
  ).position;
}

/**
 * Retreat two tiles away from enemy front line toward own side.
 * 지형을 고려한 후퇴 로직 개선
 */
export function calculateRetreatPosition(
  pos: Position,
  team: TeamSide,
  enemies: Entity[],
  terrainFeatures?: TerrainFeature[]
): Position {
  const safeDirection = team === "ally" || team === "team1" ? -2 : 2;
  const retreatPos = {
    x: clamp(pos.x + safeDirection, 1, 15),
    y: clamp(pos.y + (Math.random() > 0.5 ? -1 : 1), 1, 11),
  };
  
  // 지형 고려: 위험지대 회피
  if (terrainFeatures) {
    const terrain = getTerrainAt(retreatPos, terrainFeatures);
    if (terrain?.type === 'hazard') {
      // 위험지대면 다른 방향으로
      return {
        x: clamp(pos.x + safeDirection, 1, 15),
        y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11),
      };
    }
  }
  
  return retreatPos;
}

/**
 * Scout two tiles deeper into enemy territory.
 * 지형을 고려한 정찰 로직 개선
 */
export function calculateScoutPosition(
  pos: Position,
  team: TeamSide,
  enemies: Entity[],
  terrainFeatures?: TerrainFeature[]
): Position {
  const scoutDirection = team === "ally" || team === "team1" ? 2 : -2;
  const scoutPos = {
    x: clamp(pos.x + scoutDirection, 1, 15),
    y: clamp(pos.y, 1, 11),
  };
  
  // 지형 고려: 고지대 선호, 위험지대 회피
  if (terrainFeatures) {
    const terrain = getTerrainAt(scoutPos, terrainFeatures);
    if (terrain?.type === 'hazard') {
      // 위험지대면 Y축으로 회피
      return {
        x: scoutPos.x,
        y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11),
      };
    }
  }
  
  return scoutPos;
}

/**
 * Choose a tactical midpoint between the attacker and nearest enemy.
 * Falls back to a small advance / retreat when no enemies remain.
 * 지형 고려 개선
 */
export function calculateTacticalPosition(
  pos: Position,
  team: TeamSide,
  enemies: Entity[],
  allies: Entity[] = [],
  terrainFeatures?: TerrainFeature[],
  mechStats?: MechStats
): Position {
  // 지형과 메카 성능을 고려한 전술적 위치 계산
  if (terrainFeatures && mechStats) {
    return findBestTacticalPosition(pos, team, enemies, allies, terrainFeatures, mechStats);
  }
  
  // 기존 로직 (호환성 유지)
  if (enemies.length === 0) {
    const direction = team === "ally" || team === "team1" ? 1 : -1;
    return {
      x: clamp(pos.x + direction, 1, 15),
      y: clamp(pos.y + (Math.random() > 0.5 ? 1 : -1), 1, 11),
    };
  }

  const nearestEnemy = enemies.reduce((prev, curr) => {
    const prevDist =
      Math.abs(prev.position.x - pos.x) + Math.abs(prev.position.y - pos.y);
    const currDist =
      Math.abs(curr.position.x - pos.x) + Math.abs(curr.position.y - pos.y);
    return currDist < prevDist ? curr : prev;
  });

  const optimalX = Math.floor((pos.x + nearestEnemy.position.x) / 2);
  const optimalY = Math.floor((pos.y + nearestEnemy.position.y) / 2);

  return {
    x: clamp(optimalX, 1, 15),
    y: clamp(optimalY, 1, 11),
  };
}

/**
 * Select the most advantageous enemy target.
 * 사거리와 지형을 고려한 타겟 선택 개선
 */
export function selectBestTarget(
  enemies: Entity[],
  attacker: Entity,
  personality?: Personality,
  mechStats?: MechStats,
  terrainFeatures?: TerrainFeature[]
): Entity {
  if (enemies.length === 0) throw new Error("No enemies provided");

  // 사거리 내 적만 필터링
  let attackableEnemies = enemies;
  if (mechStats && terrainFeatures) {
    attackableEnemies = enemies.filter(enemy => 
      canAttack(attacker, enemy, mechStats, terrainFeatures)
    );
  }
  
  // 공격 가능한 적이 없으면 전체 적에서 선택 (이동 후 공격 위해)
  const targetPool = attackableEnemies.length > 0 ? attackableEnemies : enemies;

  // Aggressive pilots favour finishing low-HP foes
  if (personality && personality.aggressive > 0.7) {
    return targetPool.reduce((prev, curr) => (curr.hp! < prev.hp! ? curr : prev));
  }

  // Tactical pilots weigh distance & HP & terrain advantage
  if (personality && personality.tactical > 0.7) {
    return targetPool.reduce((prev, curr) => {
      let prevScore = (prev.hp ?? 100) +
        (Math.abs(prev.position.x - attacker.position.x) +
          Math.abs(prev.position.y - attacker.position.y)) * 3;
      
      let currScore = (curr.hp ?? 100) +
        (Math.abs(curr.position.x - attacker.position.x) +
          Math.abs(curr.position.y - attacker.position.y)) * 3;
      
      // 지형 고려: 엄폐물에 있는 적은 우선순위 낮춤
      if (terrainFeatures) {
        const prevTerrain = getTerrainAt(prev.position, terrainFeatures);
        const currTerrain = getTerrainAt(curr.position, terrainFeatures);
        
        if (prevTerrain?.type === 'cover') prevScore += 20;
        if (currTerrain?.type === 'cover') currScore += 20;
      }
      
      return currScore < prevScore ? curr : prev;
    });
  }

  // Default: nearest target
  return targetPool.reduce((prev, curr) => {
    const prevDist =
      Math.abs(prev.position.x - attacker.position.x) +
      Math.abs(prev.position.y - attacker.position.y);
    const currDist =
      Math.abs(curr.position.x - attacker.position.x) +
      Math.abs(curr.position.y - attacker.position.y);
    return currDist < prevDist ? curr : prev;
  });
} 